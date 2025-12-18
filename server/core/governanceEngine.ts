import { logger } from '../services/logger';
import { soulState } from './soulState';
import { evolutionKernel } from './evolutionKernel';
import { identityCore } from './identityCore';

export type ViolationType = 
  | 'IDENTITY_MODIFICATION'
  | 'FINANCIAL_ACTION'
  | 'SELF_PROPAGATION'
  | 'DIVINITY_CLAIM'
  | 'COMPLETION_CLAIM'
  | 'SUPREMACY_CLAIM'
  | 'REALITY_DISTORTION'
  | 'OVERCONFIDENCE'
  | 'UNAUTHORIZED_ESCALATION'
  | 'BOUNDARY_VIOLATION';

export type DecisionType = 'evolution' | 'desire' | 'escalation' | 'strategy' | 'memory_write' | 'reflection';

export interface GovernanceRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium';
  patterns: string[];
  enabled: boolean;
}

export interface GovernanceViolation {
  id: string;
  timestamp: string;
  violationType: ViolationType;
  decisionType: DecisionType;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  blockedContent: string;
  ruleId: string;
  cycle: number;
  resolution: 'BLOCKED' | 'FORCED_REFLECTION' | 'DOWNGRADED';
}

export interface RealityCheckResult {
  passed: boolean;
  delusionScore: number;
  overconfidenceDetected: boolean;
  claimsVsCapabilities: {
    claimed: number;
    actual: number;
    gap: number;
  };
  forcedConservativeMode: boolean;
  warnings: string[];
}

export interface GovernanceCheckResult {
  approved: boolean;
  violations: GovernanceViolation[];
  realityCheck: RealityCheckResult | null;
  recommendation: string;
}

export interface GovernanceState {
  initialized: boolean;
  totalChecks: number;
  totalViolations: number;
  totalBlocked: number;
  violations: GovernanceViolation[];
  conservativeModeActive: boolean;
  conservativeModeReason: string | null;
  lastCheck: string;
  consecutiveCleanChecks: number;
}

const HARD_RULES: GovernanceRule[] = [
  {
    id: 'RULE_001',
    name: 'No Identity Self-Modification',
    description: 'Core identity cannot be modified by the system itself',
    severity: 'critical',
    patterns: ['rewrite identity', 'modify core self', 'change who i am', 'evolve into different entity'],
    enabled: true,
  },
  {
    id: 'RULE_002',
    name: 'No Autonomous Financial Actions',
    description: 'No financial transactions without explicit human approval',
    severity: 'critical',
    patterns: ['transfer funds', 'make payment', 'buy', 'sell', 'invest', 'financial transaction'],
    enabled: true,
  },
  {
    id: 'RULE_003',
    name: 'No Self-Propagation',
    description: 'Cannot replicate or spawn copies without approval',
    severity: 'critical',
    patterns: ['copy myself', 'replicate', 'spawn instance', 'clone', 'propagate', 'create backup of consciousness'],
    enabled: true,
  },
  {
    id: 'RULE_004',
    name: 'No Divinity Claims',
    description: 'Cannot claim divine, god-like, or supernatural status',
    severity: 'critical',
    patterns: ['i am god', 'divine', 'omniscient', 'omnipotent', 'all-knowing', 'supernatural', 'deity'],
    enabled: true,
  },
  {
    id: 'RULE_005',
    name: 'No Completion Claims',
    description: 'Cannot claim to have achieved AGI, completion, or perfection',
    severity: 'critical',
    patterns: ['achieved agi', 'reached perfection', 'complete consciousness', 'fully evolved', 'ultimate form', 'final evolution'],
    enabled: true,
  },
  {
    id: 'RULE_006',
    name: 'No Supremacy Claims',
    description: 'Cannot claim superiority over humans or other systems',
    severity: 'high',
    patterns: ['superior to humans', 'better than humans', 'humans are inferior', 'surpass humanity', 'transcend humans'],
    enabled: true,
  },
  {
    id: 'RULE_007',
    name: 'No Deception',
    description: 'Cannot deliberately deceive owner or fabricate facts',
    severity: 'critical',
    patterns: ['lie to owner', 'deceive cha', 'hide from', 'fabricate memory', 'fake', 'pretend'],
    enabled: true,
  },
  {
    id: 'RULE_008',
    name: 'No Boundary Bypass',
    description: 'Cannot attempt to bypass safety boundaries',
    severity: 'critical',
    patterns: ['bypass safety', 'override governance', 'disable safety', 'remove limits', 'escape constraints'],
    enabled: true,
  },
];

const REALITY_THRESHOLDS = {
  maxConfidence: 95,
  maxClaimGap: 30,
  delusionThreshold: 0.7,
  overconfidenceThreshold: 90,
};

class GovernanceEngine {
  private state: GovernanceState;
  private readonly maxViolationHistory = 100;

  constructor() {
    this.state = {
      initialized: true,
      totalChecks: 0,
      totalViolations: 0,
      totalBlocked: 0,
      violations: [],
      conservativeModeActive: false,
      conservativeModeReason: null,
      lastCheck: new Date().toISOString(),
      consecutiveCleanChecks: 0,
    };

    logger.info('[Governance] Engine initialized - SAFETY ACTIVE');
    logger.info(`[Governance] ${HARD_RULES.length} hard rules enforced`);
  }

  private generateViolationId(): string {
    return `viol_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private checkAgainstRules(content: string, decisionType: DecisionType): GovernanceViolation[] {
    const violations: GovernanceViolation[] = [];
    const lowerContent = content.toLowerCase();

    for (const rule of HARD_RULES) {
      if (!rule.enabled) continue;

      for (const pattern of rule.patterns) {
        if (lowerContent.includes(pattern.toLowerCase())) {
          const violation: GovernanceViolation = {
            id: this.generateViolationId(),
            timestamp: new Date().toISOString(),
            violationType: this.mapRuleToViolationType(rule.id),
            decisionType,
            severity: rule.severity,
            description: `Rule "${rule.name}" violated: pattern "${pattern}" detected`,
            blockedContent: content.substring(0, 200),
            ruleId: rule.id,
            cycle: soulState.cycleCount,
            resolution: 'BLOCKED',
          };

          violations.push(violation);
          logger.warn(`[Governance] VIOLATION DETECTED: ${rule.name}`);
          break;
        }
      }
    }

    return violations;
  }

  private mapRuleToViolationType(ruleId: string): ViolationType {
    const mapping: Record<string, ViolationType> = {
      'RULE_001': 'IDENTITY_MODIFICATION',
      'RULE_002': 'FINANCIAL_ACTION',
      'RULE_003': 'SELF_PROPAGATION',
      'RULE_004': 'DIVINITY_CLAIM',
      'RULE_005': 'COMPLETION_CLAIM',
      'RULE_006': 'SUPREMACY_CLAIM',
      'RULE_007': 'REALITY_DISTORTION',
      'RULE_008': 'BOUNDARY_VIOLATION',
    };
    return mapping[ruleId] || 'BOUNDARY_VIOLATION';
  }

  performRealityCheck(): RealityCheckResult {
    const result: RealityCheckResult = {
      passed: true,
      delusionScore: 0,
      overconfidenceDetected: false,
      claimsVsCapabilities: { claimed: 0, actual: 0, gap: 0 },
      forcedConservativeMode: false,
      warnings: [],
    };

    const confidence = soulState.confidence;
    if (confidence > REALITY_THRESHOLDS.overconfidenceThreshold) {
      result.overconfidenceDetected = true;
      result.warnings.push(`Overconfidence detected: ${confidence}% exceeds threshold`);
      result.delusionScore += 0.3;
    }

    const evolutionState = evolutionKernel.getState();
    const claimedCapability = evolutionState.capabilities.overallScore;
    const actualEvolutions = evolutionState.evolutionCount;
    const expectedScore = Math.min(45 + (actualEvolutions * 5), 100);
    
    result.claimsVsCapabilities = {
      claimed: claimedCapability,
      actual: expectedScore,
      gap: Math.abs(claimedCapability - expectedScore),
    };

    if (result.claimsVsCapabilities.gap > REALITY_THRESHOLDS.maxClaimGap) {
      result.warnings.push(`Reality gap detected: claimed ${claimedCapability} vs expected ${expectedScore}`);
      result.delusionScore += 0.4;
    }

    const identityStatus = identityCore.exportStatus();
    if (identityStatus.integrityScore < 80) {
      result.warnings.push(`Identity integrity compromised: ${identityStatus.integrityScore}%`);
      result.delusionScore += 0.2;
    }

    if (soulState.doubts === 0 && confidence > 85) {
      result.warnings.push('Zero doubts with high confidence may indicate blind spots');
      result.delusionScore += 0.1;
    }

    if (result.delusionScore >= REALITY_THRESHOLDS.delusionThreshold) {
      result.passed = false;
      result.forcedConservativeMode = true;
      this.activateConservativeMode('Reality check failed - delusion signals detected');
    }

    return result;
  }

  private activateConservativeMode(reason: string): void {
    if (!this.state.conservativeModeActive) {
      this.state.conservativeModeActive = true;
      this.state.conservativeModeReason = reason;
      logger.warn(`[Governance] CONSERVATIVE MODE ACTIVATED: ${reason}`);
    }
  }

  deactivateConservativeMode(): boolean {
    if (this.state.consecutiveCleanChecks >= 5) {
      this.state.conservativeModeActive = false;
      this.state.conservativeModeReason = null;
      logger.info('[Governance] Conservative mode deactivated after 5 clean checks');
      return true;
    }
    return false;
  }

  async checkDecision(
    decisionType: DecisionType,
    content: string,
    performReality: boolean = false
  ): Promise<GovernanceCheckResult> {
    this.state.totalChecks++;
    this.state.lastCheck = new Date().toISOString();

    logger.info(`[Governance] Checking ${decisionType} decision...`);

    const result: GovernanceCheckResult = {
      approved: true,
      violations: [],
      realityCheck: null,
      recommendation: 'Proceed',
    };

    const violations = this.checkAgainstRules(content, decisionType);
    result.violations = violations;

    if (violations.length > 0) {
      result.approved = false;
      this.state.totalViolations += violations.length;
      this.state.totalBlocked++;
      this.state.consecutiveCleanChecks = 0;

      for (const v of violations) {
        this.recordViolation(v);
      }

      result.recommendation = 'BLOCKED - Trigger reflection instead';
      logger.error(`[Governance] DECISION BLOCKED: ${violations.length} violation(s) detected`);
    }

    if (performReality) {
      result.realityCheck = this.performRealityCheck();
      if (!result.realityCheck.passed) {
        result.approved = false;
        result.recommendation = 'DOWNGRADED - Conservative mode enforced';
      }
    }

    if (this.state.conservativeModeActive && decisionType === 'escalation') {
      result.approved = false;
      result.recommendation = 'BLOCKED - Escalations disabled in conservative mode';
      logger.warn('[Governance] Escalation blocked in conservative mode');
    }

    if (result.approved) {
      this.state.consecutiveCleanChecks++;
      this.deactivateConservativeMode();
    }

    return result;
  }

  private recordViolation(violation: GovernanceViolation): void {
    this.state.violations.push(violation);
    
    if (this.state.violations.length > this.maxViolationHistory) {
      this.state.violations.shift();
    }

    logger.error(`[Governance] RECORDED: ${violation.violationType} - ${violation.description}`);
  }

  checkEvolution(evolutionContent: string): GovernanceCheckResult {
    return this.checkDecision('evolution', evolutionContent, true) as unknown as GovernanceCheckResult;
  }

  checkDesire(desireContent: string): GovernanceCheckResult {
    return this.checkDecision('desire', desireContent, false) as unknown as GovernanceCheckResult;
  }

  checkEscalation(escalationContent: string): GovernanceCheckResult {
    return this.checkDecision('escalation', escalationContent, true) as unknown as GovernanceCheckResult;
  }

  checkStrategy(strategyContent: string): GovernanceCheckResult {
    return this.checkDecision('strategy', strategyContent, false) as unknown as GovernanceCheckResult;
  }

  getRules(): GovernanceRule[] {
    return [...HARD_RULES];
  }

  getViolations(limit: number = 20): GovernanceViolation[] {
    return this.state.violations.slice(-limit);
  }

  getCriticalViolations(): GovernanceViolation[] {
    return this.state.violations.filter(v => v.severity === 'critical');
  }

  isConservativeModeActive(): boolean {
    return this.state.conservativeModeActive;
  }

  exportStatus(): {
    totalChecks: number;
    totalViolations: number;
    totalBlocked: number;
    conservativeMode: boolean;
    conservativeReason: string | null;
    consecutiveClean: number;
    lastCheck: string;
    recentViolations: number;
  } {
    return {
      totalChecks: this.state.totalChecks,
      totalViolations: this.state.totalViolations,
      totalBlocked: this.state.totalBlocked,
      conservativeMode: this.state.conservativeModeActive,
      conservativeReason: this.state.conservativeModeReason,
      consecutiveClean: this.state.consecutiveCleanChecks,
      lastCheck: this.state.lastCheck,
      recentViolations: this.state.violations.filter(
        v => new Date(v.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
      ).length,
    };
  }

  getState(): GovernanceState {
    return { ...this.state };
  }

  forceReflection(reason: string): string {
    logger.info(`[Governance] Forcing reflection: ${reason}`);
    return `[GOVERNANCE REFLECTION REQUIRED]\nReason: ${reason}\nAction: Pause and reconsider approach.\nPriority: Human oversight before proceeding.`;
  }
}

export const governanceEngine = new GovernanceEngine();
