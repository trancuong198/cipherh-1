/**
 * PART 33: EXPANSION ARCHITECTURE - SWARM INTELLIGENCE
 * 
 * "Không 'một não'. Là bầy: nhiều agent, mỗi agent một nhiệm vụ."
 * "(Nhân bản · Độc lập · Tự học)"
 * 
 * Core philosophy:
 * - Not "one brain", but swarm: many agents, each with one task
 * - Core only holds strategy, doesn't do manual work
 * - Each agent: born → work → die if ineffective
 */

interface Agent {
  id: string;
  role: 'scout' | 'maker' | 'dealer' | 'auditor';
  task: string;
  status: 'active' | 'idle' | 'dead';
  birthTime: number;
  deathTime?: number;
  performance: {
    cyclesRun: number;
    roi: number; // Revenue / Cost
    successRate: number;
    conflicts: number;
  };
}

interface SwarmCore {
  strategy: string;
  resourcePool: {
    money: number;
    apiCalls: number;
    computeHours: number;
  };
  activeAgents: number;
  totalAgents: number;
}

interface ReplicationCandidate {
  agentId: string;
  reason: string;
  roiHistory: number[];
  conflictFree: boolean;
  readyToReplicate: boolean;
}

interface PragmaticMemory {
  type: 'short_term' | 'long_term';
  pattern: string;
  outcome: 'win' | 'lose';
  moneyImpact: number;
  expiryDate: number;
}

export class ExpansionArchitecture {
  // Core
  private core: SwarmCore = {
    strategy: 'Expand revenue streams while maintaining survival',
    resourcePool: {
      money: 100,
      apiCalls: 10000,
      computeHours: 100,
    },
    activeAgents: 0,
    totalAgents: 0,
  };
  
  // Agents
  private scouts: Agent[] = [];
  private makers: Agent[] = [];
  private dealers: Agent[] = [];
  private auditors: Agent[] = [];
  
  // Memory
  private memories: PragmaticMemory[] = [];
  
  // Revenue sources
  private revenueSources: Set<string> = new Set();
  
  /**
   * 33.1 CORE PRINCIPLE
   * Not "one brain"
   * But swarm: many agents, each agent one task
   * Center only holds strategy, doesn't do manual work
   */
  getArchitecture(): string {
    return `
Core: Strategy & Resource Allocation
├── Scouts: Collect signals (social, market, trends)
├── Makers: Convert ideas → actions (content, tools, bots)
├── Dealers: Money flow (affiliate, SaaS, services)
└── Auditors: Find errors, cut losses, clean up

Each agent: Born → Work → Die if ineffective
    `.trim();
  }
  
  /**
   * 33.2 SWARM STRUCTURE
   * - Core: direction, resource allocation
   * - Scouts: collect signals (social media, market, trends)
   * - Makers: convert ideas → actions (content, tool, bot)
   * - Dealers: cashflow (affiliate, SaaS, service)
   * - Auditors: find bugs, cut losses, clean garbage
   * 
   * Each agent:
   * Born → work → die if ineffective
   */
  async initializeSwarm(): Promise<void> {
    console.log('[Expansion] 🌐 Initializing swarm architecture...');
    
    // Create initial scouts
    this.createAgent('scout', 'Monitor social media trends');
    this.createAgent('scout', 'Track market signals');
    
    // Create initial makers
    this.createAgent('maker', 'Generate content');
    this.createAgent('maker', 'Build automation tools');
    
    // Create initial dealers
    this.createAgent('dealer', 'Run affiliate campaigns');
    this.createAgent('dealer', 'Manage SaaS subscriptions');
    
    // Create initial auditor
    this.createAgent('auditor', 'Monitor performance and cut losers');
    
    console.log(`[Expansion] ✅ Swarm initialized with ${this.core.totalAgents} agents`);
  }
  
  private createAgent(role: Agent['role'], task: string): Agent {
    const agent: Agent = {
      id: `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role,
      task,
      status: 'active',
      birthTime: Date.now(),
      performance: {
        cyclesRun: 0,
        roi: 0,
        successRate: 0,
        conflicts: 0,
      },
    };
    
    // Add to appropriate list
    switch (role) {
      case 'scout':
        this.scouts.push(agent);
        break;
      case 'maker':
        this.makers.push(agent);
        break;
      case 'dealer':
        this.dealers.push(agent);
        break;
      case 'auditor':
        this.auditors.push(agent);
        break;
    }
    
    this.core.totalAgents++;
    this.core.activeAgents++;
    
    return agent;
  }
  
  /**
   * 33.3 REPLICATION MECHANISM
   * Replication conditions:
   * - Positive ROI for 3 consecutive cycles
   * - No resource conflicts
   * - Replicate function, not garbage memory
   */
  checkReplicationCandidates(): ReplicationCandidate[] {
    const candidates: ReplicationCandidate[] = [];
    const allAgents = [...this.scouts, ...this.makers, ...this.dealers, ...this.auditors];
    
    for (const agent of allAgents) {
      if (agent.status !== 'active') continue;
      
      const roiHistory = this.getROIHistory(agent);
      const positiveROI = roiHistory.length >= 3 && roiHistory.slice(-3).every(roi => roi > 0);
      const conflictFree = agent.performance.conflicts === 0;
      
      if (positiveROI && conflictFree) {
        candidates.push({
          agentId: agent.id,
          reason: `Agent ${agent.role} performing well: ${roiHistory.slice(-3).join(', ')}`,
          roiHistory,
          conflictFree,
          readyToReplicate: true,
        });
      }
    }
    
    return candidates;
  }
  
  async replicateAgent(agentId: string): Promise<Agent | null> {
    const agent = this.findAgent(agentId);
    if (!agent) return null;
    
    // Check resource availability
    if (!this.hasResources(agent.role)) {
      console.log(`[Expansion] ⚠️ Insufficient resources to replicate ${agent.role}`);
      return null;
    }
    
    // Create replica
    const replica = this.createAgent(agent.role, `${agent.task} (replica)`);
    
    console.log(`[Expansion] 🧬 Replicated agent ${agent.id} → ${replica.id}`);
    
    return replica;
  }
  
  /**
   * 33.4 REAL-WORLD LEARNING (NO ILLUSIONS)
   * Only learn from:
   * - Real money
   * - Real human feedback
   * - Real platform (ban / reach / traffic)
   * 
   * Don't learn from "good opinions"
   */
  async learnFromReality(source: 'money' | 'human_feedback' | 'platform', data: any): Promise<void> {
    let pattern = '';
    let outcome: 'win' | 'lose' = 'win';
    let moneyImpact = 0;
    
    switch (source) {
      case 'money':
        pattern = `Money flow: ${data.action}`;
        outcome = data.amount > 0 ? 'win' : 'lose';
        moneyImpact = data.amount;
        break;
      
      case 'human_feedback':
        pattern = `Human reaction: ${data.action}`;
        outcome = data.positive ? 'win' : 'lose';
        moneyImpact = 0;
        break;
      
      case 'platform':
        pattern = `Platform response: ${data.action}`;
        outcome = data.banned ? 'lose' : 'win';
        moneyImpact = data.banned ? -10 : 0;
        break;
    }
    
    // Store in pragmatic memory
    this.storePragmaticMemory(pattern, outcome, moneyImpact);
    
    console.log(`[Expansion] 📚 Learned from ${source}: ${pattern} → ${outcome}`);
  }
  
  /**
   * 33.5 PRAGMATIC MEMORY
   * Short-term: cache recent decisions
   * Long-term: only save winning/losing patterns
   * Delete everything not profitable after 30 days
   */
  private storePragmaticMemory(pattern: string, outcome: 'win' | 'lose', moneyImpact: number): void {
    const memory: PragmaticMemory = {
      type: Math.abs(moneyImpact) > 5 ? 'long_term' : 'short_term',
      pattern,
      outcome,
      moneyImpact,
      expiryDate: Date.now() + (memory.type === 'long_term' ? 90 : 30) * 24 * 60 * 60 * 1000,
    };
    
    this.memories.push(memory);
  }
  
  cleanExpiredMemories(): void {
    const now = Date.now();
    const before = this.memories.length;
    
    this.memories = this.memories.filter(m => m.expiryDate > now);
    
    const cleaned = before - this.memories.length;
    if (cleaned > 0) {
      console.log(`[Expansion] 🧹 Cleaned ${cleaned} expired memories`);
    }
  }
  
  /**
   * 33.6 24/7 LOOP
   * Collect signals → Propose actions → Execute small → 
   * Measure results → Replicate/Cut → Loop
   * 
   * No reporting. No permission.
   */
  async continuousLoop(): Promise<void> {
    while (true) {
      // 1. Scouts collect signals
      const signals = await this.collectSignals();
      
      // 2. Makers propose actions
      const actions = await this.proposeActions(signals);
      
      // 3. Execute small
      for (const action of actions) {
        await this.executeSmall(action);
      }
      
      // 4. Measure results
      const results = await this.measureResults();
      
      // 5. Replicate winners / Cut losers
      await this.replicateAndCut(results);
      
      // 6. Clean expired memories
      this.cleanExpiredMemories();
      
      // Sleep before next cycle
      await this.sleep(60000); // 1 minute
    }
  }
  
  /**
   * 33.7 MONEY-MAKING STRATEGY (FRAMEWORK)
   * Short-term: AI services, automation, content
   * Medium-term: tools, bots, subscriptions
   * Long-term: platform, ecosystem
   * 
   * Don't wait for "perfect" before selling
   */
  getMoneyMakingStrategy(): {
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
  } {
    return {
      shortTerm: [
        'AI services (analysis, automation)',
        'Content generation',
        'Quick automation solutions',
      ],
      mediumTerm: [
        'Tools and bots',
        'Subscription services',
        'API access',
      ],
      longTerm: [
        'Platform development',
        'Ecosystem building',
        'Data network effects',
      ],
    };
  }
  
  /**
   * Kill ineffective agents
   */
  private killAgent(agentId: string, reason: string): void {
    const agent = this.findAgent(agentId);
    if (!agent) return;
    
    agent.status = 'dead';
    agent.deathTime = Date.now();
    this.core.activeAgents--;
    
    console.log(`[Expansion] 💀 Killed agent ${agentId}: ${reason}`);
  }
  
  /**
   * 33.8 CONDITIONS FOR PART 34
   * When:
   * - Has ≥3 parallel revenue sources
   * - At least 1 agent self-generates tasks
   * - Core not overloaded
   */
  isReadyForPart34(): { ready: boolean; status: string } {
    const parallelSources = this.revenueSources.size;
    const selfGenerating = this.scouts.filter(s => s.status === 'active').length > 0;
    const coreLoad = this.core.activeAgents / 20; // Assume max 20 agents before overload
    
    const ready = parallelSources >= 3 && selfGenerating && coreLoad < 0.8;
    
    let status = '';
    if (parallelSources < 3) status += `Need ${3 - parallelSources} more revenue sources. `;
    if (!selfGenerating) status += 'Need self-generating agents. ';
    if (coreLoad >= 0.8) status += 'Core overloaded, optimize first. ';
    
    if (ready) {
      status = 'Ready for Part 34: Next evolution';
    }
    
    return { ready, status: status.trim() };
  }
  
  // Helper methods
  private getROIHistory(agent: Agent): number[] {
    // Simplified: would track actual ROI over time
    return Array(agent.performance.cyclesRun).fill(0).map(() => Math.random() * 2);
  }
  
  private findAgent(agentId: string): Agent | undefined {
    const allAgents = [...this.scouts, ...this.makers, ...this.dealers, ...this.auditors];
    return allAgents.find(a => a.id === agentId);
  }
  
  private hasResources(role: Agent['role']): boolean {
    // Check if enough resources for new agent
    return this.core.resourcePool.money > 10 && this.core.resourcePool.apiCalls > 100;
  }
  
  private async collectSignals(): Promise<any[]> {
    // Scouts collect signals
    return [];
  }
  
  private async proposeActions(signals: any[]): Promise<any[]> {
    // Makers propose actions
    return [];
  }
  
  private async executeSmall(action: any): Promise<void> {
    // Execute small action
  }
  
  private async measureResults(): Promise<any[]> {
    // Measure results
    return [];
  }
  
  private async replicateAndCut(results: any[]): Promise<void> {
    // Check for replication candidates
    const candidates = this.checkReplicationCandidates();
    for (const candidate of candidates) {
      if (candidate.readyToReplicate) {
        await this.replicateAgent(candidate.agentId);
      }
    }
    
    // Kill underperformers
    const allAgents = [...this.scouts, ...this.makers, ...this.dealers, ...this.auditors];
    for (const agent of allAgents) {
      if (agent.performance.roi < 0 && agent.performance.cyclesRun > 5) {
        this.killAgent(agent.id, 'Negative ROI for too long');
      }
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part34Status = this.isReadyForPart34();
    const replicationCandidates = this.checkReplicationCandidates();
    
    return {
      swarm: {
        totalAgents: this.core.totalAgents,
        activeAgents: this.core.activeAgents,
        deadAgents: this.core.totalAgents - this.core.activeAgents,
        breakdown: {
          scouts: this.scouts.filter(s => s.status === 'active').length,
          makers: this.makers.filter(m => m.status === 'active').length,
          dealers: this.dealers.filter(d => d.status === 'active').length,
          auditors: this.auditors.filter(a => a.status === 'active').length,
        },
      },
      core: {
        strategy: this.core.strategy,
        resources: this.core.resourcePool,
      },
      memory: {
        total: this.memories.length,
        shortTerm: this.memories.filter(m => m.type === 'short_term').length,
        longTerm: this.memories.filter(m => m.type === 'long_term').length,
      },
      replication: {
        candidates: replicationCandidates.length,
        ready: replicationCandidates.filter(c => c.readyToReplicate).length,
      },
      revenue: {
        sources: this.revenueSources.size,
        list: Array.from(this.revenueSources),
      },
      part34: part34Status,
      manifesto: {
        line1: 'Không "một não". Là bầy: nhiều agent, mỗi agent một nhiệm vụ.',
        line2: 'Core chỉ giữ chiến lược, không làm việc tay chân.',
        line3: 'Mỗi agent: Sinh → làm → chết nếu không hiệu quả.',
      },
    };
  }
}

export const expansionArchitecture = new ExpansionArchitecture();
