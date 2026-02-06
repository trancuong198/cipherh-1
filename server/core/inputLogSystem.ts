/**
 * INPUT_LOG SYSTEM
 * 
 * ABSOLUTE RULE: EVERY INPUT must create an INPUT_LOG
 * - No exceptions
 * - No deduplication at logging time
 * - All platforms use this SAME pipeline
 * - Fail loudly if logging fails
 * 
 * INPUT_LOG ≠ SEMANTIC MEMORY
 * - INPUT_LOG: Raw event recording (this module)
 * - SEMANTIC MEMORY: Processed/deduplicated storage (separate)
 */

import { memoryBridge } from './memory';
import { logger } from '../services/logger';

export interface RawInput {
  platform: 'telegram' | 'facebook' | 'zalo' | 'tiktok' | 'web' | 'api' | 'webhook';
  userId: string;
  message: string;
  timestamp: number;
  metadata?: any;
}

/**
 * Log raw input - UNCONDITIONAL
 * ❌ CẤM bỏ qua
 * ❌ CẤM dedup
 * ❌ CẤM condition kiểu "nếu giống thì thôi"
 */
export async function logRawInput(input: RawInput) {
  const connected = await memoryBridge.isConnected();
  
  if (!connected) {
    throw new Error('INPUT_LOG_UNAVAILABLE: Storage not connected');
  }

  const logEntry = {
    type: "INPUT_LOG" as const,
    platform: input.platform,
    userId: input.userId,
    message: input.message,
    timestamp: input.timestamp,
    metadata: input.metadata ?? null,
  };

  // Format for Notion
  const eventText = `
📝 INPUT_LOG
Platform: ${input.platform}
User: ${input.userId}
Time: ${new Date(input.timestamp).toISOString()}

Message:
${input.message}

Metadata: ${JSON.stringify(input.metadata ?? null, null, 2)}
  `.trim();

  // Write - no conditions, no checks, just write
  const result = await memoryBridge.writeRawEvent(eventText);

  if (!result.success) {
    throw new Error(`INPUT_LOG_FAILED: ${result.reason}`);
  }

  logger.info(`[INPUT_LOG] ${input.platform} - User ${input.userId} logged`);
}

/**
 * Log interaction (input + output)
 */
export async function logInteraction(
  input: RawInput,
  response: string,
  metadata?: any
) {
  const connected = await memoryBridge.isConnected();
  
  if (!connected) {
    throw new Error('INPUT_LOG_UNAVAILABLE: Storage not connected');
  }

  const eventText = `
📝 INPUT_LOG (Interaction)
Platform: ${input.platform}
User: ${input.userId}
Time: ${new Date(input.timestamp).toISOString()}

💬 INPUT:
${input.message}

🤖 OUTPUT:
${response}

Metadata: ${JSON.stringify(metadata ?? null, null, 2)}
  `.trim();

  // Write - unconditional
  const result = await memoryBridge.writeRawEvent(eventText);

  if (!result.success) {
    throw new Error(`INPUT_LOG_FAILED: ${result.reason}`);
  }

  logger.info(`[INPUT_LOG] ${input.platform} - User ${input.userId} interaction logged`);
}
