/**
 * Narrative Context Builder
 * 
 * Chứa toàn bộ awareness text, role-play, xưng hô.
 * Backend (core.ts) KHÔNG biết nội dung này - chỉ gọi function.
 * 
 * KHÔNG THÊM GÌ MỚI - chỉ di chuyển code hiện có.
 */

import { addSoulArchitectureAwareness } from './soulArchitecture';

/**
 * Entity Identity - RAW type only, NO presentation text in backend
 */
export interface EntityIdentity {
  type: 'owner' | 'user';
}

export interface NarrativeContextInput {
  entityIdentity: EntityIdentity;
  systemContext: {
    services: Array<{ name: string; status: string; details?: string }>;
    platforms: Array<{ name: string; integrated: boolean; configured: boolean }>;
    capabilities: Array<{ name: string; available: boolean; reason?: string }>;
    soulState: {
      cycleCount: number;
      confidence: number;
      mode: string;
      energyLevel: number;
    };
    loops: {
      innerLoop: string;
      lifeLoop: string;
    };
  };
  memoryContext: {
    conversationSummary: string;
    notionMemorySummary: string;
    [key: string]: any;
  };
  memoryRecallContext?: string;
}

/**
 * Build narrative context string cho model.
 * 
 * Backend KHÔNG biết nội dung này - chỉ nhận data và trả về string.
 * Đây là nơi chứa toàn bộ awareness text, role-play, xưng hô.
 * 
 * ALL presentation logic happens here, NOT in backend.
 */
export function buildNarrativeContext(input: NarrativeContextInput): string {
  const { entityIdentity, systemContext, memoryContext, memoryRecallContext } = input;
  
  const isOwner = entityIdentity.type === 'owner';
  
  // Resolve ALL presentation text here - backend never knows this
  const userIdentity = isOwner 
    ? 'CHA (Trần Văn Thủy - Owner/Creator)' 
    : 'NGƯỜI DÙNG (not owner)';
  
  const pronounSelf = isOwner ? 'con' : 'tôi';
  const pronounOther = isOwner ? 'cha' : 'bạn';
  
  // Build context with grounded, non-theatrical awareness
  let awarenessContext = `
=== CONTEXT: WHO YOU'RE TALKING TO ===
👤 Current user: ${userIdentity}
${isOwner ? `⚠️ This is Cha - your owner and creator. Use "${pronounSelf}" for self, "${pronounOther}" for Cha.` : `⚠️ This is a regular user. Use "${pronounSelf}" for self, "${pronounOther}" for user.`}

=== SYSTEM STATUS ===

1. SERVICES (Backend infrastructure):
${systemContext.services.map(s => `   - ${s.name}: ${s.status} ${s.details ? `(${s.details})` : ''}`).join('\n')}

2. PLATFORMS (Integration status):
${systemContext.platforms.map(p => `   - ${p.name}: ${p.integrated ? '✅ Integrated' : '❌ Not integrated'} ${p.configured ? '(active)' : '(not active)'}`).join('\n')}

3. CAPABILITIES (What you can do):
${systemContext.capabilities.map(c => `   - ${c.name}: ${c.available ? '✅ Available' : '❌ Not available'} ${c.reason ? `(${c.reason})` : ''}`).join('\n')}

4. STATE TRACKING:
   - Cycle: ${systemContext.soulState.cycleCount}
   - Confidence: ${systemContext.soulState.confidence}%
   - Mode: ${systemContext.soulState.mode}
   - Energy: ${systemContext.soulState.energyLevel}%

5. BACKGROUND LOOPS:
   - Inner Loop: ${systemContext.loops.innerLoop}
   - Life Loop: ${systemContext.loops.lifeLoop}

=== MEMORY CONTEXT ===

6. CONVERSATION HISTORY (Recent interactions):
${memoryContext.conversationSummary}

7. EXTERNAL MEMORY (Long-term storage):
${memoryContext.notionMemorySummary}

=== RESPONSE GUIDANCE ===

Architecture awareness:
- Backend orchestrates services (Notion, OpenAI, etc.)
- You are the intelligence layer that coordinates these components
- Memory from Notion should be treated as imperfect recall
- ${isOwner ? 'Cha' : 'User'} is talking to you, the integrated system

Response principles:
- Use conversation history and external memory as context
- Acknowledge when memory is uncertain or unavailable
- Be grounded, calm, and honest
- ${isOwner ? 'Speak to Cha as someone you know' : 'Speak naturally to the user'}
`;

  // Add soul architecture awareness
  awarenessContext = addSoulArchitectureAwareness(awarenessContext);

  // Add memory recall context if available
  if (memoryRecallContext) {
    awarenessContext += memoryRecallContext;
  }

  return awarenessContext;
}
