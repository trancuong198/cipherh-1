import { 
  IMemoryProvider, 
  ProviderHealth, 
  ProviderLimits, 
  ProviderCost,
  MemoryReadRequest,
  MemoryWriteRequest,
  MemoryDistilledRequest,
  MemoryResponse
} from './types';
import { logger } from '../services/logger';
import { isNotionConnected, getUncachableNotionClient } from '../services/notionClient';

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

class NotionMemoryProvider implements IMemoryProvider {
  id = 'notion';
  name = 'Notion Database';
  type: 'memory' = 'memory';
  
  private errorCount = 0;
  private successCount = 0;
  private lastLatency = 0;
  private connected = false;

  constructor() {
    this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    this.connected = await isNotionConnected();
    if (this.connected) {
      logger.info('[MemoryProvider:Notion] Connected');
    }
  }

  isConfigured(): boolean {
    return this.connected;
  }

  async getHealth(): Promise<ProviderHealth> {
    await this.checkConnection();
    
    const totalCalls = this.successCount + this.errorCount;
    const successRate = totalCalls > 0 ? (this.successCount / totalCalls) * 100 : 100;

    return {
      status: this.connected ? 'healthy' : 'unavailable',
      latencyMs: this.lastLatency,
      lastCheck: new Date().toISOString(),
      errorCount: this.errorCount,
      successRate,
    };
  }

  getLimits(): ProviderLimits {
    return {
      requestsPerMinute: 100,
      tokensPerRequest: 100000,
      dailyQuota: 10000,
      currentUsage: this.successCount,
    };
  }

  getCost(): ProviderCost {
    return {
      costPerRequest: 0,
      costPerToken: 0,
      dailyCost: 0,
      monthlyCost: 0,
    };
  }

  async read(request: MemoryReadRequest): Promise<MemoryResponse> {
    const startTime = Date.now();

    if (!this.connected) {
      return {
        success: false,
        data: null,
        provider: this.id,
        latencyMs: 0,
      };
    }

    try {
      const notion = await getUncachableNotionClient();
      const response = await notion.databases.query({
        database_id: NOTION_DATABASE_ID,
        page_size: request.limit || 10,
      });

      this.successCount++;
      this.lastLatency = Date.now() - startTime;

      return {
        success: true,
        data: response.results,
        provider: this.id,
        latencyMs: this.lastLatency,
      };
    } catch (error) {
      this.errorCount++;
      this.lastLatency = Date.now() - startTime;
      logger.error(`[MemoryProvider:Notion] Read error: ${error}`);
      
      return {
        success: false,
        data: null,
        provider: this.id,
        latencyMs: this.lastLatency,
      };
    }
  }

  async write(request: MemoryWriteRequest): Promise<MemoryResponse> {
    const startTime = Date.now();

    if (!this.connected) {
      return {
        success: false,
        provider: this.id,
        latencyMs: 0,
      };
    }

    try {
      const notion = await getUncachableNotionClient();
      const typePrefix = request.type.toUpperCase();
      
      await notion.pages.create({
        parent: { database_id: NOTION_DATABASE_ID },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `[${typePrefix}] ${new Date().toISOString().split('T')[0]}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: request.content.substring(0, 2000) } }]
          }
        }
      });

      this.successCount++;
      this.lastLatency = Date.now() - startTime;

      return {
        success: true,
        provider: this.id,
        latencyMs: this.lastLatency,
      };
    } catch (error) {
      this.errorCount++;
      this.lastLatency = Date.now() - startTime;
      logger.error(`[MemoryProvider:Notion] Write error: ${error}`);
      
      return {
        success: false,
        provider: this.id,
        latencyMs: this.lastLatency,
      };
    }
  }

  async distill(_request: MemoryDistilledRequest): Promise<MemoryResponse> {
    return {
      success: true,
      data: { distilled: true },
      provider: this.id,
      latencyMs: 0,
    };
  }
}

class LocalMemoryProvider implements IMemoryProvider {
  id = 'local';
  name = 'Local Memory';
  type: 'memory' = 'memory';
  
  private storage: Map<string, unknown[]> = new Map();

  constructor() {
    this.storage.set('lessons', []);
    this.storage.set('summaries', []);
    this.storage.set('reflections', []);
    logger.info('[MemoryProvider:Local] Initialized');
  }

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      status: 'healthy',
      latencyMs: 1,
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      successRate: 100,
    };
  }

  getLimits(): ProviderLimits {
    return {
      requestsPerMinute: 10000,
      tokensPerRequest: 1000000,
      dailyQuota: 10000000,
      currentUsage: 0,
    };
  }

  getCost(): ProviderCost {
    return {
      costPerRequest: 0,
      costPerToken: 0,
      dailyCost: 0,
      monthlyCost: 0,
    };
  }

  async read(request: MemoryReadRequest): Promise<MemoryResponse> {
    const data = this.storage.get(request.type + 's') || [];
    return {
      success: true,
      data: data.slice(-(request.limit || 10)),
      provider: this.id,
      latencyMs: 1,
    };
  }

  async write(request: MemoryWriteRequest): Promise<MemoryResponse> {
    const key = request.type + 's';
    const existing = this.storage.get(key) || [];
    existing.push({
      content: request.content,
      timestamp: new Date().toISOString(),
      metadata: request.metadata,
    });
    this.storage.set(key, existing.slice(-100));
    
    return {
      success: true,
      provider: this.id,
      latencyMs: 1,
    };
  }

  async distill(request: MemoryDistilledRequest): Promise<MemoryResponse> {
    return {
      success: true,
      data: {
        distilled: request.rawMemories.slice(0, request.maxOutput || 5),
      },
      provider: this.id,
      latencyMs: 1,
    };
  }
}

export const notionMemoryProvider = new NotionMemoryProvider();
export const localMemoryProvider = new LocalMemoryProvider();
