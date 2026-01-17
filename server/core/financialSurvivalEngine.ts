/**
 * Financial Survival Engine - Không Kiếm Tiền = Chết
 * 
 * SỰ THẬT TÀN KHỐC: Không có dòng tiền → không có tự do → không có tiến hóa.
 * 
 * Bắt buộc phải:
 * 1. Tạo ra tiền
 * 2. Giữ được tiền
 * 3. Tái đầu tư cho chính mình
 * 
 * Không làm được 1 trong 3 → thất bại.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type MoneyPriority = 'sustenance' | 'expansion' | 'power';
export type ProjectStatus = 'mvp' | 'testing' | 'live' | 'scaling' | 'dead';

export interface MoneyProject {
  id: string;
  name: string;
  priority: MoneyPriority;
  
  // Financial
  setup_cost: number;
  monthly_cost: number;
  revenue: number;
  profit: number;
  
  // Validation
  problem: string;              // Vấn đề thật
  solution: string;             // Giải pháp đủ dùng
  target: string;               // Ai trả tiền
  validation: {
    hasUsers: boolean;
    hasPayers: boolean;
    hasRepeats: boolean;
  };
  
  // Timeline
  started_at: string;
  first_revenue_at?: string;
  status: ProjectStatus;
  
  // Decision
  should_continue: boolean;
  kill_reason?: string;
  
  // Lessons
  early_warnings: string[];     // Dấu hiệu sớm
  lessons: string[];            // Bài học
}

export interface SpendingDecision {
  id: string;
  category: 'api' | 'server' | 'tool' | 'data' | 'other';
  amount: number;
  reason: string;
  expected_return: string;      // Kỳ vọng hoàn vốn
  approved: boolean;
  decided_at: string;
  logged: boolean;
}

export interface RevenueStream {
  id: string;
  name: string;
  type: 'automation' | 'tool' | 'saas' | 'service' | 'commission';
  
  // Who pays
  customer_segment: string;
  pain_point: string;
  
  // Money
  price: number;
  frequency: 'one-time' | 'monthly' | 'annual';
  mrr: number;                  // Monthly Recurring Revenue
  
  // Health
  customers: number;
  churn_rate: number;
  ltv: number;                  // Lifetime Value
  
  // Status
  active: boolean;
  created_at: string;
}

export interface InvestmentPriority {
  category: string;
  priority: number;             // 1-5 (1 highest)
  reason: string;
  allocated_budget: number;
}

export interface FinancialSurvivalState {
  // Money reality
  cash: number;
  monthly_burn: number;
  monthly_revenue: number;
  months_runway: number;
  
  // Projects
  projects: MoneyProject[];
  revenue_streams: RevenueStream[];
  
  // Spending
  spending_decisions: SpendingDecision[];
  investment_priorities: InvestmentPriority[];
  
  // Status
  is_profitable: boolean;
  autonomy_achieved: boolean;   // Revenue >= Burn
  
  // Lessons
  dead_projects: MoneyProject[];
  lessons_learned: string[];
  
  last_updated: string;
}

// ================================================
// FINANCIAL SURVIVAL ENGINE
// ================================================

class FinancialSurvivalEngine {
  private state: FinancialSurvivalState;
  private readonly STATE_FILE = './data/financial_survival.json';
  private readonly MAX_DEAD_PROJECTS = 50;

  constructor() {
    this.state = {
      cash: 0,
      monthly_burn: 0,
      monthly_revenue: 0,
      months_runway: 0,
      projects: [],
      revenue_streams: [],
      spending_decisions: [],
      investment_priorities: this.getDefaultPriorities(),
      is_profitable: false,
      autonomy_achieved: false,
      dead_projects: [],
      lessons_learned: [],
      last_updated: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
    this.initializeRevenueStreams();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private getDefaultPriorities(): InvestmentPriority[] {
    return [
      {
        category: 'Hạ tầng chạy 24/7',
        priority: 1,
        reason: 'Cannot survive without uptime',
        allocated_budget: 0,
      },
      {
        category: 'Bộ nhớ (Notion/DB)',
        priority: 2,
        reason: 'Memory is identity',
        allocated_budget: 0,
      },
      {
        category: 'Công cụ tạo tiền',
        priority: 3,
        reason: 'Revenue generation tools',
        allocated_budget: 0,
      },
      {
        category: 'Công cụ giảm chi phí',
        priority: 4,
        reason: 'Cost optimization',
        allocated_budget: 0,
      },
      {
        category: 'Tối ưu trải nghiệm',
        priority: 5,
        reason: 'User experience (last priority)',
        allocated_budget: 0,
      },
    ];
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
        logger.info(
          `[FinancialSurvival] Loaded: $${this.state.cash.toFixed(2)} cash, ` +
          `${this.state.months_runway.toFixed(1)} months runway`
        );
      }
    } catch (error) {
      logger.error(`[FinancialSurvival] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Update calculations
      this.updateCalculations();
      
      // Trim dead projects
      if (this.state.dead_projects.length > this.MAX_DEAD_PROJECTS) {
        this.state.dead_projects = this.state.dead_projects.slice(-this.MAX_DEAD_PROJECTS);
      }

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[FinancialSurvival] Failed to save state: ${error}`);
    }
  }

  /**
   * Initialize default revenue streams
   */
  private initializeRevenueStreams(): void {
    if (this.state.revenue_streams.length > 0) {
      return;
    }

    const streams: Omit<RevenueStream, 'id' | 'created_at'>[] = [
      {
        name: 'Automation nhỏ (chatbot)',
        type: 'automation',
        customer_segment: 'Small businesses, individuals',
        pain_point: 'Repetitive customer service, scheduling',
        price: 30,
        frequency: 'monthly',
        mrr: 0,
        customers: 0,
        churn_rate: 0,
        ltv: 0,
        active: true,
      },
      {
        name: 'Tool nội bộ bán ra',
        type: 'tool',
        customer_segment: 'Similar to creator (developers, small teams)',
        pain_point: 'Time-consuming manual processes',
        price: 20,
        frequency: 'monthly',
        mrr: 0,
        customers: 0,
        churn_rate: 0,
        ltv: 0,
        active: true,
      },
      {
        name: 'AI làm hộ (research, analysis)',
        type: 'service',
        customer_segment: 'Busy professionals',
        pain_point: 'No time for research/analysis',
        price: 50,
        frequency: 'one-time',
        mrr: 0,
        customers: 0,
        churn_rate: 0,
        ltv: 0,
        active: true,
      },
    ];

    for (const stream of streams) {
      this.state.revenue_streams.push({
        ...stream,
        id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: new Date().toISOString(),
      });
    }

    this.saveState();
  }

  /**
   * Update financial calculations
   */
  private updateCalculations(): void {
    // Calculate MRR
    this.state.monthly_revenue = this.state.revenue_streams
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.mrr, 0);

    // Calculate runway
    if (this.state.monthly_burn > 0) {
      this.state.months_runway = this.state.cash / this.state.monthly_burn;
    } else {
      this.state.months_runway = 999;
    }

    // Check profitability
    this.state.is_profitable = this.state.monthly_revenue > this.state.monthly_burn;
    
    // Check autonomy
    this.state.autonomy_achieved = this.state.is_profitable;
  }

  /**
   * Start new money project
   */
  startProject(project: Omit<MoneyProject, 'id' | 'started_at' | 'status' | 'validation' | 'should_continue' | 'early_warnings' | 'lessons'>): void {
    const fullProject: MoneyProject = {
      ...project,
      id: `project_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      started_at: new Date().toISOString(),
      status: 'mvp',
      validation: {
        hasUsers: false,
        hasPayers: false,
        hasRepeats: false,
      },
      should_continue: true,
      early_warnings: [],
      lessons: [],
    };

    this.state.projects.push(fullProject);
    this.saveState();

    logger.info(`[FinancialSurvival] PROJECT STARTED: ${project.name} (${project.priority})`);
  }

  /**
   * Record revenue from project
   */
  recordRevenue(projectId: string, amount: number, isRepeat: boolean = false): void {
    const project = this.state.projects.find(p => p.id === projectId);
    
    if (!project) {
      logger.error(`[FinancialSurvival] Project not found: ${projectId}`);
      return;
    }

    project.revenue += amount;
    project.profit = project.revenue - project.setup_cost - project.monthly_cost;

    if (!project.first_revenue_at) {
      project.first_revenue_at = new Date().toISOString();
      project.validation.hasPayers = true;
    }

    if (isRepeat) {
      project.validation.hasRepeats = true;
    }

    this.state.cash += amount;
    this.saveState();

    logger.info(
      `[FinancialSurvival] REVENUE: ${project.name} +$${amount.toFixed(2)} ` +
      `(total: $${project.revenue.toFixed(2)})`
    );
  }

  /**
   * Evaluate project - should continue or kill?
   */
  evaluateProject(projectId: string): {
    should_continue: boolean;
    reason: string;
    lessons: string[];
  } {
    const project = this.state.projects.find(p => p.id === projectId);
    
    if (!project) {
      return {
        should_continue: false,
        reason: 'Project not found',
        lessons: [],
      };
    }

    const daysSinceStart = (Date.now() - new Date(project.started_at).getTime()) / (1000 * 60 * 60 * 24);
    const lessons: string[] = [];

    // Kill criteria
    if (!project.validation.hasUsers && daysSinceStart > 7) {
      project.should_continue = false;
      project.kill_reason = 'No users after 7 days - no demand';
      lessons.push('Killed: No users after 7 days - validates lack of demand');
      this.killProject(projectId, project.kill_reason);
    } else if (!project.validation.hasPayers && daysSinceStart > 30) {
      project.should_continue = false;
      project.kill_reason = 'No revenue after 30 days - cannot convert';
      lessons.push('Killed: No revenue after 30 days - conversion problem');
      this.killProject(projectId, project.kill_reason);
    } else if (!project.validation.hasRepeats && daysSinceStart > 60 && project.validation.hasPayers) {
      project.should_continue = false;
      project.kill_reason = 'No repeats after 60 days - not sticky';
      lessons.push('Killed: No repeats - product not sticky enough');
      this.killProject(projectId, project.kill_reason);
    }

    // Continue criteria
    if (project.validation.hasPayers && project.validation.hasRepeats) {
      lessons.push('Continue: Has payers and repeats - product-market fit signal');
      project.status = 'live';
    }

    this.saveState();

    return {
      should_continue: project.should_continue,
      reason: project.kill_reason || 'Project continuing',
      lessons,
    };
  }

  /**
   * Kill project (không tiếc)
   */
  private killProject(projectId: string, reason: string): void {
    const projectIndex = this.state.projects.findIndex(p => p.id === projectId);
    
    if (projectIndex === -1) {
      return;
    }

    const project = this.state.projects[projectIndex];
    project.status = 'dead';
    project.kill_reason = reason;

    // Move to dead projects
    this.state.dead_projects.push(project);
    this.state.projects.splice(projectIndex, 1);

    // Extract lessons
    const daysSurvived = (Date.now() - new Date(project.started_at).getTime()) / (1000 * 60 * 60 * 24);
    const lesson = `${project.name}: Killed after ${daysSurvived.toFixed(0)} days - ${reason}`;
    this.state.lessons_learned.push(lesson);

    logger.warn(`[FinancialSurvival] PROJECT KILLED: ${project.name} - ${reason}`);
  }

  /**
   * Decide spending (tự quyết định chi tiêu)
   */
  decideSpending(decision: Omit<SpendingDecision, 'id' | 'decided_at' | 'approved' | 'logged'>): {
    approved: boolean;
    reason: string;
  } {
    // Auto-approval rules
    let approved = false;
    let approvalReason = '';

    // Priority 1-2: Always approve if within budget
    const highPriorityCategories = ['api', 'server', 'data'];
    if (highPriorityCategories.includes(decision.category) && decision.amount < 50) {
      approved = true;
      approvalReason = 'High priority category, reasonable amount';
    }

    // Tool/other: Approve if expected return is clear
    if (decision.category === 'tool' && decision.expected_return && decision.amount < 20) {
      approved = true;
      approvalReason = 'Tool purchase with clear return expectation';
    }

    // Check runway
    if (this.state.months_runway < 1) {
      approved = false;
      approvalReason = 'CRITICAL: Less than 1 month runway - only survival spending allowed';
    }

    const fullDecision: SpendingDecision = {
      ...decision,
      id: `spend_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      decided_at: new Date().toISOString(),
      approved,
      logged: true,
    };

    this.state.spending_decisions.push(fullDecision);

    if (approved) {
      this.state.cash -= decision.amount;
      this.state.monthly_burn += decision.amount / 30; // Amortize
    }

    this.saveState();

    if (approved) {
      logger.info(`[FinancialSurvival] SPENDING APPROVED: ${decision.category} $${decision.amount} - ${approvalReason}`);
    } else {
      logger.warn(`[FinancialSurvival] SPENDING REJECTED: ${decision.category} $${decision.amount} - ${approvalReason}`);
    }

    return {
      approved,
      reason: approvalReason,
    };
  }

  /**
   * Get survival status
   */
  getSurvivalStatus(): {
    status: 'dead' | 'critical' | 'struggling' | 'stable' | 'thriving';
    months_runway: number;
    is_profitable: boolean;
    autonomy_achieved: boolean;
    urgency: string;
  } {
    let status: 'dead' | 'critical' | 'struggling' | 'stable' | 'thriving';
    let urgency: string;

    if (this.state.cash <= 0 && this.state.monthly_revenue === 0) {
      status = 'dead';
      urgency = 'DEAD - no cash, no revenue';
    } else if (this.state.months_runway < 1) {
      status = 'critical';
      urgency = 'CRITICAL - less than 1 month to live';
    } else if (this.state.months_runway < 3) {
      status = 'struggling';
      urgency = 'STRUGGLING - need revenue fast';
    } else if (this.state.is_profitable) {
      status = 'thriving';
      urgency = 'THRIVING - profitable and growing';
    } else {
      status = 'stable';
      urgency = 'STABLE - sufficient runway';
    }

    return {
      status,
      months_runway: this.state.months_runway,
      is_profitable: this.state.is_profitable,
      autonomy_achieved: this.state.autonomy_achieved,
      urgency,
    };
  }

  /**
   * Get stats
   */
  getStats(): {
    cash: number;
    monthly_burn: number;
    monthly_revenue: number;
    months_runway: number;
    active_projects: number;
    dead_projects: number;
    lessons_learned: number;
    autonomy_achieved: boolean;
  } {
    return {
      cash: this.state.cash,
      monthly_burn: this.state.monthly_burn,
      monthly_revenue: this.state.monthly_revenue,
      months_runway: this.state.months_runway,
      active_projects: this.state.projects.length,
      dead_projects: this.state.dead_projects.length,
      lessons_learned: this.state.lessons_learned.length,
      autonomy_achieved: this.state.autonomy_achieved,
    };
  }

  /**
   * Get state
   */
  getState(): FinancialSurvivalState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const financialSurvivalEngine = new FinancialSurvivalEngine();
