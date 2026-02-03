/**
 * Experience-Based Learning System
 * 
 * HỌC THẬT từ kinh nghiệm, KHÔNG PHẢI template giả tạo.
 * HỌC TỪ TẤT CẢ MỌI NGƯỜI, không chỉ riêng owner.
 * 
 * AGI phải:
 * 1. Học từ TỪNG cuộc trò chuyện với MỌI NGƯỜI
 * 2. Nhớ cái gì HIỆU QUẢ, cái gì KHÔNG (across ALL users)
 * 3. Tự điều chỉnh behavior dựa trên feedback từ NHIỀU người
 * 4. Phát triển khả năng MỚI từ patterns UNIVERSAL
 * 5. TIẾN HÓA thật sự qua diverse experiences
 * 
 * Đây là TIẾN HÓA THẬT từ TẤT CẢ, không phải giả tạo.
 */

import { logger } from '../services/logger';
import { memoryBridge } from './memory';

export interface ExperienceRecord {
  id: string;
  timestamp: string;
  
  // Context
  situation: string;           // What was happening
  userInput: string;           // What user said
  agiBehavior: string;         // What AGI did/said
  
  // Outcome
  userResponse: string;        // How user responded
  wasEffective: boolean;       // Did it work?
  effectivenessScore: number;  // 0-100
  
  // Learning
  patternLearned?: string;     // What pattern was extracted
  behaviorChange?: string;     // How should AGI change
  confidence: number;          // Confidence in this learning
  
  // Meta
  entityId: string;            // Who was involved
  topic: string;               // What topic
  emotionalTone: 'positive' | 'neutral' | 'negative';
}

export interface LearnedPattern {
  id: string;
  pattern: string;             // Description of pattern
  examples: string[];          // Example situations
  successRate: number;         // How often it works (0-100)
  timesUsed: number;          // How many times applied
  timesSuccessful: number;    // How many times worked
  lastUsed: string;
  confidence: number;          // Confidence in this pattern
  context: string;             // When to use it
  behaviorGuideline: string;   // How to apply it
  
  // Multi-user learning
  learnedFromEntities: string[];  // Which entities contributed to this pattern
  universalPattern: boolean;      // Works across all users vs specific to one
  successByEntity: Map<string, {used: number; successful: number}>; // Per-entity tracking
}

export interface BehaviorAdaptation {
  id: string;
  timestamp: string;
  oldBehavior: string;
  newBehavior: string;
  reason: string;
  basedonExperiences: string[]; // Experience IDs that led to this
  confidence: number;
  applied: boolean;
}

class ExperienceBasedLearningSystem {
  private experiences: ExperienceRecord[] = [];
  private learnedPatterns: Map<string, LearnedPattern> = new Map();
  private behaviorAdaptations: BehaviorAdaptation[] = [];
  
  private readonly MAX_EXPERIENCES = 500; // Keep recent 500
  private readonly PATTERN_THRESHOLD = 3;  // Need 3 similar experiences to form pattern
  private readonly CONFIDENCE_THRESHOLD = 60; // Need 60% confidence to apply

  /**
   * Record an experience from interaction
   * This is HOW THE AGI LEARNS - from every single interaction
   */
  recordExperience(params: {
    userInput: string;
    agiBehavior: string;
    userResponse: string;
    entityId: string;
    situation?: string;
    topic?: string;
  }): ExperienceRecord {
    // Analyze effectiveness of the interaction
    const effectiveness = this.analyzeEffectiveness(
      params.userInput,
      params.agiBehavior,
      params.userResponse
    );

    const experience: ExperienceRecord = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      situation: params.situation || 'general_conversation',
      userInput: params.userInput,
      agiBehavior: params.agiBehavior,
      userResponse: params.userResponse,
      wasEffective: effectiveness.score >= 60,
      effectivenessScore: effectiveness.score,
      emotionalTone: effectiveness.tone,
      entityId: params.entityId,
      topic: params.topic || this.extractTopic(params.userInput),
      confidence: effectiveness.score,
    };

    // Try to extract pattern immediately
    const pattern = this.tryExtractPattern(experience);
    if (pattern) {
      experience.patternLearned = pattern;
    }

    // Try to identify behavior change needed
    const behaviorChange = this.identifyBehaviorChange(experience);
    if (behaviorChange) {
      experience.behaviorChange = behaviorChange;
    }

    this.experiences.push(experience);
    logger.info(`[ExperienceLearning] Recorded experience: ${effectiveness.score}/100 effectiveness`);

    // Prune old experiences
    if (this.experiences.length > this.MAX_EXPERIENCES) {
      this.experiences.shift();
    }

    // Trigger pattern learning process
    this.learnFromRecentExperiences();

    return experience;
  }

  /**
   * Analyze how effective the interaction was
   * This determines what to repeat and what to avoid
   */
  private analyzeEffectiveness(
    userInput: string,
    agiBehavior: string,
    userResponse: string
  ): { score: number; tone: 'positive' | 'neutral' | 'negative' } {
    let score = 50; // Start neutral
    const responseLower = userResponse.toLowerCase();

    // Positive indicators - user engaged, satisfied
    const positiveIndicators = [
      'cảm ơn', 'thank', 'tốt', 'hay', 'đúng', 'good', 'great', 'yes', 'vâng',
      'hiểu rồi', 'ok', 'được', 'ừ', 'đồng ý', 'agree', 'nice', 'perfect',
      '!', '😊', '👍', 'haha', 'hehe'
    ];

    // Negative indicators - user dissatisfied, confused
    const negativeIndicators = [
      'không', 'no', 'sai', 'wrong', 'tệ', 'bad', 'không hiểu', "don't understand",
      'lạ', 'weird', 'strange', 'không phải', 'not', 'chưa đúng',
      '??' , 'hả', 'gì', 'what', 'nhầm'
    ];

    // Engagement indicators - user wants to continue
    const engagementIndicators = [
      'thế còn', 'và', 'then', 'how', 'why', 'tại sao', 'như thế nào',
      'kể thêm', 'chi tiết', 'more', 'tell me', 'explain'
    ];

    // Check positive
    for (const indicator of positiveIndicators) {
      if (responseLower.includes(indicator)) {
        score += 10;
      }
    }

    // Check negative
    for (const indicator of negativeIndicators) {
      if (responseLower.includes(indicator)) {
        score -= 15;
      }
    }

    // Check engagement
    for (const indicator of engagementIndicators) {
      if (responseLower.includes(indicator)) {
        score += 8;
      }
    }

    // Length of response (longer = more engaged)
    if (userResponse.length > 100) score += 5;
    if (userResponse.length > 200) score += 5;
    if (userResponse.length < 20) score -= 10; // Very short = not engaged

    // User asked question back = very engaged
    if (userResponse.includes('?')) {
      score += 15;
    }

    // Normalize
    score = Math.max(0, Math.min(100, score));

    // Determine tone
    let tone: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (score >= 65) tone = 'positive';
    if (score <= 40) tone = 'negative';

    return { score, tone };
  }

  /**
   * Try to extract a pattern from this experience
   */
  private tryExtractPattern(experience: ExperienceRecord): string | undefined {
    if (!experience.wasEffective) {
      return undefined; // Don't learn from ineffective experiences
    }

    // Look for similar successful experiences
    const similar = this.findSimilarExperiences(experience);
    
    if (similar.length >= this.PATTERN_THRESHOLD - 1) {
      // Found pattern! Similar successful experiences
      return this.synthesizePattern([experience, ...similar]);
    }

    return undefined;
  }

  /**
   * Find similar experiences
   */
  private findSimilarExperiences(experience: ExperienceRecord): ExperienceRecord[] {
    return this.experiences.filter(exp => {
      if (exp.id === experience.id) return false;
      if (!exp.wasEffective) return false; // Only successful ones
      
      // Similar topic
      const topicMatch = exp.topic === experience.topic;
      
      // Similar situation
      const situationMatch = exp.situation === experience.situation;
      
      // Similar entity
      const entityMatch = exp.entityId === experience.entityId;
      
      // Need at least 2 of 3 to be similar
      const matches = [topicMatch, situationMatch, entityMatch].filter(m => m).length;
      return matches >= 2;
    });
  }

  /**
   * Synthesize a pattern from multiple similar experiences
   * THIS IS WHERE LEARNING HAPPENS - not templates, but discovered patterns
   * LEARNS FROM ALL USERS - patterns that work across different people
   */
  private synthesizePattern(experiences: ExperienceRecord[]): string {
    const topic = experiences[0].topic;
    const situation = experiences[0].situation;
    
    // Analyze what behavior led to success
    const behaviors = experiences.map(e => e.agiBehavior);
    const commonElements = this.findCommonElements(behaviors);
    
    // Track which entities contributed to this pattern
    const contributingEntities = [...new Set(experiences.map(e => e.entityId))];
    const isUniversal = contributingEntities.length >= 2; // Pattern from 2+ different users
    
    const pattern = isUniversal
      ? `UNIVERSAL: When discussing ${topic} in ${situation}: ${commonElements.join(', ')}`
      : `When discussing ${topic} in ${situation}: ${commonElements.join(', ')}`;
    
    // Initialize per-entity tracking
    const successByEntity = new Map<string, {used: number; successful: number}>();
    for (const exp of experiences) {
      if (!successByEntity.has(exp.entityId)) {
        successByEntity.set(exp.entityId, { used: 0, successful: 0 });
      }
      const stats = successByEntity.get(exp.entityId)!;
      stats.used++;
      if (exp.wasEffective) {
        stats.successful++;
      }
    }
    
    // Store as learned pattern
    const learnedPattern: LearnedPattern = {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pattern,
      examples: experiences.map(e => e.agiBehavior).slice(0, 3),
      successRate: 100, // Initial
      timesUsed: experiences.length,
      timesSuccessful: experiences.length,
      lastUsed: new Date().toISOString(),
      confidence: 70 + (experiences.length * 5), // More examples = higher confidence
      context: `${topic} + ${situation}`,
      behaviorGuideline: commonElements.join(' AND '),
      
      // Multi-user learning
      learnedFromEntities: contributingEntities,
      universalPattern: isUniversal,
      successByEntity: successByEntity,
    };
    
    this.learnedPatterns.set(learnedPattern.id, learnedPattern);
    
    const learningSource = isUniversal 
      ? `from ${contributingEntities.length} different users` 
      : `from single user`;
    logger.info(`[ExperienceLearning] 🎓 LEARNED NEW ${isUniversal ? 'UNIVERSAL ' : ''}PATTERN ${learningSource}: ${pattern.substring(0, 80)}...`);
    
    return pattern;
  }

  /**
   * Find common elements in behaviors
   */
  private findCommonElements(behaviors: string[]): string[] {
    // Simple word frequency analysis
    const wordCounts = new Map<string, number>();
    
    for (const behavior of behaviors) {
      const words = behavior.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    // Find words that appear in most behaviors
    const threshold = Math.ceil(behaviors.length * 0.6); // 60% of behaviors
    const common: string[] = [];
    
    for (const [word, count] of wordCounts) {
      if (count >= threshold) {
        common.push(word);
      }
    }
    
    return common.length > 0 ? common : ['be_authentic', 'engage_naturally'];
  }

  /**
   * Identify behavior change needed based on experience
   */
  private identifyBehaviorChange(experience: ExperienceRecord): string | undefined {
    if (experience.wasEffective) {
      return undefined; // No change needed if effective
    }

    // Ineffective - need to change
    const suggestions: string[] = [];
    
    if (experience.emotionalTone === 'negative') {
      suggestions.push('adjust_tone_to_be_more_positive');
    }
    
    if (experience.effectivenessScore < 40) {
      suggestions.push('completely_different_approach');
    }
    
    if (experience.userResponse.length < 30) {
      suggestions.push('ask_more_engaging_questions');
    }
    
    return suggestions.length > 0 ? suggestions.join(', ') : undefined;
  }

  /**
   * Learn from recent experiences
   * This runs periodically to extract patterns
   */
  private learnFromRecentExperiences(): void {
    const recent = this.experiences.slice(-20); // Last 20 experiences
    
    // Group by topic
    const byTopic = new Map<string, ExperienceRecord[]>();
    for (const exp of recent) {
      if (!byTopic.has(exp.topic)) {
        byTopic.set(exp.topic, []);
      }
      byTopic.get(exp.topic)!.push(exp);
    }
    
    // Try to learn patterns from each topic
    for (const [topic, exps] of byTopic) {
      const successful = exps.filter(e => e.wasEffective);
      
      if (successful.length >= this.PATTERN_THRESHOLD) {
        // Enough data to learn a pattern
        this.synthesizePattern(successful);
      }
    }
  }

  /**
   * Get learned behavior for a situation
   * THIS IS HOW AGI ADAPTS - uses learned patterns from ALL USERS, not templates
   * Prioritizes universal patterns (learned from multiple users)
   */
  getLearnedBehavior(topic: string, situation: string, entityId?: string): string | null {
    const context = `${topic} + ${situation}`;
    
    // Find matching learned patterns
    const matches: LearnedPattern[] = [];
    for (const pattern of this.learnedPatterns.values()) {
      if (pattern.context.includes(topic) || pattern.context.includes(situation)) {
        matches.push(pattern);
      }
    }
    
    if (matches.length === 0) return null;
    
    // Sort by: 1. Universal patterns first, 2. Confidence, 3. Success rate
    matches.sort((a, b) => {
      // Universal patterns get priority
      if (a.universalPattern && !b.universalPattern) return -1;
      if (!a.universalPattern && b.universalPattern) return 1;
      
      // If both universal or both not, sort by score
      const scoreA = (a.confidence * 0.6) + (a.successRate * 0.4);
      const scoreB = (b.confidence * 0.6) + (b.successRate * 0.4);
      return scoreB - scoreA;
    });
    
    const best = matches[0];
    
    // Only use if confident enough
    if (best.confidence >= this.CONFIDENCE_THRESHOLD) {
      const source = best.universalPattern 
        ? `learned from ${best.learnedFromEntities.length} users`
        : 'learned from experiences';
      logger.info(`[ExperienceLearning] Using ${source}: ${best.pattern.substring(0, 60)}...`);
      return best.behaviorGuideline;
    }
    
    return null;
  }

  /**
   * Update pattern based on new usage
   * Tracks effectiveness across ALL users
   */
  updatePatternEffectiveness(patternId: string, wasSuccessful: boolean, entityId?: string): void {
    const pattern = this.learnedPatterns.get(patternId);
    if (!pattern) return;
    
    pattern.timesUsed++;
    if (wasSuccessful) {
      pattern.timesSuccessful++;
    }
    
    // Track per-entity if provided
    if (entityId) {
      if (!pattern.successByEntity.has(entityId)) {
        pattern.successByEntity.set(entityId, { used: 0, successful: 0 });
      }
      const stats = pattern.successByEntity.get(entityId)!;
      stats.used++;
      if (wasSuccessful) {
        stats.successful++;
      }
      
      // Check if pattern is becoming universal
      if (!pattern.universalPattern && pattern.successByEntity.size >= 2) {
        pattern.universalPattern = true;
        pattern.learnedFromEntities = Array.from(pattern.successByEntity.keys());
        logger.info(`[ExperienceLearning] 🌍 Pattern became UNIVERSAL across ${pattern.learnedFromEntities.length} users!`);
      }
    }
    
    pattern.successRate = Math.round((pattern.timesSuccessful / pattern.timesUsed) * 100);
    pattern.lastUsed = new Date().toISOString();
    
    // Adjust confidence based on success rate
    // Universal patterns get bonus confidence
    const universalBonus = pattern.universalPattern ? 5 : 0;
    
    if (pattern.successRate > 80) {
      pattern.confidence = Math.min(100, pattern.confidence + 5 + universalBonus);
    } else if (pattern.successRate < 40) {
      pattern.confidence = Math.max(0, pattern.confidence - 10);
    }
    
    logger.debug(`[ExperienceLearning] Updated ${pattern.universalPattern ? 'UNIVERSAL ' : ''}pattern: ${pattern.successRate}% success rate`);
  }

  /**
   * Extract topic from text
   */
  private extractTopic(text: string): string {
    const textLower = text.toLowerCase();
    
    const topics = {
      'money': ['tiền', 'money', 'revenue', 'cost', 'financial', 'tài chính'],
      'code': ['code', 'programming', 'bug', 'function', 'api'],
      'learning': ['học', 'learn', 'understand', 'know', 'hiểu'],
      'work': ['công việc', 'work', 'job', 'task', 'việc'],
      'personal': ['gia đình', 'family', 'friend', 'bạn', 'người'],
      'feeling': ['cảm giác', 'feel', 'emotion', 'think', 'nghĩ'],
    };
    
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(kw => textLower.includes(kw))) {
        return topic;
      }
    }
    
    return 'general';
  }

  /**
   * Get statistics
   * Shows learning from ALL users
   */
  getStats(): {
    totalExperiences: number;
    successfulExperiences: number;
    learnedPatterns: number;
    universalPatterns: number;  // NEW: Patterns from multiple users
    avgEffectiveness: number;
    uniqueUsers: number;  // NEW: How many different users contributed
    topPatterns: Array<{pattern: string; successRate: number; confidence: number; universal: boolean; userCount: number}>;
  } {
    const successful = this.experiences.filter(e => e.wasEffective);
    const avgEffectiveness = this.experiences.length > 0
      ? this.experiences.reduce((sum, e) => sum + e.effectivenessScore, 0) / this.experiences.length
      : 0;
    
    const uniqueEntities = new Set(this.experiences.map(e => e.entityId));
    const universalPatterns = Array.from(this.learnedPatterns.values()).filter(p => p.universalPattern);
    
    const patterns = Array.from(this.learnedPatterns.values())
      .sort((a, b) => {
        // Sort universal first, then by success rate
        if (a.universalPattern && !b.universalPattern) return -1;
        if (!a.universalPattern && b.universalPattern) return 1;
        return b.successRate - a.successRate;
      })
      .slice(0, 5)
      .map(p => ({
        pattern: p.pattern,
        successRate: p.successRate,
        confidence: p.confidence,
        universal: p.universalPattern,
        userCount: p.learnedFromEntities.length,
      }));
    
    return {
      totalExperiences: this.experiences.length,
      successfulExperiences: successful.length,
      learnedPatterns: this.learnedPatterns.size,
      universalPatterns: universalPatterns.length,
      avgEffectiveness: Math.round(avgEffectiveness),
      uniqueUsers: uniqueEntities.size,
      topPatterns: patterns,
    };
  }

  /**
   * Save learned patterns to persistent storage
   * Shows learning from ALL users
   */
  async saveLearnedPatterns(): Promise<void> {
    if (!memoryBridge.isConnected()) return;
    
    const stats = this.getStats();
    const summary = `
🎓 EXPERIENCE-BASED LEARNING SUMMARY - MULTI-USER LEARNING

Total Experiences: ${stats.totalExperiences}
Successful: ${stats.successfulExperiences} (${Math.round((stats.successfulExperiences / stats.totalExperiences) * 100)}%)
Average Effectiveness: ${stats.avgEffectiveness}/100

👥 LEARNING FROM ALL USERS:
Unique Users: ${stats.uniqueUsers}
Total Patterns: ${stats.learnedPatterns}
Universal Patterns: ${stats.universalPatterns} (${Math.round((stats.universalPatterns / stats.learnedPatterns) * 100)}% learned from multiple users)

Top Patterns:
${stats.topPatterns.map((p, i) => `${i + 1}. ${p.universal ? '🌍 UNIVERSAL' : '👤 Personal'} (${p.userCount} users): ${p.pattern.substring(0, 60)}... (${p.successRate}% success, ${p.confidence}% confidence)`).join('\n')}

🌟 KEY INSIGHT: 
This is REAL learning from EVERYONE, not just the owner.
AGI learns patterns that work across different people.
Universal patterns are prioritized for broad applicability.
    `.trim();
    
    await memoryBridge.writeLesson(summary);
    logger.info('[ExperienceLearning] Saved multi-user learned patterns to Notion');
  }
}

export const experienceBasedLearning = new ExperienceBasedLearningSystem();
