import { Client } from '@notionhq/client';

export interface Reflection {
  id: string;
  content: string;
  insights: string[];
  timestamp: string;
}

export interface ConsolidatedKnowledge {
  id: string;
  topic: string;
  principles: string[];
  examples: string[];
  source_reflections: string[];
  confidence: number;
  createdAt: string;
}

export class KnowledgeConsolidator {
  private notionClient: Client | null = null;
  private databaseId: string | null = null;

  constructor() {
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (notionToken && databaseId) {
      this.notionClient = new Client({ auth: notionToken });
      this.databaseId = databaseId;
      console.log('KnowledgeConsolidator initialized with Notion');
    } else {
      console.log('KnowledgeConsolidator running in placeholder mode');
    }
  }

  async consolidateDailyLearnings(): Promise<ConsolidatedKnowledge[]> {
    console.log('Consolidating daily learnings...');

    const reflections = await this.fetchRecentReflections(10);
    
    if (reflections.length === 0) {
      console.log('No reflections to consolidate');
      return [];
    }

    const consolidated = this.extractKnowledge(reflections);
    
    // Store consolidated knowledge
    for (const knowledge of consolidated) {
      await this.storeKnowledge(knowledge);
    }

    console.log(`Consolidated ${consolidated.length} pieces of knowledge from ${reflections.length} reflections`);
    return consolidated;
  }

  async fetchRecentReflections(limit: number = 10): Promise<Reflection[]> {
    if (!this.notionClient || !this.databaseId) {
      console.log('[Placeholder] Would fetch reflections from Notion');
      return this.getMockReflections();
    }

    try {
      const response = await this.notionClient.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Type',
          select: {
            equals: 'reflection',
          },
        },
        sorts: [
          {
            property: 'Date',
            direction: 'descending',
          },
        ],
        page_size: limit,
      });

      return response.results.map((page: any) => ({
        id: page.id,
        content: this.extractContent(page),
        insights: this.extractInsights(page),
        timestamp: page.created_time,
      }));
    } catch (error) {
      console.error('Error fetching reflections from Notion:', error);
      return this.getMockReflections();
    }
  }

  private extractKnowledge(reflections: Reflection[]): ConsolidatedKnowledge[] {
    const knowledgeMap = new Map<string, ConsolidatedKnowledge>();

    for (const reflection of reflections) {
      for (const insight of reflection.insights) {
        const topic = this.extractTopic(insight);
        
        if (!knowledgeMap.has(topic)) {
          knowledgeMap.set(topic, {
            id: `knowledge_${Date.now()}_${topic}`,
            topic,
            principles: [],
            examples: [],
            source_reflections: [],
            confidence: 0,
            createdAt: new Date().toISOString(),
          });
        }

        const knowledge = knowledgeMap.get(topic)!;
        knowledge.principles.push(insight);
        knowledge.source_reflections.push(reflection.id);
        knowledge.examples.push(reflection.content.substring(0, 100));
      }
    }

    // Calculate confidence based on frequency
    const consolidated = Array.from(knowledgeMap.values());
    consolidated.forEach(k => {
      k.confidence = Math.min(100, k.source_reflections.length * 20);
    });

    return consolidated;
  }

  private extractTopic(insight: string): string {
    // Simple topic extraction - first 3-5 words
    const words = insight.split(' ').slice(0, 4);
    return words.join(' ').toLowerCase();
  }

  async storeKnowledge(knowledge: ConsolidatedKnowledge): Promise<void> {
    if (!this.notionClient || !this.databaseId) {
      console.log(`[Placeholder] Would store knowledge: ${knowledge.topic}`);
      return;
    }

    try {
      await this.notionClient.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: `Knowledge: ${knowledge.topic}`,
                },
              },
            ],
          },
          Type: {
            select: {
              name: 'semantic_knowledge',
            },
          },
          Confidence: {
            number: knowledge.confidence,
          },
          Date: {
            date: {
              start: knowledge.createdAt,
            },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: 'Principles' } }],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: knowledge.principles.join('\n• ') },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [{ type: 'text', text: { content: 'Examples' } }],
            },
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: { content: knowledge.examples.join('\n\n') },
                },
              ],
            },
          },
        ],
      });

      console.log(`Stored knowledge: ${knowledge.topic}`);
    } catch (error) {
      console.error('Error storing knowledge in Notion:', error);
    }
  }

  private extractContent(page: any): string {
    // Extract text content from Notion page
    // This is simplified - real implementation would traverse blocks
    try {
      const titleProperty = page.properties.title || page.properties.Title || page.properties.Name;
      if (titleProperty && titleProperty.title && titleProperty.title.length > 0) {
        return titleProperty.title[0].plain_text || '';
      }
    } catch (error) {
      console.error('Error extracting content:', error);
    }
    return '';
  }

  private extractInsights(page: any): string[] {
    // Extract insights from page content
    // Simplified implementation
    const content = this.extractContent(page);
    if (content.includes('learned:') || content.includes('insight:')) {
      return [content];
    }
    return [];
  }

  private getMockReflections(): Reflection[] {
    return [
      {
        id: 'mock_1',
        content: 'System performed well today with high confidence',
        insights: ['High confidence correlates with stable performance'],
        timestamp: new Date().toISOString(),
      },
      {
        id: 'mock_2',
        content: 'Detected patterns in anomaly occurrence',
        insights: ['Anomalies tend to cluster around state transitions'],
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }
}
