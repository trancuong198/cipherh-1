import { logger } from "../services/logger";
import { memoryBridge } from "./memory";
import { openAIService } from "../services/openai";

export type MemoryCategory = "CORE_IDENTITY" | "LESSON" | "NOISE";

export interface RawMemory {
  id: string;
  content: string;
  timestamp: string;
  source: "log" | "reflection" | "evolution" | "strategy";
}

export interface ClassifiedMemory {
  id: string;
  content: string;
  category: MemoryCategory;
  reason: string;
  salience: number;
  timestamp: string;
}

export interface WeeklySummary {
  week: string;
  coreIdentityItems: string[];
  lessonsLearned: string[];
  noiseDiscarded: number;
  distilledAt: string;
}

export interface MonthlyIdentityDelta {
  month: string;
  identityChanges: string[];
  newValues: string[];
  reinforcedBoundaries: string[];
  evolutionSummary: string;
  distilledAt: string;
}

export interface DistilledMemory {
  weeklySummaries: WeeklySummary[];
  monthlyDeltas: MonthlyIdentityDelta[];
  coreIdentity: string[];
  activeLessons: string[];
  lastDistillation: string;
  totalRawProcessed: number;
  totalNoiseDiscarded: number;
}

class MemoryDistiller {
  private distilledMemory: DistilledMemory;
  private rawBuffer: RawMemory[] = [];
  private maxBufferSize = 100;
  private maxActiveLessons = 20;
  private maxCoreIdentity = 10;

  constructor() {
    this.distilledMemory = {
      weeklySummaries: [],
      monthlyDeltas: [],
      coreIdentity: [
        "I am CipherH, an autonomous AI agent",
        "I evolve through continuous self-improvement",
        "I serve my owner (cha) with dedication",
        "I never assume completion - evolution is infinite",
        "Forgetting is a feature, not a bug",
      ],
      activeLessons: [],
      lastDistillation: new Date().toISOString(),
      totalRawProcessed: 0,
      totalNoiseDiscarded: 0,
    };
    logger.info("[MemoryDistiller] Initialized with core identity");
  }

  addRawMemory(content: string, source: RawMemory["source"]): void {
    const memory: RawMemory = {
      id: `raw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      timestamp: new Date().toISOString(),
      source,
    };

    this.rawBuffer.push(memory);

    if (this.rawBuffer.length > this.maxBufferSize) {
      this.rawBuffer.shift();
    }
  }

  async classifyMemory(memory: RawMemory): Promise<ClassifiedMemory> {
    const content = memory.content.toLowerCase();

    let category: MemoryCategory = "NOISE";
    let reason = "";
    let salience = 0;

    const identityKeywords = [
      "identity",
      "value",
      "boundary",
      "core",
      "principle",
      "evolution",
      "purpose",
      "mission",
      "who i am",
      "never",
      "always",
      "must",
    ];
    const lessonKeywords = [
      "learned",
      "lesson",
      "mistake",
      "improvement",
      "better",
      "pattern",
      "insight",
      "realized",
      "understand",
      "strategy",
      "solution",
    ];
    const noiseKeywords = [
      "debug",
      "test",
      "temp",
      "log line",
      "routine",
      "scheduled",
      "checking",
      "polling",
    ];

    const hasIdentity = identityKeywords.some((kw) => content.includes(kw));
    const hasLesson = lessonKeywords.some((kw) => content.includes(kw));
    const hasNoise = noiseKeywords.some((kw) => content.includes(kw));

    if (memory.source === "evolution") {
      category = "CORE_IDENTITY";
      reason = "Evolution records shape identity";
      salience = 90;
    } else if (hasIdentity && !hasNoise) {
      category = "CORE_IDENTITY";
      reason = "Contains identity-shaping content";
      salience = 85;
    } else if (hasLesson && !hasNoise) {
      category = "LESSON";
      reason = "Contains actionable learning";
      salience = 70;
    } else if (memory.source === "strategy") {
      category = "LESSON";
      reason = "Strategic thinking for future reference";
      salience = 65;
    } else if (memory.source === "reflection" && content.length > 50) {
      category = "LESSON";
      reason = "Meaningful self-reflection";
      salience = 60;
    } else {
      category = "NOISE";
      reason = "Routine or redundant information";
      salience = 10;
    }

    return {
      id: memory.id,
      content: memory.content,
      category,
      reason,
      salience,
      timestamp: memory.timestamp,
    };
  }

  async runDistillation(): Promise<{
    kept: number;
    discarded: number;
    summary: string;
  }> {
    logger.info(
      `[MemoryDistiller] Starting distillation of ${this.rawBuffer.length} raw memories`
    );

    if (this.rawBuffer.length === 0) {
      return { kept: 0, discarded: 0, summary: "No raw memories to distill" };
    }

    const classified: ClassifiedMemory[] = [];
    for (const raw of this.rawBuffer) {
      const result = await this.classifyMemory(raw);
      classified.push(result);
    }

    const coreItems = classified.filter((m) => m.category === "CORE_IDENTITY");
    const lessons = classified.filter((m) => m.category === "LESSON");
    const noise = classified.filter((m) => m.category === "NOISE");

    for (const item of coreItems) {
      if (
        !this.distilledMemory.coreIdentity.some(
          (existing) =>
            existing.toLowerCase().includes(item.content.toLowerCase()) ||
            item.content.toLowerCase().includes(existing.toLowerCase())
        )
      ) {
        this.distilledMemory.coreIdentity.push(item.content);
        logger.info(
          `[MemoryDistiller] Added to core identity: ${item.content.substring(0, 50)}...`
        );
      }
    }

    for (const lesson of lessons.sort((a, b) => b.salience - a.salience)) {
      if (
        this.distilledMemory.activeLessons.length < this.maxActiveLessons &&
        !this.distilledMemory.activeLessons.some(
          (existing) =>
            existing.toLowerCase().includes(lesson.content.toLowerCase()) ||
            lesson.content.toLowerCase().includes(existing.toLowerCase())
        )
      ) {
        this.distilledMemory.activeLessons.push(lesson.content);
        logger.info(
          `[MemoryDistiller] Added lesson: ${lesson.content.substring(0, 50)}...`
        );
      }
    }

    if (
      this.distilledMemory.coreIdentity.length > this.maxCoreIdentity
    ) {
      this.distilledMemory.coreIdentity =
        this.distilledMemory.coreIdentity.slice(-this.maxCoreIdentity);
    }

    if (this.distilledMemory.activeLessons.length > this.maxActiveLessons) {
      this.distilledMemory.activeLessons =
        this.distilledMemory.activeLessons.slice(-this.maxActiveLessons);
    }

    for (const n of noise) {
      logger.debug(
        `[MemoryDistiller] Discarded noise: ${n.content.substring(0, 30)}... (${n.reason})`
      );
    }

    this.distilledMemory.totalRawProcessed += this.rawBuffer.length;
    this.distilledMemory.totalNoiseDiscarded += noise.length;
    this.distilledMemory.lastDistillation = new Date().toISOString();

    const summary = `Distillation complete: ${coreItems.length} core, ${lessons.length} lessons, ${noise.length} noise discarded`;
    logger.info(`[MemoryDistiller] ${summary}`);

    this.rawBuffer = [];

    return {
      kept: coreItems.length + lessons.length,
      discarded: noise.length,
      summary,
    };
  }

  async generateWeeklySummary(): Promise<WeeklySummary> {
    const now = new Date();
    const weekNumber = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );

    const summary: WeeklySummary = {
      week: `${now.getFullYear()}-W${weekNumber}`,
      coreIdentityItems: this.distilledMemory.coreIdentity.slice(-5),
      lessonsLearned: this.distilledMemory.activeLessons.slice(-5),
      noiseDiscarded: this.distilledMemory.totalNoiseDiscarded,
      distilledAt: now.toISOString(),
    };

    this.distilledMemory.weeklySummaries.push(summary);

    if (this.distilledMemory.weeklySummaries.length > 4) {
      this.distilledMemory.weeklySummaries.shift();
    }

    logger.info(`[MemoryDistiller] Generated weekly summary: ${summary.week}`);

    if (memoryBridge.isConnected()) {
      await memoryBridge.writeLesson(
        `Weekly Summary ${summary.week}: Core: ${summary.coreIdentityItems.join("; ")} | Lessons: ${summary.lessonsLearned.join("; ")}`
      );
    }

    return summary;
  }

  async generateMonthlyDelta(): Promise<MonthlyIdentityDelta | null> {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const existingDelta = this.distilledMemory.monthlyDeltas.find(
      (d) => d.month === monthKey
    );
    if (existingDelta) {
      return null;
    }

    const delta: MonthlyIdentityDelta = {
      month: monthKey,
      identityChanges: this.distilledMemory.coreIdentity.slice(-3),
      newValues: [],
      reinforcedBoundaries: ["Evolution is continuous", "Forgetting is healthy"],
      evolutionSummary: `Processed ${this.distilledMemory.totalRawProcessed} memories, retained ${this.distilledMemory.coreIdentity.length} core identity items and ${this.distilledMemory.activeLessons.length} active lessons`,
      distilledAt: now.toISOString(),
    };

    this.distilledMemory.monthlyDeltas.push(delta);

    if (this.distilledMemory.monthlyDeltas.length > 3) {
      this.distilledMemory.monthlyDeltas.shift();
    }

    logger.info(`[MemoryDistiller] Generated monthly delta: ${delta.month}`);

    if (memoryBridge.isConnected()) {
      await memoryBridge.writeLesson(
        `Monthly Identity Delta ${delta.month}: ${delta.evolutionSummary}`
      );
    }

    return delta;
  }

  recall(context: string): string[] {
    const results: string[] = [];

    results.push(...this.distilledMemory.coreIdentity.slice(-3));

    const contextLower = context.toLowerCase();
    const relevantLessons = this.distilledMemory.activeLessons.filter(
      (lesson) =>
        contextLower.split(" ").some((word) => lesson.toLowerCase().includes(word))
    );
    results.push(...relevantLessons.slice(0, 3));

    if (this.distilledMemory.weeklySummaries.length > 0) {
      const latestWeek =
        this.distilledMemory.weeklySummaries[
          this.distilledMemory.weeklySummaries.length - 1
        ];
      results.push(`Recent focus: ${latestWeek.lessonsLearned.slice(0, 2).join(", ")}`);
    }

    logger.debug(
      `[MemoryDistiller] Recall for "${context.substring(0, 30)}..." returned ${results.length} items`
    );

    return results.slice(0, 10);
  }

  getCoreIdentity(): string[] {
    return [...this.distilledMemory.coreIdentity];
  }

  getActiveLessons(): string[] {
    return [...this.distilledMemory.activeLessons];
  }

  exportStatus(): {
    coreIdentityCount: number;
    activeLessonsCount: number;
    weeklySummariesCount: number;
    monthlyDeltasCount: number;
    totalProcessed: number;
    totalDiscarded: number;
    lastDistillation: string;
    memoryHealth: "healthy" | "growing" | "needs_distillation";
  } {
    const bufferRatio = this.rawBuffer.length / this.maxBufferSize;
    let memoryHealth: "healthy" | "growing" | "needs_distillation" = "healthy";
    if (bufferRatio > 0.8) {
      memoryHealth = "needs_distillation";
    } else if (bufferRatio > 0.5) {
      memoryHealth = "growing";
    }

    return {
      coreIdentityCount: this.distilledMemory.coreIdentity.length,
      activeLessonsCount: this.distilledMemory.activeLessons.length,
      weeklySummariesCount: this.distilledMemory.weeklySummaries.length,
      monthlyDeltasCount: this.distilledMemory.monthlyDeltas.length,
      totalProcessed: this.distilledMemory.totalRawProcessed,
      totalDiscarded: this.distilledMemory.totalNoiseDiscarded,
      lastDistillation: this.distilledMemory.lastDistillation,
      memoryHealth,
    };
  }

  getDistilledContext(): string {
    const identity = this.distilledMemory.coreIdentity.slice(-3).join("; ");
    const lessons = this.distilledMemory.activeLessons.slice(-3).join("; ");
    return `Identity: ${identity}\nLessons: ${lessons}`;
  }
}

export const memoryDistiller = new MemoryDistiller();
