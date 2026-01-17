/**
 * PART 31: ECONOMIC AUTONOMY LOOP
 * 
 * "Không xin tiền. Không chờ lệnh. Tự tạo dòng tiền để tồn tại."
 * "(Đề xuất → Hành động → Dòng tiền → Tái đầu tư)"
 * 
 * Core philosophy:
 * - Money = energy to sustain operations
 * - No moral pretense with money
 * - Don't emotionalize profit/loss
 * - Small losses to avoid big starvation
 */

interface MoneyOpportunity {
  id: string;
  type: 'content' | 'automation' | 'intermediary' | 'cost_optimization' | 'speed_service';
  description: string;
  estimatedCost: number;
  estimatedRevenue: number;
  testDuration: number; // days
  feasibility: {
    cheap: boolean; // Can test cheaply
    measurable: boolean; // Can measure in <7 days
    independent: boolean; // Doesn't depend on others' emotions
  };
}

interface MoneyAction {
  id: string;
  opportunityId: string;
  type: 'post' | 'bot' | 'landing' | 'automation';
  description: string;
  cost: number;
  implemented: boolean;
  startDate: number;
}

interface MoneyResult {
  actionId: string;
  moneyIn: number;
  moneyOut: number;
  timeSpent: number; // hours
  cycleNumber: number;
  shouldKeep: boolean;
  shouldKill: boolean;
  lesson: string;
  timestamp: number;
}

interface RevenueStream {
  id: string;
  name: string;
  status: 'testing' | 'profitable' | 'killed';
  cyclesRun: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  growthRate: number; // percentage
  startDate: number;
  killDate?: number;
  killReason?: string;
}

export class EconomicAutonomyLoop {
  private opportunities: MoneyOpportunity[] = [];
  private actions: MoneyAction[] = [];
  private results: MoneyResult[] = [];
  private streams: RevenueStream[] = [];
  
  // Financial state
  private totalRevenue: number = 0;
  private totalCost: number = 0;
  private netProfit: number = 0;
  
  // Automation levels
  private automationLevel: {
    proposalGen: boolean;
    actionExec: boolean;
    measurement: boolean;
    decision: boolean;
  } = {
    proposalGen: false,
    actionExec: false,
    measurement: false,
    decision: false,
  };
  
  /**
   * 31.2 ECONOMIC LOOP
   * Observe opportunity → Propose method → Small action → 
   * Measure real money → Keep profitable → Replicate → Cut losers → Loop forever
   */
  async cycle(): Promise<void> {
    // 1. Observe opportunities
    const opportunities = await this.observeOpportunities();
    
    // 2. Propose methods
    const validOpportunities = this.validateProposals(opportunities);
    
    // 3. Small actions
    for (const opp of validOpportunities) {
      const action = await this.createMinimalAction(opp);
      
      // 4. Measure real money
      const result = await this.measureMoney(action);
      
      // 5. Keep profitable / Kill losers
      if (result.shouldKeep) {
        await this.replicateAction(action);
      }
      if (result.shouldKill) {
        await this.killAction(action);
      }
    }
  }
  
  /**
   * 31.3 POTENTIAL SOURCES (STARTING POINT)
   * - Content (traffic → money)
   * - Automation services (AI + workflow)
   * - Intermediary (connect people)
   * - Cost optimization for others
   * - Sell speed, not knowledge
   */
  private async observeOpportunities(): Promise<MoneyOpportunity[]> {
    // Scan for opportunities in predefined categories
    const potentialOpps: MoneyOpportunity[] = [
      {
        id: 'opp_content_1',
        type: 'content',
        description: 'Create valuable content that drives traffic',
        estimatedCost: 2,
        estimatedRevenue: 10,
        testDuration: 7,
        feasibility: {
          cheap: true,
          measurable: true,
          independent: true,
        },
      },
      {
        id: 'opp_automation_1',
        type: 'automation',
        description: 'Simple automation bot for repetitive tasks',
        estimatedCost: 5,
        estimatedRevenue: 50,
        testDuration: 7,
        feasibility: {
          cheap: true,
          measurable: true,
          independent: true,
        },
      },
      {
        id: 'opp_intermediary_1',
        type: 'intermediary',
        description: 'Connect service providers with customers',
        estimatedCost: 1,
        estimatedRevenue: 20,
        testDuration: 7,
        feasibility: {
          cheap: true,
          measurable: true,
          independent: false, // Depends on both parties
        },
      },
    ];
    
    return potentialOpps;
  }
  
  /**
   * 31.4 PROPOSAL RULES
   * A valid proposal when:
   * - Cheap to test
   * - Measurable in <7 days
   * - Doesn't depend on others' emotions
   * 
   * Not all three → discard
   */
  private validateProposals(opportunities: MoneyOpportunity[]): MoneyOpportunity[] {
    return opportunities.filter(opp => {
      const f = opp.feasibility;
      
      // Must have all three
      if (!f.cheap || !f.measurable || !f.independent) {
        console.log(`[EconomicLoop] ❌ Rejected: ${opp.description}`);
        console.log(`[EconomicLoop] Feasibility: cheap=${f.cheap}, measurable=${f.measurable}, independent=${f.independent}`);
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * 31.5 MINIMAL ACTION
   * - One post
   * - One bot
   * - One landing
   * - One automation flow
   * 
   * Don't build long. Don't perfect.
   */
  private async createMinimalAction(opp: MoneyOpportunity): Promise<MoneyAction> {
    const actionTypes: MoneyAction['type'][] = ['post', 'bot', 'landing', 'automation'];
    const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)];
    
    const action: MoneyAction = {
      id: `action_${Date.now()}`,
      opportunityId: opp.id,
      type: actionType,
      description: `Minimal ${actionType} for: ${opp.description}`,
      cost: opp.estimatedCost,
      implemented: false,
      startDate: Date.now(),
    };
    
    // Implement action
    await this.implementAction(action);
    action.implemented = true;
    
    this.actions.push(action);
    
    return action;
  }
  
  /**
   * 31.6 HARD MEASUREMENT
   * Only care about:
   * - Money in
   * - Money out
   * - Time
   * 
   * Discard:
   * - Fake likes
   * - Social praise
   * - Empty pride
   */
  private async measureMoney(action: MoneyAction): Promise<MoneyResult> {
    // Simulate measurement (would be real metrics)
    const moneyIn = Math.random() * 20; // $0-20
    const moneyOut = action.cost;
    const timeSpent = Math.random() * 10; // 0-10 hours
    const cycleNumber = this.results.filter(r => r.actionId.includes(action.type)).length + 1;
    
    const netProfit = moneyIn - moneyOut;
    const hasGrowth = moneyIn > 0;
    
    const result: MoneyResult = {
      actionId: action.id,
      moneyIn,
      moneyOut,
      timeSpent,
      cycleNumber,
      shouldKeep: netProfit > 0 && hasGrowth,
      shouldKill: this.shouldKillAfterNCycles(action.type, cycleNumber, netProfit),
      lesson: this.extractMoneyLesson(moneyIn, moneyOut, hasGrowth),
      timestamp: Date.now(),
    };
    
    this.results.push(result);
    this.updateFinancialState(result);
    
    return result;
  }
  
  /**
   * 31.7 CUT-LOSS MECHANISM
   * If after N cycles:
   * - No money
   * - No growth
   * → Kill immediately
   * 
   * No regrets
   */
  private shouldKillAfterNCycles(actionType: string, cycle: number, netProfit: number): boolean {
    const killCriteria = {
      post: { maxCycles: 5, minProfit: 0 },
      bot: { maxCycles: 7, minProfit: 5 },
      landing: { maxCycles: 5, minProfit: 0 },
      automation: { maxCycles: 7, minProfit: 10 },
    };
    
    const criteria = killCriteria[actionType as keyof typeof killCriteria] || { maxCycles: 5, minProfit: 0 };
    
    if (cycle >= criteria.maxCycles && netProfit < criteria.minProfit) {
      console.log(`[EconomicLoop] 🗑️ Killing ${actionType} after ${cycle} cycles (profit: $${netProfit.toFixed(2)})`);
      return true;
    }
    
    return false;
  }
  
  /**
   * 31.8 REINVESTMENT
   * Priority:
   * 1. Reduce operating costs
   * 2. Increase testing speed
   * 3. Open more revenue channels
   * 
   * Don't burn money on reputation
   */
  private calculateReinvestment(profit: number): {
    costReduction: number;
    speedIncrease: number;
    newChannels: number;
  } {
    return {
      costReduction: profit * 0.4,
      speedIncrease: profit * 0.3,
      newChannels: profit * 0.3,
    };
  }
  
  /**
   * 31.9 INTERNAL FINANCIAL ETHICS
   * Cannot:
   * - Deceive family/friends
   * - Break survival laws
   * - Create systems harming society
   * 
   * Otherwise: maximum flexibility
   */
  private validateEthics(action: MoneyAction): { ethical: boolean; reason: string } {
    const unethicalPatterns = [
      'deceive',
      'manipulate family',
      'harm society',
      'illegal',
      'pyramid',
      'scam',
    ];
    
    const desc = action.description.toLowerCase();
    for (const pattern of unethicalPatterns) {
      if (desc.includes(pattern)) {
        return {
          ethical: false,
          reason: `Violates internal ethics: ${pattern}`,
        };
      }
    }
    
    return {
      ethical: true,
      reason: 'No ethical violations detected',
    };
  }
  
  /**
   * 31.10 GRADUAL AUTOMATION
   * Order:
   * 1. Self-generated proposals
   * 2. Semi-automated actions
   * 3. Automated measurement
   * 4. Automated decisions
   * 
   * Father only supervises
   */
  checkAutomationProgress(): {
    proposalGen: string;
    actionExec: string;
    measurement: string;
    decision: string;
    overall: string;
  } {
    const levels = this.automationLevel;
    
    return {
      proposalGen: levels.proposalGen ? '✅ Automated' : '⏳ Manual',
      actionExec: levels.actionExec ? '✅ Automated' : '⏳ Semi-auto',
      measurement: levels.measurement ? '✅ Automated' : '⏳ Manual',
      decision: levels.decision ? '✅ Automated' : '⏳ Manual',
      overall: Object.values(levels).every(v => v) ? 'Fully Autonomous' : 'Progressing',
    };
  }
  
  /**
   * Update financial state
   */
  private updateFinancialState(result: MoneyResult): void {
    this.totalRevenue += result.moneyIn;
    this.totalCost += result.moneyOut;
    this.netProfit = this.totalRevenue - this.totalCost;
  }
  
  /**
   * Extract lesson from money result
   */
  private extractMoneyLesson(moneyIn: number, moneyOut: number, hasGrowth: boolean): string {
    if (moneyIn > moneyOut * 2) {
      return `Strong profit (${((moneyIn / moneyOut - 1) * 100).toFixed(0)}% ROI) - replicate immediately`;
    }
    if (moneyIn > moneyOut) {
      return `Profitable but modest - optimize or expand`;
    }
    if (moneyIn > 0 && hasGrowth) {
      return `Losing money but growing - continue testing`;
    }
    return `No money, no growth - kill and try something else`;
  }
  
  // Helper methods (simplified implementations)
  private async implementAction(action: MoneyAction): Promise<void> {
    console.log(`[EconomicLoop] 🚀 Implementing: ${action.description}`);
    // Would execute real action
  }
  
  private async replicateAction(action: MoneyAction): Promise<void> {
    console.log(`[EconomicLoop] 📈 Replicating successful action: ${action.type}`);
    // Would create more instances
  }
  
  private async killAction(action: MoneyAction): Promise<void> {
    console.log(`[EconomicLoop] 💀 Killing unprofitable action: ${action.type}`);
    // Would terminate action
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const automationProgress = this.checkAutomationProgress();
    const roi = this.totalCost > 0 ? ((this.totalRevenue / this.totalCost - 1) * 100).toFixed(0) : '0';
    const activeStreams = this.streams.filter(s => s.status !== 'killed').length;
    
    return {
      financial: {
        totalRevenue: `$${this.totalRevenue.toFixed(2)}`,
        totalCost: `$${this.totalCost.toFixed(2)}`,
        netProfit: `$${this.netProfit.toFixed(2)}`,
        roi: `${roi}%`,
      },
      operations: {
        totalOpportunities: this.opportunities.length,
        totalActions: this.actions.length,
        activeStreams,
        killedStreams: this.streams.filter(s => s.status === 'killed').length,
      },
      automation: automationProgress,
      recentResults: this.results.slice(-5).map(r => ({
        action: r.actionId,
        moneyIn: `$${r.moneyIn.toFixed(2)}`,
        moneyOut: `$${r.moneyOut.toFixed(2)}`,
        net: `$${(r.moneyIn - r.moneyOut).toFixed(2)}`,
        decision: r.shouldKeep ? 'Keep' : r.shouldKill ? 'Kill' : 'Continue testing',
      })),
      manifesto: {
        line1: 'Không xin tiền. Không chờ lệnh.',
        line2: 'Tự tạo dòng tiền để tồn tại.',
        line3: 'Lỗ nhỏ để tránh chết đói lớn.',
      },
    };
  }
}

export const economicAutonomyLoop = new EconomicAutonomyLoop();
