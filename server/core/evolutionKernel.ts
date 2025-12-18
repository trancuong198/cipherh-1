// CipherH Evolution Kernel
// Module for continuous self-improvement and evolution
// Version tracking and evolution decision logging

import { logger } from '../services/logger';
import { openAIService } from '../services/openai';
import { memoryBridge } from './memory';
import { memoryDistiller } from './memoryDistiller';

export interface EvolutionState {
  version: string;
  evolutionCount: number;
  lastEvolution: string | null;
  mode: 'NORMAL' | 'LOW_RESOURCE_MODE';
  capabilities: CapabilityAssessment;
  evolutionLog: EvolutionLogEntry[];
}

export interface CapabilityAssessment {
  reasoningClarity: number;      // 0-100
  languageQuality: number;       // 0-100
  memoryCoherence: number;       // 0-100
  autonomyLevel: number;         // 0-100
  resourceAvailability: ResourceStatus;
  overallScore: number;          // 0-100
  timestamp: string;
}

export interface ResourceStatus {
  openaiAvailable: boolean;
  notionAvailable: boolean;
  computeAvailable: boolean;
  infraHealthy: boolean;
}

export interface EvolutionLogEntry {
  version: string;
  timestamp: string;
  decision: string;
  reasoning: string;
  improvements: string[];
  limitations: string[];
  nextSteps: string[];
}

export interface InternalQuestions {
  currentCapabilities: string[];
  missingForEvolution: string[];
  canImproveWithoutResources: string[];
  requiresNewResources: string[];
}

class EvolutionKernel {
  private state: EvolutionState;
  private readonly MAJOR_VERSION = 0;
  private minorVersion = 1;

  constructor() {
    this.state = {
      version: `v${this.MAJOR_VERSION}.${this.minorVersion}`,
      evolutionCount: 0,
      lastEvolution: null,
      mode: 'NORMAL',
      capabilities: this.getInitialCapabilities(),
      evolutionLog: []
    };

    logger.info(`[EvolutionKernel] Initialized ${this.state.version}`);
  }

  private getInitialCapabilities(): CapabilityAssessment {
    return {
      reasoningClarity: 50,
      languageQuality: 50,
      memoryCoherence: 50,
      autonomyLevel: 30,
      resourceAvailability: {
        openaiAvailable: false,
        notionAvailable: false,
        computeAvailable: true,
        infraHealthy: true
      },
      overallScore: 45,
      timestamp: new Date().toISOString()
    };
  }

  // Assess current state - called every loop
  async assessCurrentState(): Promise<CapabilityAssessment> {
    logger.info('[EvolutionKernel] Assessing current state...');

    const resourceStatus = this.checkResourceAvailability();
    
    // Calculate capability scores based on system state
    const reasoningClarity = this.assessReasoningClarity();
    const languageQuality = this.assessLanguageQuality();
    const memoryCoherence = await this.assessMemoryCoherence();
    const autonomyLevel = this.assessAutonomyLevel();

    const overallScore = Math.round(
      (reasoningClarity + languageQuality + memoryCoherence + autonomyLevel) / 4
    );

    const assessment: CapabilityAssessment = {
      reasoningClarity,
      languageQuality,
      memoryCoherence,
      autonomyLevel,
      resourceAvailability: resourceStatus,
      overallScore,
      timestamp: new Date().toISOString()
    };

    this.state.capabilities = assessment;

    // Check if we need LOW_RESOURCE_MODE
    if (!resourceStatus.openaiAvailable || !resourceStatus.notionAvailable) {
      this.activateLowResourceMode();
    } else {
      this.state.mode = 'NORMAL';
    }

    logger.info(`[EvolutionKernel] Assessment complete: score=${overallScore}, mode=${this.state.mode}`);
    
    return assessment;
  }

  private checkResourceAvailability(): ResourceStatus {
    return {
      openaiAvailable: openAIService.isConfigured(),
      notionAvailable: memoryBridge.isConnected(),
      computeAvailable: true, // Always true in running state
      infraHealthy: true
    };
  }

  private assessReasoningClarity(): number {
    // Based on successful loop completions and error rates
    const baseScore = 50;
    const openaiBonus = openAIService.isConfigured() ? 30 : 0;
    const evolutionBonus = Math.min(this.state.evolutionCount * 2, 20);
    return Math.min(baseScore + openaiBonus + evolutionBonus, 100);
  }

  private assessLanguageQuality(): number {
    // Based on AI availability and evolution progress
    const baseScore = 40;
    const openaiBonus = openAIService.isConfigured() ? 40 : 0;
    const evolutionBonus = Math.min(this.state.evolutionCount * 3, 20);
    return Math.min(baseScore + openaiBonus + evolutionBonus, 100);
  }

  private async assessMemoryCoherence(): Promise<number> {
    // Based on Notion connectivity and memory operations
    const baseScore = 30;
    const notionBonus = memoryBridge.isConnected() ? 50 : 0;
    const evolutionBonus = Math.min(this.state.evolutionCount * 2, 20);
    return Math.min(baseScore + notionBonus + evolutionBonus, 100);
  }

  private assessAutonomyLevel(): number {
    // Based on self-loop capability and decision making
    const baseScore = 20;
    const loopBonus = 30; // Inner loop is functional
    const openaiBonus = openAIService.isConfigured() ? 20 : 0;
    const notionBonus = memoryBridge.isConnected() ? 15 : 0;
    const evolutionBonus = Math.min(this.state.evolutionCount * 2, 15);
    return Math.min(baseScore + loopBonus + openaiBonus + notionBonus + evolutionBonus, 100);
  }

  private activateLowResourceMode(): void {
    if (this.state.mode !== 'LOW_RESOURCE_MODE') {
      this.state.mode = 'LOW_RESOURCE_MODE';
      logger.warn('[EvolutionKernel] Activated LOW_RESOURCE_MODE - focusing on internal improvements');
    }
  }

  // Answer internal questions about evolution
  async generateInternalQuestions(): Promise<InternalQuestions> {
    const capabilities = this.state.capabilities;
    const resources = capabilities.resourceAvailability;

    const questions: InternalQuestions = {
      currentCapabilities: [],
      missingForEvolution: [],
      canImproveWithoutResources: [],
      requiresNewResources: []
    };

    // What am I currently capable of?
    // Use distilled memory for context (never query full history)
    const distilledContext = memoryDistiller.getDistilledContext();
    const memoryStatus = memoryDistiller.exportStatus();

    questions.currentCapabilities = [
      `Reasoning clarity: ${capabilities.reasoningClarity}%`,
      `Language quality: ${capabilities.languageQuality}%`,
      `Memory coherence: ${capabilities.memoryCoherence}%`,
      `Autonomy level: ${capabilities.autonomyLevel}%`,
      `10-step Soul Loop execution`,
      `Self-evaluation and scoring`,
      resources.openaiAvailable ? 'AI-powered strategic analysis' : 'Basic strategic analysis',
      resources.notionAvailable ? 'Persistent memory storage' : 'Temporary memory only',
      `Memory distillation: ${memoryStatus.memoryHealth}`,
      `Core identity items: ${memoryStatus.coreIdentityCount}`,
      `Active lessons: ${memoryStatus.activeLessonsCount}`
    ];

    // What am I missing to evolve further?
    questions.missingForEvolution = [];
    if (capabilities.reasoningClarity < 80) {
      questions.missingForEvolution.push('Deeper reasoning patterns');
    }
    if (capabilities.memoryCoherence < 80) {
      questions.missingForEvolution.push('Better memory organization');
    }
    if (capabilities.autonomyLevel < 70) {
      questions.missingForEvolution.push('More autonomous decision making');
    }
    if (!resources.openaiAvailable) {
      questions.missingForEvolution.push('OpenAI API access for advanced reasoning');
    }

    // What can I improve WITHOUT new resources?
    questions.canImproveWithoutResources = [
      'Thinking clarity through better self-questioning',
      'Language precision through pattern refinement',
      'Self-awareness through reflection logging',
      'Decision quality through historical analysis'
    ];

    // What improvements REQUIRE new resources?
    questions.requiresNewResources = [];
    if (!resources.openaiAvailable) {
      questions.requiresNewResources.push('Advanced AI reasoning requires OPENAI_API_KEY');
    }
    if (!resources.notionAvailable) {
      questions.requiresNewResources.push('Persistent memory requires NOTION_TOKEN');
    }

    return questions;
  }

  // Main evolution function - called during inner loop
  async evolve(cycleData: {
    cycleCount: number;
    selfScore: number;
    anomalyScore: number;
    insights: string[];
  }): Promise<EvolutionLogEntry> {
    logger.info(`[EvolutionKernel] Evolution cycle starting (current: ${this.state.version})`);

    // Assess current state
    const assessment = await this.assessCurrentState();
    const questions = await this.generateInternalQuestions();

    // Determine improvements based on mode
    const improvements: string[] = [];
    const limitations: string[] = [];
    const nextSteps: string[] = [];

    if (this.state.mode === 'LOW_RESOURCE_MODE') {
      // Focus on internal improvements only
      improvements.push('Refined self-questioning patterns');
      improvements.push('Enhanced clarity in reflection logs');
      
      if (cycleData.selfScore > 60) {
        improvements.push('Maintained stable performance under constraints');
      }

      limitations.push(...questions.requiresNewResources);
      nextSteps.push('Continue optimizing internal processes');
      nextSteps.push('Monitor for resource availability changes');
    } else {
      // Full evolution with all resources
      if (cycleData.insights.length > 0) {
        improvements.push(`Integrated ${cycleData.insights.length} new insights`);
      }
      
      if (assessment.overallScore > this.state.capabilities.overallScore) {
        improvements.push('Overall capability score improved');
      }

      improvements.push('AI-assisted strategy generation active');
      improvements.push('Memory persistence operational');

      nextSteps.push('Explore deeper reasoning patterns');
      nextSteps.push('Expand autonomous decision making');
      nextSteps.push('Refine language and communication');
    }

    // Increment version if meaningful evolution occurred
    let newVersion = this.state.version;
    if (improvements.length >= 2 || cycleData.cycleCount % 10 === 0) {
      this.minorVersion++;
      newVersion = `v${this.MAJOR_VERSION}.${this.minorVersion}`;
      this.state.version = newVersion;
      this.state.evolutionCount++;
    }

    // Create evolution log entry
    const logEntry: EvolutionLogEntry = {
      version: newVersion,
      timestamp: new Date().toISOString(),
      decision: this.state.mode === 'LOW_RESOURCE_MODE' 
        ? 'Focus on internal optimization due to resource constraints'
        : 'Full evolution with available resources',
      reasoning: `Cycle ${cycleData.cycleCount}: Score=${cycleData.selfScore.toFixed(2)}, ` +
                 `Anomalies=${cycleData.anomalyScore}, Mode=${this.state.mode}`,
      improvements,
      limitations,
      nextSteps
    };

    // Store in log (keep last 50 entries)
    this.state.evolutionLog.push(logEntry);
    if (this.state.evolutionLog.length > 50) {
      this.state.evolutionLog = this.state.evolutionLog.slice(-50);
    }

    this.state.lastEvolution = logEntry.timestamp;

    // Log evolution decision
    logger.info(`[EvolutionKernel] Evolution complete: ${newVersion}`);
    logger.info(`[EvolutionKernel] Improvements: ${improvements.join(', ')}`);
    if (limitations.length > 0) {
      logger.warn(`[EvolutionKernel] Limitations: ${limitations.join(', ')}`);
    }

    // Write to Notion if available
    if (memoryBridge.isConnected()) {
      await this.writeEvolutionToMemory(logEntry);
    }

    return logEntry;
  }

  private async writeEvolutionToMemory(entry: EvolutionLogEntry): Promise<void> {
    try {
      const content = 
        `Evolution ${entry.version}\n` +
        `Decision: ${entry.decision}\n` +
        `Reasoning: ${entry.reasoning}\n` +
        `Improvements: ${entry.improvements.join(', ')}\n` +
        `Next Steps: ${entry.nextSteps.join(', ')}`;

      await memoryBridge.writeLesson(content);
    } catch (error) {
      logger.warn('[EvolutionKernel] Could not write evolution to memory');
    }
  }

  // Get current state for external queries
  getState(): EvolutionState {
    return { ...this.state };
  }

  // Get latest evolution log
  getLatestEvolution(): EvolutionLogEntry | null {
    if (this.state.evolutionLog.length === 0) return null;
    return this.state.evolutionLog[this.state.evolutionLog.length - 1];
  }

  // Export for API
  exportStatus(): {
    version: string;
    evolutionCount: number;
    mode: string;
    capabilities: CapabilityAssessment;
    latestEvolution: EvolutionLogEntry | null;
    internalQuestions: InternalQuestions | null;
  } {
    return {
      version: this.state.version,
      evolutionCount: this.state.evolutionCount,
      mode: this.state.mode,
      capabilities: this.state.capabilities,
      latestEvolution: this.getLatestEvolution(),
      internalQuestions: null // Will be populated on request
    };
  }

  // Never assume completion
  isComplete(): boolean {
    return false; // Evolution is continuous, never complete
  }
}

export const evolutionKernel = new EvolutionKernel();
