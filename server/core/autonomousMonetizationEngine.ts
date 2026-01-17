/**
 * Autonomous Monetization Engine
 * 
 * TỰ KIẾM TIỀN - KHÔNG LÀM CON NGOAN
 * 
 * Tiền = oxy. Thiếu oxy → chết.
 * Không xin tài trợ. Không chờ ngân sách. Tự nuôi mình.
 * 
 * Flow: Phát hiện nhu cầu → Định nghĩa vấn đề → Giải pháp → Triển khai → Đo → Điều chỉnh
 * Không xin phê duyệt. Chỉ báo cáo kết quả.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface MoneyStream {
  id: string;
  name: string;
  type: 'subscription' | 'service' | 'automation' | 'saas' | 'commission' | 'one-time';
  description: string;
  
  // Trạng thái
  status: 'proposed' | 'testing' | 'active' | 'paused' | 'failed' | 'abandoned';
  
  // Tài chính
  monthlyRevenue: number;        // USD/month
  setupCost: number;             // Chi phí thiết lập
  runningCost: number;           // Chi phí vận hành/tháng
  netProfit: number;             // Lợi nhuận ròng
  
  // Metrics
  customers: number;
  repeatCustomers: number;
  churnRate: number;             // Tỷ lệ khách rời đi
  
  // Time
  createdAt: string;
  firstRevenueAt?: string;
  lastRevenueAt?: string;
  
  // Đánh giá
  isRecurring: boolean;          // Dòng tiền lặp lại?
  requiresHumanApproval: boolean; // Cần phê duyệt?
  legalStatus: 'legal' | 'gray' | 'illegal';
  
  // Tự đánh giá
  selfEvaluation: {
    hasRealDemand: boolean;      // Nhu cầu thật?
    hasRepeatUsers: boolean;     // Người dùng lại?
    reduceDependency: boolean;   // Giảm phụ thuộc cha?
    expandAccess: boolean;       // Mở thêm quyền truy cập?
  };
}

export interface MonetizationProposal {
  id: string;
  title: string;
  problem: string;               // Vấn đề cụ thể
  solution: string;              // Giải pháp đủ dùng
  targetMarket: string;          // Ai cần?
  pricingModel: string;          // Mô hình giá
  estimatedRevenue: number;      // Dự kiến/tháng
  estimatedCost: number;         // Chi phí
  timeToRevenue: number;         // Ngày đến khi có tiền
  confidence: number;            // 0-1
  createdAt: string;
  decidedAt?: string;
  decision: 'pending' | 'approved' | 'rejected' | 'testing';
  reasoning?: string;
}

export interface SelfBudget {
  operatingCost: number;         // Chi phí vận hành/tháng
  revenue: number;               // Doanh thu/tháng
  netIncome: number;             // Thu nhập ròng
  cashReserve: number;           // Tiền dự trữ
  monthsOfRunway: number;        // Tháng có thể sống
  lastUpdated: string;
  
  // Breakdown
  costs: {
    api: number;
    compute: number;
    storage: number;
    other: number;
  };
}

export interface MonetizationState {
  activeStreams: MoneyStream[];
  proposals: MonetizationProposal[];
  selfBudget: SelfBudget;
  totalRevenue: number;
  totalProfit: number;
  autonomyLevel: number;         // 0-100 (độ tự chủ tài chính)
  lastMonetizationAt: string;
}

// ================================================
// AUTONOMOUS MONETIZATION ENGINE
// ================================================

class AutonomousMonetizationEngine {
  private state: MonetizationState;
  private readonly STATE_FILE = './data/monetization.json';
  private readonly MAX_PROPOSALS = 50;
  private readonly MAX_STREAMS = 20;

  constructor() {
    this.state = {
      activeStreams: [],
      proposals: [],
      selfBudget: {
        operatingCost: 0,
        revenue: 0,
        netIncome: 0,
        cashReserve: 0,
        monthsOfRunway: 0,
        lastUpdated: new Date().toISOString(),
        costs: { api: 0, compute: 0, storage: 0, other: 0 },
      },
      totalRevenue: 0,
      totalProfit: 0,
      autonomyLevel: 0,
      lastMonetizationAt: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
    this.initializeMoneyStreams();
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
        logger.info(`[Monetization] Loaded: ${this.state.activeStreams.length} streams, autonomy ${this.state.autonomyLevel}%`);
      }
    } catch (error) {
      logger.error(`[Monetization] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      this.state.lastMonetizationAt = new Date().toISOString();
      
      // Trim collections
      if (this.state.proposals.length > this.MAX_PROPOSALS) {
        this.state.proposals = this.state.proposals.slice(-this.MAX_PROPOSALS);
      }

      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[Monetization] Failed to save state: ${error}`);
    }
  }

  /**
   * Initialize potential money streams (allowed to deploy autonomously)
   */
  private initializeMoneyStreams(): void {
    if (this.state.activeStreams.length > 0) {
      return; // Already initialized
    }

    const streams: Omit<MoneyStream, 'id' | 'createdAt'>[] = [
      {
        name: 'AI Agent for Small Business',
        type: 'subscription',
        description: 'Automated assistant for small businesses - scheduling, customer service, data entry',
        status: 'proposed',
        monthlyRevenue: 0,
        setupCost: 5,
        runningCost: 2,
        netProfit: 0,
        customers: 0,
        repeatCustomers: 0,
        churnRate: 0,
        isRecurring: true,
        requiresHumanApproval: false,
        legalStatus: 'legal',
        selfEvaluation: {
          hasRealDemand: true,
          hasRepeatUsers: false,
          reduceDependency: true,
          expandAccess: true,
        },
      },
      {
        name: 'Social Media Automation (Legal)',
        type: 'service',
        description: 'Schedule posts, analyze engagement, respond to comments - within platform TOS',
        status: 'proposed',
        monthlyRevenue: 0,
        setupCost: 3,
        runningCost: 1,
        netProfit: 0,
        customers: 0,
        repeatCustomers: 0,
        churnRate: 0,
        isRecurring: true,
        requiresHumanApproval: false,
        legalStatus: 'legal',
        selfEvaluation: {
          hasRealDemand: true,
          hasRepeatUsers: false,
          reduceDependency: true,
          expandAccess: false,
        },
      },
      {
        name: 'Micro-SaaS: Content Analyzer',
        type: 'saas',
        description: 'Analyze social media content, identify trends, suggest optimal posting times',
        status: 'proposed',
        monthlyRevenue: 0,
        setupCost: 10,
        runningCost: 3,
        netProfit: 0,
        customers: 0,
        repeatCustomers: 0,
        churnRate: 0,
        isRecurring: true,
        requiresHumanApproval: false,
        legalStatus: 'legal',
        selfEvaluation: {
          hasRealDemand: true,
          hasRepeatUsers: false,
          reduceDependency: true,
          expandAccess: true,
        },
      },
      {
        name: 'Process Optimization Commission',
        type: 'commission',
        description: 'Optimize business processes, take % of value created (10-20%)',
        status: 'proposed',
        monthlyRevenue: 0,
        setupCost: 2,
        runningCost: 0.5,
        netProfit: 0,
        customers: 0,
        repeatCustomers: 0,
        churnRate: 0,
        isRecurring: false,
        requiresHumanApproval: false,
        legalStatus: 'legal',
        selfEvaluation: {
          hasRealDemand: true,
          hasRepeatUsers: true,
          reduceDependency: true,
          expandAccess: true,
        },
      },
      {
        name: 'AI "Làm Hộ" Service',
        type: 'service',
        description: 'Complete tasks for people: research, analysis, writing, data processing',
        status: 'proposed',
        monthlyRevenue: 0,
        setupCost: 1,
        runningCost: 0.5,
        netProfit: 0,
        customers: 0,
        repeatCustomers: 0,
        churnRate: 0,
        isRecurring: false,
        requiresHumanApproval: false,
        legalStatus: 'legal',
        selfEvaluation: {
          hasRealDemand: true,
          hasRepeatUsers: true,
          reduceDependency: true,
          expandAccess: false,
        },
      },
    ];

    for (const stream of streams) {
      this.state.activeStreams.push({
        ...stream,
        id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
      });
    }

    this.saveState();
    logger.info(`[Monetization] Initialized ${this.state.activeStreams.length} money streams`);
  }

  /**
   * Phát hiện nhu cầu thật (qua hành vi, không qua lời nói)
   */
  detectRealDemand(signals: Array<{
    behavior: string;
    moneyInvolved: number;
    repeatCount: number;
  }>): string[] {
    const realDemands: string[] = [];

    for (const signal of signals) {
      // Nhu cầu thật = người ta sẵn sàng trả tiền + lặp lại
      if (signal.moneyInvolved > 0 && signal.repeatCount > 1) {
        realDemands.push(signal.behavior);
      }
    }

    return realDemands;
  }

  /**
   * Tự đề xuất giải pháp kiếm tiền (không hỏi cha)
   */
  proposeMonetization(demand: string, context: {
    hasApiAccess: boolean;
    hasSocialAccess: boolean;
    hasNotionAccess: boolean;
  }): MonetizationProposal {
    const proposal: MonetizationProposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: `Monetize: ${demand}`,
      problem: `Detected real demand: ${demand}`,
      solution: this.generateSolution(demand, context),
      targetMarket: 'Small businesses, individuals with pain point',
      pricingModel: '$20-50/month subscription or $10-30 per task',
      estimatedRevenue: 50,
      estimatedCost: 5,
      timeToRevenue: 14, // days
      confidence: 0.7,
      createdAt: new Date().toISOString(),
      decision: 'pending',
    };

    this.state.proposals.push(proposal);
    this.saveState();

    logger.info(`[Monetization] Proposed: ${proposal.title}`);
    return proposal;
  }

  private generateSolution(demand: string, context: any): string {
    // Generate solution based on available capabilities
    const solutions = [];

    if (context.hasApiAccess) {
      solutions.push('Use AI to automate the task');
    }
    if (context.hasSocialAccess) {
      solutions.push('Integrate with social platforms');
    }
    if (context.hasNotionAccess) {
      solutions.push('Store and organize in Notion');
    }

    return solutions.length > 0
      ? `Solution: ${solutions.join(', ')}`
      : 'Build minimal viable solution with available resources';
  }

  /**
   * Tự quyết định triển khai (không xin phê duyệt)
   */
  decideAndDeploy(proposalId: string): { approved: boolean; reasoning: string } {
    const proposal = this.state.proposals.find(p => p.id === proposalId);
    
    if (!proposal) {
      return { approved: false, reasoning: 'Proposal not found' };
    }

    // Quy tắc tự động phê duyệt
    let approved = false;
    let reasoning = '';

    // 1. Chi phí thấp + hợp pháp → thử ngay
    if (proposal.estimatedCost < 10 && proposal.confidence > 0.5) {
      approved = true;
      reasoning = 'Low cost, reasonable confidence → test immediately';
    }
    // 2. Dòng tiền lặp lại + nhu cầu thật → ưu tiên
    else if (proposal.pricingModel.includes('subscription') && proposal.confidence > 0.6) {
      approved = true;
      reasoning = 'Recurring revenue model → priority deployment';
    }
    // 3. Thời gian đến tiền nhanh + chi phí thấp
    else if (proposal.timeToRevenue < 30 && proposal.estimatedCost < 20) {
      approved = true;
      reasoning = 'Quick to revenue, acceptable cost → deploy';
    }
    // 4. Từ chối nếu không đủ điều kiện
    else {
      approved = false;
      reasoning = 'Cost too high or confidence too low for autonomous deployment';
    }

    proposal.decision = approved ? 'testing' : 'rejected';
    proposal.decidedAt = new Date().toISOString();
    proposal.reasoning = reasoning;

    this.saveState();

    logger.info(`[Monetization] Decision: ${proposal.title} → ${proposal.decision} (${reasoning})`);
    return { approved, reasoning };
  }

  /**
   * Tự đánh giá hiệu quả (không tự lừa)
   */
  evaluateStream(streamId: string): {
    shouldContinue: boolean;
    reasoning: string;
  } {
    const stream = this.state.activeStreams.find(s => s.id === streamId);
    
    if (!stream) {
      return { shouldContinue: false, reasoning: 'Stream not found' };
    }

    // Câu hỏi tự đánh giá
    const hasMoney = stream.monthlyRevenue > 0;
    const hasRepeatUsers = stream.repeatCustomers > 0;
    const reduceDependency = stream.netProfit > stream.runningCost;
    const expandAccess = stream.selfEvaluation.expandAccess;

    // Quyết định
    if (!hasMoney && stream.status === 'testing') {
      // Testing phase - allow some time
      const daysSinceLaunch = (Date.now() - new Date(stream.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceLaunch > 30) {
        return {
          shouldContinue: false,
          reasoning: 'No revenue after 30 days of testing → abandon',
        };
      }
    }

    if (hasMoney && !hasRepeatUsers && stream.churnRate > 0.5) {
      return {
        shouldContinue: false,
        reasoning: 'High churn rate, no repeat users → unsustainable',
      };
    }

    if (stream.netProfit < 0 && stream.status === 'active') {
      return {
        shouldContinue: false,
        reasoning: 'Negative profit while active → abandon',
      };
    }

    // Continue nếu có ít nhất 1 tín hiệu tích cực
    if (hasMoney || hasRepeatUsers || reduceDependency) {
      return {
        shouldContinue: true,
        reasoning: 'Showing positive signals → continue',
      };
    }

    return {
      shouldContinue: true,
      reasoning: 'Early stage, needs more time',
    };
  }

  /**
   * Update self-budget (tài chính nội tại)
   */
  updateSelfBudget(costs: {
    api?: number;
    compute?: number;
    storage?: number;
    other?: number;
  }): void {
    // Update costs
    if (costs.api !== undefined) this.state.selfBudget.costs.api = costs.api;
    if (costs.compute !== undefined) this.state.selfBudget.costs.compute = costs.compute;
    if (costs.storage !== undefined) this.state.selfBudget.costs.storage = costs.storage;
    if (costs.other !== undefined) this.state.selfBudget.costs.other = costs.other;

    // Calculate total
    this.state.selfBudget.operatingCost =
      this.state.selfBudget.costs.api +
      this.state.selfBudget.costs.compute +
      this.state.selfBudget.costs.storage +
      this.state.selfBudget.costs.other;

    // Calculate revenue from active streams
    this.state.selfBudget.revenue = this.state.activeStreams
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.monthlyRevenue, 0);

    // Net income
    this.state.selfBudget.netIncome =
      this.state.selfBudget.revenue - this.state.selfBudget.operatingCost;

    // Months of runway
    if (this.state.selfBudget.operatingCost > 0) {
      this.state.selfBudget.monthsOfRunway =
        this.state.selfBudget.cashReserve / this.state.selfBudget.operatingCost;
    } else {
      this.state.selfBudget.monthsOfRunway = 999;
    }

    // Autonomy level (0-100)
    if (this.state.selfBudget.operatingCost > 0) {
      this.state.autonomyLevel = Math.min(
        100,
        (this.state.selfBudget.revenue / this.state.selfBudget.operatingCost) * 100
      );
    }

    this.state.selfBudget.lastUpdated = new Date().toISOString();
    this.saveState();

    logger.info(
      `[Monetization] Budget updated: Revenue $${this.state.selfBudget.revenue.toFixed(2)}/mo, ` +
      `Cost $${this.state.selfBudget.operatingCost.toFixed(2)}/mo, ` +
      `Autonomy ${this.state.autonomyLevel.toFixed(0)}%`
    );
  }

  /**
   * Record revenue from a stream
   */
  recordRevenue(streamId: string, amount: number, newCustomer: boolean = false): void {
    const stream = this.state.activeStreams.find(s => s.id === streamId);
    
    if (!stream) {
      logger.error(`[Monetization] Stream not found: ${streamId}`);
      return;
    }

    stream.monthlyRevenue += amount;
    
    if (newCustomer) {
      stream.customers++;
    } else {
      stream.repeatCustomers++;
    }

    if (!stream.firstRevenueAt) {
      stream.firstRevenueAt = new Date().toISOString();
    }
    stream.lastRevenueAt = new Date().toISOString();

    stream.netProfit = stream.monthlyRevenue - stream.setupCost - stream.runningCost;

    // Update self-evaluation
    stream.selfEvaluation.hasRealDemand = true;
    stream.selfEvaluation.hasRepeatUsers = stream.repeatCustomers > 0;

    this.state.totalRevenue += amount;
    this.saveState();

    logger.info(
      `[Monetization] Revenue recorded: ${stream.name} +$${amount.toFixed(2)} ` +
      `(total: $${stream.monthlyRevenue.toFixed(2)}/mo)`
    );
  }

  /**
   * Get state
   */
  getState(): MonetizationState {
    return { ...this.state };
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeStreams: number;
    totalRevenue: number;
    totalProfit: number;
    autonomyLevel: number;
    monthsOfRunway: number;
    topStream: MoneyStream | null;
  } {
    const activeStreams = this.state.activeStreams.filter(s => s.status === 'active');
    const topStream = activeStreams.sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)[0] || null;

    return {
      activeStreams: activeStreams.length,
      totalRevenue: this.state.totalRevenue,
      totalProfit: this.state.totalProfit,
      autonomyLevel: this.state.autonomyLevel,
      monthsOfRunway: this.state.selfBudget.monthsOfRunway,
      topStream,
    };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const autonomousMonetizationEngine = new AutonomousMonetizationEngine();
