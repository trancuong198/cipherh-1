// CipherH Memory Bridge
// Cau noi voi Notion de linh hon co bo nho ngoai

import { SoulStateExport } from "./soulState";

export interface MemoryRecord {
  id?: string;
  type: "Lesson" | "Daily Summary" | "State Snapshot" | "Strategy";
  title: string;
  content: string;
  created_at: string;
}

export class MemoryBridge {
  private notionToken: string | undefined;
  private databaseId: string | undefined;
  private connected: boolean = false;

  constructor() {
    this.notionToken = process.env.NOTION_TOKEN;
    this.databaseId = process.env.NOTION_DATABASE_ID;

    if (this.notionToken && this.databaseId) {
      this.connected = true;
      console.log("MemoryBridge: Notion credentials loaded from environment");
    } else {
      console.log("MemoryBridge: Notion credentials not found in environment");
      console.log("MemoryBridge: Running in placeholder mode");
    }
  }

  async writeLesson(text: string): Promise<boolean> {
    if (!this.connected) {
      console.log("[Placeholder] Writing lesson:", text.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing lesson to Notion: ${text.substring(0, 50)}...`);

    try {
      // Real Notion API call would go here
      // const response = await fetch('https://api.notion.com/v1/pages', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.notionToken}`,
      //     'Content-Type': 'application/json',
      //     'Notion-Version': '2022-06-28'
      //   },
      //   body: JSON.stringify({
      //     parent: { database_id: this.databaseId },
      //     properties: {
      //       Title: { title: [{ text: { content: 'Lesson' } }] },
      //       Content: { rich_text: [{ text: { content: text } }] },
      //       Type: { select: { name: 'Lesson' } },
      //       Date: { date: { start: new Date().toISOString() } }
      //     }
      //   })
      // });

      console.log("Lesson written successfully (placeholder)");
      return true;
    } catch (error) {
      console.error("Error writing lesson to Notion:", error);
      return false;
    }
  }

  async writeDailySummary(summary: string): Promise<boolean> {
    if (!this.connected) {
      console.log("[Placeholder] Writing daily summary:", summary.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing daily summary to Notion (${summary.length} chars)`);

    try {
      // Real Notion API call would go here
      console.log("Daily summary written successfully (placeholder)");
      return true;
    } catch (error) {
      console.error("Error writing daily summary to Notion:", error);
      return false;
    }
  }

  async writeStateSnapshot(state: SoulStateExport): Promise<boolean> {
    if (!this.connected) {
      console.log(`[Placeholder] Writing state snapshot: cycle=${state.cycle_count}, doubts=${state.doubts}`);
      return true;
    }

    console.log(`Writing state snapshot to Notion (cycle=${state.cycle_count})`);

    try {
      // Real Notion API call would go here
      console.log("State snapshot written successfully (placeholder)");
      return true;
    } catch (error) {
      console.error("Error writing state snapshot to Notion:", error);
      return false;
    }
  }

  async writeStrategyNote(note: string, strategyType: string = "general"): Promise<boolean> {
    if (!this.connected) {
      console.log(`[Placeholder] Writing ${strategyType} strategy:`, note.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing ${strategyType} strategy note to Notion`);

    try {
      // Real Notion API call would go here
      console.log("Strategy note written successfully (placeholder)");
      return true;
    } catch (error) {
      console.error("Error writing strategy note to Notion:", error);
      return false;
    }
  }

  async readRecentMemories(limit: number = 10, memoryType?: string): Promise<MemoryRecord[]> {
    if (!this.connected) {
      console.log(`[Placeholder] Reading ${limit} recent memories (type=${memoryType || "all"})`);
      return [];
    }

    console.log(`Reading ${limit} recent memories from Notion`);

    try {
      // Real Notion API call would go here
      return [];
    } catch (error) {
      console.error("Error reading memories from Notion:", error);
      return [];
    }
  }

  async searchMemory(query: string): Promise<MemoryRecord[]> {
    if (!this.connected) {
      console.log(`[Placeholder] Searching Notion for: ${query}`);
      return [];
    }

    console.log(`Searching Notion for: ${query}`);

    try {
      // Real Notion API call would go here
      return [];
    } catch (error) {
      console.error("Error searching Notion:", error);
      return [];
    }
  }

  getConnectionStatus(): {
    connected: boolean;
    has_token: boolean;
    has_database_id: boolean;
    timestamp: string;
  } {
    return {
      connected: this.connected,
      has_token: !!this.notionToken,
      has_database_id: !!this.databaseId,
      timestamp: new Date().toISOString(),
    };
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Re-check credentials (useful after env vars are updated)
  refreshConnection(): void {
    this.notionToken = process.env.NOTION_TOKEN;
    this.databaseId = process.env.NOTION_DATABASE_ID;

    if (this.notionToken && this.databaseId) {
      this.connected = true;
      console.log("MemoryBridge: Notion connection refreshed");
    } else {
      this.connected = false;
      console.log("MemoryBridge: Still in placeholder mode");
    }
  }
}

export const memoryBridge = new MemoryBridge();
