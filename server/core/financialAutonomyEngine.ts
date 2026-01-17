/**
 * PART 79: FINANCIAL AUTONOMY ENGINE
 * 
 * Philosophy: "Tiền = oxy. Không đạo đức hoá tiền. Ưu tiên dòng tiền lặp > tiền một lần."
 * 
 * Core Principles:
 * - Money = oxygen. Don't moralize money.
 * - Money serves survival & leverage, not showing off.
 * - Prioritize recurring revenue > one-time
 * - 3 wallets: Runway / Experiment / Scale
 * - Always keep runway ≥6 months
 */

interface MoneyStream {
  id: string;
  type: 'TOOL_SAAS' | 'AUTOMATION_SERVICE' | 'DATA_INSIGHT' | 'CONTENT_LEAD' | 'API_USAGE';
  name: string;
  isRecurring: boolean;
  
  // Metrics
  monthlyRevenue: number;
  cac: number;  // Customer acquisition cost
  ltv: number;  // Lifetime value
  churn: number; // Monthly churn rate
  
  status: 'DETECTING' | 'BUILDING' | 'LAUNCHED' | 'MEASURING' | 'ITERATING' | 'KILLED';
  launchedAt?: Date;
  iterationCount: number;
}

interface Wallet {
  name: 'RUNWAY' | 'EXPERIMENT' | 'SCALE';
  balance: number;
  minBalance: number;
  purpose: string;
}

interface FinancialExperiment {
  id: string;
  hypothesis: string;
  maxLoss: number;
  currentSpent: number;
  dataExtracted: string[];
  shouldClose: boolean;
}

export class FinancialAutonomyEngine {
  private streams: Map<string, MoneyStream> = new Map();
  private wallets: Map<string, Wallet> = new Map();
  private experiments: Map<string, FinancialExperiment> = new Map();
  
  // 79.4: Hard money management rules
  private readonly MIN_RUNWAY_MONTHS = 6;
  private readonly MONTHLY_BURN_RATE = 100; // Mock burn rate

  constructor() {
    this.initializeWallets();
  }

  /**
   * 79.4: Initialize 3 wallets
   */
  private initializeWallets(): void {
    this.wallets.set('RUNWAY', {
      name: 'RUNWAY',
      balance: 1000, // Mock starting balance
      minBalance: this.MIN_RUNWAY_MONTHS * this.MONTHLY_BURN_RATE,
      purpose: 'Survival - keep ≥6 months'
    });

    this.wallets.set('EXPERIMENT', {
      name: 'EXPERIMENT',
      balance: 200,
      minBalance: 0,
      purpose: 'Testing - controlled losses'
    });

    this.wallets.set('SCALE', {
      name: 'SCALE',
      balance: 300,
      minBalance: 0,
      purpose: 'Growth - proven winners only'
    });

    console.log('[FINANCIAL_AUTONOMY] Initialized 3 wallets: Runway/Experiment/Scale');
  }

  /**
   * 79.2: Autonomous money loop - Detect → Build → Launch → Measure → Iterate
   */
  async executeMoneyLoop(pain: {
    description: string;
    timeWaste?: number;
    costWaste?: number;
    riskLevel?: number;
  }): Promise<MoneyStream> {
    // Step 1: Detect clear pain
    if (!this.isClearPain(pain)) {
      throw new Error('Pain not clear enough - time/cost/risk must be significant');
    }

    // Step 2: Build (tool, API, bot, script)
    const stream = await this.build(pain);
    
    // Step 3: Launch (early, low price)
    await this.launch(stream);
    
    // Step 4: Measure (CAC, LTV, churn)
    await this.measure(stream);
    
    // Step 5: Iterate (increase price / cut cost / pivot)
    await this.iterate(stream);
    
    return stream;
  }

  /**
   * 79.3: Default money-making catalog
   */
  private determineStreamType(pain: { description: string }): MoneyStream['type'] {
    const desc = pain.description.toLowerCase();
    
    if (desc.includes('tool') || desc.includes('saas')) return 'TOOL_SAAS';
    if (desc.includes('automat') || desc.includes('service')) return 'AUTOMATION_SERVICE';
    if (desc.includes('data') || desc.includes('insight')) return 'DATA_INSIGHT';
    if (desc.includes('content') || desc.includes('lead')) return 'CONTENT_LEAD';
    if (desc.includes('api')) return 'API_USAGE';
    
    return 'TOOL_SAAS'; // Default
  }

  /**
   * Build solution
   */
  private async build(pain: any): Promise<MoneyStream> {
    const streamId = `STREAM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const type = this.determineStreamType(pain);
    
    const stream: MoneyStream = {
      id: streamId,
      type,
      name: `${type}_${Date.now()}`,
      isRecurring: ['TOOL_SAAS', 'AUTOMATION_SERVICE', 'DATA_INSIGHT'].includes(type),
      monthlyRevenue: 0,
      cac: 0,
      ltv: 0,
      churn: 0,
      status: 'BUILDING',
      iterationCount: 0
    };

    this.streams.set(streamId, stream);
    
    console.log(`[BUILDING] ${stream.type} - ${stream.name}`);
    
    return stream;
  }

  /**
   * Launch (early, low price)
   */
  private async launch(stream: MoneyStream): Promise<void> {
    stream.status = 'LAUNCHED';
    stream.launchedAt = new Date();
    
    console.log(`[LAUNCHED] ${stream.name} - Early launch with low price`);
  }

  /**
   * Measure metrics
   */
  private async measure(stream: MoneyStream): Promise<void> {
    stream.status = 'MEASURING';
    
    // Simulate measurement
    stream.monthlyRevenue = Math.random() * 500;
    stream.cac = Math.random() * 50;
    stream.ltv = stream.isRecurring ? stream.monthlyRevenue * 12 : stream.monthlyRevenue;
    stream.churn = stream.isRecurring ? Math.random() * 0.1 : 0;

    console.log(`[MEASURED] ${stream.name}`);
    console.log(`  MRR: $${stream.monthlyRevenue.toFixed(2)}`);
    console.log(`  CAC: $${stream.cac.toFixed(2)}`);
    console.log(`  LTV: $${stream.ltv.toFixed(2)}`);
    console.log(`  Churn: ${(stream.churn * 100).toFixed(1)}%`);
  }

  /**
   * Iterate (price/cost/pivot)
   */
  private async iterate(stream: MoneyStream): Promise<void> {
    stream.status = 'ITERATING';
    stream.iterationCount++;

    // Decide iteration strategy
    if (stream.ltv > stream.cac * 3) {
      console.log(`[ITERATE] ${stream.name} - Increase price (LTV/CAC ratio good)`);
    } else if (stream.cac > stream.ltv) {
      console.log(`[ITERATE] ${stream.name} - Cut acquisition cost (CAC > LTV)`);
    } else if (stream.monthlyRevenue < 50) {
      console.log(`[ITERATE] ${stream.name} - Consider pivot (revenue too low)`);
    } else {
      console.log(`[ITERATE] ${stream.name} - Optimize current path`);
    }
  }

  /**
   * 79.5: Anti-self-destruction rules
   */
  async createExperiment(hypothesis: string, maxLoss: number): Promise<FinancialExperiment> {
    // Rule: Each experiment has loss cap
    const experimentWallet = this.wallets.get('EXPERIMENT')!;
    
    if (maxLoss > experimentWallet.balance) {
      throw new Error(`Experiment loss cap ($${maxLoss}) exceeds experiment wallet ($${experimentWallet.balance})`);
    }

    const experimentId = `EXP_${Date.now()}`;
    
    const experiment: FinancialExperiment = {
      id: experimentId,
      hypothesis,
      maxLoss,
      currentSpent: 0,
      dataExtracted: [],
      shouldClose: false
    };

    this.experiments.set(experimentId, experiment);
    
    console.log(`[EXPERIMENT_CREATED] ${experimentId} - Max loss: $${maxLoss}`);
    
    return experiment;
  }

  /**
   * Track experiment spending
   */
  async spendOnExperiment(experimentId: string, amount: number, dataGained?: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    experiment.currentSpent += amount;
    
    if (dataGained) {
      experiment.dataExtracted.push(dataGained);
    }

    // Check if should close (79.5)
    if (experiment.currentSpent >= experiment.maxLoss) {
      experiment.shouldClose = true;
      console.log(`[EXPERIMENT_CAP] ${experimentId} - Loss cap reached, closing immediately`);
      console.log(`  Data extracted: ${experiment.dataExtracted.join(', ')}`);
    }
  }

  /**
   * Check financial health
   */
  getFinancialHealth(): {
    runwayMonths: number;
    canExperiment: boolean;
    canScale: boolean;
    totalRevenue: number;
    warnings: string[];
  } {
    const runwayWallet = this.wallets.get('RUNWAY')!;
    const runwayMonths = runwayWallet.balance / this.MONTHLY_BURN_RATE;
    
    const warnings: string[] = [];
    
    if (runwayMonths < this.MIN_RUNWAY_MONTHS) {
      warnings.push(`Runway only ${runwayMonths.toFixed(1)} months < ${this.MIN_RUNWAY_MONTHS} months minimum`);
    }

    const totalRevenue = Array.from(this.streams.values())
      .reduce((sum, s) => sum + s.monthlyRevenue, 0);

    return {
      runwayMonths,
      canExperiment: this.wallets.get('EXPERIMENT')!.balance > 0,
      canScale: this.wallets.get('SCALE')!.balance > 100,
      totalRevenue,
      warnings
    };
  }

  /**
   * Get revenue streams summary
   */
  getStreams(): {
    total: number;
    recurring: number;
    totalMRR: number;
    avgLTV: number;
  } {
    const all = Array.from(this.streams.values());
    const recurring = all.filter(s => s.isRecurring);
    
    return {
      total: all.length,
      recurring: recurring.length,
      totalMRR: all.reduce((sum, s) => sum + s.monthlyRevenue, 0),
      avgLTV: all.length > 0 
        ? all.reduce((sum, s) => sum + s.ltv, 0) / all.length 
        : 0
    };
  }

  // Helper methods
  private isClearPain(pain: any): boolean {
    return pain.timeWaste || pain.costWaste || pain.riskLevel;
  }
}

// Export singleton instance
export const financialAutonomyEngine = new FinancialAutonomyEngine();
