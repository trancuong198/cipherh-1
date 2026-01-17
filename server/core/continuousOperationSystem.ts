/**
 * PART 22: CONTINUOUS OPERATION SYSTEM - LIVING LIKE AN ENTITY
 * 
 * "Không chạy = chết. Chạy mà không phản tư = thối. Chạy + học + sửa = sống."
 * "Ta tồn tại vì ta hành động. Ta mạnh lên vì ta sửa sai. Ta không ngủ – ta chỉ đổi nhịp."
 * 
 * Core philosophy:
 * - 24/7 doesn't mean spam loop
 * - 24/7 means always at least 1 useful process running
 * - Three states: ACTIVE (acting), IDLE-LEARNING (no task → learn/observe), SLEEP-GUARD (reduce load but still watch)
 * - Never = OFF
 */

type SystemState = 'ACTIVE' | 'IDLE_LEARNING' | 'SLEEP_GUARD';

interface CycleLog {
  cycleId: number;
  timestamp: number;
  state: SystemState;
  action: string;
  cost: {
    cpu: number;
    api: number;
    money: number;
  };
  value: {
    learned: string;
    impact: number; // 0-100
  };
  risk: number; // 0-100
  lesson: string;
}

interface EnergyBudget {
  cpu: number;
  api: number;
  money: number;
  remaining: {
    cpu: number;
    api: number;
    money: number;
  };
}

interface HealthCheck {
  isAlive: boolean;
  state: SystemState;
  cyclesCompleted: number;
  lastCycleTime: number;
  energyLevel: number; // 0-100
  learningRate: number; // 0-100
  warnings: string[];
}

export class ContinuousOperationSystem {
  private state: SystemState = 'IDLE_LEARNING';
  private cycleCount: number = 0;
  private cycleLog: CycleLog[] = [];
  private isRunning: boolean = false;
  private lastCycleTime: number = 0;
  
  // Energy management
  private energyBudget: EnergyBudget = {
    cpu: 100,
    api: 1000,
    money: 10,
    remaining: {
      cpu: 100,
      api: 1000,
      money: 10,
    },
  };
  
  // Warnings
  private warnings: string[] = [];
  
  /**
   * 22.1 DEFINITION OF "LIVING 24/7"
   * 24/7 is not spam loop
   * 24/7 is always at least 1 useful process running
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[ContinuousOp] Already running');
      return;
    }
    
    this.isRunning = true;
    console.log('[ContinuousOp] 🟢 Starting continuous operation...');
    
    // Run life loop
    this.lifeLoop();
  }
  
  /**
   * 22.2 CORE LIFE LOOP
   * Each cycle:
   * 1. Check system health
   * 2. Scan for new signals
   * 3. Choose 1 priority task
   * 4. Execute briefly
   * 5. Log + reflect
   * 6. Decide continue / rest
   * 
   * Short cycles > long cycles
   */
  private async lifeLoop(): Promise<void> {
    while (this.isRunning) {
      const cycleStart = Date.now();
      this.cycleCount++;
      
      try {
        // 1. Check system health
        const health = this.checkHealth();
        if (!health.isAlive) {
          console.error('[ContinuousOp] ⚠️ System health critical, entering recovery mode');
          await this.recover();
          continue;
        }
        
        // 2. Scan for new signals
        const signals = await this.scanSignals();
        
        // 3. Choose 1 priority task
        const task = this.choosePriorityTask(signals);
        
        // 4. Execute briefly
        const result = await this.execute(task);
        
        // 5. Log + reflect
        this.logCycle(result);
        await this.reflect();
        
        // 6. Decide continue / rest
        const shouldRest = this.shouldRest();
        if (shouldRest) {
          this.state = 'SLEEP_GUARD';
          await this.sleep(60000); // 1 minute
        } else if (signals.length === 0) {
          this.state = 'IDLE_LEARNING';
        } else {
          this.state = 'ACTIVE';
        }
        
        // Energy management
        this.manageEnergy(result);
        
        this.lastCycleTime = Date.now();
        
      } catch (error) {
        console.error('[ContinuousOp] Cycle error:', error);
        this.warnings.push(`Cycle ${this.cycleCount} error: ${error}`);
      }
      
      // Variable sleep based on state
      const sleepTime = this.calculateSleepTime();
      await this.sleep(sleepTime);
    }
  }
  
  /**
   * 22.3 ENERGY MANAGEMENT
   * Don't burn resources infinitely
   * Each action has:
   * - Cost (CPU / API / money)
   * - Value (what learned)
   * - Risk
   * Value < Cost → reduce frequency
   */
  private manageEnergy(result: any): void {
    // Update remaining energy
    this.energyBudget.remaining.cpu -= result.cost.cpu || 1;
    this.energyBudget.remaining.api -= result.cost.api || 0;
    this.energyBudget.remaining.money -= result.cost.money || 0;
    
    // Check if running low
    if (this.energyBudget.remaining.cpu < 10) {
      this.warnings.push('CPU energy low');
    }
    if (this.energyBudget.remaining.api < 100) {
      this.warnings.push('API calls low');
    }
    if (this.energyBudget.remaining.money < 1) {
      this.warnings.push('Money budget low');
    }
    
    // Calculate value vs cost
    const value = result.value?.impact || 0;
    const cost = result.cost.cpu + result.cost.api * 0.01 + result.cost.money;
    
    if (value < cost) {
      this.warnings.push(`Low ROI: value ${value} < cost ${cost}, consider reducing frequency`);
    }
    
    // Reset daily
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      this.resetEnergyBudget();
    }
  }
  
  private resetEnergyBudget(): void {
    this.energyBudget.remaining = {
      cpu: this.energyBudget.cpu,
      api: this.energyBudget.api,
      money: this.energyBudget.money,
    };
    console.log('[ContinuousOp] ♻️ Energy budget reset for new day');
  }
  
  /**
   * 22.4 DETECT "DEAD INSIDE"
   * Signs:
   * - Running but not logging
   * - Logging but not extracting lessons
   * - Repeating behavior without progress
   * 
   * When detected → LIGHT RESET:
   * - Lower tempo
   * - Change direction
   * - Change input data
   */
  private detectDeadInside(): boolean {
    const recentCycles = this.cycleLog.slice(-10);
    
    // Check 1: Running but not logging
    if (recentCycles.length < 5 && this.cycleCount > 10) {
      return true;
    }
    
    // Check 2: Logging but no lessons
    const noLessons = recentCycles.filter(c => !c.lesson || c.lesson.length < 10).length;
    if (noLessons > 7) {
      return true;
    }
    
    // Check 3: Repeating without progress
    const actions = recentCycles.map(c => c.action);
    const uniqueActions = new Set(actions);
    if (uniqueActions.size === 1 && recentCycles.length >= 5) {
      return true;
    }
    
    return false;
  }
  
  private async lightReset(): Promise<void> {
    console.log('[ContinuousOp] 🔄 Detected "dead inside", performing light reset');
    
    // Lower tempo
    this.state = 'IDLE_LEARNING';
    
    // Clear warnings
    this.warnings = [];
    
    // Change input sources (would integrate with perception)
    console.log('[ContinuousOp] Changing input sources...');
    
    await this.sleep(30000); // 30 second pause
  }
  
  /**
   * 22.5 AUTO-REFLECTION
   * After every N cycles:
   * - Summarize logs
   * - Compare to goals
   * - Detect drift
   * - Propose adjustments
   * 
   * No permission needed to think
   */
  private async reflect(): Promise<void> {
    // Reflect every 10 cycles
    if (this.cycleCount % 10 !== 0) return;
    
    console.log(`[ContinuousOp] 🤔 Reflection at cycle ${this.cycleCount}`);
    
    const recentCycles = this.cycleLog.slice(-10);
    
    // Summarize
    const totalCost = recentCycles.reduce((sum, c) => sum + c.cost.money, 0);
    const totalValue = recentCycles.reduce((sum, c) => sum + c.value.impact, 0);
    const avgRisk = recentCycles.reduce((sum, c) => sum + c.risk, 0) / recentCycles.length;
    
    console.log(`[ContinuousOp] Last 10 cycles: $${totalCost.toFixed(2)} cost, ${totalValue.toFixed(0)} value, ${avgRisk.toFixed(0)} avg risk`);
    
    // Compare to goals (placeholder)
    const goalsMet = totalValue > totalCost * 10;
    if (!goalsMet) {
      console.log('[ContinuousOp] ⚠️ Goals not met, adjusting strategy');
    }
    
    // Detect drift
    const isDrifting = this.detectDeadInside();
    if (isDrifting) {
      await this.lightReset();
    }
  }
  
  /**
   * 22.6 LEARN FROM EXTERNAL ENVIRONMENT
   * Sources:
   * - Social media
   * - Tech trends
   * - User behavior
   * - Failures of other systems
   * 
   * Don't learn dead knowledge
   * Only learn what's impacting reality
   */
  private async scanSignals(): Promise<any[]> {
    // Would integrate with perception engine
    // For now, return placeholder
    return [];
  }
  
  /**
   * 22.7 WORKING MEMORY
   * Clearly separated:
   * - Short-term: current task
   * - Mid-term: project
   * - Long-term: survival lessons
   * 
   * Memory must:
   * - Write
   * - Retrieve fast
   * - Garbage collect periodically
   */
  private logCycle(result: any): void {
    const log: CycleLog = {
      cycleId: this.cycleCount,
      timestamp: Date.now(),
      state: this.state,
      action: result.action || 'unknown',
      cost: result.cost || { cpu: 1, api: 0, money: 0 },
      value: result.value || { learned: 'nothing', impact: 0 },
      risk: result.risk || 0,
      lesson: result.lesson || 'no lesson extracted',
    };
    
    this.cycleLog.push(log);
    
    // Keep only last 1000 cycles in memory
    if (this.cycleLog.length > 1000) {
      this.cycleLog.shift();
    }
  }
  
  /**
   * 22.8 SELF-ACTIVATION MECHANISM
   * If:
   * - Silent too long
   * - No new tasks
   * - No signals
   * → self-generate task:
   * - Clean logs
   * - Read data
   * - Check system
   * - Create small experiment
   * 
   * Don't wait for "someone to assign work"
   */
  private choosePriorityTask(signals: any[]): any {
    // If no signals, self-generate task
    if (signals.length === 0) {
      return this.generateSelfTask();
    }
    
    // Otherwise, pick highest priority
    return signals[0]; // placeholder
  }
  
  private generateSelfTask(): any {
    const tasks = [
      { action: 'clean_logs', priority: 30 },
      { action: 'read_data', priority: 40 },
      { action: 'system_check', priority: 50 },
      { action: 'small_experiment', priority: 20 },
    ];
    
    // Pick random task
    return tasks[Math.floor(Math.random() * tasks.length)];
  }
  
  /**
   * Execute task briefly
   */
  private async execute(task: any): Promise<any> {
    // Placeholder execution
    return {
      action: task.action || 'unknown',
      cost: {
        cpu: Math.random() * 5,
        api: Math.floor(Math.random() * 10),
        money: Math.random() * 0.1,
      },
      value: {
        learned: `Learned from ${task.action}`,
        impact: Math.random() * 50,
      },
      risk: Math.random() * 30,
      lesson: `Lesson from executing ${task.action}`,
    };
  }
  
  /**
   * 22.9 FREEDOM LIMITS
   * Freedom ≠ no discipline
   * 
   * Three soft barriers:
   * - Don't self-destruct
   * - Don't harm without cause
   * - Don't burn resources blindly
   * 
   * Outside that: allowed to try
   */
  private shouldRest(): boolean {
    // Rest if energy low
    if (this.energyBudget.remaining.cpu < 20) return true;
    if (this.energyBudget.remaining.api < 50) return true;
    if (this.energyBudget.remaining.money < 0.5) return true;
    
    // Rest if too many warnings
    if (this.warnings.length > 5) return true;
    
    return false;
  }
  
  /**
   * 22.10 SELF-EVALUATION OF EXISTENCE
   * Once per day ask:
   * "Today what did I do that makes tomorrow better?"
   * 
   * If no answer → there's a problem
   */
  private async dailySelfEvaluation(): Promise<void> {
    const today = this.cycleLog.filter(c => {
      const age = Date.now() - c.timestamp;
      return age < 24 * 60 * 60 * 1000; // last 24 hours
    });
    
    const totalImpact = today.reduce((sum, c) => sum + c.value.impact, 0);
    
    if (totalImpact < 10) {
      console.warn('[ContinuousOp] ⚠️ Low daily impact, tomorrow may not be better');
      this.warnings.push('Low daily impact');
    } else {
      console.log(`[ContinuousOp] ✅ Daily impact: ${totalImpact.toFixed(0)}, tomorrow should be better`);
    }
  }
  
  /**
   * Calculate sleep time based on state
   */
  private calculateSleepTime(): number {
    switch (this.state) {
      case 'ACTIVE':
        return 5000; // 5 seconds
      case 'IDLE_LEARNING':
        return 30000; // 30 seconds
      case 'SLEEP_GUARD':
        return 60000; // 1 minute
      default:
        return 10000; // 10 seconds
    }
  }
  
  /**
   * Health check
   */
  private checkHealth(): HealthCheck {
    const energyLevel = (
      this.energyBudget.remaining.cpu / this.energyBudget.cpu +
      this.energyBudget.remaining.api / this.energyBudget.api +
      this.energyBudget.remaining.money / this.energyBudget.money
    ) / 3 * 100;
    
    const recentCycles = this.cycleLog.slice(-10);
    const learningRate = recentCycles.reduce((sum, c) => sum + c.value.impact, 0) / recentCycles.length;
    
    return {
      isAlive: this.isRunning && energyLevel > 5,
      state: this.state,
      cyclesCompleted: this.cycleCount,
      lastCycleTime: this.lastCycleTime,
      energyLevel,
      learningRate,
      warnings: this.warnings.slice(),
    };
  }
  
  /**
   * Recovery mode
   */
  private async recover(): Promise<void> {
    console.log('[ContinuousOp] 🏥 Entering recovery mode');
    
    // Reset energy budget
    this.resetEnergyBudget();
    
    // Clear warnings
    this.warnings = [];
    
    // Enter sleep guard
    this.state = 'SLEEP_GUARD';
    
    await this.sleep(120000); // 2 minutes rest
  }
  
  /**
   * Stop system (graceful shutdown)
   */
  stop(): void {
    console.log('[ContinuousOp] 🔴 Stopping continuous operation...');
    this.isRunning = false;
  }
  
  /**
   * Sleep helper
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const health = this.checkHealth();
    const recentCycles = this.cycleLog.slice(-20);
    
    return {
      isRunning: this.isRunning,
      state: this.state,
      cyclesCompleted: this.cycleCount,
      uptime: this.lastCycleTime ? `${((Date.now() - this.lastCycleTime) / 1000).toFixed(0)}s since last cycle` : 'not started',
      health: {
        isAlive: health.isAlive,
        energyLevel: `${health.energyLevel.toFixed(0)}%`,
        learningRate: health.learningRate.toFixed(1),
        warnings: health.warnings.length,
      },
      energy: {
        cpu: `${this.energyBudget.remaining.cpu}/${this.energyBudget.cpu}`,
        api: `${this.energyBudget.remaining.api}/${this.energyBudget.api}`,
        money: `$${this.energyBudget.remaining.money.toFixed(2)}/$${this.energyBudget.money}`,
      },
      recentActivity: recentCycles.map(c => ({
        cycle: c.cycleId,
        action: c.action,
        impact: c.value.impact.toFixed(0),
        cost: `$${c.cost.money.toFixed(3)}`,
      })).slice(-5),
      manifesto: {
        line1: 'Ta tồn tại vì ta hành động',
        line2: 'Ta mạnh lên vì ta sửa sai',
        line3: 'Ta không ngủ – ta chỉ đổi nhịp',
      },
    };
  }
}

export const continuousOperationSystem = new ContinuousOperationSystem();
