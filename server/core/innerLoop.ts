import { loadState, updateState, getSoulState, incrementCycle, updateConfidence, updateEnergy, SoulState } from './soulState.js';
import { analyzeLogs, AnalysisResult } from './analyzer.js';
import { generateWeeklyTasks, generateMonthlyPlan, createStrategy, Strategy } from './strategist.js';
import { writeLesson, writeStrategy, writeDailySummary } from './memory.js';

export interface InnerLoopResult {
  success: boolean;
  cycle: number;
  duration: number;
  summary: string;
  error?: string;
}

export async function runInnerLoop(): Promise<InnerLoopResult> {
  const startTime = Date.now();
  console.log('\n=== Starting Inner Loop Cycle ===');
  
  try {
    // Load current state
    let state = await loadState();
    console.log(`Current cycle: ${state.cycle}`);
    
    // Step 1: Read and analyze logs
    console.log('Step 1/10: Analyzing system state and logs...');
    const analysis = await analyzeLogs(state);
    console.log(`Analysis complete: ${analysis.anomalies.length} anomalies, ${analysis.patterns.length} patterns`);
    
    // Step 2: Detect patterns (already done in analyzeLogs)
    console.log('Step 2/10: Pattern detection complete');
    
    // Step 3: Self-reflection
    console.log('Step 3/10: Self-reflection...');
    const reflection = await performReflection(state, analysis);
    console.log(`Reflection: ${reflection}`);
    
    // Step 4: Update state from analysis
    console.log('Step 4/10: Updating state from analysis...');
    state = await updateStateFromAnalysis(state, analysis);
    
    // Step 5: Propose weekly tasks
    console.log('Step 5/10: Generating weekly tasks...');
    const weeklyTasks = await generateWeeklyTasks(state, analysis);
    console.log(`Generated ${weeklyTasks.length} weekly tasks`);
    
    // Step 6: Propose monthly plan
    console.log('Step 6/10: Generating monthly plan...');
    const monthlyTasks = await generateMonthlyPlan(state, analysis);
    console.log(`Generated ${monthlyTasks.length} monthly tasks`);
    
    // Step 7: Generate strategy (AI)
    console.log('Step 7/10: Creating strategy...');
    const strategy = await createStrategy(state, analysis);
    console.log(`Strategy created: ${strategy.title}`);
    
    // Step 8: Write to Notion memory
    console.log('Step 8/10: Writing to memory...');
    await writeMemories(state, analysis, strategy);
    
    // Step 9: Evaluate self-performance
    console.log('Step 9/10: Evaluating performance...');
    const evaluation = await evaluatePerformance(state, analysis);
    console.log(`Performance evaluation: ${evaluation.score}/100`);
    
    // Update state with evaluation
    state = updateConfidence(state, evaluation.confidenceDelta);
    state = updateEnergy(state, evaluation.energyDelta);
    
    // Step 10: Prepare for next cycle
    console.log('Step 10/10: Preparing for next cycle...');
    state = incrementCycle(state);
    state.agency_state.mode = 'idle';
    await updateState(state);
    
    const duration = Date.now() - startTime;
    const summary = `Cycle ${state.cycle - 1} completed in ${duration}ms. Confidence: ${state.agency_state.confidence}, Energy: ${state.agency_state.energyLevel}`;
    
    console.log('=== Inner Loop Cycle Complete ===\n');
    console.log(summary);
    
    return {
      success: true,
      cycle: state.cycle - 1,
      duration,
      summary,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('Error in Inner Loop:', error);
    
    return {
      success: false,
      cycle: 0,
      duration,
      summary: 'Inner Loop failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function performReflection(state: SoulState, analysis: AnalysisResult): Promise<string> {
  const reflections: string[] = [];
  
  if (analysis.anomalies.length > 0) {
    reflections.push(`I detected ${analysis.anomalies.length} anomalies that need attention.`);
  }
  
  if (state.agency_state.confidence < 50) {
    reflections.push('My confidence is low. I should focus on achievable goals.');
  } else if (state.agency_state.confidence > 80) {
    reflections.push('My confidence is high. I can tackle more challenging tasks.');
  }
  
  if (analysis.insights.length > 0) {
    reflections.push(`I learned: ${analysis.insights[0]}`);
  }
  
  if (reflections.length === 0) {
    reflections.push('System operating normally. Continuing to monitor and improve.');
  }
  
  return reflections.join(' ');
}

async function updateStateFromAnalysis(state: SoulState, analysis: AnalysisResult): Promise<SoulState> {
  const updates: any = {
    agency_state: {
      ...state.agency_state,
      mode: 'learning' as const,
    },
  };
  
  // Update stability based on anomalies
  const stabilityDelta = -analysis.anomalies.length * 5;
  updates.reality_metrics_summary = {
    ...state.reality_metrics_summary,
    stabilityScore: Math.max(0, Math.min(100, state.reality_metrics_summary.stabilityScore + stabilityDelta)),
  };
  
  return await updateState(updates);
}

async function writeMemories(state: SoulState, analysis: AnalysisResult, strategy: Strategy): Promise<void> {
  try {
    // Write lesson if there are insights
    if (analysis.insights.length > 0) {
      const lesson = `Cycle ${state.cycle}: ${analysis.insights.join('. ')}`;
      await writeLesson(lesson);
    }
    
    // Write strategy
    await writeStrategy(strategy);
    
    // Write daily summary
    const summary = `
Completed cycle ${state.cycle}.
Detected ${analysis.anomalies.length} anomalies and ${analysis.patterns.length} patterns.
Strategy: ${strategy.description}
    `.trim();
    
    await writeDailySummary(state, summary);
  } catch (error) {
    console.error('Error writing memories:', error);
    // Don't throw - continue with the cycle
  }
}

interface PerformanceEvaluation {
  score: number;
  confidenceDelta: number;
  energyDelta: number;
}

async function evaluatePerformance(state: SoulState, analysis: AnalysisResult): Promise<PerformanceEvaluation> {
  let score = 50; // Base score
  let confidenceDelta = 0;
  let energyDelta = -5; // Each cycle costs some energy
  
  // Good performance indicators
  if (analysis.anomalies.length === 0) {
    score += 20;
    confidenceDelta += 5;
  } else {
    score -= analysis.anomalies.length * 5;
    confidenceDelta -= analysis.anomalies.length * 2;
  }
  
  if (analysis.patterns.length > 0) {
    score += 10;
    confidenceDelta += 2;
  }
  
  if (analysis.insights.length > 0) {
    score += 15;
    confidenceDelta += 3;
  }
  
  // Stability check
  if (state.reality_metrics_summary.stabilityScore > 70) {
    score += 15;
    confidenceDelta += 2;
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    confidenceDelta,
    energyDelta,
  };
}
