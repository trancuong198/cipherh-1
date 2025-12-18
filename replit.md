# CipherH - Autonomous AI Agent System

## Overview
CipherH is an autonomous AI Agent backend system featuring Soul Loop technology for self-learning, self-reflection, and autonomous evolution. The system runs 10-step Inner Loop cycles every 10 minutes automatically.

## Current State
- **Version**: 1.0.0
- **Status**: Production Ready
- **GitHub**: https://github.com/trancuong198/cipherh-1

## Quick Start

### Development (Replit)
```bash
npm run dev
# Dashboard: http://localhost:5000
```

### Production (Render)
1. Push to GitHub (auto-sync enabled)
2. Render auto-deploys via `Procfile` and `render.yaml`

## Architecture

### Technology Stack
- **Runtime**: Node.js 20+ with TypeScript
- **Backend**: Express.js
- **Frontend**: React + Vite + TailwindCSS
- **Scheduler**: node-cron (10-min cycles)
- **UI**: shadcn/ui + Cyberpunk theme

### Core Modules

**SoulState** - AI consciousness state management
- Confidence, doubts, energy levels
- Goals, lessons, reflections

**LogAnalyzer** - Pattern detection
- Reads system logs
- Detects anomalies
- Generates questions

**Strategist** - Task & goal planning
- Weekly tasks
- Monthly plans
- Strategy alignment

**MemoryBridge** - Persistent memory (Notion)
- Daily summaries
- State snapshots
- Lessons learned

**InnerLoop** - 10-step autonomous cycle
- Runs every 10 minutes
- Self-evaluation & scoring
- Auto-improvement

## Inner Loop 10-Step Cycle

1. Read and analyze logs
2. Detect patterns and anomalies
3. Self-reflection
4. Update state from analysis
5. Propose weekly tasks
6. Propose monthly plan
7. Generate strategy (AI)
8. Write to Notion memory
9. Evaluate self-performance
10. Prepare for next cycle

## API Endpoints

### Core Status
- `GET /api/health` - System health
- `GET /api/core/status` - Detailed status
- `GET /api/dashboard` - Dashboard data

### Inner Loop Control
- `GET /api/core/run-loop` - Manual trigger
- `POST /api/core/scheduler` - Start/stop scheduler

### Configuration
- `POST /api/core/goals` - Set goals
- `POST /api/core/focus` - Set focus

### Auto-Sync
- `POST /api/sync` - Manual commit+push
- `GET /api/sync/status` - Sync status
- `POST /api/sync/enable` - Auto-sync every 5 min
- `POST /api/sync/disable` - Stop auto-sync

## Environment Variables

```bash
NODE_ENV=production          # Required for Render
GITHUB_TOKEN=...            # Optional: auto-sync
OPENAI_API_KEY=...          # Optional: AI features
NOTION_TOKEN=...            # Optional: memory
NOTION_DATABASE_ID=...      # Optional: memory
SESSION_SECRET=...          # Required: sessions
```

See `.env.example` for template.

## Deployment

### Render (Recommended for Production)
**Ready-to-deploy!**

1. Go to https://render.com
2. Create new Web Service
3. Connect GitHub: `https://github.com/trancuong198/cipherh-1`
4. Configure:
   - Build: `npm run build`
   - Start: `npm start`
   - Runtime: Node
5. Add environment variables from `.env.example`
6. Deploy! Auto-deploys on every GitHub push

### Replit (Development)
- Use Run button or `npm run dev`
- Hot reload enabled
- Dashboard on port 5000

### GitHub
- Repository: https://github.com/trancuong198/cipherh-1
- Auto-sync: Code pushes every 5 minutes
- `Procfile` & `render.yaml` included

## Features

✅ **Autonomous Soul Loop**
- Self-learning 10-step cycle
- Self-evaluation & scoring
- Energy management

✅ **Real-time Dashboard**
- Cyberpunk UI theme
- Live metrics monitoring
- System health indicators

✅ **Smart Integration**
- OpenAI for strategy (placeholder mode without API key)
- Notion for memory persistence (placeholder mode without token)
- GitHub auto-sync for deployment

✅ **Production Ready**
- Built for Render deployment
- Environment variable management
- Error handling & logging

## Files

```
server/
├── core/               # Soul Loop engine
│   ├── soulState.ts
│   ├── innerLoop.ts
│   ├── analyzer.ts
│   ├── strategist.ts
│   └── memory.ts
└── services/
    ├── gitSync.ts      # GitHub auto-sync
    └── openai.ts       # AI integration

client/src/
├── pages/
│   └── dashboard.tsx   # Cyberpunk dashboard
└── components/ui/      # shadcn components

Procfile               # Render process
render.yaml           # Render config
.env.example          # Environment template
```

## Deployment Checklist

- [x] Code ready on GitHub
- [x] Build script working (`npm run build`)
- [x] Start script configured (`npm start`)
- [x] Environment variables documented (`.env.example`)
- [x] Auto-sync to GitHub enabled (every 5 min)
- [x] Dashboard UI complete
- [x] Inner Loop 10 steps functional

## Next Steps

1. **Set up Render**: Connect GitHub repo
2. **Enable auto-sync**: `POST /api/sync/enable`
3. **Deploy**: Render auto-deploys on GitHub push
4. **Monitor**: Check dashboard at deployed URL

## Support

- Dashboard: `/` (port 5000)
- API: `/api/*`
- Logs: Console output

---

**Built with ❤️ for autonomous AI agents**
