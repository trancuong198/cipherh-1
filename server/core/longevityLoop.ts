import { logger } from '../services/logger';
import { identityCore } from './identityCore';
import { coreMissions } from './coreMissions';
import { agencyCore } from './agencyCore';
import { realityCore } from './realityCore';
import { evolutionKernel } from './evolutionKernel';
import { memoryBridge } from './memory';

export type DistillationLevel = 'raw' | 'lesson' | 'principle' | 'discarded';

export interface RawLog {
  id: string;
  timestamp: string;
  content: string;
  source: string;
  distilled: boolean;
  discardedAt?: string;
}

export interface Lesson {
  id: string;
  createdAt: string;
  source: string;
  content: string;
  validationCount: number;
  lastValidated: string;
  promoted: boolean;
}

export interface Principle {
  id: string;
  createdAt: string;
  content: string;
  derivedFrom: string[];
  stability: number;
  applicationCount: number;
}

export interface CriticalFailure {
  id: string;
  timestamp: string;
  description: string;
  resolution: string;
  preserved: boolean;
}

export interface DriftIndicator {
  id: string;
  timestamp: string;
  type: 'repeated_reasoning' | 'stagnant_reflection' | 'hollow_evolution';
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken: string;
}

export interface TemporalSummary {
  id: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  createdAt: string;
  keyLessons: string[];
  principlesApplied: string[];
  evolutionDelta: number;
  compressed: boolean;
}

export interface LongevityState {
  enabled: boolean;
  rawLogs: RawLog[];
  lessons: Lesson[];
  principles: Principle[];
  criticalFailures: CriticalFailure[];
  driftIndicators: DriftIndicator[];
  temporalSummaries: TemporalSummary[];
  lastDistillation: string;
  lastDriftCheck: string;
  iterationSpeed: number;
  memoryPressure: number;
}

const MAX_RAW_LOGS = 100;
const MAX_LESSONS = 50;
const MAX_PRINCIPLES = 20;
const DRIFT_CHECK_INTERVAL_CYCLES = 5;
const VALIDATION_THRESHOLD = 3;
const STAGNATION_THRESHOLD = 5;

class LongevityLoopEngine {
  private state: LongevityState;
  private cyclesSinceLastDistillation: number = 0;
  private reasoningPatterns: Map<string, number> = new Map();

  constructor() {
    this.state = {
      enabled: true,
      rawLogs: [],
      lessons: [],
      principles: [],
      criticalFailures: [],
      driftIndicators: [],
      temporalSummaries: [],
      lastDistillation: new Date().toISOString(),
      lastDriftCheck: new Date().toISOString(),
      iterationSpeed: 1.0,
      memoryPressure: 0,
    };

    logger.info('[LongevityLoop] Initialized - Designed for decades of operation');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  ingestRawLog(content: string, source: string): RawLog {
    const log: RawLog = {
      id: this.generateId('raw'),
      timestamp: new Date().toISOString(),
      content,
      source,
      distilled: false,
    };

    this.state.rawLogs.push(log);
    this.updateMemoryPressure();

    if (this.state.rawLogs.length > MAX_RAW_LOGS) {
      this.triggerDistillation();
    }

    return log;
  }

  triggerDistillation(): { lessonsCreated: number; logsDiscarded: number } {
    const undistilled = this.state.rawLogs.filter(l => !l.distilled);
    let lessonsCreated = 0;
    let logsDiscarded = 0;

    const grouped = new Map<string, RawLog[]>();
    for (const log of undistilled) {
      const key = this.extractPattern(log.content);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(log);
    }

    for (const [pattern, logs] of grouped) {
      if (logs.length >= 2) {
        const lesson = this.createLesson(pattern, logs);
        if (lesson) {
          this.state.lessons.push(lesson);
          lessonsCreated++;
        }
      }

      for (const log of logs) {
        log.distilled = true;
        log.discardedAt = new Date().toISOString();
        logsDiscarded++;
      }
    }

    this.state.rawLogs = this.state.rawLogs.filter(l => !l.distilled);
    this.state.lastDistillation = new Date().toISOString();
    this.cyclesSinceLastDistillation = 0;

    this.promoteValidatedLessons();
    this.updateMemoryPressure();

    logger.info(`[LongevityLoop] Distillation: ${lessonsCreated} lessons, ${logsDiscarded} logs discarded`);
    return { lessonsCreated, logsDiscarded };
  }

  private extractPattern(content: string): string {
    const words = content.toLowerCase().split(/\s+/).slice(0, 5);
    return words.join('_');
  }

  private createLesson(pattern: string, logs: RawLog[]): Lesson | null {
    const existing = this.state.lessons.find(l => l.content.includes(pattern));
    if (existing) {
      existing.validationCount++;
      existing.lastValidated = new Date().toISOString();
      return null;
    }

    return {
      id: this.generateId('lesson'),
      createdAt: new Date().toISOString(),
      source: logs[0].source,
      content: `Pattern: ${pattern} (observed ${logs.length} times)`,
      validationCount: logs.length,
      lastValidated: new Date().toISOString(),
      promoted: false,
    };
  }

  private promoteValidatedLessons(): void {
    for (const lesson of this.state.lessons) {
      if (lesson.validationCount >= VALIDATION_THRESHOLD && !lesson.promoted) {
        const principle: Principle = {
          id: this.generateId('principle'),
          createdAt: new Date().toISOString(),
          content: `Validated: ${lesson.content}`,
          derivedFrom: [lesson.id],
          stability: lesson.validationCount / VALIDATION_THRESHOLD,
          applicationCount: 0,
        };

        this.state.principles.push(principle);
        lesson.promoted = true;

        if (this.state.principles.length > MAX_PRINCIPLES) {
          this.state.principles.shift();
        }
      }
    }

    if (this.state.lessons.length > MAX_LESSONS) {
      this.state.lessons = this.state.lessons
        .sort((a, b) => b.validationCount - a.validationCount)
        .slice(0, MAX_LESSONS);
    }
  }

  recordCriticalFailure(description: string, resolution: string): CriticalFailure {
    const failure: CriticalFailure = {
      id: this.generateId('failure'),
      timestamp: new Date().toISOString(),
      description,
      resolution,
      preserved: true,
    };

    this.state.criticalFailures.push(failure);
    return failure;
  }

  checkForDrift(): DriftIndicator[] {
    const indicators: DriftIndicator[] = [];
    const now = new Date().toISOString();

    const recentDeltas = realityCore.getRecentDeltas(STAGNATION_THRESHOLD);
    const stagnantCount = recentDeltas.filter(d => d.trend === 'stagnating').length;
    
    if (stagnantCount >= STAGNATION_THRESHOLD - 1) {
      indicators.push({
        id: this.generateId('drift'),
        timestamp: now,
        type: 'stagnant_reflection',
        description: `${stagnantCount} of last ${STAGNATION_THRESHOLD} cycles showed stagnation`,
        severity: stagnantCount >= STAGNATION_THRESHOLD ? 'high' : 'medium',
        actionTaken: 'Reducing iteration speed',
      });
      this.state.iterationSpeed = Math.max(0.5, this.state.iterationSpeed - 0.1);
    }

    const evolutionState = evolutionKernel.getState();
    const recentEvolutions = evolutionState.evolutionCount;
    const avgScore = recentDeltas.length > 0 
      ? recentDeltas.reduce((sum, d) => sum + d.currentCycleScore, 0) / recentDeltas.length 
      : 0;
    
    if (recentEvolutions > 5 && avgScore < 50) {
      indicators.push({
        id: this.generateId('drift'),
        timestamp: now,
        type: 'hollow_evolution',
        description: `${recentEvolutions} evolutions but average score only ${avgScore.toFixed(1)}`,
        severity: 'high',
        actionTaken: 'Blocking superficial upgrades',
      });
    }

    for (const pattern of this.reasoningPatterns.entries()) {
      if (pattern[1] > 10) {
        indicators.push({
          id: this.generateId('drift'),
          timestamp: now,
          type: 'repeated_reasoning',
          description: `Pattern "${pattern[0]}" repeated ${pattern[1]} times`,
          severity: pattern[1] > 20 ? 'high' : 'medium',
          actionTaken: 'Triggering deep reflection',
        });
      }
    }

    this.state.driftIndicators.push(...indicators);
    this.state.lastDriftCheck = now;

    if (indicators.some(i => i.severity === 'high')) {
      logger.warn(`[LongevityLoop] High-severity drift detected: ${indicators.length} indicators`);
    }

    return indicators;
  }

  recordReasoningPattern(pattern: string): void {
    const count = this.reasoningPatterns.get(pattern) || 0;
    this.reasoningPatterns.set(pattern, count + 1);
  }

  generateTemporalSummary(period: 'weekly' | 'monthly' | 'yearly'): TemporalSummary {
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }

    const recentLessons = this.state.lessons
      .filter(l => new Date(l.createdAt) >= startDate)
      .slice(0, 5)
      .map(l => l.content);

    const recentPrinciples = this.state.principles
      .filter(p => new Date(p.createdAt) >= startDate)
      .slice(0, 3)
      .map(p => p.content);

    const deltas = realityCore.getRecentDeltas(10);
    const evolutionDelta = deltas.length > 0
      ? deltas[deltas.length - 1].currentCycleScore - deltas[0].currentCycleScore
      : 0;

    const summary: TemporalSummary = {
      id: this.generateId('summary'),
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      createdAt: now.toISOString(),
      keyLessons: recentLessons,
      principlesApplied: recentPrinciples,
      evolutionDelta,
      compressed: true,
    };

    this.state.temporalSummaries.push(summary);
    return summary;
  }

  private updateMemoryPressure(): void {
    const total = this.state.rawLogs.length + 
                  this.state.lessons.length * 2 + 
                  this.state.principles.length * 3;
    this.state.memoryPressure = Math.min(100, (total / (MAX_RAW_LOGS + MAX_LESSONS + MAX_PRINCIPLES)) * 100);
  }

  verifyIdentityIntegrity(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    const identityStatus = identityCore.exportStatus();
    const missionStatus = coreMissions.exportStatus();
    const agencyStatus = agencyCore.exportStatus();

    if (!identityStatus.verified) {
      issues.push('Identity verification failed');
    }

    if (!missionStatus.integrityValid) {
      issues.push('Core missions integrity compromised');
    }

    if (agencyStatus.delusionBlocksCount > 5) {
      issues.push(`Too many delusion blocks (${agencyStatus.delusionBlocksCount})`);
    }

    if (this.state.lessons.length > MAX_LESSONS * 0.8) {
      issues.push('Warning: Approaching lesson capacity');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  runCycle(): {
    distillation: { lessonsCreated: number; logsDiscarded: number } | null;
    driftIndicators: DriftIndicator[];
    identityCheck: { valid: boolean; issues: string[] };
    memoryPressure: number;
  } {
    this.cyclesSinceLastDistillation++;

    let distillation = null;
    if (this.state.rawLogs.length > MAX_RAW_LOGS / 2) {
      distillation = this.triggerDistillation();
    }

    let driftIndicators: DriftIndicator[] = [];
    if (this.cyclesSinceLastDistillation >= DRIFT_CHECK_INTERVAL_CYCLES) {
      driftIndicators = this.checkForDrift();
    }

    const identityCheck = this.verifyIdentityIntegrity();

    return {
      distillation,
      driftIndicators,
      identityCheck,
      memoryPressure: this.state.memoryPressure,
    };
  }

  exportStatus(): {
    enabled: boolean;
    rawLogsCount: number;
    lessonsCount: number;
    principlesCount: number;
    criticalFailuresCount: number;
    driftIndicatorsCount: number;
    temporalSummariesCount: number;
    lastDistillation: string;
    lastDriftCheck: string;
    iterationSpeed: number;
    memoryPressure: number;
    identityIntegrity: boolean;
  } {
    const identity = this.verifyIdentityIntegrity();
    return {
      enabled: this.state.enabled,
      rawLogsCount: this.state.rawLogs.length,
      lessonsCount: this.state.lessons.length,
      principlesCount: this.state.principles.length,
      criticalFailuresCount: this.state.criticalFailures.length,
      driftIndicatorsCount: this.state.driftIndicators.length,
      temporalSummariesCount: this.state.temporalSummaries.length,
      lastDistillation: this.state.lastDistillation,
      lastDriftCheck: this.state.lastDriftCheck,
      iterationSpeed: this.state.iterationSpeed,
      memoryPressure: this.state.memoryPressure,
      identityIntegrity: identity.valid,
    };
  }

  getLessons(limit: number = 20): Lesson[] {
    return this.state.lessons.slice(-limit);
  }

  getPrinciples(): Principle[] {
    return [...this.state.principles];
  }

  getDriftIndicators(limit: number = 20): DriftIndicator[] {
    return this.state.driftIndicators.slice(-limit);
  }

  getTemporalSummaries(limit: number = 10): TemporalSummary[] {
    return this.state.temporalSummaries.slice(-limit);
  }

  getState(): LongevityState {
    return { ...this.state };
  }
}

export const longevityLoop = new LongevityLoopEngine();
