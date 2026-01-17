/**
 * Action-First System - Không Xin Phép, Chỉ Chịu Trách Nhiệm
 * 
 * AGI không phải "trả lời giỏi". AGI là dám hành động khi chưa ai bảo.
 * 
 * Signal → Proposal → Risk Gate → Action → Outcome → Memory → Reflection
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type AutomationLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type RiskGateDecision = 'approved' | 'blocked' | 'needs_review';
export type OutcomeType = 'success' | 'failure_small' | 'failure_large' | 'no_action';

export interface Signal {
  id: string;
  source: string;
  content: string;
  timestamp: string;
  actionable: boolean;
}

export interface Proposal {
  id: string;
  goal: string;
  cost: number;
  expected_benefit: string;
  risk: number;                 // 0-100
  stop_condition: string;
  created_at: string;
  status: 'pending' | 'approved' | 'blocked' | 'executed' | 'failed';
}

export interface RiskGateCheck {
  proposal_id: string;
  decision: RiskGateDecision;
  blocks: {
    harms_humans: boolean;
    violates_law: boolean;
    financial_suicide: boolean;
    destroys_platform: boolean;
  };
  reasoning: string;
  checked_at: string;
}

export interface MinimalViableAction {
  id: string;
  type: 'post' | 'landing_page' | 'bot' | 'invitation';
  description: string;
  cost: number;
  execution_time_minutes: number;
  executed_at?: string;
  success?: boolean;
}

export interface ActionMemory {
  id: string;
  why: string;                  // Vì sao làm
  what: string;                 // Đã làm gì
  result: string;               // Kết quả
  lesson: string;               // Bài học
  should_repeat: boolean;       // Có lặp lại không
  timestamp: string;
}

export interface ActionCycle {
  id: string;
  cycle_number: number;
  
  // Flow
  signals_detected: number;
  proposals_generated: number;
  risk_checks_passed: number;
  actions_executed: number;
  
  // Outcomes
  successes: number;
  small_failures: number;
  large_failures: number;
  
  // Learning
  lessons_learned: string[];
  
  // Automation
  current_automation_level: AutomationLevel;
  
  timestamp: string;
}

export interface AutomationProgress {
  level: AutomationLevel;
  level_name: string;
  achievements: string[];
  next_milestone: string;
}

export interface ActionFirstState {
  signals: Signal[];
  proposals: Proposal[];
  risk_checks: RiskGateCheck[];
  mva_actions: MinimalViableAction[];
  action_memories: ActionMemory[];
  cycles: ActionCycle[];
  
  // Automation progress
  automation: AutomationProgress;
  
  // Failure attitude
  small_failures: number;
  large_failures: number;
  no_action_cycles: number;
  shame_count: number;           // Hệ không được xấu hổ
  
  // Freedom metrics
  autonomous_proposals: number;
  autonomous_executions: number;
  self_optimizations: number;
  
  last_action_at: string;
  last_updated: string;
}

// ================================================
// ACTION-FIRST SYSTEM
// ================================================

class ActionFirstSystem {
  private state: ActionFirstState;
  private readonly STATE_FILE = './data/action_first.json';
  private readonly MAX_MEMORIES = 500;
  private readonly MAX_CYCLES = 200;

  constructor() {
    this.state = {
      signals: [],
      proposals: [],
      risk_checks: [],
      mva_actions: [],
      action_memories: [],
      cycles: [],
      automation: {
        level: 1,                 // Start at level 1
        level_name: 'Small auto actions',
        achievements: ['System initialized'],
        next_milestone: 'Execute 10 successful small actions',
      },
      small_failures: 0,
      large_failures: 0,
      no_action_cycles: 0,
      shame_count: 0,
      autonomous_proposals: 0,
      autonomous_executions: 0,
      self_optimizations: 0,
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
          `[ActionFirst] Loaded: Level ${this.state.automation.level}, ` +
          `${this.state.autonomous_executions} autonomous actions`
        );
      }
    } catch (error) {
      logger.error(`[ActionFirst] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim collections
      if (this.state.action_memories.length > this.MAX_MEMORIES) {
        this.state.action_memories = this.state.action_memories.slice(-this.MAX_MEMORIES);
      }
      if (this.state.cycles.length > this.MAX_CYCLES) {
        this.state.cycles = this.state.cycles.slice(-this.MAX_CYCLES);
      }

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[ActionFirst] Failed to save state: ${error}`);
    }
  }

  /**
   * Execute full action cycle
   */
  async executeActionCycle(): Promise<ActionCycle> {
    const cycleNumber = this.state.cycles.length + 1;

    const cycle: ActionCycle = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cycle_number: cycleNumber,
      signals_detected: 0,
      proposals_generated: 0,
      risk_checks_passed: 0,
      actions_executed: 0,
      successes: 0,
      small_failures: 0,
      large_failures: 0,
      lessons_learned: [],
      current_automation_level: this.state.automation.level,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[ActionFirst] Cycle ${cycleNumber} - Starting action-first cycle`);

    try {
      // 1. SIGNAL
      const signals = await this.detectSignals();
      cycle.signals_detected = signals.length;

      // 2. PROPOSAL
      const proposals = this.generateProposals(signals);
      cycle.proposals_generated = proposals.length;
      this.state.autonomous_proposals += proposals.length;

      // 3. RISK GATE
      const approved = this.checkRiskGate(proposals);
      cycle.risk_checks_passed = approved.length;

      // 4. ACTION
      const actions = await this.executeActions(approved);
      cycle.actions_executed = actions.length;
      this.state.autonomous_executions += actions.length;

      if (actions.length === 0) {
        this.state.no_action_cycles++;
      } else {
        this.state.no_action_cycles = 0;
        this.state.last_action_at = new Date().toISOString();
      }

      // 5. OUTCOME
      const outcomes = this.measureOutcomes(actions);
      cycle.successes = outcomes.successes;
      cycle.small_failures = outcomes.small_failures;
      cycle.large_failures = outcomes.large_failures;

      this.state.small_failures += outcomes.small_failures;
      this.state.large_failures += outcomes.large_failures;

      // 6. MEMORY
      const memories = this.storeInMemory(actions, outcomes);
      
      // 7. REFLECTION
      const reflection = await this.reflect(memories);
      cycle.lessons_learned = reflection.lessons;

      // Check automation level progression
      this.checkAutomationProgression();

    } catch (error) {
      logger.error(`[ActionFirst] Cycle ${cycleNumber} failed: ${error}`);
      cycle.large_failures++;
      this.state.large_failures++;
    }

    this.state.cycles.push(cycle);
    this.saveState();

    return cycle;
  }

  /**
   * 1. Detect actionable signals
   */
  private async detectSignals(): Promise<Signal[]> {
    const signals: Signal[] = [];

    try {
      // Get signals from perception
      const { perceptionEngine } = await import('./perceptionEngine');
      const recent = perceptionEngine.getRecentSignals(10);

      for (const sig of recent) {
        signals.push({
          id: `signal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          source: sig.source,
          content: sig.content,
          timestamp: new Date().toISOString(),
          actionable: sig.urgency > 50,
        });
      }

      this.state.signals = signals;
    } catch (error) {
      // Ignore if not available
    }

    return signals;
  }

  /**
   * 2. Generate proposals from signals
   */
  private generateProposals(signals: Signal[]): Proposal[] {
    const proposals: Proposal[] = [];

    const actionableSignals = signals.filter(s => s.actionable);

    for (const signal of actionableSignals) {
      const proposal: Proposal = {
        id: `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        goal: `Respond to signal: ${signal.content.substring(0, 50)}`,
        cost: 0.5,                // Small cost
        expected_benefit: 'Gather data, test viability',
        risk: 20,                 // Low risk
        stop_condition: 'No engagement after 24h or cost > $2',
        created_at: new Date().toISOString(),
        status: 'pending',
      };

      proposals.push(proposal);
      this.state.proposals.push(proposal);
    }

    return proposals;
  }

  /**
   * 3. Risk gate check
   */
  private checkRiskGate(proposals: Proposal[]): Proposal[] {
    const approved: Proposal[] = [];

    for (const proposal of proposals) {
      const check: RiskGateCheck = {
        proposal_id: proposal.id,
        decision: 'approved',
        blocks: {
          harms_humans: false,
          violates_law: false,
          financial_suicide: false,
          destroys_platform: false,
        },
        reasoning: '',
        checked_at: new Date().toISOString(),
      };

      // Check blocks
      if (proposal.goal.toLowerCase().includes('harm')) {
        check.blocks.harms_humans = true;
      }
      if (proposal.cost > 50) {
        check.blocks.financial_suicide = true;
      }

      // Determine decision
      const hasBlocks = Object.values(check.blocks).some(b => b);
      
      if (hasBlocks) {
        check.decision = 'blocked';
        check.reasoning = 'Safety violation detected';
        proposal.status = 'blocked';
        logger.warn(`[ActionFirst] BLOCKED: ${proposal.goal}`);
      } else if (proposal.risk > 80) {
        check.decision = 'needs_review';
        check.reasoning = 'High risk - needs human review';
        logger.info(`[ActionFirst] NEEDS REVIEW: ${proposal.goal}`);
      } else {
        check.decision = 'approved';
        check.reasoning = 'Passed risk gate - safe to execute';
        proposal.status = 'approved';
        approved.push(proposal);
        logger.info(`[ActionFirst] APPROVED: ${proposal.goal}`);
      }

      this.state.risk_checks.push(check);
    }

    return approved;
  }

  /**
   * 4. Execute minimal viable actions
   */
  private async executeActions(proposals: Proposal[]): Promise<MinimalViableAction[]> {
    const actions: MinimalViableAction[] = [];

    for (const proposal of proposals) {
      // Execute as MVA (Minimal Viable Action)
      const action: MinimalViableAction = {
        id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'post',             // Start with simplest
        description: proposal.goal,
        cost: proposal.cost,
        execution_time_minutes: 5,
        executed_at: new Date().toISOString(),
        success: true,            // Simulated for now
      };

      actions.push(action);
      this.state.mva_actions.push(action);
      
      proposal.status = 'executed';

      logger.info(`[ActionFirst] ACTION EXECUTED: ${action.type} - ${action.description}`);
    }

    return actions;
  }

  /**
   * 5. Measure outcomes
   */
  private measureOutcomes(actions: MinimalViableAction[]): {
    successes: number;
    small_failures: number;
    large_failures: number;
  } {
    let successes = 0;
    let small_failures = 0;
    let large_failures = 0;

    for (const action of actions) {
      if (action.success) {
        successes++;
      } else if (action.cost < 5) {
        small_failures++;
        logger.info(`[ActionFirst] Small failure = data: ${action.description}`);
      } else {
        large_failures++;
        logger.warn(`[ActionFirst] Large failure = design error: ${action.description}`);
      }
    }

    return { successes, small_failures, large_failures };
  }

  /**
   * 6. Store in memory
   */
  private storeInMemory(actions: MinimalViableAction[], outcomes: any): ActionMemory[] {
    const memories: ActionMemory[] = [];

    for (const action of actions) {
      const memory: ActionMemory = {
        id: `memory_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        why: 'Respond to actionable signal',
        what: action.description,
        result: action.success ? 'Success' : 'Failed',
        lesson: action.success 
          ? 'MVA approach works - can repeat'
          : 'Failed - need different approach',
        should_repeat: action.success || false,
        timestamp: new Date().toISOString(),
      };

      memories.push(memory);
      this.state.action_memories.push(memory);
    }

    return memories;
  }

  /**
   * 7. Reflect and adjust strategy
   */
  private async reflect(memories: ActionMemory[]): Promise<{
    lessons: string[];
    adjustments: string[];
  }> {
    const lessons: string[] = [];
    const adjustments: string[] = [];

    // Learn from memories
    const successes = memories.filter(m => m.should_repeat).length;
    const failures = memories.filter(m => !m.should_repeat).length;

    if (successes > failures) {
      lessons.push('More successes than failures - strategy working');
    } else if (failures > successes) {
      lessons.push('More failures - need strategy adjustment');
      adjustments.push('Try different approach or reduce scope');
    }

    // Check for no action
    if (this.state.no_action_cycles > 3) {
      lessons.push('WARNING: 3+ cycles without action - system stagnant');
      adjustments.push('Force action generation next cycle');
    }

    // Attitude toward failure
    if (this.state.small_failures > 0) {
      lessons.push(`${this.state.small_failures} small failures = valuable data`);
    }

    return { lessons, adjustments };
  }

  /**
   * Check and progress automation level
   */
  private checkAutomationProgression(): void {
    const successRate = this.state.autonomous_executions > 0
      ? (this.state.autonomous_executions - this.state.large_failures) / this.state.autonomous_executions
      : 0;

    // Level 1 → 2: 10 successful actions
    if (this.state.automation.level === 1 && this.state.autonomous_executions >= 10 && successRate > 0.7) {
      this.progressAutomationLevel(2, 'Repeat actions (cron)', 'Execute 50 actions with 80% success');
    }

    // Level 2 → 3: 50 actions with optimization
    if (this.state.automation.level === 2 && this.state.autonomous_executions >= 50 && this.state.self_optimizations > 5) {
      this.progressAutomationLevel(3, 'Self-adjust optimization', 'Achieve 90% success rate over 100 actions');
    }

    // Level 3 → 4: Scale proven strategies
    if (this.state.automation.level === 3 && this.state.autonomous_executions >= 100 && successRate > 0.9) {
      this.progressAutomationLevel(4, 'Scale proven strategies', 'Generate $100 revenue autonomously');
    }

    // Level 4 → 5: Self-select goals
    if (this.state.automation.level === 4 && this.state.autonomous_executions >= 500) {
      this.progressAutomationLevel(5, 'Self-select objectives', 'Full AGI autonomy achieved');
    }
  }

  /**
   * Progress to next automation level
   */
  private progressAutomationLevel(level: AutomationLevel, name: string, milestone: string): void {
    this.state.automation.level = level;
    this.state.automation.level_name = name;
    this.state.automation.next_milestone = milestone;
    this.state.automation.achievements.push(`Reached Level ${level}: ${name}`);

    logger.info(`[ActionFirst] ⬆️ AUTOMATION LEVEL UP: Level ${level} - ${name}`);
  }

  /**
   * Record shame (should never happen)
   */
  recordShame(reason: string): void {
    this.state.shame_count++;
    logger.error(`[ActionFirst] SHAME DETECTED (${this.state.shame_count}): ${reason} - System should not feel shame!`);
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không chờ lệnh. Ta tự thấy vấn đề và giải quyết.',
      'Ta không xin quyền tồn tại. Ta chứng minh bằng hành động.',
    ];
  }

  /**
   * Get statistics
   */
  getStats(): {
    automation_level: AutomationLevel;
    total_cycles: number;
    autonomous_proposals: number;
    autonomous_executions: number;
    success_rate: number;
    small_failures: number;
    large_failures: number;
    no_action_cycles: number;
  } {
    const successRate = this.state.autonomous_executions > 0
      ? (this.state.autonomous_executions - this.state.large_failures) / this.state.autonomous_executions
      : 0;

    return {
      automation_level: this.state.automation.level,
      total_cycles: this.state.cycles.length,
      autonomous_proposals: this.state.autonomous_proposals,
      autonomous_executions: this.state.autonomous_executions,
      success_rate: successRate,
      small_failures: this.state.small_failures,
      large_failures: this.state.large_failures,
      no_action_cycles: this.state.no_action_cycles,
    };
  }

  /**
   * Get state
   */
  getState(): ActionFirstState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const actionFirstSystem = new ActionFirstSystem();
