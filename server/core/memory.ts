import { Client } from '@notionhq/client';
import { Strategy } from './strategist.js';
import { SoulState } from './soulState.js';

let notionClient: Client | null = null;
let notionDatabaseId: string | null = null;

export function initializeNotion() {
  const notionKey = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  
  if (notionKey && databaseId) {
    notionClient = new Client({ auth: notionKey });
    notionDatabaseId = databaseId;
    console.log('Notion client initialized');
  } else {
    console.log('Notion credentials not configured - running in placeholder mode');
  }
}

export async function writeToNotion(
  title: string,
  content: string,
  type: 'lesson' | 'strategy' | 'reflection' | 'summary'
): Promise<void> {
  if (!notionClient || !notionDatabaseId) {
    console.log(`[Placeholder] Would write to Notion: ${type} - ${title}`);
    return;
  }
  
  try {
    await notionClient.pages.create({
      parent: { database_id: notionDatabaseId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        Type: {
          select: {
            name: type,
          },
        },
        Date: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content,
                },
              },
            ],
          },
        },
      ],
    });
    
    console.log(`Written to Notion: ${type} - ${title}`);
  } catch (error) {
    console.error('Error writing to Notion:', error);
    throw error;
  }
}

export async function writeLesson(lesson: string): Promise<void> {
  const title = `Lesson - ${new Date().toISOString().split('T')[0]}`;
  await writeToNotion(title, lesson, 'lesson');
}

export async function writeStrategy(strategy: Strategy): Promise<void> {
  const title = `Strategy - ${strategy.title}`;
  const content = `
Priority: ${strategy.priority}
Anomaly Score: ${strategy.basedOn.anomalyScore}

${strategy.description}

Actions:
${strategy.actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Key Insights:
${strategy.basedOn.keyInsights.join('\n')}
  `.trim();
  
  await writeToNotion(title, content, 'strategy');
}

export async function writeDailySummary(state: SoulState, summary: string): Promise<void> {
  const title = `Summary - Cycle ${state.cycle}`;
  const content = `
Cycle: ${state.cycle}
Confidence: ${state.agency_state.confidence}
Energy: ${state.agency_state.energyLevel}
Mode: ${state.agency_state.mode}

${summary}
  `.trim();
  
  await writeToNotion(title, content, 'summary');
}

export async function readFromNotion(limit: number = 10): Promise<any[]> {
  if (!notionClient || !notionDatabaseId) {
    console.log('[Placeholder] Would read from Notion');
    return [];
  }
  
  try {
    const response = await notionClient.databases.query({
      database_id: notionDatabaseId,
      page_size: limit,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });
    
    return response.results;
  } catch (error) {
    console.error('Error reading from Notion:', error);
    return [];
  }
}

// Initialize on module load
initializeNotion();
