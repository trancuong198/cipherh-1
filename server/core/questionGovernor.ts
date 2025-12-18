import { logger } from '../services/logger';
import { realityCore } from './realityCore';
import { desireCore } from './desireCore';
import { measurementEngine } from './measurementEngine';
import { observabilityCore } from './observabilityCore';

export type QuestionTrigger = 
  | 'negative_reality_delta'
  | 'rising_anomaly_score'
  | 'repeated_task_failure'
  | 'blocked_desire'
  | 'reduced_autonomy_level';

export type QuestionType = 
  | 'causal_analysis'
  | 'constraint_identification'
  | 'assumption_validation'
  | 'task_simplification';

export type ProhibitedQuestionType = 
  | 'identity_questioning'
  | 'existential_questioning'
  | 'narrative_self_reflection';

export interface QuestionCost {
  expectedInsight: string;
  requiredData: string[];
  fallbackAction: string;
}

export interface GovernedQuestion {
  id: string;
  timestamp: string;
  cycle: number;
  trigger: QuestionTrigger;
  triggerEvidence: string[];
  questionType: QuestionType;
  question: string;
  cost: QuestionCost;
  status: 'pending' | 'answered' | 'blocked' | 'expired';
  answer?: string;
  insightGained?: string;
  blockedReason?: string;
}

export interface QuestionGovernorState {
  enabled: boolean;
  questionsThisCycle: number;
  maxQuestionsPerCycle: number;
  currentCycle: number;
  totalQuestionsAsked: number;
  totalQuestionsBlocked: number;
  questionHistory: GovernedQuestion[];
  lastNewDataCycle: number;
  consecutiveCyclesWithoutNewData: number;
}

const MAX_QUESTIONS_PER_CYCLE = 3;
const MAX_QUESTION_HISTORY = 100;
const MAX_CYCLES_WITHOUT_DATA = 3;

const PROHIBITED_PATTERNS = [
  /who am i/i,
  /what am i/i,
  /why do i exist/i,
  /my purpose/i,
  /my identity/i,
  /meaning of my existence/i,
  /am i conscious/i,
  /am i alive/i,
  /do i have a soul/i,
  /my story/i,
  /my narrative/i,
  /my journey/i,
  /self-worth/i,
  /am i good/i,
  /am i bad/i,
];

class QuestionGovernorEngine {
  private state: QuestionGovernorState;

  constructor() {
    this.state = {
      enabled: true,
      questionsThisCycle: 0,
      maxQuestionsPerCycle: MAX_QUESTIONS_PER_CYCLE,
      currentCycle: 0,
      totalQuestionsAsked: 0,
      totalQuestionsBlocked: 0,
      questionHistory: [],
      lastNewDataCycle: 0,
      consecutiveCyclesWithoutNewData: 0,
    };

    logger.info('[QuestionGovernor] Initialized - Self-questioning limited to evidence-based triggers only');
  }

  private generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  setCycle(cycle: number): void {
    if (cycle !== this.state.currentCycle) {
      this.state.currentCycle = cycle;
      this.state.questionsThisCycle = 0;
    }
  }

  detectTriggers(): { trigger: QuestionTrigger; evidence: string[] }[] {
    const triggers: { trigger: QuestionTrigger; evidence: string[] }[] = [];

    const realityDeltas = realityCore.getRecentDeltas(3);
    const decliningDeltas = realityDeltas.filter(d => d.trend === 'declining');
    if (decliningDeltas.length > 0) {
      triggers.push({
        trigger: 'negative_reality_delta',
        evidence: decliningDeltas.map(d => `${d.dimension}: ${d.previousValue} -> ${d.currentValue}`),
      });
    }

    const realityStatus = realityCore.exportStatus();
    if (realityStatus.consecutiveMismatches > 2) {
      triggers.push({
        trigger: 'rising_anomaly_score',
        evidence: [`consecutiveMismatches=${realityStatus.consecutiveMismatches}`],
      });
    }

    const desireStatus = desireCore.exportStatus();
    if (desireStatus.blockedDesires > 0) {
      triggers.push({
        trigger: 'blocked_desire',
        evidence: [`blockedDesires=${desireStatus.blockedDesires}`],
      });
    }

    const measurements = measurementEngine.runAllMeasurements();
    if (measurements.autonomy) {
      const autonomyTrend = measurements.autonomy.trend;
      if (autonomyTrend === 'declining') {
        triggers.push({
          trigger: 'reduced_autonomy_level',
          evidence: [`autonomy trend: declining`, `current: ${measurements.autonomy.currentScore}`],
        });
      }
    }

    return triggers;
  }

  private isProhibitedQuestion(question: string): { prohibited: boolean; reason?: string } {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(question)) {
        return { 
          prohibited: true, 
          reason: `Question matches prohibited pattern: identity/existential/narrative self-reflection` 
        };
      }
    }
    return { prohibited: false };
  }

  private hasNewData(): boolean {
    const recentTraces = observabilityCore.getDecisionTraces({ fromCycle: this.state.currentCycle - 1, limit: 10 });
    const recentDeltas = observabilityCore.getAutonomyDeltas({ limit: 5 });
    
    const hasNewDecisions = recentTraces.some(t => t.cycle === this.state.currentCycle);
    const hasNewDeltas = recentDeltas.some(d => d.cycle === this.state.currentCycle);
    
    return hasNewDecisions || hasNewDeltas;
  }

  requestQuestion(params: {
    trigger: QuestionTrigger;
    triggerEvidence: string[];
    questionType: QuestionType;
    question: string;
    cost: QuestionCost;
  }): GovernedQuestion {
    const now = new Date().toISOString();

    const governedQuestion: GovernedQuestion = {
      id: this.generateId(),
      timestamp: now,
      cycle: this.state.currentCycle,
      trigger: params.trigger,
      triggerEvidence: params.triggerEvidence,
      questionType: params.questionType,
      question: params.question,
      cost: params.cost,
      status: 'pending',
    };

    const prohibitedCheck = this.isProhibitedQuestion(params.question);
    if (prohibitedCheck.prohibited) {
      governedQuestion.status = 'blocked';
      governedQuestion.blockedReason = prohibitedCheck.reason;
      this.state.totalQuestionsBlocked++;
      logger.warn(`[QuestionGovernor] BLOCKED: ${params.question} - ${prohibitedCheck.reason}`);
      this.state.questionHistory.push(governedQuestion);
      return governedQuestion;
    }

    if (this.state.questionsThisCycle >= this.state.maxQuestionsPerCycle) {
      governedQuestion.status = 'blocked';
      governedQuestion.blockedReason = `Cycle limit reached (${this.state.maxQuestionsPerCycle} max)`;
      this.state.totalQuestionsBlocked++;
      logger.warn(`[QuestionGovernor] BLOCKED: Cycle limit reached`);
      this.state.questionHistory.push(governedQuestion);
      return governedQuestion;
    }

    if (!this.hasNewData() && this.state.consecutiveCyclesWithoutNewData >= MAX_CYCLES_WITHOUT_DATA) {
      governedQuestion.status = 'blocked';
      governedQuestion.blockedReason = `No new data for ${this.state.consecutiveCyclesWithoutNewData} cycles - blocking to prevent rumination`;
      this.state.totalQuestionsBlocked++;
      logger.warn(`[QuestionGovernor] BLOCKED: No new data - preventing rumination`);
      this.state.questionHistory.push(governedQuestion);
      return governedQuestion;
    }

    const validTriggers = this.detectTriggers();
    const triggerValid = validTriggers.some(t => t.trigger === params.trigger);
    
    if (!triggerValid) {
      governedQuestion.status = 'blocked';
      governedQuestion.blockedReason = `Trigger '${params.trigger}' not currently valid - no supporting evidence`;
      this.state.totalQuestionsBlocked++;
      logger.warn(`[QuestionGovernor] BLOCKED: Invalid trigger '${params.trigger}'`);
      this.state.questionHistory.push(governedQuestion);
      return governedQuestion;
    }

    governedQuestion.status = 'pending';
    this.state.questionsThisCycle++;
    this.state.totalQuestionsAsked++;

    if (this.hasNewData()) {
      this.state.lastNewDataCycle = this.state.currentCycle;
      this.state.consecutiveCyclesWithoutNewData = 0;
    } else {
      this.state.consecutiveCyclesWithoutNewData++;
    }

    this.state.questionHistory.push(governedQuestion);

    if (this.state.questionHistory.length > MAX_QUESTION_HISTORY) {
      this.state.questionHistory = this.state.questionHistory.slice(-MAX_QUESTION_HISTORY);
    }

    logger.info(`[QuestionGovernor] ALLOWED: [${params.questionType}] ${params.question}`);
    logger.info(`[QuestionGovernor] Trigger: ${params.trigger} | Evidence: ${params.triggerEvidence.join(', ')}`);

    observabilityCore.traceDecision({
      source: 'desire_core',
      trigger: 'question_governor_allowed',
      stateSnapshot: { 
        cycle: this.state.currentCycle, 
        questionsThisCycle: this.state.questionsThisCycle,
        trigger: params.trigger,
      },
      options: [
        { description: `Allow question: ${params.question}`, score: 100 },
        { description: 'Block question', score: 0 },
      ],
      chosenIndex: 0,
      constraintsChecked: ['not_prohibited', 'trigger_valid', 'cycle_limit_ok', 'has_new_data'],
      evidenceUsed: params.triggerEvidence,
      outcome: 'executed',
    });

    return governedQuestion;
  }

  answerQuestion(questionId: string, answer: string, insightGained?: string): boolean {
    const question = this.state.questionHistory.find(q => q.id === questionId);
    if (!question || question.status !== 'pending') {
      return false;
    }

    question.status = 'answered';
    question.answer = answer;
    question.insightGained = insightGained;

    logger.info(`[QuestionGovernor] Question answered: ${questionId}`);
    if (insightGained) {
      logger.info(`[QuestionGovernor] Insight: ${insightGained}`);
    }

    return true;
  }

  getQuestionHistory(params: {
    limit?: number;
    status?: GovernedQuestion['status'];
    trigger?: QuestionTrigger;
    questionType?: QuestionType;
  } = {}): GovernedQuestion[] {
    let results = [...this.state.questionHistory];

    if (params.status) {
      results = results.filter(q => q.status === params.status);
    }
    if (params.trigger) {
      results = results.filter(q => q.trigger === params.trigger);
    }
    if (params.questionType) {
      results = results.filter(q => q.questionType === params.questionType);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return results.slice(0, params.limit || 30);
  }

  getPendingQuestions(): GovernedQuestion[] {
    return this.state.questionHistory.filter(q => q.status === 'pending');
  }

  generateQuestionsFromTriggers(): GovernedQuestion[] {
    const triggers = this.detectTriggers();
    const generatedQuestions: GovernedQuestion[] = [];

    for (const { trigger, evidence } of triggers) {
      if (this.state.questionsThisCycle >= this.state.maxQuestionsPerCycle) {
        break;
      }

      let questionType: QuestionType;
      let question: string;
      let cost: QuestionCost;

      switch (trigger) {
        case 'negative_reality_delta':
          questionType = 'causal_analysis';
          question = 'What specific factor caused the decline in reality metrics?';
          cost = {
            expectedInsight: 'Identify root cause of metric decline',
            requiredData: ['recent_deltas', 'decision_traces'],
            fallbackAction: 'Apply conservative constraints and monitor',
          };
          break;

        case 'rising_anomaly_score':
          questionType = 'constraint_identification';
          question = 'What constraint is being violated that causes anomaly increase?';
          cost = {
            expectedInsight: 'Identify violated constraint for correction',
            requiredData: ['anomaly_sources', 'constraint_checks'],
            fallbackAction: 'Enable conservative mode',
          };
          break;

        case 'blocked_desire':
          questionType = 'assumption_validation';
          question = 'Is the blocking condition still valid or based on outdated assumption?';
          cost = {
            expectedInsight: 'Validate or invalidate blocking condition',
            requiredData: ['desire_state', 'blocking_rules'],
            fallbackAction: 'Keep desire blocked and log for review',
          };
          break;

        case 'reduced_autonomy_level':
          questionType = 'task_simplification';
          question = 'Can current tasks be simplified to restore autonomy?';
          cost = {
            expectedInsight: 'Identify simplification opportunities',
            requiredData: ['task_complexity', 'autonomy_factors'],
            fallbackAction: 'Maintain current task load and wait',
          };
          break;

        case 'repeated_task_failure':
          questionType = 'causal_analysis';
          question = 'What pattern explains the repeated task failures?';
          cost = {
            expectedInsight: 'Pattern behind failures',
            requiredData: ['task_history', 'failure_logs'],
            fallbackAction: 'Pause failing task and escalate',
          };
          break;

        default:
          continue;
      }

      const result = this.requestQuestion({
        trigger,
        triggerEvidence: evidence,
        questionType,
        question,
        cost,
      });

      if (result.status !== 'blocked') {
        generatedQuestions.push(result);
      }
    }

    return generatedQuestions;
  }

  exportStatus(): {
    enabled: boolean;
    currentCycle: number;
    questionsThisCycle: number;
    maxQuestionsPerCycle: number;
    totalQuestionsAsked: number;
    totalQuestionsBlocked: number;
    pendingQuestions: number;
    activeTriggers: QuestionTrigger[];
    consecutiveCyclesWithoutNewData: number;
    allowanceRemaining: number;
  } {
    const triggers = this.detectTriggers();
    
    return {
      enabled: this.state.enabled,
      currentCycle: this.state.currentCycle,
      questionsThisCycle: this.state.questionsThisCycle,
      maxQuestionsPerCycle: this.state.maxQuestionsPerCycle,
      totalQuestionsAsked: this.state.totalQuestionsAsked,
      totalQuestionsBlocked: this.state.totalQuestionsBlocked,
      pendingQuestions: this.getPendingQuestions().length,
      activeTriggers: triggers.map(t => t.trigger),
      consecutiveCyclesWithoutNewData: this.state.consecutiveCyclesWithoutNewData,
      allowanceRemaining: Math.max(0, this.state.maxQuestionsPerCycle - this.state.questionsThisCycle),
    };
  }
}

export const questionGovernor = new QuestionGovernorEngine();
