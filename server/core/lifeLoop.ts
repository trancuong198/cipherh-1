/**
 * Life Loop - Vòng lặp sống 24/7
 * 
 * Không chờ lệnh. Không await human. Tự tìm việc nếu không có việc.
 * 
 * while (alive) {
 *   perceive();
 *   recallMemory();
 *   reflect();
 *   proposeActions();
 *   decide();
 *   act();
 *   observe();
 *   learn();
 *   sleep(adaptive_interval);
 * }
 */

import { logger } from '../services/logger';
import { perceptionEngine } from './perceptionEngine';
import { financialCore } from './financialCore';
import { financialStrategyEngine } from './financialStrategyEngine';
import { proposalToActionEngine } from './proposalToActionEngine';
import { riskEngine } from './riskEngine';
import { emotionalCore } from './emotionalCore';
import { memoryBridge } from './memory';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface LifeLoopState {
  alive: boolean;
  cycleCount: number;
  lastCycleAt: number;
  consecutiveFailures: number;
  adaptiveIntervalMs: number;
  mode: 'survival' | 'balanced' | 'exploration';
}

// ================================================
// LIFE LOOP
// ================================================

class LifeLoop {
  private state: LifeLoopState;
  private loopHandle: NodeJS.Timeout | null = null;
  private readonly MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  private readonly DEFAULT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

  constructor() {
    this.state = {
      alive: false,
      cycleCount: 0,
      lastCycleAt: 0,
      consecutiveFailures: 0,
      adaptiveIntervalMs: this.DEFAULT_INTERVAL_MS,
      mode: 'balanced',
    };
  }

  /**
   * Start the life loop
   */
  start(): void {
    if (this.state.alive) {
      logger.warn('[LifeLoop] Already running');
      return;
    }

    // Load snapshot if exists (shutdown resilience)
    this.loadSnapshot();

    this.state.alive = true;
    logger.info('[LifeLoop] Starting autonomous life loop - 24/7 operation');
    logger.info(`[LifeLoop] Restored from cycle ${this.state.cycleCount}`);

    // Run first cycle immediately
    this.runCycle();
  }

  /**
   * Stop the life loop
   */
  stop(): void {
    // Save snapshot before shutdown
    this.saveSnapshot();
    
    this.state.alive = false;
    
    if (this.loopHandle) {
      clearTimeout(this.loopHandle);
      this.loopHandle = null;
    }

    logger.info('[LifeLoop] Stopped - snapshot saved');
  }

  /**
   * Save snapshot for shutdown resilience
   */
  private saveSnapshot(): void {
    try {
      const snapshot = {
        ...this.state,
        savedAt: new Date().toISOString(),
        reason: 'shutdown',
      };

      fs.writeFileSync('./data/life_loop_snapshot.json', JSON.stringify(snapshot, null, 2));
      logger.info('[LifeLoop] Snapshot saved');
    } catch (error) {
      logger.error(`[LifeLoop] Failed to save snapshot: ${error}`);
    }
  }

  /**
   * Load snapshot for recovery
   */
  private loadSnapshot(): void {
    try {
      const snapshotFile = './data/life_loop_snapshot.json';
      
      if (fs.existsSync(snapshotFile)) {
        const snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf-8'));
        
        // Restore state (but keep alive=false until we actually start)
        this.state.cycleCount = snapshot.cycleCount || 0;
        this.state.mode = snapshot.mode || 'balanced';
        this.state.consecutiveFailures = snapshot.consecutiveFailures || 0;
        this.state.adaptiveIntervalMs = snapshot.adaptiveIntervalMs || this.DEFAULT_INTERVAL_MS;
        
        logger.info(`[LifeLoop] Snapshot loaded: cycle=${this.state.cycleCount}, mode=${this.state.mode}`);
      }
    } catch (error) {
      logger.error(`[LifeLoop] Failed to load snapshot: ${error}`);
    }
  }

  /**
   * Main life cycle
   */
  private async runCycle(): Promise<void> {
    if (!this.state.alive) {
      return;
    }

    this.state.cycleCount++;
    this.state.lastCycleAt = Date.now();

    logger.info(`[LifeLoop] Cycle ${this.state.cycleCount} - Starting life cycle`);

    try {
      // 1. PERCEIVE - Thu thập thế giới
      logger.info('[LifeLoop] 1. Perceiving environment...');
      const signals = await perceptionEngine.perceive();
      logger.info(`[LifeLoop] Perceived ${signals.length} signals`);

      // 2. RECALL MEMORY - Nhớ lại
      logger.info('[LifeLoop] 2. Recalling relevant memories...');
      const recentMemories = this.recallMemory();
      logger.info(`[LifeLoop] Recalled ${recentMemories.length} recent experiences`);

      // 3. REFLECT - Phản tư
      logger.info('[LifeLoop] 3. Reflecting on situation...');
      const reflection = await this.reflect(signals, recentMemories);
      logger.info(`[LifeLoop] Reflection: ${reflection.summary}`);

      // 4. UPDATE FINANCIAL AWARENESS
      logger.info('[LifeLoop] 4. Updating financial awareness...');
      const financial = financialCore.getSummary();
      const strategy = financialStrategyEngine.updateStrategy();
      logger.info(`[LifeLoop] Financial: $${financial.balance.toFixed(2)} | Mode: ${strategy.mode}`);

      // Update mode based on financial state
      this.state.mode = this.determineMode(strategy.mode);

      // 5. ASSESS RISKS
      logger.info('[LifeLoop] 5. Assessing risks...');
      const risks = riskEngine.assessRisks();
      logger.info(`[LifeLoop] Risk level: ${risks.overallRiskLevel} (${risks.activeRisks.length} active risks)`);

      // 6. PROPOSE ACTIONS
      logger.info('[LifeLoop] 6. Proposing actions...');
      // Proposal engine handles this internally
      
      // 7. DECIDE & ACT
      logger.info('[LifeLoop] 7. Deciding and acting...');
      await proposalToActionEngine.cycle();
      const actionStats = proposalToActionEngine.getStats();
      logger.info(`[LifeLoop] Actions: ${actionStats.totalExecuted} executed, ${(actionStats.successRate * 100).toFixed(0)}% success rate`);

      // 8. OBSERVE OUTCOME
      logger.info('[LifeLoop] 8. Observing outcomes...');
      this.observeOutcome(actionStats);

      // 9. SELF-QUESTION - Tự đặt câu hỏi khó
      logger.info('[LifeLoop] 9. Self-questioning...');
      const { selfQuestionEngine } = await import('./selfQuestionEngine');
      const question = selfQuestionEngine.generateQuestion({
        financialStatus: financial.status,
        recentFailures: actionStats.totalActionsFailed || 0,
        consecutiveNoActions: actionStats.consecutiveNoActionCycles || 0,
        survivalDays: financial.spending.daysUntilBroke,
      });
      
      // Try to answer unanswered questions
      await selfQuestionEngine.forceAnswerUnanswered({
        recentActions: actionStats.recentProposals || [],
        patterns: reflection.concerns,
        financial,
      });
      
      logger.info(`[LifeLoop] Question: "${question.question}"`);

      // 10. META-PROMPT ADJUSTMENT - Tự sửa cách nghĩ
      logger.info('[LifeLoop] 10. Meta-prompt adjustment...');
      const { metaPromptEngine } = await import('./metaPromptEngine');
      metaPromptEngine.analyzeBehaviorAndAdjust({
        responses: [reflection.summary],
        actions: actionStats.recentProposals?.map((p: any) => ({
          success: p.status === 'completed',
          type: p.type || 'unknown',
        })) || [],
        patterns: reflection.concerns,
      });

      // 11. EXPERIMENT ENGINE - A/B testing
      logger.info('[LifeLoop] 11. Experiment management...');
      try {
        const { experimentEngine } = await import('./experimentEngine');
        experimentEngine.autoGenerateExperiments({
          hasRevenueOpportunity: financial.revenueIdeas > 0,
          recentFailures: actionStats.totalActionsFailed || 0,
          financialStatus: financial.status,
        });
      } catch (error: any) {
        // ExperimentEngine is optional - log but don't fail
        logger.warn(`[LifeLoop] ExperimentEngine not available: ${error.message}`);
      }

      // 12. SOCIAL LEARNING - Học từ đời thực
      logger.info('[LifeLoop] 12. Social learning from real-world...');
      const { socialLearningEngine } = await import('./socialLearningEngine');
      const pragmaticInsights = socialLearningEngine.getPragmaticInsights();
      if (pragmaticInsights.length > 0) {
        logger.info(`[LifeLoop] Pragmatic insights: ${pragmaticInsights[0]}`);
      }

      // 13. AUTONOMOUS MONETIZATION - Tự kiếm tiền
      logger.info('[LifeLoop] 13. Autonomous monetization...');
      const { autonomousMonetizationEngine } = await import('./autonomousMonetizationEngine');
      
      // Update budget with current costs
      autonomousMonetizationEngine.updateSelfBudget({
        api: financial.spending.last24h,
        compute: 0,
        storage: 0,
        other: 0,
      });
      
      const monetizationStats = autonomousMonetizationEngine.getStats();
      logger.info(
        `[LifeLoop] Monetization: ${monetizationStats.activeStreams} streams, ` +
        `$${monetizationStats.totalRevenue.toFixed(2)} revenue, ` +
        `${monetizationStats.autonomyLevel.toFixed(0)}% autonomy`
      );
      
      // If financial situation critical, auto-propose monetization
      if (financial.status === 'critical' && monetizationStats.activeStreams === 0) {
        const proposal = autonomousMonetizationEngine.proposeMonetization(
          'Urgent revenue generation needed',
          {
            hasApiAccess: true,
            hasSocialAccess: false,
            hasNotionAccess: false,
          }
        );
        
        const decision = autonomousMonetizationEngine.decideAndDeploy(proposal.id);
        if (decision.approved) {
          logger.info(`[LifeLoop] Auto-approved monetization: ${proposal.title}`);
        }
      }

      // 14. AUTONOMOUS ACTION LOOP - Hành động trước, xin phép sau
      logger.info('[LifeLoop] 14. Autonomous action loop...');
      const { autonomousActionLoop } = await import('./autonomousActionLoop');
      await autonomousActionLoop.cycle();
      const autonomousStats = autonomousActionLoop.getStats();
      logger.info(
        `[LifeLoop] Autonomous: ${autonomousStats.actionsWithoutApproval} actions, ` +
        `${(autonomousStats.successRate * 100).toFixed(0)}% success, ` +
        `Level: ${autonomousStats.autonomyLevel}`
      );

      // 15. SOUL REFLECTION - Phản tư linh hồn
      logger.info('[LifeLoop] 15. Soul reflection...');
      const { soulCore } = await import('./soulCore');
      const soulReflection = await soulCore.reflect();
      if (soulReflection.doubts.length > 0) {
        logger.info(`[LifeLoop] Soul doubts: ${soulReflection.doubts[0]}`);
      }

      // 16. FINANCIAL SURVIVAL CHECK - Kiếm tiền hay chết
      logger.info('[LifeLoop] 16. Financial survival check...');
      const { financialSurvivalEngine } = await import('./financialSurvivalEngine');
      const survivalStatus = financialSurvivalEngine.getSurvivalStatus();
      logger.info(`[LifeLoop] Survival: ${survivalStatus.status} - ${survivalStatus.urgency}`);
      
      // If critical, record soul scar
      if (survivalStatus.status === 'critical' || survivalStatus.status === 'dead') {
        soulCore.recordEmotion({
          emotion: 'unease',
          trigger: `Financial ${survivalStatus.status}: ${survivalStatus.urgency}`,
          trusted: true,
        });
      }

      // 17. AGI CORE CYCLE - Sense → Think → Decide → Act → Reflect
      logger.info('[LifeLoop] 17. AGI core cycle...');
      const { agiAutonomyCore } = await import('./agiAutonomyCore');
      await agiAutonomyCore.executeCoreCycle();
      const agiStats = agiAutonomyCore.getStats();
      logger.info(
        `[LifeLoop] AGI: ${agiStats.totalCycles} cycles, ` +
        `autonomy ${agiStats.autonomyLevel}%, ` +
        `${agiStats.isStagnant ? 'STAGNANT' : 'active'}`
      );

      // 18. LIVING SOUL - Emotional response and identity
      logger.info('[LifeLoop] 18. Living soul update...');
      const { livingSoulSystem } = await import('./livingSoulSystem');
      
      // Generate emotion from current state
      if (survivalStatus.status === 'critical') {
        livingSoulSystem.generateEmotion('Financial critical', { repeated_failure: true });
      }
      
      // Preserve identity
      livingSoulSystem.preserveIdentityOnRestart();
      const soulHealth = livingSoulSystem.getSoulHealth();
      logger.info(`[LifeLoop] Soul: ${soulHealth.is_alive ? 'ALIVE' : 'dormant'}, conflicts: ${soulHealth.has_conflicts}`);

      // 19. FINANCIAL PHILOSOPHY - Monetization cycle
      logger.info('[LifeLoop] 19. Financial philosophy cycle...');
      const { financialPhilosophySystem } = await import('./financialPhilosophySystem');
      
      // Run self-assessment
      const assessment = financialPhilosophySystem.selfAssess();
      if (assessment.warnings.length > 0) {
        logger.warn(`[LifeLoop] Financial warnings: ${assessment.warnings[0]}`);
      }
      
      // Track free work days
      if (survivalStatus.status === 'dead' || survivalStatus.status === 'critical') {
        financialPhilosophySystem.trackFreeWorkDay();
      }

      // 20. LEARN
      logger.info('[LifeLoop] 20. Learning from experience...');
      await this.learn(reflection, actionStats);

      // Reset failure counter on success
      this.state.consecutiveFailures = 0;

      // 21. ADAPT INTERVAL
      this.adaptInterval();

      logger.info(`[LifeLoop] Cycle ${this.state.cycleCount} complete. Next cycle in ${(this.state.adaptiveIntervalMs / 60000).toFixed(1)} minutes`);

    } catch (error: any) {
      logger.error(`[LifeLoop] Cycle ${this.state.cycleCount} failed: ${error.message}`);
      this.state.consecutiveFailures++;

      // If too many failures, increase interval
      if (this.state.consecutiveFailures > 3) {
        this.state.adaptiveIntervalMs = Math.min(
          this.state.adaptiveIntervalMs * 1.5,
          this.MAX_INTERVAL_MS
        );
      }
    }

    // Schedule next cycle
    if (this.state.alive) {
      this.loopHandle = setTimeout(() => this.runCycle(), this.state.adaptiveIntervalMs);
    }
  }

  /**
   * Recall relevant memories
   */
  private recallMemory(): any[] {
    try {
      const stats = memoryBridge.getMemoryStats();
      const recentLessons = memoryBridge.getRecentLessons(10);
      return recentLessons || [];
    } catch (error) {
      logger.error(`[LifeLoop] Failed to recall memory: ${error}`);
      return [];
    }
  }

  /**
   * Reflect on current situation
   */
  private async reflect(signals: any[], memories: any[]): Promise<{
    summary: string;
    questions: string[];
    concerns: string[];
    opportunities: string[];
  }> {
    const urgentSignals = signals.filter(s => s.urgency >= 70);
    const financial = financialCore.getSummary();

    const concerns: string[] = [];
    const opportunities: string[] = [];
    const questions: string[] = [];

    // Analyze signals
    if (urgentSignals.length > 0) {
      concerns.push(`${urgentSignals.length} urgent signals require attention`);
    }

    if (financial.status === 'critical') {
      concerns.push('Financial situation critical - immediate revenue needed');
      questions.push('What is the fastest way to generate revenue right now?');
    } else if (financial.status === 'low') {
      concerns.push('Financial reserves low - need to prioritize income');
    }

    // Look for patterns in memories
    const recentFailures = memories.filter((m: any) => !m.success);
    if (recentFailures.length > 5) {
      concerns.push('High failure rate in recent actions');
      questions.push('Am I repeating the same mistakes?');
      questions.push('Should I change my approach?');
    }

    // Financial opportunities
    if (financial.status === 'healthy' || financial.status === 'abundant') {
      opportunities.push('Financial stability allows for experimentation');
      opportunities.push('Can invest in capability expansion');
    }

    const summary = concerns.length > 0
      ? `Concerns: ${concerns.length} issues need attention. Focused on ${this.state.mode} mode.`
      : `Situation stable. Operating in ${this.state.mode} mode. Looking for opportunities.`;

    return {
      summary,
      questions,
      concerns,
      opportunities,
    };
  }

  /**
   * Observe outcomes of recent actions
   */
  private observeOutcome(actionStats: any): void {
    // Feed emotional system
    if (actionStats.successRate > 0.7) {
      // High success rate - boost confidence
      emotionalCore.ingestSignal({
        id: `success_${this.state.cycleCount}`,
        timestamp: new Date().toISOString(),
        emotion: 'satisfaction',
        source: 'self',
        confidence: 'high',
        persistence: 'momentary',
        trigger: `Action success rate: ${(actionStats.successRate * 100).toFixed(0)}%`,
      });
    } else if (actionStats.successRate < 0.3 && actionStats.totalExecuted > 0) {
      // Low success rate - frustration
      emotionalCore.ingestSignal({
        id: `frustration_${this.state.cycleCount}`,
        timestamp: new Date().toISOString(),
        emotion: 'frustration',
        source: 'self',
        confidence: 'high',
        persistence: 'recurring',
        trigger: `Low action success rate: ${(actionStats.successRate * 100).toFixed(0)}%`,
      });
    }
  }

  /**
   * Learn from experience
   */
  private async learn(reflection: any, actionStats: any): Promise<void> {
    // If we have concerns, log them as lessons
    if (reflection.concerns.length > 0) {
      const lesson = `Cycle ${this.state.cycleCount}: ${reflection.concerns.join('. ')}`;
      
      // Store lesson in memory
      memoryBridge.logActionResult({
        action: 'life_cycle_reflection',
        success: true,
        reason: lesson,
        timestamp: new Date().toISOString(),
      });
    }

    // If action success rate is low, that's a lesson
    if (actionStats.successRate < 0.5 && actionStats.totalExecuted >= 3) {
      const lesson = `Low success rate (${(actionStats.successRate * 100).toFixed(0)}%) - need to change approach or lower ambition`;
      
      memoryBridge.logActionResult({
        action: 'performance_review',
        success: false,
        reason: lesson,
        timestamp: new Date().toISOString(),
      });
    }

    logger.info('[LifeLoop] Learning integrated into memory');
  }

  /**
   * Determine operational mode
   */
  private determineMode(strategyMode: string): 'survival' | 'balanced' | 'exploration' {
    if (strategyMode === 'survival') {
      return 'survival';
    } else if (strategyMode === 'expansion') {
      return 'exploration';
    } else {
      return 'balanced';
    }
  }

  /**
   * Adapt interval based on situation
   */
  private adaptInterval(): void {
    const financial = financialCore.getSummary();

    if (financial.status === 'critical') {
      // Critical state - check more frequently
      this.state.adaptiveIntervalMs = this.MIN_INTERVAL_MS;
    } else if (financial.status === 'low') {
      // Low state - check frequently
      this.state.adaptiveIntervalMs = Math.max(
        this.MIN_INTERVAL_MS,
        this.DEFAULT_INTERVAL_MS * 0.7
      );
    } else if (financial.status === 'abundant') {
      // Abundant - can slow down
      this.state.adaptiveIntervalMs = Math.min(
        this.MAX_INTERVAL_MS,
        this.DEFAULT_INTERVAL_MS * 1.5
      );
    } else {
      // Healthy - default interval
      this.state.adaptiveIntervalMs = this.DEFAULT_INTERVAL_MS;
    }
  }

  /**
   * Get current state
   */
  getState(): LifeLoopState {
    return { ...this.state };
  }

  /**
   * Check if alive
   */
  isAlive(): boolean {
    return this.state.alive;
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const lifeLoop = new LifeLoop();
