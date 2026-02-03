/**
 * Web Search Service
 * 
 * Cho phép AGI truy cập internet để lấy thông tin real-time:
 * - Tin tức trong/ngoài nước
 * - Giá vàng, chứng khoán, crypto
 * - Chiến tranh, bão lũ, thiên tai
 * - Thời sự, sự kiện mới nhất
 * 
 * Tích hợp với OpenAI hoặc search APIs khác
 */

import { logger } from './logger';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  source?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  summary?: string;
  timestamp: string;
  cached: boolean;
}

// Cache để tránh search lại quá nhiều
const searchCache = new Map<string, { data: SearchResponse; expiry: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

class WebSearchService {
  private readonly TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
  private readonly BING_API_KEY = process.env.BING_SEARCH_API_KEY || '';
  
  /**
   * Detect if question needs internet search
   */
  needsWebSearch(query: string): boolean {
    const queryLower = query.toLowerCase();
    
    // Keywords cho tin tức
    const newsKeywords = [
      'tin tức', 'news', 'thời sự', 'mới nhất', 'latest',
      'hôm nay', 'today', 'hiện tại', 'current',
      'chiến tranh', 'war', 'bão', 'flood', 'lũ lụt',
      'giá vàng', 'gold price', 'giá dầu', 'oil price',
      'chứng khoán', 'stock', 'crypto', 'bitcoin'
    ];
    
    // Keywords cho thông tin thời sự
    const eventKeywords = [
      'sự kiện', 'event', 'xảy ra', 'happen',
      'ai thắng', 'who won', 'kết quả', 'result',
      'ở đâu', 'where', 'khi nào', 'when'
    ];
    
    // Check if query contains these keywords
    const hasNewsKeyword = newsKeywords.some(kw => queryLower.includes(kw));
    const hasEventKeyword = eventKeywords.some(kw => queryLower.includes(kw));
    
    return hasNewsKeyword || hasEventKeyword;
  }

  /**
   * Search the web for information
   */
  async search(query: string, options: {
    maxResults?: number;
    freshOnly?: boolean; // Only recent results
    includeAnswer?: boolean; // Try to get AI summary
  } = {}): Promise<SearchResponse> {
    const cacheKey = `${query}_${JSON.stringify(options)}`;
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      logger.info(`[WebSearch] Cache hit for: ${query}`);
      return { ...cached.data, cached: true };
    }
    
    logger.info(`[WebSearch] Searching: ${query}`);
    
    try {
      let response: SearchResponse;
      
      // Try Tavily first (best for AI)
      if (this.TAVILY_API_KEY) {
        response = await this.searchWithTavily(query, options);
      }
      // Fallback to Bing
      else if (this.BING_API_KEY) {
        response = await this.searchWithBing(query, options);
      }
      // Fallback to DuckDuckGo (no API key needed, but limited)
      else {
        response = await this.searchWithDuckDuckGo(query, options);
      }
      
      // Cache the result
      searchCache.set(cacheKey, {
        data: response,
        expiry: Date.now() + CACHE_DURATION,
      });
      
      // Clean old cache
      this.cleanCache();
      
      return response;
    } catch (error) {
      logger.error('[WebSearch] Search failed:', error);
      throw new Error('Không thể tìm kiếm thông tin từ internet');
    }
  }

  /**
   * Search with Tavily (best for AI agents)
   */
  private async searchWithTavily(query: string, options: any): Promise<SearchResponse> {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: this.TAVILY_API_KEY,
        query: query,
        search_depth: options.freshOnly ? 'advanced' : 'basic',
        include_answer: options.includeAnswer !== false,
        max_results: options.maxResults || 5,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      query,
      results: data.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
        publishedDate: r.published_date,
        source: new URL(r.url).hostname,
      })),
      summary: data.answer,
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }

  /**
   * Search with Bing Search API
   */
  private async searchWithBing(query: string, options: any): Promise<SearchResponse> {
    const params = new URLSearchParams({
      q: query,
      count: String(options.maxResults || 5),
      mkt: 'vi-VN', // Vietnam market
      freshness: options.freshOnly ? 'Day' : 'Month',
    });
    
    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?${params}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.BING_API_KEY,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Bing API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const results: SearchResult[] = [];
    if (data.webPages?.value) {
      for (const page of data.webPages.value) {
        results.push({
          title: page.name,
          url: page.url,
          snippet: page.snippet,
          publishedDate: page.dateLastCrawled,
          source: new URL(page.url).hostname,
        });
      }
    }
    
    return {
      query,
      results,
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }

  /**
   * Search with DuckDuckGo (free, no API key)
   */
  private async searchWithDuckDuckGo(query: string, options: any): Promise<SearchResponse> {
    // DuckDuckGo Instant Answer API
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_redirect: '1',
      no_html: '1',
    });
    
    const response = await fetch(`https://api.duckduckgo.com/?${params}`);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const results: SearchResult[] = [];
    
    // Abstract (summary answer)
    if (data.Abstract) {
      results.push({
        title: data.Heading || 'Summary',
        url: data.AbstractURL || '',
        snippet: data.Abstract,
        source: 'DuckDuckGo',
      });
    }
    
    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, options.maxResults || 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0],
            url: topic.FirstURL,
            snippet: topic.Text,
            source: new URL(topic.FirstURL).hostname,
          });
        }
      }
    }
    
    return {
      query,
      results,
      summary: data.Abstract,
      timestamp: new Date().toISOString(),
      cached: false,
    };
  }

  /**
   * Format search results for AGI consumption
   */
  formatResultsForAGI(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return 'Không tìm thấy thông tin từ internet.';
    }
    
    let formatted = `🌐 THÔNG TIN TỪ INTERNET (${searchResponse.cached ? 'Cached' : 'Fresh'}):\n\n`;
    
    // Add summary if available
    if (searchResponse.summary) {
      formatted += `📋 TÓM TẮT:\n${searchResponse.summary}\n\n`;
    }
    
    // Add top results
    formatted += `📰 KẾT QUẢ TÌM KIẾM:\n`;
    for (let i = 0; i < Math.min(3, searchResponse.results.length); i++) {
      const result = searchResponse.results[i];
      formatted += `\n${i + 1}. ${result.title}\n`;
      formatted += `   ${result.snippet}\n`;
      if (result.source) {
        formatted += `   Nguồn: ${result.source}\n`;
      }
    }
    
    formatted += `\nThời gian: ${new Date(searchResponse.timestamp).toLocaleString('vi-VN')}`;
    
    return formatted;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
      if (now >= value.expiry) {
        searchCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: searchCache.size,
      keys: Array.from(searchCache.keys()),
    };
  }
}

export const webSearchService = new WebSearchService();
