import { IGene } from './IGene';
import { logger } from '../services/logger';
import { discoverServiceGenes, selfHealingGene } from './autoDiscovery';

/**
 * Core Symbiosis Genes
 * 
 * Philosophy: "Backend sống như con người" - The backend lives like a human
 * 
 * Instead of manually adding genes every time we add a service/API,
 * the system now auto-discovers services and initializes them automatically.
 * 
 * This makes the system truly autonomous - it adapts to new capabilities
 * without requiring manual intervention.
 */

// Static core genes that are always present
const coreGenes: IGene[] = [
  {
    name: 'core-survival',
    description: 'Core survival monitoring gene',
    immutable: true,
    init: async () => {
      logger.info('[gene:core-survival] initialized');
    },
  },
  selfHealingGene,
];

/**
 * Dynamically build the gene list by combining:
 * 1. Core genes (always present)
 * 2. Auto-discovered service genes (discovered at runtime)
 */
export async function getAllGenes(): Promise<IGene[]> {
  logger.info('[Genes] Building gene list with auto-discovery...');
  
  // Discover services automatically
  const discoveredGenes = await discoverServiceGenes();
  
  // Combine core genes with discovered genes
  const allGenes = [...coreGenes, ...discoveredGenes];
  
  logger.info(`[Genes] Total genes loaded: ${allGenes.length} (${coreGenes.length} core + ${discoveredGenes.length} discovered)`);
  
  return allGenes;
}

// For backward compatibility, export a synchronous version that returns core genes
// The async version should be used in index.ts for full auto-discovery
export const allGenes: IGene[] = coreGenes;
