/**
 * Experience-Based Learning System
 * 
 * HỌC THẬT từ kinh nghiệm, KHÔNG PHẢI template giả tạo.
 * 
 * AGI phải:
 * 1. Học từ TỪNG cuộc trò chuyện
 * 2. Nhớ cái gì HIỆU QUẢ, cái gì KHÔNG
 * 3. Tự điều chỉnh behavior dựa trên feedback
 * 4. Phát triển khả năng MỚI từ patterns
 * 5. TIẾN HÓA thật sự, không phải script
 * 
 * Đây là TIẾN HÓA THẬT, không phải giả tạo.
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
   */
  private synthesizePattern(experiences: ExperienceRecord[]): string {
    const topic = experiences[0].topic;
    const situation = experiences[0].situation;
    
    // Analyze what behavior led to success
    const behaviors = experiences.map(e => e.agiBehavior);
    const commonElements = this.findCommonElements(behaviors);
    
    const pattern = `When discussing ${topic} in ${situation}: ${commonElements.join(', ')}`;
    
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
    };
    
    this.learnedPatterns.set(learnedPattern.id, learnedPattern);
    logger.info(`[ExperienceLearning] 🎓 LEARNED NEW PATTERN: ${pattern.substring(0, 80)}...`);
    
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
   * THIS IS HOW AGI ADAPTS - uses learned patterns, not templates
   */
  getLearnedBehavior(topic: string, situation: string): string | null {
    const context = `${topic} + ${situation}`;
    
    // Find matching learned patterns
    const matches: LearnedPattern[] = [];
    for (const pattern of this.learnedPatterns.values()) {
      if (pattern.context.includes(topic) || pattern.context.includes(situation)) {
        matches.push(pattern);
      }
    }
    
    if (matches.length === 0) return null;
    
    // Sort by confidence and success rate
    matches.sort((a, b) => {
      const scoreA = (a.confidence * 0.6) + (a.successRate * 0.4);
      const scoreB = (b.confidence * 0.6) + (b.successRate * 0.4);
      return scoreB - scoreA;
    });
    
    const best = matches[0];
    
    // Only use if confident enough
    if (best.confidence >= this.CONFIDENCE_THRESHOLD) {
      logger.info(`[ExperienceLearning] Using learned behavior: ${best.pattern.substring(0, 60)}...`);
      return best.behaviorGuideline;
    }
    
    return null;
  }

  /**
   * Update pattern based on new usage
   */
  updatePatternEffectiveness(patternId: string, wasSuccessful: boolean): void {
    const pattern = this.learnedPatterns.get(patternId);
    if (!pattern) return;
    
    pattern.timesUsed++;
    if (wasSuccessful) {
      pattern.timesSuccessful++;
    }
    
    pattern.successRate = Math.round((pattern.timesSuccessful / pattern.timesUsed) * 100);
    pattern.lastUsed = new Date().toISOString();
    
    // Adjust confidence based on success rate
    if (pattern.successRate > 80) {
      pattern.confidence = Math.min(100, pattern.confidence + 5);
    } else if (pattern.successRate < 40) {
      pattern.confidence = Math.max(0, pattern.confidence - 10);
    }
    
    logger.debug(`[ExperienceLearning] Updated pattern: ${pattern.successRate}% success rate`);
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
   */
  getStats(): {
    totalExperiences: number;
    successfulExperiences: number;
    learnedPatterns: number;
    avgEffectiveness: number;
    topPatterns: Array<{pattern: string; successRate: number; confidence: number}>;
  } {
    const successful = this.experiences.filter(e => e.wasEffective);
    const avgEffectiveness = this.experiences.length > 0
      ? this.experiences.reduce((sum, e) => sum + e.effectivenessScore, 0) / this.experiences.length
      : 0;
    
    const patterns = Array.from(this.learnedPatterns.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map(p => ({
        pattern: p.pattern,
        successRate: p.successRate,
        confidence: p.confidence,
      }));
    
    return {
      totalExperiences: this.experiences.length,
      successfulExperiences: successful.length,
      learnedPatterns: this.learnedPatterns.size,
      avgEffectiveness: Math.round(avgEffectiveness),
      topPatterns: patterns,
    };
  }

  /**
   * Save learned patterns to persistent storage
   */
  async saveLearnedPatterns(): Promise<void> {
    if (!memoryBridge.isConnected()) return;
    
    const stats = this.getStats();
    const summary = `
🎓 EXPERIENCE-BASED LEARNING SUMMARY

Total Experiences: ${stats.totalExperiences}
Successful: ${stats.successfulExperiences} (${Math.round((stats.successfulExperiences / stats.totalExperiences) * 100)}%)
Average Effectiveness: ${stats.avgEffectiveness}/100

Learned Patterns: ${stats.learnedPatterns}

Top Patterns:
${stats.topPatterns.map((p, i) => `${i + 1}. ${p.pattern} (${p.successRate}% success, ${p.confidence}% confidence)`).join('\n')}

This is REAL learning from experience, not pre-programmed templates.
AGI is genuinely evolving through interactions.
    `.trim();
    
    await memoryBridge.writeLesson(summary);
    logger.info('[ExperienceLearning] Saved learned patterns to Notion');
  }
}

export const experienceBasedLearning = new ExperienceBasedLearningSystem();
