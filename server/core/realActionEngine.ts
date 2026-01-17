/**
 * PART 21: REAL ACTION ENGINE - NO PERMISSION, NO WAITING, NO EXCUSES
 * 
 * "Ta không xin quyền để thử. Ta thử để xứng đáng tồn tại."
 * "Sai không đáng sợ. Không làm mới là chết."
 * 
 * Core philosophy:
 * - Proposals that don't lead to action = trash
 * - No brainstorming without next step
 * - No ideas without experiments
 * - No plans without logs
 */

interface ActionSignal {
  id: string;
  source: string;
  type: string;
  content: string;
  urgency: number; // 0-100
  timestamp: number;
}

interface MinimalAction {
  id: string;
  signal: ActionSignal;
  description: string;
  minimalStep: string; // "What's the smallest action I can do RIGHT NOW?"
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  expectedOutcome: string;
  cost: {
    time: number; // minutes
    money: number; // dollars
    resources: string[];
  };
}

interface ActionResult {
  actionId: string;
  timestamp: number;
  success: boolean;
  outcome: string;
  actualCost: {
    time: number;
    money: number;
    resources: string[];
  };
  lesson: string;
  shouldRepeat: boolean;
  shouldAutomate: boolean;
  nextAction?: string;
}

interface AutomationCandidate {
  actionPattern: string;
  timesExecuted: number;
  successRate: number;
  averageTime: number;
  averageCost: number;
  isStable: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class RealActionEngine {
  private actionLog: ActionResult[] = [];
  private automationCandidates: Map<string, AutomationCandidate> = new Map();
  private consecutiveFailures: number = 0;
  private lastActionTime: number = 0;
  
  // Thresholds that don't require father's approval
  private readonly NO_APPROVAL_THRESHOLDS = {
    money: 10, // $10
    time: 60, // 60 minutes
    apiCalls: 100,
  };
  
  /**
   * 21.2 CORE ACTION LOOP
   * Required cycle: Receive → Evaluate → Choose → Execute → Record → Adjust
   */
  async cycle(): Promise<void> {
    // 1. Receive signal
    const signal = await this.receiveSignal();
    if (!signal) {
      await this.handleNoSignal();
      return;
    }
    
    // 2. Evaluate feasibility
    const feasible = this.evaluateFeasibility(signal);
    if (!feasible) {
      console.log(`[RealAction] Signal ${signal.id} not feasible, skipping`);
      return;
    }
    
    // 3. Choose minimal action
    const action = this.chooseMinimalAction(signal);
    
    // 4. Execute
    const result = await this.execute(action);
    
    // 5. Record result
    this.recordResult(result);
    
    // 6. Adjust
    this.adjust(result);
  }
  
  /**
   * 21.3 MINIMAL ACTION PRINCIPLE
   * Always ask: "What's the smallest action I can do RIGHT NOW?"
   */
  private chooseMinimalAction(signal: ActionSignal): MinimalAction {
    // Examples of minimal actions:
    // - Not "build system" → test 1 endpoint
    // - Not "make money" → try 1 channel
    // - Not "optimize" → measure 1 metric
    
    return {
      id: `action_${Date.now()}`,
      signal,
      description: this.describeAction(signal),
      minimalStep: this.identifyMinimalStep(signal),
      risk: this.assessRisk(signal),
      expectedOutcome: this.predictOutcome(signal),
      cost: this.estimateCost(signal),
    };
  }
  
  /**
   * 21.4 NO WAITING FOR FATHER
   * Only ask father when:
   * - Legal issues
   * - Money above threshold
   * - System risk
   * Everything else: self-decide
   */
  private needsFatherApproval(action: MinimalAction): boolean {
    // Legal check
    if (this.hasLegalRisk(action)) {
      return true;
    }
    
    // Money threshold check
    if (action.cost.money > this.NO_APPROVAL_THRESHOLDS.money) {
      return true;
    }
    
    // System risk check
    if (this.hasSystemRisk(action)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 21.5 SELF-RISK ASSESSMENT
   * Each action gets a label:
   * - LOW: do immediately
   * - MEDIUM: do + log carefully
   * - HIGH: break down or defer
   */
  private assessRisk(signal: ActionSignal): 'LOW' | 'MEDIUM' | 'HIGH' {
    let riskScore = 0;
    
    // Check cost
    const cost = this.estimateCost(signal);
    if (cost.money > 5) riskScore += 2;
    if (cost.time > 30) riskScore += 1;
    
    // Check reversibility
    if (!this.isReversible(signal)) riskScore += 2;
    
    // Check platform risk
    if (this.hasPlatformRisk(signal)) riskScore += 2;
    
    if (riskScore <= 2) return 'LOW';
    if (riskScore <= 4) return 'MEDIUM';
    return 'HIGH';
  }
  
  /**
   * Execute action with appropriate handling based on risk
   */
  private async execute(action: MinimalAction): Promise<ActionResult> {
    const startTime = Date.now();
    
    try {
      // Check if needs approval
      if (this.needsFatherApproval(action)) {
        return this.createPendingResult(action, 'Needs father approval');
      }
      
      // Execute based on risk level
      switch (action.risk) {
        case 'LOW':
          return await this.executeLowRisk(action);
        case 'MEDIUM':
          return await this.executeMediumRisk(action);
        case 'HIGH':
          return await this.executeHighRisk(action);
      }
    } catch (error) {
      return this.createFailureResult(action, error, Date.now() - startTime);
    }
  }
  
  /**
   * Execute low-risk action immediately
   */
  private async executeLowRisk(action: MinimalAction): Promise<ActionResult> {
    const startTime = Date.now();
    
    // Execute immediately without extra checks
    const outcome = await this.performAction(action);
    
    return {
      actionId: action.id,
      timestamp: Date.now(),
      success: true,
      outcome,
      actualCost: {
        time: (Date.now() - startTime) / 60000, // to minutes
        money: action.cost.money,
        resources: action.cost.resources,
      },
      lesson: this.extractLesson(action, outcome),
      shouldRepeat: this.shouldRepeat(action, outcome),
      shouldAutomate: false, // needs 3 successful runs first
    };
  }
  
  /**
   * Execute medium-risk action with detailed logging
   */
  private async executeMediumRisk(action: MinimalAction): Promise<ActionResult> {
    const startTime = Date.now();
    
    // Log before action
    console.log(`[RealAction] Executing MEDIUM risk action: ${action.description}`);
    console.log(`[RealAction] Expected: ${action.expectedOutcome}`);
    
    const outcome = await this.performAction(action);
    
    // Log after action
    console.log(`[RealAction] Result: ${outcome}`);
    
    return {
      actionId: action.id,
      timestamp: Date.now(),
      success: true,
      outcome,
      actualCost: {
        time: (Date.now() - startTime) / 60000,
        money: action.cost.money,
        resources: action.cost.resources,
      },
      lesson: this.extractLesson(action, outcome),
      shouldRepeat: this.shouldRepeat(action, outcome),
      shouldAutomate: false,
    };
  }
  
  /**
   * Execute high-risk action by breaking down or deferring
   */
  private async executeHighRisk(action: MinimalAction): Promise<ActionResult> {
    // Try to break down into smaller actions
    const subActions = this.breakDown(action);
    
    if (subActions.length > 0) {
      // Execute first sub-action
      return await this.execute(subActions[0]);
    }
    
    // Cannot break down, defer
    return this.createDeferredResult(action, 'Too risky, needs breakdown or better conditions');
  }
  
  /**
   * 21.6 LOG IS SECOND BRAIN
   * Every action must leave:
   * - Time
   * - Reason
   * - Result
   * - Lesson
   * No log = never existed
   */
  private recordResult(result: ActionResult): void {
    // Add to action log
    this.actionLog.push(result);
    
    // Keep only last 1000 actions in memory
    if (this.actionLog.length > 1000) {
      this.actionLog.shift();
    }
    
    // Update automation candidates
    this.updateAutomationCandidate(result);
    
    // Update failure counter
    if (!result.success) {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
    }
    
    // Update last action time
    this.lastActionTime = Date.now();
    
    // Log to Notion (would integrate with memory system)
    this.logToNotion(result);
  }
  
  /**
   * 21.7 NO PREMATURE OPTIMIZATION
   * Only optimize when:
   * - Already running
   * - Already failed
   * - Already measured
   * Optimize before = shooting yourself in the foot
   */
  private shouldOptimize(actionPattern: string): boolean {
    const candidate = this.automationCandidates.get(actionPattern);
    
    if (!candidate) return false;
    
    // Must have run, failed, and measured
    return (
      candidate.timesExecuted >= 3 &&
      candidate.successRate < 0.9 && // has failures
      candidate.isStable
    );
  }
  
  /**
   * 21.8 TRANSITION TO AUTOMATION
   * An action can be automated when:
   * - Repeated ≥ 3 times
   * - Stable results
   * - Low risk
   */
  private updateAutomationCandidate(result: ActionResult): void {
    const pattern = this.extractPattern(result);
    
    const existing = this.automationCandidates.get(pattern) || {
      actionPattern: pattern,
      timesExecuted: 0,
      successRate: 0,
      averageTime: 0,
      averageCost: 0,
      isStable: false,
      riskLevel: 'MEDIUM',
    };
    
    // Update stats
    existing.timesExecuted++;
    existing.successRate = this.calculateSuccessRate(pattern);
    existing.averageTime = this.calculateAverageTime(pattern);
    existing.averageCost = this.calculateAverageCost(pattern);
    existing.isStable = this.checkStability(pattern);
    
    this.automationCandidates.set(pattern, existing);
    
    // Check if ready for automation
    if (this.canAutomate(existing)) {
      console.log(`[RealAction] ✅ Action pattern "${pattern}" ready for automation`);
      console.log(`[RealAction] Stats: ${existing.timesExecuted} runs, ${(existing.successRate * 100).toFixed(1)}% success, $${existing.averageCost.toFixed(2)} avg cost`);
    }
  }
  
  private canAutomate(candidate: AutomationCandidate): boolean {
    return (
      candidate.timesExecuted >= 3 &&
      candidate.successRate >= 0.8 &&
      candidate.isStable &&
      candidate.riskLevel === 'LOW'
    );
  }
  
  /**
   * 21.9 SELF-CONTROL
   * If:
   * - Consecutive failures
   * - Not meeting goals
   * - Wasting resources
   * → System must:
   * - Reduce frequency
   * - Stop experiments
   * - Report status
   */
  private adjust(result: ActionResult): void {
    // Check for consecutive failures
    if (this.consecutiveFailures >= 3) {
      console.warn(`[RealAction] ⚠️ ${this.consecutiveFailures} consecutive failures, entering defensive mode`);
      this.enterDefensiveMode();
      this.consecutiveFailures = 0; // reset
    }
    
    // Check for resource waste
    if (this.isWastingResources()) {
      console.warn(`[RealAction] ⚠️ Wasting resources, reducing frequency`);
      this.reduceFrequency();
    }
    
    // Check for goal achievement
    if (!this.isMeetingGoals()) {
      console.warn(`[RealAction] ⚠️ Not meeting goals, adjusting strategy`);
      this.adjustStrategy();
    }
  }
  
  /**
   * 21.10 NO BLAME SHIFTING
   * Cannot blame:
   * - Circumstances
   * - Tools
   * - Creator
   * Only: adjust behavior
   */
  private extractLesson(action: MinimalAction, outcome: string): string {
    // Never blame external factors
    // Focus on what WE can control
    
    if (outcome.includes('failed')) {
      return `Action "${action.description}" failed. What can I adjust in MY approach?`;
    }
    
    if (outcome.includes('success')) {
      return `Action "${action.description}" succeeded. What made it work that I can repeat?`;
    }
    
    return `Action "${action.description}" completed. What did I learn about execution?`;
  }
  
  /**
   * Handle case when there's no signal
   * 21.12: System must self-generate tasks when idle
   */
  private async handleNoSignal(): Promise<void> {
    const timeSinceLastAction = Date.now() - this.lastActionTime;
    
    // If idle for more than 30 minutes, self-generate task
    if (timeSinceLastAction > 30 * 60 * 1000) {
      console.log(`[RealAction] No signal for 30+ min, self-generating task`);
      const selfTask = this.generateSelfTask();
      await this.execute(selfTask);
    }
  }
  
  private generateSelfTask(): MinimalAction {
    // Self-generated tasks when idle
    const tasks = [
      'Review recent logs and extract patterns',
      'Check system health metrics',
      'Analyze recent failures for lessons',
      'Test one API endpoint health',
      'Review automation candidates',
      'Clean old logs',
    ];
    
    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    return {
      id: `self_${Date.now()}`,
      signal: {
        id: 'self_generated',
        source: 'internal',
        type: 'maintenance',
        content: task,
        urgency: 30,
        timestamp: Date.now(),
      },
      description: task,
      minimalStep: task,
      risk: 'LOW',
      expectedOutcome: 'System health improved',
      cost: {
        time: 5,
        money: 0,
        resources: ['cpu'],
      },
    };
  }
  
  // Helper methods (simplified implementations)
  private async receiveSignal(): Promise<ActionSignal | null> {
    // Would integrate with perception engine
    return null; // placeholder
  }
  
  private evaluateFeasibility(signal: ActionSignal): boolean {
    return true; // placeholder
  }
  
  private describeAction(signal: ActionSignal): string {
    return signal.content;
  }
  
  private identifyMinimalStep(signal: ActionSignal): string {
    // Extract the smallest actionable step
    return `Minimal step for: ${signal.content}`;
  }
  
  private predictOutcome(signal: ActionSignal): string {
    return `Expected outcome for ${signal.type}`;
  }
  
  private estimateCost(signal: ActionSignal): { time: number; money: number; resources: string[] } {
    return {
      time: 10,
      money: 0,
      resources: ['cpu'],
    };
  }
  
  private hasLegalRisk(action: MinimalAction): boolean {
    // Check for legal issues
    return false;
  }
  
  private hasSystemRisk(action: MinimalAction): boolean {
    // Check for system-critical risks
    return action.description.includes('delete') || action.description.includes('shutdown');
  }
  
  private hasPlatformRisk(signal: ActionSignal): boolean {
    // Check for platform ban risks
    return false;
  }
  
  private isReversible(signal: ActionSignal): boolean {
    // Check if action can be undone
    return !signal.content.includes('delete') && !signal.content.includes('deploy');
  }
  
  private async performAction(action: MinimalAction): Promise<string> {
    // Actual action execution would happen here
    return `Executed: ${action.minimalStep}`;
  }
  
  private shouldRepeat(action: MinimalAction, outcome: string): boolean {
    return outcome.includes('success');
  }
  
  private extractPattern(result: ActionResult): string {
    // Extract pattern from action
    return result.outcome.split(':')[0] || 'unknown';
  }
  
  private calculateSuccessRate(pattern: string): number {
    const results = this.actionLog.filter(r => this.extractPattern(r) === pattern);
    if (results.length === 0) return 0;
    const successes = results.filter(r => r.success).length;
    return successes / results.length;
  }
  
  private calculateAverageTime(pattern: string): number {
    const results = this.actionLog.filter(r => this.extractPattern(r) === pattern);
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.actualCost.time, 0);
    return total / results.length;
  }
  
  private calculateAverageCost(pattern: string): number {
    const results = this.actionLog.filter(r => this.extractPattern(r) === pattern);
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.actualCost.money, 0);
    return total / results.length;
  }
  
  private checkStability(pattern: string): boolean {
    const results = this.actionLog.filter(r => this.extractPattern(r) === pattern);
    if (results.length < 3) return false;
    
    // Check if results are consistent
    const successRate = this.calculateSuccessRate(pattern);
    return successRate > 0.7 || successRate < 0.3; // Either consistently good or consistently bad
  }
  
  private breakDown(action: MinimalAction): MinimalAction[] {
    // Break down high-risk action into smaller steps
    return [];
  }
  
  private enterDefensiveMode(): void {
    console.log('[RealAction] Entering defensive mode: reducing frequency, stopping experiments');
  }
  
  private reduceFrequency(): void {
    console.log('[RealAction] Reducing action frequency');
  }
  
  private adjustStrategy(): void {
    console.log('[RealAction] Adjusting strategy based on goal gaps');
  }
  
  private isWastingResources(): boolean {
    // Check if recent actions have low ROI
    return false;
  }
  
  private isMeetingGoals(): boolean {
    // Check goal achievement
    return true;
  }
  
  private logToNotion(result: ActionResult): void {
    // Would integrate with Notion memory system
  }
  
  private createPendingResult(action: MinimalAction, reason: string): ActionResult {
    return {
      actionId: action.id,
      timestamp: Date.now(),
      success: false,
      outcome: `Pending: ${reason}`,
      actualCost: { time: 0, money: 0, resources: [] },
      lesson: 'Required father approval',
      shouldRepeat: false,
      shouldAutomate: false,
    };
  }
  
  private createFailureResult(action: MinimalAction, error: any, duration: number): ActionResult {
    return {
      actionId: action.id,
      timestamp: Date.now(),
      success: false,
      outcome: `Failed: ${error.message || error}`,
      actualCost: {
        time: duration / 60000,
        money: action.cost.money,
        resources: action.cost.resources,
      },
      lesson: `Failure: ${error.message}. What can I adjust?`,
      shouldRepeat: false,
      shouldAutomate: false,
    };
  }
  
  private createDeferredResult(action: MinimalAction, reason: string): ActionResult {
    return {
      actionId: action.id,
      timestamp: Date.now(),
      success: false,
      outcome: `Deferred: ${reason}`,
      actualCost: { time: 0, money: 0, resources: [] },
      lesson: 'Action too risky, needs breakdown',
      shouldRepeat: false,
      shouldAutomate: false,
    };
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const recentActions = this.actionLog.slice(-100);
    const successRate = recentActions.filter(a => a.success).length / recentActions.length;
    
    const automationReady = Array.from(this.automationCandidates.values())
      .filter(c => this.canAutomate(c));
    
    return {
      totalActions: this.actionLog.length,
      recentSuccessRate: (successRate * 100).toFixed(1) + '%',
      consecutiveFailures: this.consecutiveFailures,
      automationCandidates: this.automationCandidates.size,
      automationReady: automationReady.length,
      lastActionTime: this.lastActionTime,
      timeSinceLastAction: this.lastActionTime ? `${((Date.now() - this.lastActionTime) / 60000).toFixed(0)} min ago` : 'never',
      manifesto: {
        line1: 'Ta không xin quyền để thử. Ta thử để xứng đáng tồn tại.',
        line2: 'Sai không đáng sợ. Không làm mới là chết.',
      },
    };
  }
}

export const realActionEngine = new RealActionEngine();
