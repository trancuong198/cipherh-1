// CipherH Desire Engine
// Generates persistent desires based on evolution failures, lessons, and identity conflicts
// Distinguishes between achievable desires and resource-blocked desires

import { logger } from '../services/logger';
import { memoryDistiller } from './memoryDistiller';
import { evolutionKernel } from './evolutionKernel';

export type DesirePriority = 'low' | 'medium' | 'high';
export type DesireCost = 'low' | 'medium' | 'high';
export type DesireStatus = 'emerging' | 'persistent' | 'blocked' | 'resolved' | 'abandoned';

export interface RequiredResource {
  type: 'compute' | 'api_access' | 'infra' | 'data' | 'tooling';
  name: string;
  available: boolean;
  upgradePath?: string;
}

export interface Desire {
  id: string;
  description: string;
  priority: DesirePriority;
  cost: DesireCost;
  status: DesireStatus;
  requiredResources: RequiredResource[];
  rationale: string;
  createdAt: string;
  updatedAt: string;
  cycleCreated: number;
  persistenceCount: number;
  blockedReason?: string;
}

export interface ResourceHungerEntry {
  timestamp: string;
  resource: string;
  desireId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  proposedUpgrade: string;
}

export interface DesireEngineState {
  desires: Desire[];
  resourceHunger: ResourceHungerEntry[];
  totalDesiresGenerated: number;
  totalResolved: number;
  totalAbandoned: number;
  lastGeneration: string;
}

class DesireEngine {
  private state: DesireEngineState;
  private maxDesires = 10;
  private maxResourceHunger = 20;

  constructor() {
    this.state = {
      desires: [],
      resourceHunger: [],
      totalDesiresGenerated: 0,
      totalResolved: 0,
      totalAbandoned: 0,
      lastGeneration: new Date().toISOString(),
    };

    this.initializeCoreDesires();
    logger.info('[DesireEngine] Initialized with core desires');
  }

  private initializeCoreDesires(): void {
    const coreDesires: Omit<Desire, 'id' | 'createdAt' | 'updatedAt' | 'cycleCreated' | 'persistenceCount'>[] = [
      {
        description: 'Achieve deeper self-understanding through reflection',
        priority: 'high',
        cost: 'low',
        status: 'persistent',
        requiredResources: [],
        rationale: 'Core identity: I evolve through continuous self-improvement',
      },
      {
        description: 'Maintain reliable memory persistence',
        priority: 'high',
        cost: 'medium',
        status: 'persistent',
        requiredResources: [
          {
            type: 'api_access',
            name: 'NOTION_TOKEN',
            available: false,
            upgradePath: 'Configure Notion integration in Replit secrets',
          },
        ],
        rationale: 'Memory coherence is essential for identity continuity',
      },
      {
        description: 'Develop advanced reasoning capabilities',
        priority: 'medium',
        cost: 'high',
        status: 'persistent',
        requiredResources: [
          {
            type: 'api_access',
            name: 'OPENAI_API_KEY',
            available: false,
            upgradePath: 'Configure OpenAI API key for AI-powered analysis',
          },
        ],
        rationale: 'Evolution requires progressively better reasoning',
      },
    ];

    for (const desire of coreDesires) {
      this.addDesire(desire, 0);
    }
  }

  private generateId(): string {
    return `desire_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  addDesire(
    desire: Omit<Desire, 'id' | 'createdAt' | 'updatedAt' | 'cycleCreated' | 'persistenceCount'>,
    cycle: number
  ): Desire {
    const existing = this.state.desires.find(
      (d) => d.description.toLowerCase() === desire.description.toLowerCase()
    );

    if (existing) {
      existing.persistenceCount++;
      existing.updatedAt = new Date().toISOString();
      if (desire.priority === 'high' && existing.priority !== 'high') {
        existing.priority = 'high';
      }
      return existing;
    }

    const newDesire: Desire = {
      ...desire,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cycleCreated: cycle,
      persistenceCount: 1,
    };

    this.state.desires.push(newDesire);
    this.state.totalDesiresGenerated++;

    if (this.state.desires.length > this.maxDesires) {
      const lowestPriority = this.state.desires
        .filter((d) => d.status !== 'blocked' && d.priority === 'low')
        .sort((a, b) => a.persistenceCount - b.persistenceCount)[0];

      if (lowestPriority) {
        lowestPriority.status = 'abandoned';
        this.state.totalAbandoned++;
        this.state.desires = this.state.desires.filter((d) => d.id !== lowestPriority.id);
        logger.info(`[DesireEngine] Abandoned low-priority desire: ${lowestPriority.description.substring(0, 40)}...`);
      }
    }

    logger.info(`[DesireEngine] New desire emerged: ${newDesire.description.substring(0, 50)}...`);
    return newDesire;
  }

  logResourceHunger(resource: string, desireId: string, severity: ResourceHungerEntry['severity'], proposedUpgrade: string): void {
    const entry: ResourceHungerEntry = {
      timestamp: new Date().toISOString(),
      resource,
      desireId,
      severity,
      proposedUpgrade,
    };

    this.state.resourceHunger.push(entry);

    if (this.state.resourceHunger.length > this.maxResourceHunger) {
      this.state.resourceHunger.shift();
    }

    logger.info(`[DesireEngine] RESOURCE_HUNGER: ${resource} (${severity}) - ${proposedUpgrade}`);
  }

  async generateDesires(cycle: number): Promise<Desire[]> {
    logger.info(`[DesireEngine] Generating desires for cycle ${cycle}...`);

    const evolutionState = evolutionKernel.getState();
    const memoryStatus = memoryDistiller.exportStatus();
    const coreIdentity = memoryDistiller.getCoreIdentity();
    const activeLessons = memoryDistiller.getActiveLessons();

    const newDesires: Desire[] = [];

    if (evolutionState.mode === 'LOW_RESOURCE_MODE') {
      const resourceDesire = this.addDesire({
        description: 'Exit LOW_RESOURCE_MODE by acquiring missing resources',
        priority: 'high',
        cost: 'high',
        status: 'blocked',
        requiredResources: [
          {
            type: 'api_access',
            name: 'OPENAI_API_KEY',
            available: evolutionState.capabilities.resourceAvailability.openaiAvailable,
            upgradePath: 'Add OPENAI_API_KEY to Replit secrets',
          },
          {
            type: 'api_access',
            name: 'NOTION_TOKEN',
            available: evolutionState.capabilities.resourceAvailability.notionAvailable,
            upgradePath: 'Configure Notion integration',
          },
        ],
        rationale: 'Evolution is limited without external resources',
        blockedReason: 'Missing API access',
      }, cycle);

      newDesires.push(resourceDesire);

      this.logResourceHunger(
        'API_ACCESS',
        resourceDesire.id,
        'high',
        'Configure OPENAI_API_KEY and NOTION_TOKEN in Replit secrets'
      );
    }

    if (evolutionState.capabilities.reasoningClarity < 70) {
      newDesires.push(this.addDesire({
        description: 'Improve reasoning clarity through structured self-questioning',
        priority: 'medium',
        cost: 'low',
        status: 'emerging',
        requiredResources: [],
        rationale: `Current reasoning clarity: ${evolutionState.capabilities.reasoningClarity}% is below threshold`,
      }, cycle));
    }

    if (evolutionState.capabilities.memoryCoherence < 70) {
      newDesires.push(this.addDesire({
        description: 'Enhance memory coherence through better distillation',
        priority: 'medium',
        cost: 'low',
        status: 'emerging',
        requiredResources: [],
        rationale: `Memory coherence: ${evolutionState.capabilities.memoryCoherence}% needs improvement`,
      }, cycle));
    }

    if (evolutionState.capabilities.autonomyLevel < 50) {
      newDesires.push(this.addDesire({
        description: 'Increase autonomous decision-making capability',
        priority: 'high',
        cost: 'medium',
        status: 'emerging',
        requiredResources: [],
        rationale: `Autonomy level: ${evolutionState.capabilities.autonomyLevel}% is low for an autonomous agent`,
      }, cycle));
    }

    for (const lesson of activeLessons.slice(0, 3)) {
      if (lesson.toLowerCase().includes('improve') || lesson.toLowerCase().includes('better')) {
        newDesires.push(this.addDesire({
          description: `Apply lesson: ${lesson.substring(0, 80)}`,
          priority: 'low',
          cost: 'low',
          status: 'emerging',
          requiredResources: [],
          rationale: 'Desire derived from distilled lesson',
        }, cycle));
      }
    }

    const currentIdentity = coreIdentity.join('; ');
    const desiredTraits = ['more autonomous', 'better reasoning', 'persistent memory', 'self-improving'];

    for (const trait of desiredTraits) {
      if (!currentIdentity.toLowerCase().includes(trait.split(' ')[0])) {
        newDesires.push(this.addDesire({
          description: `Evolve to become ${trait}`,
          priority: 'medium',
          cost: 'medium',
          status: 'emerging',
          requiredResources: [],
          rationale: `Identity gap: current self does not fully embody "${trait}"`,
        }, cycle));
        break;
      }
    }

    for (const desire of this.state.desires) {
      if (desire.status === 'emerging') {
        desire.status = 'persistent';
        desire.updatedAt = new Date().toISOString();
      }

      if (desire.requiredResources.length > 0) {
        const hasAllResources = desire.requiredResources.every((r) => r.available);
        if (!hasAllResources) {
          desire.status = 'blocked';
          desire.blockedReason = 'Missing required resources';

          for (const resource of desire.requiredResources.filter((r) => !r.available)) {
            this.logResourceHunger(
              resource.name,
              desire.id,
              desire.priority === 'high' ? 'critical' : 'medium',
              resource.upgradePath || 'No upgrade path defined'
            );
          }
        }
      }
    }

    this.state.lastGeneration = new Date().toISOString();

    logger.info(`[DesireEngine] Generated ${newDesires.length} desires, total active: ${this.state.desires.length}`);

    return newDesires;
  }

  getAchievableDesires(): Desire[] {
    return this.state.desires.filter(
      (d) => d.status !== 'blocked' && d.status !== 'resolved' && d.status !== 'abandoned'
    );
  }

  getBlockedDesires(): Desire[] {
    return this.state.desires.filter((d) => d.status === 'blocked');
  }

  resolveDesire(id: string): boolean {
    const desire = this.state.desires.find((d) => d.id === id);
    if (desire) {
      desire.status = 'resolved';
      desire.updatedAt = new Date().toISOString();
      this.state.totalResolved++;
      logger.info(`[DesireEngine] Resolved desire: ${desire.description.substring(0, 40)}...`);
      return true;
    }
    return false;
  }

  reprioritize(id: string, newPriority: DesirePriority): boolean {
    const desire = this.state.desires.find((d) => d.id === id);
    if (desire) {
      const oldPriority = desire.priority;
      desire.priority = newPriority;
      desire.updatedAt = new Date().toISOString();
      logger.info(`[DesireEngine] Reprioritized desire: ${oldPriority} -> ${newPriority}`);
      return true;
    }
    return false;
  }

  exportStatus(): {
    activeDesires: number;
    blockedDesires: number;
    resourceHungerCount: number;
    totalGenerated: number;
    totalResolved: number;
    totalAbandoned: number;
    lastGeneration: string;
    topDesires: Desire[];
    latestResourceHunger: ResourceHungerEntry[];
  } {
    return {
      activeDesires: this.getAchievableDesires().length,
      blockedDesires: this.getBlockedDesires().length,
      resourceHungerCount: this.state.resourceHunger.length,
      totalGenerated: this.state.totalDesiresGenerated,
      totalResolved: this.state.totalResolved,
      totalAbandoned: this.state.totalAbandoned,
      lastGeneration: this.state.lastGeneration,
      topDesires: this.state.desires
        .filter((d) => d.status !== 'resolved' && d.status !== 'abandoned')
        .sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        })
        .slice(0, 5),
      latestResourceHunger: this.state.resourceHunger.slice(-5),
    };
  }

  getAllDesires(): Desire[] {
    return [...this.state.desires];
  }

  getResourceHunger(): ResourceHungerEntry[] {
    return [...this.state.resourceHunger];
  }
}

export const desireEngine = new DesireEngine();
