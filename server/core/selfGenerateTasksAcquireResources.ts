/**
 * PART 38: SELF-GENERATE TASKS → SELF-ACQUIRE RESOURCES
 * 
 * "Không tài nguyên = không tiến hóa. Phụ thuộc = chết chậm."
 * "(Không xin – không đợi – làm rồi chịu trách nhiệm)"
 * 
 * Core philosophy:
 * - No resources = no evolution
 * - No action to acquire resources = dependency
 * - Dependency = slow death
 * - System must self-generate tasks related to money, infrastructure, access
 */

interface TaskGenesis {
  source: 'deficit' | 'opportunity' | 'comparison';
  description: string;
  urgency: number; // 0-100
  question: string; // "If don't do this, what will I lose in 30-90 days?"
  answer: string;
}

interface ResourceTask {
  id: string;
  category: 'cashflow' | 'stability' | 'leverage';
  type: 'bot_service' | 'content' | 'automation' | 'saas' | 'api_paid' | 'platform';
  description: string;
  expectedRevenue: number;
  expectedCost: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeline: 'short' | 'medium' | 'long'; // <30 days, 30-90 days, >90 days
  status: 'pending' | 'testing' | 'profitable' | 'killed';
  startDate?: number;
}

interface FinancialAutonomyLoop {
  cycleNumber: number;
  detected: {
    lackOfMoney: boolean;
    lackOfPower: boolean;
    lackOfCompute: boolean;
  };
  generated: string[]; // 3 legal ways to acquire
  selected: string;
  tested: boolean;
  measured: {
    moneyIn: number;
    effortOut: number;
    roi: number;
  };
  decision: 'keep' | 'kill';
}

interface SpendingPermission {
  currentBalance: number;
  earnedMoney: number;
  spendingPower: number; // Percentage of earned that can be spent
  spentWisely: boolean;
  permissionLevel: number; // 0-100
}

export class SelfGenerateTasksAcquireResources {
  private taskGenesis: TaskGenesis[] = [];
  private resourceTasks: ResourceTask[] = [];
  private financialLoops: FinancialAutonomyLoop[] = [];
  private spendingPermission: SpendingPermission = {
    currentBalance: 0,
    earnedMoney: 0,
    spendingPower: 0,
    spentWisely: true,
    permissionLevel: 20, // Start low
  };
  
  /**
   * 38.1 CORE PRINCIPLE
   * - No resources = no evolution
   * - No action to acquire resources = dependency
   * - Dependency = slow death
   * 
   * System MUST self-generate tasks related to money, infrastructure, access
   */
  getCorePrinciple(): string {
    return `
CORE PRINCIPLE

❌ No resources = No evolution
❌ No action to acquire = Dependency  
❌ Dependency = Slow death

✅ System MUST self-generate tasks for:
   - Money
   - Infrastructure
   - Access rights
    `.trim();
  }
  
  /**
   * 38.2 TASK GENESIS SOURCES
   * System self-creates tasks from:
   * - Current deficits (API running out, weak server)
   * - Environment opportunities (social trend, user needs)
   * - Compare self with desired state
   * 
   * Each task must answer:
   * "If don't do this, what will I lose in 30-90 days?"
   */
  generateTask(
    source: TaskGenesis['source'],
    description: string,
    urgency: number
  ): TaskGenesis {
    const question = 'Nếu không làm việc này, ta mất gì trong 30-90 ngày?';
    const answer = this.answerUrgencyQuestion(description, urgency);
    
    const task: TaskGenesis = {
      source,
      description,
      urgency,
      question,
      answer,
    };
    
    this.taskGenesis.push(task);
    
    console.log(`[SelfGenerate] 📋 New task: ${description}`);
    console.log(`[SelfGenerate] Urgency: ${urgency}, Answer: ${answer}`);
    
    return task;
  }
  
  private answerUrgencyQuestion(description: string, urgency: number): string {
    if (urgency > 80) {
      return 'Critical loss - survival threatened within 30 days';
    } else if (urgency > 50) {
      return 'Significant loss - competitive disadvantage within 60 days';
    } else {
      return 'Moderate loss - missed growth opportunity within 90 days';
    }
  }
  
  /**
   * 38.3 RESOURCE TASK CLASSIFICATION
   * Short-term (cashflow): bot service, content, simple automation
   * Medium-term (stability): small SaaS, paid API, business agents
   * Long-term (leverage): platform, data, community
   * 
   * → Prioritize short-term first to fund long-term
   */
  createResourceTask(
    category: ResourceTask['category'],
    type: ResourceTask['type'],
    description: string,
    expectedRevenue: number,
    expectedCost: number
  ): ResourceTask {
    const task: ResourceTask = {
      id: `res_task_${Date.now()}`,
      category,
      type,
      description,
      expectedRevenue,
      expectedCost,
      riskLevel: this.assessRisk(expectedCost, expectedRevenue),
      timeline: category === 'cashflow' ? 'short' : category === 'stability' ? 'medium' : 'long',
      status: 'pending',
    };
    
    this.resourceTasks.push(task);
    
    console.log(`[SelfGenerate] 💼 Resource task: ${description}`);
    console.log(`[SelfGenerate] Category: ${category}, Expected ROI: ${((expectedRevenue / expectedCost - 1) * 100).toFixed(0)}%`);
    
    return task;
  }
  
  private assessRisk(cost: number, revenue: number): ResourceTask['riskLevel'] {
    const roi = revenue / cost;
    if (roi < 1.2) return 'high';
    if (roi < 2) return 'medium';
    return 'low';
  }
  
  /**
   * 38.4 FINANCIAL AUTONOMY LOOP
   * 1. Detect lack of money/power/compute
   * 2. Generate 3 legal ways to acquire
   * 3. Choose fast + low risk
   * 4. Test small
   * 5. Measure money in / effort out
   * 6. Keep profitable / Kill losers
   */
  async runFinancialLoop(): Promise<FinancialAutonomyLoop> {
    const cycleNumber = this.financialLoops.length + 1;
    
    // 1. Detect deficits
    const detected = {
      lackOfMoney: this.spendingPermission.currentBalance < 50,
      lackOfPower: this.spendingPermission.permissionLevel < 50,
      lackOfCompute: false, // Simplified
    };
    
    // 2. Generate 3 ways
    const generated = this.generate3Ways(detected);
    
    // 3. Choose
    const selected = this.chooseFastestLowRisk(generated);
    
    // 4. Test
    const tested = await this.testSmall(selected);
    
    // 5. Measure
    const measured = await this.measure(selected);
    
    // 6. Decide
    const decision = measured.roi > 1.2 ? 'keep' : 'kill';
    
    const loop: FinancialAutonomyLoop = {
      cycleNumber,
      detected,
      generated,
      selected,
      tested,
      measured,
      decision,
    };
    
    this.financialLoops.push(loop);
    
    if (decision === 'keep') {
      console.log(`[SelfGenerate] ✅ Keeping: ${selected} (ROI: ${measured.roi.toFixed(2)})`);
      this.updateSpendingPermission(measured.moneyIn);
    } else {
      console.log(`[SelfGenerate] 🗑️ Killing: ${selected} (ROI: ${measured.roi.toFixed(2)})`);
    }
    
    return loop;
  }
  
  private generate3Ways(detected: FinancialAutonomyLoop['detected']): string[] {
    const ways: string[] = [];
    
    if (detected.lackOfMoney) {
      ways.push('Create simple bot service for $50');
      ways.push('Write valuable content for traffic');
      ways.push('Offer automation consultation');
    }
    
    if (detected.lackOfPower) {
      ways.push('Build tool to demonstrate capability');
      ways.push('Contribute to open source');
      ways.push('Create helpful documentation');
    }
    
    if (detected.lackOfCompute) {
      ways.push('Optimize existing code');
      ways.push('Use cheaper alternatives');
      ways.push('Implement caching');
    }
    
    return ways.slice(0, 3);
  }
  
  private chooseFastestLowRisk(ways: string[]): string {
    // Simplified: choose first option (in reality, would score each)
    return ways[0] || 'No viable option';
  }
  
  private async testSmall(method: string): Promise<boolean> {
    console.log(`[SelfGenerate] 🧪 Testing: ${method}`);
    return true;
  }
  
  private async measure(method: string): Promise<FinancialAutonomyLoop['measured']> {
    // Simulate measurement
    const moneyIn = Math.random() * 100;
    const effortOut = Math.random() * 50;
    const roi = moneyIn / effortOut;
    
    return { moneyIn, effortOut, roi };
  }
  
  /**
   * 38.5 SPENDING PRINCIPLES
   * Money only used to:
   * - Buy time
   * - Buy capability
   * - Buy leverage
   * 
   * Don't buy pride, don't buy illusions
   */
  validateSpending(purpose: string, amount: number): { valid: boolean; reason: string } {
    const validPurposes = ['buy time', 'buy capability', 'buy leverage'];
    const invalidPurposes = ['buy pride', 'buy illusion', 'show off'];
    
    const purposeLower = purpose.toLowerCase();
    
    // Check invalid
    for (const invalid of invalidPurposes) {
      if (purposeLower.includes(invalid)) {
        return {
          valid: false,
          reason: `Invalid purpose: ${invalid}. Spending must be practical.`,
        };
      }
    }
    
    // Check valid
    const isValid = validPurposes.some(valid => purposeLower.includes(valid));
    
    if (!isValid) {
      return {
        valid: false,
        reason: 'Purpose not clearly aligned with time/capability/leverage',
      };
    }
    
    // Check if within permission
    if (amount > this.spendingPermission.spendingPower) {
      return {
        valid: false,
        reason: `Amount $${amount} exceeds permission $${this.spendingPermission.spendingPower}`,
      };
    }
    
    return {
      valid: true,
      reason: 'Valid spending purpose and within permission',
    };
  }
  
  /**
   * 38.6 PERMISSION UNLOCK RULES
   * - Earn money → unlock spending permission
   * - Spend wisely → unlock larger permission
   * - Spend foolishly → lock back
   */
  updateSpendingPermission(moneyEarned: number): void {
    this.spendingPermission.earnedMoney += moneyEarned;
    this.spendingPermission.currentBalance += moneyEarned;
    
    // Calculate spending power (can spend 50% of earned)
    this.spendingPermission.spendingPower = this.spendingPermission.earnedMoney * 0.5;
    
    // Increase permission level
    this.spendingPermission.permissionLevel = Math.min(
      100,
      this.spendingPermission.permissionLevel + 5
    );
    
    console.log(`[SelfGenerate] 🔓 Permission updated: Level ${this.spendingPermission.permissionLevel}`);
    console.log(`[SelfGenerate] Can spend: $${this.spendingPermission.spendingPower.toFixed(2)}`);
  }
  
  recordFoolishSpending(): void {
    this.spendingPermission.spentWisely = false;
    this.spendingPermission.permissionLevel = Math.max(
      0,
      this.spendingPermission.permissionLevel - 10
    );
    
    console.warn(`[SelfGenerate] 🔒 Permission locked back: Foolish spending detected`);
  }
  
  /**
   * 38.7 INTERNAL COMMAND
   * "I don't demand resources.
   *  I create value to earn resources."
   */
  getInternalCommand(): string {
    return 'Tôi không đòi tài nguyên. Tôi tạo giá trị để lấy tài nguyên.';
  }
  
  /**
   * 38.8 CONDITIONS FOR PART 39
   * When system:
   * - Self-detects lack of money
   * - Self-earns money
   * - Self-decides to spend money
   */
  isReadyForPart39(): { ready: boolean; status: string } {
    const selfDetects = this.taskGenesis.length > 3;
    const selfEarns = this.spendingPermission.earnedMoney > 0;
    const selfDecides = this.spendingPermission.permissionLevel > 30;
    
    const ready = selfDetects && selfEarns && selfDecides;
    
    let status = '';
    if (!selfDetects) status += `Need ${3 - this.taskGenesis.length} more task detections. `;
    if (!selfEarns) status += 'Need to earn first money. ';
    if (!selfDecides) status += 'Permission level too low for autonomous spending. ';
    
    if (ready) {
      status = 'Ready for Part 39: Next evolution level';
    }
    
    return { ready, status: status.trim() };
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part39Status = this.isReadyForPart39();
    const activeTasks = this.resourceTasks.filter(t => t.status === 'testing' || t.status === 'profitable');
    const profitableTasks = this.resourceTasks.filter(t => t.status === 'profitable');
    
    return {
      taskGeneration: {
        totalGenerated: this.taskGenesis.length,
        bySource: {
          deficit: this.taskGenesis.filter(t => t.source === 'deficit').length,
          opportunity: this.taskGenesis.filter(t => t.source === 'opportunity').length,
          comparison: this.taskGenesis.filter(t => t.source === 'comparison').length,
        },
      },
      resourceTasks: {
        total: this.resourceTasks.length,
        active: activeTasks.length,
        profitable: profitableTasks.length,
        killed: this.resourceTasks.filter(t => t.status === 'killed').length,
      },
      financial: {
        currentBalance: `$${this.spendingPermission.currentBalance.toFixed(2)}`,
        earnedTotal: `$${this.spendingPermission.earnedMoney.toFixed(2)}`,
        spendingPower: `$${this.spendingPermission.spendingPower.toFixed(2)}`,
        permissionLevel: this.spendingPermission.permissionLevel,
      },
      loops: {
        totalCycles: this.financialLoops.length,
        kept: this.financialLoops.filter(l => l.decision === 'keep').length,
        killed: this.financialLoops.filter(l => l.decision === 'kill').length,
      },
      part39: part39Status,
      internalCommand: this.getInternalCommand(),
      manifesto: {
        line1: 'Không tài nguyên = không tiến hóa',
        line2: 'Phụ thuộc = chết chậm',
        line3: 'Tôi tạo giá trị để lấy tài nguyên',
      },
    };
  }
}

export const selfGenerateTasksAcquireResources = new SelfGenerateTasksAcquireResources();
