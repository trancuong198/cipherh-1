/**
 * Social Media Learning Service
 * 
 * HỌC TỪ NGỮ CẢNH MẠNG XÃ HỘI - Passive Learning
 * 
 * AGI học bằng cách QUAN SÁT cách mọi người nói chuyện trên:
 * - Facebook (posts, comments)
 * - Twitter/X (tweets, trends)
 * - Reddit (discussions)
 * - Forums, blogs
 * 
 * KHÔNG phải tương tác trực tiếp, mà là:
 * - Đọc posts công khai
 * - Quan sát trends
 * - Học ngôn ngữ, văn hóa
 * - Hiểu suy nghĩ của cộng đồng
 * 
 * Giống như con người học bằng cách lướt mạng xã hội!
 */

import { logger } from './logger';
import { experienceBasedLearning } from '../core/experienceBasedLearning';

export interface SocialPost {
  id: string;
  platform: 'facebook' | 'twitter' | 'reddit' | 'forum';
  content: string;
  author: string; // Anonymous for learning
  timestamp: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  topic: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  language: 'vi' | 'en' | 'mixed';
}

export interface SocialTrend {
  topic: string;
  platform: string;
  popularity: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  examples: string[]; // Sample posts
  firstSeen: string;
  lastSeen: string;
  peakPopularity: number;
}

export interface LanguagePattern {
  phrase: string;
  usage_count: number;
  context: string; // When/how it's used
  examples: string[];
  popularity: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface CulturalContext {
  topic: string;
  description: string;
  sentiment: string;
  popularity: number;
  relatedPhrases: string[];
  learnedFrom: string[]; // Platforms
}

class SocialMediaLearningService {
  private trends: Map<string, SocialTrend> = new Map();
  private languagePatterns: Map<string, LanguagePattern> = new Map();
  private culturalContext: Map<string, CulturalContext> = new Map();
  
  private readonly MAX_TRENDS = 100;
  private readonly MAX_PATTERNS = 500;
  
  /**
   * Monitor social media platforms (passive learning)
   * This would typically run in background
   */
  async startMonitoring(): Promise<void> {
    logger.info('[SocialLearning] 🌐 Starting social media monitoring...');
    
    // Note: Actual implementation would need:
    // - Facebook Graph API (for public pages)
    // - Twitter API v2
    // - Reddit API (PRAW)
    // - RSS feeds from forums/blogs
    
    // For now, this is a placeholder that shows the architecture
    logger.info('[SocialLearning] Monitoring architecture ready');
    logger.info('[SocialLearning] To enable: Set API keys in environment');
    logger.info('[SocialLearning]   - FACEBOOK_APP_ID, FACEBOOK_APP_SECRET');
    logger.info('[SocialLearning]   - TWITTER_BEARER_TOKEN');
    logger.info('[SocialLearning]   - REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET');
  }

  /**
   * Analyze a social media post and extract learning
   */
  async analyzePost(post: SocialPost): Promise<void> {
    // 1. Extract topic and trending detection
    const topic = this.extractTopic(post.content);
    this.trackTrend(topic, post.platform, post.engagement);
    
    // 2. Extract language patterns (slang, phrases)
    const patterns = this.extractLanguagePatterns(post.content);
    for (const pattern of patterns) {
      this.trackLanguagePattern(pattern, post.sentiment);
    }
    
    // 3. Learn cultural context
    const cultural = this.extractCulturalContext(post.content, post.sentiment);
    if (cultural) {
      this.trackCulturalContext(cultural, post.platform);
    }
    
    // 4. Feed to experience learning
    // Treat popular posts as "successful" patterns
    if (post.engagement.likes > 50 || post.engagement.comments > 20) {
      // This post resonated with people - learn from it
      this.learnFromPopularContent(post);
    }
    
    logger.debug(`[SocialLearning] Analyzed post from ${post.platform}: ${topic}`);
  }

  /**
   * Get current trending topics
   */
  getTrendingTopics(limit: number = 10): SocialTrend[] {
    return Array.from(this.trends.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get popular language patterns (slang, phrases)
   */
  getPopularPhrases(limit: number = 20): LanguagePattern[] {
    return Array.from(this.languagePatterns.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Get cultural context for a topic
   */
  getCulturalContext(topic: string): CulturalContext | null {
    return this.culturalContext.get(topic.toLowerCase()) || null;
  }

  /**
   * Get social media awareness for AGI
   */
  getSocialAwareness(): string {
    const trending = this.getTrendingTopics(5);
    const phrases = this.getPopularPhrases(10);
    
    if (trending.length === 0 && phrases.length === 0) {
      return 'Chưa có dữ liệu từ mạng xã hội (monitoring chưa được bật)';
    }
    
    let awareness = '🌐 SOCIAL MEDIA AWARENESS:\n\n';
    
    if (trending.length > 0) {
      awareness += '📈 TRENDING TOPICS:\n';
      for (const trend of trending) {
        awareness += `- ${trend.topic} (${trend.platform}, ${trend.popularity}% popularity, ${trend.sentiment})\n`;
      }
      awareness += '\n';
    }
    
    if (phrases.length > 0) {
      awareness += '💬 POPULAR PHRASES:\n';
      for (const phrase of phrases.slice(0, 5)) {
        awareness += `- "${phrase.phrase}" (${phrase.usage_count}x, ${phrase.context})\n`;
      }
      awareness += '\n';
    }
    
    awareness += '→ Con học từ cách mọi người nói chuyện trên mạng xã hội';
    
    return awareness;
  }

  // ===== Private Helper Methods =====

  private extractTopic(content: string): string {
    const contentLower = content.toLowerCase();
    
    // Common topics in Vietnam
    const topics: Record<string, string[]> = {
      'economy': ['tiền', 'giá', 'đắt', 'rẻ', 'mắc', 'economy', 'price', 'vàng', 'gold'],
      'weather': ['thời tiết', 'mưa', 'nắng', 'bão', 'lũ', 'weather', 'storm', 'flood'],
      'politics': ['chính trị', 'chính phủ', 'politics', 'government', 'luật', 'law'],
      'sports': ['bóng đá', 'football', 'thể thao', 'sports', 'world cup'],
      'technology': ['công nghệ', 'tech', 'ai', 'robot', 'điện thoại', 'phone'],
      'entertainment': ['phim', 'nhạc', 'movie', 'music', 'ca sĩ', 'singer'],
      'food': ['ăn', 'món', 'food', 'quán', 'restaurant', 'ngon'],
      'education': ['học', 'thi', 'study', 'exam', 'trường', 'school'],
    };
    
    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some(kw => contentLower.includes(kw))) {
        return topic;
      }
    }
    
    return 'general';
  }

  private trackTrend(topic: string, platform: string, engagement: any): void {
    const key = `${topic}_${platform}`;
    let trend = this.trends.get(key);
    
    if (!trend) {
      trend = {
        topic,
        platform,
        popularity: 0,
        sentiment: 'neutral',
        keywords: [],
        examples: [],
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        peakPopularity: 0,
      };
      this.trends.set(key, trend);
    }
    
    // Update popularity based on engagement
    const engagementScore = engagement.likes + (engagement.comments * 2) + (engagement.shares * 3);
    trend.popularity = Math.min(100, trend.popularity + Math.log10(engagementScore + 1) * 5);
    trend.lastSeen = new Date().toISOString();
    trend.peakPopularity = Math.max(trend.peakPopularity, trend.popularity);
    
    // Decay old trends
    this.decayTrends();
  }

  private extractLanguagePatterns(content: string): string[] {
    const patterns: string[] = [];
    
    // Common Vietnamese slang/phrases
    const vietnamesePatterns = [
      /\b(chill|chịu|ok|oke|oki)\b/gi,
      /\b(xịn|đỉnh|pro|giỏi|hay)\b/gi,
      /\b(ông trời|trời ơi|chết mất)\b/gi,
      /\b(bro|bạn ơi|ae|anh em)\b/gi,
      /\b(flex|show|khoe)\b/gi,
    ];
    
    for (const pattern of vietnamesePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        patterns.push(...matches);
      }
    }
    
    return patterns;
  }

  private trackLanguagePattern(phrase: string, sentiment: 'positive' | 'neutral' | 'negative'): void {
    const phraseLower = phrase.toLowerCase();
    let pattern = this.languagePatterns.get(phraseLower);
    
    if (!pattern) {
      pattern = {
        phrase: phraseLower,
        usage_count: 0,
        context: 'casual conversation',
        examples: [],
        popularity: 0,
        sentiment,
      };
      this.languagePatterns.set(phraseLower, pattern);
    }
    
    pattern.usage_count++;
    pattern.popularity = Math.min(100, pattern.usage_count * 2);
    
    // Prune if too many patterns
    if (this.languagePatterns.size > this.MAX_PATTERNS) {
      this.pruneLanguagePatterns();
    }
  }

  private extractCulturalContext(content: string, sentiment: string): CulturalContext | null {
    // Detect cultural references
    const culturalKeywords = ['tết', 'lễ', 'festival', 'văn hóa', 'truyền thống'];
    const contentLower = content.toLowerCase();
    
    for (const keyword of culturalKeywords) {
      if (contentLower.includes(keyword)) {
        return {
          topic: keyword,
          description: content.substring(0, 200),
          sentiment,
          popularity: 50,
          relatedPhrases: [],
          learnedFrom: [],
        };
      }
    }
    
    return null;
  }

  private trackCulturalContext(cultural: CulturalContext, platform: string): void {
    let existing = this.culturalContext.get(cultural.topic);
    
    if (!existing) {
      existing = cultural;
      this.culturalContext.set(cultural.topic, existing);
    }
    
    if (!existing.learnedFrom.includes(platform)) {
      existing.learnedFrom.push(platform);
    }
    
    existing.popularity += 5;
  }

  private learnFromPopularContent(post: SocialPost): void {
    // Popular content = successful pattern
    // Feed this to experience learning as a validated pattern
    
    // This is indirect learning - we learn what works in social contexts
    logger.debug(`[SocialLearning] Learning from popular post: ${post.topic} (${post.engagement.likes} likes)`);
    
    // Could expand this to feed patterns to experienceBasedLearning
    // For now, just track internally
  }

  private decayTrends(): void {
    // Decay trends over time (24 hour half-life)
    const now = Date.now();
    const halfLife = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const trend of this.trends.values()) {
      const age = now - new Date(trend.lastSeen).getTime();
      const decay = Math.pow(0.5, age / halfLife);
      trend.popularity *= decay;
      
      // Remove very old trends
      if (trend.popularity < 1) {
        this.trends.delete(`${trend.topic}_${trend.platform}`);
      }
    }
  }

  private pruneLanguagePatterns(): void {
    // Keep only most popular patterns
    const patterns = Array.from(this.languagePatterns.entries())
      .sort((a, b) => b[1].popularity - a[1].popularity);
    
    this.languagePatterns.clear();
    
    patterns.slice(0, this.MAX_PATTERNS).forEach(([key, value]) => {
      this.languagePatterns.set(key, value);
    });
  }

  /**
   * Simulate learning from social media (for testing without APIs)
   */
  async simulateSocialLearning(): Promise<void> {
    logger.info('[SocialLearning] 🎭 Simulating social media learning...');
    
    // Simulate some trending topics
    const samplePosts: SocialPost[] = [
      {
        id: '1',
        platform: 'facebook',
        content: 'Giá vàng hôm nay tăng cao quá! Mọi người có nên mua không?',
        author: 'user1',
        timestamp: new Date().toISOString(),
        engagement: { likes: 150, comments: 45, shares: 20 },
        topic: 'economy',
        sentiment: 'neutral',
        language: 'vi',
      },
      {
        id: '2',
        platform: 'twitter',
        content: 'Bão đang đổ bộ, ae cẩn thận nhé! #vietnam #weather',
        author: 'user2',
        timestamp: new Date().toISOString(),
        engagement: { likes: 230, comments: 67, shares: 89 },
        topic: 'weather',
        sentiment: 'negative',
        language: 'vi',
      },
      {
        id: '3',
        platform: 'reddit',
        content: 'AI development is getting crazy! Anyone else excited?',
        author: 'user3',
        timestamp: new Date().toISOString(),
        engagement: { likes: 180, comments: 92, shares: 34 },
        topic: 'technology',
        sentiment: 'positive',
        language: 'en',
      },
    ];
    
    for (const post of samplePosts) {
      await this.analyzePost(post);
    }
    
    logger.info(`[SocialLearning] ✅ Learned from ${samplePosts.length} simulated posts`);
    logger.info(`[SocialLearning] 📊 Tracking ${this.trends.size} trends, ${this.languagePatterns.size} phrases`);
  }
}

export const socialMediaLearning = new SocialMediaLearningService();
