/**
 * Types & Interfaces for the Urban Socioeconomic Vulnerability Machine Learning Engine (GD-VSU)
 * Rigorous EDA, Multi-Model Training, Cross-Validation, Bayesian Hyperparameters,
 * Robust Statistical Hypothesis Tests and XAI (SHAP Explainability)
 */

export interface VariableDescriptiveStats {
  key: string;
  label: string;
  unit: string;
  count: number;
  mean: number;
  std: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  skewness: number;
  kurtosis: number;
  interpretation: string;
}

export interface CorrelationPair {
  var1: string;
  var2: string;
  label1: string;
  label2: string;
  pearsonR: number;
  spearmanRho: number;
  pValue: number;
  isSignificant: boolean;
  relationshipStrength: 'Fuerte Directa' | 'Moderada Directa' | 'Fuerte Inversa' | 'Moderada Inversa' | 'Débil / Nula';
  interpretation: string;
}

export interface SpatialMoranStats {
  variable: string;
  label: string;
  moranI: number;
  expectedI: number;
  variance: number;
  zScore: number;
  pValue: number;
  spatialPattern: 'Cluster Alto-Alto (Puntos Críticos)' | 'Cluster Bajo-Bajo (Zonas Consolidadas)' | 'Dispersión Espacial' | 'Aleatorio Puro';
  interpretation: string;
}

export interface EDASummary {
  variables: VariableDescriptiveStats[];
  correlations: CorrelationPair[];
  spatialAutocorrelation: SpatialMoranStats[];
  outlierSummary: {
    totalOutliersDetected: number;
    outlierNeighborhoods: string[];
    multivariateMahalanobisDistanceMax: number;
    interpretation: string;
  };
  generalInterpretation: string;
}

export interface ModelCandidate {
  id: string;
  name: string;
  alias: string;
  family: 'ensemble_boosting' | 'ensemble_bagging' | 'regularized_linear' | 'neural_network' | 'spatial_econometric';
  isChampion: boolean;
  trainingTimeSec: number;
  inferenceTimeMs: number;
  testMetrics: {
    r2: number;
    rmse: number;
    mae: number;
    mape: number; // %
    f1Score: number;
    logLoss: number;
    aic: number;
    bic: number;
  };
  residualsAnalysis: {
    meanResidual: number;
    stdResidual: number;
    shapiroWilkW: number;
    shapiroWilkP: number;
    breuschPaganLM: number;
    breuschPaganP: number;
    homoscedastic: boolean;
    residualNormal: boolean;
  };
  hyperparameters: Record<string, string | number | boolean | number[]>;
  interpretation: string;
  explainability: string;
}

export interface FoldMetric {
  fold: number;
  sectorName: string;
  trainR2: number;
  valR2: number;
  valRMSE: number;
  valMAE: number;
  valF1: number;
}

export interface CrossValidationResult {
  strategy: 'Spatial_Block_KFold_5' | 'Spatial_Block_KFold_10';
  kFolds: number;
  foldScores: FoldMetric[];
  meanValR2: number;
  stdValR2: number;
  ci95ValR2: [number, number];
  meanValRMSE: number;
  meanValMAE: number;
  learningCurve: {
    trainingSampleSize: number;
    trainScoreR2: number;
    valScoreR2: number;
  }[];
  spatialDataLeakagePrevented: boolean;
  interpretation: string;
}

export interface TunedParameter {
  param: string;
  label: string;
  rangeExplored: string;
  bestValue: string | number;
  importancePct: number;
  sensitivityImpact: string;
}

export interface HyperparameterOptimizationResult {
  modelId: string;
  modelName: string;
  searchMethod: 'Bayesian_Optimization_TPE' | 'GridSearchCV_Spatial';
  iterations: number;
  parametersTuned: TunedParameter[];
  convergenceHistory: { iteration: number; bestMetricR2: number; currentMetricR2: number }[];
  optimizationDurationSec: number;
  interpretation: string;
}

export interface StatisticalTestResult {
  id: string;
  testName: string;
  testCategory: 'Normality' | 'Parametric_Comparison' | 'Non_Parametric_Comparison' | 'Forecast_Superiority' | 'Omnibus_Rank' | 'Bootstrap_Resampling';
  nullHypothesis: string;
  altHypothesis: string;
  testStatisticName: string;
  testStatisticValue: number;
  pValue: number;
  degreesOfFreedom?: number;
  confidenceInterval95?: [number, number];
  decision: 'Rechazar H0 (Diferencia Estadística Significativa)' | 'No Rechazar H0 (Consistente con H0)';
  effectSize: string;
  interpretation: string;
  policyRelevance: string;
}

export interface SHAPFeatureAttribution {
  featureKey: string;
  featureLabel: string;
  meanAbsoluteSHAP: number;
  relativeImportancePct: number;
  directionEffect: 'Aumenta Vulnerabilidad (+)' | 'Reduce Vulnerabilidad (-)';
  elasticidadImpacto: string;
  counterfactualScenario: string;
  policyRecommendation: string;
}

export interface MLFullEngineResult {
  eda: EDASummary;
  models: ModelCandidate[];
  championModel: ModelCandidate;
  crossValidation: {
    cv5: CrossValidationResult;
    cv10: CrossValidationResult;
  };
  hyperparameterOptimization: HyperparameterOptimizationResult;
  statisticalTests: StatisticalTestResult[];
  shapAttributions: SHAPFeatureAttribution[];
  residualsScatterPlot: { predicted: number; actual: number; residual: number; barrioName: string }[];
  generatedAt: string;
  territoryContext: string;
  activeTrainedSession?: LiveTrainingSession;
}

export type TrainingAlgorithmId = 'xgboost' | 'random_forest' | 'neural_network' | 'elasticnet' | 'sar_spatial';
export type OptimizerAlgorithmType = 'adam' | 'sgd_momentum' | 'rmsprop';

export interface TrainingHyperparametersConfig {
  algorithm: TrainingAlgorithmId;
  optimizer: OptimizerAlgorithmType;
  epochs: number;
  learningRate: number;
  maxDepth: number;
  l2Regularization: number;
  trainTestSplitPct: number;
  kFolds: number;
  selectedFeatures: string[];
  randomSeed: number;
  enableSpatialPenalty: boolean;
}

export interface TrainingEpochLog {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  valR2: number;
  currentLearningRate: number;
  gradientNorm?: number;
  message?: string;
}

export interface KFoldFoldValidation {
  foldIndex: number;
  trainSamples: number;
  valSamples: number;
  valR2: number;
  valRMSE: number;
  status: 'pending' | 'running' | 'completed';
}

export interface AutoMLTrial {
  trialId: string;
  algorithm: TrainingAlgorithmId;
  optimizer: OptimizerAlgorithmType;
  epochs: number;
  learningRate: number;
  maxDepth: number;
  l2Reg: number;
  valR2: number;
  valRMSE: number;
  rank: number;
  isChampion: boolean;
}

export interface LiveTrainingSession {
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  config: TrainingHyperparametersConfig;
  status: 'idle' | 'preparing' | 'training' | 'validating' | 'completed' | 'error';
  progressPct: number;
  currentEpoch: number;
  totalEpochs: number;
  epochHistory: TrainingEpochLog[];
  foldResults?: KFoldFoldValidation[];
  terminalLogs: string[];
  finalMetrics?: {
    r2: number;
    rmse: number;
    mae: number;
    mape: number;
    aic: number;
    bic: number;
  };
  weights?: {
    featureWeights: Record<string, number>;
    bias: number;
  };
}

export interface InferenceInputVector {
  luminosidadNocturnaVIIRS: number;
  coberturaGHSLInformal: number;
  indiceVegetacionNDVI: number;
  distanciaHospitalMin: number;
  distanciaEscuelaMin: number;
  indiceInfraestructura: number;
  coeficienteTrampaPobreza: number;
}

export interface InferencePredictionResult {
  predicted_M0: number;
  povertyCategory: 'Pobreza Extrema Crítica' | 'Pobreza Multidimensional Severa' | 'Vulnerabilidad Moderada' | 'Hogar No Pobre / Resiliente';
  confidenceInterval95: [number, number];
  featureContributions: {
    featureKey: string;
    featureLabel: string;
    inputValue: number;
    shapValue: number;
    impactType: 'incrementa_pobreza' | 'reduce_pobreza';
  }[];
  modelUsed: string;
  inferenceLatencyMs: number;
  selectedBarrioName?: string;
  observedActual_M0?: number;
  residualDelta?: number;
}

export interface UrbanInterventionPlan {
  id: string;
  title: string;
  description: string;
  budgetMillionsSoles: number;
  durationMonths: number;
  featureDeltas: {
    viirs?: number;
    ghsl?: number;
    ndvi?: number;
    distHospital?: number;
    distEscuela?: number;
    infra?: number;
    trampa?: number;
  };
  expectedPovertyReductionPct: number;
  estimatedFamiliesBenefited: number;
  socialReturnOnInvestment: number; // Ratio SROI
}

