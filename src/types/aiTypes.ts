import type { PolicyScenario, ShockScenario, UserRole } from '../types';

export type AIProvider = 'local' | 'langchain' | 'langflow';

export interface TerritorialEvidence {
  id: string;
  label: string;
  value: string;
  source: string;
  confidence: 'high' | 'medium';
}

export interface AIScenarioDraft {
  title: string;
  rationale: string;
  shocks: ShockScenario[];
  policies: PolicyScenario[];
  assumptions: string[];
  warnings: string[];
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  provider?: AIProvider;
  evidence?: TerritorialEvidence[];
  suggestedActions?: string[];
  scenarioDraft?: AIScenarioDraft;
  executionTrace?: AIChatResponse['executionTrace'];
}

export interface TerritorialAIContext {
  officialData?: { indicator: 'NBI'; source: string; year: number; observedPercent: number; previousPercent: number; modelR2: number; modelRmse: number; predictedPercent: number | null; trainRows: number; testRows: number };
  role: UserRole;
  departmentId: string;
  territoryName: string;
  year: number;
  selectedNeighborhood: {
    id: string;
    name: string;
    district: string;
    ipmM0: number;
    ipmH: number;
    ipmA: number;
    population: number;
  } | null;
  cityMetrics: {
    M0: number;
    H: number;
    A: number;
    poorHouseholds: number;
    totalHouseholds: number;
    extremePovertyRate: number;
    gini: number;
    dimensions: Record<string, number>;
  };
  neighborhoods: Array<{
    id: string;
    name: string;
    district: string;
    ipmM0: number;
    ipmH: number;
    ipmA: number;
    population: number;
    alert: string;
    waterDeprivation: number;
    informalCoverage: number;
    infrastructureIndex: number;
  }>;
  activeShockNames: string[];
  activePolicyNames: string[];
  lastSimulation: {
    deltaIpm: number;
    householdsExitedPoverty: number;
    householdsEnteredPoverty: number;
    costEffectiveness: number;
  } | null;
  mlEngine: {
    modelName: string;
    source: 'live_trained' | 'calibrated_champion';
    r2: number;
    rmse: number;
    sessionId: string | null;
    predictions: Array<{
      neighborhoodId: string;
      neighborhoodName: string;
      observedM0: number;
      predictedM0: number;
      confidenceLow: number;
      confidenceHigh: number;
      category: string;
      topDrivers: string[];
    }>;
  };
}

export interface AIChatRequest {
  message: string;
  sessionId: string;
  preferredProvider: 'auto' | 'langchain' | 'langflow' | 'local';
  context: TerritorialAIContext;
}

export interface AIChatResponse {
  answer: string;
  provider: AIProvider;
  evidence: TerritorialEvidence[];
  suggestedActions: string[];
  scenarioDraft?: AIScenarioDraft;
  auditId: string;
  limitations: string[];
  executionTrace: Array<{
    node: 'context_guard' | 'evidence_tools' | 'langchain_reasoning' | 'langflow_workflow' | 'scenario_draft' | 'human_governance';
    label: string;
    status: 'completed' | 'skipped' | 'fallback';
    detail: string;
  }>;
}
