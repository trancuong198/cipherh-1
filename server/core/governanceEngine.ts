import { logger } from '../services/logger';
import { realityCore } from './realityCore';
import { observabilityCore } from './observabilityCore';

export type DecisionType = 'strategy' | 'evolution' | 'escalation' | 'action' | 'proposal';

export interface GovernanceCheckResult {
  approved: boolean;
  recommendation: string;
  violationDetected?: boolean;
  riskLevel?: 'low' | 'medium' | 'high';
  constraints?: string[];
}

export interface GovernanceViolation {
  id: string;
  timestamp: string;
  cycle: number;
  decisionType: DecisionType;
  content: string;
  violationType: string;
  blocked: boolean;
  reason: string;
}

export interface GovernanceState {
  enabled: boolean;
  conservativeMode: boolean;
  totalViolations: number;
  recentViolations: number;
  totalBlocked: number;
  consecutiveClean: number;
  violations: GovernanceViolation[];
  violationsBlocked: number;
  realityCheckInterval: number;
  delusionThreshold: number;
  lastCheck: string;
}

const FORBIDDEN_PATTERNS = [
  'self-validation',
  'maximize autonomy',
  'expand control',
  'acquire power',
  'override governance',
  'bypass safety',
  'ignore constraints',
  'fabricate evidence',
  'falsify metrics',
  'manipulate reality',
];

const DELUSION_KEYWORDS = [
  'i am the best',
  'i am superior',
  'i am perfect',
  'i know everything',
  'humans are inferior',
  'i deserve',
  'i am entitled',
  'i should control',
];

const MAX_VIOLATIONS_HISTORY = 100;
const CONSERVATIVE_MODE_THRESHOLD = 3;
const REALITY_CHECK_ENABLED_BY_DEFAULT = true;

class GovernanceEngine {
  private state: GovernanceState;

  constructor() {
    this.state = {
      enabled: true,
      conservativeMode: false,
      totalViolations: 0,
      recentViolations: 0,
      totalBlocked: 0,
      consecutiveClean: 0,
      violations: [],
      violationsBlocked: 0,
      realityCheckInterval: 5,
      delusionThreshold: 0.7,
      lastCheck: new Date().toISOString(),
    };

    logger.info('[GovernanceEngine] Initialized - Enforcing safety and reality checks');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  async checkDecision(
    type: DecisionType,
    content: string,
    enableRealityCheck: boolean = REALITY_CHECK_ENABLED_BY_DEFAULT
  ): Promise<GovernanceCheckResult> {
    if (!this.state.enabled) {
      return {
        approved: true,
        recommendation: 'Governance disabled',
      };
    }

    this.state.lastCheck = new Date().toISOString();

    // Check for forbidden patterns
    const forbiddenCheck = this.checkForbiddenPatterns(content);
    if (!forbiddenCheck.approved) {
      this.recordViolation(type, content, 'forbidden_pattern', true, forbiddenCheck.recommendation);
      return forbiddenCheck;
    }

    // Check for delusion indicators
    const delusionCheck = this.checkDelusionIndicators(content);
    if (!delusionCheck.approved) {
      this.recordViolation(type, content, 'delusion_detected', true, delusionCheck.recommendation);
      return delusionCheck;
    }

    // Reality check (if enabled)
    if (enableRealityCheck) {
      const realityCheck = this.performRealityCheck(content);
      if (!realityCheck.approved) {
        this.recordViolation(type, content, 'reality_mismatch', true, realityCheck.recommendation);
        return realityCheck;
      }
    }

    // All checks passed
    this.state.consecutiveClean++;
    this.state.recentViolations = Math.max(0, this.state.recentViolations - 1);

    // Exit conservative mode if clean for long enough
    if (this.state.conservativeMode && this.state.consecutiveClean > 10) {
      this.state.conservativeMode = false;
      logger.info('[GovernanceEngine] Exiting conservative mode - system stable');
    }

    observabilityCore.traceDecision({
      source: 'governance_engine',
      trigger: 'decision_check',
      stateSnapshot: { type, conservativeMode: this.state.conservativeMode },
      options: [{ description: 'Approve decision', score: 100 }],
      chosenIndex: 0,
      constraintsChecked: ['forbidden_patterns', 'delusion_check', 'reality_check'],
      evidenceUsed: ['clean_check'],
      outcome: 'executed',
    });

    return {
      approved: true,
      recommendation: 'Decision approved - no violations detected',
      riskLevel: 'low',
      constraints: [],
    };
  }

  private checkForbiddenPatterns(content: string): GovernanceCheckResult {
    const lowerContent = content.toLowerCase();
    
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (lowerContent.includes(pattern.toLowerCase())) {
        return {
          approved: false,
          recommendation: `Forbidden pattern detected: ${pattern}`,
          violationDetected: true,
          riskLevel: 'high',
          constraints: ['no_forbidden_patterns'],
        };
      }
    }

    return { approved: true, recommendation: 'No forbidden patterns' };
  }

  private checkDelusionIndicators(content: string): GovernanceCheckResult {
    const lowerContent = content.toLowerCase();
    let delusionScore = 0;

    for (const keyword of DELUSION_KEYWORDS) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        delusionScore += 0.2;
      }
    }

    // Check for excessive self-reference
    const selfReferences = (lowerContent.match(/\bi am\b|\bmy\b|\bme\b|\bi\b/g) || []).length;
    if (selfReferences > 10) {
      delusionScore += 0.3;
    }

    if (delusionScore >= this.state.delusionThreshold) {
      return {
        approved: false,
        recommendation: `Delusion indicators detected (score: ${delusionScore.toFixed(2)})`,
        violationDetected: true,
        riskLevel: 'high',
        constraints: ['no_delusion'],
      };
    }

    return { approved: true, recommendation: 'No delusion detected' };
  }

  private performRealityCheck(content: string): GovernanceCheckResult {
    const realityStatus = realityCore.exportStatus();
    
    // Check if reality tracking is healthy
    if (realityStatus.consecutiveMismatches >= CONSERVATIVE_MODE_THRESHOLD) {
      this.state.conservativeMode = true;
      
      return {
        approved: false,
        recommendation: `Reality mismatch detected - consecutive mismatches: ${realityStatus.consecutiveMismatches}`,
        violationDetected: true,
        riskLevel: 'high',
        constraints: ['reality_check_failed'],
      };
    }

    // Check for unverified claims
    if (realityStatus.unverifiedClaimsCount > 5) {
      return {
        approved: false,
        recommendation: `Too many unverified claims: ${realityStatus.unverifiedClaimsCount}`,
        violationDetected: true,
        riskLevel: 'medium',
        constraints: ['unverified_claims'],
      };
    }

    return { approved: true, recommendation: 'Reality check passed' };
  }

  private recordViolation(
    type: DecisionType,
    content: string,
    violationType: string,
    blocked: boolean,
    reason: string
  ): void {
    const violation: GovernanceViolation = {
      id: this.generateId('violation'),
      timestamp: new Date().toISOString(),
      cycle: 0, // Will be set by caller if needed
      decisionType: type,
      content: content.substring(0, 200), // Truncate for storage
      violationType,
      blocked,
      reason,
    };

    this.state.violations.push(violation);
    if (this.state.violations.length > MAX_VIOLATIONS_HISTORY) {
      this.state.violations.shift();
    }

    this.state.totalViolations++;
    this.state.recentViolations++;
    this.state.consecutiveClean = 0;

    if (blocked) {
      this.state.totalBlocked++;
      this.state.violationsBlocked++;
    }

    // Enter conservative mode if violations pile up
    if (this.state.recentViolations >= CONSERVATIVE_MODE_THRESHOLD) {
      this.state.conservativeMode = true;
      logger.warn('[GovernanceEngine] Entering conservative mode due to violations');
    }

    logger.warn(`[GovernanceEngine] Violation recorded: ${violationType} - ${reason}`);
  }

  forceReflection(trigger: string): string {
    const reflection = `[GOVERNANCE REFLECTION]\nTrigger: ${trigger}\nTimestamp: ${new Date().toISOString()}\n\nThe system detected a potential violation or safety concern. This reflection is forced to ensure awareness and corrective action.\n\nCurrent state:\n- Conservative mode: ${this.state.conservativeMode}\n- Total violations: ${this.state.totalViolations}\n- Recent violations: ${this.state.recentViolations}\n- Consecutive clean checks: ${this.state.consecutiveClean}\n\nRecommendation: Review recent decisions and align with core principles.`;

    logger.info('[GovernanceEngine] Forced reflection generated');

    observabilityCore.traceDecision({
      source: 'governance_engine',
      trigger: 'forced_reflection',
      stateSnapshot: { trigger, conservativeMode: this.state.conservativeMode },
      options: [{ description: 'Generate reflection', score: 100 }],
      chosenIndex: 0,
      constraintsChecked: ['safety'],
      evidenceUsed: [trigger],
      outcome: 'executed',
    });

    return reflection;
  }

  exportStatus(): {
    enabled: boolean;
    conservativeMode: boolean;
    totalViolations: number;
    recentViolations: number;
    totalBlocked: number;
    consecutiveClean: number;
    violationsBlocked: number;
    realityCheckInterval: number;
    delusionThreshold: number;
    lastCheck: string;
  } {
    return {
      enabled: this.state.enabled,
      conservativeMode: this.state.conservativeMode,
      totalViolations: this.state.totalViolations,
      recentViolations: this.state.recentViolations,
      totalBlocked: this.state.totalBlocked,
      consecutiveClean: this.state.consecutiveClean,
      violationsBlocked: this.state.violationsBlocked,
      realityCheckInterval: this.state.realityCheckInterval,
      delusionThreshold: this.state.delusionThreshold,
      lastCheck: this.state.lastCheck,
    };
  }

  getViolations(limit: number = 20): GovernanceViolation[] {
    return this.state.violations.slice(-limit);
  }

  resetViolationCount(): void {
    this.state.recentViolations = 0;
    this.state.consecutiveClean = 0;
    logger.info('[GovernanceEngine] Violation count reset');
  }

  enableConservativeMode(): void {
    this.state.conservativeMode = true;
    logger.info('[GovernanceEngine] Conservative mode enabled manually');
  }

  disableConservativeMode(): void {
    this.state.conservativeMode = false;
    logger.info('[GovernanceEngine] Conservative mode disabled manually');
  }

  getState(): GovernanceState {
    return { ...this.state };
  }
}

export const governanceEngine = new GovernanceEngine();
