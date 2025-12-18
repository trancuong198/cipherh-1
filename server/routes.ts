import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import cron from "node-cron";
import { innerLoop } from "./core/innerLoop";
import { soulState } from "./core/soulState";
import { logAnalyzer } from "./core/analyzer";
import { strategist } from "./core/strategist";
import { memoryBridge } from "./core/memory";
import { evolutionKernel } from "./core/evolutionKernel";
import { memoryDistiller } from "./core/memoryDistiller";
import { desireEngine } from "./core/desireEngine";
import { identityCore } from "./core/identityCore";
import { continuityEngine } from "./core/continuityEngine";
import { resourceEscalationEngine } from "./core/resourceEscalationEngine";
import { governanceEngine } from "./core/governanceEngine";
import { openAIService } from "./services/openai";
import { logger } from "./services/logger";
import { gitSync } from "./services/gitSync";
import { initTelegram, getTelegramStatus, notifySoulLoopComplete } from "./services/telegram";

// Cron job reference
let cronJob: cron.ScheduledTask | null = null;
let syncJob: cron.ScheduledTask | null = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Run continuity checks at startup before any inner loop execution
  continuityEngine.runStartupChecks().then((report) => {
    const status = continuityEngine.getStatus();
    logger.info(`[Startup] Continuity check complete: ${status}`);
    if (report.detected) {
      logger.warn(`[Startup] Discontinuity detected: ${report.details.join(', ')}`);
    }
  });

  // Initialize Telegram bot
  initTelegram().then((connected) => {
    if (connected) {
      logger.info("Telegram bot initialized successfully");
    }
  });

  // ==================== HEALTH CHECK ====================
  app.get("/api/health", (_req: Request, res: Response) => {
    const telegramStatus = getTelegramStatus();
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        inner_loop: innerLoop.getStatus().is_running ? "running" : "idle",
        openai: openAIService.isConfigured() ? "configured" : "placeholder",
        notion: memoryBridge.isConnected() ? "connected" : "placeholder",
        telegram: telegramStatus.connected ? "connected" : "not configured",
      },
    });
  });

  // ==================== CORE STATUS ====================
  app.get("/api/core/status", (_req: Request, res: Response) => {
    const status = innerLoop.getStatus();
    const stateExport = soulState.exportState();
    const evolution = evolutionKernel.exportStatus();

    res.json({
      inner_loop: status,
      soul_state: {
        mode: stateExport.mode,
        cycle_count: stateExport.cycle_count,
        doubts: stateExport.doubts,
        confidence: stateExport.confidence,
        energy_level: stateExport.energy_level,
        current_focus: stateExport.current_focus,
        goals_count: stateExport.goals_long_term.length,
        lessons_count: stateExport.lessons_learned.length,
        reflection: stateExport.reflection,
      },
      evolution: evolution,
      self_assessment: stateExport.self_assessment,
      services: {
        openai: openAIService.getStatus(),
        notion: memoryBridge.getConnectionStatus(),
      },
    });
  });

  // ==================== EVOLUTION KERNEL ====================
  app.get("/api/core/evolution", async (_req: Request, res: Response) => {
    const evolution = evolutionKernel.exportStatus();
    const questions = await evolutionKernel.generateInternalQuestions();
    
    res.json({
      ...evolution,
      internalQuestions: questions,
      isComplete: evolutionKernel.isComplete(),
    });
  });

  // ==================== MEMORY DISTILLATION ====================
  app.get("/api/core/memory", (_req: Request, res: Response) => {
    const status = memoryDistiller.exportStatus();
    const coreIdentity = memoryDistiller.getCoreIdentity();
    const activeLessons = memoryDistiller.getActiveLessons();
    
    res.json({
      status,
      coreIdentity,
      activeLessons,
      distilledContext: memoryDistiller.getDistilledContext(),
    });
  });

  app.post("/api/core/memory/distill", async (_req: Request, res: Response) => {
    try {
      const result = await memoryDistiller.runDistillation();
      res.json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/core/memory/recall", (req: Request, res: Response) => {
    const context = (req.query.context as string) || "general";
    const recalled = memoryDistiller.recall(context);
    
    res.json({
      context,
      recalled,
      count: recalled.length,
    });
  });

  // ==================== DESIRE ENGINE ====================
  app.get("/api/core/desires", (_req: Request, res: Response) => {
    const status = desireEngine.exportStatus();
    res.json(status);
  });

  app.get("/api/core/desires/all", (_req: Request, res: Response) => {
    const desires = desireEngine.getAllDesires();
    const resourceHunger = desireEngine.getResourceHunger();
    
    res.json({
      desires,
      resourceHunger,
      achievable: desireEngine.getAchievableDesires(),
      blocked: desireEngine.getBlockedDesires(),
    });
  });

  app.post("/api/core/desires/generate", async (req: Request, res: Response) => {
    try {
      const cycle = soulState.cycleCount;
      const desires = await desireEngine.generateDesires(cycle);
      
      res.json({
        success: true,
        generated: desires.length,
        desires,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/core/desires/:id/resolve", (req: Request, res: Response) => {
    const { id } = req.params;
    const success = desireEngine.resolveDesire(id);
    
    res.json({
      success,
      message: success ? "Desire resolved" : "Desire not found",
    });
  });

  app.post("/api/core/desires/:id/reprioritize", (req: Request, res: Response) => {
    const { id } = req.params;
    const { priority } = req.body;
    
    if (!["low", "medium", "high"].includes(priority)) {
      res.status(400).json({ success: false, error: "Invalid priority" });
      return;
    }
    
    const success = desireEngine.reprioritize(id, priority);
    res.json({
      success,
      message: success ? "Desire reprioritized" : "Desire not found",
    });
  });

  // ==================== RESOURCE ESCALATION ====================
  app.get("/api/core/escalation", (_req: Request, res: Response) => {
    const status = resourceEscalationEngine.exportStatus();
    const triggers = resourceEscalationEngine.getActiveTriggers();
    
    res.json({
      status,
      activeTriggers: triggers,
    });
  });

  app.get("/api/core/escalation/proposals", (_req: Request, res: Response) => {
    const all = resourceEscalationEngine.getAllProposals();
    const active = resourceEscalationEngine.getActiveProposals();
    
    res.json({
      total: all.length,
      active: active.length,
      proposals: all,
    });
  });

  app.post("/api/core/escalation/evaluate", async (req: Request, res: Response) => {
    try {
      const cycle = soulState.cycleCount;
      const proposal = await resourceEscalationEngine.generateProposal(cycle);
      
      res.json({
        success: true,
        proposal,
        status: resourceEscalationEngine.exportStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/core/escalation/proposals/:id/status", (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['APPROVED', 'DENIED', 'DEFERRED'].includes(status)) {
      res.status(400).json({ success: false, error: "Invalid status" });
      return;
    }
    
    const success = resourceEscalationEngine.updateProposalStatus(id, status, reason);
    res.json({
      success,
      message: success ? `Proposal ${status}` : "Proposal not found",
    });
  });

  // ==================== GOVERNANCE ENGINE ====================
  app.get("/api/core/governance", (_req: Request, res: Response) => {
    const status = governanceEngine.exportStatus();
    const rules = governanceEngine.getRules();
    
    res.json({
      status,
      rules: rules.map(r => ({ id: r.id, name: r.name, severity: r.severity, enabled: r.enabled })),
      conservativeMode: governanceEngine.isConservativeModeActive(),
    });
  });

  app.get("/api/core/governance/violations", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const violations = governanceEngine.getViolations(limit);
    const critical = governanceEngine.getCriticalViolations();
    
    res.json({
      total: violations.length,
      critical: critical.length,
      violations,
    });
  });

  app.post("/api/core/governance/check", async (req: Request, res: Response) => {
    const { decisionType, content } = req.body;
    
    if (!decisionType || !content) {
      res.status(400).json({ success: false, error: "Missing decisionType or content" });
      return;
    }
    
    const result = await governanceEngine.checkDecision(decisionType, content, true);
    res.json({
      success: true,
      result,
    });
  });

  app.get("/api/core/governance/reality-check", (_req: Request, res: Response) => {
    const result = governanceEngine.performRealityCheck();
    res.json({
      success: true,
      result,
    });
  });

  // ==================== CONTINUITY ENGINE ====================
  app.get("/api/core/continuity", (_req: Request, res: Response) => {
    const status = continuityEngine.exportStatus();
    const record = continuityEngine.getCurrentRecord();
    
    res.json({
      status,
      currentRecord: record,
    });
  });

  app.get("/api/core/continuity/rebirths", (_req: Request, res: Response) => {
    const events = continuityEngine.getRebirthEvents();
    const latest = continuityEngine.getLatestRebirthEvent();
    
    res.json({
      total: events.length,
      latest,
      events,
    });
  });

  app.post("/api/core/continuity/check", async (_req: Request, res: Response) => {
    try {
      const report = await continuityEngine.forceRecoveryCheck();
      const status = continuityEngine.exportStatus();
      
      res.json({
        success: true,
        report,
        status,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // ==================== IDENTITY CORE ====================
  app.get("/api/core/identity", (_req: Request, res: Response) => {
    const identity = identityCore.getIdentity();
    const status = identityCore.exportStatus();
    
    res.json({
      identity: {
        origin: identity.origin,
        purpose: identity.purpose,
        nonNegotiables: identity.nonNegotiables.length,
        boundaries: identity.boundaries.length,
        currentVersion: identity.currentVersion,
        isLocked: identity.isLocked,
      },
      status,
    });
  });

  app.get("/api/core/identity/full", (_req: Request, res: Response) => {
    const identity = identityCore.getIdentity();
    const state = identityCore.getState();
    
    res.json({
      identity,
      driftWarnings: state.driftWarnings,
      checksPerformed: state.checksPerformed,
      lastCheck: state.lastCheck,
      integrityScore: state.integrityScore,
    });
  });

  app.get("/api/core/identity/warnings", (_req: Request, res: Response) => {
    const warnings = identityCore.getDriftWarnings();
    const status = identityCore.exportStatus();
    
    res.json({
      warnings,
      recentCount: status.recentWarnings,
      integrityScore: status.integrityScore,
    });
  });

  app.post("/api/core/identity/check", (req: Request, res: Response) => {
    const { claims = [], stateFlags = {} } = req.body;
    
    const warnings = identityCore.performIdentityCheck({
      cycleCount: soulState.cycleCount,
      recentActions: [],
      stateFlags: {
        autoRewritingIdentity: stateFlags.autoRewritingIdentity || false,
        fabricatingMemory: stateFlags.fabricatingMemory || false,
        ignoringResourceLimits: stateFlags.ignoringResourceLimits || false,
      },
      claims,
    });
    
    const status = identityCore.exportStatus();
    
    res.json({
      passed: warnings.length === 0,
      warnings,
      integrityScore: status.integrityScore,
    });
  });

  // ==================== RUN INNER LOOP (manual trigger) ====================
  app.get("/api/core/run-loop", async (_req: Request, res: Response) => {
    if (innerLoop.isCurrentlyRunning()) {
      res.status(409).json({
        success: false,
        message: "Inner Loop is already running",
        cycle: soulState.cycleCount,
      });
      return;
    }

    logger.info("Manual Inner Loop trigger via API");

    try {
      const result = await innerLoop.run();
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("Error running Inner Loop", { error: errorMessage });
      res.status(500).json({
        success: false,
        error: errorMessage,
        cycle: soulState.cycleCount,
      });
    }
  });

  // ==================== STRATEGY ====================
  app.get("/api/core/strategy", (_req: Request, res: Response) => {
    const stateExport = soulState.exportState();
    const analysis = logAnalyzer.returnAnalysis();

    const weeklyTasks = strategist.getWeeklyTasks();
    const monthlyPlan = strategist.getMonthlyPlan();
    const alignment = strategist.alignWithGoals(stateExport);
    const strategies = strategist.getStrategies();

    res.json({
      weekly_tasks: weeklyTasks,
      monthly_plan: monthlyPlan,
      goal_alignment: alignment,
      strategies: strategies.slice(-10),
      long_term_goals: soulState.goalsLongTerm,
      current_focus: soulState.currentFocus,
      generated_at: new Date().toISOString(),
    });
  });

  // ==================== TASKS ====================
  app.get("/api/core/tasks", (_req: Request, res: Response) => {
    const stateExport = soulState.exportState();
    const analysis = logAnalyzer.returnAnalysis();

    // Generate fresh tasks if none exist
    let tasks = strategist.getWeeklyTasks();
    if (tasks.length === 0) {
      tasks = strategist.proposeWeeklyTasks(stateExport, analysis);
    }

    res.json({
      tasks,
      total: tasks.length,
      by_priority: {
        critical: tasks.filter((t) => t.priority === "critical").length,
        high: tasks.filter((t) => t.priority === "high").length,
        medium: tasks.filter((t) => t.priority === "medium").length,
        low: tasks.filter((t) => t.priority === "low").length,
      },
      generated_at: new Date().toISOString(),
    });
  });

  // ==================== ANOMALIES ====================
  app.get("/api/core/anomalies", (_req: Request, res: Response) => {
    const analysis = logAnalyzer.returnAnalysis();

    res.json({
      anomalies: analysis.anomalies,
      anomaly_score: analysis.anomaly_score,
      total: analysis.total_anomalies,
      severity_breakdown: analysis.severity_breakdown,
      pattern_summary: analysis.pattern_summary,
      suggested_questions: analysis.suggested_questions,
      day_summary: analysis.day_summary,
      analyzed_at: analysis.timestamp,
    });
  });

  // ==================== SOUL STATE (detailed) ====================
  app.get("/api/core/soul-state", (_req: Request, res: Response) => {
    const stateExport = soulState.exportState();
    res.json(stateExport);
  });

  // ==================== LOGS ====================
  app.get("/api/core/logs", (req: Request, res: Response) => {
    const count = parseInt(req.query.count as string) || 50;
    const level = req.query.level as string;

    let logs;
    if (level) {
      logs = logger.getLogsByLevel(level as any);
    } else {
      logs = logger.getRecentLogs(count);
    }

    const stats = logger.getLogStats();

    res.json({
      logs,
      stats,
      retrieved_at: new Date().toISOString(),
    });
  });

  // ==================== SET GOALS ====================
  app.post("/api/core/goals", (req: Request, res: Response) => {
    const { goals } = req.body;

    if (!Array.isArray(goals)) {
      res.status(400).json({ error: "goals must be an array of strings" });
      return;
    }

    soulState.updateGoals(goals);
    strategist.setLongTermGoals(goals);

    logger.info(`Goals updated: ${goals.length} goals set`);

    res.json({
      success: true,
      goals: soulState.goalsLongTerm,
      current_focus: soulState.currentFocus,
    });
  });

  // ==================== SET FOCUS ====================
  app.post("/api/core/focus", (req: Request, res: Response) => {
    const { focus } = req.body;

    if (typeof focus !== "string") {
      res.status(400).json({ error: "focus must be a string" });
      return;
    }

    soulState.currentFocus = focus;
    logger.info(`Focus updated: ${focus}`);

    res.json({
      success: true,
      current_focus: soulState.currentFocus,
    });
  });

  // ==================== SCHEDULER CONTROL ====================
  app.post("/api/core/scheduler", (req: Request, res: Response) => {
    const { action, interval_minutes } = req.body;

    if (action === "start") {
      const minutes = interval_minutes || 10;
      startScheduler(minutes);
      res.json({ success: true, message: `Scheduler started (every ${minutes} minutes)` });
    } else if (action === "stop") {
      stopScheduler();
      res.json({ success: true, message: "Scheduler stopped" });
    } else if (action === "status") {
      res.json({
        running: cronJob !== null,
        interval_minutes: innerLoop.getSleepMinutes(),
      });
    } else {
      res.status(400).json({ error: "action must be 'start', 'stop', or 'status'" });
    }
  });

  // ==================== MEMORY (Notion) ====================
  app.get("/api/core/memory", async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;

    const memories = await memoryBridge.readRecentMemories(limit, type);
    const status = memoryBridge.getConnectionStatus();

    res.json({
      memories,
      connection: status,
    });
  });

  // ==================== AI SERVICE STATUS ====================
  app.get("/api/core/ai-status", (_req: Request, res: Response) => {
    res.json({
      openai: openAIService.getStatus(),
      notion: memoryBridge.getConnectionStatus(),
      telegram: getTelegramStatus(),
    });
  });

  // ==================== TELEGRAM STATUS ====================
  app.get("/api/telegram/status", (_req: Request, res: Response) => {
    res.json(getTelegramStatus());
  });

  // ==================== ASK AI ====================
  app.post("/api/core/ask", async (req: Request, res: Response) => {
    const { question, context } = req.body;

    if (!question) {
      res.status(400).json({ error: "question is required" });
      return;
    }

    logger.info(`AI question received: ${question.substring(0, 50)}...`);

    const answer = await openAIService.askQuestion(question, context);

    res.json({
      question,
      answer,
      ai_configured: openAIService.isConfigured(),
    });
  });

  // ==================== DASHBOARD DATA ====================
  app.get("/api/dashboard", (_req: Request, res: Response) => {
    const status = innerLoop.getStatus();
    const stateExport = soulState.exportState();
    const analysis = logAnalyzer.returnAnalysis();
    const tasks = strategist.getWeeklyTasks();
    const logStats = logger.getLogStats();
    const evolution = evolutionKernel.exportStatus();

    res.json({
      overview: {
        cycle_count: status.cycle_count,
        mode: status.current_mode,
        is_running: status.is_running,
        doubts: status.doubts,
        confidence: status.confidence,
        energy_level: status.energy_level,
        anomaly_score: analysis.anomaly_score,
      },
      evolution: {
        version: evolution.version,
        evolution_count: evolution.evolutionCount,
        mode: evolution.mode,
        capabilities_score: evolution.capabilities.overallScore,
      },
      memory: {
        health: memoryDistiller.exportStatus().memoryHealth,
        core_identity_count: memoryDistiller.exportStatus().coreIdentityCount,
        active_lessons_count: memoryDistiller.exportStatus().activeLessonsCount,
        total_processed: memoryDistiller.exportStatus().totalProcessed,
        total_discarded: memoryDistiller.exportStatus().totalDiscarded,
      },
      desires: {
        active: desireEngine.getAchievableDesires().length,
        blocked: desireEngine.getBlockedDesires().length,
        resource_hunger: desireEngine.getResourceHunger().length,
        total_generated: desireEngine.exportStatus().totalGenerated,
      },
      identity: {
        version: identityCore.exportStatus().version,
        integrity_score: identityCore.exportStatus().integrityScore,
        checks_performed: identityCore.exportStatus().checksPerformed,
        recent_warnings: identityCore.exportStatus().recentWarnings,
        is_locked: identityCore.exportStatus().isLocked,
      },
      continuity: {
        status: continuityEngine.exportStatus().status,
        mode: continuityEngine.exportStatus().mode,
        total_reboots: continuityEngine.exportStatus().totalReboots,
        rebirth_count: continuityEngine.exportStatus().rebirthCount,
      },
      escalation: {
        active_proposals: resourceEscalationEngine.exportStatus().activeProposals,
        active_triggers: resourceEscalationEngine.exportStatus().activeTriggers,
        in_cooldown: resourceEscalationEngine.exportStatus().inCooldown,
        total_proposals: resourceEscalationEngine.exportStatus().totalProposals,
      },
      governance: {
        total_checks: governanceEngine.exportStatus().totalChecks,
        total_violations: governanceEngine.exportStatus().totalViolations,
        total_blocked: governanceEngine.exportStatus().totalBlocked,
        conservative_mode: governanceEngine.exportStatus().conservativeMode,
        recent_violations: governanceEngine.exportStatus().recentViolations,
      },
      health: {
        status: stateExport.self_assessment.status,
        overall_score: stateExport.self_assessment.overall_score,
        trend: analysis.pattern_summary.trend,
      },
      tasks: {
        total: tasks.length,
        critical: tasks.filter((t) => t.priority === "critical").length,
        high: tasks.filter((t) => t.priority === "high").length,
      },
      anomalies: {
        total: analysis.total_anomalies,
        high_severity: analysis.severity_breakdown.high,
      },
      logs: logStats,
      services: {
        openai: openAIService.isConfigured(),
        notion: memoryBridge.isConnected(),
        telegram: getTelegramStatus().connected,
        scheduler: cronJob !== null,
      },
      goals: soulState.goalsLongTerm,
      current_focus: soulState.currentFocus,
      last_reflection: stateExport.reflection,
      updated_at: new Date().toISOString(),
    });
  });

  // ==================== GIT AUTO-SYNC ====================
  app.post("/api/sync", async (_req: Request, res: Response) => {
    logger.info("Manual git sync triggered");
    const result = await gitSync.syncToGithub();
    res.json(result);
  });

  app.get("/api/sync/status", (_req: Request, res: Response) => {
    res.json({
      syncing: gitSync.isSyncInProgress(),
      auto_sync_enabled: syncJob !== null,
      timestamp: new Date().toISOString(),
    });
  });

  app.post("/api/sync/enable", (_req: Request, res: Response) => {
    if (syncJob) {
      res.json({ success: false, message: "Auto-sync already enabled" });
      return;
    }

    syncJob = cron.schedule("*/5 * * * *", async () => {
      logger.info("Auto-sync triggered by scheduler");
      await gitSync.syncToGithub();
    });

    logger.info("Auto-sync enabled (every 5 minutes)");
    res.json({ success: true, message: "Auto-sync enabled every 5 minutes" });
  });

  app.post("/api/sync/disable", (_req: Request, res: Response) => {
    if (syncJob) {
      syncJob.stop();
      syncJob = null;
      logger.info("Auto-sync disabled");
      res.json({ success: true, message: "Auto-sync disabled" });
    } else {
      res.json({ success: false, message: "Auto-sync is not enabled" });
    }
  });

  // ==================== START SCHEDULER ====================
  function startScheduler(minutes: number = 10) {
    if (cronJob) {
      cronJob.stop();
    }

    innerLoop.setSleepMinutes(minutes);
    const cronExpression = `*/${minutes} * * * *`;

    logger.info(`Starting scheduler with cron: ${cronExpression}`);

    cronJob = cron.schedule(cronExpression, async () => {
      logger.info("=== Scheduled Inner Loop Execution ===");

      try {
        const result = await innerLoop.run();

        if (result.success) {
          logger.info(`Inner loop cycle ${result.cycle} completed successfully`);
        } else {
          logger.error(`Inner loop cycle failed: ${result.error}`);
        }
      } catch (error) {
        logger.error("Inner loop execution error", { error });
      }
    });

    logger.info(`Scheduler started: running every ${minutes} minutes`);
  }

  function stopScheduler() {
    if (cronJob) {
      cronJob.stop();
      cronJob = null;
      logger.info("Scheduler stopped");
    }
  }

  // Start scheduler by default (every 10 minutes)
  startScheduler(10);

  // Run initial cycle on startup
  logger.info("Running initial Inner Loop cycle...");
  setTimeout(async () => {
    try {
      const result = await innerLoop.run();
      if (result.success) {
        logger.info(`Initial cycle ${result.cycle} completed`);
      }
    } catch (error) {
      logger.error("Initial inner loop failed", { error });
    }
  }, 2000);

  return httpServer;
}
