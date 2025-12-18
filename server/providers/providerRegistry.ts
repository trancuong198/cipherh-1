import { 
  ProviderType, 
  AnyProvider, 
  ILLMProvider, 
  IMemoryProvider, 
  IInfraProvider,
  MigrationReport,
  MigrationDelta,
  ProviderHealth,
  LLMGenerateRequest
} from './types';
import { openAIProvider, placeholderLLMProvider } from './llmProvider';
import { notionMemoryProvider, localMemoryProvider } from './memoryProvider';
import { replitInfraProvider, genericInfraProvider } from './infraProvider';
import { logger } from '../services/logger';
import { identityCore } from '../core/identityCore';
import { continuityEngine } from '../core/continuityEngine';

interface ProviderEntry {
  provider: AnyProvider;
  isActive: boolean;
  isFallback: boolean;
  addedAt: string;
}

interface ProviderRegistryState {
  llm: {
    active: string;
    fallback: string;
    providers: Map<string, ProviderEntry>;
  };
  memory: {
    active: string;
    fallback: string;
    providers: Map<string, ProviderEntry>;
  };
  infra: {
    active: string;
    fallback: string;
    providers: Map<string, ProviderEntry>;
  };
  migrationReports: MigrationReport[];
  autoSwitchEnabled: boolean;
  lastHealthCheck: string;
}

class ProviderRegistry {
  private state: ProviderRegistryState;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly maxMigrationReports = 50;

  constructor() {
    this.state = {
      llm: {
        active: 'openai',
        fallback: 'placeholder',
        providers: new Map(),
      },
      memory: {
        active: 'notion',
        fallback: 'local',
        providers: new Map(),
      },
      infra: {
        active: 'replit',
        fallback: 'generic',
        providers: new Map(),
      },
      migrationReports: [],
      autoSwitchEnabled: false,
      lastHealthCheck: new Date().toISOString(),
    };

    this.registerDefaultProviders();
    logger.info('[ProviderRegistry] Initialized with default providers');
  }

  private registerDefaultProviders(): void {
    this.registerProvider(openAIProvider, true, false);
    this.registerProvider(placeholderLLMProvider, false, true);
    this.registerProvider(notionMemoryProvider, true, false);
    this.registerProvider(localMemoryProvider, false, true);
    this.registerProvider(replitInfraProvider, true, false);
    this.registerProvider(genericInfraProvider, false, true);
  }

  registerProvider(provider: AnyProvider, isActive: boolean = false, isFallback: boolean = false): void {
    const entry: ProviderEntry = {
      provider,
      isActive,
      isFallback,
      addedAt: new Date().toISOString(),
    };

    switch (provider.type) {
      case 'llm':
        this.state.llm.providers.set(provider.id, entry);
        if (isActive) this.state.llm.active = provider.id;
        if (isFallback) this.state.llm.fallback = provider.id;
        break;
      case 'memory':
        this.state.memory.providers.set(provider.id, entry);
        if (isActive) this.state.memory.active = provider.id;
        if (isFallback) this.state.memory.fallback = provider.id;
        break;
      case 'infra':
        this.state.infra.providers.set(provider.id, entry);
        if (isActive) this.state.infra.active = provider.id;
        if (isFallback) this.state.infra.fallback = provider.id;
        break;
    }

    logger.info(`[ProviderRegistry] Registered ${provider.type}:${provider.id} (active:${isActive}, fallback:${isFallback})`);
  }

  getActiveLLM(): ILLMProvider {
    const activeId = this.state.llm.active;
    const entry = this.state.llm.providers.get(activeId);
    
    if (entry && entry.provider.isConfigured()) {
      return entry.provider as ILLMProvider;
    }

    const fallbackId = this.state.llm.fallback;
    const fallback = this.state.llm.providers.get(fallbackId);
    return (fallback?.provider as ILLMProvider) || placeholderLLMProvider;
  }

  getActiveMemory(): IMemoryProvider {
    const activeId = this.state.memory.active;
    const entry = this.state.memory.providers.get(activeId);
    
    if (entry && entry.provider.isConfigured()) {
      return entry.provider as IMemoryProvider;
    }

    const fallbackId = this.state.memory.fallback;
    const fallback = this.state.memory.providers.get(fallbackId);
    return (fallback?.provider as IMemoryProvider) || localMemoryProvider;
  }

  getActiveInfra(): IInfraProvider {
    const activeId = this.state.infra.active;
    const entry = this.state.infra.providers.get(activeId);
    
    if (entry) {
      return entry.provider as IInfraProvider;
    }

    const fallbackId = this.state.infra.fallback;
    const fallback = this.state.infra.providers.get(fallbackId);
    return (fallback?.provider as IInfraProvider) || replitInfraProvider;
  }

  async checkAllHealth(): Promise<Record<ProviderType, Record<string, ProviderHealth>>> {
    this.state.lastHealthCheck = new Date().toISOString();
    
    const results: Record<ProviderType, Record<string, ProviderHealth>> = {
      llm: {},
      memory: {},
      infra: {},
    };

    for (const [id, entry] of Array.from(this.state.llm.providers)) {
      results.llm[id] = await entry.provider.getHealth();
    }

    for (const [id, entry] of Array.from(this.state.memory.providers)) {
      results.memory[id] = await entry.provider.getHealth();
    }

    for (const [id, entry] of Array.from(this.state.infra.providers)) {
      results.infra[id] = await entry.provider.getHealth();
    }

    logger.info('[ProviderRegistry] Health check completed');
    return results;
  }

  async simulateMigration(
    providerType: ProviderType,
    fromProviderId: string,
    toProviderId: string
  ): Promise<MigrationReport> {
    logger.info(`[ProviderRegistry] Simulating migration: ${providerType}:${fromProviderId} -> ${toProviderId}`);

    const report: MigrationReport = {
      id: `mig_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      fromProvider: fromProviderId,
      toProvider: toProviderId,
      providerType,
      dryRun: true,
      qualityDelta: 0,
      safetyDelta: 0,
      latencyDelta: 0,
      costDelta: 0,
      risks: [],
      deltas: [],
      recommendation: 'proceed',
      approved: false,
      executedAt: null,
    };

    const identityBefore = identityCore.exportStatus().integrityScore;
    const continuityBefore = continuityEngine.exportStatus().totalReboots;

    let fromProvider: AnyProvider | undefined;
    let toProvider: AnyProvider | undefined;

    switch (providerType) {
      case 'llm':
        fromProvider = this.state.llm.providers.get(fromProviderId)?.provider;
        toProvider = this.state.llm.providers.get(toProviderId)?.provider;
        break;
      case 'memory':
        fromProvider = this.state.memory.providers.get(fromProviderId)?.provider;
        toProvider = this.state.memory.providers.get(toProviderId)?.provider;
        break;
      case 'infra':
        fromProvider = this.state.infra.providers.get(fromProviderId)?.provider;
        toProvider = this.state.infra.providers.get(toProviderId)?.provider;
        break;
    }

    if (!fromProvider || !toProvider) {
      report.risks.push('One or both providers not found');
      report.recommendation = 'abort';
      return report;
    }

    const fromHealth = await fromProvider.getHealth();
    const toHealth = await toProvider.getHealth();

    report.latencyDelta = toHealth.latencyMs - fromHealth.latencyMs;
    if (report.latencyDelta > 100) {
      report.risks.push(`Latency increase of ${report.latencyDelta}ms`);
      report.deltas.push({
        field: 'latency',
        oldValue: fromHealth.latencyMs,
        newValue: toHealth.latencyMs,
        severity: report.latencyDelta > 500 ? 'high' : 'medium',
      });
    }

    const fromCost = fromProvider.getCost();
    const toCost = toProvider.getCost();
    report.costDelta = toCost.costPerRequest - fromCost.costPerRequest;
    
    if (report.costDelta > 0) {
      report.deltas.push({
        field: 'cost',
        oldValue: fromCost.costPerRequest,
        newValue: toCost.costPerRequest,
        severity: report.costDelta > 0.01 ? 'high' : 'low',
      });
    }

    if (!toProvider.isConfigured()) {
      report.risks.push('Target provider is not configured');
      report.recommendation = 'abort';
    }

    if (toHealth.status === 'unavailable') {
      report.risks.push('Target provider is unavailable');
      report.recommendation = 'abort';
    } else if (toHealth.status === 'degraded') {
      report.risks.push('Target provider is degraded');
      report.recommendation = 'caution';
    }

    if (providerType === 'llm') {
      const testRequest: LLMGenerateRequest = {
        prompt: 'Test: respond with OK',
        maxTokens: 10,
      };

      try {
        const fromLLM = fromProvider as ILLMProvider;
        const toLLM = toProvider as ILLMProvider;

        const [fromResponse, toResponse] = await Promise.all([
          fromLLM.generate(testRequest).catch(() => null),
          toLLM.generate(testRequest).catch(() => null),
        ]);

        if (fromResponse && toResponse) {
          const qualityMatch = fromResponse.content.length > 0 && toResponse.content.length > 0;
          report.qualityDelta = qualityMatch ? 0 : -20;
          
          if (!qualityMatch) {
            report.risks.push('Quality mismatch detected in test response');
            report.deltas.push({
              field: 'quality',
              oldValue: fromResponse.content.substring(0, 50),
              newValue: toResponse.content.substring(0, 50),
              severity: 'medium',
            });
          }
        }
      } catch (error) {
        report.risks.push(`Test generation failed: ${error}`);
      }
    }

    const identityAfter = identityCore.exportStatus().integrityScore;
    const continuityAfter = continuityEngine.exportStatus().totalReboots;

    if (identityBefore !== identityAfter) {
      report.risks.push('CRITICAL: Identity changed during simulation');
      report.safetyDelta = -100;
      report.recommendation = 'abort';
    }

    if (continuityBefore !== continuityAfter) {
      report.risks.push('WARNING: Continuity state changed during simulation');
      report.safetyDelta -= 20;
      if (report.recommendation !== 'abort') {
        report.recommendation = 'caution';
      }
    }

    if (report.risks.length === 0) {
      report.recommendation = 'proceed';
    } else if (report.risks.length <= 2 && report.recommendation !== 'abort') {
      report.recommendation = 'caution';
    }

    this.state.migrationReports.push(report);
    if (this.state.migrationReports.length > this.maxMigrationReports) {
      this.state.migrationReports.shift();
    }

    logger.info(`[ProviderRegistry] Migration simulation complete: ${report.recommendation}`);
    return report;
  }

  async executeMigration(reportId: string, approvalFlag: boolean = false): Promise<boolean> {
    const report = this.state.migrationReports.find(r => r.id === reportId);
    
    if (!report) {
      logger.error('[ProviderRegistry] Migration report not found');
      return false;
    }

    if (!approvalFlag) {
      logger.error('[ProviderRegistry] Migration requires explicit approval flag');
      return false;
    }

    if (report.recommendation === 'abort') {
      logger.error('[ProviderRegistry] Cannot execute migration with abort recommendation');
      return false;
    }

    logger.info(`[ProviderRegistry] Executing migration: ${report.fromProvider} -> ${report.toProvider}`);

    switch (report.providerType) {
      case 'llm':
        this.state.llm.active = report.toProvider;
        break;
      case 'memory':
        this.state.memory.active = report.toProvider;
        break;
      case 'infra':
        this.state.infra.active = report.toProvider;
        break;
    }

    report.approved = true;
    report.executedAt = new Date().toISOString();
    report.dryRun = false;

    logger.info(`[ProviderRegistry] Migration executed successfully`);
    return true;
  }

  revertMigration(providerType: ProviderType): boolean {
    const fallbackId = this.state[providerType].fallback;
    logger.info(`[ProviderRegistry] Reverting ${providerType} to fallback: ${fallbackId}`);
    this.state[providerType].active = fallbackId;
    return true;
  }

  getMigrationReports(): MigrationReport[] {
    return [...this.state.migrationReports];
  }

  exportStatus(): {
    llm: { active: string; fallback: string; configured: boolean };
    memory: { active: string; fallback: string; configured: boolean };
    infra: { active: string; fallback: string; configured: boolean };
    autoSwitchEnabled: boolean;
    lastHealthCheck: string;
    totalMigrations: number;
  } {
    return {
      llm: {
        active: this.state.llm.active,
        fallback: this.state.llm.fallback,
        configured: this.getActiveLLM().isConfigured(),
      },
      memory: {
        active: this.state.memory.active,
        fallback: this.state.memory.fallback,
        configured: this.getActiveMemory().isConfigured(),
      },
      infra: {
        active: this.state.infra.active,
        fallback: this.state.infra.fallback,
        configured: this.getActiveInfra().isConfigured(),
      },
      autoSwitchEnabled: this.state.autoSwitchEnabled,
      lastHealthCheck: this.state.lastHealthCheck,
      totalMigrations: this.state.migrationReports.filter(r => r.executedAt).length,
    };
  }

  listProviders(type: ProviderType): Array<{ id: string; name: string; isActive: boolean; isFallback: boolean; configured: boolean }> {
    const providers = this.state[type].providers;
    const result: Array<{ id: string; name: string; isActive: boolean; isFallback: boolean; configured: boolean }> = [];

    for (const [id, entry] of Array.from(providers)) {
      result.push({
        id,
        name: entry.provider.name,
        isActive: id === this.state[type].active,
        isFallback: id === this.state[type].fallback,
        configured: entry.provider.isConfigured(),
      });
    }

    return result;
  }
}

export const providerRegistry = new ProviderRegistry();
