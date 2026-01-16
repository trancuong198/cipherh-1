// CipherH Configuration Module
// Centralized environment variable access and validation

import { logger } from './services/logger';

export interface AppConfig {
  nodeEnv: 'development' | 'production';
  port: number;
  openaiApiKey: string | null;
  notionToken: string | null;
  notionDatabaseId: string | null;
  telegramBotToken: string | null;
  telegramOwnerChatId: string | null;
  githubToken: string | null;
  sessionSecret: string | null;
  replitConnectorsHostname: string | null;
  replIdentity: string | null;
  webReplRenewal: string | null;
}

function getEnvString(key: string, defaultValue: string | null = null): string | null {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.trim();
}

function getEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function loadConfig(): AppConfig {
  const config: AppConfig = {
    nodeEnv: (getEnvString('NODE_ENV', 'development') as 'development' | 'production'),
    port: getEnvInt('PORT', 5000),
    openaiApiKey: getEnvString('OPENAI_API_KEY'),
    notionToken: getEnvString('NOTION_TOKEN'),
    notionDatabaseId: getEnvString('NOTION_DATABASE_ID'),
    telegramBotToken: getEnvString('TELEGRAM_BOT_TOKEN'),
    telegramOwnerChatId: getEnvString('TELEGRAM_OWNER_CHAT_ID'),
    githubToken: getEnvString('GITHUB_PERSONAL_ACCESS_TOKEN') || getEnvString('GITHUB_TOKEN'),
    sessionSecret: getEnvString('SESSION_SECRET'),
    replitConnectorsHostname: getEnvString('REPLIT_CONNECTORS_HOSTNAME'),
    replIdentity: getEnvString('REPL_IDENTITY'),
    webReplRenewal: getEnvString('WEB_REPL_RENEWAL'),
  };

  return config;
}

export const config = loadConfig();

export function validateConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (!config.openaiApiKey) {
    warnings.push('OPENAI_API_KEY not set - AI features will run in placeholder mode');
  }
  if (!config.notionToken) {
    warnings.push('NOTION_TOKEN not set - memory persistence will be disabled');
  }
  if (!config.telegramBotToken) {
    warnings.push('TELEGRAM_BOT_TOKEN not set - notifications will be disabled');
  }
  if (!config.sessionSecret) {
    warnings.push('SESSION_SECRET not set - using default (not recommended for production)');
  }

  return { valid: true, warnings };
}

export function logConfigStatus(): void {
  const { warnings } = validateConfig();
  
  logger.info('[Config] Environment loaded successfully');
  logger.info(`[Config] Mode: ${config.nodeEnv}`);
  logger.info(`[Config] Port: ${config.port}`);
  logger.info(`[Config] OpenAI: ${config.openaiApiKey ? 'configured' : 'placeholder'}`);
  logger.info(`[Config] Notion: ${config.notionToken ? 'configured' : 'placeholder'}`);
  logger.info(`[Config] Telegram: ${config.telegramBotToken ? 'configured' : 'disabled'}`);
  
  for (const warning of warnings) {
    logger.warn(`[Config] ${warning}`);
  }
}

export function isProduction(): boolean {
  return config.nodeEnv === 'production';
}
