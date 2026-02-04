/**
 * Continuous Self-Improvement Loop
 * 
 * Đây là TRÁI TIM của hệ thống tự tiến hóa - chạy 24/7 THỰC SỰ!
 * 
 * Workflow:
 * 1. Monitor logs → Detect bugs
 * 2. Analyze bugs → Generate fixes  
 * 3. Apply fixes → Test results
 * 4. Learn from outcomes → Improve
 * 5. Repeat continuously
 * 
 * PROOF OF WORK - Metrics được track thực tế!
 */

import { logger } from '../services/logger';
import { autonomousDebugger } from './autonomousDebugger';
import { evolutionKernel } from './evolutionKernel';
import { experienceBasedLearning } from './experienceBasedLearning';
import { selfDiagnostics } from './selfDiagnostics';
import { codeModificationService } from '../services/codeModification';
import { memoryBridge } from './memory';

export interface ImprovementCycle {
  cycle_number: number;
  timestamp: string;
  duration_seconds: number;
  
  // What was done
  bugs_detected: number;
  bugs_fixed: number;
  code_improvements: number;
  patterns_learned: number;
  
  // Outcomes
  errors_before: number;
  errors_after: number;
  improvement_score: number;
  
  // Learning
  new_knowledge: string[];
  failed_attempts: string[];
  
  // Evolution
  evolution_version: string;
  capabilities_improved: boolean;
}

export interface SystemHealth {
  overall_score: number;
  error_rate: number;
  fix_success_rate: number;
  learning_effectiveness: number;
  autonomy_level: number;
  trend: 'improving' | 'stable' | 'degrading';
}

class ContinuousSelfImprovementLoop {
  private running: boolean = false;
  private cycleNumber: number = 0;
  private improvementCycles: ImprovementCycle[] = [];
  private loopInterval: NodeJS.Timeout | null = null;
  
  private readonly CYCLE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_HISTORY = 100;

  constructor() {
    logger.info('[ContinuousImprovement] System initialized');
  }

  /**
   * Start the continuous improvement loop - CHẠY THẬT!
   */
  async start(): Promise<void> {
    if (this.running) {
      logger.warn('[ContinuousImprovement] Already running');
      return;
    }

    this.running = true;
    logger.info('[ContinuousImprovement] 🚀 STARTING CONTINUOUS SELF-IMPROVEMENT');
    logger.info('[ContinuousImprovement] ⚡ Will run every 5 minutes automatically');

    // Start autonomous debugger
    autonomousDebugger.startMonitoring();

    // Run first cycle immediately
    await this.runCycle();

    // Schedule regular cycles
    this.loopInterval = setInterval(async () => {
      await this.runCycle();
    }, this.CYCLE_INTERVAL_MS);
  }

  /**
   * Stop the loop
   */
  stop(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    
    autonomousDebugger.stopMonitoring();
    this.running = false;
    
    logger.info('[ContinuousImprovement] Stopped');
  }

  /**
   * Run one improvement cycle - ĐÂY LÀ NƠIVIỆC THỰC SỰ XẢY RA!
   */
  private async runCycle(): Promise<ImprovementCycle> {
    this.cycleNumber++;
    const startTime = Date.now();
    
    logger.info(`[ContinuousImprovement] 🔄 CYCLE ${this.cycleNumber} STARTING...`);

    try {
      // Step 1: Assess current state
      const errorsBefore = this.countRecentErrors();
      logger.info(`[ContinuousImprovement]   Current errors: ${errorsBefore}`);

      // Step 2: Self-diagnostics - what's wrong?
      logger.info('[ContinuousImprovement]   Running self-diagnostics...');
      const diagnosticReport = await selfDiagnostics.diagnose();
      
      // Step 3: Detect bugs from logs
      logger.info('[ContinuousImprovement]   Detecting bugs...');
      const bugsDetected = autonomousDebugger.getDetectedBugs().length;
      
      // Step 4: Fix detected bugs (autonomous debugger handles this)
      logger.info('[ContinuousImprovement]   Autonomous debugger active...');
      const bugsFixedBefore = autonomousDebugger.getStats().bugs_fixed;
      
      // Wait a bit for debugger to work
      await this.sleep(2000);
      
      const bugsFixedAfter = autonomousDebugger.getStats().bugs_fixed;
      const bugsFixed = bugsFixedAfter - bugsFixedBefore;
      
      // Step 5: Code quality improvements (if no critical bugs)
      let codeImprovements = 0;
      if (diagnosticReport.overallHealth !== 'critical') {
        logger.info('[ContinuousImprovement]   Looking for code improvements...');
        codeImprovements = await this.improveCodeQuality();
      }
      
      // Step 6: Learning from experience
      logger.info('[ContinuousImprovement]   Consolidating learnings...');
      const learningStats = experienceBasedLearning.getStats();
      const patternsLearned = learningStats.learnedPatterns;
      
      // Step 7: Evolution
      logger.info('[ContinuousImprovement]   Evolving...');
      const evolutionLog = await evolutionKernel.evolve({
        cycleCount: this.cycleNumber,
        selfScore: this.calculateImprovementScore(bugsFixed, codeImprovements),
        anomalyScore: errorsBefore,
        insights: diagnosticReport.recommendations,
      });
      
      // Step 8: Measure outcomes
      const errorsAfter = this.countRecentErrors();
      const improvement = errorsBefore - errorsAfter;
      
      // Step 9: Create cycle record
      const duration = (Date.now() - startTime) / 1000;
      const cycle: ImprovementCycle = {
        cycle_number: this.cycleNumber,
        timestamp: new Date().toISOString(),
        duration_seconds: Math.round(duration),
        
        bugs_detected: bugsDetected,
        bugs_fixed: bugsFixed,
        code_improvements: codeImprovements,
        patterns_learned: patternsLearned,
        
        errors_before: errorsBefore,
        errors_after: errorsAfter,
        improvement_score: this.calculateImprovementScore(bugsFixed, codeImprovements),
        
        new_knowledge: diagnosticReport.recommendations.slice(0, 3),
        failed_attempts: diagnosticReport.blockers.map(b => b.description),
        
        evolution_version: evolutionLog.version,
        capabilities_improved: evolutionLog.improvements.length > 0,
      };
      
      this.improvementCycles.push(cycle);
      
      // Keep history manageable
      if (this.improvementCycles.length > this.MAX_HISTORY) {
        this.improvementCycles.shift();
      }
      
      // Log results
      logger.info(`[ContinuousImprovement] ✅ CYCLE ${this.cycleNumber} COMPLETE`);
      logger.info(`[ContinuousImprovement]   Duration: ${duration.toFixed(1)}s`);
      logger.info(`[ContinuousImprovement]   Bugs fixed: ${bugsFixed}`);
      logger.info(`[ContinuousImprovement]   Code improvements: ${codeImprovements}`);
      logger.info(`[ContinuousImprovement]   Errors: ${errorsBefore} → ${errorsAfter} (${improvement >= 0 ? '+' : ''}${improvement})`);
      logger.info(`[ContinuousImprovement]   Score: ${cycle.improvement_score}/100`);
      logger.info(`[ContinuousImprovement]   Evolution: ${evolutionLog.version}`);
      
      // Save to memory
      await this.saveCycleToMemory(cycle);
      
      return cycle;
      
    } catch (error) {
      logger.error('[ContinuousImprovement] Cycle failed:', error);
      
      // Create failed cycle record
      const duration = (Date.now() - startTime) / 1000;
      const failedCycle: ImprovementCycle = {
        cycle_number: this.cycleNumber,
        timestamp: new Date().toISOString(),
        duration_seconds: Math.round(duration),
        bugs_detected: 0,
        bugs_fixed: 0,
        code_improvements: 0,
        patterns_learned: 0,
        errors_before: 0,
        errors_after: 0,
        improvement_score: 0,
        new_knowledge: [],
        failed_attempts: [`Cycle failed: ${error}`],
        evolution_version: 'N/A',
        capabilities_improved: false,
      };
      
      return failedCycle;
    }
  }

  /**
   * Improve code quality proactively (không chờ bugs!)
   */
  private async improveCodeQuality(): Promise<number> {
    let improvements = 0;
    
    try {
      // TODO: Scan codebase for:
      // - Missing error handling
      // - Code duplication
      // - Missing type annotations
      // - Performance issues
      // - Security vulnerabilities
      
      // For now, just return 0
      // In full implementation, this would analyze files and make improvements
      
    } catch (error) {
      logger.error('[ContinuousImprovement] Code quality improvement failed:', error);
    }
    
    return improvements;
  }

  /**
   * Count recent errors
   */
  private countRecentErrors(): number {
    const recentLogs = logger.getRecentLogs(100);
    return recentLogs.filter(log => 
      log.level === 'error' || log.level === 'critical'
    ).length;
  }

  /**
   * Calculate improvement score
   */
  private calculateImprovementScore(bugsFixed: number, codeImprovements: number): number {
    const baseScore = 50;
    const bugScore = bugsFixed * 15;
    const improvementScore = codeImprovements * 10;
    return Math.min(100, baseScore + bugScore + improvementScore);
  }

  /**
   * Save cycle to memory
   */
  private async saveCycleToMemory(cycle: ImprovementCycle): Promise<void> {
    if (!memoryBridge.isConnected()) return;
    
    try {
      const summary = `
🔄 CONTINUOUS IMPROVEMENT CYCLE ${cycle.cycle_number}

⏱️  Duration: ${cycle.duration_seconds}s
🐛 Bugs: ${cycle.bugs_detected} detected, ${cycle.bugs_fixed} fixed
📈 Code improvements: ${cycle.code_improvements}
🎓 Patterns learned: ${cycle.patterns_learned}

📊 RESULTS:
Errors: ${cycle.errors_before} → ${cycle.errors_after}
Improvement Score: ${cycle.improvement_score}/100
Evolution: ${cycle.evolution_version}

💡 NEW KNOWLEDGE:
${cycle.new_knowledge.map((k, i) => `${i + 1}. ${k}`).join('\n')}

${cycle.failed_attempts.length > 0 ? `
⚠️  CHALLENGES:
${cycle.failed_attempts.map((f, i) => `${i + 1}. ${f}`).join('\n')}
` : ''}

🎯 STATUS: ${cycle.capabilities_improved ? 'CAPABILITIES IMPROVED' : 'STABLE'}
      `.trim();
      
      await memoryBridge.writeLesson(summary, {
        type: 'Self-Improvement',
        tags: ['autonomous', 'improvement', `cycle-${cycle.cycle_number}`],
      });
      
      logger.debug('[ContinuousImprovement] Saved cycle to memory');
    } catch (error) {
      logger.warn('[ContinuousImprovement] Failed to save to memory:', error);
    }
  }

  /**
   * Get system health assessment
   */
  getSystemHealth(): SystemHealth {
    if (this.improvementCycles.length === 0) {
      return {
        overall_score: 50,
        error_rate: 0,
        fix_success_rate: 0,
        learning_effectiveness: 0,
        autonomy_level: 30,
        trend: 'stable',
      };
    }
    
    const recent = this.improvementCycles.slice(-10);
    const avgScore = recent.reduce((sum, c) => sum + c.improvement_score, 0) / recent.length;
    
    const debuggerStats = autonomousDebugger.getStats();
    const learningStats = experienceBasedLearning.getStats();
    
    // Calculate trend
    let trend: SystemHealth['trend'] = 'stable';
    if (recent.length >= 2) {
      const oldScore = recent[0].improvement_score;
      const newScore = recent[recent.length - 1].improvement_score;
      if (newScore > oldScore + 10) trend = 'improving';
      if (newScore < oldScore - 10) trend = 'degrading';
    }
    
    return {
      overall_score: Math.round(avgScore),
      error_rate: recent[recent.length - 1]?.errors_after || 0,
      fix_success_rate: debuggerStats.fix_success_rate,
      learning_effectiveness: learningStats.avgEffectiveness,
      autonomy_level: this.calculateAutonomyLevel(debuggerStats, learningStats),
      trend,
    };
  }

  /**
   * Calculate autonomy level
   */
  private calculateAutonomyLevel(debuggerStats: any, learningStats: any): number {
    let score = 30; // Base autonomy
    
    // Debugger contribution
    if (debuggerStats.bugs_fixed > 0) score += 20;
    if (debuggerStats.fix_success_rate > 50) score += 15;
    
    // Learning contribution
    if (learningStats.learnedPatterns > 5) score += 15;
    if (learningStats.avgEffectiveness > 60) score += 10;
    
    // Experience contribution
    if (this.cycleNumber > 10) score += 10;
    
    return Math.min(100, score);
  }

  /**
   * Get improvement history
   */
  getHistory(count: number = 10): ImprovementCycle[] {
    return this.improvementCycles.slice(-count);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total_cycles: number;
    running: boolean;
    total_bugs_fixed: number;
    total_improvements: number;
    avg_cycle_time: number;
    system_health: SystemHealth;
  } {
    const totalBugsFixed = this.improvementCycles.reduce((sum, c) => sum + c.bugs_fixed, 0);
    const totalImprovements = this.improvementCycles.reduce((sum, c) => sum + c.code_improvements, 0);
    const avgCycleTime = this.improvementCycles.length > 0
      ? this.improvementCycles.reduce((sum, c) => sum + c.duration_seconds, 0) / this.improvementCycles.length
      : 0;
    
    return {
      total_cycles: this.cycleNumber,
      running: this.running,
      total_bugs_fixed: totalBugsFixed,
      total_improvements: totalImprovements,
      avg_cycle_time: Math.round(avgCycleTime),
      system_health: this.getSystemHealth(),
    };
  }

  /**
   * Is running?
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Helper: sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const continuousSelfImprovement = new ContinuousSelfImprovementLoop();
