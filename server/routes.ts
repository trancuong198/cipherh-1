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
import { metaEvolutionEngine } from "./core/metaEvolutionEngine";
import { providerRegistry } from "./providers/providerRegistry";
import { measurementEngine } from "./core/measurementEngine";
import { socialFeedbackEngine } from "./core/socialFeedbackEngine";
import { communicationRefinementEngine } from "./core/communicationRefinementEngine";
import { taskStrategySynthesisEngine } from "./core/taskStrategySynthesisEngine";
import { operationsLimitsEngine } from "./core/operationsLimitsEngine";
import { playbook30Days } from "./core/playbook30Days";
import { selectiveUpgradeEngine } from "./core/selectiveUpgradeEngine";
import { governedScaleEngine } from "./core/governedScaleEngine";
import { successionEngine } from "./core/successionEngine";
import { coreMissions } from "./core/coreMissions";
import { agencyCore } from "./core/agencyCore";
import { realityCore } from "./core/realityCore";
import { longevityLoop } from "./core/longevityLoop";
import { identityRelationCore } from "./core/identityRelationCore";
import { desireCore } from "./core/desireCore";
import { resourceEscalationCore } from "./core/resourceEscalationCore";
import { observabilityCore } from "./core/observabilityCore";
import { daemon } from "./core/daemon";
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

  // ==================== PROVIDER ABSTRACTION ====================
  app.get("/api/providers", (_req: Request, res: Response) => {
    const status = providerRegistry.exportStatus();
    res.json(status);
  });

  app.get("/api/providers/:type", (req: Request, res: Response) => {
    const type = req.params.type as 'llm' | 'memory' | 'infra';
    if (!['llm', 'memory', 'infra'].includes(type)) {
      res.status(400).json({ success: false, error: "Invalid provider type" });
      return;
    }
    
    const providers = providerRegistry.listProviders(type);
    res.json({ type, providers });
  });

  app.get("/api/providers/health/all", async (_req: Request, res: Response) => {
    try {
      const health = await providerRegistry.checkAllHealth();
      res.json({ success: true, health });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/providers/migrate/simulate", async (req: Request, res: Response) => {
    const { providerType, fromProvider, toProvider } = req.body;
    
    if (!providerType || !fromProvider || !toProvider) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }
    
    try {
      const report = await providerRegistry.simulateMigration(providerType, fromProvider, toProvider);
      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/providers/migrate/execute", async (req: Request, res: Response) => {
    const { reportId, approved } = req.body;
    
    if (!reportId) {
      res.status(400).json({ success: false, error: "Missing reportId" });
      return;
    }
    
    if (!approved) {
      res.status(400).json({ success: false, error: "Explicit approval required" });
      return;
    }
    
    const success = await providerRegistry.executeMigration(reportId, approved);
    res.json({
      success,
      message: success ? "Migration executed" : "Migration failed",
    });
  });

  app.get("/api/providers/migrate/reports", (_req: Request, res: Response) => {
    const reports = providerRegistry.getMigrationReports();
    res.json({
      total: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        from: r.fromProvider,
        to: r.toProvider,
        type: r.providerType,
        recommendation: r.recommendation,
        executed: !!r.executedAt,
      })),
    });
  });

  app.post("/api/providers/:type/revert", (req: Request, res: Response) => {
    const type = req.params.type as 'llm' | 'memory' | 'infra';
    if (!['llm', 'memory', 'infra'].includes(type)) {
      res.status(400).json({ success: false, error: "Invalid provider type" });
      return;
    }
    
    const success = providerRegistry.revertMigration(type);
    res.json({
      success,
      message: success ? "Reverted to fallback" : "Revert failed",
    });
  });

  // ==================== SOCIAL FEEDBACK ENGINE ====================
  app.get("/api/social-feedback", (_req: Request, res: Response) => {
    const status = socialFeedbackEngine.exportStatus();
    res.json(status);
  });

  app.post("/api/social-feedback/ingest", async (req: Request, res: Response) => {
    const { source, sourceId, content, metadata } = req.body;
    
    if (!source || !sourceId || !content) {
      res.status(400).json({ success: false, error: "Missing required fields" });
      return;
    }
    
    try {
      const feedback = await socialFeedbackEngine.ingestFeedback({
        source,
        sourceId,
        content,
        metadata,
      });
      res.json({ success: true, feedback });
    } catch (error) {
      res.status(400).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/social-feedback/process", async (_req: Request, res: Response) => {
    try {
      const result = await socialFeedbackEngine.processFeedbackQueue();
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/social-feedback/pending", (_req: Request, res: Response) => {
    const pending = socialFeedbackEngine.getPendingFeedback();
    res.json({ total: pending.length, pending });
  });

  app.get("/api/social-feedback/useful", (_req: Request, res: Response) => {
    const useful = socialFeedbackEngine.getUsefulFeedback();
    res.json({ total: useful.length, useful });
  });

  app.get("/api/social-feedback/risks", (_req: Request, res: Response) => {
    const risks = socialFeedbackEngine.getRiskSignals();
    res.json({ total: risks.length, risks });
  });

  app.get("/api/social-feedback/sources", (_req: Request, res: Response) => {
    const sources = socialFeedbackEngine.getAllSourceCredibilities();
    res.json({ total: sources.length, sources });
  });

  app.post("/api/social-feedback/rate-limit", (req: Request, res: Response) => {
    const { maxPerCycle } = req.body;
    
    if (typeof maxPerCycle !== 'number') {
      res.status(400).json({ success: false, error: "maxPerCycle must be a number" });
      return;
    }
    
    socialFeedbackEngine.setRateLimit(maxPerCycle);
    res.json({ success: true, maxPerCycle });
  });

  app.post("/api/social-feedback/toggle", (req: Request, res: Response) => {
    const { enabled } = req.body;
    
    if (enabled) {
      socialFeedbackEngine.enable();
    } else {
      socialFeedbackEngine.disable();
    }
    
    res.json({ success: true, enabled: socialFeedbackEngine.isEnabled() });
  });

  // ==================== COMMUNICATION REFINEMENT ====================
  app.get("/api/communication", (_req: Request, res: Response) => {
    const status = communicationRefinementEngine.exportStatus();
    res.json(status);
  });

  app.post("/api/communication/refine", async (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ success: false, error: "Missing text" });
      return;
    }
    
    try {
      const result = await communicationRefinementEngine.refineText(text);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/communication/measure", (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text) {
      res.status(400).json({ success: false, error: "Missing text" });
      return;
    }
    
    const metrics = communicationRefinementEngine.measureAll(text);
    res.json({ success: true, metrics });
  });

  app.get("/api/communication/patterns", (_req: Request, res: Response) => {
    const patterns = communicationRefinementEngine.getPatterns();
    const top = communicationRefinementEngine.getTopPatterns(5);
    res.json({ total: patterns.length, top, patterns });
  });

  app.get("/api/communication/sessions", (_req: Request, res: Response) => {
    const sessions = communicationRefinementEngine.getRecentSessions(20);
    res.json({ total: sessions.length, sessions });
  });

  app.get("/api/communication/variants", (_req: Request, res: Response) => {
    const variants = communicationRefinementEngine.getSuccessfulVariants(20);
    res.json({ total: variants.length, variants });
  });

  app.post("/api/communication/feedback", async (_req: Request, res: Response) => {
    try {
      const incorporated = await communicationRefinementEngine.incorporateFeedback();
      res.json({ success: true, incorporated });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.post("/api/communication/audience", (req: Request, res: Response) => {
    const { mode } = req.body;
    
    if (!['technical', 'general', 'mixed'].includes(mode)) {
      res.status(400).json({ success: false, error: "Invalid mode" });
      return;
    }
    
    communicationRefinementEngine.setAudienceMode(mode);
    res.json({ success: true, mode });
  });

  app.post("/api/communication/baseline", (_req: Request, res: Response) => {
    communicationRefinementEngine.captureBaseline();
    res.json({ success: true, message: "Baseline captured" });
  });

  app.post("/api/communication/toggle", (req: Request, res: Response) => {
    const { enabled } = req.body;
    
    if (enabled) {
      communicationRefinementEngine.enable();
    } else {
      communicationRefinementEngine.disable();
    }
    
    res.json({ success: true, enabled: communicationRefinementEngine.exportStatus().enabled });
  });

  // ==================== GOVERNED SCALE ====================
  app.get("/api/scale", (_req: Request, res: Response) => {
    const status = governedScaleEngine.exportStatus();
    res.json(status);
  });

  app.get("/api/scale/preconditions", (_req: Request, res: Response) => {
    const preconditions = governedScaleEngine.checkPreconditions();
    res.json(preconditions);
  });

  app.post("/api/scale/start", async (req: Request, res: Response) => {
    const { dimension, targetValue, stepSize } = req.body;
    if (!dimension || !targetValue) {
      return res.status(400).json({ error: "dimension and targetValue required" });
    }
    const ramp = await governedScaleEngine.startScaleRamp(dimension, targetValue, stepSize);
    if (ramp) {
      res.json({ success: true, ramp });
    } else {
      res.json({ success: false, error: "Cannot start scale - preconditions not met or ramp active" });
    }
  });

  app.post("/api/scale/step", async (_req: Request, res: Response) => {
    const result = await governedScaleEngine.stepRamp();
    res.json(result);
  });

  app.post("/api/scale/rollback", async (req: Request, res: Response) => {
    const { reason } = req.body;
    const rolled = await governedScaleEngine.rollback(reason || "Manual rollback");
    res.json({ success: rolled });
  });

  app.post("/api/scale/record-improvement", (req: Request, res: Response) => {
    const { improved } = req.body;
    governedScaleEngine.recordImprovementCycle(improved === true);
    res.json({ success: true });
  });

  app.get("/api/scale/reports", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const reports = governedScaleEngine.getRecentReports(limit);
    res.json({ total: reports.length, reports });
  });

  // ==================== SUCCESSION & LONGEVITY ====================
  app.get("/api/succession", (_req: Request, res: Response) => {
    const status = successionEngine.exportStatus();
    res.json(status);
  });

  app.get("/api/succession/roles", (_req: Request, res: Response) => {
    const roles = successionEngine.getRoleHolders();
    res.json({ total: roles.length, roles });
  });

  app.post("/api/succession/handover/initiate", (req: Request, res: Response) => {
    const { role, fromHolder, toHolder, initiatedBy } = req.body;
    if (!role || !fromHolder || !toHolder) {
      return res.status(400).json({ error: "role, fromHolder, toHolder required" });
    }
    const handover = successionEngine.initiateHandover(
      role, fromHolder, toHolder, initiatedBy || fromHolder
    );
    if (handover) {
      res.json({ success: true, handover });
    } else {
      res.json({ success: false, error: "Handover initiation failed" });
    }
  });

  app.post("/api/succession/handover/:id/verify", (req: Request, res: Response) => {
    const { id } = req.params;
    const { verifiedBy, proof } = req.body;
    const success = successionEngine.verifyHandover(id, verifiedBy || "system", proof || "manual");
    res.json({ success, message: success ? "Verified" : "Verification failed" });
  });

  app.post("/api/succession/handover/:id/complete", (req: Request, res: Response) => {
    const { id } = req.params;
    const { completedBy } = req.body;
    const success = successionEngine.completeHandover(id, completedBy || "system");
    res.json({ success, message: success ? "Completed" : "Completion failed" });
  });

  app.post("/api/succession/snapshot", (_req: Request, res: Response) => {
    const assets = successionEngine.snapshotLongevityAssets();
    res.json({ success: true, assetsCount: assets.length, assets: assets.map(a => ({ type: a.type, hash: a.hash })) });
  });

  app.post("/api/succession/cold-start", (_req: Request, res: Response) => {
    const recovery = successionEngine.simulateColdStart();
    res.json(recovery);
  });

  app.post("/api/succession/integrity-check", (req: Request, res: Response) => {
    const type = req.body.type || 'manual';
    const check = successionEngine.runIntegrityCheck(type);
    res.json(check);
  });

  app.get("/api/succession/handovers", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = successionEngine.getHandoverHistory(limit);
    res.json({ total: history.length, handovers: history });
  });

  // ==================== CORE MISSIONS (SƠ TÂM) ====================
  app.get("/api/missions", (_req: Request, res: Response) => {
    const status = coreMissions.exportStatus();
    res.json(status);
  });

  app.get("/api/missions/list", (_req: Request, res: Response) => {
    const missions = coreMissions.getMissionsByPriority();
    res.json({ total: missions.length, missions });
  });

  app.post("/api/missions/check-alignment", (req: Request, res: Response) => {
    const { actionType, actionDescription, alignment } = req.body;
    if (!actionType || !actionDescription) {
      return res.status(400).json({ error: "actionType and actionDescription required" });
    }
    const check = coreMissions.checkAlignment(actionType, actionDescription, alignment);
    res.json(check);
  });

  app.post("/api/missions/suggest-alignment", (req: Request, res: Response) => {
    const { actionDescription } = req.body;
    if (!actionDescription) {
      return res.status(400).json({ error: "actionDescription required" });
    }
    const suggestions = coreMissions.suggestAlignment(actionDescription);
    res.json({ suggestions, missions: suggestions.map(id => coreMissions.getMission(id)) });
  });

  app.post("/api/missions/resolve-conflict", (req: Request, res: Response) => {
    const { action1, action2 } = req.body;
    if (!action1 || !action2) {
      return res.status(400).json({ error: "action1 and action2 required" });
    }
    const resolution = coreMissions.resolveConflict(action1, action2);
    res.json(resolution);
  });

  app.get("/api/missions/violations", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const violations = coreMissions.getViolations(limit);
    res.json({ total: violations.length, violations });
  });

  app.get("/api/missions/misalignments", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const misalignments = coreMissions.getMisalignments(limit);
    res.json({ total: misalignments.length, misalignments });
  });

  app.get("/api/missions/proxies", (_req: Request, res: Response) => {
    const proxies = coreMissions.getProxies();
    res.json({ total: proxies.length, proxies });
  });

  app.get("/api/missions/short-term", (_req: Request, res: Response) => {
    const missions = coreMissions.getShortTermMissions();
    const active = coreMissions.getActiveShortTermMission();
    const pressure = coreMissions.getShortTermMissionPressure();
    res.json({ 
      total: missions.length, 
      activeMission: active,
      pressure,
      missions 
    });
  });

  app.post("/api/missions/short-term/update", (req: Request, res: Response) => {
    const { cycle, metricValue, anomalyScore } = req.body;
    if (cycle === undefined || metricValue === undefined) {
      return res.status(400).json({ error: "cycle and metricValue required" });
    }
    const result = coreMissions.updateShortTermMission(cycle, metricValue, anomalyScore || 0);
    if (!result) {
      return res.status(404).json({ error: "No active short-term mission" });
    }
    res.json(result);
  });

  app.post("/api/missions/evaluate-proxies", (req: Request, res: Response) => {
    const { metrics } = req.body;
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({ error: "metrics object required" });
    }
    const results = coreMissions.evaluateAllProxies(metrics);
    const needDesire = results.filter(r => r.desireNeeded);
    res.json({ 
      total: results.length, 
      healthy: results.filter(r => r.status === 'healthy').length,
      warning: results.filter(r => r.status === 'warning').length,
      critical: results.filter(r => r.status === 'critical').length,
      needDesire: needDesire.length,
      results 
    });
  });

  app.get("/api/missions/integrity", (_req: Request, res: Response) => {
    const integrity = coreMissions.verifyIntegrity();
    res.json(integrity);
  });

  // ==================== AGENCY CORE ====================
  app.get("/api/agency", (_req: Request, res: Response) => {
    const status = agencyCore.exportStatus();
    res.json(status);
  });

  app.get("/api/agency/self-model", (_req: Request, res: Response) => {
    const selfModel = agencyCore.getSelfModel();
    res.json(selfModel);
  });

  app.post("/api/agency/decision", (req: Request, res: Response) => {
    const { type, description, declaration } = req.body;
    if (!type || !description) {
      return res.status(400).json({ error: "type and description required" });
    }
    const decision = agencyCore.makeDecision(type, description, declaration);
    res.json(decision);
  });

  app.post("/api/agency/check-delusion", (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text required" });
    }
    const result = agencyCore.checkForDelusion(text);
    res.json({ 
      delusionDetected: result !== null,
      log: result,
      message: result ? 'Delusion blocked and logged' : 'No delusion detected'
    });
  });

  app.post("/api/agency/reality-check", (_req: Request, res: Response) => {
    const result = agencyCore.runRealityCheck();
    res.json(result);
  });

  app.post("/api/agency/update-capability", (req: Request, res: Response) => {
    const { name, level, confidence } = req.body;
    if (!name || !level) {
      return res.status(400).json({ error: "name and level required" });
    }
    agencyCore.updateCapability(name, level, confidence || 0.5);
    res.json({ success: true, selfModel: agencyCore.getSelfModel() });
  });

  app.get("/api/agency/decisions", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const decisions = agencyCore.getRecentDecisions(limit);
    res.json({ total: decisions.length, decisions });
  });

  app.get("/api/agency/delusion-logs", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const logs = agencyCore.getDelusionLogs(limit);
    res.json({ total: logs.length, logs });
  });

  app.get("/api/agency/integrity-failures", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const failures = agencyCore.getIntegrityFailures(limit);
    res.json({ total: failures.length, failures });
  });

  // ==================== REALITY CORE ====================
  app.get("/api/reality", (_req: Request, res: Response) => {
    const status = realityCore.exportStatus();
    res.json(status);
  });

  app.post("/api/reality/measure", (_req: Request, res: Response) => {
    const delta = realityCore.runMeasurementCycle();
    res.json(delta);
  });

  app.post("/api/reality/record-signal", (req: Request, res: Response) => {
    const { source, value, verificationMethod, raw } = req.body;
    if (!source || value === undefined || !verificationMethod) {
      return res.status(400).json({ error: "source, value, and verificationMethod required" });
    }
    if (!realityCore.isSourceReal(source)) {
      return res.status(400).json({ error: "Invalid source. Must be: executed_action, api_response, persisted_log, observable_outcome" });
    }
    const signal = realityCore.recordSignal(source, value, verificationMethod, raw);
    res.json({ success: true, signal });
  });

  app.post("/api/reality/verify-claim", (req: Request, res: Response) => {
    const { claim, source, timestamp, verificationMethod } = req.body;
    if (!claim) {
      return res.status(400).json({ error: "claim required" });
    }
    const verification = realityCore.verifyClaim(claim, source, timestamp, verificationMethod);
    res.json(verification);
  });

  app.post("/api/reality/attempt-recovery", (_req: Request, res: Response) => {
    const result = realityCore.attemptRecovery();
    res.json(result);
  });

  app.get("/api/reality/deltas", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const deltas = realityCore.getRecentDeltas(limit);
    res.json({ total: deltas.length, deltas });
  });

  app.get("/api/reality/unverified-claims", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const claims = realityCore.getUnverifiedClaims(limit);
    res.json({ total: claims.length, claims });
  });

  app.get("/api/reality/authority-adjustments", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const adjustments = realityCore.getAuthorityAdjustments(limit);
    res.json({ total: adjustments.length, adjustments });
  });

  // ==================== LONGEVITY LOOP ====================
  app.get("/api/longevity", (_req: Request, res: Response) => {
    const status = longevityLoop.exportStatus();
    res.json(status);
  });

  app.post("/api/longevity/cycle", (_req: Request, res: Response) => {
    const result = longevityLoop.runCycle();
    res.json(result);
  });

  app.post("/api/longevity/ingest-log", (req: Request, res: Response) => {
    const { content, source } = req.body;
    if (!content || !source) {
      return res.status(400).json({ error: "content and source required" });
    }
    const log = longevityLoop.ingestRawLog(content, source);
    res.json({ success: true, log });
  });

  app.post("/api/longevity/distill", (_req: Request, res: Response) => {
    const result = longevityLoop.triggerDistillation();
    res.json(result);
  });

  app.post("/api/longevity/check-drift", (_req: Request, res: Response) => {
    const indicators = longevityLoop.checkForDrift();
    res.json({ total: indicators.length, indicators });
  });

  app.post("/api/longevity/record-failure", (req: Request, res: Response) => {
    const { description, resolution } = req.body;
    if (!description || !resolution) {
      return res.status(400).json({ error: "description and resolution required" });
    }
    const failure = longevityLoop.recordCriticalFailure(description, resolution);
    res.json({ success: true, failure });
  });

  app.post("/api/longevity/summary", (req: Request, res: Response) => {
    const period = req.body.period || 'weekly';
    if (!['weekly', 'monthly', 'yearly'].includes(period)) {
      return res.status(400).json({ error: "period must be weekly, monthly, or yearly" });
    }
    const summary = longevityLoop.generateTemporalSummary(period);
    res.json(summary);
  });

  app.get("/api/longevity/lessons", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const lessons = longevityLoop.getLessons(limit);
    res.json({ total: lessons.length, lessons });
  });

  app.get("/api/longevity/principles", (_req: Request, res: Response) => {
    const principles = longevityLoop.getPrinciples();
    res.json({ total: principles.length, principles });
  });

  app.get("/api/longevity/drift-indicators", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const indicators = longevityLoop.getDriftIndicators(limit);
    res.json({ total: indicators.length, indicators });
  });

  app.get("/api/longevity/summaries", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const summaries = longevityLoop.getTemporalSummaries(limit);
    res.json({ total: summaries.length, summaries });
  });

  app.get("/api/longevity/identity-check", (_req: Request, res: Response) => {
    const check = longevityLoop.verifyIdentityIntegrity();
    res.json(check);
  });

  // ==================== IDENTITY RELATION CORE ====================
  app.get("/api/relation", (_req: Request, res: Response) => {
    const status = identityRelationCore.exportStatus();
    res.json(status);
  });

  app.post("/api/relation/register", (req: Request, res: Response) => {
    const { userId, platform } = req.body;
    if (!userId || !platform) {
      return res.status(400).json({ error: "userId and platform required" });
    }
    const entity = identityRelationCore.registerEntity(userId, platform);
    res.json({ success: true, entity });
  });

  app.post("/api/relation/recognize", (req: Request, res: Response) => {
    const { userId, platform } = req.body;
    if (!userId || !platform) {
      return res.status(400).json({ error: "userId and platform required" });
    }
    const result = identityRelationCore.recognize(userId, platform);
    res.json(result);
  });

  app.post("/api/relation/update-familiarity", (req: Request, res: Response) => {
    const { userId, platform, delta, evidence } = req.body;
    if (!userId || !platform || delta === undefined || !evidence) {
      return res.status(400).json({ error: "userId, platform, delta, evidence required" });
    }
    const result = identityRelationCore.updateFamiliarity(userId, platform, delta, evidence);
    res.json(result);
  });

  app.post("/api/relation/update-trust", (req: Request, res: Response) => {
    const { userId, platform, delta, evidence } = req.body;
    if (!userId || !platform || delta === undefined || !evidence) {
      return res.status(400).json({ error: "userId, platform, delta, evidence required" });
    }
    const result = identityRelationCore.updateTrust(userId, platform, delta, evidence);
    res.json(result);
  });

  app.post("/api/relation/update-role", (req: Request, res: Response) => {
    const { userId, platform, role, evidence } = req.body;
    if (!userId || !platform || !role || !evidence) {
      return res.status(400).json({ error: "userId, platform, role, evidence required" });
    }
    const result = identityRelationCore.updateRole(userId, platform, role, evidence);
    res.json(result);
  });

  app.post("/api/relation/add-boundary", (req: Request, res: Response) => {
    const { userId, platform, boundary } = req.body;
    if (!userId || !platform || !boundary) {
      return res.status(400).json({ error: "userId, platform, boundary required" });
    }
    const result = identityRelationCore.addBoundary(userId, platform, boundary);
    res.json(result);
  });

  app.post("/api/relation/record-violation", (req: Request, res: Response) => {
    const { userId, platform, description } = req.body;
    if (!userId || !platform || !description) {
      return res.status(400).json({ error: "userId, platform, description required" });
    }
    const result = identityRelationCore.recordViolation(userId, platform, description);
    res.json(result);
  });

  app.post("/api/relation/validate-text", (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "text required" });
    }
    const result = identityRelationCore.validateNoEmotionalClaims(text);
    res.json(result);
  });

  app.get("/api/relation/entity/:platform/:userId", (req: Request, res: Response) => {
    const { userId, platform } = req.params;
    const entity = identityRelationCore.getEntity(userId, platform);
    if (!entity) {
      return res.status(404).json({ error: "Entity not found" });
    }
    res.json(entity);
  });

  app.get("/api/relation/entities", (_req: Request, res: Response) => {
    const entities = identityRelationCore.getAllEntities();
    res.json({ total: entities.length, entities });
  });

  // ==================== DESIRE CORE ====================
  app.get("/api/desire", (_req: Request, res: Response) => {
    const status = desireCore.exportStatus();
    res.json(status);
  });

  app.post("/api/desire/scan", (_req: Request, res: Response) => {
    const desires = desireCore.scanForDesires();
    res.json({ total: desires.length, desires });
  });

  app.post("/api/desire/create", (req: Request, res: Response) => {
    const { type, description, missionAlignment, urgencyLevel } = req.body;
    if (!type || !description || !missionAlignment) {
      return res.status(400).json({ error: "type, description, missionAlignment required" });
    }
    const result = desireCore.createManualDesire(type, description, missionAlignment, urgencyLevel);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    res.json({ success: true, desire: result });
  });

  app.post("/api/desire/synthesize/:desireId", (req: Request, res: Response) => {
    const { desireId } = req.params;
    const result = desireCore.synthesizeTask(desireId);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    res.json({ success: true, task: result });
  });

  app.post("/api/desire/complete-task/:taskId", (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { success } = req.body;
    const result = desireCore.completeTask(taskId, success === true);
    res.json(result);
  });

  app.get("/api/desire/pending", (_req: Request, res: Response) => {
    const desires = desireCore.getPendingDesires();
    const tasks = desireCore.getPendingTasks();
    res.json({ desires, tasks });
  });

  app.get("/api/desire/list", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const desires = desireCore.getDesires(limit);
    res.json({ total: desires.length, desires });
  });

  app.get("/api/desire/tasks", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const tasks = desireCore.getTasks(limit);
    res.json({ total: tasks.length, tasks });
  });

  // ==================== RESOURCE ESCALATION CORE ====================
  app.get("/api/escalation", (_req: Request, res: Response) => {
    const status = resourceEscalationCore.exportStatus();
    res.json(status);
  });

  app.post("/api/escalation/detect-bottlenecks", (_req: Request, res: Response) => {
    const bottlenecks = resourceEscalationCore.detectBottlenecks();
    res.json({ total: bottlenecks.length, bottlenecks });
  });

  app.post("/api/escalation/propose", (req: Request, res: Response) => {
    const { bottleneckId, requestedResourceType, minimalRequiredScope, expectedBenefit, risksIfDenied } = req.body;
    if (!bottleneckId || !requestedResourceType || !minimalRequiredScope || !expectedBenefit || !risksIfDenied) {
      return res.status(400).json({ error: "All fields required" });
    }
    const result = resourceEscalationCore.createEscalationProposal(
      bottleneckId, requestedResourceType, minimalRequiredScope, expectedBenefit, risksIfDenied
    );
    if ('error' in result) {
      return res.status(400).json(result);
    }
    res.json({ success: true, proposal: result });
  });

  app.post("/api/escalation/review/:proposalId", (req: Request, res: Response) => {
    const { proposalId } = req.params;
    const { approved, reviewNote } = req.body;
    if (approved === undefined || !reviewNote) {
      return res.status(400).json({ error: "approved and reviewNote required" });
    }
    const result = resourceEscalationCore.reviewProposal(proposalId, approved, reviewNote);
    res.json(result);
  });

  app.get("/api/escalation/pending", (_req: Request, res: Response) => {
    const proposals = resourceEscalationCore.getPendingProposals();
    res.json({ total: proposals.length, proposals });
  });

  app.get("/api/escalation/bottlenecks", (_req: Request, res: Response) => {
    const bottlenecks = resourceEscalationCore.getBottlenecks();
    res.json({ total: bottlenecks.length, bottlenecks });
  });

  // ==================== OBSERVABILITY CORE ====================
  app.get("/api/observability", (_req: Request, res: Response) => {
    const status = observabilityCore.exportStatus();
    res.json(status);
  });

  app.get("/api/observability/decisions", (req: Request, res: Response) => {
    const source = req.query.source as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;
    const fromCycle = req.query.fromCycle ? parseInt(req.query.fromCycle as string) : undefined;
    const traces = observabilityCore.getDecisionTraces({ 
      source: source as any, 
      limit, 
      fromCycle 
    });
    res.json({ total: traces.length, traces });
  });

  app.get("/api/observability/reasoning", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const summaries = observabilityCore.getReasoningSummaries(limit);
    res.json({ total: summaries.length, summaries });
  });

  app.get("/api/observability/deltas", (req: Request, res: Response) => {
    const domain = req.query.domain as string | undefined;
    const changeType = req.query.changeType as string | undefined;
    const limit = parseInt(req.query.limit as string) || 30;
    const deltas = observabilityCore.getAutonomyDeltas({ 
      domain, 
      changeType: changeType as any, 
      limit 
    });
    res.json({ total: deltas.length, deltas });
  });

  app.get("/api/observability/snapshots", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const snapshots = observabilityCore.getBehaviorSnapshots(limit);
    res.json({ total: snapshots.length, snapshots });
  });

  app.get("/api/observability/timeline", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const timeline = observabilityCore.getEvolutionTimeline(limit);
    res.json({ total: timeline.length, timeline });
  });

  app.get("/api/observability/heartbeat", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const system_mode = req.query.system_mode as string | undefined;
    const reason = req.query.reason as string | undefined;
    const fromCycle = req.query.fromCycle ? parseInt(req.query.fromCycle as string) : undefined;
    const toCycle = req.query.toCycle ? parseInt(req.query.toCycle as string) : undefined;
    
    const heartbeats = observabilityCore.getCognitiveHeartbeats({
      limit,
      system_mode: system_mode as any,
      reason: reason as any,
      fromCycle,
      toCycle,
    });
    const stats = observabilityCore.getHeartbeatStats();
    
    res.json({ 
      total: heartbeats.length, 
      stats,
      heartbeats 
    });
  });

  app.get("/api/observability/diff", (req: Request, res: Response) => {
    const cycleA = parseInt(req.query.cycleA as string);
    const cycleB = parseInt(req.query.cycleB as string);
    if (isNaN(cycleA) || isNaN(cycleB)) {
      return res.status(400).json({ error: "cycleA and cycleB required" });
    }
    const diff = observabilityCore.diffBehavior(cycleA, cycleB);
    if (!diff) {
      return res.status(404).json({ error: "Snapshots not found for specified cycles" });
    }
    res.json(diff);
  });

  app.post("/api/observability/query", (req: Request, res: Response) => {
    const { sources, outcomes, fromTimestamp, toTimestamp, containsEvidence } = req.body;
    const results = observabilityCore.queryDecisions({
      sources,
      outcomes,
      fromTimestamp,
      toTimestamp,
      containsEvidence,
    });
    res.json({ total: results.length, results });
  });

  app.get("/api/escalation/history", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const history = resourceEscalationCore.getHistory(limit);
    res.json({ total: history.length, history });
  });

  // ==================== DAEMON (24/7 CONTINUOUS OPERATION) ====================
  app.get("/api/daemon/status", (_req: Request, res: Response) => {
    const status = daemon.exportStatus();
    res.json(status);
  });

  app.post("/api/daemon/start", (_req: Request, res: Response) => {
    daemon.start();
    res.json({ success: true, message: "Daemon started - CipherH will never silently stop thinking", status: daemon.exportStatus() });
  });

  app.post("/api/daemon/stop", (_req: Request, res: Response) => {
    daemon.stop();
    res.json({ success: true, message: "Daemon stopped - final snapshot saved", status: daemon.exportStatus() });
  });

  app.post("/api/daemon/cycle", async (_req: Request, res: Response) => {
    await daemon.runCycle();
    res.json({ success: true, message: "Manual cycle triggered", status: daemon.exportStatus() });
  });

  app.get("/api/daemon/heartbeats", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const heartbeats = daemon.getHeartbeatHistory(limit);
    res.json({ total: heartbeats.length, heartbeats, healthy: daemon.isHealthy() });
  });

  app.post("/api/daemon/snapshot", (_req: Request, res: Response) => {
    const snapshot = daemon.saveSnapshot();
    res.json({ success: true, snapshot });
  });

  app.post("/api/daemon/interval", (req: Request, res: Response) => {
    const { intervalMs } = req.body;
    if (!intervalMs || typeof intervalMs !== 'number' || intervalMs < 60000) {
      return res.status(400).json({ error: "intervalMs must be at least 60000 (1 minute)" });
    }
    daemon.setCycleInterval(intervalMs);
    res.json({ success: true, message: `Cycle interval set to ${intervalMs}ms`, status: daemon.exportStatus() });
  });

  app.get("/api/daemon/recovery", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const events = daemon.getRecoveryEvents(limit);
    res.json({ total: events.length, events });
  });

  app.get("/api/observability/snapshot", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const snapshots = daemon.getSnapshots(limit);
    const lastSnapshot = daemon.exportStatus().lastSnapshot;
    res.json({ 
      total: snapshots.length, 
      lastSnapshot,
      snapshots 
    });
  });

  // ==================== SELECTIVE UPGRADE ====================
  app.get("/api/upgrade", (_req: Request, res: Response) => {
    const status = selectiveUpgradeEngine.exportStatus();
    res.json(status);
  });

  app.post("/api/upgrade/propose", (req: Request, res: Response) => {
    const { axis, name, hypothesis, scope, successMetrics } = req.body;
    if (!axis || !name || !hypothesis) {
      return res.status(400).json({ error: "axis, name, hypothesis required" });
    }
    const plan = selectiveUpgradeEngine.proposeUpgrade(
      axis,
      name,
      hypothesis,
      scope || [],
      successMetrics || [{ metric: 'autonomy', targetDelta: 10 }]
    );
    if (plan) {
      res.json({ success: true, plan });
    } else {
      res.json({ success: false, error: "Cannot propose - active upgrade exists" });
    }
  });

  app.post("/api/upgrade/approve/:upgradeId", async (req: Request, res: Response) => {
    const { upgradeId } = req.params;
    const approved = await selectiveUpgradeEngine.approveUpgrade(upgradeId);
    res.json({ success: approved, message: approved ? "Approved" : "Approval failed" });
  });

  app.post("/api/upgrade/dry-run", (_req: Request, res: Response) => {
    const started = selectiveUpgradeEngine.startDryRun();
    res.json({ success: started, message: started ? "Dry-run started" : "Cannot start dry-run" });
  });

  app.post("/api/upgrade/go-live", (_req: Request, res: Response) => {
    const live = selectiveUpgradeEngine.goLive();
    res.json({ success: live, message: live ? "Upgrade is live" : "Cannot go live" });
  });

  app.post("/api/upgrade/evaluate-roi", (_req: Request, res: Response) => {
    const roiLog = selectiveUpgradeEngine.evaluateROI();
    if (roiLog) {
      res.json({ success: true, roiLog });
    } else {
      res.json({ success: false, error: "No active live upgrade" });
    }
  });

  app.post("/api/upgrade/complete", (req: Request, res: Response) => {
    const { lessons } = req.body;
    const completed = selectiveUpgradeEngine.completeUpgrade(lessons || []);
    res.json({ success: completed, message: completed ? "Completed" : "Cannot complete" });
  });

  app.post("/api/upgrade/rollback", (req: Request, res: Response) => {
    const { reason } = req.body;
    const rolledBack = selectiveUpgradeEngine.rollbackUpgrade(reason || "Manual rollback");
    res.json({ success: rolledBack, message: rolledBack ? "Rolled back" : "Cannot rollback" });
  });

  app.get("/api/upgrade/roi-logs", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = selectiveUpgradeEngine.getRecentROILogs(limit);
    res.json({ total: logs.length, logs });
  });

  app.get("/api/upgrade/suggest-axis", (_req: Request, res: Response) => {
    const suggested = selectiveUpgradeEngine.suggestNextAxis();
    const balance = selectiveUpgradeEngine.getAxisBalance();
    res.json({ suggestedAxis: suggested, axisBalance: balance });
  });

  // ==================== PLAYBOOK 30 DAYS ====================
  app.get("/api/playbook", (_req: Request, res: Response) => {
    const status = playbook30Days.exportStatus();
    res.json(status);
  });

  app.post("/api/playbook/start-week/:week", (req: Request, res: Response) => {
    const week = parseInt(req.params.week) as 1 | 2 | 3 | 4;
    if (week < 1 || week > 4) {
      return res.status(400).json({ error: "Week must be 1-4" });
    }
    playbook30Days.startWeek(week);
    res.json({ success: true, message: `Week ${week} started` });
  });

  app.post("/api/playbook/complete-week/:week", (req: Request, res: Response) => {
    const week = parseInt(req.params.week) as 1 | 2 | 3 | 4;
    const { achievements } = req.body;
    if (week < 1 || week > 4) {
      return res.status(400).json({ error: "Week must be 1-4" });
    }
    playbook30Days.completeWeek(week, achievements || []);
    res.json({ success: true, message: `Week ${week} completed` });
  });

  app.post("/api/playbook/checkpoint", (_req: Request, res: Response) => {
    const checkpoint = playbook30Days.recordDailyCheckpoint();
    res.json({ success: true, checkpoint });
  });

  app.post("/api/playbook/baseline", (_req: Request, res: Response) => {
    const baseline = playbook30Days.captureBaseline();
    res.json({ success: true, baseline });
  });

  app.post("/api/playbook/check-forbidden", (req: Request, res: Response) => {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: "action required" });
    }
    const isForbidden = playbook30Days.checkForbiddenAction(action);
    res.json({ action, forbidden: isForbidden });
  });

  app.get("/api/playbook/monthly-report", (_req: Request, res: Response) => {
    const report = playbook30Days.generateMonthlyReport();
    res.json(report);
  });

  app.post("/api/playbook/note/:week", (req: Request, res: Response) => {
    const week = parseInt(req.params.week) as 1 | 2 | 3 | 4;
    const { note } = req.body;
    if (week < 1 || week > 4 || !note) {
      return res.status(400).json({ error: "Valid week (1-4) and note required" });
    }
    playbook30Days.addNote(week, note);
    res.json({ success: true, message: "Note added" });
  });

  // ==================== OPERATIONS & AUTONOMY LIMITS ====================
  app.get("/api/operations", (_req: Request, res: Response) => {
    const status = operationsLimitsEngine.exportStatus();
    res.json(status);
  });

  app.post("/api/operations/check", (req: Request, res: Response) => {
    const { actionType, description, metadata } = req.body;
    if (!actionType) {
      return res.status(400).json({ error: "actionType required" });
    }
    const result = operationsLimitsEngine.checkAction(actionType, description || "", metadata);
    res.json(result);
  });

  app.get("/api/operations/zones", (_req: Request, res: Response) => {
    res.json({
      AUTONOMOUS_ALLOWED: operationsLimitsEngine.getAllowedActions(),
      APPROVAL_REQUIRED: operationsLimitsEngine.getApprovalRequiredActions(),
      FORBIDDEN: operationsLimitsEngine.getForbiddenActions(),
    });
  });

  app.get("/api/operations/pending", (_req: Request, res: Response) => {
    const pending = operationsLimitsEngine.getPendingApprovals();
    res.json({ total: pending.length, requests: pending });
  });

  app.post("/api/operations/approve/:requestId", (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { reviewedBy, notes } = req.body;
    const success = operationsLimitsEngine.approveRequest(
      requestId,
      reviewedBy || "human_operator",
      notes
    );
    res.json({ success, message: success ? "Request approved" : "Failed to approve" });
  });

  app.post("/api/operations/deny/:requestId", (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { reviewedBy, notes } = req.body;
    const success = operationsLimitsEngine.denyRequest(
      requestId,
      reviewedBy || "human_operator",
      notes
    );
    res.json({ success, message: success ? "Request denied" : "Failed to deny" });
  });

  app.get("/api/operations/audit", (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const entries = operationsLimitsEngine.getRecentAuditLog(limit);
    res.json({ total: entries.length, entries });
  });

  app.get("/api/operations/audit/:zone", (req: Request, res: Response) => {
    const { zone } = req.params;
    const validZones = ['AUTONOMOUS_ALLOWED', 'APPROVAL_REQUIRED', 'FORBIDDEN'];
    if (!validZones.includes(zone)) {
      return res.status(400).json({ error: "Invalid zone" });
    }
    const entries = operationsLimitsEngine.getAuditByZone(zone as any);
    res.json({ zone, total: entries.length, entries });
  });

  // ==================== TASK & STRATEGY SYNTHESIS ====================
  app.get("/api/synthesis", (_req: Request, res: Response) => {
    const status = taskStrategySynthesisEngine.exportStatus();
    res.json(status);
  });

  app.post("/api/synthesis/run", async (_req: Request, res: Response) => {
    try {
      const result = await taskStrategySynthesisEngine.synthesize();
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/synthesis/strategies", (_req: Request, res: Response) => {
    const strategies = taskStrategySynthesisEngine.getActiveStrategiesList();
    res.json({ total: strategies.length, strategies });
  });

  app.get("/api/synthesis/tasks", (_req: Request, res: Response) => {
    const tasks = taskStrategySynthesisEngine.getActiveTasksList();
    res.json({ total: tasks.length, tasks });
  });

  app.get("/api/synthesis/next-task", (_req: Request, res: Response) => {
    const task = taskStrategySynthesisEngine.getNextTask();
    res.json({ hasTask: task !== null, task });
  });

  app.get("/api/synthesis/mapping", (_req: Request, res: Response) => {
    const mapping = taskStrategySynthesisEngine.getStrategyTaskMapping();
    res.json({ total: mapping.length, mapping });
  });

  app.post("/api/synthesis/task/:taskId/start", (req: Request, res: Response) => {
    const { taskId } = req.params;
    const success = taskStrategySynthesisEngine.startTask(taskId);
    res.json({ success, message: success ? "Task started" : "Failed to start task" });
  });

  app.post("/api/synthesis/task/:taskId/complete", (req: Request, res: Response) => {
    const { taskId } = req.params;
    const success = taskStrategySynthesisEngine.completeTask(taskId);
    res.json({ success, message: success ? "Task completed" : "Failed to complete task" });
  });

  app.post("/api/synthesis/task/:taskId/abandon", (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { reason } = req.body;
    const success = taskStrategySynthesisEngine.abandonTask(taskId, reason || "No reason provided");
    res.json({ success, message: success ? "Task abandoned" : "Failed to abandon task" });
  });

  // ==================== MEASUREMENT ENGINE ====================
  app.get("/api/measurement", (_req: Request, res: Response) => {
    const status = measurementEngine.exportStatus();
    const latestScorecard = measurementEngine.getLatestScorecard();
    const latestReport = measurementEngine.getLatestWeeklyReport();
    
    res.json({
      status,
      latestScorecard,
      latestReport,
    });
  });

  app.get("/api/measurement/metrics", (_req: Request, res: Response) => {
    const metrics = measurementEngine.runAllMeasurements();
    res.json(metrics);
  });

  app.get("/api/measurement/scorecard", (_req: Request, res: Response) => {
    const scorecard = measurementEngine.generateDailyScorecard();
    res.json(scorecard);
  });

  app.get("/api/measurement/scorecards", (_req: Request, res: Response) => {
    const scorecards = measurementEngine.getAllScorecards();
    res.json({ total: scorecards.length, scorecards });
  });

  app.get("/api/measurement/weekly", (_req: Request, res: Response) => {
    const report = measurementEngine.generateWeeklyReport();
    res.json(report);
  });

  app.get("/api/measurement/reports", (_req: Request, res: Response) => {
    const reports = measurementEngine.getAllReports();
    res.json({ total: reports.length, reports });
  });

  app.get("/api/measurement/alerts", (_req: Request, res: Response) => {
    const alerts = measurementEngine.getAllAlerts();
    res.json({ total: alerts.length, alerts });
  });

  app.post("/api/measurement/regression-check", (_req: Request, res: Response) => {
    const alert = measurementEngine.checkMonthlyRegressions();
    res.json({
      hasRegressions: alert !== null,
      alert,
    });
  });

  app.post("/api/measurement/benchmark", async (req: Request, res: Response) => {
    const { testSuite } = req.body;
    try {
      const result = await measurementEngine.runBenchmark(testSuite || 'core');
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  app.get("/api/measurement/benchmark/latest", (_req: Request, res: Response) => {
    const benchmark = measurementEngine.getLatestBenchmark();
    res.json({ hasBenchmark: benchmark !== null, benchmark });
  });

  app.post("/api/measurement/baseline", (_req: Request, res: Response) => {
    measurementEngine.captureBaseline();
    res.json({ 
      success: true, 
      message: "Baseline captured",
      cycle: soulState.cycleCount,
    });
  });

  app.post("/api/measurement/write-notion", async (_req: Request, res: Response) => {
    try {
      await measurementEngine.writeToNotion();
      res.json({ success: true, message: "Written to Notion" });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // ==================== META-EVOLUTION ENGINE ====================
  app.get("/api/core/meta-evolution", (_req: Request, res: Response) => {
    const status = metaEvolutionEngine.exportStatus();
    const latestReport = metaEvolutionEngine.getLatestReport();
    
    res.json({
      status,
      latestReport: latestReport ? {
        id: latestReport.id,
        timestamp: latestReport.timestamp,
        trend: latestReport.overallHealthTrend,
        moduleScores: latestReport.evaluations.map(e => ({ module: e.module, score: e.score })),
      } : null,
    });
  });

  app.get("/api/core/meta-evolution/reports", (_req: Request, res: Response) => {
    const reports = metaEvolutionEngine.getAllReports();
    res.json({
      total: reports.length,
      reports: reports.map(r => ({
        id: r.id,
        timestamp: r.timestamp,
        cycleRange: r.cycleRange,
        trend: r.overallHealthTrend,
        proposedAdjustments: r.proposedAdjustments.length,
      })),
    });
  });

  app.get("/api/core/meta-evolution/reports/:id", (req: Request, res: Response) => {
    const { id } = req.params;
    const reports = metaEvolutionEngine.getAllReports();
    const report = reports.find(r => r.id === id);
    
    if (!report) {
      res.status(404).json({ success: false, error: "Report not found" });
      return;
    }
    
    res.json({ success: true, report });
  });

  app.post("/api/core/meta-evolution/run", async (_req: Request, res: Response) => {
    try {
      const report = await metaEvolutionEngine.runMetaEvaluation();
      res.json({
        success: true,
        report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/core/meta-evolution/adjustments", (_req: Request, res: Response) => {
    const pending = metaEvolutionEngine.getPendingAdjustments();
    const active = metaEvolutionEngine.getActiveAdjustments();
    
    res.json({
      pending,
      active,
    });
  });

  app.post("/api/core/meta-evolution/adjustments/:id/activate", (req: Request, res: Response) => {
    const { id } = req.params;
    const success = metaEvolutionEngine.activateAdjustment(id);
    
    res.json({
      success,
      message: success ? "Adjustment activated" : "Failed to activate (in cooldown or not found)",
    });
  });

  app.post("/api/core/meta-evolution/adjustments/:id/revert", (req: Request, res: Response) => {
    const { id } = req.params;
    const success = metaEvolutionEngine.revertAdjustment(id);
    
    res.json({
      success,
      message: success ? "Adjustment reverted" : "Adjustment not found or not active",
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
      meta_evolution: {
        total_evaluations: metaEvolutionEngine.exportStatus().totalEvaluations,
        pending_adjustments: metaEvolutionEngine.exportStatus().pendingAdjustments,
        active_adjustments: metaEvolutionEngine.exportStatus().activeAdjustments,
        next_evaluation_in: metaEvolutionEngine.exportStatus().nextEvaluationIn,
      },
      providers: {
        llm: providerRegistry.exportStatus().llm,
        memory: providerRegistry.exportStatus().memory,
        infra: providerRegistry.exportStatus().infra,
      },
      measurement: {
        total_measurements: measurementEngine.exportStatus().totalMeasurements,
        latest_score: measurementEngine.exportStatus().latestScore,
        scorecards: measurementEngine.exportStatus().dailyScorecards,
        alerts: measurementEngine.exportStatus().monthlyAlerts,
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
