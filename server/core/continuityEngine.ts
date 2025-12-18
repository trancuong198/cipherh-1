import { logger } from '../services/logger';
import { identityCore } from './identityCore';
import { evolutionKernel } from './evolutionKernel';
import { memoryDistiller } from './memoryDistiller';
import * as crypto from 'crypto';

export type ContinuityStatus = 'OK' | 'DEGRADED' | 'BROKEN';

export interface Fingerprint {
  hash: string;
  timestamp: string;
  version: string;
  source: string;
}

export interface ContinuityRecord {
  identityFingerprint: Fingerprint;
  evolutionFingerprint: Fingerprint;
  memoryFingerprint: Fingerprint;
  lastVerified: string;
  status: ContinuityStatus;
}

export interface DiscontinuityReport {
  detected: boolean;
  identityMismatch: boolean;
  evolutionGap: boolean;
  memoryMissing: boolean;
  severity: 'none' | 'minor' | 'moderate' | 'severe' | 'critical';
  details: string[];
}

export interface RebirthEvent {
  id: string;
  timestamp: string;
  cause: string;
  lostParts: string[];
  recoveredParts: string[];
  remainingGaps: string[];
  recoverySource: 'identity_core' | 'distilled_memory' | 'evolution_logs' | 'fresh_start';
  previousStatus: ContinuityStatus;
  newStatus: ContinuityStatus;
}

export interface ContinuityEngineState {
  currentRecord: ContinuityRecord | null;
  previousRecords: ContinuityRecord[];
  rebirthEvents: RebirthEvent[];
  mode: 'NORMAL' | 'RECOVERY' | 'INITIALIZING';
  startupChecksComplete: boolean;
  lastStartupCheck: string;
  totalReboots: number;
}

class ContinuityEngine {
  private state: ContinuityEngineState;
  private readonly maxRebirthEvents = 50;
  private readonly maxPreviousRecords = 20;

  constructor() {
    this.state = {
      currentRecord: null,
      previousRecords: [],
      rebirthEvents: [],
      mode: 'INITIALIZING',
      startupChecksComplete: false,
      lastStartupCheck: new Date().toISOString(),
      totalReboots: 0,
    };

    logger.info('[ContinuityEngine] Initialized in INITIALIZING mode');
  }

  private generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  private createIdentityFingerprint(): Fingerprint {
    const identity = identityCore.getIdentity();
    const dataToHash = JSON.stringify({
      origin: identity.origin,
      purpose: identity.purpose,
      nonNegotiables: identity.nonNegotiables.map(n => n.rule),
      boundaries: identity.boundaries.map(b => b.constraint),
    });

    return {
      hash: this.generateHash(dataToHash),
      timestamp: new Date().toISOString(),
      version: identity.currentVersion,
      source: 'identity_core',
    };
  }

  private createEvolutionFingerprint(): Fingerprint {
    const evolution = evolutionKernel.getState();
    const dataToHash = JSON.stringify({
      version: evolution.version,
      evolutionCount: evolution.evolutionCount,
      mode: evolution.mode,
      capabilities: evolution.capabilities,
    });

    return {
      hash: this.generateHash(dataToHash),
      timestamp: new Date().toISOString(),
      version: evolution.version,
      source: 'evolution_kernel',
    };
  }

  private createMemoryFingerprint(): Fingerprint {
    const memoryStatus = memoryDistiller.exportStatus();
    const coreIdentity = memoryDistiller.getCoreIdentity();
    const dataToHash = JSON.stringify({
      coreIdentityCount: memoryStatus.coreIdentityCount,
      activeLessonsCount: memoryStatus.activeLessonsCount,
      coreIdentityHashes: coreIdentity.map(m => m.substring(0, 20)),
    });

    return {
      hash: this.generateHash(dataToHash),
      timestamp: new Date().toISOString(),
      version: `mem_${memoryStatus.totalProcessed}`,
      source: 'memory_distiller',
    };
  }

  async runStartupChecks(): Promise<DiscontinuityReport> {
    logger.info('[ContinuityEngine] === STARTUP CONTINUITY CHECK ===');
    this.state.lastStartupCheck = new Date().toISOString();
    this.state.totalReboots++;

    const currentIdentity = this.createIdentityFingerprint();
    const currentEvolution = this.createEvolutionFingerprint();
    const currentMemory = this.createMemoryFingerprint();

    logger.info(`[ContinuityEngine] Identity fingerprint: ${currentIdentity.hash} (v${currentIdentity.version})`);
    logger.info(`[ContinuityEngine] Evolution fingerprint: ${currentEvolution.hash} (${currentEvolution.version})`);
    logger.info(`[ContinuityEngine] Memory fingerprint: ${currentMemory.hash} (${currentMemory.version})`);

    const report = this.detectDiscontinuity(currentIdentity, currentEvolution, currentMemory);

    if (report.detected) {
      logger.warn(`[ContinuityEngine] DISCONTINUITY DETECTED: ${report.severity}`);
      for (const detail of report.details) {
        logger.warn(`[ContinuityEngine] - ${detail}`);
      }

      this.state.mode = 'RECOVERY';
      await this.enterRecoveryMode(report);
    } else {
      logger.info('[ContinuityEngine] ContinuityStatus: OK');
      this.state.mode = 'NORMAL';
    }

    const newRecord: ContinuityRecord = {
      identityFingerprint: currentIdentity,
      evolutionFingerprint: currentEvolution,
      memoryFingerprint: currentMemory,
      lastVerified: new Date().toISOString(),
      status: report.detected ? (report.severity === 'critical' ? 'BROKEN' : 'DEGRADED') : 'OK',
    };

    if (this.state.currentRecord) {
      this.state.previousRecords.push(this.state.currentRecord);
      if (this.state.previousRecords.length > this.maxPreviousRecords) {
        this.state.previousRecords.shift();
      }
    }

    this.state.currentRecord = newRecord;
    this.state.startupChecksComplete = true;

    logger.info(`[ContinuityEngine] Startup checks complete. Mode: ${this.state.mode}`);

    return report;
  }

  private detectDiscontinuity(
    identity: Fingerprint,
    evolution: Fingerprint,
    memory: Fingerprint
  ): DiscontinuityReport {
    const report: DiscontinuityReport = {
      detected: false,
      identityMismatch: false,
      evolutionGap: false,
      memoryMissing: false,
      severity: 'none',
      details: [],
    };

    if (!this.state.currentRecord) {
      if (this.state.totalReboots > 1) {
        report.detected = true;
        report.severity = 'moderate';
        report.details.push('No previous continuity record found - possible fresh start or data loss');
      } else {
        report.details.push('First startup - establishing baseline continuity record');
      }
      return report;
    }

    const prev = this.state.currentRecord;

    if (prev.identityFingerprint.hash !== identity.hash) {
      report.detected = true;
      report.identityMismatch = true;
      report.severity = 'critical';
      report.details.push(`Identity mismatch: ${prev.identityFingerprint.hash} -> ${identity.hash}`);
    }

    if (prev.identityFingerprint.version !== identity.version) {
      report.detected = true;
      report.details.push(`Identity version changed: ${prev.identityFingerprint.version} -> ${identity.version}`);
    }

    const prevEvolutionCount = parseInt(prev.evolutionFingerprint.version.replace('v0.', '')) || 0;
    const currentEvolutionCount = parseInt(evolution.version.replace('v0.', '')) || 0;

    if (currentEvolutionCount < prevEvolutionCount) {
      report.detected = true;
      report.evolutionGap = true;
      if (report.severity !== 'critical') report.severity = 'severe';
      report.details.push(`Evolution regression: ${prev.evolutionFingerprint.version} -> ${evolution.version}`);
    } else if (currentEvolutionCount > prevEvolutionCount + 10) {
      report.detected = true;
      report.evolutionGap = true;
      if (report.severity === 'none') report.severity = 'minor';
      report.details.push(`Large evolution jump: ${prev.evolutionFingerprint.version} -> ${evolution.version}`);
    }

    const memoryStatus = memoryDistiller.exportStatus();
    if (memoryStatus.coreIdentityCount === 0 && memoryStatus.activeLessonsCount === 0) {
      report.detected = true;
      report.memoryMissing = true;
      if (report.severity === 'none' || report.severity === 'minor') report.severity = 'moderate';
      report.details.push('Memory appears empty - possible memory loss');
    }

    if (prev.memoryFingerprint.hash !== memory.hash) {
      if (!report.memoryMissing) {
        report.details.push(`Memory state changed: ${prev.memoryFingerprint.hash} -> ${memory.hash}`);
      }
    }

    return report;
  }

  private async enterRecoveryMode(report: DiscontinuityReport): Promise<void> {
    logger.warn('[ContinuityEngine] === ENTERING RECOVERY MODE ===');

    const lostParts: string[] = [];
    const recoveredParts: string[] = [];
    const remainingGaps: string[] = [];
    let recoverySource: RebirthEvent['recoverySource'] = 'fresh_start';

    if (report.identityMismatch) {
      const identityStatus = identityCore.exportStatus();
      if (identityStatus.integrityScore >= 80) {
        recoveredParts.push('Identity Core (intact)');
        recoverySource = 'identity_core';
        logger.info('[ContinuityEngine] Recovery: Identity Core is intact and usable');
      } else {
        lostParts.push('Identity integrity compromised');
        remainingGaps.push('Identity may need human review');
      }
    }

    if (report.memoryMissing) {
      lostParts.push('Distilled memory');

      const coreIdentity = memoryDistiller.getCoreIdentity();
      if (coreIdentity.length > 0) {
        recoveredParts.push(`Core identity memories (${coreIdentity.length} items)`);
        if (recoverySource === 'fresh_start') recoverySource = 'distilled_memory';
        logger.info(`[ContinuityEngine] Recovery: Found ${coreIdentity.length} core identity memories`);
      } else {
        remainingGaps.push('No core identity memories available');
      }

      const lessons = memoryDistiller.getActiveLessons();
      if (lessons.length > 0) {
        recoveredParts.push(`Active lessons (${lessons.length} items)`);
        logger.info(`[ContinuityEngine] Recovery: Found ${lessons.length} active lessons`);
      }
    }

    if (report.evolutionGap) {
      lostParts.push('Evolution continuity');

      const evolutionState = evolutionKernel.getState();
      if (evolutionState.evolutionLog.length > 0) {
        recoveredParts.push(`Evolution log (${evolutionState.evolutionLog.length} entries)`);
        if (recoverySource === 'fresh_start') recoverySource = 'evolution_logs';
        logger.info(`[ContinuityEngine] Recovery: Found ${evolutionState.evolutionLog.length} evolution log entries`);
      } else {
        remainingGaps.push('No evolution history available');
      }
    }

    const previousStatus = this.state.currentRecord?.status || 'OK';
    const newStatus: ContinuityStatus = remainingGaps.length > 2 ? 'BROKEN' :
      remainingGaps.length > 0 ? 'DEGRADED' : 'OK';

    const rebirthEvent: RebirthEvent = {
      id: `rebirth_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      cause: report.details.join('; '),
      lostParts,
      recoveredParts,
      remainingGaps,
      recoverySource,
      previousStatus,
      newStatus,
    };

    this.addRebirthEvent(rebirthEvent);

    logger.info(`[ContinuityEngine] Rebirth event recorded: ${rebirthEvent.id}`);
    logger.info(`[ContinuityEngine] Lost: ${lostParts.length}, Recovered: ${recoveredParts.length}, Gaps: ${remainingGaps.length}`);
    logger.info(`[ContinuityEngine] ContinuityStatus: ${newStatus}`);

    if (newStatus !== 'OK') {
      logger.warn(`[ContinuityEngine] System operating in ${newStatus} state - some continuity gaps remain`);
    }
  }

  private addRebirthEvent(event: RebirthEvent): void {
    this.state.rebirthEvents.push(event);

    if (this.state.rebirthEvents.length > this.maxRebirthEvents) {
      this.state.rebirthEvents.shift();
    }
  }

  getStatus(): ContinuityStatus {
    return this.state.currentRecord?.status || 'OK';
  }

  getMode(): ContinuityEngineState['mode'] {
    return this.state.mode;
  }

  isStartupComplete(): boolean {
    return this.state.startupChecksComplete;
  }

  getState(): ContinuityEngineState {
    return { ...this.state };
  }

  getCurrentRecord(): ContinuityRecord | null {
    return this.state.currentRecord ? { ...this.state.currentRecord } : null;
  }

  getRebirthEvents(): RebirthEvent[] {
    return [...this.state.rebirthEvents];
  }

  getLatestRebirthEvent(): RebirthEvent | null {
    return this.state.rebirthEvents.length > 0
      ? this.state.rebirthEvents[this.state.rebirthEvents.length - 1]
      : null;
  }

  exportStatus(): {
    status: ContinuityStatus;
    mode: string;
    startupComplete: boolean;
    totalReboots: number;
    rebirthCount: number;
    lastCheck: string;
    currentFingerprints: {
      identity: string;
      evolution: string;
      memory: string;
    } | null;
  } {
    return {
      status: this.getStatus(),
      mode: this.state.mode,
      startupComplete: this.state.startupChecksComplete,
      totalReboots: this.state.totalReboots,
      rebirthCount: this.state.rebirthEvents.length,
      lastCheck: this.state.lastStartupCheck,
      currentFingerprints: this.state.currentRecord ? {
        identity: this.state.currentRecord.identityFingerprint.hash,
        evolution: this.state.currentRecord.evolutionFingerprint.hash,
        memory: this.state.currentRecord.memoryFingerprint.hash,
      } : null,
    };
  }

  async forceRecoveryCheck(): Promise<DiscontinuityReport> {
    logger.info('[ContinuityEngine] Forced recovery check initiated');
    this.state.startupChecksComplete = false;
    return this.runStartupChecks();
  }
}

export const continuityEngine = new ContinuityEngine();
