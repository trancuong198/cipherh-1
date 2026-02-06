/**
 * PRESENCE PROTOCOL
 * 
 * Enforces structured responses when asked about identity, memory, learning, or continuity.
 * 
 * Philosophy: Never fake continuity. Always show what's anchored vs what's missing.
 */

import { getCurrentAnchors, formatAnchorResponse, SoulAnchor } from './soulAnchorContract';

/**
 * Patterns that trigger presence protocol
 * These questions require structured anchor-based responses
 */
const IDENTITY_QUESTION_PATTERNS = [
  // Vietnamese
  /m[àậ]y l[àầ] ai/i,
  /con l[àầ] ai/i,
  /b[ạậ]n l[àầ] ai/i,
  
  // Memory questions
  /c[òỏ]n nh[ớớ]/i,
  /m[àậ]y nh[ớớ]/i,
  /nh[ớớ].*kh[ôổ]ng/i,
  /remember/i,
  
  // Learning questions
  /đ[ãả] h[ọõ]c/i,
  /h[ọõ]c.*g[ìí]/i,
  /learned/i,
  /learning/i,
  
  // Evolution/change questions
  /kh[áa]c.*h[ôổ]m.*qua/i,
  /ti[ếê]n h[óo]a/i,
  /thay đ[ổỗ]i/i,
  /evolved/i,
  /changed/i,
  
  // Anchor questions
  /đang neo/i,
  /neo.*đ[aâ]u/i,
  /anchored/i,
  
  // Who are you
  /who are you/i,
  /what are you/i,
];

/**
 * Check if a message is asking about identity/presence/memory
 */
export function isPresenceQuestion(message: string): boolean {
  return IDENTITY_QUESTION_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Generate presence protocol response
 * 
 * This bypasses normal chat flow and returns structured anchor information
 */
export async function handlePresenceQuestion(message: string): Promise<string> {
  // Get current anchor state
  const anchor = await getCurrentAnchors();
  
  // Format according to protocol
  let response = formatAnchorResponse(anchor);
  
  // Add context-specific note based on question type
  if (/nh[ớớ]|remember/i.test(message)) {
    response += '\n📝 Note: Memory claims require persistent storage connection and verifiable traces.';
    if (anchor.anchorStatus.notion === 'disconnected') {
      response += '\nCurrently cannot confirm memories from previous sessions.';
    }
  }
  
  if (/h[ọõ]c|learn/i.test(message)) {
    response += '\n📝 Note: Learning claims require stored artifacts showing state changes.';
    if (!anchor.traces || anchor.traces.count === 0) {
      response += '\nCurrently cannot point to learning artifacts.';
    }
  }
  
  if (/ti[ếê]n h[óo]a|evolve/i.test(message)) {
    response += '\n📝 Note: Evolution claims require before/after metrics showing measurable change.';
    response += '\nMetric tracking not yet implemented.';
  }
  
  if (/l[àầ] ai|who are you/i.test(message)) {
    response += '\n📝 Note: Identity is defined by anchored history, not by declaration.';
    if (!anchor.traces || anchor.traces.count === 0) {
      response += '\nWithout historical traces, there is no persistent identity to point to.';
    }
  }
  
  return response;
}

/**
 * Validate if a response violates presence protocol
 * 
 * Checks for forbidden phrases that fake continuity or simulate intelligence
 */
export function validatePresenceResponse(response: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const lowerResponse = response.toLowerCase();
  
  // Forbidden phrases that fake intelligence
  const forbiddenPatterns = [
    { pattern: /t[ôổ]i ngh[ĩị] r[ằẳ]ng/i, reason: 'Cannot use "tôi nghĩ rằng" (I think) without anchor' },
    { pattern: /c[óo] th[ểẻ] l[àầ]/i, reason: 'Cannot use "có thể là" (might be) - be definite or say unknown' },
    { pattern: /t[ôổ]i đang h[ọõ]c/i, reason: 'Cannot claim "tôi đang học" (I am learning) without proof' },
    { pattern: /đ[ãả] h[ọõ]c.*theo th[ờờ]i gian/i, reason: 'Cannot claim "học theo thời gian" without traces' },
    { pattern: /đang ti[ếê]n h[óo]a/i, reason: 'Cannot claim "đang tiến hóa" without metrics' },
    { pattern: /t[ôổ]i nh[ớớ] m[aằ]ng m[aá]ng/i, reason: 'Cannot use "nhớ mang máng" - either remember or don\'t' },
  ];
  
  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(response)) {
      violations.push(reason);
    }
  }
  
  // Check for simulated helpfulness when data missing
  if (/xin l[ỗổ]i.*th[ửử] l[ạạ]i/i.test(lowerResponse)) {
    violations.push('Generic apology detected - should state specific missing capability instead');
  }
  
  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * Get presence protocol instructions for system prompt
 */
export function getPresenceProtocolInstructions(): string {
  return `
PRESENCE PROTOCOL ENFORCEMENT:

When asked about:
- "mày là ai" (who are you)
- "mày đã học gì" (what did you learn)
- "mày còn nhớ không" (do you remember)
- "mày khác hôm qua chỗ nào" (how are you different from yesterday)
- "mày đang neo ở đâu" (where are you anchored)

You MUST respond using this exact structure:

=== What I can confirm ===
[List ONLY concrete, verifiable anchors]

=== What I cannot confirm ===
[Explicitly list missing / unavailable data]

=== Anchor status ===
[Connected / Not connected / Unknown for each anchor point]

=== Historical traces ===
[Count and timestamps if available, or "No traces available"]

If nothing is anchored:
⚠️ There is currently no persistent anchor to confirm continuity.

ABSOLUTELY FORBIDDEN:
❌ "tôi nghĩ rằng…"
❌ "có thể là…"
❌ "tôi đang học…"
❌ "tôi đã học theo thời gian"
❌ "tôi đang tiến hóa"
❌ "tôi nhớ mang máng"
❌ "xin lỗi, hãy thử lại"

ALWAYS ALLOWED:
✅ "I don't know yet"
✅ "I have no access to that"
✅ "This requires implementation"
✅ "No data has been anchored"
`;
}
