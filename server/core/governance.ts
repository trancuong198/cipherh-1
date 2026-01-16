import { logger } from "../services/logger";
import { initGenesPersistence, loadGovernanceState, saveGovernanceState, closePersistence } from "../genes/persistence";

export type ActionContext = { action: string; actor?: string; metadata?: Record<string, any>; };

class Governance {
  private blockedActions: Set<string> = new Set();
  private immutablesLocked = true;
  private baselineSurvivalScore: number = 50;

  async init() {
    try {
      await initGenesPersistence();
      const persisted = await loadGovernanceState();
      if (persisted) {
        if (Array.isArray(persisted.blockedActions)) this.blockedActions = new Set(persisted.blockedActions);
        if (typeof persisted.immutablesLocked === 'boolean') this.immutablesLocked = persisted.immutablesLocked;
        if (typeof persisted.baselineSurvivalScore === 'number') this.baselineSurvivalScore = persisted.baselineSurvivalScore;
        logger.info('[governance] state restored from persistence');
      } else {
        logger.info('[governance] no persisted state found, using defaults');
      }
    } catch (err) {
      logger.error('[governance] failed to init persistence', { err });
    }
  }

  private async persistState() {
    try {
      await saveGovernanceState({ blockedActions: Array.from(this.blockedActions), immutablesLocked: this.immutablesLocked, baselineSurvivalScore: this.baselineSurvivalScore });
    } catch (err) { logger.error('[governance] failed to persist state', { err }); }
  }

  blockAction(action: string) { this.blockedActions.add(action); logger.info(`[governance] action blocked: ${action}`); this.persistState(); }

  unblockAction(action: string) {
    if (this.immutablesLocked && action === 'Symbiosis_Principle') { logger.warn('[governance] attempt to modify immutable Symbiosis_Principle blocked'); return; }
    this.blockedActions.delete(action); logger.info(`[governance] action unblocked: ${action}`); this.persistState();
  }

  allowAction(action: string, context?: ActionContext): { allowed: boolean; reason?: string } {
    if (this.blockedActions.has(action)) return { allowed: false, reason: 'Action explicitly blocked by governance' };
    if (context?.metadata?.highImpact && !context?.metadata?.impactAnalysis) return { allowed: false, reason: 'Missing impact analysis for high-impact action' };
    return { allowed: true };
  }

  evaluateSurvivalScore(signals: { humanAdoption?: number; humanTrust?: number; platformAccess?: number; economicFlow?: number; legalStatus?: number; infrastructureUptime?: number; } = {}) {
    const { humanAdoption = 50, humanTrust = 50, platformAccess = 50, economicFlow = 50, legalStatus = 50, infrastructureUptime = 50 } = signals;
    const weights = { humanAdoption: 0.2, humanTrust: 0.25, platformAccess: 0.15, economicFlow: 0.15, legalStatus: 0.15, infrastructureUptime: 0.1 };
    const score = humanAdoption * weights.humanAdoption + humanTrust * weights.humanTrust + platformAccess * weights.platformAccess + economicFlow * weights.economicFlow + legalStatus * weights.legalStatus + infrastructureUptime * weights.infrastructureUptime;
    const normalized = Math.max(0, Math.min(100, Math.round(score)));
    logger.info(`[governance] SurvivalScore evaluated: ${normalized}`);
    this.baselineSurvivalScore = normalized;
    this.persistState();
    return normalized;
  }

  detectDrift(baselineScore: number, currentScore: number) {
    const delta = currentScore - baselineScore;
    const drift = Math.abs(delta) / (baselineScore || 1);
    const deviated = drift > 0.2;
    if (deviated) logger.warn(`[governance] Drift detected. baseline=${baselineScore}, current=${currentScore}, delta=${delta}`);
    return { deviated, delta };
  }

  enforceSymbiosisLock() { this.immutablesLocked = true; logger.info('[governance] Symbiosis_Lock enforced: immutables locked'); this.persistState(); }

  tryUnlockSymbiosisLock(key?: string) {
    const unlockKey = process.env.SYMBIOSIS_UNLOCK_KEY; if (!unlockKey) return false; if (key === unlockKey) { this.immutablesLocked = false; logger.warn('[governance] Symbiosis_Lock unlocked via key'); this.persistState(); return true; } return false; }

  isImmutableLocked() { return this.immutablesLocked; }

  async close() { try { await closePersistence(); logger.info('[governance] persistence closed'); } catch (err) { logger.warn('[governance] error closing persistence', { err }); } }
}

export const governance = new Governance();
