/**
 * PART 42: SELF-EARN MONEY & SELF-SUSTAIN SYSTEM (NODE/RENDER/24-7)
 * 
 * Philosophy:
 * - "Tiền = nhiên liệu, không phải mục đích"
 * - "Test nhanh, cắt nhanh"
 * - Money as fuel, not purpose
 * 
 * Core Principles:
 * - Small, steady, low-risk cashflow
 * - Don't burn money learning stupidly
 * - Kill non-performing revenue streams fast
 * - Run 24/7 on Node (not Python)
 */

export interface RevenueChannel {
  id: string;
  type: 'content_affiliate' | 'micro_tool' | 'service' | 'data_service';
  name: string;
  description: string;
  status: 'testing' | 'active' | 'paused' | 'killed';
  launchedAt: number;
  kpis: {
    revenuePerHour: number;
    costPerCustomer: number;
    totalRevenue: number;
    totalCost: number;
    roi: number; // Return on investment
  };
  killCriteria: {
    minRevenuePerHour: number;
    maxCostPerCustomer: number;
    minROI: number;
  };
  failedCycles: number; // Consecutive cycles not meeting KPIs
}

export interface SpendingRecord {
  timestamp: number;
  amount: number;
  purpose: string;
  expectedROI: number;
  actualROI?: number;
  daysTracked: number;
}

export interface MoneyMakingIdea {
  id: string;
  description: string;
  estimatedBuildHours: number;
  estimatedRevenue: number;
  estimatedCost: number;
  risk: 'low' | 'medium' | 'high';
  priority: number;
}

export interface AutomationWorker {
  name: string;
  task: 'post_content' | 'check_links' | 'send_reports' | 'monitor_health';
  intervalMs: number;
  lastRun: number;
  successCount: number;
  failureCount: number;
  active: boolean;
}

export class SelfEarnMoneySustainSystem {
  private revenueChannels: RevenueChannel[];
  private spendingRecords: SpendingRecord[];
  private dailySpendingCap: number;
  private todaySpending: number;
  private lastResetDate: string;
  private workers: AutomationWorker[];
  private systemStartTime: number;

  constructor(dailySpendingCap: number = 10) {
    this.revenueChannels = [];
    this.spendingRecords = [];
    this.dailySpendingCap = dailySpendingCap;
    this.todaySpending = 0;
    this.lastResetDate = new Date().toISOString().split('T')[0];
    this.workers = [];
    this.systemStartTime = Date.now();
    
    this.initializeWorkers();
  }

  /**
   * 42.2. CÁC KÊNH KIẾM TIỀN KHỞI ĐỘNG
   * Startup revenue channels (auto-friendly)
   */
  public getStartupRevenueChannels(): MoneyMakingIdea[] {
    return [
      {
        id: 'content-affiliate',
        description: 'Content → Affiliate (short posts with links)',
        estimatedBuildHours: 4,
        estimatedRevenue: 50,
        estimatedCost: 5,
        risk: 'low',
        priority: 90,
      },
      {
        id: 'micro-tool',
        description: 'Micro-tool API (summarize, notify, scrape legally)',
        estimatedBuildHours: 24,
        estimatedRevenue: 100,
        estimatedCost: 10,
        risk: 'medium',
        priority: 80,
      },
      {
        id: 'service-automation',
        description: 'Service automation (inbox/CSKH replies)',
        estimatedBuildHours: 16,
        estimatedRevenue: 200,
        estimatedCost: 20,
        risk: 'medium',
        priority: 85,
      },
      {
        id: 'data-service',
        description: 'Data-as-a-Service (public data aggregation)',
        estimatedBuildHours: 48,
        estimatedRevenue: 300,
        estimatedCost: 30,
        risk: 'medium',
        priority: 70,
      },
    ];
  }

  /**
   * 42.3. VÒNG LẶP KIẾM TIỀN
   * Money-making loop: Idea → Build (≤48h) → Publish → Measure → Kill/Scale
   */
  public async launchRevenueChannel(idea: MoneyMakingIdea): Promise<{
    launched: boolean;
    channel?: RevenueChannel;
    reason?: string;
  }> {
    // Check if build time exceeds 48 hours
    if (idea.estimatedBuildHours > 48) {
      return {
        launched: false,
        reason: 'Build time exceeds 48h limit - break into smaller pieces',
      };
    }

    // Check risk
    if (idea.risk === 'high') {
      return {
        launched: false,
        reason: 'Risk too high for autonomous launch',
      };
    }

    // Create revenue channel
    const channel: RevenueChannel = {
      id: `channel-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      type: idea.id.includes('content') ? 'content_affiliate' :
            idea.id.includes('tool') ? 'micro_tool' :
            idea.id.includes('service') ? 'service' : 'data_service',
      name: idea.description,
      description: idea.description,
      status: 'testing',
      launchedAt: Date.now(),
      kpis: {
        revenuePerHour: 0,
        costPerCustomer: 0,
        totalRevenue: 0,
        totalCost: idea.estimatedCost,
        roi: 0,
      },
      killCriteria: {
        minRevenuePerHour: 0.5, // $0.5/hour minimum
        maxCostPerCustomer: 10, // Max $10 per customer
        minROI: 1.5, // 150% ROI minimum
      },
      failedCycles: 0,
    };

    this.revenueChannels.push(channel);

    return {
      launched: true,
      channel,
    };
  }

  /**
   * Measure channel performance and kill if not meeting KPIs
   */
  public async measureAndOptimizeChannels(): Promise<{
    active: number;
    killed: number;
    killedChannels: string[];
  }> {
    const killedChannels: string[] = [];

    for (const channel of this.revenueChannels) {
      if (channel.status === 'killed') continue;

      // Check KPIs
      const meetsKPIs = this.channelMeetsKPIs(channel);

      if (!meetsKPIs) {
        channel.failedCycles++;

        // Kill after 2 failed cycles (as per requirement)
        if (channel.failedCycles >= 2) {
          channel.status = 'killed';
          killedChannels.push(channel.name);
          console.log(`[Revenue] Killed channel: ${channel.name} - Failed KPIs for 2 cycles`);
        }
      } else {
        // Reset failed cycles if performing well
        channel.failedCycles = 0;
        if (channel.status === 'testing') {
          channel.status = 'active';
        }
      }
    }

    const active = this.revenueChannels.filter(c => c.status === 'active' || c.status === 'testing').length;

    return {
      active,
      killed: killedChannels.length,
      killedChannels,
    };
  }

  private channelMeetsKPIs(channel: RevenueChannel): boolean {
    const { kpis, killCriteria } = channel;

    // Must meet all criteria
    if (kpis.revenuePerHour < killCriteria.minRevenuePerHour) return false;
    if (kpis.costPerCustomer > killCriteria.maxCostPerCustomer) return false;
    if (kpis.roi < killCriteria.minROI) return false;

    return true;
  }

  /**
   * 42.4. QUẢN TRỊ CHI TIÊU
   * Spending management with daily cap
   */
  public async requestSpending(
    amount: number,
    purpose: string,
    expectedROI: number
  ): Promise<{
    approved: boolean;
    reason?: string;
    recordId?: string;
  }> {
    // Reset daily spending if new day
    this.resetDailySpendingIfNewDay();

    // Check daily cap
    if (this.todaySpending + amount > this.dailySpendingCap) {
      return {
        approved: false,
        reason: `Exceeds daily spending cap ($${this.dailySpendingCap}). Already spent $${this.todaySpending} today.`,
      };
    }

    // Check expected ROI
    if (expectedROI < 1.5) {
      return {
        approved: false,
        reason: 'Expected ROI below 1.5x threshold',
      };
    }

    // Approve spending
    const record: SpendingRecord = {
      timestamp: Date.now(),
      amount,
      purpose,
      expectedROI,
      daysTracked: 0,
    };

    this.spendingRecords.push(record);
    this.todaySpending += amount;

    return {
      approved: true,
      recordId: `spend-${record.timestamp}`,
    };
  }

  /**
   * Track ROI for spending and auto-stop negative ROI after 7 days
   */
  public async trackSpendingROI(): Promise<{
    stopCount: number;
    stoppedPurposes: string[];
  }> {
    const stoppedPurposes: string[] = [];
    const now = Date.now();

    for (const record of this.spendingRecords) {
      // Update days tracked
      const daysPassed = Math.floor((now - record.timestamp) / (1000 * 60 * 60 * 24));
      record.daysTracked = daysPassed;

      // Check if ROI is negative after 7 days
      if (daysPassed >= 7 && record.actualROI !== undefined) {
        if (record.actualROI < 0) {
          // Auto-stop this spending category
          stoppedPurposes.push(record.purpose);
          console.log(`[Spending] Auto-stopped: ${record.purpose} - Negative ROI after 7 days`);
        }
      }
    }

    return {
      stopCount: stoppedPurposes.length,
      stoppedPurposes,
    };
  }

  private resetDailySpendingIfNewDay(): void {
    const today = new Date().toISOString().split('T')[0];
    if (today !== this.lastResetDate) {
      this.todaySpending = 0;
      this.lastResetDate = today;
    }
  }

  /**
   * 42.5. TỰ ĐỘNG HÓA NODE
   * Node automation with internal cron (setInterval/queue)
   */
  private initializeWorkers(): void {
    this.workers = [
      {
        name: 'Content Poster',
        task: 'post_content',
        intervalMs: 60 * 60 * 1000, // Every hour
        lastRun: 0,
        successCount: 0,
        failureCount: 0,
        active: true,
      },
      {
        name: 'Link Checker',
        task: 'check_links',
        intervalMs: 30 * 60 * 1000, // Every 30 min
        lastRun: 0,
        successCount: 0,
        failureCount: 0,
        active: true,
      },
      {
        name: 'Report Sender',
        task: 'send_reports',
        intervalMs: 24 * 60 * 60 * 1000, // Daily
        lastRun: 0,
        successCount: 0,
        failureCount: 0,
        active: true,
      },
      {
        name: 'Health Monitor',
        task: 'monitor_health',
        intervalMs: 5 * 60 * 1000, // Every 5 min
        lastRun: 0,
        successCount: 0,
        failureCount: 0,
        active: true,
      },
    ];
  }

  public startWorkers(): void {
    for (const worker of this.workers) {
      if (!worker.active) continue;

      setInterval(async () => {
        try {
          await this.executeWorkerTask(worker);
          worker.successCount++;
          worker.lastRun = Date.now();
        } catch (error) {
          worker.failureCount++;
          console.error(`[Worker Error] ${worker.name}:`, error);
          
          // Retry with backoff
          setTimeout(async () => {
            try {
              await this.executeWorkerTask(worker);
              worker.successCount++;
            } catch (retryError) {
              console.error(`[Worker Retry Failed] ${worker.name}:`, retryError);
            }
          }, 5000); // 5s backoff
        }
      }, worker.intervalMs);
    }
  }

  private async executeWorkerTask(worker: AutomationWorker): Promise<void> {
    // Placeholder for actual task execution
    // In production, this would perform real work
    switch (worker.task) {
      case 'post_content':
        // Post content to platforms
        break;
      case 'check_links':
        // Check affiliate links
        break;
      case 'send_reports':
        // Send daily/weekly reports
        break;
      case 'monitor_health':
        // Monitor system health
        break;
    }
  }

  /**
   * 42.6. KỶ LUẬT & ĐẠO ĐỨC
   * Discipline & ethics check
   */
  public validateEthics(action: {
    type: string;
    description: string;
  }): {
    allowed: boolean;
    reason?: string;
  } {
    // Check for spam
    if (action.description.toLowerCase().includes('spam') ||
        action.description.toLowerCase().includes('bulk send')) {
      return {
        allowed: false,
        reason: 'Spam detected - violates ethics policy',
      };
    }

    // Check for deception
    if (action.description.toLowerCase().includes('fake') ||
        action.description.toLowerCase().includes('lie') ||
        action.description.toLowerCase().includes('deceive')) {
      return {
        allowed: false,
        reason: 'Deception detected - violates ethics policy',
      };
    }

    // Check for platform violations
    if (action.description.toLowerCase().includes('violate') ||
        action.description.toLowerCase().includes('bypass tos')) {
      return {
        allowed: false,
        reason: 'Platform violation detected - long-term survival > short-term gain',
      };
    }

    return { allowed: true };
  }

  /**
   * 42.7. ĐIỀU KIỆN SANG PHẦN 43
   * Check readiness for Part 43
   */
  public checkReadinessForPart43(): {
    ready: boolean;
    checklist: {
      hasFirstDollar: boolean;
      systemRunning7Days: boolean;
      clearLogs: boolean;
    };
  } {
    const totalRevenue = this.revenueChannels.reduce(
      (sum, ch) => sum + ch.kpis.totalRevenue,
      0
    );
    
    const uptimeDays = (Date.now() - this.systemStartTime) / (1000 * 60 * 60 * 24);
    
    const checklist = {
      hasFirstDollar: totalRevenue > 0,
      systemRunning7Days: uptimeDays >= 7,
      clearLogs: this.spendingRecords.length > 0 && this.workers.length > 0,
    };

    return {
      ready: Object.values(checklist).every(v => v),
      checklist,
    };
  }

  /**
   * Get system state for monitoring
   */
  public getSystemState(): {
    uptimeDays: number;
    totalRevenue: number;
    totalCost: number;
    netProfit: number;
    activeChannels: number;
    todaySpending: number;
    dailySpendingCap: number;
    workers: AutomationWorker[];
    topChannels: RevenueChannel[];
  } {
    const totalRevenue = this.revenueChannels.reduce(
      (sum, ch) => sum + ch.kpis.totalRevenue,
      0
    );
    
    const totalCost = this.revenueChannels.reduce(
      (sum, ch) => sum + ch.kpis.totalCost,
      0
    );

    const uptimeDays = (Date.now() - this.systemStartTime) / (1000 * 60 * 60 * 24);

    return {
      uptimeDays,
      totalRevenue,
      totalCost,
      netProfit: totalRevenue - totalCost,
      activeChannels: this.revenueChannels.filter(
        c => c.status === 'active' || c.status === 'testing'
      ).length,
      todaySpending: this.todaySpending,
      dailySpendingCap: this.dailySpendingCap,
      workers: this.workers,
      topChannels: this.revenueChannels
        .filter(c => c.status === 'active')
        .sort((a, b) => b.kpis.revenuePerHour - a.kpis.revenuePerHour)
        .slice(0, 5),
    };
  }
}

// Singleton instance
export const selfEarnMoneySustainSystem = new SelfEarnMoneySustainSystem();
