import { getAllGenes } from './symbiosis_genes';
import { logger } from '../services/logger';
import { initGenesPersistence, loadGenesState, saveGenesState } from './persistence';

export async function registerGenes() {
  logger.info('[genes] initializing persistence and registering symbiosis genes');
  try { await initGenesPersistence(); } catch (err) { logger.error('[genes] persistence init failed', { err }); }

  const persisted = await loadGenesState();
  const activeGenes = new Set((persisted && persisted.activeGenes) || []);

  // Get all genes including auto-discovered ones
  const allGenes = await getAllGenes();

  for (const gene of allGenes) {
    try {
      if (persisted?.disabledGenes?.includes(gene.name)) { logger.info(`[genes] skipping disabled gene: ${gene.name}`); continue; }
      if (gene.init) await gene.init();
      logger.info(`[genes] registered gene: ${gene.name}`);
      activeGenes.add(gene.name);
    } catch (err) { logger.error(`[genes] failed to init gene: ${gene.name}`, { err }); }
  }

  try { await saveGenesState({ activeGenes: Array.from(activeGenes) }); logger.info('[genes] persisted genes state'); } catch (err) { logger.error('[genes] failed to persist genes state', { err }); }
}

export async function shutdownGenes() {
  logger.info('[genes] shutting down genes');
  const activeGenes: string[] = [];
  const allGenes = await getAllGenes();
  
  for (const gene of allGenes) {
    try { if (gene.shutdown) await gene.shutdown(); logger.info(`[genes] shutdown gene: ${gene.name}`); activeGenes.push(gene.name); } catch (err) { logger.error(`[genes] failed to shutdown gene: ${gene.name}`, { err }); }
  }

  try { await saveGenesState({ activeGenes }); logger.info('[genes] saved genes state on shutdown'); } catch (err) { logger.error('[genes] failed to save genes state during shutdown', { err }); }
}