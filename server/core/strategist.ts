import { AnalysisResult } from './analyzer.js';
import { SoulState } from './soulState.js';
import { generateStrategy } from '../services/openai.js';
import { randomUUID } from 'crypto';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  schedule: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Strategy {
  id: string;
  title: string;
  description: string;
  actions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  createdAt: string;
  basedOn: {
    anomalyScore: number;
    keyInsights: string[];
  };
}

export async function generateWeeklyTasks(
  state: SoulState,
  analysis: AnalysisResult
): Promise<Task[]> {
  const tasks: Task[] = [];
  
  // Generate tasks based on anomalies
  if (analysis.anomalies.length > 0) {
    tasks.push({
      id: `task_${randomUUID()}`,
      title: 'Investigate Anomalies',
      description: `Review and address detected anomalies: ${analysis.anomalies.join(', ')}`,
      priority: 'high',
      schedule: 'weekly',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }
  
  // Generate tasks based on confidence
  if (state.agency_state.confidence < 50) {
    tasks.push({
      id: `task_${randomUUID()}`,
      title: 'Boost Confidence',
      description: 'Implement measures to improve system confidence',
      priority: 'medium',
      schedule: 'weekly',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }
  
  // Regular maintenance task
  tasks.push({
    id: `task_${randomUUID()}`,
    title: 'System Optimization',
    description: 'Review and optimize system performance',
    priority: 'low',
    schedule: 'weekly',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  
  return tasks;
}

export async function generateMonthlyPlan(
  state: SoulState,
  analysis: AnalysisResult
): Promise<Task[]> {
  const tasks: Task[] = [];
  
  // Long-term improvement task
  tasks.push({
    id: `task_${randomUUID()}`,
    title: 'Evolution Assessment',
    description: 'Evaluate system evolution and progress towards goals',
    priority: 'medium',
    schedule: 'monthly',
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  
  // Strategic planning task
  if (state.reality_metrics_summary.evolutionScore < 80) {
    tasks.push({
      id: `task_${randomUUID()}`,
      title: 'Evolution Enhancement',
      description: 'Develop strategies to improve evolution score',
      priority: 'high',
      schedule: 'monthly',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
  }
  
  return tasks;
}

export async function createStrategy(
  state: SoulState,
  analysis: AnalysisResult
): Promise<Strategy> {
  console.log('Generating strategy...');
  
  // Try to use OpenAI for strategy generation
  let description: string;
  let actions: string[];
  
  try {
    const aiStrategy = await generateStrategy(state, analysis);
    description = aiStrategy.description;
    actions = aiStrategy.actions;
  } catch (error) {
    console.log('OpenAI unavailable, using rule-based strategy');
    description = generateRuleBasedStrategy(state, analysis);
    actions = generateRuleBasedActions(state, analysis);
  }
  
  // Determine priority based on anomaly score
  let priority: 'critical' | 'high' | 'medium' | 'low';
  if (analysis.anomalyScore > 0.7) {
    priority = 'critical';
  } else if (analysis.anomalyScore > 0.5) {
    priority = 'high';
  } else if (analysis.anomalyScore > 0.3) {
    priority = 'medium';
  } else {
    priority = 'low';
  }
  
  return {
    id: `strategy_${randomUUID()}`,
    title: `Strategy for Cycle ${state.cycle}`,
    description,
    actions,
    priority,
    createdAt: new Date().toISOString(),
    basedOn: {
      anomalyScore: analysis.anomalyScore,
      keyInsights: analysis.insights,
    },
  };
}

function generateRuleBasedStrategy(state: SoulState, analysis: AnalysisResult): string {
  const issues: string[] = [];
  
  if (state.agency_state.confidence < 50) {
    issues.push('low confidence');
  }
  if (state.agency_state.energyLevel < 50) {
    issues.push('low energy');
  }
  if (analysis.anomalies.length > 0) {
    issues.push(`${analysis.anomalies.length} anomalies`);
  }
  
  if (issues.length > 0) {
    return `Address system issues: ${issues.join(', ')}. Focus on stability and recovery.`;
  }
  
  return 'System operating normally. Continue monitoring and optimization.';
}

function generateRuleBasedActions(state: SoulState, analysis: AnalysisResult): string[] {
  const actions: string[] = [];
  
  if (state.agency_state.confidence < 50) {
    actions.push('Implement confidence-boosting measures');
  }
  if (state.agency_state.energyLevel < 50) {
    actions.push('Optimize resource usage to restore energy');
  }
  if (analysis.anomalies.length > 0) {
    actions.push('Investigate and resolve detected anomalies');
  }
  if (state.reality_metrics_summary.stabilityScore < 60) {
    actions.push('Improve system stability');
  }
  
  if (actions.length === 0) {
    actions.push('Continue regular monitoring and maintenance');
    actions.push('Explore optimization opportunities');
  }
  
  return actions;
}
