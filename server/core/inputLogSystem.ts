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
 * 
 * MANDATORY BEHAVIOR:
 * - Logging happens BEFORE any response logic
 * - If logging fails → system MUST surface failure and STOP pretending
 * - Raw logs are ALWAYS stored (no deduplication at write time)
 * - De-duplication only at QUERY time, not write time
 */

import { memoryBridge } from './memory';
import { logger } from '../services/logger';

export interface RawInput {
  // Mandatory fields as per requirement
  platform: 'telegram' | 'facebook' | 'zalo' | 'tiktok' | 'web' | 'api' | 'webhook';
  source: 'comment' | 'inbox' | 'webhook' | 'api' | 'group' | 'private' | 'bot' | 'chat';
  sender_id: string | null; // null if unavailable
  raw_text: string; // UNMODIFIED message content
  timestamp: number;
  conversation_id: string; // Generate if missing
  processing_status: 'pending' | 'processed' | 'failed';
  
  // Optional metadata
  metadata?: any;
  
  // Legacy support (deprecated, use raw_text)
  message?: string;
  userId?: string;
}

/**
 * Generate storage unavailable error message
 * System MUST explicitly say learning is paused
 */
export function getStorageUnavailableMessage(platform: string): string {
  return `I cannot store this interaction. Learning is paused.

⚠️ Storage system is not available. Without persistent memory, I cannot:
- Remember this conversation
- Learn from interactions  
- Build continuity over time
- Evolve based on experience

This is a temporary limitation. The system requires storage connection to function as intended.

Platform: ${platform}
Status: Storage unavailable
Action: Cannot process without logging capability`;
}

/**
 * Validate and normalize RawInput
 * Ensures all mandatory fields are present
 */
export function validateAndNormalizeInput(input: Partial<RawInput>): RawInput {
  // Support legacy format
  const raw_text = input.raw_text || input.message || '';
  const sender_id = input.sender_id || input.userId || null;
  
  if (!raw_text) {
    throw new Error('VALIDATION_FAILED: raw_text is required');
  }
  
  if (!input.platform) {
    throw new Error('VALIDATION_FAILED: platform is required');
  }
  
  // Generate conversation_id if missing
  const conversation_id = input.conversation_id || `${input.platform}-${sender_id || 'unknown'}-${Date.now()}`;
  
  // Default source based on platform if not provided
  const source = input.source || (input.platform === 'web' ? 'chat' : 'webhook');
  
  return {
    platform: input.platform,
    source,
    sender_id,
    raw_text,
    timestamp: input.timestamp || Date.now(),
    conversation_id,
    processing_status: input.processing_status || 'pending',
    metadata: input.metadata || null,
  };
}

/**
 * Log raw input - UNCONDITIONAL
 * ❌ CẤM bỏ qua
 * ❌ CẤM dedup
 * ❌ CẤM condition kiểu "nếu giống thì thôi"
 * 
 * MANDATORY: This MUST be called BEFORE any response logic
 */
export async function logRawInput(input: Partial<RawInput>): Promise<{
  success: boolean;
  conversation_id: string;
  error?: string;
}> {
  try {
    // Validate and normalize input
    const normalizedInput = validateAndNormalizeInput(input);
    
    // Check connection
    const connected = await memoryBridge.isConnected();
    
    if (!connected) {
      logger.error(`[INPUT_LOG:CRITICAL] Storage not connected - CANNOT LOG: ${normalizedInput.platform}:${normalizedInput.sender_id}`);
      throw new Error('INPUT_LOG_UNAVAILABLE: Storage not connected');
    }

    // Format for storage with ALL mandatory fields
    const eventText = `
📝 RAW_INTERACTION_LOG
Platform: ${normalizedInput.platform}
Source: ${normalizedInput.source}
Sender ID: ${normalizedInput.sender_id || 'unknown'}
Conversation ID: ${normalizedInput.conversation_id}
Processing Status: ${normalizedInput.processing_status}
Timestamp: ${new Date(normalizedInput.timestamp).toISOString()}

RAW TEXT (UNMODIFIED):
${normalizedInput.raw_text}

Metadata: ${JSON.stringify(normalizedInput.metadata ?? null, null, 2)}
    `.trim();

    // Write - no conditions, no checks, no deduplication - ALWAYS WRITE
    const result = await memoryBridge.writeRawEvent(eventText);

    if (!result.success) {
      logger.error(`[INPUT_LOG:CRITICAL] Write failed: ${result.reason}`);
      throw new Error(`INPUT_LOG_FAILED: ${result.reason}`);
    }

    logger.info(`[INPUT_LOG:SUCCESS] ${normalizedInput.platform}:${normalizedInput.source} - ${normalizedInput.sender_id} - Conv:${normalizedInput.conversation_id}`);
    
    return {
      success: true,
      conversation_id: normalizedInput.conversation_id,
    };
  } catch (error: any) {
    logger.error(`[INPUT_LOG:EXCEPTION] ${error.message}`);
    return {
      success: false,
      conversation_id: input.conversation_id || 'failed',
      error: error.message,
    };
  }
}

/**
 * Log interaction (input + output)
 * This logs the complete exchange including the response
 * 
 * IMPORTANT: logRawInput() should ALWAYS be called first
 * This is for recording the complete interaction after response
 */
export async function logInteraction(
  input: Partial<RawInput>,
  response: string,
  metadata?: any
): Promise<{
  success: boolean;
  conversation_id: string;
  error?: string;
}> {
  try {
    // Validate and normalize input
    const normalizedInput = validateAndNormalizeInput(input);
    
    // Update processing status to processed
    normalizedInput.processing_status = 'processed';
    
    // Check connection
    const connected = await memoryBridge.isConnected();
    
    if (!connected) {
      logger.error(`[INPUT_LOG:CRITICAL] Storage not connected - CANNOT LOG INTERACTION`);
      throw new Error('INPUT_LOG_UNAVAILABLE: Storage not connected');
    }

    const eventText = `
📝 INTERACTION_LOG
Platform: ${normalizedInput.platform}
Source: ${normalizedInput.source}
Sender ID: ${normalizedInput.sender_id || 'unknown'}
Conversation ID: ${normalizedInput.conversation_id}
Processing Status: ${normalizedInput.processing_status}
Timestamp: ${new Date(normalizedInput.timestamp).toISOString()}

💬 INPUT (RAW):
${normalizedInput.raw_text}

🤖 OUTPUT:
${response}

Metadata: ${JSON.stringify(metadata ?? null, null, 2)}
    `.trim();

    // Write - unconditional, no deduplication
    const result = await memoryBridge.writeRawEvent(eventText);

    if (!result.success) {
      logger.error(`[INPUT_LOG:CRITICAL] Interaction write failed: ${result.reason}`);
      throw new Error(`INPUT_LOG_FAILED: ${result.reason}`);
    }

    logger.info(`[INPUT_LOG:SUCCESS] Interaction logged - ${normalizedInput.platform}:${normalizedInput.source} - Conv:${normalizedInput.conversation_id}`);
    
    return {
      success: true,
      conversation_id: normalizedInput.conversation_id,
    };
  } catch (error: any) {
    logger.error(`[INPUT_LOG:EXCEPTION] ${error.message}`);
    return {
      success: false,
      conversation_id: input.conversation_id || 'failed',
      error: error.message,
    };
  }
}

/**
 * CRITICAL: Check if logging is available
 * ALL platforms MUST call this before attempting any response
 */
export async function isLoggingAvailable(): Promise<boolean> {
  return await memoryBridge.isConnected();
}

/**
 * MANDATORY: Handle logging failure
 * System MUST return this message if logging fails
 * NO generic chatbot responses allowed
 */
export function handleLoggingFailure(platform: string, sender_id: string | null): {
  shouldRespond: false;
  errorMessage: string;
  reason: 'STORAGE_UNAVAILABLE';
} {
  const message = getStorageUnavailableMessage(platform);
  
  logger.error(`[INPUT_LOG:BLOCKED] Cannot respond without logging - Platform: ${platform}, Sender: ${sender_id}`);
  
  return {
    shouldRespond: false as const,
    errorMessage: message,
    reason: 'STORAGE_UNAVAILABLE' as const,
  };
}
