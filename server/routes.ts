import { type Express, type Request, type Response } from "express";
import { type Server } from "http";
import { governance as symbiosisGovernance } from "./core/governance";
import { healthRouter } from "./routes/health";
import { coreRouter } from "./routes/core";
import { codemodRouter } from "./routes/codemod";
import { autonomousRouter } from "./routes/autonomous";
import { learningRouter } from "./routes/learning";
import { registerGenes } from "./genes";
import { logger } from "./services/logger";

export async function registerRoutes(httpServer: Server, app: Express) {
  // Initialize genes
  try {
    await registerGenes();
    logger.info("[routes] genes registered successfully");
  } catch (err) {
    logger.error("[routes] failed to register genes", { err });
  }

  // Health routes
  app.use("/api", healthRouter);
  
  // Core routes (dashboard, inner loop control)
  app.use("/api", coreRouter);

  // Code modification routes (self-modification capability)
  app.use("/api/code", codemodRouter);

  // Autonomous systems routes (debugging, improvement, learning)
  app.use("/api/autonomous", autonomousRouter);

  // Learning analytics routes (experience-based learning, patterns, improvements)
  app.use("/api/learning", learningRouter);

  // Symbiosis health endpoint
  app.get("/api/health/symbiosis", (_req: Request, res: Response) => {
    try {
      // compute survival score using governance module (defaults used if no signals provided)
      const survivalScore = symbiosisGovernance.evaluateSurvivalScore();
      // simple ThreatLevel heuristic: higher threat when survival is low
      const threatLevel = Math.max(0, Math.min(100, 100 - survivalScore));

      res.json({
        survivalScore,
        threatLevel,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: "failed to compute symbiosis health", details: String(err) });
    }
  });

  logger.info("[routes] all routes registered");
}
