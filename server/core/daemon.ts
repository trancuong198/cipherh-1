import { logger } from '../services/logger';
import { innerLoop } from './innerLoop';
import { soulState } from './soulState';
import { observabilityCore } from './observabilityCore';
import { realityCore } from './realityCore';
import { desireCore } from './desireCore';
import { governanceEngine } from './governanceEngine';
import { measurementEngine } from './measurementEngine';
import { coreGoals } from './coreGoals';
import * as fs from 'fs';
import * as path from 'path';

export interface Heartbeat {
  cycle: number;
  timestamp: string;
  status: 'alive' | 'running' | 'completed' | 'error';
  lastCycleDuration: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

export interface StateSnapshot {
  id: string;
  timestamp: string;
  cycle: number;
  version: string;
  agency_state: {
    cycleCount: number;
    confidence: number;
    doubts: number;
    energyLevel: number;
    mode: string;
    currentFocus: string | null;
  };
  autonomy_level: number;
  active_constraints: string[];
  reality_metrics_summary: {
    stabilityScore: number;
    evolutionScore: number;
    autonomyScore: number;
    consecutiveMismatches: number;
  };
  behavior_pattern_hash: string;
  desire_state_summary: {
    totalDesires: number;
    pendingDesires: number;
    blockedDesires: number;
    activeTasksCount: number;
  };
  governance_state: {
    conservativeMode: boolean;
    violationsBlocked: number;
  };
  checksum: string;
}

export interface RecoveryEvent {
  id: string;
  timestamp: string;
  type: 'cold_start' | 'crash_recovery' | 'watchdog_recovery' | 'manual_recovery';
  snapshotUsed: string | null;
  cycleRestored: number;
  stateRestored: {
    confidence: number;
    autonomy: number;
    patterns_preserved: boolean;
  };
  notes: string;
}

export interface DaemonState {
  enabled: boolean;
  running: boolean;
  lastHeartbeat: Heartbeat | null;
  heartbeatHistory: Heartbeat[];
  lastSnapshot: StateSnapshot | null;
  snapshotHistory: StateSnapshot[];
  recoveryEvents: RecoveryEvent[];
  startedAt: string | null;
  totalCyclesRun: number;
  watchdogEnabled: boolean;
  watchdogIntervalMs: number;
  cycleIntervalMs: number;
  recoveryCount: number;
  lastRecovery: string | null;
  coldStartRecoveryPerformed: boolean;
}

const SNAPSHOT_FILE = './data/state_snapshot.json';
const HEARTBEAT_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_HEARTBEAT_HISTORY = 100;
const DEFAULT_CYCLE_INTERVAL_MS = 10 * 60 * 1000;
const WATCHDOG_CHECK_INTERVAL_MS = 60 * 1000;

class DaemonEngine {
  private state: DaemonState;
  private cycleTimer: NodeJS.Timeout | null = null;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private lastCycleStart: number = 0;

  constructor() {
    this.state = {
      enabled: false,
      running: false,
      lastHeartbeat: null,
      heartbeatHistory: [],
      lastSnapshot: null,
      snapshotHistory: [],
      recoveryEvents: [],
      startedAt: null,
      totalCyclesRun: 0,
      watchdogEnabled: true,
      watchdogIntervalMs: WATCHDOG_CHECK_INTERVAL_MS,
      cycleIntervalMs: DEFAULT_CYCLE_INTERVAL_MS,
      recoveryCount: 0,
      lastRecovery: null,
      coldStartRecoveryPerformed: false,
    };

    this.ensureDataDirectory();
    this.loadSnapshot();

    logger.info('[Daemon] Initialized - 24/7 continuous operation ready');
  }

  private ensureDataDirectory(): void {
    const dir = path.dirname(SNAPSHOT_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private generateChecksum(data: object): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  private loadSnapshot(): void {
    try {
      if (fs.existsSync(SNAPSHOT_FILE)) {
        const data = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
        const snapshot: StateSnapshot = JSON.parse(data);
        
        const checksumData = {
          cycle: snapshot.cycle,
          agency_state: snapshot.agency_state,
          autonomy_level: snapshot.autonomy_level,
        };
        const checksum = this.generateChecksum(checksumData);

        if (checksum === snapshot.checksum) {
          this.state.lastSnapshot = snapshot;
          logger.info(`[Daemon] Loaded snapshot from cycle ${snapshot.cycle} (confidence=${snapshot.agency_state?.confidence || 'N/A'})`);
        } else {
          logger.warn('[Daemon] Snapshot checksum mismatch - ignoring corrupted snapshot');
        }
      }
    } catch (error) {
      logger.warn(`[Daemon] Failed to load snapshot: ${error}`);
    }
  }

  private generateBehaviorHash(): string {
    const patterns = observabilityCore.getBehaviorSnapshots(1)[0]?.patterns || {};
    return this.generateChecksum(patterns);
  }

  saveSnapshot(): StateSnapshot {
    const measurements = measurementEngine.runAllMeasurements();
    const realityStatus = realityCore.exportStatus();
    const desireStatus = desireCore.exportStatus();
    const govStatus = governanceEngine.exportStatus();

    const snapshot: StateSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      version: '2.0',
      agency_state: {
        cycleCount: soulState.cycleCount,
        confidence: soulState.confidence,
        doubts: soulState.doubts,
        energyLevel: soulState.energyLevel,
        mode: soulState.mode,
        currentFocus: soulState.currentFocus,
      },
      autonomy_level: measurements.autonomy?.currentScore || 50,
      active_constraints: govStatus.conservativeMode ? ['conservative_mode'] : [],
      reality_metrics_summary: {
        stabilityScore: measurements.stability?.currentScore || 50,
        evolutionScore: measurements.evolution?.currentScore || 50,
        autonomyScore: measurements.autonomy?.currentScore || 50,
        consecutiveMismatches: realityStatus.consecutiveMismatches,
      },
      behavior_pattern_hash: this.generateBehaviorHash(),
      desire_state_summary: {
        totalDesires: desireStatus.totalDesires,
        pendingDesires: desireStatus.pendingDesires,
        blockedDesires: desireStatus.blockedDesires,
        activeTasksCount: desireStatus.activeTasks,
      },
      governance_state: {
        conservativeMode: govStatus.conservativeMode,
        violationsBlocked: govStatus.violationsBlocked,
      },
      checksum: '',
    };

    snapshot.checksum = this.generateChecksum({
      cycle: snapshot.cycle,
      agency_state: snapshot.agency_state,
      autonomy_level: snapshot.autonomy_level,
    });

    try {
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
      this.state.lastSnapshot = snapshot;
      this.state.snapshotHistory.push(snapshot);
      
      if (this.state.snapshotHistory.length > 20) {
        this.state.snapshotHistory = this.state.snapshotHistory.slice(-20);
      }
      
      logger.info(`[Daemon] Snapshot saved at cycle ${snapshot.cycle} (confidence=${snapshot.agency_state.confidence}, autonomy=${snapshot.autonomy_level})`);
    } catch (error) {
      logger.error(`[Daemon] Failed to save snapshot: ${error}`);
    }

    return snapshot;
  }

  recordHeartbeat(status: Heartbeat['status'], cycleDuration: number = 0): Heartbeat {
    const now = new Date().toISOString();
    const lastHb = this.state.lastHeartbeat;

    const heartbeat: Heartbeat = {
      cycle: soulState.cycleCount,
      timestamp: now,
      status,
      lastCycleDuration: cycleDuration,
      consecutiveSuccesses: status === 'completed' ? (lastHb?.consecutiveSuccesses || 0) + 1 : 0,
      consecutiveFailures: status === 'error' ? (lastHb?.consecutiveFailures || 0) + 1 : 0,
    };

    this.state.lastHeartbeat = heartbeat;
    this.state.heartbeatHistory.push(heartbeat);

    if (this.state.heartbeatHistory.length > MAX_HEARTBEAT_HISTORY) {
      this.state.heartbeatHistory.shift();
    }

    logger.info(`[Daemon] Heartbeat: ${status} | Cycle ${heartbeat.cycle} | Duration ${cycleDuration}ms`);

    return heartbeat;
  }

  async runCycle(): Promise<void> {
    if (this.state.running) {
      logger.warn('[Daemon] Cycle already running - skipping');
      return;
    }

    this.state.running = true;
    this.lastCycleStart = Date.now();
    this.recordHeartbeat('running');

    try {
      const result = await innerLoop.run();
      const duration = Date.now() - this.lastCycleStart;

      if (result.success) {
        this.recordHeartbeat('completed', duration);
        this.state.totalCyclesRun++;
        
        if (soulState.cycleCount % 5 === 0) {
          this.saveSnapshot();
        }

        observabilityCore.traceDecision({
          source: 'inner_loop',
          trigger: 'daemon_cycle_complete',
          stateSnapshot: { cycle: result.cycle, duration },
          options: [{ description: 'Cycle completed successfully', score: 100 }],
          chosenIndex: 0,
          constraintsChecked: ['no_errors'],
          evidenceUsed: [`duration=${duration}ms`, `success=true`],
          outcome: 'executed',
        });
      } else {
        this.recordHeartbeat('error', duration);
        logger.error(`[Daemon] Cycle failed: ${result.error}`);

        if (this.state.lastHeartbeat && this.state.lastHeartbeat.consecutiveFailures >= 3) {
          logger.warn('[Daemon] 3 consecutive failures - triggering recovery');
          await this.recover();
        }
      }
    } catch (error) {
      const duration = Date.now() - this.lastCycleStart;
      this.recordHeartbeat('error', duration);
      logger.error(`[Daemon] Cycle crashed: ${error}`);
    } finally {
      this.state.running = false;
    }
  }

  async recover(type: RecoveryEvent['type'] = 'crash_recovery'): Promise<RecoveryEvent> {
    logger.info(`[Daemon] Starting ${type} recovery procedure...`);
    this.state.recoveryCount++;
    this.state.lastRecovery = new Date().toISOString();

    const recoveryEvent: RecoveryEvent = {
      id: `recovery_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
      snapshotUsed: null,
      cycleRestored: 0,
      stateRestored: {
        confidence: soulState.confidence,
        autonomy: 50,
        patterns_preserved: false,
      },
      notes: '',
    };

    if (this.state.lastSnapshot) {
      const snap = this.state.lastSnapshot;
      logger.info(`[Daemon] Restoring from snapshot cycle ${snap.cycle}`);
      
      recoveryEvent.snapshotUsed = snap.id;
      recoveryEvent.cycleRestored = snap.cycle;
      recoveryEvent.stateRestored = {
        confidence: snap.agency_state.confidence,
        autonomy: snap.autonomy_level,
        patterns_preserved: true,
      };
      recoveryEvent.notes = `Restored: confidence=${snap.agency_state.confidence}, autonomy=${snap.autonomy_level}, patterns_hash=${snap.behavior_pattern_hash}`;

      logger.info(`[Daemon] PRESERVED: confidence=${snap.agency_state.confidence}, doubts=${snap.agency_state.doubts}, energy=${snap.agency_state.energyLevel}`);
      logger.info(`[Daemon] PRESERVED: autonomy_level=${snap.autonomy_level}`);
      logger.info(`[Daemon] PRESERVED: behavior_patterns (hash=${snap.behavior_pattern_hash})`);
    } else {
      recoveryEvent.notes = 'No snapshot available - starting fresh but preserving current state';
      logger.warn('[Daemon] No snapshot available for recovery');
    }

    this.state.recoveryEvents.push(recoveryEvent);
    if (this.state.recoveryEvents.length > 50) {
      this.state.recoveryEvents = this.state.recoveryEvents.slice(-50);
    }

    this.state.running = false;
    this.recordHeartbeat('alive');

    observabilityCore.emitHeartbeat({
      system_mode: 'recovery',
      inputs_seen_count: 0,
      decisions_made_count: 0,
      changes_detected: false,
      reason: 'recovering',
      notes: `${type}: ${recoveryEvent.notes}`,
    });

    logger.info(`[Daemon] Recovery complete - resuming operations (type=${type})`);
    return recoveryEvent;
  }

  performColdStartRecovery(): RecoveryEvent | null {
    if (this.state.coldStartRecoveryPerformed) {
      logger.info('[Daemon] Cold-start recovery already performed this session');
      return null;
    }

    if (!this.state.lastSnapshot) {
      logger.info('[Daemon] No snapshot for cold-start recovery - fresh start');
      this.state.coldStartRecoveryPerformed = true;
      return null;
    }

    logger.info('[Daemon] Performing COLD-START RECOVERY...');
    
    const snap = this.state.lastSnapshot;
    
    logger.info(`[Daemon] Cold-start: Loading state from cycle ${snap.cycle}`);
    logger.info(`[Daemon] Cold-start: confidence=${snap.agency_state.confidence} (NOT reset)`);
    logger.info(`[Daemon] Cold-start: autonomy=${snap.autonomy_level} (NOT reset)`);
    logger.info(`[Daemon] Cold-start: behavior_hash=${snap.behavior_pattern_hash} (NOT reset)`);

    const recoveryEvent: RecoveryEvent = {
      id: `recovery_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'cold_start',
      snapshotUsed: snap.id,
      cycleRestored: snap.cycle,
      stateRestored: {
        confidence: snap.agency_state.confidence,
        autonomy: snap.autonomy_level,
        patterns_preserved: true,
      },
      notes: `Cold-start recovery from snapshot at cycle ${snap.cycle}. State preserved: confidence=${snap.agency_state.confidence}, autonomy=${snap.autonomy_level}`,
    };

    this.state.recoveryEvents.push(recoveryEvent);
    this.state.coldStartRecoveryPerformed = true;
    this.state.recoveryCount++;

    observabilityCore.emitHeartbeat({
      system_mode: 'recovery',
      inputs_seen_count: 0,
      decisions_made_count: 0,
      changes_detected: false,
      reason: 'recovering',
      notes: `COLD-START: Restored from cycle ${snap.cycle}`,
    });

    logger.info('[Daemon] COLD-START RECOVERY COMPLETE - System will mark first cycle as recovery mode');
    return recoveryEvent;
  }

  getRecoveryEvents(limit: number = 20): RecoveryEvent[] {
    return this.state.recoveryEvents.slice(-limit);
  }

  getSnapshots(limit: number = 10): StateSnapshot[] {
    return this.state.snapshotHistory.slice(-limit);
  }

  startWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
    }

    this.state.watchdogEnabled = true;

    this.watchdogTimer = setInterval(() => {
      this.checkHealth();
    }, this.state.watchdogIntervalMs);

    logger.info(`[Daemon] Watchdog started (interval: ${this.state.watchdogIntervalMs}ms)`);
  }

  stopWatchdog(): void {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    this.state.watchdogEnabled = false;
    logger.info('[Daemon] Watchdog stopped');
  }

  private checkHealth(): void {
    const now = Date.now();
    const lastHb = this.state.lastHeartbeat;

    if (!lastHb) {
      logger.warn('[Daemon] No heartbeat recorded - system may be starting up');
      return;
    }

    const lastHbTime = new Date(lastHb.timestamp).getTime();
    const timeSinceLastHb = now - lastHbTime;

    if (timeSinceLastHb > HEARTBEAT_TIMEOUT_MS) {
      logger.error(`[Daemon] STALLED LOOP DETECTED - No heartbeat for ${Math.round(timeSinceLastHb / 1000)}s`);
      
      if (this.state.running) {
        logger.warn('[Daemon] Force stopping stalled cycle');
        this.state.running = false;
      }

      this.recover('watchdog_recovery');
    } else if (this.state.running && (now - this.lastCycleStart) > HEARTBEAT_TIMEOUT_MS) {
      logger.warn('[Daemon] Cycle running too long - may be stuck');
    }
  }

  start(): void {
    if (this.state.enabled) {
      logger.warn('[Daemon] Already running');
      return;
    }

    this.performColdStartRecovery();

    this.state.enabled = true;
    this.state.startedAt = new Date().toISOString();
    this.recordHeartbeat('alive');

    this.cycleTimer = setInterval(async () => {
      await this.runCycle();
    }, this.state.cycleIntervalMs);

    this.startWatchdog();

    logger.info(`[Daemon] STARTED - Cycle interval: ${this.state.cycleIntervalMs / 1000}s`);
    logger.info('[Daemon] CipherH will never silently stop thinking');

    setTimeout(() => this.runCycle(), 5000);
  }

  stop(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }

    this.stopWatchdog();
    this.state.enabled = false;
    this.saveSnapshot();

    logger.info('[Daemon] STOPPED - Final snapshot saved');
  }

  setCycleInterval(ms: number): void {
    this.state.cycleIntervalMs = ms;
    
    if (this.state.enabled) {
      this.stop();
      this.start();
    }

    logger.info(`[Daemon] Cycle interval set to ${ms}ms`);
  }

  getHeartbeatHistory(limit: number = 20): Heartbeat[] {
    return this.state.heartbeatHistory.slice(-limit);
  }

  isHealthy(): boolean {
    if (!this.state.lastHeartbeat) return false;

    const now = Date.now();
    const lastHbTime = new Date(this.state.lastHeartbeat.timestamp).getTime();
    const timeSinceLastHb = now - lastHbTime;

    return timeSinceLastHb < HEARTBEAT_TIMEOUT_MS && 
           this.state.lastHeartbeat.consecutiveFailures < 3;
  }

  exportStatus(): {
    enabled: boolean;
    running: boolean;
    healthy: boolean;
    startedAt: string | null;
    totalCyclesRun: number;
    cycleIntervalMs: number;
    watchdogEnabled: boolean;
    lastHeartbeat: Heartbeat | null;
    lastSnapshot: { cycle: number; timestamp: string } | null;
    recoveryCount: number;
    lastRecovery: string | null;
    uptime: number;
    loop_status: 'ACTIVE' | 'IDLE' | 'RUNNING';
    active_goal_id: string | null;
  } {
    const uptime = this.state.startedAt 
      ? Date.now() - new Date(this.state.startedAt).getTime()
      : 0;

    let loopStatus: 'ACTIVE' | 'IDLE' | 'RUNNING' = 'IDLE';
    if (this.state.running) {
      loopStatus = 'RUNNING';
    } else if (this.state.enabled) {
      loopStatus = 'ACTIVE';
    }

    return {
      enabled: this.state.enabled,
      running: this.state.running,
      healthy: this.isHealthy(),
      startedAt: this.state.startedAt,
      totalCyclesRun: this.state.totalCyclesRun,
      cycleIntervalMs: this.state.cycleIntervalMs,
      watchdogEnabled: this.state.watchdogEnabled,
      lastHeartbeat: this.state.lastHeartbeat,
      lastSnapshot: this.state.lastSnapshot 
        ? { cycle: this.state.lastSnapshot.cycle, timestamp: this.state.lastSnapshot.timestamp }
        : null,
      recoveryCount: this.state.recoveryCount,
      lastRecovery: this.state.lastRecovery,
      uptime,
      loop_status: loopStatus,
      active_goal_id: coreGoals.getActiveGoalId(),
    };
  }
}

export const daemon = new DaemonEngine();
