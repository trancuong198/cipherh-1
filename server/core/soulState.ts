import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '../..');

export interface SoulState {
  id: string;
  timestamp: string;
  cycle: number;
  version: string;
  agency_state: {
    cycleCount: number;
    confidence: number;
    doubts: number;
    energyLevel: number;
    mode: 'active' | 'idle' | 'learning' | 'reflecting';
    currentFocus: string | null;
  };
  autonomy_level: number;
  active_constraints: string[];
  reality_metrics_summary: {
    stabilityScore: number;
    evolutionScore: number;
    autonomyScore: number;
    consecutiveMismatches: number;
  };
  behavior_pattern_hash: string;
  desire_state_summary: {
    totalDesires: number;
    pendingDesires: number;
    blockedDesires: number;
  };
  governance_state: {
    conservativeMode: boolean;
  };
  checksum: string;
  goals?: string[];
  lessons?: string[];
  reflections?: string[];
}

let currentState: SoulState | null = null;

const STATE_FILE = join(process.cwd(), 'data/state_snapshot.json');

export async function loadState(): Promise<SoulState> {
  if (currentState) {
    return currentState;
  }

  try {
    const data = await readFile(STATE_FILE, 'utf-8');
    currentState = JSON.parse(data);
    console.log(`State loaded from ${STATE_FILE}`);
    return currentState!;
  } catch (error) {
    console.log('No existing state found, creating new state');
    currentState = createInitialState();
    await saveState(currentState);
    return currentState;
  }
}

export function getSoulState(): SoulState {
  if (!currentState) {
    throw new Error('State not loaded. Call loadState() first.');
  }
  return currentState;
}

export async function updateState(updates: Partial<SoulState>): Promise<SoulState> {
  const state = await loadState();
  currentState = {
    ...state,
    ...updates,
    timestamp: new Date().toISOString(),
  };
  await saveState(currentState);
  return currentState;
}

export async function saveState(state: SoulState): Promise<void> {
  try {
    // Ensure data directory exists
    await mkdir(join(process.cwd(), 'data'), { recursive: true });
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`State saved to ${STATE_FILE}`);
  } catch (error) {
    console.error('Error saving state:', error);
    throw error;
  }
}

function createInitialState(): SoulState {
  return {
    id: `snap_${Date.now()}`,
    timestamp: new Date().toISOString(),
    cycle: 0,
    version: '2.0',
    agency_state: {
      cycleCount: 0,
      confidence: 50,
      doubts: 0,
      energyLevel: 100,
      mode: 'idle',
      currentFocus: null,
    },
    autonomy_level: 50,
    active_constraints: [],
    reality_metrics_summary: {
      stabilityScore: 60,
      evolutionScore: 100,
      autonomyScore: 50,
      consecutiveMismatches: 0,
    },
    behavior_pattern_hash: generateHash(),
    desire_state_summary: {
      totalDesires: 0,
      pendingDesires: 0,
      blockedDesires: 0,
    },
    governance_state: {
      conservativeMode: false,
    },
    checksum: generateHash(),
    goals: [],
    lessons: [],
    reflections: [],
  };
}

function generateHash(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function incrementCycle(state: SoulState): SoulState {
  return {
    ...state,
    cycle: state.cycle + 1,
    agency_state: {
      ...state.agency_state,
      cycleCount: state.agency_state.cycleCount + 1,
    },
  };
}

export function updateConfidence(state: SoulState, delta: number): SoulState {
  const newConfidence = Math.max(0, Math.min(100, state.agency_state.confidence + delta));
  return {
    ...state,
    agency_state: {
      ...state.agency_state,
      confidence: newConfidence,
    },
  };
}

export function updateEnergy(state: SoulState, delta: number): SoulState {
  const newEnergy = Math.max(0, Math.min(100, state.agency_state.energyLevel + delta));
  return {
    ...state,
    agency_state: {
      ...state.agency_state,
      energyLevel: newEnergy,
    },
  };
}
