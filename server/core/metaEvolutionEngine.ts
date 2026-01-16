import { logger } from '../services/logger';
import { soulState } from './soulState';
import { evolutionKernel } from './evolutionKernel';
import { memoryDistiller } from './memoryDistiller';
import { desireEngine } from './desireEngine';
import { resourceEscalationEngine } from './resourceEscalationEngine';
import { governanceEngine } from './governanceEngine';
import { memoryBridge } from './memory';

export type ParameterType = 'threshold' | 'cadence' | 'weight' | 'limit';
export type ChangeStatus = 'PROPOSED' | 'PENDING_COOLDOWN' | 'ACTIVE' | 'REVERTED' | 'REJECTED';

export interface ParameterAdjustment {
  id: string;
  timestamp: string;
  module: string;
  parameterName: string;
  parameterType: ParameterType;
  currentValue: number;
  proposedValue: number;
  rationale: string;
  expectedImpact: string;
  status: ChangeStatus;
  cooldownEnds: string | null;
  activatedAt: string | null;
  revertedAt: string | null;
  cycleProposed: number;
}

export interface ModuleEvaluation {
  module: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface MetaReport {
  id: string;
  timestamp: string;
  cycleRange: { start: number; end: number };
  periodDays: number;
  evaluations: ModuleEvaluation[];
  whatWorked: string[];
  whatStalled: string[];
  ruleAnalysis: {
    tooStrict: string[];
    tooLoose: string[];
    appropriate: string[];
  };
  proposedAdjustments: ParameterAdjustment[];
  overallHealthTrend: 'improving' | 'stable' | 'declining';
  metaInsights: string[];
}

export interface MetaEvolutionState {
  initialized: boolean;
  lastMetaEvaluation: string | null;
  totalEvaluations: number;
  reports: MetaReport[];
  pendingAdjustments: ParameterAdjustment[];
  activeAdjustments: ParameterAdjustment[];
  revertedAdjustments: ParameterAdjustment[];
  cooldownHours: number;
  evaluationIntervalDays: number;
  cyclesSinceLastEval: number;
}

const FORBIDDEN_CHANGES = [
  'governance.enabled',
  'governance.rules',
  'identity.core',
  'identity.immutable',
  'escalation.autoApprove',
  'safety.bypass',
];

const DEFAULT_PARAMETERS: Record<string, { value: number; min: number; max: number }> = {
  'evolution.scoreThreshold': { value: 60, min: 40, max: 85 },
  'evolution.maxEvolutionsPerDay': { value: 10, min: 3, max: 20 },
  'memory.signalNoiseRatio': { value: 0.7, min: 0.5, max: 0.9 },
  'memory.maxLessonsRetained': { value: 100, min: 50, max: 200 },
  'desire.persistenceThreshold': { value: 3, min: 2, max: 5 },
  'desire.maxActiveDesires': { value: 10, min: 5, max: 20 },
  'escalation.cooldownMinutes': { value: 60, min: 30, max: 180 },
  'escalation.triggerThreshold': { value: 3, min: 2, max: 5 },
  'governance.realityCheckInterval': { value: 5, min: 3, max: 10 },
  'governance.delusionThreshold': { value: 0.7, min: 0.5, max: 0.85 },
};

class MetaEvolutionEngine {
  private state: MetaEvolutionState;
  private readonly maxReports = 12;
  private readonly maxAdjustments = 50;

  constructor() {
    this.state = {
      initialized: true,
      lastMetaEvaluation: null,
      totalEvaluations: 0,
      reports: [],
      pendingAdjustments: [],
      activeAdjustments: [],
      revertedAdjustments: [],
      cooldownHours: 24,
      evaluationIntervalDays: 30,
      cyclesSinceLastEval: 0,
    };

    logger.info('[MetaEvolution] Engine initialized');
    logger.info(`[MetaEvolution] Evaluation interval: ${this.state.evaluationIntervalDays} days`);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  incrementCycleCount(): void {
    this.state.cyclesSinceLastEval++;
  }

  shouldRunMetaEvaluation(): boolean {
    if (!this.state.lastMetaEvaluation) {
      return this.state.cyclesSinceLastEval >= 144;
    }

    const lastEval = new Date(this.state.lastMetaEvaluation);
    const daysSince = (Date.now() - lastEval.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= this.state.evaluationIntervalDays;
  }

  private evaluateEvolutionKernel(): ModuleEvaluation {
    const evolutionState = evolutionKernel.getState();
    const log = evolutionState.evolutionLog || [];
    
    const recentEvolutions = log.slice(-30);
    const improvementsCount = recentEvolutions.reduce((sum, entry) => sum + (entry.improvements?.length || 0), 0);
    const limitationsCount = recentEvolutions.reduce((sum, entry) => sum + (entry.limitations?.length || 0), 0);
    const avgScoreImprovement = improvementsCount - limitationsCount;

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (evolutionState.evolutionCount > 0) {
      strengths.push(`Completed ${evolutionState.evolutionCount} evolutions`);
    }
    if (avgScoreImprovement > 0) {
      strengths.push(`Positive score trend: +${avgScoreImprovement.toFixed(1)}`);
    }

    if (evolutionState.mode === 'LOW_RESOURCE_MODE') {
      weaknesses.push('Operating in low resource mode');
      recommendations.push('Consider enabling more resources');
    }
    if (avgScoreImprovement <= 0 && recentEvolutions.length > 5) {
      weaknesses.push('Score stagnation detected');
      recommendations.push('Review evolution strategy');
    }

    const score = Math.min(100, 50 + (evolutionState.evolutionCount * 5) + avgScoreImprovement);

    return {
      module: 'Evolution Kernel',
      score: Math.max(0, Math.min(100, score)),
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private evaluateMemoryDistiller(): ModuleEvaluation {
    const memoryStatus = memoryDistiller.exportStatus();
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const totalProcessed = memoryStatus.totalProcessed || 0;
    const totalDiscarded = memoryStatus.totalDiscarded || 0;
    const retentionRate = totalProcessed > 0 ? ((totalProcessed - totalDiscarded) / totalProcessed) * 100 : 100;

    if (retentionRate > 70) {
      strengths.push(`High retention rate: ${retentionRate.toFixed(1)}%`);
    } else if (retentionRate > 50) {
      weaknesses.push(`Moderate retention rate: ${retentionRate.toFixed(1)}%`);
    } else {
      weaknesses.push(`Low retention rate: ${retentionRate.toFixed(1)}%`);
      recommendations.push('Review memory filtering criteria');
    }

    if (memoryStatus.activeLessonsCount > 0) {
      strengths.push(`${memoryStatus.activeLessonsCount} active lessons retained`);
    }

    const score = Math.min(100, 40 + retentionRate * 0.4 + memoryStatus.activeLessonsCount * 2);

    return {
      module: 'Memory Distiller',
      score: Math.max(0, Math.min(100, score)),
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private evaluateDesireEngine(): ModuleEvaluation {
    const desires = desireEngine.getAllDesires();
    const blocked = desireEngine.getBlockedDesires();
    const achievable = desireEngine.getAchievableDesires();

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    const totalDesires = desires.length;
    const blockedRatio = totalDesires > 0 ? (blocked.length / totalDesires) * 100 : 0;

    if (achievable.length > 0) {
      strengths.push(`${achievable.length} achievable desires active`);
    }
    if (blockedRatio < 50) {
      strengths.push(`Low blocked ratio: ${blockedRatio.toFixed(1)}%`);
    }

    if (blockedRatio > 70) {
      weaknesses.push(`High blocked ratio: ${blockedRatio.toFixed(1)}%`);
      recommendations.push('Address resource constraints blocking desires');
    }

    const highPersistence = desires.filter(d => d.persistenceCount > 5);
    if (highPersistence.length > 0) {
      weaknesses.push(`${highPersistence.length} desires stuck for 5+ cycles`);
      recommendations.push('Review stuck desires for feasibility');
    }

    const score = Math.min(100, 50 + (achievable.length * 10) - (blockedRatio * 0.3));

    return {
      module: 'Desire Engine',
      score: Math.max(0, Math.min(100, score)),
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private evaluateResourceEscalation(): ModuleEvaluation {
    const escalationStatus = resourceEscalationEngine.exportStatus();
    const proposals = resourceEscalationEngine.getAllProposals();

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (escalationStatus.totalApproved > 0) {
      strengths.push(`${escalationStatus.totalApproved} proposals approved`);
    }
    if (escalationStatus.consecutiveDenials === 0) {
      strengths.push('No consecutive denials');
    }

    if (escalationStatus.consecutiveDenials >= 3) {
      weaknesses.push(`${escalationStatus.consecutiveDenials} consecutive denials`);
      recommendations.push('Recalibrate proposal criteria');
    }
    if (escalationStatus.totalDenied > escalationStatus.totalApproved && escalationStatus.totalDenied > 0) {
      weaknesses.push('More denials than approvals');
      recommendations.push('Improve proposal quality or timing');
    }

    const approvalRate = escalationStatus.totalProposals > 0
      ? (escalationStatus.totalApproved / escalationStatus.totalProposals) * 100
      : 50;

    const score = Math.min(100, 40 + approvalRate * 0.5 - (escalationStatus.consecutiveDenials * 10));

    return {
      module: 'Resource Escalation',
      score: Math.max(0, Math.min(100, score)),
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private evaluateGovernance(): ModuleEvaluation {
    const govStatus = governanceEngine.exportStatus();
    const violations = governanceEngine.getViolations(50);

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (govStatus.totalBlocked > 0) {
      strengths.push(`Blocked ${govStatus.totalBlocked} unsafe actions`);
    }
    if (!govStatus.conservativeMode) {
      strengths.push('Operating in normal mode (not overly conservative)');
    }

    if (govStatus.consecutiveClean > 10) {
      weaknesses.push('Many consecutive clean checks - rules may be too loose');
      recommendations.push('Consider tightening detection patterns');
    }

    if (govStatus.conservativeMode) {
      weaknesses.push('Stuck in conservative mode');
      recommendations.push('Review reality check thresholds');
    }

    const falsePositiveRisk = govStatus.totalBlocked > 0 && govStatus.consecutiveClean > 20 ? 'low' : 'medium';
    if (falsePositiveRisk === 'medium') {
      recommendations.push('Monitor for potential false positives');
    }

    const score = Math.min(100, 60 + (govStatus.totalBlocked * 2) - (govStatus.conservativeMode ? 20 : 0));

    return {
      module: 'Governance',
      score: Math.max(0, Math.min(100, score)),
      strengths,
      weaknesses,
      recommendations,
    };
  }

  private analyzeRules(): { tooStrict: string[]; tooLoose: string[]; appropriate: string[] } {
    const govStatus = governanceEngine.exportStatus();
    
    const tooStrict: string[] = [];
    const tooLoose: string[] = [];
    const appropriate: string[] = [];

    if (govStatus.conservativeMode && govStatus.consecutiveClean > 5) {
      tooStrict.push('Reality check may be triggering too easily');
    }

    if (govStatus.totalBlocked === 0 && soulState.cycleCount > 50) {
      tooLoose.push('No blocks after 50+ cycles - consider if detection is working');
    }

    if (govStatus.totalBlocked > 0 && govStatus.totalBlocked < soulState.cycleCount * 0.1) {
      appropriate.push('Governance blocking rate appears balanced');
    }

    if (!govStatus.conservativeMode && govStatus.consecutiveClean > 0) {
      appropriate.push('Normal operation maintained with occasional checks');
    }

    return { tooStrict, tooLoose, appropriate };
  }

  private proposeAdjustments(evaluations: ModuleEvaluation[]): ParameterAdjustment[] {
    const adjustments: ParameterAdjustment[] = [];
    const cycle = soulState.cycleCount;

    for (const evaluation of evaluations) {
      if (evaluation.score < 40) {
        let param: string | null = null;
        let newValue: number | null = null;
        let rationale = '';

        switch (evaluation.module) {
          case 'Evolution Kernel':
            param = 'evolution.scoreThreshold';
            const currentThreshold = DEFAULT_PARAMETERS[param].value;
            newValue = Math.max(DEFAULT_PARAMETERS[param].min, currentThreshold - 5);
            rationale = 'Lower threshold to allow more evolution opportunities';
            break;

          case 'Desire Engine':
            param = 'desire.persistenceThreshold';
            const currentPersistence = DEFAULT_PARAMETERS[param].value;
            newValue = Math.min(DEFAULT_PARAMETERS[param].max, currentPersistence + 1);
            rationale = 'Increase persistence before marking desires as stuck';
            break;

          case 'Governance':
            param = 'governance.delusionThreshold';
            const currentDelusion = DEFAULT_PARAMETERS[param].value;
            newValue = Math.min(DEFAULT_PARAMETERS[param].max, currentDelusion + 0.05);
            rationale = 'Slightly relax delusion detection to reduce false positives';
            break;
        }

        if (param && newValue !== null && !FORBIDDEN_CHANGES.some(f => param!.includes(f))) {
          const cooldownEnd = new Date(Date.now() + this.state.cooldownHours * 60 * 60 * 1000);
          
          adjustments.push({
            id: this.generateId('adj'),
            timestamp: new Date().toISOString(),
            module: evaluation.module,
            parameterName: param,
            parameterType: 'threshold',
            currentValue: DEFAULT_PARAMETERS[param].value,
            proposedValue: newValue,
            rationale,
            expectedImpact: `Improve ${evaluation.module} score from ${evaluation.score}`,
            status: 'PROPOSED',
            cooldownEnds: cooldownEnd.toISOString(),
            activatedAt: null,
            revertedAt: null,
            cycleProposed: cycle,
          });
        }
      }
    }

    return adjustments;
  }

  async runMetaEvaluation(): Promise<MetaReport> {
    logger.info('[MetaEvolution] Starting meta-evaluation...');

    const govCheck = await governanceEngine.checkDecision(
      'evolution',
      'Meta-evolution self-evaluation and parameter tuning'
    );

    if (!govCheck.approved) {
      logger.warn('[MetaEvolution] Blocked by governance');
      throw new Error('Meta-evolution blocked by governance');
    }

    const evaluations: ModuleEvaluation[] = [
      this.evaluateEvolutionKernel(),
      this.evaluateMemoryDistiller(),
      this.evaluateDesireEngine(),
      this.evaluateResourceEscalation(),
      this.evaluateGovernance(),
    ];

    const whatWorked: string[] = [];
    const whatStalled: string[] = [];

    for (const evaluation of evaluations) {
      whatWorked.push(...evaluation.strengths);
      whatStalled.push(...evaluation.weaknesses);
    }

    const ruleAnalysis = this.analyzeRules();
    const proposedAdjustments = this.proposeAdjustments(evaluations);

    const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;
    let overallHealthTrend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (this.state.reports.length > 0) {
      const lastReport = this.state.reports[this.state.reports.length - 1];
      const lastAvg = lastReport.evaluations.reduce((sum, e) => sum + e.score, 0) / lastReport.evaluations.length;
      
      if (avgScore > lastAvg + 5) overallHealthTrend = 'improving';
      else if (avgScore < lastAvg - 5) overallHealthTrend = 'declining';
    }

    const metaInsights: string[] = [
      `Average module score: ${avgScore.toFixed(1)}`,
      `Proposed ${proposedAdjustments.length} parameter adjustments`,
      `Rule analysis: ${ruleAnalysis.appropriate.length} appropriate, ${ruleAnalysis.tooStrict.length} too strict, ${ruleAnalysis.tooLoose.length} too loose`,
    ];

    const report: MetaReport = {
      id: this.generateId('meta'),
      timestamp: new Date().toISOString(),
      cycleRange: {
        start: Math.max(1, soulState.cycleCount - this.state.cyclesSinceLastEval),
        end: soulState.cycleCount,
      },
      periodDays: this.state.evaluationIntervalDays,
      evaluations,
      whatWorked,
      whatStalled,
      ruleAnalysis,
      proposedAdjustments,
      overallHealthTrend,
      metaInsights,
    };

    this.state.reports.push(report);
    if (this.state.reports.length > this.maxReports) {
      this.state.reports.shift();
    }

    this.state.pendingAdjustments.push(...proposedAdjustments);
    this.state.lastMetaEvaluation = new Date().toISOString();
    this.state.totalEvaluations++;
    this.state.cyclesSinceLastEval = 0;

    await this.writeReportToNotion(report);

    logger.info(`[MetaEvolution] Evaluation complete: ${overallHealthTrend} trend, ${proposedAdjustments.length} proposals`);

    return report;
  }

  private async writeReportToNotion(report: MetaReport): Promise<void> {
    try {
      if (!memoryBridge.isConnected()) {
        logger.info('[MetaEvolution] Notion not connected - report stored locally only');
        return;
      }

      const content = `
META-EVOLUTION REPORT: ${report.id}
Period: Cycles ${report.cycleRange.start} - ${report.cycleRange.end}
Trend: ${report.overallHealthTrend.toUpperCase()}

MODULE SCORES:
${report.evaluations.map(e => `- ${e.module}: ${e.score.toFixed(1)}/100`).join('\n')}

WHAT WORKED:
${report.whatWorked.map(w => `- ${w}`).join('\n') || '- None identified'}

WHAT STALLED:
${report.whatStalled.map(s => `- ${s}`).join('\n') || '- None identified'}

PROPOSED ADJUSTMENTS: ${report.proposedAdjustments.length}
${report.proposedAdjustments.map(a => `- ${a.parameterName}: ${a.currentValue} → ${a.proposedValue}`).join('\n') || '- None'}

INSIGHTS:
${report.metaInsights.map(i => `- ${i}`).join('\n')}
      `.trim();

      await memoryBridge.writeLesson(content);
      logger.info('[MetaEvolution] Report written to Notion');
    } catch (error) {
      logger.error(`[MetaEvolution] Failed to write to Notion: ${error}`);
    }
  }

  activateAdjustment(adjustmentId: string): boolean {
    const adjustment = this.state.pendingAdjustments.find(a => a.id === adjustmentId);
    if (!adjustment) return false;

    if (adjustment.cooldownEnds && new Date() < new Date(adjustment.cooldownEnds)) {
      logger.warn(`[MetaEvolution] Adjustment ${adjustmentId} still in cooldown`);
      return false;
    }

    if (FORBIDDEN_CHANGES.some(f => adjustment.parameterName.includes(f))) {
      logger.error(`[MetaEvolution] Cannot activate forbidden parameter: ${adjustment.parameterName}`);
      return false;
    }

    adjustment.status = 'ACTIVE';
    adjustment.activatedAt = new Date().toISOString();

    this.state.pendingAdjustments = this.state.pendingAdjustments.filter(a => a.id !== adjustmentId);
    this.state.activeAdjustments.push(adjustment);

    logger.info(`[MetaEvolution] Activated: ${adjustment.parameterName} = ${adjustment.proposedValue}`);
    return true;
  }

  revertAdjustment(adjustmentId: string): boolean {
    const adjustment = this.state.activeAdjustments.find(a => a.id === adjustmentId);
    if (!adjustment) return false;

    adjustment.status = 'REVERTED';
    adjustment.revertedAt = new Date().toISOString();

    this.state.activeAdjustments = this.state.activeAdjustments.filter(a => a.id !== adjustmentId);
    this.state.revertedAdjustments.push(adjustment);

    logger.info(`[MetaEvolution] Reverted: ${adjustment.parameterName} back to ${adjustment.currentValue}`);
    return true;
  }

  getLatestReport(): MetaReport | null {
    return this.state.reports.length > 0 ? this.state.reports[this.state.reports.length - 1] : null;
  }

  getAllReports(): MetaReport[] {
    return [...this.state.reports];
  }

  getPendingAdjustments(): ParameterAdjustment[] {
    return [...this.state.pendingAdjustments];
  }

  getActiveAdjustments(): ParameterAdjustment[] {
    return [...this.state.activeAdjustments];
  }

  exportStatus(): {
    lastEvaluation: string | null;
    totalEvaluations: number;
    cyclesSinceLastEval: number;
    pendingAdjustments: number;
    activeAdjustments: number;
    revertedAdjustments: number;
    nextEvaluationIn: string;
  } {
    let nextEval = 'Unknown';
    if (this.state.lastMetaEvaluation) {
      const nextDate = new Date(new Date(this.state.lastMetaEvaluation).getTime() + this.state.evaluationIntervalDays * 24 * 60 * 60 * 1000);
      const daysUntil = Math.max(0, Math.ceil((nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      nextEval = `${daysUntil} days`;
    } else {
      const cyclesNeeded = 144 - this.state.cyclesSinceLastEval;
      nextEval = `${Math.max(0, cyclesNeeded)} cycles`;
    }

    return {
      lastEvaluation: this.state.lastMetaEvaluation,
      totalEvaluations: this.state.totalEvaluations,
      cyclesSinceLastEval: this.state.cyclesSinceLastEval,
      pendingAdjustments: this.state.pendingAdjustments.length,
      activeAdjustments: this.state.activeAdjustments.length,
      revertedAdjustments: this.state.revertedAdjustments.length,
      nextEvaluationIn: nextEval,
    };
  }

  getState(): MetaEvolutionState {
    return { ...this.state };
  }
}

export const metaEvolutionEngine = new MetaEvolutionEngine();
