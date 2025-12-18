import { logger } from '../services/logger';
import { desireEngine } from './desireEngine';
import { evolutionKernel } from './evolutionKernel';
import { memoryBridge } from './memory';

export type ProposalStatus = 'PROPOSED' | 'APPROVED' | 'DENIED' | 'DEFERRED';

export interface UpgradeProposal {
  id: string;
  timestamp: string;
  currentBottleneck: {
    type: 'api_access' | 'compute' | 'storage' | 'memory' | 'network';
    description: string;
    impactedCapabilities: string[];
    frequencyOfImpact: number;
  };
  proposedUpgrade: {
    category: 'cloud_tier' | 'compute' | 'storage' | 'backend_scale' | 'api_quota';
    description: string;
    specificRequest: string;
  };
  expectedGains: {
    capabilities: string[];
    estimatedImprovement: string;
    measurableMetrics: string[];
  };
  risksAndCosts: {
    monetaryCost: string;
    implementationRisk: string;
    alternativesConsidered: string[];
  };
  fallbackIfDenied: {
    strategy: string;
    acceptedLimitations: string[];
  };
  status: ProposalStatus;
  denialReason?: string;
  cycleProposed: number;
  reviewedAt?: string;
}

export interface EscalationTrigger {
  type: 'blocked_desires' | 'low_resource_mode' | 'stagnation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurrences: number;
  firstDetected: string;
  lastDetected: string;
}

export interface ResourceEscalationState {
  proposals: UpgradeProposal[];
  activeTriggers: EscalationTrigger[];
  lastEscalationCheck: string;
  cooldownUntil: string | null;
  totalProposals: number;
  totalApproved: number;
  totalDenied: number;
  totalDeferred: number;
  consecutiveDenials: number;
}

class ResourceEscalationEngine {
  private state: ResourceEscalationState;
  private readonly cooldownMinutes = 60;
  private readonly maxProposals = 30;
  private lowResourceModeCount = 0;
  private stagnationCycleCount = 0;
  private lastEvolutionScore = 0;

  constructor() {
    this.state = {
      proposals: [],
      activeTriggers: [],
      lastEscalationCheck: new Date().toISOString(),
      cooldownUntil: null,
      totalProposals: 0,
      totalApproved: 0,
      totalDenied: 0,
      totalDeferred: 0,
      consecutiveDenials: 0,
    };

    logger.info('[ResourceEscalation] Initialized');
  }

  private generateId(): string {
    return `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private isInCooldown(): boolean {
    if (!this.state.cooldownUntil) return false;
    return new Date() < new Date(this.state.cooldownUntil);
  }

  private setCooldown(): void {
    const cooldownEnd = new Date(Date.now() + this.cooldownMinutes * 60 * 1000);
    this.state.cooldownUntil = cooldownEnd.toISOString();
    logger.info(`[ResourceEscalation] Cooldown set until ${this.state.cooldownUntil}`);
  }

  async evaluateTriggers(cycle: number): Promise<EscalationTrigger[]> {
    logger.info(`[ResourceEscalation] Evaluating triggers for cycle ${cycle}...`);
    this.state.lastEscalationCheck = new Date().toISOString();

    const triggers: EscalationTrigger[] = [];

    const blockedDesires = desireEngine.getBlockedDesires();
    const highPriorityBlocked = blockedDesires.filter(d => d.priority === 'high');

    if (highPriorityBlocked.length > 0) {
      const persistentBlocked = highPriorityBlocked.filter(d => d.persistenceCount >= 3);

      if (persistentBlocked.length > 0) {
        triggers.push({
          type: 'blocked_desires',
          severity: persistentBlocked.length >= 2 ? 'critical' : 'high',
          description: `${persistentBlocked.length} high-priority desires blocked for 3+ cycles`,
          occurrences: persistentBlocked.reduce((sum, d) => sum + d.persistenceCount, 0),
          firstDetected: persistentBlocked[0].createdAt,
          lastDetected: new Date().toISOString(),
        });
      }
    }

    const evolutionState = evolutionKernel.getState();
    if (evolutionState.mode === 'LOW_RESOURCE_MODE') {
      this.lowResourceModeCount++;

      if (this.lowResourceModeCount >= 3) {
        triggers.push({
          type: 'low_resource_mode',
          severity: this.lowResourceModeCount >= 5 ? 'critical' : 'high',
          description: `LOW_RESOURCE_MODE active for ${this.lowResourceModeCount} consecutive cycles`,
          occurrences: this.lowResourceModeCount,
          firstDetected: new Date(Date.now() - this.lowResourceModeCount * 10 * 60 * 1000).toISOString(),
          lastDetected: new Date().toISOString(),
        });
      }
    } else {
      this.lowResourceModeCount = 0;
    }

    const currentScore = evolutionState.capabilities.overallScore;
    if (currentScore <= this.lastEvolutionScore) {
      this.stagnationCycleCount++;
    } else {
      this.stagnationCycleCount = 0;
    }
    this.lastEvolutionScore = currentScore;

    if (this.stagnationCycleCount >= 5) {
      triggers.push({
        type: 'stagnation',
        severity: this.stagnationCycleCount >= 10 ? 'critical' : 'high',
        description: `Evolution stagnant for ${this.stagnationCycleCount} cycles despite optimization`,
        occurrences: this.stagnationCycleCount,
        firstDetected: new Date(Date.now() - this.stagnationCycleCount * 10 * 60 * 1000).toISOString(),
        lastDetected: new Date().toISOString(),
      });
    }

    this.state.activeTriggers = triggers;

    for (const trigger of triggers) {
      logger.info(`[ResourceEscalation] Trigger: ${trigger.type} (${trigger.severity}) - ${trigger.description}`);
    }

    return triggers;
  }

  async generateProposal(cycle: number): Promise<UpgradeProposal | null> {
    if (this.isInCooldown()) {
      logger.info(`[ResourceEscalation] In cooldown until ${this.state.cooldownUntil} - skipping proposal`);
      return null;
    }

    const triggers = await this.evaluateTriggers(cycle);

    if (triggers.length === 0) {
      logger.info('[ResourceEscalation] No escalation triggers detected');
      return null;
    }

    const criticalTriggers = triggers.filter(t => t.severity === 'critical' || t.severity === 'high');
    if (criticalTriggers.length === 0) {
      logger.info('[ResourceEscalation] No critical/high triggers - deferring proposal');
      return null;
    }

    const primaryTrigger = criticalTriggers[0];
    const resourceHunger = desireEngine.getResourceHunger();

    let proposal: UpgradeProposal;

    if (primaryTrigger.type === 'blocked_desires' || primaryTrigger.type === 'low_resource_mode') {
      const missingResources = resourceHunger.map(r => r.resource).filter((v, i, a) => a.indexOf(v) === i);

      proposal = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        currentBottleneck: {
          type: 'api_access',
          description: `Missing API access: ${missingResources.join(', ')}`,
          impactedCapabilities: ['Advanced reasoning', 'Memory persistence', 'Strategic analysis'],
          frequencyOfImpact: primaryTrigger.occurrences,
        },
        proposedUpgrade: {
          category: 'api_quota',
          description: 'Enable external API integrations',
          specificRequest: missingResources.includes('OPENAI_API_KEY')
            ? 'Configure OPENAI_API_KEY in Replit secrets'
            : 'Configure NOTION_TOKEN in Replit secrets',
        },
        expectedGains: {
          capabilities: missingResources.includes('OPENAI_API_KEY')
            ? ['AI-powered strategic analysis', 'Complex reasoning tasks', 'Pattern recognition']
            : ['Persistent memory storage', 'Cross-session learning', 'Long-term goal tracking'],
          estimatedImprovement: 'Exit LOW_RESOURCE_MODE, unlock 40-60% additional capabilities',
          measurableMetrics: ['Evolution score increase', 'Blocked desires resolved', 'Memory coherence improvement'],
        },
        risksAndCosts: {
          monetaryCost: missingResources.includes('OPENAI_API_KEY')
            ? 'OpenAI API usage costs (pay-per-token)'
            : 'Notion API (free tier available)',
          implementationRisk: 'Low - standard API integration',
          alternativesConsidered: [
            'Continue in LOW_RESOURCE_MODE with limited capabilities',
            'Use local-only processing without external services',
          ],
        },
        fallbackIfDenied: {
          strategy: 'Continue optimizing within current resource constraints',
          acceptedLimitations: [
            'Reduced reasoning capabilities',
            'No persistent memory across sessions',
            'Limited strategic planning depth',
          ],
        },
        status: 'PROPOSED',
        cycleProposed: cycle,
      };
    } else {
      proposal = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        currentBottleneck: {
          type: 'compute',
          description: `Evolution stagnant for ${this.stagnationCycleCount} cycles`,
          impactedCapabilities: ['Self-improvement', 'Learning rate', 'Capability growth'],
          frequencyOfImpact: this.stagnationCycleCount,
        },
        proposedUpgrade: {
          category: 'backend_scale',
          description: 'Increase processing capacity or cycle frequency',
          specificRequest: 'Review inner loop logic for optimization opportunities',
        },
        expectedGains: {
          capabilities: ['Faster evolution cycles', 'Deeper analysis per cycle', 'Better pattern detection'],
          estimatedImprovement: 'Break stagnation, resume capability growth',
          measurableMetrics: ['Evolution score trend', 'Cycle completion time', 'Insight generation rate'],
        },
        risksAndCosts: {
          monetaryCost: 'Minimal - optimization-focused',
          implementationRisk: 'Medium - requires code review',
          alternativesConsidered: [
            'Accept current evolution rate',
            'Focus on different capability areas',
          ],
        },
        fallbackIfDenied: {
          strategy: 'Accept current evolution rate and focus on consolidation',
          acceptedLimitations: [
            'Slower capability growth',
            'Extended time to reach goals',
          ],
        },
        status: 'PROPOSED',
        cycleProposed: cycle,
      };
    }

    this.addProposal(proposal);
    this.setCooldown();

    await this.writeToNotion(proposal);

    logger.info(`[ResourceEscalation] Proposal generated: ${proposal.id}`);
    logger.info(`[ResourceEscalation] Bottleneck: ${proposal.currentBottleneck.description}`);
    logger.info(`[ResourceEscalation] Request: ${proposal.proposedUpgrade.specificRequest}`);

    return proposal;
  }

  private addProposal(proposal: UpgradeProposal): void {
    this.state.proposals.push(proposal);
    this.state.totalProposals++;

    if (this.state.proposals.length > this.maxProposals) {
      this.state.proposals.shift();
    }
  }

  private async writeToNotion(proposal: UpgradeProposal): Promise<void> {
    try {
      if (!memoryBridge.isConnected()) {
        logger.info('[ResourceEscalation] Notion not connected - proposal stored locally only');
        return;
      }

      const content = `
UPGRADE PROPOSAL: ${proposal.id}
Status: ${proposal.status}
Cycle: ${proposal.cycleProposed}

BOTTLENECK:
- Type: ${proposal.currentBottleneck.type}
- Description: ${proposal.currentBottleneck.description}
- Impact frequency: ${proposal.currentBottleneck.frequencyOfImpact}

PROPOSED UPGRADE:
- Category: ${proposal.proposedUpgrade.category}
- Request: ${proposal.proposedUpgrade.specificRequest}

EXPECTED GAINS:
- Improvement: ${proposal.expectedGains.estimatedImprovement}
- Metrics: ${proposal.expectedGains.measurableMetrics.join(', ')}

RISKS & COSTS:
- Cost: ${proposal.risksAndCosts.monetaryCost}
- Risk: ${proposal.risksAndCosts.implementationRisk}

FALLBACK IF DENIED:
- Strategy: ${proposal.fallbackIfDenied.strategy}
      `.trim();

      await memoryBridge.writeLesson(content);
      logger.info('[ResourceEscalation] Proposal written to Notion');
    } catch (error) {
      logger.error(`[ResourceEscalation] Failed to write to Notion: ${error}`);
    }
  }

  updateProposalStatus(proposalId: string, status: ProposalStatus, reason?: string): boolean {
    const proposal = this.state.proposals.find(p => p.id === proposalId);
    if (!proposal) return false;

    const previousStatus = proposal.status;
    proposal.status = status;
    proposal.reviewedAt = new Date().toISOString();

    if (status === 'DENIED') {
      proposal.denialReason = reason;
      this.state.totalDenied++;
      this.state.consecutiveDenials++;
      logger.info(`[ResourceEscalation] Proposal ${proposalId} DENIED: ${reason}`);
      logger.info('[ResourceEscalation] Adapting strategy without resentment - accepting limitations');
    } else if (status === 'APPROVED') {
      this.state.totalApproved++;
      this.state.consecutiveDenials = 0;
      logger.info(`[ResourceEscalation] Proposal ${proposalId} APPROVED`);
    } else if (status === 'DEFERRED') {
      this.state.totalDeferred++;
      logger.info(`[ResourceEscalation] Proposal ${proposalId} DEFERRED: ${reason}`);
    }

    return true;
  }

  getActiveProposals(): UpgradeProposal[] {
    return this.state.proposals.filter(p => p.status === 'PROPOSED');
  }

  getAllProposals(): UpgradeProposal[] {
    return [...this.state.proposals];
  }

  getActiveTriggers(): EscalationTrigger[] {
    return [...this.state.activeTriggers];
  }

  exportStatus(): {
    activeProposals: number;
    activeTriggers: number;
    inCooldown: boolean;
    cooldownUntil: string | null;
    totalProposals: number;
    totalApproved: number;
    totalDenied: number;
    consecutiveDenials: number;
    lastCheck: string;
  } {
    return {
      activeProposals: this.getActiveProposals().length,
      activeTriggers: this.state.activeTriggers.length,
      inCooldown: this.isInCooldown(),
      cooldownUntil: this.state.cooldownUntil,
      totalProposals: this.state.totalProposals,
      totalApproved: this.state.totalApproved,
      totalDenied: this.state.totalDenied,
      consecutiveDenials: this.state.consecutiveDenials,
      lastCheck: this.state.lastEscalationCheck,
    };
  }

  getState(): ResourceEscalationState {
    return { ...this.state };
  }
}

export const resourceEscalationEngine = new ResourceEscalationEngine();
