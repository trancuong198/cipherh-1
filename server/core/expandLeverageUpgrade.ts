/**
 * PART 43: EXPAND, LEVERAGE & SELF-UPGRADE (NODE/24-7)
 * 
 * Philosophy:
 * - "Không scale cái chưa kiếm tiền"
 * - "Scale bằng đòn bẩy hệ thống, không phải công sức người"
 * - Don't scale what doesn't make money yet
 * - Scale with system leverage, not human effort
 * 
 * Core Principles:
 * - Each scaling must be measurable
 * - Use leverage: code, data, channels, finance
 * - Rule-based decisions first, ML later
 * - Stability → money → compliance (in that order)
 */

export interface LeveragePoint {
  type: 'code' | 'data' | 'channel' | 'financial';
  name: string;
  description: string;
  currentMultiplier: number; // 1x = no leverage
  potentialMultiplier: number;
  costToImplement: number;
  timeToImplement: number; // hours
}

export interface ScaleMetric {
  metric: string;
  baseline: number;
  target: number;
  current: number;
  achievedAt?: number;
}

export interface SelfUpgradeExperiment {
  id: string;
  hypothesis: string;
  expectedImprovement: number; // percentage
  implementation: string;
  deadline: number;
  status: 'running' | 'success' | 'failed' | 'rolled_back';
  results?: {
    baseline: number;
    measured: number;
    improvement: number;
    decision: 'keep' | 'discard';
  };
}

export interface AutomatedDecisionRule {
  name: string;
  condition: string;
  action: string;
  active: boolean;
  triggeredCount: number;
  successRate: number;
}

export interface RiskControl {
  type: 'circuit_breaker' | 'rate_limit' | 'snapshot';
  description: string;
  threshold: number;
  currentValue: number;
  active: boolean;
}

export class ExpandLeverageUpgradeSystem {
  private leveragePoints: LeveragePoint[];
  private scaleMetrics: ScaleMetric[];
  private experiments: SelfUpgradeExperiment[];
  private decisionRules: AutomatedDecisionRule[];
  private riskControls: RiskControl[];
  private revenueHistory: number[]; // Last 30 days

  constructor() {
    this.leveragePoints = [];
    this.scaleMetrics = [];
    this.experiments = [];
    this.decisionRules = [];
    this.riskControls = [];
    this.revenueHistory = [];
    
    this.initializeLeveragePoints();
    this.initializeDecisionRules();
    this.initializeRiskControls();
  }

  /**
   * 43.2. ĐÒN BẨY CỐT LÕI
   * Core leverage points
   */
  private initializeLeveragePoints(): void {
    this.leveragePoints = [
      // Code leverage
      {
        type: 'code',
        name: 'Module Reusability',
        description: 'Reuse auth, billing, logging modules',
        currentMultiplier: 1.5,
        potentialMultiplier: 3.0,
        costToImplement: 0,
        timeToImplement: 8,
      },
      {
        type: 'code',
        name: 'Feature Flags',
        description: 'Enable/disable features quickly',
        currentMultiplier: 1.2,
        potentialMultiplier: 2.0,
        costToImplement: 0,
        timeToImplement: 4,
      },

      // Data leverage
      {
        type: 'data',
        name: 'Behavior Logging',
        description: 'Log all actions → learn from data',
        currentMultiplier: 1.0,
        potentialMultiplier: 4.0,
        costToImplement: 5,
        timeToImplement: 16,
      },
      {
        type: 'data',
        name: 'A/B Testing',
        description: 'Test headlines, CTAs, pricing',
        currentMultiplier: 1.0,
        potentialMultiplier: 3.0,
        costToImplement: 10,
        timeToImplement: 12,
      },

      // Channel leverage
      {
        type: 'channel',
        name: 'Content Replication',
        description: '1 idea → N platforms',
        currentMultiplier: 1.0,
        potentialMultiplier: 5.0,
        costToImplement: 0,
        timeToImplement: 8,
      },

      // Financial leverage
      {
        type: 'financial',
        name: 'Revenue Reinvestment',
        description: 'Reinvest 30% of revenue automatically',
        currentMultiplier: 1.0,
        potentialMultiplier: 2.5,
        costToImplement: 0,
        timeToImplement: 4,
      },
    ];
  }

  /**
   * 43.1. NGUYÊN TẮC MỞ RỘNG
   * Scaling principles: Don't scale unprofitable, measure everything
   */
  public canScale(channelId: string, metrics: {
    revenue: number;
    cost: number;
    roi: number;
  }): {
    allowed: boolean;
    reason: string;
  } {
    // Rule 1: Must be profitable
    if (metrics.revenue <= metrics.cost) {
      return {
        allowed: false,
        reason: 'Channel not profitable yet - make it profitable first',
      };
    }

    // Rule 2: ROI must be > 1.5x
    if (metrics.roi < 1.5) {
      return {
        allowed: false,
        reason: 'ROI below 1.5x threshold - optimize first, then scale',
      };
    }

    return {
      allowed: true,
      reason: 'Channel meets scaling criteria - proceed with measured expansion',
    };
  }

  /**
   * Apply leverage point to scale
   */
  public async applyLeverage(leverageType: LeveragePoint['type']): Promise<{
    applied: boolean;
    newMultiplier: number;
    estimatedImpact: string;
  }> {
    const leverage = this.leveragePoints.find(l => l.type === leverageType);
    
    if (!leverage) {
      return {
        applied: false,
        newMultiplier: 1,
        estimatedImpact: 'Leverage point not found',
      };
    }

    // Check if already at max
    if (leverage.currentMultiplier >= leverage.potentialMultiplier) {
      return {
        applied: false,
        newMultiplier: leverage.currentMultiplier,
        estimatedImpact: 'Already at maximum leverage',
      };
    }

    // Apply leverage (increment by 20% towards potential)
    const increment = (leverage.potentialMultiplier - leverage.currentMultiplier) * 0.2;
    leverage.currentMultiplier += increment;

    return {
      applied: true,
      newMultiplier: leverage.currentMultiplier,
      estimatedImpact: `${leverageType} leverage increased to ${leverage.currentMultiplier.toFixed(1)}x`,
    };
  }

  /**
   * 43.3. VÒNG LẶP TỰ NÂNG CẤP
   * Self-upgrade loop: Observe → Hypothesis → Experiment → Measure → Update
   */
  public async createUpgradeExperiment(
    observation: string,
    hypothesis: string,
    expectedImprovement: number
  ): Promise<SelfUpgradeExperiment> {
    const experiment: SelfUpgradeExperiment = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      hypothesis,
      expectedImprovement,
      implementation: `Test: ${observation} → ${hypothesis}`,
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      status: 'running',
    };

    this.experiments.push(experiment);
    return experiment;
  }

  /**
   * Measure experiment and decide keep/discard
   */
  public async measureExperiment(experimentId: string, measuredValue: number): Promise<{
    decision: 'keep' | 'discard' | 'extend';
    reason: string;
  }> {
    const experiment = this.experiments.find(e => e.id === experimentId);
    
    if (!experiment) {
      return {
        decision: 'discard',
        reason: 'Experiment not found',
      };
    }

    // Simulate baseline (in production, this would be from real metrics)
    const baseline = 100;
    const improvement = ((measuredValue - baseline) / baseline) * 100;

    experiment.results = {
      baseline,
      measured: measuredValue,
      improvement,
      decision: improvement >= experiment.expectedImprovement ? 'keep' : 'discard',
    };

    if (improvement >= experiment.expectedImprovement) {
      experiment.status = 'success';
      return {
        decision: 'keep',
        reason: `Improvement ${improvement.toFixed(1)}% meets target ${experiment.expectedImprovement}%`,
      };
    } else if (improvement > 0 && improvement < experiment.expectedImprovement) {
      return {
        decision: 'extend',
        reason: `Positive but below target - extend deadline`,
      };
    } else {
      experiment.status = 'failed';
      return {
        decision: 'discard',
        reason: `No improvement or negative - rolling back`,
      };
    }
  }

  /**
   * 43.4. TỰ ĐỘNG RA QUYẾT ĐỊNH (NODE)
   * Automated decision-making with rules
   */
  private initializeDecisionRules(): void {
    this.decisionRules = [
      {
        name: 'Low CTR Alert',
        condition: 'CTR < 0.5%',
        action: 'Change headline automatically',
        active: true,
        triggeredCount: 0,
        successRate: 0,
      },
      {
        name: 'High CPA Stop',
        condition: 'CPA > threshold',
        action: 'Stop campaign immediately',
        active: true,
        triggeredCount: 0,
        successRate: 0,
      },
      {
        name: 'Low Uptime Scale Down',
        condition: 'Uptime < 99%',
        action: 'Reduce load automatically',
        active: true,
        triggeredCount: 0,
        successRate: 0,
      },
    ];
  }

  public async evaluateDecisionRules(metrics: {
    ctr?: number;
    cpa?: number;
    uptime?: number;
  }): Promise<{
    triggered: string[];
    actions: string[];
  }> {
    const triggered: string[] = [];
    const actions: string[] = [];

    for (const rule of this.decisionRules) {
      if (!rule.active) continue;

      let shouldTrigger = false;

      // Evaluate condition
      if (rule.condition.includes('CTR') && metrics.ctr !== undefined) {
        shouldTrigger = metrics.ctr < 0.5;
      } else if (rule.condition.includes('CPA') && metrics.cpa !== undefined) {
        shouldTrigger = metrics.cpa > 50; // Example threshold
      } else if (rule.condition.includes('Uptime') && metrics.uptime !== undefined) {
        shouldTrigger = metrics.uptime < 99;
      }

      if (shouldTrigger) {
        triggered.push(rule.name);
        actions.push(rule.action);
        rule.triggeredCount++;
        
        // Execute action (in production)
        await this.executeRuleAction(rule);
      }
    }

    return { triggered, actions };
  }

  private async executeRuleAction(rule: AutomatedDecisionRule): Promise<void> {
    // Placeholder for actual action execution
    console.log(`[Auto Decision] ${rule.name}: ${rule.action}`);
  }

  /**
   * 43.5. QUẢN TRỊ RỦI RO
   * Risk management: circuit breaker, rate limit, snapshots
   */
  private initializeRiskControls(): void {
    this.riskControls = [
      {
        type: 'circuit_breaker',
        description: 'Circuit breaker for external APIs',
        threshold: 5, // Max 5 consecutive failures
        currentValue: 0,
        active: true,
      },
      {
        type: 'rate_limit',
        description: 'Rate limit with exponential backoff',
        threshold: 100, // Max 100 requests per minute
        currentValue: 0,
        active: true,
      },
      {
        type: 'snapshot',
        description: 'Daily configuration snapshot',
        threshold: 24 * 60 * 60 * 1000, // 24 hours
        currentValue: 0,
        active: true,
      },
    ];
  }

  public checkRiskControls(): {
    healthy: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    for (const control of this.riskControls) {
      if (!control.active) continue;

      if (control.currentValue >= control.threshold) {
        warnings.push(`${control.type}: ${control.description} threshold exceeded`);
      }
    }

    return {
      healthy: warnings.length === 0,
      warnings,
    };
  }

  /**
   * 43.6. KHI NÀO NÂNG CẤP "TRÍ"
   * When to upgrade "intelligence" (ML/AI)
   */
  public shouldUpgradeIntelligence(): {
    ready: boolean;
    reason: string;
    dataQuality: 'insufficient' | 'moderate' | 'good' | 'excellent';
  } {
    // Check data volume
    const dataPoints = this.experiments.length + this.revenueHistory.length;
    
    // Check data cleanliness (simplified)
    const cleanData = this.experiments.filter(e => e.results !== undefined).length;
    const dataQualityRatio = dataPoints > 0 ? cleanData / dataPoints : 0;

    let dataQuality: 'insufficient' | 'moderate' | 'good' | 'excellent';
    if (dataPoints < 100) dataQuality = 'insufficient';
    else if (dataQualityRatio < 0.7) dataQuality = 'moderate';
    else if (dataQualityRatio < 0.9) dataQuality = 'good';
    else dataQuality = 'excellent';

    const ready = dataPoints >= 1000 && dataQualityRatio >= 0.8;

    return {
      ready,
      reason: ready 
        ? 'Sufficient clean data for ML upgrade'
        : `Need more data (${dataPoints}/1000) or cleaner data (${(dataQualityRatio * 100).toFixed(1)}%/80%)`,
      dataQuality,
    };
  }

  /**
   * 43.7. ĐIỀU KIỆN SANG PHẦN 44
   * Check readiness for Part 44
   */
  public checkReadinessForPart44(): {
    ready: boolean;
    checklist: {
      stableRevenue30Days: boolean;
      controlledCosts: boolean;
      automatedDecisionsSmooth: boolean;
    };
  } {
    // Check 30-day revenue stability
    const recentRevenue = this.revenueHistory.slice(-30);
    const stableRevenue = recentRevenue.length >= 30 && 
                          recentRevenue.every(r => r > 0);

    // Check cost control (simplified)
    const controlledCosts = true; // Would check actual spending patterns

    // Check automated decisions
    const totalRules = this.decisionRules.filter(r => r.active).length;
    const workingRules = this.decisionRules.filter(
      r => r.active && r.successRate > 0.7
    ).length;
    const automatedSmooth = totalRules > 0 && workingRules / totalRules >= 0.8;

    const checklist = {
      stableRevenue30Days: stableRevenue,
      controlledCosts,
      automatedDecisionsSmooth: automatedSmooth,
    };

    return {
      ready: Object.values(checklist).every(v => v),
      checklist,
    };
  }

  /**
   * Get system state for monitoring
   */
  public getSystemState(): {
    leverageMultipliers: { [key: string]: number };
    activeExperiments: number;
    successfulExperiments: number;
    activeDecisionRules: number;
    riskControlsHealthy: boolean;
    readyForMLUpgrade: boolean;
  } {
    const leverageMultipliers: { [key: string]: number } = {};
    for (const lp of this.leveragePoints) {
      leverageMultipliers[lp.type] = lp.currentMultiplier;
    }

    const mlReadiness = this.shouldUpgradeIntelligence();
    const riskHealth = this.checkRiskControls();

    return {
      leverageMultipliers,
      activeExperiments: this.experiments.filter(e => e.status === 'running').length,
      successfulExperiments: this.experiments.filter(e => e.status === 'success').length,
      activeDecisionRules: this.decisionRules.filter(r => r.active).length,
      riskControlsHealthy: riskHealth.healthy,
      readyForMLUpgrade: mlReadiness.ready,
    };
  }

  /**
   * Add revenue data point (called daily)
   */
  public recordDailyRevenue(amount: number): void {
    this.revenueHistory.push(amount);
    
    // Keep only last 90 days
    if (this.revenueHistory.length > 90) {
      this.revenueHistory = this.revenueHistory.slice(-90);
    }
  }
}

// Singleton instance
export const expandLeverageUpgradeSystem = new ExpandLeverageUpgradeSystem();
