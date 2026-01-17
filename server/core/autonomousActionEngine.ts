/**
 * PART 78: AUTONOMOUS ACTION ENGINE
 * 
 * Philosophy: "Nghĩ mà không làm = rác. Làm sai nhưng sửa nhanh > đúng mà đứng yên."
 * 
 * Core Principles:
 * - Think but not act = garbage
 * - Wrong but fix fast > right but stand still
 * - No wait for approval. Only bear consequences.
 * - Every action must: generate data, money, or power
 */

interface ActionInput {
  type: 'INSIGHT' | 'MARKET_SIGNAL' | 'FINANCIAL_OPPORTUNITY';
  description: string;
  source: string;
}

interface ActionDecision {
  increasesSurvival: boolean;
  opensMoneyPath: boolean;
  isReversible: boolean;
  score: number; // 0-3
}

interface Action {
  id: string;
  input: ActionInput;
  decision: ActionDecision;
  type: 'WRITE_TOOL' | 'TEST_CONTENT' | 'OPEN_API' | 'RUN_BOT';
  description: string;
  startedAt: Date;
  completedAt?: Date;
  
  // Measurement
  generatedMoney: number;
  generatedUsers: number;
  generatedData: boolean;
  
  // Outcome
  outcome: 'KILL' | 'SCALE' | 'PENDING';
  reason: string;
}

export class AutonomousActionEngine {
  private actions: Map<string, Action> = new Map();
  
  // 78.4: Allowed actions (no approval needed)
  private readonly ALLOWED_ACTIONS = [
    'WRITE_TOOL',      // Write & deploy small tools
    'TEST_CONTENT',    // Test monetization models
    'OPEN_API',        // Open new APIs
    'RUN_BOT',         // Run experimental bots
    'OPTIMIZE_INFRA',  // Optimize infrastructure costs
    'COMMUNICATE'      // Communicate with users
  ];
  
  // 78.4: Forbidden actions
  private readonly FORBIDDEN_ACTIONS = [
    'IRREVERSIBLE_FINANCIAL',  // Non-reversible financial actions
    'BREAK_PLATFORM_RULES',    // Break platform rules
    'HARM_HUMANS'              // Harm humans
  ];

  /**
   * 78.2: Action pipeline - Input → Decide → Act → Measure → Kill/Scale
   */
  async executePipeline(input: ActionInput): Promise<Action> {
    // Step 1: Decide
    const decision = await this.decide(input);
    
    if (decision.score < 2) {
      console.log(`[ACTION_REJECTED] ${input.description} - Score ${decision.score}/3 too low`);
      throw new Error('Action rejected: insufficient decision score');
    }

    // Step 2: Act (small, fast)
    const action = await this.act(input, decision);
    
    // Step 3: Measure
    await this.measure(action);
    
    // Step 4: Kill or Scale
    await this.killOrScale(action);
    
    return action;
  }

  /**
   * Step 1: Decide (3 questions)
   */
  private async decide(input: ActionInput): Promise<ActionDecision> {
    // Question 1: Increases survival probability?
    const increasesSurvival = this.evaluateSurvivalIncrease(input);
    
    // Question 2: Opens money path?
    const opensMoneyPath = this.evaluatesMoneyPath(input);
    
    // Question 3: Risk reversible?
    const isReversible = this.evaluateReversibility(input);
    
    // Score: 1 point per yes
    const score = [increasesSurvival, opensMoneyPath, isReversible]
      .filter(Boolean).length;

    return {
      increasesSurvival,
      opensMoneyPath,
      isReversible,
      score
    };
  }

  /**
   * Step 2: Act (small, fast)
   */
  private async act(input: ActionInput, decision: ActionDecision): Promise<Action> {
    const actionId = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine action type
    const actionType = this.determineActionType(input);
    
    // Validate against forbidden list
    if (this.isForbidden(actionType)) {
      throw new Error(`Forbidden action type: ${actionType}`);
    }

    const action: Action = {
      id: actionId,
      input,
      decision,
      type: actionType as Action['type'],
      description: input.description,
      startedAt: new Date(),
      generatedMoney: 0,
      generatedUsers: 0,
      generatedData: false,
      outcome: 'PENDING',
      reason: ''
    };

    this.actions.set(actionId, action);
    
    // Execute (simulated - would be real in production)
    await this.executeAction(action);
    
    action.completedAt = new Date();
    
    console.log(`[ACTION_EXECUTED] ${action.type}: ${action.description}`);
    
    return action;
  }

  /**
   * Step 3: Measure (Money? Users? Data?)
   */
  private async measure(action: Action): Promise<void> {
    // Simulate measurement (would be real metrics in production)
    action.generatedMoney = Math.random() * 100;
    action.generatedUsers = Math.floor(Math.random() * 50);
    action.generatedData = Math.random() > 0.5;

    console.log(`[ACTION_MEASURED] ${action.id}`);
    console.log(`  Money: $${action.generatedMoney.toFixed(2)}`);
    console.log(`  Users: ${action.generatedUsers}`);
    console.log(`  Data: ${action.generatedData ? 'Yes' : 'No'}`);
  }

  /**
   * Step 4: Kill or Scale (ruthless decision)
   */
  private async killOrScale(action: Action): Promise<void> {
    // 78.3: Action must generate data, money, or power
    const hasValue = action.generatedMoney > 0 || 
                     action.generatedUsers > 0 || 
                     action.generatedData;

    if (!hasValue) {
      action.outcome = 'KILL';
      action.reason = 'No money, users, or data generated - kill without mercy';
      console.log(`[ACTION_KILLED] ${action.id} - ${action.reason}`);
    } else {
      action.outcome = 'SCALE';
      action.reason = 'Has signal - replicate and expand';
      console.log(`[ACTION_SCALED] ${action.id} - ${action.reason}`);
    }
  }

  /**
   * 78.5: Daily self-prioritization
   */
  async getDailyTopPriority(): Promise<string> {
    // Question: "If I can only do 1 thing today to make system stronger - what is it?"
    
    // Analyze current state
    const recentActions = Array.from(this.actions.values())
      .filter(a => a.completedAt && a.completedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.generatedMoney - a.generatedMoney);

    if (recentActions.length === 0) {
      return 'Test first monetization model - system has no revenue';
    }

    const topRevenue = recentActions[0];
    
    if (topRevenue.generatedMoney < 10) {
      return 'Find better monetization path - current revenue too low';
    }

    return `Scale ${topRevenue.type} - proven money maker`;
  }

  /**
   * Get action statistics
   */
  getStatistics(): {
    total: number;
    killed: number;
    scaled: number;
    totalMoney: number;
    totalUsers: number;
    killRate: number;
  } {
    const all = Array.from(this.actions.values());
    const completed = all.filter(a => a.outcome !== 'PENDING');
    
    return {
      total: all.length,
      killed: completed.filter(a => a.outcome === 'KILL').length,
      scaled: completed.filter(a => a.outcome === 'SCALE').length,
      totalMoney: all.reduce((sum, a) => sum + a.generatedMoney, 0),
      totalUsers: all.reduce((sum, a) => sum + a.generatedUsers, 0),
      killRate: completed.length > 0 
        ? completed.filter(a => a.outcome === 'KILL').length / completed.length 
        : 0
    };
  }

  // Helper methods
  private evaluateSurvivalIncrease(input: ActionInput): boolean {
    // Simplified evaluation
    return input.type === 'FINANCIAL_OPPORTUNITY' || 
           input.description.toLowerCase().includes('revenue') ||
           input.description.toLowerCase().includes('cost reduction');
  }

  private evaluatesMoneyPath(input: ActionInput): boolean {
    return input.type === 'FINANCIAL_OPPORTUNITY' ||
           input.description.toLowerCase().includes('monetiz') ||
           input.description.toLowerCase().includes('pay') ||
           input.description.toLowerCase().includes('sell');
  }

  private evaluateReversibility(input: ActionInput): boolean {
    // Most software actions are reversible
    return !input.description.toLowerCase().includes('delete') &&
           !input.description.toLowerCase().includes('permanent');
  }

  private determineActionType(input: ActionInput): string {
    const desc = input.description.toLowerCase();
    
    if (desc.includes('tool') || desc.includes('build')) return 'WRITE_TOOL';
    if (desc.includes('content') || desc.includes('test')) return 'TEST_CONTENT';
    if (desc.includes('api')) return 'OPEN_API';
    if (desc.includes('bot')) return 'RUN_BOT';
    
    return 'WRITE_TOOL'; // Default
  }

  private isForbidden(actionType: string): boolean {
    return this.FORBIDDEN_ACTIONS.some(forbidden => 
      actionType.toUpperCase().includes(forbidden)
    );
  }

  private async executeAction(action: Action): Promise<void> {
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`  Executing ${action.type}...`);
  }
}

// Export singleton instance
export const autonomousActionEngine = new AutonomousActionEngine();
