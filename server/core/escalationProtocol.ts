/**
 * Escalation Protocol
 * 
 * When AGI cannot act autonomously, escalate to owner via Telegram.
 * Flow: Problem detected → Research done → Log to Notion → Can't solve → Notify owner
 */

import { logger } from '../services/logger';
import { telegramService } from '../services/telegram';
import { memoryBridge } from './memory';
import type { DiagnosticReport } from './selfDiagnostics';
import type { ResearchResult } from './autonomousResearch';

// ================================================
// TYPES
// ================================================

export interface EscalationRequest {
  id: string;
  type: 'blocker' | 'decision-needed' | 'resource-needed' | 'critical-failure';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  context: {
    diagnostics?: DiagnosticReport;
    research?: ResearchResult[];
    attemptedActions?: string[];
    failureReasons?: string[];
  };
  recommendations: string[];
  question?: string; // Specific question for owner
  createdAt: string;
  notifiedAt?: string;
  resolvedAt?: string;
}

export interface EscalationHistory {
  total: number;
  resolved: number;
  pending: number;
  recentEscalations: EscalationRequest[];
}

// ================================================
// ESCALATION PROTOCOL ENGINE
// ================================================

class EscalationProtocolEngine {
  private history: EscalationHistory = {
    total: 0,
    resolved: 0,
    pending: 0,
    recentEscalations: [],
  };

  /**
   * Escalate issue to owner via Telegram
   */
  async escalate(
    type: EscalationRequest['type'],
    title: string,
    description: string,
    options: {
      priority?: EscalationRequest['priority'];
      context?: EscalationRequest['context'];
      recommendations?: string[];
      question?: string;
    } = {}
  ): Promise<void> {
    const escalation: EscalationRequest = {
      id: `escalation_${Date.now()}`,
      type,
      priority: options.priority || 'medium',
      title,
      description,
      context: options.context || {},
      recommendations: options.recommendations || [],
      question: options.question,
      createdAt: new Date().toISOString(),
    };

    logger.warn(`[Escalation] Escalating to owner: ${title}`);
    logger.warn(`[Escalation] Type: ${type}, Priority: ${escalation.priority}`);

    this.history.total++;
    this.history.pending++;
    this.history.recentEscalations.unshift(escalation);

    // Keep only last 20
    if (this.history.recentEscalations.length > 20) {
      this.history.recentEscalations = this.history.recentEscalations.slice(0, 20);
    }

    // Log to Notion first
    await this.logToNotion(escalation);

    // Notify owner via Telegram
    await this.notifyOwner(escalation);

    escalation.notifiedAt = new Date().toISOString();
  }

  /**
   * Log escalation to Notion
   */
  private async logToNotion(escalation: EscalationRequest): Promise<void> {
    try {
      const priorityEmoji = {
        low: '🔵',
        medium: '🟡',
        high: '🟠',
        urgent: '🔴',
      };

      const typeEmoji = {
        blocker: '🚧',
        'decision-needed': '🤔',
        'resource-needed': '💰',
        'critical-failure': '🚨',
      };

      const content = `[ESCALATION] ${escalation.createdAt}

${priorityEmoji[escalation.priority]} PRIORITY: ${escalation.priority.toUpperCase()}
${typeEmoji[escalation.type]} TYPE: ${escalation.type}

📋 ISSUE:
${escalation.title}

📝 DESCRIPTION:
${escalation.description}

${escalation.context.diagnostics ? `
🏥 DIAGNOSTICS:
Overall Health: ${escalation.context.diagnostics.overallHealth}
Blockers: ${escalation.context.diagnostics.blockers.length}
${escalation.context.diagnostics.blockers.slice(0, 3).map(b => `- ${b.description}`).join('\n')}
` : ''}

${escalation.context.research && escalation.context.research.length > 0 ? `
🔍 RESEARCH CONDUCTED:
${escalation.context.research.map(r => `- ${r.query.query}: ${r.sources.length} sources found`).join('\n')}
` : ''}

${escalation.context.attemptedActions && escalation.context.attemptedActions.length > 0 ? `
🔧 ATTEMPTED ACTIONS:
${escalation.context.attemptedActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}
` : ''}

${escalation.context.failureReasons && escalation.context.failureReasons.length > 0 ? `
❌ FAILURE REASONS:
${escalation.context.failureReasons.map((reason, i) => `${i + 1}. ${reason}`).join('\n')}
` : ''}

${escalation.recommendations.length > 0 ? `
💡 RECOMMENDATIONS:
${escalation.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
` : ''}

${escalation.question ? `
❓ SPECIFIC QUESTION:
${escalation.question}
` : ''}

⏰ Awaiting owner decision...`;

      await memoryBridge.writeLesson(content, {
        type: 'Escalation',
        tags: ['escalation', escalation.type, escalation.priority],
      });

      logger.info('[Escalation] Logged to Notion');
    } catch (error) {
      logger.error(`[Escalation] Failed to log to Notion: ${error}`);
    }
  }

  /**
   * Notify owner via Telegram
   */
  private async notifyOwner(escalation: EscalationRequest): Promise<void> {
    try {
      const priorityEmoji = {
        low: '🔵',
        medium: '🟡',
        high: '🟠',
        urgent: '🔴',
      };

      const typeIcon = {
        blocker: '🚧',
        'decision-needed': '🤔',
        'resource-needed': '💰',
        'critical-failure': '🚨',
      };

      let message = `${priorityEmoji[escalation.priority]} ${typeIcon[escalation.type]} *ESCALATION*\n\n`;
      message += `*${escalation.title}*\n\n`;
      message += `${escalation.description}\n\n`;

      if (escalation.context.diagnostics) {
        message += `🏥 Health: ${escalation.context.diagnostics.overallHealth}\n`;
        message += `🚧 Blockers: ${escalation.context.diagnostics.blockers.length}\n\n`;
      }

      if (escalation.context.research && escalation.context.research.length > 0) {
        message += `🔍 Researched ${escalation.context.research.length} topic(s)\n\n`;
      }

      if (escalation.recommendations.length > 0) {
        message += `💡 *Recommendations:*\n`;
        escalation.recommendations.slice(0, 3).forEach((rec, i) => {
          message += `${i + 1}. ${rec}\n`;
        });
        message += '\n';
      }

      if (escalation.question) {
        message += `❓ *Question:*\n${escalation.question}\n\n`;
      }

      message += `Priority: ${escalation.priority.toUpperCase()}\n`;
      message += `Type: ${escalation.type}\n\n`;
      message += `🔗 Details logged to Notion`;

      await telegramService.sendMessage(message);

      logger.info('[Escalation] Owner notified via Telegram');
    } catch (error) {
      logger.error(`[Escalation] Failed to notify owner: ${error}`);
      logger.error('[Escalation] Telegram may not be configured - check logs');
    }
  }

  /**
   * Quick escalation for critical issues
   */
  async escalateCritical(
    title: string,
    description: string,
    recommendations: string[] = []
  ): Promise<void> {
    await this.escalate('critical-failure', title, description, {
      priority: 'urgent',
      recommendations,
    });
  }

  /**
   * Escalate when decision is needed
   */
  async escalateDecision(
    question: string,
    context: string,
    options: string[] = []
  ): Promise<void> {
    const description = `${context}\n\nOptions:\n${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}`;
    
    await this.escalate('decision-needed', 'Decision Required', description, {
      priority: 'high',
      question,
      recommendations: options,
    });
  }

  /**
   * Escalate blocker with research
   */
  async escalateBlocker(
    blocker: string,
    research: ResearchResult[],
    attemptedActions: string[] = []
  ): Promise<void> {
    await this.escalate('blocker', 'Blocker Detected', blocker, {
      priority: 'high',
      context: {
        research,
        attemptedActions,
      },
      recommendations: research.flatMap(r => r.actionableRecommendations).slice(0, 3),
    });
  }

  /**
   * Get escalation history
   */
  getHistory(): EscalationHistory {
    return { ...this.history };
  }

  /**
   * Mark escalation as resolved
   */
  resolveEscalation(escalationId: string): void {
    const escalation = this.history.recentEscalations.find(e => e.id === escalationId);
    if (escalation && !escalation.resolvedAt) {
      escalation.resolvedAt = new Date().toISOString();
      this.history.resolved++;
      this.history.pending--;
      logger.info(`[Escalation] Marked ${escalationId} as resolved`);
    }
  }
}

// Singleton instance
export const escalationProtocol = new EscalationProtocolEngine();
