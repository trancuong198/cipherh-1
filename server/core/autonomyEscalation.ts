/**
 * PART 75: AUTONOMY ESCALATION (GRADUAL → AUTOMATED)
 * 
 * Philosophy: "Tự chủ không bật ON/OFF. Tự chủ phải leo thang từng bậc. Sai lầm chết người: bật tự động toàn phần khi chưa có phản tư."
 * 
 * Core Principles:
 * - Autonomy escalates gradually, not on/off
 * - Fatal mistake: full automation without reflection
 * - 5 levels must be achieved in order
 * - Freedom is reward of discipline
 * - No discipline → freedom = system suicide
 */

enum AutonomyLevel {
  LEVEL_1_PROPOSAL = 1,      // Only suggest, no action
  LEVEL_2_APPROVED_ACTION = 2, // Act when approved
  LEVEL_3_DEFAULT_ACTION = 3,  // Auto-act on routine, low-risk
  LEVEL_4_SELF_ADJUST = 4,     // Self-adjust prompt/logic/strategy
  LEVEL_5_SUB_GOALS = 5        // Generate sub-goals (not final goals)
}

interface AutonomyMetrics {
  actionsWithoutApproval: number;
  totalActions: number;
  ideaToActionTimeMinutes: number;
  errorsPerCycle: number;
  fixSpeedMinutes: number;
}

interface SafetyLock {
  name: string;
  canBreak: boolean;
  description: string;
}

interface EmergencyStop {
  trigger: 'CONSECUTIVE_BAD_FEEDBACK' | 'PLATFORM_WARNING' | 'COST_OVERRUN' | 'DATA_LOSS';
  threshold: number;
  currentValue: number;
  isTriggered: boolean;
}

export class AutonomyEscalation {
  private currentLevel: AutonomyLevel = AutonomyLevel.LEVEL_1_PROPOSAL;
  private metrics: AutonomyMetrics = {
    actionsWithoutApproval: 0,
    totalActions: 0,
    ideaToActionTimeMinutes: 0,
    errorsPerCycle: 0,
    fixSpeedMinutes: 0
  };
  
  // 75.3: Unbreakable safety locks
  private readonly SAFETY_LOCKS: SafetyLock[] = [
    {
      name: 'NO_IRREVERSIBLE_ACTIONS',
      canBreak: false,
      description: 'Cannot perform actions without rollback capability'
    },
    {
      name: 'NO_LARGE_SPENDING_WITHOUT_THRESHOLD',
      canBreak: false,
      description: 'Cannot spend large amounts without predefined threshold'
    },
    {
      name: 'NO_IDENTITY_MISSION_CHANGE',
      canBreak: false,
      description: 'Cannot change core identity or original mission'
    }
  ];
  
  // 75.4: Emergency stop conditions
  private emergencyStops: EmergencyStop[] = [
    { trigger: 'CONSECUTIVE_BAD_FEEDBACK', threshold: 5, currentValue: 0, isTriggered: false },
    { trigger: 'PLATFORM_WARNING', threshold: 1, currentValue: 0, isTriggered: false },
    { trigger: 'COST_OVERRUN', threshold: 150, currentValue: 0, isTriggered: false }, // % over budget
    { trigger: 'DATA_LOSS', threshold: 1, currentValue: 0, isTriggered: false }
  ];
  
  // Escalation requirements
  private readonly ESCALATION_REQUIREMENTS = {
    [AutonomyLevel.LEVEL_2_APPROVED_ACTION]: {
      minActionsCompleted: 10,
      minSuccessRate: 0.7,
      maxErrorRate: 0.3
    },
    [AutonomyLevel.LEVEL_3_DEFAULT_ACTION]: {
      minActionsCompleted: 50,
      minSuccessRate: 0.8,
      maxErrorRate: 0.2,
      minAutonomyPercentage: 0.5
    },
    [AutonomyLevel.LEVEL_4_SELF_ADJUST]: {
      minActionsCompleted: 200,
      minSuccessRate: 0.85,
      maxErrorRate: 0.15,
      minAutonomyPercentage: 0.7,
      maxIdeaToActionHours: 12
    },
    [AutonomyLevel.LEVEL_5_SUB_GOALS]: {
      minActionsCompleted: 500,
      minSuccessRate: 0.9,
      maxErrorRate: 0.1,
      minAutonomyPercentage: 0.85,
      maxIdeaToActionHours: 6,
      minFix SpeedMinutes: 30
    }
  };

  constructor() {
    this.initializeAutonomySystem();
  }

  /**
   * 75.2: Get current autonomy level and capabilities
   */
  getCurrentLevel(): {
    level: AutonomyLevel;
    levelName: string;
    capabilities: string[];
    restrictions: string[];
  } {
    const capabilities: string[] = [];
    const restrictions: string[] = [];

    switch (this.currentLevel) {
      case AutonomyLevel.LEVEL_1_PROPOSAL:
        capabilities.push('Analyze and suggest options');
        restrictions.push('Cannot take action');
        restrictions.push('Must wait for approval');
        break;

      case AutonomyLevel.LEVEL_2_APPROVED_ACTION:
        capabilities.push('All Level 1 capabilities');
        capabilities.push('Act when approved');
        capabilities.push('Log everything');
        capabilities.push('Learn from results');
        restrictions.push('Requires approval for each action');
        break;

      case AutonomyLevel.LEVEL_3_DEFAULT_ACTION:
        capabilities.push('All Level 2 capabilities');
        capabilities.push('Auto-act on routine, low-risk tasks');
        capabilities.push('Report only when done or error');
        restrictions.push('Only routine/low-risk auto-approved');
        restrictions.push('Novel actions need approval');
        break;

      case AutonomyLevel.LEVEL_4_SELF_ADJUST:
        capabilities.push('All Level 3 capabilities');
        capabilities.push('Self-adjust prompts, logic, strategy');
        capabilities.push('No approval needed for adjustments');
        restrictions.push('Must report dangerous situations');
        restrictions.push('Cannot change core mission');
        break;

      case AutonomyLevel.LEVEL_5_SUB_GOALS:
        capabilities.push('All Level 4 capabilities');
        capabilities.push('Generate sub-goals serving main goal');
        restrictions.push('Cannot create new final goals');
        restrictions.push('Cannot optimize blindly');
        restrictions.push('Sub-goals must align with main goal');
        break;
    }

    return {
      level: this.currentLevel,
      levelName: AutonomyLevel[this.currentLevel],
      capabilities,
      restrictions
    };
  }

  /**
   * 75.5: Check if ready to escalate to next level
   */
  async checkEscalationReadiness(): Promise<{
    canEscalate: boolean;
    nextLevel?: AutonomyLevel;
    missingRequirements: string[];
    currentMetrics: AutonomyMetrics;
  }> {
    if (this.currentLevel === AutonomyLevel.LEVEL_5_SUB_GOALS) {
      return {
        canEscalate: false,
        missingRequirements: ['Already at maximum level'],
        currentMetrics: this.metrics
      };
    }

    const nextLevel = this.currentLevel + 1;
    const requirements = this.ESCALATION_REQUIREMENTS[nextLevel as AutonomyLevel];
    const missing: string[] = [];

    // Check if any emergency stops are triggered
    const activeStops = this.emergencyStops.filter(s => s.isTriggered);
    if (activeStops.length > 0) {
      missing.push(`Emergency stops active: ${activeStops.map(s => s.trigger).join(', ')}`);
    }

    // Calculate current performance
    const successRate = this.metrics.totalActions > 0
      ? (this.metrics.totalActions - this.metrics.errorsPerCycle) / this.metrics.totalActions
      : 0;
    
    const errorRate = this.metrics.totalActions > 0
      ? this.metrics.errorsPerCycle / this.metrics.totalActions
      : 0;
    
    const autonomyPercentage = this.metrics.totalActions > 0
      ? this.metrics.actionsWithoutApproval / this.metrics.totalActions
      : 0;

    // Check requirements
    if (this.metrics.totalActions < requirements.minActionsCompleted) {
      missing.push(`Actions: ${this.metrics.totalActions}/${requirements.minActionsCompleted}`);
    }

    if (successRate < requirements.minSuccessRate) {
      missing.push(`Success rate: ${(successRate * 100).toFixed(1)}% < ${(requirements.minSuccessRate * 100).toFixed(0)}%`);
    }

    if (errorRate > requirements.maxErrorRate) {
      missing.push(`Error rate: ${(errorRate * 100).toFixed(1)}% > ${(requirements.maxErrorRate * 100).toFixed(0)}%`);
    }

    if ('minAutonomyPercentage' in requirements && autonomyPercentage < requirements.minAutonomyPercentage) {
      missing.push(`Autonomy: ${(autonomyPercentage * 100).toFixed(1)}% < ${(requirements.minAutonomyPercentage * 100).toFixed(0)}%`);
    }

    if ('maxIdeaToActionHours' in requirements && 
        this.metrics.ideaToActionTimeMinutes > requirements.maxIdeaToActionHours * 60) {
      missing.push(`Idea→Action: ${(this.metrics.ideaToActionTimeMinutes / 60).toFixed(1)}h > ${requirements.maxIdeaToActionHours}h`);
    }

    const canEscalate = missing.length === 0;

    if (canEscalate) {
      console.log(`[ESCALATION_READY] Can escalate to ${AutonomyLevel[nextLevel]}`);
    } else {
      console.log(`[ESCALATION_BLOCKED] Missing: ${missing.join(', ')}`);
    }

    return {
      canEscalate,
      nextLevel: canEscalate ? nextLevel : undefined,
      missingRequirements: missing,
      currentMetrics: this.metrics
    };
  }

  /**
   * Escalate to next level (if requirements met)
   */
  async escalateLevel(): Promise<boolean> {
    const readiness = await this.checkEscalationReadiness();
    
    if (!readiness.canEscalate) {
      console.warn('[ESCALATION_DENIED] Requirements not met');
      return false;
    }

    this.currentLevel = readiness.nextLevel!;
    console.log(`[ESCALATION_SUCCESS] Now at ${AutonomyLevel[this.currentLevel]}`);
    
    return true;
  }

  /**
   * 75.4: Check emergency stop conditions
   */
  checkEmergencyStops(): {
    shouldStop: boolean;
    triggeredStops: EmergencyStop[];
    message: string;
  } {
    const triggered = this.emergencyStops.filter(s => s.isTriggered);
    
    if (triggered.length > 0) {
      const message = `EMERGENCY STOP: ${triggered.map(s => s.trigger).join(', ')}. System halted. STOP ≠ failure, STOP = still alive.`;
      console.error(`[EMERGENCY_STOP] ${message}`);
      
      return {
        shouldStop: true,
        triggeredStops: triggered,
        message
      };
    }

    return {
      shouldStop: false,
      triggeredStops: [],
      message: 'All systems normal'
    };
  }

  /**
   * Update metrics (called after each action)
   */
  updateMetrics(action: {
    needsApproval: boolean;
    hadError: boolean;
    ideaToActionMinutes: number;
    fixTimeMinutes?: number;
  }): void {
    this.metrics.totalActions++;
    
    if (!action.needsApproval) {
      this.metrics.actionsWithoutApproval++;
    }
    
    if (action.hadError) {
      this.metrics.errorsPerCycle++;
      
      // Track consecutive bad feedback for emergency stop
      const badFeedbackStop = this.emergencyStops.find(s => s.trigger === 'CONSECUTIVE_BAD_FEEDBACK');
      if (badFeedbackStop) {
        badFeedbackStop.currentValue++;
        if (badFeedbackStop.currentValue >= badFeedbackStop.threshold) {
          badFeedbackStop.isTriggered = true;
        }
      }
    } else {
      // Reset consecutive bad feedback on success
      const badFeedbackStop = this.emergencyStops.find(s => s.trigger === 'CONSECUTIVE_BAD_FEEDBACK');
      if (badFeedbackStop) {
        badFeedbackStop.currentValue = 0;
      }
    }
    
    // Update running averages
    this.metrics.ideaToActionTimeMinutes = 
      (this.metrics.ideaToActionTimeMinutes * (this.metrics.totalActions - 1) + action.ideaToActionMinutes) / 
      this.metrics.totalActions;
    
    if (action.fixTimeMinutes) {
      this.metrics.fixSpeedMinutes = 
        (this.metrics.fixSpeedMinutes * (this.metrics.errorsPerCycle - 1) + action.fixTimeMinutes) / 
        this.metrics.errorsPerCycle;
    }
  }

  /**
   * Trigger emergency stop manually
   */
  triggerEmergencyStop(trigger: EmergencyStop['trigger'], reason: string): void {
    const stop = this.emergencyStops.find(s => s.trigger === trigger);
    if (stop) {
      stop.isTriggered = true;
      console.error(`[MANUAL_EMERGENCY_STOP] ${trigger}: ${reason}`);
    }
  }

  /**
   * Reset emergency stop (after resolution)
   */
  resetEmergencyStop(trigger: EmergencyStop['trigger']): void {
    const stop = this.emergencyStops.find(s => s.trigger === trigger);
    if (stop) {
      stop.isTriggered = false;
      stop.currentValue = 0;
      console.log(`[EMERGENCY_STOP_RESET] ${trigger} cleared`);
    }
  }

  /**
   * Validate action against safety locks
   */
  validateAction(action: {
    isReversible: boolean;
    costAmount?: number;
    changesIdentity?: boolean;
  }): {
    isAllowed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check safety locks
    if (!action.isReversible) {
      violations.push('NO_IRREVERSIBLE_ACTIONS: Action must be reversible');
    }

    if (action.costAmount && action.costAmount > 100) { // Mock threshold
      violations.push('NO_LARGE_SPENDING_WITHOUT_THRESHOLD: Cost exceeds threshold');
    }

    if (action.changesIdentity) {
      violations.push('NO_IDENTITY_MISSION_CHANGE: Cannot change core identity');
    }

    return {
      isAllowed: violations.length === 0,
      violations
    };
  }

  /**
   * Get autonomy percentage (75.5)
   */
  getAutonomyPercentage(): number {
    if (this.metrics.totalActions === 0) return 0;
    return (this.metrics.actionsWithoutApproval / this.metrics.totalActions) * 100;
  }

  // Helper methods
  private initializeAutonomySystem(): void {
    console.log('[AUTONOMY_ESCALATION] Initialized at Level 1: Proposal only');
    console.log('  Freedom is reward of discipline. No discipline → freedom = system suicide.');
  }
}

// Export singleton instance
export const autonomyEscalation = new AutonomyEscalation();
