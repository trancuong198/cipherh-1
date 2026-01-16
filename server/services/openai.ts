import OpenAI from 'openai';
import { SoulState } from '../core/soulState.js';
import { AnalysisResult } from '../core/analyzer.js';

let openaiClient: OpenAI | null = null;

export function initializeOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (apiKey) {
    openaiClient = new OpenAI({ apiKey });
    console.log('OpenAI client initialized');
  } else {
    console.log('OpenAI API key not configured - AI features will use placeholders');
  }
}

export async function generateStrategy(
  state: SoulState,
  analysis: AnalysisResult
): Promise<{ description: string; actions: string[] }> {
  if (!openaiClient) {
    throw new Error('OpenAI not configured');
  }
  
  const prompt = `
You are CipherH, an autonomous AI system. Analyze the current state and generate a strategic plan.

Current State:
- Cycle: ${state.cycle}
- Confidence: ${state.agency_state.confidence}/100
- Energy: ${state.agency_state.energyLevel}/100
- Stability Score: ${state.reality_metrics_summary.stabilityScore}/100

Analysis:
- Anomalies detected: ${analysis.anomalies.length}
- Patterns found: ${analysis.patterns.length}
- Key anomalies: ${analysis.anomalies.slice(0, 3).join(', ') || 'None'}
- Insights: ${analysis.insights.slice(0, 3).join(', ') || 'None'}

Generate a concise strategic plan with:
1. A brief description (2-3 sentences)
2. A list of 3-5 concrete actions

Format your response as JSON:
{
  "description": "strategy description",
  "actions": ["action 1", "action 2", "action 3"]
}
`.trim();

  try {
    const response = await openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic AI advisor for an autonomous system. Provide clear, actionable strategies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500', 10),
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(content);
      return {
        description: parsed.description || 'No description provided',
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      };
    } catch {
      // Fallback: extract from text
      return {
        description: content.substring(0, 200),
        actions: ['Review OpenAI response', 'Continue monitoring'],
      };
    }
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw error;
  }
}

// Initialize on module load
initializeOpenAI();
