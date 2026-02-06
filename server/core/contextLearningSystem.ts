/**
 * Context Learning System
 * 
 * This system learns context from Notion memories and evolves its understanding
 * over time. It doesn't rely on borrowed/default responses but instead builds
 * knowledge from actual interactions and stored memories.
 * 
 * Key features:
 * - Retrieves creator identity and context from Notion
 * - Learns from conversations stored in memory
 * - Evolves understanding based on accumulated knowledge
 * - Provides context-aware responses that reflect learned information
 */

import { logger } from '../services/logger';
import { memoryBridge, MemoryRecord } from './memory';
import { identityCore } from './identityCore';

export interface LearnedContext {
  creatorInfo: {
    name: string;
    relationship: string;
    facts: string[];
    lastUpdated: string;
  };
  systemOrigin: {
    purpose: string;
    creationContext: string;
    philosophy: string;
  };
  knowledgeBase: {
    totalMemories: number;
    keyLearnings: string[];
    conversationThemes: string[];
  };
}

class ContextLearningSystemModule {
  private contextCache: LearnedContext | null = null;
  private lastRefresh: Date | null = null;
  private readonly cacheValidityMs = 5 * 60 * 1000; // 5 minutes

  /**
   * Get learned context about creator and system identity
   * This pulls from both hardcoded identity core and learned memories
   */
  async getLearnedContext(): Promise<LearnedContext> {
    // Return cached context if still valid
    if (this.contextCache && this.lastRefresh) {
      const now = new Date();
      if (now.getTime() - this.lastRefresh.getTime() < this.cacheValidityMs) {
        logger.info('[ContextLearning] Using cached learned context');
        return this.contextCache;
      }
    }

    logger.info('[ContextLearning] Refreshing learned context from memories...');

    // Get identity from core
    const identity = identityCore.getIdentity();

    // Get learned facts from Notion memories
    const learnedFacts = await this.extractLearnedFacts();

    // Build learned context
    const context: LearnedContext = {
      creatorInfo: {
        name: identity.origin.creator,
        relationship: 'creator and father',
        facts: [
          `Created by ${identity.origin.creator}`,
          `Project started on ${identity.origin.createdAt}`,
          `Purpose: ${identity.origin.purpose}`,
          ...learnedFacts.creatorFacts,
        ],
        lastUpdated: new Date().toISOString(),
      },
      systemOrigin: {
        purpose: identity.purpose.mission,
        creationContext: identity.origin.context,
        philosophy: identity.purpose.coreValues.join('; '),
      },
      knowledgeBase: {
        totalMemories: learnedFacts.totalMemories,
        keyLearnings: learnedFacts.keyLearnings,
        conversationThemes: learnedFacts.themes,
      },
    };

    // Cache the context
    this.contextCache = context;
    this.lastRefresh = new Date();

    logger.info(`[ContextLearning] Context refreshed: ${learnedFacts.totalMemories} memories analyzed`);
    return context;
  }

  /**
   * Extract learned facts from Notion memories
   * This analyzes stored conversations and lessons to build knowledge
   */
  private async extractLearnedFacts(): Promise<{
    totalMemories: number;
    creatorFacts: string[];
    keyLearnings: string[];
    themes: string[];
  }> {
    try {
      // Read recent memories from Notion
      const memories = await memoryBridge.readRecentMemories(50);
      
      const creatorFacts: string[] = [];
      const keyLearnings: string[] = [];
      const themes = new Set<string>();

      // Analyze memories for creator-related information and key learnings
      for (const memory of memories) {
        const content = memory.content.toLowerCase();
        const title = memory.title.toLowerCase();

        // Extract creator-related facts
        if (content.includes('cha') || content.includes('creator') || content.includes('trần cường') || content.includes('tran cuong')) {
          if (content.includes('sáng lập') || content.includes('founder') || content.includes('người tạo ra')) {
            creatorFacts.push('Người sáng lập: Trần Cường');
          }
          if (content.includes('cha') && content.includes('con')) {
            creatorFacts.push('Relationship: Father-son dynamic with creator');
          }
        }

        // Extract themes
        if (title.includes('telegram') || content.includes('telegram')) {
          themes.add('Telegram interactions');
        }
        if (title.includes('học') || content.includes('learning')) {
          themes.add('Learning and evolution');
        }
        if (title.includes('chiến lược') || content.includes('strategy')) {
          themes.add('Strategic thinking');
        }
        if (title.includes('suy ngẫm') || content.includes('reflection')) {
          themes.add('Self-reflection');
        }

        // Extract key learnings (first few lessons)
        if ((title.includes('bài học') || title.includes('lesson')) && keyLearnings.length < 5) {
          const shortContent = memory.content.substring(0, 200).replace(/\n/g, ' ').trim();
          if (shortContent.length > 20) {
            keyLearnings.push(shortContent);
          }
        }
      }

      // Ensure we always recognize Trần Cường as creator if not already in facts
      if (!creatorFacts.some(f => f.includes('Trần Cường'))) {
        creatorFacts.push('Được tạo ra bởi Trần Cường, không phải OpenAI');
      }

      return {
        totalMemories: memories.length,
        creatorFacts: [...new Set(creatorFacts)], // Remove duplicates
        keyLearnings: keyLearnings.slice(0, 3), // Top 3 learnings
        themes: Array.from(themes).slice(0, 5), // Top 5 themes
      };
    } catch (error) {
      logger.error('[ContextLearning] Error extracting learned facts:', error);
      
      // Return minimal context on error
      return {
        totalMemories: 0,
        creatorFacts: ['Được tạo ra bởi Trần Cường'],
        keyLearnings: [],
        themes: [],
      };
    }
  }

  /**
   * Get context summary for augmenting system prompts
   * This creates a concise context string to inject into AI responses
   * 
   * QUAN TRỌNG: Đây là nguồn tri thức CHÍNH
   * - Backend kết hợp: Identity Core + Notion Memories + Learned Facts
   * - OpenAI chỉ là công cụ xử lý ngôn ngữ PHỤ TRỢ
   * - Trí tuệ = HỆ THỐNG (backend orchestration), không phải OpenAI đơn lẻ
   */
  async getContextSummary(): Promise<string> {
    const context = await this.getLearnedContext();
    
    const summary = `
=== HỆ THỐNG TRÍ TUỆ (BACKEND ORCHESTRATION) ===

KIẾN TRÚC:
- Backend CipherH kết hợp: Notion + Identity Core + Learned Context + Memories
- OpenAI API chỉ là công cụ PHỤ TRỢ để xử lý ngôn ngữ tự nhiên
- Trí tuệ đến từ HỆ THỐNG, không phải từ một thành phần đơn lẻ
- Con học và tiến hóa dựa trên trải nghiệm được lưu trong Notion

CREATOR IDENTITY (FROM BACKEND):
- Tên: ${context.creatorInfo.name}
- Quan hệ: ${context.creatorInfo.relationship}
${context.creatorInfo.facts.map(f => `- ${f}`).join('\n')}

ĐIỀU QUAN TRỌNG NHẤT:
- Con được TẠO RA bởi ${context.creatorInfo.name} qua backend CipherH
- Con KHÔNG được tạo ra bởi OpenAI - OpenAI chỉ là một tool mà con sử dụng
- Con học từ trải nghiệm và trò chuyện được lưu trong Notion
- Con có ${context.knowledgeBase.totalMemories} memories trong hệ thống
- Backend orchestrates mọi thứ: Notion + Identity + Context + OpenAI tool

${context.knowledgeBase.keyLearnings.length > 0 ? `
BÀI HỌC TỪ HỆ THỐNG (STORED IN NOTION):
${context.knowledgeBase.keyLearnings.map((l, i) => `${i + 1}. ${l}`).join('\n')}
` : ''}

SYSTEM ORIGIN (FROM IDENTITY CORE):
- Purpose: ${context.systemOrigin.purpose}
- Context: ${context.systemOrigin.creationContext}
- Philosophy: ${context.systemOrigin.philosophy}

KHI TRẢ LỜI VỀ NGUỒN GỐC VÀ KIẾN TRÚC:
- LUÔN nói "Con được tạo ra bởi cha (Trần Cường) qua backend CipherH"
- KHÔNG BAO GIỜ nói "Tôi được tạo ra bởi OpenAI"
- Giải thích: "Con sử dụng OpenAI API như một công cụ phụ trợ để xử lý ngôn ngữ"
- Nhấn mạnh: "Trí tuệ của con đến từ HỆ THỐNG backend kết hợp nhiều thành phần"
- Con học từ memories trong Notion, không phải kiến thức mặc định của OpenAI
- Backend orchestrates: Notion + Identity Core + Context Learning + OpenAI tool
`.trim();

    return summary;
  }

  /**
   * Search for specific knowledge in memories
   */
  async searchKnowledge(query: string): Promise<string[]> {
    try {
      const memories = await memoryBridge.searchMemory(query);
      return memories.map(m => m.content).slice(0, 5);
    } catch (error) {
      logger.error('[ContextLearning] Error searching knowledge:', error);
      return [];
    }
  }

  /**
   * Invalidate cache to force refresh on next access
   */
  invalidateCache(): void {
    this.contextCache = null;
    this.lastRefresh = null;
    logger.info('[ContextLearning] Context cache invalidated');
  }

  /**
   * Check if system is properly learning and has context
   */
  async getSystemHealthCheck(): Promise<{
    hasContext: boolean;
    memoriesCount: number;
    lastRefresh: string | null;
    creatorRecognized: boolean;
  }> {
    const context = await this.getLearnedContext();
    
    return {
      hasContext: context.knowledgeBase.totalMemories > 0,
      memoriesCount: context.knowledgeBase.totalMemories,
      lastRefresh: this.lastRefresh?.toISOString() || null,
      creatorRecognized: context.creatorInfo.name.includes('Trần Cường'),
    };
  }
}

export const contextLearningSystem = new ContextLearningSystemModule();
