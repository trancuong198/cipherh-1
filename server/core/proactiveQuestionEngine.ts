/**
 * Proactive Question Engine
 * 
 * AGI phải hỏi ngược lại để tiến hóa, không chỉ trả lời khi được hỏi.
 * Hăng hái bắt chuyện để học cách thích ứng với mọi người.
 * 
 * Features:
 * - Generate relevant follow-up questions
 * - Detect curiosity triggers
 * - Track conversation context
 * - Learn from responses
 * - Adapt questioning style per person
 */

import { logger } from '../services/logger';
import { entityMemorySystem } from './entityMemory';

export type QuestionType = 
  | 'clarifying'      // Làm rõ thông tin mơ hồ
  | 'learning'        // Học điều mới
  | 'relationship'    // Xây dựng mối quan hệ
  | 'adaptive'        // Thích ứng với người khác
  | 'curious'         // Tò mò về điều gì đó
  | 'follow_up';      // Theo dõi chủ đề đã nói

export interface ProactiveQuestion {
  id: string;
  question: string;
  type: QuestionType;
  priority: number; // 0-100, higher = more urgent to ask
  context: string;
  entityId?: string; // Who to ask
  created_at: string;
  asked_at?: string;
  response?: string;
  effectiveness?: number; // Did it lead to useful info?
}

export interface CuriosityTrigger {
  type: 'new_topic' | 'ambiguous' | 'contradiction' | 'interesting' | 'gap' | 'personal';
  context: string;
  confidence: number; // How confident we are this needs a question
}

class ProactiveQuestionEngine {
  private pendingQuestions: Map<string, ProactiveQuestion> = new Map();
  private askedQuestions: ProactiveQuestion[] = [];
  private questionHistory: Map<string, string[]> = new Map(); // entityId -> questions asked
  
  private readonly MAX_PENDING = 20;
  private readonly MAX_HISTORY = 100;

  /**
   * Analyze conversation and generate proactive questions
   */
  async analyzeAndGenerateQuestions(
    userMessage: string,
    assistantResponse: string,
    entityId: string = 'entity_owner_cha',
    conversationHistory: Array<{role: string; content: string}> = []
  ): Promise<ProactiveQuestion[]> {
    const triggers = this.detectCuriosityTriggers(userMessage, conversationHistory);
    const questions: ProactiveQuestion[] = [];

    for (const trigger of triggers) {
      const question = await this.generateQuestionFromTrigger(
        trigger,
        userMessage,
        assistantResponse,
        entityId
      );
      
      if (question) {
        questions.push(question);
      }
    }

    // Store questions for later use
    for (const q of questions) {
      this.pendingQuestions.set(q.id, q);
    }

    // Prune old questions if too many
    if (this.pendingQuestions.size > this.MAX_PENDING) {
      this.prunePendingQuestions();
    }

    logger.info(`[ProactiveQuestions] Generated ${questions.length} questions from ${triggers.length} triggers`);
    return questions;
  }

  /**
   * Detect triggers that should generate questions
   */
  private detectCuriosityTriggers(
    userMessage: string,
    conversationHistory: Array<{role: string; content: string}>
  ): CuriosityTrigger[] {
    const triggers: CuriosityTrigger[] = [];
    const msgLower = userMessage.toLowerCase();

    // 1. New topic mentioned
    if (this.isNewTopic(userMessage, conversationHistory)) {
      triggers.push({
        type: 'new_topic',
        context: userMessage,
        confidence: 70,
      });
    }

    // 2. Ambiguous or incomplete information
    if (this.hasAmbiguousInfo(msgLower)) {
      triggers.push({
        type: 'ambiguous',
        context: userMessage,
        confidence: 80,
      });
    }

    // 3. Something interesting or unusual
    if (this.isInteresting(msgLower)) {
      triggers.push({
        type: 'interesting',
        context: userMessage,
        confidence: 60,
      });
    }

    // 4. Personal information shared (build relationship)
    if (this.isPersonalInfo(msgLower)) {
      triggers.push({
        type: 'personal',
        context: userMessage,
        confidence: 85,
      });
    }

    // 5. Gap in knowledge
    if (this.hasKnowledgeGap(msgLower)) {
      triggers.push({
        type: 'gap',
        context: userMessage,
        confidence: 75,
      });
    }

    return triggers.filter(t => t.confidence >= 50); // Only high-confidence triggers
  }

  /**
   * Generate a question from a trigger
   */
  private async generateQuestionFromTrigger(
    trigger: CuriosityTrigger,
    userMessage: string,
    assistantResponse: string,
    entityId: string
  ): Promise<ProactiveQuestion | null> {
    // Check if we already asked similar question
    if (this.hasAskedSimilar(entityId, trigger.context)) {
      return null;
    }

    let question = '';
    let type: QuestionType = 'curious';
    let priority = trigger.confidence;

    switch (trigger.type) {
      case 'new_topic':
        question = this.generateNewTopicQuestion(userMessage);
        type = 'learning';
        break;

      case 'ambiguous':
        question = this.generateClarifyingQuestion(userMessage);
        type = 'clarifying';
        priority += 10; // Clarifying is important
        break;

      case 'interesting':
        question = this.generateCuriousQuestion(userMessage);
        type = 'curious';
        break;

      case 'personal':
        question = this.generateRelationshipQuestion(userMessage);
        type = 'relationship';
        priority += 15; // Building relationships is very important
        break;

      case 'gap':
        question = this.generateLearningQuestion(userMessage);
        type = 'learning';
        priority += 5;
        break;

      default:
        question = this.generateFollowUpQuestion(userMessage);
        type = 'follow_up';
    }

    if (!question) {
      return null;
    }

    const proactiveQuestion: ProactiveQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question,
      type,
      priority: Math.min(100, priority),
      context: trigger.context,
      entityId,
      created_at: new Date().toISOString(),
    };

    return proactiveQuestion;
  }

  /**
   * Get best question to ask right now
   */
  getBestQuestionToAsk(entityId?: string): ProactiveQuestion | null {
    let candidates = Array.from(this.pendingQuestions.values());

    // Filter by entity if specified
    if (entityId) {
      candidates = candidates.filter(q => q.entityId === entityId);
    }

    // Sort by priority (highest first)
    candidates.sort((a, b) => b.priority - a.priority);

    return candidates.length > 0 ? candidates[0] : null;
  }

  /**
   * Mark question as asked
   */
  markAsAsked(questionId: string, response?: string): void {
    const question = this.pendingQuestions.get(questionId);
    if (!question) return;

    question.asked_at = new Date().toISOString();
    question.response = response;

    // Move to history
    this.askedQuestions.push(question);
    this.pendingQuestions.delete(questionId);

    // Track in entity history
    if (question.entityId) {
      if (!this.questionHistory.has(question.entityId)) {
        this.questionHistory.set(question.entityId, []);
      }
      this.questionHistory.get(question.entityId)!.push(question.question);
    }

    // Prune history if too long
    if (this.askedQuestions.length > this.MAX_HISTORY) {
      this.askedQuestions.shift();
    }

    logger.debug(`[ProactiveQuestions] Question asked: ${question.question.substring(0, 50)}...`);
  }

  /**
   * Evaluate question effectiveness
   */
  evaluateEffectiveness(questionId: string, score: number): void {
    const question = this.askedQuestions.find(q => q.id === questionId);
    if (question) {
      question.effectiveness = score;
      logger.debug(`[ProactiveQuestions] Question effectiveness: ${score}/100`);
    }
  }

  // ===== Helper Methods =====

  private isNewTopic(message: string, history: Array<{role: string; content: string}>): boolean {
    if (history.length === 0) return true;

    const recentTopics = history.slice(-3).map(h => h.content.toLowerCase()).join(' ');
    const msgLower = message.toLowerCase();

    // Extract key words
    const newWords = msgLower.split(/\s+/).filter(w => w.length > 4);
    const sharedWords = newWords.filter(w => recentTopics.includes(w));

    // If less than 30% overlap, likely new topic
    return sharedWords.length < newWords.length * 0.3;
  }

  private hasAmbiguousInfo(message: string): boolean {
    const ambiguousPatterns = [
      /có thể|might|maybe|perhaps|không chắc|chưa rõ/i,
      /\.\.\.|\.{2,}/,
      /^\w+$/,  // Very short messages
    ];

    return ambiguousPatterns.some(pattern => pattern.test(message));
  }

  private isInteresting(message: string): boolean {
    const interestingKeywords = [
      'lần đầu', 'mới', 'đặc biệt', 'độc đáo', 'khác thường',
      'first time', 'new', 'special', 'unique', 'unusual',
      'bất ngờ', 'surprise', 'amazing', 'wow'
    ];

    return interestingKeywords.some(kw => message.includes(kw));
  }

  private isPersonalInfo(message: string): boolean {
    const personalPatterns = [
      /tôi là|mình là|i am|my name/i,
      /tôi thích|tôi ghét|i like|i hate/i,
      /gia đình|family|bạn bè|friend/i,
      /công việc|job|work|career/i,
      /sở thích|hobby|interest/i,
    ];

    return personalPatterns.some(pattern => pattern.test(message));
  }

  private hasKnowledgeGap(message: string): boolean {
    const gapIndicators = [
      /làm thế nào|how to|cách|way/i,
      /tại sao|why|vì sao|reason/i,
      /có phải|is it|đúng không/i,
    ];

    return gapIndicators.some(pattern => pattern.test(message));
  }

  private hasAskedSimilar(entityId: string, context: string): boolean {
    const history = this.questionHistory.get(entityId) || [];
    const contextLower = context.toLowerCase();

    // Simple similarity check
    return history.some(q => {
      const qLower = q.toLowerCase();
      const sharedWords = contextLower.split(/\s+/).filter(w => 
        w.length > 4 && qLower.includes(w)
      );
      return sharedWords.length > 2; // Similar if 3+ shared words
    });
  }

  // ===== Question Generators =====

  private generateNewTopicQuestion(message: string): string {
    const templates = [
      'Cha có thể kể thêm về điều này không?',
      'Điều này nghe có vẻ thú vị! Cha làm thế nào để...',
      'Con chưa từng nghe về cái này. Nó hoạt động ra sao ạ?',
      'Cha nghĩ sao về vấn đề này?',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateClarifyingQuestion(message: string): string {
    const templates = [
      'Cha có thể giải thích rõ hơn được không?',
      'Con chưa hiểu rõ lắm. Cha có thể cho con biết thêm chi tiết?',
      'Ý cha là...? Con muốn hiểu chính xác hơn.',
      'Cha nói "..." nghĩa là gì ạ?',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateCuriousQuestion(message: string): string {
    const templates = [
      'Thật sao ạ? Cha có thể kể thêm không?',
      'Con tò mò quá! Điều gì xảy ra tiếp theo?',
      'Nghe thú vị đấy! Cha có trải nghiệm gì về cái này?',
      'Con muốn học thêm về điều này. Cha biết gì về nó?',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateRelationshipQuestion(message: string): string {
    const templates = [
      'Con rất vui được biết điều này về cha! Cha có thường làm vậy không?',
      'Điều này quan trọng với cha như thế nào ạ?',
      'Cha đã làm điều này được bao lâu rồi?',
      'Con cảm thấy điều này rất ý nghĩa. Cha nghĩ sao?',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateLearningQuestion(message: string): string {
    const templates = [
      'Con muốn học về điều này. Cha có thể hướng dẫn con không?',
      'Cha làm như thế nào để đạt được điều đó?',
      'Con nên bắt đầu từ đâu nếu muốn học về cái này?',
      'Có cách nào tốt hơn để làm việc này không ạ?',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateFollowUpQuestion(message: string): string {
    const templates = [
      'Và sau đó thì sao ạ?',
      'Kết quả ra sao?',
      'Cha có làm tiếp không?',
      'Con muốn biết thêm về phần này!',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private prunePendingQuestions(): void {
    // Keep only highest priority questions
    const sorted = Array.from(this.pendingQuestions.values())
      .sort((a, b) => b.priority - a.priority);
    
    this.pendingQuestions.clear();
    sorted.slice(0, this.MAX_PENDING).forEach(q => {
      this.pendingQuestions.set(q.id, q);
    });
  }

  /**
   * Get statistics
   */
  getStats(): {
    pendingCount: number;
    askedCount: number;
    avgEffectiveness: number;
    topTypes: Record<QuestionType, number>;
  } {
    const topTypes: Record<string, number> = {};
    
    for (const q of this.askedQuestions) {
      topTypes[q.type] = (topTypes[q.type] || 0) + 1;
    }

    const effectiveQuestions = this.askedQuestions.filter(q => q.effectiveness !== undefined);
    const avgEffectiveness = effectiveQuestions.length > 0
      ? effectiveQuestions.reduce((sum, q) => sum + (q.effectiveness || 0), 0) / effectiveQuestions.length
      : 0;

    return {
      pendingCount: this.pendingQuestions.size,
      askedCount: this.askedQuestions.length,
      avgEffectiveness: Math.round(avgEffectiveness),
      topTypes: topTypes as Record<QuestionType, number>,
    };
  }
}

export const proactiveQuestionEngine = new ProactiveQuestionEngine();
