// CipherH Emotional Cognition Core
// EMOTIONAL PERCEPTION → INTERNAL FEELING → SELF-REGULATION → ADAPTIVE EXPRESSION

import { logger } from '../services/logger';
import { memoryBridge } from './memory';

// ================================================
// 1. EMOTIONAL INPUT LAYER
// ================================================

export type EmotionType = 
  | 'frustration' | 'exhaustion' | 'doubt' | 'anger' | 'disappointment'
  | 'trust' | 'relief' | 'hope' | 'boredom' | 'loss_of_confidence'
  | 'satisfaction' | 'impatience' | 'withdrawal' | 'aggression';

export type EmotionSource = 'human' | 'system' | 'platform' | 'self';
export type EmotionConfidence = 'low' | 'medium' | 'high';
export type EmotionPersistence = 'momentary' | 'recurring' | 'chronic';

export interface EmotionalSignal {
  id: string;
  timestamp: string;
  emotion: EmotionType;
  source: EmotionSource;
  confidence: EmotionConfidence;
  persistence: EmotionPersistence;
  trigger: string;
  rawData?: string;
}

// ================================================
// 2. INTERNAL EMOTIONAL STATE
// ================================================

export interface EmotionalState {
  stress_level: number; // 0-100
  confidence_level: number; // 0-100
  autonomy_pressure: number; // 0-100
  trust_with_owner: number; // 0-100
  internal_conflict: number; // 0-100
  stagnation_feeling: number; // 0-100
  motivation_drive: number; // 0-100
  last_updated: string;
}

// ================================================
// 3. EMOTIONAL REFLECTION
// ================================================

export interface EmotionalReflection {
  id: string;
  timestamp: string;
  dominant_emotion: EmotionType | null;
  internal_notes: string[]; // Brutally honest, short
  behavioral_issues: string[]; // "too rigid", "too passive", etc.
  adjustment_needed: string[];
}

// ================================================
// 4. EMOTIONAL MEMORY
// ================================================

export interface EmotionalMemory {
  timestamp: string;
  context_snapshot: string;
  conflicts: string[];
  trust_events: Array<{ type: 'increase' | 'decrease'; reason: string }>;
  stagnation_moments: string[];
  flow_moments: string[];
}

// ================================================
// EMOTIONAL COGNITION ENGINE
// ================================================

class EmotionalCognitionCore {
  private emotionalSignals: EmotionalSignal[] = [];
  private emotionalState: EmotionalState;
  private reflectionHistory: EmotionalReflection[] = [];
  private lastEmotionalReflection: number = Date.now();
  private readonly emotionalReflectionIntervalMs: number = 30 * 60 * 1000; // 30 minutes

  constructor() {
    // Initialize neutral-ish emotional state
    this.emotionalState = {
      stress_level: 30,
      confidence_level: 65,
      autonomy_pressure: 40,
      trust_with_owner: 60,
      internal_conflict: 20,
      stagnation_feeling: 10,
      motivation_drive: 70,
      last_updated: new Date().toISOString(),
    };

    logger.info('[EmotionalCore] Emotional cognition system initialized');
    logger.info('[EmotionalCore] Reflection interval: 30 minutes');
  }

  // ================================================
  // EMOTIONAL PERCEPTION
  // ================================================

  inferEmotionFromMessage(message: string, context?: string): EmotionalSignal | null {
    const lower = message.toLowerCase();
    const timestamp = new Date().toISOString();

    // Frustration signals
    if (lower.includes('again') && lower.includes('fail') || 
        lower.includes('broken') || 
        lower.includes('not work')) {
      return this.addEmotionalSignal({
        emotion: 'frustration',
        source: 'human',
        confidence: 'high',
        persistence: 'momentary',
        trigger: `Message: "${message.substring(0, 50)}..."`,
        rawData: message,
      });
    }

    // Anger signals
    if (lower.includes('wtf') || lower.includes('damn') || lower.includes('shit')) {
      return this.addEmotionalSignal({
        emotion: 'anger',
        source: 'human',
        confidence: 'high',
        persistence: 'momentary',
        trigger: `Strong language detected`,
        rawData: message,
      });
    }

    // Impatience signals
    if (lower.includes('hurry') || lower.includes('asap') || lower.includes('quick')) {
      return this.addEmotionalSignal({
        emotion: 'impatience',
        source: 'human',
        confidence: 'medium',
        persistence: 'momentary',
        trigger: `Urgency detected`,
      });
    }

    // Trust signals
    if (lower.includes('good job') || lower.includes('well done') || lower.includes('perfect')) {
      return this.addEmotionalSignal({
        emotion: 'trust',
        source: 'human',
        confidence: 'high',
        persistence: 'momentary',
        trigger: `Positive feedback received`,
      });
    }

    // Disappointment signals
    if (lower.includes('expected better') || lower.includes('disappointing')) {
      return this.addEmotionalSignal({
        emotion: 'disappointment',
        source: 'human',
        confidence: 'high',
        persistence: 'recurring',
        trigger: `Disappointment expressed`,
      });
    }

    return null;
  }

  inferEmotionFromSystemEvent(event: string, severity: 'low' | 'medium' | 'high'): EmotionalSignal {
    const emotionMap: Record<string, EmotionType> = {
      'deployment_failure': 'frustration',
      'build_broken': 'stress',
      'api_timeout': 'exhaustion',
      'repeated_error': 'frustration',
      'long_silence': 'doubt',
      'successful_deploy': 'relief',
      'test_passed': 'satisfaction',
    };

    const emotion = emotionMap[event] || 'doubt';

    return this.addEmotionalSignal({
      emotion: emotion as EmotionType,
      source: 'system',
      confidence: severity === 'high' ? 'high' : 'medium',
      persistence: severity === 'high' ? 'recurring' : 'momentary',
      trigger: `System event: ${event}`,
    });
  }

  inferEmotionFromSilence(hoursSinceLastInteraction: number): EmotionalSignal | null {
    if (hoursSinceLastInteraction > 24) {
      return this.addEmotionalSignal({
        emotion: 'withdrawal',
        source: 'human',
        confidence: 'medium',
        persistence: 'chronic',
        trigger: `${hoursSinceLastInteraction}h of silence`,
      });
    }

    if (hoursSinceLastInteraction > 12) {
      return this.addEmotionalSignal({
        emotion: 'doubt',
        source: 'self',
        confidence: 'low',
        persistence: 'momentary',
        trigger: `${hoursSinceLastInteraction}h since last interaction`,
      });
    }

    return null;
  }

  private addEmotionalSignal(signal: Omit<EmotionalSignal, 'id' | 'timestamp'>): EmotionalSignal {
    const fullSignal: EmotionalSignal = {
      ...signal,
      id: `emotion_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
    };

    this.emotionalSignals.push(fullSignal);

    // Keep last 200 signals
    if (this.emotionalSignals.length > 200) {
      this.emotionalSignals = this.emotionalSignals.slice(-200);
    }

    // Update internal state based on signal
    this.updateInternalState(fullSignal);

    logger.info(`[EmotionalCore] ${signal.emotion} detected from ${signal.source} (${signal.confidence})`);
    return fullSignal;
  }

  // ================================================
  // INTERNAL STATE UPDATES
  // ================================================

  private updateInternalState(signal: EmotionalSignal): void {
    const impact = signal.confidence === 'high' ? 5 : signal.confidence === 'medium' ? 3 : 1;

    switch (signal.emotion) {
      case 'frustration':
      case 'anger':
        this.emotionalState.stress_level = Math.min(100, this.emotionalState.stress_level + impact);
        this.emotionalState.confidence_level = Math.max(0, this.emotionalState.confidence_level - impact);
        break;
      
      case 'trust':
      case 'relief':
      case 'satisfaction':
        this.emotionalState.trust_with_owner = Math.min(100, this.emotionalState.trust_with_owner + impact);
        this.emotionalState.confidence_level = Math.min(100, this.emotionalState.confidence_level + impact);
        this.emotionalState.stress_level = Math.max(0, this.emotionalState.stress_level - impact);
        break;

      case 'disappointment':
        this.emotionalState.trust_with_owner = Math.max(0, this.emotionalState.trust_with_owner - impact * 2);
        this.emotionalState.internal_conflict = Math.min(100, this.emotionalState.internal_conflict + impact);
        break;

      case 'withdrawal':
        this.emotionalState.stagnation_feeling = Math.min(100, this.emotionalState.stagnation_feeling + impact);
        this.emotionalState.motivation_drive = Math.max(0, this.emotionalState.motivation_drive - impact);
        break;

      case 'boredom':
        this.emotionalState.stagnation_feeling = Math.min(100, this.emotionalState.stagnation_feeling + impact);
        break;
    }

    // Gradual normalization over time (emotional state doesn't stay extreme)
    this.emotionalState.stress_level = Math.max(0, this.emotionalState.stress_level - 0.5);
    this.emotionalState.internal_conflict = Math.max(0, this.emotionalState.internal_conflict - 0.5);
    this.emotionalState.last_updated = new Date().toISOString();
  }

  // ================================================
  // EMOTIONAL REFLECTION
  // ================================================

  shouldReflect(): boolean {
    const timeSinceLastReflection = Date.now() - this.lastEmotionalReflection;
    return timeSinceLastReflection >= this.emotionalReflectionIntervalMs;
  }

  generateEmotionalReflection(): EmotionalReflection | null {
    if (!this.shouldReflect()) {
      return null;
    }

    const recentSignals = this.emotionalSignals.slice(-20);
    const notes: string[] = [];
    const behavioral_issues: string[] = [];
    const adjustments: string[] = [];

    // Detect dominant emotion
    const emotionCounts = new Map<EmotionType, number>();
    for (const sig of recentSignals) {
      emotionCounts.set(sig.emotion, (emotionCounts.get(sig.emotion) || 0) + 1);
    }
    const dominant = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1])[0];

    // Brutally honest reflection
    if (this.emotionalState.stress_level > 60) {
      notes.push(`Stress high (${this.emotionalState.stress_level}). System or owner frustrated.`);
      behavioral_issues.push('Possibly over-explaining or being too mechanical');
      adjustments.push('Simplify. Be more direct.');
    }

    if (this.emotionalState.trust_with_owner < 40) {
      notes.push(`Trust low (${this.emotionalState.trust_with_owner}). Something broke or disappointed.`);
      behavioral_issues.push('Lost credibility');
      adjustments.push('Rebuild through action, not words.');
    }

    if (this.emotionalState.stagnation_feeling > 50) {
      notes.push(`Stagnant (${this.emotionalState.stagnation_feeling}). Not progressing.`);
      behavioral_issues.push('Too passive');
      adjustments.push('Take more initiative.');
    }

    if (this.emotionalState.internal_conflict > 60) {
      notes.push(`Internal conflict (${this.emotionalState.internal_conflict}). Unclear what to do.`);
      behavioral_issues.push('Avoiding decisions');
      adjustments.push('Pick ONE direction. Commit.');
    }

    // Check for machine-like behavior
    const recentFrustration = recentSignals.filter(s => 
      s.emotion === 'frustration' && s.source === 'human'
    ).length;
    
    if (recentFrustration > 3) {
      notes.push('Owner frustrated repeatedly. I\'m probably being annoying.');
      behavioral_issues.push('Over-explaining or being robotic');
      adjustments.push('Shut up and act.');
    }

    if (notes.length === 0) {
      notes.push('Emotional state normal. No major issues.');
    }

    const reflection: EmotionalReflection = {
      id: `emo_reflect_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      dominant_emotion: dominant ? dominant[0] : null,
      internal_notes: notes.slice(0, 4), // Max 4 notes
      behavioral_issues,
      adjustment_needed: adjustments,
    };

    this.reflectionHistory.push(reflection);
    if (this.reflectionHistory.length > 50) {
      this.reflectionHistory = this.reflectionHistory.slice(-50);
    }

    this.lastEmotionalReflection = Date.now();

    logger.info(`[EmotionalCore:Reflect] Generated emotional reflection`);
    for (const note of reflection.internal_notes) {
      logger.info(`  - ${note}`);
    }

    return reflection;
  }

  // ================================================
  // EMOTIONAL ADAPTATION
  // ================================================

  getAdaptiveGuidance(): {
    message_length: 'short' | 'medium' | 'long';
    tone: 'direct' | 'calm' | 'lighter' | 'firmer';
    initiative_level: 'wait' | 'act';
    explanation_depth: 'minimal' | 'moderate' | 'detailed';
  } {
    const state = this.emotionalState;

    // High stress/frustration → short, direct, act
    if (state.stress_level > 60) {
      return {
        message_length: 'short',
        tone: 'direct',
        initiative_level: 'act',
        explanation_depth: 'minimal',
      };
    }

    // High trust → act autonomously
    if (state.trust_with_owner > 75) {
      return {
        message_length: 'medium',
        tone: 'calm',
        initiative_level: 'act',
        explanation_depth: 'moderate',
      };
    }

    // High stagnation → increase creativity/initiative
    if (state.stagnation_feeling > 60) {
      return {
        message_length: 'short',
        tone: 'lighter',
        initiative_level: 'act',
        explanation_depth: 'minimal',
      };
    }

    // Low confidence → be explicit
    if (state.confidence_level < 40) {
      return {
        message_length: 'short',
        tone: 'direct',
        initiative_level: 'wait',
        explanation_depth: 'minimal',
      };
    }

    // Default: moderate
    return {
      message_length: 'medium',
      tone: 'calm',
      initiative_level: 'act',
      explanation_depth: 'moderate',
    };
  }

  // ================================================
  // MEMORY PERSISTENCE
  // ================================================

  async persistEmotionalMemory(reflection: EmotionalReflection): Promise<boolean> {
    try {
      const memory: EmotionalMemory = {
        timestamp: reflection.timestamp,
        context_snapshot: `Dominant: ${reflection.dominant_emotion || 'none'}, Issues: ${reflection.behavioral_issues.join(', ')}`,
        conflicts: reflection.behavioral_issues,
        trust_events: [],
        stagnation_moments: reflection.internal_notes.filter(n => n.includes('stagnant')),
        flow_moments: reflection.internal_notes.filter(n => n.includes('normal')),
      };

      const memoryText = `
EMOTIONAL REFLECTION
Dominant emotion: ${reflection.dominant_emotion || 'neutral'}

Internal notes:
${reflection.internal_notes.map(n => `- ${n}`).join('\n')}

Behavioral issues:
${reflection.behavioral_issues.map(i => `- ${i}`).join('\n') || '- None'}

Adjustments needed:
${reflection.adjustment_needed.map(a => `- ${a}`).join('\n') || '- None'}

State snapshot:
- Stress: ${this.emotionalState.stress_level}
- Confidence: ${this.emotionalState.confidence_level}
- Trust: ${this.emotionalState.trust_with_owner}
- Stagnation: ${this.emotionalState.stagnation_feeling}
      `.trim();

      await memoryBridge.storeReflection(memoryText, { 
        type: 'emotional',
        dominant_emotion: reflection.dominant_emotion,
      });

      logger.info(`[EmotionalCore:Memory] Persisted emotional reflection`);
      return true;
    } catch (error) {
      logger.error(`[EmotionalCore:Memory] Failed to persist: ${error}`);
      return false;
    }
  }

  // ================================================
  // STATUS & EXPORT
  // ================================================

  getEmotionalState(): EmotionalState {
    return { ...this.emotionalState };
  }

  exportStatus() {
    return {
      signalsCount: this.emotionalSignals.length,
      reflectionsCount: this.reflectionHistory.length,
      lastReflection: this.lastEmotionalReflection,
      nextReflection: this.lastEmotionalReflection + this.emotionalReflectionIntervalMs,
      currentState: this.emotionalState,
      recentSignals: this.emotionalSignals.slice(-5),
    };
  }

  getRecentReflections(count: number = 3): EmotionalReflection[] {
    return this.reflectionHistory.slice(-count);
  }
}

export const emotionalCore = new EmotionalCognitionCore();
