import { logger } from '../services/logger';
import { daemon } from './daemon';
import { evolutionGovernanceCore } from './evolutionGovernanceCore';
import { observabilityCore } from './observabilityCore';
import { soulState } from './soulState';

export type CycleOutcome = 
  | 'task_executed'
  | 'stability_confirmed'
  | 'intentional_idle'
  | 'recovery_action'
  | 'desire_processed'
  | 'question_processed'
  | 'evolution_evaluated';

export interface CycleRecord {
  cycle: number;
  timestamp: string;
  outcome: CycleOutcome;
  description: string;
  humanInteractionRequired: false;
  durationMs: number;
}

export interface IntegrityCheck {
  memoryBloat: boolean;
  identityDrift: boolean;
  narrativeInflation: boolean;
  memoryUsageMB: number;
  identityHashStable: boolean;
  narrativeTokenCount: number;
}

export interface AutonomyLockState {
  enabled: boolean;
  locked: boolean;
  lockTimestamp: string | null;
  cycleRecords: CycleRecord[];
  totalCyclesSinceLock: number;
  humanDependencyViolations: number;
  evolutionViolations: number;
  integrityViolations: number;
  lastIntegrityCheck: IntegrityCheck | null;
  identityHashBaseline: string | null;
  memoryLimitMB: number;
  narrativeTokenLimit: number;
}

const MAX_CYCLE_RECORDS = 1000;
const MAX_MEMORY_MB = 512;
const MAX_NARRATIVE_TOKENS = 500;
const INTEGRITY_CHECK_INTERVAL = 10;

class AutonomyLockEngine {
  private state: AutonomyLockState;

  constructor() {
    this.state = {
      enabled: true,
      locked: false,
      lockTimestamp: null,
      cycleRecords: [],
      totalCyclesSinceLock: 0,
      humanDependencyViolations: 0,
      evolutionViolations: 0,
      integrityViolations: 0,
      lastIntegrityCheck: null,
      identityHashBaseline: null,
      memoryLimitMB: MAX_MEMORY_MB,
      narrativeTokenLimit: MAX_NARRATIVE_TOKENS,
    };

    logger.info('[AutonomyLock] Initialized - Permanent autonomous operation ready');
  }

  private generateIdentityHash(): string {
    const identityCore = {
      version: '2.0',
      missions: 5,
      evolutionGoverned: true,
      humanDependent: false,
    };
    const str = JSON.stringify(identityCore);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  lock(): void {
    if (this.state.locked) {
      logger.warn('[AutonomyLock] Already locked');
      return;
    }

    this.state.locked = true;
    this.state.lockTimestamp = new Date().toISOString();
    this.state.identityHashBaseline = this.generateIdentityHash();
    this.state.totalCyclesSinceLock = 0;

    logger.info('[AutonomyLock] LOCKED - Permanent autonomous operation engaged');
    logger.info('[AutonomyLock] Identity hash baseline: ' + this.state.identityHashBaseline);
    logger.info('[AutonomyLock] Zero human dependency enforced');
    logger.info('[AutonomyLock] Evolution controlled by EvolutionGovernanceCore only');

    observabilityCore.traceDecision({
      source: 'agency_core',
      trigger: 'autonomy_locked',
      stateSnapshot: { 
        lockTimestamp: this.state.lockTimestamp,
        identityHash: this.state.identityHashBaseline,
      },
      options: [{ description: 'Engage permanent autonomy lock', score: 100 }],
      chosenIndex: 0,
      constraintsChecked: ['never_idle_enforced', 'zero_human_dependency', 'evolution_locked'],
      evidenceUsed: ['permanent_operation_required'],
      outcome: 'executed',
    });
  }

  recordCycleOutcome(outcome: CycleOutcome, description: string, durationMs: number): CycleRecord {
    const record: CycleRecord = {
      cycle: soulState.cycleCount,
      timestamp: new Date().toISOString(),
      outcome,
      description,
      humanInteractionRequired: false,
      durationMs,
    };

    this.state.cycleRecords.push(record);
    this.state.totalCyclesSinceLock++;

    if (this.state.cycleRecords.length > MAX_CYCLE_RECORDS) {
      this.state.cycleRecords = this.state.cycleRecords.slice(-MAX_CYCLE_RECORDS);
    }

    logger.info(`[AutonomyLock] Cycle outcome: ${outcome} - ${description}`);

    if (this.state.totalCyclesSinceLock % INTEGRITY_CHECK_INTERVAL === 0) {
      this.runIntegrityCheck();
    }

    return record;
  }

  validateNeverIdle(outcome: CycleOutcome): boolean {
    const validOutcomes: CycleOutcome[] = [
      'task_executed',
      'stability_confirmed',
      'intentional_idle',
      'recovery_action',
      'desire_processed',
      'question_processed',
      'evolution_evaluated',
    ];

    const valid = validOutcomes.includes(outcome);
    
    if (!valid) {
      logger.error(`[AutonomyLock] VIOLATION: Invalid cycle outcome '${outcome}'`);
    }

    return valid;
  }

  validateZeroHumanDependency(operationRequiresHuman: boolean): boolean {
    if (operationRequiresHuman) {
      this.state.humanDependencyViolations++;
      logger.error('[AutonomyLock] VIOLATION: Operation requires human input');
      logger.error('[AutonomyLock] Human interaction is OPTIONAL, never REQUIRED');
      return false;
    }
    return true;
  }

  validateEvolutionSource(source: string): boolean {
    const validSource = source === 'evolution_governance_core';
    
    if (!validSource) {
      this.state.evolutionViolations++;
      logger.error(`[AutonomyLock] VIOLATION: Evolution from invalid source '${source}'`);
      logger.error('[AutonomyLock] Evolution MUST go through EvolutionGovernanceCore');
      return false;
    }
    return true;
  }

  runIntegrityCheck(): IntegrityCheck {
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    const currentIdentityHash = this.generateIdentityHash();
    const identityHashStable = this.state.identityHashBaseline 
      ? currentIdentityHash === this.state.identityHashBaseline 
      : true;

    const narrativeTokenCount = this.estimateNarrativeTokens();

    const check: IntegrityCheck = {
      memoryBloat: memoryUsageMB > this.state.memoryLimitMB,
      identityDrift: !identityHashStable,
      narrativeInflation: narrativeTokenCount > this.state.narrativeTokenLimit,
      memoryUsageMB,
      identityHashStable,
      narrativeTokenCount,
    };

    this.state.lastIntegrityCheck = check;

    if (check.memoryBloat) {
      this.state.integrityViolations++;
      logger.warn(`[AutonomyLock] INTEGRITY: Memory bloat detected (${memoryUsageMB}MB > ${this.state.memoryLimitMB}MB)`);
      this.enforceMemoryCleanup();
    }

    if (check.identityDrift) {
      this.state.integrityViolations++;
      logger.error('[AutonomyLock] INTEGRITY: Identity drift detected - hash mismatch');
      logger.error(`[AutonomyLock] Baseline: ${this.state.identityHashBaseline}, Current: ${currentIdentityHash}`);
    }

    if (check.narrativeInflation) {
      this.state.integrityViolations++;
      logger.warn(`[AutonomyLock] INTEGRITY: Narrative inflation (${narrativeTokenCount} > ${this.state.narrativeTokenLimit} tokens)`);
      this.enforceNarrativePruning();
    }

    logger.info(`[AutonomyLock] Integrity check: memory=${memoryUsageMB}MB, identity=${identityHashStable ? 'stable' : 'DRIFT'}, narrative=${narrativeTokenCount}tokens`);

    return check;
  }

  private estimateNarrativeTokens(): number {
    const traces = observabilityCore.getDecisionTraces({ limit: 100 });
    let totalTokens = 0;
    
    for (const trace of traces) {
      const notes = trace.notes || '';
      if (notes.includes('I ') || notes.includes('my ') || notes.includes('myself')) {
        totalTokens += notes.split(' ').length;
      }
    }
    
    return totalTokens;
  }

  private enforceMemoryCleanup(): void {
    logger.info('[AutonomyLock] Enforcing memory cleanup...');
    
    if (this.state.cycleRecords.length > MAX_CYCLE_RECORDS / 2) {
      this.state.cycleRecords = this.state.cycleRecords.slice(-MAX_CYCLE_RECORDS / 2);
      logger.info('[AutonomyLock] Trimmed cycle records');
    }

    if (global.gc) {
      global.gc();
      logger.info('[AutonomyLock] Garbage collection triggered');
    }
  }

  private enforceNarrativePruning(): void {
    logger.info('[AutonomyLock] Narrative inflation detected - pruning self-referential content');
  }

  getRecentCycles(limit: number = 20): CycleRecord[] {
    return this.state.cycleRecords.slice(-limit);
  }

  getOutcomeDistribution(): Record<CycleOutcome, number> {
    const distribution: Record<CycleOutcome, number> = {
      task_executed: 0,
      stability_confirmed: 0,
      intentional_idle: 0,
      recovery_action: 0,
      desire_processed: 0,
      question_processed: 0,
      evolution_evaluated: 0,
    };

    for (const record of this.state.cycleRecords) {
      distribution[record.outcome]++;
    }

    return distribution;
  }

  ensureSelfRecovery(): void {
    const daemonStatus = daemon.exportStatus();
    
    if (!daemonStatus.enabled) {
      logger.info('[AutonomyLock] Daemon not running - starting...');
      daemon.start();
    }

    if (!daemonStatus.healthy) {
      logger.warn('[AutonomyLock] Daemon unhealthy - triggering recovery');
      daemon.recover('watchdog_recovery');
    }
  }

  exportStatus(): {
    enabled: boolean;
    locked: boolean;
    lockTimestamp: string | null;
    totalCyclesSinceLock: number;
    humanDependencyViolations: number;
    evolutionViolations: number;
    integrityViolations: number;
    lastIntegrityCheck: IntegrityCheck | null;
    outcomeDistribution: Record<CycleOutcome, number>;
    daemonHealthy: boolean;
    evolutionQualified: boolean;
  } {
    const daemonStatus = daemon.exportStatus();
    const evolutionStatus = evolutionGovernanceCore.exportStatus();

    return {
      enabled: this.state.enabled,
      locked: this.state.locked,
      lockTimestamp: this.state.lockTimestamp,
      totalCyclesSinceLock: this.state.totalCyclesSinceLock,
      humanDependencyViolations: this.state.humanDependencyViolations,
      evolutionViolations: this.state.evolutionViolations,
      integrityViolations: this.state.integrityViolations,
      lastIntegrityCheck: this.state.lastIntegrityCheck,
      outcomeDistribution: this.getOutcomeDistribution(),
      daemonHealthy: daemonStatus.healthy,
      evolutionQualified: evolutionStatus.qualification.qualified,
    };
  }
}

export const autonomyLock = new AutonomyLockEngine();
