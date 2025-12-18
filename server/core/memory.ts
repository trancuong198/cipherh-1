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
      console.log("[Placeholder] Writing lesson:", text.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing lesson to Notion: ${text.substring(0, 50)}...`);

    try {
      const notion = await getUncachableNotionClient();
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `[LESSON] ${new Date().toISOString().split('T')[0]}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: text.substring(0, 2000) } }]
          }
        }
      });
      console.log("Lesson written to Notion successfully");
      return true;
    } catch (error) {
      console.error("Error writing lesson to Notion:", error);
      return false;
    }
  }

  async writeDailySummary(summary: string): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log("[Placeholder] Writing daily summary:", summary.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing daily summary to Notion (${summary.length} chars)`);

    try {
      const notion = await getUncachableNotionClient();
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `[DAILY] ${new Date().toISOString().split('T')[0]}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: summary.substring(0, 2000) } }]
          }
        }
      });
      console.log("Daily summary written to Notion");
      return true;
    } catch (error) {
      console.error("Error writing daily summary to Notion:", error);
      return false;
    }
  }

  async writeStateSnapshot(state: SoulStateExport): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Writing state snapshot: cycle=${state.cycle_count}, doubts=${state.doubts}`);
      return true;
    }

    console.log(`Writing state snapshot to Notion (cycle=${state.cycle_count})`);

    try {
      const stateText = JSON.stringify({
        cycle: state.cycle_count,
        mode: state.mode,
        doubts: state.doubts,
        confidence: state.confidence,
        energy: state.energy_level,
        focus: state.current_focus,
        reflection: state.reflection
      }, null, 2);

      const notion = await getUncachableNotionClient();
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `[STATE] Cycle ${state.cycle_count}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: stateText.substring(0, 2000) } }]
          }
        }
      });
      console.log("State snapshot written to Notion");
      return true;
    } catch (error) {
      console.error("Error writing state snapshot to Notion:", error);
      return false;
    }
  }

  async writeStrategyNote(note: string, strategyType: string = "general"): Promise<boolean> {
    const isConnected = await isNotionConnected();
    if (!isConnected) {
      console.log(`[Placeholder] Writing ${strategyType} strategy:`, note.substring(0, 50) + "...");
      return true;
    }

    console.log(`Writing ${strategyType} strategy note to Notion`);

    try {
      const notion = await getUncachableNotionClient();
      await notion.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `[STRATEGY] ${strategyType.toUpperCase()} - ${new Date().toISOString().split('T')[0]}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: note.substring(0, 2000) } }]
          }
        }
      });
      console.log("Strategy note written to Notion");
      return true;
    } catch (error) {
      console.error("Error writing strategy note to Notion:", error);
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
}

export const memoryBridge = new MemoryBridge();
