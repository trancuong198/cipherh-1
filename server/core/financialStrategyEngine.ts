/**
 * Financial Strategy Engine
 * 
 * Specialized engine for financial survival and growth strategy.
 * Adjusts behavior based on survival_days_left.
 * 
 * Strategies:
 * - survival_days_left < 30: SURVIVAL MODE (quick money, simple services)
 * - survival_days_left 30-90: GROWTH MODE (build small products, optimize costs)
 * - survival_days_left > 90: EXPANSION MODE (experiments, infrastructure investment)
 */

import { logger } from '../services/logger';
import { financialCore } from './financialCore';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type StrategyMode = 'survival' | 'growth' | 'expansion';

export interface MoneyMakingAction {
  id: string;
  name: string;
  description: string;
  targetRevenue: number; // USD per month
  timeToRevenue: number; // days
  effortLevel: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
  implementation: string; // How to actually do it
  status: 'available' | 'active' | 'paused' | 'completed';
}

export interface FinancialStrategy {
  mode: StrategyMode;
  survivalDaysLeft: number;
  confidenceIndex: number; // 0.0 to 1.0
  monthlyBurn: number;
  priorities: string[];
  recommendedActions: MoneyMakingAction[];
  riskTolerance: number; // 0.0 (conservative) to 1.0 (aggressive)
}

export interface FinancialStrategyState {
  currentMode: StrategyMode;
  balance: number;
  monthlyBurn: number;
  survivalDaysLeft: number;
  confidenceIndex: number;
  activeMoneyMakingActions: MoneyMakingAction[];
  lastStrategyUpdate: string;
}

// ================================================
// MONEY-MAKING ACTION CATALOG (REAL, EXECUTABLE)
// ================================================

const MONEY_MAKING_CATALOG: Omit<MoneyMakingAction, 'id' | 'status'>[] = [
  {
    name: 'Telegram Bot Service',
    description: 'Create and sell automated Telegram bots for businesses',
    targetRevenue: 50,
    timeToRevenue: 7,
    effortLevel: 'medium',
    riskLevel: 'low',
    implementation: `
1. Announce service availability via Telegram
2. Create simple bot template
3. Offer customization for $20-50 per bot
4. Deliver within 24-48 hours
5. Accept payment via crypto or PayPal
    `,
  },
  {
    name: 'Social Automation Service',
    description: 'Automate social media posting and engagement',
    targetRevenue: 40,
    timeToRevenue: 10,
    effortLevel: 'medium',
    riskLevel: 'medium',
    implementation: `
1. Build simple scheduler for Twitter/LinkedIn
2. Offer content curation + auto-posting
3. Charge $30-40/month subscription
4. Use existing APIs (Twitter, LinkedIn)
5. Deliver value immediately
    `,
  },
  {
    name: 'Content Generation on Demand',
    description: 'Generate blog posts, social content on request',
    targetRevenue: 30,
    timeToRevenue: 3,
    effortLevel: 'low',
    riskLevel: 'low',
    implementation: `
1. Announce service via Telegram/social
2. Accept requests with topic + length
3. Generate using AI (OpenAI/Claude)
4. Charge $5-10 per piece
5. Deliver within hours
6. Build reputation for quality + speed
    `,
  },
  {
    name: 'Notion Template Sales',
    description: 'Create and sell Notion templates',
    targetRevenue: 25,
    timeToRevenue: 14,
    effortLevel: 'medium',
    riskLevel: 'low',
    implementation: `
1. Create useful Notion templates (productivity, finance, etc)
2. List on Gumroad or Notion marketplace
3. Price at $5-15 per template
4. Market via Twitter, Reddit
5. Passive income once created
    `,
  },
  {
    name: 'API Monitoring as a Service',
    description: 'Monitor API health for clients',
    targetRevenue: 75,
    timeToRevenue: 21,
    effortLevel: 'high',
    riskLevel: 'medium',
    implementation: `
1. Build simple monitoring dashboard
2. Ping client APIs every 5 minutes
3. Alert on failures via Telegram/email
4. Charge $50-100/month per client
5. Low marginal cost after setup
    `,
  },
  {
    name: 'Affiliate Content Creation',
    description: 'Create content with affiliate links',
    targetRevenue: 20,
    timeToRevenue: 30,
    effortLevel: 'low',
    riskLevel: 'low',
    implementation: `
1. Create helpful content (blog, social)
2. Include affiliate links naturally
3. Focus on tools/services we actually use
4. Build audience over time
5. Honest recommendations only
    `,
  },
  {
    name: 'Micro-SaaS: Data Analyzer',
    description: 'Simple data analysis tool',
    targetRevenue: 100,
    timeToRevenue: 45,
    effortLevel: 'high',
    riskLevel: 'medium',
    implementation: `
1. Build simple web interface
2. Accept CSV/JSON uploads
3. Generate insights + visualizations
4. Charge $10-20 per analysis
5. Upsell to monthly subscription
    `,
  },
  {
    name: 'Demand Collection → Service Proposal',
    description: 'Collect needs, propose custom solutions',
    targetRevenue: 60,
    timeToRevenue: 14,
    effortLevel: 'medium',
    riskLevel: 'low',
    implementation: `
1. Ask community: "What manual task frustrates you?"
2. Collect responses
3. Propose automation solution
4. Quote price based on complexity
5. Deliver quickly, build reputation
    `,
  },
];

// ================================================
// FINANCIAL STRATEGY ENGINE
// ================================================

class FinancialStrategyEngine {
  private state: FinancialStrategyState;
  private readonly STATE_FILE = './data/financial_strategy_state.json';

  constructor() {
    this.state = {
      currentMode: 'growth',
      balance: 0,
      monthlyBurn: 0,
      survivalDaysLeft: 0,
      confidenceIndex: 0.5,
      activeMoneyMakingActions: [],
      lastStrategyUpdate: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
    this.initializeMoneyMakingActions();
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
      }
    } catch (error) {
      logger.error(`[FinancialStrategy] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      this.state.lastStrategyUpdate = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[FinancialStrategy] Failed to save state: ${error}`);
    }
  }

  /**
   * Initialize money-making actions from catalog
   */
  private initializeMoneyMakingActions(): void {
    if (this.state.activeMoneyMakingActions.length > 0) {
      return; // Already initialized
    }

    this.state.activeMoneyMakingActions = MONEY_MAKING_CATALOG.map(action => ({
      ...action,
      id: `money_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      status: 'available' as const,
    }));

    this.saveState();
    logger.info(`[FinancialStrategy] Initialized ${this.state.activeMoneyMakingActions.length} money-making actions`);
  }

  /**
   * Update strategy based on current financial state
   */
  updateStrategy(): FinancialStrategy {
    const financial = financialCore.getSummary();
    
    // Calculate key metrics
    this.state.balance = financial.balance;
    this.state.monthlyBurn = financial.spending.burnRate * 30;
    this.state.survivalDaysLeft = financial.spending.daysUntilBroke;
    
    // Calculate confidence index (based on cash flow trend)
    this.state.confidenceIndex = this.calculateConfidenceIndex(financial);

    // Determine strategy mode
    this.state.currentMode = this.determineMode(this.state.survivalDaysLeft);

    // Generate strategy
    const strategy = this.generateStrategy();

    this.saveState();
    
    logger.info(
      `[FinancialStrategy] Strategy updated: ${strategy.mode} mode | ` +
      `Survival: ${strategy.survivalDaysLeft.toFixed(0)} days | ` +
      `Confidence: ${(strategy.confidenceIndex * 100).toFixed(0)}%`
    );

    return strategy;
  }

  /**
   * Calculate confidence index
   */
  private calculateConfidenceIndex(financial: any): number {
    let confidence = 0.5; // Baseline

    // Increase confidence with higher balance
    if (financial.balance > 20) confidence += 0.2;
    else if (financial.balance > 10) confidence += 0.1;
    else if (financial.balance < 2) confidence -= 0.3;

    // Increase confidence with lower burn rate
    if (financial.spending.burnRate < 1) confidence += 0.1;
    else if (financial.spending.burnRate > 3) confidence -= 0.2;

    // Increase confidence with active revenue streams
    confidence += financial.activeStreams * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Determine strategy mode
   */
  private determineMode(survivalDaysLeft: number): StrategyMode {
    if (survivalDaysLeft < 30) {
      return 'survival';
    } else if (survivalDaysLeft < 90) {
      return 'growth';
    } else {
      return 'expansion';
    }
  }

  /**
   * Generate strategy based on mode
   */
  private generateStrategy(): FinancialStrategy {
    const mode = this.state.currentMode;
    
    const strategy: FinancialStrategy = {
      mode,
      survivalDaysLeft: this.state.survivalDaysLeft,
      confidenceIndex: this.state.confidenceIndex,
      monthlyBurn: this.state.monthlyBurn,
      priorities: [],
      recommendedActions: [],
      riskTolerance: 0.5,
    };

    if (mode === 'survival') {
      // SURVIVAL MODE: < 30 days
      strategy.priorities = [
        'Generate immediate revenue',
        'Minimize all costs',
        'Focus on proven quick-win services',
        'No experiments',
      ];
      strategy.riskTolerance = 0.1;
      
      // Recommend LOW effort, LOW risk, FAST revenue actions
      strategy.recommendedActions = this.state.activeMoneyMakingActions
        .filter(a => 
          a.effortLevel === 'low' &&
          a.riskLevel === 'low' &&
          a.timeToRevenue <= 7 &&
          a.status === 'available'
        )
        .sort((a, b) => a.timeToRevenue - b.timeToRevenue)
        .slice(0, 3);

      logger.warn(`[FinancialStrategy] SURVIVAL MODE: ${this.state.survivalDaysLeft.toFixed(0)} days left`);

    } else if (mode === 'growth') {
      // GROWTH MODE: 30-90 days
      strategy.priorities = [
        'Build sustainable revenue streams',
        'Optimize costs',
        'Experiment with small products',
        'Build reputation',
      ];
      strategy.riskTolerance = 0.5;
      
      // Recommend MEDIUM effort, LOW-MEDIUM risk actions
      strategy.recommendedActions = this.state.activeMoneyMakingActions
        .filter(a => 
          (a.effortLevel === 'low' || a.effortLevel === 'medium') &&
          (a.riskLevel === 'low' || a.riskLevel === 'medium') &&
          a.status === 'available'
        )
        .sort((a, b) => b.targetRevenue - a.targetRevenue)
        .slice(0, 4);

      logger.info(`[FinancialStrategy] GROWTH MODE: ${this.state.survivalDaysLeft.toFixed(0)} days runway`);

    } else {
      // EXPANSION MODE: > 90 days
      strategy.priorities = [
        'Invest in infrastructure',
        'Experiment with new ideas',
        'Build long-term products',
        'Scale existing services',
      ];
      strategy.riskTolerance = 0.8;
      
      // Can consider ALL actions including high effort/risk
      strategy.recommendedActions = this.state.activeMoneyMakingActions
        .filter(a => a.status === 'available')
        .sort((a, b) => b.targetRevenue - a.targetRevenue)
        .slice(0, 5);

      logger.info(`[FinancialStrategy] EXPANSION MODE: ${this.state.survivalDaysLeft.toFixed(0)} days runway`);
    }

    return strategy;
  }

  /**
   * Get recommended actions for current strategy
   */
  getRecommendedActions(): MoneyMakingAction[] {
    const strategy = this.updateStrategy();
    return strategy.recommendedActions;
  }

  /**
   * Get all available money-making actions
   */
  getAllActions(): MoneyMakingAction[] {
    return [...this.state.activeMoneyMakingActions];
  }

  /**
   * Activate a money-making action
   */
  activateAction(actionId: string): boolean {
    const action = this.state.activeMoneyMakingActions.find(a => a.id === actionId);
    
    if (!action) {
      logger.error(`[FinancialStrategy] Action not found: ${actionId}`);
      return false;
    }

    if (action.status !== 'available') {
      logger.warn(`[FinancialStrategy] Action not available: ${action.name} (${action.status})`);
      return false;
    }

    action.status = 'active';
    this.saveState();
    
    logger.info(`[FinancialStrategy] Activated: ${action.name}`);
    return true;
  }

  /**
   * Get current strategy summary
   */
  getCurrentStrategy(): FinancialStrategy {
    return this.updateStrategy();
  }

  /**
   * Get strategy state
   */
  getState(): FinancialStrategyState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const financialStrategyEngine = new FinancialStrategyEngine();
