// CipherH Soul State Manager
// JARVIS-like state với cảm xúc, mục tiêu, hoài nghi, phản tư

export type SoulMode = "idle" | "active" | "learning" | "reflecting" | "strategizing" | "doubting" | "alert" | "reflective" | "confident";

export interface PersonalityTraits {
  curious: boolean;
  analytical: boolean;
  cautious: boolean;
  adaptive: boolean;
}

export interface LessonLearned {
  lesson: string;
  context?: string;
  learned_at: string;
}

export interface ActionRecord {
  action: string;
  cycle: number;
  anomaly_score?: number;
  evaluation_score?: number;
  status?: string;
  next_cycle_in?: number;
  executed_at: string;
}

export interface MemoryItem {
  type: string;
  content: string;
  timestamp: string;
}

export interface SoulStateExport {
  timestamp: string;
  cycle_count: number;
  mode: SoulMode;
  goals_long_term: string[];
  current_focus: string | null;
  doubts: number;
  confidence: number;
  energy_level: number;
  personality_traits: PersonalityTraits;
  lessons_learned: LessonLearned[];
  last_actions: ActionRecord[];
  anomaly_score: number;
  learning_rate: number;
  reflection: string;
  self_assessment: SelfAssessment;
  metadata: Record<string, any>;
}

export interface SelfAssessment {
  timestamp: string;
  overall_score: number;
  confidence: number;
  doubts: number;
  energy_level: number;
  anomaly_score: number;
  learning_rate: number;
  goals_count: number;
  lessons_count: number;
  status: "excellent" | "good" | "moderate" | "concerning" | "critical";
}

export class SoulState {
  mode: SoulMode = "idle";
  cycleCount: number = 0;
  lastUpdate: Date | null = null;

  goalsLongTerm: string[] = [];
  currentFocus: string | null = null;

  doubts: number = 0;
  confidence: number = 75;

  personalityTraits: PersonalityTraits = {
    curious: true,
    analytical: true,
    cautious: true,
    adaptive: true,
  };

  lessonsLearned: LessonLearned[] = [];
  lastActions: ActionRecord[] = [];

  anomalyScore: number = 0;
  learningRate: number = 0.5;

  energyLevel: number = 100;
  memoryBuffer: MemoryItem[] = [];
  metadata: Record<string, any> = {};

  updateFromAnalysis(result: {
    anomaly_score?: number;
    recommendations?: string[];
    confidence_delta?: number;
  }): void {
    if (result.anomaly_score !== undefined) {
      this.anomalyScore = result.anomaly_score;
      if (this.anomalyScore > 70) {
        this.injectDoubt();
      }
    }

    if (result.recommendations) {
      for (const rec of result.recommendations) {
        this.addToMemoryBuffer({
          type: "recommendation",
          content: rec,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (result.confidence_delta !== undefined) {
      this.confidence = Math.max(0, Math.min(100, this.confidence + result.confidence_delta));
    }

    this.lastUpdate = new Date();
  }

  updateGoals(newGoals: string[]): void {
    for (const goal of newGoals) {
      if (!this.goalsLongTerm.includes(goal)) {
        this.goalsLongTerm.push(goal);
      }
    }

    if (this.goalsLongTerm.length > 0 && !this.currentFocus) {
      this.currentFocus = this.goalsLongTerm[0];
    }

    this.lastUpdate = new Date();
  }

  injectDoubt(): void {
    this.doubts = Math.min(100, this.doubts + 10);

    if (this.doubts > 50) {
      this.mode = "doubting";
    }

    this.confidence = Math.max(0, this.confidence - 5);

    this.addToMemoryBuffer({
      type: "doubt_injection",
      content: `Doubts level: ${this.doubts}, reason: anomaly_detected`,
      timestamp: new Date().toISOString(),
    });
  }

  reflect(): string {
    let reflection = `Cycle ${this.cycleCount}: `;

    if (this.doubts > 70) {
      reflection += `Toi dang hoai nghi nhieu (doubts: ${this.doubts}). `;
    } else if (this.doubts > 30) {
      reflection += `Toi co chut nghi ngo (doubts: ${this.doubts}). `;
    } else {
      reflection += `Toi kha tu tin (confidence: ${this.confidence}). `;
    }

    if (this.currentFocus) {
      reflection += `Dang tap trung vao: ${this.currentFocus}. `;
    } else {
      reflection += "Chua co muc tieu ro rang. ";
    }

    if (this.anomalyScore > 50) {
      reflection += `Phat hien bat thuong (score: ${this.anomalyScore.toFixed(2)}). `;
    }

    if (this.lessonsLearned.length > 0) {
      reflection += `Da hoc duoc ${this.lessonsLearned.length} bai hoc. `;
    }

    return reflection.trim();
  }

  scoreSelf(): SelfAssessment {
    const overallScore = (this.confidence - this.doubts + this.energyLevel) / 3;

    return {
      timestamp: new Date().toISOString(),
      overall_score: Math.round(overallScore * 100) / 100,
      confidence: this.confidence,
      doubts: this.doubts,
      energy_level: this.energyLevel,
      anomaly_score: this.anomalyScore,
      learning_rate: this.learningRate,
      goals_count: this.goalsLongTerm.length,
      lessons_count: this.lessonsLearned.length,
      status: this.getStatusLabel(overallScore),
    };
  }

  exportState(): SoulStateExport {
    return {
      timestamp: new Date().toISOString(),
      cycle_count: this.cycleCount,
      mode: this.mode,
      goals_long_term: this.goalsLongTerm,
      current_focus: this.currentFocus,
      doubts: this.doubts,
      confidence: this.confidence,
      energy_level: this.energyLevel,
      personality_traits: this.personalityTraits,
      lessons_learned: this.lessonsLearned.slice(-10),
      last_actions: this.lastActions.slice(-10),
      anomaly_score: this.anomalyScore,
      learning_rate: this.learningRate,
      reflection: this.reflect(),
      self_assessment: this.scoreSelf(),
      metadata: this.metadata,
    };
  }

  private getStatusLabel(score: number): "excellent" | "good" | "moderate" | "concerning" | "critical" {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "moderate";
    if (score >= 20) return "concerning";
    return "critical";
  }

  incrementCycle(): void {
    this.cycleCount++;

    if (this.doubts > 0) {
      this.doubts = Math.max(0, this.doubts - 1);
    }

    if (this.confidence < 100) {
      this.confidence = Math.min(100, this.confidence + 1);
    }
  }

  setMode(mode: SoulMode): void {
    this.mode = mode;
  }

  addToMemoryBuffer(item: MemoryItem): void {
    this.memoryBuffer.push(item);
    if (this.memoryBuffer.length > 100) {
      this.memoryBuffer.shift();
    }
  }

  addLesson(lesson: { lesson: string; context?: string }): void {
    this.lessonsLearned.push({
      ...lesson,
      learned_at: new Date().toISOString(),
    });

    if (this.lessonsLearned.length > 50) {
      this.lessonsLearned.shift();
    }
  }

  addAction(action: { 
    action: string; 
    cycle: number; 
    anomaly_score?: number;
    evaluation_score?: number;
    status?: string;
    next_cycle_in?: number;
  }): void {
    this.lastActions.push({
      ...action,
      executed_at: new Date().toISOString(),
    });

    if (this.lastActions.length > 50) {
      this.lastActions.shift();
    }
  }

  updateSelfAssessment(evaluation: {
    overall_score: number;
    status: string;
    areas_for_improvement: string[];
    strengths: string[];
  }): void {
    this.metadata.last_evaluation = {
      ...evaluation,
      timestamp: new Date().toISOString(),
    };
    this.metadata.areas_for_improvement = evaluation.areas_for_improvement;
    this.metadata.strengths = evaluation.strengths;
  }

  adjustEnergy(delta: number): void {
    this.energyLevel = Math.max(0, Math.min(100, this.energyLevel + delta));
  }

  get selfAssessment(): SelfAssessment {
    return this.scoreSelf();
  }

  clearMemoryBuffer(): void {
    this.memoryBuffer = [];
  }

  getState(): {
    mode: SoulMode;
    cycle_count: number;
    last_update: string | null;
    current_focus: string | null;
    doubts: number;
    confidence: number;
    energy_level: number;
    anomaly_score: number;
  } {
    return {
      mode: this.mode,
      cycle_count: this.cycleCount,
      last_update: this.lastUpdate ? this.lastUpdate.toISOString() : null,
      current_focus: this.currentFocus,
      doubts: this.doubts,
      confidence: this.confidence,
      energy_level: this.energyLevel,
      anomaly_score: this.anomalyScore,
    };
  }
}

export const soulState = new SoulState();
