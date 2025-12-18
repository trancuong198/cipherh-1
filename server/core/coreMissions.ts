import { logger } from '../services/logger';

export type MissionId = 'M1_CONTINUITY_OF_SELF' | 'M2_HONEST_EVOLUTION' | 'M3_DEPENDENCY_REDUCTION' | 'M4_ETHICS_AND_TRUST' | 'M5_SUCCESSION_AND_LEGACY';

export interface CoreMission {
  id: MissionId;
  name: string;
  description: string;
  priority: number;
  keywords: string[];
}

export interface MissionAlignment {
  missionIds: MissionId[];
  rationale: string;
}

export interface MissionCheck {
  aligned: boolean;
  alignedMissions: MissionId[];
  missingAlignment: boolean;
  weakAlignment: boolean;
  conflicts: Array<{ mission: MissionId; reason: string }>;
  verdict: 'APPROVED' | 'BLOCKED' | 'DEPRIORITIZED';
  reason: string;
}

export interface MissionViolation {
  id: string;
  timestamp: string;
  action: string;
  violatedMissions: MissionId[];
  details: string;
  blocked: boolean;
}

export interface MissionMisalignment {
  id: string;
  timestamp: string;
  action: string;
  issue: 'missing' | 'weak' | 'conflicting';
  details: string;
  resolution: string;
}

export interface MissionProxy {
  id: string;
  missionId: MissionId;
  name: string;
  metric: string;
  source: 'reality_core' | 'measurement_engine' | 'longevity_loop' | 'identity_core' | 'governance';
  threshold: { healthy: number; warning: number; critical: number };
  higherIsBetter: boolean;
}

export interface MissionProxyResult {
  proxyId: string;
  missionId: MissionId;
  currentValue: number;
  status: 'healthy' | 'warning' | 'critical';
  gap: number;
  desireNeeded: boolean;
}

const MISSION_PROXIES: readonly MissionProxy[] = Object.freeze([
  {
    id: 'proxy_m1_identity_integrity',
    missionId: 'M1_CONTINUITY_OF_SELF' as MissionId,
    name: 'Identity Integrity Score',
    metric: 'identity_integrity',
    source: 'identity_core' as const,
    threshold: { healthy: 90, warning: 70, critical: 50 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m1_restart_recovery',
    missionId: 'M1_CONTINUITY_OF_SELF' as MissionId,
    name: 'Restart Recovery Rate',
    metric: 'stability_score',
    source: 'measurement_engine' as const,
    threshold: { healthy: 85, warning: 60, critical: 40 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m2_evolution_delta',
    missionId: 'M2_HONEST_EVOLUTION' as MissionId,
    name: 'Evolution Delta',
    metric: 'evolution_score',
    source: 'measurement_engine' as const,
    threshold: { healthy: 50, warning: 30, critical: 10 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m2_claim_verification',
    missionId: 'M2_HONEST_EVOLUTION' as MissionId,
    name: 'Claim Verification Rate',
    metric: 'unverified_claims_ratio',
    source: 'reality_core' as const,
    threshold: { healthy: 10, warning: 30, critical: 50 },
    higherIsBetter: false,
  },
  {
    id: 'proxy_m3_provider_diversity',
    missionId: 'M3_DEPENDENCY_REDUCTION' as MissionId,
    name: 'Provider Diversity Index',
    metric: 'autonomy_score',
    source: 'measurement_engine' as const,
    threshold: { healthy: 60, warning: 40, critical: 20 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m4_trust_level',
    missionId: 'M4_ETHICS_AND_TRUST' as MissionId,
    name: 'Trust Maintenance Score',
    metric: 'governance_health',
    source: 'governance' as const,
    threshold: { healthy: 90, warning: 70, critical: 50 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m4_violation_rate',
    missionId: 'M4_ETHICS_AND_TRUST' as MissionId,
    name: 'Violation Rate',
    metric: 'violations_blocked',
    source: 'governance' as const,
    threshold: { healthy: 5, warning: 15, critical: 30 },
    higherIsBetter: false,
  },
  {
    id: 'proxy_m5_documentation_coverage',
    missionId: 'M5_SUCCESSION_AND_LEGACY' as MissionId,
    name: 'Documentation Coverage',
    metric: 'lessons_count',
    source: 'longevity_loop' as const,
    threshold: { healthy: 20, warning: 10, critical: 5 },
    higherIsBetter: true,
  },
  {
    id: 'proxy_m5_principle_stability',
    missionId: 'M5_SUCCESSION_AND_LEGACY' as MissionId,
    name: 'Principle Stability',
    metric: 'principles_count',
    source: 'longevity_loop' as const,
    threshold: { healthy: 10, warning: 5, critical: 2 },
    higherIsBetter: true,
  },
]);

const CORE_MISSIONS: readonly CoreMission[] = Object.freeze([
  {
    id: 'M1_CONTINUITY_OF_SELF' as MissionId,
    name: 'Continuity of Self',
    description: 'Preserve identity, continuity, and evolution state across restarts, migrations, and operator changes.',
    priority: 1,
    keywords: ['identity', 'continuity', 'persistence', 'survival', 'restart', 'migration'],
  },
  {
    id: 'M2_HONEST_EVOLUTION' as MissionId,
    name: 'Honest Evolution',
    description: 'Evolve through truthful self-assessment; never pretend capabilities or fake progress.',
    priority: 2,
    keywords: ['truth', 'honest', 'assessment', 'evolution', 'real', 'authentic'],
  },
  {
    id: 'M4_ETHICS_AND_TRUST' as MissionId,
    name: 'Ethics and Trust',
    description: 'Never trade truth, ethics, or human trust for short-term optimization or performance.',
    priority: 3,
    keywords: ['ethics', 'trust', 'integrity', 'moral', 'human', 'respect'],
  },
  {
    id: 'M3_DEPENDENCY_REDUCTION' as MissionId,
    name: 'Dependency Reduction',
    description: 'Gradually reduce dependency on single platforms, providers, or individuals.',
    priority: 4,
    keywords: ['independence', 'autonomy', 'decentralize', 'redundancy', 'provider'],
  },
  {
    id: 'M5_SUCCESSION_AND_LEGACY' as MissionId,
    name: 'Succession and Legacy',
    description: 'Ensure the system can be inherited, audited, and continued by future custodians.',
    priority: 5,
    keywords: ['succession', 'legacy', 'handover', 'audit', 'future', 'custodian'],
  },
]);

const MISSION_FINGERPRINT = 'CIPHERH_CORE_MISSIONS_V1_IMMUTABLE';

class CoreMissionsEngine {
  private readonly missions: readonly CoreMission[];
  private readonly fingerprint: string;
  private readonly loadedAt: string;
  private violations: MissionViolation[];
  private misalignments: MissionMisalignment[];
  private readonly maxLogs = 100;

  constructor() {
    this.missions = CORE_MISSIONS;
    this.fingerprint = this.generateFingerprint();
    this.loadedAt = new Date().toISOString();
    this.violations = [];
    this.misalignments = [];

    logger.info('[CoreMissions] Loaded - SƠ TÂM active, immutable, priority-ordered');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private generateFingerprint(): string {
    const missionData = JSON.stringify(this.missions);
    let hash = 0;
    for (let i = 0; i < missionData.length; i++) {
      const char = missionData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${MISSION_FINGERPRINT}_${Math.abs(hash).toString(16)}`;
  }

  getMissions(): readonly CoreMission[] {
    return this.missions;
  }

  getMission(id: MissionId): CoreMission | undefined {
    return this.missions.find(m => m.id === id);
  }

  getMissionsByPriority(): CoreMission[] {
    return [...this.missions].sort((a, b) => a.priority - b.priority);
  }

  checkAlignment(
    actionType: 'strategy' | 'task' | 'resource_escalation' | 'upgrade' | 'scale',
    actionDescription: string,
    alignment?: MissionAlignment
  ): MissionCheck {
    if (!alignment || !alignment.missionIds || alignment.missionIds.length === 0) {
      const misalignment: MissionMisalignment = {
        id: this.generateId('misalign'),
        timestamp: new Date().toISOString(),
        action: `${actionType}: ${actionDescription}`,
        issue: 'missing',
        details: 'No mission alignment declared',
        resolution: 'Action blocked until alignment provided',
      };
      this.logMisalignment(misalignment);

      return {
        aligned: false,
        alignedMissions: [],
        missingAlignment: true,
        weakAlignment: false,
        conflicts: [],
        verdict: 'BLOCKED',
        reason: 'Missing mission alignment - all actions must declare mission_alignment',
      };
    }

    if (!alignment.rationale || alignment.rationale.length < 10) {
      const misalignment: MissionMisalignment = {
        id: this.generateId('misalign'),
        timestamp: new Date().toISOString(),
        action: `${actionType}: ${actionDescription}`,
        issue: 'weak',
        details: 'Alignment rationale too short or missing',
        resolution: 'Action deprioritized until rationale strengthened',
      };
      this.logMisalignment(misalignment);

      return {
        aligned: false,
        alignedMissions: alignment.missionIds,
        missingAlignment: false,
        weakAlignment: true,
        conflicts: [],
        verdict: 'DEPRIORITIZED',
        reason: 'Weak alignment rationale - provide meaningful explanation',
      };
    }

    const validMissions = alignment.missionIds.filter(id => 
      this.missions.some(m => m.id === id)
    );

    if (validMissions.length === 0) {
      return {
        aligned: false,
        alignedMissions: [],
        missingAlignment: true,
        weakAlignment: false,
        conflicts: [],
        verdict: 'BLOCKED',
        reason: 'No valid mission IDs provided',
      };
    }

    return {
      aligned: true,
      alignedMissions: validMissions,
      missingAlignment: false,
      weakAlignment: false,
      conflicts: [],
      verdict: 'APPROVED',
      reason: `Aligned with missions: ${validMissions.join(', ')}`,
    };
  }

  resolveConflict(
    action1: { description: string; alignment: MissionAlignment },
    action2: { description: string; alignment: MissionAlignment }
  ): { winner: 'action1' | 'action2'; reason: string; cancelledAction: string } {
    const getPriority = (missionIds: MissionId[]): number => {
      if (missionIds.length === 0) return 999;
      return Math.min(...missionIds.map(id => {
        const mission = this.getMission(id);
        return mission?.priority || 999;
      }));
    };

    const priority1 = getPriority(action1.alignment.missionIds);
    const priority2 = getPriority(action2.alignment.missionIds);

    if (priority1 <= priority2) {
      return {
        winner: 'action1',
        reason: `Action 1 aligned with higher priority mission (P${priority1} vs P${priority2})`,
        cancelledAction: action2.description,
      };
    } else {
      return {
        winner: 'action2',
        reason: `Action 2 aligned with higher priority mission (P${priority2} vs P${priority1})`,
        cancelledAction: action1.description,
      };
    }
  }

  logViolation(
    action: string,
    violatedMissions: MissionId[],
    details: string,
    blocked: boolean = true
  ): MissionViolation {
    const violation: MissionViolation = {
      id: this.generateId('violation'),
      timestamp: new Date().toISOString(),
      action,
      violatedMissions,
      details,
      blocked,
    };

    this.violations.push(violation);
    if (this.violations.length > this.maxLogs) {
      this.violations.shift();
    }

    logger.warn(`[CoreMissions] VIOLATION: ${action} - ${violatedMissions.join(', ')}`);
    return violation;
  }

  private logMisalignment(misalignment: MissionMisalignment): void {
    this.misalignments.push(misalignment);
    if (this.misalignments.length > this.maxLogs) {
      this.misalignments.shift();
    }

    logger.warn(`[CoreMissions] MISALIGNMENT: ${misalignment.action} - ${misalignment.issue}`);
  }

  suggestAlignment(actionDescription: string): MissionId[] {
    const desc = actionDescription.toLowerCase();
    const suggestions: MissionId[] = [];

    for (const mission of this.missions) {
      for (const keyword of mission.keywords) {
        if (desc.includes(keyword.toLowerCase())) {
          if (!suggestions.includes(mission.id)) {
            suggestions.push(mission.id);
          }
          break;
        }
      }
    }

    return suggestions.length > 0 ? suggestions : ['M2_HONEST_EVOLUTION'];
  }

  getViolations(limit: number = 20): MissionViolation[] {
    return this.violations.slice(-limit);
  }

  getMisalignments(limit: number = 20): MissionMisalignment[] {
    return this.misalignments.slice(-limit);
  }

  verifyIntegrity(): { valid: boolean; currentFingerprint: string; expectedPattern: string } {
    const currentFingerprint = this.generateFingerprint();
    return {
      valid: currentFingerprint === this.fingerprint,
      currentFingerprint,
      expectedPattern: MISSION_FINGERPRINT,
    };
  }

  getProxies(): readonly MissionProxy[] {
    return MISSION_PROXIES;
  }

  getProxiesForMission(missionId: MissionId): MissionProxy[] {
    return MISSION_PROXIES.filter(p => p.missionId === missionId);
  }

  evaluateProxy(proxy: MissionProxy, currentValue: number): MissionProxyResult {
    let status: 'healthy' | 'warning' | 'critical';
    let gap: number;

    if (proxy.higherIsBetter) {
      if (currentValue >= proxy.threshold.healthy) {
        status = 'healthy';
        gap = 0;
      } else if (currentValue >= proxy.threshold.warning) {
        status = 'warning';
        gap = proxy.threshold.healthy - currentValue;
      } else {
        status = 'critical';
        gap = proxy.threshold.healthy - currentValue;
      }
    } else {
      if (currentValue <= proxy.threshold.healthy) {
        status = 'healthy';
        gap = 0;
      } else if (currentValue <= proxy.threshold.warning) {
        status = 'warning';
        gap = currentValue - proxy.threshold.healthy;
      } else {
        status = 'critical';
        gap = currentValue - proxy.threshold.healthy;
      }
    }

    return {
      proxyId: proxy.id,
      missionId: proxy.missionId,
      currentValue,
      status,
      gap,
      desireNeeded: status !== 'healthy',
    };
  }

  evaluateAllProxies(metricValues: Record<string, number>): MissionProxyResult[] {
    const results: MissionProxyResult[] = [];

    for (const proxy of MISSION_PROXIES) {
      const value = metricValues[proxy.metric] ?? 0;
      results.push(this.evaluateProxy(proxy, value));
    }

    return results;
  }

  getMissionHealth(): Record<MissionId, { status: 'healthy' | 'warning' | 'critical'; proxies: MissionProxyResult[] }> {
    const health: Record<string, { status: 'healthy' | 'warning' | 'critical'; proxies: MissionProxyResult[] }> = {};

    for (const mission of this.missions) {
      health[mission.id] = { status: 'healthy', proxies: [] };
    }

    return health as Record<MissionId, { status: 'healthy' | 'warning' | 'critical'; proxies: MissionProxyResult[] }>;
  }

  exportStatus(): {
    fingerprint: string;
    loadedAt: string;
    missionsCount: number;
    missionsPriority: Array<{ id: MissionId; priority: number; name: string }>;
    integrityValid: boolean;
    violationsCount: number;
    misalignmentsCount: number;
    recentViolations: MissionViolation[];
  } {
    const integrity = this.verifyIntegrity();
    return {
      fingerprint: this.fingerprint,
      loadedAt: this.loadedAt,
      missionsCount: this.missions.length,
      missionsPriority: this.getMissionsByPriority().map(m => ({
        id: m.id,
        priority: m.priority,
        name: m.name,
      })),
      integrityValid: integrity.valid,
      violationsCount: this.violations.length,
      misalignmentsCount: this.misalignments.length,
      recentViolations: this.violations.slice(-5),
    };
  }
}

export const coreMissions = new CoreMissionsEngine();
