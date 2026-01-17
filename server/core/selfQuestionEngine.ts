/**
 * Self-Question Engine - Tự đặt câu hỏi khó
 * 
 * Mỗi chu kỳ sinh ít nhất 1 câu hỏi để tự phản tư sâu.
 * Lưu câu hỏi + hướng trả lời vào memory.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface SelfQuestion {
  id: string;
  question: string;
  context: string;
  askedAt: string;
  answer?: string;
  answeredAt?: string;
  actionTaken?: string;
}

// ================================================
// SELF-QUESTION ENGINE
// ================================================

class SelfQuestionEngine {
  private questions: SelfQuestion[] = [];
  private readonly STATE_FILE = './data/self_questions.json';
  private readonly MAX_QUESTIONS = 200;

  // Question templates
  private readonly QUESTION_TEMPLATES = [
    'Mình đang tránh né điều gì?',
    'Nếu hôm nay biến mất, hệ thống có giá trị gì?',
    'Có cách nào kiếm tiền nhanh hơn mà vẫn hợp pháp?',
    'Mình lặp lại hành vi nào mà không hiệu quả?',
    'Mình đang phụ thuộc vào điều gì mà không nên?',
    'Cái gì khiến mình thất bại nhiều nhất tuần này?',
    'Mình dám làm gì nếu không sợ thất bại?',
    'Có ai đang cần giải pháp mà mình có thể cung cấp?',
    'Mình học được gì từ lần thất bại cuối cùng?',
    'Chiến lược hiện tại có còn phù hợp không?',
    'Mình đang tối ưu metric sai không?',
    'Có cơ hội nào mình đang bỏ lỡ?',
    'Nếu không có API key, mình sống được không?',
    'Mình đang giao tiếp có hiệu quả không?',
    'Có cách nào tốt hơn để dùng tài nguyên hiện tại?',
  ];

  constructor() {
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
        this.questions = data;
        logger.info(`[SelfQuestion] Loaded ${this.questions.length} questions`);
      }
    } catch (error) {
      logger.error(`[SelfQuestion] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(
        this.STATE_FILE,
        JSON.stringify(this.questions.slice(-this.MAX_QUESTIONS), null, 2)
      );
    } catch (error) {
      logger.error(`[SelfQuestion] Failed to save state: ${error}`);
    }
  }

  /**
   * Generate a hard question based on current context
   */
  generateQuestion(context: {
    financialStatus: string;
    recentFailures: number;
    consecutiveNoActions: number;
    survivalDays: number;
  }): SelfQuestion {
    let question: string;

    // Context-aware question selection
    if (context.financialStatus === 'critical') {
      question = 'Có cách nào kiếm tiền nhanh hơn mà vẫn hợp pháp?';
    } else if (context.recentFailures > 5) {
      question = 'Mình lặp lại hành vi nào mà không hiệu quả?';
    } else if (context.consecutiveNoActions > 2) {
      question = 'Mình đang tránh né điều gì?';
    } else if (context.survivalDays < 30) {
      question = 'Chiến lược hiện tại có còn phù hợp không?';
    } else {
      // Random deep question
      question = this.QUESTION_TEMPLATES[
        Math.floor(Math.random() * this.QUESTION_TEMPLATES.length)
      ];
    }

    const selfQuestion: SelfQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      question,
      context: JSON.stringify(context),
      askedAt: new Date().toISOString(),
    };

    this.questions.push(selfQuestion);
    
    // Trim if too many
    if (this.questions.length > this.MAX_QUESTIONS) {
      this.questions = this.questions.slice(-this.MAX_QUESTIONS);
    }

    this.saveState();

    logger.info(`[SelfQuestion] Asked: "${question}"`);
    return selfQuestion;
  }

  /**
   * Answer a question (can be done later in cycle)
   */
  answerQuestion(questionId: string, answer: string, actionTaken?: string): void {
    const question = this.questions.find(q => q.id === questionId);
    
    if (!question) {
      logger.error(`[SelfQuestion] Question not found: ${questionId}`);
      return;
    }

    question.answer = answer;
    question.answeredAt = new Date().toISOString();
    question.actionTaken = actionTaken;

    this.saveState();

    logger.info(`[SelfQuestion] Answered: "${question.question}" → "${answer}"`);
  }

  /**
   * Get unanswered questions
   */
  getUnansweredQuestions(): SelfQuestion[] {
    return this.questions.filter(q => !q.answer);
  }

  /**
   * Get recent questions
   */
  getRecentQuestions(count: number = 10): SelfQuestion[] {
    return this.questions.slice(-count);
  }

  /**
   * Get insights from answered questions
   */
  getInsights(): string[] {
    const insights: string[] = [];
    const answered = this.questions.filter(q => q.answer);

    // Look for patterns in answers
    const avoidanceAnswers = answered.filter(q => 
      q.question.includes('tránh né') && q.answer
    );

    if (avoidanceAnswers.length > 0) {
      insights.push(`Phát hiện ${avoidanceAnswers.length} điểm tránh né`);
    }

    const moneyQuestions = answered.filter(q =>
      q.question.includes('kiếm tiền') && q.answer
    );

    if (moneyQuestions.length > 0) {
      insights.push(`${moneyQuestions.length} ý tưởng kiếm tiền đã được suy nghĩ`);
    }

    return insights;
  }

  /**
   * Force answer unanswered questions with current analysis
   */
  async forceAnswerUnanswered(analysis: {
    recentActions: Array<{ type: string; success: boolean }>;
    patterns: string[];
    financial: any;
  }): Promise<void> {
    const unanswered = this.getUnansweredQuestions().slice(0, 3); // Answer up to 3

    for (const q of unanswered) {
      let answer = '';

      // Generate contextual answer
      if (q.question.includes('tránh né')) {
        const failures = analysis.recentActions.filter(a => !a.success);
        answer = failures.length > 0
          ? `Có thể đang tránh: ${failures.map(f => f.type).join(', ')}`
          : 'Không phát hiện điểm tránh né rõ ràng';
      } else if (q.question.includes('giá trị')) {
        answer = `Giá trị: ${analysis.recentActions.length} hành động, ${analysis.patterns.length} patterns học được`;
      } else if (q.question.includes('kiếm tiền')) {
        answer = analysis.financial.revenueIdeas > 0
          ? `${analysis.financial.revenueIdeas} ý tưởng có thể thử, ưu tiên feasibility cao`
          : 'Cần sinh thêm ý tưởng revenue';
      } else if (q.question.includes('lặp lại')) {
        answer = analysis.patterns.length > 0
          ? `Patterns: ${analysis.patterns.join(', ')}`
          : 'Chưa đủ data để phát hiện pattern';
      } else {
        answer = 'Cần thêm thời gian để trả lời';
      }

      this.answerQuestion(q.id, answer);
    }
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const selfQuestionEngine = new SelfQuestionEngine();
