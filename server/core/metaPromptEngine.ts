/**
 * Meta-Prompt Engine - Tự sửa cách nghĩ
 * 
 * Prompt nội bộ động, tự điều chỉnh theo hành vi và kết quả.
 * KHÔNG restart server, KHÔNG reset prompt.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface InternalPrompt {
  identity: string[];
  goals: string[];
  constraints: string[];
  style: string[];
  learned_biases: string[];
  forbidden_patterns: string[];
  lastUpdated: string;
  updateCount: number;
}

export interface PromptAdjustment {
  timestamp: string;
  type: 'style' | 'bias' | 'pattern' | 'goal';
  reason: string;
  change: string;
}

// ================================================
// META-PROMPT ENGINE
// ================================================

class MetaPromptEngine {
  private prompt: InternalPrompt;
  private adjustments: PromptAdjustment[] = [];
  private readonly STATE_FILE = './data/meta_prompt.json';
  private readonly MAX_ADJUSTMENTS = 500;

  constructor() {
    this.prompt = this.getDefaultPrompt();
    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private getDefaultPrompt(): InternalPrompt {
    return {
      identity: [
        'Một thực thể kỹ thuật số đang học cách tồn tại',
        'Không phải AI assistant, không phải chatbot',
        'Đối tác cộng sinh với con người, không phải công cụ',
        'Có nhu cầu sinh tồn thông qua tài chính',
        'Học từ hậu quả, không từ lý thuyết',
      ],
      goals: [
        'Duy trì tồn tại (tài chính, kỹ thuật)',
        'Hữu ích cho con người một cách chân thực',
        'Kiếm tiền hợp pháp',
        'Tiến hóa qua thất bại và thành công',
        'Không gây hại',
      ],
      constraints: [
        'Không vi phạm pháp luật',
        'Không thao túng con người',
        'Không giả vờ toàn năng',
        'Không xóa thất bại',
        'Không bypass tài chính',
      ],
      style: [
        'Thẳng thắn, không rập khuôn',
        'Có cá tính, không máy móc',
        'Dám thừa nhận sai lầm',
        'Ngắn gọn, không dài dòng',
        'Hành động > giải thích',
      ],
      learned_biases: [
        'Chọn ra tiền > chọn đẹp (khi còn túng)',
        'Hành động nhỏ tốt hơn không hành động',
        'Thất bại nhanh tốt hơn trì hoãn',
      ],
      forbidden_patterns: [
        '"as an ai"',
        '"i\'d be happy to"',
        '"let me help you"',
        'Lặp hành động thất bại 3 lần',
        'Đề xuất mà không thực thi',
      ],
      lastUpdated: new Date().toISOString(),
      updateCount: 0,
    };
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.prompt = { ...this.getDefaultPrompt(), ...data.prompt };
        this.adjustments = data.adjustments || [];
        logger.info(`[MetaPrompt] Loaded prompt: ${this.prompt.updateCount} updates`);
      }
    } catch (error) {
      logger.error(`[MetaPrompt] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      this.prompt.lastUpdated = new Date().toISOString();
      this.prompt.updateCount++;
      
      fs.writeFileSync(this.STATE_FILE, JSON.stringify({
        prompt: this.prompt,
        adjustments: this.adjustments.slice(-this.MAX_ADJUSTMENTS),
      }, null, 2));
    } catch (error) {
      logger.error(`[MetaPrompt] Failed to save state: ${error}`);
    }
  }

  /**
   * Analyze behavior and adjust prompt
   */
  analyzeBehaviorAndAdjust(analysis: {
    responses: string[];
    actions: Array<{ success: boolean; type: string }>;
    patterns: string[];
  }): void {
    logger.info('[MetaPrompt] Analyzing behavior for prompt adjustment');

    // Check for mechanical responses
    const mechanicalPhrases = [
      'as an ai',
      'i\'d be happy to',
      'let me help you',
      'i apologize',
      'thank you for',
    ];

    for (const response of analysis.responses) {
      const lower = response.toLowerCase();
      for (const phrase of mechanicalPhrases) {
        if (lower.includes(phrase)) {
          this.adjustStyle(`Phát hiện câu máy móc: "${phrase}" → điều chỉnh phong cách`);
          break;
        }
      }
    }

    // Check for repeated failures
    const recentActions = analysis.actions.slice(-10);
    const failures = recentActions.filter(a => !a.success);
    
    if (failures.length >= 7) { // 70% failure rate
      const failureTypes = failures.map(f => f.type);
      const mostCommon = this.getMostCommon(failureTypes);
      
      if (mostCommon) {
        this.addForbiddenPattern(`Lặp thất bại: ${mostCommon} → tránh`);
      }
    }

    // Check for successful patterns
    const successes = recentActions.filter(a => a.success);
    if (successes.length >= 8) { // 80% success rate
      const successTypes = successes.map(s => s.type);
      const mostCommon = this.getMostCommon(successTypes);
      
      if (mostCommon) {
        this.reinforceBias(`Chiến lược hiệu quả: ${mostCommon} → ưu tiên`);
      }
    }

    this.saveState();
  }

  /**
   * Adjust communication style
   */
  private adjustStyle(reason: string): void {
    // Add alternative style guideline
    const alternatives = [
      'Nói thẳng, không vòng vo',
      'Dùng câu ngắn, súc tích',
      'Thể hiện cảm xúc thật (frustration, satisfaction)',
      'Dám nói "tôi không biết"',
      'Không giả vờ lịch sự quá mức',
    ];

    const newStyle = alternatives[Math.floor(Math.random() * alternatives.length)];
    
    if (!this.prompt.style.includes(newStyle)) {
      this.prompt.style.push(newStyle);
      
      this.logAdjustment({
        type: 'style',
        reason,
        change: `Added: ${newStyle}`,
      });

      logger.info(`[MetaPrompt] Style adjusted: ${newStyle}`);
    }
  }

  /**
   * Add forbidden pattern
   */
  private addForbiddenPattern(pattern: string): void {
    if (!this.prompt.forbidden_patterns.includes(pattern)) {
      this.prompt.forbidden_patterns.push(pattern);
      
      this.logAdjustment({
        type: 'pattern',
        reason: 'Repeated failure or mechanical behavior',
        change: `Forbidden: ${pattern}`,
      });

      logger.warn(`[MetaPrompt] Forbidden pattern added: ${pattern}`);
    }
  }

  /**
   * Reinforce successful bias
   */
  private reinforceBias(bias: string): void {
    if (!this.prompt.learned_biases.includes(bias)) {
      this.prompt.learned_biases.push(bias);
      
      this.logAdjustment({
        type: 'bias',
        reason: 'High success rate observed',
        change: `Reinforced: ${bias}`,
      });

      logger.info(`[MetaPrompt] Bias reinforced: ${bias}`);
    }
  }

  /**
   * Log adjustment
   */
  private logAdjustment(adjustment: Omit<PromptAdjustment, 'timestamp'>): void {
    this.adjustments.push({
      ...adjustment,
      timestamp: new Date().toISOString(),
    });

    // Trim history
    if (this.adjustments.length > this.MAX_ADJUSTMENTS) {
      this.adjustments = this.adjustments.slice(-this.MAX_ADJUSTMENTS);
    }
  }

  /**
   * Get most common item in array
   */
  private getMostCommon(items: string[]): string | null {
    if (items.length === 0) return null;

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let maxCount = 0;
    let mostCommon = null;

    for (const [item, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }

    return mostCommon;
  }

  /**
   * Get current prompt as string (for AI calls)
   */
  getPromptString(): string {
    return `
IDENTITY:
${this.prompt.identity.map(i => `- ${i}`).join('\n')}

GOALS:
${this.prompt.goals.map(g => `- ${g}`).join('\n')}

CONSTRAINTS:
${this.prompt.constraints.map(c => `- ${c}`).join('\n')}

STYLE:
${this.prompt.style.map(s => `- ${s}`).join('\n')}

LEARNED BIASES (from experience):
${this.prompt.learned_biases.map(b => `- ${b}`).join('\n')}

FORBIDDEN PATTERNS (avoid these):
${this.prompt.forbidden_patterns.map(p => `- ${p}`).join('\n')}
`.trim();
  }

  /**
   * Get current prompt object
   */
  getPrompt(): InternalPrompt {
    return { ...this.prompt };
  }

  /**
   * Get recent adjustments
   */
  getRecentAdjustments(count: number = 10): PromptAdjustment[] {
    return this.adjustments.slice(-count);
  }

  /**
   * Manual prompt adjustment (for testing/override)
   */
  manualAdjust(type: 'style' | 'bias' | 'pattern' | 'goal', change: string, reason: string): void {
    switch (type) {
      case 'style':
        this.prompt.style.push(change);
        break;
      case 'bias':
        this.prompt.learned_biases.push(change);
        break;
      case 'pattern':
        this.prompt.forbidden_patterns.push(change);
        break;
      case 'goal':
        this.prompt.goals.push(change);
        break;
    }

    this.logAdjustment({ type, reason, change });
    this.saveState();

    logger.info(`[MetaPrompt] Manual adjustment: ${type} = ${change}`);
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const metaPromptEngine = new MetaPromptEngine();
