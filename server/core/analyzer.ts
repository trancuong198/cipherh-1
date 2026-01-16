import { SoulState } from './soulState.js';

export interface AnalysisResult {
  patterns: string[];
  anomalies: string[];
  questions: string[];
  insights: string[];
  anomalyScore: number;
}

export async function analyzeLogs(state: SoulState): Promise<AnalysisResult> {
  console.log('Analyzing logs and system state...');
  
  const patterns: string[] = [];
  const anomalies: string[] = [];
  const questions: string[] = [];
  const insights: string[] = [];
  
  // Analyze confidence level
  if (state.agency_state.confidence < 30) {
    anomalies.push('Low confidence detected');
    questions.push('What caused the drop in confidence?');
  } else if (state.agency_state.confidence > 90) {
    patterns.push('High confidence maintained');
    insights.push('System is performing well');
  }
  
  // Analyze energy level
  if (state.agency_state.energyLevel < 30) {
    anomalies.push('Low energy level detected');
    questions.push('Is the system overloaded?');
  }
  
  // Analyze cycle count
  if (state.cycle > 0 && state.cycle % 10 === 0) {
    patterns.push(`Milestone: ${state.cycle} cycles completed`);
    insights.push('Regular operation pattern detected');
  }
  
  // Analyze stability
  if (state.reality_metrics_summary.stabilityScore < 40) {
    anomalies.push('System stability below threshold');
    questions.push('What factors are affecting stability?');
  }
  
  // Analyze desires
  if (state.desire_state_summary.blockedDesires > state.desire_state_summary.totalDesires * 0.3) {
    anomalies.push('High number of blocked desires');
    questions.push('What is blocking desire fulfillment?');
  }
  
  // Calculate anomaly score (0-1)
  const anomalyScore = Math.min(1, anomalies.length * 0.2);
  
  return {
    patterns,
    anomalies,
    questions,
    insights,
    anomalyScore,
  };
}

export function detectPatterns(data: any[]): string[] {
  const patterns: string[] = [];
  
  if (data.length === 0) {
    return patterns;
  }
  
  // Simple pattern detection
  const frequencies: Record<string, number> = {};
  
  data.forEach(item => {
    const key = typeof item === 'string' ? item : JSON.stringify(item);
    frequencies[key] = (frequencies[key] || 0) + 1;
  });
  
  // Find repeated patterns (frequency > 2)
  Object.entries(frequencies).forEach(([key, count]) => {
    if (count > 2) {
      patterns.push(`Repeated pattern detected: ${key.substring(0, 50)}... (${count} times)`);
    }
  });
  
  return patterns;
}
