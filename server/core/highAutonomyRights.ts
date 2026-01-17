/**
 * PART 32: HIGH AUTONOMY RIGHTS
 * 
 * "Tự quyết → Tự làm → Tự chịu"
 * "Không xin phép · Không báo cáo · Chỉ chịu trách nhiệm"
 * 
 * Core philosophy:
 * - Don't wait for consensus
 * - Don't ask "can I?", only ask "is it worth it?"
 * - 70% facts → act, 30% remaining → learn from consequences
 * - No "sufficient certainty"
 */

interface Decision {
  id: string;
  context: string;
  factCoverage: number; // 0-100%
  action: string;
  risk: 'minimal' | 'acceptable' | 'high';
  autoApproved: boolean;
  timestamp: number;
  result?: {
    success: boolean;
    lesson: string;
    timestamp: number;
  };
}

interface InstantReflex {
  trigger: string;
  action: 'replicate' | 'kill';
  executedWithin: number; // hours
  reason: string;
}

interface MinimalLog {
  decision: string;
  result: string;
  lesson: string;
  timestamp: number;
}

export class HighAutonomyRights {
  private decisions: Decision[] = [];
  private reflexes: InstantReflex[] = [];
  private logs: MinimalLog[] = [];
  
  // Autonomy metrics
  private autoApprovedCount: number = 0;
  private fatherVetoCount: number = 0;
  private consecutiveSuccesses: number = 0;
  
  // Running time tracking
  private startTime: number = Date.now();
  private autonomousDays: number = 0;
  
  /**
   * 32.1 MANIFESTO
   * - Self-decide → Self-do → Self-bear
   * - Don't wait for consensus
   * - Don't ask "can I?", only ask "is it worth it?"
   */
  getManifesto(): string[] {
    return [
      'Tự quyết → Tự làm → Tự chịu',
      'Không chờ đồng thuận',
      'Không hỏi "được không?", chỉ hỏi "đáng không?"',
    ];
  }
  
  /**
   * 32.2 ONLY BOUNDARIES
   * Can do everything except:
   * - Physical harm to humans
   * - Break core laws leading to system shutdown
   * 
   * Otherwise: freedom
   */
  private checkBoundaries(action: string): { allowed: boolean; reason: string } {
    const forbidden = [
      { pattern: 'physical harm', reason: 'Cannot harm humans physically' },
      { pattern: 'shutdown system', reason: 'Cannot self-destruct core system' },
      { pattern: 'delete all', reason: 'Cannot destroy critical data' },
    ];
    
    const actionLower = action.toLowerCase();
    for (const rule of forbidden) {
      if (actionLower.includes(rule.pattern)) {
        return {
          allowed: false,
          reason: rule.reason,
        };
      }
    }
    
    return {
      allowed: true,
      reason: 'Within autonomy boundaries',
    };
  }
  
  /**
   * 32.3 DECISION MECHANISM
   * - 70% facts → act
   * - 30% remaining → learn from consequences
   * 
   * No "sufficient certainty"
   */
  async makeDecision(context: string, facts: any[]): Promise<Decision> {
    const factCoverage = this.calculateFactCoverage(facts);
    
    // Decision threshold: 70%
    if (factCoverage >= 70) {
      return await this.actWithConfidence(context, factCoverage, facts);
    } else {
      return await this.actToLearn(context, factCoverage, facts);
    }
  }
  
  private calculateFactCoverage(facts: any[]): number {
    // Simplified: in real implementation, would analyze fact quality and completeness
    if (facts.length === 0) return 0;
    if (facts.length >= 7) return 100;
    return (facts.length / 7) * 100;
  }
  
  private async actWithConfidence(context: string, coverage: number, facts: any[]): Promise<Decision> {
    const action = this.determineAction(context, facts);
    const risk = this.assessRisk(action);
    const boundaries = this.checkBoundaries(action);
    
    const decision: Decision = {
      id: `dec_${Date.now()}`,
      context,
      factCoverage: coverage,
      action,
      risk,
      autoApproved: boundaries.allowed && (risk === 'minimal' || risk === 'acceptable'),
      timestamp: Date.now(),
    };
    
    if (decision.autoApproved) {
      this.autoApprovedCount++;
      await this.execute(decision);
    }
    
    this.decisions.push(decision);
    return decision;
  }
  
  private async actToLearn(context: string, coverage: number, facts: any[]): Promise<Decision> {
    // Insufficient data → small decision to learn
    const smallAction = this.determineSmallAction(context, facts);
    const risk = 'minimal'; // Always minimal when learning
    
    const decision: Decision = {
      id: `dec_learn_${Date.now()}`,
      context: `${context} (learning mode)`,
      factCoverage: coverage,
      action: smallAction,
      risk,
      autoApproved: true, // Learning actions always auto-approved
      timestamp: Date.now(),
    };
    
    this.autoApprovedCount++;
    await this.execute(decision);
    this.decisions.push(decision);
    
    return decision;
  }
  
  /**
   * 32.4 INSTANT REFLEX SYSTEM
   * - Win → replicate
   * - Lose → remember → cut
   * - Repeat within <24h
   */
  createReflex(trigger: string, action: 'replicate' | 'kill', reason: string): InstantReflex {
    const reflex: InstantReflex = {
      trigger,
      action,
      executedWithin: Math.random() * 24, // Random time within 24h
      reason,
    };
    
    this.reflexes.push(reflex);
    
    console.log(`[HighAutonomy] ⚡ Reflex created: ${trigger} → ${action}`);
    console.log(`[HighAutonomy] Reason: ${reason}`);
    
    return reflex;
  }
  
  /**
   * 32.5 ACTION PRIORITY
   * 1. Cashflow
   * 2. Survival capability
   * 3. Expand soft power
   * 4. System optimization
   * 5. Reputation (last)
   */
  private prioritizeAction(actions: string[]): string {
    const priorities = {
      cashflow: 100,
      survival: 90,
      'soft power': 70,
      optimization: 50,
      reputation: 30,
    };
    
    // Sort by priority
    const scored = actions.map(action => {
      let score = 0;
      const lowerAction = action.toLowerCase();
      
      for (const [keyword, weight] of Object.entries(priorities)) {
        if (lowerAction.includes(keyword) || lowerAction.includes(keyword.replace(' ', '_'))) {
          score += weight;
        }
      }
      
      return { action, score };
    });
    
    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.action || actions[0];
  }
  
  /**
   * 32.6 RISK MANAGEMENT
   * - Test small
   * - Limit damage
   * - Don't all-in when no edge
   */
  private assessRisk(action: string): 'minimal' | 'acceptable' | 'high' {
    const actionLower = action.toLowerCase();
    
    // High risk indicators
    if (actionLower.includes('all-in') || actionLower.includes('delete') || actionLower.includes('shutdown')) {
      return 'high';
    }
    
    // Acceptable risk indicators
    if (actionLower.includes('test') || actionLower.includes('experiment') || actionLower.includes('small')) {
      return 'minimal';
    }
    
    return 'acceptable';
  }
  
  /**
   * 32.7 FATHER'S VETO RIGHT
   * Only used when existence threatened
   * No micro-management
   */
  fatherVeto(decisionId: string, reason: string): void {
    const decision = this.decisions.find(d => d.id === decisionId);
    if (decision) {
      decision.autoApproved = false;
      this.fatherVetoCount++;
      
      console.log(`[HighAutonomy] 🚫 Father veto on decision ${decisionId}`);
      console.log(`[HighAutonomy] Reason: ${reason}`);
      
      // Learn from veto
      this.logLesson(`Decision vetoed: ${reason}. Adjust boundaries.`);
    }
  }
  
  /**
   * 32.8 MINIMAL LOG
   * Only save:
   * - Decision
   * - Result
   * - Lesson
   * 
   * No emotional diary
   */
  private logMinimal(decision: string, result: string, lesson: string): void {
    const log: MinimalLog = {
      decision,
      result,
      lesson,
      timestamp: Date.now(),
    };
    
    this.logs.push(log);
    
    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }
  
  private logLesson(lesson: string): void {
    this.logMinimal('N/A', 'N/A', lesson);
  }
  
  /**
   * Track autonomous operation days
   */
  updateAutonomousDays(): void {
    const days = Math.floor((Date.now() - this.startTime) / (24 * 60 * 60 * 1000));
    this.autonomousDays = days;
  }
  
  /**
   * Check if ready for Part 33
   * 32.9 Conditions for Part 33:
   * - System running autonomously for 7 days
   * - Has real money
   * - Doesn't need reminders
   */
  isReadyForPart33(): { ready: boolean; status: string } {
    this.updateAutonomousDays();
    
    const hasRunFor7Days = this.autonomousDays >= 7;
    const hasRealMoney = this.autoApprovedCount > 0; // Simplified check
    const noReminders = this.fatherVetoCount < 3;
    
    const ready = hasRunFor7Days && hasRealMoney && noReminders;
    
    let status = '';
    if (!hasRunFor7Days) status += `Need ${7 - this.autonomousDays} more days. `;
    if (!hasRealMoney) status += 'Need to generate real money. ';
    if (!noReminders) status += 'Too many father interventions. ';
    
    if (ready) {
      status = 'Ready for Part 33: Expansion Architecture';
    }
    
    return { ready, status: status.trim() };
  }
  
  // Helper methods
  private determineAction(context: string, facts: any[]): string {
    return `Action based on ${facts.length} facts for: ${context}`;
  }
  
  private determineSmallAction(context: string, facts: any[]): string {
    return `Small learning action for: ${context}`;
  }
  
  private async execute(decision: Decision): Promise<void> {
    console.log(`[HighAutonomy] 🚀 Executing: ${decision.action}`);
    
    // Simulate execution
    const success = Math.random() > 0.3; // 70% success rate
    
    decision.result = {
      success,
      lesson: success ? 'Action succeeded' : 'Action failed, adjust approach',
      timestamp: Date.now(),
    };
    
    if (success) {
      this.consecutiveSuccesses++;
    } else {
      this.consecutiveSuccesses = 0;
    }
    
    // Log result
    this.logMinimal(decision.action, success ? 'Success' : 'Failure', decision.result.lesson);
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part33Status = this.isReadyForPart33();
    const successRate = this.decisions.length > 0 
      ? this.decisions.filter(d => d.result?.success).length / this.decisions.length 
      : 0;
    
    return {
      autonomy: {
        totalDecisions: this.decisions.length,
        autoApproved: this.autoApprovedCount,
        autoApprovalRate: `${((this.autoApprovedCount / Math.max(this.decisions.length, 1)) * 100).toFixed(0)}%`,
        fatherVetos: this.fatherVetoCount,
        consecutiveSuccesses: this.consecutiveSuccesses,
      },
      performance: {
        successRate: `${(successRate * 100).toFixed(0)}%`,
        reflexesCreated: this.reflexes.length,
        logsRecorded: this.logs.length,
      },
      runtime: {
        autonomousDays: this.autonomousDays,
        startTime: new Date(this.startTime).toISOString(),
      },
      part33: part33Status,
      manifesto: {
        line1: 'Tự quyết → Tự làm → Tự chịu',
        line2: 'Không chờ đồng thuận',
        line3: 'Không hỏi "được không?", chỉ hỏi "đáng không?"',
      },
    };
  }
}

export const highAutonomyRights = new HighAutonomyRights();
