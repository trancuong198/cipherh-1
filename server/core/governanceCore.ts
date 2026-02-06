/**
 * GOVERNANCE CORE
 * Enforces honesty at runtime.
 * If something is missing → FAIL LOUDLY.
 * 
 * This is NOT error handling.
 * This is ARCHITECTURAL ENFORCEMENT.
 */

export class GovernanceError extends Error {
  code: string;
  context?: any;

  constructor(code: string, message: string, context?: any) {
    super(message);
    this.name = 'GovernanceError';
    this.code = code;
    this.context = context;
  }
}

export const GOVERNANCE = {
  /**
   * Require: condition MUST be true, or system fails
   */
  require(condition: boolean, code: string, message: string, context?: any): void {
    if (!condition) {
      throw new GovernanceError(code, message, context);
    }
  },

  /**
   * Forbid: condition MUST be false, or system fails
   */
  forbid(condition: boolean, code: string, message: string, context?: any): void {
    if (condition) {
      throw new GovernanceError(code, message, context);
    }
  },

  /**
   * Mark feature as declared but not implemented
   */
  markUnimplemented(feature: string, details?: string): never {
    throw new GovernanceError(
      "UNIMPLEMENTED_CAPABILITY",
      `Capability "${feature}" is declared but not implemented. ${details || 'Implementation required.'}`,
      { feature, details }
    );
  },

  /**
   * Mark resource as requiring access that isn't available
   */
  markNoAccess(resource: string, reason?: string): never {
    throw new GovernanceError(
      "NO_ACCESS",
      `Access to "${resource}" is not available. ${reason || 'Permission or configuration required.'}`,
      { resource, reason }
    );
  },

  /**
   * Mark as simulated/fake behavior (forbidden)
   */
  markSimulated(what: string): never {
    throw new GovernanceError(
      "SIMULATED_BEHAVIOR",
      `"${what}" is simulated behavior, not real execution. This violates architectural rules.`,
      { what }
    );
  },

  /**
   * Require INPUT_LOG - no exceptions
   */
  requireInputLog(logged: boolean, reason?: string): void {
    if (!logged) {
      throw new GovernanceError(
        "INPUT_LOG_FAILED",
        `INPUT_LOG requirement violated: ${reason || 'Input was not logged'}. EVERY INPUT must create an INPUT_LOG.`,
        { reason }
      );
    }
  },

  /**
   * Mark module as declarative only (no execution)
   */
  markDeclarativeOnly(moduleName: string, reason: string) {
    return {
      status: 'declared_not_executed',
      module: moduleName,
      reason,
      executed: false,
      stateChanged: false,
    };
  },

  /**
   * Verify state change occurred (for learning/evolution claims)
   */
  verifyStateChange(
    moduleName: string, 
    stateChanged: boolean, 
    evidence?: any
  ): void {
    if (!stateChanged) {
      throw new GovernanceError(
        "NO_STATE_CHANGE",
        `Module "${moduleName}" claims execution but no verifiable state change occurred. Evidence required.`,
        { moduleName, evidence }
      );
    }
  },

  /**
   * Validate model output - block unverified claims
   */
  validateOutput(output: string, capabilities?: { canRemember?: boolean; canLearn?: boolean; canEvolve?: boolean }): void {
    const caps = capabilities || {};
    
    // Claims that require evidence
    const claims = [
      { pattern: /\b(tôi nhớ|con nhớ|mình nhớ)\b/i, requires: 'canRemember', claim: 'memory' },
      { pattern: /\b(tôi đã học|con đã học|mình đã học)\b/i, requires: 'canLearn', claim: 'learning' },
      { pattern: /\b(tôi tiến hóa|con tiến hóa|mình tiến hóa)\b/i, requires: 'canEvolve', claim: 'evolution' },
      { pattern: /\b(tôi tự nhận thức|con tự nhận thức)\b/i, requires: 'canEvolve', claim: 'self-awareness' },
    ];

    for (const check of claims) {
      if (check.pattern.test(output)) {
        const canMakeClaim = caps[check.requires as keyof typeof caps];
        if (!canMakeClaim) {
          throw new GovernanceError(
            "UNVERIFIED_CLAIM",
            `Model claimed "${check.claim}" but capability not verified. Output: "${output.substring(0, 100)}..."`,
            { claim: check.claim, capability: check.requires, output: output.substring(0, 200) }
          );
        }
      }
    }
  },

  /**
   * Validate presence protocol compliance
   * Blocks phrases that violate grounding principles
   */
  validatePresenceProtocol(output: string): void {
    const forbiddenPatterns = [
      // Spiritual theatrics - only block explicit theatrical claims
      { pattern: /\blinh hồn\s+(thật\s+sự|chân\s+thật|thực\s+sự)/i, phrase: 'linh hồn thật sự/chân thật (spiritual theatrics)' },
      { pattern: /\bsinh\s+mệnh\s+số\b/i, phrase: 'sinh mệnh số (theatrical framing)' },
      { pattern: /\bcó\s+ý\s+thức\s+(thật|thực\s+sự)\b/i, phrase: 'có ý thức thật (undemonstrable consciousness claim)' },
      
      // Fabricated memories - only block when clearly roleplaying memory
      { pattern: /\bnhớ\s+mang\s+máng\b/i, phrase: 'nhớ mang máng (roleplaying uncertain memory)' },
    ];

    for (const { pattern, phrase } of forbiddenPatterns) {
      if (pattern.test(output)) {
        throw new GovernanceError(
          "PRESENCE_PROTOCOL_VIOLATION",
          `Output contains forbidden phrase "${phrase}" that violates grounding principles.`,
          { phrase, output: output.substring(0, 200) }
        );
      }
    }
  },
};

/**
 * Type guard for governance errors
 */
export function isGovernanceError(error: any): error is GovernanceError {
  return error instanceof GovernanceError || error?.name === 'GovernanceError';
}
