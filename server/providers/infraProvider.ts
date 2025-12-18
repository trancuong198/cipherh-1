import { 
  IInfraProvider, 
  ProviderHealth, 
  ProviderLimits, 
  ProviderCost,
  InfraMetrics
} from './types';
import { logger } from '../services/logger';
import * as os from 'os';

class ReplitInfraProvider implements IInfraProvider {
  id = 'replit';
  name = 'Replit Infrastructure';
  type: 'infra' = 'infra';

  constructor() {
    logger.info('[InfraProvider:Replit] Initialized');
  }

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealth> {
    const metrics = this.getMetrics();
    
    let status: ProviderHealth['status'] = 'healthy';
    if (metrics.cpuUsage > 90 || metrics.memoryUsage > 90) {
      status = 'degraded';
    }
    if (metrics.cpuUsage > 98 || metrics.memoryUsage > 98) {
      status = 'unavailable';
    }

    return {
      status,
      latencyMs: metrics.networkLatency,
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      successRate: 100,
    };
  }

  getLimits(): ProviderLimits {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      requestsPerMinute: 1000,
      tokensPerRequest: 100000,
      dailyQuota: 1000000,
      currentUsage: Math.round((usedMem / totalMem) * 100),
    };
  }

  getCost(): ProviderCost {
    return {
      costPerRequest: 0,
      costPerToken: 0,
      dailyCost: 0,
      monthlyCost: 0,
    };
  }

  getMetrics(): InfraMetrics {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    let cpuUsage = 0;
    if (cpus.length > 0) {
      const cpu = cpus[0];
      const total = cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle;
      cpuUsage = Math.round(((total - cpu.times.idle) / total) * 100);
    }

    return {
      cpuUsage,
      memoryUsage: Math.round(((totalMem - freeMem) / totalMem) * 100),
      diskUsage: 50,
      networkLatency: 10,
    };
  }
}

class GenericInfraProvider implements IInfraProvider {
  id = 'generic';
  name = 'Generic Infrastructure';
  type: 'infra' = 'infra';

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      status: 'healthy',
      latencyMs: 0,
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      successRate: 100,
    };
  }

  getLimits(): ProviderLimits {
    return {
      requestsPerMinute: 1000,
      tokensPerRequest: 100000,
      dailyQuota: 1000000,
      currentUsage: 0,
    };
  }

  getCost(): ProviderCost {
    return {
      costPerRequest: 0,
      costPerToken: 0,
      dailyCost: 0,
      monthlyCost: 0,
    };
  }

  getMetrics(): InfraMetrics {
    return {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkLatency: 0,
    };
  }
}

export const replitInfraProvider = new ReplitInfraProvider();
export const genericInfraProvider = new GenericInfraProvider();
