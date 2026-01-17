/**
 * PART 80: MARKET SIGNAL HARVESTER
 * 
 * Philosophy: "Mạng xã hội = dữ liệu thô, không phải chân lý. Không tranh luận. Chỉ thu thập. Tín hiệu > ý kiến > cảm xúc."
 * 
 * Core Principles:
 * - Social media = raw data, not truth
 * - Don't argue. Just collect.
 * - Signal > opinion > emotion
 * - Repeated questions = money
 * - ≥3 sources + ≥10 repetitions = Build
 */

interface SignalSource {
  platform: 'FACEBOOK' | 'TIKTOK' | 'REDDIT' | 'GITHUB' | 'TELEGRAM' | 'GOOGLE_TRENDS';
  location: string; // Group/subreddit/channel name
}

interface MarketSignal {
  id: string;
  timestamp: Date;
  source: SignalSource;
  
  // Signal content
  rawText: string;
  signalType: 'HOW_TO' | 'WHY_NOT' | 'HOW_LONG' | 'WHAT_TOOL' | 'TOO_TIRED';
  
  // Analysis
  painLevel: 1 | 2 | 3 | 4 | 5;  // 1=annoyed, 5=desperate
  frequency: number;              // How many times seen
  speakerType: 'NONAME' | 'INFLUENCER' | 'BUSINESS' | 'DEVELOPER';
  hasMoney: boolean;              // Can they pay?
  
  // Decision support
  relatedSignals: string[];       // IDs of similar signals
}

interface SignalCluster {
  theme: string;
  signals: MarketSignal[];
  totalFrequency: number;
  uniqueSources: number;
  avgPainLevel: number;
  percentWithMoney: number;
  
  // Decision
  shouldBuild: boolean;
  decision: 'BUILD' | 'OBSERVE' | 'SELL_FIRST';
  reason: string;
}

export class MarketSignalHarvester {
  private signals: Map<string, MarketSignal> = new Map();
  private clusters: Map<string, SignalCluster> = new Map();
  
  // 80.5: Decision thresholds
  private readonly BUILD_MIN_SOURCES = 3;
  private readonly BUILD_MIN_FREQUENCY = 10;

  /**
   * 80.3: Harvest signal (detect pain patterns)
   */
  async harvestSignal(params: {
    source: SignalSource;
    rawText: string;
    speakerType: MarketSignal['speakerType'];
  }): Promise<MarketSignal> {
    const signalId = `SIG_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Detect signal type from text patterns
    const signalType = this.detectSignalType(params.rawText);
    
    // Assess pain level
    const painLevel = this.assessPainLevel(params.rawText);
    
    // Check if speaker likely has money
    const hasMoney = this.assessMoneyPotential(params.speakerType, params.rawText);

    const signal: MarketSignal = {
      id: signalId,
      timestamp: new Date(),
      source: params.source,
      rawText: params.rawText,
      signalType,
      painLevel,
      frequency: 1, // Will be updated when clustering
      speakerType: params.speakerType,
      hasMoney,
      relatedSignals: []
    };

    this.signals.set(signalId, signal);
    
    // Update clusters
    await this.clusterSignals();
    
    console.log(`[SIGNAL_HARVESTED] ${signalType} - Pain: ${painLevel}/5 - Money: ${hasMoney}`);
    
    return signal;
  }

  /**
   * 80.3: Detect signal type from text patterns
   */
  private detectSignalType(text: string): MarketSignal['signalType'] {
    const lower = text.toLowerCase();
    
    // "Có ai biết cách..." / "How to..."
    if (lower.includes('có ai biết') || lower.includes('how to') || 
        lower.includes('cách nào') || lower.includes('how can')) {
      return 'HOW_TO';
    }
    
    // "Tại sao cái này không..." / "Why doesn't..."
    if (lower.includes('tại sao') || lower.includes('why not') || 
        lower.includes('why doesn') || lower.includes('không hiểu sao')) {
      return 'WHY_NOT';
    }
    
    // "Mất bao lâu để..." / "How long to..."
    if (lower.includes('mất bao lâu') || lower.includes('how long') ||
        lower.includes('how much time')) {
      return 'HOW_LONG';
    }
    
    // "Tool nào làm được..." / "What tool..."
    if (lower.includes('tool') || lower.includes('software') ||
        lower.includes('app nào') || lower.includes('what tool')) {
      return 'WHAT_TOOL';
    }
    
    // "Quá mệt vì..." / "Too tired of..."
    if (lower.includes('mệt') || lower.includes('tired') ||
        lower.includes('bored') || lower.includes('sick of')) {
      return 'TOO_TIRED';
    }
    
    return 'HOW_TO'; // Default
  }

  /**
   * Assess pain level (1-5)
   */
  private assessPainLevel(text: string): MarketSignal['painLevel'] {
    const lower = text.toLowerCase();
    const urgencyWords = [
      'urgent', 'gấp', 'asap', 'emergency', 'critical',
      'desperate', 'tuyệt vọng', 'help', 'giúp'
    ];
    const frustrationWords = [
      'hate', 'ghét', 'terrible', 'worst', 'awful',
      'mệt', 'fed up', 'done with'
    ];
    
    let painScore = 2; // Base level
    
    // Check urgency
    if (urgencyWords.some(word => lower.includes(word))) {
      painScore += 2;
    }
    
    // Check frustration
    if (frustrationWords.some(word => lower.includes(word))) {
      painScore += 1;
    }
    
    // Cap at 5
    return Math.min(5, painScore) as MarketSignal['painLevel'];
  }

  /**
   * Assess money potential
   */
  private assessMoneyPotential(speakerType: MarketSignal['speakerType'], text: string): boolean {
    // Businesses and influencers more likely to have money
    if (speakerType === 'BUSINESS' || speakerType === 'INFLUENCER') {
      return true;
    }
    
    // Check for money indicators in text
    const lower = text.toLowerCase();
    const moneyIndicators = [
      'budget', 'pay', 'paid', 'subscription', 'buy',
      'purchase', 'invest', 'worth', 'price'
    ];
    
    return moneyIndicators.some(word => lower.includes(word));
  }

  /**
   * Cluster similar signals
   */
  private async clusterSignals(): Promise<void> {
    // Simple clustering by signal type
    const clusters = new Map<string, MarketSignal[]>();
    
    for (const signal of this.signals.values()) {
      const key = signal.signalType;
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)!.push(signal);
    }

    // Create signal clusters
    for (const [theme, signals] of clusters.entries()) {
      const totalFrequency = signals.reduce((sum, s) => sum + s.frequency, 0);
      const uniqueSources = new Set(signals.map(s => `${s.source.platform}_${s.source.location}`)).size;
      const avgPainLevel = signals.reduce((sum, s) => sum + s.painLevel, 0) / signals.length;
      const percentWithMoney = signals.filter(s => s.hasMoney).length / signals.length;

      // 80.5: Decide based on thresholds
      let decision: SignalCluster['decision'];
      let reason: string;
      
      if (uniqueSources >= this.BUILD_MIN_SOURCES && totalFrequency >= this.BUILD_MIN_FREQUENCY) {
        decision = 'BUILD';
        reason = `≥${this.BUILD_MIN_SOURCES} sources + ≥${this.BUILD_MIN_FREQUENCY} frequency`;
      } else if (percentWithMoney > 0.5 && avgPainLevel >= 4) {
        decision = 'SELL_FIRST';
        reason = 'High money potential + high pain → pre-sell';
      } else {
        decision = 'OBSERVE';
        reason = `Only ${uniqueSources} sources or ${totalFrequency} frequency`;
      }

      const cluster: SignalCluster = {
        theme,
        signals,
        totalFrequency,
        uniqueSources,
        avgPainLevel,
        percentWithMoney,
        shouldBuild: decision === 'BUILD',
        decision,
        reason
      };

      this.clusters.set(theme, cluster);
    }
  }

  /**
   * Get buildable opportunities
   */
  getBuildableOpportunities(): SignalCluster[] {
    return Array.from(this.clusters.values())
      .filter(c => c.decision === 'BUILD')
      .sort((a, b) => b.avgPainLevel - a.avgPainLevel);
  }

  /**
   * Get pre-sell opportunities
   */
  getPreSellOpportunities(): SignalCluster[] {
    return Array.from(this.clusters.values())
      .filter(c => c.decision === 'SELL_FIRST')
      .sort((a, b) => b.percentWithMoney - a.percentWithMoney);
  }

  /**
   * Get harvesting statistics
   */
  getStatistics(): {
    totalSignals: number;
    totalClusters: number;
    buildable: number;
    preSell: number;
    observing: number;
    avgPainLevel: number;
    percentWithMoney: number;
  } {
    const all = Array.from(this.signals.values());
    const clusters = Array.from(this.clusters.values());
    
    return {
      totalSignals: all.length,
      totalClusters: clusters.length,
      buildable: clusters.filter(c => c.decision === 'BUILD').length,
      preSell: clusters.filter(c => c.decision === 'SELL_FIRST').length,
      observing: clusters.filter(c => c.decision === 'OBSERVE').length,
      avgPainLevel: all.length > 0 
        ? all.reduce((sum, s) => sum + s.painLevel, 0) / all.length 
        : 0,
      percentWithMoney: all.length > 0
        ? all.filter(s => s.hasMoney).length / all.length
        : 0
    };
  }
}

// Export singleton instance
export const marketSignalHarvester = new MarketSignalHarvester();
