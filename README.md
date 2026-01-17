# CipherH - Autonomous AI System

CipherH là một hệ thống AI tự trị được thiết kế để hoạt động liên tục 24/7, có khả năng tự phản ánh, học hỏi và phát triển theo thời gian.

## 🎯 Features

- **24/7 Autonomous Operation**: Daemon chạy liên tục với recovery tự động
- **Self-Reflection**: Phân tích logs và patterns để tự cải thiện
- **Memory System**: Lưu trữ và distill knowledge qua thời gian
- **Governance**: Safety checks và decision validation
- **Evolution**: Tự động upgrade capabilities dựa trên measurements
- **Mission Alignment**: Tuân thủ core missions (SƠ TÂM)

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
