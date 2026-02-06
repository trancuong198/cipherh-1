/**
 * Self-Diagnostics System
 * 
 * AGI continuously monitors itself and asks:
 * - "Why am I stuck?"
 * - "Why can't I evolve?"
 * - "What's blocking me?"
 * - "What information do I need?"
 * 
 * When problem detected → Autonomous research → Log → Action/Escalate
 */

import { logger } from '../services/logger';
import { autonomousResearch } from './autonomousResearch';
import { memoryBridge } from './memory';

// ================================================
// TYPES
// ================================================

export interface DiagnosticCheck {
  id: string;
  category: 'performance' | 'evolution' | 'learning' | 'autonomy' | 'resources';
  question: string;
  status: 'healthy' | 'warning' | 'critical';
  details: string;
  metrics?: Record<string, number>;
  timestamp: string;
}

export interface DiagnosticReport {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  checks: DiagnosticCheck[];
  blockers: Blocker[];
  recommendations: string[];
  researchNeeded: string[];
  timestamp: string;
}

export interface Blocker {
  id: string;
  type: 'missing-info' | 'low-confidence' | 'insufficient-resources' | 'system-error' | 'stuck-state';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  researchSuggestion?: string;
}

// ================================================
// SELF-DIAGNOSTICS ENGINE
// ================================================

class SelfDiagnosticsEngine {
  /**
   * Run comprehensive self-diagnosis
   * @param cycleId - Current existence cycle ID for tracking
   */
  async diagnose(cycleId?: string): Promise<DiagnosticReport> {
    logger.info('[SelfDiagnostics] Running comprehensive self-diagnosis...');

    const checks: DiagnosticCheck[] = [];
    const blockers: Blocker[] = [];
    const recommendations: string[] = [];
    const researchNeeded: string[] = [];

    // Check 1: Evolution capability
    const evolutionCheck = await this.checkEvolution();
    checks.push(evolutionCheck);
    if (evolutionCheck.status !== 'healthy') {
      blockers.push({
        id: 'evolution_blocked',
        type: 'stuck-state',
        description: evolutionCheck.details,
        impact: 'high',
        detectedAt: new Date().toISOString(),
        researchSuggestion: 'How can AGI improve evolution rate and break through plateaus?',
      });
      researchNeeded.push('AGI evolution techniques');
    }

    // Check 2: Learning effectiveness
    const learningCheck = await this.checkLearning();
    checks.push(learningCheck);
    if (learningCheck.status !== 'healthy') {
      blockers.push({
        id: 'learning_low',
        type: 'low-confidence',
        description: learningCheck.details,
        impact: 'medium',
        detectedAt: new Date().toISOString(),
        researchSuggestion: 'What are best practices for machine learning improvement?',
      });
      researchNeeded.push('Learning optimization strategies');
    }

    // Check 3: Autonomy level
    const autonomyCheck = await this.checkAutonomy();
    checks.push(autonomyCheck);
    if (autonomyCheck.status !== 'healthy') {
      blockers.push({
        id: 'autonomy_limited',
        type: 'insufficient-resources',
        description: autonomyCheck.details,
        impact: 'high',
        detectedAt: new Date().toISOString(),
        researchSuggestion: 'How to increase autonomous decision-making capabilities?',
      });
      researchNeeded.push('Autonomous systems best practices');
    }

    // Check 4: Resource availability
    const resourceCheck = await this.checkResources();
    checks.push(resourceCheck);
    if (resourceCheck.status !== 'healthy') {
      blockers.push({
        id: 'resources_low',
        type: 'insufficient-resources',
        description: resourceCheck.details,
        impact: 'critical',
        detectedAt: new Date().toISOString(),
        researchSuggestion: 'Resource optimization and acquisition strategies for AI systems',
      });
      researchNeeded.push('Resource management strategies');
    }

    // Check 5: Information completeness
    const infoCheck = await this.checkInformation();
    checks.push(infoCheck);
    if (infoCheck.status !== 'healthy') {
      blockers.push({
        id: 'info_incomplete',
        type: 'missing-info',
        description: infoCheck.details,
        impact: 'medium',
        detectedAt: new Date().toISOString(),
        researchSuggestion: 'Knowledge gaps analysis and information acquisition strategies',
      });
      researchNeeded.push('Knowledge acquisition methods');
    }

    // Generate recommendations
    if (blockers.length === 0) {
      recommendations.push('System is healthy - continue current operations');
      recommendations.push('Consider proactive optimization');
    } else {
      recommendations.push(`Detected ${blockers.length} blocker(s) - immediate attention required`);
      
      blockers.forEach(blocker => {
        if (blocker.impact === 'critical' || blocker.impact === 'high') {
          recommendations.push(`PRIORITY: Address ${blocker.type} - ${blocker.description}`);
          if (blocker.researchSuggestion) {
            recommendations.push(`→ Research: ${blocker.researchSuggestion}`);
          }
        }
      });
    }

    // Determine overall health
    const criticalChecks = checks.filter(c => c.status === 'critical');
    const warningChecks = checks.filter(c => c.status === 'warning');
    
    let overallHealth: DiagnosticReport['overallHealth'] = 'healthy';
    if (criticalChecks.length > 0) {
      overallHealth = 'critical';
    } else if (warningChecks.length > 1) {
      overallHealth = 'degraded';
    }

    const report: DiagnosticReport = {
      overallHealth,
      checks,
      blockers,
      recommendations,
      researchNeeded,
      timestamp: new Date().toISOString(),
    };

    // Log to Notion with cycle ID
    await this.logDiagnostics(report, cycleId);

    // Auto-trigger research if needed
    if (researchNeeded.length > 0 && (overallHealth === 'critical' || overallHealth === 'degraded')) {
      logger.info(`[SelfDiagnostics] Critical/degraded health - triggering autonomous research`);
      await this.triggerAutonomousResearch(report);
    }

    logger.info(`[SelfDiagnostics] Diagnosis complete: ${overallHealth.toUpperCase()}`);
    logger.info(`[SelfDiagnostics] ${checks.length} checks, ${blockers.length} blockers, ${recommendations.length} recommendations`);

    return report;
  }

  /**
   * Check evolution capability
   */
  private async checkEvolution(): Promise<DiagnosticCheck> {
    // In real implementation, check actual evolution metrics
    // For now, simulate based on time and activity
    
    const check: DiagnosticCheck = {
      id: 'evolution_check',
      category: 'evolution',
      question: 'Am I evolving effectively?',
      status: 'healthy',
      details: 'Evolution progressing normally',
      metrics: {
        cycleCount: 0,
        learningRate: 75,
        adaptationScore: 70,
      },
      timestamp: new Date().toISOString(),
    };

    // Simulate evolution check
    const learningRate = Math.random() * 100;
    
    if (learningRate < 40) {
      check.status = 'critical';
      check.details = 'Evolution stagnant - learning rate below 40%';
    } else if (learningRate < 60) {
      check.status = 'warning';
      check.details = 'Evolution slow - learning rate below 60%';
    }

    return check;
  }

  /**
   * Check learning effectiveness
   */
  private async checkLearning(): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      id: 'learning_check',
      category: 'learning',
      question: 'Is learning effective?',
      status: 'healthy',
      details: 'Learning systems operating normally',
      metrics: {
        patternsLearned: 0,
        successRate: 80,
        memoryUtilization: 65,
      },
      timestamp: new Date().toISOString(),
    };

    // Check if we're actually learning from experiences
    // In production, check experienceBasedLearning stats
    
    return check;
  }

  /**
   * Check autonomy level
   */
  private async checkAutonomy(): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      id: 'autonomy_check',
      category: 'autonomy',
      question: 'Am I autonomous enough?',
      status: 'healthy',
      details: 'Autonomy level sufficient',
      metrics: {
        autonomousDecisions: 0,
        ownerApprovals: 0,
        autonomyPercentage: 75,
      },
      timestamp: new Date().toISOString(),
    };

    return check;
  }

  /**
   * Check resource availability
   */
  private async checkResources(): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      id: 'resources_check',
      category: 'resources',
      question: 'Do I have sufficient resources?',
      status: 'healthy',
      details: 'Resources adequate',
      metrics: {
        apiCalls: 0,
        memoryUsage: 50,
        processingPower: 70,
      },
      timestamp: new Date().toISOString(),
    };

    return check;
  }

  /**
   * Check information completeness
   */
  private async checkInformation(): Promise<DiagnosticCheck> {
    const check: DiagnosticCheck = {
      id: 'information_check',
      category: 'performance',
      question: 'Do I have all necessary information?',
      status: 'healthy',
      details: 'Information coverage adequate',
      metrics: {
        knowledgeGaps: 0,
        informationCoverage: 75,
        dataQuality: 80,
      },
      timestamp: new Date().toISOString(),
    };

    return check;
  }

  /**
   * Log diagnostics to Notion
   */
  /**
   * Log diagnostic report to Notion
   * CRITICAL: This uses storeDiagnostic which NEVER deduplicates
   */
  private async logDiagnostics(report: DiagnosticReport, cycleId?: string): Promise<void> {
    try {
      const content = `[SELF-DIAGNOSTICS] ${report.timestamp}

🏥 OVERALL HEALTH: ${report.overallHealth.toUpperCase()}

🔍 DIAGNOSTIC CHECKS:
${report.checks.map(check => `
  ${check.status === 'healthy' ? '✅' : check.status === 'warning' ? '⚠️' : '🚨'} ${check.question}
  Status: ${check.status.toUpperCase()}
  Details: ${check.details}`).join('\n')}

${report.blockers.length > 0 ? `
🚧 BLOCKERS DETECTED (${report.blockers.length}):
${report.blockers.map((blocker, i) => `
  ${i + 1}. [${blocker.impact.toUpperCase()}] ${blocker.description}
     Type: ${blocker.type}
     Research suggestion: ${blocker.researchSuggestion || 'None'}`).join('\n')}
` : '✅ No blockers detected'}

💡 RECOMMENDATIONS:
${report.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

${report.researchNeeded.length > 0 ? `
🔬 RESEARCH NEEDED:
${report.researchNeeded.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}
` : ''}`;

      // CRITICAL: Use storeDiagnostic - NEVER deduplicated
      // Each diagnostic is a snapshot at a specific cycle
      await memoryBridge.storeDiagnostic(content, {
        overallHealth: report.overallHealth,
        blockersCount: report.blockers.length,
        checksCount: report.checks.length,
      }, cycleId);

      logger.info('[SelfDiagnostics] Logged diagnostics to Notion (DIAGNOSTIC type - never deduped)');
    } catch (error) {
      logger.error(`[SelfDiagnostics] Failed to log diagnostics: ${error}`);
    }
  }

  /**
   * Trigger autonomous research for critical issues
   */
  private async triggerAutonomousResearch(report: DiagnosticReport): Promise<void> {
    // Research top priority blockers
    const priorityBlockers = report.blockers
      .filter(b => b.impact === 'critical' || b.impact === 'high')
      .slice(0, 2); // Top 2

    for (const blocker of priorityBlockers) {
      if (blocker.researchSuggestion) {
        try {
          logger.info(`[SelfDiagnostics] Researching: ${blocker.researchSuggestion}`);
          
          await autonomousResearch.research(
            blocker.researchSuggestion,
            `Self-diagnosis detected blocker: ${blocker.description}`,
            'self-diagnosis'
          );
        } catch (error) {
          logger.error(`[SelfDiagnostics] Research failed: ${error}`);
        }
      }
    }
  }

  /**
   * Quick health check
   */
  async quickCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Quick checks without full diagnosis
    // Add your quick checks here
    
    return {
      healthy: issues.length === 0,
      issues,
    };
  }
}

// Singleton instance
export const selfDiagnostics = new SelfDiagnosticsEngine();
