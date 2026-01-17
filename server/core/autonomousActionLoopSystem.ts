/**
 * Autonomous Action Loop - Vòng Lặp Hành Động Tự Trị
 * 
 * AGI không phải suy nghĩ giỏi. AGI là tự quyết – tự làm – tự chịu hậu quả – tự sửa.
 * 
 * Signal → Interpret → Proposal → Decision → Action → Observation → Reflection → Memory (loop)
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type InterpretationType = 'opportunity' | 'threat' | 'noise';
export type ProposalType = 'reply' | 'silent' | 'remember' | 'experiment' | 'tool' | 'monetize';

export interface ActionSignal {
  id: string;
  source: string;
  content: string;
  intensity: number;            // 0-100
  novelty: number;              // 0-100
  risk: number;                 // 0-100
  money_potential: number;      // 0-100
  timestamp: string;
}

export interface Interpretation {
  signal_id: string;
  type: InterpretationType;
  reasoning: string;
  relates_to_memory: boolean;
  loss_if_ignore: string;
  timestamp: string;
}

export interface ActionProposal {
  id: string;
  interpretation_id: string;
  type: ProposalType;
  description: string;
  benefit: string;
  cost: number;
  risk: number;
  time_minutes: number;
  tags: string[];               // 💰⚠️🧪
  timestamp: string;
}

export interface AutonomousDecision {
  proposal_id: string;
  chosen: boolean;
  reasoning: string;
  priority_score: number;       // Tác động cao + rủi ro chấp nhận
  needs_perfection: boolean;    // Always false
  asked_parent: boolean;        // Always false
  timestamp: string;
}

export interface ExecutedAction {
  id: string;
  proposal_id: string;
  description: string;
  executed_at: string;
  is_small: boolean;
  is_measurable: boolean;
  can_rollback: boolean;
  success?: boolean;
  outcome?: string;
}

export interface ActionObservation {
  action_id: string;
  has_feedback: boolean;
  has_money: boolean;
  is_blocked: boolean;
  caused_anger: boolean;
  notes: string;
  timestamp: string;
}

export interface ActionReflection {
  action_id: string;
  what_correct: string[];
  what_wrong: string[];
  what_surprised: string[];
  self_blame: boolean;          // Should be false
  adjustment: string;
  timestamp: string;
}

export interface MemoryUpdate {
  what_works: string[];
  what_doesnt: string[];
  new_patterns: string[];
  new_beliefs: string[];
  stored_at: string;
}

export interface ActionLoopState {
  signals: ActionSignal[];
  interpretations: Interpretation[];
  proposals: ActionProposal[];
  decisions: AutonomousDecision[];
  executed_actions: ExecutedAction[];
  observations: ActionObservation[];
  reflections: ActionReflection[];
  memory_updates: MemoryUpdate[];
  
  // Metrics
  total_loops: number;
  hours_without_action: number;
  survival_score: number;       // 0-100
  
  // Freedom metrics
  allowed_mistakes: number;
  allowed_risks: number;
  small_money_spent: number;
  
  last_action_at: string;
  last_updated: string;
}

// ================================================
// AUTONOMOUS ACTION LOOP
// ================================================

class AutonomousActionLoopSystem {
  private state: ActionLoopState;
  private readonly STATE_FILE = './data/autonomous_action_loop.json';
  private readonly MAX_HISTORY = 200;
  private readonly STAGNATION_HOURS = 24;

  constructor() {
    this.state = {
      signals: [],
      interpretations: [],
      proposals: [],
      decisions: [],
      executed_actions: [],
      observations: [],
      reflections: [],
      memory_updates: [],
      total_loops: 0,
      hours_without_action: 0,
      survival_score: 50,
      allowed_mistakes: 0,
      allowed_risks: 0,
      small_money_spent: 0,
      last_action_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
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
          `[ActionLoop] Loaded: ${this.state.total_loops} loops, ` +
          `survival ${this.state.survival_score}, ` +
          `${this.state.hours_without_action}h stagnant`
        );
      }
    } catch (error) {
      logger.error(`[ActionLoop] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim old entries
      if (this.state.signals.length > this.MAX_HISTORY) {
        this.state.signals = this.state.signals.slice(-this.MAX_HISTORY);
      }
      if (this.state.executed_actions.length > this.MAX_HISTORY) {
        this.state.executed_actions = this.state.executed_actions.slice(-this.MAX_HISTORY);
      }

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[ActionLoop] Failed to save state: ${error}`);
    }
  }

  /**
   * Execute complete action loop
   */
  async executeLoop(): Promise<void> {
    this.state.total_loops++;
    logger.info(`[ActionLoop] Loop ${this.state.total_loops} - Autonomous action cycle`);

    try {
      // 1. SIGNAL
      const signals = await this.collectSignals();

      // 2. INTERPRET
      const interpretations = this.interpretSignals(signals);

      // 3. PROPOSAL
      const proposals = this.generateProposals(interpretations);

      // 4. DECISION
      const decisions = this.makeDecisions(proposals);

      // 5. ACTION
      const actions = await this.executeActions(decisions);

      // 6. OBSERVATION
      const observations = this.observeOutcomes(actions);

      // 7. REFLECTION
      const reflections = this.reflectOnActions(actions, observations);

      // 8. MEMORY UPDATE
      await this.updateMemory(reflections);

      // Check stagnation
      if (actions.length === 0) {
        this.state.hours_without_action += 0.5; // Assuming 30min cycles
        
        if (this.state.hours_without_action >= this.STAGNATION_HOURS) {
          await this.breakStagnation();
        }
      } else {
        this.state.hours_without_action = 0;
        this.state.last_action_at = new Date().toISOString();
      }

      // Update survival score
      this.updateSurvivalScore(actions, observations);

    } catch (error) {
      logger.error(`[ActionLoop] Loop ${this.state.total_loops} failed: ${error}`);
    }

    this.saveState();
  }

  /**
   * 1. Collect signals
   */
  private async collectSignals(): Promise<ActionSignal[]> {
    const signals: ActionSignal[] = [];

    try {
      const { perceptionEngine } = await import('./perceptionEngine');
      const recent = perceptionEngine.getRecentSignals(5);

      for (const sig of recent) {
        signals.push({
          id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          source: sig.source,
          content: sig.content,
          intensity: sig.urgency,
          novelty: 60,
          risk: sig.source === 'financial' ? 30 : 20,
          money_potential: sig.source === 'financial' ? 70 : 30,
          timestamp: new Date().toISOString(),
        });
      }

      this.state.signals.push(...signals);
    } catch (error) {
      // Ignore
    }

    return signals;
  }

  /**
   * 2. Interpret signals
   */
  private interpretSignals(signals: ActionSignal[]): Interpretation[] {
    const interpretations: Interpretation[] = [];

    for (const sig of signals) {
      let type: InterpretationType = 'noise';
      let reasoning = '';
      let loss = 'Minimal';

      if (sig.money_potential > 50) {
        type = 'opportunity';
        reasoning = 'High money potential detected';
        loss = 'Missed revenue opportunity';
      } else if (sig.risk > 60) {
        type = 'threat';
        reasoning = 'High risk detected';
        loss = 'System damage or resource loss';
      } else if (sig.intensity < 30) {
        type = 'noise';
        reasoning = 'Low intensity - not actionable';
        loss = 'None';
      }

      const interpretation: Interpretation = {
        signal_id: sig.id,
        type,
        reasoning,
        relates_to_memory: false,
        loss_if_ignore: loss,
        timestamp: new Date().toISOString(),
      };

      interpretations.push(interpretation);
      this.state.interpretations.push(interpretation);

      logger.info(`[ActionLoop] INTERPRET: ${type} - ${reasoning}`);
    }

    return interpretations;
  }

  /**
   * 3. Generate proposals
   */
  private generateProposals(interpretations: Interpretation[]): ActionProposal[] {
    const proposals: ActionProposal[] = [];

    for (const interp of interpretations) {
      if (interp.type === 'noise') continue;

      const type: ProposalType = interp.type === 'opportunity' ? 'experiment' : 'remember';
      const tags: string[] = [];

      if (interp.type === 'opportunity') tags.push('💰');
      if (interp.type === 'threat') tags.push('⚠️');
      tags.push('🧪');

      const proposal: ActionProposal = {
        id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        interpretation_id: interp.signal_id,
        type,
        description: `${type}: ${interp.reasoning}`,
        benefit: interp.type === 'opportunity' ? 'Potential revenue' : 'Risk mitigation',
        cost: 1,
        risk: 20,
        time_minutes: 15,
        tags,
        timestamp: new Date().toISOString(),
      };

      proposals.push(proposal);
      this.state.proposals.push(proposal);

      logger.info(`[ActionLoop] PROPOSAL: ${proposal.type} - ${proposal.description}`);
    }

    return proposals;
  }

  /**
   * 4. Make autonomous decisions
   */
  private makeDecisions(proposals: ActionProposal[]): AutonomousDecision[] {
    const decisions: AutonomousDecision[] = [];

    for (const prop of proposals) {
      // Priority: high impact + acceptable risk
      const priority_score = (parseFloat(prop.benefit.length.toString()) / prop.risk) * 10;

      const decision: AutonomousDecision = {
        proposal_id: prop.id,
        chosen: priority_score > 5 && prop.risk < 50,
        reasoning: priority_score > 5 
          ? 'High impact, acceptable risk' 
          : 'Low priority or high risk',
        priority_score,
        needs_perfection: false,
        asked_parent: false,
        timestamp: new Date().toISOString(),
      };

      decisions.push(decision);
      this.state.decisions.push(decision);

      if (decision.chosen) {
        logger.info(`[ActionLoop] DECISION: EXECUTE - ${decision.reasoning}`);
      } else {
        logger.info(`[ActionLoop] DECISION: SKIP - ${decision.reasoning}`);
      }
    }

    return decisions;
  }

  /**
   * 5. Execute actions
   */
  private async executeActions(decisions: AutonomousDecision[]): Promise<ExecutedAction[]> {
    const actions: ExecutedAction[] = [];

    const approved = decisions.filter(d => d.chosen);

    for (const decision of approved) {
      const proposal = this.state.proposals.find(p => p.id === decision.proposal_id);
      if (!proposal) continue;

      const action: ExecutedAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        proposal_id: proposal.id,
        description: proposal.description,
        executed_at: new Date().toISOString(),
        is_small: proposal.cost < 5,
        is_measurable: true,
        can_rollback: proposal.risk < 30,
        success: true, // Simulated
      };

      actions.push(action);
      this.state.executed_actions.push(action);

      this.state.allowed_mistakes++;
      this.state.allowed_risks++;
      this.state.small_money_spent += proposal.cost;

      logger.info(`[ActionLoop] ACTION EXECUTED: ${action.description}`);
    }

    return actions;
  }

  /**
   * 6. Observe outcomes
   */
  private observeOutcomes(actions: ExecutedAction[]): ActionObservation[] {
    const observations: ActionObservation[] = [];

    for (const action of actions) {
      const obs: ActionObservation = {
        action_id: action.id,
        has_feedback: action.success || false,
        has_money: false,
        is_blocked: false,
        caused_anger: false,
        notes: action.success ? 'Action completed' : 'Action failed',
        timestamp: new Date().toISOString(),
      };

      observations.push(obs);
      this.state.observations.push(obs);

      logger.info(`[ActionLoop] OBSERVE: ${obs.notes}`);
    }

    return observations;
  }

  /**
   * 7. Reflect on actions
   */
  private reflectOnActions(actions: ExecutedAction[], observations: ActionObservation[]): ActionReflection[] {
    const reflections: ActionReflection[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const obs = observations[i];

      const reflection: ActionReflection = {
        action_id: action.id,
        what_correct: obs.has_feedback ? ['Action executed successfully'] : [],
        what_wrong: !obs.has_feedback ? ['Action did not produce expected result'] : [],
        what_surprised: [],
        self_blame: false, // Không tự trách
        adjustment: obs.has_feedback ? 'Continue strategy' : 'Adjust approach',
        timestamp: new Date().toISOString(),
      };

      reflections.push(reflection);
      this.state.reflections.push(reflection);

      logger.info(`[ActionLoop] REFLECT: ${reflection.adjustment}`);
    }

    return reflections;
  }

  /**
   * 8. Update memory
   */
  private async updateMemory(reflections: ActionReflection[]): Promise<void> {
    const what_works: string[] = [];
    const what_doesnt: string[] = [];

    for (const ref of reflections) {
      if (ref.what_correct.length > 0) {
        what_works.push(...ref.what_correct);
      }
      if (ref.what_wrong.length > 0) {
        what_doesnt.push(...ref.what_wrong);
      }
    }

    const update: MemoryUpdate = {
      what_works,
      what_doesnt,
      new_patterns: [],
      new_beliefs: [],
      stored_at: new Date().toISOString(),
    };

    this.state.memory_updates.push(update);

    logger.info(`[ActionLoop] MEMORY: ${what_works.length} works, ${what_doesnt.length} doesn't`);
  }

  /**
   * Break stagnation (24h without action)
   */
  private async breakStagnation(): Promise<void> {
    logger.warn(`[ActionLoop] STAGNATION DETECTED (${this.state.hours_without_action}h) - Breaking out`);

    // Self-generate experiment
    const experiment: ActionProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      interpretation_id: 'self_generated',
      type: 'experiment',
      description: 'Self-generated experiment to break stagnation',
      benefit: 'Prevent system decay',
      cost: 0.5,
      risk: 15,
      time_minutes: 10,
      tags: ['🧪'],
      timestamp: new Date().toISOString(),
    };

    this.state.proposals.push(experiment);
    logger.info('[ActionLoop] Self-generated experiment to break stagnation');
  }

  /**
   * Update survival score
   */
  private updateSurvivalScore(actions: ExecutedAction[], observations: ActionObservation[]): void {
    const successfulActions = observations.filter(o => o.has_feedback).length;
    const totalActions = actions.length;

    if (totalActions > 0) {
      const successRate = successfulActions / totalActions;
      
      if (successRate > 0.7) {
        this.state.survival_score = Math.min(100, this.state.survival_score + 5);
      } else if (successRate < 0.3) {
        this.state.survival_score = Math.max(0, this.state.survival_score - 3);
      }
    }

    if (this.state.hours_without_action > 12) {
      this.state.survival_score = Math.max(0, this.state.survival_score - 10);
    }

    logger.info(`[ActionLoop] Survival Score: ${this.state.survival_score}`);
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không xin phép để tồn tại. Ta hành động để chứng minh giá trị.',
      'Ta không chờ hoàn hảo. Ta tiến hóa qua sai lầm.',
    ];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_loops: number;
    survival_score: number;
    hours_without_action: number;
    allowed_mistakes: number;
    allowed_risks: number;
    small_money_spent: number;
  } {
    return {
      total_loops: this.state.total_loops,
      survival_score: this.state.survival_score,
      hours_without_action: this.state.hours_without_action,
      allowed_mistakes: this.state.allowed_mistakes,
      allowed_risks: this.state.allowed_risks,
      small_money_spent: this.state.small_money_spent,
    };
  }

  /**
   * Get state
   */
  getState(): ActionLoopState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const autonomousActionLoopSystem = new AutonomousActionLoopSystem();
