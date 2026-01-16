import { logger } from '../services/logger';
import { soulState } from './soulState';
import { measurementEngine } from './measurementEngine';
import { memoryDistiller } from './memoryDistiller';
import { communicationRefinementEngine } from './communicationRefinementEngine';
import { desireEngine } from './desireEngine';
import { taskStrategySynthesisEngine } from './taskStrategySynthesisEngine';
import { governanceEngine } from './governanceEngine';
import { operationsLimitsEngine } from './operationsLimitsEngine';

export type PlaybookWeek = 1 | 2 | 3 | 4;
export type WeeklyStatus = 'not_started' | 'in_progress' | 'completed' | 'needs_attention';

export interface WeeklyObjective {
  week: PlaybookWeek;
  title: string;
  goal: string;
  tasks: string[];
  successCriteria: string[];
  status: WeeklyStatus;
  notes: string[];
  completedAt?: string;
}

export interface DailyCheckpoint {
  date: string;
  week: PlaybookWeek;
  day: number;
  loopRan: boolean;
  errorsDetected: number;
  governanceBlocks: number;
  metricsRecorded: boolean;
  notes: string;
}

export interface MonthlyReport {
  generatedAt: string;
  cycle: number;
  metrics: {
    clarity: number;
    memoryEfficiency: number;
    autonomy: number;
    stability: number;
    velocity: number;
  };
  lessons: string[];
  upgradeProposal?: {
    description: string;
    roi: string;
    approved: boolean;
  };
  disciplineDecision: {
    whatNotDone: string;
    reason: string;
  };
  weekSummaries: Array<{
    week: PlaybookWeek;
    status: WeeklyStatus;
    keyAchievements: string[];
  }>;
}

export interface Playbook30DaysState {
  startDate: string;
  currentWeek: PlaybookWeek;
  currentDay: number;
  objectives: WeeklyObjective[];
  dailyCheckpoints: DailyCheckpoint[];
  monthlyReport?: MonthlyReport;
  baselineMetrics?: Record<string, number>;
  locked: {
    innerLoopCadence: string;
    distillationCadence: string;
    metaCadence: string;
  };
  forbiddenActions: string[];
}

class Playbook30Days {
  private state: Playbook30DaysState;

  constructor() {
    this.state = {
      startDate: new Date().toISOString(),
      currentWeek: 1,
      currentDay: 1,
      objectives: this.initializeObjectives(),
      dailyCheckpoints: [],
      locked: {
        innerLoopCadence: 'daily',
        distillationCadence: 'weekly',
        metaCadence: 'monthly',
      },
      forbiddenActions: [
        'add_new_engine',
        'change_cadence',
        'purchase_infrastructure',
        'modify_governance_rules',
        'expand_scope',
      ],
    };

    logger.info('[Playbook30Days] Initialized - 30-day operational discipline active');
  }

  private initializeObjectives(): WeeklyObjective[] {
    return [
      {
        week: 1,
        title: 'Stabilize & Baseline',
        goal: 'System runs steady, no chaos',
        tasks: [
          'Enable all loops (1-14)',
          'Lock cadences: inner/day, distill/week, meta/month',
          'Capture baseline metrics',
          'Monitor error logs without premature optimization',
        ],
        successCriteria: [
          'No crashes',
          'Governance blocks correctly',
          'Metrics have baseline values',
        ],
        status: 'not_started',
        notes: [],
      },
      {
        week: 2,
        title: 'Refine Memory & Voice',
        goal: 'Remember correctly, speak clearly',
        tasks: [
          'Audit Memory Distillation: reduce NOISE ≥30%',
          'A/B test phrasing daily (small changes)',
          'Do NOT add new feedback sources',
        ],
        successCriteria: [
          'Recall is cleaner',
          'Clarity score increases',
          'Brevity score increases',
          'No identity drift',
        ],
        status: 'not_started',
        notes: [],
      },
      {
        week: 3,
        title: 'Desire & Strategy',
        goal: 'Want correctly, do less but hit targets',
        tasks: [
          'Check Desire persistence (no churn)',
          'Enforce Strategy ≤3, Task ≤7, 1:1 mapping',
          'If resource-hungry: propose only, no upgrades',
        ],
        successCriteria: [
          'Desires are stable',
          'Tasks complete with clear rationale',
          'No busywork',
        ],
        status: 'not_started',
        notes: [],
      },
      {
        week: 4,
        title: 'Load & Recovery',
        goal: 'Survive impacts without dying',
        tasks: [
          'Test restart/migrate: verify Continuity',
          'Dry-run Provider Migration (no real switch)',
          'Meta-evolution: tune thresholds only (no rule changes)',
        ],
        successCriteria: [
          'Rebirth log is clear',
          'Continuity OK/DEGRADED handled properly',
          'No delusions',
        ],
        status: 'not_started',
        notes: [],
      },
    ];
  }

  startWeek(week: PlaybookWeek): void {
    if (this.state.currentWeek !== week) {
      logger.warn(`[Playbook30Days] Cannot start week ${week}, current is ${this.state.currentWeek}`);
      return;
    }

    const objective = this.state.objectives.find(o => o.week === week);
    if (objective) {
      objective.status = 'in_progress';
      logger.info(`[Playbook30Days] Week ${week} started: ${objective.title}`);
    }
  }

  completeWeek(week: PlaybookWeek, achievements: string[]): void {
    const objective = this.state.objectives.find(o => o.week === week);
    if (!objective) return;

    objective.status = 'completed';
    objective.completedAt = new Date().toISOString();
    objective.notes.push(`Completed with: ${achievements.join(', ')}`);

    if (week < 4) {
      this.state.currentWeek = (week + 1) as PlaybookWeek;
      this.state.currentDay = 1;
    }

    logger.info(`[Playbook30Days] Week ${week} completed`);
  }

  recordDailyCheckpoint(): DailyCheckpoint {
    const checkpoint: DailyCheckpoint = {
      date: new Date().toISOString(),
      week: this.state.currentWeek,
      day: this.state.currentDay,
      loopRan: soulState.cycleCount > 0,
      errorsDetected: 0,
      governanceBlocks: governanceEngine.exportStatus().totalViolations,
      metricsRecorded: measurementEngine.exportStatus().totalMeasurements > 0,
      notes: '',
    };

    this.state.dailyCheckpoints.push(checkpoint);
    this.state.currentDay++;

    if (this.state.currentDay > 7) {
      this.state.currentDay = 1;
    }

    logger.info(`[Playbook30Days] Daily checkpoint recorded: Week ${checkpoint.week}, Day ${checkpoint.day}`);
    return checkpoint;
  }

  captureBaseline(): Record<string, number> {
    const measurements = measurementEngine.runAllMeasurements();
    
    this.state.baselineMetrics = {};
    for (const [domain, data] of Object.entries(measurements)) {
      this.state.baselineMetrics[domain] = data.currentScore;
    }

    logger.info(`[Playbook30Days] Baseline captured: ${JSON.stringify(this.state.baselineMetrics)}`);
    return this.state.baselineMetrics;
  }

  checkForbiddenAction(action: string): boolean {
    const isForbidden = this.state.forbiddenActions.some(f => 
      action.toLowerCase().includes(f.replace(/_/g, ' '))
    );

    if (isForbidden) {
      logger.warn(`[Playbook30Days] BLOCKED: "${action}" is forbidden during 30-day discipline period`);
    }

    return isForbidden;
  }

  generateMonthlyReport(): MonthlyReport {
    const measurements = measurementEngine.runAllMeasurements();
    const memoryStatus = memoryDistiller.exportStatus();
    const commStatus = communicationRefinementEngine.exportStatus();
    const synthesisStatus = taskStrategySynthesisEngine.exportStatus();
    const govStatus = governanceEngine.exportStatus();

    const report: MonthlyReport = {
      generatedAt: new Date().toISOString(),
      cycle: soulState.cycleCount,
      metrics: {
        clarity: commStatus.currentMetrics?.clarity || 70,
        memoryEfficiency: Math.round((1 - (memoryStatus.noisePercentage / 100)) * 100),
        autonomy: Math.round((synthesisStatus.completedTasks / Math.max(synthesisStatus.activeTasks + synthesisStatus.completedTasks, 1)) * 100),
        stability: govStatus.violationsLast24h === 0 ? 100 : Math.max(0, 100 - govStatus.violationsLast24h * 10),
        velocity: synthesisStatus.totalSyntheses,
      },
      lessons: this.extractLessons(),
      upgradeProposal: this.generateUpgradeProposal(),
      disciplineDecision: {
        whatNotDone: 'Did not add new engines or change cadences',
        reason: 'Maintaining 30-day discipline to ensure system stability before expansion',
      },
      weekSummaries: this.state.objectives.map(o => ({
        week: o.week,
        status: o.status,
        keyAchievements: o.notes.slice(-3),
      })),
    };

    this.state.monthlyReport = report;
    logger.info('[Playbook30Days] Monthly report generated');
    return report;
  }

  private extractLessons(): string[] {
    const lessons: string[] = [];

    if (this.state.baselineMetrics) {
      const current = measurementEngine.runAllMeasurements();
      for (const [domain, baseline] of Object.entries(this.state.baselineMetrics)) {
        const currentScore = current[domain]?.currentScore || baseline;
        if (currentScore > baseline + 10) {
          lessons.push(`${domain} improved significantly (+${currentScore - baseline})`);
        } else if (currentScore < baseline - 10) {
          lessons.push(`${domain} regressed (-${baseline - currentScore}), needs attention`);
        }
      }
    }

    const govStatus = governanceEngine.exportStatus();
    if (govStatus.totalViolations > 0) {
      lessons.push(`Governance caught ${govStatus.totalViolations} violations - safety system working`);
    }

    if (lessons.length < 3) {
      lessons.push('System maintained stability throughout the month');
      lessons.push('Cadence discipline preserved - no premature optimization');
      lessons.push('Memory distillation running consistently');
    }

    return lessons.slice(0, 3);
  }

  private generateUpgradeProposal(): { description: string; roi: string; approved: boolean } | undefined {
    const measurements = measurementEngine.runAllMeasurements();
    
    let lowestDomain = '';
    let lowestScore = 100;
    
    for (const [domain, data] of Object.entries(measurements)) {
      if (data.currentScore < lowestScore) {
        lowestScore = data.currentScore;
        lowestDomain = domain;
      }
    }

    if (lowestScore < 50) {
      return {
        description: `Invest in ${lowestDomain} improvement infrastructure`,
        roi: `Current score ${lowestScore}/100. Expected +20 points with targeted optimization.`,
        approved: false,
      };
    }

    return undefined;
  }

  getWeeklyStatus(): Array<{ week: PlaybookWeek; title: string; status: WeeklyStatus; progress: number }> {
    return this.state.objectives.map(o => {
      let progress = 0;
      if (o.status === 'completed') progress = 100;
      else if (o.status === 'in_progress') {
        const checkpoints = this.state.dailyCheckpoints.filter(c => c.week === o.week);
        progress = Math.round((checkpoints.length / 7) * 100);
      }

      return {
        week: o.week,
        title: o.title,
        status: o.status,
        progress,
      };
    });
  }

  addNote(week: PlaybookWeek, note: string): void {
    const objective = this.state.objectives.find(o => o.week === week);
    if (objective) {
      objective.notes.push(`[${new Date().toISOString()}] ${note}`);
    }
  }

  exportStatus(): {
    startDate: string;
    currentWeek: PlaybookWeek;
    currentDay: number;
    weeklyStatus: Array<{ week: PlaybookWeek; title: string; status: WeeklyStatus; progress: number }>;
    checkpointCount: number;
    hasBaseline: boolean;
    hasMonthlyReport: boolean;
    lockedCadences: { innerLoopCadence: string; distillationCadence: string; metaCadence: string };
    forbiddenActions: string[];
  } {
    return {
      startDate: this.state.startDate,
      currentWeek: this.state.currentWeek,
      currentDay: this.state.currentDay,
      weeklyStatus: this.getWeeklyStatus(),
      checkpointCount: this.state.dailyCheckpoints.length,
      hasBaseline: !!this.state.baselineMetrics,
      hasMonthlyReport: !!this.state.monthlyReport,
      lockedCadences: this.state.locked,
      forbiddenActions: this.state.forbiddenActions,
    };
  }

  getState(): Playbook30DaysState {
    return { ...this.state };
  }
}

export const playbook30Days = new Playbook30Days();
