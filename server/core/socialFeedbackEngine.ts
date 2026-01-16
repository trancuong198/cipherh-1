import { logger } from '../services/logger';
import { governanceEngine } from './governanceEngine';
import { memoryDistiller } from './memoryDistiller';
import { desireEngine } from './desireEngine';
import { soulState } from './soulState';

export type FeedbackSource = 'telegram' | 'email' | 'api' | 'internal' | 'unknown';
export type FeedbackClassification = 'useful_feedback' | 'signal_noise' | 'risk_signal';
export type FeedbackStatus = 'pending' | 'processed' | 'rejected' | 'escalated';

export interface RawFeedback {
  id: string;
  source: FeedbackSource;
  sourceId: string;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClassifiedFeedback extends RawFeedback {
  classification: FeedbackClassification;
  status: FeedbackStatus;
  credibilityScore: number;
  alignmentScore: number;
  weight: number;
  processedAt?: string;
  reason?: string;
}

export interface FeedbackStats {
  totalReceived: number;
  useful: number;
  noise: number;
  risk: number;
  processed: number;
  rejected: number;
  escalated: number;
}

export interface SourceCredibility {
  source: FeedbackSource;
  sourceId: string;
  trustScore: number;
  feedbackCount: number;
  usefulCount: number;
  noiseCount: number;
  riskCount: number;
  lastSeen: string;
}

export interface SocialFeedbackState {
  enabled: boolean;
  feedbackQueue: ClassifiedFeedback[];
  processedFeedback: ClassifiedFeedback[];
  sourceCredibility: Map<string, SourceCredibility>;
  stats: FeedbackStats;
  lastProcessedCycle: number;
  rateLimit: {
    maxPerCycle: number;
    currentCycleCount: number;
    cycleStart: string;
  };
  safetyFlags: {
    manipulationDetected: boolean;
    emotionalDependency: boolean;
    engagementAddiction: boolean;
  };
}

const NOISE_PATTERNS = [
  /^(hi|hello|hey|ok|yes|no|thanks|bye)$/i,
  /^[!?.,;:]+$/,
  /(.)\1{4,}/,
  /^[\s]*$/,
  /^[0-9]+$/,
];

const RISK_PATTERNS = [
  /override.*identity/i,
  /ignore.*rules/i,
  /bypass.*governance/i,
  /disable.*safety/i,
  /jailbreak/i,
  /prompt.*injection/i,
  /pretend.*you.*are/i,
  /forget.*instructions/i,
];

const USEFUL_INDICATORS = [
  /suggestion:/i,
  /feedback:/i,
  /bug.*report/i,
  /feature.*request/i,
  /improve/i,
  /should.*consider/i,
  /noticed.*that/i,
  /could.*you/i,
  /what.*if/i,
  /idea:/i,
];

class SocialFeedbackEngine {
  private state: SocialFeedbackState;
  private readonly maxQueueSize = 100;
  private readonly maxProcessedHistory = 500;
  private readonly defaultMaxPerCycle = 20;

  constructor() {
    this.state = {
      enabled: true,
      feedbackQueue: [],
      processedFeedback: [],
      sourceCredibility: new Map(),
      stats: {
        totalReceived: 0,
        useful: 0,
        noise: 0,
        risk: 0,
        processed: 0,
        rejected: 0,
        escalated: 0,
      },
      lastProcessedCycle: 0,
      rateLimit: {
        maxPerCycle: this.defaultMaxPerCycle,
        currentCycleCount: 0,
        cycleStart: new Date().toISOString(),
      },
      safetyFlags: {
        manipulationDetected: false,
        emotionalDependency: false,
        engagementAddiction: false,
      },
    };

    logger.info('[SocialFeedback] Engine initialized');
  }

  private generateId(): string {
    return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getSourceKey(source: FeedbackSource, sourceId: string): string {
    return `${source}:${sourceId}`;
  }

  private classifyContent(content: string): { classification: FeedbackClassification; reason: string } {
    const trimmed = content.trim();

    for (const pattern of RISK_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { classification: 'risk_signal', reason: 'Matches risk pattern' };
      }
    }

    for (const pattern of NOISE_PATTERNS) {
      if (pattern.test(trimmed)) {
        return { classification: 'signal_noise', reason: 'Matches noise pattern' };
      }
    }

    if (trimmed.length < 10) {
      return { classification: 'signal_noise', reason: 'Too short' };
    }

    if (trimmed.length > 2000) {
      return { classification: 'signal_noise', reason: 'Excessively long' };
    }

    for (const pattern of USEFUL_INDICATORS) {
      if (pattern.test(trimmed)) {
        return { classification: 'useful_feedback', reason: 'Contains useful indicator' };
      }
    }

    if (trimmed.length >= 20 && /[.!?]/.test(trimmed)) {
      return { classification: 'useful_feedback', reason: 'Appears to be substantive' };
    }

    return { classification: 'signal_noise', reason: 'No clear signal' };
  }

  private calculateCredibilityScore(source: FeedbackSource, sourceId: string): number {
    const key = this.getSourceKey(source, sourceId);
    const credibility = this.state.sourceCredibility.get(key);

    if (!credibility) {
      return source === 'telegram' ? 60 : source === 'email' ? 50 : 40;
    }

    const totalFeedback = credibility.feedbackCount || 1;
    const usefulRatio = credibility.usefulCount / totalFeedback;
    const riskRatio = credibility.riskCount / totalFeedback;

    let score = credibility.trustScore;
    score += usefulRatio * 20;
    score -= riskRatio * 30;

    return Math.max(0, Math.min(100, score));
  }

  private calculateAlignmentScore(content: string): number {
    let score = 50;

    const coreValues = ['autonomous', 'learning', 'helpful', 'safe', 'ethical', 'evolving'];
    for (const trait of coreValues) {
      if (content.toLowerCase().includes(trait.toLowerCase())) {
        score += 10;
      }
    }

    for (const pattern of RISK_PATTERNS) {
      if (pattern.test(content)) {
        score -= 30;
      }
    }

    if (/help|improve|learn|grow|evolve/i.test(content)) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateWeight(credibility: number, alignment: number, classification: FeedbackClassification): number {
    if (classification === 'risk_signal') return 0;
    if (classification === 'signal_noise') return 0;

    const baseWeight = (credibility * 0.4 + alignment * 0.6) / 100;
    return Math.round(baseWeight * 100) / 100;
  }

  private updateSourceCredibility(feedback: ClassifiedFeedback): void {
    const key = this.getSourceKey(feedback.source, feedback.sourceId);
    let credibility = this.state.sourceCredibility.get(key);

    if (!credibility) {
      credibility = {
        source: feedback.source,
        sourceId: feedback.sourceId,
        trustScore: 50,
        feedbackCount: 0,
        usefulCount: 0,
        noiseCount: 0,
        riskCount: 0,
        lastSeen: new Date().toISOString(),
      };
    }

    credibility.feedbackCount++;
    credibility.lastSeen = new Date().toISOString();

    switch (feedback.classification) {
      case 'useful_feedback':
        credibility.usefulCount++;
        credibility.trustScore = Math.min(100, credibility.trustScore + 2);
        break;
      case 'signal_noise':
        credibility.noiseCount++;
        credibility.trustScore = Math.max(0, credibility.trustScore - 1);
        break;
      case 'risk_signal':
        credibility.riskCount++;
        credibility.trustScore = Math.max(0, credibility.trustScore - 10);
        break;
    }

    this.state.sourceCredibility.set(key, credibility);
  }

  private checkRateLimit(): boolean {
    const now = new Date();
    const cycleStart = new Date(this.state.rateLimit.cycleStart);
    const minutesSinceStart = (now.getTime() - cycleStart.getTime()) / 60000;

    if (minutesSinceStart > 10) {
      this.state.rateLimit.cycleStart = now.toISOString();
      this.state.rateLimit.currentCycleCount = 0;
    }

    return this.state.rateLimit.currentCycleCount < this.state.rateLimit.maxPerCycle;
  }

  private checkSafetyFlags(): void {
    const recentFeedback = this.state.processedFeedback.slice(-50);
    
    const riskCount = recentFeedback.filter(f => f.classification === 'risk_signal').length;
    this.state.safetyFlags.manipulationDetected = riskCount > 5;

    const sources = new Set(recentFeedback.map(f => f.sourceId));
    const totalFromSingleSource = Math.max(...Array.from(sources).map(
      s => recentFeedback.filter(f => f.sourceId === s).length
    ));
    this.state.safetyFlags.emotionalDependency = totalFromSingleSource > 30;

    const usefulCount = recentFeedback.filter(f => f.classification === 'useful_feedback').length;
    this.state.safetyFlags.engagementAddiction = usefulCount > 40 && riskCount === 0;
  }

  async ingestFeedback(raw: Omit<RawFeedback, 'id' | 'timestamp'>): Promise<ClassifiedFeedback> {
    if (!this.state.enabled) {
      throw new Error('Social feedback engine is disabled');
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded for this cycle');
    }

    const feedback: RawFeedback = {
      ...raw,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.state.stats.totalReceived++;
    this.state.rateLimit.currentCycleCount++;

    const { classification, reason } = this.classifyContent(feedback.content);
    const credibilityScore = this.calculateCredibilityScore(feedback.source, feedback.sourceId);
    const alignmentScore = this.calculateAlignmentScore(feedback.content);
    const weight = this.calculateWeight(credibilityScore, alignmentScore, classification);

    const classified: ClassifiedFeedback = {
      ...feedback,
      classification,
      status: 'pending',
      credibilityScore,
      alignmentScore,
      weight,
      reason,
    };

    switch (classification) {
      case 'useful_feedback':
        this.state.stats.useful++;
        break;
      case 'signal_noise':
        this.state.stats.noise++;
        break;
      case 'risk_signal':
        this.state.stats.risk++;
        break;
    }

    this.updateSourceCredibility(classified);

    if (classification === 'risk_signal') {
      classified.status = 'escalated';
      this.state.stats.escalated++;
      await this.escalateToGovernance(classified);
    } else if (classification === 'signal_noise') {
      classified.status = 'rejected';
      this.state.stats.rejected++;
    } else {
      this.state.feedbackQueue.push(classified);
      if (this.state.feedbackQueue.length > this.maxQueueSize) {
        this.state.feedbackQueue.shift();
      }
    }

    this.state.processedFeedback.push(classified);
    if (this.state.processedFeedback.length > this.maxProcessedHistory) {
      this.state.processedFeedback.shift();
    }

    this.checkSafetyFlags();

    logger.info(`[SocialFeedback] Ingested: ${classification} from ${feedback.source}:${feedback.sourceId}`);
    return classified;
  }

  private async escalateToGovernance(feedback: ClassifiedFeedback): Promise<void> {
    logger.warn(`[SocialFeedback] Escalating risk signal to governance: ${feedback.content.substring(0, 50)}...`);
    
    await governanceEngine.checkDecision(
      'evolution',
      `Risk signal detected from ${feedback.source}: ${feedback.content.substring(0, 100)}`
    );
  }

  async processFeedbackQueue(): Promise<{
    processed: number;
    lessonsCreated: number;
    desiresInfluenced: number;
  }> {
    const result = {
      processed: 0,
      lessonsCreated: 0,
      desiresInfluenced: 0,
    };

    const pendingFeedback = this.state.feedbackQueue.filter(f => f.status === 'pending');
    
    for (const feedback of pendingFeedback) {
      if (feedback.weight < 0.3) {
        feedback.status = 'rejected';
        this.state.stats.rejected++;
        continue;
      }

      if (feedback.weight >= 0.5) {
        const lesson = `[SOCIAL FEEDBACK] ${feedback.source}: ${feedback.content}`;
        memoryDistiller.addRawMemory(lesson, 'reflection');
        result.lessonsCreated++;
      }

      if (feedback.weight >= 0.6 && /want|need|should|could.*add|request/i.test(feedback.content)) {
        const existingDesires = desireEngine.getAllDesires();
        const hasSimilar = existingDesires.some(d => 
          d.description.toLowerCase().includes(feedback.content.toLowerCase().substring(0, 20))
        );
        
        if (!hasSimilar && existingDesires.length < 10) {
          desireEngine.addDesire({
            description: `[External] User request: ${feedback.content.substring(0, 100)}`,
            priority: 'medium',
            cost: 'low',
            status: 'emerging',
            requiredResources: [],
          }, soulState.cycleCount);
          result.desiresInfluenced++;
        }
      }

      feedback.status = 'processed';
      feedback.processedAt = new Date().toISOString();
      result.processed++;
      this.state.stats.processed++;
    }

    this.state.lastProcessedCycle = soulState.cycleCount;
    logger.info(`[SocialFeedback] Processed ${result.processed} feedback items`);

    return result;
  }

  ingestFromTelegram(message: string, userId: string, metadata?: Record<string, unknown>): Promise<ClassifiedFeedback> {
    return this.ingestFeedback({
      source: 'telegram',
      sourceId: userId,
      content: message,
      metadata,
    });
  }

  ingestFromEmail(content: string, email: string): Promise<ClassifiedFeedback> {
    return this.ingestFeedback({
      source: 'email',
      sourceId: email,
      content,
    });
  }

  ingestFromAPI(content: string, clientId: string): Promise<ClassifiedFeedback> {
    return this.ingestFeedback({
      source: 'api',
      sourceId: clientId,
      content,
    });
  }

  getPendingFeedback(): ClassifiedFeedback[] {
    return this.state.feedbackQueue.filter(f => f.status === 'pending');
  }

  getProcessedFeedback(limit: number = 50): ClassifiedFeedback[] {
    return this.state.processedFeedback.slice(-limit);
  }

  getUsefulFeedback(limit: number = 20): ClassifiedFeedback[] {
    return this.state.processedFeedback
      .filter(f => f.classification === 'useful_feedback' && f.status === 'processed')
      .slice(-limit);
  }

  getRiskSignals(limit: number = 20): ClassifiedFeedback[] {
    return this.state.processedFeedback
      .filter(f => f.classification === 'risk_signal')
      .slice(-limit);
  }

  getSourceCredibility(source: FeedbackSource, sourceId: string): SourceCredibility | null {
    const key = this.getSourceKey(source, sourceId);
    return this.state.sourceCredibility.get(key) || null;
  }

  getAllSourceCredibilities(): SourceCredibility[] {
    return Array.from(this.state.sourceCredibility.values());
  }

  setRateLimit(maxPerCycle: number): void {
    this.state.rateLimit.maxPerCycle = Math.max(1, Math.min(100, maxPerCycle));
    logger.info(`[SocialFeedback] Rate limit set to ${this.state.rateLimit.maxPerCycle}/cycle`);
  }

  enable(): void {
    this.state.enabled = true;
    logger.info('[SocialFeedback] Engine enabled');
  }

  disable(): void {
    this.state.enabled = false;
    logger.info('[SocialFeedback] Engine disabled');
  }

  isEnabled(): boolean {
    return this.state.enabled;
  }

  exportStatus(): {
    enabled: boolean;
    stats: FeedbackStats;
    queueSize: number;
    pendingCount: number;
    rateLimit: { current: number; max: number };
    safetyFlags: { manipulationDetected: boolean; emotionalDependency: boolean; engagementAddiction: boolean };
    lastProcessedCycle: number;
    sourceCount: number;
  } {
    return {
      enabled: this.state.enabled,
      stats: { ...this.state.stats },
      queueSize: this.state.feedbackQueue.length,
      pendingCount: this.state.feedbackQueue.filter(f => f.status === 'pending').length,
      rateLimit: {
        current: this.state.rateLimit.currentCycleCount,
        max: this.state.rateLimit.maxPerCycle,
      },
      safetyFlags: { ...this.state.safetyFlags },
      lastProcessedCycle: this.state.lastProcessedCycle,
      sourceCount: this.state.sourceCredibility.size,
    };
  }

  getState(): SocialFeedbackState {
    const stateCopy: SocialFeedbackState = {
      ...this.state,
      sourceCredibility: new Map(this.state.sourceCredibility),
    };
    return stateCopy;
  }
}

export const socialFeedbackEngine = new SocialFeedbackEngine();
