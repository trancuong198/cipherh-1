// CipherH OpenAI Service
// Integration với OpenAI cho log analysis và strategic thinking

import OpenAI from "openai";
import { getCipherHSystemPrompt, augmentSystemPrompt } from "../core/systemPrompt";
import { isReasoningModel } from "../utils/modelHelpers";

export interface StrategyResponse {
  assessment?: string;
  weekly_actions?: string[];
  goal_adjustments?: string[];
  answers_to_questions?: Record<string, string>;
}

export interface LogAnalysisResponse {
  summary: string;
  key_insights: string[];
  recommendations: string[];
  risk_level: "low" | "medium" | "high";
}

export class OpenAIService {
  private client: OpenAI | null = null;
  private configured: boolean = false;
  private model: string = "gpt-4o";

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.configured = true;
      console.log("OpenAIService: API key loaded, service ready");
      console.log(`OpenAIService: Using model: ${this.model}`);
    } else {
      console.log("OpenAIService: No API key configured");
      console.log("OpenAIService: Set OPENAI_API_KEY environment variable to enable");
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async analyzeStrategy(prompt: string): Promise<StrategyResponse | null> {
    if (!this.configured || !this.client) {
      throw new Error('OPENAI_UNAVAILABLE: No API key configured');
    }

    try {
      const contextPrompt = `Ban la strategist AI cho he thong tu tri CipherH.
Nhiem vu: Phan tich tinh trang he thong va de xuat chien luoc.
Tra loi bang JSON format.`;
      
      const systemPrompt = augmentSystemPrompt(contextPrompt);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2000,
      });

      const content = response.choices[0].message.content;
      if (content) {
        return JSON.parse(content) as StrategyResponse;
      }
      return null;
    } catch (error) {
      console.error("OpenAI strategy analysis error:", error);
      return null;
    }
  }

  async analyzeLogs(logs: string[]): Promise<LogAnalysisResponse | null> {
    if (!this.configured || !this.client) {
      throw new Error('OPENAI_UNAVAILABLE: No API key configured');
    }

    try {
      const logsText = logs.slice(-100).join("\n");
      const prompt = `Phan tich cac logs sau va tra loi bang JSON:
{
  "summary": "Tom tat tinh trang",
  "key_insights": ["Insight 1", "Insight 2"],
  "recommendations": ["Recommendation 1"],
  "risk_level": "low|medium|high"
}

Logs:
${logsText}`;

      const contextPrompt = "Ban la AI phan tich logs cho he thong tu tri.";
      const systemPrompt = augmentSystemPrompt(contextPrompt);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 1500,
      });

      const content = response.choices[0].message.content;
      if (content) {
        return JSON.parse(content) as LogAnalysisResponse;
      }
      return null;
    } catch (error) {
      console.error("OpenAI log analysis error:", error);
      return null;
    }
  }

  async generateInsight(context: string): Promise<string> {
    if (!this.configured || !this.client) {
      // NO PLACEHOLDER - Throw error to expose configuration failure
      throw new Error('OPENAI_NOT_CONFIGURED: Cannot generate insight - OPENAI_API_KEY not set');
    }

    try {
      const contextPrompt = "Ban la AI tao insight cho he thong tu tri CipherH.";
      const systemPrompt = augmentSystemPrompt(contextPrompt);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Tao insight tu context sau:\n${context}` },
        ],
        max_completion_tokens: 500,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('OPENAI_RESPONSE_EMPTY: OpenAI returned no content');
      }
      return content;
    } catch (error) {
      // Re-throw with context instead of returning friendly message
      throw new Error(`OPENAI_INSIGHT_GENERATION_FAILED: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async askQuestion(question: string, context?: string): Promise<string> {
    if (!this.configured || !this.client) {
      // NO PLACEHOLDER - Throw error to expose configuration failure
      throw new Error('OPENAI_NOT_CONFIGURED: Cannot ask question - OPENAI_API_KEY not set');
    }

    try {
      // Use the context provided from Telegram which already has Vietnamese personality
      const systemPrompt = context 
        ? augmentSystemPrompt(context)
        : augmentSystemPrompt(`Bạn là AI assistant thông minh, trả lời MỌI câu hỏi bằng tiếng Việt có dấu.`);

      // Estimate token count (rough: 1 token ≈ 4 chars for English, ~2 chars for Vietnamese)
      const estimatedSystemTokens = Math.ceil(systemPrompt.length / 2.5);
      const estimatedQuestionTokens = Math.ceil(question.length / 2.5);
      const estimatedTotalInputTokens = estimatedSystemTokens + estimatedQuestionTokens;

      console.log(`[OpenAI] Token estimate - System: ~${estimatedSystemTokens}, Question: ~${estimatedQuestionTokens}, Total input: ~${estimatedTotalInputTokens}`);

      const messages: { role: "system" | "user"; content: string }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ];

      console.log(`[OpenAI] Sending question to ${this.model}: "${question.substring(0, 100)}..."`);

      // Reasoning models (o1, o3) only support default temperature of 1
      const completionOptions: OpenAI.Chat.CompletionCreateParamsNonStreaming = {
        model: this.model,
        messages,
        max_completion_tokens: 2000, // Increased for longer responses
      };
      
      // Only set temperature for non-reasoning models
      if (!isReasoningModel(this.model)) {
        completionOptions.temperature = 0.7;
      }

      const response = await this.client.chat.completions.create(completionOptions);

      console.log(`[OpenAI] Response received, choices: ${response.choices?.length || 0}`);
      
      // Log token usage if available
      if (response.usage) {
        console.log(`[OpenAI] Token usage - Prompt: ${response.usage.prompt_tokens}, Completion: ${response.usage.completion_tokens}, Total: ${response.usage.total_tokens}`);
      }
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('OPENAI_ERROR: Model returned no choices in response');
      }

      const content = response.choices[0].message.content;
      
      if (!content || content.trim().length === 0) {
        throw new Error('OPENAI_ERROR: Model returned empty response');
      }

      console.log(`[OpenAI] Successfully generated response (${content.length} chars)`);
      return content;
    } catch (error: any) {
      console.error("[OpenAI] Question error:", error);
      console.error("[OpenAI] Error details:", {
        message: error.message,
        type: error.type,
        code: error.code,
        status: error.status,
      });
      
      // Throw explicit errors instead of returning Vietnamese messages
      if (error.code === 'invalid_api_key') {
        throw new Error('OPENAI_ERROR: Invalid API key');
      } else if (error.code === 'insufficient_quota') {
        throw new Error('OPENAI_ERROR: Insufficient quota');
      } else if (error.code === 'model_not_found') {
        throw new Error(`OPENAI_ERROR: Model "${this.model}" not found`);
      } else if (error.status === 429) {
        throw new Error('OPENAI_ERROR: Rate limit exceeded');
      } else {
        throw new Error(`OPENAI_ERROR: ${error.message || 'Unknown error'}`);
      }
    }
  }

  // Refresh connection (useful after env vars are updated)
  refreshConnection(): void {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.configured = true;
      console.log("OpenAIService: Connection refreshed");
    } else {
      this.client = null;
      this.configured = false;
      console.log("OpenAIService: Still in placeholder mode");
    }
  }

  getStatus(): {
    configured: boolean;
    model: string;
    placeholder_mode: boolean;
  } {
    return {
      configured: this.configured,
      model: this.model,
      placeholder_mode: !this.configured,
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.configured || !this.client) {
      return false;
    }

    try {
      console.log(`[OpenAI] Testing connection with model: ${this.model}`);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "Test connection" }],
        max_completion_tokens: 5,
      });
      
      if (response.choices && response.choices.length > 0) {
        console.log(`[OpenAI] Connection test successful with model: ${this.model}`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error(`[OpenAI] Connection test failed with ${this.model}:`, error.message);
      return false;
    }
  }
}

export const openAIService = new OpenAIService();

// Initialize OpenAI service - for auto-discovery
export async function init(): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('[OpenAI] No API key found - AI features disabled');
    return false;
  }
  
  const testResult = await openAIService.testConnection();
  if (testResult) {
    console.log('[OpenAI] Service initialized successfully');
    return true;
  } else {
    console.log('[OpenAI] Connection test failed');
    return false;
  }
}
