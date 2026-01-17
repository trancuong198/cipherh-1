/**
 * Facebook Integration Service
 * 
 * Supports:
 * - Post to Facebook Page
 * - Read Facebook Page messages
 * - Auto-reply to comments
 * - Schedule posts
 * 
 * Environment Variables:
 * - FACEBOOK_PAGE_ACCESS_TOKEN: Long-lived page access token
 * - FACEBOOK_PAGE_ID: Your Facebook Page ID
 */

import { logger } from './logger';

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
 * Reply to a comment
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
 * Get service status
 */
export function getStatus() {
  return {
    configured: !!(PAGE_ACCESS_TOKEN && PAGE_ID),
    pageId: PAGE_ID ? `${PAGE_ID.substring(0, 8)}...` : 'not set',
  };
}
