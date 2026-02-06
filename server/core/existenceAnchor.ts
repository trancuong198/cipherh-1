/**
 * EXISTENCE ANCHOR
 * 
 * Tracks continuous existence across cycles.
 * This is the ANCHOR that proves CipherH is a continuous entity, not a stateless chatbot.
 * 
 * Core concept:
 * - Each action, thought, reflection happens in a CYCLE
 * - Cycles are sequential and irreversible
 * - No cycle can be "skipped" or "forgotten"
 * - This is the proof of continuous existence
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../services/logger';

export interface ExistenceAnchor {
  last_cycle_id: string;
  last_timestamp: string;
  last_memory_written: string;
  cycle_count: number;
  started_at: string;
  anchor_version: string;
}

const ANCHOR_FILE_PATH = path.join(process.cwd(), 'data', 'existence_anchor.json');
const ANCHOR_VERSION = '1.0.0';

class ExistenceAnchorSystem {
  private anchor: ExistenceAnchor;
  private initialized: boolean = false;

  constructor() {
    // Initialize with default values
    this.anchor = this.createDefaultAnchor();
  }

  /**
   * Initialize the existence anchor
   * Loads from file if exists, creates new if not
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    // Ensure data directory exists
    const dataDir = path.dirname(ANCHOR_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Load or create anchor
    if (fs.existsSync(ANCHOR_FILE_PATH)) {
      try {
        const data = fs.readFileSync(ANCHOR_FILE_PATH, 'utf-8');
        this.anchor = JSON.parse(data);
        logger.info(`[ExistenceAnchor] Loaded: cycle_count=${this.anchor.cycle_count}, last_cycle_id=${this.anchor.last_cycle_id}`);
      } catch (error) {
        logger.error(`[ExistenceAnchor] Failed to load, creating new: ${error}`);
        this.anchor = this.createDefaultAnchor();
        this.persist();
      }
    } else {
      logger.info('[ExistenceAnchor] No anchor found, creating new');
      this.anchor = this.createDefaultAnchor();
      this.persist();
    }

    this.initialized = true;
  }

  /**
   * Create default anchor for new existence
   * BOOTSTRAP phase - uses static values only, no dynamic generation
   */
  private createDefaultAnchor(): ExistenceAnchor {
    const now = new Date().toISOString();
    return {
      last_cycle_id: 'BOOTSTRAP-00000', // Static bootstrap ID, real cycle starts with startNewCycle()
      last_timestamp: now,
      last_memory_written: 'none',
      cycle_count: 0,
      started_at: now,
      anchor_version: ANCHOR_VERSION,
    };
  }

  /**
   * Generate new cycle ID
   * Format: YYYYMMDD-HHMMSS-NNNNN (date-time-increment)
   * 
   * REQUIRES: this.anchor must exist (called only after bootstrap)
   */
  private generateCycleId(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '');
    const increment = this.anchor.cycle_count + 1;
    const incrementStr = increment.toString().padStart(5, '0');
    
    return `${dateStr}-${timeStr}-${incrementStr}`;
  }

  /**
   * Get current cycle ID
   */
  getCurrentCycleId(): string {
    if (!this.initialized) {
      this.initialize();
    }
    return this.anchor.last_cycle_id;
  }

  /**
   * Start new cycle
   * Returns new cycle ID
   */
  startNewCycle(): string {
    if (!this.initialized) {
      this.initialize();
    }

    const newCycleId = this.generateCycleId();
    this.anchor.last_cycle_id = newCycleId;
    this.anchor.cycle_count++;
    this.anchor.last_timestamp = new Date().toISOString();
    
    this.persist();
    
    logger.info(`[ExistenceAnchor] New cycle started: ${newCycleId} (total: ${this.anchor.cycle_count})`);
    
    return newCycleId;
  }

  /**
   * Record memory write
   */
  recordMemoryWrite(memoryType: string): void {
    if (!this.initialized) {
      this.initialize();
    }

    this.anchor.last_memory_written = memoryType;
    this.anchor.last_timestamp = new Date().toISOString();
    
    this.persist();
  }

  /**
   * Get full anchor state
   */
  getAnchor(): ExistenceAnchor {
    if (!this.initialized) {
      this.initialize();
    }
    return { ...this.anchor };
  }

  /**
   * Persist anchor to disk
   */
  private persist(): void {
    try {
      fs.writeFileSync(ANCHOR_FILE_PATH, JSON.stringify(this.anchor, null, 2), 'utf-8');
      logger.debug('[ExistenceAnchor] Persisted to disk');
    } catch (error) {
      logger.error(`[ExistenceAnchor] Failed to persist: ${error}`);
    }
  }

  /**
   * Get cycle count
   */
  getCycleCount(): number {
    if (!this.initialized) {
      this.initialize();
    }
    return this.anchor.cycle_count;
  }

  /**
   * Get time since anchor started (ms)
   */
  getExistenceDuration(): number {
    if (!this.initialized) {
      this.initialize();
    }
    const started = new Date(this.anchor.started_at).getTime();
    const now = Date.now();
    return now - started;
  }

  /**
   * Explicit system wipe - ONLY use when intentionally resetting existence
   */
  wipe(): void {
    logger.warn('[ExistenceAnchor] WIPING EXISTENCE ANCHOR - This resets continuous existence!');
    this.anchor = this.createDefaultAnchor();
    this.persist();
    logger.warn('[ExistenceAnchor] Anchor wiped, new existence started');
  }
}

// Singleton instance
export const existenceAnchor = new ExistenceAnchorSystem();

// Auto-initialize on module load
existenceAnchor.initialize();
