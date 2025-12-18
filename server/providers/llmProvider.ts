import { 
  ILLMProvider, 
  ProviderHealth, 
  ProviderLimits, 
  ProviderCost,
  LLMGenerateRequest,
  LLMGenerateResponse,
  LLMEmbedRequest,
  LLMEmbedResponse,
  LLMScoreRequest,
  LLMScoreResponse
} from './types';
import OpenAI from 'openai';
import { logger } from '../services/logger';

class OpenAIProvider implements ILLMProvider {
  id = 'openai';
  name = 'OpenAI GPT';
  type: 'llm' = 'llm';
  
  private client: OpenAI | null = null;
  private errorCount = 0;
  private successCount = 0;
  private lastLatency = 0;
  private lastCheck: string = new Date().toISOString();
  private dailyTokens = 0;
  private dailyCost = 0;
  private lastResetDate = new Date().toDateString();

  constructor() {
    this.initClient();
  }

  private initClient(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      logger.info('[LLMProvider:OpenAI] Initialized');
    } else {
      logger.info('[LLMProvider:OpenAI] No API key configured');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async getHealth(): Promise<ProviderHealth> {
    this.lastCheck = new Date().toISOString();
    
    if (!this.isConfigured()) {
      return {
        status: 'unavailable',
        latencyMs: 0,
        lastCheck: this.lastCheck,
        errorCount: this.errorCount,
        successRate: 0,
      };
    }

    const totalCalls = this.successCount + this.errorCount;
    const successRate = totalCalls > 0 ? (this.successCount / totalCalls) * 100 : 100;

    let status: ProviderHealth['status'] = 'healthy';
    if (successRate < 50) status = 'unavailable';
    else if (successRate < 90) status = 'degraded';

    return {
      status,
      latencyMs: this.lastLatency,
      lastCheck: this.lastCheck,
      errorCount: this.errorCount,
      successRate,
    };
  }

  getLimits(): ProviderLimits {
    return {
      requestsPerMinute: 60,
      tokensPerRequest: 4096,
      dailyQuota: 100000,
      currentUsage: this.dailyTokens,
    };
  }

  getCost(): ProviderCost {
    return {
      costPerRequest: 0.002,
      costPerToken: 0.00001,
      dailyCost: this.dailyCost,
      monthlyCost: this.dailyCost * 30,
    };
  }

  private resetDailyCounters(): void {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyTokens = 0;
      this.dailyCost = 0;
      this.lastResetDate = today;
    }
  }

  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    this.resetDailyCounters();
    const startTime = Date.now();

    if (!this.client) {
      return {
        content: '[Placeholder] LLM not configured - returning mock response',
        tokensUsed: 0,
        finishReason: 'placeholder',
        provider: this.id,
        latencyMs: 0,
      };
    }

    try {
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      
      if (request.systemPrompt) {
        messages.push({ role: 'system', content: request.systemPrompt });
      }
      messages.push({ role: 'user', content: request.prompt });

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7,
      });

      const latencyMs = Date.now() - startTime;
      this.lastLatency = latencyMs;
      this.successCount++;

      const tokensUsed = response.usage?.total_tokens || 0;
      this.dailyTokens += tokensUsed;
      this.dailyCost += tokensUsed * 0.00001;

      return {
        content: response.choices[0]?.message?.content || '',
        tokensUsed,
        finishReason: response.choices[0]?.finish_reason || 'unknown',
        provider: this.id,
        latencyMs,
      };
    } catch (error) {
      this.errorCount++;
      this.lastLatency = Date.now() - startTime;
      logger.error(`[LLMProvider:OpenAI] Generate error: ${error}`);
      
      throw error;
    }
  }

  async embed(request: LLMEmbedRequest): Promise<LLMEmbedResponse> {
    if (!this.client) {
      return {
        embedding: new Array(1536).fill(0),
        dimensions: 1536,
        provider: this.id,
      };
    }

    try {
      const response = await this.client.embeddings.create({
        model: request.model || 'text-embedding-3-small',
        input: request.text,
      });

      this.successCount++;
      return {
        embedding: response.data[0].embedding,
        dimensions: response.data[0].embedding.length,
        provider: this.id,
      };
    } catch (error) {
      this.errorCount++;
      logger.error(`[LLMProvider:OpenAI] Embed error: ${error}`);
      throw error;
    }
  }

  async score(request: LLMScoreRequest): Promise<LLMScoreResponse> {
    const prompt = `Score the following content on these criteria (0-100 each):
Criteria: ${request.criteria.join(', ')}

Content:
${request.content}

Respond with JSON only: {"scores": {"criterion1": score, ...}, "overall": averageScore}`;

    try {
      const response = await this.generate({ prompt, temperature: 0.3 });
      
      try {
        const parsed = JSON.parse(response.content);
        return {
          scores: parsed.scores || {},
          overallScore: parsed.overall || 50,
          provider: this.id,
        };
      } catch {
        return {
          scores: {},
          overallScore: 50,
          provider: this.id,
        };
      }
    } catch (error) {
      logger.error(`[LLMProvider:OpenAI] Score error: ${error}`);
      return {
        scores: {},
        overallScore: 50,
        provider: this.id,
      };
    }
  }
}

class PlaceholderLLMProvider implements ILLMProvider {
  id = 'placeholder';
  name = 'Placeholder LLM';
  type: 'llm' = 'llm';

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      status: 'healthy',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      successRate: 100,
    };
  }

  getLimits(): ProviderLimits {
    return {
      requestsPerMinute: 1000,
      tokensPerRequest: 10000,
      dailyQuota: 1000000,
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

  async generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse> {
    return {
      content: `[Placeholder Response] Processed prompt of ${request.prompt.length} characters`,
      tokensUsed: 0,
      finishReason: 'placeholder',
      provider: this.id,
      latencyMs: 10,
    };
  }

  async embed(_request: LLMEmbedRequest): Promise<LLMEmbedResponse> {
    return {
      embedding: new Array(1536).fill(0.1),
      dimensions: 1536,
      provider: this.id,
    };
  }

  async score(_request: LLMScoreRequest): Promise<LLMScoreResponse> {
    return {
      scores: {},
      overallScore: 50,
      provider: this.id,
    };
  }
}

export const openAIProvider = new OpenAIProvider();
export const placeholderLLMProvider = new PlaceholderLLMProvider();
