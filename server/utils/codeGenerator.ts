import OpenAI from 'openai';

export interface CodeStyle {
  naming_conventions: {
    functions: string;
    classes: string;
    variables: string;
  };
  code_structure: {
    modular: boolean;
    separation: string;
  };
  comment_style: string;
  error_handling: string;
  common_patterns: string[];
}

export interface GeneratedCode {
  code: string;
  explanation: string;
  style_notes: string[];
}

export class CodeGenerator {
  private client: OpenAI | null = null;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
      console.log('CodeGenerator initialized with OpenAI');
    } else {
      console.log('CodeGenerator running in placeholder mode (no OpenAI key)');
    }
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  async analyzeCodebaseStyle(filePaths: string[]): Promise<CodeStyle> {
    if (!this.client) {
      return this.getDefaultStyle();
    }

    let codebaseContext = '';
    const fs = await import('fs/promises');
    
    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        codebaseContext += `\n\n=== ${filePath} ===\n${content}`;
      } catch (error) {
        console.warn(`⚠️ Could not read ${filePath}:`, error);
      }
    }

    const prompt = `Analyze this codebase and extract style patterns:

${codebaseContext.substring(0, 8000)}

Return JSON:
{
  "naming_conventions": {"functions": "", "classes": "", "variables": ""},
  "code_structure": {"modular": true, "separation": ""},
  "comment_style": "",
  "error_handling": "",
  "common_patterns": []
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a professional code analyzer.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as CodeStyle;
      }
    } catch (error) {
      console.error('Error analyzing codebase style:', error);
    }

    return this.getDefaultStyle();
  }

  async generateCode(
    description: string,
    style?: CodeStyle,
    context?: string
  ): Promise<GeneratedCode> {
    if (!this.client) {
      return {
        code: `// Code generation requires OpenAI API key\n// Description: ${description}`,
        explanation: 'OpenAI API key not configured',
        style_notes: ['Running in placeholder mode'],
      };
    }

    const styleContext = style
      ? `\n\nFollow these style guidelines:\n${JSON.stringify(style, null, 2)}`
      : '';

    const prompt = `Generate TypeScript/Node.js code based on this description:

${description}

${context ? `Context:\n${context}` : ''}${styleContext}

Provide:
1. Clean, production-ready code
2. Type safety and error handling
3. Comments explaining key parts
4. Following best practices

Return JSON:
{
  "code": "the generated code",
  "explanation": "brief explanation",
  "style_notes": ["note1", "note2"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are an expert TypeScript developer.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as GeneratedCode;
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }

    return {
      code: `// Error generating code\n// Description: ${description}`,
      explanation: 'Code generation failed',
      style_notes: [],
    };
  }

  async generateModule(
    name: string,
    description: string,
    styleFiles: string[] = []
  ): Promise<string> {
    console.log(`Generating module: ${name}`);
    
    let style: CodeStyle | undefined;
    if (styleFiles.length > 0) {
      style = await this.analyzeCodebaseStyle(styleFiles);
    }

    const result = await this.generateCode(
      `Create a TypeScript module named "${name}" that ${description}`,
      style
    );

    return result.code;
  }

  private getDefaultStyle(): CodeStyle {
    return {
      naming_conventions: {
        functions: 'camelCase',
        classes: 'PascalCase',
        variables: 'camelCase',
      },
      code_structure: {
        modular: true,
        separation: 'Single responsibility per module',
      },
      comment_style: 'JSDoc for public APIs, inline for complex logic',
      error_handling: 'Try-catch with proper error types',
      common_patterns: [
        'Async/await for asynchronous operations',
        'Proper TypeScript types throughout',
        'Export interfaces and types',
      ],
    };
  }
}
