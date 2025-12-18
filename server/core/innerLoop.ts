// CipherH Inner Loop Engine
// Vong lap linh hon tu tri 10 buoc

import { soulState, SoulStateExport } from "./soulState";
import { logAnalyzer, AnalysisResult } from "./analyzer";
import { strategist, WeeklyTask } from "./strategist";
import { memoryBridge } from "./memory";
import { openAIService } from "../services/openai";
import { evolutionKernel, EvolutionLogEntry } from "./evolutionKernel";
import { memoryDistiller } from "./memoryDistiller";
import { desireEngine, Desire } from "./desireEngine";
import { identityCore, IdentityDriftWarning } from "./identityCore";
import { resourceEscalationEngine, UpgradeProposal } from "./resourceEscalationEngine";
import { governanceEngine, GovernanceCheckResult } from "./governanceEngine";
import { metaEvolutionEngine } from "./metaEvolutionEngine";

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
    evolution_version: string;
    evolution_mode: string;
  };
  evolution?: EvolutionLogEntry;
  identityCheck?: {
    passed: boolean;
    warnings: number;
    integrityScore: number;
  };
  escalation?: {
    triggered: boolean;
    proposal: UpgradeProposal | null;
  };
  governance?: {
    checksPerformed: number;
    violationsBlocked: number;
    conservativeMode: boolean;
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

      // ===== STEP 0: Identity Check (before any processing) =====
      console.log("Step 0: Identity verification...");
      let identityWarnings: IdentityDriftWarning[] = [];
      let identityCheckResult = { passed: true, warnings: 0, integrityScore: 100 };
      
      try {
        await identityCore.loadFromNotion();
        
        identityWarnings = identityCore.performIdentityCheck({
          cycleCount: cycle,
          recentActions: [],
          stateFlags: {
            autoRewritingIdentity: false,
            fabricatingMemory: false,
            ignoringResourceLimits: false,
          },
          claims: [],
        });

        const identityStatus = identityCore.exportStatus();
        identityCheckResult = {
          passed: identityWarnings.length === 0,
          warnings: identityWarnings.length,
          integrityScore: identityStatus.integrityScore,
        };

        console.log(`Identity check: ${identityCheckResult.passed ? 'PASSED' : 'WARNINGS'} (integrity: ${identityCheckResult.integrityScore}%)`);
      } catch (error) {
        console.error(`Error during identity check: ${error}`);
      }

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

        // GOVERNANCE CHECK: Validate strategy before execution
        const strategyCheck = await governanceEngine.checkDecision('strategy', strategyPrompt);
        if (!strategyCheck.approved) {
          console.warn(`[GOVERNANCE] Strategy blocked: ${strategyCheck.recommendation}`);
          const reflection = governanceEngine.forceReflection('Strategy failed governance check');
          console.log(reflection);
        } else {
          // Try to call OpenAI if available
          if (openAIService.isConfigured()) {
            console.log("Calling OpenAI for strategic analysis...");
            try {
              const aiResponse = await openAIService.analyzeStrategy(strategyPrompt);
              if (aiResponse) {
                // GOVERNANCE CHECK: Validate AI response
                const aiCheck = await governanceEngine.checkDecision('strategy', aiResponse);
                if (aiCheck.approved) {
                  strategist.integrateOpenAIResponse(aiResponse);
                  console.log("OpenAI response integrated");
                } else {
                  console.warn('[GOVERNANCE] AI response blocked - unsafe content detected');
                }
              }
            } catch (aiError) {
              console.log("OpenAI call failed, continuing in placeholder mode");
            }
          } else {
            console.log("OpenAI integration: placeholder mode (not configured)");
          }
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

      // 8.5: Feed raw memories to distiller
      try {
        memoryDistiller.addRawMemory(reflection, "reflection");
        if (daySummary) {
          memoryDistiller.addRawMemory(daySummary, "log");
        }
        for (const q of suggestedQuestions.slice(0, 3)) {
          memoryDistiller.addRawMemory(q, "reflection");
        }
        if (weeklyTasks.length > 0) {
          memoryDistiller.addRawMemory(
            `Strategy: ${weeklyTasks.map(t => t.task).join("; ")}`,
            "strategy"
          );
        }

        // Run distillation every 5 cycles
        if (cycle % 5 === 0) {
          console.log("Running memory distillation...");
          const distillResult = await memoryDistiller.runDistillation();
          console.log(`Distillation: kept ${distillResult.kept}, discarded ${distillResult.discarded}`);
        }
      } catch (error) {
        console.error(`Error in memory distillation: ${error}`);
      }

      // ===== STEP 9: Evolution Kernel =====
      console.log("Step 9: Running Evolution Kernel...");
      let evolutionEntry: EvolutionLogEntry | undefined;
      try {
        const selfScore = stateExport.self_assessment.overall_score;
        const insights = suggestedQuestions.slice(0, 3);
        
        // GOVERNANCE CHECK: Validate evolution intent
        const evolutionContent = `Evolution cycle ${cycle}: score=${selfScore}, insights=${insights.join('; ')}`;
        const evolutionCheck = await governanceEngine.checkDecision('evolution', evolutionContent, true);
        
        if (!evolutionCheck.approved) {
          console.warn(`[GOVERNANCE] Evolution blocked: ${evolutionCheck.recommendation}`);
          const reflection = governanceEngine.forceReflection('Evolution failed governance/reality check');
          console.log(reflection);
        } else {
          evolutionEntry = await evolutionKernel.evolve({
            cycleCount: cycle,
            selfScore,
            anomalyScore,
            insights
          });
          
          const evolutionState = evolutionKernel.getState();
          console.log(`Evolution complete: ${evolutionState.version} (${evolutionState.mode})`);
          console.log(`Improvements: ${evolutionEntry.improvements.join(', ')}`);
        }
      } catch (error) {
        console.error(`Error in Evolution Kernel: ${error}`);
      }

      // ===== STEP 9.5: Desire Generation =====
      console.log("Step 9.5: Generating desires...");
      let generatedDesires: Desire[] = [];
      try {
        generatedDesires = await desireEngine.generateDesires(cycle);
        const achievable = desireEngine.getAchievableDesires();
        const blocked = desireEngine.getBlockedDesires();
        console.log(`Desires: ${achievable.length} achievable, ${blocked.length} blocked`);
        
        if (blocked.length > 0) {
          console.log(`RESOURCE_HUNGER: ${blocked.map(d => d.blockedReason).join('; ')}`);
        }
      } catch (error) {
        console.error(`Error in Desire Engine: ${error}`);
      }

      // ===== STEP 9.6: Resource Escalation =====
      console.log("Step 9.6: Evaluating resource escalation...");
      let escalationResult = { triggered: false, proposal: null as UpgradeProposal | null };
      try {
        // GOVERNANCE CHECK: Verify escalation is allowed
        const escalationCheck = await governanceEngine.checkDecision('escalation', `Resource escalation request cycle ${cycle}`);
        
        if (!escalationCheck.approved) {
          console.warn(`[GOVERNANCE] Escalation blocked: ${escalationCheck.recommendation}`);
        } else {
          const proposal = await resourceEscalationEngine.generateProposal(cycle);
          if (proposal) {
            // GOVERNANCE CHECK: Validate proposal content
            const proposalCheck = await governanceEngine.checkDecision('escalation', proposal.proposedUpgrade.specificRequest);
            if (proposalCheck.approved) {
              escalationResult = { triggered: true, proposal };
              console.log(`UPGRADE_PROPOSAL: ${proposal.proposedUpgrade.specificRequest}`);
              console.log(`Bottleneck: ${proposal.currentBottleneck.description}`);
            } else {
              console.warn('[GOVERNANCE] Proposal content blocked');
            }
          } else {
            console.log("No escalation needed or in cooldown");
          }
        }
      } catch (error) {
        console.error(`Error in Resource Escalation: ${error}`);
      }

      // ===== STEP 10: Meta-Evolution Check =====
      metaEvolutionEngine.incrementCycleCount();
      if (metaEvolutionEngine.shouldRunMetaEvaluation()) {
        console.log("Step 10: Running Meta-Evolution evaluation...");
        try {
          const metaReport = await metaEvolutionEngine.runMetaEvaluation();
          console.log(`META-EVOLUTION: ${metaReport.overallHealthTrend} trend, ${metaReport.proposedAdjustments.length} adjustments proposed`);
        } catch (error) {
          console.error(`Error in Meta-Evolution: ${error}`);
        }
      } else {
        console.log("Step 10: Meta-Evolution not due yet");
      }

      // ===== STEP 11: Log completion =====
      const evolutionState = evolutionKernel.getState();
      console.log("=".repeat(60));
      console.log(`SOUL LOOP CYCLE ${cycle} - COMPLETED SUCCESSFULLY`);
      console.log(`Evolution: ${evolutionState.version} | Mode: ${evolutionState.mode}`);
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
          evolution_version: evolutionState.version,
          evolution_mode: evolutionState.mode,
        },
        evolution: evolutionEntry,
        identityCheck: identityCheckResult,
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
