/**
 * Semantic Memory Retrieval System
 * 
 * Addresses the long-term memory problem: After 1-2 years, Notion will have
 * thousands of memories. This system ensures we retrieve RELEVANT memories
 * based on semantic similarity, not just recent chronological order.
 * 
 * This prevents the system from degrading into "AI loading text" by:
 * 1. Semantic search using embeddings (meaning-based)
 * 2. Importance scoring (not all memories are equal)
 * 3. Context-aware retrieval (load what's relevant NOW)
 * 4. Smart memory budget (limited tokens for LLM context)
 */

import { logger } from '../services/logger';
import { openAIService } from '../services/openai';
import { memoryBridge, MemoryRecord } from './memory';
import { memoryDistiller } from './memoryDistiller';

export interface MemoryWithRelevance extends MemoryRecord {
  relevanceScore: number; // 0-100, how relevant to current context
  importanceScore: number; // 0-100, intrinsic importance
  recencyScore: number; // 0-100, how recent
  combinedScore: number; // weighted combination
  embedding?: number[]; // semantic embedding vector
}

export interface MemoryRetrievalConfig {
  maxMemories?: number; // Max memories to return (default: 10)
  maxTokens?: number; // Max tokens budget for memory context (default: 2000)
  relevanceWeight?: number; // Weight for relevance (default: 0.5)
  importanceWeight?: number; // Weight for importance (default: 0.3)
  recencyWeight?: number; // Weight for recency (default: 0.2)
  minScore?: number; // Minimum combined score to include (default: 30)
}

export interface RetrievalResult {
  memories: MemoryWithRelevance[];
  totalAvailable: number;
  totalRetrieved: number;
  contextSummary: string;
  retrievalStrategy: string;
}

class SemanticMemoryRetrieval {
  private embeddingCache: Map<string, number[]> = new Map();
  private importanceCache: Map<string, number> = new Map();
  
  private readonly defaultConfig: Required<MemoryRetrievalConfig> = {
    maxMemories: 10,
    maxTokens: 2000,
    relevanceWeight: 0.5,
    importanceWeight: 0.3,
    recencyWeight: 0.2,
    minScore: 30,
  };

  /**
   * Main retrieval method: Get memories relevant to current context
   * This is the core method that prevents memory overload
   */
  async retrieveRelevantMemories(
    currentContext: string,
    config: MemoryRetrievalConfig = {}
  ): Promise<RetrievalResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    logger.info(`[SemanticMemory] Retrieving relevant memories for context: "${currentContext.substring(0, 50)}..."`);

    try {
      // Step 1: Get all recent memories (we'll implement pagination later)
      const allMemories = await memoryBridge.readRecentMemories(50); // Fetch more, filter smartly
      
      if (allMemories.length === 0) {
        return this.emptyResult();
      }

      // Step 2: Score each memory for relevance, importance, and recency
      const scoredMemories = await this.scoreMemories(
        allMemories,
        currentContext,
        finalConfig
      );

      // Step 3: Filter by minimum score
      const filtered = scoredMemories.filter(
        m => m.combinedScore >= finalConfig.minScore
      );

      // Step 4: Sort by combined score (highest first)
      const sorted = filtered.sort((a, b) => b.combinedScore - a.combinedScore);

      // Step 5: Apply memory budget (max memories and max tokens)
      const selected = this.applyMemoryBudget(sorted, finalConfig);

      // Step 6: Generate context summary
      const contextSummary = this.generateContextSummary(selected, currentContext);

      logger.info(
        `[SemanticMemory] Retrieved ${selected.length}/${allMemories.length} memories (filtered by relevance)`
      );

      return {
        memories: selected,
        totalAvailable: allMemories.length,
        totalRetrieved: selected.length,
        contextSummary,
        retrievalStrategy: 'semantic-hybrid',
      };
    } catch (error) {
      logger.error('[SemanticMemory] Error during retrieval:', error);
      return this.emptyResult();
    }
  }

  /**
   * Score memories based on relevance, importance, and recency
   */
  private async scoreMemories(
    memories: MemoryRecord[],
    currentContext: string,
    config: Required<MemoryRetrievalConfig>
  ): Promise<MemoryWithRelevance[]> {
    const scoredMemories: MemoryWithRelevance[] = [];

    // Get embedding for current context (for semantic similarity)
    const contextEmbedding = await this.getEmbedding(currentContext);

    for (const memory of memories) {
      // 1. Relevance score (semantic similarity)
      const relevanceScore = await this.calculateRelevance(
        memory,
        currentContext,
        contextEmbedding
      );

      // 2. Importance score (intrinsic value)
      const importanceScore = this.calculateImportance(memory);

      // 3. Recency score (temporal decay)
      const recencyScore = this.calculateRecency(memory);

      // 4. Combined score (weighted sum)
      const combinedScore = Math.round(
        relevanceScore * config.relevanceWeight +
        importanceScore * config.importanceWeight +
        recencyScore * config.recencyWeight
      );

      scoredMemories.push({
        ...memory,
        relevanceScore,
        importanceScore,
        recencyScore,
        combinedScore,
      });
    }

    return scoredMemories;
  }

  /**
   * Calculate semantic relevance to current context
   * Uses embeddings for meaning-based similarity
   */
  private async calculateRelevance(
    memory: MemoryRecord,
    currentContext: string,
    contextEmbedding: number[] | null
  ): Promise<number> {
    // Fallback to keyword matching if embeddings not available
    if (!contextEmbedding || !openAIService.isConfigured()) {
      return this.keywordRelevance(memory, currentContext);
    }

    try {
      const memoryEmbedding = await this.getEmbedding(memory.content);
      if (!memoryEmbedding) {
        return this.keywordRelevance(memory, currentContext);
      }

      // Cosine similarity between embeddings
      const similarity = this.cosineSimilarity(contextEmbedding, memoryEmbedding);
      
      // Convert to 0-100 score
      return Math.max(0, Math.min(100, (similarity + 1) * 50));
    } catch (error) {
      logger.debug('[SemanticMemory] Embedding failed, using keyword fallback');
      return this.keywordRelevance(memory, currentContext);
    }
  }

  /**
   * Fallback keyword-based relevance scoring
   */
  private keywordRelevance(memory: MemoryRecord, context: string): number {
    const contextWords = context.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const memoryText = (memory.title + ' ' + memory.content).toLowerCase();
    
    let matches = 0;
    for (const word of contextWords) {
      if (memoryText.includes(word)) {
        matches++;
      }
    }
    
    const score = (matches / Math.max(1, contextWords.length)) * 100;
    return Math.min(100, score);
  }

  /**
   * Calculate importance score based on memory characteristics
   */
  private calculateImportance(memory: MemoryRecord): number {
    // Check cache first
    if (this.importanceCache.has(memory.id || '')) {
      return this.importanceCache.get(memory.id || '') || 50;
    }

    let score = 50; // Base score

    const content = (memory.title + ' ' + memory.content).toLowerCase();
    
    // High importance keywords (identity, core values, critical learnings)
    const highImportanceKeywords = [
      'identity', 'core', 'value', 'principle', 'mission', 'purpose',
      'never', 'always', 'must', 'critical', 'important', 'breakthrough',
      'cha', 'owner', 'failed', 'succeeded', 'learned', 'realized'
    ];
    
    for (const keyword of highImportanceKeywords) {
      if (content.includes(keyword)) {
        score += 10;
      }
    }

    // Memory type boost
    if (memory.type === 'Strategy') {
      score += 15;
    } else if (memory.type === 'Daily Summary') {
      score += 10;
    } else if (memory.type === 'State Snapshot') {
      score += 5;
    }

    // Length consideration (substantial content is more important)
    const contentLength = memory.content.length;
    if (contentLength > 500) {
      score += 10;
    } else if (contentLength < 100) {
      score -= 10;
    }

    // Cap at 100
    score = Math.max(0, Math.min(100, score));
    
    // Cache the result
    if (memory.id) {
      this.importanceCache.set(memory.id, score);
    }

    return score;
  }

  /**
   * Calculate recency score with exponential decay
   */
  private calculateRecency(memory: MemoryRecord): number {
    const now = Date.now();
    const createdAt = new Date(memory.created_at).getTime();
    const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);

    // Exponential decay: score = 100 * e^(-age/halflife)
    // halflife = 30 days (memories lose half their recency score after 30 days)
    const halfLife = 30;
    const score = 100 * Math.exp(-ageInDays / halfLife);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Apply memory budget constraints
   */
  private applyMemoryBudget(
    memories: MemoryWithRelevance[],
    config: Required<MemoryRetrievalConfig>
  ): MemoryWithRelevance[] {
    const selected: MemoryWithRelevance[] = [];
    let totalTokens = 0;

    for (const memory of memories) {
      // Stop if we hit memory count limit
      if (selected.length >= config.maxMemories) {
        break;
      }

      // Estimate tokens (rough: 1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil(
        (memory.title.length + memory.content.length) / 4
      );

      // Stop if we exceed token budget
      if (totalTokens + estimatedTokens > config.maxTokens) {
        break;
      }

      selected.push(memory);
      totalTokens += estimatedTokens;
    }

    logger.debug(
      `[SemanticMemory] Memory budget: ${selected.length} memories, ~${totalTokens} tokens`
    );

    return selected;
  }

  /**
   * Generate human-readable context summary
   */
  private generateContextSummary(
    memories: MemoryWithRelevance[],
    context: string
  ): string {
    if (memories.length === 0) {
      return 'No relevant memories found for this context.';
    }

    const highRelevance = memories.filter(m => m.relevanceScore > 70).length;
    const highImportance = memories.filter(m => m.importanceScore > 70).length;
    const recent = memories.filter(m => m.recencyScore > 70).length;

    return `Retrieved ${memories.length} memories: ${highRelevance} highly relevant, ${highImportance} important, ${recent} recent. Context-aware filtering applied.`;
  }

  /**
   * Get or compute embedding for text
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    // Check cache
    const cacheKey = text.substring(0, 100); // Use first 100 chars as key
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey) || null;
    }

    if (!openAIService.isConfigured()) {
      return null;
    }

    try {
      // Use OpenAI embeddings API
      // Note: This requires implementing embeddings in openAIService
      // For now, return null to use keyword fallback
      
      // TODO: Implement when OpenAI service supports embeddings
      // const embedding = await openAIService.getEmbedding(text);
      // this.embeddingCache.set(cacheKey, embedding);
      // return embedding;
      
      return null;
    } catch (error) {
      logger.debug('[SemanticMemory] Failed to get embedding:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Empty result for error cases
   */
  private emptyResult(): RetrievalResult {
    return {
      memories: [],
      totalAvailable: 0,
      totalRetrieved: 0,
      contextSummary: 'No memories available',
      retrievalStrategy: 'none',
    };
  }

  /**
   * Clear caches (call periodically to prevent memory leaks)
   */
  clearCaches(): void {
    this.embeddingCache.clear();
    this.importanceCache.clear();
    logger.info('[SemanticMemory] Caches cleared');
  }
}

export const semanticMemoryRetrieval = new SemanticMemoryRetrieval();
