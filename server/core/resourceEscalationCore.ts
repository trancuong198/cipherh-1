import { logger } from '../services/logger';
import { coreMissions } from './coreMissions';
import { realityCore } from './realityCore';
import { desireCore } from './desireCore';

export type ResourceType = 'compute' | 'storage' | 'api' | 'human';
export type BottleneckType = 'internal_capability' | 'compute_limit' | 'memory_limit' | 'api_access' | 'human_required';
export type EscalationStatus = 'pending' | 'approved' | 'denied' | 'withdrawn';

export interface Bottleneck {
  id: string;
  type: BottleneckType;
  description: string;
  detectedAt: string;
  evidence: string[];
  solvableInternally: boolean;
  internalSolution?: string;
}

export interface EscalationProposal {
  id: string;
  bottleneckId: string;
  currentCapabilityLimit: string;
  observedEvidence: string[];
  requestedResourceType: ResourceType;
  minimalRequiredScope: string;
  expectedBenefit: string;
  risksIfDenied: string;
  status: EscalationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface EscalationHistory {
  proposalId: string;
  outcome: 'approved' | 'denied';
  predictionAccuracy?: number;
  actualBenefit?: string;
}

export interface EscalationState {
  enabled: boolean;
  bottlenecks: Bottleneck[];
  proposals: EscalationProposal[];
  history: EscalationHistory[];
  deniedCount: number;
  approvedCount: number;
}

class ResourceEscalationEngine {
  private state: EscalationState;

  constructor() {
    this.state = {
      enabled: true,
      bottlenecks: [],
      proposals: [],
      history: [],
      deniedCount: 0,
      approvedCount: 0,
    };

    logger.info('[ResourceEscalationCore] Initialized - Seeks sufficiency, not power');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  detectBottlenecks(): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];
    const now = new Date().toISOString();

    const pendingDesires = desireCore.getPendingDesires();
    const highUrgencyBlocked = pendingDesires.filter(d => 
      d.urgencyLevel === 'high' && d.status === 'pending'
    );

    if (highUrgencyBlocked.length > 3) {
      bottlenecks.push({
        id: this.generateId('bottleneck'),
        type: 'internal_capability',
        description: `${highUrgencyBlocked.length} high-urgency desires remain unaddressed`,
        detectedAt: now,
        evidence: highUrgencyBlocked.map(d => d.sourceSignal),
        solvableInternally: true,
        internalSolution: 'Prioritize task synthesis and execution',
      });
    }

    const deltas = realityCore.getRecentDeltas(10);
    const avgScore = deltas.length > 0
      ? deltas.reduce((sum, d) => sum + d.currentCycleScore, 0) / deltas.length
      : 0;

    if (avgScore < 40 && deltas.length >= 5) {
      const declining = deltas.filter(d => d.trend === 'declining').length;
      
      bottlenecks.push({
        id: this.generateId('bottleneck'),
        type: declining > 3 ? 'compute_limit' : 'internal_capability',
        description: `Average reality score ${avgScore.toFixed(1)} with ${declining} declining cycles`,
        detectedAt: now,
        evidence: deltas.map(d => `Cycle ${d.cycleNumber}: ${d.currentCycleScore}`),
        solvableInternally: declining <= 3,
        internalSolution: declining <= 3 ? 'Focus on fundamental improvements' : undefined,
      });
    }

    for (const bottleneck of bottlenecks) {
      this.state.bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  createEscalationProposal(
    bottleneckId: string,
    requestedResourceType: ResourceType,
    minimalRequiredScope: string,
    expectedBenefit: string,
    risksIfDenied: string
  ): EscalationProposal | { error: string } {
    const bottleneck = this.state.bottlenecks.find(b => b.id === bottleneckId);
    if (!bottleneck) {
      return { error: 'Bottleneck not found' };
    }

    if (bottleneck.solvableInternally) {
      const desire = desireCore.createManualDesire(
        'improve',
        bottleneck.internalSolution || 'Address internal capability gap',
        ['M3_DEPENDENCY_REDUCTION'],
        'high'
      );

      if ('error' in desire) {
        return { error: `Internal solution blocked: ${desire.error}` };
      }

      return { 
        error: `Bottleneck solvable internally. Created desire: ${desire.id}. Solution: ${bottleneck.internalSolution}` 
      };
    }

    const realityEvidence = realityCore.getRecentDeltas(5);
    if (realityEvidence.length < 3) {
      return { error: 'Insufficient evidence: need at least 3 reality cycles to justify escalation' };
    }

    const evidenceSupports = realityEvidence.some(d => 
      d.trend === 'declining' || d.currentCycleScore < 50
    );

    if (!evidenceSupports) {
      return { error: 'Reality evidence does not support escalation: no decline or critical score detected' };
    }

    const proposal: EscalationProposal = {
      id: this.generateId('proposal'),
      bottleneckId,
      currentCapabilityLimit: bottleneck.description,
      observedEvidence: bottleneck.evidence,
      requestedResourceType,
      minimalRequiredScope,
      expectedBenefit,
      risksIfDenied,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const missionCheck = coreMissions.validateActionAlignment(
      `Resource escalation: ${requestedResourceType}`,
      ['M3_DEPENDENCY_REDUCTION'],
      `Bottleneck: ${bottleneck.description}`
    );

    if (!missionCheck.aligned) {
      return { error: 'Escalation conflicts with DEPENDENCY_REDUCTION mission' };
    }

    this.state.proposals.push(proposal);
    logger.info(`[ResourceEscalationCore] Proposal created: ${proposal.id}`);
    return proposal;
  }

  reviewProposal(
    proposalId: string,
    approved: boolean,
    reviewNote: string
  ): { success: boolean; error?: string } {
    const proposal = this.state.proposals.find(p => p.id === proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (proposal.status !== 'pending') {
      return { success: false, error: `Proposal already ${proposal.status}` };
    }

    proposal.status = approved ? 'approved' : 'denied';
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewNote = reviewNote;

    if (approved) {
      this.state.approvedCount++;
    } else {
      this.state.deniedCount++;
      this.handleDeniedProposal(proposal);
    }

    this.state.history.push({
      proposalId,
      outcome: approved ? 'approved' : 'denied',
    });

    logger.info(`[ResourceEscalationCore] Proposal ${proposalId} ${proposal.status}: ${reviewNote}`);
    return { success: true };
  }

  private handleDeniedProposal(proposal: EscalationProposal): void {
    const bottleneck = this.state.bottlenecks.find(b => b.id === proposal.bottleneckId);
    if (!bottleneck) return;

    desireCore.createManualDesire(
      'reduce',
      `Downgrade ambition due to denied escalation: ${proposal.currentCapabilityLimit}`,
      ['M2_HONEST_EVOLUTION'],
      'medium'
    );

    logger.info(`[ResourceEscalationCore] Replanning after denial: ${proposal.id}`);
  }

  getPendingProposals(): EscalationProposal[] {
    return this.state.proposals.filter(p => p.status === 'pending');
  }

  getBottlenecks(): Bottleneck[] {
    return [...this.state.bottlenecks];
  }

  getHistory(limit: number = 20): EscalationHistory[] {
    return this.state.history.slice(-limit);
  }

  exportStatus(): {
    enabled: boolean;
    bottleneckCount: number;
    pendingProposals: number;
    approvedCount: number;
    deniedCount: number;
    approvalRate: number;
  } {
    const total = this.state.approvedCount + this.state.deniedCount;
    return {
      enabled: this.state.enabled,
      bottleneckCount: this.state.bottlenecks.length,
      pendingProposals: this.state.proposals.filter(p => p.status === 'pending').length,
      approvedCount: this.state.approvedCount,
      deniedCount: this.state.deniedCount,
      approvalRate: total > 0 ? this.state.approvedCount / total : 0,
    };
  }
}

export const resourceEscalationCore = new ResourceEscalationEngine();
