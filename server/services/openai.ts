// CipherH OpenAI Service
// Integration với OpenAI cho log analysis và strategic thinking
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user

import OpenAI from "openai";

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

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      this.configured = true;
      console.log("OpenAIService: API key loaded, service ready");
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
      const systemPrompt = `Ban la strategist AI cho he thong tu tri CipherH.
Nhiem vu: Phan tich tinh trang he thong va de xuat chien luoc.
Tra loi bang JSON format.`;

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

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "Ban la AI phan tich logs cho he thong tu tri." },
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: "Ban la AI tao insight cho he thong tu tri CipherH." },
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
      return `Placeholder: Cau hoi "${question}" can OPENAI_API_KEY de tra loi`;
    }

    try {
      const messages: { role: "system" | "user"; content: string }[] = [
        { role: "system", content: "Ban la AI assistant cho he thong tu tri CipherH. Tra loi ngan gon va huu ich." },
      ];

      if (context) {
        messages.push({ role: "user", content: `Context: ${context}` });
      }

      messages.push({ role: "user", content: question });

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_completion_tokens: 800,
      });

      return response.choices[0].message.content || "No answer generated";
    } catch (error) {
      console.error("OpenAI question error:", error);
      return "Error answering question";
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
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: "ping" }],
        max_completion_tokens: 5,
      });
      return !!response.choices[0];
    } catch (error: any) {
      console.error("OpenAI connection test failed:", error.message);
      return false;
    }
  }
}

export const openAIService = new OpenAIService();
