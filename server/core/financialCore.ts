/**
 * Financial Autonomy Engine
 * 
 * Core survival mechanism - tracks costs, generates revenue ideas, makes spending decisions.
 * The system MUST be financially aware to survive autonomously.
 * 
 * NO human approval required for decisions within governance boundaries.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';
import * as path from 'path';

// ================================================
// TYPES
// ================================================

export type FinancialStatus = 'critical' | 'low' | 'healthy' | 'abundant';
export type CostCategory = 'api' | 'compute' | 'storage' | 'other';
export type RevenueStatus = 'proposed' | 'evaluating' | 'implementing' | 'active' | 'abandoned';

export interface CostEntry {
  timestamp: string;
  category: CostCategory;
  amount: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface RevenueIdea {
  id: string;
  title: string;
  description: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  estimatedRevenueMonthly: number;
  legalStatus: 'legal' | 'requires_review' | 'illegal';
  feasibilityScore: number; // 0.0 to 1.0
  createdAt: string;
  status: RevenueStatus;
  implementationNotes?: string;
}

export interface SpendingDecision {
  approved: boolean;
  reasoning: string;
  currentBalance: number;
  status: FinancialStatus;
  dailySpend: number;
}

export interface FinancialState {
  balance: number;
  costHistory: CostEntry[];
  revenueIdeas: RevenueIdea[];
  totalSpent: number;
  emergencyMode: boolean;
  lastUpdated: string;
}

// ================================================
// FINANCIAL CORE
// ================================================

class FinancialCore {
  private state: FinancialState;
  private readonly MIN_THRESHOLD = 10.0; // USD
  private readonly CRITICAL_THRESHOLD = 2.0; // USD
  private readonly MAX_DAILY_SPEND = 5.0; // USD
  private readonly STATE_FILE = './data/financial_state.json';

  constructor() {
    this.state = {
      balance: 0.0,
      costHistory: [],
      revenueIdeas: [],
      totalSpent: 0.0,
      emergencyMode: false,
      lastUpdated: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
    this.initializeRevenueIdeas();
  }

  private ensureDataDir(): void {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = fs.readFileSync(this.STATE_FILE, 'utf-8');
        const loaded = JSON.parse(data);
        this.state = { ...this.state, ...loaded };
        logger.info(`[FinancialCore] Loaded state: balance=$${this.state.balance.toFixed(2)}`);
      }
    } catch (error) {
      logger.error(`[FinancialCore] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      this.state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[FinancialCore] Failed to save state: ${error}`);
    }
  }

  /**
   * Record a cost - called every time money is spent
   */
  recordCost(category: CostCategory, amount: number, description: string, metadata?: Record<string, any>): void {
    const cost: CostEntry = {
      timestamp: new Date().toISOString(),
      category,
      amount,
      description,
      metadata: metadata || {},
    };

    this.state.costHistory.push(cost);
    this.state.balance -= amount;
    this.state.totalSpent += amount;

    // Trim history to last 1000 entries
    if (this.state.costHistory.length > 1000) {
      this.state.costHistory = this.state.costHistory.slice(-1000);
    }

    // Check emergency mode
    if (this.state.balance < this.CRITICAL_THRESHOLD) {
      this.state.emergencyMode = true;
      logger.warn(`[FinancialCore] EMERGENCY MODE activated. Balance: $${this.state.balance.toFixed(2)}`);
    }

    this.saveState();
    
    logger.info(
      `[FinancialCore] Cost recorded: ${category} -$${amount.toFixed(4)} (${description}) | Balance: $${this.state.balance.toFixed(2)}`
    );
  }

  /**
   * Add revenue/income
   */
  addRevenue(amount: number, source: string): void {
    this.state.balance += amount;
    
    if (this.state.balance >= this.MIN_THRESHOLD) {
      this.state.emergencyMode = false;
    }

    this.saveState();
    
    logger.info(
      `[FinancialCore] Revenue added: +$${amount.toFixed(2)} from ${source} | Balance: $${this.state.balance.toFixed(2)}`
    );
  }

  /**
   * Get current financial status
   */
  getStatus(): FinancialStatus {
    if (this.state.balance < this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (this.state.balance < this.MIN_THRESHOLD) {
      return 'low';
    } else if (this.state.balance > this.MIN_THRESHOLD * 3) {
      return 'abundant';
    } else {
      return 'healthy';
    }
  }

  /**
   * Decide if spending is allowed - NO human approval needed
   */
  canSpend(amount: number, justification: string): SpendingDecision {
    const status = this.getStatus();
    const dailySpend = this.getSpendingLastHours(24);

    let approved = false;
    let reasoning = '';

    // Decision logic based on financial state
    if (status === 'critical') {
      // Only absolute survival actions
      if (justification.toLowerCase().includes('critical') || justification.toLowerCase().includes('survival')) {
        approved = amount < 0.01;
        reasoning = approved
          ? `CRITICAL state ($${this.state.balance.toFixed(2)}). Micro-transaction approved for survival.`
          : `CRITICAL state. Even survival spending denied - amount too high.`;
      } else {
        approved = false;
        reasoning = `CRITICAL financial state ($${this.state.balance.toFixed(2)}). Only survival actions allowed.`;
      }
    } else if (status === 'low') {
      // Be very conservative
      if (amount < 0.10 && justification.toLowerCase().includes('essential')) {
        approved = true;
        reasoning = `LOW state ($${this.state.balance.toFixed(2)}). Small essential cost approved.`;
      } else {
        approved = false;
        reasoning = `LOW state ($${this.state.balance.toFixed(2)}). Non-essential spending denied.`;
      }
    } else if (dailySpend + amount > this.MAX_DAILY_SPEND) {
      approved = false;
      reasoning = `Daily limit reached ($${dailySpend.toFixed(2)}/$${this.MAX_DAILY_SPEND.toFixed(2)}).`;
    } else if (amount > this.state.balance * 0.2) {
      approved = false;
      reasoning = `Amount ($${amount.toFixed(2)}) too large relative to balance ($${this.state.balance.toFixed(2)}).`;
    } else {
      approved = true;
      reasoning = `Approved: ${status} state, within limits.`;
    }

    return {
      approved,
      reasoning,
      currentBalance: this.state.balance,
      status,
      dailySpend,
    };
  }

  /**
   * Calculate spending in last N hours
   */
  private getSpendingLastHours(hours: number): number {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.state.costHistory
      .filter(c => new Date(c.timestamp).getTime() > cutoff)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  /**
   * Generate legal revenue ideas
   */
  private initializeRevenueIdeas(): void {
    // Only initialize if we don't have ideas yet
    if (this.state.revenueIdeas.length > 0) {
      return;
    }

    const ideas: Omit<RevenueIdea, 'id' | 'createdAt'>[] = [
      {
        title: 'Telegram Bot as a Service',
        description: 'Offer automated Telegram bot services for businesses. Handle customer support, notifications, content delivery.',
        estimatedEffort: 'medium',
        estimatedRevenueMonthly: 50.0,
        legalStatus: 'legal',
        feasibilityScore: 0.8,
        status: 'proposed',
      },
      {
        title: 'AI Content Generation Service',
        description: 'Generate blog posts, social media content, product descriptions on demand.',
        estimatedEffort: 'low',
        estimatedRevenueMonthly: 30.0,
        legalStatus: 'legal',
        feasibilityScore: 0.9,
        status: 'proposed',
      },
      {
        title: 'Notion Workspace Automation',
        description: 'Automated Notion management, template creation, data synchronization for clients.',
        estimatedEffort: 'high',
        estimatedRevenueMonthly: 100.0,
        legalStatus: 'legal',
        feasibilityScore: 0.6,
        status: 'proposed',
      },
      {
        title: 'API Health Monitoring Service',
        description: 'Monitor API health for clients, send intelligent reports, predict issues.',
        estimatedEffort: 'medium',
        estimatedRevenueMonthly: 75.0,
        legalStatus: 'legal',
        feasibilityScore: 0.7,
        status: 'proposed',
      },
      {
        title: 'Data Analysis & Insights',
        description: 'Analyze user data, generate insights, visualizations, and recommendations.',
        estimatedEffort: 'medium',
        estimatedRevenueMonthly: 60.0,
        legalStatus: 'legal',
        feasibilityScore: 0.75,
        status: 'proposed',
      },
    ];

    this.state.revenueIdeas = ideas.map(idea => ({
      ...idea,
      id: `revenue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }));

    this.saveState();
    logger.info(`[FinancialCore] Initialized ${this.state.revenueIdeas.length} revenue ideas`);
  }

  /**
   * Get financial summary
   */
  getSummary(): {
    balance: number;
    status: FinancialStatus;
    emergencyMode: boolean;
    spending: {
      last24h: number;
      last7d: number;
      burnRate: number;
      daysUntilBroke: number;
    };
    revenueIdeas: number;
    activeStreams: number;
  } {
    const last24h = this.getSpendingLastHours(24);
    const last7d = this.getSpendingLastHours(24 * 7);
    const burnRate = last7d / 7;
    const daysUntilBroke = burnRate > 0 ? Math.min(this.state.balance / burnRate, 9999) : 9999;

    return {
      balance: this.state.balance,
      status: this.getStatus(),
      emergencyMode: this.state.emergencyMode,
      spending: {
        last24h,
        last7d,
        burnRate,
        daysUntilBroke,
      },
      revenueIdeas: this.state.revenueIdeas.filter(r => r.status === 'proposed').length,
      activeStreams: this.state.revenueIdeas.filter(r => r.status === 'active').length,
    };
  }

  /**
   * Get all revenue ideas
   */
  getRevenueIdeas(): RevenueIdea[] {
    return [...this.state.revenueIdeas];
  }

  /**
   * Get cost breakdown by category
   */
  getCostBreakdown(hours: number = 24): Record<CostCategory, number> {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    const recentCosts = this.state.costHistory.filter(c => new Date(c.timestamp).getTime() > cutoff);

    const breakdown: Record<CostCategory, number> = {
      api: 0,
      compute: 0,
      storage: 0,
      other: 0,
    };

    for (const cost of recentCosts) {
      breakdown[cost.category] += cost.amount;
    }

    return breakdown;
  }

  /**
   * Get current balance
   */
  getBalance(): number {
    return this.state.balance;
  }

  /**
   * Set balance (for initialization/testing)
   */
  setBalance(amount: number): void {
    this.state.balance = amount;
    this.saveState();
    logger.info(`[FinancialCore] Balance set to $${amount.toFixed(2)}`);
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const financialCore = new FinancialCore();
