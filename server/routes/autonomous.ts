/**
 * Autonomous Systems API Routes
 * 
 * API để control và monitor các autonomous systems:
 * - Autonomous Debugger
 * - Continuous Self-Improvement
 * - Professional Coding Knowledge
 */

import { Router, Request, Response } from 'express';
import { autonomousDebugger } from '../core/autonomousDebugger';
import { continuousSelfImprovement } from '../core/continuousSelfImprovement';
import { professionalCodingKnowledge } from '../core/professionalCodingKnowledge';
import { logger } from '../services/logger';

export const autonomousRouter = Router();

/**
 * Get autonomous systems status
 * GET /api/autonomous/status
 */
autonomousRouter.get('/status', (_req: Request, res: Response) => {
  try {
    const debuggerStats = autonomousDebugger.getStats();
    const improvementStats = continuousSelfImprovement.getStats();
    const systemHealth = continuousSelfImprovement.getSystemHealth();

    res.json({
      success: true,
      autonomous_debugger: {
        monitoring: autonomousDebugger.isMonitoring(),
        stats: debuggerStats,
      },
      continuous_improvement: {
        running: continuousSelfImprovement.isRunning(),
        stats: improvementStats,
      },
      system_health: systemHealth,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Start continuous self-improvement
 * POST /api/autonomous/start
 */
autonomousRouter.post('/start', async (_req: Request, res: Response) => {
  try {
    logger.info('[Autonomous API] Starting autonomous systems...');
    
    await continuousSelfImprovement.start();
    
    res.json({
      success: true,
      message: 'Autonomous self-improvement started',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Start error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Stop continuous self-improvement
 * POST /api/autonomous/stop
 */
autonomousRouter.post('/stop', (_req: Request, res: Response) => {
  try {
    logger.info('[Autonomous API] Stopping autonomous systems...');
    
    continuousSelfImprovement.stop();
    
    res.json({
      success: true,
      message: 'Autonomous self-improvement stopped',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Stop error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get detected bugs
 * GET /api/autonomous/bugs
 */
autonomousRouter.get('/bugs', (_req: Request, res: Response) => {
  try {
    const bugs = autonomousDebugger.getDetectedBugs();
    
    res.json({
      success: true,
      bugs,
      count: bugs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Bugs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get fix history
 * GET /api/autonomous/fixes
 */
autonomousRouter.get('/fixes', (_req: Request, res: Response) => {
  try {
    const fixes = autonomousDebugger.getFixHistory();
    
    res.json({
      success: true,
      fixes,
      count: fixes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Fixes error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get improvement history
 * GET /api/autonomous/improvements
 */
autonomousRouter.get('/improvements', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    const history = continuousSelfImprovement.getHistory(count);
    
    res.json({
      success: true,
      history,
      count: history.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Improvements error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Manual bug fix trigger
 * POST /api/autonomous/fix/:bugId
 */
autonomousRouter.post('/fix/:bugId', async (req: Request, res: Response) => {
  try {
    const { bugId } = req.params;
    
    logger.info(`[Autonomous API] Manual fix requested for bug: ${bugId}`);
    
    const fix = await autonomousDebugger.manualFix(bugId);
    
    if (!fix) {
      return res.status(404).json({
        success: false,
        error: 'Bug not found or fix failed',
      });
    }
    
    res.json({
      success: true,
      fix,
      message: 'Bug fixed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Manual fix error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get professional coding knowledge
 * GET /api/autonomous/knowledge
 */
autonomousRouter.get('/knowledge', (req: Request, res: Response) => {
  try {
    const area = req.query.area as string;
    
    if (area) {
      const knowledge = professionalCodingKnowledge.getKnowledgeFor(area as any);
      res.json({
        success: true,
        area,
        knowledge,
      });
    } else {
      const knowledge = professionalCodingKnowledge.exportKnowledge();
      res.json({
        success: true,
        knowledge,
      });
    }
  } catch (error: any) {
    logger.error('[Autonomous API] Knowledge error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Analyze code snippet
 * POST /api/autonomous/analyze
 */
autonomousRouter.post('/analyze', (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required',
      });
    }
    
    const analysis = professionalCodingKnowledge.analyzeCode(code);
    
    res.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Analyze error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get system health metrics
 * GET /api/autonomous/health
 */
autonomousRouter.get('/health', (_req: Request, res: Response) => {
  try {
    const health = continuousSelfImprovement.getSystemHealth();
    const stats = continuousSelfImprovement.getStats();
    
    res.json({
      success: true,
      health,
      stats,
      recommendation: health.trend === 'improving' 
        ? 'System is improving - continue current operations'
        : health.trend === 'degrading'
        ? 'System performance degrading - investigate issues'
        : 'System stable - monitor continuously',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[Autonomous API] Health error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
