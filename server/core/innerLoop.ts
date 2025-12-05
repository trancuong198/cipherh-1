// CipherH Inner Loop Engine
// Vong lap linh hon tu tri 10 buoc

import { soulState, SoulStateExport } from "./soulState";
import { logAnalyzer, AnalysisResult } from "./analyzer";
import { strategist, WeeklyTask } from "./strategist";
import { memoryBridge } from "./memory";
import { openAIService } from "../services/openai";

export interface InnerLoopResult {
  success: boolean;
  cycle: number;
  timestamp: string;
  stats?: {
    logs_read: number;
    anomaly_score: number;
    doubts: number;
    confidence: number;
    weekly_tasks: number;
    questions_generated: number;
  };
  evaluation?: {
    overall_score: number;
    status: string;
    areas_for_improvement: string[];
    strengths: string[];
  };
  error?: string;
}

export class InnerLoop {
  private sleepMinutes: number;
  private isRunning: boolean = false;

  constructor(sleepMinutes: number = 10) {
    this.sleepMinutes = sleepMinutes;
    console.log("Inner Loop initialized");
    console.log(`Cycle interval: ${sleepMinutes} minutes`);
  }

  async run(): Promise<InnerLoopResult> {
    if (this.isRunning) {
      return {
        success: false,
        cycle: soulState.cycleCount,
        timestamp: new Date().toISOString(),
        error: "Inner Loop is already running",
      };
    }

    this.isRunning = true;

    try {
      // Increment cycle counter
      soulState.incrementCycle();
      const cycle = soulState.cycleCount;

      console.log("=".repeat(60));
      console.log(`SOUL LOOP CYCLE ${cycle} - START`);
      console.log("=".repeat(60));

      // ===== STEP 1: Read logs from analyzer =====
      console.log("Step 1: Reading and analyzing logs...");
      let logs: string[] = [];
      try {
        logs = logAnalyzer.readLogs();
        console.log(`Read ${logs.length} log lines`);
      } catch (error) {
        console.error(`Error reading logs: ${error}`);
      }

      // ===== STEP 2: Analyze -> pattern/anomaly/questions =====
      console.log("Step 2: Detecting patterns and anomalies...");
      let analysisResult: AnalysisResult;
      let anomalyScore = 0;
      let patternSummary: { trend: string } = { trend: "unknown" };
      let suggestedQuestions: string[] = [];
      let daySummary = "";

      try {
        analysisResult = logAnalyzer.returnAnalysis();
        anomalyScore = analysisResult.anomaly_score;
        patternSummary = analysisResult.pattern_summary;
        suggestedQuestions = analysisResult.suggested_questions;
        daySummary = analysisResult.day_summary;

        console.log(`Analysis complete: anomaly_score=${anomalyScore}, trend=${patternSummary.trend}`);
        console.log(`Generated ${suggestedQuestions.length} questions`);
      } catch (error) {
        console.error(`Error during analysis: ${error}`);
        analysisResult = {
          timestamp: new Date().toISOString(),
          pattern_summary: { 
            trend: "unknown" as const,
            total_lines: 0,
            error_count: 0,
            warning_count: 0,
            success_count: 0,
            cycles_detected: 0,
            repeated_errors: [],
            repeated_warnings: [],
            most_common_error: null,
            most_common_warning: null,
          },
          anomalies: [],
          anomaly_score: 0,
          suggested_questions: [],
          day_summary: "Analysis failed",
          total_anomalies: 0,
          severity_breakdown: { high: 0, medium: 0, low: 0 },
        };
      }

      // ===== STEP 3: state.reflect() -> create self-reflection =====
      console.log("Step 3: Self-reflection...");
      let reflection = "";
      try {
        reflection = soulState.reflect();
        console.log(`Reflection: ${reflection}`);
      } catch (error) {
        console.error(`Error during reflection: ${error}`);
        reflection = "Unable to reflect";
      }

      // ===== STEP 4: state.update_from_analysis() =====
      console.log("Step 4: Updating state from analysis...");
      let stateExport: SoulStateExport;

      try {
        soulState.updateFromAnalysis({ anomaly_score: anomalyScore });

        // Add lesson if needed
        if (anomalyScore > 30) {
          soulState.addLesson({
            lesson: `Phat hien anomaly score ${anomalyScore}: can canh giac`,
            context: patternSummary.trend,
          });
        }

        // Add action record
        soulState.addAction({
          action: "analyzed_logs",
          cycle,
          anomaly_score: anomalyScore,
        });

        stateExport = soulState.exportState();
        console.log(`State updated: doubts=${soulState.doubts}, confidence=${soulState.confidence}`);
      } catch (error) {
        console.error(`Error updating state: ${error}`);
        stateExport = soulState.exportState();
      }

      // ===== STEP 5: strategist.propose_weekly_tasks() =====
      console.log("Step 5: Proposing weekly tasks...");
      let weeklyTasks: WeeklyTask[] = [];
      try {
        weeklyTasks = strategist.proposeWeeklyTasks(stateExport, analysisResult);
        console.log(`Proposed ${weeklyTasks.length} weekly tasks`);

        if (weeklyTasks.length > 0) {
          console.log(`Top task: ${weeklyTasks[0].task.substring(0, 60)}...`);
        }
      } catch (error) {
        console.error(`Error proposing weekly tasks: ${error}`);
      }

      // ===== STEP 6: strategist.propose_monthly_plan() =====
      console.log("Step 6: Proposing monthly plan...");
      try {
        const monthlyPlan = strategist.proposeMonthlyPlan(stateExport);
        const focusAreas = monthlyPlan.focus_areas.length;
        console.log(`Monthly plan created with ${focusAreas} focus areas`);
      } catch (error) {
        console.error(`Error proposing monthly plan: ${error}`);
      }

      // ===== STEP 7: Generate strategy prompt (and call OpenAI if available) =====
      console.log("Step 7: Generating long-term strategy...");
      try {
        const strategyPrompt = strategist.generateStrategyPrompt(stateExport, analysisResult);
        console.log(`Strategy prompt generated (${strategyPrompt.length} chars)`);

        // Try to call OpenAI if available
        if (openAIService.isConfigured()) {
          console.log("Calling OpenAI for strategic analysis...");
          try {
            const aiResponse = await openAIService.analyzeStrategy(strategyPrompt);
            if (aiResponse) {
              strategist.integrateOpenAIResponse(aiResponse);
              console.log("OpenAI response integrated");
            }
          } catch (aiError) {
            console.log("OpenAI call failed, continuing in placeholder mode");
          }
        } else {
          console.log("OpenAI integration: placeholder mode (not configured)");
        }
      } catch (error) {
        console.error(`Error generating strategy: ${error}`);
      }

      // ===== STEP 8: Write to Notion =====
      console.log("Step 8: Writing to Notion memory...");

      // 8.1: Daily summary
      try {
        if (daySummary) {
          await memoryBridge.writeDailySummary(daySummary);
          console.log("Daily summary written to Notion");
        }
      } catch (error) {
        console.error(`Error writing daily summary: ${error}`);
      }

      // 8.2: State snapshot
      try {
        await memoryBridge.writeStateSnapshot(stateExport);
        console.log("State snapshot written to Notion");
      } catch (error) {
        console.error(`Error writing state snapshot: ${error}`);
      }

      // 8.3: Questions
      try {
        if (suggestedQuestions.length > 0) {
          const questionsText = suggestedQuestions.slice(0, 5).map((q) => `- ${q}`).join("\n");
          await memoryBridge.writeLesson(`Pending Questions (Cycle ${cycle}):\n${questionsText}`);
          console.log(`Questions written to Notion (${suggestedQuestions.length} questions)`);
        }
      } catch (error) {
        console.error(`Error writing questions: ${error}`);
      }

      // 8.4: Weekly tasks
      try {
        if (weeklyTasks.length > 0) {
          const tasksText = weeklyTasks
            .slice(0, 5)
            .map((task) => `- [${task.priority.toUpperCase()}] ${task.task}`)
            .join("\n");
          await memoryBridge.writeStrategyNote(`Weekly Tasks (Cycle ${cycle}):\n${tasksText}`, "weekly");
          console.log("Weekly tasks written to Notion");
        }
      } catch (error) {
        console.error(`Error writing weekly tasks: ${error}`);
      }

      // ===== STEP 9: Evaluate self-performance =====
      console.log("Step 9: Evaluating self-performance...");
      let selfEvaluation: {
        overall_score: number;
        status: string;
        areas_for_improvement: string[];
        strengths: string[];
      } = {
        overall_score: 0,
        status: "unknown",
        areas_for_improvement: [],
        strengths: [],
      };

      try {
        const assessment = soulState.selfAssessment;
        
        // Calculate performance score based on multiple factors
        const confidenceWeight = 0.3;
        const energyWeight = 0.2;
        const anomalyWeight = 0.3;
        const goalsWeight = 0.2;

        const confidenceScore = soulState.confidence;
        const energyScore = soulState.energyLevel;
        const anomalyPenalty = Math.max(0, 100 - anomalyScore);
        const goalsScore = soulState.goalsLongTerm.length > 0 ? 80 : 40;

        selfEvaluation.overall_score = Math.round(
          confidenceWeight * confidenceScore +
          energyWeight * energyScore +
          anomalyWeight * anomalyPenalty +
          goalsWeight * goalsScore
        );

        // Determine status based on score
        if (selfEvaluation.overall_score >= 85) {
          selfEvaluation.status = "excellent";
        } else if (selfEvaluation.overall_score >= 70) {
          selfEvaluation.status = "good";
        } else if (selfEvaluation.overall_score >= 50) {
          selfEvaluation.status = "moderate";
        } else if (selfEvaluation.overall_score >= 30) {
          selfEvaluation.status = "concerning";
        } else {
          selfEvaluation.status = "critical";
        }

        // Identify areas for improvement
        if (soulState.confidence < 70) {
          selfEvaluation.areas_for_improvement.push("Increase confidence through successful task completion");
        }
        if (anomalyScore > 30) {
          selfEvaluation.areas_for_improvement.push("Address detected anomalies to improve system stability");
        }
        if (soulState.goalsLongTerm.length === 0) {
          selfEvaluation.areas_for_improvement.push("Define clear long-term goals for better direction");
        }
        if (soulState.doubts > 20) {
          selfEvaluation.areas_for_improvement.push("Reduce internal doubts through validated actions");
        }

        // Identify strengths
        if (soulState.energyLevel > 80) {
          selfEvaluation.strengths.push("High energy levels maintained");
        }
        if (anomalyScore < 10) {
          selfEvaluation.strengths.push("System operating with minimal anomalies");
        }
        if (soulState.lessonsLearned.length > 0) {
          selfEvaluation.strengths.push(`Accumulated ${soulState.lessonsLearned.length} lessons learned`);
        }
        if (weeklyTasks.length > 0) {
          selfEvaluation.strengths.push(`${weeklyTasks.length} strategic tasks planned`);
        }

        // Update soul state with self-evaluation
        soulState.updateSelfAssessment(selfEvaluation);

        console.log(`Self-evaluation complete: score=${selfEvaluation.overall_score}, status=${selfEvaluation.status}`);
        console.log(`Strengths: ${selfEvaluation.strengths.length}, Areas to improve: ${selfEvaluation.areas_for_improvement.length}`);
      } catch (error) {
        console.error(`Error during self-evaluation: ${error}`);
      }

      // ===== STEP 10: Prepare for next cycle =====
      console.log("Step 10: Preparing for next cycle...");
      try {
        // Adjust energy based on cycle work
        const energyDelta = anomalyScore > 50 ? -5 : anomalyScore > 30 ? -2 : 1;
        soulState.adjustEnergy(energyDelta);

        // Update mode based on conditions
        if (anomalyScore > 70) {
          soulState.mode = "alert";
        } else if (soulState.doubts > 40) {
          soulState.mode = "reflective";
        } else if (selfEvaluation.overall_score > 80) {
          soulState.mode = "confident";
        } else {
          soulState.mode = "idle";
        }

        // Record cycle completion metrics
        soulState.addAction({
          action: "cycle_completed",
          cycle,
          evaluation_score: selfEvaluation.overall_score,
          status: selfEvaluation.status,
          next_cycle_in: this.sleepMinutes,
        });

        console.log(`Prepared for next cycle: mode=${soulState.mode}, energy=${soulState.energyLevel}`);
      } catch (error) {
        console.error(`Error preparing next cycle: ${error}`);
      }

      // ===== Cycle Complete =====
      console.log("=".repeat(60));
      console.log(`SOUL LOOP CYCLE ${cycle} - COMPLETED SUCCESSFULLY`);
      console.log(`Self-Evaluation Score: ${selfEvaluation.overall_score}/100 (${selfEvaluation.status})`);
      console.log(`Next cycle in ${this.sleepMinutes} minutes`);
      console.log("=".repeat(60));

      this.isRunning = false;

      return {
        success: true,
        cycle,
        timestamp: new Date().toISOString(),
        stats: {
          logs_read: logs.length,
          anomaly_score: anomalyScore,
          doubts: soulState.doubts,
          confidence: soulState.confidence,
          weekly_tasks: weeklyTasks.length,
          questions_generated: suggestedQuestions.length,
        },
        evaluation: selfEvaluation,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`CRITICAL ERROR in Soul Loop Cycle ${soulState.cycleCount}: ${errorMessage}`);

      this.isRunning = false;

      return {
        success: false,
        error: errorMessage,
        cycle: soulState.cycleCount,
        timestamp: new Date().toISOString(),
      };
    }
  }

  getStatus(): {
    cycle_count: number;
    current_mode: string;
    doubts: number;
    confidence: number;
    energy_level: number;
    goals_count: number;
    current_focus: string | null;
    memory_connected: boolean;
    sleep_interval_minutes: number;
    is_running: boolean;
  } {
    return {
      cycle_count: soulState.cycleCount,
      current_mode: soulState.mode,
      doubts: soulState.doubts,
      confidence: soulState.confidence,
      energy_level: soulState.energyLevel,
      goals_count: soulState.goalsLongTerm.length,
      current_focus: soulState.currentFocus,
      memory_connected: memoryBridge.isConnected(),
      sleep_interval_minutes: this.sleepMinutes,
      is_running: this.isRunning,
    };
  }

  isCurrentlyRunning(): boolean {
    return this.isRunning;
  }

  getSleepMinutes(): number {
    return this.sleepMinutes;
  }

  setSleepMinutes(minutes: number): void {
    this.sleepMinutes = minutes;
    console.log(`Sleep interval updated to ${minutes} minutes`);
  }
}

export const innerLoop = new InnerLoop();
