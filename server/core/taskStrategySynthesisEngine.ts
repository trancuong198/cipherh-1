import { logger } from '../services/logger';
import { evolutionKernel } from './evolutionKernel';
import { memoryDistiller } from './memoryDistiller';
import { desireEngine } from './desireEngine';
import { measurementEngine } from './measurementEngine';
import { governanceEngine } from './governanceEngine';
import { soulState } from './soulState';

export type StrategyStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'abandoned';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Strategy {
  id: string;
  name: string;
  description: string;
  horizon: 'weekly' | 'monthly';
  status: StrategyStatus;
  priority: number;
  source: 'evolution' | 'measurement' | 'desire' | 'feedback' | 'governance';
  rationale: string;
  createdAt: string;
  updatedAt: string;
  cycleCreated: number;
  taskCount: number;
  completedTasks: number;
}

export interface Task {
  id: string;
  strategyId: string;
  name: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  rationale: string;
  whyNow: string;
  blockedReason?: string;
  alternativeAction?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cycleCreated: number;
}

export interface SynthesisResult {
  strategiesCreated: number;
  strategiesUpdated: number;
  tasksGenerated: number;
  tasksPruned: number;
  blockedTasks: number;
}

export interface TaskStrategySynthesisState {
  strategies: Strategy[];
  tasks: Task[];
  maxActiveStrategies: number;
  maxActiveTasks: number;
  lastSynthesis: string;
  totalSyntheses: number;
  synthesisLog: Array<{
    timestamp: string;
    cycle: number;
    result: SynthesisResult;
  }>;
}

class TaskStrategySynthesisEngine {
  private state: TaskStrategySynthesisState;
  private readonly maxLogEntries = 100;

  constructor() {
    this.state = {
      strategies: [],
      tasks: [],
      maxActiveStrategies: 3,
      maxActiveTasks: 7,
      lastSynthesis: new Date().toISOString(),
      totalSyntheses: 0,
      synthesisLog: [],
    };

    logger.info('[TaskStrategySynthesis] Engine initialized');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getActiveStrategies(): Strategy[] {
    return this.state.strategies.filter(s => s.status === 'active');
  }

  private getActiveTasks(): Task[] {
    return this.state.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  }

  async synthesize(): Promise<SynthesisResult> {
    logger.info('[TaskStrategySynthesis] Running synthesis...');
    
    const result: SynthesisResult = {
      strategiesCreated: 0,
      strategiesUpdated: 0,
      tasksGenerated: 0,
      tasksPruned: 0,
      blockedTasks: 0,
    };

    const evolutionState = evolutionKernel.getState();
    const memoryStatus = memoryDistiller.exportStatus();
    const desires = desireEngine.getAchievableDesires();
    const measurementStatus = measurementEngine.exportStatus();
    const govStatus = governanceEngine.exportStatus();

    if (evolutionState.stagnationCounter > 3) {
      const created = this.createStrategyIfNotExists(
        'Break Stagnation',
        'Focus on architectural changes to escape evolutionary stagnation',
        'evolution',
        'Stagnation detected for multiple cycles'
      );
      if (created) result.strategiesCreated++;
    }

    if (measurementStatus.latestScore && measurementStatus.latestScore < 60) {
      const created = this.createStrategyIfNotExists(
        'Improve Core Metrics',
        'Address declining measurement scores through targeted improvements',
        'measurement',
        `Latest score ${measurementStatus.latestScore}/100 below threshold`
      );
      if (created) result.strategiesCreated++;
    }

    for (const desire of desires.slice(0, 2)) {
      if (desire.priority === 'high') {
        const created = this.createStrategyIfNotExists(
          `Fulfill: ${desire.description.substring(0, 30)}`,
          desire.description,
          'desire',
          'High-priority achievable desire'
        );
        if (created) result.strategiesCreated++;
      }
    }

    if (govStatus.conservativeMode) {
      const created = this.createStrategyIfNotExists(
        'Restore Safety Confidence',
        'Address governance concerns and exit conservative mode',
        'governance',
        'Conservative mode active due to recent violations'
      );
      if (created) result.strategiesCreated++;
    }

    this.pruneExcessStrategies();

    const activeStrategies = this.getActiveStrategies();
    for (const strategy of activeStrategies) {
      const strategyTasks = this.state.tasks.filter(t => t.strategyId === strategy.id);
      const activeTasks = strategyTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

      if (activeTasks.length < 2 && this.getActiveTasks().length < this.state.maxActiveTasks) {
        const generated = await this.generateTasksForStrategy(strategy);
        result.tasksGenerated += generated;
      }
    }

    result.tasksPruned = this.pruneExcessTasks();
    result.blockedTasks = await this.checkBlockedTasks();

    result.strategiesUpdated = this.updateStrategyProgress();

    this.state.totalSyntheses++;
    this.state.lastSynthesis = new Date().toISOString();

    this.state.synthesisLog.push({
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      result,
    });

    if (this.state.synthesisLog.length > this.maxLogEntries) {
      this.state.synthesisLog.shift();
    }

    logger.info(`[TaskStrategySynthesis] Complete: ${result.strategiesCreated} strategies, ${result.tasksGenerated} tasks`);
    return result;
  }

  private createStrategyIfNotExists(
    name: string,
    description: string,
    source: Strategy['source'],
    rationale: string
  ): boolean {
    const existing = this.state.strategies.find(s => 
      s.name === name && s.status === 'active'
    );

    if (existing) return false;

    if (this.getActiveStrategies().length >= this.state.maxActiveStrategies) {
      return false;
    }

    const strategy: Strategy = {
      id: this.generateId('strat'),
      name,
      description,
      horizon: 'weekly',
      status: 'active',
      priority: source === 'governance' ? 100 : source === 'measurement' ? 80 : 60,
      source,
      rationale,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cycleCreated: soulState.cycleCount,
      taskCount: 0,
      completedTasks: 0,
    };

    this.state.strategies.push(strategy);
    logger.info(`[TaskStrategySynthesis] Strategy created: ${name}`);
    return true;
  }

  private async generateTasksForStrategy(strategy: Strategy): Promise<number> {
    const tasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'cycleCreated'>[] = [];

    switch (strategy.source) {
      case 'evolution':
        tasks.push({
          strategyId: strategy.id,
          name: 'Analyze evolution blockers',
          description: 'Identify what is preventing evolution progress',
          priority: 'high',
          status: 'pending',
          rationale: 'Understanding blockers enables targeted action',
          whyNow: 'Stagnation is active, immediate analysis needed',
        });
        tasks.push({
          strategyId: strategy.id,
          name: 'Propose architectural change',
          description: 'Generate one concrete proposal for system improvement',
          priority: 'medium',
          status: 'pending',
          rationale: 'Evolution requires structural changes',
          whyNow: 'Analysis must lead to actionable proposals',
        });
        break;

      case 'measurement':
        const metrics = measurementEngine.runAllMeasurements();
        const weakest = Object.entries(metrics)
          .sort((a, b) => a[1].currentScore - b[1].currentScore)[0];
        
        if (weakest) {
          tasks.push({
            strategyId: strategy.id,
            name: `Improve ${weakest[0]} metric`,
            description: `Current score: ${weakest[1].currentScore}/100. Target: +10 points`,
            priority: 'high',
            status: 'pending',
            rationale: `${weakest[0]} is the weakest domain`,
            whyNow: 'Measurement-driven prioritization',
          });
        }
        break;

      case 'desire':
        tasks.push({
          strategyId: strategy.id,
          name: 'Define success criteria',
          description: 'What does completion look like for this desire?',
          priority: 'high',
          status: 'pending',
          rationale: 'Clear criteria prevent scope creep',
          whyNow: 'Must define before executing',
        });
        tasks.push({
          strategyId: strategy.id,
          name: 'Execute first step',
          description: 'Take the minimal viable action toward fulfillment',
          priority: 'medium',
          status: 'pending',
          rationale: 'Action generates feedback and momentum',
          whyNow: 'Criteria defined, ready to act',
        });
        break;

      case 'governance':
        tasks.push({
          strategyId: strategy.id,
          name: 'Review recent violations',
          description: 'Understand what triggered conservative mode',
          priority: 'critical',
          status: 'pending',
          rationale: 'Cannot fix what is not understood',
          whyNow: 'Safety takes priority',
        });
        tasks.push({
          strategyId: strategy.id,
          name: 'Implement safeguard',
          description: 'Add check to prevent recurrence',
          priority: 'high',
          status: 'pending',
          rationale: 'Prevention better than repeated violations',
          whyNow: 'After understanding, implement fix',
        });
        break;

      case 'feedback':
        tasks.push({
          strategyId: strategy.id,
          name: 'Categorize feedback',
          description: 'Sort feedback into actionable categories',
          priority: 'medium',
          status: 'pending',
          rationale: 'Organization enables systematic response',
          whyNow: 'Feedback backlog needs processing',
        });
        break;
    }

    let created = 0;
    for (const taskData of tasks) {
      if (this.getActiveTasks().length >= this.state.maxActiveTasks) break;

      const task: Task = {
        ...taskData,
        id: this.generateId('task'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cycleCreated: soulState.cycleCount,
      };

      this.state.tasks.push(task);
      strategy.taskCount++;
      created++;
    }

    return created;
  }

  private pruneExcessStrategies(): void {
    const active = this.getActiveStrategies();
    
    if (active.length <= this.state.maxActiveStrategies) return;

    const sorted = active.sort((a, b) => a.priority - b.priority);
    const toRemove = sorted.slice(0, active.length - this.state.maxActiveStrategies);

    for (const strategy of toRemove) {
      strategy.status = 'paused';
      strategy.updatedAt = new Date().toISOString();
      logger.info(`[TaskStrategySynthesis] Strategy paused: ${strategy.name}`);
    }
  }

  private pruneExcessTasks(): number {
    const active = this.getActiveTasks();
    
    if (active.length <= this.state.maxActiveTasks) return 0;

    const sorted = active.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    const toRemove = sorted.slice(this.state.maxActiveTasks);
    
    for (const task of toRemove) {
      task.status = 'abandoned';
      task.updatedAt = new Date().toISOString();
    }

    return toRemove.length;
  }

  private async checkBlockedTasks(): Promise<number> {
    let blocked = 0;

    for (const task of this.getActiveTasks()) {
      const check = await governanceEngine.checkDecision('strategy', task.description);
      
      if (!check.approved) {
        task.status = 'blocked';
        task.blockedReason = check.recommendation;
        task.updatedAt = new Date().toISOString();
        
        task.alternativeAction = this.generateAlternative(task);
        blocked++;
        
        logger.warn(`[TaskStrategySynthesis] Task blocked: ${task.name}`);
      }
    }

    return blocked;
  }

  private generateAlternative(task: Task): string {
    if (task.priority === 'critical') {
      return 'Escalate to human review with full context';
    }
    
    if (task.name.includes('change') || task.name.includes('modify')) {
      return 'Create proposal document instead of direct change';
    }

    return 'Defer until governance constraints are relaxed';
  }

  private updateStrategyProgress(): number {
    let updated = 0;

    for (const strategy of this.state.strategies) {
      const tasks = this.state.tasks.filter(t => t.strategyId === strategy.id);
      const completed = tasks.filter(t => t.status === 'completed').length;
      
      if (completed !== strategy.completedTasks) {
        strategy.completedTasks = completed;
        strategy.updatedAt = new Date().toISOString();
        updated++;

        if (completed === strategy.taskCount && strategy.taskCount > 0) {
          strategy.status = 'completed';
          logger.info(`[TaskStrategySynthesis] Strategy completed: ${strategy.name}`);
        }
      }
    }

    return updated;
  }

  completeTask(taskId: string): boolean {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    const strategy = this.state.strategies.find(s => s.id === task.strategyId);
    if (strategy) {
      strategy.completedTasks++;
      strategy.updatedAt = new Date().toISOString();
    }

    logger.info(`[TaskStrategySynthesis] Task completed: ${task.name}`);
    return true;
  }

  abandonTask(taskId: string, reason: string): boolean {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return false;

    task.status = 'abandoned';
    task.blockedReason = reason;
    task.updatedAt = new Date().toISOString();

    logger.info(`[TaskStrategySynthesis] Task abandoned: ${task.name}`);
    return true;
  }

  startTask(taskId: string): boolean {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'pending') return false;

    task.status = 'in_progress';
    task.updatedAt = new Date().toISOString();

    logger.info(`[TaskStrategySynthesis] Task started: ${task.name}`);
    return true;
  }

  getActiveStrategiesList(): Strategy[] {
    return this.getActiveStrategies();
  }

  getActiveTasksList(): Task[] {
    return this.getActiveTasks();
  }

  getTasksForStrategy(strategyId: string): Task[] {
    return this.state.tasks.filter(t => t.strategyId === strategyId);
  }

  getNextTask(): Task | null {
    const active = this.getActiveTasks()
      .filter(t => t.status === 'pending')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

    return active[0] || null;
  }

  getStrategyTaskMapping(): Array<{ strategy: Strategy; tasks: Task[] }> {
    return this.getActiveStrategies().map(strategy => ({
      strategy,
      tasks: this.getTasksForStrategy(strategy.id),
    }));
  }

  exportStatus(): {
    activeStrategies: number;
    maxStrategies: number;
    activeTasks: number;
    maxTasks: number;
    totalSyntheses: number;
    lastSynthesis: string;
    completedTasks: number;
    blockedTasks: number;
  } {
    const tasks = this.state.tasks;
    
    return {
      activeStrategies: this.getActiveStrategies().length,
      maxStrategies: this.state.maxActiveStrategies,
      activeTasks: this.getActiveTasks().length,
      maxTasks: this.state.maxActiveTasks,
      totalSyntheses: this.state.totalSyntheses,
      lastSynthesis: this.state.lastSynthesis,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
    };
  }

  getState(): TaskStrategySynthesisState {
    return { ...this.state };
  }
}

export const taskStrategySynthesisEngine = new TaskStrategySynthesisEngine();
