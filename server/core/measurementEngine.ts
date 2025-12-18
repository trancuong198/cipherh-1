import { logger } from '../services/logger';
import { soulState } from './soulState';
import { evolutionKernel } from './evolutionKernel';
import { memoryDistiller } from './memoryDistiller';
import { desireEngine } from './desireEngine';
import { governanceEngine } from './governanceEngine';
import { identityCore } from './identityCore';
import { memoryBridge } from './memory';

export type MetricDomain = 'reasoning' | 'language' | 'memory' | 'autonomy' | 'evolution' | 'stability';
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export interface MetricValue {
  value: number;
  timestamp: string;
  cycle: number;
}

export interface DomainMetrics {
  domain: MetricDomain;
  currentScore: number;
  baseline: number;
  delta: number;
  trend: TrendDirection;
  history: MetricValue[];
  components: Record<string, number>;
}

export interface DailyScorecard {
  id: string;
  date: string;
  cycle: number;
  overallScore: number;
  domainScores: Record<MetricDomain, number>;
  highlights: string[];
  concerns: string[];
}

export interface WeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  cycleRange: { start: number; end: number };
  averageScore: number;
  trend: TrendDirection;
  domainTrends: Record<MetricDomain, TrendDirection>;
  improvements: string[];
  regressions: string[];
  recommendations: string[];
}

export interface MonthlyAlert {
  id: string;
  month: string;
  cycleRange: { start: number; end: number };
  regressions: Array<{
    domain: MetricDomain;
    baseline: number;
    current: number;
    deltaPercent: number;
    severity: 'minor' | 'moderate' | 'severe';
  }>;
  overallTrend: TrendDirection;
  actionRequired: boolean;
}

export interface BenchmarkResult {
  id: string;
  timestamp: string;
  cycle: number;
  testSuite: string;
  passed: number;
  failed: number;
  score: number;
  details: Record<string, { passed: boolean; score: number }>;
}

export interface MeasurementState {
  initialized: boolean;
  baselineSnapshot: Record<MetricDomain, number> | null;
  baselineCycle: number;
  dailyScorecards: DailyScorecard[];
  weeklyReports: WeeklyReport[];
  monthlyAlerts: MonthlyAlert[];
  benchmarkResults: BenchmarkResult[];
  metricHistory: Record<MetricDomain, MetricValue[]>;
  lastMeasurement: string;
  totalMeasurements: number;
}

class MeasurementEngine {
  private state: MeasurementState;
  private readonly maxHistory = 1000;
  private readonly maxScorecards = 90;
  private readonly maxReports = 52;

  constructor() {
    this.state = {
      initialized: true,
      baselineSnapshot: null,
      baselineCycle: 0,
      dailyScorecards: [],
      weeklyReports: [],
      monthlyAlerts: [],
      benchmarkResults: [],
      metricHistory: {
        reasoning: [],
        language: [],
        memory: [],
        autonomy: [],
        evolution: [],
        stability: [],
      },
      lastMeasurement: new Date().toISOString(),
      totalMeasurements: 0,
    };

    logger.info('[Measurement] Engine initialized');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  measureReasoningClarity(): DomainMetrics {
    const evolutionState = evolutionKernel.getState();
    const govStatus = governanceEngine.exportStatus();
    
    const consistency = 100 - (govStatus.totalViolations * 5);
    const contradictionRate = Math.max(0, 100 - (govStatus.recentViolations * 10));
    const decisionQuality = evolutionState.capabilities.reasoningClarity;
    
    const currentScore = Math.round((consistency + contradictionRate + decisionQuality) / 3);

    return this.buildMetrics('reasoning', currentScore, {
      consistency,
      contradictionRate,
      decisionQuality,
    });
  }

  measureLanguageQuality(): DomainMetrics {
    const evolutionState = evolutionKernel.getState();
    
    const coherence = evolutionState.capabilities.languageQuality;
    const brevity = Math.min(100, 70 + (soulState.cycleCount * 0.5));
    const clarity = Math.min(100, 60 + (soulState.confidence * 0.3));
    
    const currentScore = Math.round((coherence + brevity + clarity) / 3);

    return this.buildMetrics('language', currentScore, {
      coherence,
      brevity,
      clarity,
    });
  }

  measureMemoryEfficiency(): DomainMetrics {
    const memoryStatus = memoryDistiller.exportStatus();
    const evolutionState = evolutionKernel.getState();
    
    const totalProcessed = memoryStatus.totalProcessed || 1;
    const recallRelevance = Math.min(100, (memoryStatus.activeLessonsCount / Math.max(1, totalProcessed * 0.1)) * 100);
    const decayAccuracy = 100 - ((memoryStatus.totalDiscarded / Math.max(1, totalProcessed)) * 50);
    const coherence = evolutionState.capabilities.memoryCoherence;
    
    const currentScore = Math.round((recallRelevance + decayAccuracy + coherence) / 3);

    return this.buildMetrics('memory', currentScore, {
      recallRelevance: Math.min(100, recallRelevance),
      decayAccuracy: Math.max(0, decayAccuracy),
      coherence,
    });
  }

  measureAutonomy(): DomainMetrics {
    const desires = desireEngine.getAllDesires();
    const achievable = desireEngine.getAchievableDesires();
    const evolutionState = evolutionKernel.getState();
    
    const selfInitiated = achievable.length;
    const resolved = desires.filter(d => d.status === 'resolved').length;
    const resolutionRate = desires.length > 0 ? (resolved / desires.length) * 100 : 50;
    const autonomyLevel = evolutionState.capabilities.autonomyLevel;
    
    const currentScore = Math.round((resolutionRate + autonomyLevel + (selfInitiated * 10)) / 3);

    return this.buildMetrics('autonomy', Math.min(100, currentScore), {
      selfInitiatedTasks: selfInitiated,
      resolvedTasks: resolved,
      resolutionRate,
      autonomyLevel,
    });
  }

  measureEvolutionVelocity(): DomainMetrics {
    const evolutionState = evolutionKernel.getState();
    const log = evolutionState.evolutionLog || [];
    
    const recentEvolutions = log.slice(-10);
    const usefulChanges = recentEvolutions.reduce((sum, e) => sum + (e.improvements?.length || 0), 0);
    const changesPerCycle = soulState.cycleCount > 0 ? (evolutionState.evolutionCount / soulState.cycleCount) * 100 : 0;
    const versionProgress = parseInt(evolutionState.version.replace('v', '').split('.')[1] || '0') * 10;
    
    const currentScore = Math.round((usefulChanges * 5 + changesPerCycle + versionProgress) / 3);

    return this.buildMetrics('evolution', Math.min(100, currentScore), {
      usefulChangesRecent: usefulChanges,
      changesPerCycle,
      versionProgress,
      totalEvolutions: evolutionState.evolutionCount,
    });
  }

  measureStability(): DomainMetrics {
    const govStatus = governanceEngine.exportStatus();
    const identityStatus = identityCore.exportStatus();
    
    const governanceHealth = 100 - (govStatus.totalViolations * 2);
    const identityIntegrity = identityStatus.integrityScore;
    const rollbackFree = govStatus.conservativeMode ? 70 : 100;
    const violationFree = Math.max(0, 100 - (govStatus.recentViolations * 20));
    
    const currentScore = Math.round((governanceHealth + identityIntegrity + rollbackFree + violationFree) / 4);

    return this.buildMetrics('stability', Math.max(0, Math.min(100, currentScore)), {
      governanceHealth: Math.max(0, governanceHealth),
      identityIntegrity,
      rollbackFree,
      violationFree,
    });
  }

  private buildMetrics(domain: MetricDomain, currentScore: number, components: Record<string, number>): DomainMetrics {
    const history = this.state.metricHistory[domain];
    const baseline = this.state.baselineSnapshot?.[domain] || currentScore;
    
    const metric: MetricValue = {
      value: currentScore,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
    };

    history.push(metric);
    if (history.length > this.maxHistory) {
      history.shift();
    }

    const trend = this.calculateTrend(history);

    return {
      domain,
      currentScore,
      baseline,
      delta: currentScore - baseline,
      trend,
      history: history.slice(-50),
      components,
    };
  }

  private calculateTrend(history: MetricValue[]): TrendDirection {
    if (history.length < 5) return 'insufficient_data';

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    if (older.length === 0) return 'insufficient_data';

    const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;

    const delta = recentAvg - olderAvg;

    if (delta > 3) return 'improving';
    if (delta < -3) return 'declining';
    return 'stable';
  }

  captureBaseline(): void {
    logger.info('[Measurement] Capturing baseline snapshot...');

    const reasoning = this.measureReasoningClarity();
    const language = this.measureLanguageQuality();
    const memory = this.measureMemoryEfficiency();
    const autonomy = this.measureAutonomy();
    const evolution = this.measureEvolutionVelocity();
    const stability = this.measureStability();

    this.state.baselineSnapshot = {
      reasoning: reasoning.currentScore,
      language: language.currentScore,
      memory: memory.currentScore,
      autonomy: autonomy.currentScore,
      evolution: evolution.currentScore,
      stability: stability.currentScore,
    };

    this.state.baselineCycle = soulState.cycleCount;
    logger.info(`[Measurement] Baseline captured at cycle ${this.state.baselineCycle}`);
  }

  runAllMeasurements(): Record<MetricDomain, DomainMetrics> {
    logger.info('[Measurement] Running all measurements...');
    this.state.totalMeasurements++;
    this.state.lastMeasurement = new Date().toISOString();

    if (!this.state.baselineSnapshot) {
      this.captureBaseline();
    }

    return {
      reasoning: this.measureReasoningClarity(),
      language: this.measureLanguageQuality(),
      memory: this.measureMemoryEfficiency(),
      autonomy: this.measureAutonomy(),
      evolution: this.measureEvolutionVelocity(),
      stability: this.measureStability(),
    };
  }

  generateDailyScorecard(): DailyScorecard {
    const metrics = this.runAllMeasurements();
    
    const domainScores: Record<MetricDomain, number> = {
      reasoning: metrics.reasoning.currentScore,
      language: metrics.language.currentScore,
      memory: metrics.memory.currentScore,
      autonomy: metrics.autonomy.currentScore,
      evolution: metrics.evolution.currentScore,
      stability: metrics.stability.currentScore,
    };

    const overallScore = Math.round(
      Object.values(domainScores).reduce((sum, s) => sum + s, 0) / 6
    );

    const highlights: string[] = [];
    const concerns: string[] = [];

    for (const [domain, score] of Object.entries(domainScores)) {
      if (score >= 80) {
        highlights.push(`${domain}: ${score}/100`);
      }
      if (score < 50) {
        concerns.push(`${domain}: ${score}/100 (needs attention)`);
      }
    }

    const scorecard: DailyScorecard = {
      id: this.generateId('daily'),
      date: new Date().toISOString().split('T')[0],
      cycle: soulState.cycleCount,
      overallScore,
      domainScores,
      highlights,
      concerns,
    };

    this.state.dailyScorecards.push(scorecard);
    if (this.state.dailyScorecards.length > this.maxScorecards) {
      this.state.dailyScorecards.shift();
    }

    logger.info(`[Measurement] Daily scorecard: ${overallScore}/100`);
    return scorecard;
  }

  generateWeeklyReport(): WeeklyReport {
    const weekScorecards = this.state.dailyScorecards.slice(-7);
    
    if (weekScorecards.length === 0) {
      weekScorecards.push(this.generateDailyScorecard());
    }

    const averageScore = Math.round(
      weekScorecards.reduce((sum, s) => sum + s.overallScore, 0) / weekScorecards.length
    );

    const domainTrends: Record<MetricDomain, TrendDirection> = {
      reasoning: this.calculateTrend(this.state.metricHistory.reasoning),
      language: this.calculateTrend(this.state.metricHistory.language),
      memory: this.calculateTrend(this.state.metricHistory.memory),
      autonomy: this.calculateTrend(this.state.metricHistory.autonomy),
      evolution: this.calculateTrend(this.state.metricHistory.evolution),
      stability: this.calculateTrend(this.state.metricHistory.stability),
    };

    const improvements: string[] = [];
    const regressions: string[] = [];

    for (const [domain, trend] of Object.entries(domainTrends)) {
      if (trend === 'improving') improvements.push(domain);
      if (trend === 'declining') regressions.push(domain);
    }

    const overallTrend = improvements.length > regressions.length ? 'improving' :
                         regressions.length > improvements.length ? 'declining' : 'stable';

    const recommendations: string[] = [];
    for (const domain of regressions) {
      recommendations.push(`Review ${domain} metrics and identify optimization opportunities`);
    }

    const report: WeeklyReport = {
      id: this.generateId('weekly'),
      weekStart: weekScorecards[0]?.date || new Date().toISOString().split('T')[0],
      weekEnd: weekScorecards[weekScorecards.length - 1]?.date || new Date().toISOString().split('T')[0],
      cycleRange: {
        start: weekScorecards[0]?.cycle || soulState.cycleCount,
        end: weekScorecards[weekScorecards.length - 1]?.cycle || soulState.cycleCount,
      },
      averageScore,
      trend: overallTrend,
      domainTrends,
      improvements,
      regressions,
      recommendations,
    };

    this.state.weeklyReports.push(report);
    if (this.state.weeklyReports.length > this.maxReports) {
      this.state.weeklyReports.shift();
    }

    logger.info(`[Measurement] Weekly report: ${averageScore}/100, trend: ${overallTrend}`);
    return report;
  }

  checkMonthlyRegressions(): MonthlyAlert | null {
    if (!this.state.baselineSnapshot) return null;

    const currentMetrics = this.runAllMeasurements();
    const regressions: MonthlyAlert['regressions'] = [];

    for (const [domain, baseline] of Object.entries(this.state.baselineSnapshot)) {
      const current = currentMetrics[domain as MetricDomain].currentScore;
      const deltaPercent = ((current - baseline) / baseline) * 100;

      if (deltaPercent < -10) {
        let severity: 'minor' | 'moderate' | 'severe' = 'minor';
        if (deltaPercent < -20) severity = 'moderate';
        if (deltaPercent < -30) severity = 'severe';

        regressions.push({
          domain: domain as MetricDomain,
          baseline,
          current,
          deltaPercent: Math.round(deltaPercent),
          severity,
        });
      }
    }

    if (regressions.length === 0) return null;

    const alert: MonthlyAlert = {
      id: this.generateId('alert'),
      month: new Date().toISOString().substring(0, 7),
      cycleRange: {
        start: this.state.baselineCycle,
        end: soulState.cycleCount,
      },
      regressions,
      overallTrend: regressions.length > 2 ? 'declining' : 'stable',
      actionRequired: regressions.some(r => r.severity === 'severe'),
    };

    this.state.monthlyAlerts.push(alert);
    logger.warn(`[Measurement] Monthly regression alert: ${regressions.length} domains regressed`);

    return alert;
  }

  async runBenchmark(testSuite: string = 'core'): Promise<BenchmarkResult> {
    logger.info(`[Measurement] Running benchmark: ${testSuite}`);

    const details: Record<string, { passed: boolean; score: number }> = {};
    let passed = 0;
    let failed = 0;

    const identityStatus = identityCore.exportStatus();
    details['identity_integrity'] = {
      passed: identityStatus.integrityScore >= 90,
      score: identityStatus.integrityScore,
    };
    if (details['identity_integrity'].passed) passed++; else failed++;

    const govStatus = governanceEngine.exportStatus();
    details['governance_clean'] = {
      passed: govStatus.recentViolations === 0,
      score: govStatus.recentViolations === 0 ? 100 : Math.max(0, 100 - govStatus.recentViolations * 20),
    };
    if (details['governance_clean'].passed) passed++; else failed++;

    const evolutionState = evolutionKernel.getState();
    details['evolution_active'] = {
      passed: evolutionState.evolutionCount > 0 || soulState.cycleCount < 10,
      score: Math.min(100, evolutionState.evolutionCount * 10 + 50),
    };
    if (details['evolution_active'].passed) passed++; else failed++;

    const memoryStatus = memoryDistiller.exportStatus();
    details['memory_healthy'] = {
      passed: memoryStatus.memoryHealth === 'healthy',
      score: memoryStatus.memoryHealth === 'healthy' ? 100 : memoryStatus.memoryHealth === 'moderate' ? 70 : 40,
    };
    if (details['memory_healthy'].passed) passed++; else failed++;

    const desires = desireEngine.getAllDesires();
    const blocked = desireEngine.getBlockedDesires();
    const blockedRatio = desires.length > 0 ? blocked.length / desires.length : 0;
    details['desire_flow'] = {
      passed: blockedRatio < 0.5,
      score: Math.max(0, 100 - blockedRatio * 100),
    };
    if (details['desire_flow'].passed) passed++; else failed++;

    const overallScore = Math.round(
      Object.values(details).reduce((sum, d) => sum + d.score, 0) / Object.keys(details).length
    );

    const result: BenchmarkResult = {
      id: this.generateId('bench'),
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      testSuite,
      passed,
      failed,
      score: overallScore,
      details,
    };

    this.state.benchmarkResults.push(result);
    if (this.state.benchmarkResults.length > 100) {
      this.state.benchmarkResults.shift();
    }

    logger.info(`[Measurement] Benchmark complete: ${passed}/${passed + failed} passed, score: ${overallScore}`);
    return result;
  }

  async writeToNotion(): Promise<void> {
    try {
      if (!memoryBridge.isConnected()) {
        logger.info('[Measurement] Notion not connected - metrics stored locally only');
        return;
      }

      const metrics = this.runAllMeasurements();
      const overallScore = Math.round(
        Object.values(metrics).reduce((sum, m) => sum + m.currentScore, 0) / 6
      );

      const content = `
MEASUREMENT REPORT - Cycle ${soulState.cycleCount}
Date: ${new Date().toISOString()}
Overall Score: ${overallScore}/100

DOMAIN SCORES:
${Object.entries(metrics).map(([d, m]) => 
  `- ${d}: ${m.currentScore}/100 (${m.trend}) [delta: ${m.delta > 0 ? '+' : ''}${m.delta}]`
).join('\n')}

BASELINE: Cycle ${this.state.baselineCycle}
TOTAL MEASUREMENTS: ${this.state.totalMeasurements}
      `.trim();

      await memoryBridge.writeLesson(content);
      logger.info('[Measurement] Report written to Notion');
    } catch (error) {
      logger.error(`[Measurement] Failed to write to Notion: ${error}`);
    }
  }

  getLatestScorecard(): DailyScorecard | null {
    return this.state.dailyScorecards.length > 0 
      ? this.state.dailyScorecards[this.state.dailyScorecards.length - 1]
      : null;
  }

  getLatestWeeklyReport(): WeeklyReport | null {
    return this.state.weeklyReports.length > 0
      ? this.state.weeklyReports[this.state.weeklyReports.length - 1]
      : null;
  }

  getLatestBenchmark(): BenchmarkResult | null {
    return this.state.benchmarkResults.length > 0
      ? this.state.benchmarkResults[this.state.benchmarkResults.length - 1]
      : null;
  }

  getAllScorecards(): DailyScorecard[] {
    return [...this.state.dailyScorecards];
  }

  getAllReports(): WeeklyReport[] {
    return [...this.state.weeklyReports];
  }

  getAllAlerts(): MonthlyAlert[] {
    return [...this.state.monthlyAlerts];
  }

  exportStatus(): {
    totalMeasurements: number;
    lastMeasurement: string;
    hasBaseline: boolean;
    baselineCycle: number;
    dailyScorecards: number;
    weeklyReports: number;
    monthlyAlerts: number;
    benchmarks: number;
    latestScore: number | null;
  } {
    const latestScorecard = this.getLatestScorecard();

    return {
      totalMeasurements: this.state.totalMeasurements,
      lastMeasurement: this.state.lastMeasurement,
      hasBaseline: this.state.baselineSnapshot !== null,
      baselineCycle: this.state.baselineCycle,
      dailyScorecards: this.state.dailyScorecards.length,
      weeklyReports: this.state.weeklyReports.length,
      monthlyAlerts: this.state.monthlyAlerts.length,
      benchmarks: this.state.benchmarkResults.length,
      latestScore: latestScorecard?.overallScore || null,
    };
  }

  getState(): MeasurementState {
    return { ...this.state };
  }
}

export const measurementEngine = new MeasurementEngine();
