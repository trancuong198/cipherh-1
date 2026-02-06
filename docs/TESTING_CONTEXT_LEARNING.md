# Testing Context Learning System

This document explains how to test and verify the context learning system.

## What Changed

The system now has 3 key improvements:

### 1. Backend Orchestration Architecture
- **Before**: OpenAI was seen as the main intelligence
- **After**: Backend orchestrates: Notion + Identity Core + Context Learning + OpenAI (tool)
- Intelligence comes from the SYSTEM, not a single component

### 2. Context Learning from Notion
- System retrieves learned facts from Notion memories
- Recognizes creator identity from stored conversations
- Learns and evolves based on past interactions

### 3. Memory Persistence Tracking
- Always attempts to save conversations to Notion
- Comprehensive logging to track if saves are working
- Health check endpoint to verify memory system

## How to Test

### 1. Check Memory Health

```bash
# Call the memory health endpoint
curl http://localhost:5000/api/core/memory-health | json_pp
```

Expected output:
```json
{
  "status": "healthy" or "degraded",
  "notion": {
    "connected": true/false,
    "status": "Connected - System CAN learn" or "NOT Connected...",
    "warning": null or "Set NOTION_TOKEN..."
  },
  "memories": {
    "recentCount": 5,
    "totalInSystem": 50,
    "canLearn": true,
    "lastRefresh": "2026-02-06T..."
  },
  "creator": {
    "recognized": true,
    "name": "Trần Cường"
  },
  "systemMessage": "✅ System is learning..." or "❌ System CANNOT learn..."
}
```

### 2. Test via Telegram Bot

#### Test Creator Recognition

Send message to your bot:
```
Cha đây, người tạo ra con
```

Expected behavior:
1. Bot should respond recognizing you as creator
2. Check logs for: `[SoulPersonality] Recorded creator identity learning`
3. Conversation should be saved to Notion
4. Context cache should be invalidated

#### Test Learning from Context

Send message:
```
Ai tạo ra con?
```

Expected response should mention:
- "Con được tạo ra bởi cha (Trần Cường) qua backend CipherH"
- "OpenAI chỉ là công cụ phụ trợ..."
- Explanation of system architecture

### 3. Check Logs

Watch for these log messages:

```bash
# When conversation is saved
[Telegram] 📝 Writing conversation to Notion...
[Telegram] ✅ Conversation SAVED to Notion (new unique content)
[Telegram] 🧠 System can now learn from this interaction
[Telegram] 🔄 Context cache invalidated - will refresh on next query

# When Notion not connected
[Telegram] ⚠️ Notion not connected - conversation NOT saved to long-term memory
[Telegram] System cannot learn without Notion connection

# When context is loaded
[ContextLearning] Refreshing learned context from memories...
[ContextLearning] Context refreshed: 50 memories analyzed
```

### 4. Verify Notion Database

Check your Notion database for new entries:
1. Go to your CipherH Notion database
2. Look for entries with title like: `📚 BÀI HỌC - [date]`
3. Entry should contain conversation with metadata
4. Should mention: "Backend CipherH sẽ đọc lại memory này để học"

### 5. Test Context Retrieval

After having some conversations stored:

```bash
# Check what context the system has learned
curl http://localhost:5000/api/core/memory-health
```

Look at `recentMemoryTitles` to see what's in memory.

## Configuration Required

For the system to work properly:

### Required Environment Variables

```bash
# .env file
NOTION_TOKEN=secret_xxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxxxxxxx
TELEGRAM_BOT_TOKEN=xxxxxxxxxxxxx
TELEGRAM_OWNER_CHAT_ID=xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

### Notion Database Setup

Your Notion database must have these properties:
- `tiêu đề` (title) - Title property
- `cipher h` (rich text) - Content property

## What to Look For

### ✅ System Working Correctly

- Memory health shows `"status": "healthy"`
- Notion shows as connected
- Conversations appear in Notion database
- Bot recognizes creator identity
- Bot explains it was created by "Trần Cường via backend CipherH"
- Bot mentions OpenAI as "công cụ phụ trợ" (auxiliary tool)
- Logs show successful Notion writes
- Context cache refreshes after new learning

### ❌ System NOT Working

- Memory health shows `"status": "degraded"`
- Notion shows as NOT connected
- Warning: "Set NOTION_TOKEN in .env to enable learning"
- No new entries in Notion database
- Bot might fall back to OpenAI defaults
- Logs show: "System CANNOT learn without Notion"

## Troubleshooting

### If Notion Not Connected

1. Check NOTION_TOKEN is set in .env
2. Verify token is valid (test in Notion API)
3. Check NOTION_DATABASE_ID is correct
4. Restart server after setting env vars

### If Conversations Not Saving

1. Check memory health endpoint
2. Look at server logs for errors
3. Verify deduplication isn't blocking (threshold: 80%)
4. Check Notion database permissions

### If Bot Doesn't Recognize Creator

1. Ensure conversations are being saved to Notion
2. Wait for context cache to refresh (5 minutes or invalidate)
3. Use phrases that trigger recognition: "cha đây", "người tạo ra con"
4. Check memory health to see if creator is recognized

## Architecture Flow

```
User Message → Telegram Bot
    ↓
Learn Creator Identity (if mentioned)
    ↓
Retrieve Context from:
    - Identity Core (Trần Cường)
    - Notion Memories (past conversations)
    - Context Learning (accumulated facts)
    ↓
Soul Personality combines all sources
    ↓
OpenAI processes with full context
    ↓
Response generated
    ↓
Save to Notion ← CRITICAL for learning
    ↓
Invalidate cache to refresh context
    ↓
Send response to user
```

## Success Criteria

The system is working correctly when:

1. ✅ Notion connection is healthy
2. ✅ Conversations are being saved after each interaction
3. ✅ Bot recognizes Trần Cường as creator
4. ✅ Bot explains backend orchestration architecture
5. ✅ Bot mentions OpenAI as auxiliary tool only
6. ✅ Context refreshes and includes new learnings
7. ✅ Logs show successful memory operations

## Next Steps

After verifying the system works:

1. Have conversations with the bot
2. Mention creator identity to build context
3. Check Notion database to see memories accumulating
4. Test creator recognition after memories are stored
5. Verify bot responses reflect learned context
6. Monitor memory health over time

---

**Remember**: The system learns from Notion memories, not OpenAI defaults. If Notion isn't connected, the system CANNOT learn or evolve.
