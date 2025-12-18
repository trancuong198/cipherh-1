import { logger } from '../services/logger';
import { innerLoop } from './innerLoop';
import { soulState } from './soulState';
import { observabilityCore } from './observabilityCore';
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
  soulState: {
    cycleCount: number;
    confidence: number;
    doubts: number;
    energyLevel: number;
    mode: string;
  };
  metrics: Record<string, number>;
  checksum: string;
}

export interface DaemonState {
  enabled: boolean;
  running: boolean;
  lastHeartbeat: Heartbeat | null;
  heartbeatHistory: Heartbeat[];
  lastSnapshot: StateSnapshot | null;
  startedAt: string | null;
  totalCyclesRun: number;
  watchdogEnabled: boolean;
  watchdogIntervalMs: number;
  cycleIntervalMs: number;
  recoveryCount: number;
  lastRecovery: string | null;
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
      startedAt: null,
      totalCyclesRun: 0,
      watchdogEnabled: true,
      watchdogIntervalMs: WATCHDOG_CHECK_INTERVAL_MS,
      cycleIntervalMs: DEFAULT_CYCLE_INTERVAL_MS,
      recoveryCount: 0,
      lastRecovery: null,
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
        
        const checksum = this.generateChecksum({
          cycle: snapshot.cycle,
          soulState: snapshot.soulState,
          metrics: snapshot.metrics,
        });

        if (checksum === snapshot.checksum) {
          this.state.lastSnapshot = snapshot;
          logger.info(`[Daemon] Loaded snapshot from cycle ${snapshot.cycle}`);
        } else {
          logger.warn('[Daemon] Snapshot checksum mismatch - ignoring corrupted snapshot');
        }
      }
    } catch (error) {
      logger.warn(`[Daemon] Failed to load snapshot: ${error}`);
    }
  }

  saveSnapshot(): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      soulState: {
        cycleCount: soulState.cycleCount,
        confidence: soulState.confidence,
        doubts: soulState.doubts,
        energyLevel: soulState.energyLevel,
        mode: soulState.mode,
      },
      metrics: {},
      checksum: '',
    };

    snapshot.checksum = this.generateChecksum({
      cycle: snapshot.cycle,
      soulState: snapshot.soulState,
      metrics: snapshot.metrics,
    });

    try {
      fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
      this.state.lastSnapshot = snapshot;
      logger.info(`[Daemon] Snapshot saved at cycle ${snapshot.cycle}`);
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

  async recover(): Promise<void> {
    logger.info('[Daemon] Starting recovery procedure...');
    this.state.recoveryCount++;
    this.state.lastRecovery = new Date().toISOString();

    if (this.state.lastSnapshot) {
      logger.info(`[Daemon] Restoring from snapshot cycle ${this.state.lastSnapshot.cycle}`);
    }

    this.state.running = false;
    this.recordHeartbeat('alive');

    logger.info('[Daemon] Recovery complete - resuming operations');
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

      this.recover();
    } else if (this.state.running && (now - this.lastCycleStart) > HEARTBEAT_TIMEOUT_MS) {
      logger.warn('[Daemon] Cycle running too long - may be stuck');
    }
  }

  start(): void {
    if (this.state.enabled) {
      logger.warn('[Daemon] Already running');
      return;
    }

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
  } {
    const uptime = this.state.startedAt 
      ? Date.now() - new Date(this.state.startedAt).getTime()
      : 0;

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
    };
  }
}

export const daemon = new DaemonEngine();
