// CipherH Log Analyzer
// Doc log -> phan tich -> rut quy luat -> tim bat thuong

import fs from "fs";
import path from "path";

export interface PatternSummary {
  total_lines: number;
  error_count: number;
  warning_count: number;
  success_count: number;
  cycles_detected: number;
  repeated_errors: string[];
  repeated_warnings: string[];
  trend: "improving" | "declining" | "stable";
  most_common_error: [string, number] | null;
  most_common_warning: [string, number] | null;
}

export interface AnomalyItem {
  type: string;
  severity: "high" | "medium" | "low";
  description: string;
  score_impact: number;
}

export interface AnalysisResult {
  timestamp: string;
  pattern_summary: PatternSummary;
  anomalies: AnomalyItem[];
  anomaly_score: number;
  suggested_questions: string[];
  day_summary: string;
  total_anomalies: number;
  severity_breakdown: {
    high: number;
    medium: number;
    low: number;
  };
}

export class LogAnalyzer {
  private logsDir: string;
  private systemLogPath: string;
  private logLines: string[] = [];
  private errorCounts: Map<string, number> = new Map();
  private warningCounts: Map<string, number> = new Map();
  private anomalies: AnomalyItem[] = [];

  constructor(logsDir: string = "logs") {
    this.logsDir = logsDir;
    this.systemLogPath = path.join(logsDir, "system.log");

    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  readLogs(): string[] {
    if (!fs.existsSync(this.systemLogPath)) {
      console.log(`Log file not found: ${this.systemLogPath}`);
      return [];
    }

    try {
      const content = fs.readFileSync(this.systemLogPath, "utf-8");
      this.logLines = content.split("\n").filter((line) => line.trim());
      console.log(`Read ${this.logLines.length} log lines`);
      return this.logLines;
    } catch (error) {
      console.error(`Error reading logs: ${error}`);
      return [];
    }
  }

  detectPatterns(): PatternSummary {
    if (this.logLines.length === 0) {
      this.readLogs();
    }

    const errorPattern = /ERROR|Error|error|CRITICAL|Critical/;
    const warningPattern = /WARNING|Warning|warning|WARN/;
    const successPattern = /success|completed|SUCCESS|Completed/;
    const cyclePattern = /Cycle (\d+)/;

    const errors: string[] = [];
    const warnings: string[] = [];
    const successes: string[] = [];
    const cycles: number[] = [];

    this.errorCounts.clear();
    this.warningCounts.clear();

    for (const line of this.logLines) {
      if (errorPattern.test(line)) {
        errors.push(line);
        const errorMsg = this.extractErrorMessage(line);
        if (errorMsg) {
          this.errorCounts.set(errorMsg, (this.errorCounts.get(errorMsg) || 0) + 1);
        }
      }

      if (warningPattern.test(line)) {
        warnings.push(line);
        const warningMsg = this.extractWarningMessage(line);
        if (warningMsg) {
          this.warningCounts.set(warningMsg, (this.warningCounts.get(warningMsg) || 0) + 1);
        }
      }

      if (successPattern.test(line)) {
        successes.push(line);
      }

      const cycleMatch = line.match(cyclePattern);
      if (cycleMatch) {
        cycles.push(parseInt(cycleMatch[1], 10));
      }
    }

    const repeatedErrors = Array.from(this.errorCounts.entries())
      .filter(([, count]) => count > 3)
      .map(([err]) => err);

    const repeatedWarnings = Array.from(this.warningCounts.entries())
      .filter(([, count]) => count > 5)
      .map(([warn]) => warn);

    let trend: "improving" | "declining" | "stable";
    if (errors.length === 0 && warnings.length === 0) {
      trend = "stable";
    } else if (successes.length > errors.length) {
      trend = "improving";
    } else {
      trend = "declining";
    }

    const mostCommonError = this.getMostCommon(this.errorCounts);
    const mostCommonWarning = this.getMostCommon(this.warningCounts);

    console.log(`Pattern detection complete: ${trend} trend`);

    return {
      total_lines: this.logLines.length,
      error_count: errors.length,
      warning_count: warnings.length,
      success_count: successes.length,
      cycles_detected: cycles.length,
      repeated_errors: repeatedErrors,
      repeated_warnings: repeatedWarnings,
      trend,
      most_common_error: mostCommonError,
      most_common_warning: mostCommonWarning,
    };
  }

  detectAnomalies(): { anomalies: AnomalyItem[]; anomalyScore: number } {
    if (this.logLines.length === 0) {
      this.readLogs();
    }

    this.anomalies = [];
    let anomalyScore = 0;

    const patterns = this.detectPatterns();

    if (patterns.error_count > 10) {
      this.anomalies.push({
        type: "high_error_rate",
        severity: "high",
        description: `Phat hien ${patterns.error_count} loi`,
        score_impact: 30,
      });
      anomalyScore += 30;
    }

    if (patterns.repeated_errors.length > 0) {
      this.anomalies.push({
        type: "repeated_errors",
        severity: "medium",
        description: `Loi lap lai: ${patterns.repeated_errors.slice(0, 3).join(", ")}`,
        score_impact: 20,
      });
      anomalyScore += 20;
    }

    if (patterns.warning_count > 20) {
      this.anomalies.push({
        type: "excessive_warnings",
        severity: "medium",
        description: `Qua nhieu canh bao: ${patterns.warning_count}`,
        score_impact: 15,
      });
      anomalyScore += 15;
    }

    if (patterns.trend === "declining") {
      this.anomalies.push({
        type: "declining_trend",
        severity: "medium",
        description: "Xu huong giam sut: loi > thanh cong",
        score_impact: 25,
      });
      anomalyScore += 25;
    }

    const errorRate = (patterns.error_count / Math.max(patterns.total_lines, 1)) * 100;
    if (errorRate > 10) {
      this.anomalies.push({
        type: "high_error_percentage",
        severity: "high",
        description: `Ty le loi cao: ${errorRate.toFixed(1)}%`,
        score_impact: 20,
      });
      anomalyScore += 20;
    }

    anomalyScore = Math.min(100, anomalyScore);

    console.log(`Anomaly detection complete: score=${anomalyScore}, found=${this.anomalies.length}`);

    return { anomalies: this.anomalies, anomalyScore };
  }

  summarizeDay(): string {
    if (this.logLines.length === 0) {
      this.readLogs();
    }

    const patterns = this.detectPatterns();
    const { anomalyScore } = this.detectAnomalies();

    let summary = "Bai hoc rut ra hom nay:\n";

    if (patterns.trend === "stable" && patterns.error_count === 0) {
      summary += "- He thong hoat dong on dinh, khong co loi nghiem trong.\n";
    } else if (patterns.trend === "improving") {
      summary += "- He thong dang cai thien, ty le thanh cong tang.\n";
    } else {
      summary += "- He thong can chu y, xu huong dang giam sut.\n";
    }

    if (patterns.repeated_errors.length > 0) {
      summary += `- Phat hien loi lap lai: ${patterns.repeated_errors[0].substring(0, 50)}... (can xu ly).\n`;
    }

    if (anomalyScore > 50) {
      summary += `- Muc do bat thuong cao (${anomalyScore}/100), can dieu tra ngay.\n`;
    } else if (anomalyScore > 20) {
      summary += `- Co mot so bat thuong nho (${anomalyScore}/100), nen kiem tra.\n`;
    }

    if (patterns.cycles_detected > 0) {
      summary += `- Da hoan thanh ${patterns.cycles_detected} chu ky.\n`;
    }

    if (patterns.success_count > 0) {
      summary += `- Ghi nhan ${patterns.success_count} thao tac thanh cong.\n`;
    }

    return summary.trim();
  }

  extractQuestions(): string[] {
    if (this.anomalies.length === 0) {
      this.detectAnomalies();
    }

    const questions: string[] = [];
    const patterns = this.detectPatterns();

    if (patterns.error_count > 5) {
      questions.push(`Tai sao co ${patterns.error_count} loi trong log gan day?`);
    }

    if (patterns.repeated_errors.length > 0) {
      for (const error of patterns.repeated_errors.slice(0, 2)) {
        questions.push(`Tai sao loi '${error.substring(0, 50)}...' lap lai nhieu lan?`);
      }
    }

    if (patterns.trend === "declining") {
      questions.push("Tai sao xu huong he thong dang giam sut?");
    }

    for (const anomaly of this.anomalies.slice(0, 3)) {
      if (anomaly.severity === "high") {
        questions.push(`Lam the nao de khac phuc: ${anomaly.description}?`);
      }
    }

    if (patterns.warning_count > 10) {
      questions.push("Canh bao nao dang xuat hien thuong xuyen nhat?");
    }

    if (questions.length === 0) {
      questions.push("He thong co hoat dong toi uu khong?");
    }

    console.log(`Generated ${questions.length} questions`);

    return questions;
  }

  returnAnalysis(): AnalysisResult {
    const patternSummary = this.detectPatterns();
    const { anomalies, anomalyScore } = this.detectAnomalies();
    const suggestedQuestions = this.extractQuestions();
    const daySummary = this.summarizeDay();

    const analysis: AnalysisResult = {
      timestamp: new Date().toISOString(),
      pattern_summary: patternSummary,
      anomalies,
      anomaly_score: anomalyScore,
      suggested_questions: suggestedQuestions,
      day_summary: daySummary,
      total_anomalies: anomalies.length,
      severity_breakdown: {
        high: anomalies.filter((a) => a.severity === "high").length,
        medium: anomalies.filter((a) => a.severity === "medium").length,
        low: anomalies.filter((a) => a.severity === "low").length,
      },
    };

    console.log("Full analysis complete");

    return analysis;
  }

  private extractErrorMessage(line: string): string {
    const parts = line.split(" - ");
    if (parts.length >= 4) {
      return parts[parts.length - 1].trim().substring(0, 100);
    }
    return line.trim().substring(0, 100);
  }

  private extractWarningMessage(line: string): string {
    const parts = line.split(" - ");
    if (parts.length >= 4) {
      return parts[parts.length - 1].trim().substring(0, 100);
    }
    return line.trim().substring(0, 100);
  }

  private getMostCommon(counts: Map<string, number>): [string, number] | null {
    if (counts.size === 0) return null;
    let maxEntry: [string, number] | null = null;
    for (const [key, value] of counts.entries()) {
      if (!maxEntry || value > maxEntry[1]) {
        maxEntry = [key, value];
      }
    }
    return maxEntry;
  }
}

export const logAnalyzer = new LogAnalyzer();
