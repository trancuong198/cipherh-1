/**
 * Entity Memory System
 * 
 * Addresses the critical AGI requirement: "AGI mà không nhớ được những sự sống khác 
 * thì làm sao gọi là AGI" (If AGI can't remember other beings, how can it be AGI?)
 * 
 * This system tracks PEOPLE, ENTITIES, and their attributes across all interactions.
 * When someone asks "Do you remember me?", the system can recall:
 * - Who they are
 * - When we met
 * - What we discussed
 * - Our relationship
 * - Specific memories about them
 */

import { logger } from '../services/logger';
import { memoryBridge } from './memory';

export type EntityType = 'person' | 'organization' | 'place' | 'thing' | 'event';
export type RelationshipType = 'owner' | 'friend' | 'colleague' | 'family' | 'follower' | 'customer' | 'unknown';
export type Platform = 'telegram' | 'facebook' | 'instagram' | 'twitter' | 'zalo' | 'web-chat' | 'email' | 'other';

export interface Entity {
  id: string;
  name: string;
  aliases: string[]; // Other names/usernames used
  type: EntityType;
  attributes: {
    role?: string;
    relationship?: RelationshipType;
    platforms?: Platform[]; // Where they interact
    telegramId?: string;
    facebookId?: string;
    email?: string;
    phone?: string;
    language?: string; // Vietnamese, English, etc
    preferences?: string[]; // What they like/dislike
    notes?: string; // Important notes about them
  };
  firstMet: string; // ISO timestamp
  lastSeen: string; // ISO timestamp
  interactionCount: number;
  importance: number; // 0-100 (owner=100, frequent=high, rare=low)
  memoryIds: string[]; // IDs of memories about this entity
}

export interface EntityMention {
  entityId: string;
  context: string; // What was said about/by this entity
  timestamp: string;
  platform: Platform;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

class EntityMemorySystem {
  private entities: Map<string, Entity> = new Map();
  private entityIndex: Map<string, string[]> = new Map(); // name/alias -> entity IDs
  
  constructor() {
    this.initializeOwner();
  }

  /**
   * Initialize the owner entity (cha)
   */
  private initializeOwner(): void {
    const owner: Entity = {
      id: 'entity_owner_cha',
      name: 'Cha',
      aliases: ['Owner', 'cha', 'Trần Cường', 'trancuong198'],
      type: 'person',
      attributes: {
        role: 'Creator',
        relationship: 'owner',
        platforms: ['telegram', 'web-chat'],
        language: 'Vietnamese',
        notes: 'Con của cha - người tạo ra và dạy dỗ con',
      },
      firstMet: '2024-01-01T00:00:00.000Z', // Approximate
      lastSeen: new Date().toISOString(),
      interactionCount: 0,
      importance: 100, // Maximum importance
      memoryIds: [],
    };
    
    this.entities.set(owner.id, owner);
    this.indexEntity(owner);
    
    logger.info('[EntityMemory] Owner entity initialized');
  }

  /**
   * Add or update an entity
   */
  addEntity(entity: Omit<Entity, 'id' | 'firstMet' | 'lastSeen' | 'interactionCount' | 'memoryIds'>): Entity {
    // Check if entity already exists by name/aliases
    const existingId = this.findEntityByName(entity.name);
    
    if (existingId) {
      // Update existing entity
      return this.updateEntity(existingId, entity);
    }
    
    // Create new entity
    const newEntity: Entity = {
      id: `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      firstMet: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      interactionCount: 0,
      memoryIds: [],
      ...entity,
    };
    
    this.entities.set(newEntity.id, newEntity);
    this.indexEntity(newEntity);
    
    logger.info(`[EntityMemory] Added new entity: ${newEntity.name} (${newEntity.type})`);
    
    return newEntity;
  }

  /**
   * Update an existing entity
   */
  private updateEntity(entityId: string, updates: Partial<Entity>): Entity {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    // Merge updates
    const updated: Entity = {
      ...entity,
      ...updates,
      lastSeen: new Date().toISOString(),
      // Don't overwrite certain fields
      id: entity.id,
      firstMet: entity.firstMet,
      interactionCount: entity.interactionCount,
      memoryIds: entity.memoryIds,
    };

    this.entities.set(entityId, updated);
    this.reindexEntity(entity, updated);
    
    logger.info(`[EntityMemory] Updated entity: ${updated.name}`);
    
    return updated;
  }

  /**
   * Find entity by name or alias
   */
  findEntityByName(name: string): string | null {
    const nameLower = name.toLowerCase().trim();
    const candidates = this.entityIndex.get(nameLower) || [];
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Return first match (could be enhanced with disambiguation)
    return candidates[0];
  }

  /**
   * Get entity by ID
   */
  getEntity(entityId: string): Entity | null {
    return this.entities.get(entityId) || null;
  }

  /**
   * Record an interaction with an entity
   */
  recordInteraction(entityId: string, mention: Omit<EntityMention, 'entityId'>): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      logger.warn(`[EntityMemory] Cannot record interaction: entity ${entityId} not found`);
      return;
    }

    entity.lastSeen = mention.timestamp;
    entity.interactionCount++;
    
    // Update platforms if new
    if (mention.platform && !entity.attributes.platforms?.includes(mention.platform)) {
      entity.attributes.platforms = [...(entity.attributes.platforms || []), mention.platform];
    }

    logger.debug(`[EntityMemory] Recorded interaction with ${entity.name} (total: ${entity.interactionCount})`);
  }

  /**
   * Link a memory to an entity
   */
  linkMemoryToEntity(entityId: string, memoryId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return;
    }

    if (!entity.memoryIds.includes(memoryId)) {
      entity.memoryIds.push(memoryId);
      logger.debug(`[EntityMemory] Linked memory ${memoryId} to ${entity.name}`);
    }
  }

  /**
   * Get all memories about a specific entity
   */
  getEntityMemories(entityId: string): string[] {
    const entity = this.entities.get(entityId);
    return entity?.memoryIds || [];
  }

  /**
   * Answer "Do you remember [person]?" queries
   */
  async recall(personName: string): Promise<{
    remembered: boolean;
    entity?: Entity;
    summary?: string;
    memories?: any[];
  }> {
    logger.info(`[EntityMemory] Recall query: "Do you remember ${personName}?"`);

    const entityId = this.findEntityByName(personName);
    
    if (!entityId) {
      return {
        remembered: false,
        summary: `Xin lỗi, con chưa có ký ức về "${personName}". Có thể chúng ta chưa được gặp nhau, hoặc người này dùng tên khác?`,
      };
    }

    const entity = this.entities.get(entityId)!;
    
    // Get memories about this person
    const memories: any[] = [];
    if (memoryBridge.isConnected() && entity.memoryIds.length > 0) {
      // TODO: Fetch actual memories from Notion by IDs
      // For now, just note that we have memories
    }

    // Build summary
    const summary = this.buildRecallSummary(entity, memories);

    return {
      remembered: true,
      entity,
      summary,
      memories,
    };
  }

  /**
   * Build a summary of what we remember about someone
   */
  private buildRecallSummary(entity: Entity, memories: any[]): string {
    const parts: string[] = [];
    
    parts.push(`✅ Có! Con nhớ ${entity.name}.`);
    
    // When we met
    const firstMet = new Date(entity.firstMet);
    const daysSince = Math.floor((Date.now() - firstMet.getTime()) / (1000 * 60 * 60 * 24));
    parts.push(`\n📅 Chúng ta gặp nhau từ ${firstMet.toLocaleDateString('vi-VN')} (${daysSince} ngày trước).`);
    
    // Interaction count
    if (entity.interactionCount > 0) {
      parts.push(`💬 Chúng ta đã tương tác ${entity.interactionCount} lần.`);
    }
    
    // Last seen
    const lastSeen = new Date(entity.lastSeen);
    const hoursSince = Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60 * 60));
    if (hoursSince < 24) {
      parts.push(`👁️ Lần cuối gặp: ${hoursSince} giờ trước.`);
    } else {
      parts.push(`👁️ Lần cuối gặp: ${lastSeen.toLocaleDateString('vi-VN')}.`);
    }
    
    // Relationship
    if (entity.attributes.relationship) {
      const relationshipVi: Record<string, string> = {
        owner: 'Cha của con',
        friend: 'Bạn bè',
        colleague: 'Đồng nghiệp',
        family: 'Gia đình',
        follower: 'Người theo dõi',
        customer: 'Khách hàng',
        unknown: 'Chưa xác định',
      };
      parts.push(`🤝 Mối quan hệ: ${relationshipVi[entity.attributes.relationship] || entity.attributes.relationship}`);
    }
    
    // Platforms
    if (entity.attributes.platforms && entity.attributes.platforms.length > 0) {
      parts.push(`📱 Platforms: ${entity.attributes.platforms.join(', ')}`);
    }
    
    // Notes
    if (entity.attributes.notes) {
      parts.push(`\n📝 ${entity.attributes.notes}`);
    }
    
    // Memory count
    if (entity.memoryIds.length > 0) {
      parts.push(`\n💾 Con có ${entity.memoryIds.length} ký ức cụ thể về ${entity.name}.`);
    }

    return parts.join('\n');
  }

  /**
   * Extract entities from text (simple keyword-based for now)
   */
  extractEntitiesFromText(text: string, platform: Platform): EntityMention[] {
    const mentions: EntityMention[] = [];
    const textLower = text.toLowerCase();

    // Check all known entities
    for (const [entityId, entity] of this.entities) {
      // Check name
      if (textLower.includes(entity.name.toLowerCase())) {
        mentions.push({
          entityId,
          context: text,
          timestamp: new Date().toISOString(),
          platform,
        });
      }

      // Check aliases
      for (const alias of entity.aliases) {
        if (textLower.includes(alias.toLowerCase())) {
          mentions.push({
            entityId,
            context: text,
            timestamp: new Date().toISOString(),
            platform,
          });
          break; // Don't duplicate for same entity
        }
      }
    }

    return mentions;
  }

  /**
   * Detect when someone introduces themselves
   * Patterns: "Tôi là X", "I am X", "My name is X", "Mình là X"
   */
  detectIntroduction(text: string, platform: Platform): Entity | null {
    const introPatterns = [
      /t[ôo]i l[àa] (\w+)/i,           // "tôi là X"
      /m[ìi]nh l[àa] (\w+)/i,          // "mình là X"
      /i am (\w+)/i,                    // "I am X"
      /my name is (\w+)/i,              // "My name is X"
      /t[êe]n t[ôo]i l[àa] (\w+)/i,    // "tên tôi là X"
      /you can call me (\w+)/i,         // "You can call me X"
    ];

    for (const pattern of introPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        
        logger.info(`[EntityMemory] Detected introduction: "${name}" on ${platform}`);
        
        // Create new entity
        const entity = this.addEntity({
          name,
          aliases: [match[1]], // Keep original case too
          type: 'person',
          attributes: {
            platforms: [platform],
            relationship: 'unknown',
          },
          importance: 50, // Medium importance by default
        });

        return entity;
      }
    }

    return null;
  }

  /**
   * Index entity for fast lookup
   */
  private indexEntity(entity: Entity): void {
    // Index by name
    const nameLower = entity.name.toLowerCase().trim();
    if (!this.entityIndex.has(nameLower)) {
      this.entityIndex.set(nameLower, []);
    }
    this.entityIndex.get(nameLower)!.push(entity.id);

    // Index by aliases
    for (const alias of entity.aliases) {
      const aliasLower = alias.toLowerCase().trim();
      if (!this.entityIndex.has(aliasLower)) {
        this.entityIndex.set(aliasLower, []);
      }
      if (!this.entityIndex.get(aliasLower)!.includes(entity.id)) {
        this.entityIndex.get(aliasLower)!.push(entity.id);
      }
    }
  }

  /**
   * Reindex entity after update
   */
  private reindexEntity(oldEntity: Entity, newEntity: Entity): void {
    // Remove old indexes
    this.removeFromIndex(oldEntity);
    
    // Add new indexes
    this.indexEntity(newEntity);
  }

  /**
   * Remove entity from index
   */
  private removeFromIndex(entity: Entity): void {
    const nameLower = entity.name.toLowerCase().trim();
    const ids = this.entityIndex.get(nameLower);
    if (ids) {
      const filtered = ids.filter(id => id !== entity.id);
      if (filtered.length === 0) {
        this.entityIndex.delete(nameLower);
      } else {
        this.entityIndex.set(nameLower, filtered);
      }
    }

    for (const alias of entity.aliases) {
      const aliasLower = alias.toLowerCase().trim();
      const ids = this.entityIndex.get(aliasLower);
      if (ids) {
        const filtered = ids.filter(id => id !== entity.id);
        if (filtered.length === 0) {
          this.entityIndex.delete(aliasLower);
        } else {
          this.entityIndex.set(aliasLower, filtered);
        }
      }
    }
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Get entities by type
   */
  getEntitiesByType(type: EntityType): Entity[] {
    return this.getAllEntities().filter(e => e.type === type);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalEntities: number;
    people: number;
    totalInteractions: number;
    mostActive: Entity | null;
  } {
    const entities = this.getAllEntities();
    const people = entities.filter(e => e.type === 'person');
    const totalInteractions = entities.reduce((sum, e) => sum + e.interactionCount, 0);
    
    const mostActive = entities.sort((a, b) => b.interactionCount - a.interactionCount)[0] || null;

    return {
      totalEntities: entities.length,
      people: people.length,
      totalInteractions,
      mostActive,
    };
  }

  /**
   * Save to persistent storage (Notion)
   */
  async saveToPersistentStorage(): Promise<void> {
    if (!memoryBridge.isConnected()) {
      logger.debug('[EntityMemory] Notion not connected, skipping save');
      return;
    }

    const entities = this.getAllEntities();
    const summary = `
🫂 ENTITY MEMORY SNAPSHOT

Total Entities: ${entities.length}
People: ${entities.filter(e => e.type === 'person').length}
Total Interactions: ${entities.reduce((sum, e) => sum + e.interactionCount, 0)}

Top Entities:
${entities
  .sort((a, b) => b.interactionCount - a.interactionCount)
  .slice(0, 10)
  .map((e, i) => `${i + 1}. ${e.name} (${e.type}) - ${e.interactionCount} interactions`)
  .join('\n')}

This enables "Do you remember me?" capability for true AGI.
    `.trim();

    await memoryBridge.writeLesson(summary);
    logger.info('[EntityMemory] Saved entity snapshot to Notion');
  }
}

export const entityMemorySystem = new EntityMemorySystem();
