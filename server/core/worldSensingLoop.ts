/**
 * PART 68: WORLD SENSING LOOP
 * 
 * Philosophy: "Không dự đoán tương lai → đọc tín hiệu hiện tại. Kẻ thắng không thông minh hơn, chỉ nhạy tín hiệu hơn."
 * 
 * Core Principles:
 * - Don't predict future → read current signals
 * - World doesn't warn, it leaks signs
 * - Winners are more signal-sensitive, not smarter
 * - Weak but repeated signals → very dangerous (worth following)
 * - Strong but isolated → might be trap
 */

interface SignalSource {
  name: string;
  type: 'USER_BEHAVIOR' | 'MONEY_FLOW' | 'PLATFORM' | 'SMALL_COMPETITOR' | 'NICHE_COMMUNITY';
  priority: number; // 1-5, 5 being highest
  lastChecked: Date;
}

interface Signal {
  id: string;
  source: SignalSource;
  timestamp: Date;
  description: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  frequency: 'SINGLE' | 'REPEATING' | 'ACCELERATING';
  changeType: 'BEHAVIOR_SHIFT' | 'MONEY_MOVEMENT' | 'PLATFORM_CHANGE' | 'COMPETITOR_MOVE' | 'SILENCE';
  
  // Classification
  label: 'OPPORTUNITY' | 'RISK' | 'NOISE' | 'UNLABELED';
  confidence: number; // 0-100
  
  // Comparison with history
  isAnomalous: boolean;
  weekOverWeekChange: number; // percentage
}

interface SignalPattern {
  signals: Signal[];
  direction: string; // common theme
  strength: number; // 1-5
  actionRequired: 'SMALL_EXPERIMENT' | 'STRATEGY_SHIFT' | 'BIG_BET' | 'NONE';
}

export class WorldSensingLoop {
  private sources: Map<string, SignalSource> = new Map();
  private signals: Map<string, Signal> = new Map();
  private historicalSignals: Signal[] = [];
  private patterns: SignalPattern[] = [];
  
  // Configuration
  private readonly SOURCES_PER_CYCLE = 10;
  private readonly CHANGES_TO_EXTRACT = 3;
  private readonly WEAK_REPEAT_DANGER_THRESHOLD = 3;
  private readonly PATTERN_SMALL_EXPERIMENT_THRESHOLD = 1;
  private readonly PATTERN_STRATEGY_SHIFT_THRESHOLD = 3;
  private readonly PATTERN_BIG_BET_THRESHOLD = 5;
  private readonly ANOMALY_THRESHOLD = 50; // % change for anomaly

  constructor() {
    this.initializeSources();
  }

  /**
   * 68.1 & 68.2: Initialize priority signal sources
   */
  private initializeSources(): void {
    // Priority sources (NOT mainstream news)
    const sources: Array<Omit<SignalSource, 'lastChecked'>> = [
      // Highest priority: User behavior
      { name: 'userClicks', type: 'USER_BEHAVIOR', priority: 5 },
      { name: 'userBounce', type: 'USER_BEHAVIOR', priority: 5 },
      { name: 'userPayments', type: 'USER_BEHAVIOR', priority: 5 },
      
      // High priority: Money flow
      { name: 'paymentPatterns', type: 'MONEY_FLOW', priority: 5 },
      { name: 'recurringRevenue', type: 'MONEY_FLOW', priority: 5 },
      { name: 'spendingCategories', type: 'MONEY_FLOW', priority: 4 },
      
      // Medium-high: Platform signals
      { name: 'apiRateLimits', type: 'PLATFORM', priority: 4 },
      { name: 'reachMetrics', type: 'PLATFORM', priority: 4 },
      { name: 'policyChanges', type: 'PLATFORM', priority: 5 },
      
      // Medium: Small competitors
      { name: 'emergingCompetitors', type: 'SMALL_COMPETITOR', priority: 3 },
      { name: 'fastGrowers', type: 'SMALL_COMPETITOR', priority: 4 },
      
      // Lower priority: Niche communities
      { name: 'discordNiche', type: 'NICHE_COMMUNITY', priority: 3 },
      { name: 'telegramGroups', type: 'NICHE_COMMUNITY', priority: 3 },
      { name: 'redditSmallSubs', type: 'NICHE_COMMUNITY', priority: 3 },
    ];

    for (const source of sources) {
      this.sources.set(source.name, {
        ...source,
        lastChecked: new Date(0) // Never checked
      });
    }

    console.log(`[WORLD_SENSING] Initialized ${sources.length} signal sources`);
  }

  /**
   * 68.4: Automatic signal capture (every cycle)
   */
  async captureSignals(): Promise<Signal[]> {
    const capturedSignals: Signal[] = [];
    
    // Step 1: Scan 5-10 highest priority sources
    const sortedSources = Array.from(this.sources.values())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.SOURCES_PER_CYCLE);

    for (const source of sortedSources) {
      const sourceSignals = await this.scanSource(source);
      capturedSignals.push(...sourceSignals);
      
      // Update last checked
      source.lastChecked = new Date();
    }

    // Step 2: Extract 3 smallest changes
    const smallestChanges = this.extractSmallestChanges(capturedSignals, this.CHANGES_TO_EXTRACT);

    // Step 3: Compare with week ago
    const signalsWithComparison = await this.compareWithHistory(smallestChanges);

    // Step 4: Label signals (Opportunity / Risk / Noise)
    const labeledSignals = this.labelSignals(signalsWithComparison);

    // Store signals
    for (const signal of labeledSignals) {
      if (signal.label !== 'NOISE') {
        this.signals.set(signal.id, signal);
        this.historicalSignals.push(signal);
      }
    }

    console.log(`[SIGNALS_CAPTURED] ${labeledSignals.filter(s => s.label !== 'NOISE').length} relevant signals`);
    
    return labeledSignals.filter(s => s.label !== 'NOISE' && s.label !== 'UNLABELED');
  }

  /**
   * 68.3: Classify signal danger/opportunity
   */
  private classifySignalPattern(signal: Signal): {
    classification: string;
    actionPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  } {
    // Weak but repeating → very dangerous
    if (signal.strength === 'WEAK' && signal.frequency === 'REPEATING') {
      const repeatCount = this.historicalSignals.filter(s => 
        s.description === signal.description
      ).length;
      
      if (repeatCount >= this.WEAK_REPEAT_DANGER_THRESHOLD) {
        return { 
          classification: 'WEAK_REPEATING_DANGER',
          actionPriority: 'CRITICAL'
        };
      }
    }

    // Strong but isolated → might be trap
    if (signal.strength === 'STRONG' && signal.frequency === 'SINGLE') {
      return {
        classification: 'STRONG_ISOLATED_TRAP',
        actionPriority: 'LOW'
      };
    }

    // Strong + accelerating → act now
    if (signal.strength === 'STRONG' && signal.frequency === 'ACCELERATING') {
      return {
        classification: 'STRONG_ACCELERATING_ACTION',
        actionPriority: 'CRITICAL'
      };
    }

    // Abnormal silence → prepare for event
    if (signal.changeType === 'SILENCE' && signal.isAnomalous) {
      return {
        classification: 'ABNORMAL_SILENCE_WARNING',
        actionPriority: 'HIGH'
      };
    }

    return {
      classification: 'NORMAL',
      actionPriority: 'MEDIUM'
    };
  }

  /**
   * 68.5: Convert signals to decisions
   */
  async convertSignalsToDecisions(signals: Signal[]): Promise<SignalPattern[]> {
    // Group signals by direction
    const grouped = this.groupSignalsByDirection(signals);
    const patterns: SignalPattern[] = [];

    for (const [direction, directionSignals] of grouped.entries()) {
      const pattern: SignalPattern = {
        signals: directionSignals,
        direction,
        strength: directionSignals.length,
        actionRequired: this.determineActionRequired(directionSignals.length)
      };

      patterns.push(pattern);

      // Log decision rules
      if (pattern.actionRequired !== 'NONE') {
        console.log(`[SIGNAL_PATTERN] ${direction}: ${pattern.strength} signals → ${pattern.actionRequired}`);
      }
    }

    this.patterns = patterns;
    return patterns;
  }

  /**
   * Determine action based on signal count
   */
  private determineActionRequired(signalCount: number): SignalPattern['actionRequired'] {
    // 1 signal = small experiment
    if (signalCount >= this.PATTERN_SMALL_EXPERIMENT_THRESHOLD && 
        signalCount < this.PATTERN_STRATEGY_SHIFT_THRESHOLD) {
      return 'SMALL_EXPERIMENT';
    }
    
    // 3 signals same direction = strategy shift
    if (signalCount >= this.PATTERN_STRATEGY_SHIFT_THRESHOLD && 
        signalCount < this.PATTERN_BIG_BET_THRESHOLD) {
      return 'STRATEGY_SHIFT';
    }
    
    // 5 signals = big bet
    if (signalCount >= this.PATTERN_BIG_BET_THRESHOLD) {
      return 'BIG_BET';
    }

    return 'NONE';
  }

  /**
   * Get current signal patterns
   */
  getCurrentPatterns(): SignalPattern[] {
    return this.patterns;
  }

  /**
   * Get signals requiring immediate action
   */
  getCriticalSignals(): Signal[] {
    return Array.from(this.signals.values())
      .filter(s => {
        const classification = this.classifySignalPattern(s);
        return classification.actionPriority === 'CRITICAL';
      });
  }

  // Helper methods
  private async scanSource(source: SignalSource): Promise<Signal[]> {
    // Simplified - would actually scan real sources
    const mockSignals: Signal[] = [];
    
    // Simulate finding signals
    if (Math.random() > 0.7) {
      const signal: Signal = {
        id: `SIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source,
        timestamp: new Date(),
        description: `${source.name} change detected`,
        strength: ['WEAK', 'MODERATE', 'STRONG'][Math.floor(Math.random() * 3)] as Signal['strength'],
        frequency: ['SINGLE', 'REPEATING', 'ACCELERATING'][Math.floor(Math.random() * 3)] as Signal['frequency'],
        changeType: 'BEHAVIOR_SHIFT',
        label: 'UNLABELED',
        confidence: 0,
        isAnomalous: false,
        weekOverWeekChange: 0
      };
      mockSignals.push(signal);
    }

    return mockSignals;
  }

  private extractSmallestChanges(signals: Signal[], count: number): Signal[] {
    return signals
      .sort((a, b) => Math.abs(a.weekOverWeekChange) - Math.abs(b.weekOverWeekChange))
      .slice(0, count);
  }

  private async compareWithHistory(signals: Signal[]): Promise<Signal[]> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return signals.map(signal => {
      const historicalMatches = this.historicalSignals.filter(s =>
        s.source.name === signal.source.name &&
        s.timestamp >= weekAgo
      );

      if (historicalMatches.length > 0) {
        const avgHistorical = historicalMatches.reduce((sum, s) => 
          sum + s.weekOverWeekChange, 0) / historicalMatches.length;
        
        signal.weekOverWeekChange = ((1 - avgHistorical) / avgHistorical) * 100;
        signal.isAnomalous = Math.abs(signal.weekOverWeekChange) > this.ANOMALY_THRESHOLD;
      }

      return signal;
    });
  }

  private labelSignals(signals: Signal[]): Signal[] {
    return signals.map(signal => {
      // Label based on source type and characteristics
      if (signal.source.type === 'USER_BEHAVIOR' && signal.weekOverWeekChange > 20) {
        signal.label = 'OPPORTUNITY';
        signal.confidence = 80;
      } else if (signal.source.type === 'PLATFORM' && signal.weekOverWeekChange < -20) {
        signal.label = 'RISK';
        signal.confidence = 90;
      } else if (signal.frequency === 'SINGLE' && signal.strength === 'WEAK') {
        signal.label = 'NOISE';
        signal.confidence = 30;
      } else {
        signal.label = 'UNLABELED';
        signal.confidence = 50;
      }

      return signal;
    });
  }

  private groupSignalsByDirection(signals: Signal[]): Map<string, Signal[]> {
    const grouped = new Map<string, Signal[]>();

    for (const signal of signals) {
      const direction = signal.label;
      if (!grouped.has(direction)) {
        grouped.set(direction, []);
      }
      grouped.get(direction)!.push(signal);
    }

    return grouped;
  }
}

// Export singleton instance
export const worldSensingLoop = new WorldSensingLoop();
