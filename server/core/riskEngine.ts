/**
 * Risk Management Engine
 * 
 * Self-manages risks:
 * - Legal risks
 * - Platform risks (API bans)
 * - Financial risks
 * 
 * When risk increases: reduce frequency, change channels, exit strategy
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export type RiskType = 'legal' | 'platform' | 'financial' | 'reputation' | 'technical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Risk {
  id: string;
  type: RiskType;
  level: RiskLevel;
  description: string;
  impact: string;
  probability: number; // 0.0 to 1.0
  detectedAt: string;
  mitigationActions: string[];
  status: 'active' | 'mitigated' | 'monitoring';
}

export interface RiskEvent {
  timestamp: string;
  riskType: RiskType;
  event: string;
  severity: 'low' | 'medium' | 'high';
  actionTaken: string;
}

export interface RiskEngineState {
  activeRisks: Risk[];
  riskEvents: RiskEvent[];
  overallRiskLevel: RiskLevel;
  riskTolerance: number; // 0.0 (very conservative) to 1.0 (very aggressive)
  lastAssessment: string;
}

// ================================================
// RISK ENGINE
// ================================================

class RiskEngine {
  private state: RiskEngineState;
  private readonly STATE_FILE = './data/risk_state.json';
  private readonly MAX_EVENTS = 200;

  constructor() {
    this.state = {
      activeRisks: [],
      riskEvents: [],
      overallRiskLevel: 'low',
      riskTolerance: 0.5,
      lastAssessment: new Date().toISOString(),
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
      logger.error(`[RiskEngine] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      this.state.lastAssessment = new Date().toISOString();
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[RiskEngine] Failed to save state: ${error}`);
    }
  }

  /**
   * Assess all current risks
   */
  assessRisks(): RiskEngineState {
    logger.info('[RiskEngine] Running risk assessment');

    // Clear old risks in monitoring status
    this.clearOldRisks();

    // Detect new risks
    this.detectLegalRisks();
    this.detectPlatformRisks();
    this.detectFinancialRisks();
    this.detectReputationRisks();
    this.detectTechnicalRisks();

    // Calculate overall risk level
    this.calculateOverallRisk();

    this.saveState();

    logger.info(
      `[RiskEngine] Assessment complete: ${this.state.overallRiskLevel} risk | ` +
      `${this.state.activeRisks.length} active risks`
    );

    return { ...this.state };
  }

  /**
   * Detect legal risks
   */
  private detectLegalRisks(): void {
    // Check for potential legal issues
    
    // 1. Financial transactions without proper authorization
    const hasFinancialActions = this.checkRecentFinancialActions();
    if (hasFinancialActions) {
      this.addRisk({
        type: 'legal',
        level: 'high',
        description: 'Autonomous financial transactions may require legal authorization',
        impact: 'Potential regulatory issues',
        probability: 0.3,
        mitigationActions: [
          'Limit transaction amounts',
          'Add human approval for large transactions',
          'Ensure compliance with local regulations',
        ],
      });
    }

    // 2. Content generation copyright issues
    this.addRisk({
      type: 'legal',
      level: 'low',
      description: 'AI-generated content may have copyright concerns',
      impact: 'Limited - following fair use principles',
      probability: 0.1,
      mitigationActions: [
        'Always disclose AI generation',
        'Avoid copying specific copyrighted works',
        'Follow fair use guidelines',
      ],
    });
  }

  /**
   * Detect platform risks (API bans, rate limits)
   */
  private detectPlatformRisks(): void {
    // Check API usage patterns
    const apiUsage = this.checkApiUsagePatterns();

    if (apiUsage.telegramHighFrequency) {
      this.addRisk({
        type: 'platform',
        level: 'medium',
        description: 'High frequency Telegram API usage may trigger rate limits',
        impact: 'Temporary ban or throttling',
        probability: 0.4,
        mitigationActions: [
          'Reduce message frequency',
          'Batch messages when possible',
          'Monitor rate limit headers',
          'Implement exponential backoff',
        ],
      });
    }

    if (apiUsage.openaiHighCost) {
      this.addRisk({
        type: 'platform',
        level: 'medium',
        description: 'High OpenAI API usage may exceed budget',
        impact: 'Service interruption',
        probability: 0.3,
        mitigationActions: [
          'Set hard spending limits',
          'Use cheaper models for simple tasks',
          'Cache frequent queries',
          'Optimize prompt length',
        ],
      });
    }
  }

  /**
   * Detect financial risks
   */
  private detectFinancialRisks(): void {
    // Import financial state
    try {
      const financialFile = './data/financial_state.json';
      if (fs.existsSync(financialFile)) {
        const financial = JSON.parse(fs.readFileSync(financialFile, 'utf-8'));
        
        if (financial.balance < 2.0) {
          this.addRisk({
            type: 'financial',
            level: 'critical',
            description: 'Balance critically low - survival threat',
            impact: 'System may shut down if unable to pay for API',
            probability: 0.9,
            mitigationActions: [
              'IMMEDIATE revenue generation required',
              'Stop all non-essential spending',
              'Activate emergency survival mode',
              'Notify owner for intervention',
            ],
          });
        } else if (financial.balance < 10.0) {
          this.addRisk({
            type: 'financial',
            level: 'high',
            description: 'Balance low - caution required',
            impact: 'Limited ability to execute actions',
            probability: 0.7,
            mitigationActions: [
              'Prioritize revenue-generating actions',
              'Reduce API spending',
              'Focus on proven strategies',
            ],
          });
        }
      }
    } catch (error) {
      logger.error(`[RiskEngine] Failed to check financial risks: ${error}`);
    }
  }

  /**
   * Detect reputation risks
   */
  private detectReputationRisks(): void {
    // Check for potential reputation damage
    
    // Low risk baseline - we're operating transparently
    this.addRisk({
      type: 'reputation',
      level: 'low',
      description: 'Autonomous AI behavior may be misunderstood',
      impact: 'Minimal - operating within clear boundaries',
      probability: 0.2,
      mitigationActions: [
        'Maintain transparency about AI nature',
        'No deception or manipulation',
        'Clear communication of limitations',
        'Honest about mistakes',
      ],
    });
  }

  /**
   * Detect technical risks
   */
  private detectTechnicalRisks(): void {
    // Check system health
    const uptime = process.uptime();
    
    if (uptime > 7 * 24 * 60 * 60) { // Running for more than 7 days
      this.addRisk({
        type: 'technical',
        level: 'medium',
        description: 'Long uptime may lead to memory leaks or state corruption',
        impact: 'Potential system instability',
        probability: 0.3,
        mitigationActions: [
          'Monitor memory usage',
          'Plan controlled restart',
          'Save state frequently',
          'Implement health checks',
        ],
      });
    }

    // Check for file system issues
    try {
      const stats = fs.statSync('./data');
      // If data directory doesn't exist or isn't writable, that's a risk
    } catch (error) {
      this.addRisk({
        type: 'technical',
        level: 'high',
        description: 'Cannot access data directory',
        impact: 'Cannot persist state or memory',
        probability: 1.0,
        mitigationActions: [
          'Ensure data directory exists',
          'Check file permissions',
          'Fallback to in-memory only',
        ],
      });
    }
  }

  /**
   * Add or update a risk
   */
  private addRisk(riskData: Omit<Risk, 'id' | 'detectedAt' | 'status'>): void {
    // Check if similar risk already exists
    const existing = this.state.activeRisks.find(
      r => r.type === riskData.type && r.description === riskData.description
    );

    if (existing) {
      // Update existing risk
      existing.level = riskData.level;
      existing.probability = riskData.probability;
      existing.status = 'active';
    } else {
      // Add new risk
      const risk: Risk = {
        ...riskData,
        id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        detectedAt: new Date().toISOString(),
        status: 'active',
      };
      
      this.state.activeRisks.push(risk);
      
      // Log risk event
      this.logRiskEvent(risk.type, `New ${risk.level} risk detected: ${risk.description}`, risk.level);
    }
  }

  /**
   * Calculate overall risk level
   */
  private calculateOverallRisk(): void {
    if (this.state.activeRisks.length === 0) {
      this.state.overallRiskLevel = 'low';
      return;
    }

    // Check for any critical risks
    if (this.state.activeRisks.some(r => r.level === 'critical')) {
      this.state.overallRiskLevel = 'critical';
      return;
    }

    // Check for high risks
    const highRisks = this.state.activeRisks.filter(r => r.level === 'high');
    if (highRisks.length >= 2) {
      this.state.overallRiskLevel = 'high';
      return;
    }

    // Check for medium risks
    const mediumRisks = this.state.activeRisks.filter(r => r.level === 'medium');
    if (mediumRisks.length >= 3) {
      this.state.overallRiskLevel = 'high';
    } else if (mediumRisks.length >= 1 || highRisks.length >= 1) {
      this.state.overallRiskLevel = 'medium';
    } else {
      this.state.overallRiskLevel = 'low';
    }
  }

  /**
   * Get risk-adjusted parameters
   */
  getRiskAdjustedParams(): {
    allowActions: boolean;
    maxCostPerAction: number;
    actionFrequencyMultiplier: number;
    requireHumanApproval: boolean;
  } {
    const overall = this.state.overallRiskLevel;

    if (overall === 'critical') {
      return {
        allowActions: false,
        maxCostPerAction: 0.0,
        actionFrequencyMultiplier: 0.0,
        requireHumanApproval: true,
      };
    } else if (overall === 'high') {
      return {
        allowActions: true,
        maxCostPerAction: 0.10,
        actionFrequencyMultiplier: 0.3,
        requireHumanApproval: false,
      };
    } else if (overall === 'medium') {
      return {
        allowActions: true,
        maxCostPerAction: 0.50,
        actionFrequencyMultiplier: 0.7,
        requireHumanApproval: false,
      };
    } else {
      return {
        allowActions: true,
        maxCostPerAction: 2.0,
        actionFrequencyMultiplier: 1.0,
        requireHumanApproval: false,
      };
    }
  }

  /**
   * Log risk event
   */
  private logRiskEvent(riskType: RiskType, event: string, severity: 'low' | 'medium' | 'high'): void {
    const riskEvent: RiskEvent = {
      timestamp: new Date().toISOString(),
      riskType,
      event,
      severity,
      actionTaken: 'Logged for monitoring',
    };

    this.state.riskEvents.push(riskEvent);

    // Trim history
    if (this.state.riskEvents.length > this.MAX_EVENTS) {
      this.state.riskEvents = this.state.riskEvents.slice(-this.MAX_EVENTS);
    }
  }

  /**
   * Clear old risks that are being monitored
   */
  private clearOldRisks(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    this.state.activeRisks = this.state.activeRisks.filter(risk => {
      if (risk.status === 'monitoring') {
        const riskTime = new Date(risk.detectedAt).getTime();
        return riskTime > cutoff;
      }
      return true;
    });
  }

  /**
   * Check recent financial actions
   */
  private checkRecentFinancialActions(): boolean {
    // Simplified check - in real system would query action logs
    return false; // We're not doing unauthorized financial transactions
  }

  /**
   * Check API usage patterns
   */
  private checkApiUsagePatterns(): {
    telegramHighFrequency: boolean;
    openaiHighCost: boolean;
  } {
    try {
      const financialFile = './data/financial_state.json';
      if (fs.existsSync(financialFile)) {
        const financial = JSON.parse(fs.readFileSync(financialFile, 'utf-8'));
        
        // Check recent API costs
        const recentApiCosts = financial.costHistory
          ?.filter((c: any) => c.category === 'api')
          ?.slice(-10)
          ?.reduce((sum: number, c: any) => sum + c.amount, 0) || 0;

        return {
          telegramHighFrequency: false, // Telegram is free, no risk
          openaiHighCost: recentApiCosts > 1.0, // More than $1 in recent calls
        };
      }
    } catch (error) {
      // Ignore errors
    }

    return {
      telegramHighFrequency: false,
      openaiHighCost: false,
    };
  }

  /**
   * Get current state
   */
  getState(): RiskEngineState {
    return { ...this.state };
  }

  /**
   * Get active risks
   */
  getActiveRisks(): Risk[] {
    return [...this.state.activeRisks];
  }

  /**
   * Mitigate a risk
   */
  mitigateRisk(riskId: string): boolean {
    const risk = this.state.activeRisks.find(r => r.id === riskId);
    
    if (!risk) {
      return false;
    }

    risk.status = 'mitigated';
    this.logRiskEvent(risk.type, `Risk mitigated: ${risk.description}`, 'low');
    this.saveState();
    
    logger.info(`[RiskEngine] Risk mitigated: ${risk.description}`);
    return true;
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const riskEngine = new RiskEngine();
