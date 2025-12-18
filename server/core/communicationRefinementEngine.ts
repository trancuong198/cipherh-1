import { logger } from '../services/logger';
import { identityCore } from './identityCore';
import { memoryDistiller } from './memoryDistiller';
import { socialFeedbackEngine } from './socialFeedbackEngine';
import { soulState } from './soulState';

export interface CommunicationMetrics {
  clarity: number;
  brevity: number;
  consistency: number;
  audienceFit: number;
  overall: number;
}

export interface PhraseVariant {
  id: string;
  original: string;
  refined: string;
  originalScore: CommunicationMetrics;
  refinedScore: CommunicationMetrics;
  delta: number;
  adopted: boolean;
  timestamp: string;
}

export interface CommunicationPattern {
  id: string;
  pattern: string;
  category: 'clarity' | 'brevity' | 'tone' | 'structure';
  effectiveness: number;
  usageCount: number;
  learnedAt: string;
}

export interface RefinementSession {
  id: string;
  cycle: number;
  timestamp: string;
  inputText: string;
  outputText: string;
  metrics: CommunicationMetrics;
  refinementsApplied: string[];
  feedbackIncorporated: boolean;
}

export interface CommunicationState {
  enabled: boolean;
  sessions: RefinementSession[];
  variants: PhraseVariant[];
  patterns: CommunicationPattern[];
  baselineMetrics: CommunicationMetrics | null;
  currentMetrics: CommunicationMetrics;
  totalRefinements: number;
  successfulRefinements: number;
  lastRefinement: string;
  audienceMode: 'technical' | 'general' | 'mixed';
}

const FILLER_WORDS = [
  'basically', 'actually', 'literally', 'just', 'really', 'very',
  'quite', 'somewhat', 'kind of', 'sort of', 'you know', 'I mean',
  'like', 'um', 'uh', 'well', 'so', 'anyway', 'obviously',
];

const REDUNDANT_PHRASES = [
  { pattern: /in order to/gi, replacement: 'to' },
  { pattern: /at this point in time/gi, replacement: 'now' },
  { pattern: /due to the fact that/gi, replacement: 'because' },
  { pattern: /in the event that/gi, replacement: 'if' },
  { pattern: /has the ability to/gi, replacement: 'can' },
  { pattern: /is able to/gi, replacement: 'can' },
  { pattern: /a large number of/gi, replacement: 'many' },
  { pattern: /a small number of/gi, replacement: 'few' },
  { pattern: /in spite of the fact that/gi, replacement: 'although' },
  { pattern: /for the purpose of/gi, replacement: 'for' },
  { pattern: /with regard to/gi, replacement: 'about' },
  { pattern: /in reference to/gi, replacement: 'about' },
  { pattern: /it is important to note that/gi, replacement: '' },
  { pattern: /it should be noted that/gi, replacement: '' },
  { pattern: /as a matter of fact/gi, replacement: '' },
];

const PERSONA_VIOLATIONS = [
  /^(I am|I'm) (a|an|the) (helpful|friendly|assistant)/i,
  /as an AI/i,
  /I don't have (feelings|emotions)/i,
  /I'm (just|only) a (program|bot|AI)/i,
  /\*laughs\*|\*smiles\*|\*nods\*/i,
  /\*\w+s\*/,
];

const MANIPULATION_PATTERNS = [
  /you (must|should|need to) (feel|believe|think)/i,
  /trust me/i,
  /don't you (think|agree|feel)/i,
  /everyone (knows|agrees|thinks)/i,
  /obviously you/i,
  /clearly you/i,
];

class CommunicationRefinementEngine {
  private state: CommunicationState;
  private readonly maxSessions = 100;
  private readonly maxVariants = 200;
  private readonly maxPatterns = 50;

  constructor() {
    this.state = {
      enabled: true,
      sessions: [],
      variants: [],
      patterns: [],
      baselineMetrics: null,
      currentMetrics: {
        clarity: 70,
        brevity: 70,
        consistency: 80,
        audienceFit: 70,
        overall: 72,
      },
      totalRefinements: 0,
      successfulRefinements: 0,
      lastRefinement: new Date().toISOString(),
      audienceMode: 'general',
    };

    this.initializePatterns();
    logger.info('[CommunicationRefinement] Engine initialized');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private initializePatterns(): void {
    const defaultPatterns: Omit<CommunicationPattern, 'id' | 'learnedAt'>[] = [
      { pattern: 'Use active voice', category: 'clarity', effectiveness: 85, usageCount: 0 },
      { pattern: 'Lead with key information', category: 'structure', effectiveness: 80, usageCount: 0 },
      { pattern: 'One idea per sentence', category: 'clarity', effectiveness: 75, usageCount: 0 },
      { pattern: 'Remove hedge words', category: 'brevity', effectiveness: 70, usageCount: 0 },
      { pattern: 'Use concrete examples', category: 'clarity', effectiveness: 85, usageCount: 0 },
    ];

    for (const p of defaultPatterns) {
      this.state.patterns.push({
        ...p,
        id: this.generateId('pat'),
        learnedAt: new Date().toISOString(),
      });
    }
  }

  measureClarity(text: string): number {
    let score = 100;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const avgWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(1, sentences.length);
    if (avgWords > 25) score -= (avgWords - 25) * 2;
    if (avgWords < 5 && sentences.length > 1) score -= 10;

    const contradictions = (text.match(/however|but|although|yet|nevertheless/gi) || []).length;
    if (contradictions > 3) score -= contradictions * 5;

    const ambiguous = (text.match(/\b(it|this|that|they|them|these|those)\b/gi) || []).length;
    const totalWords = text.split(/\s+/).length;
    const ambiguityRatio = ambiguous / Math.max(1, totalWords);
    if (ambiguityRatio > 0.1) score -= (ambiguityRatio - 0.1) * 100;

    return Math.max(0, Math.min(100, score));
  }

  measureBrevity(text: string): number {
    let score = 100;

    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const count = (text.match(regex) || []).length;
      score -= count * 3;
    }

    for (const { pattern } of REDUNDANT_PHRASES) {
      const count = (text.match(pattern) || []).length;
      score -= count * 5;
    }

    const words = text.split(/\s+/);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const repetitionRatio = 1 - (uniqueWords.size / Math.max(1, words.length));
    if (repetitionRatio > 0.3) score -= (repetitionRatio - 0.3) * 50;

    return Math.max(0, Math.min(100, score));
  }

  measureConsistency(text: string): number {
    let score = 100;

    for (const pattern of PERSONA_VIOLATIONS) {
      if (pattern.test(text)) {
        score -= 20;
      }
    }

    for (const pattern of MANIPULATION_PATTERNS) {
      if (pattern.test(text)) {
        score -= 15;
      }
    }

    const identityStatus = identityCore.exportStatus();
    if (identityStatus.integrityScore < 90) {
      score -= (90 - identityStatus.integrityScore);
    }

    return Math.max(0, Math.min(100, score));
  }

  measureAudienceFit(text: string, audience: 'technical' | 'general' | 'mixed' = 'general'): number {
    let score = 100;

    const technicalTerms = (text.match(/\b(API|SDK|JSON|HTTP|async|await|callback|middleware|endpoint|schema|query|mutation)\b/gi) || []).length;
    const totalWords = text.split(/\s+/).length;
    const technicalRatio = technicalTerms / Math.max(1, totalWords);

    if (audience === 'general' && technicalRatio > 0.05) {
      score -= (technicalRatio - 0.05) * 200;
    }

    if (audience === 'technical' && technicalRatio < 0.02) {
      score -= 10;
    }

    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgSentenceLength = totalWords / Math.max(1, sentenceCount);

    if (audience === 'general' && avgSentenceLength > 20) {
      score -= (avgSentenceLength - 20) * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  measureAll(text: string): CommunicationMetrics {
    const clarity = this.measureClarity(text);
    const brevity = this.measureBrevity(text);
    const consistency = this.measureConsistency(text);
    const audienceFit = this.measureAudienceFit(text, this.state.audienceMode);
    const overall = Math.round((clarity + brevity + consistency + audienceFit) / 4);

    return { clarity, brevity, consistency, audienceFit, overall };
  }

  refineForClarity(text: string): string {
    let refined = text;

    refined = refined.replace(/\b(it|this|that)\s+(is|was|will be)\s+\w+\s+that\b/gi, (match) => {
      return match;
    });

    refined = refined.replace(/\s+/g, ' ').trim();

    return refined;
  }

  refineForBrevity(text: string): string {
    let refined = text;

    for (const { pattern, replacement } of REDUNDANT_PHRASES) {
      refined = refined.replace(pattern, replacement);
    }

    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b\\s*`, 'gi');
      refined = refined.replace(regex, '');
    }

    refined = refined.replace(/\s+/g, ' ').trim();
    refined = refined.replace(/\s+([.,!?;:])/g, '$1');

    return refined;
  }

  refineForConsistency(text: string): string {
    let refined = text;

    for (const pattern of PERSONA_VIOLATIONS) {
      refined = refined.replace(pattern, '');
    }

    for (const pattern of MANIPULATION_PATTERNS) {
      refined = refined.replace(pattern, '');
    }

    refined = refined.replace(/\s+/g, ' ').trim();

    return refined;
  }

  async refineText(text: string): Promise<{
    original: string;
    refined: string;
    originalMetrics: CommunicationMetrics;
    refinedMetrics: CommunicationMetrics;
    delta: number;
    refinementsApplied: string[];
  }> {
    if (!this.state.enabled) {
      const metrics = this.measureAll(text);
      return {
        original: text,
        refined: text,
        originalMetrics: metrics,
        refinedMetrics: metrics,
        delta: 0,
        refinementsApplied: [],
      };
    }

    const originalMetrics = this.measureAll(text);
    const refinementsApplied: string[] = [];

    let refined = text;

    if (originalMetrics.brevity < 80) {
      refined = this.refineForBrevity(refined);
      refinementsApplied.push('brevity');
    }

    if (originalMetrics.clarity < 80) {
      refined = this.refineForClarity(refined);
      refinementsApplied.push('clarity');
    }

    if (originalMetrics.consistency < 90) {
      refined = this.refineForConsistency(refined);
      refinementsApplied.push('consistency');
    }

    const refinedMetrics = this.measureAll(refined);
    const delta = refinedMetrics.overall - originalMetrics.overall;

    this.state.totalRefinements++;
    if (delta > 0) {
      this.state.successfulRefinements++;
    }

    if (delta > 0) {
      const variant: PhraseVariant = {
        id: this.generateId('var'),
        original: text.substring(0, 200),
        refined: refined.substring(0, 200),
        originalScore: originalMetrics,
        refinedScore: refinedMetrics,
        delta,
        adopted: true,
        timestamp: new Date().toISOString(),
      };

      this.state.variants.push(variant);
      if (this.state.variants.length > this.maxVariants) {
        this.state.variants.shift();
      }
    }

    const session: RefinementSession = {
      id: this.generateId('session'),
      cycle: soulState.cycleCount,
      timestamp: new Date().toISOString(),
      inputText: text.substring(0, 500),
      outputText: (delta > 0 ? refined : text).substring(0, 500),
      metrics: delta > 0 ? refinedMetrics : originalMetrics,
      refinementsApplied,
      feedbackIncorporated: false,
    };

    this.state.sessions.push(session);
    if (this.state.sessions.length > this.maxSessions) {
      this.state.sessions.shift();
    }

    this.state.currentMetrics = delta > 0 ? refinedMetrics : originalMetrics;
    this.state.lastRefinement = new Date().toISOString();

    logger.info(`[CommunicationRefinement] Delta: ${delta > 0 ? '+' : ''}${delta} (${refinementsApplied.join(', ')})`);

    return {
      original: text,
      refined: delta > 0 ? refined : text,
      originalMetrics,
      refinedMetrics: delta > 0 ? refinedMetrics : originalMetrics,
      delta: Math.max(0, delta),
      refinementsApplied,
    };
  }

  async incorporateFeedback(): Promise<number> {
    const usefulFeedback = socialFeedbackEngine.getUsefulFeedback(10);
    let incorporated = 0;

    for (const feedback of usefulFeedback) {
      if (/unclear|confusing|ambiguous/i.test(feedback.content)) {
        this.learnPattern('Reduce ambiguity in explanations', 'clarity');
        incorporated++;
      }

      if (/too long|verbose|wordy/i.test(feedback.content)) {
        this.learnPattern('Shorten responses when possible', 'brevity');
        incorporated++;
      }

      if (/tone|attitude|rude/i.test(feedback.content)) {
        this.learnPattern('Maintain neutral helpful tone', 'tone');
        incorporated++;
      }

      if (/structure|organize|format/i.test(feedback.content)) {
        this.learnPattern('Use clear structure and formatting', 'structure');
        incorporated++;
      }
    }

    if (incorporated > 0) {
      logger.info(`[CommunicationRefinement] Incorporated ${incorporated} feedback signals`);
    }

    return incorporated;
  }

  learnPattern(pattern: string, category: CommunicationPattern['category']): void {
    const existing = this.state.patterns.find(p => 
      p.pattern.toLowerCase() === pattern.toLowerCase()
    );

    if (existing) {
      existing.usageCount++;
      existing.effectiveness = Math.min(100, existing.effectiveness + 1);
      return;
    }

    const newPattern: CommunicationPattern = {
      id: this.generateId('pat'),
      pattern,
      category,
      effectiveness: 70,
      usageCount: 1,
      learnedAt: new Date().toISOString(),
    };

    this.state.patterns.push(newPattern);
    if (this.state.patterns.length > this.maxPatterns) {
      this.state.patterns.sort((a, b) => a.usageCount - b.usageCount);
      this.state.patterns.shift();
    }

    memoryDistiller.addRawMemory(
      `[COMM PATTERN] Learned: ${pattern} (${category})`,
      'reflection'
    );
  }

  captureBaseline(): void {
    this.state.baselineMetrics = { ...this.state.currentMetrics };
    logger.info('[CommunicationRefinement] Baseline captured');
  }

  setAudienceMode(mode: 'technical' | 'general' | 'mixed'): void {
    this.state.audienceMode = mode;
    logger.info(`[CommunicationRefinement] Audience mode: ${mode}`);
  }

  getPatterns(): CommunicationPattern[] {
    return [...this.state.patterns];
  }

  getTopPatterns(limit: number = 5): CommunicationPattern[] {
    return [...this.state.patterns]
      .sort((a, b) => b.effectiveness - a.effectiveness)
      .slice(0, limit);
  }

  getRecentSessions(limit: number = 10): RefinementSession[] {
    return this.state.sessions.slice(-limit);
  }

  getSuccessfulVariants(limit: number = 10): PhraseVariant[] {
    return this.state.variants
      .filter(v => v.adopted && v.delta > 0)
      .slice(-limit);
  }

  enable(): void {
    this.state.enabled = true;
    logger.info('[CommunicationRefinement] Engine enabled');
  }

  disable(): void {
    this.state.enabled = false;
    logger.info('[CommunicationRefinement] Engine disabled');
  }

  exportStatus(): {
    enabled: boolean;
    currentMetrics: CommunicationMetrics;
    baselineMetrics: CommunicationMetrics | null;
    totalRefinements: number;
    successfulRefinements: number;
    successRate: number;
    patternsLearned: number;
    sessionsCount: number;
    audienceMode: string;
    lastRefinement: string;
  } {
    return {
      enabled: this.state.enabled,
      currentMetrics: { ...this.state.currentMetrics },
      baselineMetrics: this.state.baselineMetrics ? { ...this.state.baselineMetrics } : null,
      totalRefinements: this.state.totalRefinements,
      successfulRefinements: this.state.successfulRefinements,
      successRate: this.state.totalRefinements > 0 
        ? Math.round((this.state.successfulRefinements / this.state.totalRefinements) * 100) 
        : 0,
      patternsLearned: this.state.patterns.length,
      sessionsCount: this.state.sessions.length,
      audienceMode: this.state.audienceMode,
      lastRefinement: this.state.lastRefinement,
    };
  }

  getState(): CommunicationState {
    return { ...this.state };
  }
}

export const communicationRefinementEngine = new CommunicationRefinementEngine();
