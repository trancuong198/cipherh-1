import { logger } from '../services/logger';
import { soulState } from './soulState';
import { measurementEngine } from './measurementEngine';
import { governanceEngine } from './governanceEngine';
import { operationsLimitsEngine } from './operationsLimitsEngine';

export type UpgradeAxis = 'COMPUTE' | 'PROVIDER' | 'DATA';
export type UpgradeStatus = 'proposed' | 'approved' | 'in_progress' | 'dry_run' | 'live' | 'completed' | 'rolled_back' | 'rejected';

export interface UpgradePlan {
  id: string;
  axis: UpgradeAxis;
  name: string;
  hypothesis: string;
  scope: string[];
  successMetrics: Array<{
    metric: string;
    baselineValue: number;
    targetValue: number;
    currentValue?: number;
  }>;
  rollbackPlan: string[];
  featureFlag: string;
  status: UpgradeStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  roiCalculated?: number;
  roiThreshold: number;
  lessons: string[];
}

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  upgradeId: string;
  createdAt: string;
  toggledAt?: string;
}

export interface ROILog {
  upgradeId: string;
  upgradeName: string;
  axis: UpgradeAxis;
  timestamp: string;
  beforeMetrics: Record<string, number>;
  afterMetrics: Record<string, number>;
  deltaMetrics: Record<string, number>;
  roiScore: number;
  passed: boolean;
  decision: 'keep' | 'rollback';
  notes: string;
}

export interface SelectiveUpgradeState {
  activeUpgrade: UpgradePlan | null;
  completedUpgrades: UpgradePlan[];
  featureFlags: FeatureFlag[];
  roiLogs: ROILog[];
  axisUsageCount: Record<UpgradeAxis, number>;
  roiThreshold: number;
  lastUpgrade: string;
}

class SelectiveUpgradeEngine {
  private state: SelectiveUpgradeState;
  private readonly maxCompletedUpgrades = 50;
  private readonly maxROILogs = 100;

  constructor() {
    this.state = {
      activeUpgrade: null,
      completedUpgrades: [],
      featureFlags: [],
      roiLogs: [],
      axisUsageCount: { COMPUTE: 0, PROVIDER: 0, DATA: 0 },
      roiThreshold: 10,
      lastUpgrade: new Date().toISOString(),
    };

    logger.info('[SelectiveUpgrade] Engine initialized - One axis at a time');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  canStartUpgrade(): { allowed: boolean; reason: string } {
    if (this.state.activeUpgrade) {
      return {
        allowed: false,
        reason: `Active upgrade in progress: ${this.state.activeUpgrade.name}`,
      };
    }
    return { allowed: true, reason: 'No active upgrade' };
  }

  proposeUpgrade(
    axis: UpgradeAxis,
    name: string,
    hypothesis: string,
    scope: string[],
    successMetrics: Array<{ metric: string; targetDelta: number }>
  ): UpgradePlan | null {
    const canStart = this.canStartUpgrade();
    if (!canStart.allowed) {
      logger.warn(`[SelectiveUpgrade] Cannot propose: ${canStart.reason}`);
      return null;
    }

    const currentMeasurements = measurementEngine.runAllMeasurements();
    
    const plan: UpgradePlan = {
      id: this.generateId('upgrade'),
      axis,
      name,
      hypothesis,
      scope,
      successMetrics: successMetrics.map(sm => ({
        metric: sm.metric,
        baselineValue: currentMeasurements[sm.metric]?.currentScore || 50,
        targetValue: (currentMeasurements[sm.metric]?.currentScore || 50) + sm.targetDelta,
      })),
      rollbackPlan: this.generateRollbackPlan(axis, scope),
      featureFlag: `flag_${axis.toLowerCase()}_${Date.now()}`,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      roiThreshold: this.state.roiThreshold,
      lessons: [],
    };

    this.state.activeUpgrade = plan;
    
    this.createFeatureFlag(plan.featureFlag, plan.id);

    logger.info(`[SelectiveUpgrade] Upgrade proposed: ${name} on ${axis} axis`);
    return plan;
  }

  private generateRollbackPlan(axis: UpgradeAxis, scope: string[]): string[] {
    const baseRollback = [
      'Disable feature flag immediately',
      'Revert configuration changes',
      'Restore previous baseline metrics',
    ];

    switch (axis) {
      case 'COMPUTE':
        return [
          ...baseRollback,
          'Restore original batch sizes',
          'Clear new caches',
          'Revert async optimizations',
        ];
      case 'PROVIDER':
        return [
          ...baseRollback,
          'Switch back to original provider',
          'Remove new provider configuration',
          'Verify continuity with original provider',
        ];
      case 'DATA':
        return [
          ...baseRollback,
          'Disable new data source ingestion',
          'Remove unvalidated data entries',
          'Restore original data filters',
        ];
    }
  }

  private createFeatureFlag(name: string, upgradeId: string): void {
    const flag: FeatureFlag = {
      name,
      enabled: false,
      upgradeId,
      createdAt: new Date().toISOString(),
    };
    this.state.featureFlags.push(flag);
  }

  async approveUpgrade(upgradeId: string): Promise<boolean> {
    if (!this.state.activeUpgrade || this.state.activeUpgrade.id !== upgradeId) {
      return false;
    }

    const check = await governanceEngine.checkDecision(
      'upgrade',
      `Approve ${this.state.activeUpgrade.axis} upgrade: ${this.state.activeUpgrade.name}`
    );

    if (!check.approved) {
      this.state.activeUpgrade.status = 'rejected';
      this.state.activeUpgrade.lessons.push(`Rejected by governance: ${check.recommendation}`);
      logger.warn(`[SelectiveUpgrade] Upgrade rejected by governance`);
      return false;
    }

    const opsCheck = operationsLimitsEngine.checkAction(
      'infrastructure_change',
      `Selective upgrade: ${this.state.activeUpgrade.name}`
    );

    if (!opsCheck.allowed) {
      this.state.activeUpgrade.status = 'rejected';
      this.state.activeUpgrade.lessons.push('Requires manual approval from operations');
      logger.warn(`[SelectiveUpgrade] Upgrade requires operations approval`);
      return false;
    }

    this.state.activeUpgrade.status = 'approved';
    logger.info(`[SelectiveUpgrade] Upgrade approved: ${this.state.activeUpgrade.name}`);
    return true;
  }

  startDryRun(): boolean {
    if (!this.state.activeUpgrade || this.state.activeUpgrade.status !== 'approved') {
      return false;
    }

    this.state.activeUpgrade.status = 'dry_run';
    this.state.activeUpgrade.startedAt = new Date().toISOString();
    
    logger.info(`[SelectiveUpgrade] Dry-run started: ${this.state.activeUpgrade.name}`);
    return true;
  }

  goLive(): boolean {
    if (!this.state.activeUpgrade || this.state.activeUpgrade.status !== 'dry_run') {
      return false;
    }

    const flag = this.state.featureFlags.find(f => f.name === this.state.activeUpgrade!.featureFlag);
    if (flag) {
      flag.enabled = true;
      flag.toggledAt = new Date().toISOString();
    }

    this.state.activeUpgrade.status = 'live';
    logger.info(`[SelectiveUpgrade] Upgrade live: ${this.state.activeUpgrade.name}`);
    return true;
  }

  evaluateROI(): ROILog | null {
    if (!this.state.activeUpgrade || this.state.activeUpgrade.status !== 'live') {
      return null;
    }

    const upgrade = this.state.activeUpgrade;
    const currentMeasurements = measurementEngine.runAllMeasurements();

    const beforeMetrics: Record<string, number> = {};
    const afterMetrics: Record<string, number> = {};
    const deltaMetrics: Record<string, number> = {};

    for (const sm of upgrade.successMetrics) {
      beforeMetrics[sm.metric] = sm.baselineValue;
      afterMetrics[sm.metric] = currentMeasurements[sm.metric]?.currentScore || sm.baselineValue;
      deltaMetrics[sm.metric] = afterMetrics[sm.metric] - beforeMetrics[sm.metric];
      sm.currentValue = afterMetrics[sm.metric];
    }

    const avgDelta = Object.values(deltaMetrics).reduce((a, b) => a + b, 0) / Object.values(deltaMetrics).length;
    const roiScore = Math.round(avgDelta);
    const passed = roiScore >= upgrade.roiThreshold;

    const roiLog: ROILog = {
      upgradeId: upgrade.id,
      upgradeName: upgrade.name,
      axis: upgrade.axis,
      timestamp: new Date().toISOString(),
      beforeMetrics,
      afterMetrics,
      deltaMetrics,
      roiScore,
      passed,
      decision: passed ? 'keep' : 'rollback',
      notes: passed 
        ? `ROI ${roiScore} meets threshold ${upgrade.roiThreshold}`
        : `ROI ${roiScore} below threshold ${upgrade.roiThreshold} - rollback recommended`,
    };

    this.state.roiLogs.push(roiLog);
    upgrade.roiCalculated = roiScore;

    if (this.state.roiLogs.length > this.maxROILogs) {
      this.state.roiLogs.shift();
    }

    logger.info(`[SelectiveUpgrade] ROI evaluated: ${roiScore} (threshold: ${upgrade.roiThreshold})`);
    return roiLog;
  }

  completeUpgrade(lessons: string[]): boolean {
    if (!this.state.activeUpgrade || this.state.activeUpgrade.status !== 'live') {
      return false;
    }

    const upgrade = this.state.activeUpgrade;
    upgrade.status = 'completed';
    upgrade.completedAt = new Date().toISOString();
    upgrade.lessons.push(...lessons);

    this.state.axisUsageCount[upgrade.axis]++;
    this.state.completedUpgrades.push(upgrade);
    this.state.lastUpgrade = new Date().toISOString();

    if (this.state.completedUpgrades.length > this.maxCompletedUpgrades) {
      this.state.completedUpgrades.shift();
    }

    this.state.activeUpgrade = null;

    logger.info(`[SelectiveUpgrade] Upgrade completed: ${upgrade.name}`);
    return true;
  }

  rollbackUpgrade(reason: string): boolean {
    if (!this.state.activeUpgrade) {
      return false;
    }

    const upgrade = this.state.activeUpgrade;
    
    const flag = this.state.featureFlags.find(f => f.name === upgrade.featureFlag);
    if (flag) {
      flag.enabled = false;
      flag.toggledAt = new Date().toISOString();
    }

    upgrade.status = 'rolled_back';
    upgrade.completedAt = new Date().toISOString();
    upgrade.lessons.push(`Rolled back: ${reason}`);

    this.state.completedUpgrades.push(upgrade);
    this.state.activeUpgrade = null;

    logger.warn(`[SelectiveUpgrade] Upgrade rolled back: ${upgrade.name} - ${reason}`);
    return true;
  }

  isFeatureFlagEnabled(flagName: string): boolean {
    const flag = this.state.featureFlags.find(f => f.name === flagName);
    return flag?.enabled || false;
  }

  getActiveUpgrade(): UpgradePlan | null {
    return this.state.activeUpgrade;
  }

  getRecentROILogs(limit: number = 10): ROILog[] {
    return this.state.roiLogs.slice(-limit);
  }

  getAxisBalance(): Record<UpgradeAxis, number> {
    return { ...this.state.axisUsageCount };
  }

  suggestNextAxis(): UpgradeAxis {
    const counts = this.state.axisUsageCount;
    const minCount = Math.min(counts.COMPUTE, counts.PROVIDER, counts.DATA);
    
    if (counts.COMPUTE === minCount) return 'COMPUTE';
    if (counts.PROVIDER === minCount) return 'PROVIDER';
    return 'DATA';
  }

  setROIThreshold(threshold: number): void {
    this.state.roiThreshold = Math.max(0, Math.min(100, threshold));
    logger.info(`[SelectiveUpgrade] ROI threshold set to ${this.state.roiThreshold}`);
  }

  exportStatus(): {
    hasActiveUpgrade: boolean;
    activeUpgrade: UpgradePlan | null;
    completedCount: number;
    roiLogsCount: number;
    axisBalance: Record<UpgradeAxis, number>;
    suggestedNextAxis: UpgradeAxis;
    roiThreshold: number;
    featureFlagsCount: number;
    enabledFlags: string[];
    lastUpgrade: string;
  } {
    return {
      hasActiveUpgrade: this.state.activeUpgrade !== null,
      activeUpgrade: this.state.activeUpgrade,
      completedCount: this.state.completedUpgrades.length,
      roiLogsCount: this.state.roiLogs.length,
      axisBalance: this.getAxisBalance(),
      suggestedNextAxis: this.suggestNextAxis(),
      roiThreshold: this.state.roiThreshold,
      featureFlagsCount: this.state.featureFlags.length,
      enabledFlags: this.state.featureFlags.filter(f => f.enabled).map(f => f.name),
      lastUpgrade: this.state.lastUpgrade,
    };
  }

  getState(): SelectiveUpgradeState {
    return { ...this.state };
  }
}

export const selectiveUpgradeEngine = new SelectiveUpgradeEngine();
