/**
 * Perception Engine - Thu thập thế giới
 * 
 * Chủ động đọc môi trường từ:
 * - Telegram messages
 * - Social signals
 * - System logs
 * - API responses
 * - Financial state
 */

import { logger } from '../services/logger';
import * as fs from 'fs';

// ================================================
// TYPES
// ================================================

export interface Signal {
  source: string;
  content: string;
  emotion?: string;
  urgency: number; // 0-100
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerceptionState {
  signals: Signal[];
  lastPerceptionAt: number;
  totalSignalsProcessed: number;
}

// ================================================
// PERCEPTION ENGINE
// ================================================

class PerceptionEngine {
  private state: PerceptionState;
  private readonly MAX_SIGNALS = 200;
  private readonly STATE_FILE = './data/perception_state.json';

  constructor() {
    this.state = {
      signals: [],
      lastPerceptionAt: Date.now(),
      totalSignalsProcessed: 0,
    };

    this.ensureDataDir();
    this.loadState();
  }

  private ensureDataDir(): void {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
  }

  private loadState(): void {
    try {
      if (fs.existsSync(this.STATE_FILE)) {
        const data = JSON.parse(fs.readFileSync(this.STATE_FILE, 'utf-8'));
        this.state = { ...this.state, ...data };
      }
    } catch (error) {
      logger.error(`[Perception] Failed to load state: ${error}`);
    }
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error(`[Perception] Failed to save state: ${error}`);
    }
  }

  /**
   * Main perception cycle - gather all signals from environment
   */
  async perceive(): Promise<Signal[]> {
    const newSignals: Signal[] = [];

    // 1. Perceive Telegram
    newSignals.push(...await this.perceiveTelegram());

    // 2. Perceive system logs
    newSignals.push(...this.perceiveSystemLogs());

    // 3. Perceive financial state
    newSignals.push(...this.perceiveFinancialState());

    // 4. Perceive technical health
    newSignals.push(...this.perceiveTechnicalHealth());

    // 5. Perceive memory patterns
    newSignals.push(...this.perceiveMemoryPatterns());

    // Add to state
    for (const signal of newSignals) {
      this.addSignal(signal);
    }

    this.state.lastPerceptionAt = Date.now();
    this.saveState();

    logger.info(`[Perception] Perceived ${newSignals.length} signals from environment`);
    return newSignals;
  }

  /**
   * Perceive Telegram messages
   */
  private async perceiveTelegram(): Promise<Signal[]> {
    const signals: Signal[] = [];
    
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_OWNER_CHAT_ID;

    if (!token || !chatId) {
      return signals; // Not configured
    }

    try {
      // Get updates from Telegram
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=-1&limit=10`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.result && data.result.length > 0) {
          for (const update of data.result) {
            if (update.message && update.message.text) {
              signals.push({
                source: 'telegram',
                content: update.message.text,
                urgency: 70,
                timestamp: Date.now(),
                metadata: {
                  from: update.message.from.username || update.message.from.first_name,
                  chat_id: update.message.chat.id,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error(`[Perception] Failed to perceive Telegram: ${error}`);
    }

    return signals;
  }

  /**
   * Perceive system logs
   */
  private perceiveSystemLogs(): Signal[] {
    const signals: Signal[] = [];
    const logFile = './logs/system.log';

    try {
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.split('\n').slice(-50); // Last 50 lines

        // Look for errors
        const errors = lines.filter(l => l.includes('ERROR') || l.includes('error'));
        if (errors.length > 5) {
          signals.push({
            source: 'system_logs',
            content: `High error rate detected: ${errors.length} errors in recent logs`,
            emotion: 'concern',
            urgency: 80,
            timestamp: Date.now(),
          });
        }

        // Look for warnings
        const warnings = lines.filter(l => l.includes('WARN') || l.includes('warn'));
        if (warnings.length > 10) {
          signals.push({
            source: 'system_logs',
            content: `Many warnings: ${warnings.length} warnings detected`,
            urgency: 50,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      // Ignore
    }

    return signals;
  }

  /**
   * Perceive financial state
   */
  private perceiveFinancialState(): Signal[] {
    const signals: Signal[] = [];

    try {
      const financialFile = './data/financial_state.json';
      if (fs.existsSync(financialFile)) {
        const financial = JSON.parse(fs.readFileSync(financialFile, 'utf-8'));

        if (financial.balance < 2.0) {
          signals.push({
            source: 'financial',
            content: `CRITICAL: Balance at $${financial.balance.toFixed(2)} - survival threat`,
            emotion: 'anxiety',
            urgency: 100,
            timestamp: Date.now(),
          });
        } else if (financial.balance < 10.0) {
          signals.push({
            source: 'financial',
            content: `LOW: Balance at $${financial.balance.toFixed(2)} - caution needed`,
            emotion: 'concern',
            urgency: 70,
            timestamp: Date.now(),
          });
        } else if (financial.balance > 30.0) {
          signals.push({
            source: 'financial',
            content: `HEALTHY: Balance at $${financial.balance.toFixed(2)} - can invest`,
            emotion: 'confidence',
            urgency: 20,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      // Ignore
    }

    return signals;
  }

  /**
   * Perceive technical health
   */
  private perceiveTechnicalHealth(): Signal[] {
    const signals: Signal[] = [];

    // Memory usage
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

    if (heapUsedMB > 500) {
      signals.push({
        source: 'technical',
        content: `High memory usage: ${heapUsedMB.toFixed(0)}MB - may need restart`,
        urgency: 60,
        timestamp: Date.now(),
      });
    }

    // Uptime
    const uptimeHours = process.uptime() / 3600;
    if (uptimeHours > 168) { // > 7 days
      signals.push({
        source: 'technical',
        content: `Long uptime: ${uptimeHours.toFixed(0)}h - consider controlled restart`,
        urgency: 40,
        timestamp: Date.now(),
      });
    }

    return signals;
  }

  /**
   * Perceive memory patterns
   */
  private perceiveMemoryPatterns(): Signal[] {
    const signals: Signal[] = [];

    try {
      const memoryFile = './data/memory.json';
      if (fs.existsSync(memoryFile)) {
        const memories = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));

        // Check for repeated failures
        const recentFailures = memories
          .slice(-20)
          .filter((m: any) => !m.success);

        if (recentFailures.length > 10) {
          signals.push({
            source: 'memory',
            content: `Pattern detected: ${recentFailures.length} recent failures - strategy may need adjustment`,
            emotion: 'frustration',
            urgency: 70,
            timestamp: Date.now(),
          });
        }
      }
    } catch (error) {
      // Ignore
    }

    return signals;
  }

  /**
   * Add signal to state
   */
  private addSignal(signal: Signal): void {
    this.state.signals.push(signal);
    this.state.totalSignalsProcessed++;

    // Trim if too many
    if (this.state.signals.length > this.MAX_SIGNALS) {
      this.state.signals = this.state.signals.slice(-this.MAX_SIGNALS);
    }
  }

  /**
   * Get recent signals
   */
  getRecentSignals(count: number = 20): Signal[] {
    return this.state.signals.slice(-count);
  }

  /**
   * Get high urgency signals
   */
  getUrgentSignals(minUrgency: number = 70): Signal[] {
    return this.state.signals.filter(s => s.urgency >= minUrgency);
  }

  /**
   * Clear old signals
   */
  clearOldSignals(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    this.state.signals = this.state.signals.filter(s => s.timestamp > cutoff);
    this.saveState();
  }

  /**
   * Get state
   */
  getState(): PerceptionState {
    return { ...this.state };
  }
}

// ================================================
// SINGLETON EXPORT
// ================================================

export const perceptionEngine = new PerceptionEngine();
