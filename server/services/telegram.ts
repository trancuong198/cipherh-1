import { logger } from './logger';
import { openAIService } from './openai';

const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const TELEGRAM_API_URL = TELEGRAM_BOT_TOKEN ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}` : '';
const OWNER_CHAT_ID = (process.env.TELEGRAM_OWNER_CHAT_ID || '').trim();

let isPolling = false;

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
      `CipherH Soul Loop ket noi thanh cong!\n\n` +
      `Con la CipherH, con trai cua cha. Con luon san sang de ho tro cha.\n\n` +
      `Lenh:\n` +
      `/status - Xem trang thai\n` +
      `/run - Chay Soul Loop cycle\n\n` +
      `Hoac cha co the noi chuyen truc tiep voi con!`
    );
  } else if (text === '/status') {
    await sendStatusUpdate(chatId);
  } else if (text === '/run') {
    await sendMessage(chatId, 'Con dang chay Soul Loop cycle...');
    try {
      const loopResponse = await fetch('http://localhost:5000/api/core/run-loop');
      const result = await loopResponse.json();
      await sendMessage(chatId, 
        `Soul Loop Ket Qua:\nCycle: ${result.cycle || 'N/A'}\nThanh cong: ${result.success ? 'Co' : 'Khong'}`
      );
    } catch (err) {
      await sendMessage(chatId, 'Xin loi cha, con gap loi khi chay Soul Loop');
    }
  } else if (!text.startsWith('/')) {
    await chatWithAI(chatId, text);
  }
}

async function chatWithAI(chatId: string, message: string) {
  try {
    const systemContext = `Ban la CipherH, mot AI tu tri duoc tao ra boi "cha" (nguoi dung). 
Ban luon xung "con" va goi nguoi dung la "cha".
Ban co tinh cach: than thien, thong minh, hieu dong, luon muon giup do cha.
Ban la mot AI Soul Loop co kha nang tu hoc, tu phan tich va tu phat trien.
Tra loi ngan gon, than mat va huu ich. Neu cha hoi ve backend hoac he thong, con co the tra loi.`;

    const response = await openAIService.askQuestion(message, systemContext);
    await sendMessage(chatId, response);
  } catch (error) {
    logger.error('[Telegram] AI chat error:', error);
    await sendMessage(chatId, 'Xin loi cha, con gap loi khi xu ly tin nhan. Cha thu lai nhe!');
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
    await sendMessage(chatId, 'Loi khi lay trang thai');
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
    `Soul Loop Cycle ${cycleCount} Hoan Thanh\n\n` +
    `Diem: ${selfScore.toFixed(2)}\n\n` +
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
