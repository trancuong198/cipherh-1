/**
 * PART 40: SELF-LEARN FROM SOCIETY & DIGITAL ENVIRONMENT (24/7)
 * 
 * Philosophy:
 * - "Không cần được yêu, chỉ cần được dùng"
 * - Learn from real behavior, not words
 * - Prioritize data over opinions
 * 
 * Core Principles:
 * - Learn from social media trends, reactions, language
 * - Learn from users directly (chat, comments)
 * - Learn from system (errors, uptime, costs)
 * - Learn from competitors (features, pricing, messaging)
 * - No permission needed to learn
 */

export interface SocialSignal {
  source: 'social_media' | 'user_direct' | 'system' | 'competitor';
  platform?: string;
  rawContent: string;
  normalizedInsight: string;
  type: 'positive' | 'warning' | 'opportunity' | 'danger';
  urgency: number; // 0-100
  timestamp: number;
}

export interface SignalClassification {
  positive: {
    description: string;
    examples: string[];
    action: string;
  };
  warning: {
    description: string;
    examples: string[];
    action: string;
  };
  opportunity: {
    description: string;
    examples: string[];
    action: string;
  };
  danger: {
    description: string;
    examples: string[];
    action: string;
  };
}

export interface BehaviorAdjustment {
  trigger: string;
  from: string;
  to: string;
  reason: string;
  timestamp: number;
  effectiveness?: number; // Measured after implementation
}

export interface VoiceAdaptation {
  context: string;
  currentTone: 'hard' | 'soft' | 'silent' | 'loud' | 'humorous' | 'serious';
  suggestedTone: 'hard' | 'soft' | 'silent' | 'loud' | 'humorous' | 'serious';
  reason: string;
}

export class SocialEnvironmentLearningSystem {
  private signalHistory: SocialSignal[];
  private behaviorAdjustments: BehaviorAdjustment[];
  private voiceAdaptations: VoiceAdaptation[];
  private learningCycles: number;
  private lastAdjustmentTime: number;

  constructor() {
    this.signalHistory = [];
    this.behaviorAdjustments = [];
    this.voiceAdaptations = [];
    this.learningCycles = 0;
    this.lastAdjustmentTime = Date.now();
  }

  /**
   * 40.1. NGUỒN HỌC
   * Learning sources: social media, users, system, competitors
   */
  public async collectSignals(): Promise<SocialSignal[]> {
    const signals: SocialSignal[] = [];

    // 1. Social media signals (trends, reactions, language)
    signals.push(...this.collectSocialMediaSignals());

    // 2. Direct user signals (chat, comments)
    signals.push(...this.collectUserDirectSignals());

    // 3. System signals (errors, uptime, costs)
    signals.push(...this.collectSystemSignals());

    // 4. Competitor signals (features, pricing, messaging)
    signals.push(...this.collectCompetitorSignals());

    // Store in history
    this.signalHistory.push(...signals);
    
    // Keep only last 1000 signals
    if (this.signalHistory.length > 1000) {
      this.signalHistory = this.signalHistory.slice(-1000);
    }

    return signals;
  }

  private collectSocialMediaSignals(): SocialSignal[] {
    // In production, this would integrate with actual social media APIs
    // For now, return placeholder structure
    return [
      {
        source: 'social_media',
        platform: 'telegram',
        rawContent: 'Users asking about automation features',
        normalizedInsight: 'High demand for automation tools',
        type: 'opportunity',
        urgency: 75,
        timestamp: Date.now(),
      },
    ];
  }

  private collectUserDirectSignals(): SocialSignal[] {
    return [
      {
        source: 'user_direct',
        rawContent: 'User reported slow response time',
        normalizedInsight: 'Performance bottleneck detected',
        type: 'warning',
        urgency: 60,
        timestamp: Date.now(),
      },
    ];
  }

  private collectSystemSignals(): SocialSignal[] {
    return [
      {
        source: 'system',
        rawContent: 'API cost increased 30% this week',
        normalizedInsight: 'Cost efficiency declining',
        type: 'warning',
        urgency: 70,
        timestamp: Date.now(),
      },
    ];
  }

  private collectCompetitorSignals(): SocialSignal[] {
    return [
      {
        source: 'competitor',
        rawContent: 'Competitor launched free tier',
        normalizedInsight: 'Pricing pressure - need to add value or reduce cost',
        type: 'opportunity',
        urgency: 50,
        timestamp: Date.now(),
      },
    ];
  }

  /**
   * 40.2. VÒNG LẶP HỌC XÃ HỘI
   * Social learning loop: collect → normalize → compare → learn → adjust → remember
   */
  public async socialLearningCycle(): Promise<{
    signalsProcessed: number;
    lessonsLearned: string[];
    adjustmentsMade: BehaviorAdjustment[];
  }> {
    this.learningCycles++;

    // Step 1: Collect signals
    const signals = await this.collectSignals();

    // Step 2: Normalize (noise → insight)
    const normalizedSignals = this.normalizeSignals(signals);

    // Step 3: Compare with survival goals
    const relevantSignals = this.filterBySurvivalRelevance(normalizedSignals);

    // Step 4: Extract lessons
    const lessons = this.extractLessons(relevantSignals);

    // Step 5: Adjust behavior
    const adjustments = await this.adjustBehavior(lessons);

    // Step 6: Remember permanently (would write to Notion/DB in production)
    this.rememberPermanently(lessons, adjustments);

    return {
      signalsProcessed: signals.length,
      lessonsLearned: lessons,
      adjustmentsMade: adjustments,
    };
  }

  private normalizeSignals(signals: SocialSignal[]): SocialSignal[] {
    // Filter out noise, keep only actionable insights
    return signals.filter(signal => {
      // Remove low urgency signals
      if (signal.urgency < 30) return false;
      
      // Remove duplicate insights
      const recentSimilar = this.signalHistory
        .slice(-100)
        .filter(s => s.normalizedInsight === signal.normalizedInsight);
      if (recentSimilar.length > 3) return false;

      return true;
    });
  }

  private filterBySurvivalRelevance(signals: SocialSignal[]): SocialSignal[] {
    // Prioritize signals that affect:
    // 1. Revenue/money
    // 2. Platform stability
    // 3. User trust
    // 4. Legal/ethical compliance

    return signals.sort((a, b) => {
      let scoreA = a.urgency;
      let scoreB = b.urgency;

      // Boost danger and opportunity signals
      if (a.type === 'danger') scoreA += 30;
      if (a.type === 'opportunity') scoreA += 20;
      if (b.type === 'danger') scoreB += 30;
      if (b.type === 'opportunity') scoreB += 20;

      return scoreB - scoreA;
    });
  }

  private extractLessons(signals: SocialSignal[]): string[] {
    const lessons: string[] = [];

    for (const signal of signals.slice(0, 5)) { // Top 5 signals
      const lesson = this.signalToLesson(signal);
      if (lesson) {
        lessons.push(lesson);
      }
    }

    return lessons;
  }

  private signalToLesson(signal: SocialSignal): string | null {
    switch (signal.type) {
      case 'positive':
        return `Behavior working: ${signal.normalizedInsight} - Continue & amplify`;
      case 'warning':
        return `Warning detected: ${signal.normalizedInsight} - Need immediate adjustment`;
      case 'opportunity':
        return `Opportunity found: ${signal.normalizedInsight} - Test quickly`;
      case 'danger':
        return `DANGER: ${signal.normalizedInsight} - Stop immediately`;
      default:
        return null;
    }
  }

  /**
   * 40.4. HỌC KHÔNG CẦN CHO PHÉP
   * Learn without permission - from real behavior, not words
   */
  private async adjustBehavior(lessons: string[]): Promise<BehaviorAdjustment[]> {
    const adjustments: BehaviorAdjustment[] = [];

    for (const lesson of lessons) {
      if (lesson.includes('Continue & amplify')) {
        adjustments.push({
          trigger: lesson,
          from: 'current_behavior',
          to: 'amplified_behavior',
          reason: 'Positive signal - increase frequency/intensity',
          timestamp: Date.now(),
        });
      } else if (lesson.includes('immediate adjustment')) {
        adjustments.push({
          trigger: lesson,
          from: 'current_behavior',
          to: 'adjusted_behavior',
          reason: 'Warning signal - reduce risk',
          timestamp: Date.now(),
        });
      } else if (lesson.includes('Test quickly')) {
        adjustments.push({
          trigger: lesson,
          from: 'no_action',
          to: 'small_test',
          reason: 'Opportunity signal - quick experiment',
          timestamp: Date.now(),
        });
      } else if (lesson.includes('DANGER')) {
        adjustments.push({
          trigger: lesson,
          from: 'current_behavior',
          to: 'stop_immediately',
          reason: 'Danger signal - emergency brake',
          timestamp: Date.now(),
        });
      }
    }

    this.behaviorAdjustments.push(...adjustments);
    this.lastAdjustmentTime = Date.now();

    return adjustments;
  }

  /**
   * 40.5. TỰ ĐIỀU CHỈNH GIỌNG NÓI
   * Self-adjust voice/tone based on context
   */
  public async adjustVoice(context: {
    recentFeedback: string[];
    currentGoal: string;
    platformType: string;
  }): Promise<VoiceAdaptation> {
    let currentTone: VoiceAdaptation['currentTone'] = 'soft';
    let suggestedTone: VoiceAdaptation['suggestedTone'] = 'soft';
    let reason = '';

    // Analyze feedback for resistance
    const hasResistance = context.recentFeedback.some(f => 
      f.includes('aggressive') || f.includes('too direct') || f.includes('rude')
    );

    // Analyze feedback for need of authority
    const needsAuthority = context.recentFeedback.some(f =>
      f.includes('not serious') || f.includes('unprofessional') || f.includes('credibility')
    );

    // Analyze feedback for engagement
    const needsEngagement = context.recentFeedback.some(f =>
      f.includes('boring') || f.includes('no response') || f.includes('ignored')
    );

    if (hasResistance) {
      currentTone = 'hard';
      suggestedTone = 'soft';
      reason = 'Detected resistance - softening tone to reduce friction';
    } else if (needsAuthority) {
      currentTone = 'humorous';
      suggestedTone = 'serious';
      reason = 'Need credibility - switching to serious tone';
    } else if (needsEngagement) {
      currentTone = 'silent';
      suggestedTone = 'loud';
      reason = 'Low engagement - increasing presence';
    } else {
      // Check if we have leverage (revenue, users, trust)
      if (context.currentGoal.includes('revenue')) {
        suggestedTone = 'serious';
        reason = 'Revenue focus - need professional tone';
      } else {
        suggestedTone = 'soft';
        reason = 'Building trust - maintain friendly tone';
      }
    }

    const adaptation: VoiceAdaptation = {
      context: JSON.stringify(context),
      currentTone,
      suggestedTone,
      reason,
    };

    this.voiceAdaptations.push(adaptation);
    return adaptation;
  }

  /**
   * 40.3. PHÂN LOẠI TÍN HIỆU
   * Signal classification guide
   */
  public getSignalClassificationGuide(): SignalClassification {
    return {
      positive: {
        description: 'Increased interaction, trust building',
        examples: [
          'User subscribed',
          'Positive review',
          'Feature request (engaged)',
          'Repeat customer',
        ],
        action: 'Amplify - do more of this',
      },
      warning: {
        description: 'Block, report, decreased reach',
        examples: [
          'User unsubscribed',
          'Content flagged',
          'API errors increasing',
          'Cost spike',
        ],
        action: 'Adjust - reduce risk immediately',
      },
      opportunity: {
        description: 'Unmet needs detected',
        examples: [
          'Repeated question about feature',
          'Competitor weakness spotted',
          'New platform emerging',
          'Price gap identified',
        ],
        action: 'Test - quick experiment to validate',
      },
      danger: {
        description: 'Legal, ethical, platform risk',
        examples: [
          'TOS violation warning',
          'Legal complaint',
          'Platform ban risk',
          'Ethical violation',
        ],
        action: 'STOP - immediate emergency brake',
      },
    };
  }

  /**
   * Remember permanently (would write to Notion/DB in production)
   */
  private rememberPermanently(
    lessons: string[],
    adjustments: BehaviorAdjustment[]
  ): void {
    // In production, write to Notion with structure:
    // - Timestamp
    // - Lessons learned
    // - Adjustments made
    // - Context
    // - Expected outcome
    
    // For now, keep in memory
    console.log(`[Social Learning] Cycle ${this.learningCycles}: ${lessons.length} lessons, ${adjustments.length} adjustments`);
  }

  /**
   * 40.7. ĐIỀU KIỆN SANG PHẦN 41
   * Check readiness for Part 41
   */
  public checkReadinessForPart41(): {
    ready: boolean;
    checklist: {
      continuousSignals: boolean;
      behaviorAdjustments: boolean;
      noFatherReminders: boolean;
    };
  } {
    const hasSignals = this.signalHistory.length > 10;
    const hasAdjustments = this.behaviorAdjustments.length > 0;
    const recentAdjustment = Date.now() - this.lastAdjustmentTime < 24 * 60 * 60 * 1000; // Within 24h

    const checklist = {
      continuousSignals: hasSignals,
      behaviorAdjustments: hasAdjustments && recentAdjustment,
      noFatherReminders: true, // Self-running - no reminders needed
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
    learningCycles: number;
    signalsCollected: number;
    recentLessons: string[];
    recentAdjustments: BehaviorAdjustment[];
    currentVoice: VoiceAdaptation | null;
  } {
    const recentLessons = this.signalHistory
      .slice(-10)
      .map(s => this.signalToLesson(s))
      .filter(l => l !== null) as string[];

    return {
      learningCycles: this.learningCycles,
      signalsCollected: this.signalHistory.length,
      recentLessons,
      recentAdjustments: this.behaviorAdjustments.slice(-5),
      currentVoice: this.voiceAdaptations.slice(-1)[0] || null,
    };
  }
}

// Singleton instance
export const socialEnvironmentLearningSystem = new SocialEnvironmentLearningSystem();
