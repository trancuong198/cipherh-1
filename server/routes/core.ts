import { Router, Request, Response } from "express";
import { innerLoop } from "../core/innerLoop";
import { soulState } from "../core/soulState";
import { openAIService } from "../services/openai";
import { memoryBridge } from "../core/memory";
import { getTelegramStatus } from "../services/telegram";
import { createSoulfulResponse } from "../core/soulPersonality";
import { logger } from "../services/logger";

export const coreRouter = Router();

/**
 * Chat API - Nói chuyện trực tiếp với CipherH trên dashboard
 */
coreRouter.post("/chat/message", async (req: Request, res: Response) => {
  try {
    const { message, isOwner } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: "Message is required",
        response: "Bạn cần gửi tin nhắn để tôi có thể trả lời."
      });
    }

    logger.info(`[Chat] Message from ${isOwner ? 'owner' : 'user'}: ${message.substring(0, 50)}...`);

    // Sử dụng soul personality - giống như Telegram
    const response = await createSoulfulResponse(
      message,
      'web-dashboard',
      isOwner || false,
      'Đây là cuộc trò chuyện trực tiếp trên web dashboard.'
    );

    logger.info(`[Chat] Response generated: ${response.substring(0, 50)}...`);

    res.json({
      success: true,
      message: message,
      response: response,
      timestamp: new Date().toISOString(),
      confidence: soulState.confidence,
      mode: soulState.mode,
    });
  } catch (error: any) {
    logger.error('[Chat] Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      response: "Xin lỗi, tôi gặp lỗi khi xử lý tin nhắn. Vui lòng thử lại."
    });
  }
});

/**
 * Dashboard API - Dữ liệu cho bảng điều khiển
 */
coreRouter.get("/core/dashboard", async (_req: Request, res: Response) => {
  try {
    const innerLoopStatus = innerLoop.getStatus();
    const telegramStatus = getTelegramStatus();
    
    // Lấy dữ liệu Life Loop nếu có
    let lifeLoopStatus = { alive: false, cycleCount: 0 };
    try {
      const { lifeLoop } = await import('../core/lifeLoop');
      const state = lifeLoop.getState();
      lifeLoopStatus = {
        alive: state.alive,
        cycleCount: state.cycleCount,
      };
    } catch (error) {
      // Life loop not available
    }

    // Lấy logs
    const logs = {
      total: 0,
      by_level: { info: 0, warn: 0, error: 0 },
      file_size_kb: 0,
    };

    try {
      const fs = await import('fs');
      const path = await import('path');
      const logFile = path.join(process.cwd(), 'logs', 'app.log');
      
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        logs.file_size_kb = Math.round(stats.size / 1024);
        
        // Đọc logs và đếm
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        logs.total = lines.length;
        
        logs.by_level.error = lines.filter(l => l.includes('[ERROR]') || l.includes('"level":"error"')).length;
        logs.by_level.warn = lines.filter(l => l.includes('[WARN]') || l.includes('"level":"warn"')).length;
        logs.by_level.info = lines.length - logs.by_level.error - logs.by_level.warn;
      }
    } catch (error) {
      logger.warn('[Dashboard] Could not read logs:', error);
    }

    // Lấy goals
    let goals: string[] = [];
    try {
      const { coreGoals } = await import('../core/coreGoals');
      goals = coreGoals.getActiveGoals().map(g => g.title);
    } catch (error) {
      // Goals not available
    }

    // Lấy reflection cuối cùng
    let lastReflection = "Chưa có phản ánh...";
    try {
      const { reflectionLoop } = await import('../core/reflectionLoop');
      const recent = reflectionLoop.getRecentReflections(1);
      if (recent.length > 0) {
        lastReflection = recent[0].summary.substring(0, 100) + "...";
      }
    } catch (error) {
      // Reflection not available
    }

    // Response data
    const dashboardData = {
      overview: {
        cycle_count: lifeLoopStatus.alive ? lifeLoopStatus.cycleCount : soulState.cycleCount,
        mode: soulState.mode,
        is_running: innerLoopStatus.is_running || lifeLoopStatus.alive,
        doubts: soulState.doubts,
        confidence: soulState.confidence,
        energy_level: soulState.energyLevel,
        anomaly_score: soulState.anomalyScore,
      },
      health: {
        status: soulState.confidence >= 70 ? "ỔN ĐỊNH" : 
                soulState.confidence >= 40 ? "CẢNH BÁO" : "KHÔNG XÁC ĐỊNH",
        overall_score: soulState.confidence,
        trend: soulState.confidence >= 70 ? "tích cực" : 
               soulState.confidence >= 40 ? "ổn định" : "không xác định",
      },
      tasks: {
        total: 0,
        critical: 0,
        high: 0,
      },
      anomalies: {
        total: Math.floor(soulState.anomalyScore / 10),
        high_severity: Math.floor(soulState.anomalyScore / 20),
      },
      logs,
      services: {
        openai: openAIService.isConfigured(),
        notion: memoryBridge.isConnected(),
        scheduler: lifeLoopStatus.alive,
      },
      goals,
      current_focus: soulState.currentFocus,
      last_reflection: lastReflection,
      updated_at: new Date().toISOString(),
    };

    res.json(dashboardData);
  } catch (error: any) {
    logger.error('[Dashboard] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Chạy Inner Loop thủ công
 */
coreRouter.post("/core/run-loop", async (_req: Request, res: Response) => {
  try {
    logger.info('[API] Manual Inner Loop run requested');
    const result = await innerLoop.run();
    res.json(result);
  } catch (error: any) {
    logger.error('[API] Inner Loop run error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      cycle: soulState.cycleCount,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Lấy status của Inner Loop
 */
coreRouter.get("/core/status", (_req: Request, res: Response) => {
  try {
    const status = innerLoop.getStatus();
    const state = soulState.export();
    const telegramStatus = getTelegramStatus();

    res.json({
      inner_loop: status,
      soul_state: state,
      services: {
        openai: openAIService.getStatus(),
        notion: {
          connected: memoryBridge.isConnected(),
        },
        telegram: telegramStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[API] Status error:', error);
    res.status(500).json({ error: error.message });
  }
});
