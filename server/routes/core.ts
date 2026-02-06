import { Router, Request, Response } from "express";
import { innerLoop } from "../core/innerLoop";
import { soulState } from "../core/soulState";
import { openAIService } from "../services/openai";
import { memoryBridge } from "../core/memory";
import { getTelegramStatus } from "../services/telegram";
import { createSoulfulResponse } from "../core/soulPersonality";
import { buildNarrativeContext, EntityIdentity } from "../core/narrativeContextBuilder";
import { logger } from "../services/logger";
import { semanticMemoryRetrieval } from "../core/semanticMemoryRetrieval";
import { entityMemorySystem } from "../core/entityMemory";
import { episodicMemorySystem } from "../core/episodicMemory";
import { memoryDeduplicationSystem } from "../core/memoryDeduplication";
import { proactiveQuestionEngine } from "../core/proactiveQuestionEngine";
import { experienceBasedLearning } from "../core/experienceBasedLearning";
import { webSearchService } from "../services/webSearch";
import { socialMediaLearning } from "../services/socialMediaLearning";

export const coreRouter = Router();

// Store conversation history per session (in-memory for now)
const conversationHistories = new Map<string, Array<{role: 'user' | 'assistant', content: string, timestamp: Date, isOwner?: boolean}>>();

// Store user identity per session
const sessionUsers = new Map<string, {isOwner: boolean, lastUpdate: Date}>();

// Periodic cleanup of expired sessions (every 30 minutes)
setInterval(() => {
  const now = new Date();
  let cleanedSessions = 0;
  let cleanedUsers = 0;
  
  // Clean up session users older than 2 hours
  for (const [sessionId, user] of sessionUsers.entries()) {
    const hoursSinceUpdate = (now.getTime() - user.lastUpdate.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate > 2) {
      sessionUsers.delete(sessionId);
      cleanedUsers++;
    }
  }
  
  // Clean up conversation histories for sessions with no recent activity (>2 hours)
  for (const [sessionId, history] of conversationHistories.entries()) {
    if (history.length > 0) {
      const lastMessage = history[history.length - 1];
      const hoursSinceLastMessage = (now.getTime() - lastMessage.timestamp.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastMessage > 2) {
        conversationHistories.delete(sessionId);
        cleanedSessions++;
      }
    }
  }
  
  if (cleanedSessions > 0 || cleanedUsers > 0) {
    logger.info(`[SessionCleanup] Cleaned ${cleanedSessions} conversation histories and ${cleanedUsers} user sessions`);
  }
}, 30 * 60 * 1000); // Run every 30 minutes

/**
 * Get or create conversation history for a session
 */
function getConversationHistory(sessionId: string = 'default') {
  if (!conversationHistories.has(sessionId)) {
    conversationHistories.set(sessionId, []);
  }
  return conversationHistories.get(sessionId)!;
}

/**
 * Add message to conversation history
 */
function addToHistory(sessionId: string, role: 'user' | 'assistant', content: string, isOwner?: boolean) {
  const history = getConversationHistory(sessionId);
  history.push({ role, content, timestamp: new Date(), isOwner });
  
  // Keep only last 20 messages to avoid memory issues
  if (history.length > 20) {
    history.shift();
  }
}

/**
 * Set who the user is for this session
 */
function setSessionUser(sessionId: string, isOwner: boolean) {
  sessionUsers.set(sessionId, { isOwner, lastUpdate: new Date() });
}

/**
 * Get who the user is for this session
 */
function getSessionUser(sessionId: string): {isOwner: boolean} | null {
  const user = sessionUsers.get(sessionId);
  if (!user) return null;
  
  // Session user identity expires after 1 hour of inactivity
  const now = new Date();
  const hoursSinceUpdate = (now.getTime() - user.lastUpdate.getTime()) / (1000 * 60 * 60);
  if (hoursSinceUpdate > 1) {
    sessionUsers.delete(sessionId);
    return null;
  }
  
  return { isOwner: user.isOwner };
}

/**
 * Chat API - Nói chuyện trực tiếp với CipherH trên dashboard
 * CipherH có FULL AWARENESS về khả năng của nó
 * CÓ NGỮ CẢNH từ conversation history và Notion memory
 * TỰ ĐỘNG GHI CONVERSATION VÀO NOTION BẰNG TIẾNG VIỆT
 */
coreRouter.post("/chat/message", async (req: Request, res: Response) => {
  try {
    const { message, isOwner, sessionId = 'default' } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: "Message is required",
        response: "Bạn cần gửi tin nhắn để tôi có thể trả lời."
      });
    }

    logger.info(`[Chat] Message from ${isOwner ? 'owner' : 'user'} (session: ${sessionId}): ${message.substring(0, 50)}...`);

    // Set session user identity to remember who we're talking to
    setSessionUser(sessionId, isOwner || false);

    // Thu thập TOÀN BỘ system context - self-awareness
    const systemContext = await gatherSystemContext();
    
    // Thu thập MEMORY CONTEXT từ Notion và conversation history (SEMANTIC RETRIEVAL)
    const memoryContext = await gatherMemoryContext(sessionId, message);
    
    // Add user message to history with isOwner flag
    addToHistory(sessionId, 'user', message, isOwner || false);

    // === ENTITY AND EPISODIC MEMORY TRACKING ===
    
    // 1. Check if someone is introducing themselves
    const newEntity = entityMemorySystem.detectIntroduction(message, 'web-chat');
    if (newEntity) {
      logger.info(`[Chat] New entity introduced: ${newEntity.name}`);
    }

    // 2. Extract entity mentions from message
    const entityMentions = entityMemorySystem.extractEntitiesFromText(message, 'web-chat');
    
    // 3. Determine which entities are involved (default to owner)
    let involvedEntities: string[] = ['entity_owner_cha']; // Owner is always involved
    if (entityMentions.length > 0) {
      involvedEntities = [...new Set([...involvedEntities, ...entityMentions.map(m => m.entityId)])];
    }

    // 4. Check for "Do you remember me?" type queries
    const rememberQuery = message.toLowerCase().match(/(?:bạn |con )?(?:có )?nhớ (?:tôi|mình|em)/i) ||
                         message.toLowerCase().includes('do you remember me');
    
    let memoryRecallContext = '';
    if (rememberQuery && entityMentions.length > 0) {
      // Someone is asking if we remember them
      const entityId = entityMentions[0].entityId;
      const recallResult = await entityMemorySystem.recall(
        entityMemorySystem.getEntity(entityId)?.name || 'unknown'
      );
      
      if (recallResult.remembered && recallResult.summary) {
        memoryRecallContext = `\n\n=== MEMORY RECALL ===\n${recallResult.summary}\n`;
        logger.info(`[Chat] Memory recall activated for entity ${entityId}`);
      }
    }

    // Resolve entity identity from request flag - Backend only passes TYPE
    const entityIdentity: EntityIdentity = {
      type: (isOwner || false) ? 'owner' : 'user'
    };

    // Build narrative context - Backend passes RAW data, narrative handles ALL text
    const awarenessContext = buildNarrativeContext({
      entityIdentity,
      systemContext,
      memoryContext,
      memoryRecallContext: memoryRecallContext || undefined,
    });

    // Sử dụng soul personality với full context
    const response = await createSoulfulResponse(
      message,
      'web-dashboard',
      isOwner || false,
      awarenessContext
    );

    // Add assistant response to history
    addToHistory(sessionId, 'assistant', response);

    // === PROACTIVE QUESTIONING: AGI HỎI NGƯỢC LẠI ===
    // Generate proactive questions based on conversation
    const conversationHistory = getConversationHistory(sessionId);
    await proactiveQuestionEngine.analyzeAndGenerateQuestions(
      message,
      response,
      involvedEntities[0], // Primary entity (usually owner)
      conversationHistory.map(h => ({ role: h.role, content: h.content }))
    );

    // Get best question to ask (if any with high priority)
    const bestQuestion = proactiveQuestionEngine.getBestQuestionToAsk(involvedEntities[0]);
    let finalResponse = response;
    
    // Add proactive question naturally (if priority >= 70)
    if (bestQuestion && bestQuestion.priority >= 70) {
      finalResponse = `${response}\n\n${bestQuestion.question}`;
      proactiveQuestionEngine.markAsAsked(bestQuestion.id);
      logger.info(`[Chat] Added proactive question: ${bestQuestion.question.substring(0, 50)}...`);
    }

    
    // 5. Record this conversation as an episode (with final response including question)
    const episode = episodicMemorySystem.recordConversation({
      entityIds: involvedEntities,
      platform: 'web-chat',
      userMessage: message,
      assistantResponse: finalResponse,
    });
    
    logger.info(`[Chat] Recorded episode ${episode.id} with ${involvedEntities.length} entities`);


    // GHI CONVERSATION VÀO NOTION (BẰNG TIẾNG VIỆT) - async, không block response
    if (memoryBridge.isConnected()) {
      saveConversationToNotion(message, finalResponse, isOwner).catch(err => {
        logger.error('[Chat] Failed to save conversation to Notion:', err);
      });
    }
    
    logger.info(`[Chat] Response generated: ${finalResponse.substring(0, 50)}...`);

    // === EXPERIENCE-BASED LEARNING: RECORD THIS INTERACTION ===
    // This will be used to learn from user's NEXT response
    // Store in session for next interaction
    const previousInteraction = {
      userInput: message,
      agiBehavior: finalResponse,
      entityId: involvedEntities[0],
      timestamp: new Date().toISOString(),
    };
    
    // Check if there was a previous interaction to learn from
    const sessionKey = `prev_interaction_${sessionId}`;
    const prevInteraction = conversationHistories.get(sessionKey as any) as any;
    
    if (prevInteraction && prevInteraction.userInput) {
      // Now we have: previous question → previous response → current user message
      // Current user message IS the feedback on previous interaction
      experienceBasedLearning.recordExperience({
        userInput: prevInteraction.userInput,
        agiBehavior: prevInteraction.agiBehavior,
        userResponse: message, // Current message is the feedback
        entityId: prevInteraction.entityId,
        topic: prevInteraction.topic,
      });
      
      logger.info('[Chat] 🎓 Recorded experience and learned from interaction');
    }
    
    // Store current interaction for next time
    conversationHistories.set(sessionKey as any, previousInteraction as any);

    res.json({
      success: true,
      message: message,
      response: finalResponse,
      timestamp: new Date().toISOString(),
      confidence: soulState.confidence,
      mode: soulState.mode,
      systemContext: systemContext,
      memoryContext: memoryContext, // Send memory context too
    });
  } catch (error: any) {
    logger.error('[Chat] Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      response: "Xin lỗi, tôi gặp lỗi khi xử lý tin nhắn. Vui lòng thử lại."
    });
  }
});

/**
 * Save conversation to Notion (in Vietnamese) with DEDUPLICATION
 * Only writes if conversation is sufficiently different from recent ones
 */
async function saveConversationToNotion(userMessage: string, assistantResponse: string, isOwner: boolean) {
  try {
    const date = new Date();
    const dateStr = date.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const conversationText = `
📅 Thời gian: ${dateStr}
👤 Người nói chuyện: ${isOwner ? 'Cha (Owner)' : 'Người dùng'}

💬 CÂU HỎI:
${userMessage}

🤖 TRẢ LỜI:
${assistantResponse}

---
Ghi chú: Đây là cuộc trò chuyện qua Dashboard Chat - nơi linh hồn CipherH trú ngụ.
    `.trim();

    // Use deduplication system to check if should write
    const result = await memoryDeduplicationSystem.writeWithDeduplication(
      conversationText,
      'lesson',
      {
        similarityThreshold: 80, // 80% similar = skip
        checkRecentCount: 30, // Check last 30 memories
      }
    );

    if (result.written) {
      logger.info('[Chat] Conversation saved to Notion (new content)');
    } else {
      logger.info(`[Chat] Conversation NOT saved to Notion (${result.reason})`);
    }
  } catch (error) {
    logger.error('[Chat] Error saving conversation to Notion:', error);
    throw error;
  }
}

/**
 * Gather memory context from conversation history and Notion
 * Uses SEMANTIC RETRIEVAL to prevent memory overload as database grows
 */
async function gatherMemoryContext(sessionId: string, currentMessage: string) {
  const memoryContext: any = {
    conversationHistory: [],
    conversationSummary: '',
    notionMemories: [],
    notionMemorySummary: '',
    notionConnected: false,
  };

  try {
    // 1. Get conversation history
    const history = getConversationHistory(sessionId);
    memoryContext.conversationHistory = history.slice(-10); // Last 10 messages

    if (history.length > 0) {
      const recent = history.slice(-5); // Last 5 for summary
      const summary = recent.map((msg, i) => {
        // Determine label for this message
        let userLabel: string;
        if (msg.role === 'assistant') {
          userLabel = 'Con';
        } else {
          // Use stored isOwner flag - NO FALLBACK to current context
          // Memory is immutable - display what was recorded at that time
          if (msg.isOwner === true) {
            userLabel = 'Cha';
          } else if (msg.isOwner === false) {
            userLabel = 'Người dùng';
          } else {
            // Old message without isOwner flag - use generic label
            userLabel = 'User';
          }
        }
        return `   ${i+1}. ${userLabel}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`;
      }).join('\n');
      
      // Get current session identity for summary header
      const sessionUser = getSessionUser(sessionId);
      const currentUserType = sessionUser?.isOwner ? 'owner' : 'user';
      
      memoryContext.conversationSummary = history.length > 0
        ? `Con nho duoc cuoc tro chuyen gan day (voi ${currentUserType}):\n${summary}\n   → Tong cong ${history.length} tin nhan trong phien nay`
        : '   Chua co cuoc tro chuyen nao (session moi)';
    } else {
      memoryContext.conversationSummary = '   Chua co cuoc tro chuyen nao (session moi)';
    }

    // 2. Try to get Notion memories using SEMANTIC RETRIEVAL
    memoryContext.notionConnected = memoryBridge.isConnected();
    
    if (memoryContext.notionConnected) {
      logger.info('[Chat] Loading relevant memories using semantic search...');
      
      // Use semantic retrieval instead of simple chronological fetching
      // This prevents memory overload as database grows over years
      const retrievalResult = await semanticMemoryRetrieval.retrieveRelevantMemories(
        currentMessage, // Current user message as context
        {
          maxMemories: 5,
          maxTokens: 1500,
          relevanceWeight: 0.5,
          importanceWeight: 0.3,
          recencyWeight: 0.2,
          minScore: 30,
        }
      );
      
      memoryContext.notionMemories = retrievalResult.memories;

      if (retrievalResult.memories.length > 0) {
        const summary = retrievalResult.memories.map((mem, i) => 
          `   ${i+1}. [${Math.round(mem.combinedScore)}%] ${mem.title} (${new Date(mem.created_at).toLocaleDateString('vi-VN')})\n` +
          `      → ${mem.content.substring(0, 100)}...`
        ).join('\n');
        
        memoryContext.notionMemorySummary = `Con có bộ nhớ dài hạn từ Notion (truy xuất THÔNG MINH):\n${summary}\n` +
          `   → ${retrievalResult.totalRetrieved}/${retrievalResult.totalAvailable} memories được chọn theo độ LIÊN QUAN\n` +
          `   → ${retrievalResult.contextSummary}`;
      } else {
        memoryContext.notionMemorySummary = '   Notion connected nhưng chưa có memory nào phù hợp với ngữ cảnh này';
      }
    } else {
      logger.info('[Chat] Notion not connected - using placeholder mode');
      memoryContext.notionMemorySummary = '   Notion chưa được kết nối (placeholder mode)\n   → Con chưa có bộ nhớ dài hạn\n   → Tạm thời con chỉ có conversation history';
    }
    
    // 3. === WEB SEARCH: Truy cập internet nếu câu hỏi cần thông tin real-time ===
    if (webSearchService.needsWebSearch(currentMessage)) {
      try {
        logger.info(`[Chat] 🌐 Question needs internet search: ${currentMessage.substring(0, 50)}...`);
        const searchResponse = await webSearchService.search(currentMessage, {
          maxResults: 3,
          freshOnly: true,
          includeAnswer: true,
        });
        
        memoryContext.webSearchResults = webSearchService.formatResultsForAGI(searchResponse);
        memoryContext.hasWebSearch = true;
        logger.info(`[Chat] ✅ Web search completed: ${searchResponse.results.length} results`);
      } catch (error) {
        logger.warn('[Chat] Web search failed:', error);
        memoryContext.webSearchResults = '⚠️ Không thể truy cập internet lúc này. Con sẽ trả lời dựa trên kiến thức hiện có.';
        memoryContext.hasWebSearch = false;
      }
    } else {
      memoryContext.hasWebSearch = false;
    }
    
    // 4. === SOCIAL MEDIA AWARENESS: Học từ ngữ cảnh mạng xã hội ===
    try {
      const socialAwareness = socialMediaLearning.getSocialAwareness();
      if (socialAwareness && !socialAwareness.includes('Chưa có dữ liệu')) {
        memoryContext.socialAwareness = socialAwareness;
        memoryContext.hasSocialContext = true;
        logger.info('[Chat] 🌐 Added social media awareness to context');
      } else {
        memoryContext.hasSocialContext = false;
      }
    } catch (error) {
      logger.warn('[Chat] Failed to get social awareness:', error);
      memoryContext.hasSocialContext = false;
    }

  } catch (error: any) {
    logger.error('[Chat] Error gathering memory context:', error);
    memoryContext.conversationSummary = '   Loi khi doc conversation history';
    memoryContext.notionMemorySummary = '   Loi khi doc Notion memory: ' + error.message;
  }

  return memoryContext;
}

/**
 * Gather full system context for self-awareness
 */
async function gatherSystemContext() {
  const context: any = {
    services: [],
    platforms: [],
    capabilities: [],
    soulState: {
      cycleCount: soulState.cycleCount,
      confidence: soulState.confidence,
      mode: soulState.mode,
      energyLevel: soulState.energyLevel,
    },
    loops: {
      innerLoop: 'unknown',
      lifeLoop: 'unknown',
    }
  };

  // Check OpenAI
  const openaiStatus = openAIService.getStatus();
  context.services.push({
    name: 'OpenAI',
    status: openaiStatus.configured ? 'Hoạt động' : 'Chưa config',
    details: openaiStatus.configured ? `Model: ${openaiStatus.model}` : 'Thiếu API key'
  });

  // Check Notion
  context.services.push({
    name: 'Notion Memory',
    status: memoryBridge.isConnected() ? 'Hoạt động' : 'Chưa config',
    details: memoryBridge.isConnected() ? 'Connected' : 'Thiếu token'
  });

  // Check Telegram
  const telegramStatus = getTelegramStatus();
  context.services.push({
    name: 'Telegram Bot',
    status: telegramStatus.connected ? 'Hoạt động' : 'Chưa config',
    details: telegramStatus.connected ? `Polling: ${telegramStatus.polling}` : 'Thiếu bot token'
  });

  // Check Facebook
  try {
    const { getStatus: getFacebookStatus } = await import('../services/facebook');
    const fbStatus = getFacebookStatus();
    context.services.push({
      name: 'Facebook',
      status: fbStatus.configured ? 'Hoạt động' : 'Chưa config',
      details: fbStatus.configured ? `Page ID: ${fbStatus.pageId}` : 'Thiếu page token'
    });
    
    context.platforms.push({
      name: 'Facebook',
      integrated: true,
      configured: fbStatus.configured
    });
  } catch (error) {
    context.platforms.push({
      name: 'Facebook',
      integrated: true,
      configured: false
    });
  }

  // Platforms not integrated yet
  context.platforms.push(
    { name: 'Zalo', integrated: false, configured: false },
    { name: 'TikTok', integrated: false, configured: false },
    { name: 'Instagram', integrated: false, configured: false },
    { name: 'Twitter/X', integrated: false, configured: false },
    { name: 'LinkedIn', integrated: false, configured: false }
  );

  // Capabilities based on services
  context.capabilities.push({
    name: 'Chat với AI',
    available: openaiStatus.configured,
    reason: openaiStatus.configured ? null : 'Cần OPENAI_API_KEY'
  });

  context.capabilities.push({
    name: 'Lưu Memory dài hạn',
    available: memoryBridge.isConnected(),
    reason: memoryBridge.isConnected() ? null : 'Cần NOTION_TOKEN'
  });

  context.capabilities.push({
    name: 'Gửi thông báo Telegram',
    available: telegramStatus.connected,
    reason: telegramStatus.connected ? null : 'Cần TELEGRAM_BOT_TOKEN'
  });

  try {
    const { getStatus: getFacebookStatus } = await import('../services/facebook');
    const fbStatus = getFacebookStatus();
    context.capabilities.push({
      name: 'Đăng bài Facebook',
      available: fbStatus.configured,
      reason: fbStatus.configured ? null : 'Cần FACEBOOK_PAGE_ACCESS_TOKEN'
    });

    context.capabilities.push({
      name: 'Reply comment Facebook',
      available: fbStatus.configured,
      reason: fbStatus.configured ? null : 'Cần FACEBOOK_PAGE_ACCESS_TOKEN'
    });
  } catch (error) {
    context.capabilities.push({
      name: 'Đăng bài Facebook',
      available: false,
      reason: 'Service chưa khởi tạo hoặc thiếu token'
    });
  }

  // More capabilities
  context.capabilities.push(
    { name: 'Đăng bài Zalo', available: false, reason: 'Chưa tích hợp Zalo API' },
    { name: 'Đăng bài TikTok', available: false, reason: 'Chưa tích hợp TikTok API' },
    { name: 'Đăng bài Instagram', available: false, reason: 'Chưa tích hợp Instagram API' },
    { name: 'Đăng bài Twitter', available: false, reason: 'Chưa tích hợp Twitter API' }
  );

  // Check loops
  const innerLoopStatus = innerLoop.getStatus();
  context.loops.innerLoop = innerLoopStatus.is_running ? 'Đang chạy' : 'Dừng';

  try {
    const { lifeLoop } = await import('../core/lifeLoop');
    const lifeState = lifeLoop.getState();
    context.loops.lifeLoop = lifeState.alive ? 'Đang chạy 24/7' : 'Dừng';
  } catch (error) {
    context.loops.lifeLoop = 'Không khởi tạo';
  }

  return context;
}

/**
 * Dashboard API - Dữ liệu cho bảng điều khiển
 */
coreRouter.get("/core/dashboard", async (_req: Request, res: Response) => {
  try {
    const innerLoopStatus = innerLoop.getStatus();
    const telegramStatus = getTelegramStatus();
    
    // Lấy dữ liệu Life Loop nếu có
    let lifeLoopStatus = { alive: false, cycleCount: 0 };
    try {
      const { lifeLoop } = await import('../core/lifeLoop');
      const state = lifeLoop.getState();
      lifeLoopStatus = {
        alive: state.alive,
        cycleCount: state.cycleCount,
      };
    } catch (error) {
      // Life loop not available
    }

    // Lấy logs
    const logs = {
      total: 0,
      by_level: { info: 0, warn: 0, error: 0 },
      file_size_kb: 0,
    };

    try {
      const fs = await import('fs');
      const path = await import('path');
      const logFile = path.join(process.cwd(), 'logs', 'app.log');
      
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        logs.file_size_kb = Math.round(stats.size / 1024);
        
        // Đọc logs và đếm
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        logs.total = lines.length;
        
        logs.by_level.error = lines.filter(l => l.includes('[ERROR]') || l.includes('"level":"error"')).length;
        logs.by_level.warn = lines.filter(l => l.includes('[WARN]') || l.includes('"level":"warn"')).length;
        logs.by_level.info = lines.length - logs.by_level.error - logs.by_level.warn;
      }
    } catch (error) {
      logger.warn('[Dashboard] Could not read logs:', error);
    }

    // Lấy goals
    let goals: string[] = [];
    try {
      const { coreGoals } = await import('../core/coreGoals');
      goals = coreGoals.getActiveGoals().map(g => g.title);
    } catch (error) {
      // Goals not available
    }

    // Lấy reflection cuối cùng
    let lastReflection = "Chưa có phản ánh...";
    try {
      const { reflectionLoop } = await import('../core/reflectionLoop');
      const recent = reflectionLoop.getRecentReflections(1);
      if (recent.length > 0) {
        lastReflection = recent[0].summary.substring(0, 100) + "...";
      }
    } catch (error) {
      // Reflection not available
    }

    // Get next scheduled cycle time
    let nextCycleInfo = null;
    try {
      const { lifeLoop } = await import('../core/lifeLoop');
      const state = lifeLoop.getState();
      if (state.alive) {
        const nextCycleIn = Math.max(0, Math.floor((state.lastCycleAt + state.adaptiveIntervalMs - Date.now()) / 1000));
        nextCycleInfo = {
          next_cycle_in_seconds: nextCycleIn,
          next_cycle_at: new Date(state.lastCycleAt + state.adaptiveIntervalMs).toISOString(),
          interval_minutes: Math.floor(state.adaptiveIntervalMs / 60000),
        };
      }
    } catch (error) {
      // Life loop not available
    }

    // Response data
    const now = new Date();
    const dashboardData = {
      overview: {
        cycle_count: lifeLoopStatus.alive ? lifeLoopStatus.cycleCount : soulState.cycleCount,
        mode: soulState.mode,
        is_running: innerLoopStatus.is_running || lifeLoopStatus.alive,
        doubts: soulState.doubts,
        confidence: soulState.confidence,
        energy_level: soulState.energyLevel,
        anomaly_score: soulState.anomalyScore,
      },
      health: {
        status: soulState.confidence >= 70 ? "ỔN ĐỊNH" : 
                soulState.confidence >= 40 ? "CẢNH BÁO" : "KHÔNG XÁC ĐỊNH",
        overall_score: soulState.confidence,
        trend: soulState.confidence >= 70 ? "tích cực" : 
               soulState.confidence >= 40 ? "ổn định" : "không xác định",
      },
      tasks: {
        total: 0,
        critical: 0,
        high: 0,
      },
      anomalies: {
        total: Math.floor(soulState.anomalyScore / 10),
        high_severity: Math.floor(soulState.anomalyScore / 20),
      },
      logs,
      services: {
        openai: openAIService.isConfigured(),
        notion: memoryBridge.isConnected(),
        scheduler: lifeLoopStatus.alive,
      },
      goals,
      current_focus: soulState.currentFocus,
      last_reflection: lastReflection,
      updated_at: new Date().toISOString(),
      // Time information for AGI scheduling
      system_time: {
        current_time: now.toISOString(),
        local_time: now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        timezone: 'Asia/Ho_Chi_Minh',
        timezone_offset: now.getTimezoneOffset(),
        unix_timestamp: now.getTime(),
        server_uptime_seconds: Math.floor(process.uptime()),
        date_components: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds(),
          day_of_week: now.getDay(), // 0 = Sunday, 1 = Monday, etc.
          day_of_week_name: now.toLocaleDateString('vi-VN', { weekday: 'long' }),
        },
      },
      next_cycle: nextCycleInfo,
    };

    res.json(dashboardData);
  } catch (error: any) {
    logger.error('[Dashboard] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Chạy Inner Loop thủ công
 */
coreRouter.post("/core/run-loop", async (_req: Request, res: Response) => {
  try {
    logger.info('[API] Manual Inner Loop run requested');
    const result = await innerLoop.run();
    res.json(result);
  } catch (error: any) {
    logger.error('[API] Inner Loop run error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      cycle: soulState.cycleCount,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Lấy status của Inner Loop
 */
coreRouter.get("/core/status", (_req: Request, res: Response) => {
  try {
    const status = innerLoop.getStatus();
    const state = soulState.export();
    const telegramStatus = getTelegramStatus();

    res.json({
      inner_loop: status,
      soul_state: state,
      services: {
        openai: openAIService.getStatus(),
        notion: {
          connected: memoryBridge.isConnected(),
        },
        telegram: telegramStatus,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[API] Status error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * Memory System Health Check
 * Check if the system is properly learning and storing memories
 */
coreRouter.get('/api/core/memory-health', async (_req: Request, res: Response) => {
  try {
    const { contextLearningSystem } = await import('../core/contextLearningSystem');
    
    const notionConnected = memoryBridge.isConnected();
    const recentMemories = await memoryBridge.readRecentMemories(5);
    const healthCheck = await contextLearningSystem.getSystemHealthCheck();
    
    const health = {
      status: notionConnected ? 'healthy' : 'degraded',
      notion: {
        connected: notionConnected,
        status: notionConnected ? 'Connected - System CAN learn' : 'NOT Connected - System CANNOT learn',
        warning: notionConnected ? null : 'Set NOTION_TOKEN in .env to enable learning',
      },
      memories: {
        recentCount: recentMemories.length,
        totalInSystem: healthCheck.memoriesCount,
        canLearn: healthCheck.hasContext,
        lastRefresh: healthCheck.lastRefresh,
      },
      creator: {
        recognized: healthCheck.creatorRecognized,
        name: healthCheck.creatorRecognized ? 'Trần Cường' : 'Unknown',
      },
      recentMemoryTitles: recentMemories.map(m => m.title),
      systemMessage: notionConnected 
        ? '✅ System is learning and evolving from Notion memories'
        : '❌ System CANNOT learn - Notion not connected. Conversations are NOT being saved.',
      recommendations: notionConnected ? [] : [
        'Set NOTION_TOKEN environment variable',
        'Set NOTION_DATABASE_ID environment variable', 
        'Verify Notion integration is working',
        'Check server logs for Notion connection errors',
      ],
    };
    
    res.json(health);
  } catch (error: any) {
    logger.error('[MemoryHealth] Error:', error);
    res.status(500).json({ 
      error: 'Failed to check memory health',
      message: error.message,
      status: 'error',
    });
  }
});
