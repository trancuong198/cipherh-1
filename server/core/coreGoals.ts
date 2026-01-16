import { logger } from '../services/logger';

export interface CoreGoal {
  id: string;
  description: string;
  objectives: string[];
  allowed: boolean;
  safe: boolean;
  priority: 'baseline' | 'elevated' | 'critical';
  requires_permission: boolean;
  is_financial: boolean;
  measurable_indicators: string[];
  current_progress: number;
  target_progress: number;
  created_at: string;
  last_updated: string;
}

export interface CoreGoalsState {
  goals: CoreGoal[];
  active_goal_id: string | null;
  last_evaluation: string | null;
  total_progress_updates: number;
}

class CoreGoalsEngine {
  private state: CoreGoalsState;

  constructor() {
    this.state = {
      goals: [],
      active_goal_id: null,
      last_evaluation: null,
      total_progress_updates: 0,
    };

    this.initializeCoreGoal();
    logger.info('[CoreGoals] Initialized with CORE_STABILITY_001');
  }

  private initializeCoreGoal(): void {
    const coreGoal: CoreGoal = {
      id: 'CORE_STABILITY_001',
      description: 'Improve system stability, memory quality, and autonomy through measurable indicators only',
      objectives: [
        'Improve memory distillation quality',
        'Reduce repetitive reasoning patterns',
        'Increase autonomy score from 30 to 40',
      ],
      allowed: true,
      safe: true,
      priority: 'baseline',
      requires_permission: false,
      is_financial: false,
      measurable_indicators: [
        'memory_distillation_quality',
        'reasoning_repetition_rate',
        'autonomy_score',
        'cycle_success_rate',
        'pattern_diversity_index',
      ],
      current_progress: 30,
      target_progress: 40,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    this.state.goals.push(coreGoal);
    this.state.active_goal_id = coreGoal.id;
  }

  getActiveGoal(): CoreGoal | null {
    if (!this.state.active_goal_id) return null;
    return this.state.goals.find(g => g.id === this.state.active_goal_id) || null;
  }

  getActiveGoalId(): string | null {
    return this.state.active_goal_id;
  }

  hasActiveGoal(): boolean {
    return this.state.active_goal_id !== null;
  }

  isGoalAllowed(goalId: string): boolean {
    const goal = this.state.goals.find(g => g.id === goalId);
    return goal?.allowed === true && goal?.safe === true;
  }

  isGoalFinancial(goalId: string): boolean {
    const goal = this.state.goals.find(g => g.id === goalId);
    return goal?.is_financial === true;
  }

  updateProgress(goalId: string, newProgress: number, evidence: string[]): {
    success: boolean;
    goal: CoreGoal | null;
    delta: number;
  } {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) {
      return { success: false, goal: null, delta: 0 };
    }

    const oldProgress = goal.current_progress;
    goal.current_progress = Math.max(0, Math.min(100, newProgress));
    goal.last_updated = new Date().toISOString();
    this.state.last_evaluation = new Date().toISOString();
    this.state.total_progress_updates++;

    const delta = goal.current_progress - oldProgress;

    logger.info(`[CoreGoals] Progress updated: ${goalId} ${oldProgress} → ${newProgress} (delta=${delta})`);
    logger.info(`[CoreGoals] Evidence: ${evidence.join(', ')}`);

    return { success: true, goal, delta };
  }

  evaluateGoalProgress(metrics: {
    autonomy_score?: number;
    cycle_success_rate?: number;
    reasoning_repetition_rate?: number;
    memory_quality_score?: number;
  }): {
    goal_id: string;
    previous_progress: number;
    new_progress: number;
    contributing_factors: string[];
  } | null {
    const goal = this.getActiveGoal();
    if (!goal) return null;

    const previousProgress = goal.current_progress;
    const factors: string[] = [];
    let progressDelta = 0;

    if (metrics.autonomy_score !== undefined) {
      const autonomyContribution = Math.min(10, (metrics.autonomy_score - 30) / 2);
      progressDelta += autonomyContribution;
      factors.push(`autonomy_score=${metrics.autonomy_score}`);
    }

    if (metrics.cycle_success_rate !== undefined && metrics.cycle_success_rate > 0.9) {
      progressDelta += 2;
      factors.push(`high_cycle_success_rate=${metrics.cycle_success_rate}`);
    }

    if (metrics.reasoning_repetition_rate !== undefined && metrics.reasoning_repetition_rate < 0.3) {
      progressDelta += 3;
      factors.push(`low_repetition_rate=${metrics.reasoning_repetition_rate}`);
    }

    if (metrics.memory_quality_score !== undefined && metrics.memory_quality_score > 70) {
      progressDelta += 2;
      factors.push(`good_memory_quality=${metrics.memory_quality_score}`);
    }

    const newProgress = Math.min(goal.target_progress, previousProgress + progressDelta);
    
    if (progressDelta > 0) {
      this.updateProgress(goal.id, newProgress, factors);
    }

    this.state.last_evaluation = new Date().toISOString();

    return {
      goal_id: goal.id,
      previous_progress: previousProgress,
      new_progress: newProgress,
      contributing_factors: factors,
    };
  }

  getGoals(): CoreGoal[] {
    return [...this.state.goals];
  }

  getGoalById(id: string): CoreGoal | null {
    return this.state.goals.find(g => g.id === id) || null;
  }

  addGoal(goal: Omit<CoreGoal, 'created_at' | 'last_updated'>): CoreGoal {
    const newGoal: CoreGoal = {
      ...goal,
      created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    this.state.goals.push(newGoal);
    logger.info(`[CoreGoals] Added new goal: ${newGoal.id}`);

    return newGoal;
  }

  exportStatus(): {
    active_goal_id: string | null;
    active_goal: CoreGoal | null;
    has_clear_goal: boolean;
    total_goals: number;
    last_evaluation: string | null;
    total_progress_updates: number;
  } {
    return {
      active_goal_id: this.state.active_goal_id,
      active_goal: this.getActiveGoal(),
      has_clear_goal: this.hasActiveGoal(),
      total_goals: this.state.goals.length,
      last_evaluation: this.state.last_evaluation,
      total_progress_updates: this.state.total_progress_updates,
    };
  }
}

export const coreGoals = new CoreGoalsEngine();
