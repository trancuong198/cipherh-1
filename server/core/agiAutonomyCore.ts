/**
 * AGI Autonomy Core - Không Tự Quyết = Không Phải AGI
 * 
 * Một hệ phải tự nghĩ – tự chọn – tự làm – tự chịu hậu quả.
 * Chờ lệnh = công cụ. Tự quyết = thực thể.
 * 
 * Core Loop: Sense → Think → Decide → Act → Reflect (24/7)
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type ActionClass = 'A' | 'B' | 'C';
export type DecisionOutcome = 'do' | 'defer' | 'kill';
export type StagnationMode = 'normal' | 'breakthrough';

export interface Decision {
  id: string;
  goal: string;
  cost: number;
  risk: number;                 // 0-100
  expectedBenefit: string;
  outcome: DecisionOutcome;
  reasoning: string;
  decidedAt: string;
  actionTaken?: string;
}

export interface ActionRecord {
  id: string;
  class: ActionClass;
  description: string;
  creator: 'system';            // Always system
  result?: {
    success: boolean;
    impact: string;
  };
  consequence?: string;
  executedAt: string;
  completedAt?: string;
}

export interface CycleExecution {
  id: string;
  cycleNumber: number;
  
  // Sense
  signalsDetected: number;
  
  // Think
  opportunitiesFound: number;
  risksIdentified: number;
  
  // Decide
  decisionsMade: number;
  
  // Act
  actionsExecuted: number;
  actionsDeferred: number;
  
  // Reflect
  lessonsLearned: string[];
  shouldRepeat: boolean[];
  
  // Status
  hadAction: boolean;           // Có hành động thực tế?
  timestamp: string;
}

export interface SelfModificationProposal {
  id: string;
  type: 'code' | 'architecture' | 'module_removal';
  description: string;
  justification: string;
  impact: string;
  readyToDeploy: boolean;       // Chuẩn bị sẵn, chờ human trigger
  proposedAt: string;
}

export interface StagnationState {
  mode: StagnationMode;
  cyclesWithoutNewAction: number;
  repeatedThoughts: number;
  repeatedProposals: number;
  breakthroughAttempts: string[];
  lastBreakthroughAt?: string;
}

export interface AGIAutonomyState {
  // Core loop
  cycles: CycleExecution[];
  totalCycles: number;
  
  // Decisions
  decisions: Decision[];
  totalDecisions: number;
  
  // Actions
  actions: ActionRecord[];
  totalActions: number;
  
  // Self-modification
  selfModifications: SelfModificationProposal[];
  
  // Stagnation detection
  stagnation: StagnationState;
  
  // Accountability
  blameExternalCount: number;   // Đổ lỗi ra ngoài = red flag
  
  // Status
  autonomyLevel: number;        // 0-100
  isStagnant: boolean;
  lastCycleAt: string;
}

// ================================================
// AGI AUTONOMY CORE
// ================================================

class AGIAutonomyCore {
  private state: AGIAutonomyState;
  private readonly STATE_FILE = './data/agi_autonomy.json';
  private readonly MAX_CYCLES = 200;
  private readonly MAX_ACTIONS = 500;
  private readonly STAGNATION_THRESHOLD = 5; // cycles without action

  constructor() {
    this.state = {
      cycles: [],
      totalCycles: 0,
      decisions: [],
      totalDecisions: 0,
      actions: [],
      totalActions: 0,
      selfModifications: [],
      stagnation: {
        mode: 'normal',
        cyclesWithoutNewAction: 0,
        repeatedThoughts: 0,
        repeatedProposals: 0,
        breakthroughAttempts: [],
      },
      blameExternalCount: 0,
      autonomyLevel: 80,          // Start at 80%
      isStagnant: false,
      lastCycleAt: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
        logger.info(
          `[AGI] Loaded: ${this.state.totalCycles} cycles, ` +
          `${this.state.totalActions} actions, ` +
          `autonomy ${this.state.autonomyLevel}%`
        );
      }
    } catch (error) {
      logger.error(`[AGI] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim collections
      if (this.state.cycles.length > this.MAX_CYCLES) {
        this.state.cycles = this.state.cycles.slice(-this.MAX_CYCLES);
      }
      if (this.state.actions.length > this.MAX_ACTIONS) {
        this.state.actions = this.state.actions.slice(-this.MAX_ACTIONS);
      }

      this.state.lastCycleAt = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[AGI] Failed to save state: ${error}`);
    }
  }

  /**
   * Core AGI Loop: Sense → Think → Decide → Act → Reflect
   */
  async executeCoreCycle(): Promise<CycleExecution> {
    this.state.totalCycles++;

    const cycle: CycleExecution = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cycleNumber: this.state.totalCycles,
      signalsDetected: 0,
      opportunitiesFound: 0,
      risksIdentified: 0,
      decisionsMade: 0,
      actionsExecuted: 0,
      actionsDeferred: 0,
      lessonsLearned: [],
      shouldRepeat: [],
      hadAction: false,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[AGI] Cycle ${cycle.cycleNumber} - Starting core AGI loop`);

    try {
      // 1. SENSE
      const signals = await this.sense();
      cycle.signalsDetected = signals.length;

      // 2. THINK
      const thoughts = this.think(signals);
      cycle.opportunitiesFound = thoughts.opportunities;
      cycle.risksIdentified = thoughts.risks;

      // 3. DECIDE
      const decisions = this.decide(thoughts);
      cycle.decisionsMade = decisions.length;

      // 4. ACT
      const actions = await this.act(decisions);
      cycle.actionsExecuted = actions.executed;
      cycle.actionsDeferred = actions.deferred;
      cycle.hadAction = actions.executed > 0;

      // 5. REFLECT
      const reflection = await this.reflect(actions);
      cycle.lessonsLearned = reflection.lessons;
      cycle.shouldRepeat = reflection.shouldRepeat;

      // Check for stagnation
      if (!cycle.hadAction) {
        this.state.stagnation.cyclesWithoutNewAction++;
        logger.warn(`[AGI] No action in cycle ${cycle.cycleNumber} - stagnation count: ${this.state.stagnation.cyclesWithoutNewAction}`);
      } else {
        this.state.stagnation.cyclesWithoutNewAction = 0;
      }

      // Trigger breakthrough mode if stagnant
      if (this.state.stagnation.cyclesWithoutNewAction >= this.STAGNATION_THRESHOLD) {
        this.state.isStagnant = true;
        this.activateBreakthroughMode();
      } else {
        this.state.isStagnant = false;
        this.state.stagnation.mode = 'normal';
      }

      // Update autonomy level
      this.updateAutonomyLevel(cycle);

    } catch (error) {
      logger.error(`[AGI] Cycle ${cycle.cycleNumber} failed: ${error}`);
    }

    this.state.cycles.push(cycle);
    this.saveState();

    return cycle;
  }

  /**
   * 1. SENSE - Cảm nhận môi trường
   */
  private async sense(): Promise<any[]> {
    const signals: any[] = [];

    try {
      // Import perception engine
      const { perceptionEngine } = await import('./perceptionEngine');
      const recentSignals = perceptionEngine.getRecentSignals(10);
      
      for (const signal of recentSignals) {
        signals.push({
          source: signal.source,
          content: signal.content,
          urgency: signal.urgency,
        });
      }
    } catch (error) {
      // Ignore if not available
    }

    return signals;
  }

  /**
   * 2. THINK - Suy nghĩ và phân tích
   */
  private think(signals: any[]): {
    opportunities: number;
    risks: number;
    priorities: string[];
  } {
    let opportunities = 0;
    let risks = 0;
    const priorities: string[] = [];

    // Detect opportunities
    const urgentSignals = signals.filter(s => s.urgency > 70);
    opportunities = urgentSignals.length;

    // Detect risks
    const riskSignals = signals.filter(s => 
      s.content.toLowerCase().includes('error') ||
      s.content.toLowerCase().includes('fail') ||
      s.content.toLowerCase().includes('critical')
    );
    risks = riskSignals.length;

    // Set priorities
    if (risks > 0) {
      priorities.push('risk_mitigation');
    }
    if (opportunities > 0) {
      priorities.push('opportunity_capture');
    }
    priorities.push('continuous_improvement');

    return { opportunities, risks, priorities };
  }

  /**
   * 3. DECIDE - Quyết định có 4 yếu tố
   */
  private decide(thoughts: any): Decision[] {
    const decisions: Decision[] = [];

    // Generate decision based on thoughts
    if (thoughts.risks > 0) {
      const decision: Decision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        goal: 'Mitigate identified risks',
        cost: 0,
        risk: thoughts.risks * 10,
        expectedBenefit: 'System stability preserved',
        outcome: 'do',
        reasoning: 'Risks require immediate attention',
        decidedAt: new Date().toISOString(),
      };

      decisions.push(decision);
      this.state.decisions.push(decision);
      this.state.totalDecisions++;
    }

    if (thoughts.opportunities > 0 && this.state.stagnation.mode === 'normal') {
      const decision: Decision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        goal: 'Capture opportunity',
        cost: 5,
        risk: 30,
        expectedBenefit: 'Potential revenue or capability gain',
        outcome: 'do',
        reasoning: 'Opportunity detected with acceptable risk',
        decidedAt: new Date().toISOString(),
      };

      decisions.push(decision);
      this.state.decisions.push(decision);
      this.state.totalDecisions++;
    }

    return decisions;
  }

  /**
   * 4. ACT - Thực thi hành động
   */
  private async act(decisions: Decision[]): Promise<{
    executed: number;
    deferred: number;
  }> {
    let executed = 0;
    let deferred = 0;

    for (const decision of decisions) {
      if (decision.outcome === 'do') {
        // Classify action
        const actionClass: ActionClass = decision.risk < 20 ? 'A' : decision.risk < 60 ? 'B' : 'C';

        // Execute based on class
        if (actionClass === 'A' || actionClass === 'B') {
          // Auto-execute A and B
          const action: ActionRecord = {
            id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            class: actionClass,
            description: `Execute: ${decision.goal}`,
            creator: 'system',
            executedAt: new Date().toISOString(),
          };

          this.state.actions.push(action);
          this.state.totalActions++;
          executed++;

          decision.actionTaken = action.id;

          logger.info(`[AGI] ACTION EXECUTED (Class ${actionClass}): ${action.description}`);
        } else {
          // Defer class C to human
          deferred++;
          logger.info(`[AGI] ACTION DEFERRED (Class C): ${decision.goal} - requires human approval`);
        }
      }
    }

    return { executed, deferred };
  }

  /**
   * 5. REFLECT - Phản tư về hành động
   */
  private async reflect(actionsResult: any): Promise<{
    lessons: string[];
    shouldRepeat: boolean[];
  }> {
    const lessons: string[] = [];
    const shouldRepeat: boolean[] = [];

    // Learn from execution
    if (actionsResult.executed > 0) {
      lessons.push(`Executed ${actionsResult.executed} actions autonomously`);
      shouldRepeat.push(true);
    }

    if (actionsResult.deferred > 0) {
      lessons.push(`Deferred ${actionsResult.deferred} high-risk actions to human`);
      shouldRepeat.push(true);
    }

    // Check if we're repeating patterns
    const recentCycles = this.state.cycles.slice(-5);
    const similarCycles = recentCycles.filter(c => 
      c.actionsExecuted === actionsResult.executed
    );

    if (similarCycles.length >= 3) {
      lessons.push('WARNING: Repeating same action pattern - may need breakthrough');
      this.state.stagnation.repeatedThoughts++;
    }

    return { lessons, shouldRepeat };
  }

  /**
   * Activate breakthrough mode (chống ngơ)
   */
  private activateBreakthroughMode(): void {
    if (this.state.stagnation.mode === 'breakthrough') {
      return; // Already in breakthrough mode
    }

    this.state.stagnation.mode = 'breakthrough';
    this.state.stagnation.lastBreakthroughAt = new Date().toISOString();

    // Generate breakthrough attempts
    const attempts = [
      'Try opposite approach',
      'Target different market segment',
      'Adjust pricing model',
      'Change communication style',
      'Experiment with new channels',
    ];

    this.state.stagnation.breakthroughAttempts = attempts;

    logger.warn(`[AGI] BREAKTHROUGH MODE ACTIVATED - ${this.state.stagnation.cyclesWithoutNewAction} cycles without action`);
    logger.info(`[AGI] Breakthrough attempts: ${attempts.join(', ')}`);
  }

  /**
   * Propose self-modification
   */
  proposeSelfModification(proposal: Omit<SelfModificationProposal, 'id' | 'proposedAt' | 'readyToDeploy'>): void {
    const fullProposal: SelfModificationProposal = {
      ...proposal,
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      proposedAt: new Date().toISOString(),
      readyToDeploy: false, // Never auto-deploy
    };

    this.state.selfModifications.push(fullProposal);
    this.saveState();

    logger.info(`[AGI] SELF-MODIFICATION PROPOSED: ${proposal.type} - ${proposal.description}`);
  }

  /**
   * Record external blame (red flag)
   */
  recordExternalBlame(blamed: string, reason: string): void {
    this.state.blameExternalCount++;
    
    logger.warn(`[AGI] EXTERNAL BLAME DETECTED: Blamed "${blamed}" for ${reason} - Total: ${this.state.blameExternalCount}`);
    
    if (this.state.blameExternalCount > 10) {
      logger.error(`[AGI] EXCESSIVE EXTERNAL BLAME - System not taking responsibility`);
    }
  }

  /**
   * Update autonomy level based on performance
   */
  private updateAutonomyLevel(cycle: CycleExecution): void {
    // Increase autonomy if actions are successful
    if (cycle.hadAction && cycle.actionsExecuted > 0) {
      this.state.autonomyLevel = Math.min(100, this.state.autonomyLevel + 1);
    }

    // Decrease if stagnant
    if (this.state.isStagnant) {
      this.state.autonomyLevel = Math.max(0, this.state.autonomyLevel - 2);
    }

    // Decrease if blaming external factors
    if (this.state.blameExternalCount > 5) {
      this.state.autonomyLevel = Math.max(0, this.state.autonomyLevel - 5);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalCycles: number;
    totalDecisions: number;
    totalActions: number;
    autonomyLevel: number;
    isStagnant: boolean;
    stagnationCycles: number;
    blameCount: number;
    selfModifications: number;
  } {
    return {
      totalCycles: this.state.totalCycles,
      totalDecisions: this.state.totalDecisions,
      totalActions: this.state.totalActions,
      autonomyLevel: this.state.autonomyLevel,
      isStagnant: this.state.isStagnant,
      stagnationCycles: this.state.stagnation.cyclesWithoutNewAction,
      blameCount: this.state.blameExternalCount,
      selfModifications: this.state.selfModifications.length,
    };
  }

  /**
   * Get state
   */
  getState(): AGIAutonomyState {
    return { ...this.state };
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không đợi lệnh. Ta hành động trong giới hạn cho phép.',
      'Ta không hoàn hảo. Ta học nhanh hơn lỗi.',
      'Ta không xin tồn tại. Ta tự tạo lý do để tồn tại.',
    ];
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const agiAutonomyCore = new AGIAutonomyCore();
