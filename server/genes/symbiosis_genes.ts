import { IGene } from './IGene';
import { logger } from '../services/logger';
import { initTelegram } from '../services/telegram';

// Core symbiosis genes that enable the system to function
export const allGenes: IGene[] = [
  {
    name: 'core-survival',
    description: 'Core survival monitoring gene',
    immutable: true,
    init: async () => {
      logger.info('[gene:core-survival] initialized');
    },
  },
  {
    name: 'telegram-bot',
    description: 'Telegram bot communication gene - enables bot to receive and respond to messages',
    immutable: false,
    init: async () => {
      logger.info('[gene:telegram-bot] initializing Telegram bot...');
      const success = await initTelegram();
      if (success) {
        logger.info('[gene:telegram-bot] Telegram bot initialized successfully - bot is now polling for messages');
      } else {
        logger.warn('[gene:telegram-bot] Telegram bot initialization skipped - check TELEGRAM_BOT_TOKEN environment variable');
      }
    },
  },
];
