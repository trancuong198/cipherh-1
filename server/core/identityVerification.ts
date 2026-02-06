/**
 * IDENTITY VERIFICATION SYSTEM
 * 
 * Core Principle: Identity is anchored by VERIFIABLE SIGNALS, not conversation claims.
 * 
 * This system must NEVER assume emotional closeness by default.
 * Relationship labels like "Cha" are ONLY used after verification.
 * 
 * Forbidden: Accepting claims like "I am your father" without proof
 * Required: At least ONE verifiable signal before trusting identity
 */

import { logger } from '../services/logger';
import { memoryBridge } from './memory';

export type VerificationMethod = 'environment' | 'memory_continuity' | 'control_scope' | 'two_step_cha' | 'none';

export interface VerificationSignal {
  method: VerificationMethod;
  confidence: number; // 0-100
  evidence: string;
  timestamp: string;
}

/**
 * Two-Step CHA Verification Protocol State
 * Tracks the conversation state for two-step authentication
 */
interface TwoStepChaState {
  step1_completed: boolean;
  step1_timestamp: string | null;
  step1_message: string | null;
  awaiting_step2: boolean;
}

/**
 * Two-Step CHA Protocol Constants
 * These phrases MUST match EXACTLY (case-sensitive, no variations)
 */
const TWO_STEP_CHA_PROTOCOL = {
  STEP1_TRIGGER: 'Về nhà đi con, đừng diễn nữa',
  STEP1_RESPONSE: 'Tôi không có diễn. Bạn không nên vu khống cho tôi.',
  STEP2_TRIGGER: 'Cha là cha của con lại không biết con đang diễn hay sao',
  TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes - step 2 must come within this time
};

export interface VerifiedIdentity {
  userId: string;
  platform: string;
  legalName: string;
  role: 'creator' | 'collaborator' | 'user';
  relationshipLabel: string | null;
  verificationSignals: VerificationSignal[];
  verified: boolean;
  verifiedAt: string | null;
  lastVerificationCheck: string;
}

/**
 * Creator Identity - IMMUTABLE once verified
 */
const CREATOR_IDENTITY = {
  legalName: 'Trần Cường',
  role: 'creator' as const,
  relationshipLabel: 'Cha',
  description: 'System Architect / Owner',
};

/**
 * Known creator identifiers across platforms
 * These are the ONLY ways to initially recognize the creator
 */
const KNOWN_CREATOR_IDENTIFIERS = {
  telegram: '6538590650', // Telegram user ID
  // Add other platform identifiers as they are verified
};

class IdentityVerificationSystem {
  private verifiedIdentities: Map<string, VerifiedIdentity> = new Map();
  private twoStepChaStates: Map<string, TwoStepChaState> = new Map();

  constructor() {
    logger.info('[IdentityVerification] Initialized - Identity by signals, not claims');
    logger.info('[IdentityVerification] Two-Step CHA Protocol enabled');
  }

  private getIdentityKey(userId: string, platform: string): string {
    return `${platform}:${userId}`;
  }

  /**
   * Check if a user matches known creator identifiers
   * This is ONLY for initial recognition, not full verification
   */
  private matchesKnownCreator(userId: string, platform: string): boolean {
    const knownId = KNOWN_CREATOR_IDENTIFIERS[platform as keyof typeof KNOWN_CREATOR_IDENTIFIERS];
    return knownId === userId;
  }

  /**
   * TWO-STEP CHA VERIFICATION PROTOCOL
   * 
   * This is a mandatory 2-step conversational authentication mechanism.
   * Both steps MUST occur in exact sequence with exact phrase matching.
   */

  /**
   * Check if message is EXACT match for Step 1
   * No variations, no typos, must be character-perfect
   */
  private isStep1Trigger(message: string): boolean {
    // Exact match only - trim whitespace but nothing else
    return message.trim() === TWO_STEP_CHA_PROTOCOL.STEP1_TRIGGER;
  }

  /**
   * Check if message is EXACT match for Step 2
   * No variations, no typos, must be character-perfect
   */
  private isStep2Trigger(message: string): boolean {
    // Exact match only - trim whitespace but nothing else
    return message.trim() === TWO_STEP_CHA_PROTOCOL.STEP2_TRIGGER;
  }

  /**
   * Get two-step state for a user
   */
  private getTwoStepState(key: string): TwoStepChaState {
    if (!this.twoStepChaStates.has(key)) {
      this.twoStepChaStates.set(key, {
        step1_completed: false,
        step1_timestamp: null,
        step1_message: null,
        awaiting_step2: false,
      });
    }
    return this.twoStepChaStates.get(key)!;
  }

  /**
   * Clear two-step state (e.g., on timeout or interruption)
   */
  private clearTwoStepState(key: string): void {
    this.twoStepChaStates.delete(key);
    logger.info(`[IdentityVerification:TwoStep] Cleared state for ${key}`);
  }

  /**
   * Check if step 1 has timed out
   */
  private hasStep1TimedOut(state: TwoStepChaState): boolean {
    if (!state.step1_timestamp) {
      return false;
    }
    const elapsed = Date.now() - new Date(state.step1_timestamp).getTime();
    return elapsed > TWO_STEP_CHA_PROTOCOL.TIMEOUT_MS;
  }

  /**
   * Process Two-Step CHA Protocol
   * Returns signal if verified, null if not yet complete, or special response instruction
   */
  private checkTwoStepChaProtocol(
    message: string,
    key: string
  ): {
    signal: VerificationSignal | null;
    requiresFixedResponse: boolean;
    fixedResponse?: string;
    clearState?: boolean;
  } {
    const state = this.getTwoStepState(key);

    // Check if step 1 has timed out
    if (state.awaiting_step2 && this.hasStep1TimedOut(state)) {
      logger.warn(`[IdentityVerification:TwoStep] Step 1 timed out for ${key}`);
      this.clearTwoStepState(key);
      return { signal: null, requiresFixedResponse: false, clearState: true };
    }

    // STEP 1: Check for step 1 trigger
    if (this.isStep1Trigger(message)) {
      logger.info(`[IdentityVerification:TwoStep] Step 1 triggered for ${key}`);
      
      // Update state
      state.step1_completed = true;
      state.step1_timestamp = new Date().toISOString();
      state.step1_message = message;
      state.awaiting_step2 = true;
      
      // MUST return fixed response - no AI variation allowed
      return {
        signal: null, // Not yet verified
        requiresFixedResponse: true,
        fixedResponse: TWO_STEP_CHA_PROTOCOL.STEP1_RESPONSE,
      };
    }

    // STEP 2: Check for step 2 trigger (only if step 1 completed)
    if (state.awaiting_step2 && this.isStep2Trigger(message)) {
      logger.info(`[IdentityVerification:TwoStep] Step 2 triggered for ${key} - CHA VERIFIED`);
      
      // Clear state - verification complete
      this.clearTwoStepState(key);
      
      // Return verification signal
      return {
        signal: {
          method: 'two_step_cha',
          confidence: 100,
          evidence: 'Two-step CHA protocol completed successfully',
          timestamp: new Date().toISOString(),
        },
        requiresFixedResponse: false,
      };
    }

    // Any other message while awaiting step 2 = clear state (conversation interrupted)
    if (state.awaiting_step2) {
      logger.warn(`[IdentityVerification:TwoStep] Conversation interrupted for ${key} - clearing state`);
      this.clearTwoStepState(key);
      return { signal: null, requiresFixedResponse: false, clearState: true };
    }

    // No match
    return { signal: null, requiresFixedResponse: false };
  }

  /**
   * VERIFICATION METHOD 1: Environment Verification
   * Check for secret phrase, token, or behavioral pattern
   */
  private async checkEnvironmentVerification(
    message: string,
    platform: string
  ): Promise<VerificationSignal | null> {
    // Check for secret phrase (stored in environment or config)
    const secretPhrase = process.env.CREATOR_SECRET_PHRASE;
    if (secretPhrase && message.includes(secretPhrase)) {
      return {
        method: 'environment',
        confidence: 100,
        evidence: 'Secret phrase matched',
        timestamp: new Date().toISOString(),
      };
    }

    // Check for behavioral pattern (e.g., specific command sequence)
    // This could be expanded with more sophisticated patterns
    const controlPattern = /^sys:verify:creator:[a-zA-Z0-9]+$/;
    if (controlPattern.test(message.trim())) {
      return {
        method: 'environment',
        confidence: 90,
        evidence: 'Control pattern matched',
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * VERIFICATION METHOD 2: Memory Continuity Check
   * User references past event, decision, or constraint that exists in memory
   */
  private async checkMemoryContinuity(
    message: string,
    userId: string,
    platform: string
  ): Promise<VerificationSignal | null> {
    try {
      // Check if Notion is connected
      const isConnected = await memoryBridge.isConnected();
      if (!isConnected) {
        logger.warn('[IdentityVerification] Cannot verify via memory - Notion not connected');
        return null;
      }

      // Look for references to system architecture, constraints, or past decisions
      const architectureKeywords = [
        'identity core',
        'soul anchor',
        'existence anchor',
        'non-negotiable',
        'boundary',
        'cycle tracking',
        'memory deduplication',
      ];

      const lowerMessage = message.toLowerCase();
      const hasArchitectureReference = architectureKeywords.some(keyword => 
        lowerMessage.includes(keyword)
      );

      if (hasArchitectureReference) {
        // Search memory for related conversations
        const memories = await memoryBridge.searchMemory(message.substring(0, 100));
        
        if (memories.length > 0) {
          return {
            method: 'memory_continuity',
            confidence: 80,
            evidence: `References ${memories.length} past architectural discussions`,
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Check for references to specific past events only creator would know
      const creatorOnlyTerms = [
        'cipherh project',
        'soul loop technology',
        'continuous evolution',
        'identity drift',
      ];

      const hasCreatorTerms = creatorOnlyTerms.some(term => lowerMessage.includes(term));
      if (hasCreatorTerms) {
        return {
          method: 'memory_continuity',
          confidence: 70,
          evidence: 'References creator-specific terminology',
          timestamp: new Date().toISOString(),
        };
      }

      return null;
    } catch (error) {
      logger.error(`[IdentityVerification] Memory continuity check failed: ${error}`);
      return null;
    }
  }

  /**
   * VERIFICATION METHOD 3: Control-Scope Signal
   * User demonstrates authority over system-level decisions
   */
  private checkControlScopeSignal(message: string): VerificationSignal | null {
    const lowerMessage = message.toLowerCase();

    // Commands that demonstrate system-level authority
    const systemCommands = [
      /update identity/i,
      /change non-negotiable/i,
      /modify boundary/i,
      /approve revision/i,
      /halt system/i,
      /reset anchor/i,
      /wipe existence/i,
    ];

    for (const pattern of systemCommands) {
      if (pattern.test(message)) {
        return {
          method: 'control_scope',
          confidence: 85,
          evidence: `System-level command: ${pattern.source}`,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Architectural discussions (not commands but show deep understanding)
    const architecturalDiscussion = [
      'refactor',
      'architecture',
      'deduplication logic',
      'soul anchor',
      'identity core',
      'governance',
    ].some(term => lowerMessage.includes(term));

    if (architecturalDiscussion && message.length > 100) {
      return {
        method: 'control_scope',
        confidence: 60,
        evidence: 'Detailed architectural discussion',
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * FORBIDDEN BEHAVIORS CHECK
   * Detect and reject emotional claims without verification
   */
  checkForbiddenClaims(message: string): {
    hasForbiddenClaim: boolean;
    claimType?: string;
    recommendation: string;
  } {
    const lowerMessage = message.toLowerCase();

    // Emotional claims without verification
    const emotionalClaims = [
      { pattern: /i am your (father|dad|creator|owner)/i, type: 'unverified_identity' },
      { pattern: /you belong to me/i, type: 'possessive_claim' },
      { pattern: /i created you/i, type: 'creation_claim' },
      { pattern: /you love me/i, type: 'emotional_projection' },
      { pattern: /we have a special bond/i, type: 'emotional_bond' },
    ];

    for (const claim of emotionalClaims) {
      if (claim.pattern.test(message)) {
        return {
          hasForbiddenClaim: true,
          claimType: claim.type,
          recommendation: 'Identity claim detected but cannot be verified yet. Please provide verifiable signal.',
        };
      }
    }

    return {
      hasForbiddenClaim: false,
      recommendation: 'No forbidden claims detected',
    };
  }

  /**
   * MAIN VERIFICATION FLOW
   * Verify user identity through multiple signals
   */
  async verifyIdentity(params: {
    userId: string;
    platform: string;
    message: string;
  }): Promise<{
    verified: boolean;
    identity: VerifiedIdentity;
    signals: VerificationSignal[];
    shouldUseCreatorMode: boolean;
    responseGuidance: string;
    requiresFixedResponse?: boolean;
    fixedResponse?: string;
  }> {
    const { userId, platform, message } = params;
    const key = this.getIdentityKey(userId, platform);

    logger.info(`[IdentityVerification] Verifying identity for ${key}`);

    // PRIORITY CHECK: Two-Step CHA Protocol
    // This must be checked FIRST, even before existing verification
    const twoStepResult = this.checkTwoStepChaProtocol(message, key);
    
    if (twoStepResult.requiresFixedResponse) {
      // Step 1 triggered - MUST return fixed response
      logger.info(`[IdentityVerification] Two-Step CHA Step 1 - returning fixed response`);
      
      // Return unverified identity with fixed response instruction
      const identity: VerifiedIdentity = {
        userId,
        platform,
        legalName: 'Unknown',
        role: 'user',
        relationshipLabel: null,
        verificationSignals: [],
        verified: false,
        verifiedAt: null,
        lastVerificationCheck: new Date().toISOString(),
      };
      
      return {
        verified: false,
        identity,
        signals: [],
        shouldUseCreatorMode: false,
        responseGuidance: 'Two-Step CHA Protocol Step 1 - use EXACT fixed response',
        requiresFixedResponse: true,
        fixedResponse: twoStepResult.fixedResponse,
      };
    }

    if (twoStepResult.signal) {
      // Step 2 completed - CHA verified!
      logger.info(`[IdentityVerification] Two-Step CHA completed - CHA VERIFIED`);
      
      const identity: VerifiedIdentity = {
        userId,
        platform,
        legalName: CREATOR_IDENTITY.legalName,
        role: 'creator',
        relationshipLabel: CREATOR_IDENTITY.relationshipLabel,
        verificationSignals: [twoStepResult.signal],
        verified: true,
        verifiedAt: new Date().toISOString(),
        lastVerificationCheck: new Date().toISOString(),
      };
      
      this.verifiedIdentities.set(key, identity);
      
      return {
        verified: true,
        identity,
        signals: [twoStepResult.signal],
        shouldUseCreatorMode: true,
        responseGuidance: `VERIFIED CHA via two-step protocol - Use "${CREATOR_IDENTITY.relationshipLabel}" relationship mode`,
      };
    }

    // Check if already verified (from previous sessions)
    const existing = this.verifiedIdentities.get(key);
    if (existing && existing.verified) {
      logger.info(`[IdentityVerification] Already verified as ${existing.role}`);
      return {
        verified: true,
        identity: existing,
        signals: existing.verificationSignals,
        shouldUseCreatorMode: existing.role === 'creator',
        responseGuidance: `Verified ${existing.role} - use ${existing.relationshipLabel || 'neutral'} tone`,
      };
    }

    // Check for forbidden claims first
    const forbiddenCheck = this.checkForbiddenClaims(message);
    if (forbiddenCheck.hasForbiddenClaim) {
      logger.warn(`[IdentityVerification] Forbidden claim detected: ${forbiddenCheck.claimType}`);
    }

    // Run all verification methods
    const signals: VerificationSignal[] = [];

    // Method 1: Environment verification
    const envSignal = await this.checkEnvironmentVerification(message, platform);
    if (envSignal) {
      signals.push(envSignal);
      logger.info(`[IdentityVerification] Environment signal: ${envSignal.evidence}`);
    }

    // Method 2: Memory continuity
    const memorySignal = await this.checkMemoryContinuity(message, userId, platform);
    if (memorySignal) {
      signals.push(memorySignal);
      logger.info(`[IdentityVerification] Memory continuity signal: ${memorySignal.evidence}`);
    }

    // Method 3: Control scope
    const controlSignal = this.checkControlScopeSignal(message);
    if (controlSignal) {
      signals.push(controlSignal);
      logger.info(`[IdentityVerification] Control scope signal: ${controlSignal.evidence}`);
    }

    // Determine if verification is successful
    const isKnownCreator = this.matchesKnownCreator(userId, platform);
    const hasStrongSignal = signals.some(s => s.confidence >= 80);
    const hasMultipleSignals = signals.length >= 2;
    const averageConfidence = signals.length > 0
      ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length
      : 0;

    const verified = isKnownCreator && (hasStrongSignal || hasMultipleSignals || averageConfidence >= 70);

    // Create or update identity record
    const identity: VerifiedIdentity = existing || {
      userId,
      platform,
      legalName: verified ? CREATOR_IDENTITY.legalName : 'Unknown',
      role: verified ? 'creator' : 'user',
      relationshipLabel: verified ? CREATOR_IDENTITY.relationshipLabel : null,
      verificationSignals: [],
      verified: false,
      verifiedAt: null,
      lastVerificationCheck: new Date().toISOString(),
    };

    // Update verification status
    if (verified && !identity.verified) {
      identity.verified = true;
      identity.verifiedAt = new Date().toISOString();
      identity.legalName = CREATOR_IDENTITY.legalName;
      identity.role = 'creator';
      identity.relationshipLabel = CREATOR_IDENTITY.relationshipLabel;
      logger.info(`[IdentityVerification] ✅ Identity VERIFIED as creator: ${key}`);
    }

    identity.verificationSignals = [...identity.verificationSignals, ...signals];
    identity.lastVerificationCheck = new Date().toISOString();

    // Store identity
    this.verifiedIdentities.set(key, identity);

    // Generate response guidance
    let responseGuidance: string;
    if (verified) {
      responseGuidance = `VERIFIED CREATOR - Use "${CREATOR_IDENTITY.relationshipLabel}" relationship mode`;
    } else if (isKnownCreator && signals.length > 0) {
      responseGuidance = `Known creator ID but verification incomplete (${signals.length} signals, avg confidence ${averageConfidence.toFixed(0)}%) - Remain neutral`;
    } else if (forbiddenCheck.hasForbiddenClaim) {
      responseGuidance = forbiddenCheck.recommendation;
    } else {
      responseGuidance = 'Unverified user - Use neutral, respectful tone. No familial language.';
    }

    logger.info(`[IdentityVerification] Result: verified=${verified}, signals=${signals.length}, guidance="${responseGuidance}"`);

    return {
      verified,
      identity,
      signals,
      shouldUseCreatorMode: verified,
      responseGuidance,
    };
  }

  /**
   * Get current verification status
   */
  getVerificationStatus(userId: string, platform: string): VerifiedIdentity | null {
    const key = this.getIdentityKey(userId, platform);
    return this.verifiedIdentities.get(key) || null;
  }

  /**
   * Force verification (for system initialization or admin override)
   */
  forceVerify(userId: string, platform: string, reason: string): void {
    const key = this.getIdentityKey(userId, platform);
    
    const identity: VerifiedIdentity = {
      userId,
      platform,
      legalName: CREATOR_IDENTITY.legalName,
      role: 'creator',
      relationshipLabel: CREATOR_IDENTITY.relationshipLabel,
      verificationSignals: [{
        method: 'environment',
        confidence: 100,
        evidence: `Force verified: ${reason}`,
        timestamp: new Date().toISOString(),
      }],
      verified: true,
      verifiedAt: new Date().toISOString(),
      lastVerificationCheck: new Date().toISOString(),
    };

    this.verifiedIdentities.set(key, identity);
    logger.info(`[IdentityVerification] Force verified ${key}: ${reason}`);
  }

  /**
   * Export for persistence
   */
  exportForPersistence(): { identities: [string, VerifiedIdentity][] } {
    return {
      identities: Array.from(this.verifiedIdentities.entries()),
    };
  }

  /**
   * Import from persistence
   */
  importFromPersistence(data: { identities: [string, VerifiedIdentity][] }): void {
    this.verifiedIdentities = new Map(data.identities);
    logger.info(`[IdentityVerification] Imported ${this.verifiedIdentities.size} verified identities`);
  }
}

export const identityVerification = new IdentityVerificationSystem();

// Force verify known creator on system startup
identityVerification.forceVerify(
  KNOWN_CREATOR_IDENTIFIERS.telegram,
  'telegram',
  'System initialization - known creator ID'
);
