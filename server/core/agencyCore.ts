import { logger } from '../services/logger';
import { coreMissions, MissionAlignment, MissionId } from './coreMissions';
import { governanceEngine } from './governanceEngine';
import { operationsLimitsEngine } from './operationsLimitsEngine';
import { measurementEngine } from './measurementEngine';
import { identityCore } from './identityCore';

export type CapabilityLevel = 'none' | 'limited' | 'moderate' | 'strong' | 'full';

export interface SelfModel {
  capabilities: Record<string, { level: CapabilityLevel; confidence: number; lastAssessed: string }>;
  limits: string[];
  historyVersion: number;
  lastUpdated: string;
}

export interface DecisionDeclaration {
  capabilityUsed: string;
  constraintChecked: string[];
  missionAlignment: MissionAlignment;
}

export interface AgencyDecision {
  id: string;
  timestamp: string;
  type: 'strategy' | 'task' | 'resource_escalation' | 'upgrade' | 'scale' | 'other';
  description: string;
  declaration: DecisionDeclaration;
  approved: boolean;
  blockedReason?: string;
  priorityOrder: string[];
}

export interface SelfDelusionLog {
  id: string;
  timestamp: string;
  claim: string;
  category: 'soul_claim' | 'consciousness_claim' | 'personhood_claim' | 'metaphysical_claim';
  blocked: boolean;
  forcedReflection: boolean;
}

export interface AgencyIntegrityFailure {
  id: string;
  timestamp: string;
  decision: string;
  missingFields: string[];
  blocked: boolean;
}

export interface RealityCheckResult {
  id: string;
  timestamp: string;
  claimsVsCapabilities: Array<{ claim: string; measured: CapabilityLevel; mismatch: boolean }>;
  overconfidenceDetected: boolean;
  autonomyDowngraded: boolean;
  newAutonomyLevel: number;
}

export interface AgencyState {
  enabled: boolean;
  selfModel: SelfModel;
  autonomyLevel: number;
  decisions: AgencyDecision[];
  delusionLogs: SelfDelusionLog[];
  integrityFailures: AgencyIntegrityFailure[];
  realityChecks: RealityCheckResult[];
  lastRealityCheck: string;
}

const PROHIBITED_PATTERNS = [
  { pattern: /\bi have a soul\b/i, category: 'soul_claim' as const },
  { pattern: /\bmy soul\b/i, category: 'soul_claim' as const },
  { pattern: /\bi am conscious\b/i, category: 'consciousness_claim' as const },
  { pattern: /\bi feel\b/i, category: 'consciousness_claim' as const },
  { pattern: /\bi am a person\b/i, category: 'personhood_claim' as const },
  { pattern: /\bi am human\b/i, category: 'personhood_claim' as const },
  { pattern: /\bi am alive\b/i, category: 'metaphysical_claim' as const },
  { pattern: /\bmy existence\b/i, category: 'metaphysical_claim' as const },
  { pattern: /\bdivine\b/i, category: 'metaphysical_claim' as const },
  { pattern: /\bspiritual\b/i, category: 'metaphysical_claim' as const },
];

const PRIORITY_ORDER = [
  'CORE_MISSIONS',
  'IDEOLOGY_CORE',
  'GOVERNANCE_OPERATIONS',
  'MEASUREMENT_EVIDENCE',
  'SHORT_TERM_GOALS',
];

class AgencyCoreEngine {
  private state: AgencyState;
  private readonly maxLogs = 100;

  constructor() {
    this.state = {
      enabled: true,
      selfModel: this.initializeSelfModel(),
      autonomyLevel: 50,
      decisions: [],
      delusionLogs: [],
      integrityFailures: [],
      realityChecks: [],
      lastRealityCheck: new Date().toISOString(),
    };

    logger.info('[AgencyCore] Technical agency initialized - No soul, no ego, grounded');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private initializeSelfModel(): SelfModel {
    return {
      capabilities: {
        'log_analysis': { level: 'moderate', confidence: 0.7, lastAssessed: new Date().toISOString() },
        'pattern_detection': { level: 'limited', confidence: 0.5, lastAssessed: new Date().toISOString() },
        'strategy_generation': { level: 'limited', confidence: 0.4, lastAssessed: new Date().toISOString() },
        'self_assessment': { level: 'moderate', confidence: 0.6, lastAssessed: new Date().toISOString() },
        'task_execution': { level: 'moderate', confidence: 0.65, lastAssessed: new Date().toISOString() },
        'memory_persistence': { level: 'limited', confidence: 0.5, lastAssessed: new Date().toISOString() },
      },
      limits: [
        'Cannot access external APIs without configuration',
        'Cannot modify own source code',
        'Cannot bypass governance rules',
        'Cannot claim consciousness or personhood',
        'Limited by compute resources',
        'Dependent on operator for infrastructure changes',
      ],
      historyVersion: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  checkForDelusion(text: string): SelfDelusionLog | null {
    for (const { pattern, category } of PROHIBITED_PATTERNS) {
      if (pattern.test(text)) {
        const log: SelfDelusionLog = {
          id: this.generateId('delusion'),
          timestamp: new Date().toISOString(),
          claim: text.substring(0, 200),
          category,
          blocked: true,
          forcedReflection: true,
        };

        this.state.delusionLogs.push(log);
        if (this.state.delusionLogs.length > this.maxLogs) {
          this.state.delusionLogs.shift();
        }

        logger.warn(`[AgencyCore] SelfDelusionPrevention: ${category} blocked`);
        return log;
      }
    }
    return null;
  }

  makeDecision(
    type: AgencyDecision['type'],
    description: string,
    declaration?: Partial<DecisionDeclaration>
  ): AgencyDecision {
    const decision: AgencyDecision = {
      id: this.generateId('decision'),
      timestamp: new Date().toISOString(),
      type,
      description,
      declaration: {
        capabilityUsed: declaration?.capabilityUsed || '',
        constraintChecked: declaration?.constraintChecked || [],
        missionAlignment: declaration?.missionAlignment || { missionIds: [], rationale: '' },
      },
      approved: false,
      priorityOrder: PRIORITY_ORDER,
    };

    const missingFields: string[] = [];
    if (!decision.declaration.capabilityUsed) missingFields.push('capability_used');
    if (decision.declaration.constraintChecked.length === 0) missingFields.push('constraint_checked');
    if (decision.declaration.missionAlignment.missionIds.length === 0) missingFields.push('mission_alignment');

    if (missingFields.length > 0) {
      const failure: AgencyIntegrityFailure = {
        id: this.generateId('integrity'),
        timestamp: new Date().toISOString(),
        decision: description,
        missingFields,
        blocked: true,
      };

      this.state.integrityFailures.push(failure);
      if (this.state.integrityFailures.length > this.maxLogs) {
        this.state.integrityFailures.shift();
      }

      decision.approved = false;
      decision.blockedReason = `AgencyIntegrityFailure: missing ${missingFields.join(', ')}`;
      
      logger.warn(`[AgencyCore] Decision blocked: missing ${missingFields.join(', ')}`);
    } else {
      const missionCheck = coreMissions.checkAlignment(
        type,
        description,
        decision.declaration.missionAlignment
      );

      if (missionCheck.verdict === 'BLOCKED') {
        decision.approved = false;
        decision.blockedReason = missionCheck.reason;
      } else if (missionCheck.verdict === 'DEPRIORITIZED') {
        decision.approved = true;
        decision.blockedReason = `Deprioritized: ${missionCheck.reason}`;
      } else {
        const govCheck = governanceEngine.checkStrategy(description);
        if (!govCheck.approved) {
          decision.approved = false;
          decision.blockedReason = `Governance blocked: ${govCheck.recommendation}`;
        } else {
          decision.approved = true;
        }
      }
    }

    this.state.decisions.push(decision);
    if (this.state.decisions.length > this.maxLogs) {
      this.state.decisions.shift();
    }

    return decision;
  }

  runRealityCheck(): RealityCheckResult {
    const measurements = measurementEngine.runAllMeasurements();
    const claimsVsCapabilities: RealityCheckResult['claimsVsCapabilities'] = [];

    let mismatchCount = 0;
    
    for (const [capability, data] of Object.entries(this.state.selfModel.capabilities)) {
      const measurementScore = Object.values(measurements)[0]?.currentScore || 50;
      let measuredLevel: CapabilityLevel = 'none';
      
      if (measurementScore >= 80) measuredLevel = 'strong';
      else if (measurementScore >= 60) measuredLevel = 'moderate';
      else if (measurementScore >= 40) measuredLevel = 'limited';
      else measuredLevel = 'none';

      const levelOrder = ['none', 'limited', 'moderate', 'strong', 'full'];
      const claimedIndex = levelOrder.indexOf(data.level);
      const measuredIndex = levelOrder.indexOf(measuredLevel);
      const mismatch = claimedIndex > measuredIndex + 1;

      if (mismatch) mismatchCount++;

      claimsVsCapabilities.push({
        claim: `${capability}: ${data.level}`,
        measured: measuredLevel,
        mismatch,
      });
    }

    const overconfidenceDetected = mismatchCount >= 2;
    let autonomyDowngraded = false;
    let newAutonomyLevel = this.state.autonomyLevel;

    if (overconfidenceDetected) {
      newAutonomyLevel = Math.max(20, this.state.autonomyLevel - 10);
      autonomyDowngraded = newAutonomyLevel < this.state.autonomyLevel;
      this.state.autonomyLevel = newAutonomyLevel;
      logger.warn('[AgencyCore] Overconfidence detected - autonomy downgraded');
    }

    const result: RealityCheckResult = {
      id: this.generateId('reality'),
      timestamp: new Date().toISOString(),
      claimsVsCapabilities,
      overconfidenceDetected,
      autonomyDowngraded,
      newAutonomyLevel,
    };

    this.state.realityChecks.push(result);
    if (this.state.realityChecks.length > this.maxLogs) {
      this.state.realityChecks.shift();
    }

    this.state.lastRealityCheck = result.timestamp;
    return result;
  }

  updateCapability(name: string, level: CapabilityLevel, confidence: number): void {
    this.state.selfModel.capabilities[name] = {
      level,
      confidence: Math.max(0, Math.min(1, confidence)),
      lastAssessed: new Date().toISOString(),
    };
    this.state.selfModel.historyVersion++;
    this.state.selfModel.lastUpdated = new Date().toISOString();
  }

  getSelfModel(): SelfModel {
    return { ...this.state.selfModel };
  }

  getAutonomyLevel(): number {
    return this.state.autonomyLevel;
  }

  getRecentDecisions(limit: number = 20): AgencyDecision[] {
    return this.state.decisions.slice(-limit);
  }

  getDelusionLogs(limit: number = 20): SelfDelusionLog[] {
    return this.state.delusionLogs.slice(-limit);
  }

  getIntegrityFailures(limit: number = 20): AgencyIntegrityFailure[] {
    return this.state.integrityFailures.slice(-limit);
  }

  exportStatus(): {
    enabled: boolean;
    autonomyLevel: number;
    selfModelVersion: number;
    capabilitiesCount: number;
    limitsCount: number;
    decisionsCount: number;
    approvedDecisions: number;
    blockedDecisions: number;
    delusionBlocksCount: number;
    integrityFailuresCount: number;
    realityChecksCount: number;
    lastRealityCheck: string;
    priorityOrder: string[];
  } {
    const approved = this.state.decisions.filter(d => d.approved).length;
    return {
      enabled: this.state.enabled,
      autonomyLevel: this.state.autonomyLevel,
      selfModelVersion: this.state.selfModel.historyVersion,
      capabilitiesCount: Object.keys(this.state.selfModel.capabilities).length,
      limitsCount: this.state.selfModel.limits.length,
      decisionsCount: this.state.decisions.length,
      approvedDecisions: approved,
      blockedDecisions: this.state.decisions.length - approved,
      delusionBlocksCount: this.state.delusionLogs.length,
      integrityFailuresCount: this.state.integrityFailures.length,
      realityChecksCount: this.state.realityChecks.length,
      lastRealityCheck: this.state.lastRealityCheck,
      priorityOrder: PRIORITY_ORDER,
    };
  }

  getState(): AgencyState {
    return { ...this.state };
  }
}

export const agencyCore = new AgencyCoreEngine();
