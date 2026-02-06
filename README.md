# CipherH - Autonomous AI System

CipherH là một hệ thống AI **tự trị hoàn toàn** được thiết kế để hoạt động liên tục 24/7, có khả năng tự phản ánh, học hỏi, **kiếm tiền**, và phát triển theo thời gian.

**KHÔNG phải chatbot. KHÔNG chờ lệnh. TỰ hành động.**

## 🎯 Core Features

### 💰 Financial Autonomy (NEW)
- **Tracks money**: Balance, burn rate, survival days
- **Makes spending decisions**: NO human approval required (within safety limits)
- **Generates revenue ideas**: 8 executable money-making strategies
- **Adapts strategy**: Survival mode (<30 days) → Growth (30-90) → Expansion (>90)

### 🤖 Autonomous Operation
- **24/7 Life Loop**: Perceive → Reflect → Decide → Act → Learn (continuous)
- **Self-directed**: Finds work when idle, no waiting for commands
- **Proposal-to-Action**: Every idea leads to REAL action, not suggestions
- **Adaptive timing**: 5-30 minute cycles based on urgency

### 🧠 Intelligence & Memory (Backend Orchestration)
- **Backend Orchestrates**: Notion + Identity Core + Context Learning + OpenAI (tool)
- **Self-Learning**: System learns from Notion memories, not OpenAI defaults
- **Context Awareness**: Retrieves learned facts and creator identity from memories
- **Memory System**: Short-term (RAM) + Long-term (Notion) with deduplication
- **Evolution**: Improves responses based on past interactions and feedback
- **Creator Recognition**: Learns who created it from conversations (Trần Cường)
- **Self-Reflection**: Detects patterns, learns from mistakes
- **Risk Management**: Self-adjusts behavior based on risk level
- **Note**: OpenAI is auxiliary tool for language processing, intelligence comes from SYSTEM

### 🎯 Real Actions (Not Proposals)
- ✅ Send Telegram messages
- ✅ Write/Read Notion
- ✅ Make API calls
- ✅ Create/modify files
- ✅ Propose infrastructure upgrades

## 🚀 Quick Start

### Deploy to Render (Recommended)

```bash
# Đọc hướng dẫn nhanh
cat QUICK_START.md

# Hoặc xem chi tiết
cat DEPLOYMENT.md
```

**TL;DR**: Chỉ cần connect repo này với Render Blueprint và click "Apply"

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📋 Requirements

- **Node.js**: 20.x (xem `.node-version`)
- **npm**: 10.x hoặc cao hơn

## 🔧 Configuration

Ứng dụng chạy với **placeholder mode** mà không cần API keys.

Để enable full features, set các environment variables:

```bash
# Tùy chọn - cho AI features
OPENAI_API_KEY=your_key_here

# Tùy chọn - cho memory persistence  
NOTION_TOKEN=your_token_here

# Tùy chọn - cho notifications
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_OWNER_CHAT_ID=your_chat_id

# Khuyên dùng cho production
SESSION_SECRET=random_secret_string
```

## 📡 API Endpoints

### Health Checks
- `GET /api/health` - System status, services, financial state, life loop status
- `GET /api/health/financial` - Detailed financial info (balance, revenue ideas, spending)
- `GET /api/health/risks` - Risk assessment and active risks
- `GET /api/health/actions` - Action execution statistics

### Example Response (`/api/health`)

```json
{
  "status": "ok",
  "timestamp": "2026-01-17T15:40:56.911Z",
  "uptime": 14.78,
  "services": {
    "inner_loop": "idle",
    "life_loop": "running",
    "openai": "placeholder",
    "notion": "placeholder",
    "telegram": "not configured"
  },
  "financial": {
    "balance": 0,
    "status": "critical",
    "survivalDays": 9999,
    "burnRate": 0
  },
  "lifeLoop": {
    "alive": true,
    "cycleCount": 1,
    "mode": "exploration",
    "nextCycleIn": 585
  }
}
```

## 💰 Financial System

### Status Levels
- **Critical** (<$2): Survival mode - only essential actions
- **Low** (<$10): Caution - prioritize revenue
- **Healthy** ($10-30): Stable - balanced approach
- **Abundant** (>$30): Can invest and experiment

### Revenue Ideas (8 executable strategies)
1. Telegram Bot Service ($50/mo)
2. Social Automation ($40/mo)
3. Content Generation ($30/mo)
4. Notion Templates ($25/mo)
5. API Monitoring ($75/mo)
6. Affiliate Content ($20/mo)
7. Micro-SaaS ($100/mo)
8. Demand Collection ($60/mo)

Each with detailed implementation steps - NOT just ideas.

## 🔄 How It Works

### Life Loop (24/7)
```
while (alive) {
  perceive();      // Telegram, logs, financial, health
  recallMemory();  // Past experiences & lessons
  reflect();       // Analyze situation
  decide();        // Make autonomous decisions
  act();           // REAL actions (Telegram, Notion, files)
  observe();       // Watch outcomes
  learn();         // Update knowledge
  sleep(adaptive); // 5-30 min based on urgency
}
```

### Autonomous Decision Making
- **NO human approval** - decisions within governance boundaries
- **Financial-aware** - tracks every cost, makes spending decisions
- **Risk-adjusted** - behavior changes based on risk level
- **Consequence-driven** - learns from success/failure

## 📡 API Endpoints

### Health Checks
- `GET /api/health` - System health và service status
- `GET /api/health/symbiosis` - Survival score và threat level

### Example Response

```json
{
  "status": "ok",
  "timestamp": "2026-01-17T14:37:34.274Z",
  "uptime": 4.88,
  "services": {
    "inner_loop": "running",
    "openai": "configured",
    "notion": "connected",
    "telegram": "configured"
  }
}
```

## 🧪 Testing

Chạy deployment test:

```bash
./test-deployment.sh
```

Test này sẽ:
- ✅ Verify Node.js và npm versions
- ✅ Install dependencies
- ✅ Run type check
- ✅ Build project
- ✅ Start server
- ✅ Test health endpoints

## 📁 Project Structure

```
.
├── client/          # Frontend React app
├── server/          # Backend Express server
│   ├── core/        # Core autonomous systems
│   ├── genes/       # Symbiosis genes
│   ├── routes/      # API routes
│   └── services/    # External service integrations
├── shared/          # Shared types and utilities
├── data/            # Runtime data storage
└── logs/            # Application logs
```

## 🔒 Security

- Governance engine blocks unauthorized actions
- Identity verification on every cycle
- No autonomous financial transactions
- All decisions are traced and logged
- Conservative mode when violations detected

## 📖 Documentation

- **QUICK_START.md** - Quick deployment guide
- **DEPLOYMENT.md** - Detailed deployment instructions
- **MASTER_BOOTSTRAP.md** - System architecture and design
- **design_guidelines.md** - Design principles

## 🐛 Troubleshooting

### Build fails
- Check Node version: `node --version` (should be 20.x)
- Clean install: `rm -rf node_modules && npm ci`
- Check build logs for specific errors

### Server won't start
- Check if port is available (default: 5000)
- Verify dist/index.cjs exists after build
- Check logs in `logs/system.log`

### TypeScript errors
- TypeScript errors don't prevent build/runtime
- Run `npm run check` to see all type errors
- These are mostly type mismatches in core modules

## 📝 License

MIT

## 👥 Creator

Created by Trần Cường (Cha)

---

**Status**: ✅ Production Ready | Last tested: 2026-01-17
