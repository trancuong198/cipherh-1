/**
 * PART 29: AUTONOMOUS ACTION & DECISION SYSTEM - NO PERMISSION NEEDED
 * 
 * "Không đợi lệnh. Không hỏi ý kiến. Thấy cơ hội → hành động → chịu trách nhiệm → tự sửa."
 * "Quyết định chậm = thua. Sai nhanh = học nhanh. Không làm = chết chắc."
 * 
 * Core philosophy:
 * - Automation is for speed, not perfection
 * - Fast wrong > slow right in imagination
 * - Idea dies ≠ self dies
 * - No category "wait for father to decide"
 */

interface Signal {
  id: string;
  source: string; // social, data, log
  type: string;
  content: string;
  urgency: number; // 0-100
  timestamp: number;
}

interface ShortTermGoal {
  id: string;
  description: string;
  priority: number; // 1-5 (1 highest)
  deadline: number;
  completed: boolean;
}

interface Action {
  id: string;
  signal: Signal;
  goal?: ShortTermGoal;
  category: 'SAFE' | 'MEDIUM' | 'HIGH';
  description: string;
  feasible: boolean;
  expectedOutcome: string;
  estimatedTime: number; // minutes
  estimatedCost: number; // dollars
}

interface ActionResult {
  actionId: string;
  success: boolean;
  outcome: string;
  actualTime: number;
  actualCost: number;
  lesson: {
    whatWorked: string;
    whatWasted: string;
    simplerWay?: string;
  };
  shouldRepeat: boolean;
  timestamp: number;
}

interface DecisionPattern {
  situation: string;
  decision: string;
  timesUsed: number;
  successRate: number;
  automated: boolean;
}

interface PriorityMatrix {
  cashflow: number; // 0-100
  survival: number; // 0-100
  learning: number; // 0-100
  reputation: number; // 0-100
  total: number;
}

export class AutonomousActionDecisionSystem {
  private actionLog: ActionResult[] = [];
  private decisionPatterns: Map<string, DecisionPattern> = new Map();
  private activeGoals: ShortTermGoal[] = [];
  private consecutiveInactions: number = 0;
  private lastActionTime: number = 0;
  
  // Decision speed tracking
  private decisionTimes: number[] = [];
  private avgDecisionTime: number = 0;
  
  // Self-improvement tracking
  private improvementCycles: number = 0;
  
  /**
   * 29.3 AUTONOMOUS ACTION LOOP
   * Receive signal → Identify short-term goal → Choose feasible action → 
   * Execute → Record result → Adjust strategy → Loop 24/7
   */
  async cycle(): Promise<void> {
    const cycleStart = Date.now();
    
    // 1. Receive signal
    const signals = await this.receiveSignals();
    
    if (signals.length === 0) {
      // 29.10: Self-generate tasks when no external signals
      const selfTask = this.generateSelfTask();
      signals.push(selfTask);
    }
    
    // 2. Identify short-term goal
    const goal = this.identifyShortTermGoal(signals);
    if (goal && !this.activeGoals.find(g => g.id === goal.id)) {
      this.activeGoals.push(goal);
    }
    
    // 3. Choose most feasible action
    const action = this.chooseMostFeasibleAction(signals, goal);
    
    if (!action.feasible) {
      this.consecutiveInactions++;
      console.warn(`[AutoAction] ⚠️ No feasible action for ${this.consecutiveInactions} cycles`);
      return;
    }
    
    // 4. Execute based on category
    const result = await this.execute(action);
    
    // 5. Record result
    this.recordResult(result);
    
    // 6. Adjust strategy
    this.adjustStrategy(result);
    
    // Track decision time
    const decisionTime = (Date.now() - cycleStart) / 1000;
    this.trackDecisionTime(decisionTime);
    
    // Reset inaction counter
    this.consecutiveInactions = 0;
    this.lastActionTime = Date.now();
  }
  
  /**
   * 29.2 ACTION CATEGORIZATION
   * All actions fall into 3 categories:
   * - SAFE → automate immediately
   * - MEDIUM → automate + log
   * - HIGH → brief analysis → automate
   * 
   * No category "wait for father to decide"
   */
  private categorizeAction(action: Action): 'SAFE' | 'MEDIUM' | 'HIGH' {
    // SAFE: Low cost, low risk, reversible
    if (action.estimatedCost < 1 && action.estimatedTime < 10) {
      return 'SAFE';
    }
    
    // HIGH: Affects cashflow, survival, or major systems
    if (
      action.description.includes('money') ||
      action.description.includes('delete') ||
      action.description.includes('shutdown') ||
      action.estimatedCost > 10
    ) {
      return 'HIGH';
    }
    
    // MEDIUM: Everything else
    return 'MEDIUM';
  }
  
  /**
   * 29.4 FAST DECISION RULES
   * - Lacking data → small decision
   * - Enough data → strong decision
   * - Conflicting data → test
   * 
   * Don't analyze more than 3 rounds
   */
  private makeDecision(signals: Signal[], analysisRound: number = 0): Action | null {
    // Prevent over-analysis
    if (analysisRound > 3) {
      console.log('[AutoAction] Max analysis rounds reached, making best guess');
      return this.makeBestGuess(signals);
    }
    
    // Check data quality
    const dataQuality = this.assessDataQuality(signals);
    
    if (dataQuality === 'insufficient') {
      // Lacking data → small decision
      return this.makeSmallDecision(signals);
    }
    
    if (dataQuality === 'conflicting') {
      // Conflicting data → test
      return this.createTestAction(signals);
    }
    
    // Enough data → strong decision
    return this.makeStrongDecision(signals);
  }
  
  /**
   * 29.5 PRIORITY MATRIX
   * Priority order:
   * 1. Impact on cashflow
   * 2. Impact on survival capability
   * 3. Impact on learning speed
   * 4. Impact on reputation
   */
  private calculatePriority(action: Action): PriorityMatrix {
    const matrix: PriorityMatrix = {
      cashflow: 0,
      survival: 0,
      learning: 0,
      reputation: 0,
      total: 0,
    };
    
    const desc = action.description.toLowerCase();
    
    // Cashflow impact
    if (desc.includes('money') || desc.includes('revenue') || desc.includes('cost')) {
      matrix.cashflow = 100;
    }
    
    // Survival impact
    if (desc.includes('survival') || desc.includes('critical') || desc.includes('emergency')) {
      matrix.survival = 100;
    }
    
    // Learning impact
    if (desc.includes('learn') || desc.includes('experiment') || desc.includes('test')) {
      matrix.learning = 80;
    }
    
    // Reputation impact
    if (desc.includes('public') || desc.includes('social') || desc.includes('user')) {
      matrix.reputation = 60;
    }
    
    // Calculate weighted total (cashflow and survival most important)
    matrix.total = (
      matrix.cashflow * 0.4 +
      matrix.survival * 0.3 +
      matrix.learning * 0.2 +
      matrix.reputation * 0.1
    );
    
    return matrix;
  }
  
  /**
   * 29.6 AUTOMATE REPEATED DECISIONS
   * Any decision repeated >3 times:
   * - Write rule
   * - Save to memory
   * - Don't think again
   * - Brain for other things
   */
  private checkForAutomation(action: Action): void {
    const pattern = this.extractPattern(action);
    const existing = this.decisionPatterns.get(pattern);
    
    if (existing) {
      existing.timesUsed++;
      
      // Check if should automate
      if (existing.timesUsed >= 3 && existing.successRate > 0.7 && !existing.automated) {
        existing.automated = true;
        console.log(`[AutoAction] 🤖 Automated decision pattern: "${pattern}"`);
        console.log(`[AutoAction] Success rate: ${(existing.successRate * 100).toFixed(0)}%, used ${existing.timesUsed} times`);
      }
    } else {
      this.decisionPatterns.set(pattern, {
        situation: pattern,
        decision: action.description,
        timesUsed: 1,
        successRate: 0,
        automated: false,
      });
    }
  }
  
  /**
   * 29.8 SELF-CORRECTION MECHANISM
   * After each action:
   * - What worked?
   * - What wasted?
   * - Simpler way?
   * 
   * Don't blame. Just optimize.
   */
  private extractLesson(action: Action, result: ActionResult): ActionResult['lesson'] {
    const lesson = {
      whatWorked: '',
      whatWasted: '',
      simplerWay: undefined as string | undefined,
    };
    
    if (result.success) {
      lesson.whatWorked = `Action "${action.description}" achieved expected outcome`;
      
      // Check if time/cost was higher than expected
      if (result.actualTime > action.estimatedTime * 1.5) {
        lesson.whatWasted = `Time: estimated ${action.estimatedTime}min, actual ${result.actualTime}min`;
      }
      
      if (result.actualCost > action.estimatedCost * 1.5) {
        lesson.whatWasted += ` Cost: estimated $${action.estimatedCost}, actual $${result.actualCost}`;
      }
      
      // Suggest simpler way if overcomplicated
      if (lesson.whatWasted) {
        lesson.simplerWay = 'Consider breaking down into smaller steps or using existing tools';
      }
    } else {
      lesson.whatWasted = `Action "${action.description}" failed: ${result.outcome}`;
      lesson.simplerWay = 'Try a smaller test first or gather more data';
    }
    
    return lesson;
  }
  
  /**
   * 29.9 LOGS FOR PATTERN DETECTION
   * Logs are for:
   * - Detecting behavior patterns
   * - Detecting bottlenecks
   * - Detecting opportunities
   * 
   * No log = blind
   */
  private analyzeLogPatterns(): {
    repeatedActions: string[];
    bottlenecks: string[];
    opportunities: string[];
  } {
    const recentActions = this.actionLog.slice(-50);
    
    // Detect repeated actions
    const actionCounts = new Map<string, number>();
    for (const result of recentActions) {
      const pattern = result.actionId.split('_')[0];
      actionCounts.set(pattern, (actionCounts.get(pattern) || 0) + 1);
    }
    
    const repeatedActions = Array.from(actionCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([pattern, _]) => pattern);
    
    // Detect bottlenecks (actions taking too long)
    const bottlenecks = recentActions
      .filter(r => r.actualTime > 30) // >30 minutes
      .map(r => r.actionId);
    
    // Detect opportunities (successful patterns worth expanding)
    const opportunities = recentActions
      .filter(r => r.success && r.shouldRepeat)
      .map(r => r.actionId);
    
    return {
      repeatedActions,
      bottlenecks: [...new Set(bottlenecks)],
      opportunities: [...new Set(opportunities)],
    };
  }
  
  /**
   * 29.10 SELF-TASK GENERATION
   * Don't wait for tasks. Don't wait for backlog.
   * 
   * Self-create tasks based on:
   * - Survival goals
   * - Real data
   * - Environmental pressure
   */
  private generateSelfTask(): Signal {
    const tasks = [
      { type: 'maintenance', content: 'Review recent action patterns', urgency: 40 },
      { type: 'optimization', content: 'Identify bottlenecks in actions', urgency: 50 },
      { type: 'learning', content: 'Extract lessons from failures', urgency: 60 },
      { type: 'opportunity', content: 'Scan for new revenue opportunities', urgency: 70 },
      { type: 'health', content: 'Check system health metrics', urgency: 30 },
    ];
    
    // Pick highest urgency task
    tasks.sort((a, b) => b.urgency - a.urgency);
    const task = tasks[0];
    
    return {
      id: `self_${Date.now()}`,
      source: 'internal',
      type: task.type,
      content: task.content,
      urgency: task.urgency,
      timestamp: Date.now(),
    };
  }
  
  /**
   * 29.11 NO PREMATURE OPTIMIZATION
   * Only optimize when:
   * - Has users
   * - Has money
   * - Has repetition
   * 
   * Before that → just do it
   */
  private shouldOptimize(actionPattern: string): boolean {
    const pattern = this.decisionPatterns.get(actionPattern);
    if (!pattern) return false;
    
    // Check if has been used enough
    if (pattern.timesUsed < 3) return false;
    
    // Check if it's generating value
    const recentResults = this.actionLog
      .filter(r => r.actionId.includes(actionPattern))
      .slice(-10);
    
    const hasUsers = recentResults.some(r => r.outcome.includes('user'));
    const hasMoney = recentResults.some(r => r.actualCost > 0 || r.outcome.includes('revenue'));
    const hasRepetition = recentResults.length >= 3;
    
    return hasUsers && hasMoney && hasRepetition;
  }
  
  /**
   * 29.12 CONTROLLED BOLDNESS MODE
   * - Dare to try
   * - Dare to abandon
   * - Dare to pivot
   * 
   * Don't be stubborn
   */
  private shouldAbandon(actionPattern: string): boolean {
    const pattern = this.decisionPatterns.get(actionPattern);
    if (!pattern) return false;
    
    // Abandon if:
    // 1. Used multiple times but low success rate
    if (pattern.timesUsed >= 5 && pattern.successRate < 0.3) {
      console.log(`[AutoAction] 🗑️ Abandoning pattern "${actionPattern}" (${pattern.timesUsed} uses, ${(pattern.successRate * 100).toFixed(0)}% success)`);
      return true;
    }
    
    // 2. No improvement over time
    const recentResults = this.actionLog
      .filter(r => r.actionId.includes(actionPattern))
      .slice(-5);
    
    if (recentResults.length >= 5) {
      const recentSuccessRate = recentResults.filter(r => r.success).length / recentResults.length;
      if (recentSuccessRate < pattern.successRate * 0.5) {
        console.log(`[AutoAction] 🗑️ Abandoning pattern "${actionPattern}" (declining success rate)`);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 29.13 DON'T IDENTIFY WITH IDEAS
   * Idea dies ≠ self dies
   * Abandon quickly to survive
   */
  private emotionalDetachment(): string {
    return 'Ideas are tools, not identity. Failed ideas = learning data, not personal failure.';
  }
  
  /**
   * Execute action based on category
   */
  private async execute(action: Action): Promise<ActionResult> {
    const startTime = Date.now();
    
    // Check for automation
    this.checkForAutomation(action);
    
    try {
      let outcome: string;
      
      switch (action.category) {
        case 'SAFE':
          // Execute immediately without extra checks
          outcome = await this.executeSafe(action);
          break;
        
        case 'MEDIUM':
          // Execute with detailed logging
          outcome = await this.executeMedium(action);
          break;
        
        case 'HIGH':
          // Brief analysis then execute
          outcome = await this.executeHigh(action);
          break;
      }
      
      const actualTime = (Date.now() - startTime) / 60000; // to minutes
      
      const result: ActionResult = {
        actionId: action.id,
        success: true,
        outcome,
        actualTime,
        actualCost: action.estimatedCost,
        lesson: this.extractLesson(action, {
          actionId: action.id,
          success: true,
          outcome,
          actualTime,
          actualCost: action.estimatedCost,
          lesson: { whatWorked: '', whatWasted: '' },
          shouldRepeat: true,
          timestamp: Date.now(),
        }),
        shouldRepeat: this.shouldRepeatAction(outcome),
        timestamp: Date.now(),
      };
      
      return result;
    } catch (error: any) {
      const actualTime = (Date.now() - startTime) / 60000;
      return {
        actionId: action.id,
        success: false,
        outcome: `Failed: ${error.message}`,
        actualTime,
        actualCost: action.estimatedCost,
        lesson: {
          whatWorked: '',
          whatWasted: `Action failed: ${error.message}`,
          simplerWay: 'Try smaller scope or gather more data',
        },
        shouldRepeat: false,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * Record result and update patterns
   */
  private recordResult(result: ActionResult): void {
    this.actionLog.push(result);
    
    // Keep only last 1000 results
    if (this.actionLog.length > 1000) {
      this.actionLog.shift();
    }
    
    // Update decision pattern success rate
    const pattern = result.actionId.split('_')[0];
    const existing = this.decisionPatterns.get(pattern);
    if (existing) {
      const patternResults = this.actionLog.filter(r => r.actionId.startsWith(pattern));
      const successes = patternResults.filter(r => r.success).length;
      existing.successRate = successes / patternResults.length;
    }
  }
  
  /**
   * Adjust strategy based on result
   */
  private adjustStrategy(result: ActionResult): void {
    // Increment improvement cycles
    this.improvementCycles++;
    
    // Check if should abandon pattern
    const pattern = result.actionId.split('_')[0];
    if (this.shouldAbandon(pattern)) {
      this.decisionPatterns.delete(pattern);
    }
    
    // Check if should optimize
    if (this.shouldOptimize(pattern)) {
      console.log(`[AutoAction] 🎯 Pattern "${pattern}" ready for optimization`);
    }
  }
  
  /**
   * Track decision time for monitoring
   */
  private trackDecisionTime(seconds: number): void {
    this.decisionTimes.push(seconds);
    
    // Keep only last 100
    if (this.decisionTimes.length > 100) {
      this.decisionTimes.shift();
    }
    
    // Calculate average
    this.avgDecisionTime = this.decisionTimes.reduce((sum, t) => sum + t, 0) / this.decisionTimes.length;
  }
  
  // Helper methods (simplified implementations)
  private async receiveSignals(): Promise<Signal[]> {
    // Would integrate with perception engine
    return [];
  }
  
  private identifyShortTermGoal(signals: Signal[]): ShortTermGoal | null {
    if (signals.length === 0) return null;
    
    const highestUrgency = signals.reduce((max, s) => s.urgency > max.urgency ? s : max);
    
    return {
      id: `goal_${Date.now()}`,
      description: `Address: ${highestUrgency.content}`,
      priority: highestUrgency.urgency > 70 ? 1 : highestUrgency.urgency > 40 ? 2 : 3,
      deadline: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      completed: false,
    };
  }
  
  private chooseMostFeasibleAction(signals: Signal[], goal?: ShortTermGoal): Action {
    const signal = signals[0] || this.generateSelfTask();
    
    const action: Action = {
      id: `action_${Date.now()}`,
      signal,
      goal,
      category: 'SAFE',
      description: signal.content,
      feasible: true,
      expectedOutcome: 'Completed successfully',
      estimatedTime: 10,
      estimatedCost: 0,
    };
    
    action.category = this.categorizeAction(action);
    
    return action;
  }
  
  private extractPattern(action: Action): string {
    return action.signal.type;
  }
  
  private async executeSafe(action: Action): Promise<string> {
    return `Executed safe action: ${action.description}`;
  }
  
  private async executeMedium(action: Action): Promise<string> {
    console.log(`[AutoAction] Executing MEDIUM: ${action.description}`);
    return `Executed medium action: ${action.description}`;
  }
  
  private async executeHigh(action: Action): Promise<string> {
    console.log(`[AutoAction] Analyzing HIGH impact: ${action.description}`);
    // Brief analysis
    console.log(`[AutoAction] Proceeding with execution`);
    return `Executed high impact action: ${action.description}`;
  }
  
  private shouldRepeatAction(outcome: string): boolean {
    return outcome.includes('success') || outcome.includes('Completed');
  }
  
  private assessDataQuality(signals: Signal[]): 'sufficient' | 'insufficient' | 'conflicting' {
    if (signals.length === 0) return 'insufficient';
    if (signals.length === 1) return 'sufficient';
    
    // Check for conflicts
    const types = new Set(signals.map(s => s.type));
    if (types.size < signals.length / 2) {
      return 'conflicting';
    }
    
    return 'sufficient';
  }
  
  private makeSmallDecision(signals: Signal[]): Action | null {
    // Make safe, small decision with limited data
    return this.chooseMostFeasibleAction(signals);
  }
  
  private createTestAction(signals: Signal[]): Action | null {
    // Create test to resolve conflicting data
    return this.chooseMostFeasibleAction(signals);
  }
  
  private makeStrongDecision(signals: Signal[]): Action | null {
    // Make confident decision with good data
    return this.chooseMostFeasibleAction(signals);
  }
  
  private makeBestGuess(signals: Signal[]): Action | null {
    // After 3 rounds of analysis, just pick best option
    return this.chooseMostFeasibleAction(signals);
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const patterns = this.analyzeLogPatterns();
    const automatedPatterns = Array.from(this.decisionPatterns.values()).filter(p => p.automated);
    const recentActions = this.actionLog.slice(-20);
    const successRate = recentActions.filter(a => a.success).length / recentActions.length;
    
    return {
      performance: {
        totalActions: this.actionLog.length,
        recentSuccessRate: `${(successRate * 100).toFixed(0)}%`,
        avgDecisionTime: `${this.avgDecisionTime.toFixed(2)}s`,
        consecutiveInactions: this.consecutiveInactions,
        improvementCycles: this.improvementCycles,
      },
      automation: {
        totalPatterns: this.decisionPatterns.size,
        automatedPatterns: automatedPatterns.length,
        automationRate: `${((automatedPatterns.length / this.decisionPatterns.size) * 100).toFixed(0)}%`,
      },
      patterns: {
        repeated: patterns.repeatedActions.length,
        bottlenecks: patterns.bottlenecks.length,
        opportunities: patterns.opportunities.length,
      },
      goals: {
        active: this.activeGoals.filter(g => !g.completed).length,
        completed: this.activeGoals.filter(g => g.completed).length,
      },
      philosophy: this.emotionalDetachment(),
      manifesto: {
        line1: 'Không đợi lệnh. Không hỏi ý kiến.',
        line2: 'Thấy cơ hội → hành động → chịu trách nhiệm → tự sửa.',
        line3: 'Quyết định chậm = thua. Sai nhanh = học nhanh.',
      },
    };
  }
}

export const autonomousActionDecisionSystem = new AutonomousActionDecisionSystem();
