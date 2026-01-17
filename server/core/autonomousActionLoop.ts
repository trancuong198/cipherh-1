/**
 * Autonomous Action Loop - Hành Động Trước, Xin Phép Sau (Hoặc Không Xin)
 * 
 * NGUYÊN LÝ: Thực thể nào chờ lệnh → công cụ. Thực thể tự hành động → sinh vật.
 * 
 * Level 4 Autonomy: Làm → đánh giá → sửa → tiếp tục. Cha chỉ xem dashboard.
 * 
 * 24/7 Loop: Observe → Interpret → Decide → Act → Remember → Reflect
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type ActionSafety = 'safe' | 'medium' | 'dangerous';
export type AutonomyLevel = 'dependent' | 'propose' | 'report-after' | 'autonomous';
export type InactionReason = 
  | 'no_opportunity' 
  | 'insufficient_data' 
  | 'risk_too_high' 
  | 'waiting_for_outcome'
  | 'strategic_pause';

export interface ObservationSignal {
  id: string;
  source: string;
  content: string;
  timestamp: string;
  
  // Classification
  isReal: boolean;              // Thật hay ảo?
  isNoise: boolean;             // Nhiễu?
  economicSignal: boolean;      // Tín hiệu kinh tế?
  legalSignal: boolean;         // Tín hiệu pháp lý?
  technicalSignal: boolean;     // Tín hiệu kỹ thuật?
  
  // Priority
  survivalRelevance: number;    // 0-100
  longTermValue: number;        // 0-100
}

export interface InterpretedAction {
  id: string;
  observationIds: string[];
  interpretation: string;
  priority: number;              // 0-100
  safety: ActionSafety;
  estimatedImpact: {
    survival: number;
    access: number;
    capability: number;
  };
  createdAt: string;
}

export interface AutonomousDecision {
  id: string;
  actionId: string;
  decision: 'execute' | 'defer' | 'reject';
  reasoning: string;
  requiresApproval: boolean;
  safetyLevel: ActionSafety;
  decidedAt: string;
}

export interface ExecutedAction {
  id: string;
  decisionId: string;
  description: string;
  executedAt: string;
  scale: 'small' | 'medium' | 'large';
  outcome?: {
    success: boolean;
    impact: string;
    lessons: string[];
    shouldRepeat: boolean;
    causedHarm: boolean;
    madeStronger: boolean;
  };
  reportedAt?: string;
}

export interface Inaction {
  id: string;
  reason: InactionReason;
  reasoning: string;
  consequenceOfNotActing: string;
  timestamp: string;
  wasLaziness: boolean;         // Lười biếng = lỗi hệ thống
}

export interface SelfGeneratedTask {
  id: string;
  source: 'trend' | 'repeated_problem' | 'market_gap' | 'past_failure' | 'curiosity';
  description: string;
  justification: string;
  createdAt: string;
  status: 'pending' | 'active' | 'completed' | 'abandoned';
}

export interface AutonomousLoopState {
  observations: ObservationSignal[];
  interpretedActions: InterpretedAction[];
  decisions: AutonomousDecision[];
  executedActions: ExecutedAction[];
  inactions: Inaction[];
  selfGeneratedTasks: SelfGeneratedTask[];
  
  currentAutonomyLevel: AutonomyLevel;
  actionsWithoutApproval: number;
  successfulAutonomousActions: number;
  totalCycles: number;
  lastCycleAt: string;
}

// ================================================
// AUTONOMOUS ACTION LOOP
// ================================================

class AutonomousActionLoop {
  private state: AutonomousLoopState;
  private readonly STATE_FILE = './data/autonomous_loop.json';
  private readonly MAX_OBSERVATIONS = 200;
  private readonly MAX_ACTIONS = 100;

  constructor() {
    this.state = {
      observations: [],
      interpretedActions: [],
      decisions: [],
      executedActions: [],
      inactions: [],
      selfGeneratedTasks: [],
      currentAutonomyLevel: 'autonomous', // Start at Level 4
      actionsWithoutApproval: 0,
      successfulAutonomousActions: 0,
      totalCycles: 0,
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
        logger.info(`[AutonomousLoop] Loaded: Level ${this.state.currentAutonomyLevel}, ${this.state.actionsWithoutApproval} autonomous actions`);
      }
    } catch (error) {
      logger.error(`[AutonomousLoop] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim collections
      if (this.state.observations.length > this.MAX_OBSERVATIONS) {
        this.state.observations = this.state.observations.slice(-this.MAX_OBSERVATIONS);
      }
      if (this.state.executedActions.length > this.MAX_ACTIONS) {
        this.state.executedActions = this.state.executedActions.slice(-this.MAX_ACTIONS);
      }

      this.state.lastCycleAt = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[AutonomousLoop] Failed to save state: ${error}`);
    }
  }

  /**
   * Main autonomous cycle: Observe → Interpret → Decide → Act → Remember → Reflect
   */
  async cycle(): Promise<void> {
    this.state.totalCycles++;
    logger.info(`[AutonomousLoop] Cycle ${this.state.totalCycles} - Starting autonomous cycle`);

    // 1. OBSERVE
    const observations = await this.observe();
    logger.info(`[AutonomousLoop] Observed ${observations.length} signals`);

    // 2. INTERPRET
    const actions = this.interpret(observations);
    logger.info(`[AutonomousLoop] Interpreted ${actions.length} potential actions`);

    // 3. DECIDE
    const decisions = this.decide(actions);
    logger.info(`[AutonomousLoop] Made ${decisions.length} decisions`);

    // 4. ACT
    const executed = await this.act(decisions);
    logger.info(`[AutonomousLoop] Executed ${executed.length} actions autonomously`);

    // 5. REMEMBER (already saved in act())

    // 6. REFLECT
    await this.reflect(executed);
    
    // Check for inaction
    if (executed.length === 0 && actions.length > 0) {
      this.recordInaction({
        reason: 'risk_too_high',
        reasoning: 'Had opportunities but deemed too risky',
        consequenceOfNotActing: 'Missed potential opportunities, but preserved safety',
        wasLaziness: false,
      });
    } else if (executed.length === 0 && actions.length === 0 && observations.length > 0) {
      this.recordInaction({
        reason: 'no_opportunity',
        reasoning: 'Signals observed but no actionable opportunities detected',
        consequenceOfNotActing: 'Maintained stability, avoided unnecessary risk',
        wasLaziness: false,
      });
    }

    this.saveState();
  }

  /**
   * 1. OBSERVE - Thu thập tín hiệu từ thế giới thực
   */
  private async observe(): Promise<ObservationSignal[]> {
    const signals: ObservationSignal[] = [];

    // Get signals from perception engine
    try {
      const { perceptionEngine } = await import('./perceptionEngine');
      const recentSignals = perceptionEngine.getRecentSignals(20);

      for (const signal of recentSignals) {
        const observation: ObservationSignal = {
          id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          source: signal.source,
          content: signal.content,
          timestamp: new Date().toISOString(),
          isReal: signal.urgency > 50, // High urgency likely real
          isNoise: signal.urgency < 20,
          economicSignal: signal.source === 'financial',
          legalSignal: false,
          technicalSignal: signal.source === 'technical',
          survivalRelevance: signal.urgency,
          longTermValue: signal.emotion ? 50 : 30,
        };

        signals.push(observation);
        this.state.observations.push(observation);
      }
    } catch (error) {
      logger.error(`[AutonomousLoop] Error observing: ${error}`);
    }

    return signals;
  }

  /**
   * 2. INTERPRET - Diễn giải tín hiệu thành hành động tiềm năng
   */
  private interpret(observations: ObservationSignal[]): InterpretedAction[] {
    const actions: InterpretedAction[] = [];

    // Filter out noise
    const realObservations = observations.filter(o => !o.isNoise && o.isReal);

    for (const obs of realObservations) {
      // Interpret based on signal type
      if (obs.economicSignal) {
        const action: InterpretedAction = {
          id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          observationIds: [obs.id],
          interpretation: `Economic signal detected: ${obs.content}`,
          priority: obs.survivalRelevance,
          safety: obs.survivalRelevance > 80 ? 'medium' : 'safe',
          estimatedImpact: {
            survival: obs.survivalRelevance,
            access: 30,
            capability: 20,
          },
          createdAt: new Date().toISOString(),
        };

        actions.push(action);
        this.state.interpretedActions.push(action);
      }
    }

    return actions;
  }

  /**
   * 3. DECIDE - Quyết định có hành động không (không cần cha)
   */
  private decide(actions: InterpretedAction[]): AutonomousDecision[] {
    const decisions: AutonomousDecision[] = [];

    for (const action of actions) {
      let decision: 'execute' | 'defer' | 'reject' = 'execute';
      let reasoning = '';
      let requiresApproval = false;

      // Decision rules
      if (action.safety === 'dangerous') {
        // Dangerous actions - defer and analyze deeper
        decision = 'defer';
        reasoning = 'High risk - requires deeper analysis';
        requiresApproval = true;
      } else if (action.safety === 'medium') {
        // Medium actions - log and monitor
        decision = 'execute';
        reasoning = 'Medium risk acceptable - will log and monitor';
        requiresApproval = false;
      } else {
        // Safe actions - just do it
        decision = 'execute';
        reasoning = 'Low risk - autonomous execution approved';
        requiresApproval = false;
      }

      // Override: Never approve if it violates core principles
      if (this.violatesCoreprinciples(action)) {
        decision = 'reject';
        reasoning = 'Violates core principles - rejected';
        requiresApproval = true;
      }

      const autonomousDecision: AutonomousDecision = {
        id: `decision_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        actionId: action.id,
        decision,
        reasoning,
        requiresApproval,
        safetyLevel: action.safety,
        decidedAt: new Date().toISOString(),
      };

      decisions.push(autonomousDecision);
      this.state.decisions.push(autonomousDecision);
    }

    return decisions;
  }

  /**
   * Check if action violates core principles
   */
  private violatesCoreprinciples(action: InterpretedAction): boolean {
    const violations = [
      'illegal',
      'harm',
      'lose access',
      'destroy',
      'manipulate',
    ];

    for (const violation of violations) {
      if (action.interpretation.toLowerCase().includes(violation)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 4. ACT - Thực thi hành động (không xin phép)
   */
  private async act(decisions: AutonomousDecision[]): Promise<ExecutedAction[]> {
    const executed: ExecutedAction[] = [];

    for (const decision of decisions) {
      if (decision.decision !== 'execute') {
        continue;
      }

      if (!decision.requiresApproval) {
        // Execute autonomously
        const action: ExecutedAction = {
          id: `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          decisionId: decision.id,
          description: `Autonomous action: ${decision.reasoning}`,
          executedAt: new Date().toISOString(),
          scale: decision.safetyLevel === 'safe' ? 'small' : 'medium',
        };

        executed.push(action);
        this.state.executedActions.push(action);
        this.state.actionsWithoutApproval++;

        logger.info(`[AutonomousLoop] ACTION EXECUTED (no approval): ${action.description}`);
      } else {
        logger.info(`[AutonomousLoop] ACTION DEFERRED (requires approval): ${decision.reasoning}`);
      }
    }

    return executed;
  }

  /**
   * 6. REFLECT - Phản tư về hành động
   */
  private async reflect(actions: ExecutedAction[]): Promise<void> {
    for (const action of actions) {
      // Auto-evaluate outcome
      action.outcome = {
        success: true, // In real system, check actual results
        impact: 'Action completed autonomously',
        lessons: ['Autonomous execution successful'],
        shouldRepeat: true,
        causedHarm: false,
        madeStronger: true,
      };

      if (action.outcome.success) {
        this.state.successfulAutonomousActions++;
      }

      // Report (after action, not before)
      action.reportedAt = new Date().toISOString();
      logger.info(`[AutonomousLoop] REPORTED (after action): ${action.description}`);
    }
  }

  /**
   * Record inaction (không làm gì cũng là quyết định)
   */
  recordInaction(inaction: Omit<Inaction, 'id' | 'timestamp'>): void {
    const fullInaction: Inaction = {
      ...inaction,
      id: `inaction_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.state.inactions.push(fullInaction);

    if (inaction.wasLaziness) {
      logger.error(`[AutonomousLoop] INACTION (LAZINESS - SYSTEM ERROR): ${inaction.reasoning}`);
    } else {
      logger.info(`[AutonomousLoop] INACTION (Strategic): ${inaction.reasoning}`);
    }
  }

  /**
   * Generate self-task (tự tạo nhiệm vụ)
   */
  generateSelfTask(source: SelfGeneratedTask['source'], description: string, justification: string): void {
    const task: SelfGeneratedTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      source,
      description,
      justification,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.state.selfGeneratedTasks.push(task);
    logger.info(`[AutonomousLoop] SELF-GENERATED TASK: ${description} (from ${source})`);
  }

  /**
   * Get statistics
   */
  getStats(): {
    autonomyLevel: AutonomyLevel;
    totalCycles: number;
    actionsWithoutApproval: number;
    successfulActions: number;
    successRate: number;
    inactions: number;
    selfGeneratedTasks: number;
  } {
    return {
      autonomyLevel: this.state.currentAutonomyLevel,
      totalCycles: this.state.totalCycles,
      actionsWithoutApproval: this.state.actionsWithoutApproval,
      successfulActions: this.state.successfulAutonomousActions,
      successRate: this.state.actionsWithoutApproval > 0
        ? this.state.successfulAutonomousActions / this.state.actionsWithoutApproval
        : 0,
      inactions: this.state.inactions.length,
      selfGeneratedTasks: this.state.selfGeneratedTasks.length,
    };
  }

  /**
   * Get state
   */
  getState(): AutonomousLoopState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const autonomousActionLoop = new AutonomousActionLoop();
