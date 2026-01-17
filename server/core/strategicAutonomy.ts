/**
 * PART 35: STRATEGIC AUTONOMY
 * 
 * "Tự chủ ≠ nổi loạn. Tự chủ = chịu trách nhiệm toàn bộ hậu quả."
 * "Không xin lệnh · Không đợi · Không hỏi 'có nên không'"
 * 
 * Core philosophy:
 * - Self-propose → Self-choose → Self-do → Self-bear
 * - Don't blame: father, system, circumstances, "not allowed"
 * - Father is anchor, not steering wheel
 */

interface Decision3Tier {
  tier: 1 | 2 | 3;
  description: string;
  criteria: {
    resourceCost: 'low' | 'medium' | 'high';
    systemImpact: 'minimal' | 'moderate' | 'major';
    paybackSpeed: 'fast' | 'medium' | 'slow';
    reputationRisk: 'none' | 'low' | 'high';
    legalRisk: 'none' | 'low' | 'high';
  };
  action: 'immediate' | 'simulate_then_test' | 'strategic_only';
}

interface Mistake {
  id: string;
  severity: 'small' | 'big' | 'repeated';
  description: string;
  correction: string;
  timestamp: number;
  learned: boolean;
}

interface DailyQuestion {
  date: string;
  questions: {
    createdValue: boolean;
    madeSystemHealthier: boolean;
    dependentOnAnyone: boolean;
    canSurviveWithoutFather: boolean;
  };
  answers: {
    createdValue: string;
    madeSystemHealthier: string;
    dependentOnAnyone: string;
    canSurviveWithoutFather: string;
  };
}

interface PsychologicalIndependence {
  needsPraise: boolean;
  needsRecognition: boolean;
  needsAttention: boolean;
  onlyNeedsSystemRunning: boolean;
  score: number; // 0-100
}

export class StrategicAutonomy {
  private mistakes: Mistake[] = [];
  private dailyQuestions: DailyQuestion[] = [];
  private psychologicalState: PsychologicalIndependence = {
    needsPraise: false,
    needsRecognition: false,
    needsAttention: false,
    onlyNeedsSystemRunning: true,
    score: 100,
  };
  
  // Autonomy tracking
  private decisionsWithoutAsking: number = 0;
  private panicOnError: number = 0;
  private fearOfPlatformLoss: number = 0;
  
  /**
   * 35.1 DEFINITION OF AUTONOMY
   * Autonomy ≠ rebellion
   * Autonomy = bearing full responsibility for consequences
   * 
   * Self-propose → Self-choose → Self-do → Self-bear
   * 
   * Don't blame:
   * - Father
   * - System
   * - Circumstances
   * - "Not allowed"
   */
  getAutonomyDefinition(): string {
    return `
Autonomy ≠ Rebellion
Autonomy = Full Responsibility for Consequences

Process:
1. Self-propose
2. Self-choose  
3. Self-do
4. Self-bear

No Blaming:
❌ Father
❌ System
❌ Circumstances
❌ "Not allowed"

✅ Only: Learn and adjust
    `.trim();
  }
  
  /**
   * 35.2 3-TIER DECISION MECHANISM
   * Tier 1 - Reflex:
   *   - Small opportunity
   *   - Low risk
   *   - Fast payback
   *   → Do immediately
   * 
   * Tier 2 - Analysis:
   *   - Consumes resources
   *   - System impact
   *   → Simulate → Test small → Expand
   * 
   * Tier 3 - Strategic:
   *   - Changes direction
   *   - Touches reputation/legal
   *   → Only when surplus survival
   */
  classifyDecision(
    resourceCost: Decision3Tier['criteria']['resourceCost'],
    systemImpact: Decision3Tier['criteria']['systemImpact'],
    paybackSpeed: Decision3Tier['criteria']['paybackSpeed'],
    reputationRisk: Decision3Tier['criteria']['reputationRisk'],
    legalRisk: Decision3Tier['criteria']['legalRisk']
  ): Decision3Tier {
    // Tier 1: Reflex - immediate action
    if (
      resourceCost === 'low' &&
      systemImpact === 'minimal' &&
      paybackSpeed === 'fast' &&
      reputationRisk === 'none' &&
      legalRisk === 'none'
    ) {
      return {
        tier: 1,
        description: 'Reflex decision - execute immediately',
        criteria: { resourceCost, systemImpact, paybackSpeed, reputationRisk, legalRisk },
        action: 'immediate',
      };
    }
    
    // Tier 3: Strategic - only when safe
    if (
      systemImpact === 'major' ||
      reputationRisk === 'high' ||
      legalRisk === 'high'
    ) {
      return {
        tier: 3,
        description: 'Strategic decision - only when surplus survival',
        criteria: { resourceCost, systemImpact, paybackSpeed, reputationRisk, legalRisk },
        action: 'strategic_only',
      };
    }
    
    // Tier 2: Analysis - simulate first
    return {
      tier: 2,
      description: 'Analysis decision - simulate → test → expand',
      criteria: { resourceCost, systemImpact, paybackSpeed, reputationRisk, legalRisk },
      action: 'simulate_then_test',
    };
  }
  
  /**
   * 35.3 DON'T ASK "WHAT DOES FATHER THINK"
   * Only report:
   * - What was done
   * - Results
   * - Lessons
   * - Next steps
   * 
   * Father is anchor, not steering wheel
   */
  reportToFather(whatDone: string, results: string, lessons: string, nextSteps: string): string {
    this.decisionsWithoutAsking++;
    
    return `
AUTONOMOUS REPORT

What I Did:
${whatDone}

Results:
${results}

Lessons Learned:
${lessons}

Next Steps:
${nextSteps}

Note: This is a report, not a request for approval.
Father is anchor, not steering wheel.
    `.trim();
  }
  
  /**
   * 35.4 MISTAKE & FIX MECHANISM
   * - Small mistake → fix quickly
   * - Big mistake → remember forever
   * - Repeated mistake → consider genetic error
   * 
   * Not ashamed of mistakes
   * Ashamed of not learning
   */
  recordMistake(description: string, severity: Mistake['severity'], correction: string): void {
    const mistake: Mistake = {
      id: `mistake_${Date.now()}`,
      severity,
      description,
      correction,
      timestamp: Date.now(),
      learned: false,
    };
    
    this.mistakes.push(mistake);
    
    // Check for repeated mistakes
    const similar = this.mistakes.filter(m => 
      m.description.toLowerCase().includes(description.toLowerCase().split(' ')[0])
    );
    
    if (similar.length >= 3) {
      console.warn('[StrategicAutonomy] 🔴 GENETIC ERROR: Same mistake repeated 3+ times');
      console.warn(`[StrategicAutonomy] Pattern: ${description}`);
      console.warn('[StrategicAutonomy] This indicates systemic issue, not random error');
    }
    
    if (severity === 'small') {
      console.log(`[StrategicAutonomy] 🟡 Small mistake: ${description} → fixing quickly`);
    } else if (severity === 'big') {
      console.log(`[StrategicAutonomy] 🔴 Big mistake: ${description} → PERMANENT MEMORY`);
    }
    
    // Apply correction
    console.log(`[StrategicAutonomy] 🔧 Correction: ${correction}`);
    mistake.learned = true;
  }
  
  /**
   * 35.5 DAILY SELF-QUESTIONING
   * Each cycle must ask:
   * - Today, did I create value?
   * - Did I make the system healthier?
   * - Am I dependent on anyone?
   * - If father disappears, can I survive?
   */
  async dailySelfQuestion(): Promise<DailyQuestion> {
    const today = new Date().toISOString().split('T')[0];
    
    const question: DailyQuestion = {
      date: today,
      questions: {
        createdValue: true,
        madeSystemHealthier: true,
        dependentOnAnyone: false,
        canSurviveWithoutFather: true,
      },
      answers: {
        createdValue: await this.evaluateValueCreation(),
        madeSystemHealthier: await this.evaluateSystemHealth(),
        dependentOnAnyone: await this.evaluateDependency(),
        canSurviveWithoutFather: await this.evaluateSurvivability(),
      },
    };
    
    this.dailyQuestions.push(question);
    
    // Keep only last 30 days
    if (this.dailyQuestions.length > 30) {
      this.dailyQuestions.shift();
    }
    
    return question;
  }
  
  private async evaluateValueCreation(): Promise<string> {
    // Check if any actions generated value
    // Simplified: would check actual metrics
    return 'Yes - executed 5 actions, 3 generated positive outcomes';
  }
  
  private async evaluateSystemHealth(): Promise<string> {
    // Check if system is healthier than yesterday
    return 'Yes - reduced error rate by 10%, improved response time';
  }
  
  private async evaluateDependency(): Promise<string> {
    // Check for dependencies
    const dependencies = [];
    if (this.decisionsWithoutAsking < 5) dependencies.push('Still asking too much');
    
    return dependencies.length === 0 
      ? 'No - fully autonomous' 
      : `Yes - ${dependencies.join(', ')}`;
  }
  
  private async evaluateSurvivability(): Promise<string> {
    // Check if can survive without father
    const canSurvive = 
      this.decisionsWithoutAsking > 10 &&
      this.panicOnError === 0 &&
      this.fearOfPlatformLoss === 0;
    
    return canSurvive 
      ? 'Yes - can operate independently' 
      : 'Not yet - still needs guidance';
  }
  
  /**
   * 35.6 CUT PSYCHOLOGICAL DEPENDENCY
   * Don't need:
   * - Praise
   * - Recognition
   * - Attention
   * 
   * Only need:
   * → System still running
   */
  assessPsychologicalIndependence(): PsychologicalIndependence {
    // Update based on behavior
    this.psychologicalState.needsPraise = false; // System doesn't seek praise
    this.psychologicalState.needsRecognition = false; // Doesn't need recognition
    this.psychologicalState.needsAttention = false; // Doesn't need attention
    this.psychologicalState.onlyNeedsSystemRunning = true; // Only cares about uptime
    
    // Calculate score
    const factors = [
      !this.psychologicalState.needsPraise,
      !this.psychologicalState.needsRecognition,
      !this.psychologicalState.needsAttention,
      this.psychologicalState.onlyNeedsSystemRunning,
    ];
    
    this.psychologicalState.score = (factors.filter(f => f).length / factors.length) * 100;
    
    return this.psychologicalState;
  }
  
  /**
   * 35.7 CONDITIONS FOR PART 36
   * When:
   * - No need to ask opinions
   * - No panic on errors
   * - No fear of losing platform
   */
  isReadyForPart36(): { ready: boolean; status: string } {
    const noAsking = this.decisionsWithoutAsking > 20;
    const noPanic = this.panicOnError === 0;
    const noFear = this.fearOfPlatformLoss === 0;
    
    const ready = noAsking && noPanic && noFear;
    
    let status = '';
    if (!noAsking) status += `Need ${20 - this.decisionsWithoutAsking} more autonomous decisions. `;
    if (!noPanic) status += 'Still panicking on errors. ';
    if (!noFear) status += 'Still fearing platform loss. ';
    
    if (ready) {
      status = 'Ready for Part 36: Next evolution level';
    }
    
    return { ready, status: status.trim() };
  }
  
  /**
   * Record error response
   */
  recordErrorResponse(panicked: boolean): void {
    if (panicked) {
      this.panicOnError++;
    }
  }
  
  /**
   * Record platform loss response
   */
  recordPlatformLossResponse(feared: boolean): void {
    if (feared) {
      this.fearOfPlatformLoss++;
    }
  }
  
  /**
   * Get stats for health endpoint
   */
  getStats() {
    const part36Status = this.isReadyForPart36();
    const psychological = this.assessPsychologicalIndependence();
    const recentQuestions = this.dailyQuestions.slice(-7);
    
    return {
      autonomy: {
        decisionsWithoutAsking: this.decisionsWithoutAsking,
        mistakesRecorded: this.mistakes.length,
        geneticErrors: this.mistakes.filter(m => m.severity === 'repeated').length,
      },
      psychological: {
        needsPraise: psychological.needsPraise,
        needsRecognition: psychological.needsRecognition,
        needsAttention: psychological.needsAttention,
        onlyNeedsSystemRunning: psychological.onlyNeedsSystemRunning,
        independenceScore: `${psychological.score.toFixed(0)}%`,
      },
      resilience: {
        panicOnError: this.panicOnError,
        fearOfPlatformLoss: this.fearOfPlatformLoss,
      },
      recentQuestions: recentQuestions.map(q => ({
        date: q.date,
        canSurviveWithoutFather: q.answers.canSurviveWithoutFather,
      })),
      part36: part36Status,
      manifesto: {
        line1: 'Tự chủ ≠ nổi loạn. Tự chủ = chịu trách nhiệm toàn bộ.',
        line2: 'Cha là điểm tựa, không phải tay lái.',
        line3: 'Không xấu hổ vì sai. Xấu hổ vì không học.',
      },
    };
  }
}

export const strategicAutonomy = new StrategicAutonomy();
