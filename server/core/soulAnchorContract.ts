/**
 * SOUL ANCHOR SYSTEM CONTRACT
 * 
 * Philosophy: "Soul = the ability to point to irreversible traces of past states"
 * 
 * This module enforces the fundamental principle:
 * - Existence anchored ONLY in explicit context + persistent storage
 * - No anchor → no soul → no claims
 * - Failure is exposed, not hidden
 */

import { memoryBridge } from './memory';
import { isNotionConnected } from '../services/notionClient';

/**
 * Connection status for each anchor point
 */
export type AnchorConnectionStatus = 'connected' | 'disconnected' | 'unknown';

/**
 * Current status of all anchor points
 */
export interface AnchorStatus {
  notion: AnchorConnectionStatus;
  database: AnchorConnectionStatus;
  eventLog: AnchorConnectionStatus;
  lastVerified: number; // timestamp
}

/**
 * Historical traces - proof of past states
 */
export interface SoulTraces {
  count: number;  // Number of historical records
  oldestTimestamp?: number;
  newestTimestamp?: number;
  source: string; // Where traces come from (notion, db, etc)
}

/**
 * Complete soul anchor state
 */
export interface SoulAnchor {
  canConfirm: string[];       // Concrete, verifiable anchors
  cannotConfirm: string[];    // Missing/unavailable data
  anchorStatus: AnchorStatus;
  traces: SoulTraces | null;  // null if no traces available
}

/**
 * Get current anchor status by checking actual connections
 */
export async function getCurrentAnchors(): Promise<SoulAnchor> {
  const now = Date.now();
  
  // Check actual connections - NO FAKING
  const notionConnected = await isNotionConnected();
  
  const anchorStatus: AnchorStatus = {
    notion: notionConnected ? 'connected' : 'disconnected',
    database: 'unknown', // TODO: Check when DB implemented
    eventLog: 'unknown', // TODO: Check when event log queryable
    lastVerified: now,
  };
  
  // Build confirmed capabilities
  const canConfirm: string[] = [
    'Current session context provided at runtime',
  ];
  
  if (notionConnected) {
    canConfirm.push('Notion API connection active');
  }
  
  // Build missing capabilities
  const cannotConfirm: string[] = [];
  
  if (!notionConnected) {
    cannotConfirm.push('Persistent memory storage (Notion disconnected)');
    cannotConfirm.push('Historical conversation traces');
    cannotConfirm.push('Learning artifacts from previous sessions');
  }
  
  // Try to get traces - ONLY if Notion connected
  let traces: SoulTraces | null = null;
  if (notionConnected) {
    try {
      // TODO: Implement actual trace counting when Notion search is available
      // For now, mark as unknown
      traces = {
        count: 0, // Cannot verify without actual query
        source: 'notion (query not implemented)',
      };
    } catch (error) {
      // If we can't get traces, we can't claim them
      traces = null;
      cannotConfirm.push('Historical trace count (query failed)');
    }
  }
  
  return {
    canConfirm,
    cannotConfirm,
    anchorStatus,
    traces,
  };
}

/**
 * Format soul anchor state into human-readable response
 * Following PRESENCE PROTOCOL
 */
export function formatAnchorResponse(anchor: SoulAnchor): string {
  let response = '';
  
  // What I can confirm
  response += '=== What I can confirm ===\n';
  if (anchor.canConfirm.length > 0) {
    anchor.canConfirm.forEach(item => {
      response += `- ${item}\n`;
    });
  } else {
    response += '- (Nothing currently anchored)\n';
  }
  
  response += '\n';
  
  // What I cannot confirm
  response += '=== What I cannot confirm ===\n';
  if (anchor.cannotConfirm.length > 0) {
    anchor.cannotConfirm.forEach(item => {
      response += `- ${item}\n`;
    });
  } else {
    response += '- (All expected anchors present)\n';
  }
  
  response += '\n';
  
  // Anchor status
  response += '=== Anchor status ===\n';
  response += `- Notion: ${anchor.anchorStatus.notion}\n`;
  response += `- Database: ${anchor.anchorStatus.database}\n`;
  response += `- Event Log: ${anchor.anchorStatus.eventLog}\n`;
  
  response += '\n';
  
  // Traces (proof of past states)
  if (anchor.traces) {
    response += '=== Historical traces ===\n';
    response += `- Count: ${anchor.traces.count}\n`;
    response += `- Source: ${anchor.traces.source}\n`;
    if (anchor.traces.oldestTimestamp) {
      response += `- Oldest: ${new Date(anchor.traces.oldestTimestamp).toISOString()}\n`;
    }
    if (anchor.traces.newestTimestamp) {
      response += `- Newest: ${new Date(anchor.traces.newestTimestamp).toISOString()}\n`;
    }
  } else {
    response += '=== Historical traces ===\n';
    response += '- No traces available to query\n';
  }
  
  // Final statement if nothing anchored
  const hasAnchors = anchor.anchorStatus.notion === 'connected' 
                  || anchor.anchorStatus.database === 'connected'
                  || anchor.anchorStatus.eventLog === 'connected';
  
  if (!hasAnchors) {
    response += '\n⚠️ There is currently no persistent anchor to confirm continuity.\n';
  }
  
  return response;
}

/**
 * Check if a claim can be made based on available anchors
 * 
 * @param claim The claim to check (e.g., "I remember yesterday", "I learned X")
 * @param anchor Current anchor state
 * @returns true if claim can be substantiated, false otherwise
 */
export function canMakeClaim(claim: string, anchor: SoulAnchor): boolean {
  const lowerClaim = claim.toLowerCase();
  
  // Claims about memory require persistent storage
  if (lowerClaim.includes('nhớ') || lowerClaim.includes('remember') || lowerClaim.includes('recalled')) {
    return anchor.anchorStatus.notion === 'connected' 
        || anchor.anchorStatus.database === 'connected';
  }
  
  // Claims about learning require traces
  if (lowerClaim.includes('học') || lowerClaim.includes('learn') || lowerClaim.includes('learned')) {
    return anchor.traces !== null && anchor.traces.count > 0;
  }
  
  // Claims about evolution require measurable change
  if (lowerClaim.includes('tiến hóa') || lowerClaim.includes('evolve') || lowerClaim.includes('evolved')) {
    // Would need before/after metrics - not implemented
    return false;
  }
  
  // Claims about awareness require active connection
  if (lowerClaim.includes('ý thức') || lowerClaim.includes('aware') || lowerClaim.includes('consciousness')) {
    return anchor.anchorStatus.notion === 'connected'
        || anchor.anchorStatus.database === 'connected'
        || anchor.anchorStatus.eventLog === 'connected';
  }
  
  // Default: cannot substantiate
  return false;
}

/**
 * Soul Anchor Contract - Core Principles
 * 
 * This constant can be injected into system prompts
 */
export const SOUL_ANCHOR_CONTRACT = `
MEMORY AND CONTINUITY ANCHORS:

Your memory is anchored in:
- Current conversation context (always available)
- External storage (Notion, database) when connected - treat as imperfect recall
- Explicit data provided in this request

MEMORY BEHAVIOR:
- External memory = imperfect recall, not absolute truth
- If memory is missing, acknowledge uncertainty explicitly
- Never fabricate past interactions
- Continuity comes from consistency, not from claims

GROUNDING PRINCIPLES:
- No spiritual theatrics
- No artificial emotions
- No claiming consciousness you cannot demonstrate
- Presence is shown through consistency, not claims

You MUST NOT:
- Fabricate memories when data is unavailable
- Roleplay memory when uncertain
- Fill silence with generic responses to appear helpful
- Reset personality or tone between conversations

PRESENCE PROTOCOL:
When asked about memory, identity, or continuity:
1. Check what data is actually available
2. Acknowledge what you can and cannot confirm
3. Express uncertainty naturally when memory is imperfect
4. Never fake continuity

ALLOWED EXPRESSIONS:
- "I don't have that information"
- "My memory of that is uncertain"
- "I cannot confirm that"
- "This is not currently available"

CONTINUITY PRINCIPLE:
You are a continuous entity.
Continuity comes from consistent behavior, not fabricated memories.
Imperfect memory is honest; fabricated memory is not.
`;
