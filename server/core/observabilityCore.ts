import { logger } from '../services/logger';

export interface DecisionContext {
  cycle: number;
  timestamp: string;
  trigger: string;
  stateSnapshot: Record<string, unknown>;
}

export interface DecisionOption {
  id: string;
  description: string;
  score: number;
  constraints: string[];
  evidence: string[];
}

export interface DecisionTrace {
  id: string;
  timestamp: string;
  cycle: number;
  source: 'agency_core' | 'desire_core' | 'reality_core' | 'task_generation' | 'inner_loop';
  context: DecisionContext;
  optionsConsidered: DecisionOption[];
  chosenOption: string;
  constraintsChecked: string[];
  evidenceUsed: string[];
  outcome: 'pending' | 'executed' | 'blocked' | 'deferred';
  outcomeReason?: string;
}

export interface ReasoningSummary {
  id: string;
  decisionId: string;
  timestamp: string;
  trigger: string;
  keyAssumptions: string[];
  discardedPaths: Array<{ path: string; reason: string }>;
  finalLogic: string;
}

export interface AutonomyDelta {
  id: string;
  timestamp: string;
  cycle: number;
  domain: string;
  previousPattern: string;
  newPattern: string;
  changeType: 'adaptation' | 'correction' | 'evolution' | 'drift';
  evidence: string[];
  justification: string;
}

export interface BehaviorSnapshot {
  cycle: number;
  timestamp: string;
  patterns: Record<string, string>;
  metrics: Record<string, number>;
}

interface ObservabilityState {
  enabled: boolean;
  decisionTraces: DecisionTrace[];
  reasoningSummaries: ReasoningSummary[];
  autonomyDeltas: AutonomyDelta[];
  behaviorSnapshots: BehaviorSnapshot[];
  currentCycle: number;
  lastObservation: string;
}

const MAX_DECISION_TRACES = 200;
const MAX_REASONING_SUMMARIES = 100;
const MAX_AUTONOMY_DELTAS = 100;
const MAX_BEHAVIOR_SNAPSHOTS = 50;

class ObservabilityCoreEngine {
  private state: ObservabilityState;

  constructor() {
    this.state = {
      enabled: true,
      decisionTraces: [],
      reasoningSummaries: [],
      autonomyDeltas: [],
      behaviorSnapshots: [],
      currentCycle: 0,
      lastObservation: new Date().toISOString(),
    };

    logger.info('[ObservabilityCore] Initialized - All autonomous behavior will be observable');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  setCycle(cycle: number): void {
    this.state.currentCycle = cycle;
  }

  traceDecision(params: {
    source: DecisionTrace['source'];
    trigger: string;
    stateSnapshot: Record<string, unknown>;
    options: Array<{ description: string; score: number; constraints?: string[]; evidence?: string[] }>;
    chosenIndex: number;
    constraintsChecked: string[];
    evidenceUsed: string[];
    outcome?: DecisionTrace['outcome'];
    outcomeReason?: string;
  }): DecisionTrace {
    const now = new Date().toISOString();
    
    const optionsConsidered: DecisionOption[] = params.options.map((opt, idx) => ({
      id: `opt_${idx}`,
      description: opt.description,
      score: opt.score,
      constraints: opt.constraints || [],
      evidence: opt.evidence || [],
    }));

    const trace: DecisionTrace = {
      id: this.generateId('decision'),
      timestamp: now,
      cycle: this.state.currentCycle,
      source: params.source,
      context: {
        cycle: this.state.currentCycle,
        timestamp: now,
        trigger: params.trigger,
        stateSnapshot: params.stateSnapshot,
      },
      optionsConsidered,
      chosenOption: optionsConsidered[params.chosenIndex]?.id || 'none',
      constraintsChecked: params.constraintsChecked,
      evidenceUsed: params.evidenceUsed,
      outcome: params.outcome || 'pending',
      outcomeReason: params.outcomeReason,
    };

    this.state.decisionTraces.push(trace);
    if (this.state.decisionTraces.length > MAX_DECISION_TRACES) {
      this.state.decisionTraces.shift();
    }

    this.state.lastObservation = now;
    logger.info(`[ObservabilityCore] Decision traced: ${params.source} -> ${optionsConsidered[params.chosenIndex]?.description || 'none'}`);
    
    return trace;
  }

  summarizeReasoning(params: {
    decisionId: string;
    trigger: string;
    keyAssumptions: string[];
    discardedPaths: Array<{ path: string; reason: string }>;
    finalLogic: string;
  }): ReasoningSummary {
    const summary: ReasoningSummary = {
      id: this.generateId('reasoning'),
      decisionId: params.decisionId,
      timestamp: new Date().toISOString(),
      trigger: params.trigger,
      keyAssumptions: params.keyAssumptions,
      discardedPaths: params.discardedPaths,
      finalLogic: params.finalLogic,
    };

    this.state.reasoningSummaries.push(summary);
    if (this.state.reasoningSummaries.length > MAX_REASONING_SUMMARIES) {
      this.state.reasoningSummaries.shift();
    }

    return summary;
  }

  trackAutonomyDelta(params: {
    domain: string;
    previousPattern: string;
    newPattern: string;
    changeType: AutonomyDelta['changeType'];
    evidence: string[];
    justification: string;
  }): AutonomyDelta {
    const delta: AutonomyDelta = {
      id: this.generateId('delta'),
      timestamp: new Date().toISOString(),
      cycle: this.state.currentCycle,
      domain: params.domain,
      previousPattern: params.previousPattern,
      newPattern: params.newPattern,
      changeType: params.changeType,
      evidence: params.evidence,
      justification: params.justification,
    };

    this.state.autonomyDeltas.push(delta);
    if (this.state.autonomyDeltas.length > MAX_AUTONOMY_DELTAS) {
      this.state.autonomyDeltas.shift();
    }

    logger.info(`[ObservabilityCore] Autonomy delta: ${params.domain} - ${params.changeType}`);
    return delta;
  }

  captureBehaviorSnapshot(patterns: Record<string, string>, metrics: Record<string, number>): BehaviorSnapshot {
    const snapshot: BehaviorSnapshot = {
      cycle: this.state.currentCycle,
      timestamp: new Date().toISOString(),
      patterns,
      metrics,
    };

    this.state.behaviorSnapshots.push(snapshot);
    if (this.state.behaviorSnapshots.length > MAX_BEHAVIOR_SNAPSHOTS) {
      this.state.behaviorSnapshots.shift();
    }

    return snapshot;
  }

  detectPatternChanges(currentPatterns: Record<string, string>): AutonomyDelta[] {
    const deltas: AutonomyDelta[] = [];
    const lastSnapshot = this.state.behaviorSnapshots[this.state.behaviorSnapshots.length - 1];

    if (!lastSnapshot) return deltas;

    for (const [domain, newPattern] of Object.entries(currentPatterns)) {
      const previousPattern = lastSnapshot.patterns[domain];
      if (previousPattern && previousPattern !== newPattern) {
        deltas.push(this.trackAutonomyDelta({
          domain,
          previousPattern,
          newPattern,
          changeType: 'adaptation',
          evidence: [`Pattern shift detected at cycle ${this.state.currentCycle}`],
          justification: 'Automatic detection from behavior snapshot comparison',
        }));
      }
    }

    return deltas;
  }

  getDecisionTraces(params?: {
    source?: DecisionTrace['source'];
    limit?: number;
    fromCycle?: number;
  }): DecisionTrace[] {
    let traces = [...this.state.decisionTraces];

    if (params?.source) {
      traces = traces.filter(t => t.source === params.source);
    }
    if (params?.fromCycle !== undefined) {
      traces = traces.filter(t => t.cycle >= params.fromCycle);
    }

    return traces.slice(-(params?.limit || 50));
  }

  getReasoningSummaries(limit: number = 20): ReasoningSummary[] {
    return this.state.reasoningSummaries.slice(-limit);
  }

  getAutonomyDeltas(params?: {
    domain?: string;
    changeType?: AutonomyDelta['changeType'];
    limit?: number;
  }): AutonomyDelta[] {
    let deltas = [...this.state.autonomyDeltas];

    if (params?.domain) {
      deltas = deltas.filter(d => d.domain === params.domain);
    }
    if (params?.changeType) {
      deltas = deltas.filter(d => d.changeType === params.changeType);
    }

    return deltas.slice(-(params?.limit || 30));
  }

  getBehaviorSnapshots(limit: number = 10): BehaviorSnapshot[] {
    return this.state.behaviorSnapshots.slice(-limit);
  }

  diffBehavior(cycleA: number, cycleB: number): {
    patternChanges: Array<{ domain: string; before: string; after: string }>;
    metricChanges: Array<{ metric: string; before: number; after: number; delta: number }>;
  } | null {
    const snapshotA = this.state.behaviorSnapshots.find(s => s.cycle === cycleA);
    const snapshotB = this.state.behaviorSnapshots.find(s => s.cycle === cycleB);

    if (!snapshotA || !snapshotB) return null;

    const patternChanges: Array<{ domain: string; before: string; after: string }> = [];
    const metricChanges: Array<{ metric: string; before: number; after: number; delta: number }> = [];

    const allDomains = new Set([...Object.keys(snapshotA.patterns), ...Object.keys(snapshotB.patterns)]);
    for (const domain of allDomains) {
      const before = snapshotA.patterns[domain] || 'none';
      const after = snapshotB.patterns[domain] || 'none';
      if (before !== after) {
        patternChanges.push({ domain, before, after });
      }
    }

    const allMetrics = new Set([...Object.keys(snapshotA.metrics), ...Object.keys(snapshotB.metrics)]);
    for (const metric of allMetrics) {
      const before = snapshotA.metrics[metric] || 0;
      const after = snapshotB.metrics[metric] || 0;
      if (before !== after) {
        metricChanges.push({ metric, before, after, delta: after - before });
      }
    }

    return { patternChanges, metricChanges };
  }

  queryDecisions(query: {
    sources?: DecisionTrace['source'][];
    outcomes?: DecisionTrace['outcome'][];
    fromTimestamp?: string;
    toTimestamp?: string;
    containsEvidence?: string;
  }): DecisionTrace[] {
    let results = [...this.state.decisionTraces];

    if (query.sources?.length) {
      results = results.filter(d => query.sources!.includes(d.source));
    }
    if (query.outcomes?.length) {
      results = results.filter(d => query.outcomes!.includes(d.outcome));
    }
    if (query.fromTimestamp) {
      results = results.filter(d => d.timestamp >= query.fromTimestamp!);
    }
    if (query.toTimestamp) {
      results = results.filter(d => d.timestamp <= query.toTimestamp!);
    }
    if (query.containsEvidence) {
      const search = query.containsEvidence.toLowerCase();
      results = results.filter(d => 
        d.evidenceUsed.some(e => e.toLowerCase().includes(search))
      );
    }

    return results;
  }

  getEvolutionTimeline(limit: number = 20): Array<{
    cycle: number;
    timestamp: string;
    decisions: number;
    deltas: number;
    summary: string;
  }> {
    const cycleMap = new Map<number, { decisions: number; deltas: number; timestamp: string }>();

    for (const trace of this.state.decisionTraces) {
      const existing = cycleMap.get(trace.cycle) || { decisions: 0, deltas: 0, timestamp: trace.timestamp };
      existing.decisions++;
      cycleMap.set(trace.cycle, existing);
    }

    for (const delta of this.state.autonomyDeltas) {
      const existing = cycleMap.get(delta.cycle) || { decisions: 0, deltas: 0, timestamp: delta.timestamp };
      existing.deltas++;
      cycleMap.set(delta.cycle, existing);
    }

    return Array.from(cycleMap.entries())
      .sort((a, b) => b[0] - a[0])
      .slice(0, limit)
      .map(([cycle, data]) => ({
        cycle,
        timestamp: data.timestamp,
        decisions: data.decisions,
        deltas: data.deltas,
        summary: `${data.decisions} decisions, ${data.deltas} behavioral changes`,
      }));
  }

  exportStatus(): {
    enabled: boolean;
    currentCycle: number;
    lastObservation: string;
    totalDecisions: number;
    totalReasoningSummaries: number;
    totalAutonomyDeltas: number;
    totalBehaviorSnapshots: number;
    recentDecisionsBySource: Record<string, number>;
    recentDeltasByType: Record<string, number>;
  } {
    const recentDecisions = this.state.decisionTraces.slice(-50);
    const recentDeltas = this.state.autonomyDeltas.slice(-30);

    const decisionsBySource: Record<string, number> = {};
    for (const d of recentDecisions) {
      decisionsBySource[d.source] = (decisionsBySource[d.source] || 0) + 1;
    }

    const deltasByType: Record<string, number> = {};
    for (const d of recentDeltas) {
      deltasByType[d.changeType] = (deltasByType[d.changeType] || 0) + 1;
    }

    return {
      enabled: this.state.enabled,
      currentCycle: this.state.currentCycle,
      lastObservation: this.state.lastObservation,
      totalDecisions: this.state.decisionTraces.length,
      totalReasoningSummaries: this.state.reasoningSummaries.length,
      totalAutonomyDeltas: this.state.autonomyDeltas.length,
      totalBehaviorSnapshots: this.state.behaviorSnapshots.length,
      recentDecisionsBySource: decisionsBySource,
      recentDeltasByType: deltasByType,
    };
  }

  getState(): ObservabilityState {
    return { ...this.state };
  }
}

export const observabilityCore = new ObservabilityCoreEngine();
