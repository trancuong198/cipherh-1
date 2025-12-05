// CipherH Strategist
// Tu de xuat huong di, chinh sach, muc tieu moi

import { SoulStateExport } from "./soulState";
import { AnalysisResult } from "./analyzer";

export interface WeeklyTask {
  task: string;
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
  estimated_time: string;
  suggested_actions: string[];
}

export interface MonthlyPlan {
  month: string;
  created_at: string;
  focus_areas: {
    area: string;
    objective: string;
    approach: string;
  }[];
  milestones: Record<string, string>[];
  risk_mitigation: string[];
  growth_targets: Record<string, number>;
}

export interface GoalAlignment {
  timestamp: string;
  is_aligned: boolean;
  alignment_score: number;
  gaps: string[];
  recommendations: string[];
}

export interface StrategyRecord {
  type: string;
  content: string;
  source: string;
  created_at: string;
  status: "pending" | "in_progress" | "completed";
}

export class Strategist {
  longTermGoals: string[] = [];
  strategies: StrategyRecord[] = [];
  priorities: string[] = [];
  weeklyTasks: WeeklyTask[] = [];
  monthlyPlan: MonthlyPlan | null = null;

  proposeWeeklyTasks(state: SoulStateExport, analysisResult: AnalysisResult): WeeklyTask[] {
    const tasks: WeeklyTask[] = [];

    const anomalyScore = analysisResult.anomaly_score;
    const trend = analysisResult.pattern_summary.trend;
    const doubts = state.doubts;
    const confidence = state.confidence;

    if (anomalyScore > 50) {
      tasks.push({
        task: "Dieu tra va khac phuc bat thuong nghiem trong",
        priority: "critical",
        reason: `Anomaly score cao: ${anomalyScore}`,
        estimated_time: "2-3 days",
        suggested_actions: [
          "Phan tich chi tiet logs",
          "Xac dinh root cause",
          "Implement fixes",
        ],
      });
    }

    if (trend === "declining") {
      tasks.push({
        task: "Cai thien xu huong he thong dang giam sut",
        priority: "high",
        reason: "Trend declining phat hien",
        estimated_time: "3-4 days",
        suggested_actions: [
          "Review recent changes",
          "Optimize performance",
          "Strengthen error handling",
        ],
      });
    }

    if (doubts > 50) {
      tasks.push({
        task: "Xay dung lai confidence va giam doubts",
        priority: "high",
        reason: `Doubts level cao: ${doubts}`,
        estimated_time: "1-2 days",
        suggested_actions: [
          "Validate current assumptions",
          "Run comprehensive tests",
          "Review decision logic",
        ],
      });
    }

    if (trend === "improving" && confidence > 80) {
      tasks.push({
        task: "Mo rong kha nang va thu nghiem tinh nang moi",
        priority: "medium",
        reason: "He thong on dinh, co the mo rong",
        estimated_time: "4-5 days",
        suggested_actions: [
          "Identify new opportunities",
          "Prototype new features",
          "Gradual rollout",
        ],
      });
    }

    if (state.goals_long_term.length === 0) {
      tasks.push({
        task: "Dinh nghia muc tieu dai han",
        priority: "high",
        reason: "Chua co long-term goals",
        estimated_time: "1 day",
        suggested_actions: [
          "Analyze current capabilities",
          "Set SMART goals",
          "Create roadmap",
        ],
      });
    }

    if (tasks.length === 0) {
      tasks.push({
        task: "Duy tri va giam sat he thong",
        priority: "low",
        reason: "He thong hoat dong on dinh",
        estimated_time: "ongoing",
        suggested_actions: [
          "Monitor metrics",
          "Regular health checks",
          "Documentation updates",
        ],
      });
    }

    this.weeklyTasks = tasks;
    console.log(`Proposed ${tasks.length} weekly tasks`);

    return tasks;
  }

  proposeMonthlyPlan(state: SoulStateExport): MonthlyPlan {
    const confidence = state.confidence;
    const doubts = state.doubts;
    const goals = state.goals_long_term;
    const lessonsCount = state.lessons_learned.length;

    const plan: MonthlyPlan = {
      month: new Date().toISOString().slice(0, 7),
      created_at: new Date().toISOString(),
      focus_areas: [],
      milestones: [],
      risk_mitigation: [],
      growth_targets: {},
    };

    if (doubts > 30) {
      plan.focus_areas.push({
        area: "Stability & Trust Building",
        objective: "Giam doubts xuong duoi 20",
        approach: "Strengthen validation and testing",
      });
      plan.risk_mitigation.push("Implement additional safeguards against anomalies");
    }

    if (confidence < 70) {
      plan.focus_areas.push({
        area: "Confidence Enhancement",
        objective: "Tang confidence len tren 80",
        approach: "Improve success rate and reduce errors",
      });
    }

    if (confidence >= 80 && doubts < 20) {
      plan.focus_areas.push({
        area: "Capability Expansion",
        objective: "Mo rong kha nang va hoc hoi moi",
        approach: "Experiment with new strategies and techniques",
      });
      plan.growth_targets["new_skills"] = 2;
      plan.growth_targets["new_features"] = 3;
    }

    if (goals.length > 0) {
      goals.slice(0, 3).forEach((goal, i) => {
        plan.milestones.push({
          [`milestone_${i + 1}`]: `Progress on: ${goal}`,
          target_completion: "30%",
        });
      });
    } else {
      plan.milestones.push({
        milestone_1: "Define 3 long-term goals",
        target_completion: "100%",
      });
    }

    plan.milestones.push({
      milestone_lessons: `Learn ${Math.max(5, lessonsCount + 5)} new lessons`,
      target_completion: "80%",
    });

    this.monthlyPlan = plan;
    console.log(`Proposed monthly plan with ${plan.focus_areas.length} focus areas`);

    return plan;
  }

  alignWithGoals(state: SoulStateExport): GoalAlignment {
    const goals = state.goals_long_term;
    const currentFocus = state.current_focus;
    const actions = state.last_actions;

    const alignment: GoalAlignment = {
      timestamp: new Date().toISOString(),
      is_aligned: false,
      alignment_score: 0,
      gaps: [],
      recommendations: [],
    };

    if (goals.length === 0) {
      alignment.gaps.push("No long-term goals defined");
      alignment.recommendations.push("Define at least 3 long-term goals");
      alignment.alignment_score = 0;
      return alignment;
    }

    if (!currentFocus) {
      alignment.gaps.push("No current focus set");
      alignment.recommendations.push(`Set focus to one of: ${goals[0]}`);
      alignment.alignment_score = 30;
    } else if (goals.includes(currentFocus)) {
      alignment.alignment_score += 40;
    }

    if (actions.length > 0) {
      const recentActionsAligned = actions.slice(-5).some((action) =>
        goals.some((goal) => goal.toLowerCase().includes(action.action.toLowerCase()))
      );
      if (recentActionsAligned) {
        alignment.alignment_score += 30;
      } else {
        alignment.gaps.push("Recent actions not aligned with goals");
        alignment.recommendations.push("Refocus actions towards current goals");
      }
    }

    if (goals.length > 5) {
      alignment.gaps.push("Too many goals, may lose focus");
      alignment.recommendations.push("Prioritize top 3 goals");
    }

    alignment.is_aligned = alignment.alignment_score >= 70;

    console.log(`Goal alignment score: ${alignment.alignment_score}`);

    return alignment;
  }

  generateStrategyPrompt(state: SoulStateExport, analysis: AnalysisResult): string {
    const anomalyScore = analysis.anomaly_score;
    const trend = analysis.pattern_summary.trend;
    const questions = analysis.suggested_questions;
    const daySummary = analysis.day_summary;

    const doubts = state.doubts;
    const confidence = state.confidence;
    const goals = state.goals_long_term;
    const currentFocus = state.current_focus || "none";
    const reflection = state.reflection;

    const prompt = `Ban la strategist AI cho he thong tu tri.

**Current State:**
- Doubts: ${doubts}/100
- Confidence: ${confidence}/100
- Current Focus: ${currentFocus}
- Long-term Goals: ${goals.length > 0 ? goals.join(", ") : "chua dinh nghia"}

**Recent Analysis:**
- Anomaly Score: ${anomalyScore}/100
- Trend: ${trend}
- Summary: ${daySummary}

**Self-Reflection:**
${reflection}

**Pending Questions:**
${questions.slice(0, 5).map((q) => `- ${q}`).join("\n")}

**Your Task:**
1. Danh gia tinh trang hien tai (tot/xau/trung binh)
2. De xuat 3-5 hanh dong cu the cho tuan toi
3. De xuat dieu chinh muc tieu (neu can)
4. Tra loi cac cau hoi pending (neu co du context)

**Strategic Logic:**
- Neu anomaly_score > 50: Tap trung vao stability va investigation
- Neu trend = declining: Tang cuong quality control va testing
- Neu doubts > 50: Xay dung lai trust thong qua validation
- Neu trend = improving va confidence > 80: Mo rong capabilities

Hay tra loi duoi dang JSON:
{
  "assessment": "...",
  "weekly_actions": ["...", "..."],
  "goal_adjustments": ["...", "..."],
  "answers_to_questions": {"question": "answer", ...}
}`;

    console.log("Generated strategy prompt");

    return prompt;
  }

  integrateOpenAIResponse(response: {
    assessment?: string;
    weekly_actions?: string[];
    goal_adjustments?: string[];
    answers_to_questions?: Record<string, string>;
  }): {
    timestamp: string;
    actions_integrated: string[];
    goals_updated: string[];
    insights_captured: Array<{ type: string; content?: string; question?: string; answer?: string }>;
  } {
    const integration = {
      timestamp: new Date().toISOString(),
      actions_integrated: [] as string[],
      goals_updated: [] as string[],
      insights_captured: [] as Array<{ type: string; content?: string; question?: string; answer?: string }>,
    };

    if (response.weekly_actions) {
      for (const action of response.weekly_actions) {
        this.strategies.push({
          type: "weekly_action",
          content: action,
          source: "openai_strategist",
          created_at: new Date().toISOString(),
          status: "pending",
        });
        integration.actions_integrated.push(action);
      }
    }

    if (response.goal_adjustments) {
      for (const adjustment of response.goal_adjustments) {
        integration.goals_updated.push(adjustment);
      }
    }

    if (response.assessment) {
      integration.insights_captured.push({
        type: "assessment",
        content: response.assessment,
      });
    }

    if (response.answers_to_questions) {
      for (const [question, answer] of Object.entries(response.answers_to_questions)) {
        integration.insights_captured.push({
          type: "question_answer",
          question,
          answer,
        });
      }
    }

    console.log(`Integrated OpenAI response: ${integration.actions_integrated.length} actions`);

    return integration;
  }

  setLongTermGoals(goals: string[]): void {
    console.log(`Setting long-term goals: ${goals}`);
    this.longTermGoals = goals;
  }

  addGoal(goal: string): void {
    if (!this.longTermGoals.includes(goal)) {
      this.longTermGoals.push(goal);
      console.log(`Added goal: ${goal}`);
    }
  }

  getWeeklyTasks(): WeeklyTask[] {
    return this.weeklyTasks;
  }

  getMonthlyPlan(): MonthlyPlan | null {
    return this.monthlyPlan;
  }

  getStrategies(): StrategyRecord[] {
    return this.strategies;
  }
}

export const strategist = new Strategist();
