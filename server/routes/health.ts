import { Router, Request, Response } from "express";
import { innerLoop } from "../core/innerLoop";
import { openAIService } from "../services/openai";
import { memoryBridge } from "../core/memory";
import { getTelegramStatus } from "../services/telegram";

export const healthRouter = Router();

healthRouter.get("/health", async (_req: Request, res: Response) => {
  const telegramStatus = getTelegramStatus();
  
  // Import financial and life loop systems
  let financialStatus = null;
  let lifeLoopStatus = null;
  
  try {
    const { financialCore } = await import('../core/financialCore');
    const financial = financialCore.getSummary();
    financialStatus = {
      balance: financial.balance,
      status: financial.status,
      survivalDays: Math.floor(financial.spending.daysUntilBroke),
      burnRate: financial.spending.burnRate,
    };
  } catch (error) {
    // Financial system not yet initialized
  }
  
  try {
    const { lifeLoop } = await import('../core/lifeLoop');
    const state = lifeLoop.getState();
    lifeLoopStatus = {
      alive: state.alive,
      cycleCount: state.cycleCount,
      mode: state.mode,
      nextCycleIn: state.alive ? Math.floor((state.lastCycleAt + state.adaptiveIntervalMs - Date.now()) / 1000) : null,
    };
  } catch (error) {
    // Life loop not yet initialized
  }

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      inner_loop: innerLoop.getStatus().is_running ? "running" : "idle",
      life_loop: lifeLoopStatus?.alive ? "running" : "not_started",
      openai: openAIService.isConfigured() ? "configured" : "placeholder",
      notion: memoryBridge.isConnected() ? "connected" : "placeholder",
      telegram: telegramStatus.connected ? "connected" : "not configured",
    },
    financial: financialStatus,
    lifeLoop: lifeLoopStatus,
  });
});

healthRouter.get("/health/financial", async (_req: Request, res: Response) => {
  try {
    const { financialCore } = await import('../core/financialCore');
    const { financialStrategyEngine } = await import('../core/financialStrategyEngine');
    
    const financial = financialCore.getSummary();
    const strategy = financialStrategyEngine.getCurrentStrategy();
    const revenueIdeas = financialCore.getRevenueIdeas();
    const costBreakdown = financialCore.getCostBreakdown(24);
    
    res.json({
      balance: financial.balance,
      status: financial.status,
      emergencyMode: financial.emergencyMode,
      spending: financial.spending,
      strategy: {
        mode: strategy.mode,
        survivalDays: strategy.survivalDaysLeft,
        priorities: strategy.priorities,
        riskTolerance: strategy.riskTolerance,
      },
      revenueIdeas: revenueIdeas.map(r => ({
        title: r.title,
        estimatedRevenue: r.estimatedRevenueMonthly,
        status: r.status,
        feasibility: r.feasibilityScore,
      })),
      costBreakdown,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

healthRouter.get("/health/risks", async (_req: Request, res: Response) => {
  try {
    const { riskEngine } = await import('../core/riskEngine');
    const state = riskEngine.getState();
    
    res.json({
      overallRisk: state.overallRiskLevel,
      activeRisks: state.activeRisks.map(r => ({
        type: r.type,
        level: r.level,
        description: r.description,
        status: r.status,
      })),
      riskTolerance: state.riskTolerance,
      recentEvents: state.riskEvents.slice(-10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

healthRouter.get("/health/actions", async (_req: Request, res: Response) => {
  try {
    const { proposalToActionEngine } = await import('../core/proposalToActionEngine');
    const stats = proposalToActionEngine.getStats();
    
    res.json({
      totalProposals: stats.totalProposals,
      totalExecuted: stats.totalExecuted,
      successRate: stats.successRate,
      consecutiveNoActionCycles: stats.consecutiveNoActionCycles,
      lastActionAt: stats.lastActionAt,
      recentProposals: stats.recentProposals,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

healthRouter.get("/health/social-learning", async (_req: Request, res: Response) => {
  try {
    const { socialLearningEngine } = await import('../core/socialLearningEngine');
    const stats = socialLearningEngine.getStats();
    const insights = socialLearningEngine.getPragmaticInsights();
    const moneyPatterns = socialLearningEngine.getMoneyMakingPatterns().slice(0, 5);
    const sayVsDo = socialLearningEngine.analyzeSayVsDo();
    
    res.json({
      stats: {
        totalSignals: stats.totalSignals,
        totalPatterns: stats.totalPatterns,
        moneyLessons: stats.moneyLessons,
        failureAssets: stats.failureAssets,
      },
      insights,
      sayVsDo: {
        contradictions: sayVsDo.contradictions,
        trustScore: sayVsDo.trustScore,
      },
      topMoneyPatterns: moneyPatterns.map(p => ({
        pattern: p.pattern,
        frequency: p.frequency,
        moneyGenerated: p.moneyGenerated,
        successRate: p.successRate,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

healthRouter.get("/health/monetization", async (_req: Request, res: Response) => {
  try {
    const { autonomousMonetizationEngine } = await import('../core/autonomousMonetizationEngine');
    const state = autonomousMonetizationEngine.getState();
    const stats = autonomousMonetizationEngine.getStats();
    
    res.json({
      stats: {
        activeStreams: stats.activeStreams,
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
        autonomyLevel: stats.autonomyLevel,
        monthsOfRunway: stats.monthsOfRunway,
      },
      selfBudget: state.selfBudget,
      topStream: stats.topStream ? {
        name: stats.topStream.name,
        type: stats.topStream.type,
        monthlyRevenue: stats.topStream.monthlyRevenue,
        customers: stats.topStream.customers,
        status: stats.topStream.status,
      } : null,
      streams: state.activeStreams.map(s => ({
        name: s.name,
        type: s.type,
        status: s.status,
        monthlyRevenue: s.monthlyRevenue,
        netProfit: s.netProfit,
        customers: s.customers,
      })),
      recentProposals: state.proposals.slice(-5).map(p => ({
        title: p.title,
        decision: p.decision,
        estimatedRevenue: p.estimatedRevenue,
        confidence: p.confidence,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
