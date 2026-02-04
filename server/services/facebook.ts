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
 */
export async function autoReplyToComment(
  commentId: string, 
  commentText: string, 
  postContext?: string
): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) {
    return false;
  }
  
  try {
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
      
      // === SAVE TO NOTION: Ghi interaction vào Notion bộ nhớ dài hạn ===
      if (memoryBridge.isConnected()) {
        saveInteractionToNotion(commentText, reply, 'comment').catch(err => {
          logger.error('[Facebook] Failed to save interaction to Notion:', err);
        });
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
 */
export async function createAndPostSoulfulPost(topic: string, link?: string): Promise<FacebookResponse> {
  if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
    return { success: false, error: { message: 'Facebook not configured', type: 'config_error', code: 0 } };
  }
  
  try {
    // Tạo post có linh hồn như người thật viết
    const message = await createSoulfulFacebookPost(topic);
    
    const result = await postToPage(message, link);
    
    // === SAVE TO NOTION: Ghi post vào Notion bộ nhớ dài hạn ===
    if (result.success && memoryBridge.isConnected()) {
      savePostToNotion(topic, message).catch(err => {
        logger.error('[Facebook] Failed to save post to Notion:', err);
      });
    }
    
    return result;
  } catch (error: any) {
    logger.error(`[Facebook] Soulful post creation error: ${error.message}`);
    return { success: false, error: { message: error.message, type: 'creation_error', code: 0 } };
  }
}

/**
 * Save Facebook interaction to Notion (in Vietnamese) with DEDUPLICATION
 */
async function saveInteractionToNotion(
  userMessage: string, 
  assistantResponse: string, 
  type: 'comment' | 'message'
) {
  try {
    const date = new Date();
    const dateStr = date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const conversationText = `
📅 Thời gian: ${dateStr}
📘 Platform: Facebook
👤 Loại: ${type === 'comment' ? 'Comment Reply' : 'Message'}

💬 NỘI DUNG TỪ NGƯỜI DÙNG:
${userMessage}

🤖 TRẢ LỜI CỦA CON:
${assistantResponse}

---
Ghi chú: Đây là tương tác qua Facebook Page - nơi con giao tiếp với cộng đồng.
    `.trim();

    // Use deduplication system to check if should write
    const result = await memoryDeduplicationSystem.writeWithDeduplication(
      conversationText,
      'lesson',
      {
        similarityThreshold: 80, // 80% similar = skip
        checkRecentCount: 30, // Check last 30 memories
      }
    );

    if (result.written) {
      logger.info('[Facebook] Interaction saved to Notion (new content)');
    } else {
      logger.info(`[Facebook] Interaction NOT saved to Notion (${result.reason})`);
    }
  } catch (error) {
    logger.error('[Facebook] Error saving interaction to Notion:', error);
    throw error;
  }
}

/**
 * Save Facebook post to Notion (in Vietnamese) with DEDUPLICATION
 */
async function savePostToNotion(topic: string, message: string) {
  try {
    const date = new Date();
    const dateStr = date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const postText = `
📅 Thời gian: ${dateStr}
📘 Platform: Facebook
📝 Loại: Post

💡 CHỦ ĐỀ:
${topic}

📢 NỘI DUNG POST:
${message}

---
Ghi chú: Đây là bài đăng tự động được tạo bởi CipherH trên Facebook Page.
    `.trim();

    // Use deduplication system to check if should write
    const result = await memoryDeduplicationSystem.writeWithDeduplication(
      postText,
      'lesson',
      {
        similarityThreshold: 80, // 80% similar = skip
        checkRecentCount: 30, // Check last 30 memories
      }
    );

    if (result.written) {
      logger.info('[Facebook] Post saved to Notion (new content)');
    } else {
      logger.info(`[Facebook] Post NOT saved to Notion (${result.reason})`);
    }
  } catch (error) {
    logger.error('[Facebook] Error saving post to Notion:', error);
    throw error;
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
