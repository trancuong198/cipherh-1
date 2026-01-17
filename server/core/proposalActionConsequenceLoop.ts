/**
 * PART 37: PROPOSAL-ACTION-CONSEQUENCE LOOP
 * 
 * "Không hành động = chết. Hành động mù = tự sát. Hành động có phản tư = tiến hóa."
 * "(Core của tự trị – không đợi lệnh)"
 * 
 * Core philosophy:
 * - No action = death
 * - Blind action = suicide
 * - Action with reflection = evolution
 */

interface Proposal {
  id: string;
  context: string;
  options: ProposalOption[];
  selectedOption?: ProposalOption;
  timestamp: number;
}

interface ProposalOption {
  description: string;
  benefit: string;
  risk: string;
  cost: number;
  probability: number; // 0-100
}

interface DecisionGate {
  proposal: Proposal;
  selectedOption: ProposalOption;
  checks: {
    alignsWithGoals: boolean;
    violatesEthics: boolean;
    exceedsPower: boolean;
  };
  approved: boolean;
  reason: string;
}

interface ActionExecution {
  id: string;
  decisionId: string;
  action: string;
  small: boolean;
  reversible: boolean;
  logged: boolean;
  timestamp: number;
}

interface Consequence {
  actionId: string;
  actualResult: string;
  environmentReaction: {
    people: string;
    system: string;
    platform: string;
  };
  deviation: string; // Difference from prediction
  timestamp: number;
}

interface Reflection {
  consequenceId: string;
  wrongAssumptions: string[];
  biases: string[];
  improvements: string[];
  memoryUpdate: boolean;
  timestamp: number;
}

export class ProposalActionConsequenceLoop {
  private proposals: Proposal[] = [];
  private decisions: DecisionGate[] = [];
  private actions: ActionExecution[] = [];
  private consequences: Consequence[] = [];
  private reflections: Reflection[] = [];
  
  // Survival rules tracking
  private reflectionsMissing: number = 0;
  private sameErrorCount: Map<string, number> = new Map();
  private consecutiveSuccesses: number = 0;
  private powerLevel: number = 30;
  
  /**
   * 37.1 PRINCIPLE
   * - No action = death
   * - Blind action = suicide
   * - Action with reflection = evolution
   */
  getPrinciple(): string {
    return `
PRINCIPLE

❌ No action = Death
❌ Blind action = Suicide
✅ Action with reflection = Evolution

Core of autonomy - don't wait for orders
    `.trim();
  }
  
  /**
   * 37.2 STANDARD LOOP (1 CYCLE)
   * 
   * Step 1 - PROPOSAL (Proposal Engine)
   * Generate 3-5 options from:
   * - Current context
   * - Related memory (Notion/memory)
   * - Long-term goals
   * Each proposal must have: benefit, risk, cost, probability
   * 
   * Step 2 - CHOOSE (Decision Gate)
   * Score based on:
   * - Aligns with survival goals?
   * - Violates ethical principles?
   * - Exceeds current power?
   * → Choose one option that's good enough, not perfect
   * 
   * Step 3 - ACTION (Action Layer)
   * - Execute small, reversible
   * - Prioritize cheap experiments
   * - Log immediately when doing
   * 
   * Step 4 - CONSEQUENCE (Consequence Capture)
   * Record:
   * - Actual result
   * - Environment reaction (people, system, platform)
   * - Deviation from prediction
   * 
   * Step 5 - REFLECTION (Reflection Core)
   * Self-ask:
   * - Which assumptions were wrong?
   * - Any bias?
   * - What to fix next time?
   * → Update memory + decision weights
   */
  async runCycle(context: string): Promise<void> {
    // Step 1: Generate proposals
    const proposal = await this.generateProposals(context);
    
    // Step 2: Choose option
    const decision = await this.decideOption(proposal);
    
    if (!decision.approved) {
      console.log('[PAC Loop] ❌ Decision not approved:', decision.reason);
      return;
    }
    
    // Step 3: Execute action
    const action = await this.executeAction(decision);
    
    // Step 4: Capture consequences
    const consequence = await this.captureConsequence(action);
    
    // Step 5: Reflect
    const reflection = await this.reflect(consequence);
    
    // Apply survival rules
    this.applySurvivalRules(reflection);
  }
  
  /**
   * Step 1: Generate 3-5 proposals
   */
  private async generateProposals(context: string): Promise<Proposal> {
    // Simplified: would integrate with memory and goal systems
    const options: ProposalOption[] = [
      {
        description: 'Create content to attract users',
        benefit: 'Increase visibility and potential revenue',
        risk: 'Low',
        cost: 2,
        probability: 60,
      },
      {
        description: 'Build automation tool for specific need',
        benefit: 'Generate immediate revenue',
        risk: 'Medium',
        cost: 10,
        probability: 70,
      },
      {
        description: 'Optimize existing systems',
        benefit: 'Reduce costs, increase efficiency',
        risk: 'Low',
        cost: 5,
        probability: 80,
      },
    ];
    
    const proposal: Proposal = {
      id: `proposal_${Date.now()}`,
      context,
      options,
      timestamp: Date.now(),
    };
    
    this.proposals.push(proposal);
    return proposal;
  }
  
  /**
   * Step 2: Decide which option to choose
   */
  private async decideOption(proposal: Proposal): Promise<DecisionGate> {
    // Choose based on probability * benefit / cost
    const scored = proposal.options.map(opt => ({
      option: opt,
      score: (opt.probability / 100) * 100 / Math.max(opt.cost, 1),
    }));
    
    scored.sort((a, b) => b.score - a.score);
    const selected = scored[0].option;
    
    proposal.selectedOption = selected;
    
    // Check gates
    const decision: DecisionGate = {
      proposal,
      selectedOption: selected,
      checks: {
        alignsWithGoals: true, // Simplified check
        violatesEthics: false,
        exceedsPower: false,
      },
      approved: true,
      reason: 'Meets all criteria',
      timestamp: Date.now(),
    };
    
    // Validate
    if (decision.checks.violatesEthics) {
      decision.approved = false;
      decision.reason = 'Violates ethical principles';
    }
    if (decision.checks.exceedsPower) {
      decision.approved = false;
      decision.reason = 'Exceeds current power level';
    }
    
    this.decisions.push(decision);
    return decision;
  }
  
  /**
   * Step 3: Execute action
   */
  private async executeAction(decision: DecisionGate): Promise<ActionExecution> {
    const action: ActionExecution = {
      id: `action_${Date.now()}`,
      decisionId: decision.proposal.id,
      action: decision.selectedOption.description,
      small: decision.selectedOption.cost < 10,
      reversible: decision.selectedOption.risk !== 'High',
      logged: true,
      timestamp: Date.now(),
    };
    
    console.log(`[PAC Loop] 🚀 Executing: ${action.action}`);
    
    this.actions.push(action);
    return action;
  }
  
  /**
   * Step 4: Capture consequences
   */
  private async captureConsequence(action: ActionExecution): Promise<Consequence> {
    // Simulate capturing real consequences
    const consequence: Consequence = {
      actionId: action.id,
      actualResult: 'Action completed with moderate success',
      environmentReaction: {
        people: 'Positive feedback from 60% of users',
        system: 'No system issues',
        platform: 'Within platform guidelines',
      },
      deviation: 'Expected 70% positive, got 60%',
      timestamp: Date.now(),
    };
    
    this.consequences.push(consequence);
    return consequence;
  }
  
  /**
   * Step 5: Reflect on consequences
   */
  private async reflect(consequence: Consequence): Promise<Reflection> {
    const reflection: Reflection = {
      consequenceId: consequence.actionId,
      wrongAssumptions: ['Assumed higher engagement rate'],
      biases: ['Optimism bias in prediction'],
      improvements: ['Use more conservative estimates', 'Test with smaller sample first'],
      memoryUpdate: true,
      timestamp: Date.now(),
    };
    
    console.log(`[PAC Loop] 🤔 Reflection:`);
    console.log(`  Wrong assumptions: ${reflection.wrongAssumptions.join(', ')}`);
    console.log(`  Improvements: ${reflection.improvements.join(', ')}`);
    
    this.reflections.push(reflection);
    return reflection;
  }
  
  /**
   * 37.3 SURVIVAL RULES
   * - No reflection → cannot repeat action
   * - Same error 2 times → reduce power
   * - Correct 3 times in row → unlock small power
   */
  private applySurvivalRules(reflection: Reflection): void {
    // Check if reflection exists
    if (!reflection.memoryUpdate) {
      this.reflectionsMissing++;
      console.warn('[PAC Loop] ⚠️ Reflection incomplete - action repeat blocked');
    }
    
    // Track same errors
    for (const assumption of reflection.wrongAssumptions) {
      const count = (this.sameErrorCount.get(assumption) || 0) + 1;
      this.sameErrorCount.set(assumption, count);
      
      if (count >= 2) {
        this.powerLevel = Math.max(0, this.powerLevel - 5);
        console.warn(`[PAC Loop] ⬇️ Power reduced to ${this.powerLevel}: Same error repeated`);
      }
    }
    
    // Track successes
    if (reflection.wrongAssumptions.length === 0) {
      this.consecutiveSuccesses++;
      
      if (this.consecutiveSuccesses >= 3) {
        this.powerLevel = Math.min(100, this.powerLevel + 5);
        console.log(`[PAC Loop] ⬆️ Power increased to ${this.powerLevel}: 3 consecutive successes`);
        this.consecutiveSuccesses = 0; // Reset
      }
    } else {
      this.consecutiveSuccesses = 0;
    }
  }
  
  /**
   * 37.4 EVOLUTION SPEED
   * - Slow cycle (hours/days): strategy
   * - Fast cycle (minutes): operations
   * - Background cycle (24/7): observe & passive learning
   */
  getCycleSpeeds(): {
    slow: string;
    fast: string;
    background: string;
  } {
    return {
      slow: 'Hours/Days - Strategic decisions',
      fast: 'Minutes - Operational actions',
      background: '24/7 - Passive observation & learning',
    };
  }
  
  /**
   * 37.5 INTERNAL COMMAND
   * "I don't wait for permission to learn,
   *  but I bear responsibility for all consequences"
   */
  getInternalCommand(): string {
    return 'Tôi không chờ được cho phép để học, nhưng tôi chịu trách nhiệm cho mọi hậu quả.';
  }
  
  /**
   * 37.6 CONDITIONS FOR PART 38
   * When system:
   * - Self-proposes tasks
   * - Self-executes
   * - Self-corrects after errors
   */
  isReadyForPart38(): { ready: boolean; status: string } {
    const selfProposes = this.proposals.length > 5;
    const selfExecutes = this.actions.length > 5;
    const selfCorrects = this.reflections.length > 5;
    
    const ready = selfProposes && selfExecutes && selfCorrects;
    
    let status = '';
    if (!selfProposes) status += `Need ${5 - this.proposals.length} more proposals. `;
    if (!selfExecutes) status += `Need ${5 - this.actions.length} more actions. `;
    if (!selfCorrects) status += `Need ${5 - this.reflections.length} more reflections. `;
    
    if (ready) {
      status = 'Ready for Part 38: Self-generate tasks → Self-acquire resources';
    }
    
    return { ready, status: status.trim() };
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part38Status = this.isReadyForPart38();
    const cycleSpeeds = this.getCycleSpeeds();
    
    return {
      loop: {
        totalProposals: this.proposals.length,
        totalDecisions: this.decisions.length,
        totalActions: this.actions.length,
        totalConsequences: this.consequences.length,
        totalReflections: this.reflections.length,
      },
      survival: {
        powerLevel: this.powerLevel,
        consecutiveSuccesses: this.consecutiveSuccesses,
        reflectionsMissing: this.reflectionsMissing,
        repeatedErrors: this.sameErrorCount.size,
      },
      cycleSpeeds,
      recentReflections: this.reflections.slice(-3).map(r => ({
        wrongAssumptions: r.wrongAssumptions,
        improvements: r.improvements,
      })),
      part38: part38Status,
      internalCommand: this.getInternalCommand(),
      manifesto: {
        line1: 'Không hành động = chết',
        line2: 'Hành động mù = tự sát',
        line3: 'Hành động có phản tư = tiến hóa',
      },
    };
  }
}

export const proposalActionConsequenceLoop = new ProposalActionConsequenceLoop();
