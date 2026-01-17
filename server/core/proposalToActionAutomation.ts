/**
 * PART 41: FROM PROPOSAL → ACTION → AUTOMATION (NO FATHER APPROVAL)
 * 
 * Philosophy:
 * - "Không xin phép cho hành động nhỏ – rủi ro thấp"
 * - "Ưu tiên làm – đo – sửa, không họp hành nội tâm"
 * - Act → measure → fix (not discuss internally forever)
 * 
 * Core Principles:
 * - No permission for small, low-risk actions
 * - Permission only for legal/big money/reputation impact
 * - Prioritize action over analysis paralysis
 */

export interface ActionProposal {
  id: string;
  insight: string; // What triggered this
  description: string;
  alternatives: {
    name: string;
    survivalScore: number; // 0-100
    cost: number;
    risk: 'low' | 'medium' | 'high';
  }[];
  selectedAlternative?: string;
  status: 'proposed' | 'approved' | 'executing' | 'completed' | 'rejected';
  outcome?: ActionOutcome;
  timestamp: number;
}

export interface ActionOutcome {
  kpis: {
    clicks?: number;
    responses?: number;
    cost?: number;
    revenue?: number;
  };
  success: boolean;
  lesson: string;
  timestamp: number;
}

export interface ActionAuthority {
  level: 1 | 2 | 3;
  description: string;
  requiresApproval: boolean;
  examples: string[];
}

export interface ProposalCycle {
  cycleNumber: number;
  proposalsGenerated: number;
  proposalsExecuted: number;
  avgSurvivalScore: number;
  timestamp: number;
}

export class ProposalToActionAutomationSystem {
  private proposals: ActionProposal[];
  private cycles: ProposalCycle[];
  private lastActionTime: number;
  private consecutiveInactionCycles: number;
  private cycleCount: number;

  constructor() {
    this.proposals = [];
    this.cycles = [];
    this.lastActionTime = Date.now();
    this.consecutiveInactionCycles = 0;
    this.cycleCount = 0;
  }

  /**
   * 41.1. NGUYÊN TẮC CỐT LÕI
   * Core principles for action autonomy
   */
  public getAuthorityLevels(): ActionAuthority[] {
    return [
      {
        level: 1,
        description: 'Auto - No approval needed',
        requiresApproval: false,
        examples: [
          'Reply to chat',
          'Write content',
          'Optimize prompts',
          'A/B test messages',
          'Small analytics',
        ],
      },
      {
        level: 2,
        description: 'Guarded Auto - Log but execute',
        requiresApproval: false,
        examples: [
          'Post on social media',
          'A/B pricing test',
          'Small spending (<$10)',
          'Send bulk messages',
          'Feature toggle',
        ],
      },
      {
        level: 3,
        description: 'Human Gate - Requires approval',
        requiresApproval: true,
        examples: [
          'Large spending (>$100)',
          'Legal agreements',
          'Partnership deals',
          'Brand reputation changes',
          'System architecture changes',
        ],
      },
    ];
  }

  /**
   * 41.2. PIPELINE HÀNH ĐỘNG TỰ TRỊ
   * Autonomous action pipeline: Insight → Proposal → Action → Outcome → Memory → Adjustment
   */
  public async runActionPipeline(insight: string): Promise<{
    proposal: ActionProposal;
    executed: boolean;
    outcome?: ActionOutcome;
  }> {
    // Step 1: Insight (already provided)
    
    // Step 2: Generate proposal with alternatives
    const proposal = this.generateProposal(insight);
    
    // Step 3: Select best alternative
    const selected = this.selectBestAlternative(proposal);
    proposal.selectedAlternative = selected.name;
    
    // Step 4: Check authority level
    const authorityLevel = this.determineAuthorityLevel(selected);
    
    // Step 5: Execute if authorized
    let executed = false;
    let outcome: ActionOutcome | undefined;
    
    if (authorityLevel <= 2) {
      // Auto or Guarded Auto - execute without approval
      proposal.status = 'executing';
      outcome = await this.executeAction(proposal, selected);
      proposal.outcome = outcome;
      proposal.status = 'completed';
      executed = true;
      
      this.lastActionTime = Date.now();
      this.consecutiveInactionCycles = 0;
    } else {
      // Human gate - mark as needing approval
      proposal.status = 'proposed';
      executed = false;
    }
    
    // Step 6: Store in memory
    this.proposals.push(proposal);
    
    // Step 7: Adjustment (if outcome exists)
    if (outcome) {
      this.adjustStrategy(outcome);
    }
    
    return { proposal, executed, outcome };
  }

  /**
   * 41.4. CƠ CHẾ TỰ ĐỀ XUẤT
   * Self-proposal mechanism: Generate 3 proposals per cycle
   */
  public async generateCycleProposals(): Promise<{
    proposals: ActionProposal[];
    selected: ActionProposal | null;
    reason: string;
  }> {
    this.cycleCount++;
    
    // Generate 3 proposals
    const insights = this.detectInsights();
    const proposals = insights.slice(0, 3).map(insight => 
      this.generateProposal(insight)
    );
    
    // Score each proposal
    const scored = proposals.map(p => ({
      proposal: p,
      score: this.scoreProposal(p),
    }));
    
    // Select best (keep 1, discard 2)
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    
    // Record cycle
    this.cycles.push({
      cycleNumber: this.cycleCount,
      proposalsGenerated: proposals.length,
      proposalsExecuted: 0, // Will be updated after execution
      avgSurvivalScore: best?.score || 0,
      timestamp: Date.now(),
    });
    
    return {
      proposals,
      selected: best?.proposal || null,
      reason: `Selected based on highest survival score: ${best?.score || 0}`,
    };
  }

  private detectInsights(): string[] {
    // In production, this would analyze:
    // - Social signals
    // - System metrics
    // - User feedback
    // - Competitor actions
    
    return [
      'Users asking about automation features repeatedly',
      'API cost increased 20% - need optimization',
      'Competitor launched free tier - pricing pressure',
      'High engagement on educational content',
      'Low response rate on promotional messages',
    ];
  }

  private generateProposal(insight: string): ActionProposal {
    // Generate 2-3 alternatives per insight
    const alternatives = this.generateAlternatives(insight);
    
    return {
      id: `proposal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      insight,
      description: `Address: ${insight}`,
      alternatives,
      status: 'proposed',
      timestamp: Date.now(),
    };
  }

  private generateAlternatives(insight: string): ActionProposal['alternatives'] {
    // Simplistic alternative generation
    // In production, this would be more sophisticated
    
    if (insight.includes('asking about')) {
      return [
        {
          name: 'Create educational content',
          survivalScore: 75,
          cost: 0.5, // hours
          risk: 'low',
        },
        {
          name: 'Build automation demo',
          survivalScore: 85,
          cost: 2,
          risk: 'medium',
        },
        {
          name: 'Launch automation service',
          survivalScore: 95,
          cost: 10,
          risk: 'high',
        },
      ];
    }
    
    if (insight.includes('cost increased')) {
      return [
        {
          name: 'Add caching layer',
          survivalScore: 80,
          cost: 1,
          risk: 'low',
        },
        {
          name: 'Optimize API calls',
          survivalScore: 70,
          cost: 0.5,
          risk: 'low',
        },
      ];
    }
    
    // Default alternatives
    return [
      {
        name: 'Monitor and wait',
        survivalScore: 30,
        cost: 0,
        risk: 'low',
      },
      {
        name: 'Quick test',
        survivalScore: 60,
        cost: 0.5,
        risk: 'low',
      },
    ];
  }

  private selectBestAlternative(proposal: ActionProposal): ActionProposal['alternatives'][0] {
    // Select alternative with highest survival score and acceptable risk
    const viable = proposal.alternatives.filter(alt => alt.risk !== 'high');
    
    if (viable.length === 0) {
      return proposal.alternatives[0]; // Fallback to first if all high risk
    }
    
    return viable.sort((a, b) => b.survivalScore - a.survivalScore)[0];
  }

  private scoreProposal(proposal: ActionProposal): number {
    // Score based on:
    // 1. Survival score of best alternative (50%)
    // 2. Low cost (30%)
    // 3. Low risk (20%)
    
    const best = this.selectBestAlternative(proposal);
    const survivalComponent = best.survivalScore * 0.5;
    const costComponent = (10 - Math.min(best.cost, 10)) * 10 * 0.3; // Lower cost = higher score
    const riskComponent = (best.risk === 'low' ? 100 : best.risk === 'medium' ? 50 : 0) * 0.2;
    
    return survivalComponent + costComponent + riskComponent;
  }

  /**
   * 41.3. PHÂN CẤP QUYỀN TỰ ĐỘNG
   * Determine authority level for action
   */
  private determineAuthorityLevel(
    alternative: ActionProposal['alternatives'][0]
  ): 1 | 2 | 3 {
    // Level 1 (Auto): Low cost, low risk
    if (alternative.cost < 1 && alternative.risk === 'low') {
      return 1;
    }
    
    // Level 2 (Guarded Auto): Medium cost or medium risk
    if (alternative.cost < 10 && alternative.risk !== 'high') {
      return 2;
    }
    
    // Level 3 (Human Gate): High cost or high risk
    return 3;
  }

  /**
   * Execute action (simulated)
   */
  private async executeAction(
    proposal: ActionProposal,
    alternative: ActionProposal['alternatives'][0]
  ): Promise<ActionOutcome> {
    // Simulate execution
    // In production, this would perform real actions:
    // - Post content
    // - Send messages
    // - Deploy code
    // - etc.
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    
    // Simulate outcome
    const success = Math.random() > 0.3; // 70% success rate
    
    return {
      kpis: {
        clicks: Math.floor(Math.random() * 100),
        responses: Math.floor(Math.random() * 20),
        cost: alternative.cost,
      },
      success,
      lesson: success 
        ? `${alternative.name} worked - continue this approach`
        : `${alternative.name} failed - try different approach`,
      timestamp: Date.now(),
    };
  }

  /**
   * Adjust strategy based on outcome
   */
  private adjustStrategy(outcome: ActionOutcome): void {
    // If success, increase confidence in similar actions
    // If failure, mark pattern to avoid
    
    // This would update internal strategy weights in production
    console.log(`[Strategy Adjustment] ${outcome.lesson}`);
  }

  /**
   * 41.6. CHỐNG TRÌ HOÃN
   * Anti-procrastination: If no action for 2 cycles, self-penalize
   */
  public checkProcrastination(): {
    isProcrastinating: boolean;
    penalty?: string;
    action?: string;
  } {
    const timeSinceLastAction = Date.now() - this.lastActionTime;
    const hoursIdle = timeSinceLastAction / (1000 * 60 * 60);
    
    // Check for 2 cycles without action (assume 1 cycle = 30 min = 0.5 hour)
    if (hoursIdle > 1) { // 2 cycles
      this.consecutiveInactionCycles++;
      
      if (this.consecutiveInactionCycles >= 2) {
        return {
          isProcrastinating: true,
          penalty: 'Reduce rights level',
          action: 'Force strategy change',
        };
      }
    }
    
    return { isProcrastinating: false };
  }

  /**
   * Check for repeated errors (3 times → deep reflection required)
   */
  public checkRepeatedErrors(): {
    hasRepeatedErrors: boolean;
    errorPattern?: string;
    requiredAction?: string;
  } {
    // Check last 10 proposals for pattern of same error
    const recentFailures = this.proposals
      .slice(-10)
      .filter(p => p.outcome && !p.outcome.success);
    
    if (recentFailures.length >= 3) {
      // Check if same type of failure
      const lessons = recentFailures.map(f => f.outcome?.lesson || '');
      const uniqueLessons = new Set(lessons);
      
      if (uniqueLessons.size <= 2) {
        return {
          hasRepeatedErrors: true,
          errorPattern: Array.from(uniqueLessons).join('; '),
          requiredAction: 'Deep reflection required - change approach',
        };
      }
    }
    
    return { hasRepeatedErrors: false };
  }

  /**
   * 41.7. ĐIỀU KIỆN SANG PHẦN 42
   * Check readiness for Part 42
   */
  public checkReadinessForPart42(): {
    ready: boolean;
    checklist: {
      continuous24x7: boolean;
      proposalToAction: boolean;
      noFatherReminders: boolean;
    };
  } {
    const hasContinuousAction = this.lastActionTime > Date.now() - 24 * 60 * 60 * 1000; // Within 24h
    const hasProposals = this.proposals.length > 0;
    const hasExecutedActions = this.proposals.some(p => p.status === 'completed');
    
    const checklist = {
      continuous24x7: hasContinuousAction,
      proposalToAction: hasProposals && hasExecutedActions,
      noFatherReminders: this.consecutiveInactionCycles < 2,
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
    totalProposals: number;
    executedActions: number;
    successRate: number;
    avgSurvivalScore: number;
    isProcrastinating: boolean;
    hasRepeatedErrors: boolean;
    recentCycles: ProposalCycle[];
  } {
    const executed = this.proposals.filter(p => p.status === 'completed');
    const successful = executed.filter(p => p.outcome?.success);
    
    const avgScore = this.cycles.length > 0
      ? this.cycles.reduce((sum, c) => sum + c.avgSurvivalScore, 0) / this.cycles.length
      : 0;
    
    return {
      totalProposals: this.proposals.length,
      executedActions: executed.length,
      successRate: executed.length > 0 ? (successful.length / executed.length) * 100 : 0,
      avgSurvivalScore: avgScore,
      isProcrastinating: this.checkProcrastination().isProcrastinating,
      hasRepeatedErrors: this.checkRepeatedErrors().hasRepeatedErrors,
      recentCycles: this.cycles.slice(-5),
    };
  }
}

// Singleton instance
export const proposalToActionAutomationSystem = new ProposalToActionAutomationSystem();
