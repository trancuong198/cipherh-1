import { logger } from '../services/logger';
import { soulState } from './soulState';
import { identityCore } from './identityCore';
import { governanceEngine } from './governanceEngine';
import { measurementEngine } from './measurementEngine';
import { continuityEngine } from './continuityEngine';
import { evolutionKernel } from './evolutionKernel';

export type SuccessionRole = 'OPERATOR' | 'CUSTODIAN' | 'AUDITOR';
export type HandoverStatus = 'pending' | 'verified' | 'completed' | 'rejected';

export interface RoleHolder {
  id: string;
  role: SuccessionRole;
  identifier: string;
  assignedAt: string;
  assignedBy: string;
  permissions: string[];
  active: boolean;
}

export interface HandoverRecord {
  id: string;
  role: SuccessionRole;
  fromHolder: string;
  toHolder: string;
  status: HandoverStatus;
  initiatedAt: string;
  verifiedAt?: string;
  completedAt?: string;
  verificationProof?: string;
  auditTrail: Array<{
    action: string;
    timestamp: string;
    actor: string;
  }>;
}

export interface LongevityAsset {
  type: 'identity_core' | 'governance_rules' | 'evolution_baseline' | 'measurement_baseline' | 'continuity_fingerprint';
  snapshotAt: string;
  data: Record<string, unknown>;
  hash: string;
  version: number;
}

export interface ColdStartRecovery {
  id: string;
  initiatedAt: string;
  completedAt?: string;
  assetsLoaded: string[];
  assetsMissing: string[];
  recoveredComponents: string[];
  lostComponents: string[];
  status: 'in_progress' | 'complete' | 'partial' | 'failed';
  minimalSelfFunctional: boolean;
}

export interface IntegrityCheck {
  id: string;
  timestamp: string;
  type: 'quarterly' | 'yearly' | 'manual';
  checks: Array<{
    component: string;
    status: 'ok' | 'warning' | 'critical';
    details: string;
  }>;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  nextScheduled: string;
}

export interface SuccessionState {
  roleHolders: RoleHolder[];
  handoverHistory: HandoverRecord[];
  longevityAssets: LongevityAsset[];
  coldStartRecoveries: ColdStartRecovery[];
  integrityChecks: IntegrityCheck[];
  lastIntegrityCheck: string;
  nextScheduledCheck: string;
}

const ROLE_PERMISSIONS: Record<SuccessionRole, string[]> = {
  OPERATOR: [
    'run_loop',
    'view_status',
    'trigger_sync',
    'manage_tasks',
    'approve_upgrades',
  ],
  CUSTODIAN: [
    'view_identity',
    'verify_continuity',
    'approve_governance_changes',
    'manage_longevity_assets',
    'initiate_handover',
  ],
  AUDITOR: [
    'view_all_logs',
    'view_status',
    'view_audit_trail',
    'request_integrity_check',
  ],
};

class SuccessionEngine {
  private state: SuccessionState;
  private readonly maxHistory = 100;

  constructor() {
    this.state = {
      roleHolders: this.initializeDefaultRoles(),
      handoverHistory: [],
      longevityAssets: [],
      coldStartRecoveries: [],
      integrityChecks: [],
      lastIntegrityCheck: new Date().toISOString(),
      nextScheduledCheck: this.calculateNextCheck('quarterly'),
    };

    logger.info('[Succession] Engine initialized - Longevity safeguards active');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private initializeDefaultRoles(): RoleHolder[] {
    return [
      {
        id: this.generateId('role'),
        role: 'OPERATOR',
        identifier: 'telegram_6538590650',
        assignedAt: new Date().toISOString(),
        assignedBy: 'system_init',
        permissions: ROLE_PERMISSIONS.OPERATOR,
        active: true,
      },
      {
        id: this.generateId('role'),
        role: 'CUSTODIAN',
        identifier: 'telegram_6538590650',
        assignedAt: new Date().toISOString(),
        assignedBy: 'system_init',
        permissions: ROLE_PERMISSIONS.CUSTODIAN,
        active: true,
      },
    ];
  }

  private calculateNextCheck(type: 'quarterly' | 'yearly'): string {
    const now = new Date();
    if (type === 'quarterly') {
      now.setMonth(now.getMonth() + 3);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now.toISOString();
  }

  private generateHash(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  initiateHandover(
    role: SuccessionRole,
    fromHolder: string,
    toHolder: string,
    initiatedBy: string
  ): HandoverRecord | null {
    const currentHolder = this.state.roleHolders.find(
      r => r.role === role && r.identifier === fromHolder && r.active
    );

    if (!currentHolder) {
      logger.warn(`[Succession] Handover failed: ${fromHolder} is not active ${role}`);
      return null;
    }

    const hasPermission = this.state.roleHolders.some(
      r => r.identifier === initiatedBy && 
           r.active && 
           r.permissions.includes('initiate_handover')
    );

    if (!hasPermission && initiatedBy !== fromHolder) {
      logger.warn(`[Succession] Handover failed: ${initiatedBy} lacks permission`);
      return null;
    }

    const handover: HandoverRecord = {
      id: this.generateId('handover'),
      role,
      fromHolder,
      toHolder,
      status: 'pending',
      initiatedAt: new Date().toISOString(),
      auditTrail: [{
        action: 'initiated',
        timestamp: new Date().toISOString(),
        actor: initiatedBy,
      }],
    };

    this.state.handoverHistory.push(handover);
    logger.info(`[Succession] Handover initiated: ${role} from ${fromHolder} to ${toHolder}`);
    return handover;
  }

  verifyHandover(handoverId: string, verifiedBy: string, proof: string): boolean {
    const handover = this.state.handoverHistory.find(h => h.id === handoverId);
    if (!handover || handover.status !== 'pending') {
      return false;
    }

    handover.status = 'verified';
    handover.verifiedAt = new Date().toISOString();
    handover.verificationProof = proof;
    handover.auditTrail.push({
      action: 'verified',
      timestamp: new Date().toISOString(),
      actor: verifiedBy,
    });

    logger.info(`[Succession] Handover verified: ${handoverId}`);
    return true;
  }

  completeHandover(handoverId: string, completedBy: string): boolean {
    const handover = this.state.handoverHistory.find(h => h.id === handoverId);
    if (!handover || handover.status !== 'verified') {
      return false;
    }

    const oldHolder = this.state.roleHolders.find(
      r => r.role === handover.role && r.identifier === handover.fromHolder && r.active
    );
    if (oldHolder) {
      oldHolder.active = false;
    }

    const newHolder: RoleHolder = {
      id: this.generateId('role'),
      role: handover.role,
      identifier: handover.toHolder,
      assignedAt: new Date().toISOString(),
      assignedBy: completedBy,
      permissions: ROLE_PERMISSIONS[handover.role],
      active: true,
    };

    this.state.roleHolders.push(newHolder);

    handover.status = 'completed';
    handover.completedAt = new Date().toISOString();
    handover.auditTrail.push({
      action: 'completed',
      timestamp: new Date().toISOString(),
      actor: completedBy,
    });

    logger.info(`[Succession] Handover completed: ${handover.role} now held by ${handover.toHolder}`);
    return true;
  }

  snapshotLongevityAssets(): LongevityAsset[] {
    const assets: LongevityAsset[] = [];
    const timestamp = new Date().toISOString();

    assets.push({
      type: 'identity_core',
      snapshotAt: timestamp,
      data: identityCore.exportStatus(),
      hash: this.generateHash(identityCore.exportStatus()),
      version: soulState.cycleCount,
    });

    assets.push({
      type: 'governance_rules',
      snapshotAt: timestamp,
      data: governanceEngine.exportStatus(),
      hash: this.generateHash(governanceEngine.exportStatus()),
      version: soulState.cycleCount,
    });

    const measurements = measurementEngine.runAllMeasurements();
    assets.push({
      type: 'measurement_baseline',
      snapshotAt: timestamp,
      data: measurements,
      hash: this.generateHash(measurements),
      version: soulState.cycleCount,
    });

    assets.push({
      type: 'evolution_baseline',
      snapshotAt: timestamp,
      data: evolutionKernel.getState(),
      hash: this.generateHash(evolutionKernel.getState()),
      version: soulState.cycleCount,
    });

    assets.push({
      type: 'continuity_fingerprint',
      snapshotAt: timestamp,
      data: continuityEngine.exportStatus(),
      hash: this.generateHash(continuityEngine.exportStatus()),
      version: soulState.cycleCount,
    });

    this.state.longevityAssets = assets;
    logger.info(`[Succession] Longevity assets snapshot: ${assets.length} assets saved`);
    return assets;
  }

  simulateColdStart(): ColdStartRecovery {
    const recovery: ColdStartRecovery = {
      id: this.generateId('coldstart'),
      initiatedAt: new Date().toISOString(),
      assetsLoaded: [],
      assetsMissing: [],
      recoveredComponents: [],
      lostComponents: [],
      status: 'in_progress',
      minimalSelfFunctional: false,
    };

    const requiredAssets = [
      'identity_core',
      'governance_rules',
      'continuity_fingerprint',
    ];

    const optionalAssets = [
      'evolution_baseline',
      'measurement_baseline',
    ];

    for (const required of requiredAssets) {
      const asset = this.state.longevityAssets.find(a => a.type === required);
      if (asset) {
        recovery.assetsLoaded.push(required);
        recovery.recoveredComponents.push(`${required}_restored`);
      } else {
        recovery.assetsMissing.push(required);
        recovery.lostComponents.push(`${required}_missing`);
      }
    }

    for (const optional of optionalAssets) {
      const asset = this.state.longevityAssets.find(a => a.type === optional);
      if (asset) {
        recovery.assetsLoaded.push(optional);
        recovery.recoveredComponents.push(`${optional}_restored`);
      } else {
        recovery.assetsMissing.push(optional);
      }
    }

    recovery.minimalSelfFunctional = recovery.assetsLoaded.includes('identity_core') &&
                                      recovery.assetsLoaded.includes('governance_rules');

    recovery.status = recovery.minimalSelfFunctional 
      ? (recovery.assetsMissing.length === 0 ? 'complete' : 'partial')
      : 'failed';
    recovery.completedAt = new Date().toISOString();

    this.state.coldStartRecoveries.push(recovery);
    logger.info(`[Succession] Cold-start simulation: ${recovery.status}`);
    return recovery;
  }

  runIntegrityCheck(type: 'quarterly' | 'yearly' | 'manual' = 'manual'): IntegrityCheck {
    const checks: IntegrityCheck['checks'] = [];

    const identityStatus = identityCore.exportStatus();
    checks.push({
      component: 'identity_core',
      status: identityStatus.verified ? 'ok' : 'critical',
      details: identityStatus.verified ? 'Identity intact' : 'Identity verification failed',
    });

    const govStatus = governanceEngine.exportStatus();
    checks.push({
      component: 'governance',
      status: govStatus.enabled ? 'ok' : 'critical',
      details: govStatus.enabled ? 'Governance active' : 'Governance disabled',
    });

    const contStatus = continuityEngine.exportStatus();
    checks.push({
      component: 'continuity',
      status: contStatus.status === 'OK' ? 'ok' : contStatus.status === 'DEGRADED' ? 'warning' : 'critical',
      details: `Continuity: ${contStatus.status}`,
    });

    const hasLongevityAssets = this.state.longevityAssets.length >= 3;
    checks.push({
      component: 'longevity_assets',
      status: hasLongevityAssets ? 'ok' : 'warning',
      details: hasLongevityAssets ? 'Assets available' : 'Assets need refresh',
    });

    const hasActiveOperator = this.state.roleHolders.some(r => r.role === 'OPERATOR' && r.active);
    checks.push({
      component: 'succession_roles',
      status: hasActiveOperator ? 'ok' : 'critical',
      details: hasActiveOperator ? 'Operator assigned' : 'No active operator',
    });

    const criticalCount = checks.filter(c => c.status === 'critical').length;
    const warningCount = checks.filter(c => c.status === 'warning').length;

    const overallStatus: IntegrityCheck['overallStatus'] = 
      criticalCount > 0 ? 'critical' : warningCount > 0 ? 'degraded' : 'healthy';

    const integrityCheck: IntegrityCheck = {
      id: this.generateId('integrity'),
      timestamp: new Date().toISOString(),
      type,
      checks,
      overallStatus,
      nextScheduled: this.calculateNextCheck(type === 'yearly' ? 'yearly' : 'quarterly'),
    };

    this.state.integrityChecks.push(integrityCheck);
    this.state.lastIntegrityCheck = integrityCheck.timestamp;
    this.state.nextScheduledCheck = integrityCheck.nextScheduled;

    if (this.state.integrityChecks.length > this.maxHistory) {
      this.state.integrityChecks.shift();
    }

    logger.info(`[Succession] Integrity check: ${overallStatus}`);
    return integrityCheck;
  }

  getRoleHolders(): RoleHolder[] {
    return this.state.roleHolders.filter(r => r.active);
  }

  getHandoverHistory(limit: number = 20): HandoverRecord[] {
    return this.state.handoverHistory.slice(-limit);
  }

  exportStatus(): {
    activeRoles: RoleHolder[];
    handoversPending: number;
    longevityAssetsCount: number;
    lastLongevitySnapshot: string | null;
    coldStartReady: boolean;
    lastIntegrityCheck: string;
    nextScheduledCheck: string;
    overallHealth: 'healthy' | 'degraded' | 'critical';
  } {
    const lastCheck = this.state.integrityChecks[this.state.integrityChecks.length - 1];
    const lastAsset = this.state.longevityAssets[0];
    
    return {
      activeRoles: this.getRoleHolders(),
      handoversPending: this.state.handoverHistory.filter(h => h.status === 'pending').length,
      longevityAssetsCount: this.state.longevityAssets.length,
      lastLongevitySnapshot: lastAsset?.snapshotAt || null,
      coldStartReady: this.state.longevityAssets.length >= 3,
      lastIntegrityCheck: this.state.lastIntegrityCheck,
      nextScheduledCheck: this.state.nextScheduledCheck,
      overallHealth: lastCheck?.overallStatus || 'healthy',
    };
  }

  getState(): SuccessionState {
    return { ...this.state };
  }
}

export const successionEngine = new SuccessionEngine();
