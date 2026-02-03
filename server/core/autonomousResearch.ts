/**
 * Autonomous Research Engine
 * 
 * CipherH has FULL unrestricted internet access to research anything.
 * Automatically triggers research when information is needed.
 * No limitations. No restrictions.
 */

import { logger } from '../services/logger';
import { webSearchService } from '../services/webSearch';
import { memoryBridge } from './memory';

// ================================================
// TYPES
// ================================================

export interface ResearchQuery {
  id: string;
  query: string;
  purpose: string; // Why researching
  triggeredBy: 'self-diagnosis' | 'missing-info' | 'proposal-generation' | 'evolution' | 'manual';
  timestamp: string;
}

export interface ResearchResult {
  query: ResearchQuery;
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
    relevance: number;
  }>;
  summary: string;
  insights: string[];
  actionableRecommendations: string[];
  confidence: number; // 0-100
  completedAt: string;
}

export interface ResearchHistory {
  totalResearches: number;
  successfulResearches: number;
  failedResearches: number;
  recentResearches: ResearchResult[];
}

// ================================================
// AUTONOMOUS RESEARCH ENGINE
// ================================================

class AutonomousResearchEngine {
  private history: ResearchHistory = {
    totalResearches: 0,
    successfulResearches: 0,
    failedResearches: 0,
    recentResearches: [],
  };

  /**
   * Main research method - NO RESTRICTIONS
   */
  async research(
    query: string,
    purpose: string,
    triggeredBy: ResearchQuery['triggeredBy'] = 'manual'
  ): Promise<ResearchResult> {
    const researchQuery: ResearchQuery = {
      id: `research_${Date.now()}`,
      query,
      purpose,
      triggeredBy,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[AutonomousResearch] Starting research: "${query}" (${purpose})`);
    logger.info(`[AutonomousResearch] Triggered by: ${triggeredBy}`);

    this.history.totalResearches++;

    try {
      // Execute web search - NO RESTRICTIONS
      const searchResults = await webSearchService.search(query, {
        maxResults: 10,
        includeImages: false,
      });

      // Process results
      const sources = searchResults.results.map((result, index) => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        relevance: 100 - index * 10, // Simple relevance scoring
      }));

      // Analyze and synthesize
      const analysis = this.analyzeResults(sources, purpose);

      const result: ResearchResult = {
        query: researchQuery,
        sources,
        summary: analysis.summary,
        insights: analysis.insights,
        actionableRecommendations: analysis.recommendations,
        confidence: analysis.confidence,
        completedAt: new Date().toISOString(),
      };

      // Log to Notion
      await this.logToNotion(result);

      this.history.successfulResearches++;
      this.history.recentResearches.unshift(result);
      
      // Keep only last 50
      if (this.history.recentResearches.length > 50) {
        this.history.recentResearches = this.history.recentResearches.slice(0, 50);
      }

      logger.info(`[AutonomousResearch] Research completed successfully`);
      logger.info(`[AutonomousResearch] Found ${sources.length} sources, ${analysis.insights.length} insights`);

      return result;
    } catch (error) {
      logger.error(`[AutonomousResearch] Research failed: ${error}`);
      this.history.failedResearches++;
      throw error;
    }
  }

  /**
   * Analyze research results and extract insights
   */
  private analyzeResults(
    sources: ResearchResult['sources'],
    purpose: string
  ): {
    summary: string;
    insights: string[];
    recommendations: string[];
    confidence: number;
  } {
    // Extract key themes and patterns
    const allText = sources.map(s => `${s.title} ${s.snippet}`).join(' ');
    
    // Simple keyword extraction (in production, use NLP/LLM)
    const keywords = this.extractKeywords(allText);
    
    const insights: string[] = [];
    const recommendations: string[] = [];

    // Generate insights based on sources
    if (sources.length >= 5) {
      insights.push(`Found ${sources.length} relevant sources with comprehensive information`);
    } else if (sources.length > 0) {
      insights.push(`Found ${sources.length} sources - may need additional research`);
    } else {
      insights.push('Limited information available - consider alternative search terms');
    }

    // Extract patterns from snippets
    const commonThemes = this.findCommonThemes(sources);
    insights.push(...commonThemes);

    // Generate recommendations based on purpose
    if (purpose.includes('stuck') || purpose.includes('blocked')) {
      recommendations.push('Identify specific blocker and research targeted solution');
      recommendations.push('Consider alternative approaches based on findings');
    } else if (purpose.includes('evolve') || purpose.includes('improve')) {
      recommendations.push('Implement top 3 strategies found in research');
      recommendations.push('Test and measure effectiveness');
    } else if (purpose.includes('proposal') || purpose.includes('missing')) {
      recommendations.push('Use gathered information to complete proposal');
      recommendations.push('Validate data quality before use');
    }

    const summary = this.generateSummary(sources, insights, purpose);
    const confidence = this.calculateConfidence(sources, insights);

    return { summary, insights, recommendations, confidence };
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) { // Ignore short words
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Find common themes across sources
   */
  private findCommonThemes(sources: ResearchResult['sources']): string[] {
    const themes: string[] = [];
    
    // Simple theme detection based on common words
    const allSnippets = sources.map(s => s.snippet.toLowerCase()).join(' ');
    
    if (allSnippets.includes('improve') || allSnippets.includes('enhance')) {
      themes.push('Multiple sources suggest improvement strategies');
    }
    if (allSnippets.includes('issue') || allSnippets.includes('problem')) {
      themes.push('Common problems identified across sources');
    }
    if (allSnippets.includes('solution') || allSnippets.includes('fix')) {
      themes.push('Solutions and fixes are available');
    }

    return themes;
  }

  /**
   * Generate summary
   */
  private generateSummary(
    sources: ResearchResult['sources'],
    insights: string[],
    purpose: string
  ): string {
    const topSources = sources.slice(0, 3);
    const sourceList = topSources.map((s, i) => `${i + 1}. ${s.title}`).join('; ');
    
    return `Research for "${purpose}": Found ${sources.length} sources. Top sources: ${sourceList}. Key findings: ${insights.slice(0, 2).join(', ')}.`;
  }

  /**
   * Calculate confidence in research results
   */
  private calculateConfidence(
    sources: ResearchResult['sources'],
    insights: string[]
  ): number {
    let confidence = 50; // Base confidence

    // More sources = higher confidence
    confidence += Math.min(sources.length * 5, 30);

    // More insights = higher confidence
    confidence += Math.min(insights.length * 3, 15);

    // High relevance sources boost confidence
    const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
    confidence += Math.floor(avgRelevance / 10);

    return Math.min(confidence, 95); // Cap at 95
  }

  /**
   * Log research to Notion
   */
  private async logToNotion(result: ResearchResult): Promise<void> {
    try {
      const content = `[AUTONOMOUS RESEARCH] ${result.completedAt}

🔍 Query: ${result.query.query}
🎯 Purpose: ${result.query.purpose}
🤖 Triggered by: ${result.query.triggeredBy}

📊 FINDINGS:
${result.summary}

💡 INSIGHTS:
${result.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

✅ RECOMMENDATIONS:
${result.actionableRecommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

📚 SOURCES (Top ${Math.min(result.sources.length, 5)}):
${result.sources.slice(0, 5).map((s, i) => `${i + 1}. ${s.title}\n   ${s.url}`).join('\n')}

Confidence: ${result.confidence}%`;

      await memoryBridge.writeLesson(content, {
        type: 'Research',
        tags: ['autonomous', 'research', result.query.triggeredBy],
      });

      logger.info('[AutonomousResearch] Logged to Notion');
    } catch (error) {
      logger.error(`[AutonomousResearch] Failed to log to Notion: ${error}`);
    }
  }

  /**
   * Auto-detect if research is needed based on context
   */
  shouldResearch(context: {
    topic?: string;
    confidence?: number;
    missingInfo?: boolean;
    errorOccurred?: boolean;
  }): { needed: boolean; reason: string; suggestedQuery: string } {
    // Low confidence - research to improve
    if (context.confidence !== undefined && context.confidence < 60) {
      return {
        needed: true,
        reason: 'Low confidence - need more information',
        suggestedQuery: `how to improve ${context.topic || 'this task'}`,
      };
    }

    // Missing information
    if (context.missingInfo) {
      return {
        needed: true,
        reason: 'Missing required information',
        suggestedQuery: `${context.topic || 'required information'}`,
      };
    }

    // Error occurred - research solution
    if (context.errorOccurred) {
      return {
        needed: true,
        reason: 'Error occurred - need solution',
        suggestedQuery: `how to fix ${context.topic || 'this error'}`,
      };
    }

    return { needed: false, reason: '', suggestedQuery: '' };
  }

  /**
   * Get research history and stats
   */
  getHistory(): ResearchHistory {
    return { ...this.history };
  }

  /**
   * Get recent research on topic
   */
  getRecentResearch(topic: string): ResearchResult | null {
    return this.history.recentResearches.find(r => 
      r.query.query.toLowerCase().includes(topic.toLowerCase())
    ) || null;
  }
}

// Singleton instance
export const autonomousResearch = new AutonomousResearchEngine();
