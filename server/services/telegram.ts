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
  // ====================================================================================
  // MANDATORY: LOG RAW INPUT FIRST - BEFORE ANY PROCESSING
  // System CANNOT respond without logging. This is NON-NEGOTIABLE.
  // ====================================================================================
  const { logRawInput, isLoggingAvailable, handleLoggingFailure, getStorageUnavailableMessage } = await import('../core/inputLogSystem');
  
  try {
    // STEP 1: Check if logging is available
    const loggingAvailable = await isLoggingAvailable();
    
    if (!loggingAvailable) {
      // CRITICAL: Cannot proceed without logging
      logger.error('[Telegram:CRITICAL] Storage unavailable - CANNOT RESPOND');
      const errorMessage = getStorageUnavailableMessage('telegram');
      await sendMessage(chatId, errorMessage);
      return; // STOP - do not proceed
    }
    
    // STEP 2: Log raw input BEFORE any processing
    const isOwner = chatId === OWNER_CHAT_ID;
    const logResult = await logRawInput({
      platform: 'telegram',
      source: 'bot', // Telegram bot messages
      sender_id: chatId,
      raw_text: message,
      timestamp: Date.now(),
      conversation_id: `telegram-${chatId}-${Date.now()}`,
      processing_status: 'pending',
      metadata: { isOwner },
    });
    
    if (!logResult.success) {
      // CRITICAL: Logging failed - cannot proceed
      logger.error(`[Telegram:CRITICAL] Raw input logging failed: ${logResult.error}`);
      const errorMessage = getStorageUnavailableMessage('telegram');
      await sendMessage(chatId, errorMessage);
      return; // STOP - do not proceed
    }
    
    logger.info(`[Telegram:INPUT_LOGGED] Conv:${logResult.conversation_id} - Now processing...`);
    
    // ====================================================================================
    // NOW we can proceed with processing - raw input is safely logged
    // ====================================================================================
    
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
    
    // === SAVE COMPLETE INTERACTION: Log the full exchange (input + output) ===
    logger.info('[Telegram] Logging complete interaction...');
    const { logInteraction } = await import('../core/inputLogSystem');
    
    const interactionLogResult = await logInteraction({
      platform: 'telegram',
      source: 'bot',
      sender_id: chatId,
      raw_text: message,
      timestamp: Date.now(),
      conversation_id: logResult.conversation_id,
      processing_status: 'processed',
      metadata: { isOwner },
    }, response);
    
    if (interactionLogResult.success) {
      logger.info('[Telegram] ✅ Complete interaction logged');
    } else {
      logger.error(`[Telegram] ❌ Interaction logging failed: ${interactionLogResult.error}`);
    }
    
    // Invalidate context cache
    const { contextLearningSystem } = await import('../core/contextLearningSystem');
    contextLearningSystem.invalidateCache();
    
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
