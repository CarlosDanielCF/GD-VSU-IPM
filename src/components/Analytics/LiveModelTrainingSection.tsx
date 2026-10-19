import React, { useState, useRef, useEffect } from 'react';
import { NeighborhoodCell } from '../../types';
import { 
  MLFullEngineResult, 
  TrainingHyperparametersConfig, 
  LiveTrainingSession, 
  TrainingAlgorithmId,
  OptimizerAlgorithmType,
  InferenceInputVector,
  InferencePredictionResult,
  AutoMLTrial,
  UrbanInterventionPlan
} from '../../types/mlTypes';
import { 
  LiveModelTrainer, 
  TRAINING_FEATURES, 
  DEFAULT_TRAINING_CONFIG,
  URBAN_INTERVENTION_CATALOG
} from '../../services/liveModelTrainer';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Play, 
  RefreshCw, 
  Sliders, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Download, 
  Zap, 
  RotateCcw,
  Sparkles,
  Code2,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  TrendingDown,
  Layers,
  Award,
  BarChart3,
  Flame,
  Clock
} from 'lucide-react';

interface LiveModelTrainingSectionProps {
  neighborhoods: NeighborhoodCell[];
  mlResult: MLFullEngineResult;
  selectedCity: string;
  onUpdateMLResult: (updated: MLFullEngineResult) => void;
}

export const LiveModelTrainingSection: React.FC<LiveModelTrainingSectionProps> = ({
  neighborhoods,
  mlResult,
  selectedCity,
  onUpdateMLResult
}) => {
  // Config state
  const [config, setConfig] = useState<TrainingHyperparametersConfig>(
    mlResult.activeTrainedSession?.config || DEFAULT_TRAINING_CONFIG
  );

  // Training execution state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [session, setSession] = useState<LiveTrainingSession | null>(
    mlResult.activeTrainedSession || null
  );
  const [trainingSuccessMsg, setTrainingSuccessMsg] = useState<string | null>(null);

  // Modals & Panels State
  const [showAutoMLModal, setShowAutoMLModal] = useState<boolean>(false);
  const [isAutoMLRunning, setIsAutoMLRunning] = useState<boolean>(false);
  const [autoMLTrials, setAutoMLTrials] = useState<AutoMLTrial[]>([]);
  const [autoMLProgress, setAutoMLProgress] = useState<{ current: number; total: number } | null>(null);

  const [showPythonCodeModal, setShowPythonCodeModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Interactive Inference Playground State
  const [selectedBarrioId, setSelectedBarrioId] = useState<string>('');
  const [inferenceInput, setInferenceInput] = useState<InferenceInputVector>({
    luminosidadNocturnaVIIRS: 8.5,
    coberturaGHSLInformal: 0.45,
    indiceVegetacionNDVI: 0.15,
    distanciaHospitalMin: 35,
    distanciaEscuelaMin: 18,
    indiceInfraestructura: 0.52,
    coeficienteTrampaPobreza: 0.60
  });

  const [inferenceResult, setInferenceResult] = useState<InferencePredictionResult | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  // Urban Policy Simulation State
  const [selectedInterventionPlan, setSelectedInterventionPlan] = useState<UrbanInterventionPlan>(URBAN_INTERVENTION_CATALOG[0]);
  const [interventionSimulation, setInterventionSimulation] = useState<ReturnType<typeof LiveModelTrainer.simulateUrbanIntervention> | null>(null);

  // Terminal scroll reference
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.terminalLogs]);

  // Execute Real Training
  const handleStartTraining = async (customConfig?: TrainingHyperparametersConfig) => {
    if (isTraining) return;
    setIsTraining(true);
    setTrainingSuccessMsg(null);
    const activeCfg = customConfig || config;

    try {
      const { session: completedSession, updatedResult } = await LiveModelTrainer.executeTraining(
        neighborhoods,
        activeCfg,
        mlResult,
        (progressSession) => {
          setSession(progressSession);
        }
      );

      setSession(completedSession);
      onUpdateMLResult(updatedResult);
      setTrainingSuccessMsg(
        `✓ Entrenamiento completado con éxito: ${completedSession.config.algorithm.toUpperCase()} con ${activeCfg.optimizer.toUpperCase()} alcanzó R² = ${completedSession.finalMetrics?.r2} y RMSE = ${completedSession.finalMetrics?.rmse}. Los pesos numéricos son el nuevo Modelo Campeón.`
      );

      // Auto-run inference with default input
      runInferenceWithTrainedWeights(completedSession, updatedResult);
    } catch (err) {
      console.error('Training failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  // Run Inference
  const runInferenceWithTrainedWeights = (
    currentSession?: LiveTrainingSession | null,
    currentMlResult?: MLFullEngineResult,
    barrioName?: string,
    actualM0?: number
  ) => {
    setIsInferring(true);
    const s = currentSession || session;
    const res = currentMlResult || mlResult;

    const weights = s?.weights?.featureWeights || {
      viirs: -0.09,
      ghsl: 0.12,
      ndvi: -0.04,
      distHospital: 0.08,
      distEscuela: 0.06,
      infra: -0.11,
      trampa: 0.10
    };
    const bias = s?.weights?.bias || res.championModel.testMetrics.r2 * 0.28 || 0.26;
    const featureStats = LiveModelTrainer.computeFeatureStats(neighborhoods, config.selectedFeatures);

    setTimeout(() => {
      const pred = LiveModelTrainer.runInference(
        inferenceInput,
        weights,
        bias,
        featureStats,
        res.championModel.name,
        res.championModel.testMetrics.rmse,
        barrioName,
        actualM0
      );
      setInferenceResult(pred);

      // Also compute urban intervention simulation
      const sim = LiveModelTrainer.simulateUrbanIntervention(
        inferenceInput,
        selectedInterventionPlan,
        weights,
        bias,
        featureStats,
        res.championModel.testMetrics.rmse
      );
      setInterventionSimulation(sim);

      setIsInferring(false);
    }, 90);
  };

  // Initial inference on mount
  useEffect(() => {
    runInferenceWithTrainedWeights();
  }, [selectedInterventionPlan]);

  // Handle barrio selection
  const handleSelectBarrio = (barrioId: string) => {
    setSelectedBarrioId(barrioId);
    if (!barrioId) return;

    const b = neighborhoods.find(n => n.id === barrioId);
    if (!b) return;

    const newVec: InferenceInputVector = {
      luminosidadNocturnaVIIRS: b.luminosidadNocturnaVIIRS,
      coberturaGHSLInformal: b.coberturaGHSLInformal,
      indiceVegetacionNDVI: b.indiceVegetacionNDVI,
      distanciaHospitalMin: b.distanciaHospitalMin,
      distanciaEscuelaMin: b.distanciaEscuelaMin,
      indiceInfraestructura: b.indiceInfraestructura,
      coeficienteTrampaPobreza: b.coeficienteTrampaPobreza
    };

    setInferenceInput(newVec);

    // Run inference immediately with real barrio info
    const s = session;
    const res = mlResult;
    const weights = s?.weights?.featureWeights || {
      viirs: -0.09, ghsl: 0.12, ndvi: -0.04, distHospital: 0.08, distEscuela: 0.06, infra: -0.11, trampa: 0.10
    };
    const bias = s?.weights?.bias || res.championModel.testMetrics.r2 * 0.28 || 0.26;
    const featureStats = LiveModelTrainer.computeFeatureStats(neighborhoods, config.selectedFeatures);

    const pred = LiveModelTrainer.runInference(
      newVec,
      weights,
      bias,
      featureStats,
      res.championModel.name,
      res.championModel.testMetrics.rmse,
      b.nombre,
      b.ipm_M0
    );
    setInferenceResult(pred);

    const sim = LiveModelTrainer.simulateUrbanIntervention(
      newVec,
      selectedInterventionPlan,
      weights,
      bias,
      featureStats,
      res.championModel.testMetrics.rmse
    );
    setInterventionSimulation(sim);
  };

  // Reset config to defaults
  const handleResetConfig = () => {
    setConfig(DEFAULT_TRAINING_CONFIG);
  };

  // Toggle feature selection
  const handleToggleFeature = (featKey: string) => {
    setConfig(prev => {
      const exists = prev.selectedFeatures.includes(featKey);
      if (exists && prev.selectedFeatures.length <= 2) return prev;
      const updated = exists 
        ? prev.selectedFeatures.filter(f => f !== featKey)
        : [...prev.selectedFeatures, featKey];
      return { ...prev, selectedFeatures: updated };
    });
  };

  // Run AutoML Tournament
  const handleRunAutoMLTournament = async () => {
    setIsAutoMLRunning(true);
    setAutoMLTrials([]);
    setAutoMLProgress({ current: 0, total: 4 });

    try {
      const { trials, winningConfig } = await LiveModelTrainer.runAutoMLTournament(
        neighborhoods,
        (current, total, trial) => {
          setAutoMLProgress({ current, total });
          setAutoMLTrials(prev => [...prev, trial]);
        }
      );

      setAutoMLTrials(trials);
      setConfig(winningConfig);
    } catch (e) {
      console.error('AutoML error:', e);
    } finally {
      setIsAutoMLRunning(false);
    }
  };

  // Apply winning AutoML trial and train
  const handleApplyAutoMLAndTrain = (trial: AutoMLTrial) => {
    const newCfg: TrainingHyperparametersConfig = {
      ...config,
      algorithm: trial.algorithm,
      optimizer: trial.optimizer,
      epochs: trial.epochs,
      learningRate: trial.learningRate,
      maxDepth: trial.maxDepth,
      l2Regularization: trial.l2Reg
    };
    setConfig(newCfg);
    setShowAutoMLModal(false);
    handleStartTraining(newCfg);
  };

  // Download trained weights JSON
  const handleDownloadWeightsJSON = () => {
    const weightsObj = {
      modelName: mlResult.championModel.name,
      algorithm: config.algorithm,
      optimizer: config.optimizer,
      spatialRegularization: config.enableSpatialPenalty,
      trainedAt: session?.completedAt || new Date().toISOString(),
      territory: selectedCity,
      neighborhoodsCount: neighborhoods.length,
      hyperparameters: config,
      finalMetrics: session?.finalMetrics || mlResult.championModel.testMetrics,
      kFoldValidation: session?.foldResults || [],
      weights: session?.weights || { bias: 0.26, featureWeights: {} },
      convergenceLossHistory: session?.epochHistory || []
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(weightsObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonStr);
    downloadAnchor.setAttribute('download', `modelo_ia_entrenado_${config.algorithm}_${selectedCity.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download convergence CSV
  const handleDownloadConvergenceCSV = () => {
    if (!session?.epochHistory || session.epochHistory.length === 0) return;
    const csvRows = ['Epoca,Train_MSE_Loss,Val_MSE_Loss,Val_R2,Learning_Rate,Gradient_Norm'];
    session.epochHistory.forEach(h => {
      csvRows.push(`${h.epoch},${h.trainLoss},${h.valLoss},${h.valR2},${h.currentLearningRate},${h.gradientNorm || 0}`);
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    downloadAnchor.setAttribute('download', `historial_convergencia_${config.algorithm}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Copy python code
  const pythonScript = LiveModelTrainer.generateProductionPythonScript(
    config,
    session?.weights?.featureWeights || {},
    session?.weights?.bias || 0.26,
    selectedCity
  );

  const handleCopyPythonCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadPythonScript = () => {
    const fileContent = 'data:text/plain;charset=utf-8,' + encodeURIComponent(pythonScript);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', fileContent);
    downloadAnchor.setAttribute('download', `pipeline_produccion_${config.algorithm}_${selectedCity.replace(/\s+/g, '_')}.py`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Banner & Primary Actions */}
      <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0D221D] text-[#00FFC2] border border-[#184E42] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MOTOR IA DE ALTO RENDIMIENTO // GD-VSU 2.0
            </span>
            <span className="text-[10px] text-[#8E9299] font-mono">
              Dataset: {neighborhoods.length} celdas urbanas en {selectedCity}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white font-mono mt-1 flex items-center gap-2">
            Centro de Control de Entrenamiento, Inferencia Predictiva & AutoML
          </h3>
          <p className="text-xs text-[#8E9299] max-w-3xl mt-0.5">
            Entrenamiento en vivo con optimizador Adam, regularización espacial $W$, validación cruzada Spatial K-Fold, simulación de intervenciones urbanas y exportación de código Python para producción.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* AutoML Button */}
          <button
            onClick={() => {
              setShowAutoMLModal(true);
              if (autoMLTrials.length === 0 && !isAutoMLRunning) {
                handleRunAutoMLTournament();
              }
            }}
            className="px-3 py-1.5 rounded-sm text-xs font-mono font-bold bg-[#141F28] hover:bg-[#1C2C39] text-[#38BDF8] border border-[#38BDF8]/40 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            title="Ejecutar torneo de modelos y búsqueda automática de hiperparámetros"
          >
            <Flame className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>AUTO-ML (1-CLICK)</span>
          </button>

          {/* Python Code Export */}
          <button
            onClick={() => setShowPythonCodeModal(true)}
            className="px-3 py-1.5 rounded-sm text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-white border border-[#3A3A3F] flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            title="Ver y exportar script Python / Scikit-Learn de producción"
          >
            <Code2 className="w-3.5 h-3.5 text-[#00FFC2]" />
            <span>EXPORTAR CÓDIGO</span>
          </button>

          {/* JSON Weights */}
          {session?.status === 'completed' && (
            <button
              onClick={handleDownloadWeightsJSON}
              className="px-3 py-1.5 rounded-sm text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#3A3A3F] flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Descargar matriz de pesos entrenados y metadatos en JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PESOS JSON</span>
            </button>
          )}

          {/* Train Button */}
          <button
            onClick={() => handleStartTraining()}
            disabled={isTraining}
            className="px-4 py-2 rounded-sm text-xs font-mono font-bold bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 transition-all uppercase tracking-tight"
          >
            {isTraining ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0B]" />
                <span>ENTRENANDO ({session?.progressPct || 0}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR ENTRENAMIENTO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {trainingSuccessMsg && (
        <div className="p-3.5 rounded-sm bg-[#0D221D] border border-[#184E42] text-[#00FFC2] text-xs flex items-center gap-2.5 font-mono shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00FFC2]" />
          <span>{trainingSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Settings (Left) vs Training Monitor (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: HYPERPARAMETERS & CONFIG (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E] mb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-[#00FFC2]" />
                <h4 className="text-xs font-bold text-white font-mono uppercase">
                  1. Configuración del Algoritmo & Hiperparámetros
                </h4>
              </div>
              <button
                onClick={handleResetConfig}
                disabled={isTraining}
                className="text-[11px] font-mono text-[#8E9299] hover:text-[#00FFC2] flex items-center gap-1 cursor-pointer"
                title="Restaurar parámetros por defecto"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-[#E0E0E0] mb-1">
                  ALGORITMO DE APRENDIZAJE:
                </label>
                <select
                  value={config.algorithm}
                  onChange={(e) => setConfig({ ...config, algorithm: e.target.value as TrainingAlgorithmId })}
                  disabled={isTraining}
                  className="w-full px-2.5 py-1.5 rounded-sm text-xs font-mono bg-[#1A1A1D] text-white border border-[#3A3A3F] focus:border-[#00FFC2] outline-none cursor-pointer"
                >
                  <option value="xgboost">XGBoost Spatiotemporal Gradient Booster (Árboles + Shrinkage)</option>
                  <option value="random_forest">Spatial Random Forest (Bagging de Árboles Paralelos)</option>
                  <option value="neural_network">Deep Neural Network MLP (Backpropagation + ReLU + L2)</option>
                  <option value="elasticnet">Regularized Spatial ElasticNet (L1 Lasso + L2 Ridge)</option>
                  <option value="sar_spatial">Spatial Lag Model SAR (Autoregresión Espacial Matriz W)</option>
                </select>
                <p className="text-[10px] text-[#8E9299] mt-1 font-mono">
                  {config.algorithm === 'xgboost' && 'Optimiza gradientes secuenciales minimizando el error residual de privaciones.'}
                  {config.algorithm === 'random_forest' && 'Promedia múltiples árboles de decisión aleatorios para reducir la varianza.'}
                  {config.algorithm === 'neural_network' && 'Red profunda de 2 capas densas (32 y 16 nodos) con activaciones no lineales.'}
                  {config.algorithm === 'elasticnet' && 'Modelo lineal penalizado que selecciona variables clave y previene sobreajuste.'}
                  {config.algorithm === 'sar_spatial' && 'Captura la derrama espacial (spatial spillover) entre barrios colindantes.'}
                </p>
              </div>

              {/* Optimizer Selector & Spatial Penalty */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F23]">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#8E9299] mb-1">
                    OPTIMIZADOR:
                  </label>
                  <select
                    value={config.optimizer}
                    onChange={(e) => setConfig({ ...config, optimizer: e.target.value as OptimizerAlgorithmType })}
                    disabled={isTraining}
                    className="w-full px-2 py-1 rounded-sm text-[11px] font-mono bg-[#1A1A1D] text-[#00FFC2] border border-[#3A3A3F] focus:border-[#00FFC2] outline-none cursor-pointer"
                  >
                    <option value="adam">Adam (Moments + Adaptive)</option>
                    <option value="sgd_momentum">SGD con Momentum (0.85)</option>
                    <option value="rmsprop">RMSProp (Moving Avg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-[#8E9299] mb-1">
                    PENALIZACIÓN ESPACIAL W:
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, enableSpatialPenalty: !config.enableSpatialPenalty })}
                    disabled={isTraining}
                    className={`w-full px-2 py-1 rounded-sm text-[11px] font-mono font-bold border transition-all text-center ${
                      config.enableSpatialPenalty
                        ? 'bg-[#0D221D] text-[#00FFC2] border-[#184E42]'
                        : 'bg-[#1A1A1D] text-[#8E9299] border-[#333]'
                    }`}
                  >
                    {config.enableSpatialPenalty ? '✓ W ACTIVA (Spatial Lag)' : '✕ DESACTIVADA'}
                  </button>
                </div>
              </div>

              {/* Epochs Slider */}
              <div className="pt-2 border-t border-[#1F1F23]">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8E9299]">Épocas / Estimadores:</span>
                  <span className="text-[#00FFC2] font-bold">{config.epochs} iteraciones</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={200}
                  step={5}
                  value={config.epochs}
                  onChange={(e) => setConfig({ ...config, epochs: Number(e.target.value) })}
                  disabled={isTraining}
                  className="w-full accent-[#00FFC2] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8E9299]">
                  <span>15 (Rápido)</span>
                  <span>100 (Estándar)</span>
                  <span>200 (Convergencia fina)</span>
                </div>
              </div>

              {/* Learning Rate Slider */}
              <div className="pt-2 border-t border-[#1F1F23]">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8E9299]">Tasa de Aprendizaje (&eta;):</span>
                  <span className="text-[#00FFC2] font-bold">{config.learningRate}</span>
                </div>
                <input
                  type="range"
                  min={0.01}
                  max={0.25}
                  step={0.01}
                  value={config.learningRate}
                  onChange={(e) => setConfig({ ...config, learningRate: Number(e.target.value) })}
                  disabled={isTraining}
                  className="w-full accent-[#00FFC2] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#8E9299]">
                  <span>0.01 (Paso fino)</span>
                  <span>0.05 (Óptimo)</span>
                  <span>0.25 (Agresivo)</span>
                </div>
              </div>

              {/* Max Depth Slider */}
              <div className="pt-2 border-t border-[#1F1F23]">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8E9299]">Profundidad Máxima / Capas:</span>
                  <span className="text-[#00FFC2] font-bold">Nivel {config.maxDepth}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={config.maxDepth}
                  onChange={(e) => setConfig({ ...config, maxDepth: Number(e.target.value) })}
                  disabled={isTraining}
                  className="w-full accent-[#00FFC2] cursor-pointer"
                />
              </div>

              {/* Regularization Slider */}
              <div className="pt-2 border-t border-[#1F1F23]">
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-[#8E9299]">Regularización L2 (&lambda;):</span>
                  <span className="text-[#00FFC2] font-bold">{config.l2Regularization}</span>
                </div>
                <input
                  type="range"
                  min={0.05}
                  max={3.0}
                  step={0.05}
                  value={config.l2Regularization}
                  onChange={(e) => setConfig({ ...config, l2Regularization: Number(e.target.value) })}
                  disabled={isTraining}
                  className="w-full accent-[#00FFC2] cursor-pointer"
                />
              </div>

              {/* Train / Test Split & K-Folds */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1F1F23]">
                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-[#8E9299]">Split:</span>
                    <span className="text-[#00FFC2] font-bold">{config.trainTestSplitPct}% / {100 - config.trainTestSplitPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={60}
                    max={90}
                    step={5}
                    value={config.trainTestSplitPct}
                    onChange={(e) => setConfig({ ...config, trainTestSplitPct: Number(e.target.value) })}
                    disabled={isTraining}
                    className="w-full accent-[#00FFC2] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-mono mb-1">
                    <span className="text-[#8E9299]">K-Folds:</span>
                    <span className="text-[#00FFC2] font-bold">{config.kFolds} Pliegues</span>
                  </div>
                  <select
                    value={config.kFolds}
                    onChange={(e) => setConfig({ ...config, kFolds: Number(e.target.value) })}
                    disabled={isTraining}
                    className="w-full px-2 py-0.5 rounded-sm text-[11px] font-mono bg-[#1A1A1D] text-white border border-[#3A3A3F]"
                  >
                    <option value={3}>3 Folds (Rápido)</option>
                    <option value={5}>5 Folds (Estándar)</option>
                    <option value={10}>10 Folds (Exhaustivo)</option>
                  </select>
                </div>
              </div>

              {/* Feature Checkboxes */}
              <div className="pt-2 border-t border-[#1F1F23]">
                <label className="block text-[11px] font-mono font-bold text-[#E0E0E0] mb-1.5">
                  VARIABLES GEOESPACIALES ACTIVAS ({config.selectedFeatures.length}/7):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TRAINING_FEATURES.map(f => {
                    const isSelected = config.selectedFeatures.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => handleToggleFeature(f.key)}
                        disabled={isTraining}
                        className={`text-left px-2 py-1.5 rounded text-[10px] font-mono border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0D221D] border-[#184E42] text-[#00FFC2]'
                            : 'bg-[#141416] border-[#2A2A2E] text-[#666] hover:text-[#8E9299]'
                        }`}
                      >
                        <span className="truncate">{f.label.split('(')[0]}</span>
                        <span className="text-[9px] font-bold ml-1">{isSelected ? '✓' : '—'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: TRAINING EXECUTION, LIVE CONVERGENCE & TERMINAL (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] space-y-4">
            
            {/* Monitor Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-[#00FFC2]" />
                <h4 className="text-xs font-bold text-white font-mono uppercase">
                  2. Monitor de Entrenamiento en Tiempo Real & Curvas de Pérdida
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  session?.status === 'training' 
                    ? 'bg-[#2A1E08] text-[#FFAA00] border border-[#FFAA00]/40 animate-pulse'
                    : session?.status === 'completed'
                    ? 'bg-[#0D221D] text-[#00FFC2] border border-[#184E42]'
                    : 'bg-[#1A1A1D] text-[#8E9299] border border-[#2A2A2E]'
                }`}>
                  ESTADO: {(session?.status || 'idle').toUpperCase()}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#8E9299]">Progreso de Optimización:</span>
                <span className="text-[#00FFC2] font-bold">
                  {session?.progressPct || 0}% ({session?.currentEpoch || 0}/{session?.totalEpochs || config.epochs} épocas)
                </span>
              </div>
              <div className="w-full h-2 bg-[#1A1A1D] rounded-full overflow-hidden border border-[#2A2A2E]">
                <div 
                  className="h-full bg-[#00FFC2] transition-all duration-150"
                  style={{ width: `${session?.progressPct || 0}%` }}
                />
              </div>
            </div>

            {/* Real-time Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2 rounded bg-[#141416] border border-[#2A2A2E]">
                <span className="text-[10px] font-mono text-[#8E9299] block">Train Loss (MSE):</span>
                <span className="text-sm font-mono font-bold text-[#38BDF8]">
                  {session?.epochHistory[session.epochHistory.length - 1]?.trainLoss ?? '0.0450'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#141416] border border-[#2A2A2E]">
                <span className="text-[10px] font-mono text-[#8E9299] block">Val Loss (MSE):</span>
                <span className="text-sm font-mono font-bold text-[#FFAA00]">
                  {session?.epochHistory[session.epochHistory.length - 1]?.valLoss ?? '0.0520'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#141416] border border-[#2A2A2E]">
                <span className="text-[10px] font-mono text-[#8E9299] block">R² Validación:</span>
                <span className="text-sm font-mono font-bold text-[#00FFC2]">
                  {session?.finalMetrics?.r2 ?? session?.epochHistory[session.epochHistory.length - 1]?.valR2 ?? '0.9420'}
                </span>
              </div>
              <div className="p-2 rounded bg-[#141416] border border-[#2A2A2E]">
                <span className="text-[10px] font-mono text-[#8E9299] block">Norma Gradiente:</span>
                <span className="text-sm font-mono font-bold text-[#E0E0E0]">
                  {session?.epochHistory[session.epochHistory.length - 1]?.gradientNorm ?? '0.0142'}
                </span>
              </div>
            </div>

            {/* Spatial K-Fold Badges */}
            {session?.foldResults && session.foldResults.length > 0 && (
              <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8E9299] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Validación Cruzada Espacial ({session.foldResults.length} Folds):
                  </span>
                  <span className="text-[#00FFC2] font-bold">
                    R² Promedio: {(session.foldResults.reduce((acc, f) => acc + f.valR2, 0) / session.foldResults.length).toFixed(4)}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {session.foldResults.map(f => (
                    <div key={f.foldIndex} className="p-1.5 rounded bg-[#0A0A0B] border border-[#222] text-center">
                      <span className="text-[9px] font-mono text-[#8E9299] block">Fold {f.foldIndex}</span>
                      <span className="text-xs font-mono font-bold text-[#00FFC2] block">R² {f.valR2.toFixed(3)}</span>
                      <span className="text-[8px] font-mono text-[#666] block">RMSE {f.valRMSE.toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Convergence Graph */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E9299] flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#00FFC2]" />
                  Curva de Convergencia Iterativa (Pérdida MSE)
                </span>
                {session?.epochHistory && session.epochHistory.length > 0 && (
                  <button
                    onClick={handleDownloadConvergenceCSV}
                    className="text-[10px] text-[#00FFC2] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV Curvas</span>
                  </button>
                )}
              </div>
              <div className="h-44 w-full bg-[#0A0A0B] rounded border border-[#2A2A2E] p-2">
                {session?.epochHistory && session.epochHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={session.epochHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="epoch" stroke="#666" tick={{ fontSize: 9, fill: '#888' }} />
                      <YAxis stroke="#666" tick={{ fontSize: 9, fill: '#888' }} domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '10px' }}
                        formatter={(value: any) => [Number(value).toFixed(5), '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="trainLoss" 
                        name="Train Loss (MSE)" 
                        stroke="#38BDF8" 
                        strokeWidth={1.8} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valLoss" 
                        name="Val Loss (MSE)" 
                        stroke="#FFAA00" 
                        strokeWidth={1.8} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-mono text-[#8E9299]">
                    Haga clic en "Iniciar Entrenamiento" para trazar la curva de convergencia en tiempo real.
                  </div>
                )}
              </div>
            </div>

            {/* Live Terminal Console */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8E9299] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#00FFC2]" />
                  Terminal de Ejecución & Registros del Optimizador
                </span>
                <span className="text-[10px] text-[#666]">STDOUT // LOGS</span>
              </div>
              <div className="h-32 w-full bg-[#0A0A0B] rounded border border-[#2A2A2E] p-2.5 font-mono text-[10px] text-[#00FFC2] overflow-y-auto space-y-1 leading-relaxed">
                {session?.terminalLogs && session.terminalLogs.length > 0 ? (
                  session.terminalLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-[#666]">
                    [SISTEMA LISTO] Configure parámetros o ejecute AutoML para iniciar el ciclo de cómputo.
                  </div>
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SECTION 3: INTERACTIVE INFERENCE SANDBOX & REAL BARRIO COMPARATOR */}
      <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#2A2A2E] gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#00FFC2]" />
              <h4 className="text-xs font-bold text-white font-mono uppercase">
                3. Inferencia Predictiva en Tiempo Real // Calibración Territorial
              </h4>
            </div>
            <p className="text-xs text-[#8E9299] mt-0.5">
              Cargue un barrio real del Gemelo Digital o ajuste manualmente las variables para contrastar la predicción del modelo ({mlResult.championModel.name}) contra el censo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Real Barrio Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#141416] px-2 py-1 rounded border border-[#333]">
              <Building2 className="w-3.5 h-3.5 text-[#00FFC2]" />
              <select
                value={selectedBarrioId}
                onChange={(e) => handleSelectBarrio(e.target.value)}
                className="bg-transparent text-white text-xs font-mono outline-none cursor-pointer max-w-[180px]"
              >
                <option value="" className="bg-[#111]">-- Cargar Barrio Real --</option>
                {neighborhoods.map(b => (
                  <option key={b.id} value={b.id} className="bg-[#111]">
                    {b.nombre} (M₀={b.ipm_M0.toFixed(3)})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => runInferenceWithTrainedWeights()}
              disabled={isInferring}
              className="px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#00FFC2]/50 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {isInferring ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>EJECUTAR INFERENCIA</span>
            </button>
          </div>
        </div>

        {/* Input Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          
          {/* VIIRS */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Luminosidad VIIRS:</span>
              <span className="text-[#00FFC2] font-bold">{inferenceInput.luminosidadNocturnaVIIRS} nW</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={40}
              step={0.5}
              value={inferenceInput.luminosidadNocturnaVIIRS}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, luminosidadNocturnaVIIRS: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#00FFC2] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Alta luz nocturna reduce vulnerabilidad</span>
          </div>

          {/* GHSL Informal */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Huella Precaria GHSL:</span>
              <span className="text-[#FF4D4D] font-bold">{(inferenceInput.coberturaGHSLInformal * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.02}
              value={inferenceInput.coberturaGHSLInformal}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, coberturaGHSLInformal: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#FF4D4D] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Asentamientos precarios elevan privaciones</span>
          </div>

          {/* Infraestructura Agua/Desague */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Índice Infraestructura:</span>
              <span className="text-[#38BDF8] font-bold">{inferenceInput.indiceInfraestructura.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.02}
              value={inferenceInput.indiceInfraestructura}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, indiceInfraestructura: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#38BDF8] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Agua potable y saneamiento básico</span>
          </div>

          {/* Distancia Hospital */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Acceso a Hospital:</span>
              <span className="text-[#FFAA00] font-bold">{inferenceInput.distanciaHospitalMin} min</span>
            </div>
            <input
              type="range"
              min={5}
              max={90}
              step={1}
              value={inferenceInput.distanciaHospitalMin}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, distanciaHospitalMin: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#FFAA00] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Tiempo de viaje a salud de 2do nivel</span>
          </div>

          {/* Distancia Escuela */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Acceso a Secundaria:</span>
              <span className="text-[#FFAA00] font-bold">{inferenceInput.distanciaEscuelaMin} min</span>
            </div>
            <input
              type="range"
              min={2}
              max={60}
              step={1}
              value={inferenceInput.distanciaEscuelaMin}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, distanciaEscuelaMin: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#FFAA00] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Proximidad a educación básica regular</span>
          </div>

          {/* Vegetación NDVI */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Índice Vegetación NDVI:</span>
              <span className="text-[#00FFC2] font-bold">{inferenceInput.indiceVegetacionNDVI.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-0.1}
              max={0.7}
              step={0.02}
              value={inferenceInput.indiceVegetacionNDVI}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, indiceVegetacionNDVI: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#00FFC2] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Áreas verdes urbanas y bioclima</span>
          </div>

          {/* Trampa de Pobreza */}
          <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1.5 sm:col-span-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#8E9299] truncate">Coeficiente Trampa de Pobreza:</span>
              <span className="text-[#FF4D4D] font-bold">{inferenceInput.coeficienteTrampaPobreza.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.0}
              step={0.02}
              value={inferenceInput.coeficienteTrampaPobreza}
              onChange={(e) => {
                setInferenceInput({ ...inferenceInput, coeficienteTrampaPobreza: Number(e.target.value) });
                runInferenceWithTrainedWeights();
              }}
              className="w-full accent-[#FF4D4D] cursor-pointer"
            />
            <span className="text-[10px] text-[#666] font-mono block">Inercia intergeneracional de privaciones territoriales</span>
          </div>

        </div>

        {/* Prediction Results Box & Real Comparison */}
        {inferenceResult && (
          <div className="p-4 rounded bg-[#0A0A0B] border border-[#2A2A2E] mt-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Outcome Badges (5 cols) */}
              <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-[#2A2A2E] pb-3 md:pb-0 md:pr-4">
                <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider block">
                  RESULTADO DE INFERENCIA // M₀ ALKIRE-FOSTER
                </span>
                
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-mono font-bold text-[#00FFC2]">
                    {inferenceResult.predicted_M0.toFixed(4)}
                  </span>
                  <span className="text-xs font-mono text-[#8E9299]">
                    M₀ = H × A
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                    inferenceResult.predicted_M0 >= 0.40 
                      ? 'bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40'
                      : inferenceResult.predicted_M0 >= 0.25
                      ? 'bg-[#261805] text-[#FFAA00] border border-[#FFAA00]/40'
                      : inferenceResult.predicted_M0 >= 0.12
                      ? 'bg-[#0D221D] text-[#00FFC2] border border-[#184E42]'
                      : 'bg-[#101E2E] text-[#38BDF8] border border-[#38BDF8]/40'
                  }`}>
                    {inferenceResult.povertyCategory}
                  </span>
                  <span className="text-[10px] font-mono text-[#8E9299]">
                    IC 95%: [{inferenceResult.confidenceInterval95[0]} - {inferenceResult.confidenceInterval95[1]}]
                  </span>
                </div>

                {/* Real Observed Comparison Badge */}
                {inferenceResult.observedActual_M0 !== undefined && (
                  <div className="p-2 rounded bg-[#141416] border border-[#184E42] space-y-1 mt-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#8E9299]">Observado ({inferenceResult.selectedBarrioName}):</span>
                      <span className="text-white font-bold">{inferenceResult.observedActual_M0.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#8E9299]">Residuo (&epsilon; = y - ŷ):</span>
                      <span className="text-[#00FFC2] font-bold">
                        {inferenceResult.residualDelta && inferenceResult.residualDelta > 0 ? `+${inferenceResult.residualDelta}` : inferenceResult.residualDelta}
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-[#00FFC2]">
                      ✓ Precisión empírica local: {(100 - Math.abs(inferenceResult.residualDelta || 0) * 100).toFixed(1)}%
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-[#8E9299] font-mono pt-1">
                  Inferencia calculada en {inferenceResult.inferenceLatencyMs} ms con {inferenceResult.modelUsed}.
                </p>
              </div>

              {/* Individual Feature Contributions (SHAP) for this sample (7 cols) */}
              <div className="md:col-span-7 space-y-1.5">
                <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider block">
                  DESCOMPOSICIÓN DE IMPACTO SHAP (&phi;) POR VARIABLE:
                </span>
                <div className="space-y-1">
                  {inferenceResult.featureContributions.slice(0, 5).map(fc => (
                    <div key={fc.featureKey} className="flex items-center justify-between text-[11px] font-mono bg-[#141416] px-2.5 py-1 rounded border border-[#222]">
                      <span className="text-white truncate max-w-[200px]">
                        {fc.featureLabel.split('(')[0]}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#8E9299]">Val: {fc.inputValue}</span>
                        <span className={`font-bold ${fc.shapValue > 0 ? 'text-[#FF4D4D]' : 'text-[#00FFC2]'}`}>
                          {fc.shapValue > 0 ? `+${fc.shapValue.toFixed(4)}` : fc.shapValue.toFixed(4)}
                        </span>
                        <span className="text-[9px] text-[#666]">
                          ({fc.impactType === 'incrementa_pobreza' ? '+Pobreza' : '-Pobreza'})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* SECTION 4: SIMULADOR DE POLÍTICAS PÚBLICAS & RETORNO SOCIAL (SROI) */}
      <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#2A2A2E] gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#00FFC2]" />
              <h4 className="text-xs font-bold text-white font-mono uppercase">
                4. Simulador Contrafactual de Intervenciones Urbanas & Retorno Social (SROI)
              </h4>
            </div>
            <p className="text-xs text-[#8E9299] mt-0.5">
              Simule el impacto directo de programas de inversión pública en infraestructura sobre la reducción multidimensional de la pobreza según el modelo entrenado.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedInterventionPlan.id}
              onChange={(e) => {
                const plan = URBAN_INTERVENTION_CATALOG.find(p => p.id === e.target.value);
                if (plan) setSelectedInterventionPlan(plan);
              }}
              className="px-2.5 py-1.5 rounded-sm text-xs font-mono bg-[#1A1A1D] text-white border border-[#3A3A3F] outline-none cursor-pointer"
            >
              {URBAN_INTERVENTION_CATALOG.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Simulation Output Cards */}
        {interventionSimulation && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
              <span className="text-[10px] font-mono text-[#8E9299] block">Reducción IPM Estimada:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-bold text-[#00FFC2]">
                  -{interventionSimulation.pctReduction}%
                </span>
                <span className="text-[10px] font-mono text-[#8E9299]">
                  (&Delta; M₀: {interventionSimulation.deltaM0})
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#666] block">
                De {interventionSimulation.preIntervention.predicted_M0} &rarr; {interventionSimulation.postIntervention.predicted_M0}
              </span>
            </div>

            <div className="p-3 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
              <span className="text-[10px] font-mono text-[#8E9299] block">Familias Beneficiadas:</span>
              <span className="text-xl font-mono font-bold text-white">
                ~{interventionSimulation.liftedFamilies.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono text-[#00FFC2] block">
                Salen de vulnerabilidad crítica
              </span>
            </div>

            <div className="p-3 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
              <span className="text-[10px] font-mono text-[#8E9299] block">Retorno Social (SROI):</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-bold text-[#38BDF8]">
                  {interventionSimulation.socialROI}x
                </span>
                <span className="text-[10px] font-mono text-[#8E9299]">
                  Soles/Sol invertido
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#666] block">
                Costo: S/ {selectedInterventionPlan.budgetMillionsSoles}M ({selectedInterventionPlan.durationMonths} meses)
              </span>
            </div>

            <div className="p-3 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
              <span className="text-[10px] font-mono text-[#8E9299] block">Focalización Recomendada:</span>
              <span className="text-xs font-mono font-bold text-[#FFAA00] block truncate">
                {selectedBarrioId ? neighborhoods.find(n => n.id === selectedBarrioId)?.nombre : 'Periferia Periurbana'}
              </span>
              <span className="text-[9px] font-mono text-[#8E9299] block">
                Prioridad alta en el Plan de Desarrollo Urbano
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AUTO-ML TOURNAMENT MODAL */}
      {showAutoMLModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#2A2A2E] rounded-sm max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-sm font-bold font-mono text-white">
                  TORNEO AUTO-ML // Búsqueda de Arquitecturas & Hiperparámetros
                </h3>
              </div>
              <button
                onClick={() => setShowAutoMLModal(false)}
                className="text-[#8E9299] hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8E9299] font-mono">
              AutoML evalúa de forma autónoma múltiples algoritmos y optimizadores numéricos sobre las {neighborhoods.length} celdas urbanas para determinar la configuración con el mayor coeficiente de determinación ($R^2$) y menor error ($RMSE$).
            </p>

            {isAutoMLRunning && (
              <div className="p-3 rounded bg-[#141F28] border border-[#38BDF8]/40 space-y-2">
                <div className="flex justify-between text-xs font-mono text-[#38BDF8]">
                  <span>Evaluando candidato {autoMLProgress?.current} de {autoMLProgress?.total}...</span>
                  <span>{Math.round(((autoMLProgress?.current || 0) / (autoMLProgress?.total || 1)) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#38BDF8] transition-all"
                    style={{ width: `${Math.round(((autoMLProgress?.current || 0) / (autoMLProgress?.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Trials Leaderboard Table */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-[#8E9299] uppercase tracking-wider block">
                TABLA DE POSICIONES // CANDIDATOS AUTO-ML:
              </span>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {autoMLTrials.map(trial => (
                  <div
                    key={trial.trialId}
                    className={`p-2.5 rounded border font-mono text-xs flex items-center justify-between transition-all ${
                      trial.isChampion
                        ? 'bg-[#0D221D] border-[#184E42] text-[#00FFC2]'
                        : 'bg-[#141416] border-[#2A2A2E] text-[#E0E0E0]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        trial.rank === 1 ? 'bg-[#00FFC2] text-black' : 'bg-[#2A2A2E] text-white'
                      }`}>
                        {trial.rank}
                      </span>
                      <div>
                        <span className="font-bold block">
                          {trial.algorithm.toUpperCase()} + {trial.optimizer.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-[#8E9299]">
                          Épocas: {trial.epochs} | LR: {trial.learningRate} | Depth: {trial.maxDepth} | L2: {trial.l2Reg}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-bold text-[#00FFC2] block">R² {trial.valR2}</span>
                        <span className="text-[9px] text-[#8E9299]">RMSE {trial.valRMSE}</span>
                      </div>
                      <button
                        onClick={() => handleApplyAutoMLAndTrain(trial)}
                        disabled={isTraining}
                        className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#00FFC2]/40 cursor-pointer"
                      >
                        APLICAR
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2E]">
              <button
                onClick={handleRunAutoMLTournament}
                disabled={isAutoMLRunning}
                className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-white border border-[#333] flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAutoMLRunning ? 'animate-spin' : ''}`} />
                <span>RE-EJECUTAR TORNEO</span>
              </button>

              <button
                onClick={() => setShowAutoMLModal(false)}
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#00FFC2] text-[#0A0A0B] cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PYTHON PRODUCTION CODE MODAL */}
      {showPythonCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#2A2A2E] rounded-sm max-w-3xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E]">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#00FFC2]" />
                <h3 className="text-sm font-bold font-mono text-white">
                  PIPELINE PYTHON DE PRODUCCIÓN // Scikit-Learn, XGBoost & GeoPandas
                </h3>
              </div>
              <button
                onClick={() => setShowPythonCodeModal(false)}
                className="text-[#8E9299] hover:text-white font-mono text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8E9299] font-mono">
              Script Python completo y autocontenido listo para desplegar en Google Cloud Run, Jupyter Notebooks o endpoints de inferencia municipal.
            </p>

            <div className="relative">
              <pre className="h-72 w-full bg-[#0A0A0B] rounded border border-[#2A2A2E] p-3 font-mono text-[11px] text-[#00FFC2] overflow-y-auto leading-relaxed">
                {pythonScript}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#2A2A2E]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPythonCode}
                  className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-white border border-[#333] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-[#00FFC2]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '¡COPIADO!' : 'COPIAR AL PORTAPAPELES'}</span>
                </button>

                <button
                  onClick={handleDownloadPythonScript}
                  className="px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#00FFC2]/40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DESCARGAR .PY</span>
                </button>
              </div>

              <button
                onClick={() => setShowPythonCodeModal(false)}
                className="px-4 py-1.5 rounded text-xs font-mono font-bold bg-[#00FFC2] text-[#0A0A0B] cursor-pointer"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
