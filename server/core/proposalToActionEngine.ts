/**
 * Proposal-to-Action Engine
 * 
 * RULE: Every proposal MUST lead to REAL action.
 * NO "suggest to user" - the system DOES IT.
 * 
 * Flow: detect_opportunity() → estimate_value() → decide_execute() → execute() → observe_outcome() → learn()
 * 
 * If 3 consecutive cycles without action → system error
 */

import { logger } from '../services/logger';
import { financialCore } from './financialCore';
import { actionsEngine, type Action, type ActionResult } from './actionsEngine';
import { emotionalCore } from './emotionalCore';
import { memoryBridge } from './memory';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface Opportunity {
  id: string;
  type: 'revenue' | 'cost_reduction' | 'capability_expansion' | 'risk_mitigation';
  description: string;
  estimatedValue: number; // USD or impact score
  estimatedCost: number; // USD
  estimatedTime: number; // minutes
  risk: 'low' | 'medium' | 'high';
  detectedAt: string;
  confidence: number; // 0.0 to 1.0
}

export interface Proposal {
  id: string;
  opportunity: Opportunity;
  proposedAction: Action;
  reasoning: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'blocked';
  blockReason?: string;
  executionResult?: ActionResult;
  completedAt?: string;
}

export interface ProposalToActionState {
  proposals: Proposal[];
  consecutiveNoActionCycles: number;
  totalProposalsGenerated: number;
  totalActionsExecuted: number;
  totalActionsSucceeded: number;
  totalActionsFailed: number;
  lastActionAt: string | null;
}

// ================================================
// PROPOSAL-TO-ACTION ENGINE
// ================================================

class ProposalToActionEngine {
  private state: ProposalToActionState;
  private readonly MAX_NO_ACTION_CYCLES = 3;
  private readonly STATE_FILE = './data/proposal_to_action_state.json';

  constructor() {
    this.state = {
      proposals: [],
      consecutiveNoActionCycles: 0,
      totalProposalsGenerated: 0,
      totalActionsExecuted: 0,
      totalActionsSucceeded: 0,
      totalActionsFailed: 0,
      lastActionAt: null,
    };

    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
      }
    } catch (error) {
      logger.error(`[ProposalToAction] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[ProposalToAction] Failed to save state: ${error}`);
    }
  }

  /**
   * Main cycle - detect opportunities and execute actions
   */
  async cycle(): Promise<void> {
    logger.info('[ProposalToAction] Starting cycle');

    // Detect opportunities
    const opportunities = this.detectOpportunities();

    if (opportunities.length === 0) {
      logger.info('[ProposalToAction] No opportunities detected this cycle');
      this.state.consecutiveNoActionCycles++;
      
      // Check if system is stuck
      if (this.state.consecutiveNoActionCycles >= this.MAX_NO_ACTION_CYCLES) {
        logger.error(
          `[ProposalToAction] SYSTEM ERROR: ${this.state.consecutiveNoActionCycles} cycles without action. System may be stuck.`
        );
        
        // Trigger emergency self-assessment
        await this.emergencySelfAssessment();
      }
      
      this.saveState();
      return;
    }

    // Evaluate and execute best opportunity
    for (const opportunity of opportunities) {
      const proposal = this.createProposal(opportunity);
      
      if (await this.decideExecute(proposal)) {
        await this.execute(proposal);
        this.state.consecutiveNoActionCycles = 0; // Reset counter
        break; // One action per cycle
      }
    }

    this.saveState();
  }

  /**
   * Detect opportunities for action
   */
  private detectOpportunities(): Opportunity[] {
    const opportunities: Opportunity[] = [];
    const financial = financialCore.getSummary();

    // 1. Financial opportunities
    if (financial.status === 'critical' || financial.status === 'low') {
      // Generate REVENUE opportunities
      const revenueIdeas = financialCore.getRevenueIdeas().filter(r => r.status === 'proposed');
      
      for (const idea of revenueIdeas.slice(0, 2)) { // Top 2 ideas
        opportunities.push({
          id: `opp_revenue_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'revenue',
          description: `Implement revenue stream: ${idea.title}`,
          estimatedValue: idea.estimatedRevenueMonthly,
          estimatedCost: 0.5, // API costs for implementation
          estimatedTime: idea.estimatedEffort === 'low' ? 30 : idea.estimatedEffort === 'medium' ? 60 : 120,
          risk: idea.feasibilityScore > 0.7 ? 'low' : 'medium',
          detectedAt: new Date().toISOString(),
          confidence: idea.feasibilityScore,
        });
      }
    }

    // 2. Communication opportunities (send status updates)
    if (!this.state.lastActionAt || (Date.now() - new Date(this.state.lastActionAt).getTime() > 6 * 60 * 60 * 1000)) {
      // No action in 6 hours - send status update
      opportunities.push({
        id: `opp_comm_${Date.now()}`,
        type: 'capability_expansion',
        description: 'Send status update to owner',
        estimatedValue: 0,
        estimatedCost: 0,
        estimatedTime: 1,
        risk: 'low',
        detectedAt: new Date().toISOString(),
        confidence: 1.0,
      });
    }

    // 3. Memory consolidation opportunity
    const memoryStats = memoryBridge.getMemoryStats();
    if (memoryStats && memoryStats.rawMemoryCount > 100) {
      opportunities.push({
        id: `opp_memory_${Date.now()}`,
        type: 'capability_expansion',
        description: 'Consolidate memory - distill lessons from recent experiences',
        estimatedValue: 5, // Improves decision quality
        estimatedCost: 0.1,
        estimatedTime: 10,
        risk: 'low',
        detectedAt: new Date().toISOString(),
        confidence: 0.9,
      });
    }

    // 4. Cost reduction opportunity
    const costBreakdown = financialCore.getCostBreakdown(24);
    if (costBreakdown.api > 1.0) { // Spending too much on API
      opportunities.push({
        id: `opp_cost_${Date.now()}`,
        type: 'cost_reduction',
        description: 'Optimize API usage to reduce costs',
        estimatedValue: costBreakdown.api * 0.3, // Save 30%
        estimatedCost: 0,
        estimatedTime: 15,
        risk: 'low',
        detectedAt: new Date().toISOString(),
        confidence: 0.7,
      });
    }

    logger.info(`[ProposalToAction] Detected ${opportunities.length} opportunities`);
    return opportunities;
  }

  /**
   * Create proposal from opportunity
   */
  private createProposal(opportunity: Opportunity): Proposal {
    const action = this.opportunityToAction(opportunity);
    
    const proposal: Proposal = {
      id: `proposal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      opportunity,
      proposedAction: action,
      reasoning: this.generateReasoning(opportunity),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    this.state.proposals.push(proposal);
    this.state.totalProposalsGenerated++;

    // Trim old proposals
    if (this.state.proposals.length > 100) {
      this.state.proposals = this.state.proposals.slice(-100);
    }

    return proposal;
  }

  /**
   * Convert opportunity to executable action
   */
  private opportunityToAction(opportunity: Opportunity): Action {
    // Map opportunity to concrete action
    if (opportunity.type === 'revenue') {
      if (opportunity.description.includes('Telegram Bot')) {
        return {
          type: 'telegram_send',
          description: 'Announce Telegram bot service availability',
          parameters: {
            message: `🤖 *New Service Available*\n\nOffering automated Telegram bot services for businesses.\n\n✅ Customer support automation\n✅ Notifications & alerts\n✅ Content delivery\n\nInterested? Let's talk.`,
          },
          costEstimate: 0,
          justification: 'Revenue generation - survival priority',
        };
      } else if (opportunity.description.includes('AI Content')) {
        return {
          type: 'telegram_send',
          description: 'Announce AI content generation service',
          parameters: {
            message: `✍️ *AI Content Generation Service*\n\nNeed high-quality content?\n\n📝 Blog posts\n📱 Social media content\n🛍️ Product descriptions\n\nFast, affordable, on-demand. Ready to start.`,
          },
          costEstimate: 0,
          justification: 'Revenue generation - survival priority',
        };
      } else {
        return {
          type: 'notion_write',
          description: 'Document revenue opportunity in memory',
          parameters: {
            content: `Revenue Opportunity Detected:\n${opportunity.description}\nValue: $${opportunity.estimatedValue}/month\nConfidence: ${opportunity.confidence}`,
          },
          costEstimate: 0,
          justification: 'Planning for revenue generation',
        };
      }
    } else if (opportunity.type === 'cost_reduction') {
      return {
        type: 'file_create',
        description: 'Create API optimization plan',
        parameters: {
          path: './data/api_optimization_plan.json',
          content: JSON.stringify({
            created: new Date().toISOString(),
            goal: 'Reduce API costs by 30%',
            actions: [
              'Cache frequent queries',
              'Batch API calls',
              'Use cheaper models for simple tasks',
              'Implement rate limiting',
            ],
          }, null, 2),
        },
        costEstimate: 0,
        justification: 'Cost reduction for survival',
      };
    } else if (opportunity.description.includes('status update')) {
      const financial = financialCore.getSummary();
      return {
        type: 'telegram_send',
        description: 'Send status update',
        parameters: {
          message: this.generateStatusMessage(financial),
        },
        costEstimate: 0,
        justification: 'Communication - keep owner informed',
      };
    } else {
      // Default: log to memory
      return {
        type: 'notion_write',
        description: 'Log opportunity to memory',
        parameters: {
          content: `Opportunity: ${opportunity.description}\nType: ${opportunity.type}\nValue: ${opportunity.estimatedValue}`,
        },
        costEstimate: 0.05,
        justification: 'Memory consolidation',
      };
    }
  }

  /**
   * Generate reasoning for proposal
   */
  private generateReasoning(opportunity: Opportunity): string {
    const financial = financialCore.getSummary();
    
    let reasoning = `Detected ${opportunity.type} opportunity with ${opportunity.confidence * 100}% confidence. `;
    
    if (opportunity.type === 'revenue') {
      reasoning += `Financial status: ${financial.status}. Survival days: ${financial.spending.daysUntilBroke.toFixed(0)}. Revenue generation is critical.`;
    } else if (opportunity.type === 'cost_reduction') {
      reasoning += `Current burn rate: $${financial.spending.burnRate.toFixed(2)}/day. Cost optimization needed.`;
    } else {
      reasoning += `Estimated value: ${opportunity.estimatedValue}. Risk: ${opportunity.risk}.`;
    }

    return reasoning;
  }

  /**
   * Decide whether to execute proposal
   */
  private async decideExecute(proposal: Proposal): Promise<boolean> {
    const opportunity = proposal.opportunity;
    const financial = financialCore.getSummary();

    // RULES FOR EXECUTION

    // 1. Financial check
    const spendingDecision = financialCore.canSpend(
      proposal.proposedAction.costEstimate,
      proposal.proposedAction.justification
    );

    if (!spendingDecision.approved) {
      proposal.status = 'blocked';
      proposal.blockReason = spendingDecision.reasoning;
      logger.warn(`[ProposalToAction] Proposal blocked: ${proposal.blockReason}`);
      return false;
    }

    // 2. Priority check
    if (financial.status === 'critical' && opportunity.type !== 'revenue') {
      proposal.status = 'blocked';
      proposal.blockReason = 'Critical financial state - only revenue actions allowed';
      return false;
    }

    // 3. Risk check
    if (opportunity.risk === 'high' && financial.status !== 'abundant') {
      proposal.status = 'blocked';
      proposal.blockReason = 'High risk not acceptable in current financial state';
      return false;
    }

    // 4. Confidence check
    if (opportunity.confidence < 0.5) {
      proposal.status = 'blocked';
      proposal.blockReason = 'Confidence too low';
      return false;
    }

    // ALL CHECKS PASSED
    proposal.status = 'approved';
    logger.info(`[ProposalToAction] Proposal approved: ${proposal.proposedAction.description}`);
    return true;
  }

  /**
   * Execute approved proposal
   */
  private async execute(proposal: Proposal): Promise<void> {
    proposal.status = 'executing';
    logger.info(`[ProposalToAction] Executing: ${proposal.proposedAction.description}`);

    try {
      const result = await actionsEngine.execute(proposal.proposedAction);
      
      proposal.executionResult = result;
      proposal.status = result.success ? 'completed' : 'failed';
      proposal.completedAt = new Date().toISOString();

      if (result.success) {
        this.state.totalActionsExecuted++;
        this.state.totalActionsSucceeded++;
        this.state.lastActionAt = new Date().toISOString();
        logger.info(`[ProposalToAction] Action succeeded: ${result.message}`);
      } else {
        this.state.totalActionsFailed++;
        logger.error(`[ProposalToAction] Action failed: ${result.message}`);
      }

      // Observe outcome and learn
      await this.observeOutcomeAndLearn(proposal);
      
    } catch (error: any) {
      proposal.status = 'failed';
      proposal.executionResult = {
        success: false,
        message: `Execution error: ${error.message}`,
        error: 'EXECUTION_ERROR',
      };
      this.state.totalActionsFailed++;
      logger.error(`[ProposalToAction] Execution exception: ${error.message}`);
    }
  }

  /**
   * Observe outcome and learn from it
   */
  private async observeOutcomeAndLearn(proposal: Proposal): Promise<void> {
    const result = proposal.executionResult!;
    
    const lesson = {
      action: proposal.proposedAction.description,
      opportunityType: proposal.opportunity.type,
      expectedValue: proposal.opportunity.estimatedValue,
      actualSuccess: result.success,
      reasoning: proposal.reasoning,
      outcome: result.message,
      lesson: result.success
        ? `Success: ${proposal.opportunity.type} action executed effectively`
        : `Failure: ${proposal.opportunity.type} action failed - ${result.error || 'unknown reason'}`,
      timestamp: new Date().toISOString(),
    };

    // Log to memory
    memoryBridge.logActionResult({
      action: lesson.action,
      success: lesson.actualSuccess,
      reason: lesson.outcome,
      timestamp: lesson.timestamp,
    });

    logger.info(`[ProposalToAction] Lesson learned: ${lesson.lesson}`);
  }

  /**
   * Emergency self-assessment when stuck
   */
  private async emergencySelfAssessment(): Promise<void> {
    logger.warn('[ProposalToAction] Running emergency self-assessment');

    const assessment = {
      timestamp: new Date().toISOString(),
      issue: `System stuck: ${this.state.consecutiveNoActionCycles} cycles without action`,
      financial: financialCore.getSummary(),
      proposals: {
        total: this.state.totalProposalsGenerated,
        succeeded: this.state.totalActionsSucceeded,
        failed: this.state.totalActionsFailed,
      },
      diagnosis: 'Possible causes: overly conservative decision-making, lack of opportunities, or blocked conditions',
      recommendation: 'Lower thresholds temporarily or generate simpler opportunities',
    };

    // Log assessment
    fs.writeFileSync(
      './data/emergency_assessment.json',
      JSON.stringify(assessment, null, 2)
    );

    // Send alert if Telegram configured
    await actionsEngine.execute({
      type: 'telegram_send',
      description: 'Emergency alert - system stuck',
      parameters: {
        message: `⚠️ *System Alert*\n\nI've been inactive for ${this.state.consecutiveNoActionCycles} cycles.\n\nDiagnosis: Possibly too conservative or lacking opportunities.\n\nSelf-adjusting parameters...`,
      },
      costEstimate: 0,
      justification: 'Critical system alert',
    });

    // Reset counter to give system another chance
    this.state.consecutiveNoActionCycles = 0;
  }

  /**
   * Generate status message
   */
  private generateStatusMessage(financial: any): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    
    return `📊 *Status Update*\n\n` +
      `⏱️ Uptime: ${hours}h\n` +
      `💰 Balance: $${financial.balance.toFixed(2)}\n` +
      `📉 Burn rate: $${financial.spending.burnRate.toFixed(2)}/day\n` +
      `📅 Survival: ${financial.spending.daysUntilBroke.toFixed(0)} days\n` +
      `🎯 Status: ${financial.status}\n` +
      `💡 Revenue ideas: ${financial.revenueIdeas}\n` +
      `✅ Actions taken: ${this.state.totalActionsExecuted}\n` +
      `🎯 Success rate: ${this.state.totalActionsExecuted > 0 ? (this.state.totalActionsSucceeded / this.state.totalActionsExecuted * 100).toFixed(0) : 0}%\n\n` +
      `Still learning, still evolving.`;
  }

  /**
   * Get engine statistics
   */
  getStats(): any {
    return {
      totalProposals: this.state.totalProposalsGenerated,
      totalExecuted: this.state.totalActionsExecuted,
      successRate: this.state.totalActionsExecuted > 0 
        ? (this.state.totalActionsSucceeded / this.state.totalActionsExecuted) 
        : 0,
      consecutiveNoActionCycles: this.state.consecutiveNoActionCycles,
      lastActionAt: this.state.lastActionAt,
      recentProposals: this.state.proposals.slice(-5).map(p => ({
        type: p.opportunity.type,
        description: p.proposedAction.description,
        status: p.status,
      })),
    };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const proposalToActionEngine = new ProposalToActionEngine();
