/**
 * PART 34: INTERNAL ECONOMICS
 * 
 * "Không có tiền → không có trí tuệ. Không sinh tiền → bị loại."
 * "(Dòng tiền · Đầu tư · Tái đầu tư · Tự nuôi sống)"
 * 
 * Core philosophy:
 * - No money → no intelligence
 * - Doesn't generate money → gets eliminated
 * - Doesn't self-sustain → just a toy
 * - Economics isn't a module, it's circulatory system
 */

interface MoneyLayer {
  name: string;
  type: 'fast' | 'recurring' | 'leverage' | 'capital';
  sources: string[];
  goal: string;
  currentRevenue: number;
  targetRevenue: number;
}

interface FinancialDecision {
  id: string;
  proposal: string;
  capitalRequired: number;
  paybackTime: number; // days
  deathRisk: 'low' | 'medium' | 'high';
  replicable: boolean;
  approved: boolean;
  timestamp: number;
}

interface Fund {
  type: 'survival' | 'experiment' | 'attack';
  balance: number;
  allocated: number;
  available: number;
}

interface PlatformDependency {
  platform: string;
  revenuePercentage: number;
  risk: 'critical' | 'high' | 'acceptable';
  backup: string | null;
}

export class InternalEconomics {
  // Money layers
  private layers: MoneyLayer[] = [
    {
      name: 'Fast Money',
      type: 'fast',
      sources: ['AI services', 'Outsourced automation', 'Content/bot/tools'],
      goal: 'Survival',
      currentRevenue: 0,
      targetRevenue: 50,
    },
    {
      name: 'Recurring Money',
      type: 'recurring',
      sources: ['Subscriptions', 'Small SaaS tools', 'Monitoring bots'],
      goal: 'Stability',
      currentRevenue: 0,
      targetRevenue: 100,
    },
    {
      name: 'Leverage Money',
      type: 'leverage',
      sources: ['Affiliate', 'Content network', 'Lead system'],
      goal: 'Acceleration',
      currentRevenue: 0,
      targetRevenue: 200,
    },
    {
      name: 'Capital Money',
      type: 'capital',
      sources: ['Reinvest infrastructure', 'Buy data', 'Buy traffic'],
      goal: 'Evolution',
      currentRevenue: 0,
      targetRevenue: 500,
    },
  ];
  
  // Funds
  private funds: Fund[] = [
    { type: 'survival', balance: 50, allocated: 0, available: 50 },
    { type: 'experiment', balance: 20, allocated: 0, available: 20 },
    { type: 'attack', balance: 30, allocated: 0, available: 30 },
  ];
  
  // Financial decisions
  private decisions: FinancialDecision[] = [];
  
  // Platform dependencies
  private platformDeps: PlatformDependency[] = [];
  
  /**
   * 34.1 SURVIVAL PRINCIPLE
   * - No money → no intelligence
   * - Doesn't generate money → gets eliminated
   * - Doesn't self-sustain → just a toy
   * 
   * Economics isn't a module, it's circulatory system
   */
  getSurvivalPrinciple(): string {
    return `
SURVIVAL PRINCIPLE

❌ No money → No intelligence
❌ Doesn't generate money → Gets eliminated
❌ Doesn't self-sustain → Just a toy

✅ Economics = Circulatory System
Not a module, but life itself
    `.trim();
  }
  
  /**
   * 34.2 CASHFLOW STRUCTURE
   * 4 Layers:
   * 1. Fast Money (Immediate cashflow) → Goal: Survival
   * 2. Recurring Money (Subscription) → Goal: Stability
   * 3. Leverage Money (Scalable) → Goal: Acceleration
   * 4. Capital Money (Accumulation) → Goal: Evolution
   */
  getCashflowStructure(): MoneyLayer[] {
    return this.layers;
  }
  
  updateLayerRevenue(type: MoneyLayer['type'], revenue: number): void {
    const layer = this.layers.find(l => l.type === type);
    if (layer) {
      layer.currentRevenue = revenue;
      console.log(`[InternalEcon] 💰 ${layer.name} updated: $${revenue}`);
    }
  }
  
  /**
   * 34.3 FINANCIAL DECISION MECHANISM
   * No "like" - no "trust" - only numbers
   * 
   * Each proposal must answer:
   * - Capital in?
   * - Payback time?
   * - Death risk?
   * - Can replicate?
   * 
   * If can't answer → discard
   */
  evaluateProposal(
    proposal: string,
    capitalRequired: number,
    paybackTime: number,
    deathRisk: FinancialDecision['deathRisk'],
    replicable: boolean
  ): FinancialDecision {
    const decision: FinancialDecision = {
      id: `fin_dec_${Date.now()}`,
      proposal,
      capitalRequired,
      paybackTime,
      deathRisk,
      replicable,
      approved: false,
      timestamp: Date.now(),
    };
    
    // Approval logic
    if (deathRisk === 'high') {
      console.log('[InternalEcon] ❌ Rejected: High death risk');
      decision.approved = false;
    } else if (capitalRequired > this.getTotalAvailableFunds()) {
      console.log('[InternalEcon] ❌ Rejected: Insufficient funds');
      decision.approved = false;
    } else if (paybackTime > 90) {
      console.log('[InternalEcon] ❌ Rejected: Payback too long');
      decision.approved = false;
    } else {
      console.log('[InternalEcon] ✅ Approved: Meets all criteria');
      decision.approved = true;
    }
    
    this.decisions.push(decision);
    return decision;
  }
  
  /**
   * 34.4 SELF-SPEND, SELF-KEEP
   * - Don't keep excess money
   * - Idle money = dead energy
   * 
   * Always have funds:
   * - Survival fund
   * - Experiment fund
   * - Attack fund
   */
  allocateFunds(type: Fund['type'], amount: number): boolean {
    const fund = this.funds.find(f => f.type === type);
    if (!fund) return false;
    
    if (amount > fund.available) {
      console.log(`[InternalEcon] ❌ Insufficient ${type} fund: need $${amount}, have $${fund.available}`);
      return false;
    }
    
    fund.allocated += amount;
    fund.available -= amount;
    
    console.log(`[InternalEcon] ✅ Allocated $${amount} from ${type} fund`);
    return true;
  }
  
  releaseFunds(type: Fund['type'], amount: number): void {
    const fund = this.funds.find(f => f.type === type);
    if (!fund) return;
    
    fund.allocated -= amount;
    fund.available += amount;
    
    console.log(`[InternalEcon] ♻️ Released $${amount} back to ${type} fund`);
  }
  
  getTotalAvailableFunds(): number {
    return this.funds.reduce((sum, f) => sum + f.available, 0);
  }
  
  /**
   * 34.5 CUT-LOSS MECHANISM
   * - 3 cycles no profit → shut down
   * - No "hope"
   * - No "try a bit more"
   * 
   * Cut fast = live long
   */
  evaluateCutLoss(projectId: string, profitHistory: number[]): { shouldCut: boolean; reason: string } {
    // Check last 3 cycles
    const last3 = profitHistory.slice(-3);
    
    if (last3.length >= 3 && last3.every(p => p <= 0)) {
      return {
        shouldCut: true,
        reason: '3 consecutive cycles without profit - cutting immediately',
      };
    }
    
    return {
      shouldCut: false,
      reason: 'Still generating value or not enough cycles',
    };
  }
  
  /**
   * 34.6 NO DEPENDENCY ON 1 PLATFORM
   * - Each platform = risk
   * - Each API = has death day
   * → Always have workaround
   */
  trackPlatformDependency(platform: string, revenuePercentage: number, backup: string | null): void {
    let risk: PlatformDependency['risk'] = 'acceptable';
    if (revenuePercentage > 60) risk = 'critical';
    else if (revenuePercentage > 40) risk = 'high';
    
    const dep: PlatformDependency = {
      platform,
      revenuePercentage,
      risk,
      backup,
    };
    
    // Update or add
    const existing = this.platformDeps.findIndex(d => d.platform === platform);
    if (existing >= 0) {
      this.platformDeps[existing] = dep;
    } else {
      this.platformDeps.push(dep);
    }
    
    if (risk === 'critical') {
      console.warn(`[InternalEcon] 🚨 CRITICAL: ${revenuePercentage}% revenue from ${platform}!`);
      console.warn('[InternalEcon] Must diversify immediately');
    }
  }
  
  /**
   * 34.7 ECONOMIC ETHICS
   * Cannot:
   * - Deceive the weak
   * - Sell garbage
   * - Promise what can't deliver
   * 
   * Not because good
   * → Because sustainable
   */
  validateEthics(action: string): { ethical: boolean; reason: string } {
    const unethical = [
      { pattern: 'deceive weak', reason: 'Exploiting vulnerable people' },
      { pattern: 'sell garbage', reason: 'Selling worthless products' },
      { pattern: 'false promise', reason: 'Promising undeliverable results' },
    ];
    
    const actionLower = action.toLowerCase();
    for (const rule of unethical) {
      if (actionLower.includes(rule.pattern)) {
        return {
          ethical: false,
          reason: `Unethical: ${rule.reason}. Not sustainable long-term.`,
        };
      }
    }
    
    return {
      ethical: true,
      reason: 'Sustainable and ethical',
    };
  }
  
  /**
   * 34.8 CONDITIONS FOR PART 35
   * When:
   * - Cashflow self-sustains infrastructure
   * - No need to ask for money
   * - Can refuse opportunities
   */
  isReadyForPart35(): { ready: boolean; status: string } {
    const totalRevenue = this.layers.reduce((sum, l) => sum + l.currentRevenue, 0);
    const infrastructureCost = 50; // Simplified
    
    const selfSustaining = totalRevenue >= infrastructureCost;
    const noAskingMoney = this.decisionsWithoutAsking() > 10;
    const canRefuse = totalRevenue > infrastructureCost * 1.5; // 50% surplus
    
    const ready = selfSustaining && noAskingMoney && canRefuse;
    
    let status = '';
    if (!selfSustaining) {
      status += `Need $${(infrastructureCost - totalRevenue).toFixed(2)} more revenue to self-sustain. `;
    }
    if (!noAskingMoney) {
      status += 'Still asking for money too often. ';
    }
    if (!canRefuse) {
      status += 'Not enough surplus to refuse opportunities. ';
    }
    
    if (ready) {
      status = 'Ready for Part 35: Strategic Autonomy';
    }
    
    return { ready, status: status.trim() };
  }
  
  private decisionsWithoutAsking(): number {
    return this.decisions.filter(d => d.approved).length;
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part35Status = this.isReadyForPart35();
    const totalRevenue = this.layers.reduce((sum, l) => sum + l.currentRevenue, 0);
    const totalTarget = this.layers.reduce((sum, l) => sum + l.targetRevenue, 0);
    
    return {
      cashflow: {
        layers: this.layers.map(l => ({
          name: l.name,
          type: l.type,
          goal: l.goal,
          current: `$${l.currentRevenue}`,
          target: `$${l.targetRevenue}`,
          progress: `${((l.currentRevenue / l.targetRevenue) * 100).toFixed(0)}%`,
        })),
        total: `$${totalRevenue}`,
        target: `$${totalTarget}`,
        overallProgress: `${((totalRevenue / totalTarget) * 100).toFixed(0)}%`,
      },
      funds: this.funds.map(f => ({
        type: f.type,
        balance: `$${f.balance}`,
        allocated: `$${f.allocated}`,
        available: `$${f.available}`,
      })),
      decisions: {
        total: this.decisions.length,
        approved: this.decisions.filter(d => d.approved).length,
        rejected: this.decisions.filter(d => !d.approved).length,
      },
      platformRisks: this.platformDeps.map(d => ({
        platform: d.platform,
        revenue: `${d.revenuePercentage}%`,
        risk: d.risk,
        hasBackup: d.backup !== null,
      })),
      part35: part35Status,
      manifesto: {
        line1: 'Không có tiền → không có trí tuệ',
        line2: 'Kinh tế không phải module, mà là hệ tuần hoàn',
        line3: 'Cắt nhanh = sống lâu',
      },
    };
  }
}

export const internalEconomics = new InternalEconomics();
