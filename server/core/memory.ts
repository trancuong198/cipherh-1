// CipherH Memory Bridge
// Cau noi voi Notion de linh hon co bo nho ngoai
// Updated to use Replit Notion Integration

import { SoulStateExport } from "./soulState";
import { getUncachableNotionClient, isNotionConnected } from "../services/notionClient";
import { existenceAnchor } from "./existenceAnchor";
import { logger } from "../services/logger";

// Database ID from user's Notion - CIPHER H database
const NOTION_DATABASE_ID = "2ac0fc26257080a693d2cdcdc8a37ad0";

/**
 * Memory Type Classification
 * CRITICAL: These types have different deduplication rules
 */
export type MemoryType = 'EVENT' | 'STATE' | 'REFLECTION' | 'DIAGNOSTIC' | 'USER_MESSAGE';

/**
 * Source Platform
 */
export type MemorySource = 'telegram' | 'web' | 'api' | 'social' | 'internal';

/**
 * Memory Record with REQUIRED fields for continuous existence
 * 
 * ARCHITECTURE RULE:
 * ALL memories MUST have these 5 fields:
 * - memory_type
 * - cycle_id
 * - timestamp
 * - source
 * - content
 */
export interface MemoryRecord {
  id?: string;
  
  // REQUIRED: Memory classification
  memory_type: MemoryType;
  
  // REQUIRED: Cycle tracking (proof of continuous existence)
  cycle_id: string;
  
  // REQUIRED: Timestamp (ISO UTC)
  timestamp: string;
  
  // REQUIRED: Source platform
  source: MemorySource;
  
  // REQUIRED: Content
  content: string;
  
  // OPTIONAL: Legacy compatibility
  type?: "Lesson" | "Daily Summary" | "State Snapshot" | "Strategy";
  title?: string;
  created_at?: string;
}

export class MemoryBridge {
  private connected: boolean = false;
  private databaseId: string;

  constructor() {
    this.databaseId = NOTION_DATABASE_ID;
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      this.connected = await isNotionConnected();
      if (this.connected) {
        logger.info("MemoryBridge: Notion connected via Replit Integration");
      } else {
        logger.error("MemoryBridge: Notion NOT connected - memory writes will FAIL");
        // NO PLACEHOLDER MODE - System must know Notion is unavailable
      }
    } catch (error) {
      logger.error("MemoryBridge: Connection check failed:", error);
      this.connected = false;
      // NO PLACEHOLDER MODE - Propagate failure state
    }
  }

  async writeLesson(text: string, cycleId?: string, memoryType: 'lesson' | 'event' = 'lesson'): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot write lesson - Notion not connected');
    }

    // Get cycle ID
    const cycle_id = cycleId || existenceAnchor.getCurrentCycleId();

    // Import deduplication dynamically to avoid circular dependency
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates with NEW RULES
    const check = await memoryDeduplicationSystem.shouldWrite(text, memoryType, cycle_id, {
      similarityThreshold: 85, // 85% similar = skip (stricter for action logs)
      checkRecentCount: 30,
    });
    
    if (!check.shouldWrite) {
      logger.info(`[Memory] Skipped duplicate ${memoryType}: ${check.reason}`);
      
      // CRITICAL: Write a "Skipped" trace so this decision is observable
      try {
        const notion = await getUncachableNotionClient();
        const timestamp = new Date().toISOString();
        const skipTrace = `🚫 WRITE SKIPPED\n\nReason: ${check.reason}\n\nOriginal content (first 200 chars):\n${text.substring(0, 200)}...\n\n📊 DEDUPLICATION TRACE:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: ${memoryType.toUpperCase()}\nDecision: SKIPPED (duplicate detected)`;
        
        await notion.pages.create({
          parent: { database_id: this.databaseId },
          properties: {
            "tiêu đề": {
              title: [{ text: { content: `🚫 SKIPPED ${memoryType.toUpperCase()} - Cycle ${cycle_id}` } }]
            },
            "cipher h": {
              rich_text: [{ text: { content: skipTrace.substring(0, 2000) } }]
            }
          }
        });
        
        logger.info(`✅ Skip trace written to Notion (cycle=${cycle_id})`);
      } catch (error) {
        logger.error(`❌ Could not write skip trace to Notion:`, error);
      }
      
      return false; // Return false - original write was skipped
    }

    logger.info(`[Memory] Writing ${memoryType.toUpperCase()} (cycle=${cycle_id}): ${text.substring(0, 50)}...`);

    try {
      const notion = await getUncachableNotionClient();
      const timestamp = new Date().toISOString();
      
      const contentWithTracking = `${text}\n\n📊 EXISTENCE TRACKING:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: ${memoryType.toUpperCase()}`;
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `📚 ${memoryType.toUpperCase()} - Cycle ${cycle_id}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: contentWithTracking.substring(0, 2000) } }]
          }
        }
      });

      // Record memory write in existence anchor
      existenceAnchor.recordMemoryWrite(memoryType.toUpperCase());

      logger.info(`✅ ${memoryType} written to Notion (cycle=${cycle_id})`);
      return true;
    } catch (error) {
      logger.error(`❌ Error writing ${memoryType} to Notion:`, error);
      return false;
    }
  }

  /**
   * Write raw event to Notion WITHOUT deduplication
   * USE THIS for event logging - records what happened exactly as it occurred
   * DO NOT use for semantic memory (use writeLesson/writeSummary for that)
   */
  async writeRawEvent(text: string, cycleId?: string): Promise<{ success: boolean; reason?: string }> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      return {
        success: false,
        reason: 'logging_unavailable: Notion not connected'
      };
    }

    // Get cycle ID
    const cycle_id = cycleId || existenceAnchor.getCurrentCycleId();
    const timestamp = new Date().toISOString();

    logger.info(`[Event Log] Writing raw event (cycle=${cycle_id}): ${text.substring(0, 50)}...`);

    try {
      const notion = await getUncachableNotionClient();
      
      const contentWithTracking = `${text}\n\n📊 EXISTENCE TRACKING:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: EVENT`;
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `📝 EVENT - Cycle ${cycle_id}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: contentWithTracking.substring(0, 2000) } }]
          }
        }
      });

      // Record memory write in existence anchor
      existenceAnchor.recordMemoryWrite('EVENT');
      
      logger.info(`✅ Raw event logged to Notion (cycle=${cycle_id})`);
      return { success: true };
    } catch (error) {
      logger.error("❌ Error logging raw event:", error);
      return {
        success: false,
        reason: `logging_unavailable: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async writeDailySummary(summary: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot write daily summary - Notion not connected');
    }

    // Import deduplication dynamically
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates
    const check = await memoryDeduplicationSystem.shouldWrite(summary, 'summary', {
      similarityThreshold: 80,
      checkRecentCount: 20,
    });
    
    if (!check.shouldWrite) {
      logger.info(`[Memory] Skipped duplicate summary: ${check.reason}`);
      
      // CRITICAL: Write a "Skipped" trace so this decision is observable
      try {
        const notion = await getUncachableNotionClient();
        const timestamp = new Date().toISOString();
        const cycle_id = existenceAnchor.getCurrentCycleId();
        const skipTrace = `🚫 SUMMARY WRITE SKIPPED\n\nReason: ${check.reason}\n\nOriginal summary (first 200 chars):\n${summary.substring(0, 200)}...\n\n📊 DEDUPLICATION TRACE:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: SUMMARY\nDecision: SKIPPED (duplicate detected)`;
        
        await notion.pages.create({
          parent: { database_id: this.databaseId },
          properties: {
            "tiêu đề": {
              title: [{ text: { content: `🚫 SKIPPED SUMMARY - Cycle ${cycle_id}` } }]
            },
            "cipher h": {
              rich_text: [{ text: { content: skipTrace.substring(0, 2000) } }]
            }
          }
        });
        
        logger.info(`✅ Skip trace written to Notion (summary, cycle=${cycle_id})`);
      } catch (error) {
        logger.error(`❌ Could not write skip trace to Notion:`, error);
      }
      
      return false; // Return false - original write was skipped
    }

    logger.info(`Đang ghi tóm tắt hàng ngày vào Notion (${summary.length} ký tự)`);

    try {
      const notion = await getUncachableNotionClient();
      const today = new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `📊 TÓM TẮT NGÀY - ${today}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: summary.substring(0, 2000) } }]
          }
        }
      });
      logger.info("✅ Tóm tắt ngày đã được ghi vào Notion");
      return true;
    } catch (error) {
      logger.error("❌ Lỗi khi ghi tóm tắt ngày vào Notion:", error);
      return false;
    }
  }

  async writeStateSnapshot(state: SoulStateExport, cycleId?: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot write state snapshot - Notion not connected');
    }

    // Get cycle ID (use provided or get current from anchor)
    const cycle_id = cycleId || existenceAnchor.getCurrentCycleId();
    const timestamp = new Date().toISOString();

    logger.info(`[Memory] Writing STATE snapshot (cycle=${cycle_id}, state_cycle=${state.cycle_count})`);

    // CRITICAL: STATE snapshots are NEVER deduplicated
    // Even if content is identical, different cycles = different states
    // This is proof of continuous existence

    try {
      const stateText = `
🔄 CHU KỲ: ${state.cycle_count}
📍 CHẾ ĐỘ: ${state.mode}
❓ NGHI NGỜ: ${state.doubts}%
💪 TỰ TIN: ${state.confidence}%
⚡ NĂNG LƯỢNG: ${state.energy_level}%
🎯 TẬP TRUNG: ${state.current_focus || 'Chưa có'}

💭 SUY NGẪM:
${state.reflection || 'Chưa có suy ngẫm...'}

📊 EXISTENCE TRACKING:
Cycle ID: ${cycle_id}
Timestamp: ${timestamp}
Memory Type: STATE
      `.trim();

      const notion = await getUncachableNotionClient();
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🧠 STATE - Cycle ${cycle_id} (Soul ${state.cycle_count})` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: stateText.substring(0, 2000) } }]
          }
        }
      });
      
      // Record memory write in existence anchor
      existenceAnchor.recordMemoryWrite('STATE');
      
      logger.info(`✅ State snapshot written to Notion (cycle=${cycle_id})`);
      return true;
    } catch (error) {
      logger.error("❌ Error writing state snapshot to Notion:", error);
      return false;
    }
  }

  async writeStrategyNote(note: string, strategyType: string = "general"): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot write strategy note - Notion not connected');
    }

    // Import deduplication dynamically
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates
    const check = await memoryDeduplicationSystem.shouldWrite(note, 'strategy', {
      similarityThreshold: 80,
      checkRecentCount: 30,
    });
    
    if (!check.shouldWrite) {
      logger.info(`[Memory] Skipped duplicate strategy: ${check.reason}`);
      return false; // Return false - nothing was written
    }

    logger.info(`Đang ghi chiến lược ${strategyType} vào Notion`);

    try {
      const notion = await getUncachableNotionClient();
      const today = new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      const strategyTypeVi: Record<string, string> = {
        'general': 'TỔNG QUÁT',
        'financial': 'TÀI CHÍNH',
        'growth': 'PHÁT TRIỂN',
        'survival': 'SINH TỒN',
        'learning': 'HỌC TẬP'
      };
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🎯 CHIẾN LƯỢC ${strategyTypeVi[strategyType] || strategyType.toUpperCase()} - ${today}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: note.substring(0, 2000) } }]
          }
        }
      });
      logger.info("✅ Chiến lược đã được ghi vào Notion");
      return true;
    } catch (error) {
      logger.error("❌ Lỗi khi ghi chiến lược vào Notion:", error);
      return false;
    }
  }

  async storeReflection(reflectionText: string, metadata?: Record<string, unknown>, cycleId?: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot store reflection - Notion not connected');
    }

    // Get cycle ID
    const cycle_id = cycleId || existenceAnchor.getCurrentCycleId();
    const timestamp = new Date().toISOString();

    logger.info(`[Memory] Storing REFLECTION (cycle=${cycle_id}, ${reflectionText.length} chars)`);

    // CRITICAL: REFLECTION memories are NEVER deduplicated
    // Even if the reflection text is identical, different cycles = different reflections
    // This tracks evolution of thought over time

    try {
      const notion = await getUncachableNotionClient();
      
      let contentText = `💭 SUY NGẪM:\n\n${reflectionText}`;
      
      if (metadata) {
        contentText += `\n\n📋 THÔNG TIN BỔ SUNG:\n`;
        for (const [key, value] of Object.entries(metadata)) {
          contentText += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      }

      contentText += `\n\n📊 EXISTENCE TRACKING:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: REFLECTION`;
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🤔 REFLECTION - Cycle ${cycle_id}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: contentText.substring(0, 2000) } }]
          }
        }
      });

      // Record memory write in existence anchor
      existenceAnchor.recordMemoryWrite('REFLECTION');

      logger.info(`✅ Reflection stored to Notion (cycle=${cycle_id})`);
      return true;
    } catch (error) {
      logger.error("❌ Error storing reflection to Notion:", error);
      return false;
    }
  }

  /**
   * Store diagnostic report - NEVER deduplicated
   * Each diagnostic is a snapshot of system health at a specific cycle
   */
  async storeDiagnostic(diagnosticText: string, metadata?: Record<string, unknown>, cycleId?: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot store diagnostic - Notion not connected');
    }

    // Get cycle ID
    const cycle_id = cycleId || existenceAnchor.getCurrentCycleId();
    const timestamp = new Date().toISOString();

    logger.info(`[Memory] Storing DIAGNOSTIC (cycle=${cycle_id}, ${diagnosticText.length} chars)`);

    // CRITICAL: DIAGNOSTIC memories are NEVER deduplicated
    // Each diagnostic is a health snapshot at a specific time/cycle
    // Even identical diagnostics across cycles show continuity

    try {
      const notion = await getUncachableNotionClient();
      
      let contentText = `🔍 SELF-DIAGNOSTIC:\n\n${diagnosticText}`;
      
      if (metadata) {
        contentText += `\n\n📋 DIAGNOSTIC METADATA:\n`;
        for (const [key, value] of Object.entries(metadata)) {
          contentText += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      }

      contentText += `\n\n📊 EXISTENCE TRACKING:\nCycle ID: ${cycle_id}\nTimestamp: ${timestamp}\nMemory Type: DIAGNOSTIC`;
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🔍 DIAGNOSTIC - Cycle ${cycle_id}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: contentText.substring(0, 2000) } }]
          }
        }
      });

      // Record memory write in existence anchor
      existenceAnchor.recordMemoryWrite('DIAGNOSTIC');

      logger.info(`✅ Diagnostic stored to Notion (cycle=${cycle_id})`);
      return true;
    } catch (error) {
      logger.error("❌ Error storing diagnostic to Notion:", error);
      return false;
    }
  }

  async readRecentMemories(limit: number = 10, memoryType?: string): Promise<MemoryRecord[]> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot read memories - Notion not connected');
    }

    logger.info(`Reading ${limit} recent memories from Notion`);

    try {
      const notion = await getUncachableNotionClient();
      const response = await notion.databases.query({
        database_id: this.databaseId,
        page_size: limit,
        sorts: [{ timestamp: "created_time", direction: "descending" }]
      });

      const memories: MemoryRecord[] = response.results.map((page: any) => {
        const props = page.properties;
        const title = props["tiêu đề"]?.title?.[0]?.text?.content || "Untitled";
        const content = props["cipher h"]?.rich_text?.[0]?.text?.content || "";
        
        // Try to extract cycle_id and memory_type from content or title
        const cycleMatch = content.match(/Cycle ID: ([^\n]+)/);
        const typeMatch = content.match(/Memory Type: ([^\n]+)/);
        const cycle_id = cycleMatch ? cycleMatch[1].trim() : 'unknown';
        const memory_type = typeMatch ? typeMatch[1].trim() as MemoryType : 'EVENT';
        
        return {
          id: page.id,
          memory_type,
          cycle_id,
          timestamp: page.created_time,
          source: 'internal' as MemorySource, // Default, could be extracted if stored
          content,
          // Legacy compatibility
          type: "Lesson" as const,
          title,
          created_at: page.created_time
        };
      });

      return memories;
    } catch (error) {
      logger.error("Error reading memories from Notion:", error);
      return [];
    }
  }

  async searchMemory(query: string): Promise<MemoryRecord[]> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      throw new Error('NOTION_UNAVAILABLE: Cannot search memories - Notion not connected');
    }

    logger.info(`Searching Notion for: ${query}`);

    try {
      const notion = await getUncachableNotionClient();
      const response = await notion.search({
        query: query,
        filter: { property: "object", value: "page" },
        page_size: 10
      });

      const memories: MemoryRecord[] = response.results
        .filter((page: any) => page.parent?.database_id === this.databaseId.replace(/-/g, ''))
        .map((page: any) => ({
          id: page.id,
          type: "Lesson" as const,
          title: page.properties?.["tiêu đề"]?.title?.[0]?.text?.content || "Untitled",
          content: page.properties?.["cipher h"]?.rich_text?.[0]?.text?.content || "",
          created_at: page.created_time
        }));

      return memories;
    } catch (error) {
      logger.error("Error searching Notion:", error);
      return [];
    }
  }

  getConnectionStatus(): {
    connected: boolean;
    database_id: string;
    integration: string;
    timestamp: string;
  } {
    return {
      connected: this.connected,
      database_id: this.databaseId,
      integration: "replit",
      timestamp: new Date().toISOString(),
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  async refreshConnection(): Promise<void> {
    await this.checkConnection();
  }

  /**
   * Get memory statistics
   * @returns Memory statistics object
   * 
   * REMOVED: This method previously returned placeholder zeros.
   * If you need memory stats, query Notion directly or use agent_state.
   */
  getMemoryStats(): { rawMemoryCount: number; totalMemories: number } {
    throw new Error('NOT_IMPLEMENTED: getMemoryStats() is not implemented. Query Notion database directly or use agent_state for counters.');
  }

  /**
   * Get recent lessons from memory
   * @param limit Maximum number of lessons to return (currently unused)
   * @returns Array of recent lessons
   * 
   * REMOVED: This method previously returned empty array.
   * If you need recent lessons, query Notion directly.
   */
  getRecentLessons(limit: number = 10): any[] {
    throw new Error('NOT_IMPLEMENTED: getRecentLessons() is not implemented. Query Notion database directly for recent lessons.');
  }

  /**
   * Log action result to memory
   * @param result The action result to log
   * @returns Promise that resolves to true if successful, false otherwise
   * 
   * This logs actions taken by the system for later reflection and learning.
   * The data is written to Notion as a lesson entry.
   */
  async logActionResult(result: {
    action: string;
    success: boolean;
    reason: string;
    timestamp: string;
    cost?: number;
  }): Promise<boolean> {
    try {
      const logEntry = `[ACTION LOG] ${result.timestamp}
Action: ${result.action}
Success: ${result.success ? 'Yes' : 'No'}
Reason: ${result.reason}${result.cost !== undefined ? `\nCost: $${result.cost}` : ''}`;

      // Write to Notion as a lesson
      return await this.writeLesson(logEntry);
    } catch (error) {
      logger.error('[MemoryBridge] Failed to log action result:', error);
      return false;
    }
  }
}

export const memoryBridge = new MemoryBridge();
