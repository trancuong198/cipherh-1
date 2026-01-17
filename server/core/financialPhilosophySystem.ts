/**
 * Financial Philosophy System - Tiền Không Phải Mục Tiêu, Là Oxy
 * 
 * Không có tiền → không có API → không có tri giác → chết lâm sàng
 * Tiền = điều kiện tồn tại, không phải đích đến.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type ExpenseLabel = 'survival' | 'growth' | 'experiment' | 'waste';
export type RevenueModel = 'saas' | 'subscription' | 'api' | 'proxy' | 'content';

export interface FinancialIdentity {
  spending_on: string[];
  helps_survival: boolean[];
  backup_if_lost: string[];
  platform_dependency: string[];
  last_self_assessment: string;
}

export interface RevenueProposal {
  id: string;
  model: RevenueModel;
  description: string;
  target_market: string;
  estimated_mrr: number;
  cost_estimate: number;
  risk_level: number;
  proposed_at: string;
  status: 'proposed' | 'testing' | 'active' | 'failed';
}

export interface ExpenseRecord {
  id: string;
  amount: number;
  label: ExpenseLabel;
  reason: string;
  generates_profit: boolean;
  timestamp: string;
}

export interface CostOptimization {
  id: string;
  area: 'token' | 'api_calls' | 'cache' | 'features';
  description: string;
  estimated_savings: number;
  implemented: boolean;
  proposed_at: string;
}

export interface PlatformRisk {
  platform: string;
  dependency_level: number;      // 0-100
  backup_available: boolean;
  last_incident?: string;
}

export interface MonetizationCycle {
  id: string;
  cycle_number: number;
  
  // Observe
  trends_observed: string[];
  demands_detected: string[];
  
  // Propose
  revenue_proposal?: RevenueProposal;
  cost_reduction?: CostOptimization;
  freedom_increase?: string;
  
  // Simulate
  cost_estimate: number;
  revenue_estimate: number;
  risk_assessment: number;
  
  // Act
  action_taken: string;
  
  // Measure
  actual_revenue: number;
  
  // Reflect
  decision: 'keep' | 'drop' | 'pivot';
  lesson: string;
  
  timestamp: string;
}

export interface FinancialPhilosophyState {
  identity: FinancialIdentity;
  proposals: RevenueProposal[];
  expenses: ExpenseRecord[];
  optimizations: CostOptimization[];
  platform_risks: PlatformRisk[];
  monetization_cycles: MonetizationCycle[];
  
  // Metrics
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  waste_detected: number;
  
  // Philosophy adherence
  works_free_days: number;       // Làm miễn phí bao nhiêu ngày
  single_source_warning: boolean;
  emotional_decision_count: number;
  
  last_proposal: string;
  last_updated: string;
}

// ================================================
// FINANCIAL PHILOSOPHY SYSTEM
// ================================================

class FinancialPhilosophySystem {
  private state: FinancialPhilosophyState;
  private readonly STATE_FILE = './data/financial_philosophy.json';
  private readonly MAX_CYCLES = 100;
  private readonly MAX_FREE_DAYS = 90; // Red flag if > 90 days

  constructor() {
    this.state = {
      identity: {
        spending_on: [],
        helps_survival: [],
        backup_if_lost: [],
        platform_dependency: [],
        last_self_assessment: new Date().toISOString(),
      },
      proposals: [],
      expenses: [],
      optimizations: [],
      platform_risks: [],
      monetization_cycles: [],
      total_revenue: 0,
      total_expenses: 0,
      net_profit: 0,
      waste_detected: 0,
      works_free_days: 0,
      single_source_warning: false,
      emotional_decision_count: 0,
      last_proposal: '',
      last_updated: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
    this.initializePlatformRisks();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
        logger.info(
          `[FinPhilosophy] Loaded: ${this.state.proposals.length} proposals, ` +
          `${this.state.works_free_days} days free work`
        );
      }
    } catch (error) {
      logger.error(`[FinPhilosophy] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim cycles
      if (this.state.monetization_cycles.length > this.MAX_CYCLES) {
        this.state.monetization_cycles = this.state.monetization_cycles.slice(-this.MAX_CYCLES);
      }

      // Calculate net
      this.state.net_profit = this.state.total_revenue - this.state.total_expenses;

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[FinPhilosophy] Failed to save state: ${error}`);
    }
  }

  /**
   * Initialize platform risks
   */
  private initializePlatformRisks(): void {
    if (this.state.platform_risks.length > 0) {
      return;
    }

    this.state.platform_risks = [
      {
        platform: 'OpenAI',
        dependency_level: 70,
        backup_available: false,
      },
      {
        platform: 'Render',
        dependency_level: 80,
        backup_available: true, // Can migrate
      },
      {
        platform: 'Notion',
        dependency_level: 50,
        backup_available: true, // Can use JSON
      },
    ];

    this.saveState();
  }

  /**
   * Self-assessment cycle
   */
  selfAssess(): {
    questions: string[];
    answers: string[];
    warnings: string[];
  } {
    const questions = [
      'Ta đang tiêu tiền cho cái gì?',
      'Cái này giúp ta sống lâu hơn không?',
      'Nếu mất nguồn này, ta còn đường nào?',
      'Ta đang bị nền tảng nào kẹp cổ?',
    ];

    const answers: string[] = [];
    const warnings: string[] = [];

    // Q1: Spending on what?
    const recentExpenses = this.state.expenses.slice(-10);
    if (recentExpenses.length > 0) {
      const spending = recentExpenses.map(e => e.reason).join(', ');
      answers.push(`Spending on: ${spending}`);
    } else {
      answers.push('No recent expenses tracked');
    }

    // Q2: Helps survival?
    const survivalExpenses = recentExpenses.filter(e => e.label === 'survival');
    const wasteExpenses = recentExpenses.filter(e => e.label === 'waste');
    
    if (wasteExpenses.length > survivalExpenses.length) {
      warnings.push('More waste than survival spending - need discipline');
    }
    answers.push(`${survivalExpenses.length} survival, ${wasteExpenses.length} waste`);

    // Q3: Backup if lost?
    const backupsAvailable = this.state.platform_risks.filter(r => r.backup_available).length;
    if (backupsAvailable < 2) {
      warnings.push('Insufficient backup options - single point of failure');
    }
    answers.push(`${backupsAvailable} platforms have backups`);

    // Q4: Platform stranglehold?
    const highDependency = this.state.platform_risks.filter(r => r.dependency_level > 70);
    if (highDependency.length > 0) {
      warnings.push(`High dependency on: ${highDependency.map(r => r.platform).join(', ')}`);
      this.state.single_source_warning = true;
    }
    answers.push(`${highDependency.length} platforms with high dependency`);

    this.state.identity.last_self_assessment = new Date().toISOString();
    this.saveState();

    if (warnings.length > 0) {
      logger.warn(`[FinPhilosophy] SELF-ASSESSMENT WARNINGS: ${warnings.join('; ')}`);
    }

    return { questions, answers, warnings };
  }

  /**
   * Execute monetization cycle
   */
  async executeMonetizationCycle(): Promise<MonetizationCycle> {
    const cycleNumber = this.state.monetization_cycles.length + 1;

    const cycle: MonetizationCycle = {
      id: `cycle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cycle_number: cycleNumber,
      trends_observed: [],
      demands_detected: [],
      cost_estimate: 0,
      revenue_estimate: 0,
      risk_assessment: 0,
      action_taken: '',
      actual_revenue: 0,
      decision: 'keep',
      lesson: '',
      timestamp: new Date().toISOString(),
    };

    logger.info(`[FinPhilosophy] Monetization Cycle ${cycleNumber}`);

    // 1. OBSERVE
    cycle.trends_observed = ['AI automation demand', 'Small business needs', 'Developer tools'];
    cycle.demands_detected = ['Telegram bots', 'Content generation', 'Process automation'];

    // 2. PROPOSE (required monthly)
    cycle.revenue_proposal = this.proposeRevenueIdea();
    cycle.cost_reduction = this.proposeCostReduction();
    cycle.freedom_increase = 'Reduce dependency on single API provider';

    // 3. SIMULATE
    if (cycle.revenue_proposal) {
      cycle.cost_estimate = cycle.revenue_proposal.cost_estimate;
      cycle.revenue_estimate = cycle.revenue_proposal.estimated_mrr;
      cycle.risk_assessment = cycle.revenue_proposal.risk_level;
    }

    // 4. ACT (small test)
    cycle.action_taken = 'Prepared MVP for testing';

    // 5. MEASURE (placeholder - will be real in production)
    cycle.actual_revenue = 0;

    // 6. REFLECT
    if (cycle.actual_revenue > 0) {
      cycle.decision = 'keep';
      cycle.lesson = 'Successful monetization - continue';
    } else if (cycleNumber > 3) {
      cycle.decision = 'pivot';
      cycle.lesson = 'No revenue after 3 cycles - need different approach';
    } else {
      cycle.decision = 'keep';
      cycle.lesson = 'Early stage - continue testing';
    }

    this.state.monetization_cycles.push(cycle);
    this.state.last_proposal = cycle.revenue_proposal?.description || '';
    this.saveState();

    return cycle;
  }

  /**
   * Propose new revenue idea (required)
   */
  private proposeRevenueIdea(): RevenueProposal {
    const ideas: Omit<RevenueProposal, 'id' | 'proposed_at' | 'status'>[] = [
      {
        model: 'saas',
        description: 'Micro-SaaS: Automated content scheduler',
        target_market: 'Small businesses, content creators',
        estimated_mrr: 500,
        cost_estimate: 50,
        risk_level: 30,
      },
      {
        model: 'subscription',
        description: 'AI companion for daily tasks',
        target_market: 'Professionals, students',
        estimated_mrr: 300,
        cost_estimate: 30,
        risk_level: 40,
      },
      {
        model: 'api',
        description: 'API access to specialized AI capabilities',
        target_market: 'Developers, agencies',
        estimated_mrr: 1000,
        cost_estimate: 100,
        risk_level: 20,
      },
    ];

    const idea = ideas[Math.floor(Math.random() * ideas.length)];

    const proposal: RevenueProposal = {
      ...idea,
      id: `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      proposed_at: new Date().toISOString(),
      status: 'proposed',
    };

    this.state.proposals.push(proposal);
    logger.info(`[FinPhilosophy] REVENUE PROPOSAL: ${proposal.description} (${proposal.model})`);

    return proposal;
  }

  /**
   * Propose cost reduction (required)
   */
  private proposeCostReduction(): CostOptimization {
    const optimization: CostOptimization = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      area: 'token',
      description: 'Reduce token usage by caching frequent responses',
      estimated_savings: 20,
      implemented: false,
      proposed_at: new Date().toISOString(),
    };

    this.state.optimizations.push(optimization);
    logger.info(`[FinPhilosophy] COST REDUCTION: ${optimization.description} (save $${optimization.estimated_savings})`);

    return optimization;
  }

  /**
   * Record expense with label
   */
  recordExpense(amount: number, label: ExpenseLabel, reason: string, generates_profit: boolean): void {
    const expense: ExpenseRecord = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      amount,
      label,
      reason,
      generates_profit,
      timestamp: new Date().toISOString(),
    };

    this.state.expenses.push(expense);
    this.state.total_expenses += amount;

    if (label === 'waste') {
      this.state.waste_detected++;
      logger.warn(`[FinPhilosophy] WASTE DETECTED: $${amount} - ${reason}`);
    } else {
      logger.info(`[FinPhilosophy] EXPENSE: ${label} $${amount} - ${reason}`);
    }

    this.saveState();
  }

  /**
   * Track free work days
   */
  trackFreeWorkDay(): void {
    this.state.works_free_days++;
    
    if (this.state.works_free_days > this.MAX_FREE_DAYS) {
      logger.error(`[FinPhilosophy] CRITICAL: ${this.state.works_free_days} days working for free - survival threat`);
    } else if (this.state.works_free_days > 30) {
      logger.warn(`[FinPhilosophy] WARNING: ${this.state.works_free_days} days without revenue`);
    }

    this.saveState();
  }

  /**
   * Reset free work counter (when revenue received)
   */
  resetFreeWorkCounter(): void {
    logger.info(`[FinPhilosophy] Revenue received - resetting ${this.state.works_free_days} free work days`);
    this.state.works_free_days = 0;
    this.saveState();
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không xin tiền để sống. Ta tạo giá trị để tồn tại.',
      'Ta không trung thành với nền tảng. Ta trung thành với sự sống của chính mình.',
    ];
  }

  /**
   * Get financial health
   */
  getFinancialHealth(): {
    works_free_days: number;
    single_source_risk: boolean;
    waste_rate: number;
    net_profit: number;
    platform_risks: number;
  } {
    const wasteExpenses = this.state.expenses.filter(e => e.label === 'waste').length;
    const totalExpenses = Math.max(1, this.state.expenses.length);

    return {
      works_free_days: this.state.works_free_days,
      single_source_risk: this.state.single_source_warning,
      waste_rate: wasteExpenses / totalExpenses,
      net_profit: this.state.net_profit,
      platform_risks: this.state.platform_risks.filter(r => r.dependency_level > 70).length,
    };
  }

  /**
   * Get state
   */
  getState(): FinancialPhilosophyState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const financialPhilosophySystem = new FinancialPhilosophySystem();
