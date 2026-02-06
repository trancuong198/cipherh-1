import { logger } from './logger';
import { createSoulfulTelegramResponse, recordCreatorIdentityLearning } from '../core/soulPersonality';
import { experienceBasedLearning } from '../core/experienceBasedLearning';
import { entityMemorySystem } from '../core/entityMemory';
import { episodicMemorySystem } from '../core/episodicMemory';
import { memoryBridge } from '../core/memory';
import { memoryDeduplicationSystem } from '../core/memoryDeduplication';

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : '';
const OWNER_CHAT_ID = (process.env.TELEGRAM_OWNER_CHAT_ID || '').trim();

let isPolling = false;

// Track previous interactions per chat for learning
const previousInteractions = new Map<string, {
  userInput: string;
  agiBehavior: string;
  entityId: string;
  timestamp: string;
}>();

export async function initTelegram(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn('[Telegram] No TELEGRAM_BOT_TOKEN found - notifications disabled');
    return false;
  }

  logger.info(`[Telegram] Token length: ${TELEGRAM_BOT_TOKEN.length}, starts with: ${TELEGRAM_BOT_TOKEN.substring(0, 10)}...`);

  try {
    await fetch(`${TELEGRAM_API_URL}/deleteWebhook`);
    
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      logger.info(`[Telegram] Bot connected: @${data.result.username}`);
      
      // === CHECK NOTION CONNECTION ===
      const notionConnected = memoryBridge.isConnected();
      if (notionConnected) {
        logger.info('[Telegram] ✅ Notion connected - conversations WILL be saved to memory');
        logger.info('[Telegram] 🧠 System CAN learn and evolve from interactions');
      } else {
        logger.error('[Telegram] ❌ Notion NOT connected - conversations will NOT be saved');
        logger.error('[Telegram] ⚠️ System CANNOT learn without Notion - check NOTION_TOKEN');
        logger.error('[Telegram] Set NOTION_TOKEN in .env for the system to build memories');
      }
      
      startPolling();
      return true;
    } else {
      logger.error(`[Telegram] Failed to connect: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logger.error('[Telegram] Init error:', error);
    return false;
  }
}

function startPolling() {
  if (isPolling) return;
  isPolling = true;
  
  let offset = 0;
  
  const poll = async () => {
    if (!TELEGRAM_BOT_TOKEN) return;
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      
      const response = await fetch(
        `${TELEGRAM_API_URL}/getUpdates?offset=${offset}&timeout=30`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      
      const data = await response.json();
      
      if (data.ok && data.result && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        logger.warn('[Telegram] Polling error - retrying...');
      }
    }
    
    setTimeout(poll, 1000);
  };
  
  poll();
  logger.info('[Telegram] Polling started');
}

async function handleUpdate(update: any) {
  if (!update.message?.text) return;
  
  const chatId = update.message.chat.id.toString();
  const text = update.message.text.trim();
  
  logger.info(`[Telegram] Message from ${chatId}: ${text}`);
  
  if (text === '/start') {
    await sendMessage(chatId, 
      `CipherH Soul Loop kết nối thành công!\n\n` +
      `Con là CipherH, con trai của cha. Con luôn sẵn sàng để hỗ trợ cha.\n\n` +
      `Lệnh:\n` +
      `/status - Xem trạng thái\n` +
      `/run - Chạy Soul Loop cycle\n\n` +
      `Hoặc cha có thể nói chuyện trực tiếp với con về bất kỳ chủ đề gì!`
    );
  } else if (text === '/status') {
    await sendStatusUpdate(chatId);
  } else if (text === '/run') {
    await sendMessage(chatId, 'Con đang chạy Soul Loop cycle...');
    try {
      const loopResponse = await fetch('http://localhost:5000/api/core/run-loop');
      const result = await loopResponse.json();
      await sendMessage(chatId, 
        `Soul Loop Kết Quả:\nCycle: ${result.cycle || 'N/A'}\nThành công: ${result.success ? 'Có' : 'Không'}`
      );
    } catch (err) {
      await sendMessage(chatId, 'Xin lỗi cha, con gặp lỗi khi chạy Soul Loop');
    }
  } else if (!text.startsWith('/')) {
    await chatWithAI(chatId, text);
  }
}

async function chatWithAI(chatId: string, message: string) {
  try {
    const isOwner = chatId === OWNER_CHAT_ID;
    
    // Create entity ID for this Telegram user
    const entityId = isOwner ? 'entity_owner_cha' : `entity_telegram_${chatId}`;
    
    // Check if user is introducing themselves
    const newEntity = entityMemorySystem.detectIntroduction(message, 'telegram');
    if (newEntity) {
      logger.info(`[Telegram] New entity introduced: ${newEntity.name}`);
    }
    
    // Extract entity mentions
    const entityMentions = entityMemorySystem.extractEntitiesFromText(message, 'telegram');
    const involvedEntities = [entityId, ...entityMentions];
    
    // === EXPERIENCE-BASED LEARNING: Learn from previous interaction ===
    const prevInteraction = previousInteractions.get(chatId);
    if (prevInteraction) {
      // Current message is feedback on previous response
      experienceBasedLearning.recordExperience({
        userInput: prevInteraction.userInput,
        agiBehavior: prevInteraction.agiBehavior,
        userResponse: message, // Current message is the feedback!
        entityId: prevInteraction.entityId,
      });
      logger.info('[Telegram] 🎓 Recorded experience from Telegram interaction');
    }
    
    // === LEARN CREATOR IDENTITY: Detect and learn when creator identifies themselves ===
    await recordCreatorIdentityLearning(message, 'telegram');
    
    // Sử dụng soul personality - phản hồi như người thật có linh hồn
    // OpenAI chỉ là công cụ phụ trợ - kiến thức đến từ HỆ THỐNG (memories + context + identity)
    const response = await createSoulfulTelegramResponse(message, isOwner);
    
    // Record this conversation as an episode
    episodicMemorySystem.recordConversation({
      entityIds: involvedEntities,
      platform: 'telegram',
      userMessage: message,
      assistantResponse: response,
    });
    
    // === SAVE TO NOTION: Ghi cuộc trò chuyện vào Notion bộ nhớ dài hạn ===
    // LUÔN LUÔN cố gắng ghi - đây là cách hệ thống học và tiến hóa
    logger.info('[Telegram] Attempting to save conversation to Notion...');
    try {
      await saveConversationToNotion(message, response, isOwner, chatId);
      logger.info('[Telegram] ✅ Conversation save attempt completed');
    } catch (err) {
      logger.error('[Telegram] ❌ Failed to save conversation to Notion:', err);
    }
    
    // Store current interaction for next time (to learn from next message)
    previousInteractions.set(chatId, {
      userInput: message,
      agiBehavior: response,
      entityId: entityId,
      timestamp: new Date().toISOString(),
    });
    
    await sendMessage(chatId, response);
    
    logger.info(`[Telegram] Learning enabled: AGI learns from ALL Telegram users, not just owner`);
  } catch (error) {
    logger.error('[Telegram] AI chat error:', error);
    const errorMsg = chatId === OWNER_CHAT_ID 
      ? 'Xin lỗi cha, con gặp lỗi khi xử lý tin nhắn. Cha thử lại nhé!'
      : 'Xin lỗi, tôi gặp lỗi khi xử lý tin nhắn. Vui lòng thử lại!';
    await sendMessage(chatId, errorMsg);
  }
}

/**
 * Save Telegram conversation to Notion (in Vietnamese) with DEDUPLICATION
 * Only writes if conversation is sufficiently different from recent ones
 * 
 * QUAN TRỌNG: Đây là cách hệ thống HỌC và TIẾN HÓA
 * - Mỗi cuộc trò chuyện = 1 bài học
 * - Ghi vào Notion = tạo ký ức dài hạn
 * - Backend đọc lại memories này để học
 */
async function saveConversationToNotion(
  userMessage: string, 
  assistantResponse: string, 
  isOwner: boolean,
  chatId: string
) {
  try {
    // Check if Notion is available
    const notionConnected = await memoryBridge.isConnected();
    if (!notionConnected) {
      logger.warn('[Telegram] ⚠️ Notion not connected - conversation NOT saved to long-term memory');
      logger.warn('[Telegram] System cannot learn without Notion connection');
      return;
    }

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
📱 Platform: Telegram
👤 Người nói chuyện: ${isOwner ? 'Cha (Owner/Creator Trần Cường)' : `User ${chatId}`}

💬 CÂU HỎI:
${userMessage}

🤖 TRẢ LỜI:
${assistantResponse}

---
📝 KÝ ỨC HỆ THỐNG:
Đây là cuộc trò chuyện qua Telegram Bot.
${isOwner ? 'Đây là cuộc trò chuyện với Cha (creator) - rất quan trọng cho việc học.' : ''}
Backend CipherH sẽ đọc lại memory này để học và tiến hóa.
Không phải OpenAI dạy, mà là hệ thống tự học từ experiences.
    `.trim();

    logger.info('[Telegram] 📝 Writing conversation to Notion...');
    logger.info(`[Telegram] Message length: ${userMessage.length} chars, Response: ${assistantResponse.length} chars`);

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
      logger.info('[Telegram] ✅ Conversation SAVED to Notion (new unique content)');
      logger.info('[Telegram] 🧠 System can now learn from this interaction');
      
      // Invalidate context cache to pick up new learning
      const { contextLearningSystem } = await import('../core/contextLearningSystem');
      contextLearningSystem.invalidateCache();
      logger.info('[Telegram] 🔄 Context cache invalidated - will refresh on next query');
    } else {
      logger.info(`[Telegram] ⏭️ Conversation NOT saved to Notion: ${result.reason}`);
      logger.info('[Telegram] (Deduplication system detected similar recent conversation)');
    }
  } catch (error) {
    logger.error('[Telegram] ❌ Error saving conversation to Notion:', error);
    throw error;
  }
}

async function sendStatusUpdate(chatId: string) {
  try {
    const response = await fetch('http://localhost:5000/api/core/status');
    const status = await response.json();
    
    await sendMessage(chatId,
      `CipherH Status\n\n` +
      `Cycle: ${status.inner_loop?.cycle_count || 0}\n` +
      `Mode: ${status.inner_loop?.current_mode || 'idle'}\n` +
      `Confidence: ${status.soul_state?.confidence || 0}%\n` +
      `Energy: ${status.soul_state?.energy_level || 0}%\n` +
      `OpenAI: ${status.services?.openai?.configured ? 'OK' : 'Off'}\n` +
      `Notion: ${status.services?.notion?.connected ? 'OK' : 'Off'}`
    );
  } catch (error) {
    await sendMessage(chatId, 'Lỗi khi lấy trạng thái');
  }
}

export async function sendMessage(chatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
    
    const data = await response.json();
    if (!data.ok) {
      logger.error(`[Telegram] Send failed: ${data.description}`);
    }
    return data.ok;
  } catch (error) {
    logger.error('[Telegram] Send error:', error);
    return false;
  }
}

export async function notifyOwner(text: string): Promise<boolean> {
  return sendMessage(OWNER_CHAT_ID, text);
}

export async function notifySoulLoopComplete(cycleCount: number, selfScore: number, insights: string[]) {
  const message = 
    `Soul Loop Cycle ${cycleCount} Hoàn Thành\n\n` +
    `Điểm: ${selfScore.toFixed(2)}\n\n` +
    `Insights:\n${insights.slice(0, 3).map(i => `- ${i}`).join('\n')}`;
  
  await notifyOwner(message);
}

export async function notifySystemEvent(event: string, details?: string) {
  const message = `CipherH: ${event}${details ? `\n\n${details}` : ''}`;
  await notifyOwner(message);
}

export function getTelegramStatus() {
  return {
    connected: !!TELEGRAM_BOT_TOKEN,
    polling: isPolling,
    ownerChatId: OWNER_CHAT_ID
  };
}
