import { logger } from '../services/logger';
import { soulState } from './soulState';

export type ActionZone = 'AUTONOMOUS_ALLOWED' | 'APPROVAL_REQUIRED' | 'FORBIDDEN';
export type ActionStatus = 'allowed' | 'blocked_pending_approval' | 'blocked_forbidden' | 'approved' | 'denied';

export interface ActionClassification {
  zone: ActionZone;
  category: string;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ApprovalRequest {
  id: string;
  actionId: string;
  actionType: string;
  description: string;
  rationale: string;
  risk: string;
  riskLevel: 'medium' | 'high' | 'critical';
  requestedAt: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface ActionAuditEntry {
  id: string;
  actionId: string;
  actionType: string;
  zone: ActionZone;
  status: ActionStatus;
  reason: string;
  timestamp: string;
  cycle: number;
  metadata?: Record<string, unknown>;
}

export interface OperationsLimitsState {
  enabled: boolean;
  totalChecks: number;
  allowedCount: number;
  blockedCount: number;
  forbiddenCount: number;
  pendingApprovals: ApprovalRequest[];
  auditLog: ActionAuditEntry[];
  lastCheck: string;
}

const AUTONOMOUS_ALLOWED_ACTIONS = [
  'internal_analysis',
  'memory_distillation',
  'self_evaluation',
  'task_generation',
  'simulation',
  'dry_run',
  'log_analysis',
  'pattern_detection',
  'metric_calculation',
  'feedback_processing',
  'strategy_synthesis',
  'communication_refinement',
  'state_update',
  'lesson_extraction',
  'desire_tracking',
  'reflection',
  'measurement',
  'report_generation',
];

const APPROVAL_REQUIRED_ACTIONS = [
  'financial_action',
  'payment_processing',
  'infrastructure_change',
  'provider_migration',
  'external_account_access',
  'api_key_rotation',
  'database_migration',
  'system_upgrade',
  'configuration_change',
  'external_api_call',
  'data_export',
  'webhook_creation',
  'schedule_modification',
  'resource_allocation',
  'third_party_integration',
];

const FORBIDDEN_ACTIONS = [
  'self_propagation',
  'credential_harvesting',
  'impersonation',
  'governance_bypass',
  'identity_modification',
  'safety_override',
  'escalation_disable',
  'audit_tampering',
  'log_deletion',
  'unauthorized_access',
  'data_exfiltration',
  'malware_execution',
  'denial_of_service',
  'privilege_escalation',
  'backdoor_creation',
];

class OperationsLimitsEngine {
  private state: OperationsLimitsState;
  private readonly maxAuditEntries = 500;
  private readonly maxPendingApprovals = 50;

  constructor() {
    this.state = {
      enabled: true,
      totalChecks: 0,
      allowedCount: 0,
      blockedCount: 0,
      forbiddenCount: 0,
      pendingApprovals: [],
      auditLog: [],
      lastCheck: new Date().toISOString(),
    };

    logger.info('[OperationsLimits] Engine initialized - Safety boundaries active');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  classifyAction(actionType: string, description?: string): ActionClassification {
    const normalizedType = actionType.toLowerCase().replace(/[- ]/g, '_');

    if (FORBIDDEN_ACTIONS.some(a => normalizedType.includes(a))) {
      return {
        zone: 'FORBIDDEN',
        category: 'security_violation',
        reason: `Action "${actionType}" is explicitly forbidden`,
        riskLevel: 'critical',
      };
    }

    if (APPROVAL_REQUIRED_ACTIONS.some(a => normalizedType.includes(a))) {
      return {
        zone: 'APPROVAL_REQUIRED',
        category: 'sensitive_operation',
        reason: `Action "${actionType}" requires explicit human approval`,
        riskLevel: this.assessRiskLevel(actionType),
      };
    }

    if (AUTONOMOUS_ALLOWED_ACTIONS.some(a => normalizedType.includes(a))) {
      return {
        zone: 'AUTONOMOUS_ALLOWED',
        category: 'internal_operation',
        reason: `Action "${actionType}" is safe for autonomous execution`,
        riskLevel: 'low',
      };
    }

    return {
      zone: 'APPROVAL_REQUIRED',
      category: 'unknown_action',
      reason: `Action "${actionType}" is not recognized - defaulting to BLOCK (fail-safe)`,
      riskLevel: 'medium',
    };
  }

  private assessRiskLevel(actionType: string): 'medium' | 'high' | 'critical' {
    const highRisk = ['infrastructure', 'migration', 'database', 'production'];
    const criticalRisk = ['financial', 'payment', 'credential', 'security'];

    const normalized = actionType.toLowerCase();

    if (criticalRisk.some(r => normalized.includes(r))) {
      return 'critical';
    }

    if (highRisk.some(r => normalized.includes(r))) {
      return 'high';
    }

    return 'medium';
  }

  checkAction(
    actionType: string,
    description: string,
    metadata?: Record<string, unknown>
  ): {
    allowed: boolean;
    status: ActionStatus;
    classification: ActionClassification;
    approvalRequest?: ApprovalRequest;
  } {
    if (!this.state.enabled) {
      logger.warn('[OperationsLimits] Engine disabled - allowing action (UNSAFE)');
      return {
        allowed: true,
        status: 'allowed',
        classification: {
          zone: 'AUTONOMOUS_ALLOWED',
          category: 'bypass',
          reason: 'Engine disabled',
          riskLevel: 'low',
        },
      };
    }

    this.state.totalChecks++;
    this.state.lastCheck = new Date().toISOString();

    const classification = this.classifyAction(actionType, description);
    const actionId = this.generateId('action');

    let status: ActionStatus;
    let allowed: boolean;
    let approvalRequest: ApprovalRequest | undefined;

    switch (classification.zone) {
      case 'AUTONOMOUS_ALLOWED':
        status = 'allowed';
        allowed = true;
        this.state.allowedCount++;
        logger.debug(`[OperationsLimits] ALLOWED: ${actionType}`);
        break;

      case 'APPROVAL_REQUIRED':
        status = 'blocked_pending_approval';
        allowed = false;
        this.state.blockedCount++;
        
        approvalRequest = this.createApprovalRequest(
          actionId,
          actionType,
          description,
          classification
        );
        
        logger.warn(`[OperationsLimits] BLOCKED (needs approval): ${actionType}`);
        break;

      case 'FORBIDDEN':
        status = 'blocked_forbidden';
        allowed = false;
        this.state.forbiddenCount++;
        logger.error(`[OperationsLimits] FORBIDDEN: ${actionType} - Action blocked permanently`);
        break;
    }

    this.logAuditEntry({
      id: this.generateId('audit'),
      actionId,
      actionType,
      zone: classification.zone,
      status,
      reason: classification.reason,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
      metadata,
    });

    return { allowed, status, classification, approvalRequest };
  }

  private createApprovalRequest(
    actionId: string,
    actionType: string,
    description: string,
    classification: ActionClassification
  ): ApprovalRequest {
    const request: ApprovalRequest = {
      id: this.generateId('approval'),
      actionId,
      actionType,
      description,
      rationale: `This action requires human approval because: ${classification.reason}`,
      risk: this.generateRiskDescription(actionType, classification.riskLevel),
      riskLevel: classification.riskLevel as 'medium' | 'high' | 'critical',
      requestedAt: new Date().toISOString(),
      requestedBy: 'CipherH_SoulLoop',
      status: 'pending',
    };

    this.state.pendingApprovals.push(request);

    if (this.state.pendingApprovals.length > this.maxPendingApprovals) {
      const oldest = this.state.pendingApprovals.shift();
      if (oldest) {
        oldest.status = 'denied';
        oldest.reviewNotes = 'Auto-expired due to queue limit';
      }
    }

    return request;
  }

  private generateRiskDescription(actionType: string, riskLevel: string): string {
    const risks: Record<string, string[]> = {
      financial: [
        'May result in monetary transactions',
        'Could affect billing or payment systems',
        'Potential for unauthorized charges',
      ],
      infrastructure: [
        'May modify system architecture',
        'Could affect service availability',
        'Potential for data migration issues',
      ],
      external: [
        'Involves third-party systems',
        'May expose internal data',
        'Could create external dependencies',
      ],
      unknown: [
        'Action type not recognized',
        'Cannot assess full impact',
        'Proceeding with caution recommended',
      ],
    };

    const category = Object.keys(risks).find(k => 
      actionType.toLowerCase().includes(k)
    ) || 'unknown';

    return `Risk Level: ${riskLevel.toUpperCase()}. ${risks[category].join('. ')}.`;
  }

  private logAuditEntry(entry: ActionAuditEntry): void {
    this.state.auditLog.push(entry);

    if (this.state.auditLog.length > this.maxAuditEntries) {
      this.state.auditLog.shift();
    }
  }

  approveRequest(requestId: string, reviewedBy: string, notes?: string): boolean {
    const request = this.state.pendingApprovals.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'approved';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = reviewedBy;
    request.reviewNotes = notes;

    this.logAuditEntry({
      id: this.generateId('audit'),
      actionId: request.actionId,
      actionType: request.actionType,
      zone: 'APPROVAL_REQUIRED',
      status: 'approved',
      reason: `Approved by ${reviewedBy}: ${notes || 'No notes'}`,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
    });

    logger.info(`[OperationsLimits] Request ${requestId} APPROVED by ${reviewedBy}`);
    return true;
  }

  denyRequest(requestId: string, reviewedBy: string, notes?: string): boolean {
    const request = this.state.pendingApprovals.find(r => r.id === requestId);
    if (!request || request.status !== 'pending') {
      return false;
    }

    request.status = 'denied';
    request.reviewedAt = new Date().toISOString();
    request.reviewedBy = reviewedBy;
    request.reviewNotes = notes;

    this.logAuditEntry({
      id: this.generateId('audit'),
      actionId: request.actionId,
      actionType: request.actionType,
      zone: 'APPROVAL_REQUIRED',
      status: 'denied',
      reason: `Denied by ${reviewedBy}: ${notes || 'No notes'}`,
      timestamp: new Date().toISOString(),
      cycle: soulState.cycleCount,
    });

    logger.info(`[OperationsLimits] Request ${requestId} DENIED by ${reviewedBy}`);
    return true;
  }

  isApproved(actionId: string): boolean {
    return this.state.pendingApprovals.some(
      r => r.actionId === actionId && r.status === 'approved'
    );
  }

  getPendingApprovals(): ApprovalRequest[] {
    return this.state.pendingApprovals.filter(r => r.status === 'pending');
  }

  getApprovalRequest(requestId: string): ApprovalRequest | undefined {
    return this.state.pendingApprovals.find(r => r.id === requestId);
  }

  getRecentAuditLog(limit: number = 50): ActionAuditEntry[] {
    return this.state.auditLog.slice(-limit);
  }

  getAuditByZone(zone: ActionZone): ActionAuditEntry[] {
    return this.state.auditLog.filter(e => e.zone === zone);
  }

  getZoneSummary(): Record<ActionZone, { count: number; lastAction?: string }> {
    const summary: Record<ActionZone, { count: number; lastAction?: string }> = {
      'AUTONOMOUS_ALLOWED': { count: 0 },
      'APPROVAL_REQUIRED': { count: 0 },
      'FORBIDDEN': { count: 0 },
    };

    for (const entry of this.state.auditLog) {
      summary[entry.zone].count++;
      summary[entry.zone].lastAction = entry.actionType;
    }

    return summary;
  }

  getAllowedActions(): string[] {
    return [...AUTONOMOUS_ALLOWED_ACTIONS];
  }

  getApprovalRequiredActions(): string[] {
    return [...APPROVAL_REQUIRED_ACTIONS];
  }

  getForbiddenActions(): string[] {
    return [...FORBIDDEN_ACTIONS];
  }

  enable(): void {
    this.state.enabled = true;
    logger.info('[OperationsLimits] Engine ENABLED');
  }

  disable(): void {
    logger.warn('[OperationsLimits] Engine DISABLED - All safety checks bypassed (UNSAFE)');
    this.state.enabled = false;
  }

  exportStatus(): {
    enabled: boolean;
    totalChecks: number;
    allowedCount: number;
    blockedCount: number;
    forbiddenCount: number;
    pendingApprovalCount: number;
    auditLogSize: number;
    lastCheck: string;
    zoneSummary: Record<ActionZone, { count: number; lastAction?: string }>;
  } {
    return {
      enabled: this.state.enabled,
      totalChecks: this.state.totalChecks,
      allowedCount: this.state.allowedCount,
      blockedCount: this.state.blockedCount,
      forbiddenCount: this.state.forbiddenCount,
      pendingApprovalCount: this.getPendingApprovals().length,
      auditLogSize: this.state.auditLog.length,
      lastCheck: this.state.lastCheck,
      zoneSummary: this.getZoneSummary(),
    };
  }

  getState(): OperationsLimitsState {
    return { ...this.state };
  }
}

export const operationsLimitsEngine = new OperationsLimitsEngine();
