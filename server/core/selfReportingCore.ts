import { logger } from '../services/logger';
import { notifyOwner, getTelegramStatus } from '../services/telegram';
import { openAIService } from '../services/openai';
import { memoryBridge } from './memory';

export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type FailureType = 'missing' | 'expired' | 'invalid' | 'rate_limited' | 'unavailable';

export interface ResourceAlert {
  id: string;
  severity: AlertSeverity;
  resource_name: string;
  failure_type: FailureType;
  detected_at: string;
  last_known_working_time: string | null;
  human_action_required: string;
  notified_via_telegram: boolean;
  notification_sent_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
}

export interface ResourceStatus {
  name: string;
  configured: boolean;
  last_check: string | null;
  last_success: string | null;
  consecutive_failures: number;
  current_state: 'healthy' | 'degraded' | 'failed' | 'unknown';
  failure_type: FailureType | null;
}

interface SelfReportingState {
  alerts: ResourceAlert[];
  resource_statuses: Map<string, ResourceStatus>;
  last_full_check: string | null;
  check_interval_ms: number;
  cooldown_ms: number;
  alert_cooldowns: Map<string, number>;
  total_alerts_sent: number;
  enabled: boolean;
}

const DEFAULT_CHECK_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_CONSECUTIVE_FAILURES_BEFORE_CRITICAL = 3;
const MAX_ALERTS_HISTORY = 100;

class SelfReportingCore {
  private state: SelfReportingState;
  private checkTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.state = {
      alerts: [],
      resource_statuses: new Map(),
      last_full_check: null,
      check_interval_ms: DEFAULT_CHECK_INTERVAL_MS,
      cooldown_ms: DEFAULT_COOLDOWN_MS,
      alert_cooldowns: new Map(),
      total_alerts_sent: 0,
      enabled: true,
    };

    this.initializeResourceStatuses();
    logger.info('[SelfReporting] Initialized - API key monitoring active');
  }

  private initializeResourceStatuses(): void {
    const resources = [
      'OPENAI_API_KEY',
      'NOTION_TOKEN',
      'TELEGRAM_BOT_TOKEN',
    ];

    for (const name of resources) {
      this.state.resource_statuses.set(name, {
        name,
        configured: !!process.env[name],
        last_check: null,
        last_success: null,
        consecutive_failures: 0,
        current_state: 'unknown',
        failure_type: null,
      });
    }
  }

  async checkAllResources(): Promise<{
    checked: number;
    healthy: number;
    degraded: number;
    failed: number;
    alerts_generated: number;
  }> {
    if (!this.state.enabled) {
      return { checked: 0, healthy: 0, degraded: 0, failed: 0, alerts_generated: 0 };
    }

    logger.info('[SelfReporting] Running resource health check...');
    this.state.last_full_check = new Date().toISOString();

    let healthy = 0;
    let degraded = 0;
    let failed = 0;
    let alertsGenerated = 0;

    const results = await Promise.all([
      this.checkOpenAI(),
      this.checkNotion(),
      this.checkTelegram(),
    ]);

    for (const result of results) {
      if (result.state === 'healthy') healthy++;
      else if (result.state === 'degraded') degraded++;
      else if (result.state === 'failed') failed++;
      if (result.alert_sent) alertsGenerated++;
    }

    logger.info(`[SelfReporting] Check complete: ${healthy} healthy, ${degraded} degraded, ${failed} failed`);

    return {
      checked: results.length,
      healthy,
      degraded,
      failed,
      alerts_generated: alertsGenerated,
    };
  }

  private async checkOpenAI(): Promise<{ state: string; alert_sent: boolean }> {
    const resourceName = 'OPENAI_API_KEY';
    const status = this.state.resource_statuses.get(resourceName)!;
    status.last_check = new Date().toISOString();

    if (!process.env.OPENAI_API_KEY) {
      return this.handleResourceFailure(resourceName, 'missing', 
        'Add OPENAI_API_KEY to environment secrets');
    }

    try {
      const isConfigured = openAIService.isConfigured();
      if (!isConfigured) {
        return this.handleResourceFailure(resourceName, 'invalid',
          'Verify OPENAI_API_KEY is valid and has credits');
      }

      const testResult = await this.testOpenAIConnection();
      if (!testResult.success) {
        const failureType = testResult.rateLimited ? 'rate_limited' : 'invalid';
        const action = testResult.rateLimited 
          ? 'Check OpenAI usage limits and billing'
          : 'Regenerate OPENAI_API_KEY from OpenAI dashboard';
        return this.handleResourceFailure(resourceName, failureType, action);
      }

      return this.handleResourceSuccess(resourceName);
    } catch (error: any) {
      const failureType = error.message?.includes('429') ? 'rate_limited' : 'unavailable';
      return this.handleResourceFailure(resourceName, failureType,
        'Check OpenAI API status and credentials');
    }
  }

  private async testOpenAIConnection(): Promise<{ success: boolean; rateLimited: boolean }> {
    try {
      const result = await openAIService.testConnection();
      return { success: result, rateLimited: false };
    } catch (error: any) {
      const rateLimited = error.message?.includes('429') || error.message?.includes('rate');
      return { success: false, rateLimited };
    }
  }

  private async checkNotion(): Promise<{ state: string; alert_sent: boolean }> {
    const resourceName = 'NOTION_TOKEN';
    const status = this.state.resource_statuses.get(resourceName)!;
    status.last_check = new Date().toISOString();

    if (!process.env.NOTION_TOKEN) {
      return this.handleResourceFailure(resourceName, 'missing',
        'Add NOTION_TOKEN to environment secrets');
    }

    try {
      const isConnected = memoryBridge.isConnected();
      if (!isConnected) {
        return this.handleResourceFailure(resourceName, 'invalid',
          'Verify NOTION_TOKEN has correct permissions');
      }

      return this.handleResourceSuccess(resourceName);
    } catch (error) {
      return this.handleResourceFailure(resourceName, 'unavailable',
        'Check Notion API status and token validity');
    }
  }

  private async checkTelegram(): Promise<{ state: string; alert_sent: boolean }> {
    const resourceName = 'TELEGRAM_BOT_TOKEN';
    const status = this.state.resource_statuses.get(resourceName)!;
    status.last_check = new Date().toISOString();

    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn('[SelfReporting] TELEGRAM_BOT_TOKEN missing - cannot send alerts');
      status.configured = false;
      status.current_state = 'failed';
      status.failure_type = 'missing';
      status.consecutive_failures++;
      return { state: 'failed', alert_sent: false };
    }

    try {
      const telegramStatus = getTelegramStatus();
      if (!telegramStatus.connected) {
        status.current_state = 'failed';
        status.failure_type = 'invalid';
        status.consecutive_failures++;
        logger.error('[SelfReporting] Telegram not connected - alerts disabled');
        return { state: 'failed', alert_sent: false };
      }

      return this.handleResourceSuccess(resourceName);
    } catch (error) {
      status.current_state = 'failed';
      status.failure_type = 'unavailable';
      status.consecutive_failures++;
      return { state: 'failed', alert_sent: false };
    }
  }

  private handleResourceSuccess(resourceName: string): { state: string; alert_sent: boolean } {
    const status = this.state.resource_statuses.get(resourceName)!;
    const wasHealthy = status.current_state === 'healthy';
    
    status.configured = true;
    status.last_success = new Date().toISOString();
    status.consecutive_failures = 0;
    status.current_state = 'healthy';
    status.failure_type = null;

    if (!wasHealthy && status.last_check) {
      logger.info(`[SelfReporting] ${resourceName} recovered to healthy state`);
      this.resolveAlertsForResource(resourceName);
    }

    return { state: 'healthy', alert_sent: false };
  }

  private async handleResourceFailure(
    resourceName: string,
    failureType: FailureType,
    humanAction: string
  ): Promise<{ state: string; alert_sent: boolean }> {
    const status = this.state.resource_statuses.get(resourceName)!;
    status.consecutive_failures++;
    status.failure_type = failureType;

    const severity: AlertSeverity = 
      status.consecutive_failures >= MAX_CONSECUTIVE_FAILURES_BEFORE_CRITICAL 
        ? 'CRITICAL' 
        : 'WARNING';

    status.current_state = severity === 'CRITICAL' ? 'failed' : 'degraded';

    logger.warn(`[SelfReporting] ${resourceName} failure: ${failureType} (${severity})`);

    const alertSent = await this.createAndSendAlert(
      resourceName,
      severity,
      failureType,
      status.last_success,
      humanAction
    );

    return { state: status.current_state, alert_sent: alertSent };
  }

  private async createAndSendAlert(
    resourceName: string,
    severity: AlertSeverity,
    failureType: FailureType,
    lastWorkingTime: string | null,
    humanAction: string
  ): Promise<boolean> {
    if (!this.canSendAlert(resourceName)) {
      logger.info(`[SelfReporting] Alert for ${resourceName} suppressed (cooldown)`);
      return false;
    }

    const existingAlert = this.state.alerts.find(
      a => a.resource_name === resourceName && !a.resolved
    );

    if (existingAlert) {
      if (severity === 'CRITICAL' && existingAlert.severity === 'WARNING') {
        existingAlert.severity = 'CRITICAL';
        existingAlert.detected_at = new Date().toISOString();
        logger.info(`[SelfReporting] Escalating alert for ${resourceName} to CRITICAL`);
        
        this.state.alert_cooldowns.delete(resourceName);
        const sent = await this.sendTelegramAlert(existingAlert);
        if (sent) {
          existingAlert.notification_sent_at = new Date().toISOString();
          this.state.total_alerts_sent++;
          this.state.alert_cooldowns.set(resourceName, Date.now());
          logger.info(`[SelfReporting] CRITICAL escalation sent via Telegram for ${resourceName}`);
        }
        return sent;
      } else {
        return false;
      }
    }

    const alert: ResourceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      resource_name: resourceName,
      failure_type: failureType,
      detected_at: new Date().toISOString(),
      last_known_working_time: lastWorkingTime,
      human_action_required: humanAction,
      notified_via_telegram: false,
      notification_sent_at: null,
      resolved: false,
      resolved_at: null,
    };

    this.state.alerts.push(alert);
    this.trimAlertHistory();

    const sent = await this.sendTelegramAlert(alert);
    if (sent) {
      alert.notified_via_telegram = true;
      alert.notification_sent_at = new Date().toISOString();
      this.state.total_alerts_sent++;
      this.state.alert_cooldowns.set(resourceName, Date.now());
    }

    return sent;
  }

  private canSendAlert(resourceName: string): boolean {
    const lastSent = this.state.alert_cooldowns.get(resourceName);
    if (!lastSent) return true;
    return Date.now() - lastSent > this.state.cooldown_ms;
  }

  private async sendTelegramAlert(alert: ResourceAlert): Promise<boolean> {
    const telegramStatus = getTelegramStatus();
    if (!telegramStatus.connected) {
      logger.error('[SelfReporting] Cannot send alert - Telegram not connected');
      return false;
    }

    const message = this.formatAlertMessage(alert);

    try {
      const sent = await notifyOwner(message);
      if (sent) {
        logger.info(`[SelfReporting] Alert sent via Telegram: ${alert.resource_name} (${alert.severity})`);
      } else {
        logger.error(`[SelfReporting] Failed to send Telegram alert for ${alert.resource_name}`);
      }
      return sent;
    } catch (error) {
      logger.error('[SelfReporting] Telegram alert error:', error);
      return false;
    }
  }

  private formatAlertMessage(alert: ResourceAlert): string {
    const icon = alert.severity === 'CRITICAL' ? '[X]' : '[!]';
    const lines = [
      `${icon} CipherH ALERT: ${alert.severity}`,
      ``,
      `Resource: ${alert.resource_name}`,
      `Failure: ${alert.failure_type.toUpperCase()}`,
      `Detected: ${alert.detected_at}`,
    ];

    if (alert.last_known_working_time) {
      lines.push(`Last Working: ${alert.last_known_working_time}`);
    }

    lines.push(``);
    lines.push(`ACTION REQUIRED:`);
    lines.push(alert.human_action_required);
    lines.push(``);
    lines.push(`CipherH cannot operate fully without this resource.`);

    return lines.join('\n');
  }

  private resolveAlertsForResource(resourceName: string): void {
    const now = new Date().toISOString();
    for (const alert of this.state.alerts) {
      if (alert.resource_name === resourceName && !alert.resolved) {
        alert.resolved = true;
        alert.resolved_at = now;
        logger.info(`[SelfReporting] Alert resolved: ${alert.id}`);
      }
    }
  }

  private trimAlertHistory(): void {
    if (this.state.alerts.length > MAX_ALERTS_HISTORY) {
      const resolved = this.state.alerts.filter(a => a.resolved);
      const unresolved = this.state.alerts.filter(a => !a.resolved);
      this.state.alerts = [
        ...resolved.slice(-MAX_ALERTS_HISTORY / 2),
        ...unresolved,
      ];
    }
  }

  start(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }

    this.state.enabled = true;
    this.checkTimer = setInterval(() => {
      this.checkAllResources();
    }, this.state.check_interval_ms);

    setTimeout(() => this.checkAllResources(), 10000);

    logger.info(`[SelfReporting] Started - checking every ${this.state.check_interval_ms / 1000}s`);
  }

  stop(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.state.enabled = false;
    logger.info('[SelfReporting] Stopped');
  }

  getAlerts(includeResolved: boolean = false): ResourceAlert[] {
    if (includeResolved) {
      return [...this.state.alerts];
    }
    return this.state.alerts.filter(a => !a.resolved);
  }

  getResourceStatuses(): ResourceStatus[] {
    return Array.from(this.state.resource_statuses.values());
  }

  exportStatus(): {
    enabled: boolean;
    last_check: string | null;
    check_interval_ms: number;
    total_alerts_sent: number;
    active_alerts: number;
    resources: ResourceStatus[];
  } {
    return {
      enabled: this.state.enabled,
      last_check: this.state.last_full_check,
      check_interval_ms: this.state.check_interval_ms,
      total_alerts_sent: this.state.total_alerts_sent,
      active_alerts: this.state.alerts.filter(a => !a.resolved).length,
      resources: this.getResourceStatuses(),
    };
  }

  async manualCheck(): Promise<{
    checked: number;
    healthy: number;
    degraded: number;
    failed: number;
    alerts_generated: number;
  }> {
    return this.checkAllResources();
  }

  setCooldown(ms: number): void {
    this.state.cooldown_ms = Math.max(60000, ms);
    logger.info(`[SelfReporting] Cooldown set to ${this.state.cooldown_ms}ms`);
  }

  setCheckInterval(ms: number): void {
    this.state.check_interval_ms = Math.max(60000, ms);
    if (this.state.enabled) {
      this.stop();
      this.start();
    }
    logger.info(`[SelfReporting] Check interval set to ${this.state.check_interval_ms}ms`);
  }
}

export const selfReportingCore = new SelfReportingCore();
