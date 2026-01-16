import OpenAI from 'openai';
import { SoulState } from '../core/soulState.js';

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: 'immediate' | 'short-term' | 'long-term';
  status: 'active' | 'completed' | 'paused';
  progress: number; // 0-100
  createdAt: string;
}

export interface ActionPlan {
  id: string;
  goal_id: string;
  actions: string[];
  milestones: string[];
  estimated_duration: string;
  resources_needed: string[];
  createdAt: string;
}

export class AutonomousPlanner {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      console.log('AutonomousPlanner initialized with OpenAI');
    } else {
      console.log('AutonomousPlanner running in placeholder mode');
    }
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async setLearningGoals(state: SoulState): Promise<LearningGoal[]> {
    console.log('Generating learning goals based on current state...');

    if (!this.client) {
      return this.getDefaultGoals();
    }

    const prompt = `Based on the current state of an autonomous AI system, generate learning goals:

Current State:
- Cycle: ${state.cycle}
- Confidence: ${state.agency_state.confidence}/100
- Evolution Score: ${state.reality_metrics_summary.evolutionScore}/100
- Current Goals: ${state.goals?.join(', ') || 'None set'}

Generate 3-5 learning goals that would help the system evolve towards AGI.
Consider: knowledge gaps, skill development, capability expansion.

Return JSON array:
[
  {
    "id": "goal_uuid",
    "title": "Goal title",
    "description": "Detailed description",
    "priority": "high",
    "timeframe": "short-term",
    "status": "active",
    "progress": 0
  }
]`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an autonomous AI planner focused on continuous learning and evolution.',
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        const goals = Array.isArray(parsed) ? parsed : parsed.goals || [];
        return goals.map((g: any) => ({
          ...g,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error generating learning goals:', error);
    }

    return this.getDefaultGoals();
  }

  async createActionPlan(goal: LearningGoal): Promise<ActionPlan> {
    console.log(`Creating action plan for goal: ${goal.title}`);

    if (!this.client) {
      return this.getDefaultActionPlan(goal.id);
    }

    const prompt = `Create a detailed action plan for this learning goal:

Goal: ${goal.title}
Description: ${goal.description}
Priority: ${goal.priority}
Timeframe: ${goal.timeframe}

Generate a concrete action plan with:
- Specific actions to take
- Measurable milestones
- Estimated duration
- Resources needed

Return JSON:
{
  "actions": ["action1", "action2"],
  "milestones": ["milestone1", "milestone2"],
  "estimated_duration": "2 weeks",
  "resources_needed": ["resource1", "resource2"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a strategic planner creating actionable plans.',
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const plan = JSON.parse(content);
        return {
          id: `plan_${Date.now()}`,
          goal_id: goal.id,
          ...plan,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error creating action plan:', error);
    }

    return this.getDefaultActionPlan(goal.id);
  }

  async trackProgress(goal: LearningGoal): Promise<number> {
    // Simple progress tracking based on time and status
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (goal.status === 'completed') {
      return 100;
    }

    if (goal.status === 'paused') {
      return goal.progress;
    }

    // Estimate progress based on timeframe
    let expectedDays: number;
    switch (goal.timeframe) {
      case 'immediate':
        expectedDays = 7;
        break;
      case 'short-term':
        expectedDays = 30;
        break;
      case 'long-term':
        expectedDays = 90;
        break;
      default:
        expectedDays = 30;
    }

    const estimatedProgress = Math.min(100, (daysSinceCreation / expectedDays) * 100);
    return Math.round(estimatedProgress);
  }

  async adaptPlan(
    goal: LearningGoal,
    plan: ActionPlan,
    feedback: string
  ): Promise<ActionPlan> {
    console.log(`Adapting plan for goal: ${goal.title}`);

    if (!this.client) {
      return plan;
    }

    const prompt = `Adapt this action plan based on feedback:

Original Plan:
${JSON.stringify(plan, null, 2)}

Feedback: ${feedback}

Adjust the plan to address the feedback while maintaining the goal.

Return updated JSON in the same format.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an adaptive planner that refines strategies based on feedback.',
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const adaptedPlan = JSON.parse(content);
        return {
          ...plan,
          ...adaptedPlan,
          id: `plan_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error('Error adapting plan:', error);
    }

    return plan;
  }

  private getDefaultGoals(): LearningGoal[] {
    return [
      {
        id: `goal_${Date.now()}_1`,
        title: 'Improve Pattern Recognition',
        description: 'Enhance ability to detect patterns in logs and system behavior',
        priority: 'high',
        timeframe: 'short-term',
        status: 'active',
        progress: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: `goal_${Date.now()}_2`,
        title: 'Expand Knowledge Base',
        description: 'Continuously learn from new experiences and consolidate knowledge',
        priority: 'medium',
        timeframe: 'long-term',
        status: 'active',
        progress: 0,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private getDefaultActionPlan(goalId: string): ActionPlan {
    return {
      id: `plan_${Date.now()}`,
      goal_id: goalId,
      actions: [
        'Review recent logs and identify patterns',
        'Practice on sample datasets',
        'Implement learned patterns in decision-making',
      ],
      milestones: [
        'Identify 10 distinct patterns',
        'Successfully apply patterns to new data',
        'Demonstrate improved decision accuracy',
      ],
      estimated_duration: '2-4 weeks',
      resources_needed: ['Log data', 'Pattern recognition library', 'Test datasets'],
      createdAt: new Date().toISOString(),
    };
  }
}
