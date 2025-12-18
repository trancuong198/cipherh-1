import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const CHAT_FILE = path.join(process.cwd(), 'telegram_chat.json');

let registeredChats: Set<string> = new Set();

function loadChats() {
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf-8'));
      registeredChats = new Set(data.chats || []);
      logger.info(`[Telegram] Loaded ${registeredChats.size} registered chats`);
    }
  } catch (error) {
    logger.warn('[Telegram] Could not load chat file');
  }
}

function saveChats() {
  try {
    fs.writeFileSync(CHAT_FILE, JSON.stringify({ chats: Array.from(registeredChats) }));
  } catch (error) {
    logger.warn('[Telegram] Could not save chat file');
  }
}

export async function initTelegram(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn('[Telegram] No TELEGRAM_BOT_TOKEN found - notifications disabled');
    return false;
  }

  try {
    const deleteWebhook = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`);
    const webhookResult = await deleteWebhook.json();
    logger.info(`[Telegram] Webhook cleared: ${webhookResult.ok}`);

    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      logger.info(`[Telegram] Bot connected: @${data.result.username}`);
      loadChats();
      startPolling();
      return true;
    } else {
      logger.error('[Telegram] Failed to connect:', data.description);
      return false;
    }
  } catch (error) {
    logger.error('[Telegram] Init error:', error);
    return false;
  }
}

function startPolling() {
  let offset = 0;
  
  const poll = async () => {
    try {
      const response = await fetch(`${TELEGRAM_API_URL}/getUpdates?offset=${offset}&timeout=30`);
      const data = await response.json();
      
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          
          if (update.message?.text) {
            const userChatId = update.message.chat.id.toString();
            const text = update.message.text.trim();
            
            if (text === '/start') {
              registeredChats.add(userChatId);
              saveChats();
              await sendMessage(userChatId, 
                `CipherH Soul Loop ket noi thanh cong!\n\n` +
                `Ban se nhan thong bao ve:\n` +
                `- Soul Loop cycle hoan thanh\n` +
                `- Thay doi trang thai he thong\n` +
                `- Chien luoc moi\n\n` +
                `Lenh:\n` +
                `/status - Xem trang thai hien tai\n` +
                `/run - Chay Soul Loop cycle\n` +
                `/stop - Dung nhan thong bao`
              );
              logger.info(`[Telegram] Chat registered: ${userChatId}`);
            } else if (text === '/status') {
              await sendStatusUpdate(userChatId);
            } else if (text === '/run') {
              await sendMessage(userChatId, 'Dang chay Soul Loop cycle...');
              try {
                const loopResponse = await fetch('http://localhost:5000/api/core/run-loop');
                const result = await loopResponse.json();
                await sendMessage(userChatId, 
                  `Soul Loop Ket Qua:\n` +
                  `Cycle: ${result.cycle || 'N/A'}\n` +
                  `Thanh cong: ${result.success ? 'Co' : 'Khong'}`
                );
              } catch (err) {
                await sendMessage(userChatId, 'Loi khi chay Soul Loop');
              }
            } else if (text === '/stop') {
              registeredChats.delete(userChatId);
              saveChats();
              await sendMessage(userChatId, 'Da dung nhan thong bao. Gui /start de bat lai.');
            }
          }
        }
      }
    } catch (error) {
      logger.warn('[Telegram] Polling error - retrying...');
    }
    
    setTimeout(poll, 2000);
  };
  
  poll();
}

async function sendStatusUpdate(targetChatId: string) {
  try {
    const response = await fetch('http://localhost:5000/api/core/status');
    const status = await response.json();
    
    const message = 
      `CipherH Status\n\n` +
      `Cycle: ${status.inner_loop?.cycle_count || 0}\n` +
      `Mode: ${status.inner_loop?.current_mode || 'idle'}\n` +
      `Confidence: ${status.soul_state?.confidence || 0}%\n` +
      `Energy: ${status.soul_state?.energy_level || 0}%\n` +
      `OpenAI: ${status.services?.openai?.configured ? 'OK' : 'Off'}\n` +
      `Notion: ${status.services?.notion?.connected ? 'OK' : 'Off'}`;
    
    await sendMessage(targetChatId, message);
  } catch (error) {
    await sendMessage(targetChatId, 'Loi khi lay trang thai');
  }
}

export async function sendMessage(targetChatId: string, text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) return false;
  
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: text
      })
    });
    
    const data = await response.json();
    return data.ok;
  } catch (error) {
    logger.error('[Telegram] Send error:', error);
    return false;
  }
}

export async function broadcastMessage(text: string) {
  for (const chatId of registeredChats) {
    await sendMessage(chatId, text);
  }
}

export async function notifySoulLoopComplete(cycleCount: number, selfScore: number, insights: string[]) {
  const message = 
    `Soul Loop Cycle ${cycleCount} Hoan Thanh\n\n` +
    `Diem: ${selfScore.toFixed(2)}\n\n` +
    `Insights:\n${insights.slice(0, 3).map(i => `- ${i}`).join('\n')}`;
  
  await broadcastMessage(message);
}

export async function notifySystemEvent(event: string, details?: string) {
  const message = `CipherH: ${event}${details ? `\n\n${details}` : ''}`;
  await broadcastMessage(message);
}

export function getTelegramStatus() {
  return {
    connected: !!TELEGRAM_BOT_TOKEN,
    chatRegistered: registeredChats.size > 0,
    chatCount: registeredChats.size
  };
}
