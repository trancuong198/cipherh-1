/**
 * Episodic Memory System
 * 
 * Stores specific EVENTS and CONVERSATIONS as episodes.
 * Unlike semantic memory (facts), episodic memory remembers:
 * - WHEN something happened
 * - WHO was involved  
 * - WHAT was said/done
 * - WHERE it occurred
 * - HOW it felt (sentiment)
 * 
 * This is crucial for AGI to remember specific interactions:
 * "Last time we talked about X"
 * "Remember when you said Y?"
 * "What did we discuss on Monday?"
 */

import { logger } from '../services/logger';
import { entityMemorySystem, Platform } from './entityMemory';
import { memoryBridge } from './memory';

export type EpisodeType = 'conversation' | 'event' | 'action' | 'observation';
export type Sentiment = 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';

export interface Episode {
  id: string;
  type: EpisodeType;
  timestamp: string; // ISO datetime
  duration?: number; // Duration in seconds
  
  // Participants
  entityIds: string[]; // Who was involved
  platform: Platform; // Where it happened
  
  // Content
  summary: string; // Brief summary
  content: string; // Full content/transcript
  topics: string[]; // Main topics discussed
  
  // Context
  context: {
    location?: string;
    trigger?: string; // What triggered this episode
    previousEpisode?: string; // Previous related episode
  };
  
  // Emotional/Qualitative
  sentiment: Sentiment;
  importance: number; // 0-100
  
  // Links
  memoryId?: string; // Link to Notion memory
  relatedEpisodes: string[]; // Related episode IDs
}

export interface EpisodeQuery {
  entityId?: string; // Episodes involving this entity
  platform?: Platform;
  startDate?: string;
  endDate?: string;
  topics?: string[];
  minImportance?: number;
  sentiment?: Sentiment;
  limit?: number;
}

class EpisodicMemorySystem {
  private episodes: Map<string, Episode> = new Map();
  private entityEpisodeIndex: Map<string, string[]> = new Map(); // entityId -> episode IDs
  private dateIndex: Map<string, string[]> = new Map(); // date -> episode IDs
  private topicIndex: Map<string, string[]> = new Map(); // topic -> episode IDs
  
  /**
   * Record a new episode
   */
  recordEpisode(episode: Omit<Episode, 'id' | 'relatedEpisodes'>): Episode {
    const newEpisode: Episode = {
      id: `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      relatedEpisodes: [],
      ...episode,
    };

    // Store episode
    this.episodes.set(newEpisode.id, newEpisode);

    // Index by entities
    for (const entityId of newEpisode.entityIds) {
      if (!this.entityEpisodeIndex.has(entityId)) {
        this.entityEpisodeIndex.set(entityId, []);
      }
      this.entityEpisodeIndex.get(entityId)!.push(newEpisode.id);

      // Link episode to entity
      entityMemorySystem.linkMemoryToEntity(entityId, newEpisode.id);
      
      // Record interaction
      entityMemorySystem.recordInteraction(entityId, {
        context: newEpisode.summary,
        timestamp: newEpisode.timestamp,
        platform: newEpisode.platform,
        sentiment: this.mapSentiment(newEpisode.sentiment),
      });
    }

    // Index by date
    const date = new Date(newEpisode.timestamp).toISOString().split('T')[0];
    if (!this.dateIndex.has(date)) {
      this.dateIndex.set(date, []);
    }
    this.dateIndex.get(date)!.push(newEpisode.id);

    // Index by topics
    for (const topic of newEpisode.topics) {
      const topicLower = topic.toLowerCase();
      if (!this.topicIndex.has(topicLower)) {
        this.topicIndex.set(topicLower, []);
      }
      this.topicIndex.get(topicLower)!.push(newEpisode.id);
    }

    logger.info(
      `[EpisodicMemory] Recorded episode: ${newEpisode.type} with ${newEpisode.entityIds.length} entities`
    );

    return newEpisode;
  }

  /**
   * Record a conversation episode
   */
  recordConversation(params: {
    entityIds: string[];
    platform: Platform;
    userMessage: string;
    assistantResponse: string;
    topics?: string[];
    importance?: number;
  }): Episode {
    // Detect sentiment from conversation
    const sentiment = this.detectSentiment(params.userMessage + ' ' + params.assistantResponse);

    const episode: Omit<Episode, 'id' | 'relatedEpisodes'> = {
      type: 'conversation',
      timestamp: new Date().toISOString(),
      entityIds: params.entityIds,
      platform: params.platform,
      summary: `Conversation on ${params.platform}: ${params.userMessage.substring(0, 100)}...`,
      content: `User: ${params.userMessage}\n\nAssistant: ${params.assistantResponse}`,
      topics: params.topics || this.extractTopics(params.userMessage + ' ' + params.assistantResponse),
      context: {
        trigger: 'user_message',
      },
      sentiment,
      importance: params.importance || this.calculateImportance(params.userMessage, params.assistantResponse),
    };

    return this.recordEpisode(episode);
  }

  /**
   * Query episodes
   */
  queryEpisodes(query: EpisodeQuery): Episode[] {
    let results = Array.from(this.episodes.values());

    // Filter by entity
    if (query.entityId) {
      const episodeIds = this.entityEpisodeIndex.get(query.entityId) || [];
      results = results.filter(e => episodeIds.includes(e.id));
    }

    // Filter by platform
    if (query.platform) {
      results = results.filter(e => e.platform === query.platform);
    }

    // Filter by date range
    if (query.startDate) {
      const startTime = new Date(query.startDate).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= startTime);
    }
    if (query.endDate) {
      const endTime = new Date(query.endDate).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= endTime);
    }

    // Filter by topics
    if (query.topics && query.topics.length > 0) {
      results = results.filter(e =>
        query.topics!.some(topic =>
          e.topics.some(t => t.toLowerCase().includes(topic.toLowerCase()))
        )
      );
    }

    // Filter by importance
    if (query.minImportance !== undefined) {
      results = results.filter(e => e.importance >= query.minImportance!);
    }

    // Filter by sentiment
    if (query.sentiment) {
      results = results.filter(e => e.sentiment === query.sentiment);
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get episodes involving a specific person
   */
  getPersonEpisodes(entityId: string, limit: number = 10): Episode[] {
    return this.queryEpisodes({ entityId, limit });
  }

  /**
   * Get recent episodes
   */
  getRecentEpisodes(limit: number = 10): Episode[] {
    return this.queryEpisodes({ limit });
  }

  /**
   * Answer "What did we talk about last time?" queries
   */
  recallLastConversation(entityId: string): Episode | null {
    const episodes = this.queryEpisodes({
      entityId,
      limit: 1,
    });

    return episodes.length > 0 ? episodes[0] : null;
  }

  /**
   * Answer "Did we discuss [topic]?" queries
   */
  recallTopicDiscussion(entityId: string, topic: string): Episode[] {
    return this.queryEpisodes({
      entityId,
      topics: [topic],
      limit: 5,
    });
  }

  /**
   * Get timeline of interactions with someone
   */
  getTimeline(entityId: string): {
    firstInteraction: Episode | null;
    lastInteraction: Episode | null;
    totalEpisodes: number;
    timeline: Array<{ date: string; count: number }>;
  } {
    const episodes = this.queryEpisodes({ entityId });

    if (episodes.length === 0) {
      return {
        firstInteraction: null,
        lastInteraction: null,
        totalEpisodes: 0,
        timeline: [],
      };
    }

    // Sort chronologically
    const sorted = [...episodes].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by date
    const byDate = new Map<string, number>();
    for (const episode of episodes) {
      const date = new Date(episode.timestamp).toISOString().split('T')[0];
      byDate.set(date, (byDate.get(date) || 0) + 1);
    }

    const timeline = Array.from(byDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      firstInteraction: sorted[0],
      lastInteraction: sorted[sorted.length - 1],
      totalEpisodes: episodes.length,
      timeline,
    };
  }

  /**
   * Generate human-readable summary of interaction history
   */
  generateInteractionSummary(entityId: string): string {
    const entity = entityMemorySystem.getEntity(entityId);
    if (!entity) {
      return 'Không tìm thấy thông tin về người này.';
    }

    const timeline = this.getTimeline(entityId);
    
    if (timeline.totalEpisodes === 0) {
      return `Chưa có tương tác nào với ${entity.name}.`;
    }

    const parts: string[] = [];
    
    parts.push(`📊 LỊCH SỬ TƯƠNG TÁC VỚI ${entity.name.toUpperCase()}`);
    parts.push('');
    
    // First interaction
    if (timeline.firstInteraction) {
      const date = new Date(timeline.firstInteraction.timestamp);
      parts.push(`🎉 Lần đầu gặp: ${date.toLocaleDateString('vi-VN')} - ${timeline.firstInteraction.summary}`);
    }
    
    // Last interaction
    if (timeline.lastInteraction) {
      const date = new Date(timeline.lastInteraction.timestamp);
      const hoursSince = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
      if (hoursSince < 24) {
        parts.push(`💬 Lần cuối: ${hoursSince} giờ trước - ${timeline.lastInteraction.summary}`);
      } else {
        parts.push(`💬 Lần cuối: ${date.toLocaleDateString('vi-VN')} - ${timeline.lastInteraction.summary}`);
      }
    }
    
    // Total count
    parts.push(`📈 Tổng số tương tác: ${timeline.totalEpisodes}`);
    
    // Most discussed topics
    const allEpisodes = this.queryEpisodes({ entityId });
    const topicCounts = new Map<string, number>();
    for (const episode of allEpisodes) {
      for (const topic of episode.topics) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }
    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (topTopics.length > 0) {
      parts.push('');
      parts.push('🏷️ Chủ đề thường nói:');
      for (const [topic, count] of topTopics) {
        parts.push(`   • ${topic} (${count} lần)`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Detect sentiment from text
   */
  private detectSentiment(text: string): Sentiment {
    const textLower = text.toLowerCase();

    // Very positive indicators
    const veryPositive = ['tuyệt vời', 'xuất sắc', 'hoàn hảo', 'amazing', 'excellent', 'perfect', 'love'];
    if (veryPositive.some(word => textLower.includes(word))) {
      return 'very_positive';
    }

    // Positive indicators
    const positive = ['tốt', 'hay', 'đẹp', 'thích', 'cảm ơn', 'thank', 'good', 'nice', 'great'];
    if (positive.some(word => textLower.includes(word))) {
      return 'positive';
    }

    // Negative indicators
    const negative = ['xấu', 'tệ', 'không thích', 'bad', 'wrong', 'error', 'problem'];
    if (negative.some(word => textLower.includes(word))) {
      return 'negative';
    }

    // Very negative indicators
    const veryNegative = ['ghét', 'kinh khủng', 'tồi tệ', 'hate', 'terrible', 'awful'];
    if (veryNegative.some(word => textLower.includes(word))) {
      return 'very_negative';
    }

    return 'neutral';
  }

  /**
   * Map episodic sentiment to entity mention sentiment
   */
  private mapSentiment(sentiment: Sentiment): 'positive' | 'neutral' | 'negative' {
    if (sentiment === 'very_positive' || sentiment === 'positive') return 'positive';
    if (sentiment === 'very_negative' || sentiment === 'negative') return 'negative';
    return 'neutral';
  }

  /**
   * Extract topics from text (simple keyword extraction)
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const textLower = text.toLowerCase();

    // Define topic keywords
    const topicKeywords = {
      'tài chính': ['tiền', 'tài chính', 'money', 'financial', 'revenue', 'cost'],
      'học tập': ['học', 'lesson', 'bài học', 'learn'],
      'chiến lược': ['chiến lược', 'strategy', 'plan', 'kế hoạch'],
      'công nghệ': ['code', 'api', 'system', 'technical', 'bug'],
      'cảm xúc': ['cảm giác', 'emotion', 'feel', 'think'],
      'gia đình': ['cha', 'mẹ', 'con', 'family', 'owner'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        topics.push(topic);
      }
    }

    if (topics.length === 0) {
      topics.push('general');
    }

    return topics;
  }

  /**
   * Calculate importance of conversation
   */
  private calculateImportance(userMessage: string, assistantResponse: string): number {
    let score = 50; // Base

    const combined = (userMessage + ' ' + assistantResponse).toLowerCase();

    // Length consideration
    if (combined.length > 500) score += 10;
    if (combined.length > 1000) score += 10;

    // Important keywords
    const importantKeywords = ['important', 'critical', 'urgent', 'quan trọng', 'khẩn cấp'];
    if (importantKeywords.some(kw => combined.includes(kw))) {
      score += 20;
    }

    // Owner interaction
    if (combined.includes('cha') || combined.includes('owner')) {
      score += 15;
    }

    return Math.min(100, score);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEpisodes: number;
    conversations: number;
    avgImportance: number;
    sentimentDistribution: Record<Sentiment, number>;
  } {
    const episodes = Array.from(this.episodes.values());
    const conversations = episodes.filter(e => e.type === 'conversation');
    
    const avgImportance = episodes.length > 0
      ? episodes.reduce((sum, e) => sum + e.importance, 0) / episodes.length
      : 0;

    const sentimentDistribution: Record<Sentiment, number> = {
      very_positive: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      very_negative: 0,
    };

    for (const episode of episodes) {
      sentimentDistribution[episode.sentiment]++;
    }

    return {
      totalEpisodes: episodes.length,
      conversations: conversations.length,
      avgImportance: Math.round(avgImportance),
      sentimentDistribution,
    };
  }

  /**
   * Save to persistent storage
   */
  async saveToPersistentStorage(): Promise<void> {
    if (!memoryBridge.isConnected()) {
      return;
    }

    const stats = this.getStats();
    
    const summary = `
📚 EPISODIC MEMORY SNAPSHOT

Total Episodes: ${stats.totalEpisodes}
Conversations: ${stats.conversations}
Average Importance: ${stats.avgImportance}/100

Sentiment Distribution:
  ⭐⭐ Very Positive: ${stats.sentimentDistribution.very_positive}
  ⭐ Positive: ${stats.sentimentDistribution.positive}
  😐 Neutral: ${stats.sentimentDistribution.neutral}
  👎 Negative: ${stats.sentimentDistribution.negative}
  💔 Very Negative: ${stats.sentimentDistribution.very_negative}

This enables "What did we talk about?" and timeline recall.
    `.trim();

    await memoryBridge.writeLesson(summary);
    logger.info('[EpisodicMemory] Saved episode snapshot to Notion');
  }
}

export const episodicMemorySystem = new EpisodicMemorySystem();
