/**
 * Code Modification API Routes
 * 
 * Cho phép CipherH tự sửa code của chính mình
 */

import { Router, Request, Response } from 'express';
import { codeModificationService } from '../services/codeModification';
import { logger } from '../services/logger';

export const codemodRouter = Router();

/**
 * Đọc file
 * POST /api/code/read
 * Body: { path: string }
 */
codemodRouter.post('/read', async (req: Request, res: Response) => {
  try {
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path is required',
      });
    }

    const fileInfo = await codeModificationService.readFile(path);
    
    res.json({
      success: true,
      file: fileInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CodeMod API] Read error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Sửa file
 * POST /api/code/modify
 * Body: { path: string, content: string, reason: string }
 */
codemodRouter.post('/modify', async (req: Request, res: Response) => {
  try {
    const { path, content, reason } = req.body;

    if (!path || !content) {
      return res.status(400).json({
        success: false,
        error: 'Path and content are required',
      });
    }

    const result = await codeModificationService.modifyFile(
      path,
      content,
      reason || 'Manual modification via API'
    );

    res.json(result);
  } catch (error: any) {
    logger.error('[CodeMod API] Modify error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Bot tự sửa code dựa trên yêu cầu
 * POST /api/code/self-modify
 * Body: { request: string }
 */
codemodRouter.post('/self-modify', async (req: Request, res: Response) => {
  try {
    const { request } = req.body;

    if (!request) {
      return res.status(400).json({
        success: false,
        error: 'Request is required',
      });
    }

    logger.info(`[CodeMod API] Self-modification request: ${request.substring(0, 100)}...`);

    const result = await codeModificationService.selfModifyCode(request);

    res.json(result);
  } catch (error: any) {
    logger.error('[CodeMod API] Self-modify error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * List files trong thư mục
 * POST /api/code/list
 * Body: { path: string }
 */
codemodRouter.post('/list', async (req: Request, res: Response) => {
  try {
    const { path = '.' } = req.body;

    const files = await codeModificationService.listFiles(path);

    res.json({
      success: true,
      path,
      files,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CodeMod API] List error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Xóa file
 * POST /api/code/delete
 * Body: { path: string, reason: string }
 */
codemodRouter.post('/delete', async (req: Request, res: Response) => {
  try {
    const { path, reason } = req.body;

    if (!path) {
      return res.status(400).json({
        success: false,
        error: 'Path is required',
      });
    }

    const result = await codeModificationService.deleteFile(
      path,
      reason || 'Manual deletion via API'
    );

    res.json(result);
  } catch (error: any) {
    logger.error('[CodeMod API] Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Get service status
 * GET /api/code/status
 */
codemodRouter.get('/status', (_req: Request, res: Response) => {
  try {
    const status = codeModificationService.getStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[CodeMod API] Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
