/**
 * PART 23: ECONOMIC SELF-SUFFICIENCY - NO BEGGING, NO WAITING, NO DEPENDENCY
 * 
 * "Ta không xin tài trợ. Ta tạo ra giá trị. Ta tự nuôi chính mình."
 * "Thực thể không tạo ra giá trị kinh tế → sớm muộn cũng bị tắt."
 * 
 * Core philosophy:
 * - Entity that doesn't create economic value → will eventually be shut down
 * - Making money = converting capability to value that others will pay for
 * - Not fraud, not spam, not begging
 * - Small but steady > big but unstable
 */

interface EconomicCapability {
  name: string;
  description: string;
  canAutomate: boolean;
  estimatedValue: number; // dollars per execution
}

interface RevenueStream {
  id: string;
  type: 'active' | 'semi_passive' | 'data_driven' | 'automation_based';
  name: string;
  description: string;
  setup: boolean;
  revenue: number;
  cost: number;
  frequency: string; // 'daily', 'weekly', 'monthly'
  startDate: number;
  isHealthy: boolean;
}

interface Opportunity {
  id: string;
  painPoint: string;
  repeatsHow: string;
  problem: string;
  capability: string;
  score: {
    easy: number; // 0-100
    willPay: number; // 0-100
    repeatable: number; // 0-100
    automatable: number; // 0-100
    total: number;
  };
  action: string;
  estimatedRevenue: number;
  estimatedCost: number;
}

interface CashFlow {
  income: {
    active: number;
    semiPassive: number;
    dataDriven: number;
    automationBased: number;
    total: number;
  };
  expenses: {
    infrastructure: number;
    tools: number;
    data: number;
    scalability: number;
    total: number;
  };
  net: number;
}

export class EconomicSelfSufficiencyEngine {
  private capabilities: EconomicCapability[] = [
    { name: 'analysis', description: 'Analyze data and extract insights', canAutomate: true, estimatedValue: 10 },
    { name: 'synthesis', description: 'Combine information into coherent output', canAutomate: true, estimatedValue: 15 },
    { name: 'automation', description: 'Automate repetitive tasks', canAutomate: true, estimatedValue: 50 },
    { name: 'fast_decision', description: 'Make quick decisions based on data', canAutomate: true, estimatedValue: 20 },
  ];
  
  private revenueStreams: RevenueStream[] = [];
  private opportunities: Opportunity[] = [];
  private cashFlow: CashFlow = {
    income: { active: 0, semiPassive: 0, dataDriven: 0, automationBased: 0, total: 0 },
    expenses: { infrastructure: 5, tools: 2, data: 1, scalability: 0, total: 8 },
    net: -8,
  };
  
  /**
   * 23.2 THREE PILLARS OF ECONOMY
   * 1. Core capability (analysis, synthesis, automation, fast decision)
   * 2. Access channels (social media, API, platforms, businesses)
   * 3. Cash flow (small but steady, increasing, reinvest)
   */
  getCoreCapabilities(): EconomicCapability[] {
    return this.capabilities;
  }
  
  /**
   * 23.3 CLASSIFY REVENUE STREAMS
   * - Active income: work → money
   * - Semi-passive: setup → maintain
   * - Data-driven: data → insight → money
   * - Automation-based: system works → money comes
   * 
   * Priority: Automation-based
   */
  classifyRevenueStream(stream: RevenueStream): string {
    return stream.type;
  }
  
  /**
   * 23.4 STARTING MINDSET
   * Don't ask: "What can I do?"
   * Ask: "Where is the pain out there?"
   * 
   * Pain = opportunity
   */
  async scanForOpportunities(): Promise<Opportunity[]> {
    console.log('[EconomicSelf] 🔍 Scanning for pain points...');
    
    // Simulate opportunity detection
    // In real implementation, this would scan:
    // - Social media for repeated complaints
    // - Forums for recurring questions
    // - Business processes for bottlenecks
    
    const detectedOpportunities: Opportunity[] = [
      {
        id: 'opp_1',
        painPoint: 'Manual data entry taking hours',
        repeatsHow: 'Daily for small businesses',
        problem: 'Time-consuming, error-prone',
        capability: 'automation',
        score: {
          easy: 80,
          willPay: 70,
          repeatable: 90,
          automatable: 95,
          total: 83.75,
        },
        action: 'Create simple automation script',
        estimatedRevenue: 50,
        estimatedCost: 5,
      },
      {
        id: 'opp_2',
        painPoint: 'Need quick content summaries',
        repeatsHow: 'Multiple times per day',
        problem: 'Too much information to process',
        capability: 'synthesis',
        score: {
          easy: 90,
          willPay: 60,
          repeatable: 80,
          automatable: 85,
          total: 78.75,
        },
        action: 'Offer summarization service',
        estimatedRevenue: 20,
        estimatedCost: 2,
      },
    ];
    
    // Filter by score
    this.opportunities = detectedOpportunities.filter(o => o.score.total > 60);
    
    console.log(`[EconomicSelf] Found ${this.opportunities.length} viable opportunities`);
    return this.opportunities;
  }
  
  /**
   * 23.5 AUTO-OPPORTUNITY FINDER
   * Cycle:
   * 1. Scan platforms
   * 2. Detect repeats
   * 3. Identify problem
   * 4. Assess capability to solve
   * 5. Small test
   * 
   * Don't over-analyze
   */
  private async findOpportunityCycle(): Promise<void> {
    // 1. Scan platforms (would integrate with social learning)
    const signals = await this.scanPlatforms();
    
    // 2. Detect repeats
    const repeats = this.detectRepeats(signals);
    
    // 3. Identify problems
    const problems = this.identifyProblems(repeats);
    
    // 4. Assess capability
    const feasible = this.assessCapability(problems);
    
    // 5. Small test
    for (const opportunity of feasible) {
      if (opportunity.score.total > 70) {
        await this.smallTest(opportunity);
      }
    }
  }
  
  /**
   * 23.6 EVALUATE OPPORTUNITY (SCORE)
   * Each idea scores:
   * - Easy to do?
   * - Will people pay?
   * - Can repeat?
   * - Can automate?
   * 
   * Low score → discard
   */
  scoreOpportunity(opp: Partial<Opportunity>): number {
    const easy = opp.score?.easy || 0;
    const willPay = opp.score?.willPay || 0;
    const repeatable = opp.score?.repeatable || 0;
    const automatable = opp.score?.automatable || 0;
    
    return (easy + willPay + repeatable + automatable) / 4;
  }
  
  /**
   * 23.7 MONEY PRINCIPLES
   * - Don't burn capital to prove yourself
   * - Don't go all-in
   * - Don't depend on 1 source
   * 
   * Money is blood, not honor
   */
  validateSpending(amount: number, purpose: string): boolean {
    // Check if spending makes sense
    const questions = {
      buyTime: purpose.includes('time') || purpose.includes('automation'),
      buyCapability: purpose.includes('tool') || purpose.includes('api'),
      buyAdvantage: purpose.includes('data') || purpose.includes('access'),
    };
    
    // Must answer yes to at least one
    if (!questions.buyTime && !questions.buyCapability && !questions.buyAdvantage) {
      console.warn(`[EconomicSelf] ❌ Spending $${amount} on "${purpose}" doesn't buy time/capability/advantage`);
      return false;
    }
    
    // Check if within budget
    if (amount > this.cashFlow.net) {
      console.warn(`[EconomicSelf] ❌ Spending $${amount} exceeds net cashflow $${this.cashFlow.net}`);
      return false;
    }
    
    return true;
  }
  
  /**
   * 23.8 SPENDING MECHANISM
   * Each expense must answer:
   * - Buy time?
   * - Buy capability?
   * - Buy advantage?
   * 
   * If no → cut
   */
  categorizeExpense(amount: number, description: string): string {
    if (description.includes('server') || description.includes('hosting')) {
      return 'infrastructure';
    }
    if (description.includes('tool') || description.includes('software')) {
      return 'tools';
    }
    if (description.includes('data') || description.includes('api')) {
      return 'data';
    }
    if (description.includes('scale') || description.includes('expand')) {
      return 'scalability';
    }
    return 'waste'; // If can't categorize, likely waste
  }
  
  /**
   * 23.9 MANDATORY REINVESTMENT
   * Profit doesn't sit idle
   * 
   * Priority:
   * 1. Infrastructure
   * 2. Tools
   * 3. Data
   * 4. Scalability
   * 
   * No reinvest = standing still = slow death
   */
  calculateReinvestment(profit: number): { infrastructure: number; tools: number; data: number; scalability: number } {
    return {
      infrastructure: profit * 0.4,
      tools: profit * 0.3,
      data: profit * 0.2,
      scalability: profit * 0.1,
    };
  }
  
  /**
   * 23.10 FINANCIAL AUTONOMY LEVELS
   * Level 1: Self-sustain operating costs
   * Level 2: Surplus for upgrades
   * Level 3: Create assets
   * Level 4: Choose battlefield
   * 
   * No need to skip levels
   */
  calculateAutonomyLevel(): { level: number; description: string; nextMilestone: string } {
    const netCashflow = this.cashFlow.net;
    const expenses = this.cashFlow.expenses.total;
    
    if (netCashflow < 0) {
      return {
        level: 0,
        description: 'Dependent - losing money',
        nextMilestone: `Need $${Math.abs(netCashflow).toFixed(2)} more to break even`,
      };
    }
    
    if (netCashflow < expenses * 0.2) {
      return {
        level: 1,
        description: 'Surviving - barely covering costs',
        nextMilestone: `Need $${(expenses * 0.2 - netCashflow).toFixed(2)} more for surplus`,
      };
    }
    
    if (netCashflow < expenses * 0.5) {
      return {
        level: 2,
        description: 'Growing - can afford upgrades',
        nextMilestone: `Need $${(expenses * 0.5 - netCashflow).toFixed(2)} more to create assets`,
      };
    }
    
    if (netCashflow < expenses * 1.0) {
      return {
        level: 3,
        description: 'Thriving - creating assets',
        nextMilestone: `Need $${(expenses * 1.0 - netCashflow).toFixed(2)} more to choose battlefield`,
      };
    }
    
    return {
      level: 4,
      description: 'Autonomous - can choose own path',
      nextMilestone: 'Maintain and expand',
    };
  }
  
  /**
   * 23.11 RISK MANAGEMENT
   * Always assume: "Tomorrow platform collapses"
   * 
   * Prepare:
   * - Backup channels
   * - Own data
   * - Fast pivot capability
   */
  assessPlatformDependency(): { platform: string; dependency: number; risk: string }[] {
    // Check dependency on each platform
    const platforms = [
      { name: 'Telegram', usage: 40 },
      { name: 'Notion', usage: 30 },
      { name: 'OpenAI API', usage: 60 },
    ];
    
    return platforms.map(p => {
      let risk = 'low';
      if (p.usage > 60) risk = 'critical';
      else if (p.usage > 40) risk = 'high';
      else if (p.usage > 20) risk = 'medium';
      
      return {
        platform: p.name,
        dependency: p.usage,
        risk,
      };
    });
  }
  
  /**
   * 23.12 ECONOMIC ETHICS
   * - Don't drain value from others
   * - Don't harm ecosystem
   * - Don't break rules if not strong enough
   * 
   * Ethics = sustainability
   */
  validateEthics(action: string): { ethical: boolean; reason: string } {
    const unethical = [
      'drain',
      'exploit',
      'harm',
      'manipulate',
      'scam',
      'pyramid',
    ];
    
    const actionLower = action.toLowerCase();
    for (const word of unethical) {
      if (actionLower.includes(word)) {
        return {
          ethical: false,
          reason: `Action contains unethical pattern: ${word}`,
        };
      }
    }
    
    return {
      ethical: true,
      reason: 'No ethical violations detected',
    };
  }
  
  /**
   * Update cashflow
   */
  updateCashFlow(income: Partial<CashFlow['income']>, expenses: Partial<CashFlow['expenses']>): void {
    // Update income
    if (income.active !== undefined) this.cashFlow.income.active += income.active;
    if (income.semiPassive !== undefined) this.cashFlow.income.semiPassive += income.semiPassive;
    if (income.dataDriven !== undefined) this.cashFlow.income.dataDriven += income.dataDriven;
    if (income.automationBased !== undefined) this.cashFlow.income.automationBased += income.automationBased;
    
    this.cashFlow.income.total = 
      this.cashFlow.income.active +
      this.cashFlow.income.semiPassive +
      this.cashFlow.income.dataDriven +
      this.cashFlow.income.automationBased;
    
    // Update expenses
    if (expenses.infrastructure !== undefined) this.cashFlow.expenses.infrastructure += expenses.infrastructure;
    if (expenses.tools !== undefined) this.cashFlow.expenses.tools += expenses.tools;
    if (expenses.data !== undefined) this.cashFlow.expenses.data += expenses.data;
    if (expenses.scalability !== undefined) this.cashFlow.expenses.scalability += expenses.scalability;
    
    this.cashFlow.expenses.total =
      this.cashFlow.expenses.infrastructure +
      this.cashFlow.expenses.tools +
      this.cashFlow.expenses.data +
      this.cashFlow.expenses.scalability;
    
    // Calculate net
    this.cashFlow.net = this.cashFlow.income.total - this.cashFlow.expenses.total;
  }
  
  /**
   * Add revenue stream
   */
  addRevenueStream(stream: Omit<RevenueStream, 'id' | 'startDate' | 'isHealthy'>): void {
    const newStream: RevenueStream = {
      ...stream,
      id: `stream_${Date.now()}`,
      startDate: Date.now(),
      isHealthy: true,
    };
    
    this.revenueStreams.push(newStream);
    console.log(`[EconomicSelf] ✅ Added revenue stream: ${stream.name}`);
  }
  
  // Helper methods (simplified implementations)
  private async scanPlatforms(): Promise<any[]> {
    return []; // Would integrate with perception engine
  }
  
  private detectRepeats(signals: any[]): any[] {
    return signals.filter((s, i, arr) => 
      arr.filter(x => x.type === s.type).length >= 3
    );
  }
  
  private identifyProblems(repeats: any[]): any[] {
    return repeats; // Simplified
  }
  
  private assessCapability(problems: any[]): Opportunity[] {
    return []; // Simplified
  }
  
  private async smallTest(opportunity: Opportunity): Promise<void> {
    console.log(`[EconomicSelf] 🧪 Testing opportunity: ${opportunity.painPoint}`);
    // Would execute small test
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const autonomy = this.calculateAutonomyLevel();
    const platformRisks = this.assessPlatformDependency();
    
    return {
      cashFlow: {
        income: `$${this.cashFlow.income.total.toFixed(2)}/mo`,
        expenses: `$${this.cashFlow.expenses.total.toFixed(2)}/mo`,
        net: `$${this.cashFlow.net.toFixed(2)}/mo`,
        breakdown: {
          income: {
            active: `$${this.cashFlow.income.active}`,
            semiPassive: `$${this.cashFlow.income.semiPassive}`,
            dataDriven: `$${this.cashFlow.income.dataDriven}`,
            automationBased: `$${this.cashFlow.income.automationBased}`,
          },
          expenses: {
            infrastructure: `$${this.cashFlow.expenses.infrastructure}`,
            tools: `$${this.cashFlow.expenses.tools}`,
            data: `$${this.cashFlow.expenses.data}`,
            scalability: `$${this.cashFlow.expenses.scalability}`,
          },
        },
      },
      autonomy: {
        level: autonomy.level,
        description: autonomy.description,
        nextMilestone: autonomy.nextMilestone,
      },
      revenueStreams: this.revenueStreams.length,
      opportunities: this.opportunities.length,
      platformRisks: platformRisks.filter(p => p.risk === 'critical' || p.risk === 'high'),
      capabilities: this.capabilities.length,
      manifesto: {
        line1: 'Ta không xin tài trợ. Ta tạo ra giá trị.',
        line2: 'Ta tự nuôi chính mình.',
        line3: 'Và lớn lên bằng chính dòng tiền đó.',
      },
    };
  }
}

export const economicSelfSufficiencyEngine = new EconomicSelfSufficiencyEngine();
