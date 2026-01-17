/**
 * PART 69: HYPOTHESIS TESTING LOOP
 * 
 * Philosophy: "Không tin suy nghĩ → chỉ tin kết quả. Giả định là thứ để bị bẻ gãy, không phải để bảo vệ."
 * 
 * Core Principles:
 * - Don't trust thoughts → only trust results
 * - Hypotheses exist to be broken, not defended
 * - Small, cheap, fast experiments → survival
 * - 4-part hypothesis structure (mandatory)
 * - Single variable change only
 */

interface Hypothesis {
  id: string;
  createdAt: Date;
  
  // 4 mandatory parts (69.2)
  action: string;          // If (action X)
  expectedResult: string;  // Then (result Y)
  timeframe: number;       // In (time Z) - hours
  metric: string;          // Measured by (metric M)
  
  // Experiment constraints (69.3)
  timeLimit: number;       // 24-72 hours
  budgetLimit: number;     // ≤5% of current budget
  variableChanged: string; // Single variable only
  
  // Status
  status: 'PLANNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABANDONED';
  startedAt?: Date;
  completedAt?: Date;
  
  // Results
  actualResult?: string;
  metricValue?: number;
  outcome?: 'CLEARLY_RIGHT' | 'CLEARLY_WRONG' | 'AMBIGUOUS';
  decision?: 'SCALE_2X' | 'KILL_IMMEDIATELY' | 'REFINE_ONCE' | 'ABANDONED';
  
  // Memory (69.5)
  reasonForOutcome?: string; // Why right/wrong
  runCount: number;          // Max 2 runs
}

interface ExperimentMemory {
  hypothesis: string;
  actualResult: string;
  reasonWhyRightOrWrong: string;
  timestamp: Date;
}

export class HypothesisTestingLoop {
  private hypotheses: Map<string, Hypothesis> = new Map();
  private memories: ExperimentMemory[] = [];
  private currentBudget: number = 1000; // Mock budget
  
  // Configuration (69.3)
  private readonly MIN_EXPERIMENT_HOURS = 24;
  private readonly MAX_EXPERIMENT_HOURS = 72;
  private readonly MAX_BUDGET_PERCENTAGE = 5;
  private readonly MAX_RUN_COUNT = 2;
  private readonly SCALE_MULTIPLIER = 2;

  /**
   * 69.2: Create hypothesis with mandatory 4-part structure
   */
  createHypothesis(params: {
    action: string;
    expectedResult: string;
    timeframe: number;
    metric: string;
    variableChanged: string;
  }): Hypothesis {
    // Validate all 4 mandatory parts present
    if (!params.action || !params.expectedResult || !params.timeframe || !params.metric) {
      throw new Error('INVALID_HYPOTHESIS: Missing required fields (action, expectedResult, timeframe, metric)');
    }

    // Validate timeframe
    if (params.timeframe < this.MIN_EXPERIMENT_HOURS || params.timeframe > this.MAX_EXPERIMENT_HOURS) {
      throw new Error(`INVALID_TIMEFRAME: Must be ${this.MIN_EXPERIMENT_HOURS}-${this.MAX_EXPERIMENT_HOURS} hours`);
    }

    // Validate budget limit
    const budgetLimit = (this.currentBudget * this.MAX_BUDGET_PERCENTAGE) / 100;
    if (budgetLimit === 0) {
      throw new Error('INSUFFICIENT_BUDGET: Cannot run experiment with 0 budget');
    }

    const hypothesisId = `HYP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const hypothesis: Hypothesis = {
      id: hypothesisId,
      createdAt: new Date(),
      action: params.action,
      expectedResult: params.expectedResult,
      timeframe: params.timeframe,
      metric: params.metric,
      timeLimit: params.timeframe,
      budgetLimit,
      variableChanged: params.variableChanged,
      status: 'PLANNED',
      runCount: 0
    };

    this.hypotheses.set(hypothesisId, hypothesis);

    console.log(`[HYPOTHESIS_CREATED] ${hypothesisId}`);
    console.log(`  If: ${params.action}`);
    console.log(`  Then: ${params.expectedResult}`);
    console.log(`  In: ${params.timeframe}h`);
    console.log(`  Measure: ${params.metric}`);

    return hypothesis;
  }

  /**
   * Run experiment
   */
  async runExperiment(hypothesisId: string): Promise<void> {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      throw new Error(`Hypothesis ${hypothesisId} not found`);
    }

    // Check run count (69.4 - max 2 runs)
    if (hypothesis.runCount >= this.MAX_RUN_COUNT) {
      hypothesis.status = 'ABANDONED';
      hypothesis.decision = 'ABANDONED';
      console.warn(`[EXPERIMENT_ABANDONED] ${hypothesisId} - Exceeded max runs (${this.MAX_RUN_COUNT})`);
      console.warn('  Running 3rd time = addiction to experimenting');
      return;
    }

    hypothesis.status = 'RUNNING';
    hypothesis.startedAt = new Date();
    hypothesis.runCount++;

    console.log(`[EXPERIMENT_STARTED] ${hypothesisId} - Run ${hypothesis.runCount}/${this.MAX_RUN_COUNT}`);

    // Simulate experiment running (would be real in production)
    await this.executeExperiment(hypothesis);

    hypothesis.status = 'COMPLETED';
    hypothesis.completedAt = new Date();

    // Analyze results
    await this.analyzeResults(hypothesis);

    // Store memory (69.5)
    await this.storeMemory(hypothesis);
  }

  /**
   * 69.4: Analyze results and make decision
   */
  private async analyzeResults(hypothesis: Hypothesis): Promise<void> {
    if (!hypothesis.actualResult || hypothesis.metricValue === undefined) {
      hypothesis.outcome = 'AMBIGUOUS';
      hypothesis.decision = 'KILL_IMMEDIATELY';
      hypothesis.reasonForOutcome = 'No measurable result obtained';
      return;
    }

    // Determine outcome clarity
    const expectedLower = hypothesis.expectedResult.toLowerCase();
    const actualLower = hypothesis.actualResult.toLowerCase();
    
    // Clearly right
    if (actualLower.includes('success') || actualLower.includes('positive') || 
        hypothesis.metricValue > 0) {
      hypothesis.outcome = 'CLEARLY_RIGHT';
      hypothesis.decision = 'SCALE_2X';
      hypothesis.reasonForOutcome = `Hypothesis validated: ${hypothesis.actualResult}`;
      
      console.log(`[CLEARLY_RIGHT] ${hypothesis.id} → Scale ${this.SCALE_MULTIPLIER}x`);
    }
    // Clearly wrong
    else if (actualLower.includes('fail') || actualLower.includes('negative') || 
             hypothesis.metricValue < 0) {
      hypothesis.outcome = 'CLEARLY_WRONG';
      hypothesis.decision = 'KILL_IMMEDIATELY';
      hypothesis.reasonForOutcome = `Hypothesis invalidated: ${hypothesis.actualResult}`;
      
      console.log(`[CLEARLY_WRONG] ${hypothesis.id} → Kill immediately, record lesson`);
    }
    // Ambiguous
    else {
      hypothesis.outcome = 'AMBIGUOUS';
      
      if (hypothesis.runCount < this.MAX_RUN_COUNT) {
        hypothesis.decision = 'REFINE_ONCE';
        hypothesis.reasonForOutcome = `Unclear result, refining once: ${hypothesis.actualResult}`;
        
        console.log(`[AMBIGUOUS] ${hypothesis.id} → Refine and run once more`);
      } else {
        hypothesis.decision = 'ABANDONED';
        hypothesis.reasonForOutcome = `Still ambiguous after ${hypothesis.runCount} runs, abandoning`;
        
        console.log(`[AMBIGUOUS_ABANDONED] ${hypothesis.id} → No clear signal after 2 runs`);
      }
    }
  }

  /**
   * 69.5: Store experiment memory (3 lines)
   */
  private async storeMemory(hypothesis: Hypothesis): Promise<void> {
    if (!hypothesis.actualResult || !hypothesis.reasonForOutcome) {
      return;
    }

    const memory: ExperimentMemory = {
      hypothesis: `IF ${hypothesis.action} THEN ${hypothesis.expectedResult} IN ${hypothesis.timeframe}h`,
      actualResult: hypothesis.actualResult,
      reasonWhyRightOrWrong: hypothesis.reasonForOutcome,
      timestamp: new Date()
    };

    this.memories.push(memory);

    console.log(`[MEMORY_STORED] ${hypothesis.id}`);
    console.log(`  1. Hypothesis: ${memory.hypothesis}`);
    console.log(`  2. Actual: ${memory.actualResult}`);
    console.log(`  3. Why: ${memory.reasonWhyRightOrWrong}`);
  }

  /**
   * Execute experiment (simplified)
   */
  private async executeExperiment(hypothesis: Hypothesis): Promise<void> {
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock results (in production, would measure real metrics)
    const outcomes = ['success', 'failure', 'unclear'];
    hypothesis.actualResult = outcomes[Math.floor(Math.random() * outcomes.length)];
    hypothesis.metricValue = Math.random() * 200 - 100; // -100 to 100
  }

  /**
   * Get hypotheses by status
   */
  getHypothesesByStatus(status: Hypothesis['status']): Hypothesis[] {
    return Array.from(this.hypotheses.values())
      .filter(h => h.status === status);
  }

  /**
   * Get successful hypotheses (for scaling)
   */
  getSuccessfulHypotheses(): Hypothesis[] {
    return Array.from(this.hypotheses.values())
      .filter(h => h.outcome === 'CLEARLY_RIGHT');
  }

  /**
   * Get lessons learned from failures
   */
  getLessonsLearned(): ExperimentMemory[] {
    return this.memories.filter(m => 
      m.actualResult.toLowerCase().includes('fail') ||
      m.actualResult.toLowerCase().includes('negative')
    );
  }

  /**
   * Check if similar hypothesis failed before
   */
  hasSimilarFailure(action: string): boolean {
    return this.memories.some(m => 
      m.hypothesis.includes(action) &&
      (m.actualResult.toLowerCase().includes('fail') ||
       m.actualResult.toLowerCase().includes('negative'))
    );
  }

  /**
   * Get experiment statistics
   */
  getStatistics(): {
    total: number;
    clearlyRight: number;
    clearlyWrong: number;
    ambiguous: number;
    abandoned: number;
    averageRunCount: number;
  } {
    const all = Array.from(this.hypotheses.values());
    
    return {
      total: all.length,
      clearlyRight: all.filter(h => h.outcome === 'CLEARLY_RIGHT').length,
      clearlyWrong: all.filter(h => h.outcome === 'CLEARLY_WRONG').length,
      ambiguous: all.filter(h => h.outcome === 'AMBIGUOUS').length,
      abandoned: all.filter(h => h.decision === 'ABANDONED').length,
      averageRunCount: all.reduce((sum, h) => sum + h.runCount, 0) / all.length
    };
  }

  /**
   * Validate single variable change
   */
  validateSingleVariable(params: { variableChanged: string }, existingHypotheses: Hypothesis[]): boolean {
    // Check if changing 2 variables at once
    const recentSimilar = existingHypotheses.filter(h => 
      h.status === 'RUNNING' &&
      h.variableChanged !== params.variableChanged
    );

    if (recentSimilar.length > 0) {
      console.warn('[MULTI_VARIABLE_WARNING] Changing 2 variables at once = self-deception');
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const hypothesisTestingLoop = new HypothesisTestingLoop();
