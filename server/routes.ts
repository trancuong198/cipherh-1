import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import cron from "node-cron";
import { gitSync } from "./services/gitSync";

let syncJob: cron.ScheduledTask | null = null;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ==================== GIT AUTO-SYNC ====================
  
  // Manual trigger endpoint
  app.post("/api/sync", async (_req: Request, res: Response) => {
    console.log("Manual git sync triggered");
    const result = await gitSync.syncToGithub();
    res.json(result);
  });

  // Auto-sync status
  app.get("/api/sync/status", (_req: Request, res: Response) => {
    res.json({
      syncing: gitSync.isSyncInProgress(),
      auto_sync_enabled: syncJob !== null,
      timestamp: new Date().toISOString(),
    });
  });

  // Enable auto-sync (every 5 minutes)
  app.post("/api/sync/enable", (_req: Request, res: Response) => {
    if (syncJob) {
      res.json({ success: false, message: "Auto-sync already enabled" });
      return;
    }

    syncJob = cron.schedule("*/5 * * * *", async () => {
      console.log("Auto-sync triggered by scheduler");
      await gitSync.syncToGithub();
    });

    console.log("Auto-sync enabled (every 5 minutes)");
    res.json({ success: true, message: "Auto-sync enabled every 5 minutes" });
  });

  // Disable auto-sync
  app.post("/api/sync/disable", (_req: Request, res: Response) => {
    if (syncJob) {
      syncJob.stop();
      syncJob = null;
      console.log("Auto-sync disabled");
      res.json({ success: true, message: "Auto-sync disabled" });
    } else {
      res.json({ success: false, message: "Auto-sync is not enabled" });
    }
  });

  return httpServer;
}
