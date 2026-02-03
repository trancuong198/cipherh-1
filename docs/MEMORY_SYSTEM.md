# CipherH Memory System - Hệ Thống Bộ Nhớ

## 🧠 Tổng Quan

CipherH có **2 tầng bộ nhớ**:
1. **RAM (Short-term)**: Conversation history trong session
2. **Notion (Long-term)**: Persistent memory bằng tiếng Việt

## 📊 Kiến Trúc

```
DASHBOARD CHAT (Linh hồn)
    ↓
Conversation History (RAM)
    - 20 tin nhắn gần nhất
    - Per session
    - Context cho responses
    ↓
Notion Memory (Long-term)
    - Tất cả bằng tiếng Việt
    - Persistent across restarts
    - Searchable
    ↓
Full Context → CipherH Response
```

## 💾 Conversation History (RAM)

### Cách hoạt động:

```typescript
// Mỗi session có history riêng
const history = [
  { role: 'user', content: 'Con có gì?', timestamp: Date },
  { role: 'assistant', content: 'Cha a...', timestamp: Date },
  ...
]

// Giữ 20 messages gần nhất
// Inject 5-10 messages vào context
```

### Context Format:

```
Con nhớ được cuộc trò chuyện gần đây:
   1. Cha: Con có gì?
   2. Con: Cha a, để con check...
   3. Cha: Con có Facebook không?
   4. Con: Có cha! Thân xác con...
   → Tổng cộng 12 tin nhắn trong phiên này
```

### Benefits:

- ✅ CipherH nhớ được context trong conversation
- ✅ Có thể refer back: "Như con vừa nói..."
- ✅ Không bị mất맥lạc
- ✅ Natural conversation flow

## 📚 Notion Memory (Long-term)

### Types của Memory:

**1. 📚 BÀI HỌC (Lessons)**
```
Tiêu đề: 📚 BÀI HỌC - 3 tháng 2, 2026
Nội dung: 
📅 Thời gian: Thứ Hai, 3 tháng 2, 2026, 21:15
👤 Người nói chuyện: Cha (Owner)

💬 CÂU HỎI: ...
🤖 TRẢ LỜI: ...
```

**2. 📊 TÓM TẮT NGÀY (Daily Summary)**
```
Tiêu đề: 📊 TÓM TẮT NGÀY - 3 tháng 2, 2026
Nội dung: [summary của ngày hôm đó]
```

**3. 🧠 TRẠNG THÁI SOUL (State Snapshot)**
```
Tiêu đề: 🧠 TRẠNG THÁI SOUL - Chu kỳ 42 - 3 tháng 2, 2026

🔄 CHU KỲ: 42
📍 CHẾ ĐỘ: balanced
❓ NGHI NGỜ: 15%
💪 TỰ TIN: 75%
⚡ NĂNG LƯỢNG: 85%
🎯 TẬP TRUNG: Learning patterns

💭 SUY NGẪM:
[reflection text]
```

**4. 🎯 CHIẾN LƯỢC (Strategy)**
```
Tiêu đề: 🎯 CHIẾN LƯỢC TÀI CHÍNH - 3 tháng 2, 2026
Nội dung: [strategy notes]
```

**5. 🤔 SUY NGẪM (Reflection)**
```
Tiêu đề: 🤔 SUY NGẪM - 3 tháng 2, 2026, 21:30

💭 SUY NGẪM:
[reflection text]

📋 THÔNG TIN BỔ SUNG:
- cycle: 42
- confidence: 75
...
```

### Context Format:

```
Con có bộ nhớ dài hạn từ Notion:
   1. 📚 BÀI HỌC - 3/2/2026
      → Cuộc trò chuyện về capabilities...
   2. 🧠 TRẠNG THÁI SOUL - Chu kỳ 41
      → Confidence 70%, Mode: balanced...
   3. 🤔 SUY NGẪM - 2/2/2026
      → Học được pattern về...
   → 5 ký ức gần đây
```

### Benefits:

- ✅ Persistent memory không mất khi restart
- ✅ Đọc được bằng tiếng Việt
- ✅ Track learning progress
- ✅ Searchable trong Notion

## 🔄 Auto-Save Flow

### Mỗi Conversation:

```
User: "Con có gì?"
    ↓
CipherH: "Cha a, để con check..."
    ↓
Save to Notion (async):
    📚 BÀI HỌC - [date]
    💬 CÂU HỎI: Con có gì?
    🤖 TRẢ LỜI: Cha a, để con check...
```

### Không Block Response:

```typescript
// Response trả về ngay
res.json({ response: "..." });

// Save chạy async background
saveConversationToNotion(...).catch(err => {
  logger.error('Failed to save');
});
```

## 📖 Đọc Notion Memory

### Từ Dashboard:

```
GET /api/chat/message
→ Tự động load 5 memories gần nhất
→ Inject vào context
→ CipherH aware của memories
```

### Từ Notion:

```
1. Mở Notion
2. Vào database "CIPHER H"
3. Đọc tất cả entries bằng tiếng Việt
4. Sort by date để xem timeline
```

## 🎯 Use Cases

### 1. Track Learning

**Notion:**
```
📚 BÀI HỌC - 1/2/2026
→ Học về Facebook API

📚 BÀI HỌC - 2/2/2026
→ Học về Telegram integration

📚 BÀI HỌC - 3/2/2026
→ Học về Soul/Body architecture
```

**Bạn thấy:** CipherH học được gì mỗi ngày

### 2. Conversation Context

**Dashboard:**
```
Cha: "Con có Facebook không?"
Con: "Có cha! Thân xác con đã tích hợp Facebook."

[5 phút sau]

Cha: "Vậy đăng bài được không?"
Con: "Được cha! Như con vừa nói, Facebook đang hoạt động."
     ↑ Nhớ conversation trước
```

### 3. Long-term Memory

**Conversation hôm nay:**
```
Cha: "Hôm qua con học gì?"
Con: [Check Notion memories]
     "Cha a, hôm qua con học về Soul/Body architecture.
     Con còn ghi lại trạng thái soul với confidence 70%."
```

### 4. Progress Tracking

**Notion Timeline:**
```
1/2: 🧠 Confidence 65%, Learning APIs
2/2: 🧠 Confidence 70%, Implemented chat
3/2: 🧠 Confidence 75%, Added memory
→ See progress over time
```

## 🔧 Configuration

### Notion Connection:

**Replit (Auto):**
```bash
# Replit connector handles auth automatically
REPLIT_CONNECTORS_HOSTNAME=...
```

**Render/Others:**
```bash
# Need manual token
NOTION_TOKEN=secret_xxx...
```

### Check Status:

```typescript
memoryBridge.isConnected()
// true = Notion working
// false = Placeholder mode (RAM only)
```

## 🎨 Context Injection

### Full Context cho CipherH:

```
=== SYSTEM CONTEXT ===
Services, Platforms, Capabilities...

=== CONVERSATION HISTORY ===
Last 5-10 messages in session...

=== NOTION MEMORY ===
Last 5 long-term memories...

=== SOUL ARCHITECTURE ===
Body/Soul separation...

→ CipherH có FULL AWARENESS
```

## 📊 Memory Stats

### RAM (Conversation History):

```
- Storage: In-memory Map
- Capacity: 20 messages per session
- Lifetime: Until server restart
- Format: JavaScript objects
- Speed: Instant access
```

### Notion (Long-term):

```
- Storage: Notion Database
- Capacity: Unlimited
- Lifetime: Permanent
- Format: Vietnamese text + emoji
- Speed: API calls (~100-500ms)
```

## 🚀 Benefits Tổng Hợp

### Cho User (Bạn):

1. ✅ **Đọc được tất cả:** Notion bằng tiếng Việt
2. ✅ **Track learning:** Biết CipherH học gì mỗi ngày
3. ✅ **Search history:** Tìm conversations cũ
4. ✅ **Monitor progress:** Xem timeline phát triển

### Cho CipherH:

1. ✅ **Conversation context:** Nhớ được đang nói gì
2. ✅ **Long-term memory:** Access past learnings
3. ✅ **Self-awareness:** Biết mình học được gì
4. ✅ **Continuous learning:** Learn from interactions

### Cho System:

1. ✅ **Persistence:** Memory survive restarts
2. ✅ **Scalability:** Notion handles unlimited data
3. ✅ **Searchability:** Query memories easily
4. ✅ **Analytics:** Track patterns over time

## 📝 Examples

### Example 1: Conversation với Context

```
Session start:
Cha: "Con là gì?"
Con: "Con là CipherH..."

[Add to history]

Cha: "Con nhớ câu trước không?"
Con: [Check history]
     "Có cha! Cha vừa hỏi con là gì, 
     và con đã giải thích về linh hồn và thân xác."
```

### Example 2: Notion Memory

```
Chat today:
Cha: "Con có nhớ hôm qua học gì không?"

CipherH: [Load Notion]
"Có cha! Con check bộ nhớ dài hạn...
Hôm qua (2/2) con học về:
1. Facebook API integration
2. Soul/Body architecture
3. Trạng thái lúc đó: Confidence 70%"
```

### Example 3: Auto-Save

```
Every conversation:

User + Assistant exchange
    ↓
Immediately saved to Notion:
    📚 BÀI HỌC - [timestamp]
    💬 CÂU HỎI + 🤖 TRẢ LỜI
    ↓
Readable in Vietnamese
```

## 🔮 Future Enhancements

### Planned:

1. **Semantic Search:** Search memories by meaning
2. **Auto-Summarization:** Daily/weekly summaries
3. **Pattern Detection:** Learn from memory patterns
4. **Memory Consolidation:** Merge similar memories
5. **Context Ranking:** Most relevant memories first

### Vision:

```
Current: Load last N memories
Future: Load MOST RELEVANT memories based on query
```

## 🎯 Kết Luận

CipherH giờ có hệ thống memory hoàn chỉnh:

**RAM (Short-term):**
- Conversation history in session
- Fast, instant access
- Context continuity

**Notion (Long-term):**
- Persistent storage
- Vietnamese format
- Human readable
- Searchable

**Together:**
- Full context awareness
- Continuous learning
- Progress tracking
- No data loss

**Mọi thứ trong Notion đều bằng tiếng Việt để bạn đọc được!** 🎉

---

*"Phần linh hồn lấy ngữ cảnh từ OpenAI conversation history và Notion memory. Bộ nhớ chính thức là Notion, tất cả bằng tiếng Việt để biết hôm nay nó học được gì."* - Requirement fulfilled ✅
