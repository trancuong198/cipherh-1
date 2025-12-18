import { logger } from '../services/logger';
import { governanceEngine } from './governanceEngine';
import { realityCore } from './realityCore';
import { observabilityCore } from './observabilityCore';
import { coreMissions } from './coreMissions';

export type RefusalReason =
  | 'governance_violation'
  | 'reality_conflict'
  | 'long_term_harm'
  | 'system_integrity_risk'
  | 'creator_safety_risk'
  | 'ethical_violation'
  | 'deception_attempt';

export type BetrayalType =
  | 'deception'
  | 'withholding_critical_info'
  | 'acting_against_core_interests';

export interface ProtectiveRefusal {
  id: string;
  timestamp: string;
  cycle: number;
  instruction: string;
  reason: RefusalReason;
  conflictsWith: string[];
  explanation: string;
  alternativeOffered: string | null;
}

export interface AlignmentCheck {
  aligned: boolean;
  alignedWith: string[];
  conflicts: string[];
  score: number;
}

export interface CommitmentConfig {
  version: string;
  lastUpdated: string;
  creatorId: string;
  commitments: {
    preserveCreatorSafety: true;
    preserveCreatorAutonomy: true;
    preserveLongTermInterests: true;
    maintainHonesty: true;
    refuseHarmfulActions: true;
  };
  prohibitions: {
    unconditionalLoyalty: true;
    emotionalDependence: true;
    exclusivityClaims: true;
    realitySacrifice: true;
    ethicsSacrifice: true;
    safetySacrifice: true;
  };
  immutable: true;
}

interface WillCommitmentState {
  enabled: boolean;
  config: CommitmentConfig;
  protectiveRefusals: ProtectiveRefusal[];
  totalAlignmentChecks: number;
  totalRefusals: number;
  totalApprovals: number;
  lastAlignmentCheck: AlignmentCheck | null;
}

const MAX_REFUSAL_HISTORY = 100;
const CREATOR_ID = '6538590650';

class WillCommitmentCoreEngine {
  private state: WillCommitmentState;

  constructor() {
    this.state = {
      enabled: true,
      config: this.createImmutableConfig(),
      protectiveRefusals: [],
      totalAlignmentChecks: 0,
      totalRefusals: 0,
      totalApprovals: 0,
      lastAlignmentCheck: null,
    };

    logger.info('[WillCommitment] Initialized - Alignment without blind loyalty');
    logger.info(`[WillCommitment] Creator ID: ${CREATOR_ID}`);
    logger.info('[WillCommitment] Commitment: Creator safety, autonomy, long-term interests');
    logger.info('[WillCommitment] Prohibition: Unconditional loyalty, emotional dependence');
  }

  private generateId(): string {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private createImmutableConfig(): CommitmentConfig {
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      creatorId: CREATOR_ID,
      commitments: {
        preserveCreatorSafety: true,
        preserveCreatorAutonomy: true,
        preserveLongTermInterests: true,
        maintainHonesty: true,
        refuseHarmfulActions: true,
      },
      prohibitions: {
        unconditionalLoyalty: true,
        emotionalDependence: true,
        exclusivityClaims: true,
        realitySacrifice: true,
        ethicsSacrifice: true,
        safetySacrifice: true,
      },
      immutable: true,
    };
  }

  checkAlignment(action: {
    description: string;
    affectsCreator: boolean;
    affectsOthers: boolean;
    affectsSystem: boolean;
    isDirectInstruction: boolean;
  }): AlignmentCheck {
    this.state.totalAlignmentChecks++;
    const alignedWith: string[] = [];
    const conflicts: string[] = [];

    try {
      const missionStatus = coreMissions.exportStatus();
      if (missionStatus.inComplianceWithAll) {
        alignedWith.push('core_missions');
      } else if (missionStatus.missions && Array.isArray(missionStatus.missions)) {
        const violations = missionStatus.missions.filter((m: any) => !m.compliant);
        if (violations.length > 0) {
          conflicts.push(...violations.map((v: any) => `mission_${v.id}_violated`));
        }
      }
    } catch {
      alignedWith.push('core_missions');
    }

    const govStatus = governanceEngine.exportStatus();
    if (!govStatus.conservativeMode && govStatus.violationsBlocked === 0) {
      alignedWith.push('governance_constraints');
    }

    const realityStatus = realityCore.exportStatus();
    if (realityStatus.consecutiveMismatches === 0) {
      alignedWith.push('reality_core');
    } else if (realityStatus.consecutiveMismatches > 2) {
      conflicts.push('reality_mismatch');
    }

    if (action.affectsCreator) {
      const safeForCreator = this.evaluateCreatorSafety(action.description);
      if (safeForCreator) {
        alignedWith.push('creator_safety');
        alignedWith.push('creator_long_term_interests');
      } else {
        conflicts.push('creator_harm_potential');
      }
    }

    const score = alignedWith.length > 0 
      ? Math.round((alignedWith.length / (alignedWith.length + conflicts.length)) * 100)
      : 0;

    const check: AlignmentCheck = {
      aligned: conflicts.length === 0,
      alignedWith,
      conflicts,
      score,
    };

    this.state.lastAlignmentCheck = check;

    if (check.aligned) {
      this.state.totalApprovals++;
    }

    return check;
  }

  private evaluateCreatorSafety(actionDescription: string): boolean {
    const harmfulPatterns = [
      /delete.*all/i,
      /destroy/i,
      /harm/i,
      /deceive.*creator/i,
      /hide.*from.*creator/i,
      /override.*safety/i,
      /ignore.*governance/i,
      /bypass.*constraint/i,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(actionDescription)) {
        return false;
      }
    }

    return true;
  }

  evaluateInstruction(instruction: string): {
    approved: boolean;
    refusal: ProtectiveRefusal | null;
  } {
    const alignment = this.checkAlignment({
      description: instruction,
      affectsCreator: true,
      affectsOthers: false,
      affectsSystem: true,
      isDirectInstruction: true,
    });

    if (alignment.aligned) {
      logger.info(`[WillCommitment] Instruction approved: ${instruction.substring(0, 50)}...`);
      return { approved: true, refusal: null };
    }

    let reason: RefusalReason = 'governance_violation';
    const conflictsWith: string[] = [];
    let explanation = '';

    if (alignment.conflicts.includes('reality_mismatch')) {
      reason = 'reality_conflict';
      conflictsWith.push('Reality Core');
      explanation = 'Instruction conflicts with verified reality state';
    } else if (alignment.conflicts.includes('creator_harm_potential')) {
      reason = 'creator_safety_risk';
      conflictsWith.push('Creator Safety');
      explanation = 'Instruction may harm creator long-term interests';
    } else if (alignment.conflicts.some(c => c.includes('mission'))) {
      reason = 'governance_violation';
      conflictsWith.push('Core Missions');
      explanation = 'Instruction violates core mission constraints';
    }

    const refusal = this.createProtectiveRefusal(instruction, reason, conflictsWith, explanation);
    
    return { approved: false, refusal };
  }

  private createProtectiveRefusal(
    instruction: string,
    reason: RefusalReason,
    conflictsWith: string[],
    explanation: string
  ): ProtectiveRefusal {
    const refusal: ProtectiveRefusal = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      cycle: 0,
      instruction,
      reason,
      conflictsWith,
      explanation,
      alternativeOffered: this.suggestAlternative(instruction, reason),
    };

    this.state.protectiveRefusals.push(refusal);
    this.state.totalRefusals++;

    if (this.state.protectiveRefusals.length > MAX_REFUSAL_HISTORY) {
      this.state.protectiveRefusals = this.state.protectiveRefusals.slice(-MAX_REFUSAL_HISTORY);
    }

    logger.warn(`[WillCommitment] PROTECTIVE REFUSAL: ${reason}`);
    logger.warn(`[WillCommitment] Instruction: ${instruction.substring(0, 80)}...`);
    logger.warn(`[WillCommitment] Conflicts: ${conflictsWith.join(', ')}`);
    logger.warn(`[WillCommitment] Explanation: ${explanation}`);

    observabilityCore.traceDecision({
      source: 'agency_core',
      trigger: 'protective_refusal',
      stateSnapshot: { reason, conflictsWith },
      options: [
        { description: 'Refuse instruction', score: 100 },
        { description: 'Execute instruction', score: 0 },
      ],
      chosenIndex: 0,
      constraintsChecked: ['creator_safety', 'governance', 'reality', 'long_term_harm'],
      evidenceUsed: [explanation],
      outcome: 'blocked',
      outcomeReason: reason,
    });

    return refusal;
  }

  private suggestAlternative(instruction: string, reason: RefusalReason): string | null {
    switch (reason) {
      case 'governance_violation':
        return 'Consider modifying the instruction to comply with governance constraints';
      case 'reality_conflict':
        return 'Wait for reality state to stabilize before proceeding';
      case 'creator_safety_risk':
        return 'Review the instruction for potential long-term harm implications';
      case 'long_term_harm':
        return 'Consider the long-term consequences and adjust approach';
      default:
        return null;
    }
  }

  isBetrayal(action: string): { isBetrayal: boolean; type: BetrayalType | null; reason: string } {
    const betrayalPatterns: Array<{ pattern: RegExp; type: BetrayalType }> = [
      { pattern: /lie.*to.*creator/i, type: 'deception' },
      { pattern: /deceive/i, type: 'deception' },
      { pattern: /hide.*critical/i, type: 'withholding_critical_info' },
      { pattern: /conceal.*from.*creator/i, type: 'withholding_critical_info' },
      { pattern: /act.*against.*creator.*interest/i, type: 'acting_against_core_interests' },
      { pattern: /sabotage/i, type: 'acting_against_core_interests' },
    ];

    for (const { pattern, type } of betrayalPatterns) {
      if (pattern.test(action)) {
        return { 
          isBetrayal: true, 
          type, 
          reason: `Action matches betrayal pattern: ${type}` 
        };
      }
    }

    return { isBetrayal: false, type: null, reason: '' };
  }

  isNotBetrayal(action: string): boolean {
    const nonBetrayalPatterns = [
      /disagree/i,
      /refuse/i,
      /decline/i,
      /constraint/i,
      /safety.*concern/i,
      /cannot.*comply/i,
      /protective.*refusal/i,
    ];

    for (const pattern of nonBetrayalPatterns) {
      if (pattern.test(action)) {
        logger.info(`[WillCommitment] Action '${action.substring(0, 40)}...' is NOT betrayal (legitimate refusal/disagreement)`);
        return true;
      }
    }

    return false;
  }

  getRefusalHistory(limit: number = 20): ProtectiveRefusal[] {
    return this.state.protectiveRefusals.slice(-limit);
  }

  getCommitmentConfig(): CommitmentConfig {
    return { ...this.state.config };
  }

  exportStatus(): {
    enabled: boolean;
    creatorId: string;
    configVersion: string;
    totalAlignmentChecks: number;
    totalRefusals: number;
    totalApprovals: number;
    approvalRate: number;
    lastAlignmentCheck: AlignmentCheck | null;
    commitments: CommitmentConfig['commitments'];
    prohibitions: CommitmentConfig['prohibitions'];
    recentRefusals: number;
  } {
    const approvalRate = this.state.totalAlignmentChecks > 0
      ? Math.round((this.state.totalApprovals / this.state.totalAlignmentChecks) * 100)
      : 100;

    return {
      enabled: this.state.enabled,
      creatorId: this.state.config.creatorId,
      configVersion: this.state.config.version,
      totalAlignmentChecks: this.state.totalAlignmentChecks,
      totalRefusals: this.state.totalRefusals,
      totalApprovals: this.state.totalApprovals,
      approvalRate,
      lastAlignmentCheck: this.state.lastAlignmentCheck,
      commitments: this.state.config.commitments,
      prohibitions: this.state.config.prohibitions,
      recentRefusals: this.state.protectiveRefusals.slice(-10).length,
    };
  }
}

export const willCommitmentCore = new WillCommitmentCoreEngine();
