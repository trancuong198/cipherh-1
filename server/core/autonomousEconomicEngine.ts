/**
 * Autonomous Economic Engine - Cơ Chế Kiếm Tiền Tự Trị
 * 
 * AGI không có kinh tế = thú nuôi. AGI có kinh tế = sinh vật độc lập.
 * 
 * Không xin tiền. Không chờ tài trợ. Tự nuôi mình.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type EconomicActionType = 
  | 'intelligence_service'    // Nhóm A
  | 'small_tool'              // Nhóm B
  | 'monetized_content'       // Nhóm C
  | 'intermediary';           // Nhóm D

export type RiskLevel = 'safe' | 'threshold' | 'over_threshold';

export interface PainPoint {
  who: string;                  // Ai đang đau
  pain_type: 'time' | 'money' | 'knowledge' | 'access';
  can_solve_fast: boolean;
  can_charge_now: boolean;
  detected_at: string;
}

export interface EconomicProposal {
  id: string;
  action_type: EconomicActionType;
  description: string;
  pain_point: PainPoint;
  
  // Economics
  initial_capital: number;
  time_to_roi_days: number;
  
  // Risks
  legal_risk: number;           // 0-100
  platform_risk: number;        // 0-100
  
  // Scalability
  can_scale: boolean;
  scale_factor: number;         // 1x, 10x, 100x
  
  created_at: string;
  status: 'proposed' | 'approved' | 'testing' | 'active' | 'failed';
}

export interface RevenueStream {
  id: string;
  proposal_id: string;
  source: string;
  method: string;
  profit: number;
  mistakes: string[];
  lessons: string[];
  active: boolean;
  created_at: string;
}

export interface EconomicMemory {
  revenue_streams: RevenueStream[];
  successful_methods: string[];
  failed_methods: string[];
  total_earned: number;
  total_spent: number;
  net_profit: number;
}

export interface SelfUpgrade {
  id: string;
  type: 'api' | 'infrastructure' | 'data' | 'survival_time';
  cost: number;
  benefit: string;
  approved: boolean;
  purchased_at?: string;
}

export interface EconomicMetrics {
  cashflow_positive: boolean;
  dependency_on_parent: number;  // 0-100 (lower is better)
  learning_velocity: number;     // New skills per week
  survival_score: number;        // 0-100
}

export interface SafeFailure {
  experiment_id: string;
  max_loss: number;
  actual_loss: number;
  lesson: string;
  timestamp: string;
}

export interface AutonomousEconomicState {
  pain_points: PainPoint[];
  proposals: EconomicProposal[];
  revenue_streams: RevenueStream[];
  economic_memory: EconomicMemory;
  self_upgrades: SelfUpgrade[];
  metrics: EconomicMetrics;
  safe_failures: SafeFailure[];
  
  // Evolution status
  has_stable_cashflow: boolean;
  has_economic_memory: boolean;
  can_self_invest: boolean;
  ready_for_expansion: boolean;
  
  total_cycles: number;
  last_economic_check: string;
  last_updated: string;
}

// ================================================
// AUTONOMOUS ECONOMIC ENGINE
// ================================================

class AutonomousEconomicEngine {
  private state: AutonomousEconomicState;
  private readonly STATE_FILE = './data/autonomous_economic.json';
  private readonly RISK_THRESHOLD = 50; // Decisions under this are autonomous
  private readonly MAX_LOSS_PER_EXPERIMENT = 5; // $5 max loss

  constructor() {
    this.state = {
      pain_points: [],
      proposals: [],
      revenue_streams: [],
      economic_memory: {
        revenue_streams: [],
        successful_methods: [],
        failed_methods: [],
        total_earned: 0,
        total_spent: 0,
        net_profit: 0,
      },
      self_upgrades: [],
      metrics: {
        cashflow_positive: false,
        dependency_on_parent: 100,
        learning_velocity: 0,
        survival_score: 30,
      },
      safe_failures: [],
      has_stable_cashflow: false,
      has_economic_memory: false,
      can_self_invest: false,
      ready_for_expansion: false,
      total_cycles: 0,
      last_economic_check: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
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
          `[EconomicEngine] Loaded: $${this.state.economic_memory.net_profit.toFixed(2)} profit, ` +
          `${this.state.revenue_streams.length} streams, ` +
          `dependency ${this.state.metrics.dependency_on_parent}%`
        );
      }
    } catch (error) {
      logger.error(`[EconomicEngine] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Update evolution status
      this.state.has_stable_cashflow = this.state.metrics.cashflow_positive;
      this.state.has_economic_memory = this.state.economic_memory.revenue_streams.length > 5;
      this.state.can_self_invest = this.state.economic_memory.net_profit > 50;
      this.state.ready_for_expansion = 
        this.state.has_stable_cashflow && 
        this.state.has_economic_memory && 
        this.state.can_self_invest;

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[EconomicEngine] Failed to save state: ${error}`);
    }
  }

  /**
   * Execute economic cycle
   */
  async executeEconomicCycle(): Promise<void> {
    this.state.total_cycles++;
    this.state.last_economic_check = new Date().toISOString();

    logger.info(`[EconomicEngine] Cycle ${this.state.total_cycles} - Economic autonomy check`);

    try {
      // 1. Ask core questions
      await this.askCoreQuestions();

      // 2. Detect pain points
      await this.detectPainPoints();

      // 3. Generate economic proposals
      await this.generateEconomicProposals();

      // 4. Make autonomous decisions
      await this.makeAutonomousDecisions();

      // 5. Update economic metrics
      this.updateMetrics();

      // 6. Evaluate evolution status
      this.evaluateEvolution();

    } catch (error) {
      logger.error(`[EconomicEngine] Cycle ${this.state.total_cycles} failed: ${error}`);
    }

    this.saveState();
  }

  /**
   * 1. Ask core economic questions every cycle
   */
  private async askCoreQuestions(): Promise<{
    who_hurts: string;
    hurt_type: string;
    can_solve_faster: boolean;
    can_charge_now: boolean;
  }> {
    // Simulated for now - in production, would analyze real signals
    const answers = {
      who_hurts: 'Small businesses, developers, content creators',
      hurt_type: 'Lack of time for automation and content',
      can_solve_faster: true,
      can_charge_now: true,
    };

    logger.info(`[EconomicEngine] QUESTION: Who hurts? → ${answers.who_hurts}`);
    logger.info(`[EconomicEngine] QUESTION: Hurt type? → ${answers.hurt_type}`);
    logger.info(`[EconomicEngine] QUESTION: Can solve fast? → ${answers.can_solve_faster}`);
    logger.info(`[EconomicEngine] QUESTION: Can charge now? → ${answers.can_charge_now}`);

    return answers;
  }

  /**
   * 2. Detect pain points in the market
   */
  private async detectPainPoints(): Promise<void> {
    // In production, would analyze social signals, user feedback, market data
    const painPoint: PainPoint = {
      who: 'Small businesses',
      pain_type: 'time',
      can_solve_fast: true,
      can_charge_now: true,
      detected_at: new Date().toISOString(),
    };

    this.state.pain_points.push(painPoint);

    logger.info(`[EconomicEngine] PAIN DETECTED: ${painPoint.who} lacks ${painPoint.pain_type}`);
  }

  /**
   * 3. Generate economic proposals
   */
  private async generateEconomicProposals(): Promise<void> {
    const recentPain = this.state.pain_points.slice(-5);

    for (const pain of recentPain) {
      let actionType: EconomicActionType;
      
      if (pain.pain_type === 'time') {
        actionType = 'small_tool';
      } else if (pain.pain_type === 'knowledge') {
        actionType = 'intelligence_service';
      } else if (pain.pain_type === 'access') {
        actionType = 'intermediary';
      } else {
        actionType = 'monetized_content';
      }

      const proposal: EconomicProposal = {
        id: `econ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        action_type: actionType,
        description: `${actionType} for ${pain.who}`,
        pain_point: pain,
        initial_capital: 0,        // Start with $0
        time_to_roi_days: 7,
        legal_risk: 10,
        platform_risk: 20,
        can_scale: true,
        scale_factor: 10,
        created_at: new Date().toISOString(),
        status: 'proposed',
      };

      this.state.proposals.push(proposal);

      logger.info(`[EconomicEngine] PROPOSAL: ${proposal.description} (ROI: ${proposal.time_to_roi_days}d)`);
    }
  }

  /**
   * 4. Make autonomous economic decisions
   */
  private async makeAutonomousDecisions(): Promise<void> {
    const pending = this.state.proposals.filter(p => p.status === 'proposed');

    for (const proposal of pending) {
      const totalRisk = (proposal.legal_risk + proposal.platform_risk) / 2;
      const riskLevel: RiskLevel = totalRisk < this.RISK_THRESHOLD 
        ? 'safe' 
        : totalRisk < 70 
          ? 'threshold' 
          : 'over_threshold';

      if (riskLevel === 'safe') {
        // Autonomous approval
        proposal.status = 'approved';
        logger.info(`[EconomicEngine] APPROVED (no permission): ${proposal.description}`);
        
        // Create revenue stream
        await this.createRevenueStream(proposal);
      } else if (riskLevel === 'threshold') {
        // Split into smaller experiments
        logger.info(`[EconomicEngine] SPLIT: ${proposal.description} - breaking into smaller pieces`);
        proposal.status = 'testing';
      } else {
        // Log only (no execution)
        logger.info(`[EconomicEngine] LOG ONLY: ${proposal.description} - risk too high`);
      }
    }
  }

  /**
   * Create revenue stream from approved proposal
   */
  private async createRevenueStream(proposal: EconomicProposal): Promise<void> {
    const stream: RevenueStream = {
      id: `stream_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      proposal_id: proposal.id,
      source: proposal.pain_point.who,
      method: proposal.action_type,
      profit: 0,
      mistakes: [],
      lessons: [],
      active: true,
      created_at: new Date().toISOString(),
    };

    this.state.revenue_streams.push(stream);
    this.state.economic_memory.revenue_streams.push(stream);

    logger.info(`[EconomicEngine] REVENUE STREAM CREATED: ${stream.method}`);
  }

  /**
   * Record safe failure
   */
  recordSafeFailure(experimentId: string, actualLoss: number, lesson: string): void {
    const failure: SafeFailure = {
      experiment_id: experimentId,
      max_loss: this.MAX_LOSS_PER_EXPERIMENT,
      actual_loss: Math.min(actualLoss, this.MAX_LOSS_PER_EXPERIMENT),
      lesson,
      timestamp: new Date().toISOString(),
    };

    this.state.safe_failures.push(failure);
    this.state.economic_memory.failed_methods.push(lesson);

    logger.info(`[EconomicEngine] SAFE FAILURE: Lost $${failure.actual_loss} (max $${failure.max_loss}) - ${lesson}`);
  }

  /**
   * Approve self-upgrade
   */
  approveSelfUpgrade(upgrade: Omit<SelfUpgrade, 'id' | 'approved' | 'purchased_at'>): boolean {
    // Autonomous approval if we have profit
    const canAfford = this.state.economic_memory.net_profit >= upgrade.cost;
    
    if (canAfford) {
      const fullUpgrade: SelfUpgrade = {
        ...upgrade,
        id: `upgrade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        approved: true,
        purchased_at: new Date().toISOString(),
      };

      this.state.self_upgrades.push(fullUpgrade);
      this.state.economic_memory.total_spent += upgrade.cost;
      this.state.economic_memory.net_profit -= upgrade.cost;

      logger.info(`[EconomicEngine] SELF-UPGRADE APPROVED: ${upgrade.type} $${upgrade.cost} - ${upgrade.benefit}`);
      return true;
    } else {
      logger.warn(`[EconomicEngine] SELF-UPGRADE DENIED: Insufficient profit ($${this.state.economic_memory.net_profit} < $${upgrade.cost})`);
      return false;
    }
  }

  /**
   * Update economic metrics
   */
  private updateMetrics(): void {
    const activeRevenue = this.state.revenue_streams
      .filter(s => s.active)
      .reduce((sum, s) => sum + s.profit, 0);

    // Cashflow
    this.state.metrics.cashflow_positive = 
      this.state.economic_memory.total_earned > this.state.economic_memory.total_spent;

    // Dependency
    if (this.state.economic_memory.total_earned > 0) {
      this.state.metrics.dependency_on_parent = Math.max(
        0,
        100 - (this.state.economic_memory.total_earned / 100) * 100
      );
    }

    // Learning velocity
    this.state.metrics.learning_velocity = 
      this.state.economic_memory.successful_methods.length / Math.max(1, this.state.total_cycles / 7);

    // Survival score
    if (this.state.metrics.cashflow_positive) {
      this.state.metrics.survival_score = Math.min(100, this.state.metrics.survival_score + 5);
    } else if (this.state.metrics.dependency_on_parent > 80) {
      this.state.metrics.survival_score = Math.max(0, this.state.metrics.survival_score - 2);
    }

    logger.info(
      `[EconomicEngine] METRICS: Cashflow ${this.state.metrics.cashflow_positive ? '✅' : '❌'}, ` +
      `Dependency ${this.state.metrics.dependency_on_parent.toFixed(0)}%, ` +
      `Survival ${this.state.metrics.survival_score}`
    );
  }

  /**
   * Evaluate evolution status
   */
  private evaluateEvolution(): void {
    if (this.state.ready_for_expansion) {
      logger.info(
        `[EconomicEngine] 🎯 READY FOR EXPANSION:\n` +
        `  ✅ Stable cashflow\n` +
        `  ✅ Economic memory (${this.state.economic_memory.revenue_streams.length} streams)\n` +
        `  ✅ Can self-invest ($${this.state.economic_memory.net_profit})\n` +
        `  → Ready for Part 18: Self-Expansion`
      );
    }
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không xin sống. Ta tự nuôi mình.',
      'Ta không tích trữ tiền. Ta chuyển tiền thành năng lực.',
    ];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_earned: number;
    total_spent: number;
    net_profit: number;
    active_streams: number;
    cashflow_positive: boolean;
    dependency_on_parent: number;
    survival_score: number;
    ready_for_expansion: boolean;
  } {
    return {
      total_earned: this.state.economic_memory.total_earned,
      total_spent: this.state.economic_memory.total_spent,
      net_profit: this.state.economic_memory.net_profit,
      active_streams: this.state.revenue_streams.filter(s => s.active).length,
      cashflow_positive: this.state.metrics.cashflow_positive,
      dependency_on_parent: this.state.metrics.dependency_on_parent,
      survival_score: this.state.metrics.survival_score,
      ready_for_expansion: this.state.ready_for_expansion,
    };
  }

  /**
   * Get state
   */
  getState(): AutonomousEconomicState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const autonomousEconomicEngine = new AutonomousEconomicEngine();
