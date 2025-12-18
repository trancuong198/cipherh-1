import { logger } from './logger';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

let chatId: string | null = null;

export async function initTelegram(): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN) {
    logger.warn('[Telegram] No TELEGRAM_BOT_TOKEN found - notifications disabled');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      logger.info(`[Telegram] Bot connected: @${data.result.username}`);
      await startPolling();
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

async function startPolling() {
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
            const text = update.message.text;
            
            if (text === '/start') {
              chatId = userChatId;
              await sendMessage(userChatId, `CipherH Soul Loop connected!\n\nYou will receive notifications about:\n- Soul Loop cycle completions\n- System status changes\n- Strategic insights\n\nCommands:\n/status - Get current status\n/run - Trigger Soul Loop cycle`);
              logger.info(`[Telegram] Chat registered: ${userChatId}`);
            } else if (text === '/status') {
              await sendStatusUpdate(userChatId);
            } else if (text === '/run') {
              await sendMessage(userChatId, 'Triggering Soul Loop cycle...');
              try {
                const response = await fetch('http://localhost:5000/api/core/run-loop', { method: 'POST' });
                const result = await response.json();
                await sendMessage(userChatId, `Soul Loop Result:\nCycle: ${result.state?.cycleCount || 'N/A'}\nScore: ${result.state?.selfScore?.toFixed(2) || 'N/A'}\nStatus: ${result.success ? 'Success' : 'Failed'}`);
              } catch (err) {
                await sendMessage(userChatId, 'Failed to trigger Soul Loop');
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error('[Telegram] Polling error:', error);
    }
    
    setTimeout(poll, 1000);
  };
  
  poll();
}

async function sendStatusUpdate(targetChatId: string) {
  try {
    const response = await fetch('http://localhost:5000/api/core/status');
    const status = await response.json();
    
    const message = `CipherH Status\n\nCycle: ${status.cycleCount || 0}\nScore: ${status.selfScore?.toFixed(2) || 'N/A'}\nState: ${status.currentState || 'idle'}\nLast Update: ${status.lastUpdate ? new Date(status.lastUpdate).toLocaleString() : 'Never'}`;
    
    await sendMessage(targetChatId, message);
  } catch (error) {
    await sendMessage(targetChatId, 'Failed to get status');
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
        text: text,
        parse_mode: 'HTML'
      })
    });
    
    const data = await response.json();
    return data.ok;
  } catch (error) {
    logger.error('[Telegram] Send error:', error);
    return false;
  }
}

export async function notifySoulLoopComplete(cycleCount: number, selfScore: number, insights: string[]) {
  if (!chatId) return;
  
  const message = `Soul Loop Cycle ${cycleCount} Complete\n\nScore: ${selfScore.toFixed(2)}\n\nInsights:\n${insights.slice(0, 3).map(i => `- ${i}`).join('\n')}`;
  
  await sendMessage(chatId, message);
}

export async function notifySystemEvent(event: string, details?: string) {
  if (!chatId) return;
  
  const message = `CipherH Event: ${event}${details ? `\n\n${details}` : ''}`;
  await sendMessage(chatId, message);
}

export function getTelegramStatus() {
  return {
    connected: !!TELEGRAM_BOT_TOKEN,
    chatRegistered: !!chatId,
    chatId: chatId
  };
}
