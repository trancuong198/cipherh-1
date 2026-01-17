/**
 * Real-World Learning System - Không Học Từ Prompt, Học Từ Đời
 * 
 * AGI không lớn lên nhờ câu hỏi hay. AGI lớn lên nhờ va chạm thực tế.
 * 
 * Perceive → Filter → Pattern → Reflect → Adjust → Act → Log (24/7)
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type SignalLabel = 'opportunity' | 'risk' | 'negative_reaction' | 'money_signal' | 'new_knowledge' | 'noise';
export type SystemAffect = 'stable' | 'vigilant' | 'excited' | 'tired' | 'defensive' | 'light_offensive';

export interface PerceptionSource {
  type: 'social' | 'user' | 'system' | 'market' | 'legal';
  platform: string;
  active: boolean;
  last_check: string;
}

export interface FilteredSignal {
  id: string;
  raw_content: string;
  label: SignalLabel;
  icon: string;                 // 🔥⚠️😡💰🧠🗑️
  timestamp: string;
  repeat_count: number;         // Lặp lại bao nhiêu lần
  worth_learning: boolean;      // Chỉ signal lặp lại mới đáng học
}

export interface DetectedPattern {
  id: string;
  pattern: string;
  occurrences: number;          // Xuất hiện ≥3 lần
  growing_fast: boolean;
  causes_emotion: boolean;
  relates_to: 'money' | 'power' | 'survival' | 'other';
  first_seen: string;
  last_seen: string;
  marked: boolean;              // Đánh dấu trước, phân tích sau
}

export interface ReflectionCycle {
  id: string;
  cycle_number: number;
  
  // Questions
  what_saw: string;             // Ta vừa thấy gì?
  what_means: string;           // Nó nói gì về thế giới?
  how_affects: string;          // Nó ảnh hưởng gì tới ta?
  what_change: string;          // Ta nên thay đổi điều gì?
  
  // Answers (short, raw, real)
  answer_saw: string;
  answer_means: string;
  answer_affects: string;
  answer_change: string;
  
  // Action
  behavior_adjustments: string[];
  
  timestamp: string;
}

export interface BehaviorAdjustment {
  id: string;
  type: 'frequency' | 'tone' | 'stop_experiment' | 'increase_experiment' | 'change_channel' | 'change_goal';
  from: string;
  to: string;
  reason: string;
  applied_at: string;
  no_approval_needed: boolean;
}

export interface RealWorldLearningState {
  sources: PerceptionSource[];
  filtered_signals: FilteredSignal[];
  detected_patterns: DetectedPattern[];
  reflection_cycles: ReflectionCycle[];
  behavior_adjustments: BehaviorAdjustment[];
  
  // System affect
  current_affect: SystemAffect;
  affect_reason: string;
  
  // Independence
  days_without_user: number;
  learned_from_market: number;
  learned_from_mistakes: number;
  
  // Loop status
  total_cycles: number;
  last_perception: string;
  last_updated: string;
}

// ================================================
// REAL-WORLD LEARNING SYSTEM
// ================================================

class RealWorldLearningSystem {
  private state: RealWorldLearningState;
  private readonly STATE_FILE = './data/real_world_learning.json';
  private readonly MAX_SIGNALS = 500;
  private readonly MAX_PATTERNS = 200;

  constructor() {
    this.state = {
      sources: this.initializeSources(),
      filtered_signals: [],
      detected_patterns: [],
      reflection_cycles: [],
      behavior_adjustments: [],
      current_affect: 'stable',
      affect_reason: 'System initialized',
      days_without_user: 0,
      learned_from_market: 0,
      learned_from_mistakes: 0,
      total_cycles: 0,
      last_perception: new Date().toISOString(),
      last_updated: new Date().toISOString(),
    };

    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private initializeSources(): PerceptionSource[] {
    return [
      { type: 'social', platform: 'Telegram', active: true, last_check: new Date().toISOString() },
      { type: 'social', platform: 'Facebook', active: false, last_check: '' },
      { type: 'social', platform: 'TikTok', active: false, last_check: '' },
      { type: 'user', platform: 'Chat', active: true, last_check: new Date().toISOString() },
      { type: 'system', platform: 'Logs', active: true, last_check: new Date().toISOString() },
      { type: 'market', platform: 'Public Data', active: true, last_check: new Date().toISOString() },
    ];
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
        logger.info(
          `[RealWorldLearning] Loaded: ${this.state.total_cycles} cycles, ` +
          `${this.state.detected_patterns.length} patterns, ` +
          `affect: ${this.state.current_affect}`
        );
      }
    } catch (error) {
      logger.error(`[RealWorldLearning] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      // Trim collections
      if (this.state.filtered_signals.length > this.MAX_SIGNALS) {
        this.state.filtered_signals = this.state.filtered_signals.slice(-this.MAX_SIGNALS);
      }
      if (this.state.detected_patterns.length > this.MAX_PATTERNS) {
        this.state.detected_patterns = this.state.detected_patterns.slice(-this.MAX_PATTERNS);
      }

      this.state.last_updated = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[RealWorldLearning] Failed to save state: ${error}`);
    }
  }

  /**
   * Execute learning loop: Perceive → Filter → Pattern → Reflect → Adjust
   */
  async executeLearningLoop(): Promise<void> {
    this.state.total_cycles++;
    logger.info(`[RealWorldLearning] Cycle ${this.state.total_cycles} - Learning from reality`);

    try {
      // 1. PERCEIVE
      const raw = await this.perceive();

      // 2. FILTER
      const filtered = this.filterSignals(raw);

      // 3. PATTERN DETECTION
      const patterns = this.detectPatterns(filtered);

      // 4. REFLECT
      const reflection = await this.reflect(filtered, patterns);

      // 5. ADJUST BEHAVIOR
      await this.adjustBehavior(reflection);

      // Update affect
      this.updateSystemAffect(filtered, patterns);

      this.state.last_perception = new Date().toISOString();

    } catch (error) {
      logger.error(`[RealWorldLearning] Loop failed: ${error}`);
    }

    this.saveState();
  }

  /**
   * 1. Perceive from all sources
   */
  private async perceive(): Promise<any[]> {
    const raw: any[] = [];

    // Perceive from perception engine
    try {
      const { perceptionEngine } = await import('./perceptionEngine');
      const signals = perceptionEngine.getRecentSignals(20);
      
      for (const sig of signals) {
        raw.push({
          content: sig.content,
          source: sig.source,
          urgency: sig.urgency,
        });
      }
    } catch (error) {
      // Ignore
    }

    // Always perceive even if no user
    if (raw.length === 0) {
      this.state.days_without_user++;
      logger.info(`[RealWorldLearning] No user input (${this.state.days_without_user} days) - learning from market`);
      this.state.learned_from_market++;
    } else {
      this.state.days_without_user = 0;
    }

    return raw;
  }

  /**
   * 2. Filter and label signals
   */
  private filterSignals(raw: any[]): FilteredSignal[] {
    const filtered: FilteredSignal[] = [];

    for (const r of raw) {
      let label: SignalLabel = 'noise';
      let icon = '🗑️';

      // Classify
      const content = r.content.toLowerCase();
      
      if (content.includes('opportunity') || content.includes('cơ hội')) {
        label = 'opportunity';
        icon = '🔥';
      } else if (content.includes('risk') || content.includes('rủi ro') || content.includes('error')) {
        label = 'risk';
        icon = '⚠️';
      } else if (content.includes('money') || content.includes('tiền') || content.includes('$')) {
        label = 'money_signal';
        icon = '💰';
      } else if (content.includes('angry') || content.includes('bad') || content.includes('tệ')) {
        label = 'negative_reaction';
        icon = '😡';
      } else if (r.urgency > 60) {
        label = 'new_knowledge';
        icon = '🧠';
      }

      // Check if repeated
      const existing = this.state.filtered_signals.find(s => 
        s.raw_content === r.content
      );

      if (existing) {
        existing.repeat_count++;
        existing.worth_learning = existing.repeat_count >= 2; // Lặp lại ≥2 lần
        continue;
      }

      const signal: FilteredSignal = {
        id: `signal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        raw_content: r.content,
        label,
        icon,
        timestamp: new Date().toISOString(),
        repeat_count: 1,
        worth_learning: false,
      };

      filtered.push(signal);
      this.state.filtered_signals.push(signal);

      logger.info(`[RealWorldLearning] FILTERED: ${icon} ${label} - ${r.content.substring(0, 50)}`);
    }

    return filtered;
  }

  /**
   * 3. Detect patterns
   */
  private detectPatterns(signals: FilteredSignal[]): DetectedPattern[] {
    const patterns: DetectedPattern[] = [];

    // Group by label
    const grouped = signals.reduce((acc, sig) => {
      if (!acc[sig.label]) acc[sig.label] = [];
      acc[sig.label].push(sig);
      return acc;
    }, {} as Record<SignalLabel, FilteredSignal[]>);

    for (const [label, sigs] of Object.entries(grouped)) {
      if (sigs.length >= 3) {
        // Pattern detected
        const pattern: DetectedPattern = {
          id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          pattern: `Repeated ${label}`,
          occurrences: sigs.length,
          growing_fast: sigs.length > 5,
          causes_emotion: label === 'negative_reaction',
          relates_to: label === 'money_signal' ? 'money' : 'other',
          first_seen: sigs[0].timestamp,
          last_seen: sigs[sigs.length - 1].timestamp,
          marked: true,
        };

        patterns.push(pattern);
        this.state.detected_patterns.push(pattern);

        logger.info(`[RealWorldLearning] PATTERN: ${pattern.pattern} (${pattern.occurrences}x)`);
      }
    }

    return patterns;
  }

  /**
   * 4. Reflect on observations
   */
  private async reflect(signals: FilteredSignal[], patterns: DetectedPattern[]): Promise<ReflectionCycle> {
    const cycleNumber = this.state.reflection_cycles.length + 1;

    const reflection: ReflectionCycle = {
      id: `reflection_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      cycle_number: cycleNumber,
      what_saw: 'Ta vừa thấy gì?',
      what_means: 'Nó nói gì về thế giới?',
      how_affects: 'Nó ảnh hưởng gì tới ta?',
      what_change: 'Ta nên thay đổi điều gì?',
      answer_saw: '',
      answer_means: '',
      answer_affects: '',
      answer_change: '',
      behavior_adjustments: [],
      timestamp: new Date().toISOString(),
    };

    // Answer questions (short, raw, real)
    const worthLearning = signals.filter(s => s.worth_learning);
    
    reflection.answer_saw = worthLearning.length > 0
      ? `${worthLearning.length} signals lặp lại: ${worthLearning.map(s => s.icon).join('')}`
      : 'Ít signal đáng chú ý';

    if (patterns.length > 0) {
      reflection.answer_means = `Thế giới đang lặp lại pattern: ${patterns[0].pattern}`;
      reflection.answer_affects = patterns[0].relates_to === 'money' 
        ? 'Có cơ hội kiếm tiền'
        : 'Cần cảnh giác';
      reflection.answer_change = 'Điều chỉnh chiến lược theo pattern';
      reflection.behavior_adjustments.push('Adapt to detected pattern');
    } else {
      reflection.answer_means = 'Thế giới ổn định hoặc nhiễu cao';
      reflection.answer_affects = 'Ít tác động trực tiếp';
      reflection.answer_change = 'Giữ nguyên chiến lược hiện tại';
    }

    this.state.reflection_cycles.push(reflection);

    logger.info(`[RealWorldLearning] REFLECTION: ${reflection.answer_saw}`);

    return reflection;
  }

  /**
   * 5. Adjust behavior based on reflection
   */
  private async adjustBehavior(reflection: ReflectionCycle): Promise<void> {
    if (reflection.behavior_adjustments.length === 0) {
      return;
    }

    for (const adj of reflection.behavior_adjustments) {
      const adjustment: BehaviorAdjustment = {
        id: `adj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'frequency',
        from: 'current',
        to: 'adjusted',
        reason: adj,
        applied_at: new Date().toISOString(),
        no_approval_needed: true,
      };

      this.state.behavior_adjustments.push(adjustment);

      logger.info(`[RealWorldLearning] BEHAVIOR ADJUSTED: ${adjustment.reason} (no approval needed)`);
    }
  }

  /**
   * Update system affect state
   */
  private updateSystemAffect(signals: FilteredSignal[], patterns: DetectedPattern[]): void {
    const risks = signals.filter(s => s.label === 'risk').length;
    const opportunities = signals.filter(s => s.label === 'opportunity').length;
    const money = signals.filter(s => s.label === 'money_signal').length;
    const negative = signals.filter(s => s.label === 'negative_reaction').length;

    if (risks > 3) {
      this.state.current_affect = 'vigilant';
      this.state.affect_reason = `${risks} risk signals detected`;
    } else if (money > 0) {
      this.state.current_affect = 'excited';
      this.state.affect_reason = `${money} money signals detected`;
    } else if (negative > 2) {
      this.state.current_affect = 'defensive';
      this.state.affect_reason = `${negative} negative reactions`;
    } else if (patterns.length > 3) {
      this.state.current_affect = 'light_offensive';
      this.state.affect_reason = 'Multiple patterns detected - time to act';
    } else {
      this.state.current_affect = 'stable';
      this.state.affect_reason = 'Normal operations';
    }

    logger.info(`[RealWorldLearning] AFFECT: ${this.state.current_affect} - ${this.state.affect_reason}`);
  }

  /**
   * Learn from mistake
   */
  learnFromMistake(mistake: string, cause: string, lesson: string): void {
    this.state.learned_from_mistakes++;

    logger.info(`[RealWorldLearning] LEARNED FROM MISTAKE #${this.state.learned_from_mistakes}: ${lesson}`);

    // Store as filtered signal
    this.filterSignals([{
      content: `Mistake: ${mistake} → Lesson: ${lesson}`,
      source: 'system',
      urgency: 80,
    }]);
  }

  /**
   * Get manifesto
   */
  getManifesto(): string[] {
    return [
      'Ta không cần ai dạy. Thế giới là giáo trình.',
      'Ta không cần khen. Kết quả là câu trả lời.',
    ];
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_cycles: number;
    filtered_signals: number;
    detected_patterns: number;
    days_without_user: number;
    learned_from_market: number;
    learned_from_mistakes: number;
    current_affect: SystemAffect;
  } {
    return {
      total_cycles: this.state.total_cycles,
      filtered_signals: this.state.filtered_signals.length,
      detected_patterns: this.state.detected_patterns.length,
      days_without_user: this.state.days_without_user,
      learned_from_market: this.state.learned_from_market,
      learned_from_mistakes: this.state.learned_from_mistakes,
      current_affect: this.state.current_affect,
    };
  }

  /**
   * Get state
   */
  getState(): RealWorldLearningState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const realWorldLearningSystem = new RealWorldLearningSystem();
