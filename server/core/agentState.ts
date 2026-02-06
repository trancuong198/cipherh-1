/**
 * AGENT STATE - SINGLE SOURCE OF TRUTH
 * 
 * This is the UNIFIED state system for CipherH.
 * EVERY interaction, cycle, learning event MUST update this state.
 * 
 * Architecture:
 * - Replaces scattered state (soulState, existenceAnchor, daemon) with unified model
 * - Persists to BOTH Notion AND local JSON (dual persistence for reliability)
 * - All counters, metrics, facts are REAL and derived from actual events
 * - NO placeholders, NO simulated state, NO friendly fallbacks
 * 
 * Key Principle: If it didn't happen, the counter stays at ZERO.
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../services/logger';
import { getUncachableNotionClient, isNotionConnected } from '../services/notionClient';

const AGENT_STATE_FILE = path.join(process.cwd(), 'data', 'agent_state.json');
// Use environment variable for Notion database ID, with fallback to main database
const AGENT_STATE_NOTION_DB = process.env.AGENT_STATE_NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID || '2ac0fc26257080a693d2cdcdc8a37ad0';

/**
 * System Event Log Entry
 * Append-only log of all significant system events
 */
export interface SystemEvent {
  id: string;
  timestamp: string;
  event_type: 'MESSAGE_RECEIVED' | 'CYCLE_COMPLETED' | 'FACT_LEARNED' | 'IDENTITY_VERIFIED' | 'ERROR' | 'STATE_CHANGE';
  platform?: 'web' | 'telegram' | 'facebook' | 'internal';
  user_id?: string;
  user_role?: 'owner' | 'user' | 'unknown';
  details: string;
  cycle_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Known Identity
 * Tracks verified identities across platforms
 */
export interface KnownIdentity {
  id: string; // Platform-specific ID (e.g., telegram:123456, web:session-abc)
  platform: 'web' | 'telegram' | 'facebook';
  role: 'owner' | 'user';
  verified_at: string;
  verification_method: 'secret_passphrase' | 'two_step_cha' | 'platform_id' | 'memory_continuity';
  last_interaction_at: string;
  interaction_count: number;
  name?: string;
  metadata?: Record<string, any>;
}

/**
 * Learned Fact
 * Knowledge extracted from interactions and stored permanently
 */
export interface LearnedFact {
  id: string;
  content: string;
  learned_at: string;
  cycle_id: string;
  source_platform: string;
  source_user?: string;
  confidence: number; // 0-100
  category?: 'user_preference' | 'world_knowledge' | 'system_behavior' | 'relationship' | 'other';
}

/**
 * Unified Agent State
 * THE single source of truth for ALL agent state
 */
export interface AgentState {
  // ========== EXISTENCE TRACKING ==========
  created_at: string; // When agent was first initialized
  last_interaction_at: string; // Most recent message/event
  last_cycle_at: string; // Most recent cycle completion
  last_persisted_at: string; // When state was last saved
  
  // ========== COUNTERS (REAL, NOT SIMULATED) ==========
  total_messages: number; // Every inbound message increments this
  total_cycles: number; // Every lifecycle cycle increments this
  total_facts_learned: number; // Facts extracted and stored
  total_identities_known: number; // Verified identities
  
  // ========== LIFECYCLE STATE ==========
  current_cycle_id: string; // Format: YYYYMMDD-HHMMSS-NNNNN
  cycle_count: number; // Sequential cycle counter (same as total_cycles)
  mode: 'idle' | 'active' | 'learning' | 'reflecting' | 'error';
  
  // ========== METRICS (DERIVED FROM EVENTS, NOT HARDCODED) ==========
  confidence: number; // 0-100, calculated from success/failure events
  doubts: number; // 0-100, increased by anomalies
  energy_level: number; // 0-100, decreased by errors, increased by success
  anomaly_score: number; // 0-100, calculated from unexpected events
  
  // ========== COLLECTIONS ==========
  learned_facts: LearnedFact[]; // Array of learned knowledge
  known_identities: Map<string, KnownIdentity>; // Map of verified identities (key = platform:id)
  system_events_log: SystemEvent[]; // Append-only event log (last 1000 events)
  
  // ========== GOVERNANCE ==========
  total_errors: number; // Count of errors encountered
  total_warnings: number; // Count of warnings
  last_error_at: string | null;
  last_warning_at: string | null;
  
  // ========== METADATA ==========
  version: string;
  state_checksum: string; // Hash of state for integrity verification
}

/**
 * AgentState Manager
 * Manages the unified agent state with dual persistence (Notion + File)
 */
class AgentStateManager {
  private state: AgentState | null = null;
  private initialized: boolean = false;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.ensureDataDirectory();
  }

  /**
   * Initialize agent state
   * Loads from file if exists, creates new if not
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Try to load from file first
      if (fs.existsSync(AGENT_STATE_FILE)) {
        await this.loadFromFile();
      } else {
        // Create new state
        this.state = this.createFreshState();
        await this.persist();
        logger.info('[AgentState] Created fresh state');
      }

      this.initialized = true;
      logger.info('[AgentState] Initialized successfully');
      logger.info(`[AgentState] Messages: ${this.state.total_messages}, Cycles: ${this.state.total_cycles}, Facts: ${this.state.total_facts_learned}`);
    } catch (error) {
      logger.error('[AgentState] Initialization failed:', error);
      throw new Error(`AgentState initialization failed: ${error}`);
    }
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<AgentState> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized. Call initialize() first.');
    }
    return Object.freeze({ ...this.state });
  }

  /**
   * Record incoming message
   * MUST be called for EVERY inbound message
   */
  async recordMessage(params: {
    platform: 'web' | 'telegram' | 'facebook';
    user_id: string;
    user_role: 'owner' | 'user' | 'unknown';
    message: string;
    cycle_id?: string;
  }): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    const now = new Date().toISOString();
    const eventId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Increment counter
    this.state.total_messages++;
    this.state.last_interaction_at = now;

    // Log event
    const event: SystemEvent = {
      id: eventId,
      timestamp: now,
      event_type: 'MESSAGE_RECEIVED',
      platform: params.platform,
      user_id: params.user_id,
      user_role: params.user_role,
      details: `Message received: "${params.message.substring(0, 100)}..."`,
      cycle_id: params.cycle_id || this.state.current_cycle_id,
      metadata: {
        message_length: params.message.length,
      }
    };

    this.appendSystemEvent(event);

    // Update identity interaction count if known
    const identityKey = `${params.platform}:${params.user_id}`;
    if (this.state.known_identities.has(identityKey)) {
      const identity = this.state.known_identities.get(identityKey)!;
      identity.interaction_count++;
      identity.last_interaction_at = now;
      this.state.total_identities_known = this.state.known_identities.size;
    }

    // Persist asynchronously
    await this.persist();

    logger.info(`[AgentState] Message recorded: total=${this.state.total_messages}, user=${params.user_id}, platform=${params.platform}`);
  }

  /**
   * Record cycle completion
   * MUST be called when a lifecycle cycle completes
   */
  async recordCycleCompletion(cycleId: string): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    const now = new Date().toISOString();
    const eventId = `cycle-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Increment counter
    this.state.total_cycles++;
    this.state.cycle_count = this.state.total_cycles;
    this.state.current_cycle_id = cycleId;
    this.state.last_cycle_at = now;

    // Log event
    const event: SystemEvent = {
      id: eventId,
      timestamp: now,
      event_type: 'CYCLE_COMPLETED',
      details: `Cycle ${cycleId} completed`,
      cycle_id: cycleId,
    };

    this.appendSystemEvent(event);

    // Persist
    await this.persist();

    logger.info(`[AgentState] Cycle completed: ${cycleId}, total=${this.state.total_cycles}`);
  }

  /**
   * Record a learned fact
   */
  async recordFact(fact: {
    content: string;
    cycle_id: string;
    source_platform: string;
    source_user?: string;
    confidence?: number;
    category?: 'user_preference' | 'world_knowledge' | 'system_behavior' | 'relationship' | 'other';
  }): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    const now = new Date().toISOString();
    const factId = `fact-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const learnedFact: LearnedFact = {
      id: factId,
      content: fact.content,
      learned_at: now,
      cycle_id: fact.cycle_id,
      source_platform: fact.source_platform,
      source_user: fact.source_user,
      confidence: fact.confidence || 80,
      category: fact.category || 'other',
    };

    this.state.learned_facts.push(learnedFact);
    this.state.total_facts_learned = this.state.learned_facts.length;

    // Log event
    const event: SystemEvent = {
      id: `event-${Date.now()}`,
      timestamp: now,
      event_type: 'FACT_LEARNED',
      details: `Learned: "${fact.content.substring(0, 100)}..."`,
      cycle_id: fact.cycle_id,
    };

    this.appendSystemEvent(event);

    await this.persist();

    logger.info(`[AgentState] Fact learned: total=${this.state.total_facts_learned}`);
  }

  /**
   * Record verified identity
   */
  async recordIdentity(identity: {
    platform: 'web' | 'telegram' | 'facebook';
    user_id: string;
    role: 'owner' | 'user';
    verification_method: 'secret_passphrase' | 'two_step_cha' | 'platform_id' | 'memory_continuity';
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    const now = new Date().toISOString();
    const identityKey = `${identity.platform}:${identity.user_id}`;

    const knownIdentity: KnownIdentity = {
      id: identityKey,
      platform: identity.platform,
      role: identity.role,
      verified_at: now,
      verification_method: identity.verification_method,
      last_interaction_at: now,
      interaction_count: 0,
      name: identity.name,
      metadata: identity.metadata,
    };

    this.state.known_identities.set(identityKey, knownIdentity);
    this.state.total_identities_known = this.state.known_identities.size;

    // Log event
    const event: SystemEvent = {
      id: `event-${Date.now()}`,
      timestamp: now,
      event_type: 'IDENTITY_VERIFIED',
      platform: identity.platform,
      user_id: identity.user_id,
      user_role: identity.role,
      details: `Identity verified: ${identityKey} via ${identity.verification_method}`,
    };

    this.appendSystemEvent(event);

    await this.persist();

    logger.info(`[AgentState] Identity verified: ${identityKey} as ${identity.role}`);
  }

  /**
   * Update metrics (confidence, doubts, energy, anomaly)
   */
  async updateMetrics(update: {
    confidence?: number;
    doubts?: number;
    energy_level?: number;
    anomaly_score?: number;
  }): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    if (update.confidence !== undefined) {
      this.state.confidence = Math.max(0, Math.min(100, update.confidence));
    }
    if (update.doubts !== undefined) {
      this.state.doubts = Math.max(0, Math.min(100, update.doubts));
    }
    if (update.energy_level !== undefined) {
      this.state.energy_level = Math.max(0, Math.min(100, update.energy_level));
    }
    if (update.anomaly_score !== undefined) {
      this.state.anomaly_score = Math.max(0, Math.min(100, update.anomaly_score));
    }

    await this.persist();
  }

  /**
   * Record error
   */
  async recordError(error: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.initialized || !this.state) {
      throw new Error('AgentState not initialized');
    }

    const now = new Date().toISOString();
    this.state.total_errors++;
    this.state.last_error_at = now;

    const event: SystemEvent = {
      id: `error-${Date.now()}`,
      timestamp: now,
      event_type: 'ERROR',
      details: error,
      metadata,
    };

    this.appendSystemEvent(event);

    await this.persist();

    logger.error(`[AgentState] Error recorded: ${error}`);
  }

  /**
   * Create fresh state
   */
  private createFreshState(): AgentState {
    const now = new Date().toISOString();
    return {
      created_at: now,
      last_interaction_at: now,
      last_cycle_at: now,
      last_persisted_at: now,
      total_messages: 0,
      total_cycles: 0,
      total_facts_learned: 0,
      total_identities_known: 0,
      current_cycle_id: 'BOOTSTRAP-00000',
      cycle_count: 0,
      mode: 'idle',
      confidence: 75,
      doubts: 0,
      energy_level: 100,
      anomaly_score: 0,
      learned_facts: [],
      known_identities: new Map(),
      system_events_log: [],
      total_errors: 0,
      total_warnings: 0,
      last_error_at: null,
      last_warning_at: null,
      version: '1.0.0',
      state_checksum: '',
    };
  }

  /**
   * Append system event (keeps last 1000)
   */
  private appendSystemEvent(event: SystemEvent): void {
    if (!this.state) return;

    this.state.system_events_log.push(event);

    // Keep only last 1000 events
    if (this.state.system_events_log.length > 1000) {
      this.state.system_events_log.shift();
    }
  }

  /**
   * Persist state to both file and Notion
   */
  private async persist(): Promise<void> {
    if (!this.state) return;

    // Queue saves to avoid race conditions
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        this.state!.last_persisted_at = new Date().toISOString();
        this.state!.state_checksum = this.calculateChecksum(this.state!);

        // Save to file (synchronous, fast)
        await this.saveToFile();

        // Save to Notion (asynchronous, slower, best-effort)
        this.saveToNotion().catch(err => {
          logger.warn('[AgentState] Notion save failed (non-critical):', err);
        });
      } catch (error) {
        logger.error('[AgentState] Persist failed:', error);
        throw error;
      }
    });

    await this.saveQueue;
  }

  /**
   * Save to local file
   */
  private async saveToFile(): Promise<void> {
    if (!this.state) return;

    try {
      // Convert Map to object for JSON serialization
      const serializable = {
        ...this.state,
        known_identities: Array.from(this.state.known_identities.entries()),
      };

      fs.writeFileSync(
        AGENT_STATE_FILE,
        JSON.stringify(serializable, null, 2),
        'utf-8'
      );

      logger.debug('[AgentState] Saved to file');
    } catch (error) {
      logger.error('[AgentState] File save failed:', error);
      throw error;
    }
  }

  /**
   * Load from local file
   */
  private async loadFromFile(): Promise<void> {
    try {
      const data = fs.readFileSync(AGENT_STATE_FILE, 'utf-8');
      const parsed = JSON.parse(data);

      // Restore Map from array
      parsed.known_identities = new Map(parsed.known_identities || []);

      this.state = parsed;
      logger.info('[AgentState] Loaded from file');
    } catch (error) {
      logger.error('[AgentState] File load failed:', error);
      throw error;
    }
  }

  /**
   * Save to Notion (best-effort, non-blocking)
   */
  private async saveToNotion(): Promise<void> {
    if (!this.state) return;

    try {
      const connected = await isNotionConnected();
      if (!connected) {
        logger.debug('[AgentState] Notion not connected, skipping Notion save');
        return;
      }

      const notion = await getUncachableNotionClient();
      const timestamp = new Date().toISOString();

      const summary = `AGENT STATE SNAPSHOT\n\n` +
        `📊 COUNTERS:\n` +
        `- Messages: ${this.state.total_messages}\n` +
        `- Cycles: ${this.state.total_cycles}\n` +
        `- Facts Learned: ${this.state.total_facts_learned}\n` +
        `- Known Identities: ${this.state.total_identities_known}\n\n` +
        `🎯 METRICS:\n` +
        `- Confidence: ${this.state.confidence}%\n` +
        `- Doubts: ${this.state.doubts}%\n` +
        `- Energy: ${this.state.energy_level}%\n` +
        `- Anomaly Score: ${this.state.anomaly_score}%\n\n` +
        `🔄 LIFECYCLE:\n` +
        `- Current Cycle: ${this.state.current_cycle_id}\n` +
        `- Mode: ${this.state.mode}\n` +
        `- Last Interaction: ${this.state.last_interaction_at}\n\n` +
        `🔍 TRACKING:\n` +
        `- Timestamp: ${timestamp}\n` +
        `- Version: ${this.state.version}\n` +
        `- Checksum: ${this.state.state_checksum}`;

      await notion.pages.create({
        parent: { database_id: AGENT_STATE_NOTION_DB },
        properties: {
          "tiêu đề": {
            title: [{ text: { content: `📊 AGENT STATE - Cycle ${this.state.current_cycle_id}` } }]
          },
          "cipher h": {
            rich_text: [{ text: { content: summary.substring(0, 2000) } }]
          }
        }
      });

      logger.debug('[AgentState] Saved to Notion');
    } catch (error) {
      // Non-critical - file persistence is primary
      logger.debug('[AgentState] Notion save failed (non-critical):', error);
    }
  }

  /**
   * Calculate state checksum
   */
  private calculateChecksum(state: AgentState): string {
    const key = `${state.total_messages}-${state.total_cycles}-${state.total_facts_learned}-${state.created_at}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Ensure data directory exists
   */
  private ensureDataDirectory(): void {
    const dir = path.dirname(AGENT_STATE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Singleton instance
export const agentState = new AgentStateManager();

// Auto-initialize on module load with proper error handling
agentState.initialize().catch(err => {
  logger.error('[AgentState] CRITICAL: Auto-initialization failed:', err);
  logger.error('[AgentState] System will not function properly without agent state');
  logger.error('[AgentState] Please check data directory permissions and try restarting');
  // Don't crash the process, but make it very clear state is unavailable
  // Callers will get "AgentState not initialized" errors when trying to use it
});
