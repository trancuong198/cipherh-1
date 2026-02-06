/**
 * Memory Deduplication System
 * 
 * Addresses: "Chỉ ghi lại ngữ cảnh mới vào Notion, không ghi lại những ngữ cảnh trùng lặp"
 * (Only write new context to Notion, don't write duplicate context)
 * 
 * Prevents:
 * - Writing the same conversation multiple times
 * - Redundant similar memories
 * - Noise accumulation in long-term storage
 * 
 * Strategy:
 * 1. Before writing to Notion, check for similar existing memories
 * 2. Calculate similarity score (semantic + keyword)
 * 3. If too similar → Skip or merge with existing
 * 4. If sufficiently different → Write as new memory
 */

import { logger } from '../services/logger';
import { memoryBridge, MemoryRecord } from './memory';

export interface SimilarityResult {
  isSimilar: boolean;
  score: number; // 0-100
  existingMemory?: MemoryRecord;
  reason: string;
}

export interface DeduplicationConfig {
  similarityThreshold: number; // 0-100, default 80
  checkRecentCount: number; // How many recent memories to check, default 50
  enableSemanticCheck: boolean; // Use semantic similarity (future: embeddings)
  enableKeywordCheck: boolean; // Use keyword-based similarity
  enableHashCheck: boolean; // Use hash-based exact match
}

class MemoryDeduplicationSystem {
  private recentMemories: MemoryRecord[] = [];
  private memoryHashes: Set<string> = new Set(); // For fast exact match detection
  private lastCycleId: string | null = null; // Track last cycle for deduplication
  private deduplicationStats = {
    totalChecks: 0,
    duplicatesFound: 0,
    newMemoriesWritten: 0,
    lastCheck: new Date().toISOString(),
  };

  private readonly defaultConfig: DeduplicationConfig = {
    similarityThreshold: 80, // 80% similar = considered duplicate
    checkRecentCount: 50,
    enableSemanticCheck: false, // TODO: Enable when embeddings ready
    enableKeywordCheck: true,
    enableHashCheck: true,
  };

  /**
   * Check if content should be written (not duplicate)
   * 
   * NEW RULES:
   * 1. NEVER dedupe if cycle_id differs
   * 2. Only dedupe EVENT type within same cycle
   * 3. NEVER dedupe: STATE, DIAGNOSTIC, REFLECTION
   */
  async shouldWrite(
    content: string,
    type: 'lesson' | 'summary' | 'strategy' | 'reflection' | 'event' | 'state' | 'diagnostic',
    cycleId?: string,
    config: Partial<DeduplicationConfig> = {}
  ): Promise<{
    shouldWrite: boolean;
    reason: string;
    similarity?: SimilarityResult;
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    this.deduplicationStats.totalChecks++;

    logger.debug(`[Deduplication] Checking content (${content.length} chars, type: ${type}, cycle: ${cycleId || 'none'})`);

    // RULE 1: STATE, DIAGNOSTIC, REFLECTION are NEVER deduplicated
    if (type === 'state' || type === 'diagnostic' || type === 'reflection') {
      logger.info(`[Deduplication] ✅ WRITING ${type.toUpperCase()} - Reason: These memory types are NEVER deduplicated (continuous existence proof)`);
      this.deduplicationStats.newMemoriesWritten++;
      return {
        shouldWrite: true,
        reason: `ALWAYS WRITE: ${type.toUpperCase()} memories are never deduplicated - each is a unique state snapshot`,
      };
    }

    // RULE 2: If cycle_id provided, check if it's different from last writes
    // Different cycle_id = ALWAYS WRITE (even if content identical)
    if (cycleId && this.lastCycleId && cycleId !== this.lastCycleId) {
      logger.info(`[Deduplication] ✅ WRITING - Reason: Different cycle_id (${cycleId} vs ${this.lastCycleId}) = proof of continuous existence`);
      this.deduplicationStats.newMemoriesWritten++;
      this.lastCycleId = cycleId;
      return {
        shouldWrite: true,
        reason: `ALWAYS WRITE: Different cycle (${cycleId} vs ${this.lastCycleId}) - continuous existence tracking requires all cycles recorded`,
      };
    }

    // Update last cycle ID if provided
    if (cycleId) {
      this.lastCycleId = cycleId;
    }

    // RULE 3: For EVENT type within same cycle, apply deduplication
    // This is the only case where we dedupe

    // Step 1: Load recent memories if cache is empty
    if (this.recentMemories.length === 0) {
      await this.refreshMemoryCache(finalConfig.checkRecentCount);
    }

    // Step 2: Hash-based exact match check (fastest)
    if (finalConfig.enableHashCheck) {
      const hash = this.hashContent(content);
      if (this.memoryHashes.has(hash)) {
        this.deduplicationStats.duplicatesFound++;
        logger.info(`[Deduplication] ❌ SKIPPING - Reason: Exact duplicate (hash match) within same cycle - no new information`);
        return {
          shouldWrite: false,
          reason: `SKIP: Exact duplicate detected (hash match) - identical content already written in cycle ${cycleId || 'current'}`,
        };
      }
    }

    // Step 3: Keyword-based similarity check (only for event type)
    if (type === 'event' && finalConfig.enableKeywordCheck) {
      const similarity = this.findMostSimilar(content, finalConfig);
      
      if (similarity.isSimilar) {
        this.deduplicationStats.duplicatesFound++;
        logger.info(
          `[Deduplication] ❌ SKIPPING - Reason: ${Math.round(similarity.score)}% similar to existing event within same cycle - no significant new information`
        );
        return {
          shouldWrite: false,
          reason: `SKIP: Too similar (${Math.round(similarity.score)}%) to existing event within same cycle - not semantically new`,
          similarity,
        };
      }
    }

    // Step 4: Content is sufficiently different - should write
    this.deduplicationStats.newMemoriesWritten++;
    logger.info(`[Deduplication] ✅ WRITING - Reason: Content is sufficiently different (${type} type, similarity < ${finalConfig.similarityThreshold}%) - contains new information`);
    
    return {
      shouldWrite: true,
      reason: `WRITE: Content is sufficiently different from existing memories - new semantic information detected`,
    };
  }

  /**
   * Write content to Notion with deduplication check
   */
  async writeWithDeduplication(
    content: string,
    type: 'lesson' | 'summary' | 'strategy' | 'reflection',
    config: Partial<DeduplicationConfig> = {}
  ): Promise<{ written: boolean; reason: string }> {
    const check = await this.shouldWrite(content, type, config);

    if (!check.shouldWrite) {
      return {
        written: false,
        reason: check.reason,
      };
    }

    // Write to Notion
    let written = false;
    try {
      switch (type) {
        case 'lesson':
          written = await memoryBridge.writeLesson(content);
          break;
        case 'summary':
          written = await memoryBridge.writeDailySummary(content);
          break;
        case 'strategy':
          written = await memoryBridge.writeStrategyNote(content);
          break;
        case 'reflection':
          written = await memoryBridge.storeReflection(content);
          break;
      }

      if (written) {
        // Add to cache for future deduplication checks
        const newMemory: MemoryRecord = {
          type: 'Lesson',
          title: `${type} - ${new Date().toLocaleDateString('vi-VN')}`,
          content,
          created_at: new Date().toISOString(),
        };
        
        this.addToCache(newMemory);
        
        logger.info(`[Deduplication] Successfully wrote new ${type} to Notion`);
      }

      return {
        written,
        reason: written ? 'Successfully written' : 'Write failed',
      };
    } catch (error) {
      logger.error(`[Deduplication] Error writing to Notion: ${error}`);
      return {
        written: false,
        reason: `Error: ${error}`,
      };
    }
  }

  /**
   * Find most similar memory in cache
   */
  private findMostSimilar(
    content: string,
    config: DeduplicationConfig
  ): SimilarityResult {
    let maxScore = 0;
    let mostSimilar: MemoryRecord | undefined;

    for (const memory of this.recentMemories) {
      const score = this.calculateSimilarity(content, memory.content);
      
      if (score > maxScore) {
        maxScore = score;
        mostSimilar = memory;
      }
    }

    const isSimilar = maxScore >= config.similarityThreshold;

    return {
      isSimilar,
      score: maxScore,
      existingMemory: isSimilar ? mostSimilar : undefined,
      reason: isSimilar
        ? `${Math.round(maxScore)}% similar to existing memory`
        : `Only ${Math.round(maxScore)}% similar - sufficiently different`,
    };
  }

  /**
   * Calculate similarity between two texts (0-100)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Normalize texts
    const norm1 = this.normalizeText(text1);
    const norm2 = this.normalizeText(text2);

    // Quick length check (if vastly different lengths, likely different content)
    const lengthRatio = Math.min(norm1.length, norm2.length) / Math.max(norm1.length, norm2.length);
    if (lengthRatio < 0.5) {
      return Math.round(lengthRatio * 100); // Max 50% if length differs too much
    }

    // Extract keywords (words > 3 chars)
    const keywords1 = this.extractKeywords(norm1);
    const keywords2 = this.extractKeywords(norm2);

    if (keywords1.size === 0 || keywords2.size === 0) {
      return 0;
    }

    // Jaccard similarity (intersection / union)
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);
    
    const jaccardScore = (intersection.size / union.size) * 100;

    // Exact phrase matching bonus
    const phrases1 = this.extractPhrases(norm1);
    const phrases2 = this.extractPhrases(norm2);
    const phraseMatches = phrases1.filter(p => phrases2.includes(p)).length;
    const phraseBonus = Math.min(20, phraseMatches * 5); // Up to 20% bonus

    // Combined score
    const finalScore = Math.min(100, jaccardScore + phraseBonus);

    return Math.round(finalScore);
  }

  /**
   * Normalize text for comparison
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): Set<string> {
    const words = text.split(/\s+/);
    const keywords = new Set<string>();

    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'là', 'và', 'của', 'có', 'được', 'cho', 'về', 'từ', 'này', 'đó', 'các',
    ]);

    for (const word of words) {
      if (word.length > 3 && !stopWords.has(word)) {
        keywords.add(word);
      }
    }

    return keywords;
  }

  /**
   * Extract 2-3 word phrases from text
   */
  private extractPhrases(text: string): string[] {
    const words = text.split(/\s+/);
    const phrases: string[] = [];

    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3) {
        phrases.push(`${words[i]} ${words[i + 1]}`);
      }
    }

    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i].length > 3 && words[i + 1].length > 3 && words[i + 2].length > 3) {
        phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }

    return phrases;
  }

  /**
   * Hash content for exact match detection
   */
  private hashContent(content: string): string {
    // Simple hash function (could use crypto for better hash)
    const normalized = this.normalizeText(content);
    let hash = 0;
    
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Refresh memory cache from Notion
   */
  private async refreshMemoryCache(limit: number): Promise<void> {
    if (!memoryBridge.isConnected()) {
      logger.debug('[Deduplication] Notion not connected, cache remains empty');
      return;
    }

    try {
      const memories = await memoryBridge.readRecentMemories(limit);
      this.recentMemories = memories;
      
      // Build hash set for fast lookup
      this.memoryHashes.clear();
      for (const memory of memories) {
        const hash = this.hashContent(memory.content);
        this.memoryHashes.add(hash);
      }

      logger.info(`[Deduplication] Loaded ${memories.length} recent memories into cache`);
    } catch (error) {
      logger.error(`[Deduplication] Failed to refresh cache: ${error}`);
    }
  }

  /**
   * Add memory to cache after writing
   */
  private addToCache(memory: MemoryRecord): void {
    this.recentMemories.unshift(memory); // Add to front
    
    // Keep cache size limited
    if (this.recentMemories.length > this.defaultConfig.checkRecentCount) {
      const removed = this.recentMemories.pop();
      if (removed) {
        const hash = this.hashContent(removed.content);
        this.memoryHashes.delete(hash);
      }
    }

    // Add hash
    const hash = this.hashContent(memory.content);
    this.memoryHashes.add(hash);
  }

  /**
   * Get deduplication statistics
   */
  getStats(): {
    totalChecks: number;
    duplicatesFound: number;
    newMemoriesWritten: number;
    deduplicationRate: number; // %
    cacheSize: number;
    lastCheck: string;
  } {
    const deduplicationRate =
      this.deduplicationStats.totalChecks > 0
        ? (this.deduplicationStats.duplicatesFound / this.deduplicationStats.totalChecks) * 100
        : 0;

    return {
      ...this.deduplicationStats,
      deduplicationRate: Math.round(deduplicationRate),
      cacheSize: this.recentMemories.length,
    };
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.recentMemories = [];
    this.memoryHashes.clear();
    logger.info('[Deduplication] Cache cleared');
  }
}

export const memoryDeduplicationSystem = new MemoryDeduplicationSystem();
