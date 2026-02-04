import { Router, Request, Response } from "express";
import { experienceBasedLearning } from "../core/experienceBasedLearning";
import { autonomousDebugger } from "../core/autonomousDebugger";
import { continuousSelfImprovement } from "../core/continuousSelfImprovement";
import { episodicMemorySystem } from "../core/episodicMemory";
import { entityMemorySystem } from "../core/entityMemory";
import { memoryBridge } from "../core/memory";
import { logger } from "../services/logger";

export const learningRouter = Router();

/**
 * GET /api/learning/stats
 * 
 * Tổng hợp statistics từ TẤT CẢ learning systems
 * PROOF that bot is learning FOR REAL!
 */
learningRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    logger.info("[LearningAPI] Fetching learning statistics...");

    // Get stats from experience-based learning
    const experienceStats = experienceBasedLearning.getStats();
    
    // Get stats from autonomous debugger
    const debuggerStats = autonomousDebugger.getStats();
    
    // Get stats from continuous improvement
    const improvementStats = continuousSelfImprovement.getStats();
    
    // Get memory counts
    const episodicCount = episodicMemorySystem.getMemoryCount();
    const entityCount = entityMemorySystem.getEntityCount();
    
    // Get memory bridge stats (Notion storage)
    const memoryStats = await memoryBridge.getStorageStats().catch(() => ({
      total_memories: 0,
      total_size_kb: 0,
      growth_rate: 0
    }));

    const stats = {
      // Experience-based learning
      experience_learning: {
        total_experiences: experienceStats.total_experiences || 0,
        patterns_learned: experienceStats.patterns_learned || 0,
        average_success_rate: experienceStats.average_success_rate || 0,
        last_learning_timestamp: experienceStats.last_experience_time || null,
        universal_patterns: experienceStats.universal_patterns || 0,
        entity_specific_patterns: experienceStats.entity_specific_patterns || 0,
        high_confidence_patterns: experienceStats.high_confidence_patterns || 0,
      },
      
      // Autonomous debugging & improvements
      autonomous_improvements: {
        bugs_detected: debuggerStats.bugs_detected || 0,
        bugs_fixed: debuggerStats.bugs_fixed || 0,
        fix_success_rate: debuggerStats.fix_success_rate || 0,
        last_fix_timestamp: debuggerStats.last_fix_time || null,
        critical_bugs_found: debuggerStats.critical_bugs || 0,
        auto_fixed_bugs: debuggerStats.auto_fixed || 0,
      },
      
      // Continuous improvement cycles
      improvement_cycles: {
        total_cycles: improvementStats.total_cycles || 0,
        improvements_made: improvementStats.improvements_made || 0,
        current_improvement_score: improvementStats.improvement_score || 0,
        last_cycle_timestamp: improvementStats.last_cycle_time || null,
        trend: improvementStats.trend || 'stable',
      },
      
      // Memory systems
      memory_systems: {
        episodic_memories: episodicCount,
        entity_profiles: entityCount,
        total_memories_in_notion: memoryStats.total_memories,
        memory_size_kb: memoryStats.total_size_kb,
        growth_rate_percent: memoryStats.growth_rate,
      },
      
      // Overall metrics
      overall: {
        is_learning: experienceStats.total_experiences > 0 || debuggerStats.bugs_detected > 0,
        learning_velocity: this.calculateLearningVelocity(experienceStats, debuggerStats),
        confidence_level: this.calculateOverallConfidence(experienceStats, debuggerStats),
        last_activity: this.getLatestActivity(experienceStats, debuggerStats, improvementStats),
      },
      
      timestamp: new Date().toISOString(),
    };

    logger.info("[LearningAPI] Stats compiled:", {
      experiences: stats.experience_learning.total_experiences,
      patterns: stats.experience_learning.patterns_learned,
      bugs_fixed: stats.autonomous_improvements.bugs_fixed,
    });

    res.json(stats);
  } catch (error) {
    logger.error("[LearningAPI] Error fetching stats:", error);
    res.status(500).json({ 
      error: "Failed to fetch learning statistics",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/learning/recent
 * 
 * Recent learning activities - PROOF of active learning
 */
learningRouter.get("/recent", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info(`[LearningAPI] Fetching ${limit} recent learnings...`);

    // Get recent experiences
    const recentExperiences = experienceBasedLearning.getRecentExperiences(limit);
    
    // Get recent bug fixes
    const recentFixes = autonomousDebugger.getRecentFixes(limit);
    
    // Get recent improvements
    const recentImprovements = continuousSelfImprovement.getRecentImprovements(limit);
    
    // Combine and sort by timestamp
    const allActivities = [
      ...recentExperiences.map(exp => ({
        type: 'experience' as const,
        id: exp.id,
        timestamp: exp.timestamp,
        description: `Learned from interaction: "${exp.patternLearned || 'New pattern'}"`,
        effectiveness: exp.effectivenessScore,
        confidence: exp.confidence,
        details: {
          situation: exp.situation,
          pattern: exp.patternLearned,
          entity: exp.entityId,
        }
      })),
      ...recentFixes.map(fix => ({
        type: 'bug_fix' as const,
        id: fix.id,
        timestamp: fix.timestamp,
        description: `Fixed bug: ${fix.error_type} at ${fix.file_path}`,
        effectiveness: fix.success ? 100 : 0,
        confidence: fix.confidence,
        details: {
          file: fix.file_path,
          error: fix.error_type,
          fix_applied: fix.fix_applied,
        }
      })),
      ...recentImprovements.map(imp => ({
        type: 'improvement' as const,
        id: imp.id,
        timestamp: imp.timestamp,
        description: `Code improvement: ${imp.description}`,
        effectiveness: imp.improvement_score,
        confidence: imp.confidence,
        details: {
          changes_made: imp.changes_made,
          impact: imp.impact,
        }
      }))
    ];
    
    // Sort by timestamp descending
    allActivities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Take top N
    const recentActivities = allActivities.slice(0, limit);
    
    logger.info(`[LearningAPI] Found ${recentActivities.length} recent activities`);

    res.json({
      activities: recentActivities,
      count: recentActivities.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[LearningAPI] Error fetching recent activities:", error);
    res.status(500).json({ 
      error: "Failed to fetch recent learning activities",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/learning/patterns
 * 
 * Learned patterns - what bot has learned
 */
learningRouter.get("/patterns", async (req: Request, res: Response) => {
  try {
    const minConfidence = parseInt(req.query.min_confidence as string) || 60;
    const limit = parseInt(req.query.limit as string) || 20;
    
    logger.info(`[LearningAPI] Fetching patterns (confidence >= ${minConfidence})...`);

    // Get learned patterns
    const patterns = experienceBasedLearning.getLearnedPatterns(minConfidence);
    
    // Sort by success rate
    patterns.sort((a, b) => b.successRate - a.successRate);
    
    // Take top N
    const topPatterns = patterns.slice(0, limit);
    
    // Format for response
    const formattedPatterns = topPatterns.map(p => ({
      id: p.id,
      pattern: p.pattern,
      success_rate: p.successRate,
      times_used: p.timesUsed,
      times_successful: p.timesSuccessful,
      confidence: p.confidence,
      is_universal: p.universalPattern,
      learned_from_entities: p.learnedFromEntities.length,
      context: p.context,
      guideline: p.behaviorGuideline,
      last_used: p.lastUsed,
      examples: p.examples.slice(0, 3), // Top 3 examples
    }));
    
    logger.info(`[LearningAPI] Found ${formattedPatterns.length} patterns`);

    res.json({
      patterns: formattedPatterns,
      count: formattedPatterns.length,
      min_confidence: minConfidence,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[LearningAPI] Error fetching patterns:", error);
    res.status(500).json({ 
      error: "Failed to fetch learned patterns",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Helper: Calculate learning velocity (learnings per day)
 */
function calculateLearningVelocity(experienceStats: any, debuggerStats: any): number {
  try {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Count recent activities (last 24h)
    const recentExperiences = experienceStats.recent_count_24h || 0;
    const recentFixes = debuggerStats.recent_fixes_24h || 0;
    
    return recentExperiences + recentFixes;
  } catch (error) {
    return 0;
  }
}

/**
 * Helper: Calculate overall confidence
 */
function calculateOverallConfidence(experienceStats: any, debuggerStats: any): number {
  try {
    const expConfidence = experienceStats.average_confidence || 0;
    const fixConfidence = debuggerStats.average_confidence || 0;
    
    // Weighted average
    const totalWeight = (experienceStats.total_experiences || 0) + (debuggerStats.bugs_fixed || 0);
    if (totalWeight === 0) return 0;
    
    const weighted = (
      (expConfidence * (experienceStats.total_experiences || 0)) +
      (fixConfidence * (debuggerStats.bugs_fixed || 0))
    ) / totalWeight;
    
    return Math.round(weighted);
  } catch (error) {
    return 0;
  }
}

/**
 * Helper: Get latest activity timestamp
 */
function getLatestActivity(...stats: any[]): string | null {
  try {
    const timestamps = stats
      .map(s => s.last_experience_time || s.last_fix_time || s.last_cycle_time)
      .filter(Boolean)
      .map(t => new Date(t).getTime());
    
    if (timestamps.length === 0) return null;
    
    const latest = Math.max(...timestamps);
    return new Date(latest).toISOString();
  } catch (error) {
    return null;
  }
}

logger.info("[LearningRouter] Learning analytics routes initialized");
