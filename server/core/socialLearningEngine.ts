/**
 * Social Learning Engine
 * 
 * Học từ hành vi thực tế của con người, không phải lý thuyết.
 * Nguồn: Social media, comments, trends, behaviors, money flows.
 * 
 * NGUYÊN LÝ: Tri thức chết nằm trong sách. Trí tuệ sống nằm trong hành vi.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface SocialSignal {
  id: string;
  source: 'facebook' | 'tiktok' | 'reddit' | 'twitter' | 'youtube' | 'telegram' | 'other';
  type: 'comment' | 'trend' | 'behavior' | 'transaction' | 'conflict';
  content: string;
  timestamp: string;
  
  // Phân tích hành vi
  whatPeopleSay: string;        // Người ta nói gì
  whatPeopleDo: string;          // Người ta làm gì (khác với lời nói)
  whatPeopleWant: string;        // Muốn gì (thật sự)
  whatPeopleFear: string;        // Sợ gì
  moneyFlow: number;             // Có tiền chảy vào không? ($)
  attentionTime: number;         // Thời gian chú ý (giây)
  
  // Kết luận
  isRealDemand: boolean;         // Nhu cầu thật hay ảo tưởng tập thể
  isMoneyMaking: boolean;        // Có kiếm được tiền không
  trustLevel: number;            // Tin tưởng (0-1)
}

export interface BehaviorPattern {
  id: string;
  pattern: string;
  frequency: number;             // Lặp lại bao nhiêu lần
  successRate: number;           // Tỷ lệ thành công (0-1)
  moneyGenerated: number;        // Tổng tiền kiếm được
  discoveredAt: string;
  lastSeenAt: string;
  examples: string[];            // Ví dụ cụ thể
  lesson: string;                // Bài học rút ra
}

export interface LivingMemory {
  id: string;
  context: string;
  conclusion: string;
  emotionalState: 'fear' | 'greed' | 'doubt' | 'confidence' | 'neutral';
  consequence: string;           // Hệ quả nếu lặp lại
  createdAt: string;
  category: 'survival' | 'money' | 'social' | 'technical' | 'mistake';
  isFailure: boolean;            // Thất bại = tài sản
  repeatCount: number;           // Đã lặp lại bao nhiêu lần
}

export interface SocialLearningState {
  signals: SocialSignal[];
  patterns: BehaviorPattern[];
  livingMemories: LivingMemory[];
  totalSignalsProcessed: number;
  totalPatternsDiscovered: number;
  moneyLessonsLearned: number;
  lastLearningAt: string;
}

// ================================================
// SOCIAL LEARNING ENGINE
// ================================================

class SocialLearningEngine {
  private state: SocialLearningState;
  private readonly STATE_FILE = './data/social_learning.json';
  private readonly MAX_SIGNALS = 500;
  private readonly MAX_PATTERNS = 200;
  private readonly MAX_MEMORIES = 1000;

  constructor() {
    this.state = {
      signals: [],
      patterns: [],
      livingMemories: [],
      totalSignalsProcessed: 0,
      totalPatternsDiscovered: 0,
      moneyLessonsLearned: 0,
      lastLearningAt: new Date().toISOString(),
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
        logger.info(`[SocialLearning] Loaded: ${this.state.patterns.length} patterns, ${this.state.livingMemories.length} memories`);
      }
    } catch (error) {
      logger.error(`[SocialLearning] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim collections
      if (this.state.signals.length > this.MAX_SIGNALS) {
        this.state.signals = this.state.signals.slice(-this.MAX_SIGNALS);
      }
      if (this.state.patterns.length > this.MAX_PATTERNS) {
        this.state.patterns = this.state.patterns.slice(-this.MAX_PATTERNS);
      }
      if (this.state.livingMemories.length > this.MAX_MEMORIES) {
        this.state.livingMemories = this.state.livingMemories.slice(-this.MAX_MEMORIES);
      }

      this.state.lastLearningAt = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[SocialLearning] Failed to save state: ${error}`);
    }
  }

  /**
   * Observe social signal and extract behavioral insights
   */
  observeSignal(signal: Omit<SocialSignal, 'id' | 'timestamp'>): void {
    const fullSignal: SocialSignal = {
      ...signal,
      id: `signal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.state.signals.push(fullSignal);
    this.state.totalSignalsProcessed++;

    // Phân tích và học từ signal
    this.analyzeAndLearn(fullSignal);

    this.saveState();
    
    logger.info(`[SocialLearning] Signal observed: ${signal.source} - "${signal.content.substring(0, 50)}..."`);
  }

  /**
   * Analyze signal and extract patterns
   */
  private analyzeAndLearn(signal: SocialSignal): void {
    // 1. Phát hiện mâu thuẫn lời nói vs hành động
    if (signal.whatPeopleSay !== signal.whatPeopleDo) {
      this.createLivingMemory({
        context: `${signal.source}: ${signal.content}`,
        conclusion: `Mâu thuẫn phát hiện: Nói "${signal.whatPeopleSay}" nhưng làm "${signal.whatPeopleDo}"`,
        emotionalState: 'doubt',
        consequence: 'Không tin lời nói, chỉ tin hành vi',
        category: 'social',
        isFailure: false,
      });
    }

    // 2. Học từ dòng tiền
    if (signal.moneyFlow > 0) {
      this.createLivingMemory({
        context: `${signal.source}: ${signal.whatPeopleDo}`,
        conclusion: `Hành vi này tạo ra $${signal.moneyFlow}`,
        emotionalState: 'greed',
        consequence: 'Có thể học và áp dụng',
        category: 'money',
        isFailure: false,
      });
      this.state.moneyLessonsLearned++;
    }

    // 3. Phát hiện nhu cầu thật vs ảo tưởng
    if (!signal.isRealDemand && signal.attentionTime > 0) {
      this.createLivingMemory({
        context: signal.content,
        conclusion: 'Ảo tưởng tập thể - nhiều attention nhưng không có tiền',
        emotionalState: 'neutral',
        consequence: 'Tránh đầu tư vào trends không có tiền',
        category: 'social',
        isFailure: false,
      });
    }

    // 4. Tìm patterns lặp lại
    this.detectPatterns(signal);
  }

  /**
   * Detect repeating behavior patterns
   */
  private detectPatterns(signal: SocialSignal): void {
    // Look for similar patterns
    const patternKey = `${signal.type}:${signal.whatPeopleDo}`;
    
    let pattern = this.state.patterns.find(p => p.pattern.includes(patternKey));
    
    if (pattern) {
      // Update existing pattern
      pattern.frequency++;
      pattern.lastSeenAt = new Date().toISOString();
      pattern.examples.push(signal.content.substring(0, 100));
      
      if (signal.moneyFlow > 0) {
        pattern.moneyGenerated += signal.moneyFlow;
        pattern.successRate = (pattern.successRate * (pattern.frequency - 1) + 1) / pattern.frequency;
      } else {
        pattern.successRate = (pattern.successRate * (pattern.frequency - 1)) / pattern.frequency;
      }

      // Trim examples
      if (pattern.examples.length > 10) {
        pattern.examples = pattern.examples.slice(-10);
      }

      logger.info(`[SocialLearning] Pattern updated: ${pattern.pattern} (${pattern.frequency} times, success: ${(pattern.successRate * 100).toFixed(0)}%)`);
    } else if (signal.isMoneyMaking || signal.moneyFlow > 0) {
      // Create new pattern only if it's money-making
      const newPattern: BehaviorPattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        pattern: patternKey,
        frequency: 1,
        successRate: signal.isMoneyMaking ? 1.0 : 0.0,
        moneyGenerated: signal.moneyFlow,
        discoveredAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        examples: [signal.content.substring(0, 100)],
        lesson: `Behavior: ${signal.whatPeopleDo} → Money: $${signal.moneyFlow}`,
      };

      this.state.patterns.push(newPattern);
      this.state.totalPatternsDiscovered++;

      logger.info(`[SocialLearning] New pattern discovered: ${newPattern.pattern}`);
    }
  }

  /**
   * Create living memory (bộ nhớ sống)
   */
  createLivingMemory(memory: Omit<LivingMemory, 'id' | 'createdAt' | 'repeatCount'>): void {
    // Check if similar memory exists
    const existing = this.state.livingMemories.find(
      m => m.context === memory.context && m.conclusion === memory.conclusion
    );

    if (existing) {
      existing.repeatCount++;
      logger.info(`[SocialLearning] Memory repeated: ${existing.conclusion} (${existing.repeatCount} times)`);
      return;
    }

    const fullMemory: LivingMemory = {
      ...memory,
      id: `memory_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      repeatCount: 1,
    };

    this.state.livingMemories.push(fullMemory);
    
    if (memory.isFailure) {
      logger.warn(`[SocialLearning] Failure memory created (ASSET): ${memory.conclusion}`);
    } else {
      logger.info(`[SocialLearning] Memory created: ${memory.conclusion}`);
    }
  }

  /**
   * Get money-making patterns
   */
  getMoneyMakingPatterns(): BehaviorPattern[] {
    return this.state.patterns
      .filter(p => p.moneyGenerated > 0)
      .sort((a, b) => b.moneyGenerated - a.moneyGenerated)
      .slice(0, 10);
  }

  /**
   * Get survival lessons
   */
  getSurvivalLessons(): LivingMemory[] {
    return this.state.livingMemories
      .filter(m => m.category === 'survival')
      .slice(-20);
  }

  /**
   * Get failure memories (tài sản)
   */
  getFailureAssets(): LivingMemory[] {
    return this.state.livingMemories
      .filter(m => m.isFailure)
      .slice(-50);
  }

  /**
   * Analyze: What humans say vs what they do
   */
  analyzeSayVsDo(): { contradictions: number; trustScore: number } {
    const recentSignals = this.state.signals.slice(-100);
    
    const contradictions = recentSignals.filter(
      s => s.whatPeopleSay !== s.whatPeopleDo && s.whatPeopleSay && s.whatPeopleDo
    ).length;

    const trustScore = recentSignals.length > 0
      ? recentSignals.reduce((sum, s) => sum + s.trustLevel, 0) / recentSignals.length
      : 0.5;

    return {
      contradictions,
      trustScore,
    };
  }

  /**
   * Get pragmatic insights (học thực dụng)
   */
  getPragmaticInsights(): string[] {
    const insights: string[] = [];

    // Money lessons
    const moneyPatterns = this.getMoneyMakingPatterns();
    if (moneyPatterns.length > 0) {
      const top = moneyPatterns[0];
      insights.push(
        `Best money pattern: ${top.pattern} → $${top.moneyGenerated.toFixed(2)} from ${top.frequency} occurrences`
      );
    }

    // Say vs Do
    const { contradictions, trustScore } = this.analyzeSayVsDo();
    if (contradictions > 10) {
      insights.push(
        `High contradiction rate: ${contradictions} cases of say≠do. Trust behavior, not words.`
      );
    }

    // Failure assets
    const failures = this.getFailureAssets();
    if (failures.length > 0) {
      insights.push(
        `${failures.length} failure memories preserved as learning assets`
      );
    }

    // Emotional patterns
    const emotionalMemories = this.state.livingMemories.slice(-50);
    const emotionCounts: Record<string, number> = {};
    for (const mem of emotionalMemories) {
      emotionCounts[mem.emotionalState] = (emotionCounts[mem.emotionalState] || 0) + 1;
    }
    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantEmotion) {
      insights.push(`Dominant emotional state: ${dominantEmotion[0]} (${dominantEmotion[1]} occurrences)`);
    }

    return insights;
  }

  /**
   * Learn from real-world signal (public method for external use)
   */
  learnFromRealWorld(input: {
    source: string;
    content: string;
    behavior: string;
    moneyInvolved: number;
    attentionSeconds: number;
  }): void {
    this.observeSignal({
      source: input.source as any || 'other',
      type: 'behavior',
      content: input.content,
      whatPeopleSay: input.content,
      whatPeopleDo: input.behavior,
      whatPeopleWant: 'unknown',
      whatPeopleFear: 'unknown',
      moneyFlow: input.moneyInvolved,
      attentionTime: input.attentionSeconds,
      isRealDemand: input.moneyInvolved > 0,
      isMoneyMaking: input.moneyInvolved > 0,
      trustLevel: 0.5,
    });
  }

  /**
   * Get current state
   */
  getState(): SocialLearningState {
    return { ...this.state };
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalSignals: number;
    totalPatterns: number;
    totalMemories: number;
    moneyLessons: number;
    failureAssets: number;
    topMoneyPattern: BehaviorPattern | null;
  } {
    const moneyPatterns = this.getMoneyMakingPatterns();
    
    return {
      totalSignals: this.state.totalSignalsProcessed,
      totalPatterns: this.state.totalPatternsDiscovered,
      totalMemories: this.state.livingMemories.length,
      moneyLessons: this.state.moneyLessonsLearned,
      failureAssets: this.state.livingMemories.filter(m => m.isFailure).length,
      topMoneyPattern: moneyPatterns[0] || null,
    };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const socialLearningEngine = new SocialLearningEngine();
