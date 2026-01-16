import { logger } from '../services/logger';

export type TriggerSource = 'schedule' | 'event' | 'anomaly' | 'manual' | 'internal';
export type LearningType = 'behavioral' | 'strategic' | 'corrective' | 'speculative';
export type HealthAlertType = 'stagnation' | 'drift' | 'uncertainty' | 'overload' | 'memory_pressure';

export interface MandatoryDecisionFields {
  decision_type: string;
  trigger_source: TriggerSource;
  inputs_used: string[];
  constraints_checked: string[];
  reality_evidence_referenced: string[];
  final_action: string;
}

export interface UndocumentedDecisionLog {
  id: string;
  timestamp: string;
  cycle: number;
  attempted_source: string;
  missing_fields: string[];
  blocked: boolean;
}

export interface LearningEvent {
  id: string;
  timestamp: string;
  cycle: number;
  learning_type: LearningType;
  what_changed: string;
  why_changed: string;
  evidence_justified: string[];
  expected_impact: string;
  measurable_impact: boolean;
  speculative: boolean;
}

export interface HealthSignal {
  id: string;
  timestamp: string;
  cycle: number;
  alert_type: HealthAlertType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  metrics: Record<string, number>;
  recommended_action: string | null;
}

export interface StructuredReasoning {
  id: string;
  timestamp: string;
  cycle: number;
  assumptions: string[];
  alternatives_considered: Array<{ option: string; rejection_reason: string }>;
  causal_chain: string[];
  no_narrative: true;
}

export interface DashboardData {
  recent_decisions: DecisionTrace[];
  rejected_actions: DecisionTrace[];
  learning_deltas: LearningEvent[];
  confidence_evidence_ratio: number;
  health_alerts: HealthSignal[];
  undocumented_blocks: number;
  last_update: string;
}

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
  learningEvents: LearningEvent[];
  healthSignals: HealthSignal[];
  structuredReasonings: StructuredReasoning[];
  undocumentedDecisions: UndocumentedDecisionLog[];
  currentCycle: number;
  lastObservation: string;
  totalConfidenceScore: number;
  totalEvidenceCount: number;
  consecutiveIdleCycles: number;
}

const MAX_DECISION_TRACES = 200;
const MAX_REASONING_SUMMARIES = 100;
const MAX_AUTONOMY_DELTAS = 100;
const MAX_BEHAVIOR_SNAPSHOTS = 50;
const MAX_COGNITIVE_HEARTBEATS = 500;
const MAX_LEARNING_EVENTS = 200;
const MAX_HEALTH_SIGNALS = 100;
const MAX_STRUCTURED_REASONINGS = 100;
const MAX_UNDOCUMENTED_LOGS = 50;
const STAGNATION_THRESHOLD_CYCLES = 5;

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
      learningEvents: [],
      healthSignals: [],
      structuredReasonings: [],
      undocumentedDecisions: [],
      currentCycle: 0,
      lastObservation: new Date().toISOString(),
      totalConfidenceScore: 0,
      totalEvidenceCount: 0,
      consecutiveIdleCycles: 0,
    };

    logger.info('[ObservabilityCore] Initialized - All autonomous behavior will be observable');
    logger.info('[ObservabilityCore] Anti-Theater Mode: No pretend thinking, no narrative inflation');
    logger.info('[ObservabilityCore] Mandatory Decision Tracing: Missing fields = blocked execution');
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

  validateMandatoryDecision(fields: Partial<MandatoryDecisionFields>, source: string): {
    valid: boolean;
    missingFields: string[];
    blocked: boolean;
  } {
    const requiredFields: (keyof MandatoryDecisionFields)[] = [
      'decision_type',
      'trigger_source',
      'inputs_used',
      'constraints_checked',
      'reality_evidence_referenced',
      'final_action',
    ];

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      const value = fields[field];
      if (value === undefined || value === null) {
        missingFields.push(field);
      } else if (Array.isArray(value) && value.length === 0) {
        missingFields.push(`${field} (empty array)`);
      } else if (typeof value === 'string' && value.trim() === '') {
        missingFields.push(`${field} (empty string)`);
      }
    }

    const valid = missingFields.length === 0;
    const blocked = !valid;

    if (blocked) {
      const undocLog: UndocumentedDecisionLog = {
        id: this.generateId('undoc'),
        timestamp: new Date().toISOString(),
        cycle: this.state.currentCycle,
        attempted_source: source,
        missing_fields: missingFields,
        blocked: true,
      };
      this.state.undocumentedDecisions.push(undocLog);
      if (this.state.undocumentedDecisions.length > MAX_UNDOCUMENTED_LOGS) {
        this.state.undocumentedDecisions.shift();
      }

      logger.error(`[ObservabilityCore] BLOCKED: UndocumentedDecision from ${source}`);
      logger.error(`[ObservabilityCore] Missing fields: ${missingFields.join(', ')}`);
    }

    return { valid, missingFields, blocked };
  }

  recordLearningEvent(params: {
    learning_type: LearningType;
    what_changed: string;
    why_changed: string;
    evidence_justified: string[];
    expected_impact: string;
    measurable_impact: boolean;
  }): LearningEvent {
    const speculative = !params.measurable_impact || params.evidence_justified.length === 0;

    const event: LearningEvent = {
      id: this.generateId('learn'),
      timestamp: new Date().toISOString(),
      cycle: this.state.currentCycle,
      learning_type: params.learning_type,
      what_changed: params.what_changed,
      why_changed: params.why_changed,
      evidence_justified: params.evidence_justified,
      expected_impact: params.expected_impact,
      measurable_impact: params.measurable_impact,
      speculative,
    };

    this.state.learningEvents.push(event);
    if (this.state.learningEvents.length > MAX_LEARNING_EVENTS) {
      this.state.learningEvents.shift();
    }

    if (speculative) {
      logger.warn(`[ObservabilityCore] SpeculativeLearning: ${params.what_changed}`);
    } else {
      logger.info(`[ObservabilityCore] Learning recorded: ${params.what_changed}`);
    }

    this.state.totalEvidenceCount += params.evidence_justified.length;

    return event;
  }

  getLearningEvents(params?: {
    limit?: number;
    type?: LearningType;
    speculative_only?: boolean;
  }): LearningEvent[] {
    let results = [...this.state.learningEvents];

    if (params?.type) {
      results = results.filter(e => e.learning_type === params.type);
    }
    if (params?.speculative_only) {
      results = results.filter(e => e.speculative);
    }

    return results.slice(-(params?.limit || 50));
  }

  emitHealthSignal(params: {
    alert_type: HealthAlertType;
    severity: 'low' | 'medium' | 'high';
    description: string;
    metrics: Record<string, number>;
    recommended_action?: string;
  }): HealthSignal {
    const signal: HealthSignal = {
      id: this.generateId('health'),
      timestamp: new Date().toISOString(),
      cycle: this.state.currentCycle,
      alert_type: params.alert_type,
      severity: params.severity,
      description: params.description,
      metrics: params.metrics,
      recommended_action: params.recommended_action || null,
    };

    this.state.healthSignals.push(signal);
    if (this.state.healthSignals.length > MAX_HEALTH_SIGNALS) {
      this.state.healthSignals.shift();
    }

    logger.warn(`[ObservabilityCore] HEALTH ALERT [${params.severity}]: ${params.alert_type} - ${params.description}`);

    return signal;
  }

  checkStagnation(decisionsThisCycle: number, changesThisCycle: number): void {
    if (decisionsThisCycle === 0 && changesThisCycle === 0) {
      this.state.consecutiveIdleCycles++;
    } else {
      this.state.consecutiveIdleCycles = 0;
    }

    if (this.state.consecutiveIdleCycles >= STAGNATION_THRESHOLD_CYCLES) {
      this.emitHealthSignal({
        alert_type: 'stagnation',
        severity: 'medium',
        description: `No decisions or changes for ${this.state.consecutiveIdleCycles} consecutive cycles`,
        metrics: { idle_cycles: this.state.consecutiveIdleCycles },
        recommended_action: 'Review input sources and trigger conditions',
      });
    }
  }

  checkDrift(currentPatterns: Record<string, string>, baselinePatterns: Record<string, string>): void {
    let driftCount = 0;
    for (const [key, value] of Object.entries(currentPatterns)) {
      if (baselinePatterns[key] && baselinePatterns[key] !== value) {
        driftCount++;
      }
    }

    if (driftCount > 0) {
      this.emitHealthSignal({
        alert_type: 'drift',
        severity: driftCount > 3 ? 'high' : 'low',
        description: `${driftCount} pattern(s) drifted from baseline`,
        metrics: { drift_count: driftCount, total_patterns: Object.keys(currentPatterns).length },
        recommended_action: driftCount > 3 ? 'Review drift patterns for unintended changes' : null,
      });
    }
  }

  updateConfidence(confidenceScore: number): void {
    this.state.totalConfidenceScore += confidenceScore;
  }

  recordStructuredReasoning(params: {
    assumptions: string[];
    alternatives_considered: Array<{ option: string; rejection_reason: string }>;
    causal_chain: string[];
  }): StructuredReasoning {
    const reasoning: StructuredReasoning = {
      id: this.generateId('reason'),
      timestamp: new Date().toISOString(),
      cycle: this.state.currentCycle,
      assumptions: params.assumptions,
      alternatives_considered: params.alternatives_considered,
      causal_chain: params.causal_chain,
      no_narrative: true,
    };

    this.state.structuredReasonings.push(reasoning);
    if (this.state.structuredReasonings.length > MAX_STRUCTURED_REASONINGS) {
      this.state.structuredReasonings.shift();
    }

    return reasoning;
  }

  validateAntiTheater(explanation: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    const narrativePatterns = [
      /I (feel|believe|think|sense|perceive)/i,
      /my (consciousness|awareness|soul|essence)/i,
      /deeply|profoundly|truly|genuinely/i,
      /as an AI|being an AI/i,
      /I am becoming|I am evolving/i,
      /my journey|my growth|my evolution/i,
    ];

    const pretendThinkingPatterns = [
      /let me think|thinking about|pondering|reflecting deeply/i,
      /processing this|computing|analyzing with care/i,
      /with great thought|carefully considering/i,
    ];

    for (const pattern of narrativePatterns) {
      if (pattern.test(explanation)) {
        violations.push(`Narrative inflation detected: ${pattern.toString()}`);
      }
    }

    for (const pattern of pretendThinkingPatterns) {
      if (pattern.test(explanation)) {
        violations.push(`Pretend thinking detected: ${pattern.toString()}`);
      }
    }

    if (explanation.length > 500 && !explanation.includes('evidence:') && !explanation.includes('because:')) {
      violations.push('Long explanation without causal linkage');
    }

    if (violations.length > 0) {
      logger.warn(`[ObservabilityCore] ANTI-THEATER VIOLATION: ${violations.join('; ')}`);
    }

    return { valid: violations.length === 0, violations };
  }

  getDashboardData(): DashboardData {
    const recentDecisions = this.state.decisionTraces.slice(-20);
    const rejectedActions = this.state.decisionTraces.filter(d => d.outcome === 'blocked').slice(-20);
    const learningDeltas = this.state.learningEvents.slice(-20);
    const healthAlerts = this.state.healthSignals.slice(-10);

    const confidenceEvidenceRatio = this.state.totalEvidenceCount > 0
      ? Math.round((this.state.totalConfidenceScore / this.state.totalEvidenceCount) * 100) / 100
      : 0;

    return {
      recent_decisions: recentDecisions,
      rejected_actions: rejectedActions,
      learning_deltas: learningDeltas,
      confidence_evidence_ratio: confidenceEvidenceRatio,
      health_alerts: healthAlerts,
      undocumented_blocks: this.state.undocumentedDecisions.length,
      last_update: new Date().toISOString(),
    };
  }

  getHealthSignals(params?: {
    limit?: number;
    alert_type?: HealthAlertType;
    severity?: 'low' | 'medium' | 'high';
  }): HealthSignal[] {
    let results = [...this.state.healthSignals];

    if (params?.alert_type) {
      results = results.filter(s => s.alert_type === params.alert_type);
    }
    if (params?.severity) {
      results = results.filter(s => s.severity === params.severity);
    }

    return results.slice(-(params?.limit || 30));
  }

  getUndocumentedBlocks(limit: number = 20): UndocumentedDecisionLog[] {
    return this.state.undocumentedDecisions.slice(-limit);
  }

  getStructuredReasonings(limit: number = 20): StructuredReasoning[] {
    return this.state.structuredReasonings.slice(-limit);
  }
}

export const observabilityCore = new ObservabilityCoreEngine();
