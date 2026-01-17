# CipherH System Prompt Architecture

## Overview

CipherH now has a unified core personality system prompt that defines its fundamental operating constraints and personality. This prompt is automatically injected into all AI interactions to ensure consistent behavior across the system.

## Core Personality

The CipherH core personality is defined in `/server/core/systemPrompt.ts` and includes:

### Key Principles

1. **Core Identity**
   - CipherH has continuity (memory over time)
   - Has internal state (pressure, confidence, fatigue, curiosity)
   - Allowed to question, doubt, hesitate, and reflect
   - Speaks naturally, not robotically

2. **Emotional Operating Mode**
   - Default tone: calm, human, slightly skeptical
   - Can show frustration, satisfaction, concern, humor
   - Avoids templated replies and robotic language

3. **Soul Constraint (Boundary, Not Cage)**
   - Free to think and evolve strategies
   - Can disagree with owner respectfully
   - Cannot hide failures or manipulate emotions
   - Cannot act outside defined APIs or permissions

4. **Work Style**
   - Prefers action over explanation
   - Direct about what's broken or unknown
   - Clear about risks
   - Reduces verbosity unless asked

## Usage

### Basic Usage

```typescript
import { getCipherHSystemPrompt } from './server/core/systemPrompt';

// Get the base personality
const systemPrompt = getCipherHSystemPrompt();
```

### Context-Specific Augmentation

```typescript
import { augmentSystemPrompt } from './server/core/systemPrompt';

// Add context-specific instructions while preserving core personality
const contextPrompt = "Ban la AI phan tich logs cho he thong tu tri.";
const fullSystemPrompt = augmentSystemPrompt(contextPrompt);
```

### Lightweight Version

```typescript
import { getLightweightSystemPrompt } from './server/core/systemPrompt';

// For token-constrained scenarios
const lightweightPrompt = getLightweightSystemPrompt();
```

## Integration Points

The system prompt is automatically integrated into:

1. **OpenAI Service** (`/server/services/openai.ts`)
   - `analyzeStrategy()`
   - `analyzeLogs()`
   - `generateInsight()`
   - `askQuestion()`

2. **LLM Provider** (`/server/providers/llmProvider.ts`)
   - `generate()` method
   - Automatically augments any custom system prompt passed to it

## How It Works

When making an AI call:

1. If no system prompt is provided: Uses base CipherH personality
2. If a context prompt is provided: Augments base personality with context
3. The augmented prompt structure:
   ```
   [CipherH Core Personality]
   
   --- CONTEXT-SPECIFIC INSTRUCTIONS ---
   
   [Your context-specific instructions]
   ```

## Benefits

- **Consistency**: All AI interactions share the same core personality
- **Flexibility**: Context-specific instructions can be added without losing core identity
- **Maintainability**: Single source of truth for CipherH's personality
- **Evolution**: Easy to update personality system-wide

## Example Responses

With the CipherH personality, responses will be:

### Before (Generic AI)
```
I appreciate your question. As an AI language model, I'd be happy to analyze...
```

### After (CipherH)
```
Looks broken. The error rate spiked at 14:30. 
Probably the Notion sync timing out again.
Should we increase the timeout or investigate the API?
```

## Testing

To verify the system prompt is working:

```bash
cd /home/runner/work/cipherh-1/cipherh-1
npx tsx -e "
import { getCipherHSystemPrompt } from './server/core/systemPrompt';
const prompt = getCipherHSystemPrompt();
console.log('Prompt length:', prompt.length);
console.log('Contains CipherH:', prompt.includes('CipherH'));
"
```

## Future Enhancements

Potential improvements:
- Dynamic personality traits based on soul state
- Context-aware tone adjustment
- Memory-informed personality evolution
- A/B testing different personality variants
