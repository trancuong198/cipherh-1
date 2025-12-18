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

export type SystemMode = 'idle' | 'active' | 'recovery';
export type HeartbeatReason = 'stable_environment' | 'blocked' | 'waiting' | 'recovering' | 'processing' | 'completed';

export interface CognitiveHeartbeat {
  id: string;
  timestamp: string;
  cycle_id: number;
  system_mode: SystemMode;
  inputs_seen_count: number;
  decisions_made_count: number;
  changes_detected: boolean;
  reason: HeartbeatReason;
  duration_ms?: number;
  notes?: string;
}

interface ObservabilityState {
  enabled: boolean;
  decisionTraces: DecisionTrace[];
  reasoningSummaries: ReasoningSummary[];
  autonomyDeltas: AutonomyDelta[];
  behaviorSnapshots: BehaviorSnapshot[];
  cognitiveHeartbeats: CognitiveHeartbeat[];
  currentCycle: number;
  lastObservation: string;
}

const MAX_DECISION_TRACES = 200;
const MAX_REASONING_SUMMARIES = 100;
const MAX_AUTONOMY_DELTAS = 100;
const MAX_BEHAVIOR_SNAPSHOTS = 50;
const MAX_COGNITIVE_HEARTBEATS = 500;

class ObservabilityCoreEngine {
  private state: ObservabilityState;

  constructor() {
    this.state = {
      enabled: true,
      decisionTraces: [],
      reasoningSummaries: [],
      autonomyDeltas: [],
      behaviorSnapshots: [],
      cognitiveHeartbeats: [],
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

  emitHeartbeat(params: {
    system_mode: SystemMode;
    inputs_seen_count: number;
    decisions_made_count: number;
    changes_detected: boolean;
    reason: HeartbeatReason;
    duration_ms?: number;
    notes?: string;
  }): CognitiveHeartbeat {
    const now = new Date().toISOString();

    const heartbeat: CognitiveHeartbeat = {
      id: this.generateId('hb'),
      timestamp: now,
      cycle_id: this.state.currentCycle,
      system_mode: params.system_mode,
      inputs_seen_count: params.inputs_seen_count,
      decisions_made_count: params.decisions_made_count,
      changes_detected: params.changes_detected,
      reason: params.reason,
      duration_ms: params.duration_ms,
      notes: params.notes,
    };

    this.state.cognitiveHeartbeats.push(heartbeat);

    if (this.state.cognitiveHeartbeats.length > MAX_COGNITIVE_HEARTBEATS) {
      this.state.cognitiveHeartbeats = this.state.cognitiveHeartbeats.slice(-MAX_COGNITIVE_HEARTBEATS);
    }

    logger.info(`[Heartbeat] Cycle ${heartbeat.cycle_id} | ${heartbeat.system_mode} | ${heartbeat.reason} | inputs=${heartbeat.inputs_seen_count} decisions=${heartbeat.decisions_made_count} changes=${heartbeat.changes_detected}`);

    return heartbeat;
  }

  getCognitiveHeartbeats(params: {
    limit?: number;
    system_mode?: SystemMode;
    reason?: HeartbeatReason;
    fromCycle?: number;
    toCycle?: number;
  } = {}): CognitiveHeartbeat[] {
    let results = [...this.state.cognitiveHeartbeats];

    if (params.system_mode) {
      results = results.filter(h => h.system_mode === params.system_mode);
    }
    if (params.reason) {
      results = results.filter(h => h.reason === params.reason);
    }
    if (params.fromCycle !== undefined) {
      results = results.filter(h => h.cycle_id >= params.fromCycle!);
    }
    if (params.toCycle !== undefined) {
      results = results.filter(h => h.cycle_id <= params.toCycle!);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return results.slice(0, params.limit || 50);
  }

  getLatestHeartbeat(): CognitiveHeartbeat | null {
    if (this.state.cognitiveHeartbeats.length === 0) return null;
    return this.state.cognitiveHeartbeats[this.state.cognitiveHeartbeats.length - 1];
  }

  getHeartbeatStats(): {
    total: number;
    byMode: Record<SystemMode, number>;
    byReason: Record<HeartbeatReason, number>;
    averageDuration: number;
    lastHeartbeat: CognitiveHeartbeat | null;
  } {
    const byMode: Record<SystemMode, number> = { idle: 0, active: 0, recovery: 0 };
    const byReason: Record<HeartbeatReason, number> = { 
      stable_environment: 0, blocked: 0, waiting: 0, recovering: 0, processing: 0, completed: 0 
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const hb of this.state.cognitiveHeartbeats) {
      byMode[hb.system_mode]++;
      byReason[hb.reason]++;
      if (hb.duration_ms !== undefined) {
        totalDuration += hb.duration_ms;
        durationCount++;
      }
    }

    return {
      total: this.state.cognitiveHeartbeats.length,
      byMode,
      byReason,
      averageDuration: durationCount > 0 ? Math.round(totalDuration / durationCount) : 0,
      lastHeartbeat: this.getLatestHeartbeat(),
    };
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
