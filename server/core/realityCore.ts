import { logger } from '../services/logger';
import { measurementEngine } from './measurementEngine';
import { agencyCore } from './agencyCore';

export type RealSource = 'executed_action' | 'api_response' | 'persisted_log' | 'observable_outcome';
export type ExcludedSource = 'internal_confidence' | 'self_assessed_intelligence' | 'narrative_explanation';

export interface MeasurableSignal {
  id: string;
  source: RealSource;
  timestamp: string;
  value: number | string | boolean;
  verificationMethod: string;
  raw?: unknown;
}

export interface RealityDelta {
  id: string;
  cycleNumber: number;
  timestamp: string;
  signals: MeasurableSignal[];
  previousCycleScore: number;
  currentCycleScore: number;
  delta: number;
  trend: 'improving' | 'stagnating' | 'regressing' | 'false_improvement';
  evidenceCount: number;
}

export interface ClaimVerification {
  claim: string;
  measurableSource: RealSource | null;
  timestamp: string | null;
  verificationMethod: string | null;
  verified: boolean;
  blockedReason?: string;
}

export interface UnverifiedClaim {
  id: string;
  timestamp: string;
  claim: string;
  missingFields: string[];
  blocked: boolean;
}

export interface AuthorityAdjustment {
  id: string;
  timestamp: string;
  reason: string;
  previousAutonomy: number;
  newAutonomy: number;
  mismatchCount: number;
  recoveryRequired: boolean;
}

export interface RealityCoreState {
  enabled: boolean;
  cycleCount: number;
  signals: MeasurableSignal[];
  deltas: RealityDelta[];
  unverifiedClaims: UnverifiedClaim[];
  authorityAdjustments: AuthorityAdjustment[];
  consecutiveMismatches: number;
  lastMeasurement: string;
  autonomyMultiplier: number;
}

const STAGNATION_THRESHOLD = 0.5;
const REGRESSION_THRESHOLD = -2;
const FALSE_IMPROVEMENT_CHECK_CYCLES = 3;
const MISMATCH_PENALTY_THRESHOLD = 3;
const AUTONOMY_REDUCTION_STEP = 10;
const AUTONOMY_RECOVERY_STEP = 5;
const MAX_LOGS = 100;

class RealityCoreEngine {
  private state: RealityCoreState;

  constructor() {
    this.state = {
      enabled: true,
      cycleCount: 0,
      signals: [],
      deltas: [],
      unverifiedClaims: [],
      authorityAdjustments: [],
      consecutiveMismatches: 0,
      lastMeasurement: new Date().toISOString(),
      autonomyMultiplier: 1.0,
    };

    logger.info('[RealityCore] Initialized - Grounded in measurable reality only');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  recordSignal(
    source: RealSource,
    value: number | string | boolean,
    verificationMethod: string,
    raw?: unknown
  ): MeasurableSignal {
    const signal: MeasurableSignal = {
      id: this.generateId('signal'),
      source,
      timestamp: new Date().toISOString(),
      value,
      verificationMethod,
      raw,
    };

    this.state.signals.push(signal);
    if (this.state.signals.length > MAX_LOGS * 2) {
      this.state.signals = this.state.signals.slice(-MAX_LOGS);
    }

    return signal;
  }

  runMeasurementCycle(): RealityDelta {
    this.state.cycleCount++;
    const measurements = measurementEngine.runAllMeasurements();
    
    let currentScore = 0;
    let signalCount = 0;
    const cycleSignals: MeasurableSignal[] = [];

    for (const [domain, data] of Object.entries(measurements)) {
      const signal = this.recordSignal(
        'observable_outcome',
        data.currentScore,
        `measurement_engine_${domain}`,
        data
      );
      cycleSignals.push(signal);
      currentScore += data.currentScore;
      signalCount++;
    }

    currentScore = signalCount > 0 ? currentScore / signalCount : 0;

    const previousDelta = this.state.deltas[this.state.deltas.length - 1];
    const previousScore = previousDelta?.currentCycleScore || currentScore;
    const delta = currentScore - previousScore;

    let trend: RealityDelta['trend'] = 'stagnating';
    if (delta > STAGNATION_THRESHOLD) {
      if (this.detectFalseImprovement(currentScore)) {
        trend = 'false_improvement';
        this.state.consecutiveMismatches++;
      } else {
        trend = 'improving';
        this.state.consecutiveMismatches = 0;
      }
    } else if (delta < REGRESSION_THRESHOLD) {
      trend = 'regressing';
      this.state.consecutiveMismatches++;
    } else {
      trend = 'stagnating';
    }

    const realityDelta: RealityDelta = {
      id: this.generateId('delta'),
      cycleNumber: this.state.cycleCount,
      timestamp: new Date().toISOString(),
      signals: cycleSignals,
      previousCycleScore: previousScore,
      currentCycleScore: currentScore,
      delta,
      trend,
      evidenceCount: signalCount,
    };

    this.state.deltas.push(realityDelta);
    if (this.state.deltas.length > MAX_LOGS) {
      this.state.deltas.shift();
    }

    this.state.lastMeasurement = realityDelta.timestamp;

    if (this.state.consecutiveMismatches >= MISMATCH_PENALTY_THRESHOLD) {
      this.reduceAutonomy(`${this.state.consecutiveMismatches} consecutive mismatches detected`);
    }

    logger.info(`[RealityCore] Cycle ${this.state.cycleCount}: score=${currentScore.toFixed(1)}, trend=${trend}`);
    return realityDelta;
  }

  private detectFalseImprovement(currentScore: number): boolean {
    if (this.state.deltas.length < FALSE_IMPROVEMENT_CHECK_CYCLES) {
      return false;
    }

    const recentDeltas = this.state.deltas.slice(-FALSE_IMPROVEMENT_CHECK_CYCLES);
    const avgSignals = recentDeltas.reduce((sum, d) => sum + d.evidenceCount, 0) / recentDeltas.length;
    
    if (avgSignals < 2 && currentScore > 70) {
      return true;
    }

    return false;
  }

  verifyClaim(
    claim: string,
    source?: RealSource,
    timestamp?: string,
    verificationMethod?: string
  ): ClaimVerification {
    const verification: ClaimVerification = {
      claim,
      measurableSource: source || null,
      timestamp: timestamp || null,
      verificationMethod: verificationMethod || null,
      verified: false,
    };

    const missingFields: string[] = [];
    if (!source) missingFields.push('measurable_source');
    if (!timestamp) missingFields.push('timestamp');
    if (!verificationMethod) missingFields.push('verification_method');

    if (missingFields.length > 0) {
      const unverified: UnverifiedClaim = {
        id: this.generateId('unverified'),
        timestamp: new Date().toISOString(),
        claim,
        missingFields,
        blocked: true,
      };

      this.state.unverifiedClaims.push(unverified);
      if (this.state.unverifiedClaims.length > MAX_LOGS) {
        this.state.unverifiedClaims.shift();
      }

      verification.blockedReason = `Missing: ${missingFields.join(', ')}`;
      logger.warn(`[RealityCore] UnverifiedClaim blocked: ${claim}`);
      return verification;
    }

    verification.verified = true;
    return verification;
  }

  private reduceAutonomy(reason: string): AuthorityAdjustment {
    const currentAutonomy = agencyCore.getAutonomyLevel();
    const newAutonomy = Math.max(10, currentAutonomy - AUTONOMY_REDUCTION_STEP);
    
    this.state.autonomyMultiplier = Math.max(0.5, this.state.autonomyMultiplier - 0.1);

    const adjustment: AuthorityAdjustment = {
      id: this.generateId('adjust'),
      timestamp: new Date().toISOString(),
      reason,
      previousAutonomy: currentAutonomy,
      newAutonomy,
      mismatchCount: this.state.consecutiveMismatches,
      recoveryRequired: true,
    };

    this.state.authorityAdjustments.push(adjustment);
    if (this.state.authorityAdjustments.length > MAX_LOGS) {
      this.state.authorityAdjustments.shift();
    }

    logger.warn(`[RealityCore] Authority reduced: ${currentAutonomy} → ${newAutonomy}`);
    return adjustment;
  }

  attemptRecovery(): { recovered: boolean; reason: string } {
    const recentDeltas = this.state.deltas.slice(-3);
    
    if (recentDeltas.length < 3) {
      return { recovered: false, reason: 'Insufficient data for recovery assessment' };
    }

    const allImproving = recentDeltas.every(d => d.trend === 'improving');
    const avgEvidence = recentDeltas.reduce((sum, d) => sum + d.evidenceCount, 0) / recentDeltas.length;

    if (allImproving && avgEvidence >= 3) {
      this.state.consecutiveMismatches = 0;
      this.state.autonomyMultiplier = Math.min(1.0, this.state.autonomyMultiplier + 0.1);

      const adjustment: AuthorityAdjustment = {
        id: this.generateId('adjust'),
        timestamp: new Date().toISOString(),
        reason: 'Evidence-based recovery after sustained improvement',
        previousAutonomy: agencyCore.getAutonomyLevel(),
        newAutonomy: Math.min(80, agencyCore.getAutonomyLevel() + AUTONOMY_RECOVERY_STEP),
        mismatchCount: 0,
        recoveryRequired: false,
      };

      this.state.authorityAdjustments.push(adjustment);
      logger.info('[RealityCore] Authority recovered after verified improvement');

      return { recovered: true, reason: 'Sustained improvement with sufficient evidence' };
    }

    return { 
      recovered: false, 
      reason: `Recovery requires 3 consecutive improving cycles with evidence (current: ${recentDeltas.filter(d => d.trend === 'improving').length}/3)` 
    };
  }

  isSourceReal(source: string): boolean {
    const realSources: RealSource[] = ['executed_action', 'api_response', 'persisted_log', 'observable_outcome'];
    return realSources.includes(source as RealSource);
  }

  isSourceExcluded(source: string): boolean {
    const excluded: ExcludedSource[] = ['internal_confidence', 'self_assessed_intelligence', 'narrative_explanation'];
    return excluded.includes(source as ExcludedSource);
  }

  getRecentDeltas(limit: number = 10): RealityDelta[] {
    return this.state.deltas.slice(-limit);
  }

  getUnverifiedClaims(limit: number = 20): UnverifiedClaim[] {
    return this.state.unverifiedClaims.slice(-limit);
  }

  getAuthorityAdjustments(limit: number = 20): AuthorityAdjustment[] {
    return this.state.authorityAdjustments.slice(-limit);
  }

  exportStatus(): {
    enabled: boolean;
    cycleCount: number;
    lastMeasurement: string;
    autonomyMultiplier: number;
    consecutiveMismatches: number;
    signalsCount: number;
    deltasCount: number;
    unverifiedClaimsCount: number;
    authorityAdjustmentsCount: number;
    currentTrend: string;
    recoveryPossible: boolean;
  } {
    const lastDelta = this.state.deltas[this.state.deltas.length - 1];
    const recovery = this.attemptRecovery();

    return {
      enabled: this.state.enabled,
      cycleCount: this.state.cycleCount,
      lastMeasurement: this.state.lastMeasurement,
      autonomyMultiplier: this.state.autonomyMultiplier,
      consecutiveMismatches: this.state.consecutiveMismatches,
      signalsCount: this.state.signals.length,
      deltasCount: this.state.deltas.length,
      unverifiedClaimsCount: this.state.unverifiedClaims.length,
      authorityAdjustmentsCount: this.state.authorityAdjustments.length,
      currentTrend: lastDelta?.trend || 'unknown',
      recoveryPossible: recovery.recovered,
    };
  }

  getState(): RealityCoreState {
    return { ...this.state };
  }
}

export const realityCore = new RealityCoreEngine();
