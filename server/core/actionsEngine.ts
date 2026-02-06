/**
 * Actions Engine
 * 
 * Executes REAL actions - not proposals or suggestions.
 * NO "propose for user to do" - the system DOES IT.
 * 
 * Actions include:
 * - Send Telegram messages
 * - Read/Write Notion
 * - Make API calls
 * - Create/modify files
 * - Propose infrastructure changes
 */

import { logger } from '../services/logger';
import { financialCore } from './financialCore';
import { memoryBridge } from './memory';
import * as fs from 'fs';
import * as path from 'path';

// ================================================
// TYPES
// ================================================

export type ActionType =
  | 'telegram_send'
  | 'notion_write'
  | 'notion_read'
  | 'api_call'
  | 'file_create'
  | 'file_modify'
  | 'infrastructure_proposal'
  | 'facebook_post';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  cost?: number;
  error?: string;
}

export interface Action {
  type: ActionType;
  description: string;
  parameters: Record<string, any>;
  costEstimate: number;
  justification: string;
}

// ================================================
// ACTIONS ENGINE
// ================================================

class ActionsEngine {
  /**
   * Execute an action - REAL execution, not simulation
   */
  async execute(action: Action): Promise<ActionResult> {
    logger.info(`[ActionsEngine] Executing: ${action.type} - ${action.description}`);

    // Check financial approval FIRST
    const spendingDecision = financialCore.canSpend(action.costEstimate, action.justification);

    if (!spendingDecision.approved) {
      logger.warn(`[ActionsEngine] Action denied: ${spendingDecision.reasoning}`);
      
      // Log to memory
      memoryBridge.logActionResult({
        action: action.description,
        success: false,
        reason: spendingDecision.reasoning,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        message: `Financial approval denied: ${spendingDecision.reasoning}`,
        error: 'FINANCIAL_DENIED',
      };
    }

    // Execute based on type
    let result: ActionResult;

    try {
      switch (action.type) {
        case 'telegram_send':
          result = await this.executeTelegramSend(action.parameters);
          break;
        case 'notion_write':
          result = await this.executeNotionWrite(action.parameters);
          break;
        case 'notion_read':
          result = await this.executeNotionRead(action.parameters);
          break;
        case 'api_call':
          result = await this.executeApiCall(action.parameters);
          break;
        case 'file_create':
          result = await this.executeFileCreate(action.parameters);
          break;
        case 'file_modify':
          result = await this.executeFileModify(action.parameters);
          break;
        case 'infrastructure_proposal':
          result = await this.executeInfrastructureProposal(action.parameters);
          break;
        case 'facebook_post':
          result = await this.executeFacebookPost(action.parameters);
          break;
        default:
          result = {
            success: false,
            message: `Unknown action type: ${action.type}`,
            error: 'UNKNOWN_ACTION',
          };
      }

      // Record cost if action succeeded
      if (result.success && action.costEstimate > 0) {
        financialCore.recordCost(
          'api',
          action.costEstimate,
          action.description,
          { actionType: action.type }
        );
      }

      // Log to memory
      memoryBridge.logActionResult({
        action: action.description,
        success: result.success,
        reason: result.message,
        timestamp: new Date().toISOString(),
        cost: action.costEstimate,
      });

      return result;
    } catch (error: any) {
      logger.error(`[ActionsEngine] Execution failed: ${error.message}`);
      
      return {
        success: false,
        message: `Execution error: ${error.message}`,
        error: 'EXECUTION_ERROR',
      };
    }
  }

  /**
   * Send Telegram message
   */
  private async executeTelegramSend(params: {
    chatId?: string;
    message: string;
  }): Promise<ActionResult> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = params.chatId || process.env.TELEGRAM_OWNER_CHAT_ID;

    if (!token || !chatId) {
      // NO PLACEHOLDER MODE - Expose the failure
      throw new Error('TELEGRAM_NOT_CONFIGURED: Cannot send message - TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_CHAT_ID not set');
    }

    try {
      // Real Telegram API call
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: params.message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Telegram message sent successfully',
        data,
        cost: 0.0, // Telegram is free
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Telegram send failed: ${error.message}`,
        error: 'TELEGRAM_ERROR',
      };
    }
  }

  /**
   * Write to Notion
   */
  private async executeNotionWrite(params: {
    content: string;
    pageId?: string;
  }): Promise<ActionResult> {
    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token || !databaseId) {
      // NO PLACEHOLDER MODE - Expose the failure
      throw new Error('NOTION_NOT_CONFIGURED: Cannot write to Notion - NOTION_TOKEN or NOTION_DATABASE_ID not set');
    }

    try {
      // Import Notion client dynamically
      const { Client } = await import('@notionhq/client');
      const notion = new Client({ auth: token });

      // Create a new page in the database
      const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Name: {
            title: [
              {
                text: {
                  content: `Memory: ${new Date().toISOString()}`,
                },
              },
            ],
          },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: params.content,
                  },
                },
              ],
            },
          },
        ],
      });

      return {
        success: true,
        message: 'Written to Notion successfully',
        data: response,
        cost: 0.0, // Notion API is free for our usage
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Notion write failed: ${error.message}`,
        error: 'NOTION_ERROR',
      };
    }
  }

  /**
   * Read from Notion
   */
  private async executeNotionRead(params: {
    pageId?: string;
    query?: string;
  }): Promise<ActionResult> {
    const token = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!token || !databaseId) {
      logger.warn('[ActionsEngine] Notion not configured - running in placeholder mode');
      return {
        success: true,
        message: 'Placeholder mode: Would read from Notion',
        data: { placeholder: true },
      };
    }

    try {
      const { Client } = await import('@notionhq/client');
      const notion = new Client({ auth: token });

      // Query the database
      const response = await notion.databases.query({
        database_id: databaseId,
        page_size: 10,
      });

      return {
        success: true,
        message: 'Read from Notion successfully',
        data: response.results,
        cost: 0.0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Notion read failed: ${error.message}`,
        error: 'NOTION_ERROR',
      };
    }
  }

  /**
   * Make arbitrary API call
   */
  private async executeApiCall(params: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<ActionResult> {
    try {
      const response = await fetch(params.url, {
        method: params.method || 'GET',
        headers: params.headers,
        body: params.body ? JSON.stringify(params.body) : undefined,
      });

      const data = await response.text();

      return {
        success: response.ok,
        message: `API call ${response.ok ? 'succeeded' : 'failed'}: ${response.status}`,
        data: data,
        cost: 0.001, // Minimal cost for bandwidth
      };
    } catch (error: any) {
      return {
        success: false,
        message: `API call failed: ${error.message}`,
        error: 'API_ERROR',
      };
    }
  }

  /**
   * Create a file
   */
  private async executeFileCreate(params: {
    path: string;
    content: string;
  }): Promise<ActionResult> {
    try {
      // Ensure directory exists
      const dir = path.dirname(params.path);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write file
      fs.writeFileSync(params.path, params.content);

      return {
        success: true,
        message: `File created: ${params.path}`,
        cost: 0.0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `File creation failed: ${error.message}`,
        error: 'FILE_ERROR',
      };
    }
  }

  /**
   * Modify a file
   */
  private async executeFileModify(params: {
    path: string;
    content: string;
  }): Promise<ActionResult> {
    try {
      // Check if file exists
      if (!fs.existsSync(params.path)) {
        return {
          success: false,
          message: `File not found: ${params.path}`,
          error: 'FILE_NOT_FOUND',
        };
      }

      // Write file
      fs.writeFileSync(params.path, params.content);

      return {
        success: true,
        message: `File modified: ${params.path}`,
        cost: 0.0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `File modification failed: ${error.message}`,
        error: 'FILE_ERROR',
      };
    }
  }

  /**
   * Propose infrastructure change
   */
  private async executeInfrastructureProposal(params: {
    proposal: string;
    reasoning: string;
  }): Promise<ActionResult> {
    // Log proposal to file and send notification
    const proposalFile = './data/infrastructure_proposals.json';
    
    let proposals = [];
    if (fs.existsSync(proposalFile)) {
      proposals = JSON.parse(fs.readFileSync(proposalFile, 'utf-8'));
    }

    proposals.push({
      timestamp: new Date().toISOString(),
      proposal: params.proposal,
      reasoning: params.reasoning,
    });

    fs.writeFileSync(proposalFile, JSON.stringify(proposals, null, 2));

    // Try to notify via Telegram
    await this.executeTelegramSend({
      message: `🔧 Infrastructure Proposal:\n\n${params.proposal}\n\nReasoning: ${params.reasoning}`,
    });

    return {
      success: true,
      message: 'Infrastructure proposal logged and notified',
      cost: 0.0,
    };
  }

  /**
   * Post to Facebook Page
   */
  private async executeFacebookPost(params: {
    message: string;
    link?: string;
  }): Promise<ActionResult> {
    const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    const pageId = process.env.FACEBOOK_PAGE_ID;

    if (!token || !pageId) {
      // NO PLACEHOLDER MODE - Expose the failure
      throw new Error('FACEBOOK_NOT_CONFIGURED: Cannot post to Facebook - FACEBOOK_PAGE_ACCESS_TOKEN or FACEBOOK_PAGE_ID not set');
    }

    try {
      // Import Facebook service dynamically
      const { postToPage } = await import('../services/facebook');
      
      // Post to Facebook
      const result = await postToPage(params.message, params.link);
      
      if (result.success) {
        return {
          success: true,
          message: `Facebook post published successfully: ${result.id}`,
          data: result,
          cost: 0.0, // Facebook API is free
        };
      } else {
        return {
          success: false,
          message: `Facebook post failed: ${result.error?.message || 'Unknown error'}`,
          error: 'FACEBOOK_ERROR',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Facebook post error: ${error.message}`,
        error: 'FACEBOOK_ERROR',
      };
    }
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const actionsEngine = new ActionsEngine();
