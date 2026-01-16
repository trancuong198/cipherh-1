export type ProviderType = 'llm' | 'memory' | 'infra';
export type ProviderStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';

export interface ProviderHealth {
  status: ProviderStatus;
  latencyMs: number;
  lastCheck: string;
  errorCount: number;
  successRate: number;
}

export interface ProviderLimits {
  requestsPerMinute: number;
  tokensPerRequest: number;
  dailyQuota: number;
  currentUsage: number;
}

export interface ProviderCost {
  costPerRequest: number;
  costPerToken: number;
  dailyCost: number;
  monthlyCost: number;
}

export interface LLMGenerateRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMGenerateResponse {
  content: string;
  tokensUsed: number;
  finishReason: string;
  provider: string;
  latencyMs: number;
}

export interface LLMEmbedRequest {
  text: string;
  model?: string;
}

export interface LLMEmbedResponse {
  embedding: number[];
  dimensions: number;
  provider: string;
}

export interface LLMScoreRequest {
  content: string;
  criteria: string[];
}

export interface LLMScoreResponse {
  scores: Record<string, number>;
  overallScore: number;
  provider: string;
}

export interface ILLMProvider {
  id: string;
  name: string;
  type: 'llm';
  
  isConfigured(): boolean;
  getHealth(): Promise<ProviderHealth>;
  getLimits(): ProviderLimits;
  getCost(): ProviderCost;
  
  generate(request: LLMGenerateRequest): Promise<LLMGenerateResponse>;
  embed?(request: LLMEmbedRequest): Promise<LLMEmbedResponse>;
  score?(request: LLMScoreRequest): Promise<LLMScoreResponse>;
}

export interface MemoryReadRequest {
  type: 'lesson' | 'summary' | 'identity' | 'all';
  limit?: number;
  since?: string;
}

export interface MemoryWriteRequest {
  type: 'lesson' | 'summary' | 'reflection';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryDistilledRequest {
  rawMemories: string[];
  maxOutput?: number;
}

export interface MemoryResponse {
  success: boolean;
  data?: unknown;
  provider: string;
  latencyMs: number;
}

export interface IMemoryProvider {
  id: string;
  name: string;
  type: 'memory';
  
  isConfigured(): boolean;
  getHealth(): Promise<ProviderHealth>;
  getLimits(): ProviderLimits;
  getCost(): ProviderCost;
  
  read(request: MemoryReadRequest): Promise<MemoryResponse>;
  write(request: MemoryWriteRequest): Promise<MemoryResponse>;
  distill?(request: MemoryDistilledRequest): Promise<MemoryResponse>;
}

export interface InfraMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
}

export interface IInfraProvider {
  id: string;
  name: string;
  type: 'infra';
  
  isConfigured(): boolean;
  getHealth(): Promise<ProviderHealth>;
  getLimits(): ProviderLimits;
  getCost(): ProviderCost;
  getMetrics(): InfraMetrics;
}

export type AnyProvider = ILLMProvider | IMemoryProvider | IInfraProvider;

export interface MigrationDelta {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  severity: 'low' | 'medium' | 'high';
}

export interface MigrationReport {
  id: string;
  timestamp: string;
  fromProvider: string;
  toProvider: string;
  providerType: ProviderType;
  dryRun: boolean;
  
  qualityDelta: number;
  safetyDelta: number;
  latencyDelta: number;
  costDelta: number;
  
  risks: string[];
  deltas: MigrationDelta[];
  recommendation: 'proceed' | 'caution' | 'abort';
  approved: boolean;
  executedAt: string | null;
}
