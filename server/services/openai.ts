// CipherH OpenAI Service
// Integration với OpenAI cho log analysis và strategic thinking
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

import OpenAI from "openai";
import { getCipherHSystemPrompt, augmentSystemPrompt } from "../core/systemPrompt";

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
  private model: string = "gpt-5";
  private fallbackModels: string[] = ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.configured = true;
      console.log("OpenAIService: API key loaded, service ready");
      console.log(`OpenAIService: Using model: ${this.model}`);
      console.log(`OpenAIService: Fallback models: ${this.fallbackModels.join(", ")}`);
    } else {
      console.log("OpenAIService: No API key found, running in placeholder mode");
      console.log("OpenAIService: Set OPENAI_API_KEY environment variable to enable AI features");
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async analyzeStrategy(prompt: string): Promise<StrategyResponse | null> {
    if (!this.configured || !this.client) {
      console.log("[Placeholder] Strategy analysis requested");
      // Return placeholder response
      return {
        assessment: "Placeholder: He thong dang hoat dong on dinh",
        weekly_actions: [
          "Placeholder: Tiep tuc giam sat he thong",
          "Placeholder: Review logs hang ngay",
        ],
        goal_adjustments: [],
        answers_to_questions: {},
      };
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
      console.log("[Placeholder] Log analysis requested");
      return {
        summary: "Placeholder: Log analysis khong kha dung - can OPENAI_API_KEY",
        key_insights: ["Placeholder mode active"],
        recommendations: ["Configure OPENAI_API_KEY de enable AI features"],
        risk_level: "low",
      };
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
      return "Placeholder: AI insight generation khong kha dung - can OPENAI_API_KEY";
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

      return response.choices[0].message.content || "No insight generated";
    } catch (error) {
      console.error("OpenAI insight generation error:", error);
      return "Error generating insight";
    }
  }

  async askQuestion(question: string, context?: string): Promise<string> {
    if (!this.configured || !this.client) {
      console.log(`[OpenAI] Not configured - returning placeholder response for: "${question}"`);
      return `Xin loi, con chua duoc cau hinh OPENAI_API_KEY nen khong the tra loi. Vui long them OPENAI_API_KEY vao bien moi truong.`;
    }

    try {
      // Use the context provided from Telegram which already has Vietnamese personality
      const systemPrompt = context 
        ? augmentSystemPrompt(context)
        : augmentSystemPrompt("Ban la AI assistant cho he thong tu tri CipherH. Tra loi ngan gon, huu ich va LUON TIM CACH giup do. Khong tu choi ma tim giai phap.");

      const messages: { role: "system" | "user"; content: string }[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ];

      console.log(`[OpenAI] Sending question to ${this.model}: "${question.substring(0, 50)}..."`);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens: 800,
        temperature: 0.7,
      });

      console.log(`[OpenAI] Response received, choices: ${response.choices?.length || 0}`);
      
      if (!response.choices || response.choices.length === 0) {
        console.error("[OpenAI] No choices in response:", JSON.stringify(response));
        return "Xin loi, con khong nhan duoc phan hoi tu OpenAI. Co the API dang gap van de.";
      }

      const content = response.choices[0].message.content;
      
      if (!content || content.trim().length === 0) {
        console.error("[OpenAI] Empty content in response");
        return "Xin loi, con nhan duoc phan hoi trong tu OpenAI. Cha thu hoi lai cau hoi voi noi dung cu the hon nhe.";
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
      
      // Try fallback models if primary model fails
      if (error.code === 'model_not_found' && this.fallbackModels.length > 0) {
        console.log(`[OpenAI] Model ${this.model} not found, trying fallback models...`);
        return await this.askQuestionWithFallback(question, context);
      }
      
      // Provide more specific error messages in Vietnamese
      if (error.code === 'invalid_api_key') {
        return "Xin loi, OPENAI_API_KEY khong hop le. Vui long kiem tra lai API key.";
      } else if (error.code === 'insufficient_quota') {
        return "Xin loi, tai khoan OpenAI da het quota. Vui long nap them credit.";
      } else if (error.code === 'model_not_found') {
        return `Xin loi, model "${this.model}" khong ton tai va khong co fallback model nao. Vui long cap nhat model name.`;
      } else if (error.status === 429) {
        return "Xin loi, OpenAI dang qua tai. Vui long thu lai sau vai giay.";
      } else {
        return `Xin loi, co loi khi ket noi OpenAI: ${error.message || 'Unknown error'}`;
      }
    }
  }

  private async askQuestionWithFallback(question: string, context?: string): Promise<string> {
    for (const fallbackModel of this.fallbackModels) {
      try {
        console.log(`[OpenAI] Trying fallback model: ${fallbackModel}`);
        
        const systemPrompt = context 
          ? augmentSystemPrompt(context)
          : augmentSystemPrompt("Ban la AI assistant cho he thong tu tri CipherH. Tra loi ngan gon va huu ich.");

        const messages: { role: "system" | "user"; content: string }[] = [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ];

        const response = await this.client!.chat.completions.create({
          model: fallbackModel,
          messages,
          max_completion_tokens: 800,
          temperature: 0.7,
        });

        if (response.choices && response.choices.length > 0 && response.choices[0].message.content) {
          console.log(`[OpenAI] Success with fallback model: ${fallbackModel}`);
          // Update primary model to the working one
          this.model = fallbackModel;
          console.log(`[OpenAI] Permanently switched to model: ${fallbackModel}`);
          return response.choices[0].message.content;
        }
      } catch (error: any) {
        console.log(`[OpenAI] Fallback model ${fallbackModel} also failed: ${error.message}`);
        continue;
      }
    }
    
    return `Xin loi, tat ca cac model deu khong hoat dong. Vui long kiem tra API key va quota cua ban.`;
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
      
      // Try fallback models
      if (error.code === 'model_not_found') {
        console.log('[OpenAI] Trying fallback models for connection test...');
        for (const fallbackModel of this.fallbackModels) {
          try {
            const response = await this.client.chat.completions.create({
              model: fallbackModel,
              messages: [{ role: "user", content: "Test connection" }],
              max_completion_tokens: 5,
            });
            
            if (response.choices && response.choices.length > 0) {
              console.log(`[OpenAI] Connection successful with fallback model: ${fallbackModel}`);
              this.model = fallbackModel;
              console.log(`[OpenAI] Switched to working model: ${fallbackModel}`);
              return true;
            }
          } catch (fbError: any) {
            console.log(`[OpenAI] Fallback model ${fallbackModel} failed: ${fbError.message}`);
            continue;
          }
        }
      }
      
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
