// CipherH Logger Service
// Winston-based logging với console và file output

import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class LoggerService {
  private logDir: string;
  private logFile: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.logDir = "logs";
    this.logFile = path.join(this.logDir, "system.log");

    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatTimestamp(): string {
    return new Date().toISOString().replace("T", " ").replace("Z", "");
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.formatTimestamp();
    return `${timestamp} - ${level.toUpperCase()} - ${message}`;
  }

  private writeToFile(formattedMessage: string): void {
    try {
      fs.appendFileSync(this.logFile, formattedMessage + "\n");
    } catch (error) {
      console.error("Error writing to log file:", error);
    }
  }

  private addEntry(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep logs under max limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  debug(message: string, data?: any): void {
    const formatted = this.formatMessage("debug", message);
    console.debug(formatted);
    this.writeToFile(formatted);
    this.addEntry("debug", message, data);
  }

  info(message: string, data?: any): void {
    const formatted = this.formatMessage("info", message);
    console.log(formatted);
    this.writeToFile(formatted);
    this.addEntry("info", message, data);
  }

  warn(message: string, data?: any): void {
    const formatted = this.formatMessage("warn", message);
    console.warn(formatted);
    this.writeToFile(formatted);
    this.addEntry("warn", message, data);
  }

  error(message: string, data?: any): void {
    const formatted = this.formatMessage("error", message);
    console.error(formatted);
    this.writeToFile(formatted);
    this.addEntry("error", message, data);
  }

  critical(message: string, data?: any): void {
    const formatted = this.formatMessage("critical", message);
    console.error(`[CRITICAL] ${formatted}`);
    this.writeToFile(formatted);
    this.addEntry("critical", message, data);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
    try {
      fs.writeFileSync(this.logFile, "");
      console.log("Logs cleared");
    } catch (error) {
      console.error("Error clearing log file:", error);
    }
  }

  getLogFilePath(): string {
    return this.logFile;
  }

  getLogStats(): {
    total: number;
    by_level: Record<LogLevel, number>;
    file_size_kb: number;
  } {
    const byLevel: Record<LogLevel, number> = {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      critical: 0,
    };

    for (const log of this.logs) {
      byLevel[log.level]++;
    }

    let fileSizeKb = 0;
    try {
      const stats = fs.statSync(this.logFile);
      fileSizeKb = Math.round(stats.size / 1024);
    } catch {
      fileSizeKb = 0;
    }

    return {
      total: this.logs.length,
      by_level: byLevel,
      file_size_kb: fileSizeKb,
    };
  }
}

export const logger = new LoggerService();
