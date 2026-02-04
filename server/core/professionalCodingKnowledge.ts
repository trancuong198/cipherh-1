/**
 * Professional Coding Knowledge Base
 * 
 * Đây là "BỘ NÃO" chứa TẤT CẢ KIẾN THỨC về lập trình chuyên nghiệp.
 * Bot học từ đây để trở thành một developer giỏi.
 * 
 * Includes:
 * - Best practices
 * - Common patterns
 * - Anti-patterns to avoid
 * - Debugging techniques
 * - Performance optimization
 * - Security practices
 * - Testing strategies
 */

import { logger } from '../services/logger';

export interface CodingPattern {
  name: string;
  category: 'best-practice' | 'anti-pattern' | 'design-pattern' | 'debugging' | 'optimization' | 'security';
  description: string;
  example?: string;
  when_to_use?: string;
  when_to_avoid?: string;
  alternatives?: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface CodingKnowledge {
  patterns: CodingPattern[];
  debugging_techniques: DebuggingTechnique[];
  performance_tips: PerformanceTip[];
  security_practices: SecurityPractice[];
  testing_strategies: TestingStrategy[];
}

export interface DebuggingTechnique {
  name: string;
  description: string;
  steps: string[];
  common_errors: string[];
  solutions: string[];
}

export interface PerformanceTip {
  area: string;
  tip: string;
  impact: 'high' | 'medium' | 'low';
  example?: string;
}

export interface SecurityPractice {
  vulnerability: string;
  description: string;
  prevention: string;
  example_bad: string;
  example_good: string;
}

export interface TestingStrategy {
  type: string;
  description: string;
  when_to_use: string;
  tools: string[];
}

class ProfessionalCodingKnowledgeBase {
  private knowledge: CodingKnowledge;

  constructor() {
    this.knowledge = this.initializeKnowledge();
    logger.info('[CodingKnowledge] Professional knowledge base initialized');
  }

  private initializeKnowledge(): CodingKnowledge {
    return {
      patterns: this.getBestPractices(),
      debugging_techniques: this.getDebuggingTechniques(),
      performance_tips: this.getPerformanceTips(),
      security_practices: this.getSecurityPractices(),
      testing_strategies: this.getTestingStrategies(),
    };
  }

  /**
   * BEST PRACTICES & PATTERNS
   */
  private getBestPractices(): CodingPattern[] {
    return [
      // TypeScript Best Practices
      {
        name: 'Use TypeScript strict mode',
        category: 'best-practice',
        description: 'Enable strict type checking for better code quality',
        importance: 'critical',
        when_to_use: 'Always in TypeScript projects',
        example: '"strict": true in tsconfig.json',
      },
      {
        name: 'Prefer const over let',
        category: 'best-practice',
        description: 'Use const by default, only use let when reassignment is needed',
        importance: 'high',
        when_to_use: 'For all variable declarations',
      },
      {
        name: 'Use async/await over callbacks',
        category: 'best-practice',
        description: 'Modern async code is more readable and maintainable',
        importance: 'high',
        when_to_use: 'For all asynchronous operations',
        example: 'async function getData() { const result = await fetch(url); }',
      },

      // Design Patterns
      {
        name: 'Singleton Pattern',
        category: 'design-pattern',
        description: 'Ensure a class has only one instance',
        importance: 'high',
        when_to_use: 'For services, loggers, configuration managers',
        example: 'export const logger = new Logger();',
      },
      {
        name: 'Factory Pattern',
        category: 'design-pattern',
        description: 'Create objects without specifying exact class',
        importance: 'medium',
        when_to_use: 'When object creation is complex',
      },
      {
        name: 'Observer Pattern',
        category: 'design-pattern',
        description: 'Notify multiple objects of state changes',
        importance: 'medium',
        when_to_use: 'For event-driven systems',
      },

      // Anti-Patterns to AVOID
      {
        name: 'Callback Hell',
        category: 'anti-pattern',
        description: 'Deeply nested callbacks that are hard to read',
        importance: 'critical',
        when_to_avoid: 'Always - use async/await instead',
        alternatives: ['async/await', 'Promises'],
      },
      {
        name: 'God Object',
        category: 'anti-pattern',
        description: 'Single object that knows/does too much',
        importance: 'high',
        when_to_avoid: 'Always - split into smaller, focused classes',
        alternatives: ['Single Responsibility Principle', 'Separation of Concerns'],
      },
      {
        name: 'Magic Numbers',
        category: 'anti-pattern',
        description: 'Hard-coded numbers without explanation',
        importance: 'medium',
        when_to_avoid: 'Always - use named constants',
        alternatives: ['Named constants', 'Configuration'],
      },
      {
        name: 'Copy-Paste Programming',
        category: 'anti-pattern',
        description: 'Duplicating code instead of extracting common logic',
        importance: 'high',
        when_to_avoid: 'Always - DRY principle',
        alternatives: ['Extract function', 'Create utility', 'Inheritance'],
      },

      // Error Handling
      {
        name: 'Always catch errors',
        category: 'best-practice',
        description: 'Never let errors crash the application',
        importance: 'critical',
        when_to_use: 'Around all async operations, API calls, file I/O',
        example: 'try { await operation(); } catch (error) { logger.error(error); }',
      },
      {
        name: 'Log errors with context',
        category: 'best-practice',
        description: 'Include enough information to debug',
        importance: 'high',
        example: 'logger.error("[Module] Operation failed:", { userId, error });',
      },

      // Code Organization
      {
        name: 'Single Responsibility Principle',
        category: 'best-practice',
        description: 'Each function/class should do ONE thing well',
        importance: 'critical',
        when_to_use: 'Always',
      },
      {
        name: 'DRY (Don\'t Repeat Yourself)',
        category: 'best-practice',
        description: 'Avoid code duplication',
        importance: 'high',
        when_to_use: 'When you find yourself copying code',
      },
      {
        name: 'KISS (Keep It Simple, Stupid)',
        category: 'best-practice',
        description: 'Simplicity over complexity',
        importance: 'high',
        when_to_use: 'Always - simpler code is better code',
      },

      // Performance
      {
        name: 'Avoid premature optimization',
        category: 'best-practice',
        description: 'Optimize only when needed, after measuring',
        importance: 'medium',
        when_to_use: 'Measure first, then optimize bottlenecks',
      },
      {
        name: 'Use caching wisely',
        category: 'best-practice',
        description: 'Cache expensive operations',
        importance: 'high',
        when_to_use: 'For repeated expensive computations or API calls',
      },

      // Security
      {
        name: 'Never trust user input',
        category: 'security',
        description: 'Always validate and sanitize input',
        importance: 'critical',
        when_to_use: 'For all user-provided data',
      },
      {
        name: 'Use environment variables for secrets',
        category: 'security',
        description: 'Never hard-code API keys, passwords',
        importance: 'critical',
        when_to_use: 'Always',
        example: 'const apiKey = process.env.API_KEY;',
      },

      // Testing
      {
        name: 'Write tests for critical paths',
        category: 'best-practice',
        description: 'Test important functionality',
        importance: 'high',
        when_to_use: 'For business logic, API endpoints, core features',
      },
    ];
  }

  /**
   * DEBUGGING TECHNIQUES
   */
  private getDebuggingTechniques(): DebuggingTechnique[] {
    return [
      {
        name: 'Read the error message carefully',
        description: 'Error messages often tell you exactly what\'s wrong',
        steps: [
          'Read the full error message',
          'Identify the error type',
          'Note the line number and file',
          'Look at the stack trace',
        ],
        common_errors: [
          'TypeError: Cannot read property X of undefined',
          'ReferenceError: X is not defined',
          'SyntaxError: Unexpected token',
        ],
        solutions: [
          'Check if object exists before accessing properties',
          'Ensure variable is declared and imported',
          'Check for typos, missing brackets, quotes',
        ],
      },
      {
        name: 'Use console.log strategically',
        description: 'Log values at key points to understand flow',
        steps: [
          'Log input values at function start',
          'Log intermediate results',
          'Log before and after critical operations',
          'Remove logs after debugging',
        ],
        common_errors: [],
        solutions: [],
      },
      {
        name: 'Binary search debugging',
        description: 'Narrow down where the problem occurs',
        steps: [
          'Comment out half of the code',
          'Test if error still occurs',
          'Repeat with remaining half',
          'Find exact line causing issue',
        ],
        common_errors: [],
        solutions: [],
      },
      {
        name: 'Check assumptions',
        description: 'Verify your assumptions about data and flow',
        steps: [
          'Log actual data types',
          'Check null/undefined values',
          'Verify API responses',
          'Confirm function arguments',
        ],
        common_errors: ['Assuming data exists', 'Wrong data type', 'Async timing issues'],
        solutions: ['Add null checks', 'Use TypeScript', 'Use await properly'],
      },
      {
        name: 'Reproduce the bug',
        description: 'Consistent reproduction makes fixing easier',
        steps: [
          'Find steps to reproduce',
          'Document the steps',
          'Test the fix repeatedly',
          'Ensure bug doesn\'t return',
        ],
        common_errors: [],
        solutions: [],
      },
    ];
  }

  /**
   * PERFORMANCE OPTIMIZATION TIPS
   */
  private getPerformanceTips(): PerformanceTip[] {
    return [
      {
        area: 'Database',
        tip: 'Use indexes for frequently queried fields',
        impact: 'high',
        example: 'CREATE INDEX idx_user_email ON users(email);',
      },
      {
        area: 'API',
        tip: 'Cache API responses when data doesn\'t change often',
        impact: 'high',
      },
      {
        area: 'Memory',
        tip: 'Avoid memory leaks - clean up event listeners, timers',
        impact: 'high',
        example: 'clearInterval(timer); emitter.removeListener();',
      },
      {
        area: 'Loops',
        tip: 'Avoid expensive operations inside loops',
        impact: 'medium',
        example: 'Calculate once outside loop, reuse result',
      },
      {
        area: 'Async',
        tip: 'Run independent async operations in parallel',
        impact: 'high',
        example: 'const [res1, res2] = await Promise.all([fetch1(), fetch2()]);',
      },
      {
        area: 'Strings',
        tip: 'Use template literals over concatenation',
        impact: 'low',
        example: '`Hello ${name}` instead of "Hello " + name',
      },
    ];
  }

  /**
   * SECURITY PRACTICES
   */
  private getSecurityPractices(): SecurityPractice[] {
    return [
      {
        vulnerability: 'SQL Injection',
        description: 'Attacker injects malicious SQL code',
        prevention: 'Use parameterized queries, never concatenate SQL',
        example_bad: `query("SELECT * FROM users WHERE id = " + userId)`,
        example_good: `query("SELECT * FROM users WHERE id = ?", [userId])`,
      },
      {
        vulnerability: 'XSS (Cross-Site Scripting)',
        description: 'Injecting malicious scripts into web pages',
        prevention: 'Sanitize user input, escape HTML',
        example_bad: `innerHTML = userInput`,
        example_good: `textContent = userInput or use sanitization library`,
      },
      {
        vulnerability: 'Exposed Secrets',
        description: 'API keys, passwords in code or version control',
        prevention: 'Use environment variables, .env files in .gitignore',
        example_bad: `const apiKey = "sk-1234567890";`,
        example_good: `const apiKey = process.env.API_KEY;`,
      },
      {
        vulnerability: 'Unvalidated Input',
        description: 'Trusting user input without validation',
        prevention: 'Validate all input, check types, ranges, formats',
        example_bad: `const age = req.body.age; // No validation`,
        example_good: `const age = parseInt(req.body.age); if (age < 0 || age > 150) throw error;`,
      },
    ];
  }

  /**
   * TESTING STRATEGIES
   */
  private getTestingStrategies(): TestingStrategy[] {
    return [
      {
        type: 'Unit Testing',
        description: 'Test individual functions/methods in isolation',
        when_to_use: 'For business logic, utilities, pure functions',
        tools: ['Jest', 'Mocha', 'Vitest'],
      },
      {
        type: 'Integration Testing',
        description: 'Test how components work together',
        when_to_use: 'For API endpoints, database operations',
        tools: ['Supertest', 'Testing Library'],
      },
      {
        type: 'End-to-End Testing',
        description: 'Test entire user workflows',
        when_to_use: 'For critical user journeys',
        tools: ['Playwright', 'Cypress', 'Selenium'],
      },
    ];
  }

  /**
   * Get knowledge for a specific area
   */
  getKnowledgeFor(area: 'patterns' | 'debugging' | 'performance' | 'security' | 'testing'): any {
    switch (area) {
      case 'patterns':
        return this.knowledge.patterns;
      case 'debugging':
        return this.knowledge.debugging_techniques;
      case 'performance':
        return this.knowledge.performance_tips;
      case 'security':
        return this.knowledge.security_practices;
      case 'testing':
        return this.knowledge.testing_strategies;
      default:
        return null;
    }
  }

  /**
   * Get best practices for code review
   */
  getCodeReviewGuidelines(): string[] {
    return [
      'Check for proper error handling (try/catch)',
      'Look for security vulnerabilities (input validation, SQL injection)',
      'Verify TypeScript types are used correctly',
      'Check for code duplication (DRY principle)',
      'Ensure functions are focused (Single Responsibility)',
      'Look for hard-coded values that should be constants',
      'Check for missing null/undefined checks',
      'Verify async/await is used correctly',
      'Look for potential memory leaks',
      'Check for proper logging',
    ];
  }

  /**
   * Analyze code snippet and provide feedback
   */
  analyzeCode(code: string): {
    issues: string[];
    suggestions: string[];
    score: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    
    // Check for common anti-patterns
    if (code.includes('var ')) {
      issues.push('Using "var" - should use "const" or "let"');
      suggestions.push('Replace "var" with "const" (or "let" if reassignment needed)');
    }
    
    if (code.includes('console.log') && !code.includes('logger.')) {
      issues.push('Using console.log instead of proper logger');
      suggestions.push('Use logger.info/error instead of console.log');
    }
    
    if (code.match(/\.(then|catch)/g)) {
      issues.push('Using .then() instead of async/await');
      suggestions.push('Refactor to use async/await for better readability');
    }
    
    if (!code.includes('try') && code.includes('await')) {
      issues.push('Async code without error handling');
      suggestions.push('Wrap await calls in try/catch block');
    }
    
    if (code.includes('== ') || code.includes('!= ')) {
      issues.push('Using loose equality (==) instead of strict (===)');
      suggestions.push('Use === and !== for strict equality');
    }
    
    // Calculate score (100 - 10 per issue)
    const score = Math.max(0, 100 - (issues.length * 10));
    
    return { issues, suggestions, score };
  }

  /**
   * Get debugging steps for an error type
   */
  getDebuggingStepsFor(errorType: string): string[] {
    const errorMap: Record<string, string[]> = {
      'TypeError': [
        'Check if the variable/object exists',
        'Verify the property name is correct',
        'Add null/undefined check',
        'Check data type matches expected type',
      ],
      'ReferenceError': [
        'Check if variable is declared',
        'Verify import statement is correct',
        'Check for typos in variable name',
        'Ensure variable is in scope',
      ],
      'SyntaxError': [
        'Check for missing brackets, quotes',
        'Verify all blocks are properly closed',
        'Look for typos in keywords',
        'Check for trailing commas',
      ],
      'Promise': [
        'Ensure you\'re using await with async function',
        'Check if promise is being rejected',
        'Add .catch() or try/catch',
        'Verify async function returns promise',
      ],
    };
    
    for (const [type, steps] of Object.entries(errorMap)) {
      if (errorType.includes(type)) {
        return steps;
      }
    }
    
    return [
      'Read the error message carefully',
      'Check the line number indicated',
      'Review recent changes',
      'Add strategic console.log statements',
      'Test with minimal example',
    ];
  }

  /**
   * Get all professional knowledge as text (for AI context)
   */
  getKnowledgeAsText(): string {
    const sections: string[] = [];
    
    sections.push('=== PROFESSIONAL CODING KNOWLEDGE ===\n');
    
    sections.push('\n## BEST PRACTICES & PATTERNS:\n');
    this.knowledge.patterns.forEach(p => {
      sections.push(`\n${p.name} [${p.category}] - ${p.importance}:`);
      sections.push(`  ${p.description}`);
      if (p.when_to_use) sections.push(`  When: ${p.when_to_use}`);
      if (p.when_to_avoid) sections.push(`  Avoid: ${p.when_to_avoid}`);
      if (p.example) sections.push(`  Example: ${p.example}`);
    });
    
    sections.push('\n\n## DEBUGGING TECHNIQUES:\n');
    this.knowledge.debugging_techniques.forEach(t => {
      sections.push(`\n${t.name}:`);
      sections.push(`  ${t.description}`);
      sections.push(`  Steps: ${t.steps.join(', ')}`);
    });
    
    sections.push('\n\n## PERFORMANCE TIPS:\n');
    this.knowledge.performance_tips.forEach(t => {
      sections.push(`- [${t.impact}] ${t.area}: ${t.tip}`);
    });
    
    sections.push('\n\n## SECURITY PRACTICES:\n');
    this.knowledge.security_practices.forEach(s => {
      sections.push(`\n${s.vulnerability}:`);
      sections.push(`  Prevention: ${s.prevention}`);
      sections.push(`  Bad: ${s.example_bad}`);
      sections.push(`  Good: ${s.example_good}`);
    });
    
    return sections.join('\n');
  }

  /**
   * Export knowledge for learning systems
   */
  exportKnowledge(): CodingKnowledge {
    return { ...this.knowledge };
  }
}

export const professionalCodingKnowledge = new ProfessionalCodingKnowledgeBase();
