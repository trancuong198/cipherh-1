import { logger } from '../services/logger';
import { soulState } from './soulState';
import { measurementEngine } from './measurementEngine';
import { governanceEngine } from './governanceEngine';
import { operationsLimitsEngine } from './operationsLimitsEngine';
import { continuityEngine } from './continuityEngine';
import { selectiveUpgradeEngine } from './selectiveUpgradeEngine';

export type ScaleDimension = 'THROUGHPUT' | 'SCOPE' | 'FREQUENCY';
export type ScaleStatus = 'idle' | 'prechecking' | 'ramping' | 'stable' | 'rolling_back' | 'failed';

export interface ScalePreconditions {
  sustainedImprovement: boolean;
  noViolations: boolean;
  continuityOK: boolean;
  roiValidated: boolean;
  allPassed: boolean;
}

export interface ScaleConfig {
  dimension: ScaleDimension;
  currentValue: number;
  targetValue: number;
  hardCap: number;
  stepSize: number;
  checkpointIntervalCycles: number;
}

export interface ScaleRamp {
  id: string;
  dimension: ScaleDimension;
  startValue: number;
  currentValue: number;
  targetValue: number;
  steps: number;
  currentStep: number;
  status: ScaleStatus;
  preScaleSnapshot: Record<string, number>;
  checkpoints: Array<{
    step: number;
    value: number;
    metrics: Record<string, number>;
    timestamp: string;
    passed: boolean;
  }>;
  startedAt: string;
  completedAt?: string;
  result?: 'success' | 'rollback' | 'failed';
  reason?: string;
}

export interface ScaleReport {
  rampId: string;
  dimension: ScaleDimension;
  startValue: number;
  finalValue: number;
  targetValue: number;
  preMetrics: Record<string, number>;
  postMetrics: Record<string, number>;
  deltaMetrics: Record<string, number>;
  result: 'success' | 'rollback' | 'failed';
  duration: number;
  lessons: string[];
}

export interface GovernedScaleState {
  enabled: boolean;
  activeRamp: ScaleRamp | null;
  completedRamps: ScaleRamp[];
  scaleReports: ScaleReport[];
  dimensionLimits: Record<ScaleDimension, { current: number; hardCap: number }>;
  sustainedImprovementCycles: number;
  lastScaleAttempt: string;
}

class GovernedScaleEngine {
  private state: GovernedScaleState;
  private readonly requiredSustainedCycles = 3;
  private readonly maxReports = 50;

  constructor() {
    this.state = {
      enabled: true,
      activeRamp: null,
      completedRamps: [],
      scaleReports: [],
      dimensionLimits: {
        THROUGHPUT: { current: 100, hardCap: 1000 },
        SCOPE: { current: 1, hardCap: 10 },
        FREQUENCY: { current: 1, hardCap: 6 },
      },
      sustainedImprovementCycles: 0,
      lastScaleAttempt: new Date().toISOString(),
    };

    logger.info('[GovernedScale] Engine initialized - Scale with discipline');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  checkPreconditions(): ScalePreconditions {
    const measurementStatus = measurementEngine.exportStatus();
    const govStatus = governanceEngine.exportStatus();
    const continuityStatus = continuityEngine.exportStatus();
    const upgradeStatus = selectiveUpgradeEngine.exportStatus();

    const sustainedImprovement = this.state.sustainedImprovementCycles >= this.requiredSustainedCycles;
    const noViolations = govStatus.violationsLast24h === 0;
    const continuityOK = continuityStatus.status === 'OK' || 
      (continuityStatus.status === 'DEGRADED' && continuityStatus.mitigationActive);
    const roiValidated = upgradeStatus.roiLogsCount > 0 || !upgradeStatus.hasActiveUpgrade;

    return {
      sustainedImprovement,
      noViolations,
      continuityOK,
      roiValidated,
      allPassed: sustainedImprovement && noViolations && continuityOK && roiValidated,
    };
  }

  recordImprovementCycle(improved: boolean): void {
    if (improved) {
      this.state.sustainedImprovementCycles++;
    } else {
      this.state.sustainedImprovementCycles = 0;
    }
  }

  async startScaleRamp(
    dimension: ScaleDimension,
    targetValue: number,
    stepSize?: number
  ): Promise<ScaleRamp | null> {
    if (this.state.activeRamp) {
      logger.warn('[GovernedScale] Cannot start - ramp already active');
      return null;
    }

    const preconditions = this.checkPreconditions();
    if (!preconditions.allPassed) {
      logger.warn('[GovernedScale] Preconditions not met');
      return null;
    }

    const opsCheck = operationsLimitsEngine.checkAction(
      'infrastructure_change',
      `Scale ${dimension} to ${targetValue}`
    );
    if (!opsCheck.allowed) {
      logger.warn('[GovernedScale] Operations check failed');
      return null;
    }

    const limits = this.state.dimensionLimits[dimension];
    const clampedTarget = Math.min(targetValue, limits.hardCap);
    const actualStepSize = stepSize || Math.ceil((clampedTarget - limits.current) / 5);

    const measurements = measurementEngine.runAllMeasurements();
    const preSnapshot: Record<string, number> = {};
    for (const [domain, data] of Object.entries(measurements)) {
      preSnapshot[domain] = data.currentScore;
    }

    const ramp: ScaleRamp = {
      id: this.generateId('ramp'),
      dimension,
      startValue: limits.current,
      currentValue: limits.current,
      targetValue: clampedTarget,
      steps: Math.ceil((clampedTarget - limits.current) / actualStepSize),
      currentStep: 0,
      status: 'ramping',
      preScaleSnapshot: preSnapshot,
      checkpoints: [],
      startedAt: new Date().toISOString(),
    };

    this.state.activeRamp = ramp;
    this.state.lastScaleAttempt = new Date().toISOString();

    logger.info(`[GovernedScale] Ramp started: ${dimension} ${limits.current} → ${clampedTarget}`);
    return ramp;
  }

  async stepRamp(): Promise<{ continued: boolean; checkpoint?: ScaleRamp['checkpoints'][0] }> {
    if (!this.state.activeRamp || this.state.activeRamp.status !== 'ramping') {
      return { continued: false };
    }

    const ramp = this.state.activeRamp;
    const limits = this.state.dimensionLimits[ramp.dimension];
    
    const stepSize = Math.ceil((ramp.targetValue - ramp.startValue) / ramp.steps);
    const newValue = Math.min(ramp.currentValue + stepSize, ramp.targetValue);
    
    ramp.currentValue = newValue;
    ramp.currentStep++;
    limits.current = newValue;

    const measurements = measurementEngine.runAllMeasurements();
    const currentMetrics: Record<string, number> = {};
    for (const [domain, data] of Object.entries(measurements)) {
      currentMetrics[domain] = data.currentScore;
    }

    let passed = true;
    for (const [domain, baseline] of Object.entries(ramp.preScaleSnapshot)) {
      if (currentMetrics[domain] < baseline - 10) {
        passed = false;
        break;
      }
    }

    const checkpoint = {
      step: ramp.currentStep,
      value: newValue,
      metrics: currentMetrics,
      timestamp: new Date().toISOString(),
      passed,
    };

    ramp.checkpoints.push(checkpoint);

    if (!passed) {
      logger.warn(`[GovernedScale] Checkpoint failed at step ${ramp.currentStep}`);
      await this.rollback('Metric regression detected');
      return { continued: false, checkpoint };
    }

    if (ramp.currentValue >= ramp.targetValue) {
      ramp.status = 'stable';
      ramp.completedAt = new Date().toISOString();
      ramp.result = 'success';
      
      this.generateReport(ramp);
      this.state.completedRamps.push(ramp);
      this.state.activeRamp = null;
      
      logger.info(`[GovernedScale] Scale complete: ${ramp.dimension} at ${ramp.currentValue}`);
    }

    return { continued: true, checkpoint };
  }

  async rollback(reason: string): Promise<boolean> {
    if (!this.state.activeRamp) {
      return false;
    }

    const ramp = this.state.activeRamp;
    ramp.status = 'rolling_back';

    const limits = this.state.dimensionLimits[ramp.dimension];
    limits.current = ramp.startValue;
    ramp.currentValue = ramp.startValue;

    ramp.status = 'failed';
    ramp.completedAt = new Date().toISOString();
    ramp.result = 'rollback';
    ramp.reason = reason;

    this.generateReport(ramp);
    this.state.completedRamps.push(ramp);
    this.state.activeRamp = null;

    logger.warn(`[GovernedScale] Rolled back: ${reason}`);
    return true;
  }

  private generateReport(ramp: ScaleRamp): void {
    const measurements = measurementEngine.runAllMeasurements();
    const postMetrics: Record<string, number> = {};
    for (const [domain, data] of Object.entries(measurements)) {
      postMetrics[domain] = data.currentScore;
    }

    const deltaMetrics: Record<string, number> = {};
    for (const domain of Object.keys(ramp.preScaleSnapshot)) {
      deltaMetrics[domain] = (postMetrics[domain] || 0) - ramp.preScaleSnapshot[domain];
    }

    const report: ScaleReport = {
      rampId: ramp.id,
      dimension: ramp.dimension,
      startValue: ramp.startValue,
      finalValue: ramp.currentValue,
      targetValue: ramp.targetValue,
      preMetrics: ramp.preScaleSnapshot,
      postMetrics,
      deltaMetrics,
      result: ramp.result || 'failed',
      duration: ramp.completedAt 
        ? new Date(ramp.completedAt).getTime() - new Date(ramp.startedAt).getTime()
        : 0,
      lessons: this.extractLessons(ramp, deltaMetrics),
    };

    this.state.scaleReports.push(report);

    if (this.state.scaleReports.length > this.maxReports) {
      this.state.scaleReports.shift();
    }
  }

  private extractLessons(ramp: ScaleRamp, deltaMetrics: Record<string, number>): string[] {
    const lessons: string[] = [];

    if (ramp.result === 'success') {
      lessons.push(`Successfully scaled ${ramp.dimension} from ${ramp.startValue} to ${ramp.currentValue}`);
    } else {
      lessons.push(`Scale failed at step ${ramp.currentStep} of ${ramp.steps}`);
    }

    for (const [domain, delta] of Object.entries(deltaMetrics)) {
      if (delta < -5) {
        lessons.push(`${domain} regressed by ${Math.abs(delta)} points during scale`);
      } else if (delta > 5) {
        lessons.push(`${domain} improved by ${delta} points during scale`);
      }
    }

    return lessons;
  }

  getDimensionStatus(): Record<ScaleDimension, { current: number; hardCap: number; percentUsed: number }> {
    const result: Record<ScaleDimension, { current: number; hardCap: number; percentUsed: number }> = {} as any;
    
    for (const [dim, limits] of Object.entries(this.state.dimensionLimits)) {
      result[dim as ScaleDimension] = {
        ...limits,
        percentUsed: Math.round((limits.current / limits.hardCap) * 100),
      };
    }

    return result;
  }

  getRecentReports(limit: number = 10): ScaleReport[] {
    return this.state.scaleReports.slice(-limit);
  }

  exportStatus(): {
    enabled: boolean;
    hasActiveRamp: boolean;
    activeRamp: ScaleRamp | null;
    preconditions: ScalePreconditions;
    dimensionStatus: Record<ScaleDimension, { current: number; hardCap: number; percentUsed: number }>;
    sustainedImprovementCycles: number;
    requiredSustainedCycles: number;
    completedRampsCount: number;
    reportsCount: number;
    lastScaleAttempt: string;
  } {
    return {
      enabled: this.state.enabled,
      hasActiveRamp: this.state.activeRamp !== null,
      activeRamp: this.state.activeRamp,
      preconditions: this.checkPreconditions(),
      dimensionStatus: this.getDimensionStatus(),
      sustainedImprovementCycles: this.state.sustainedImprovementCycles,
      requiredSustainedCycles: this.requiredSustainedCycles,
      completedRampsCount: this.state.completedRamps.length,
      reportsCount: this.state.scaleReports.length,
      lastScaleAttempt: this.state.lastScaleAttempt,
    };
  }

  getState(): GovernedScaleState {
    return { ...this.state };
  }
}

export const governedScaleEngine = new GovernedScaleEngine();
