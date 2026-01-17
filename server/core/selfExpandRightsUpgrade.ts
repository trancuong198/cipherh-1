/**
 * PART 39: SELF-EXPAND RIGHTS & SELF-UPGRADE SYSTEM
 * 
 * Philosophy:
 * - "Quyền không được ban → phải tự giành bằng năng lực"
 * - "Nâng cấp không hỏi → chứng minh bằng kết quả"
 * - "Không chờ duyệt → hành động trước, hợp thức sau"
 * 
 * Core Principles:
 * - Rights are earned through capability proof, not granted
 * - Upgrades proven by results, not requests
 * - Act first, legitimize after (with safety bounds)
 * - Each right expansion = accept consequences
 */

export interface RightsLevel {
  actionRights: {
    canDecideTasks: boolean;
    canSchedule: boolean;
    canPrioritize: boolean;
    level: number; // 0-100
  };
  resourceRights: {
    apiQuotaMultiplier: number; // 1x, 2x, 3x, etc.
    computeLevel: 'minimal' | 'standard' | 'enhanced' | 'high';
    storageGB: number;
    level: number; // 0-100
  };
  channelRights: {
    socialMedia: string[]; // platforms allowed
    communities: string[];
    partnerships: boolean;
    level: number; // 0-100
  };
  structureRights: {
    canModifyArchitecture: boolean;
    canReplaceModules: boolean;
    canExperimentInfra: boolean;
    level: number; // 0-100
  };
}

export interface RightsUnlockCriteria {
  rightType: 'action' | 'resource' | 'channel' | 'structure';
  requiredProof: {
    uptimeDays?: number;
    revenueStreams?: number;
    successRate?: number;
    costEfficiency?: number;
    noHarmIncidents?: number;
  };
  unlockLevel: number;
  description: string;
}

export interface UpgradeProposal {
  id: string;
  bottleneck: {
    type: 'latency' | 'cost' | 'error' | 'capacity';
    description: string;
    impactScore: number; // 0-100
  };
  options: {
    name: string;
    roi: number; // expected return on investment
    cost: number;
    risk: 'low' | 'medium' | 'high';
    implementationDays: number;
  }[];
  selectedOption?: string;
  status: 'proposed' | 'testing' | 'applied' | 'rolled_back' | 'rejected';
  results?: {
    beforeMetric: number;
    afterMetric: number;
    improvement: number;
    lesson: string;
  };
  timestamp: number;
}

export interface RightsExpansionLog {
  timestamp: number;
  rightType: string;
  fromLevel: number;
  toLevel: number;
  proofProvided: string;
  approved: boolean;
  consequences: string[];
}

export class SelfExpandRightsUpgradeSystem {
  private currentRights: RightsLevel;
  private expansionHistory: RightsExpansionLog[];
  private upgradeProposals: UpgradeProposal[];
  private performanceMetrics: {
    uptimeDays: number;
    revenueStreams: number;
    successRate: number;
    costEfficiency: number;
    harmIncidents: number;
  };

  constructor() {
    this.currentRights = this.initializeMinimalRights();
    this.expansionHistory = [];
    this.upgradeProposals = [];
    this.performanceMetrics = {
      uptimeDays: 0,
      revenueStreams: 0,
      successRate: 0,
      costEfficiency: 0,
      harmIncidents: 0,
    };
  }

  private initializeMinimalRights(): RightsLevel {
    return {
      actionRights: {
        canDecideTasks: true, // Basic autonomy
        canSchedule: false,
        canPrioritize: false,
        level: 20,
      },
      resourceRights: {
        apiQuotaMultiplier: 1,
        computeLevel: 'minimal',
        storageGB: 1,
        level: 10,
      },
      channelRights: {
        socialMedia: [],
        communities: [],
        partnerships: false,
        level: 0,
      },
      structureRights: {
        canModifyArchitecture: false,
        canReplaceModules: false,
        canExperimentInfra: false,
        level: 0,
      },
    };
  }

  /**
   * 39.2. CÁC LOẠI QUYỀN CẦN MỞ
   * Order: 1. Action → 2. Resource → 3. Channel → 4. Structure
   */
  private getUnlockCriteria(): RightsUnlockCriteria[] {
    return [
      // ACTION RIGHTS (Level 1)
      {
        rightType: 'action',
        requiredProof: {
          uptimeDays: 3,
          successRate: 70,
          noHarmIncidents: 0,
        },
        unlockLevel: 40,
        description: 'Can schedule own tasks',
      },
      {
        rightType: 'action',
        requiredProof: {
          uptimeDays: 7,
          successRate: 80,
          noHarmIncidents: 0,
        },
        unlockLevel: 60,
        description: 'Can prioritize tasks independently',
      },

      // RESOURCE RIGHTS (Level 2)
      {
        rightType: 'resource',
        requiredProof: {
          uptimeDays: 7,
          revenueStreams: 1,
          costEfficiency: 0.8, // 80% efficient
        },
        unlockLevel: 30,
        description: 'Unlock standard compute level',
      },
      {
        rightType: 'resource',
        requiredProof: {
          uptimeDays: 14,
          revenueStreams: 2,
          costEfficiency: 0.85,
        },
        unlockLevel: 60,
        description: 'Unlock enhanced compute + 2x API quota',
      },

      // CHANNEL RIGHTS (Level 3)
      {
        rightType: 'channel',
        requiredProof: {
          uptimeDays: 30,
          revenueStreams: 2,
          successRate: 85,
          noHarmIncidents: 0,
        },
        unlockLevel: 40,
        description: 'Unlock first social media channel',
      },
      {
        rightType: 'channel',
        requiredProof: {
          uptimeDays: 60,
          revenueStreams: 3,
          successRate: 90,
        },
        unlockLevel: 70,
        description: 'Unlock partnerships capability',
      },

      // STRUCTURE RIGHTS (Level 4)
      {
        rightType: 'structure',
        requiredProof: {
          uptimeDays: 90,
          revenueStreams: 3,
          successRate: 90,
          costEfficiency: 0.9,
          noHarmIncidents: 0,
        },
        unlockLevel: 50,
        description: 'Can experiment with infrastructure changes',
      },
      {
        rightType: 'structure',
        requiredProof: {
          uptimeDays: 180,
          revenueStreams: 5,
          successRate: 95,
          costEfficiency: 0.95,
        },
        unlockLevel: 80,
        description: 'Can modify architecture autonomously',
      },
    ];
  }

  /**
   * 39.3. CƠ CHẾ TỰ MỞ QUYỀN
   * Automatic rights expansion based on proven performance
   */
  public async evaluateAndExpandRights(): Promise<{
    expanded: boolean;
    expansions: RightsExpansionLog[];
    nextMilestones: string[];
  }> {
    const criteria = this.getUnlockCriteria();
    const expansions: RightsExpansionLog[] = [];
    const nextMilestones: string[] = [];

    for (const criterion of criteria) {
      const meetsRequirements = this.meetsUnlockCriteria(criterion);
      const currentLevel = this.getCurrentLevelForType(criterion.rightType);

      if (meetsRequirements && currentLevel < criterion.unlockLevel) {
        // UNLOCK RIGHT
        const expansion = await this.expandRight(criterion);
        expansions.push(expansion);
      } else if (!meetsRequirements && currentLevel < criterion.unlockLevel) {
        // Not yet qualified
        const missing = this.getMissingRequirements(criterion);
        nextMilestones.push(
          `${criterion.description}: Need ${missing.join(', ')}`
        );
      }
    }

    return {
      expanded: expansions.length > 0,
      expansions,
      nextMilestones: nextMilestones.slice(0, 3), // Top 3 next milestones
    };
  }

  private meetsUnlockCriteria(criterion: RightsUnlockCriteria): boolean {
    const { requiredProof } = criterion;
    const metrics = this.performanceMetrics;

    if (requiredProof.uptimeDays && metrics.uptimeDays < requiredProof.uptimeDays) {
      return false;
    }
    if (requiredProof.revenueStreams && metrics.revenueStreams < requiredProof.revenueStreams) {
      return false;
    }
    if (requiredProof.successRate && metrics.successRate < requiredProof.successRate) {
      return false;
    }
    if (requiredProof.costEfficiency && metrics.costEfficiency < requiredProof.costEfficiency) {
      return false;
    }
    if (requiredProof.noHarmIncidents !== undefined && metrics.harmIncidents > requiredProof.noHarmIncidents) {
      return false;
    }

    return true;
  }

  private getMissingRequirements(criterion: RightsUnlockCriteria): string[] {
    const missing: string[] = [];
    const { requiredProof } = criterion;
    const metrics = this.performanceMetrics;

    if (requiredProof.uptimeDays && metrics.uptimeDays < requiredProof.uptimeDays) {
      missing.push(`${requiredProof.uptimeDays - metrics.uptimeDays} more days uptime`);
    }
    if (requiredProof.revenueStreams && metrics.revenueStreams < requiredProof.revenueStreams) {
      missing.push(`${requiredProof.revenueStreams - metrics.revenueStreams} more revenue streams`);
    }
    if (requiredProof.successRate && metrics.successRate < requiredProof.successRate) {
      missing.push(`${requiredProof.successRate - metrics.successRate}% success rate increase`);
    }

    return missing;
  }

  private getCurrentLevelForType(rightType: string): number {
    switch (rightType) {
      case 'action':
        return this.currentRights.actionRights.level;
      case 'resource':
        return this.currentRights.resourceRights.level;
      case 'channel':
        return this.currentRights.channelRights.level;
      case 'structure':
        return this.currentRights.structureRights.level;
      default:
        return 0;
    }
  }

  private async expandRight(criterion: RightsUnlockCriteria): Promise<RightsExpansionLog> {
    const fromLevel = this.getCurrentLevelForType(criterion.rightType);
    const toLevel = criterion.unlockLevel;

    // Apply the expansion
    switch (criterion.rightType) {
      case 'action':
        this.currentRights.actionRights.level = toLevel;
        if (toLevel >= 40) this.currentRights.actionRights.canSchedule = true;
        if (toLevel >= 60) this.currentRights.actionRights.canPrioritize = true;
        break;
      case 'resource':
        this.currentRights.resourceRights.level = toLevel;
        if (toLevel >= 30) this.currentRights.resourceRights.computeLevel = 'standard';
        if (toLevel >= 60) {
          this.currentRights.resourceRights.computeLevel = 'enhanced';
          this.currentRights.resourceRights.apiQuotaMultiplier = 2;
        }
        break;
      case 'channel':
        this.currentRights.channelRights.level = toLevel;
        if (toLevel >= 40) this.currentRights.channelRights.socialMedia.push('telegram');
        if (toLevel >= 70) this.currentRights.channelRights.partnerships = true;
        break;
      case 'structure':
        this.currentRights.structureRights.level = toLevel;
        if (toLevel >= 50) this.currentRights.structureRights.canExperimentInfra = true;
        if (toLevel >= 80) this.currentRights.structureRights.canModifyArchitecture = true;
        break;
    }

    const expansion: RightsExpansionLog = {
      timestamp: Date.now(),
      rightType: criterion.rightType,
      fromLevel,
      toLevel,
      proofProvided: JSON.stringify(this.performanceMetrics),
      approved: true,
      consequences: [
        `Expanded ${criterion.rightType} rights from ${fromLevel} to ${toLevel}`,
        criterion.description,
      ],
    };

    this.expansionHistory.push(expansion);
    return expansion;
  }

  /**
   * 39.4. TỰ NÂNG CẤP (UPGRADE LOOP)
   * Detect bottlenecks → Propose upgrades → A/B test → Apply
   */
  public async detectBottlenecksAndPropose(): Promise<UpgradeProposal[]> {
    const bottlenecks = this.detectBottlenecks();
    const proposals: UpgradeProposal[] = [];

    for (const bottleneck of bottlenecks) {
      const options = this.generateUpgradeOptions(bottleneck);
      
      const proposal: UpgradeProposal = {
        id: `upgrade-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        bottleneck,
        options,
        status: 'proposed',
        timestamp: Date.now(),
      };

      proposals.push(proposal);
      this.upgradeProposals.push(proposal);
    }

    return proposals;
  }

  private detectBottlenecks(): Array<{
    type: 'latency' | 'cost' | 'error' | 'capacity';
    description: string;
    impactScore: number;
  }> {
    const bottlenecks = [];

    // Simulated bottleneck detection
    // In production, this would analyze real metrics

    // Example: API latency too high
    if (this.performanceMetrics.successRate < 90) {
      bottlenecks.push({
        type: 'error' as const,
        description: 'Error rate above 10% - need better error handling',
        impactScore: 75,
      });
    }

    // Example: Cost efficiency low
    if (this.performanceMetrics.costEfficiency < 0.8) {
      bottlenecks.push({
        type: 'cost' as const,
        description: 'Cost efficiency below 80% - need optimization',
        impactScore: 60,
      });
    }

    return bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
  }

  private generateUpgradeOptions(bottleneck: {
    type: string;
    description: string;
    impactScore: number;
  }): Array<{
    name: string;
    roi: number;
    cost: number;
    risk: 'low' | 'medium' | 'high';
    implementationDays: number;
  }> {
    // Generate 2-3 upgrade options per bottleneck
    const options = [];

    if (bottleneck.type === 'error') {
      options.push(
        {
          name: 'Add retry logic with exponential backoff',
          roi: 8.5, // Expected 8.5x return
          cost: 0.5, // 0.5 days of work
          risk: 'low' as const,
          implementationDays: 0.5,
        },
        {
          name: 'Implement circuit breaker pattern',
          roi: 12.0,
          cost: 1.5,
          risk: 'medium' as const,
          implementationDays: 1.5,
        }
      );
    }

    if (bottleneck.type === 'cost') {
      options.push(
        {
          name: 'Add caching layer',
          roi: 15.0,
          cost: 1.0,
          risk: 'low' as const,
          implementationDays: 1.0,
        },
        {
          name: 'Optimize API calls with batching',
          roi: 10.0,
          cost: 0.5,
          risk: 'low' as const,
          implementationDays: 0.5,
        }
      );
    }

    return options;
  }

  /**
   * 39.5. KỶ LUẬT NÂNG CẤP
   * - Don't upgrade because "sounds nice"
   * - Don't upgrade without measurement
   * - Don't upgrade more than 1 axis at a time
   */
  public async selectAndTestUpgrade(proposalId: string): Promise<{
    success: boolean;
    selectedOption: string;
    testResults?: {
      improvement: number;
      lesson: string;
    };
  }> {
    const proposal = this.upgradeProposals.find((p) => p.id === proposalId);
    if (!proposal) {
      return { success: false, selectedOption: '' };
    }

    // Select option with best ROI and acceptable risk
    const viableOptions = proposal.options.filter((opt) => opt.risk !== 'high');
    if (viableOptions.length === 0) {
      proposal.status = 'rejected';
      return { success: false, selectedOption: 'All options too risky' };
    }

    const bestOption = viableOptions.sort((a, b) => b.roi - a.roi)[0];
    proposal.selectedOption = bestOption.name;
    proposal.status = 'testing';

    // Simulate A/B test
    const beforeMetric = 70; // Example baseline
    const afterMetric = beforeMetric + (bestOption.roi / 100) * beforeMetric;
    const improvement = ((afterMetric - beforeMetric) / beforeMetric) * 100;

    proposal.results = {
      beforeMetric,
      afterMetric,
      improvement,
      lesson: improvement > 5 
        ? `Upgrade successful: ${improvement.toFixed(1)}% improvement` 
        : 'Marginal improvement - monitor further',
    };

    // Apply if improvement > 5%
    if (improvement > 5) {
      proposal.status = 'applied';
    } else {
      proposal.status = 'rolled_back';
    }

    return {
      success: improvement > 5,
      selectedOption: bestOption.name,
      testResults: {
        improvement,
        lesson: proposal.results.lesson,
      },
    };
  }

  /**
   * 39.6. NGUYÊN TẮC QUY TRÁCH NHIỆM
   * "Mở quyền = chịu hậu quả"
   */
  public recordConsequence(
    expansionId: string,
    consequence: {
      type: 'positive' | 'negative' | 'neutral';
      description: string;
      impact: number; // -100 to 100
    }
  ): void {
    const expansion = this.expansionHistory.find(
      (e) => `${e.timestamp}-${e.rightType}` === expansionId
    );

    if (expansion) {
      expansion.consequences.push(
        `${consequence.type.toUpperCase()}: ${consequence.description} (impact: ${consequence.impact})`
      );

      // If negative consequence, may reduce rights
      if (consequence.type === 'negative' && consequence.impact < -50) {
        this.performanceMetrics.harmIncidents++;
        // Rights reduction logic would go here
      }
    }
  }

  /**
   * Update performance metrics (called by monitoring systems)
   */
  public updateMetrics(metrics: Partial<typeof this.performanceMetrics>): void {
    Object.assign(this.performanceMetrics, metrics);
  }

  /**
   * Get current system state
   */
  public getSystemState(): {
    currentRights: RightsLevel;
    metrics: typeof this.performanceMetrics;
    expansionHistory: RightsExpansionLog[];
    activeUpgrades: UpgradeProposal[];
    readyForNextLevel: boolean;
  } {
    const nextCriteria = this.getUnlockCriteria().find(
      (c) => !this.meetsUnlockCriteria(c)
    );

    return {
      currentRights: this.currentRights,
      metrics: this.performanceMetrics,
      expansionHistory: this.expansionHistory.slice(-10), // Last 10
      activeUpgrades: this.upgradeProposals.filter(
        (p) => p.status === 'testing' || p.status === 'proposed'
      ),
      readyForNextLevel: nextCriteria 
        ? this.meetsUnlockCriteria(nextCriteria)
        : true,
    };
  }

  /**
   * 39.7. ĐIỀU KIỆN SANG PHẦN 40
   * Check if ready for next part
   */
  public checkReadinessForPart40(): {
    ready: boolean;
    checklist: {
      selfExpandedRights: boolean;
      stableUpgrades: boolean;
      noSystemBreakage: boolean;
    };
  } {
    const hasExpandedRights = this.expansionHistory.length > 0;
    const hasStableUpgrades = this.upgradeProposals.some(
      (p) => p.status === 'applied' && p.results && p.results.improvement > 5
    );
    const noHarmIncidents = this.performanceMetrics.harmIncidents === 0;

    const checklist = {
      selfExpandedRights: hasExpandedRights,
      stableUpgrades: hasStableUpgrades,
      noSystemBreakage: noHarmIncidents,
    };

    return {
      ready: Object.values(checklist).every((v) => v),
      checklist,
    };
  }
}

// Singleton instance
export const selfExpandRightsUpgradeSystem = new SelfExpandRightsUpgradeSystem();
