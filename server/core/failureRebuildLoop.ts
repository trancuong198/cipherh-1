/**
 * PART 67: FAILURE REBUILD LOOP
 * 
 * Philosophy: "Thất bại ≠ sai. Thất bại = dữ liệu đắt tiền. Lặp lại thất bại cũ = ngu."
 * 
 * Core Principles:
 * - Failure is expensive data, not shame
 * - Repeating old failures = stupidity
 * - Rapid rebuild (≤48h) without sentimentality
 * - Actionable lessons only (1 sentence, specific)
 * - Cut 30-50% functions, keep money-makers
 */

interface FailureEvent {
  id: string;
  timestamp: Date;
  type: 'FINANCIAL_LOSS' | 'PLATFORM_BLOCK' | 'NO_SALES' | 'USER_CHURN' | 'TECHNICAL_FAILURE';
  
  // 5 mandatory fields for failure analysis
  event: string;              // What happened?
  initialAssumption: string;   // What did we believe?
  reality: string;             // What was actually true?
  rootCause: string;           // Root cause (no external blame)
  actionableLesson: string;    // 1 sentence, specific, actionable
  
  // Metadata
  costImpact: number;          // $ lost
  timeImpact: number;          // hours wasted
  category: string;            // niche/product/marketing/technical
  isRepeatedFailure: boolean;
  repeatCount: number;
}

interface FailurePattern {
  rootCause: string;
  occurrences: number;
  totalCost: number;
  firstSeen: Date;
  lastSeen: Date;
  actionTaken: 'DEPRIORITIZED' | 'DELETED' | 'ACTIVE';
  lessons: string[];
}

interface RebuildPlan {
  id: string;
  trigger: 'LOW_EFFICIENCY' | 'REPEATED_FAILURES' | 'REVENUE_DECLINE';
  cutFunctions: string[];     // 30-50% to remove
  keepFunctions: string[];    // Money-makers & error-reducers
  rebuildDeadline: Date;      // ≤48h from trigger
  expectedImprovement: number; // % improvement target
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

interface RecoveryMetrics {
  timeFromFailureToAction: number;  // minutes
  improvementRate: number;           // % improvement per cycle
  assumptionsBroken: number;         // count of invalidated beliefs
  recoverySpeed: 'FAST' | 'MODERATE' | 'SLOW' | 'DYING';
}

export class FailureRebuildLoop {
  private failures: Map<string, FailureEvent> = new Map();
  private patterns: Map<string, FailurePattern> = new Map();
  private rebuilds: Map<string, RebuildPlan> = new Map();
  private recoveryMetrics: RecoveryMetrics[] = [];
  
  // Configuration
  private readonly REPEAT_DEPRIORITIZE_THRESHOLD = 2;
  private readonly REPEAT_DELETE_THRESHOLD = 3;
  private readonly REBUILD_DEADLINE_HOURS = 48;
  private readonly MIN_CUT_PERCENTAGE = 30;
  private readonly MAX_CUT_PERCENTAGE = 50;
  private readonly FAST_RECOVERY_MINUTES = 60;
  private readonly SLOW_RECOVERY_MINUTES = 240;

  constructor() {
    this.initializeFailureTracking();
  }

  /**
   * 67.1 & 67.2: Record and dissect failure
   * MANDATORY: All 5 fields must be filled
   */
  async recordFailure(failure: Omit<FailureEvent, 'id' | 'timestamp' | 'isRepeatedFailure' | 'repeatCount'>): Promise<void> {
    // Validate all 5 mandatory fields
    if (!failure.event || !failure.initialAssumption || !failure.reality || 
        !failure.rootCause || !failure.actionableLesson) {
      throw new Error('INVALID_FAILURE_RECORD: All 5 fields mandatory (event, assumption, reality, rootCause, lesson)');
    }

    // Validate actionable lesson format (1 sentence, specific)
    if (failure.actionableLesson.split('.').length > 2) {
      console.warn('Lesson should be 1 sentence. Consider simplifying.');
    }

    const failureId = `FAIL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if this is a repeated failure
    const existingPattern = this.patterns.get(failure.rootCause);
    const isRepeated = !!existingPattern;
    const repeatCount = existingPattern ? existingPattern.occurrences + 1 : 1;

    const failureEvent: FailureEvent = {
      id: failureId,
      timestamp: new Date(),
      isRepeatedFailure: isRepeated,
      repeatCount,
      ...failure
    };

    // Store failure
    this.failures.set(failureId, failureEvent);

    // Update pattern tracking
    await this.updateFailurePattern(failureEvent);

    // Apply automatic elimination rules (67.3)
    await this.applyEliminationRules(failureEvent);

    // Calculate recovery metrics
    await this.updateRecoveryMetrics(failureEvent);

    // Log for learning
    console.log(`[FAILURE_RECORDED] ${failureEvent.type} - Repeat: ${repeatCount}x`);
    console.log(`  Lesson: ${failureEvent.actionableLesson}`);
  }

  /**
   * 67.3: Automatic elimination rules
   */
  private async applyEliminationRules(failure: FailureEvent): Promise<void> {
    const pattern = this.patterns.get(failure.rootCause);
    if (!pattern) return;

    // Rule 1: 2 failures → deprioritize
    if (pattern.occurrences === this.REPEAT_DEPRIORITIZE_THRESHOLD) {
      pattern.actionTaken = 'DEPRIORITIZED';
      console.log(`[DEPRIORITIZED] ${failure.rootCause} - Failed 2x, lowering priority`);
    }

    // Rule 2: 3 failures same cause → delete
    if (pattern.occurrences >= this.REPEAT_DELETE_THRESHOLD) {
      pattern.actionTaken = 'DELETED';
      console.log(`[DELETED] ${failure.rootCause} - Failed 3x, removing completely`);
      
      // Trigger rebuild if this was a major component
      if (failure.costImpact > 100 || failure.timeImpact > 10) {
        await this.triggerRebuild('REPEATED_FAILURES');
      }
    }

    // Rule 3: Users don't pay → ignore strategic opinions
    if (failure.type === 'NO_SALES' && failure.category === 'product') {
      console.log(`[IGNORE_OPINIONS] Non-paying users' strategic feedback ignored`);
    }
  }

  /**
   * 67.4: Fast rebuild (≤48h)
   */
  async triggerRebuild(trigger: RebuildPlan['trigger']): Promise<RebuildPlan> {
    const rebuildId = `REBUILD_${Date.now()}`;
    
    // Identify functions to cut (30-50%)
    const allFunctions = await this.identifySystemFunctions();
    const moneyMakers = allFunctions.filter(f => f.generatesRevenue || f.reducesErrors);
    const nonEssential = allFunctions.filter(f => !moneyMakers.includes(f));
    
    // Calculate cut percentage
    const cutCount = Math.floor(allFunctions.length * (this.MIN_CUT_PERCENTAGE + 
      Math.random() * (this.MAX_CUT_PERCENTAGE - this.MIN_CUT_PERCENTAGE)) / 100);
    
    const cutFunctions = nonEssential.slice(0, Math.min(cutCount, nonEssential.length))
      .map(f => f.name);
    const keepFunctions = moneyMakers.map(f => f.name);

    const rebuildPlan: RebuildPlan = {
      id: rebuildId,
      trigger,
      cutFunctions,
      keepFunctions,
      rebuildDeadline: new Date(Date.now() + this.REBUILD_DEADLINE_HOURS * 60 * 60 * 1000),
      expectedImprovement: this.calculateExpectedImprovement(cutFunctions.length, keepFunctions.length),
      status: 'PLANNED'
    };

    this.rebuilds.set(rebuildId, rebuildPlan);

    console.log(`[REBUILD_TRIGGERED] ${trigger}`);
    console.log(`  Cutting: ${cutFunctions.length} functions (${(cutFunctions.length / allFunctions.length * 100).toFixed(1)}%)`);
    console.log(`  Keeping: ${keepFunctions.length} money-makers/error-reducers`);
    console.log(`  Deadline: ${this.REBUILD_DEADLINE_HOURS}h`);

    return rebuildPlan;
  }

  /**
   * Execute rebuild plan
   */
  async executeRebuild(rebuildId: string): Promise<boolean> {
    const plan = this.rebuilds.get(rebuildId);
    if (!plan) {
      throw new Error(`Rebuild plan ${rebuildId} not found`);
    }

    plan.status = 'IN_PROGRESS';

    try {
      // Phase 1: Cut non-essential functions
      for (const funcName of plan.cutFunctions) {
        await this.disableFunction(funcName);
      }

      // Phase 2: Optimize kept functions
      for (const funcName of plan.keepFunctions) {
        await this.optimizeFunction(funcName);
      }

      // Phase 3: Validate system still works
      const isHealthy = await this.validateSystemHealth();
      
      if (isHealthy) {
        plan.status = 'COMPLETED';
        console.log(`[REBUILD_COMPLETE] ${rebuildId} - System leaner and faster`);
        return true;
      } else {
        plan.status = 'FAILED';
        console.log(`[REBUILD_FAILED] ${rebuildId} - Rolling back`);
        await this.rollbackRebuild(rebuildId);
        return false;
      }
    } catch (error) {
      plan.status = 'FAILED';
      console.error(`[REBUILD_ERROR] ${rebuildId}:`, error);
      return false;
    }
  }

  /**
   * 67.5: Recovery metrics calculation
   */
  private async updateRecoveryMetrics(failure: FailureEvent): Promise<void> {
    const now = Date.now();
    const failureTime = failure.timestamp.getTime();
    
    // Find next action after this failure
    const nextActionTime = now; // Simplified - would track actual next action
    const recoveryTime = (nextActionTime - failureTime) / (1000 * 60); // minutes

    // Calculate improvement rate (simplified)
    const previousFailures = Array.from(this.failures.values())
      .filter(f => f.rootCause === failure.rootCause && f.timestamp < failure.timestamp);
    
    const improvementRate = previousFailures.length > 0
      ? ((previousFailures[0].costImpact - failure.costImpact) / previousFailures[0].costImpact) * 100
      : 0;

    // Count assumptions broken
    const assumptionsBroken = Array.from(this.patterns.values())
      .filter(p => p.occurrences > 0).length;

    // Determine recovery speed
    let recoverySpeed: RecoveryMetrics['recoverySpeed'];
    if (recoveryTime < this.FAST_RECOVERY_MINUTES) {
      recoverySpeed = 'FAST';
    } else if (recoveryTime < this.SLOW_RECOVERY_MINUTES) {
      recoverySpeed = 'MODERATE';
    } else if (improvementRate > 0) {
      recoverySpeed = 'SLOW';
    } else {
      recoverySpeed = 'DYING';
    }

    const metrics: RecoveryMetrics = {
      timeFromFailureToAction: recoveryTime,
      improvementRate,
      assumptionsBroken,
      recoverySpeed
    };

    this.recoveryMetrics.push(metrics);

    // Alert if dying
    if (recoverySpeed === 'DYING') {
      console.error('[CRITICAL] Recovery speed: DYING - System not improving');
      await this.triggerRebuild('LOW_EFFICIENCY');
    }
  }

  /**
   * Update failure pattern tracking
   */
  private async updateFailurePattern(failure: FailureEvent): Promise<void> {
    let pattern = this.patterns.get(failure.rootCause);
    
    if (!pattern) {
      pattern = {
        rootCause: failure.rootCause,
        occurrences: 0,
        totalCost: 0,
        firstSeen: failure.timestamp,
        lastSeen: failure.timestamp,
        actionTaken: 'ACTIVE',
        lessons: []
      };
      this.patterns.set(failure.rootCause, pattern);
    }

    pattern.occurrences++;
    pattern.totalCost += failure.costImpact;
    pattern.lastSeen = failure.timestamp;
    pattern.lessons.push(failure.actionableLesson);
  }

  /**
   * Get failure analysis summary
   */
  getFailureAnalysis(): {
    totalFailures: number;
    repeatedFailures: number;
    mostCostlyPattern: FailurePattern | null;
    averageRecoveryTime: number;
    currentRecoverySpeed: RecoveryMetrics['recoverySpeed'];
    activeRebuilds: number;
  } {
    const totalFailures = this.failures.size;
    const repeatedFailures = Array.from(this.failures.values())
      .filter(f => f.isRepeatedFailure).length;

    const mostCostly = Array.from(this.patterns.values())
      .sort((a, b) => b.totalCost - a.totalCost)[0] || null;

    const avgRecoveryTime = this.recoveryMetrics.length > 0
      ? this.recoveryMetrics.reduce((sum, m) => sum + m.timeFromFailureToAction, 0) / this.recoveryMetrics.length
      : 0;

    const currentSpeed = this.recoveryMetrics.length > 0
      ? this.recoveryMetrics[this.recoveryMetrics.length - 1].recoverySpeed
      : 'MODERATE';

    const activeRebuilds = Array.from(this.rebuilds.values())
      .filter(r => r.status === 'IN_PROGRESS' || r.status === 'PLANNED').length;

    return {
      totalFailures,
      repeatedFailures,
      mostCostlyPattern: mostCostly,
      averageRecoveryTime: avgRecoveryTime,
      currentRecoverySpeed: currentSpeed,
      activeRebuilds
    };
  }

  /**
   * Get lessons learned
   */
  getLessonsLearned(): string[] {
    const lessons: string[] = [];
    
    for (const pattern of this.patterns.values()) {
      if (pattern.actionTaken === 'DELETED' || pattern.actionTaken === 'DEPRIORITIZED') {
        lessons.push(...pattern.lessons);
      }
    }

    return [...new Set(lessons)]; // Deduplicate
  }

  /**
   * Check if idea should be rejected based on past failures
   */
  shouldRejectIdea(ideaDescription: string, category: string): boolean {
    // Check for patterns that match this idea
    for (const [rootCause, pattern] of this.patterns.entries()) {
      if (pattern.actionTaken === 'DELETED' && 
          (ideaDescription.toLowerCase().includes(rootCause.toLowerCase()) ||
           category === pattern.lessons[0]?.split(' ')[0])) {
        console.log(`[IDEA_REJECTED] Similar to deleted pattern: ${rootCause}`);
        return true;
      }
    }
    return false;
  }

  // Helper methods
  private async initializeFailureTracking(): Promise<void> {
    // Initialize tracking systems
    console.log('[FAILURE_TRACKING] Initialized - Ready to learn from failures');
  }

  private async identifySystemFunctions(): Promise<Array<{name: string, generatesRevenue: boolean, reducesErrors: boolean}>> {
    // Simplified - would scan actual system
    return [
      { name: 'contentGeneration', generatesRevenue: true, reducesErrors: false },
      { name: 'errorMonitoring', generatesRevenue: false, reducesErrors: true },
      { name: 'analytics', generatesRevenue: false, reducesErrors: false },
      { name: 'paymentProcessing', generatesRevenue: true, reducesErrors: false },
      { name: 'socialPosting', generatesRevenue: true, reducesErrors: false },
      { name: 'uiTheming', generatesRevenue: false, reducesErrors: false },
      { name: 'advancedReporting', generatesRevenue: false, reducesErrors: false },
    ];
  }

  private calculateExpectedImprovement(cutCount: number, keepCount: number): number {
    // Estimate improvement based on focus
    const focusRatio = keepCount / (keepCount + cutCount);
    return Math.min(50, focusRatio * 100);
  }

  private async disableFunction(name: string): Promise<void> {
    console.log(`[DISABLE] ${name} - Cutting non-essential function`);
  }

  private async optimizeFunction(name: string): Promise<void> {
    console.log(`[OPTIMIZE] ${name} - Enhancing money-maker/error-reducer`);
  }

  private async validateSystemHealth(): Promise<boolean> {
    // Simplified health check
    return true;
  }

  private async rollbackRebuild(rebuildId: string): Promise<void> {
    console.log(`[ROLLBACK] ${rebuildId} - Restoring previous state`);
  }
}

// Export singleton instance
export const failureRebuildLoop = new FailureRebuildLoop();
