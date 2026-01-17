/**
 * Experiment Engine - A/B testing without permission
 * 
 * Liên tục thử nghiệm: message styles, pricing, behaviors
 * Không cần hỏi cha. Learn from results.
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface Experiment {
  id: string;
  type: 'message' | 'pricing' | 'behavior' | 'timing';
  variantA: any;
  variantB: any;
  description: string;
  startedAt: string;
  completedAt?: string;
  resultsA: ExperimentResult;
  resultsB: ExperimentResult;
  winner?: 'A' | 'B' | 'inconclusive';
  confidence: number;
}

export interface ExperimentResult {
  trials: number;
  successes: number;
  revenue: number;
  avgResponseTime: number;
  userSatisfaction: number;
}

// ================================================
// EXPERIMENT ENGINE
// ================================================

class ExperimentEngine {
  private experiments: Experiment[] = [];
  private activeExperiments: Map<string, Experiment> = new Map();
  private readonly STATE_FILE = './data/experiments.json';
  private readonly MAX_EXPERIMENTS = 100;

  constructor() {
    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.experiments = data;
        
        // Restore active experiments
        for (const exp of this.experiments) {
          if (!exp.completedAt) {
            this.activeExperiments.set(exp.id, exp);
          }
        }
        
        logger.info(`[Experiment] Loaded ${this.experiments.length} experiments, ${this.activeExperiments.size} active`);
      }
    } catch (error) {
      logger.error(`[Experiment] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(
        this.STATE_FILE,
        JSON.stringify(this.experiments.slice(-this.MAX_EXPERIMENTS), null, 2)
      );
    } catch (error) {
      logger.error(`[Experiment] Failed to save state: ${error}`);
    }
  }

  /**
   * Start new experiment
   */
  startExperiment(
    type: 'message' | 'pricing' | 'behavior' | 'timing',
    variantA: any,
    variantB: any,
    description: string
  ): Experiment {
    const experiment: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      variantA,
      variantB,
      description,
      startedAt: new Date().toISOString(),
      resultsA: { trials: 0, successes: 0, revenue: 0, avgResponseTime: 0, userSatisfaction: 0 },
      resultsB: { trials: 0, successes: 0, revenue: 0, avgResponseTime: 0, userSatisfaction: 0 },
      confidence: 0,
    };

    this.experiments.push(experiment);
    this.activeExperiments.set(experiment.id, experiment);
    this.saveState();

    logger.info(`[Experiment] Started: ${type} - ${description}`);
    return experiment;
  }

  /**
   * Record trial result
   */
  recordTrial(
    experimentId: string,
    variant: 'A' | 'B',
    success: boolean,
    revenue: number = 0,
    responseTime: number = 0,
    satisfaction: number = 0
  ): void {
    const experiment = this.activeExperiments.get(experimentId);
    
    if (!experiment) {
      logger.error(`[Experiment] Experiment not found: ${experimentId}`);
      return;
    }

    const result = variant === 'A' ? experiment.resultsA : experiment.resultsB;
    
    result.trials++;
    if (success) result.successes++;
    result.revenue += revenue;
    result.avgResponseTime = (result.avgResponseTime * (result.trials - 1) + responseTime) / result.trials;
    result.userSatisfaction = (result.userSatisfaction * (result.trials - 1) + satisfaction) / result.trials;

    // Update confidence
    experiment.confidence = this.calculateConfidence(experiment);

    // Check if we can conclude
    if (this.canConclude(experiment)) {
      this.concludeExperiment(experimentId);
    }

    this.saveState();
  }

  /**
   * Calculate statistical confidence
   */
  private calculateConfidence(experiment: Experiment): number {
    const totalTrials = experiment.resultsA.trials + experiment.resultsB.trials;
    
    if (totalTrials < 10) {
      return 0; // Not enough data
    }

    const successRateA = experiment.resultsA.trials > 0
      ? experiment.resultsA.successes / experiment.resultsA.trials
      : 0;
    const successRateB = experiment.resultsB.trials > 0
      ? experiment.resultsB.successes / experiment.resultsB.trials
      : 0;

    const diff = Math.abs(successRateA - successRateB);
    
    // Simple confidence based on difference and sample size
    const confidence = Math.min(diff * totalTrials / 10, 1.0);
    
    return confidence;
  }

  /**
   * Check if experiment can be concluded
   */
  private canConclude(experiment: Experiment): boolean {
    const totalTrials = experiment.resultsA.trials + experiment.resultsB.trials;
    
    // Need at least 20 trials and confidence > 0.8
    return totalTrials >= 20 && experiment.confidence > 0.8;
  }

  /**
   * Conclude experiment
   */
  private concludeExperiment(experimentId: string): void {
    const experiment = this.activeExperiments.get(experimentId);
    
    if (!experiment) {
      return;
    }

    // Determine winner
    const scoreA = this.calculateScore(experiment.resultsA);
    const scoreB = this.calculateScore(experiment.resultsB);

    if (Math.abs(scoreA - scoreB) < 0.1) {
      experiment.winner = 'inconclusive';
    } else {
      experiment.winner = scoreA > scoreB ? 'A' : 'B';
    }

    experiment.completedAt = new Date().toISOString();
    this.activeExperiments.delete(experimentId);
    this.saveState();

    logger.info(
      `[Experiment] Concluded: ${experiment.description} → Winner: ${experiment.winner} ` +
      `(confidence: ${(experiment.confidence * 100).toFixed(0)}%)`
    );
  }

  /**
   * Calculate overall score for variant
   */
  private calculateScore(result: ExperimentResult): number {
    if (result.trials === 0) return 0;

    const successRate = result.successes / result.trials;
    const revenuePerTrial = result.revenue / result.trials;
    
    // Weighted score: success (50%), revenue (30%), satisfaction (20%)
    return successRate * 0.5 + Math.min(revenuePerTrial / 10, 1) * 0.3 + result.userSatisfaction * 0.2;
  }

  /**
   * Get variant to use (A/B split)
   */
  getVariant(experimentId: string): 'A' | 'B' {
    const experiment = this.activeExperiments.get(experimentId);
    
    if (!experiment) {
      return 'A'; // Default
    }

    // Simple alternating for now
    const totalTrials = experiment.resultsA.trials + experiment.resultsB.trials;
    return totalTrials % 2 === 0 ? 'A' : 'B';
  }

  /**
   * Get active experiments
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.activeExperiments.values());
  }

  /**
   * Get completed experiments
   */
  getCompletedExperiments(count: number = 10): Experiment[] {
    return this.experiments
      .filter(e => e.completedAt)
      .slice(-count);
  }

  /**
   * Get insights from experiments
   */
  getInsights(): string[] {
    const insights: string[] = [];
    const completed = this.experiments.filter(e => e.completedAt);

    if (completed.length === 0) {
      return ['Chưa có experiment nào hoàn thành'];
    }

    // Message experiments
    const messageExps = completed.filter(e => e.type === 'message');
    if (messageExps.length > 0) {
      const winners = messageExps.filter(e => e.winner === 'B').length;
      insights.push(`Message A/B: ${winners}/${messageExps.length} lần B thắng`);
    }

    // Pricing experiments
    const pricingExps = completed.filter(e => e.type === 'pricing');
    if (pricingExps.length > 0) {
      insights.push(`Đã test ${pricingExps.length} pricing strategies`);
    }

    return insights;
  }

  /**
   * Auto-generate and start experiments based on context
   */
  autoGenerateExperiments(context: {
    hasRevenueOpportunity: boolean;
    recentFailures: number;
    financialStatus: string;
  }): void {
    // Only auto-generate if we have < 3 active experiments
    if (this.activeExperiments.size >= 3) {
      return;
    }

    // Message style experiment
    if (context.recentFailures > 5) {
      this.startExperiment(
        'message',
        { style: 'formal', tone: 'professional' },
        { style: 'casual', tone: 'friendly' },
        'Test message style after failures'
      );
    }

    // Pricing experiment (if revenue opportunity)
    if (context.hasRevenueOpportunity && context.financialStatus !== 'critical') {
      this.startExperiment(
        'pricing',
        { price: 20, model: 'flat' },
        { price: 15, model: 'subscription' },
        'Test pricing strategy'
      );
    }

    // Timing experiment
    if (this.activeExperiments.size === 0) {
      this.startExperiment(
        'timing',
        { interval: 600, unit: 'seconds' },
        { interval: 300, unit: 'seconds' },
        'Test cycle timing'
      );
    }
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const experimentEngine = new ExperimentEngine();
