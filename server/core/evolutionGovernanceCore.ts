import { logger } from '../services/logger';
import { realityCore } from './realityCore';
import { measurementEngine } from './measurementEngine';
import { observabilityCore } from './observabilityCore';
import { governanceEngine } from './governanceEngine';

export type EvolutionType = 
  | 'behavior_adjustment'
  | 'strategy_refinement'
  | 'learning_method_selection';

export type EvolutionBlockReason =
  | 'environment_stable'
  | 'insufficient_data'
  | 'risk_threshold_exceeded'
  | 'improvement_not_sustained'
  | 'metrics_not_improved'
  | 'anomaly_increase_detected'
  | 'manual_brake_engaged';

export interface LearningApproach {
  id: string;
  name: string;
  description: string;
  resourceCost: number;
  outcomeQuality: number;
  stabilityScore: number;
  usageCount: number;
  successCount: number;
  failureCount: number;
  lastUsed: string;
  status: 'active' | 'deprecated' | 'experimental';
  createdAt: string;
}

export interface EvolutionProposal {
  id: string;
  timestamp: string;
  cycle: number;
  type: EvolutionType;
  description: string;
  expectedBenefit: string;
  riskAssessment: string;
  requiredCycles: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  rejectionReason?: EvolutionBlockReason;
  metrics: {
    beforeMetrics: Record<string, number>;
    afterMetrics?: Record<string, number>;
    improvement?: number;
  };
}

export interface EvolutionQualification {
  qualified: boolean;
  reasons: string[];
  blockReasons: EvolutionBlockReason[];
  metricsImproved: boolean;
  improvementSustained: boolean;
  noAnomalyIncrease: boolean;
  riskIndicators: Record<string, number>;
}

interface EvolutionGovernanceState {
  enabled: boolean;
  brakeEngaged: boolean;
  currentCycle: number;
  minCyclesForSustainedImprovement: number;
  riskThreshold: number;
  dataVolumeThreshold: number;
  stabilityThreshold: number;
  metricsHistory: Array<{ cycle: number; metrics: Record<string, number>; timestamp: string }>;
  proposals: EvolutionProposal[];
  learningApproaches: LearningApproach[];
  totalEvolutionsApproved: number;
  totalEvolutionsBlocked: number;
  lastEvolution: string | null;
}

const MAX_METRICS_HISTORY = 50;
const MAX_PROPOSALS = 100;
const DEFAULT_MIN_CYCLES = 3;
const DEFAULT_RISK_THRESHOLD = 70;
const DEFAULT_DATA_VOLUME_THRESHOLD = 10;
const DEFAULT_STABILITY_THRESHOLD = 60;

class EvolutionGovernanceCoreEngine {
  private state: EvolutionGovernanceState;

  constructor() {
    this.state = {
      enabled: true,
      brakeEngaged: false,
      currentCycle: 0,
      minCyclesForSustainedImprovement: DEFAULT_MIN_CYCLES,
      riskThreshold: DEFAULT_RISK_THRESHOLD,
      dataVolumeThreshold: DEFAULT_DATA_VOLUME_THRESHOLD,
      stabilityThreshold: DEFAULT_STABILITY_THRESHOLD,
      metricsHistory: [],
      proposals: [],
      learningApproaches: this.initializeDefaultApproaches(),
      totalEvolutionsApproved: 0,
      totalEvolutionsBlocked: 0,
      lastEvolution: null,
    };

    logger.info('[EvolutionGovernance] Initialized - Controlled evolution only');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private initializeDefaultApproaches(): LearningApproach[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'approach_incremental',
        name: 'Incremental Learning',
        description: 'Small, measured adjustments based on recent feedback',
        resourceCost: 20,
        outcomeQuality: 70,
        stabilityScore: 90,
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        lastUsed: now,
        status: 'active',
        createdAt: now,
      },
      {
        id: 'approach_pattern_matching',
        name: 'Pattern Matching',
        description: 'Learn from successful past patterns',
        resourceCost: 30,
        outcomeQuality: 75,
        stabilityScore: 85,
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        lastUsed: now,
        status: 'active',
        createdAt: now,
      },
      {
        id: 'approach_constraint_based',
        name: 'Constraint-Based Learning',
        description: 'Learn what NOT to do from failures and blocks',
        resourceCost: 15,
        outcomeQuality: 65,
        stabilityScore: 95,
        usageCount: 0,
        successCount: 0,
        failureCount: 0,
        lastUsed: now,
        status: 'active',
        createdAt: now,
      },
    ];
  }

  setCycle(cycle: number): void {
    this.state.currentCycle = cycle;
    this.recordCurrentMetrics();
  }

  private recordCurrentMetrics(): void {
    const measurements = measurementEngine.runAllMeasurements();
    const realityStatus = realityCore.exportStatus();

    const metrics: Record<string, number> = {
      stability: measurements.stability?.currentScore || 50,
      evolution: measurements.evolution?.currentScore || 50,
      autonomy: measurements.autonomy?.currentScore || 50,
      anomaly: realityStatus.consecutiveMismatches * 10,
      risk: this.calculateRiskIndicator(),
    };

    this.state.metricsHistory.push({
      cycle: this.state.currentCycle,
      metrics,
      timestamp: new Date().toISOString(),
    });

    if (this.state.metricsHistory.length > MAX_METRICS_HISTORY) {
      this.state.metricsHistory = this.state.metricsHistory.slice(-MAX_METRICS_HISTORY);
    }
  }

  private calculateRiskIndicator(): number {
    const realityStatus = realityCore.exportStatus();
    const govStatus = governanceEngine.exportStatus();
    
    let risk = 0;
    risk += realityStatus.consecutiveMismatches * 15;
    risk += govStatus.violationsBlocked * 5;
    if (govStatus.conservativeMode) risk += 20;
    
    return Math.min(100, risk);
  }

  private checkMetricsImproved(): { improved: boolean; details: string[] } {
    if (this.state.metricsHistory.length < 2) {
      return { improved: false, details: ['Insufficient metrics history'] };
    }

    const recent = this.state.metricsHistory.slice(-2);
    const before = recent[0].metrics;
    const after = recent[1].metrics;
    const details: string[] = [];
    let improvements = 0;
    let regressions = 0;

    for (const key of ['stability', 'evolution', 'autonomy']) {
      if (after[key] > before[key]) {
        improvements++;
        details.push(`${key}: +${(after[key] - before[key]).toFixed(1)}`);
      } else if (after[key] < before[key]) {
        regressions++;
        details.push(`${key}: ${(after[key] - before[key]).toFixed(1)}`);
      }
    }

    return { improved: improvements > regressions, details };
  }

  private checkImprovementSustained(): { sustained: boolean; cycles: number } {
    const minCycles = this.state.minCyclesForSustainedImprovement;
    if (this.state.metricsHistory.length < minCycles) {
      return { sustained: false, cycles: this.state.metricsHistory.length };
    }

    const recentHistory = this.state.metricsHistory.slice(-minCycles);
    let sustainedCount = 0;

    for (let i = 1; i < recentHistory.length; i++) {
      const prev = recentHistory[i - 1].metrics;
      const curr = recentHistory[i].metrics;
      
      const avgPrev = (prev.stability + prev.evolution + prev.autonomy) / 3;
      const avgCurr = (curr.stability + curr.evolution + curr.autonomy) / 3;
      
      if (avgCurr >= avgPrev) sustainedCount++;
    }

    return { 
      sustained: sustainedCount >= minCycles - 1, 
      cycles: sustainedCount 
    };
  }

  private checkNoAnomalyIncrease(): { noIncrease: boolean; delta: number } {
    if (this.state.metricsHistory.length < 2) {
      return { noIncrease: true, delta: 0 };
    }

    const recent = this.state.metricsHistory.slice(-2);
    const delta = recent[1].metrics.anomaly - recent[0].metrics.anomaly;
    
    return { noIncrease: delta <= 0, delta };
  }

  qualifyEvolution(): EvolutionQualification {
    const blockReasons: EvolutionBlockReason[] = [];
    const reasons: string[] = [];

    if (this.state.brakeEngaged) {
      blockReasons.push('manual_brake_engaged');
      reasons.push('Manual evolution brake is engaged');
    }

    const metricsCheck = this.checkMetricsImproved();
    if (!metricsCheck.improved) {
      blockReasons.push('metrics_not_improved');
      reasons.push('Reality metrics have not improved');
    } else {
      reasons.push(`Metrics improved: ${metricsCheck.details.join(', ')}`);
    }

    const sustainedCheck = this.checkImprovementSustained();
    if (!sustainedCheck.sustained) {
      blockReasons.push('improvement_not_sustained');
      reasons.push(`Improvement not sustained (${sustainedCheck.cycles}/${this.state.minCyclesForSustainedImprovement} cycles)`);
    } else {
      reasons.push(`Improvement sustained for ${sustainedCheck.cycles} cycles`);
    }

    const anomalyCheck = this.checkNoAnomalyIncrease();
    if (!anomalyCheck.noIncrease) {
      blockReasons.push('anomaly_increase_detected');
      reasons.push(`Anomaly increased by ${anomalyCheck.delta}`);
    }

    const currentRisk = this.calculateRiskIndicator();
    if (currentRisk > this.state.riskThreshold) {
      blockReasons.push('risk_threshold_exceeded');
      reasons.push(`Risk ${currentRisk} exceeds threshold ${this.state.riskThreshold}`);
    }

    if (this.state.metricsHistory.length < this.state.dataVolumeThreshold) {
      blockReasons.push('insufficient_data');
      reasons.push(`Insufficient data (${this.state.metricsHistory.length}/${this.state.dataVolumeThreshold} cycles)`);
    }

    const recentMetrics = this.state.metricsHistory.slice(-5);
    if (recentMetrics.length >= 3) {
      const avgChange = recentMetrics.slice(1).reduce((acc, curr, i) => {
        const prev = recentMetrics[i];
        return acc + Math.abs(curr.metrics.stability - prev.metrics.stability);
      }, 0) / (recentMetrics.length - 1);

      if (avgChange < 2) {
        blockReasons.push('environment_stable');
        reasons.push('Environment is stable - evolution not needed');
      }
    }

    return {
      qualified: blockReasons.length === 0,
      reasons,
      blockReasons,
      metricsImproved: metricsCheck.improved,
      improvementSustained: sustainedCheck.sustained,
      noAnomalyIncrease: anomalyCheck.noIncrease,
      riskIndicators: {
        currentRisk,
        anomalyDelta: anomalyCheck.delta,
        dataVolume: this.state.metricsHistory.length,
      },
    };
  }

  proposeEvolution(params: {
    type: EvolutionType;
    description: string;
    expectedBenefit: string;
    riskAssessment: string;
    requiredCycles?: number;
  }): EvolutionProposal {
    const now = new Date().toISOString();
    const currentMetrics = this.state.metricsHistory.length > 0 
      ? this.state.metricsHistory[this.state.metricsHistory.length - 1].metrics 
      : {};

    const proposal: EvolutionProposal = {
      id: this.generateId('evol'),
      timestamp: now,
      cycle: this.state.currentCycle,
      type: params.type,
      description: params.description,
      expectedBenefit: params.expectedBenefit,
      riskAssessment: params.riskAssessment,
      requiredCycles: params.requiredCycles || 1,
      status: 'pending',
      metrics: {
        beforeMetrics: { ...currentMetrics },
      },
    };

    const qualification = this.qualifyEvolution();

    if (!qualification.qualified) {
      proposal.status = 'rejected';
      proposal.rejectionReason = qualification.blockReasons[0];
      this.state.totalEvolutionsBlocked++;
      
      logger.warn(`[EvolutionGovernance] BLOCKED: ${params.type} - ${qualification.blockReasons.join(', ')}`);
      
      observabilityCore.traceDecision({
        source: 'agency_core',
        trigger: 'evolution_proposal_blocked',
        stateSnapshot: { 
          cycle: this.state.currentCycle, 
          type: params.type,
          blockReasons: qualification.blockReasons,
        },
        options: [
          { description: 'Block evolution', score: 100 },
          { description: 'Allow evolution', score: 0 },
        ],
        chosenIndex: 0,
        constraintsChecked: ['metrics_improved', 'improvement_sustained', 'no_anomaly_increase', 'risk_threshold'],
        evidenceUsed: qualification.reasons,
        outcome: 'blocked',
        outcomeReason: qualification.blockReasons.join(', '),
      });
    } else {
      proposal.status = 'approved';
      this.state.totalEvolutionsApproved++;
      this.state.lastEvolution = now;
      
      logger.info(`[EvolutionGovernance] APPROVED: ${params.type} - ${params.description}`);
      
      observabilityCore.traceDecision({
        source: 'agency_core',
        trigger: 'evolution_proposal_approved',
        stateSnapshot: { 
          cycle: this.state.currentCycle, 
          type: params.type,
        },
        options: [
          { description: 'Approve evolution', score: 100 },
          { description: 'Block evolution', score: 0 },
        ],
        chosenIndex: 0,
        constraintsChecked: ['metrics_improved', 'improvement_sustained', 'no_anomaly_increase', 'risk_threshold'],
        evidenceUsed: qualification.reasons,
        outcome: 'executed',
      });
    }

    this.state.proposals.push(proposal);
    if (this.state.proposals.length > MAX_PROPOSALS) {
      this.state.proposals = this.state.proposals.slice(-MAX_PROPOSALS);
    }

    return proposal;
  }

  completeEvolution(proposalId: string, success: boolean, afterMetrics?: Record<string, number>): boolean {
    const proposal = this.state.proposals.find(p => p.id === proposalId);
    if (!proposal || proposal.status !== 'approved' && proposal.status !== 'executing') {
      return false;
    }

    proposal.status = success ? 'completed' : 'failed';
    
    if (afterMetrics) {
      proposal.metrics.afterMetrics = afterMetrics;
      
      const beforeAvg = Object.values(proposal.metrics.beforeMetrics).reduce((a, b) => a + b, 0) / 
                        Object.keys(proposal.metrics.beforeMetrics).length;
      const afterAvg = Object.values(afterMetrics).reduce((a, b) => a + b, 0) / 
                       Object.keys(afterMetrics).length;
      proposal.metrics.improvement = afterAvg - beforeAvg;
    }

    logger.info(`[EvolutionGovernance] Evolution ${proposalId} ${success ? 'COMPLETED' : 'FAILED'}`);
    return true;
  }

  engageBrake(): void {
    this.state.brakeEngaged = true;
    logger.warn('[EvolutionGovernance] BRAKE ENGAGED - All evolution blocked');
  }

  releaseBrake(): void {
    this.state.brakeEngaged = false;
    logger.info('[EvolutionGovernance] Brake released - Evolution allowed if qualified');
  }

  compareLearningApproaches(): LearningApproach[] {
    return [...this.state.learningApproaches].sort((a, b) => {
      const scoreA = (a.outcomeQuality * 0.4) + (a.stabilityScore * 0.4) - (a.resourceCost * 0.2);
      const scoreB = (b.outcomeQuality * 0.4) + (b.stabilityScore * 0.4) - (b.resourceCost * 0.2);
      return scoreB - scoreA;
    });
  }

  recordApproachUsage(approachId: string, success: boolean): void {
    const approach = this.state.learningApproaches.find(a => a.id === approachId);
    if (!approach) return;

    approach.usageCount++;
    approach.lastUsed = new Date().toISOString();
    
    if (success) {
      approach.successCount++;
      approach.outcomeQuality = Math.min(100, approach.outcomeQuality + 1);
    } else {
      approach.failureCount++;
      approach.outcomeQuality = Math.max(0, approach.outcomeQuality - 2);
    }

    const successRate = approach.usageCount > 0 ? approach.successCount / approach.usageCount : 0;
    if (approach.usageCount >= 10 && successRate < 0.3) {
      approach.status = 'deprecated';
      logger.warn(`[EvolutionGovernance] Approach ${approach.name} deprecated (success rate: ${(successRate * 100).toFixed(1)}%)`);
    }
  }

  getBestApproach(): LearningApproach | null {
    const active = this.state.learningApproaches.filter(a => a.status === 'active');
    if (active.length === 0) return null;
    
    return this.compareLearningApproaches().find(a => a.status === 'active') || null;
  }

  getProposals(params: {
    limit?: number;
    status?: EvolutionProposal['status'];
    type?: EvolutionType;
  } = {}): EvolutionProposal[] {
    let results = [...this.state.proposals];

    if (params.status) {
      results = results.filter(p => p.status === params.status);
    }
    if (params.type) {
      results = results.filter(p => p.type === params.type);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return results.slice(0, params.limit || 30);
  }

  exportStatus(): {
    enabled: boolean;
    brakeEngaged: boolean;
    currentCycle: number;
    qualification: EvolutionQualification;
    totalEvolutionsApproved: number;
    totalEvolutionsBlocked: number;
    lastEvolution: string | null;
    pendingProposals: number;
    activeApproaches: number;
    bestApproach: string | null;
    metricsHistoryLength: number;
  } {
    const bestApproach = this.getBestApproach();
    
    return {
      enabled: this.state.enabled,
      brakeEngaged: this.state.brakeEngaged,
      currentCycle: this.state.currentCycle,
      qualification: this.qualifyEvolution(),
      totalEvolutionsApproved: this.state.totalEvolutionsApproved,
      totalEvolutionsBlocked: this.state.totalEvolutionsBlocked,
      lastEvolution: this.state.lastEvolution,
      pendingProposals: this.state.proposals.filter(p => p.status === 'pending').length,
      activeApproaches: this.state.learningApproaches.filter(a => a.status === 'active').length,
      bestApproach: bestApproach?.name || null,
      metricsHistoryLength: this.state.metricsHistory.length,
    };
  }
}

export const evolutionGovernanceCore = new EvolutionGovernanceCoreEngine();
