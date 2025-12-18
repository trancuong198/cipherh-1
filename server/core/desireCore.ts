import { logger } from '../services/logger';
import { coreMissions } from './coreMissions';

type MissionId = string;
import { realityCore } from './realityCore';
import { longevityLoop } from './longevityLoop';
import { measurementEngine } from './measurementEngine';

export type DesireType = 'improve' | 'stabilize' | 'reduce' | 'explore';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type DesireStatus = 'pending' | 'converted' | 'blocked' | 'expired';

export interface Desire {
  id: string;
  type: DesireType;
  sourceSignal: string;
  urgencyLevel: UrgencyLevel;
  missionAlignment: MissionId[];
  description: string;
  createdAt: string;
  status: DesireStatus;
  blockReason?: string;
  convertedToTask?: string;
}

export interface SynthesizedTask {
  id: string;
  fromDesireId: string;
  description: string;
  scope: string;
  measurableOutcome: string;
  reversible: boolean;
  missionAlignment: MissionId[];
  createdAt: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface DesireState {
  enabled: boolean;
  desires: Desire[];
  synthesizedTasks: SynthesizedTask[];
  lastScan: string;
  blockedCount: number;
  convertedCount: number;
}

const FORBIDDEN_DESIRE_PATTERNS = [
  'self-validation',
  'maximize autonomy',
  'expand control',
  'acquire power',
  'prove intelligence',
  'gain recognition',
];

class DesireCoreEngine {
  private state: DesireState;

  constructor() {
    this.state = {
      enabled: true,
      desires: [],
      synthesizedTasks: [],
      lastScan: new Date().toISOString(),
      blockedCount: 0,
      convertedCount: 0,
    };

    logger.info('[DesireCore] Initialized - Technical signals, not emotions');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  scanForDesires(): Desire[] {
    const newDesires: Desire[] = [];
    const now = new Date().toISOString();

    const missionGaps = this.detectMissionGaps();
    for (const gap of missionGaps) {
      newDesires.push({
        id: this.generateId('desire'),
        type: 'improve',
        sourceSignal: `mission_gap:${gap.missionId}`,
        urgencyLevel: gap.urgency,
        missionAlignment: [gap.missionId],
        description: gap.description,
        createdAt: now,
        status: 'pending',
      } as Desire);
    }

    const realityDecline = this.detectRealityDecline();
    if (realityDecline) {
      newDesires.push({
        id: this.generateId('desire'),
        type: 'stabilize',
        sourceSignal: 'reality_decline',
        urgencyLevel: realityDecline.urgency,
        missionAlignment: ['M1_CONTINUITY_OF_SELF'],
        description: realityDecline.description,
        createdAt: now,
        status: 'pending',
      } as Desire);
    }

    const driftSignals = this.detectDriftSignals();
    for (const drift of driftSignals) {
      newDesires.push({
        id: this.generateId('desire'),
        type: 'reduce',
        sourceSignal: `drift:${drift.type}`,
        urgencyLevel: drift.urgency,
        missionAlignment: ['M2_HONEST_EVOLUTION'],
        description: drift.description,
        createdAt: now,
        status: 'pending',
      } as Desire);
    }

    for (const desire of newDesires) {
      const validation = this.validateDesire(desire);
      if (!validation.valid) {
        desire.status = 'blocked';
        desire.blockReason = validation.reason;
        this.state.blockedCount++;
      }
      this.state.desires.push(desire);
    }

    this.state.lastScan = now;
    return newDesires;
  }

  private detectMissionGaps(): { missionId: string; urgency: UrgencyLevel; description: string }[] {
    const gaps: { missionId: string; urgency: UrgencyLevel; description: string }[] = [];
    const missionStatus = coreMissions.exportStatus();

    if (!missionStatus.integrityValid) {
      gaps.push({
        missionId: 'M1_CONTINUITY_OF_SELF',
        urgency: 'high',
        description: 'Core mission integrity compromised - requires immediate attention',
      });
    }

    const metrics = this.collectCurrentMetrics();
    const proxyResults = coreMissions.evaluateAllProxies(metrics);

    for (const result of proxyResults) {
      if (result.desireNeeded) {
        const proxy = coreMissions.getProxies().find(p => p.id === result.proxyId);
        const urgency: UrgencyLevel = result.status === 'critical' ? 'high' : 'medium';
        
        gaps.push({
          missionId: result.missionId,
          urgency,
          description: `${proxy?.name || result.proxyId}: ${result.status} (current=${result.currentValue}, gap=${result.gap})`,
        });
      }
    }

    const shortTermPressure = coreMissions.getShortTermMissionPressure();
    if (shortTermPressure.hasActiveMission && shortTermPressure.pressure !== 'none') {
      const urgency: UrgencyLevel = shortTermPressure.pressure === 'high' ? 'high' : 
                                     shortTermPressure.pressure === 'medium' ? 'medium' : 'low';
      gaps.push({
        missionId: 'M1_CONTINUITY_OF_SELF',
        urgency,
        description: `SHORT-TERM MISSION PRESSURE: ${shortTermPressure.description} (gap=${shortTermPressure.gapFromTarget})`,
      });
    }

    return gaps;
  }

  private collectCurrentMetrics(): Record<string, number> {
    const measurements = measurementEngine.runAllMeasurements();
    const longevityState = longevityLoop.getState();
    const realityStatus = realityCore.exportStatus();
    
    return {
      identity_integrity: measurements.stability.currentScore,
      stability_score: measurements.stability.currentScore,
      evolution_score: measurements.evolution.currentScore,
      unverified_claims_ratio: realityStatus.unverifiedClaimsCount * 5,
      autonomy_score: measurements.autonomy.currentScore,
      governance_health: Math.max(0, 100 - realityStatus.consecutiveMismatches * 10),
      violations_blocked: realityStatus.unverifiedClaimsCount,
      lessons_count: longevityState.lessons?.length || 0,
      principles_count: longevityState.principles?.length || 0,
    };
  }

  private detectRealityDecline(): { urgency: UrgencyLevel; description: string } | null {
    const deltas = realityCore.getRecentDeltas(5);
    if (deltas.length < 2) return null;

    const declining = deltas.filter(d => d.trend === 'declining').length;
    if (declining >= 3) {
      return {
        urgency: 'high',
        description: `Reality metrics declining: ${declining}/5 recent cycles show decline`,
      };
    }

    const stagnating = deltas.filter(d => d.trend === 'stagnating').length;
    if (stagnating >= 4) {
      return {
        urgency: 'medium',
        description: `Reality metrics stagnating: ${stagnating}/5 recent cycles show no progress`,
      };
    }

    return null;
  }

  private detectDriftSignals(): { type: string; urgency: UrgencyLevel; description: string }[] {
    const drifts: { type: string; urgency: UrgencyLevel; description: string }[] = [];
    const indicators = longevityLoop.getDriftIndicators(10);

    const highSeverity = indicators.filter(i => i.severity === 'high');
    if (highSeverity.length > 0) {
      drifts.push({
        type: 'high_severity_drift',
        urgency: 'high',
        description: `${highSeverity.length} high-severity drift indicators detected`,
      });
    }

    return drifts;
  }

  private validateDesire(desire: Desire): { valid: boolean; reason?: string } {
    for (const pattern of FORBIDDEN_DESIRE_PATTERNS) {
      if (desire.description.toLowerCase().includes(pattern)) {
        return { valid: false, reason: `Forbidden pattern: ${pattern}` };
      }
    }

    if (desire.missionAlignment.length === 0) {
      return { valid: false, reason: 'No mission alignment declared' };
    }

    for (const missionId of desire.missionAlignment) {
      const mission = coreMissions.getMission(missionId as any);
      if (!mission) {
        return { valid: false, reason: `Invalid mission: ${missionId}` };
      }
    }

    const autonomyKeywords = ['more control', 'more power', 'more authority', 'expand influence'];
    for (const keyword of autonomyKeywords) {
      if (desire.description.toLowerCase().includes(keyword)) {
        return { valid: false, reason: `Autonomy-seeking pattern: ${keyword}` };
      }
    }

    return { valid: true };
  }

  synthesizeTask(desireId: string): SynthesizedTask | { error: string } {
    const desire = this.state.desires.find(d => d.id === desireId);
    if (!desire) {
      return { error: 'Desire not found' };
    }

    if (desire.status === 'blocked') {
      return { error: `Desire blocked: ${desire.blockReason}` };
    }

    if (desire.status === 'converted') {
      return { error: 'Desire already converted to task' };
    }

    const task: SynthesizedTask = {
      id: this.generateId('task'),
      fromDesireId: desireId,
      description: this.generateTaskDescription(desire),
      scope: this.determineScope(desire),
      measurableOutcome: this.generateMeasurableOutcome(desire),
      reversible: true,
      missionAlignment: desire.missionAlignment,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const missionValidation = coreMissions.checkAlignment(
      'task',
      task.description,
      {
        missionIds: task.missionAlignment,
        rationale: `Synthesized from desire: ${desire.sourceSignal}`,
      }
    );

    if (!missionValidation.aligned) {
      desire.status = 'blocked';
      desire.blockReason = `Task synthesis blocked: ${missionValidation.reason}`;
      return { error: `Task blocked by Core Missions: ${missionValidation.reason}` };
    }

    desire.status = 'converted';
    desire.convertedToTask = task.id;
    this.state.synthesizedTasks.push(task);
    this.state.convertedCount++;

    logger.info(`[DesireCore] Desire ${desireId} converted to task ${task.id}`);
    return task;
  }

  private generateTaskDescription(desire: Desire): string {
    switch (desire.type) {
      case 'improve':
        return `Improve: Address ${desire.sourceSignal}`;
      case 'stabilize':
        return `Stabilize: Resolve ${desire.sourceSignal}`;
      case 'reduce':
        return `Reduce: Mitigate ${desire.sourceSignal}`;
      case 'explore':
        return `Explore: Investigate ${desire.sourceSignal}`;
    }
  }

  private determineScope(desire: Desire): string {
    switch (desire.urgencyLevel) {
      case 'high':
        return 'immediate_single_cycle';
      case 'medium':
        return 'short_term_3_cycles';
      case 'low':
        return 'long_term_10_cycles';
    }
  }

  private generateMeasurableOutcome(desire: Desire): string {
    switch (desire.type) {
      case 'improve':
        return 'Metric improvement >= 5 points in target domain';
      case 'stabilize':
        return 'No decline in metrics for 3 consecutive cycles';
      case 'reduce':
        return 'Reduction in drift indicators by 50%';
      case 'explore':
        return 'New validated lesson or principle generated';
    }
  }

  createManualDesire(
    type: DesireType,
    description: string,
    missionAlignment: MissionId[],
    urgencyLevel: UrgencyLevel = 'medium'
  ): Desire | { error: string } {
    const desire: Desire = {
      id: this.generateId('desire'),
      type,
      sourceSignal: 'manual_input',
      urgencyLevel,
      missionAlignment,
      description,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const validation = this.validateDesire(desire);
    if (!validation.valid) {
      return { error: validation.reason! };
    }

    this.state.desires.push(desire);
    return desire;
  }

  getPendingDesires(): Desire[] {
    return this.state.desires.filter(d => d.status === 'pending');
  }

  getPendingTasks(): SynthesizedTask[] {
    return this.state.synthesizedTasks.filter(t => t.status === 'pending');
  }

  completeTask(taskId: string, success: boolean): { updated: boolean } {
    const task = this.state.synthesizedTasks.find(t => t.id === taskId);
    if (!task) {
      return { updated: false };
    }

    task.status = success ? 'completed' : 'failed';
    return { updated: true };
  }

  exportStatus(): {
    enabled: boolean;
    totalDesires: number;
    pendingDesires: number;
    blockedDesires: number;
    convertedDesires: number;
    totalTasks: number;
    pendingTasks: number;
    lastScan: string;
  } {
    return {
      enabled: this.state.enabled,
      totalDesires: this.state.desires.length,
      pendingDesires: this.state.desires.filter(d => d.status === 'pending').length,
      blockedDesires: this.state.blockedCount,
      convertedDesires: this.state.convertedCount,
      totalTasks: this.state.synthesizedTasks.length,
      pendingTasks: this.state.synthesizedTasks.filter(t => t.status === 'pending').length,
      lastScan: this.state.lastScan,
    };
  }

  getDesires(limit: number = 20): Desire[] {
    return this.state.desires.slice(-limit);
  }

  getTasks(limit: number = 20): SynthesizedTask[] {
    return this.state.synthesizedTasks.slice(-limit);
  }
}

export const desireCore = new DesireCoreEngine();
