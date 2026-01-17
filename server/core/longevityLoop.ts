import { logger } from '../services/logger';
import { soulState } from './soulState';
import { memoryBridge } from './memory';

export type DriftSeverity = 'low' | 'medium' | 'high';

export interface DriftIndicator {
  id: string;
  timestamp: string;
  type: string;
  severity: DriftSeverity;
  description: string;
  detectedAt: number; // cycle number
  resolved: boolean;
}

export interface Lesson {
  id: string;
  content: string;
  timestamp: string;
  cycle: number;
  category: string;
  importance: number;
}

export interface Principle {
  id: string;
  content: string;
  timestamp: string;
  cycle: number;
  immutable: boolean;
}

export interface LongevityState {
  enabled: boolean;
  cycleCount: number;
  lessons: Lesson[];
  principles: Principle[];
  driftIndicators: DriftIndicator[];
  lastCheck: string;
  totalDriftDetected: number;
  totalDriftResolved: number;
}

const MAX_LESSONS = 200;
const MAX_PRINCIPLES = 50;
const MAX_DRIFT_INDICATORS = 100;

class LongevityLoopEngine {
  private state: LongevityState;

  constructor() {
    this.state = {
      enabled: true,
      cycleCount: 0,
      lessons: [],
      principles: [],
      driftIndicators: [],
      lastCheck: new Date().toISOString(),
      totalDriftDetected: 0,
      totalDriftResolved: 0,
    };

    logger.info('[LongevityLoop] Initialized - Monitoring long-term identity integrity');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  addLesson(content: string, category: string = 'general', importance: number = 50): Lesson {
    const lesson: Lesson = {
      id: this.generateId('lesson'),
      content,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      category,
      importance: Math.max(0, Math.min(100, importance)),
    };

    this.state.lessons.push(lesson);

    // Keep only the most important lessons if we exceed the limit
    if (this.state.lessons.length > MAX_LESSONS) {
      this.state.lessons.sort((a, b) => b.importance - a.importance);
      this.state.lessons = this.state.lessons.slice(0, MAX_LESSONS);
    }

    logger.info(`[LongevityLoop] Lesson added: ${content.substring(0, 50)}...`);
    return lesson;
  }

  addPrinciple(content: string, immutable: boolean = false): Principle {
    const principle: Principle = {
      id: this.generateId('principle'),
      content,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      immutable,
    };

    this.state.principles.push(principle);

    if (this.state.principles.length > MAX_PRINCIPLES) {
      // Remove non-immutable principles first
      const mutablePrinciples = this.state.principles.filter(p => !p.immutable);
      const immutablePrinciples = this.state.principles.filter(p => p.immutable);
      
      if (mutablePrinciples.length > 0) {
        this.state.principles = [
          ...immutablePrinciples,
          ...mutablePrinciples.slice(-(MAX_PRINCIPLES - immutablePrinciples.length))
        ];
      }
    }

    logger.info(`[LongevityLoop] Principle added: ${content.substring(0, 50)}... (immutable: ${immutable})`);
    return principle;
  }

  detectDrift(): DriftIndicator[] {
    const newIndicators: DriftIndicator[] = [];
    this.state.lastCheck = new Date().toISOString();

    // Check for identity drift based on soul state
    const confidenceThreshold = 30;
    if (soulState.confidence < confidenceThreshold) {
      const indicator: DriftIndicator = {
        id: this.generateId('drift'),
        timestamp: new Date().toISOString(),
        type: 'low_confidence',
        severity: soulState.confidence < 20 ? 'high' : 'medium',
        description: `Low confidence detected: ${soulState.confidence}`,
        detectedAt: soulState.cycleCount,
        resolved: false,
      };
      newIndicators.push(indicator);
      this.state.driftIndicators.push(indicator);
      this.state.totalDriftDetected++;
    }

    // Check for high doubt levels
    const doubtThreshold = 70;
    if (soulState.doubts > doubtThreshold) {
      const indicator: DriftIndicator = {
        id: this.generateId('drift'),
        timestamp: new Date().toISOString(),
        type: 'high_doubts',
        severity: soulState.doubts > 85 ? 'high' : 'medium',
        description: `High doubts detected: ${soulState.doubts}`,
        detectedAt: soulState.cycleCount,
        resolved: false,
      };
      newIndicators.push(indicator);
      this.state.driftIndicators.push(indicator);
      this.state.totalDriftDetected++;
    }

    // Check for energy depletion
    const energyThreshold = 20;
    if (soulState.energyLevel < energyThreshold) {
      const indicator: DriftIndicator = {
        id: this.generateId('drift'),
        timestamp: new Date().toISOString(),
        type: 'low_energy',
        severity: soulState.energyLevel < 10 ? 'high' : 'low',
        description: `Low energy detected: ${soulState.energyLevel}`,
        detectedAt: soulState.cycleCount,
        resolved: false,
      };
      newIndicators.push(indicator);
      this.state.driftIndicators.push(indicator);
      this.state.totalDriftDetected++;
    }

    // Trim old indicators
    if (this.state.driftIndicators.length > MAX_DRIFT_INDICATORS) {
      this.state.driftIndicators = this.state.driftIndicators.slice(-MAX_DRIFT_INDICATORS);
    }

    if (newIndicators.length > 0) {
      logger.warn(`[LongevityLoop] Detected ${newIndicators.length} drift indicators`);
    }

    return newIndicators;
  }

  resolveDrift(indicatorId: string): boolean {
    const indicator = this.state.driftIndicators.find(i => i.id === indicatorId);
    if (!indicator) {
      return false;
    }

    if (indicator.resolved) {
      return false;
    }

    indicator.resolved = true;
    this.state.totalDriftResolved++;
    logger.info(`[LongevityLoop] Drift indicator resolved: ${indicator.type}`);
    return true;
  }

  getDriftIndicators(limit: number = 20): DriftIndicator[] {
    return this.state.driftIndicators
      .filter(i => !i.resolved)
      .slice(-limit);
  }

  getAllDriftIndicators(limit: number = 50): DriftIndicator[] {
    return this.state.driftIndicators.slice(-limit);
  }

  getLessons(category?: string, limit: number = 50): Lesson[] {
    let lessons = this.state.lessons;
    
    if (category) {
      lessons = lessons.filter(l => l.category === category);
    }

    return lessons
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }

  getPrinciples(immutableOnly: boolean = false): Principle[] {
    if (immutableOnly) {
      return this.state.principles.filter(p => p.immutable);
    }
    return [...this.state.principles];
  }

  async persistToNotion(): Promise<void> {
    try {
      if (!memoryBridge.isConnected()) {
        logger.info('[LongevityLoop] Notion not connected - state stored locally only');
        return;
      }

      const summary = `
LONGEVITY LOOP STATUS
=====================
Cycle: ${this.state.cycleCount}
Timestamp: ${new Date().toISOString()}

LESSONS: ${this.state.lessons.length}
PRINCIPLES: ${this.state.principles.length}
DRIFT INDICATORS: ${this.state.driftIndicators.filter(i => !i.resolved).length} active

DRIFT DETECTION:
- Total detected: ${this.state.totalDriftDetected}
- Total resolved: ${this.state.totalDriftResolved}
- Resolution rate: ${this.state.totalDriftDetected > 0 ? ((this.state.totalDriftResolved / this.state.totalDriftDetected) * 100).toFixed(1) : 0}%

TOP LESSONS:
${this.state.lessons
  .sort((a, b) => b.importance - a.importance)
  .slice(0, 5)
  .map((l, i) => `${i + 1}. [${l.category}] ${l.content}`)
  .join('\n')}

ACTIVE PRINCIPLES:
${this.state.principles
  .slice(-5)
  .map((p, i) => `${i + 1}. ${p.content} ${p.immutable ? '(IMMUTABLE)' : ''}`)
  .join('\n')}
      `.trim();

      await memoryBridge.writeLesson(summary);
      logger.info('[LongevityLoop] Status persisted to Notion');
    } catch (error) {
      logger.error(`[LongevityLoop] Failed to persist to Notion: ${error}`);
    }
  }

  incrementCycle(): void {
    this.state.cycleCount++;
  }

  exportStatus(): {
    enabled: boolean;
    cycleCount: number;
    lessonsCount: number;
    principlesCount: number;
    activeDriftCount: number;
    totalDriftDetected: number;
    totalDriftResolved: number;
    lastCheck: string;
  } {
    return {
      enabled: this.state.enabled,
      cycleCount: this.state.cycleCount,
      lessonsCount: this.state.lessons.length,
      principlesCount: this.state.principles.length,
      activeDriftCount: this.state.driftIndicators.filter(i => !i.resolved).length,
      totalDriftDetected: this.state.totalDriftDetected,
      totalDriftResolved: this.state.totalDriftResolved,
      lastCheck: this.state.lastCheck,
    };
  }

  getState(): LongevityState {
    return {
      ...this.state,
      lessons: [...this.state.lessons],
      principles: [...this.state.principles],
      driftIndicators: [...this.state.driftIndicators],
    };
  }
}

export const longevityLoop = new LongevityLoopEngine();
