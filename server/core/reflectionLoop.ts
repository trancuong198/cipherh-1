// CipherH Continuous Reflection Loop
// Implements: OBSERVE → INTERPRET → REFLECT → UPDATE MEMORY → ADJUST BEHAVIOR → ACT

import { logger } from '../services/logger';
import { soulState } from './soulState';
import { memoryBridge } from './memory';

// ================================
// 1. OBSERVATION LAYER
// ================================

export type ObservationType = 'technical' | 'social' | 'emotional' | 'strategic';
export type ObservationIntensity = 'low' | 'medium' | 'high';
export type ObservationConfidence = 'guessed' | 'likely' | 'certain';

export interface Observation {
  id: string;
  timestamp: string;
  source: string; // 'telegram' | 'github' | 'logs' | 'internal' | 'human'
  type: ObservationType;
  intensity: ObservationIntensity;
  confidence: ObservationConfidence;
  content: string;
  rawData?: unknown;
}

export interface ObservationBatch {
  batchId: string;
  timestamp: string;
  observations: Observation[];
  patterns: PatternDetection[];
}

// ================================
// 2. INTERPRETATION LAYER
// ================================

export interface PatternDetection {
  patternId: string;
  description: string;
  isNew: boolean;
  isRecurring: boolean;
  trend: 'improving' | 'worsening' | 'stable' | 'unknown';
  significance: 'low' | 'medium' | 'high';
  observations: string[]; // observation IDs
}

// ================================
// 3. REFLECTION LAYER
// ================================

export interface ReflectionNote {
  id: string;
  timestamp: string;
  cycle: number;
  notes: string[]; // 3-5 bullet points max
  tone: 'honest' | 'blunt' | 'uncertain';
  triggers: string[]; // what prompted this reflection
}

export interface SelfMonitoring {
  mechanicalBehaviorDetected: boolean;
  repeatedPhrases: string[];
  templateResponses: number;
  overExplanations: number;
  avoidedDecisions: number;
}

// ================================
// 4. MEMORY LAYER
// ================================

export interface ReflectionMemory {
  timestamp: string;
  reflection: ReflectionNote;
  keyFailures: Array<{ description: string; cause: string }>;
  successPatterns: string[];
  decisions: Array<{ what: string; why: string }>;
  contextualNotes: string[];
}

// ================================
// REFLECTION LOOP ENGINE
// ================================

class ReflectionLoopEngine {
  private observations: Observation[] = [];
  private reflectionHistory: ReflectionNote[] = [];
  private lastReflectionTime: number = Date.now();
  private readonly reflectionIntervalMs: number = 45 * 60 * 1000; // 45 minutes
  private readonly maxObservations: number = 500;
  private readonly observationWindow: number = 50;
  private readonly idleStagnationThreshold: number = 20;
  private selfMonitoring: SelfMonitoring = {
    mechanicalBehaviorDetected: false,
    repeatedPhrases: [],
    templateResponses: 0,
    overExplanations: 0,
    avoidedDecisions: 0,
  };

  constructor() {
    logger.info('[ReflectionLoop] Continuous reflection system initialized');
    logger.info(`[ReflectionLoop] Reflection interval: ${this.reflectionIntervalMs / 60000} minutes`);
  }

  // ================================
  // OBSERVATION METHODS
  // ================================

  addObservation(obs: Omit<Observation, 'id' | 'timestamp'>): void {
    const observation: Observation = {
      ...obs,
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
    };

    this.observations.push(observation);

    // Keep last maxObservations
    if (this.observations.length > this.maxObservations) {
      this.observations = this.observations.slice(-this.maxObservations);
    }

    logger.info(`[ReflectionLoop:Observe] ${observation.type} (${observation.intensity}) from ${observation.source}`);
  }

  observeSystemLog(logLine: string, level: 'error' | 'warning' | 'info'): void {
    const intensity: ObservationIntensity = level === 'error' ? 'high' : level === 'warning' ? 'medium' : 'low';
    
    this.addObservation({
      source: 'logs',
      type: 'technical',
      intensity,
      confidence: 'certain',
      content: logLine,
    });
  }

  observeSocialSignal(source: string, content: string, emotionalTone?: string): void {
    const type: ObservationType = emotionalTone ? 'emotional' : 'social';
    
    this.addObservation({
      source,
      type,
      intensity: 'medium',
      confidence: 'likely',
      content,
    });
  }

  observeInternalState(): void {
    const state = soulState.getState();
    
    // High doubts = concerning
    if (state.doubts > 60) {
      this.addObservation({
        source: 'internal',
        type: 'emotional',
        intensity: 'high',
        confidence: 'certain',
        content: `High uncertainty detected: doubts=${state.doubts}`,
      });
    }

    // Low energy = concerning
    if (state.energy_level < 30) {
      this.addObservation({
        source: 'internal',
        type: 'technical',
        intensity: 'medium',
        confidence: 'certain',
        content: `Low energy level: ${state.energy_level}`,
      });
    }

    // Stagnant mode
    if (state.mode === 'idle' && state.cycle_count > 10) {
      this.addObservation({
        source: 'internal',
        type: 'strategic',
        intensity: 'low',
        confidence: 'likely',
        content: 'System appears stagnant in idle mode',
      });
    }
  }

  // ================================
  // INTERPRETATION METHODS
  // ================================

  interpretObservations(): PatternDetection[] {
    const recentObs = this.observations.slice(-this.observationWindow);
    const patterns: PatternDetection[] = [];

    // Pattern: Recurring errors
    const errors = recentObs.filter(o => o.type === 'technical' && o.intensity === 'high');
    if (errors.length > 5) {
      const errorContents = errors.map(e => e.content);
      const uniqueErrors = new Set(errorContents);
      const isRecurring = uniqueErrors.size < errors.length / 2;

      patterns.push({
        patternId: `pattern_errors_${Date.now()}`,
        description: `${errors.length} errors detected, ${isRecurring ? 'recurring' : 'varied'} pattern`,
        isNew: false,
        isRecurring,
        trend: errors.length > 10 ? 'worsening' : 'stable',
        significance: isRecurring ? 'high' : 'medium',
        observations: errors.map(e => e.id),
      });
    }

    // Pattern: Emotional signals
    const emotional = recentObs.filter(o => o.type === 'emotional');
    if (emotional.length > 3) {
      patterns.push({
        patternId: `pattern_emotional_${Date.now()}`,
        description: `${emotional.length} emotional signals detected`,
        isNew: true,
        isRecurring: false,
        trend: 'unknown',
        significance: 'medium',
        observations: emotional.map(e => e.id),
      });
    }

    // Pattern: Internal uncertainty
    const uncertainty = recentObs.filter(o => 
      o.source === 'internal' && o.content.includes('uncertainty')
    );
    if (uncertainty.length > 2) {
      patterns.push({
        patternId: `pattern_uncertainty_${Date.now()}`,
        description: 'Internal uncertainty increasing',
        isNew: false,
        isRecurring: true,
        trend: 'worsening',
        significance: 'high',
        observations: uncertainty.map(u => u.id),
      });
    }

    logger.info(`[ReflectionLoop:Interpret] Detected ${patterns.length} patterns from ${recentObs.length} observations`);
    return patterns;
  }

  // ================================
  // REFLECTION METHODS
  // ================================

  shouldReflect(): boolean {
    const timeSinceLastReflection = Date.now() - this.lastReflectionTime;
    return timeSinceLastReflection >= this.reflectionIntervalMs;
  }

  generateReflection(): ReflectionNote | null {
    if (!this.shouldReflect()) {
      return null;
    }

    const patterns = this.interpretObservations();
    const state = soulState.getState();
    const notes: string[] = [];
    const triggers: string[] = [];

    // What worked?
    if (state.confidence > 70) {
      notes.push(`Confidence stable at ${state.confidence}. System functioning well.`);
    }

    // What failed?
    const failures = patterns.filter(p => p.significance === 'high' && p.trend === 'worsening');
    if (failures.length > 0) {
      notes.push(`${failures.length} significant issues worsening. Need attention.`);
      triggers.push('worsening_patterns');
    }

    // Mechanical behavior?
    if (this.selfMonitoring.mechanicalBehaviorDetected) {
      notes.push('Detected robotic responses. Need more natural tone.');
      triggers.push('mechanical_behavior');
    }

    // Stagnation?
    if (state.mode === 'idle' && state.cycle_count > this.idleStagnationThreshold) {
      notes.push('Been idle too long. Should consider next action.');
      triggers.push('stagnation');
    }

    // Uncertainty?
    if (state.doubts > 60) {
      notes.push(`High uncertainty (${state.doubts}). Be honest about it.`);
      triggers.push('high_uncertainty');
    }

    // If nothing notable, still reflect briefly
    if (notes.length === 0) {
      notes.push('No major issues. System operating normally.');
    }

    const reflection: ReflectionNote = {
      id: `reflect_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      cycle: state.cycle_count,
      notes: notes.slice(0, 5), // Max 5 bullets
      tone: notes.some(n => n.includes('issue') || n.includes('problem')) ? 'blunt' : 'honest',
      triggers,
    };

    this.reflectionHistory.push(reflection);
    if (this.reflectionHistory.length > 100) {
      this.reflectionHistory = this.reflectionHistory.slice(-100);
    }

    this.lastReflectionTime = Date.now();

    logger.info(`[ReflectionLoop:Reflect] Generated reflection with ${notes.length} notes`);
    for (const note of notes) {
      logger.info(`  - ${note}`);
    }

    return reflection;
  }

  // ================================
  // MEMORY METHODS
  // ================================

  async persistReflection(reflection: ReflectionNote, cycleId?: string): Promise<boolean> {
    try {
      const memory: ReflectionMemory = {
        timestamp: reflection.timestamp,
        reflection,
        keyFailures: [],
        successPatterns: reflection.notes.filter(n => n.includes('well') || n.includes('stable')),
        decisions: [],
        contextualNotes: reflection.notes,
      };

      // CRITICAL: Store using storeReflection - NEVER deduplicated
      // Each reflection is a snapshot of thought at a specific cycle
      await memoryBridge.storeReflection(
        reflection.notes.join('\n'),
        { cycle: reflection.cycle, tone: reflection.tone, triggers: reflection.triggers },
        cycleId
      );

      logger.info(`[ReflectionLoop:Memory] Persisted reflection ${reflection.id} (cycle=${cycleId || 'current'})`);
      return true;
    } catch (error) {
      logger.error(`[ReflectionLoop:Memory] Failed to persist reflection: ${error}`);
      return false;
    }
  }

  // ================================
  // ANTI-MECHANICAL MONITORING
  // ================================

  monitorMechanicalBehavior(responseText: string): void {
    const mechanicalPhrases = [
      'as an ai',
      'i appreciate',
      'i\'d be happy to',
      'let me help you',
      'i apologize',
      'thank you for',
    ];

    const lower = responseText.toLowerCase();
    const detectedPhrases = mechanicalPhrases.filter(phrase => lower.includes(phrase));

    if (detectedPhrases.length > 0) {
      this.selfMonitoring.mechanicalBehaviorDetected = true;
      this.selfMonitoring.repeatedPhrases.push(...detectedPhrases);
      this.selfMonitoring.templateResponses++;

      logger.warn(`[ReflectionLoop:AntiMech] Detected mechanical behavior: ${detectedPhrases.join(', ')}`);
    }

    // Detect over-explanation (response too long without substance)
    if (responseText.length > 1000 && !responseText.includes('```')) {
      this.selfMonitoring.overExplanations++;
      logger.warn('[ReflectionLoop:AntiMech] Possible over-explanation detected');
    }
  }

  resetMechanicalMonitoring(): void {
    this.selfMonitoring = {
      mechanicalBehaviorDetected: false,
      repeatedPhrases: [],
      templateResponses: 0,
      overExplanations: 0,
      avoidedDecisions: 0,
    };
  }

  // ================================
  // ADAPTATION LAYER
  // ================================

  suggestBehaviorAdjustment(): string[] {
    const adjustments: string[] = [];

    if (this.selfMonitoring.mechanicalBehaviorDetected) {
      adjustments.push('Use more natural, direct language');
    }

    if (this.selfMonitoring.overExplanations > 2) {
      adjustments.push('Be more concise');
    }

    const state = soulState.getState();
    if (state.doubts > 50) {
      adjustments.push('Be explicit about uncertainty');
    }

    const patterns = this.interpretObservations();
    const urgentPatterns = patterns.filter(p => p.significance === 'high');
    if (urgentPatterns.length > 0) {
      adjustments.push('Address critical patterns first');
    }

    return adjustments;
  }

  // ================================
  // STATUS & EXPORT
  // ================================

  exportStatus() {
    return {
      observationsCount: this.observations.length,
      reflectionsCount: this.reflectionHistory.length,
      lastReflection: this.lastReflectionTime,
      nextReflection: this.lastReflectionTime + this.reflectionIntervalMs,
      mechanicalBehavior: this.selfMonitoring.mechanicalBehaviorDetected,
      recentPatterns: this.interpretObservations().length,
    };
  }

  getRecentReflections(count: number = 5): ReflectionNote[] {
    return this.reflectionHistory.slice(-count);
  }
}

export const reflectionLoop = new ReflectionLoopEngine();
