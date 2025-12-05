# CipherH - Autonomous AI Agent System

## Overview
CipherH is an autonomous AI Agent backend system featuring Soul Loop technology for self-learning, self-reflection, and autonomous evolution. The system runs 10-step Inner Loop cycles every 10 minutes automatically.

## Current State
- **Version**: 1.0.0
- **Status**: Fully Operational (Placeholder Mode)
- **Last Updated**: December 5, 2025

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Backend**: Express.js server
- **Frontend**: React + Vite + TailwindCSS
- **Scheduler**: node-cron for automated cycles
- **UI Components**: shadcn/ui
- **State Management**: TanStack Query

### Core Modules

1. **SoulState** (`server/core/soulState.ts`)
   - Manages AI agent's internal state
   - Tracks confidence, doubts, energy levels
   - Stores goals, lessons learned, reflections

2. **LogAnalyzer** (`server/core/analyzer.ts`)
   - Reads and analyzes system logs
   - Detects patterns and anomalies
   - Generates self-evaluation questions

3. **Strategist** (`server/core/strategist.ts`)
   - Proposes weekly tasks and monthly plans
   - Aligns tasks with long-term goals
   - Generates strategy prompts for AI

4. **MemoryBridge** (`server/core/memory.ts`)
   - Connects to Notion for persistent memory
   - Writes daily summaries, lessons, strategies
   - Placeholder mode when Notion not configured

5. **InnerLoop** (`server/core/innerLoop.ts`)
   - Orchestrates 10-step autonomous cycle
   - Runs every 10 minutes via cron
   - Self-healing and self-improving

6. **OpenAIService** (`server/services/openai.ts`)
   - Connects to OpenAI GPT for reasoning
   - Generates strategies, answers questions
   - Placeholder mode when API key not set

7. **Logger** (`server/services/logger.ts`)
   - Winston-based logging system
   - Stores logs in memory and file
   - Provides statistics and filtering

## Inner Loop 10-Step Cycle

1. Read and analyze system logs
2. Detect patterns and anomalies
3. Self-reflection on current state
4. Update state from analysis
5. Propose weekly tasks
6. Propose monthly plan
7. Generate long-term strategy (AI)
8. Write to Notion memory
9. Evaluate self-performance
10. Prepare for next cycle

## API Endpoints

### Health & Status
- `GET /api/health` - System health check
- `GET /api/core/status` - Detailed core status
- `GET /api/core/soul-state` - Full soul state export

### Inner Loop Control
- `GET /api/core/run-loop` - Manually trigger loop
- `POST /api/core/scheduler` - Start/stop scheduler

### Strategy & Tasks
- `GET /api/core/strategy` - Current strategies
- `GET /api/core/tasks` - Weekly tasks
- `GET /api/core/anomalies` - Detected anomalies

### Configuration
- `POST /api/core/goals` - Set long-term goals
- `POST /api/core/focus` - Set current focus
- `POST /api/core/ask` - Ask AI question

### Dashboard
- `GET /api/dashboard` - Combined dashboard data

## Environment Variables

### Required for Full Features
- `OPENAI_API_KEY` - OpenAI API key for AI reasoning
- `NOTION_TOKEN` - Notion integration token
- `NOTION_DATABASE_ID` - Notion database for memory

### Optional
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - development/production

## Placeholder Mode

When API keys are not configured, the system runs in placeholder mode:
- OpenAI: Returns mock strategies and responses
- Notion: Logs writes to console instead of Notion
- System remains fully functional for testing

## Dashboard UI

Cyberpunk-themed monitoring dashboard at `/`:
- Real-time cycle count and status
- Confidence and doubt metrics
- Anomaly detection scores
- Service status indicators
- Goals and task overview
- Auto-refresh every 30 seconds

## Project Structure

```
server/
├── core/
│   ├── soulState.ts    # Agent state management
│   ├── innerLoop.ts    # 10-step cycle engine
│   ├── analyzer.ts     # Log analysis & patterns
│   ├── strategist.ts   # Task & strategy planning
│   └── memory.ts       # Notion memory bridge
├── services/
│   ├── openai.ts       # OpenAI integration
│   └── logger.ts       # Logging system
├── routes.ts           # API endpoints
└── index.ts            # Server entry

client/src/
├── pages/
│   └── dashboard.tsx   # Main dashboard
├── components/ui/      # shadcn components
└── App.tsx             # React entry
```

## Running the Application

```bash
npm run dev
```

Server starts on port 5000 with:
- Express API backend
- Vite dev server for frontend
- Cron scheduler for Inner Loop (every 10 minutes)

## Deployment

Designed for deployment on:
- **Replit**: Native support, use Run button
- **GitHub**: Push to repository
- **Render**: Connect GitHub, auto-deploy

## Future Enhancements (Planned)

- Python Flask backend integration (25+ blueprints)
- PostgreSQL database persistence
- Advanced anomaly detection with ML
- Multi-agent coordination
- Telegram bot integration
- GitHub Actions automation
