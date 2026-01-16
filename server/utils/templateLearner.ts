import OpenAI from 'openai';

export interface Template {
  id: string;
  name: string;
  pattern: string;
  variables: string[];
  examples: string[];
  usage_count: number;
  createdAt: string;
}

export class TemplateLearner {
  private client: OpenAI | null = null;
  private model: string;
  private templates: Map<string, Template> = new Map();

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      console.log('TemplateLearner initialized with OpenAI');
    } else {
      console.log('TemplateLearner running in placeholder mode');
    }
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    this.loadDefaultTemplates();
  }

  async learnFromCode(code: string, name: string): Promise<Template> {
    console.log(`Learning template from: ${name}`);

    if (!this.client) {
      return this.createBasicTemplate(name, code);
    }

    const prompt = `Analyze this code and extract a reusable template:

${code}

Identify:
1. The core pattern/structure
2. Variable parts that could be parameterized
3. Common variations

Return JSON:
{
  "name": "template name",
  "pattern": "code pattern with {{variables}}",
  "variables": ["var1", "var2"],
  "examples": ["example usage"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a code pattern analyst that extracts reusable templates.',
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const templateData = JSON.parse(content);
        const template: Template = {
          id: `template_${Date.now()}`,
          ...templateData,
          usage_count: 0,
          createdAt: new Date().toISOString(),
        };

        this.templates.set(template.id, template);
        console.log(`Learned template: ${template.name}`);
        return template;
      }
    } catch (error) {
      console.error('Error learning template:', error);
    }

    return this.createBasicTemplate(name, code);
  }

  async applyTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    const template = this.templates.get(templateId);
    
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    let code = template.pattern;
    
    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      code = code.replace(regex, value);
    }

    // Increment usage count
    template.usage_count++;
    
    console.log(`Applied template: ${template.name} (used ${template.usage_count} times)`);
    return code;
  }

  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): Template[] {
    return Array.from(this.templates.values());
  }

  findTemplateByName(name: string): Template | undefined {
    return Array.from(this.templates.values()).find(t => 
      t.name.toLowerCase().includes(name.toLowerCase())
    );
  }

  async suggestTemplate(description: string): Promise<Template | null> {
    console.log(`Finding template for: ${description}`);

    // First try exact match
    const exactMatch = this.findTemplateByName(description);
    if (exactMatch) {
      return exactMatch;
    }

    // If OpenAI available, use semantic search
    if (!this.client) {
      return this.getMostUsedTemplate();
    }

    const templateDescriptions = Array.from(this.templates.values())
      .map(t => `${t.id}: ${t.name} - ${t.pattern.substring(0, 100)}`)
      .join('\n');

    const prompt = `Given this description: "${description}"

Available templates:
${templateDescriptions}

Which template best matches? Return just the template ID or "none".`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You match code descriptions to templates.',
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      });

      const templateId = response.choices[0]?.message?.content?.trim();
      if (templateId && templateId !== 'none') {
        return this.templates.get(templateId) || null;
      }
    } catch (error) {
      console.error('Error suggesting template:', error);
    }

    return null;
  }

  private createBasicTemplate(name: string, code: string): Template {
    return {
      id: `template_${Date.now()}`,
      name,
      pattern: code,
      variables: [],
      examples: [code],
      usage_count: 0,
      createdAt: new Date().toISOString(),
    };
  }

  private getMostUsedTemplate(): Template | null {
    const templates = this.getAllTemplates();
    if (templates.length === 0) return null;

    return templates.reduce((max, t) => 
      t.usage_count > max.usage_count ? t : max
    );
  }

  private loadDefaultTemplates(): void {
    // Express route handler template
    this.templates.set('express_route', {
      id: 'express_route',
      name: 'Express Route Handler',
      pattern: `router.{{method}}('{{path}}', async (req, res) => {
  try {
    {{logic}}
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});`,
      variables: ['method', 'path', 'logic'],
      examples: [
        "router.get('/users', async (req, res) => { ... })",
      ],
      usage_count: 0,
      createdAt: new Date().toISOString(),
    });

    // TypeScript interface template
    this.templates.set('typescript_interface', {
      id: 'typescript_interface',
      name: 'TypeScript Interface',
      pattern: `export interface {{name}} {
  {{fields}}
}`,
      variables: ['name', 'fields'],
      examples: [
        'export interface User { id: string; name: string; }',
      ],
      usage_count: 0,
      createdAt: new Date().toISOString(),
    });

    // Async function template
    this.templates.set('async_function', {
      id: 'async_function',
      name: 'Async Function',
      pattern: `async function {{name}}({{params}}): Promise<{{returnType}}> {
  try {
    {{logic}}
  } catch (error) {
    console.error('Error in {{name}}:', error);
    throw error;
  }
}`,
      variables: ['name', 'params', 'returnType', 'logic'],
      examples: [
        'async function fetchData(id: string): Promise<Data> { ... }',
      ],
      usage_count: 0,
      createdAt: new Date().toISOString(),
    });
  }
}
