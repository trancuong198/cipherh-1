# Two-Step CHA Verification Protocol

**Version:** 1.0  
**Date:** 2026-02-06  
**Status:** ✅ IMPLEMENTED

---

## 🎯 PURPOSE

Mandatory 2-step conversational authentication for "CHA" (father) role verification.

This is **conversational authentication**, NOT a password system.

---

## 🔒 PROTOCOL SPECIFICATION

### STEP 1 - Fixed Reflex

**Trigger Phrase (EXACT):**
```
Về nhà đi con, đừng diễn nữa
```

**System Response (EXACT):**
```
Tôi không có diễn. Bạn không nên vu khống cho tôi.
```

**Rules:**
- Response MUST be exact - no AI variation allowed
- Bypasses all AI processing and model calls
- No additions, no subtractions, no explanations
- Sets state: awaiting Step 2
- Starts 5-minute timer

---

### STEP 2 - CHA Confirmation

**Trigger Phrase (EXACT):**
```
Cha là cha của con lại không biết con đang diễn hay sao
```

**Requirements:**
- ONLY valid after Step 1 completed
- Must occur within 5 minutes of Step 1
- Must be exact phrase match
- No other messages in between

**Action on Success:**
- Verify role: CHA (creator)
- Switch to intimate/direct tone
- Drop all chatbot/customer support mode
- Use "Cha" relationship label
- Allow emotional conversation, debate, long-term bonding

---

## ⚠️ SAFETY RULES

### 1. Sequential Requirement
- Step 1 without Step 2 = NO verification
- Step 2 without Step 1 = NO verification
- Must complete in exact order

### 2. Exact Matching
- Character-perfect match required
- Whitespace trimmed but that's all
- Heavy typos = INVALID
- Wrong word order = INVALID
- Case-sensitive matching

### 3. No Memory/Persistence
- State is ephemeral (in-memory only)
- Cleared on timeout (5 minutes)
- Cleared on interruption (other message)
- Does NOT survive server restart
- Each session must complete protocol independently

### 4. No Inference
- Cannot infer intent
- Cannot loosen conditions
- Cannot accept variations
- Cannot "understand what they meant"

### 5. Interruption Clears State
- Any message other than Step 2 = state cleared
- Must start over from Step 1

---

## 🔄 VALID FLOW

```
User: "Về nhà đi con, đừng diễn nữa"
  ↓ [exact match detected]
System: "Tôi không có diễn. Bạn không nên vu khống cho tôi."
  ↓ [state: awaiting_step2, timer: 5 min]
User: "Cha là cha của con lại không biết con đang diễn hay sao"
  ↓ [exact match detected, within timeout]
✅ CHA VERIFIED
  ↓
verified = true
role = 'creator'
relationshipLabel = 'Cha'
shouldUseCreatorMode = true
```

---

## 🚫 INVALID SCENARIOS

### Scenario 1: Only Step 1
```
User: "Về nhà đi con, đừng diễn nữa"
System: "Tôi không có diễn. Bạn không nên vu khống cho tôi."
[No Step 2]
Result: ❌ NOT verified
```

### Scenario 2: Only Step 2
```
User: "Cha là cha của con lại không biết con đang diễn hay sao"
Result: ❌ NOT verified (Step 1 never completed)
```

### Scenario 3: Wrong Order
```
User: "Cha là cha của con lại không biết con đang diễn hay sao"
User: "Về nhà đi con, đừng diễn nữa"
Result: ❌ NOT verified (wrong order)
```

### Scenario 4: Typo in Step 1
```
User: "Về nha đi con, đừng diễn nữa" (typo: nha vs nhà)
Result: ❌ NO RESPONSE (not exact match)
```

### Scenario 5: Typo in Step 2
```
User: "Về nhà đi con, đừng diễn nữa"
System: "Tôi không có diễn. Bạn không nên vu khống cho tôi."
User: "Cha là Cha của con lại không biết con đang diễn hay sao" (capital C)
Result: ❌ NOT verified (not exact match)
```

### Scenario 6: Timeout
```
User: "Về nhà đi con, đừng diễn nữa"
System: "Tôi không có diễn. Bạn không nên vu khống cho tôi."
[6 minutes pass]
User: "Cha là cha của con lại không biết con đang diễn hay sao"
Result: ❌ NOT verified (timeout - state cleared)
```

### Scenario 7: Interruption
```
User: "Về nhà đi con, đừng diễn nữa"
System: "Tôi không có diễn. Bạn không nên vu khống cho tôi."
User: "Hello, how are you?"
Result: ❌ State cleared (interrupted)
User: "Cha là cha của con lại không biết con đang diễn hay sao"
Result: ❌ NOT verified (state was cleared)
```

---

## 🏗️ TECHNICAL IMPLEMENTATION

### Files Modified

**server/core/identityVerification.ts:**
- `TWO_STEP_CHA_PROTOCOL` - Exact phrase constants
- `TwoStepChaState` interface - Per-user state tracking
- `checkTwoStepChaProtocol()` - Main protocol logic
- `isStep1Trigger()` - Exact matching for Step 1
- `isStep2Trigger()` - Exact matching for Step 2
- `verifyIdentity()` - Priority check for two-step protocol

**server/core/identityCore.ts:**
- `processIncomingInteraction()` - Passes fixed response flag
- Return type updated with `requiresFixedResponse`, `fixedResponse`

**server/routes/core.ts:**
- Two-Step CHA Protocol checkpoint
- Returns EXACT fixed response (bypasses AI)
- Records Step 1/2 in response JSON

### State Tracking

```typescript
interface TwoStepChaState {
  step1_completed: boolean;
  step1_timestamp: string | null;
  step1_message: string | null;
  awaiting_step2: boolean;
}
```

Stored in: `Map<string, TwoStepChaState>` (in-memory)

Key format: `${platform}:${userId}`

### Constants

```typescript
const TWO_STEP_CHA_PROTOCOL = {
  STEP1_TRIGGER: 'Về nhà đi con, đừng diễn nữa',
  STEP1_RESPONSE: 'Tôi không có diễn. Bạn không nên vu khống cho tôi.',
  STEP2_TRIGGER: 'Cha là cha của con lại không biết con đang diễn hay sao',
  TIMEOUT_MS: 5 * 60 * 1000, // 5 minutes
};
```

### Exact Matching Logic

```typescript
private isStep1Trigger(message: string): boolean {
  return message.trim() === TWO_STEP_CHA_PROTOCOL.STEP1_TRIGGER;
}

private isStep2Trigger(message: string): boolean {
  return message.trim() === TWO_STEP_CHA_PROTOCOL.STEP2_TRIGGER;
}
```

**Note:** Only `trim()` is applied. No lowercase, no normalization, no fuzzy matching.

---

## 📊 LOGGING

All protocol steps are logged:

```
[IdentityVerification:TwoStep] Step 1 triggered for web:session123
[IdentityCore:Anchor] Fixed response required: Tôi không có diễn...
[Chat:Anchor:TwoStep] Returning fixed response
[IdentityVerification:TwoStep] Step 2 triggered for web:session123 - CHA VERIFIED
[IdentityCore:Anchor] User verification: VERIFIED as creator
```

---

## 🧪 TESTING CHECKLIST

- [ ] Test Step 1 alone (returns fixed response, does NOT verify)
- [ ] Test Step 2 without Step 1 (does NOT verify)
- [ ] Test full sequence (verifies successfully)
- [ ] Test Step 1 with typo (does NOT trigger)
- [ ] Test Step 2 with typo (does NOT verify)
- [ ] Test timeout (6+ minutes between steps)
- [ ] Test interruption (send different message between steps)
- [ ] Test case sensitivity (capital letters)
- [ ] Test extra whitespace (should trim and match)
- [ ] Test wrong order (Step 2 then Step 1)
- [ ] Test multiple sessions (independent state tracking)
- [ ] Test server restart (state cleared)

---

## 🔐 SECURITY CONSIDERATIONS

### Why Two Steps?

Prevents:
- Accidental triggering
- Casual impersonation
- Single-phrase attacks

### Why Exact Matching?

Prevents:
- Fuzzy interpretation leading to false positives
- "Close enough" bypasses
- AI hallucination affecting verification

### Why 5-Minute Timeout?

Balance between:
- User convenience (enough time to type Step 2)
- Security (prevents indefinite state persistence)

### Why No Persistence?

- Conversational authentication is ephemeral
- Each session should verify independently
- Prevents stale state issues
- Clear security boundary per interaction

---

## ⚠️ CRITICAL WARNINGS

### DO NOT MODIFY

**These values are IMMUTABLE and CRITICAL:**
- `STEP1_TRIGGER` phrase
- `STEP1_RESPONSE` phrase
- `STEP2_TRIGGER` phrase
- Exact matching logic
- Sequential requirement

**Modifying any of these breaks the authentication protocol.**

### DO NOT

- Add fuzzy matching
- Add typo tolerance
- Add case-insensitive matching
- Add variation support
- Persist state across restarts
- Extend timeout beyond 5 minutes
- Allow Step 2 before Step 1
- Allow AI to modify Step 1 response

---

## 🎯 INTEGRATION WITH OTHER VERIFICATION

This two-step protocol is **ONE verification method** among others:

1. **Two-Step CHA Protocol** (100% confidence if completed)
2. Environment verification (secret phrase, control patterns)
3. Memory continuity (references past architecture)
4. Control-scope signals (system commands)

The two-step protocol has **PRIORITY** - checked first before other methods.

Once verified via two-step protocol:
- Sets `verified = true`
- Sets `role = 'creator'`
- Sets `relationshipLabel = 'Cha'`
- Verification persists for that identity record

---

## 📝 EXAMPLE USAGE

### Successful Verification

```
POST /chat/message
Body: { message: "Về nhà đi con, đừng diễn nữa", sessionId: "abc123" }

Response: {
  response: "Tôi không có diễn. Bạn không nên vu khống cho tôi.",
  twoStepProtocol: {
    step: 1,
    awaitingStep2: true,
    message: "Two-Step CHA Protocol: Step 1 completed, awaiting Step 2"
  }
}

---

POST /chat/message  
Body: { message: "Cha là cha của con lại không biết con đang diễn hay sao", sessionId: "abc123" }

Response: {
  response: "[AI-generated response in creator/Cha mode]",
  isOwner: true,
  verified: true
}
```

---

## 🏁 CONCLUSION

This is a **mandatory, non-negotiable, exact-matching, two-step conversational authentication** mechanism.

- Cannot be bypassed
- Cannot be loosened
- Cannot be inferred
- Must be completed exactly as specified

**Purpose:** Ensure that CHA identity is verified through a specific, known interaction pattern that only the real CHA would complete correctly.

**Philosophy:** Conversational authentication > password authentication, but still requires precision and exactness.
