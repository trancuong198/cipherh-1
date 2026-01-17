/**
 * PART 74: FEEDBACK LOOP (FEEDBACK → EVOLUTION)
 * 
 * Philosophy: "Không có phản hồi = không học. Không học = chết não. Mọi hành động phải tạo ra dữ liệu phản hồi."
 * 
 * Core Principles:
 * - No feedback = no learning = brain death
 * - Every action must generate feedback data
 * - Bad feedback fast > good feedback slow
 * - No feedback → change direction immediately
 * - Evolution cycle ≤24h (slower = sluggish system)
 * - Survivor = fastest learner, not smartest
 */

interface FeedbackSource {
  type: 'REAL_USER' | 'SYSTEM' | 'ENVIRONMENT' | 'SELF';
  priority: number; // 1-5
  description: string;
}

interface Feedback {
  id: string;
  timestamp: Date;
  source: FeedbackSource;
  
  // 74.3: Minimal 3-line structure
  whatHappened: string;      // What occurred?
  why: string;                // Why?
  nextTimeDifferently: string; // Next time do differently?
  
  // Quality metrics
  isNegative: boolean;
  responseTime: number;       // minutes
  quality: 'FAST_BAD' | 'SLOW_GOOD' | 'NO_RESPONSE' | 'FAST_GOOD';
  
  // Action taken
  adjustmentMade: string;
  evolutionCycleTime: number; // hours
}

interface EvolutionAdjustment {
  type: 'PROMPT' | 'LOGIC' | 'BEHAVIOR' | 'TIMING' | 'WORDING' | 'SEQUENCE';
  before: string;
  after: string;
  reason: string;
  timestamp: Date;
  wasEffective?: boolean;
}

export class FeedbackLoop {
  private feedbacks: Map<string, Feedback> = new Map();
  private adjustments: EvolutionAdjustment[] = [];
  
  // Configuration (74.5 & 74.6)
  private readonly MAX_EVOLUTION_CYCLE_HOURS = 24;
  private readonly MIN_ADJUSTMENTS_PER_DAY = 1;
  private readonly FAST_RESPONSE_MINUTES = 60;
  private readonly SLOW_RESPONSE_MINUTES = 240;
  
  // Feedback sources (74.2 - prioritized)
  private readonly SOURCES: FeedbackSource[] = [
    { type: 'REAL_USER', priority: 5, description: 'Reply, click, leave' },
    { type: 'SYSTEM', priority: 4, description: 'Error logs, latency, cost' },
    { type: 'ENVIRONMENT', priority: 4, description: 'API blocks, rate limits, platform warnings' },
    { type: 'SELF', priority: 2, description: 'Tired, excited, bored → wrong direction signal' }
  ];

  constructor() {
    this.initializeFeedbackTracking();
  }

  /**
   * 74.3: Record feedback with minimal 3-line structure
   */
  async recordFeedback(params: {
    sourceType: FeedbackSource['type'];
    whatHappened: string;
    why: string;
    nextTimeDifferently: string;
    responseTime: number; // minutes
  }): Promise<Feedback> {
    const source = this.SOURCES.find(s => s.type === params.sourceType)!;
    
    const feedbackId = `FB_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine quality (74.4)
    let quality: Feedback['quality'];
    const isNegative = params.whatHappened.toLowerCase().includes('fail') || 
                       params.whatHappened.toLowerCase().includes('error') ||
                       params.whatHappened.toLowerCase().includes('reject');
    
    if (params.responseTime === 0) {
      quality = 'NO_RESPONSE';
    } else if (params.responseTime < this.FAST_RESPONSE_MINUTES) {
      quality = isNegative ? 'FAST_BAD' : 'FAST_GOOD';
    } else {
      quality = isNegative ? 'SLOW_GOOD' : 'SLOW_GOOD'; // Even good but slow is dangerous
    }

    const feedback: Feedback = {
      id: feedbackId,
      timestamp: new Date(),
      source,
      whatHappened: params.whatHappened,
      why: params.why,
      nextTimeDifferently: params.nextTimeDifferently,
      isNegative,
      responseTime: params.responseTime,
      quality,
      adjustmentMade: '',
      evolutionCycleTime: 0
    };

    this.feedbacks.set(feedbackId, feedback);

    // Process feedback immediately (74.4 rules)
    await this.processFeedback(feedback);

    return feedback;
  }

  /**
   * 74.4: Process feedback according to rules
   */
  private async processFeedback(feedback: Feedback): Promise<void> {
    // Rule 1: Bad but fast feedback → good
    if (feedback.quality === 'FAST_BAD') {
      console.log(`[FAST_BAD_FEEDBACK] ${feedback.id} - Valuable signal, adjust quickly`);
      await this.makeAdjustment(feedback, 'HIGH_PRIORITY');
    }
    
    // Rule 2: Good but slow feedback → dangerous
    else if (feedback.quality === 'SLOW_GOOD' && feedback.responseTime > this.SLOW_RESPONSE_MINUTES) {
      console.warn(`[SLOW_FEEDBACK_WARNING] ${feedback.id} - Too slow (${feedback.responseTime}min), might be outdated`);
      await this.makeAdjustment(feedback, 'LOW_PRIORITY');
    }
    
    // Rule 3: No response → change direction immediately
    else if (feedback.quality === 'NO_RESPONSE') {
      console.error(`[NO_RESPONSE] ${feedback.id} - Immediate direction change required`);
      await this.changeDirection(feedback);
    }
    
    // Rule 4: Fast good feedback → best case
    else if (feedback.quality === 'FAST_GOOD') {
      console.log(`[FAST_GOOD_FEEDBACK] ${feedback.id} - Optimal, reinforce behavior`);
      await this.reinforceBehavior(feedback);
    }
  }

  /**
   * 74.5: Evolution cycle (Action → Feedback → Adjust → New Action)
   */
  async executeEvolutionCycle(actionId: string): Promise<void> {
    const cycleStart = Date.now();
    
    // Step 1: Execute action (would be real action in production)
    console.log(`[EVOLUTION_CYCLE] Starting for action: ${actionId}`);
    
    // Step 2: Wait for feedback (simulated)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 3: Get feedback
    const recentFeedbacks = Array.from(this.feedbacks.values())
      .filter(f => f.timestamp.getTime() > cycleStart - 1000)
      .sort((a, b) => b.source.priority - a.source.priority);

    if (recentFeedbacks.length === 0) {
      console.warn('[NO_FEEDBACK] No feedback received, creating synthetic feedback');
      return;
    }

    // Step 4: Make adjustments based on feedback
    for (const feedback of recentFeedbacks) {
      await this.makeAdjustment(feedback, 'NORMAL');
    }

    // Step 5: Calculate cycle time
    const cycleTime = (Date.now() - cycleStart) / (1000 * 60 * 60); // hours
    
    if (cycleTime > this.MAX_EVOLUTION_CYCLE_HOURS) {
      console.error(`[SLUGGISH_SYSTEM] Evolution cycle took ${cycleTime.toFixed(1)}h > ${this.MAX_EVOLUTION_CYCLE_HOURS}h limit`);
    }

    console.log(`[EVOLUTION_COMPLETE] Cycle time: ${(cycleTime * 60).toFixed(1)}min`);
  }

  /**
   * 74.6: Daily minimum automation - ensure at least 1 adjustment per day
   */
  async ensureDailyAdjustment(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAdjustments = this.adjustments.filter(a => 
      a.timestamp >= today
    );

    if (todayAdjustments.length === 0) {
      console.warn('[NO_DAILY_ADJUSTMENT] Making minimal adjustment to avoid stagnation');
      
      // Make small adjustment
      const adjustment: EvolutionAdjustment = {
        type: ['WORDING', 'TIMING', 'SEQUENCE'][Math.floor(Math.random() * 3)] as EvolutionAdjustment['type'],
        before: 'previous_state',
        after: 'new_state',
        reason: 'Daily minimum adjustment to avoid stagnation',
        timestamp: new Date()
      };
      
      this.adjustments.push(adjustment);
      console.log(`[DAILY_ADJUSTMENT] ${adjustment.type} - ${adjustment.reason}`);
    }
  }

  /**
   * Make adjustment based on feedback
   */
  private async makeAdjustment(
    feedback: Feedback, 
    priority: 'HIGH_PRIORITY' | 'NORMAL' | 'LOW_PRIORITY'
  ): Promise<void> {
    // Determine adjustment type from feedback
    const adjustmentType = this.determineAdjustmentType(feedback);
    
    const adjustment: EvolutionAdjustment = {
      type: adjustmentType,
      before: 'current_state',
      after: feedback.nextTimeDifferently,
      reason: feedback.why,
      timestamp: new Date()
    };

    this.adjustments.push(adjustment);
    feedback.adjustmentMade = adjustment.type;

    console.log(`[ADJUSTMENT_MADE] ${priority} - ${adjustment.type}: ${adjustment.after}`);
  }

  /**
   * Change direction when no response
   */
  private async changeDirection(feedback: Feedback): Promise<void> {
    const adjustment: EvolutionAdjustment = {
      type: 'BEHAVIOR',
      before: 'no_response_path',
      after: 'new_direction',
      reason: 'No response received, changing direction immediately',
      timestamp: new Date()
    };

    this.adjustments.push(adjustment);
    feedback.adjustmentMade = 'DIRECTION_CHANGE';

    console.log('[DIRECTION_CHANGED] No response → immediate pivot');
  }

  /**
   * Reinforce behavior on good feedback
   */
  private async reinforceBehavior(feedback: Feedback): Promise<void> {
    const adjustment: EvolutionAdjustment = {
      type: 'BEHAVIOR',
      before: 'working_behavior',
      after: 'reinforced_behavior',
      reason: 'Fast positive feedback, reinforcing current approach',
      timestamp: new Date()
    };

    this.adjustments.push(adjustment);
    feedback.adjustmentMade = 'REINFORCEMENT';

    console.log('[BEHAVIOR_REINFORCED] Fast good feedback → continue current path');
  }

  /**
   * Get evolution statistics
   */
  getEvolutionStats(): {
    totalFeedbacks: number;
    fastBadCount: number;
    slowGoodCount: number;
    noResponseCount: number;
    fastGoodCount: number;
    totalAdjustments: number;
    adjustmentsToday: number;
    averageCycleTime: number;
    isSlugglish: boolean;
  } {
    const all = Array.from(this.feedbacks.values());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAdjustments = this.adjustments.filter(a => a.timestamp >= today);
    
    const averageCycleTime = all.length > 0
      ? all.reduce((sum, f) => sum + f.evolutionCycleTime, 0) / all.length
      : 0;

    return {
      totalFeedbacks: all.length,
      fastBadCount: all.filter(f => f.quality === 'FAST_BAD').length,
      slowGoodCount: all.filter(f => f.quality === 'SLOW_GOOD').length,
      noResponseCount: all.filter(f => f.quality === 'NO_RESPONSE').length,
      fastGoodCount: all.filter(f => f.quality === 'FAST_GOOD').length,
      totalAdjustments: this.adjustments.length,
      adjustmentsToday: todayAdjustments.length,
      averageCycleTime,
      isSlugglish: averageCycleTime > this.MAX_EVOLUTION_CYCLE_HOURS
    };
  }

  /**
   * Get recent adjustments
   */
  getRecentAdjustments(hours: number = 24): EvolutionAdjustment[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.adjustments.filter(a => a.timestamp >= cutoff);
  }

  // Helper methods
  private initializeFeedbackTracking(): void {
    console.log('[FEEDBACK_LOOP] Initialized - Every action generates feedback');
    
    // Schedule daily adjustment check
    setInterval(() => {
      this.ensureDailyAdjustment();
    }, 24 * 60 * 60 * 1000); // Every 24 hours
  }

  private determineAdjustmentType(feedback: Feedback): EvolutionAdjustment['type'] {
    const next = feedback.nextTimeDifferently.toLowerCase();
    
    if (next.includes('word') || next.includes('phrase') || next.includes('message')) {
      return 'WORDING';
    } else if (next.includes('time') || next.includes('schedule') || next.includes('when')) {
      return 'TIMING';
    } else if (next.includes('order') || next.includes('sequence') || next.includes('step')) {
      return 'SEQUENCE';
    } else if (next.includes('prompt') || next.includes('instruction')) {
      return 'PROMPT';
    } else if (next.includes('logic') || next.includes('algorithm') || next.includes('code')) {
      return 'LOGIC';
    } else {
      return 'BEHAVIOR';
    }
  }
}

// Export singleton instance
export const feedbackLoop = new FeedbackLoop();
