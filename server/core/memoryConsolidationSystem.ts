/**
 * Memory Consolidation System
 * 
 * Prevents memory from becoming "lộn xộn" (messy) over years by:
 * 1. Consolidating similar/redundant memories
 * 2. Compressing old memories into patterns
 * 3. Maintaining detailed recent + compressed old structure
 * 4. Pruning truly obsolete information
 * 
 * This keeps the system as true AGI, not just "AI nạp chữ" (AI loading text)
 */

import { logger } from '../services/logger';
import { memoryBridge, MemoryRecord } from './memory';
import { openAIService } from '../services/openai';

export interface ConsolidatedMemory {
  id: string;
  summary: string; // Compressed summary of multiple memories
  sourceIds: string[]; // Original memory IDs that were consolidated
  pattern: string; // Pattern or lesson extracted
  importance: number; // 0-100
  consolidatedAt: string;
  timeRange: { from: string; to: string };
}

export interface ConsolidationResult {
  originalCount: number;
  consolidatedCount: number;
  compressionRatio: number;
  patternsFound: string[];
  memoryHealth: 'excellent' | 'good' | 'needs_attention' | 'critical';
}

class MemoryConsolidationSystem {
  private consolidationHistory: ConsolidatedMemory[] = [];
  private readonly MAX_DETAILED_MEMORIES_AGE_DAYS = 30; // Keep detailed for 1 month
  private readonly CONSOLIDATION_THRESHOLD_DAYS = 7; // Consolidate weekly
  private readonly MAX_CONSOLIDATED_MEMORIES = 50; // Keep top 50 consolidated memories

  /**
   * Main consolidation method - Run this periodically (e.g., weekly)
   */
  async consolidateMemories(): Promise<ConsolidationResult> {
    logger.info('[MemoryConsolidation] Starting memory consolidation process...');

    try {
      // Step 1: Get all memories from Notion
      const allMemories = await memoryBridge.readRecentMemories(200); // Get more for consolidation
      
      if (allMemories.length === 0) {
        return this.emptyResult();
      }

      // Step 2: Separate recent (keep detailed) from old (consolidate)
      const { recent, old } = this.separateByAge(allMemories);
      
      logger.info(`[MemoryConsolidation] Found ${recent.length} recent, ${old.length} old memories`);

      // Step 3: Group old memories by similarity
      const groups = await this.groupSimilarMemories(old);
      
      logger.info(`[MemoryConsolidation] Grouped ${old.length} memories into ${groups.length} clusters`);

      // Step 4: Consolidate each group
      const consolidated: ConsolidatedMemory[] = [];
      for (const group of groups) {
        if (group.length >= 2) { // Only consolidate if 2+ similar memories
          const consolidatedMemory = await this.consolidateGroup(group);
          if (consolidatedMemory) {
            consolidated.push(consolidatedMemory);
          }
        }
      }

      // Step 5: Calculate metrics
      const result: ConsolidationResult = {
        originalCount: old.length,
        consolidatedCount: consolidated.length,
        compressionRatio: old.length > 0 ? consolidated.length / old.length : 1,
        patternsFound: consolidated.map(c => c.pattern),
        memoryHealth: this.assessMemoryHealth(allMemories.length, consolidated.length),
      };

      // Step 6: Store consolidated memories
      this.consolidationHistory.push(...consolidated);
      
      // Prune old consolidations (keep only top N by importance)
      this.pruneConsolidations();

      // Step 7: Write consolidation summary to Notion
      await this.writeConsolidationSummary(result);

      logger.info(
        `[MemoryConsolidation] Complete: ${old.length} → ${consolidated.length} memories (${Math.round(result.compressionRatio * 100)}% ratio)`
      );

      return result;
    } catch (error) {
      logger.error('[MemoryConsolidation] Error during consolidation:', error);
      return this.emptyResult();
    }
  }

  /**
   * Separate memories by age: recent (detailed) vs old (consolidate)
   */
  private separateByAge(memories: MemoryRecord[]): { recent: MemoryRecord[]; old: MemoryRecord[] } {
    const now = Date.now();
    const cutoffTime = now - (this.MAX_DETAILED_MEMORIES_AGE_DAYS * 24 * 60 * 60 * 1000);

    const recent: MemoryRecord[] = [];
    const old: MemoryRecord[] = [];

    for (const memory of memories) {
      const createdAt = new Date(memory.created_at).getTime();
      if (createdAt >= cutoffTime) {
        recent.push(memory);
      } else {
        old.push(memory);
      }
    }

    return { recent, old };
  }

  /**
   * Group similar memories together for consolidation
   */
  private async groupSimilarMemories(memories: MemoryRecord[]): Promise<MemoryRecord[][]> {
    // Simple grouping by theme/keywords for now
    // In the future, use embeddings for semantic clustering
    
    const groups: Map<string, MemoryRecord[]> = new Map();

    for (const memory of memories) {
      const theme = this.extractTheme(memory);
      
      if (!groups.has(theme)) {
        groups.set(theme, []);
      }
      
      groups.get(theme)!.push(memory);
    }

    return Array.from(groups.values());
  }

  /**
   * Extract theme/category from memory
   */
  private extractTheme(memory: MemoryRecord): string {
    const content = (memory.title + ' ' + memory.content).toLowerCase();

    // Define themes
    const themes = {
      'financial': ['financial', 'money', 'revenue', 'cost', 'budget', 'tài chính', 'tiền'],
      'learning': ['learned', 'lesson', 'insight', 'realized', 'học', 'bài học'],
      'strategy': ['strategy', 'plan', 'goal', 'objective', 'chiến lược', 'kế hoạch'],
      'identity': ['identity', 'value', 'principle', 'purpose', 'danh tính', 'giá trị'],
      'conversation': ['cha', 'owner', 'conversation', 'chat', 'nói chuyện'],
      'action': ['action', 'executed', 'performed', 'did', 'hành động'],
      'reflection': ['reflect', 'think', 'consider', 'suy ngẫm', 'nghĩ'],
      'state': ['state', 'cycle', 'mode', 'energy', 'trạng thái'],
    };

    for (const [theme, keywords] of Object.entries(themes)) {
      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          return theme;
        }
      }
    }

    return 'general';
  }

  /**
   * Consolidate a group of similar memories into one compressed memory
   */
  private async consolidateGroup(group: MemoryRecord[]): Promise<ConsolidatedMemory | null> {
    if (group.length === 0) {
      return null;
    }

    try {
      // Sort by date
      const sorted = group.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const timeRange = {
        from: sorted[0].created_at,
        to: sorted[sorted.length - 1].created_at,
      };

      // Extract pattern/lesson from the group
      const pattern = await this.extractPattern(group);
      
      // Generate compressed summary
      const summary = await this.generateSummary(group, pattern);

      // Calculate importance (average of individual importances)
      const importance = this.calculateGroupImportance(group);

      const consolidated: ConsolidatedMemory = {
        id: `consolidated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        summary,
        sourceIds: group.map(m => m.id || '').filter(id => id !== ''),
        pattern,
        importance,
        consolidatedAt: new Date().toISOString(),
        timeRange,
      };

      return consolidated;
    } catch (error) {
      logger.error('[MemoryConsolidation] Failed to consolidate group:', error);
      return null;
    }
  }

  /**
   * Extract pattern/lesson from a group of memories
   */
  private async extractPattern(group: MemoryRecord[]): Promise<string> {
    // Analyze the group to find common patterns
    const theme = this.extractTheme(group[0]);
    const count = group.length;
    
    const samples = group.slice(0, 3).map(m => m.content.substring(0, 100)).join('; ');
    
    // Simple pattern extraction (can be enhanced with AI in the future)
    let pattern = `${count} memories about ${theme}`;
    
    // Look for recurring keywords
    const allContent = group.map(m => m.content).join(' ').toLowerCase();
    const words = allContent.split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 5) { // Significant words only
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    const topWords = Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);
    
    if (topWords.length > 0) {
      pattern += ` (focus: ${topWords.join(', ')})`;
    }

    return pattern;
  }

  /**
   * Generate compressed summary of memory group
   */
  private async generateSummary(group: MemoryRecord[], pattern: string): Promise<string> {
    const count = group.length;
    const theme = this.extractTheme(group[0]);
    const timeRange = `${new Date(group[0].created_at).toLocaleDateString('vi-VN')} - ${new Date(group[group.length - 1].created_at).toLocaleDateString('vi-VN')}`;
    
    // Key points from the group
    const keyPoints: string[] = [];
    for (const memory of group.slice(0, 5)) { // Max 5 examples
      const snippet = memory.content.substring(0, 150);
      keyPoints.push(`• ${snippet}${memory.content.length > 150 ? '...' : ''}`);
    }
    
    let summary = `📦 CONSOLIDATED MEMORY (${theme})\n`;
    summary += `📊 ${count} memories from ${timeRange}\n`;
    summary += `🎯 Pattern: ${pattern}\n\n`;
    summary += `Key Examples:\n${keyPoints.join('\n')}`;
    
    if (group.length > 5) {
      summary += `\n\n... và ${group.length - 5} memories tương tự khác`;
    }

    return summary;
  }

  /**
   * Calculate importance of a consolidated group
   */
  private calculateGroupImportance(group: MemoryRecord[]): number {
    let totalImportance = 0;
    
    for (const memory of group) {
      const content = (memory.title + ' ' + memory.content).toLowerCase();
      
      let importance = 50; // Base
      
      // Type boost
      if (memory.type === 'Strategy') importance += 20;
      else if (memory.type === 'Daily Summary') importance += 10;
      
      // Keyword boost
      if (content.includes('important') || content.includes('critical')) importance += 15;
      if (content.includes('learned') || content.includes('lesson')) importance += 10;
      if (content.includes('cha') || content.includes('owner')) importance += 10;
      
      totalImportance += Math.min(100, importance);
    }
    
    // Average with boost for group size (more similar memories = more important pattern)
    const avgImportance = totalImportance / group.length;
    const sizeBoost = Math.min(20, group.length * 2);
    
    return Math.min(100, Math.round(avgImportance + sizeBoost));
  }

  /**
   * Prune old consolidations, keeping only top N by importance
   */
  private pruneConsolidations(): void {
    if (this.consolidationHistory.length <= this.MAX_CONSOLIDATED_MEMORIES) {
      return;
    }

    // Sort by importance (highest first)
    this.consolidationHistory.sort((a, b) => b.importance - a.importance);
    
    // Keep only top N
    const pruned = this.consolidationHistory.slice(this.MAX_CONSOLIDATED_MEMORIES);
    this.consolidationHistory = this.consolidationHistory.slice(0, this.MAX_CONSOLIDATED_MEMORIES);
    
    logger.info(`[MemoryConsolidation] Pruned ${pruned.length} low-importance consolidations`);
  }

  /**
   * Assess overall memory health
   */
  private assessMemoryHealth(
    totalMemories: number,
    consolidatedCount: number
  ): 'excellent' | 'good' | 'needs_attention' | 'critical' {
    const ratio = consolidatedCount / Math.max(1, totalMemories);
    
    if (ratio <= 0.3) return 'excellent'; // 70%+ compression
    if (ratio <= 0.5) return 'good'; // 50%+ compression
    if (ratio <= 0.7) return 'needs_attention'; // 30%+ compression
    return 'critical'; // < 30% compression, memory getting bloated
  }

  /**
   * Write consolidation summary to Notion
   */
  private async writeConsolidationSummary(result: ConsolidationResult): Promise<void> {
    if (!memoryBridge.isConnected()) {
      return;
    }

    const summary = `
🧹 MEMORY CONSOLIDATION COMPLETE

📊 Statistics:
• Original memories: ${result.originalCount}
• Consolidated to: ${result.consolidatedCount}
• Compression ratio: ${Math.round(result.compressionRatio * 100)}%
• Memory health: ${result.memoryHealth.toUpperCase()}

🎯 Patterns Found:
${result.patternsFound.slice(0, 10).map((p, i) => `${i + 1}. ${p}`).join('\n')}

This consolidation prevents memory from becoming "lộn xộn" (messy) over time.
System maintains true AGI intelligence, not just "AI nạp chữ" (loading text).
    `.trim();

    await memoryBridge.writeLesson(summary);
  }

  /**
   * Get consolidated memories (for retrieval)
   */
  getConsolidatedMemories(): ConsolidatedMemory[] {
    return [...this.consolidationHistory];
  }

  /**
   * Empty result for error cases
   */
  private emptyResult(): ConsolidationResult {
    return {
      originalCount: 0,
      consolidatedCount: 0,
      compressionRatio: 1,
      patternsFound: [],
      memoryHealth: 'good',
    };
  }
}

export const memoryConsolidationSystem = new MemoryConsolidationSystem();
