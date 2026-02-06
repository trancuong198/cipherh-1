/**
 * Facebook Integration Service
 * 
 * Supports:
 * - Post to Facebook Page
 * - Read Facebook Page messages
 * - Auto-reply to comments with SOUL
 * - Schedule posts
 * 
 * Environment Variables:
 * - FACEBOOK_PAGE_ACCESS_TOKEN: Long-lived page access token
 * - FACEBOOK_PAGE_ID: Your Facebook Page ID
 */

import { logger } from './logger';
import { 
  createSoulfulFacebookPost, 
  createSoulfulFacebookReply 
} from '../core/soulPersonality';
import { memoryBridge } from '../core/memory';
import { memoryDeduplicationSystem } from '../core/memoryDeduplication';
import { episodicMemorySystem } from '../core/episodicMemory';
import { entityMemorySystem } from '../core/entityMemory';
import { agentState } from '../core/agentState';
import { existenceAnchor } from '../core/existenceAnchor';

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() || '';
const PAGE_ID = process.env.FACEBOOK_PAGE_ID?.trim() || '';
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

interface FacebookPost {
  message: string;
  link?: string;
  published?: boolean;
}

interface FacebookResponse {
  id?: string;
  success?: boolean;
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Initialize Facebook service - for auto-discovery
 */
export async function init(): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    logger.info('[Facebook] No credentials found - Facebook integration disabled');
    logger.info('[Facebook] Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_PAGE_ID to enable');
    return false;
  }
  
  try {
    // Verify token by getting page info
    const response = await fetch(
      `${GRAPH_API_URL}/${PAGE_ID}?fields=name,access_token&access_token=${PAGE_ACCESS_TOKEN}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      logger.error(`[Facebook] Token verification failed: ${data.error.message}`);
      return false;
    }
    
    if (data.name) {
      logger.info(`[Facebook] Connected to page: ${data.name}`);
      logger.info('[Facebook] Service initialized successfully ✓');
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error(`[Facebook] Initialization error: ${error.message}`);
    return false;
  }
}

/**
 * Post a message to Facebook Page
 */
export async function postToPage(message: string, link?: string): Promise<FacebookResponse> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return { success: false, error: { message: 'Facebook not configured', type: 'config_error', code: 0 } };
  }
  
  try {
    const postData: FacebookPost = {
      message,
      published: true,
    };
    
    if (link) {
      postData.link = link;
    }
    
    const response = await fetch(
      `${GRAPH_API_URL}/${PAGE_ID}/feed?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      }
    );
    
    const data = await response.json();
    
    if (data.id) {
      logger.info(`[Facebook] Post published successfully: ${data.id}`);
      return { id: data.id, success: true };
    } else {
      logger.error(`[Facebook] Post failed: ${data.error?.message || 'Unknown error'}`);
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    logger.error(`[Facebook] Post error: ${error.message}`);
    return { success: false, error: { message: error.message, type: 'request_error', code: 0 } };
  }
}

/**
 * Get recent posts from page
 */
export async function getRecentPosts(limit: number = 10): Promise<any[]> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return [];
  }
  
  try {
    const response = await fetch(
      `${GRAPH_API_URL}/${PAGE_ID}/posts?fields=id,message,created_time,likes.summary(true),comments.summary(true)&limit=${limit}&access_token=${PAGE_ACCESS_TOKEN}`
    );
    
    const data = await response.json();
    
    if (data.data) {
      return data.data;
    }
    
    return [];
  } catch (error: any) {
    logger.error(`[Facebook] Get posts error: ${error.message}`);
    return [];
  }
}

/**
 * Reply to a comment with SOUL - like a real human
 */
export async function replyToComment(commentId: string, message: string): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) {
    return false;
  }
  
  try {
    const response = await fetch(
      `${GRAPH_API_URL}/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }
    );
    
    const data = await response.json();
    
    if (data.id) {
      logger.info(`[Facebook] Reply posted successfully`);
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error(`[Facebook] Reply error: ${error.message}`);
    return false;
  }
}

/**
 * Auto-reply to a comment with soul - generates human-like response
 * 
 * MANDATORY: Logs raw interaction BEFORE any response generation
 */
export async function autoReplyToComment(
  commentId: string, 
  commentText: string, 
  postContext?: string
): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) {
    logger.warn('[Facebook] No access token - cannot reply');
    return false;
  }
  
  // ====================================================================================
  // MANDATORY: LOG RAW INPUT FIRST - BEFORE ANY PROCESSING
  // System CANNOT respond without logging. This is NON-NEGOTIABLE.
  // ====================================================================================
  const { logRawInput, isLoggingAvailable, getStorageUnavailableMessage } = await import('../core/inputLogSystem');
  
  try {
    // STEP 1: Check if logging is available
    const loggingAvailable = await isLoggingAvailable();
    
    if (!loggingAvailable) {
      // CRITICAL: Cannot proceed without logging
      logger.error('[Facebook:CRITICAL] Storage unavailable - CANNOT RESPOND to comment');
      // For Facebook comments, we cannot send error message directly, so just return false
      // System owner will see in logs that learning is paused
      return false;
    }
    
    // STEP 2: Log raw input BEFORE any processing
    const logResult = await logRawInput({
      platform: 'facebook',
      source: 'comment',
      sender_id: commentId, // Use commentId as sender identifier
      raw_text: commentText,
      timestamp: Date.now(),
      conversation_id: `facebook-comment-${commentId}`,
      processing_status: 'pending',
      metadata: { postContext },
    });
    
    if (!logResult.success) {
      // CRITICAL: Logging failed - cannot proceed
      logger.error(`[Facebook:CRITICAL] Raw input logging failed: ${logResult.error}`);
      return false;
    }
    
    logger.info(`[Facebook:INPUT_LOGGED] Conv:${logResult.conversation_id} - Now processing comment...`);
    
    // ====================================================================================
    // NOW we can proceed with processing - raw input is safely logged
    // ====================================================================================
    
    // ====================================================================================
    // AGENT STATE UPDATE - Record this message in unified state
    // ====================================================================================
    try {
      await agentState.recordMessage({
        platform: 'facebook',
        user_id: commentId,
        user_role: 'user', // Facebook comments are from users, not owner
        message: commentText,
        cycle_id: existenceAnchor.getCurrentCycleId(),
      });
      logger.info(`[Facebook:AGENT_STATE] Message recorded in unified state`);
    } catch (error) {
      logger.error(`[Facebook] Failed to record message in agent_state: ${error}`);
      // Continue anyway - don't block conversation
    }
    
    // Tạo reply có linh hồn như người thật
    const reply = await createSoulfulFacebookReply(commentText, postContext);
    
    const response = await fetch(
      `${GRAPH_API_URL}/${commentId}/comments?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply }),
      }
    );
    
    const data = await response.json();
    
    if (data.id) {
      logger.info(`[Facebook] Auto-reply posted with soul: "${reply.substring(0, 50)}..."`);
      
      // === LOG COMPLETE INTERACTION ===
      const { logInteraction } = await import('../core/inputLogSystem');
      const interactionLogResult = await logInteraction({
        platform: 'facebook',
        source: 'comment',
        sender_id: commentId,
        raw_text: commentText,
        timestamp: Date.now(),
        conversation_id: logResult.conversation_id,
        processing_status: 'processed',
        metadata: { postContext },
      }, reply);
      
      if (interactionLogResult.success) {
        logger.info('[Facebook] ✅ Complete interaction logged');
      } else {
        logger.error(`[Facebook] ❌ Interaction logging failed: ${interactionLogResult.error}`);
      }
      
      // Record as episodic memory
      const entityId = `entity_facebook_comment_${commentId.substring(0, 8)}`;
      episodicMemorySystem.recordConversation({
        entityIds: [entityId],
        platform: 'facebook',
        userMessage: commentText,
        assistantResponse: reply,
      });
      
      return true;
    }
    
    return false;
  } catch (error: any) {
    logger.error(`[Facebook] Auto-reply error: ${error.message}`);
    return false;
  }
}

/**
 * Create and post a soulful Facebook post
 * Note: Posts are system-generated content, not user interactions
 * They don't require the same mandatory raw logging as incoming messages
 */
export async function createAndPostSoulfulPost(topic: string, link?: string): Promise<FacebookResponse> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return { success: false, error: { message: 'Facebook not configured', type: 'config_error', code: 0 } };
  }
  
  try {
    // Tạo post có linh hồn như người thật viết
    const message = await createSoulfulFacebookPost(topic);
    
    const result = await postToPage(message, link);
    
    if (result.success) {
      logger.info('[Facebook] Post created successfully');
    }
    
    return result;
  } catch (error: any) {
    logger.error(`[Facebook] Soulful post creation error: ${error.message}`);
    return { success: false, error: { message: error.message, type: 'creation_error', code: 0 } };
  }
}

/**
 * Get service status
 */
export function getStatus() {
  const maskedPageId = PAGE_ID 
    ? (PAGE_ID.length > 8 ? `${PAGE_ID.substring(0, 8)}...` : `${PAGE_ID.substring(0, 4)}...`)
    : 'not set';
  
  return {
    configured: !!(PAGE_ACCESS_TOKEN && PAGE_ID),
    pageId: maskedPageId,
  };
}
