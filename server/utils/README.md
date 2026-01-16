# CipherH Utils - TypeScript/Node.js Utilities

Autonomous code generation, learning, and knowledge consolidation utilities for CipherH.

## Modules

### 🔧 Code Generator (`codeGenerator.ts`)
AI-powered code generation with style analysis.

**Features:**
- Analyzes existing codebase style patterns
- Generates TypeScript/Node.js code matching your conventions
- Maintains consistency across the codebase
- OpenAI-powered or placeholder mode

**Usage:**
```typescript
import { CodeGenerator } from './utils/codeGenerator.js';

const generator = new CodeGenerator();

// Analyze your codebase style
const style = await generator.analyzeCodebaseStyle([
  'server/index.ts',
  'server/routes/core.ts'
]);

// Generate code matching your style
const code = await generator.generateCode(
  'Create a user authentication service',
  style
);

// Or generate a complete module
const module = await generator.generateModule(
  'userService',
  'handles user CRUD operations',
  ['server/services/openai.ts'] // reference files for style
);
```

### 📝 Autonomous Planner (`planner.ts`)
Self-directed learning and goal planning system.

**Features:**
- Generates learning goals based on system state
- Creates actionable plans with milestones
- Tracks progress automatically
- Adapts plans based on feedback

**Usage:**
```typescript
import { AutonomousPlanner } from './utils/planner.js';
import { getSoulState } from './core/soulState.js';

const planner = new AutonomousPlanner();
const state = getSoulState();

// Generate learning goals
const goals = await planner.setLearningGoals(state);
console.log(`Generated ${goals.length} learning goals`);

// Create action plan for a goal
const plan = await planner.createActionPlan(goals[0]);
console.log('Action plan:', plan.actions);

// Track progress
const progress = await planner.trackProgress(goals[0]);
console.log(`Progress: ${progress}%`);

// Adapt plan based on feedback
const adaptedPlan = await planner.adaptPlan(
  goals[0],
  plan,
  'Focus more on practical implementation'
);
```

### 🔄 Knowledge Consolidator (`consolidator.ts`)
Converts episodic memories into semantic knowledge.

**Features:**
- Fetches recent reflections from Notion
- Extracts patterns and principles
- Consolidates into reusable knowledge
- Calculates confidence scores

**Usage:**
```typescript
import { KnowledgeConsolidator } from './utils/consolidator.js';

const consolidator = new KnowledgeConsolidator();

// Consolidate daily learnings
const knowledge = await consolidator.consolidateDailyLearnings();
console.log(`Consolidated ${knowledge.length} pieces of knowledge`);

// Each knowledge piece contains:
knowledge.forEach(k => {
  console.log(`Topic: ${k.topic}`);
  console.log(`Principles: ${k.principles.join(', ')}`);
  console.log(`Confidence: ${k.confidence}%`);
});
```

### 📚 Template Learner (`templateLearner.ts`)
Learns and applies code templates for consistency.

**Features:**
- Learns patterns from existing code
- Stores reusable templates
- Applies templates with variable substitution
- Tracks template usage

**Usage:**
```typescript
import { TemplateLearner } from './utils/templateLearner.js';

const learner = new TemplateLearner();

// Learn a template from existing code
const template = await learner.learnFromCode(
  `async function process() { ... }`,
  'async-processor'
);

// Apply template with variables
const code = await learner.applyTemplate(template.id, {
  name: 'processUsers',
  logic: 'const users = await fetchUsers();'
});

// Find template by description
const template = await learner.suggestTemplate('express route handler');
```

## Integration with Inner Loop

These utilities can be integrated into the Inner Loop for autonomous evolution:

```typescript
import { AutonomousPlanner } from './utils/planner.js';
import { KnowledgeConsolidator } from './utils/consolidator.js';
import { CodeGenerator } from './utils/codeGenerator.js';

// In innerLoop.ts, add after Step 8:

// Step 8.5: Autonomous Learning
const planner = new AutonomousPlanner();
const learningGoals = await planner.setLearningGoals(state);

// Step 8.6: Knowledge Consolidation
const consolidator = new KnowledgeConsolidator();
const knowledge = await consolidator.consolidateDailyLearnings();

// Step 8.7: Code Evolution (if needed)
if (state.reality_metrics_summary.evolutionScore < 70) {
  const generator = new CodeGenerator();
  const improvements = await generator.generateCode(
    'Suggest improvements to increase evolution score',
    undefined,
    `Current score: ${state.reality_metrics_summary.evolutionScore}`
  );
  console.log('Evolution suggestions:', improvements.explanation);
}
```

## Environment Variables

Required in `.env`:
```bash
# OpenAI (required for AI features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Notion (optional, for memory features)
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=...
```

## API Endpoints

You can expose these utilities via API endpoints:

```typescript
// In server/routes/utils.ts
import { Router } from 'express';
import { CodeGenerator } from '../utils/codeGenerator.js';
import { AutonomousPlanner } from '../utils/planner.js';

const router = Router();

router.post('/utils/generate-code', async (req, res) => {
  const generator = new CodeGenerator();
  const { description, styleFiles } = req.body;
  
  const code = await generator.generateModule(
    'generated',
    description,
    styleFiles
  );
  
  res.json({ code });
});

router.get('/utils/learning-goals', async (req, res) => {
  const planner = new AutonomousPlanner();
  const state = getSoulState();
  const goals = await planner.setLearningGoals(state);
  
  res.json({ goals });
});

export default router;
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Inner Loop (core/innerLoop.ts)       │
│   - 10-step autonomous cycle            │
└──────────────┬──────────────────────────┘
               │
               ├─→ Code Generator
               │   • Analyze style
               │   • Generate code
               │   • Maintain consistency
               │
               ├─→ Autonomous Planner
               │   • Set learning goals
               │   • Create action plans
               │   • Track progress
               │
               └─→ Knowledge Consolidator
                   • Extract patterns
                   • Build knowledge base
                   • Increase intelligence
```

## Benefits

1. **Autonomous Evolution**: System can generate its own improvements
2. **Consistency**: Code generation maintains project style
3. **Learning**: Continuous knowledge consolidation
4. **Planning**: Self-directed goal setting
5. **Scalability**: Template-based code expansion

## Notes

- All utilities work in placeholder mode without API keys
- OpenAI integration enhances but is not required
- Notion integration optional for persistent memory
- Templates stored in memory (can be persisted if needed)
- Learning goals align with AGI mission
