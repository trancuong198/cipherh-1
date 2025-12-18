import { logger } from '../services/logger';
import { coreMissions } from './coreMissions';

export type EntityRole = 'creator' | 'collaborator' | 'user' | 'unknown';
export type CommunicationStyle = 'concise' | 'analytical' | 'casual' | 'reflective';

export interface IdentityMemory {
  userId: string;
  platform: string;
  firstSeenTimestamp: string;
  interactionCount: number;
}

export interface RelationProfile {
  role: EntityRole;
  familiarityLevel: number;
  communicationStyle: CommunicationStyle;
  trustLevel: number;
  boundaryFlags: string[];
  lastInteraction: string;
  violationCount: number;
}

export interface EntityRecord {
  identity: IdentityMemory;
  relation: RelationProfile;
  changeLog: RelationChange[];
}

export interface RelationChange {
  id: string;
  timestamp: string;
  field: string;
  oldValue: number | string;
  newValue: number | string;
  evidence: string;
  approved: boolean;
}

export interface ToneGuidance {
  formality: 'formal' | 'neutral' | 'relaxed';
  detailLevel: 'minimal' | 'standard' | 'detailed';
  continuityAware: boolean;
  boundariesToRespect: string[];
}

export interface RecognitionResult {
  recognized: boolean;
  entity: EntityRecord | null;
  toneGuidance: ToneGuidance;
  greeting: string | null;
}

const FAMILIARITY_MAX = 5;
const TRUST_MAX = 5;
const INACTIVITY_DECAY_DAYS = 30;
const MAX_JUMP = 1;

class IdentityRelationEngine {
  private entities: Map<string, EntityRecord> = new Map();
  private enabled: boolean = true;

  constructor() {
    this.registerCreator();
    logger.info('[IdentityRelationCore] Initialized - Remembers people, not feelings');
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  private getEntityKey(userId: string, platform: string): string {
    return `${platform}:${userId}`;
  }

  private registerCreator(): void {
    const creatorKey = this.getEntityKey('6538590650', 'telegram');
    const now = new Date().toISOString();

    this.entities.set(creatorKey, {
      identity: {
        userId: '6538590650',
        platform: 'telegram',
        firstSeenTimestamp: now,
        interactionCount: 0,
      },
      relation: {
        role: 'creator',
        familiarityLevel: 5,
        communicationStyle: 'analytical',
        trustLevel: 5,
        boundaryFlags: [],
        lastInteraction: now,
        violationCount: 0,
      },
      changeLog: [],
    });
  }

  registerEntity(userId: string, platform: string): EntityRecord {
    const key = this.getEntityKey(userId, platform);
    
    if (this.entities.has(key)) {
      return this.entities.get(key)!;
    }

    const now = new Date().toISOString();
    const record: EntityRecord = {
      identity: {
        userId,
        platform,
        firstSeenTimestamp: now,
        interactionCount: 0,
      },
      relation: {
        role: 'unknown',
        familiarityLevel: 0,
        communicationStyle: 'concise',
        trustLevel: 0,
        boundaryFlags: [],
        lastInteraction: now,
        violationCount: 0,
      },
      changeLog: [],
    };

    this.entities.set(key, record);
    logger.info(`[IdentityRelationCore] New entity registered: ${key}`);
    return record;
  }

  recognize(userId: string, platform: string): RecognitionResult {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return {
        recognized: false,
        entity: null,
        toneGuidance: {
          formality: 'formal',
          detailLevel: 'standard',
          continuityAware: false,
          boundariesToRespect: [],
        },
        greeting: null,
      };
    }

    this.applyInactivityDecay(entity);
    entity.identity.interactionCount++;
    entity.relation.lastInteraction = new Date().toISOString();

    const toneGuidance = this.computeToneGuidance(entity);

    return {
      recognized: true,
      entity,
      toneGuidance,
      greeting: this.generateContinuityGreeting(entity),
    };
  }

  private applyInactivityDecay(entity: EntityRecord): void {
    const lastInteraction = new Date(entity.relation.lastInteraction);
    const now = new Date();
    const daysSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSince > INACTIVITY_DECAY_DAYS) {
      const decayAmount = Math.floor(daysSince / INACTIVITY_DECAY_DAYS);
      
      if (entity.relation.familiarityLevel > 0) {
        const oldValue = entity.relation.familiarityLevel;
        entity.relation.familiarityLevel = Math.max(0, entity.relation.familiarityLevel - decayAmount);
        this.logChange(entity, 'familiarityLevel', oldValue, entity.relation.familiarityLevel, 
          `Inactivity decay: ${daysSince.toFixed(0)} days since last interaction`);
      }

      if (entity.relation.trustLevel > 0 && entity.relation.role !== 'creator') {
        const oldValue = entity.relation.trustLevel;
        entity.relation.trustLevel = Math.max(0, entity.relation.trustLevel - decayAmount);
        this.logChange(entity, 'trustLevel', oldValue, entity.relation.trustLevel,
          `Inactivity decay: ${daysSince.toFixed(0)} days since last interaction`);
      }
    }
  }

  private computeToneGuidance(entity: EntityRecord): ToneGuidance {
    const { relation } = entity;

    let formality: 'formal' | 'neutral' | 'relaxed';
    if (relation.familiarityLevel >= 4) {
      formality = 'relaxed';
    } else if (relation.familiarityLevel >= 2) {
      formality = 'neutral';
    } else {
      formality = 'formal';
    }

    let detailLevel: 'minimal' | 'standard' | 'detailed';
    switch (relation.communicationStyle) {
      case 'concise':
        detailLevel = 'minimal';
        break;
      case 'analytical':
        detailLevel = 'detailed';
        break;
      default:
        detailLevel = 'standard';
    }

    return {
      formality,
      detailLevel,
      continuityAware: relation.familiarityLevel >= 1,
      boundariesToRespect: [...relation.boundaryFlags],
    };
  }

  private generateContinuityGreeting(entity: EntityRecord): string | null {
    if (entity.relation.familiarityLevel < 1) {
      return null;
    }

    if (entity.relation.role === 'creator') {
      return null;
    }

    return null;
  }

  updateFamiliarity(userId: string, platform: string, delta: number, evidence: string): {
    success: boolean;
    error?: string;
    newLevel?: number;
  } {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    if (Math.abs(delta) > MAX_JUMP) {
      return { success: false, error: `Jump too large: max ${MAX_JUMP}, requested ${Math.abs(delta)}` };
    }

    const oldValue = entity.relation.familiarityLevel;
    const newValue = Math.max(0, Math.min(FAMILIARITY_MAX, oldValue + delta));

    if (newValue === oldValue) {
      return { success: true, newLevel: oldValue };
    }

    entity.relation.familiarityLevel = newValue;
    this.logChange(entity, 'familiarityLevel', oldValue, newValue, evidence);

    return { success: true, newLevel: newValue };
  }

  updateTrust(userId: string, platform: string, delta: number, evidence: string): {
    success: boolean;
    error?: string;
    newLevel?: number;
  } {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    if (Math.abs(delta) > MAX_JUMP) {
      return { success: false, error: `Jump too large: max ${MAX_JUMP}, requested ${Math.abs(delta)}` };
    }

    const missionCheck = coreMissions.checkAlignment(
      'task',
      `Update trust for ${userId}`,
      {
        missionIds: ['M4_ETHICS_AND_TRUST'],
        rationale: `Trust change evidence: ${evidence}`,
      }
    );

    if (!missionCheck.aligned) {
      return { success: false, error: `Trust change blocked: ${missionCheck.reason}` };
    }

    const oldValue = entity.relation.trustLevel;
    const newValue = Math.max(0, Math.min(TRUST_MAX, oldValue + delta));

    if (newValue === oldValue) {
      return { success: true, newLevel: oldValue };
    }

    entity.relation.trustLevel = newValue;
    this.logChange(entity, 'trustLevel', oldValue, newValue, evidence);

    return { success: true, newLevel: newValue };
  }

  updateRole(userId: string, platform: string, newRole: EntityRole, evidence: string): {
    success: boolean;
    error?: string;
  } {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return { success: false, error: 'Entity not found' };
    }

    if (entity.relation.role === 'creator' && newRole !== 'creator') {
      return { success: false, error: 'Cannot demote creator' };
    }

    const oldRole = entity.relation.role;
    entity.relation.role = newRole;
    this.logChange(entity, 'role', oldRole, newRole, evidence);

    return { success: true };
  }

  addBoundary(userId: string, platform: string, boundary: string): { success: boolean } {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return { success: false };
    }

    if (!entity.relation.boundaryFlags.includes(boundary)) {
      entity.relation.boundaryFlags.push(boundary);
      this.logChange(entity, 'boundaryFlags', 'added', boundary, 'Boundary added');
    }

    return { success: true };
  }

  recordViolation(userId: string, platform: string, description: string): {
    success: boolean;
    trustReduced: boolean;
  } {
    const key = this.getEntityKey(userId, platform);
    const entity = this.entities.get(key);

    if (!entity) {
      return { success: false, trustReduced: false };
    }

    entity.relation.violationCount++;
    
    let trustReduced = false;
    if (entity.relation.trustLevel > 0 && entity.relation.role !== 'creator') {
      const oldTrust = entity.relation.trustLevel;
      entity.relation.trustLevel = Math.max(0, entity.relation.trustLevel - 1);
      this.logChange(entity, 'trustLevel', oldTrust, entity.relation.trustLevel, 
        `Violation: ${description}`);
      trustReduced = true;
    }

    logger.warn(`[IdentityRelationCore] Violation recorded for ${key}: ${description}`);
    return { success: true, trustReduced };
  }

  private logChange(
    entity: EntityRecord,
    field: string,
    oldValue: number | string,
    newValue: number | string,
    evidence: string
  ): void {
    entity.changeLog.push({
      id: this.generateId('change'),
      timestamp: new Date().toISOString(),
      field,
      oldValue,
      newValue,
      evidence,
      approved: true,
    });

    if (entity.changeLog.length > 100) {
      entity.changeLog = entity.changeLog.slice(-100);
    }
  }

  validateNoEmotionalClaims(text: string): { valid: boolean; violation?: string } {
    const emotionalPatterns = [
      /i (feel|love|miss|care about|am attached to)/i,
      /my (feelings|emotions|affection)/i,
      /emotional (bond|connection|attachment)/i,
      /you mean (a lot|everything|so much) to me/i,
    ];

    for (const pattern of emotionalPatterns) {
      if (pattern.test(text)) {
        return { valid: false, violation: `Emotional claim detected: ${pattern.source}` };
      }
    }

    return { valid: true };
  }

  exportForPersistence(): { entities: [string, EntityRecord][] } {
    return {
      entities: Array.from(this.entities.entries()),
    };
  }

  importFromPersistence(data: { entities: [string, EntityRecord][] }): void {
    this.entities = new Map(data.entities);
    logger.info(`[IdentityRelationCore] Imported ${this.entities.size} entities`);
  }

  getEntity(userId: string, platform: string): EntityRecord | null {
    const key = this.getEntityKey(userId, platform);
    return this.entities.get(key) || null;
  }

  getAllEntities(): EntityRecord[] {
    return Array.from(this.entities.values());
  }

  exportStatus(): {
    enabled: boolean;
    entityCount: number;
    creatorRegistered: boolean;
    totalInteractions: number;
  } {
    const entities = this.getAllEntities();
    const creatorRegistered = entities.some(e => e.relation.role === 'creator');
    const totalInteractions = entities.reduce((sum, e) => sum + e.identity.interactionCount, 0);

    return {
      enabled: this.enabled,
      entityCount: entities.length,
      creatorRegistered,
      totalInteractions,
    };
  }
}

export const identityRelationCore = new IdentityRelationEngine();
