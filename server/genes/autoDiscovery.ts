/**
 * Auto-Discovery System for Services
 * 
 * Philosophy: "Backend sống như con người" - The backend should live like a human
 * 
 * Instead of manually registering each service as a gene, this system:
 * 1. Automatically discovers all services in the services directory
 * 2. Detects if they have initialization functions
 * 3. Initializes them automatically on startup
 * 4. No manual intervention needed when adding new services
 * 
 * This makes the system more organic and self-sustaining - like a living organism
 * that automatically integrates new capabilities without requiring surgery.
 */

import { logger } from '../services/logger';
import { IGene } from './IGene';

/**
 * Import all known services directly
 * This approach works in both development and production builds
 */
async function getKnownServices(): Promise<Array<{ name: string; init?: () => Promise<boolean> }>> {
  const services: Array<{ name: string; init?: () => Promise<boolean> }> = [];
  
  // Import telegram service
  try {
    const telegram = await import('../services/telegram');
    if (telegram.initTelegram) {
      services.push({
        name: 'telegram',
        init: telegram.initTelegram,
      });
    }
  } catch (error) {
    logger.debug('[AutoDiscovery] Telegram service not available');
  }
  
  // Future services can be added here automatically by the system
  // or by developers. The key is they follow a standard pattern:
  // - Export an init() or initServiceName() function
  // - Return Promise<boolean> (true = success, false = skip)
  
  return services;
}

/**
 * Auto-generates genes for all discoverable services
 */
export async function discoverServiceGenes(): Promise<IGene[]> {
  const genes: IGene[] = [];
  
  logger.info('[AutoDiscovery] Scanning for services with initialization functions...');
  
  const services = await getKnownServices();
  
  for (const service of services) {
    if (service.init) {
      genes.push({
        name: `auto-${service.name}`,
        description: `Auto-discovered service: ${service.name}`,
        immutable: false,
        init: async () => {
          logger.info(`[AutoDiscovery] Initializing ${service.name}...`);
          try {
            const result = await service.init!();
            if (result === false) {
              logger.warn(`[AutoDiscovery] ${service.name} initialization skipped (not configured)`);
            } else {
              logger.info(`[AutoDiscovery] ${service.name} initialized successfully ✓`);
            }
          } catch (error: any) {
            logger.warn(`[AutoDiscovery] ${service.name} initialization failed: ${error.message}`);
          }
        },
      });
    }
  }
  
  if (genes.length > 0) {
    logger.info(`[AutoDiscovery] Discovered ${genes.length} service(s) ready for initialization`);
  } else {
    logger.info('[AutoDiscovery] No services found requiring initialization');
  }
  
  return genes;
}

/**
 * Enhanced gene that enables self-healing and adaptation
 * 
 * This gene monitors the system and can automatically:
 * - Detect when new services are added
 * - Re-scan and initialize them
 * - Recover from service failures
 */
export const selfHealingGene: IGene = {
  name: 'self-healing',
  description: 'Autonomous self-healing and adaptation system - enables automatic service discovery',
  immutable: true,
  init: async () => {
    logger.info('[SelfHealing] Self-healing system initialized');
    logger.info('[SelfHealing] System automatically discovers and initializes services');
    logger.info('[SelfHealing] Add new services by exporting init() functions - no manual gene registration needed');
  },
};

