// CipherH Memory Bridge
// Cau noi voi Notion de linh hon co bo nho ngoai
// Updated to use Replit Notion Integration

import { SoulStateExport } from "./soulState";
import { getUncachableNotionClient, isNotionConnected } from "../services/notionClient";

// Database ID from user's Notion - CIPHER H database
const NOTION_DATABASE_ID = "2ac0fc26257080a693d2cdcdc8a37ad0";

export interface MemoryRecord {
  id?: string;
  type: "Lesson" | "Daily Summary" | "State Snapshot" | "Strategy";
  title: string;
  content: string;
  created_at: string;
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
        console.log("MemoryBridge: Notion connected via Replit Integration");
      } else {
        console.log("MemoryBridge: Notion not connected, running in placeholder mode");
      }
    } catch (error) {
      console.log("MemoryBridge: Running in placeholder mode");
      this.connected = false;
    }
  }

  async writeLesson(text: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log("[Placeholder] Ghi bài học:", text.substring(0, 50) + "...");
      return true;
    }

    // Import deduplication dynamically to avoid circular dependency
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates before writing
    const check = await memoryDeduplicationSystem.shouldWrite(text, 'lesson', {
      similarityThreshold: 85, // 85% similar = skip (stricter for action logs)
      checkRecentCount: 30,
    });
    
    if (!check.shouldWrite) {
      console.log(`[Memory] Skipped duplicate lesson: ${check.reason}`);
      return true; // Return true to indicate "handled" (even though skipped)
    }

    console.log(`Đang ghi bài học vào Notion: ${text.substring(0, 50)}...`);

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
            title: [{ text: { content: `📚 BÀI HỌC - ${today}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: text.substring(0, 2000) } }]
          }
        }
      });
      console.log("✅ Bài học đã được ghi vào Notion");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi ghi bài học vào Notion:", error);
      return false;
    }
  }

  /**
   * Write raw event to Notion WITHOUT deduplication
   * USE THIS for event logging - records what happened exactly as it occurred
   * DO NOT use for semantic memory (use writeLesson/writeSummary for that)
   */
  async writeRawEvent(text: string): Promise<{ success: boolean; reason?: string }> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      return {
        success: false,
        reason: 'logging_unavailable: Notion not connected'
      };
    }

    console.log(`[Event Log] Writing raw event: ${text.substring(0, 50)}...`);

    try {
      const notion = await getUncachableNotionClient();
      const timestamp = new Date().toISOString();
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `📝 EVENT LOG - ${timestamp}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: text.substring(0, 2000) } }]
          }
        }
      });
      
      console.log("✅ Raw event logged to Notion");
      return { success: true };
    } catch (error) {
      console.error("❌ Error logging raw event:", error);
      return {
        success: false,
        reason: `logging_unavailable: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async writeDailySummary(summary: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log("[Placeholder] Ghi tóm tắt hàng ngày:", summary.substring(0, 50) + "...");
      return true;
    }

    // Import deduplication dynamically
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates
    const check = await memoryDeduplicationSystem.shouldWrite(summary, 'summary', {
      similarityThreshold: 80,
      checkRecentCount: 20,
    });
    
    if (!check.shouldWrite) {
      console.log(`[Memory] Skipped duplicate summary: ${check.reason}`);
      return true;
    }

    console.log(`Đang ghi tóm tắt hàng ngày vào Notion (${summary.length} ký tự)`);

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
      console.log("✅ Tóm tắt ngày đã được ghi vào Notion");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi ghi tóm tắt ngày vào Notion:", error);
      return false;
    }
  }

  async writeStateSnapshot(state: SoulStateExport): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Ghi trạng thái: cycle=${state.cycle_count}, doubts=${state.doubts}`);
      return true;
    }

    console.log(`Đang ghi trạng thái soul vào Notion (cycle=${state.cycle_count})`);

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
      `.trim();

      const notion = await getUncachableNotionClient();
      const today = new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🧠 TRẠNG THÁI SOUL - Chu kỳ ${state.cycle_count} - ${today}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: stateText.substring(0, 2000) } }]
          }
        }
      });
      console.log("✅ Trạng thái soul đã được ghi vào Notion");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi ghi trạng thái soul vào Notion:", error);
      return false;
    }
  }

  async writeStrategyNote(note: string, strategyType: string = "general"): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Ghi chiến lược ${strategyType}:`, note.substring(0, 50) + "...");
      return true;
    }

    // Import deduplication dynamically
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates
    const check = await memoryDeduplicationSystem.shouldWrite(note, 'strategy', {
      similarityThreshold: 80,
      checkRecentCount: 30,
    });
    
    if (!check.shouldWrite) {
      console.log(`[Memory] Skipped duplicate strategy: ${check.reason}`);
      return true;
    }

    console.log(`Đang ghi chiến lược ${strategyType} vào Notion`);

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
      console.log("✅ Chiến lược đã được ghi vào Notion");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi ghi chiến lược vào Notion:", error);
      return false;
    }
  }

  async storeReflection(reflectionText: string, metadata?: Record<string, unknown>): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Lưu suy ngẫm:`, reflectionText.substring(0, 50) + "...");
      return true;
    }

    // Import deduplication dynamically
    const { memoryDeduplicationSystem } = await import('./memoryDeduplication');
    
    // Check for duplicates
    const check = await memoryDeduplicationSystem.shouldWrite(reflectionText, 'reflection', {
      similarityThreshold: 80,
      checkRecentCount: 30,
    });
    
    if (!check.shouldWrite) {
      console.log(`[Memory] Skipped duplicate reflection: ${check.reason}`);
      return true;
    }

    console.log(`Đang lưu suy ngẫm vào Notion (${reflectionText.length} ký tự)`);

    try {
      const notion = await getUncachableNotionClient();
      const today = new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let contentText = `💭 SUY NGẪM:\n\n${reflectionText}`;
      
      if (metadata) {
        contentText += `\n\n📋 THÔNG TIN BỔ SUNG:\n`;
        for (const [key, value] of Object.entries(metadata)) {
          contentText += `- ${key}: ${JSON.stringify(value)}\n`;
        }
      }
      
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `🤔 SUY NGẪM - ${today}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: contentText.substring(0, 2000) } }]
          }
        }
      });
      console.log("✅ Suy ngẫm đã được lưu vào Notion");
      return true;
    } catch (error) {
      console.error("❌ Lỗi khi lưu suy ngẫm vào Notion:", error);
      return false;
    }
  }

  async readRecentMemories(limit: number = 10, memoryType?: string): Promise<MemoryRecord[]> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Reading ${limit} recent memories (type=${memoryType || "all"})`);
      return [];
    }

    console.log(`Reading ${limit} recent memories from Notion`);

    try {
      const notion = await getUncachableNotionClient();
      const response = await notion.databases.query({
        database_id: this.databaseId,
        page_size: limit,
        sorts: [{ timestamp: "created_time", direction: "descending" }]
      });

      const memories: MemoryRecord[] = response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          type: "Lesson" as const,
          title: props["tiêu đề"]?.title?.[0]?.text?.content || "Untitled",
          content: props["cipher h"]?.rich_text?.[0]?.text?.content || "",
          created_at: page.created_time
        };
      });

      return memories;
    } catch (error) {
      console.error("Error reading memories from Notion:", error);
      return [];
    }
  }

  async searchMemory(query: string): Promise<MemoryRecord[]> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Searching Notion for: ${query}`);
      return [];
    }

    console.log(`Searching Notion for: ${query}`);

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
      console.error("Error searching Notion:", error);
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
   * Note: This is a placeholder implementation that returns zero values.
   * A full implementation would query Notion or maintain internal counters
   * to provide accurate statistics.
   */
  getMemoryStats(): { rawMemoryCount: number; totalMemories: number } {
    // Return placeholder stats since we can't easily count Notion records without querying
    return {
      rawMemoryCount: 0,
      totalMemories: 0,
    };
  }

  /**
   * Get recent lessons from memory
   * @param limit Maximum number of lessons to return (currently unused)
   * @returns Array of recent lessons
   * 
   * Note: This is a placeholder implementation that returns an empty array.
   * A full implementation would cache recent lessons or query Notion
   * to provide actual lesson data.
   */
  getRecentLessons(limit: number = 10): any[] {
    // This would require querying Notion, but for now return empty array
    // Could be enhanced to cache recent lessons or query Notion
    return [];
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
      console.error('[MemoryBridge] Failed to log action result:', error);
      return false;
    }
  }
}

export const memoryBridge = new MemoryBridge();
