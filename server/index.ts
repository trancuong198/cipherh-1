import express from 'express';
import { createServer } from 'http';
import path from 'path';
import cron, { ScheduledTask } from 'node-cron';
import { runInnerLoop } from './core/innerLoop.js';
import { getSoulState } from './core/soulState.js';
import coreRoutes from './routes/core.js';

// Use process.cwd() for production builds
const rootDir = process.cwd();
const publicPath = path.join(rootDir, 'dist/public');

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(publicPath));
}

// API Routes
app.use('/api', coreRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve client in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;

// Schedule Inner Loop to run every 10 minutes
const cronSchedule = process.env.HEARTBEAT_CRON || '*/10 * * * *';
let cronJob: ScheduledTask | null = null;

async function startScheduler() {
  if (cronJob) {
    console.log('Scheduler already running');
    return;
  }

  cronJob = cron.schedule(cronSchedule, async () => {
    console.log('Running scheduled Inner Loop cycle...');
    try {
      await runInnerLoop();
    } catch (error) {
      console.error('Error in scheduled Inner Loop:', error);
    }
  });

  console.log(`Scheduler started with cron: ${cronSchedule}`);
}

function stopScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('Scheduler stopped');
  }
}

// Start server
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run initial Inner Loop cycle
  console.log('Running initial Inner Loop cycle...');
  try {
    await runInnerLoop();
    console.log('Initial Inner Loop completed');
  } catch (error) {
    console.error('Error in initial Inner Loop:', error);
  }

  // Start scheduler
  await startScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  stopScheduler();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { app, server, startScheduler, stopScheduler };
