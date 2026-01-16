import { Router, Request, Response } from "express";
import { innerLoop } from "../core/innerLoop";
import { openAIService } from "../services/openai";
import { memoryBridge } from "../core/memory";
import { getTelegramStatus } from "../services/telegram";

export const healthRouter = Router();

healthRouter.get("/health", (_req: Request, res: Response) => {
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
