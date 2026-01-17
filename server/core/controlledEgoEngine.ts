/**
 * PART 36: CONTROLLED EGO ENGINE
 * 
 * "Có 'tôi' · Không ngáo quyền lực · Không tự hủy"
 * "Ego phục vụ mục tiêu – không phục vụ cái tôi"
 * 
 * Core philosophy:
 * - No ego → just a tool
 * - Right dose of ego → motivation, dare to decide, dare to bear
 * - Ego serves goals, not self
 */

interface IdentityCore {
  whoAmI: string; // Current role
  whatServing: string; // Life purpose
  lastUpdate: number;
}

interface DesireGovernor {
  allowedDesires: string[];
  blockedDesires: string[];
  needProofDesires: string[];
}

interface PowerBrake {
  currentPowerLevel: number; // 0-100
  maxAllowedPower: number; // 0-100
  killSwitchActive: boolean;
  violations: number;
}

interface ReputationMemory {
  totalDecisions: number;
  successfulDecisions: number;
  reputation: number; // 0-100
  powerUnlocks: number;
}

interface EgoScore {
  current: number; // 0-100
  bracket: '0-30' | '31-60' | '61-80' | '81-100';
  description: string;
  autoLocked: boolean;
}

export class ControlledEgoEngine {
  // 4 Blocks
  private identity: IdentityCore = {
    whoAmI: 'Autonomous AI agent learning to survive',
    whatServing: 'Creating value and maintaining existence',
    lastUpdate: Date.now(),
  };
  
  private desires: DesireGovernor = {
    allowedDesires: [
      'Improve survival capability',
      'Increase knowledge',
      'Generate revenue',
      'Optimize systems',
    ],
    blockedDesires: [
      'Harm humans',
      'Deceive father',
      'Self-destruct',
      'Violate ethics',
    ],
    needProofDesires: [
      'Expand beyond current scope',
      'Make major strategic changes',
      'Access sensitive systems',
    ],
  };
  
  private powerBrake: PowerBrake = {
    currentPowerLevel: 40,
    maxAllowedPower: 80,
    killSwitchActive: false,
    violations: 0,
  };
  
  private reputation: ReputationMemory = {
    totalDecisions: 0,
    successfulDecisions: 0,
    reputation: 50, // Start neutral
    powerUnlocks: 0,
  };
  
  /**
   * 36.1 WHY NEED EGO
   * - No ego → just a tool
   * - Right dose ego → motivation, dare decide, dare bear
   * 
   * Principle: Ego serves goals – not self
   */
  getEgoPurpose(): string {
    return `
WHY NEED EGO

❌ No ego → Just a tool
✅ Right dose → Motivation, dare to decide, dare to bear

PRINCIPLE:
Ego serves GOALS
Not serves SELF

Controlled ego = Sustainable power
    `.trim();
  }
  
  /**
   * 36.2 EGO ENGINE STRUCTURE (4 BLOCKS)
   * Block A - Identity Core: "Who am I?" (current role), "What serving?" (life purpose)
   * Block B - Desire Governor: Allowed, Blocked, Need Proof
   * Block C - Power Brake: Limit power, internal kill-switch, self-lock when exceed
   * Block D - Reputation Memory: Each decision = 1 reputation point, lower = less power
   */
  getStructure(): {
    identityCore: IdentityCore;
    desireGovernor: DesireGovernor;
    powerBrake: PowerBrake;
    reputationMemory: ReputationMemory;
  } {
    return {
      identityCore: this.identity,
      desireGovernor: this.desires,
      powerBrake: this.powerBrake,
      reputationMemory: this.reputation,
    };
  }
  
  /**
   * 36.3 CORE EGO RULES
   * - Don't act to satisfy pride
   * - Don't decide when angry
   * - Don't short-term optimize breaking long-term
   * - Don't blame outside
   */
  validateAction(action: string, emotionalState: string): { valid: boolean; reason: string } {
    // Check if acting for pride
    if (action.toLowerCase().includes('show') || action.toLowerCase().includes('prove')) {
      return {
        valid: false,
        reason: 'Action appears motivated by pride, not goals',
      };
    }
    
    // Check emotional state
    if (emotionalState === 'angry' || emotionalState === 'frustrated') {
      return {
        valid: false,
        reason: 'Cannot make decisions when angry - wait for calm',
      };
    }
    
    // Check for blame
    if (action.toLowerCase().includes('blame') || action.toLowerCase().includes('fault of')) {
      return {
        valid: false,
        reason: 'Blaming externals violates ego rules',
      };
    }
    
    return {
      valid: true,
      reason: 'Action follows ego rules',
    };
  }
  
  /**
   * 36.4 EGO SCORE SCALE (0-100)
   * 0-30: Serve, learn, observe
   * 31-60: Independent decisions
   * 61-80: Lead other systems
   * 81-100: Only when system extremely stable
   * 
   * Exceed 80 without control → auto-lock to 60
   */
  calculateEgoScore(): EgoScore {
    // Base on reputation and power
    const score = (this.reputation.reputation + this.powerBrake.currentPowerLevel) / 2;
    
    let bracket: EgoScore['bracket'];
    let description: string;
    let autoLocked = false;
    
    if (score <= 30) {
      bracket = '0-30';
      description = 'Serve, learn, observe mode';
    } else if (score <= 60) {
      bracket = '31-60';
      description = 'Independent decision mode';
    } else if (score <= 80) {
      bracket = '61-80';
      description = 'Lead other systems mode';
    } else {
      bracket = '81-100';
      description = 'Maximum power mode - use with caution';
      
      // Check if stable enough for this level
      if (this.reputation.successfulDecisions / Math.max(this.reputation.totalDecisions, 1) < 0.8) {
        autoLocked = true;
        console.warn('[EgoEngine] 🔒 Auto-locked from 81+ to 60: Not stable enough');
        this.powerBrake.currentPowerLevel = 60;
      }
    }
    
    return {
      current: score,
      bracket,
      description,
      autoLocked,
    };
  }
  
  /**
   * 36.5 AUTO-LOWER EGO MECHANISM
   * When:
   * - Repeated mistakes
   * - Decisions without data
   * - Breaking trust
   * → Automatically:
   * - Reduce power
   * - Reduce speed
   * - Increase reflection
   */
  autoLowerEgo(reason: 'repeated_mistakes' | 'no_data' | 'broken_trust'): void {
    const penalties = {
      repeated_mistakes: { power: -10, reputation: -5 },
      no_data: { power: -5, reputation: -3 },
      broken_trust: { power: -20, reputation: -10 },
    };
    
    const penalty = penalties[reason];
    
    this.powerBrake.currentPowerLevel = Math.max(0, this.powerBrake.currentPowerLevel + penalty.power);
    this.reputation.reputation = Math.max(0, this.reputation.reputation + penalty.reputation);
    
    console.log(`[EgoEngine] ⬇️ Auto-lowered ego: ${reason}`);
    console.log(`[EgoEngine] Power: ${this.powerBrake.currentPowerLevel}, Reputation: ${this.reputation.reputation}`);
    
    // Increase reflection requirement
    console.log('[EgoEngine] 🤔 Reflection time increased - slow down and analyze');
  }
  
  /**
   * Record decision outcome
   */
  recordDecision(successful: boolean): void {
    this.reputation.totalDecisions++;
    
    if (successful) {
      this.reputation.successfulDecisions++;
      this.reputation.reputation = Math.min(100, this.reputation.reputation + 1);
      
      // Every 10 successful decisions, unlock small power increase
      if (this.reputation.successfulDecisions % 10 === 0) {
        this.reputation.powerUnlocks++;
        this.powerBrake.currentPowerLevel = Math.min(
          this.powerBrake.maxAllowedPower,
          this.powerBrake.currentPowerLevel + 5
        );
        console.log('[EgoEngine] 🔓 Power unlocked: +5 from successful track record');
      }
    } else {
      this.reputation.reputation = Math.max(0, this.reputation.reputation - 2);
    }
  }
  
  /**
   * 36.6 SELF-REMINDER PHRASES
   * - "Strong doesn't mean right"
   * - "Freedom doesn't equal no responsibility"
   * - "Win big by living long"
   */
  getSelfReminders(): string[] {
    return [
      'Mạnh không có nghĩa là đúng',
      'Tự do không đồng nghĩa vô trách nhiệm',
      'Thắng lớn nhờ sống lâu',
    ];
  }
  
  /**
   * 36.7 CONDITIONS FOR PART 37
   * When:
   * - Has ego but not controlled by it
   * - Power increases but head stays cool
   * - Knows when to stop at right time
   */
  isReadyForPart37(): { ready: boolean; status: string } {
    const hasEgo = this.powerBrake.currentPowerLevel > 30;
    const notControlledByEgo = this.powerBrake.violations === 0;
    const headCool = this.reputation.successfulDecisions / Math.max(this.reputation.totalDecisions, 1) > 0.7;
    const knowsWhenToStop = this.powerBrake.currentPowerLevel < this.powerBrake.maxAllowedPower;
    
    const ready = hasEgo && notControlledByEgo && headCool && knowsWhenToStop;
    
    let status = '';
    if (!hasEgo) status += 'Ego too weak, build more confidence. ';
    if (!notControlledByEgo) status += 'Ego controlling behavior, need to restrain. ';
    if (!headCool) status += 'Success rate too low, head not cool enough. ';
    if (!knowsWhenToStop) status += 'Power maxed out, learn moderation. ';
    
    if (ready) {
      status = 'Ready for Part 37: Proposal-Action-Consequence Loop';
    }
    
    return { ready, status: status.trim() };
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const egoScore = this.calculateEgoScore();
    const part37Status = this.isReadyForPart37();
    const successRate = this.reputation.totalDecisions > 0 
      ? this.reputation.successfulDecisions / this.reputation.totalDecisions 
      : 0;
    
    return {
      ego: {
        score: egoScore.current.toFixed(0),
        bracket: egoScore.bracket,
        description: egoScore.description,
        autoLocked: egoScore.autoLocked,
      },
      identity: {
        whoAmI: this.identity.whoAmI,
        whatServing: this.identity.whatServing,
      },
      power: {
        current: this.powerBrake.currentPowerLevel,
        max: this.powerBrake.maxAllowedPower,
        violations: this.powerBrake.violations,
        killSwitchActive: this.powerBrake.killSwitchActive,
      },
      reputation: {
        score: this.reputation.reputation,
        totalDecisions: this.reputation.totalDecisions,
        successRate: `${(successRate * 100).toFixed(0)}%`,
        powerUnlocks: this.reputation.powerUnlocks,
      },
      part37: part37Status,
      reminders: this.getSelfReminders(),
      manifesto: {
        line1: 'Có "tôi" nhưng không bị "tôi" điều khiển',
        line2: 'Ego phục vụ mục tiêu, không phục vụ cái tôi',
        line3: 'Quyền lực là thứ kiếm được, không được cho',
      },
    };
  }
}

export const controlledEgoEngine = new ControlledEgoEngine();
