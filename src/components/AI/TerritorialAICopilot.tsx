import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot, Send, Database, Sparkles, ShieldCheck, Workflow, Braces,
  MapPin, AlertTriangle, CheckCircle2, Loader2, RotateCcw, ExternalLink
} from 'lucide-react';
import type { AlkireFosterResult, NeighborhoodCell, PolicyScenario, ShockScenario, SimulationRunResult, UserRole } from '../../types';
import type { AIChatMessage, AIScenarioDraft, TerritorialAIContext } from '../../types/aiTypes';
import { TerritorialAIService } from '../../services/territorialAIService';
import { PERU_DEPARTMENTS_DATA } from '../../data/peruNationalData';
import type { MLFullEngineResult } from '../../types/mlTypes';
import { LiveModelTrainer } from '../../services/liveModelTrainer';
import type { RealDataset, RealModelResult } from '../../types/realData';

interface Props {
  role: UserRole;
  departmentId: string;
  territoryName: string;
  year: number;
  afResult: AlkireFosterResult;
  neighborhoods: NeighborhoodCell[];
  selectedNeighborhood: NeighborhoodCell | null;
  shocks: ShockScenario[];
  policies: PolicyScenario[];
  lastSimulation: SimulationRunResult | null;
  mlResult: MLFullEngineResult;
  onSelectNeighborhood: (neighborhood: NeighborhoodCell) => void;
  onApplyScenarioDraft: (draft: AIScenarioDraft) => void;
  onNavigateScenarios: () => void;
  onSelectDepartment: (departmentId: string) => void;
  realDataset: RealDataset | null;
  realModel: RealModelResult | null;
}

const normalizeTerritoryText = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const resolveRequestedDepartment = (message: string) => {
  const normalizedMessage = ` ${normalizeTerritoryText(message)} `;
  const candidates = PERU_DEPARTMENTS_DATA.flatMap(department => {
    const shortName = department.nombre.split(/\s[-–]\s|\s*\(/)[0];
    const aliases = [department.id, department.nombre, shortName, ...department.ciudadesPrincipales]
      .map(normalizeTerritoryText)
      .filter(alias => alias.length >= 3);
    return [...new Set(aliases)].map(alias => ({ department, alias }));
  }).sort((a, b) => b.alias.length - a.alias.length);
  return candidates.find(candidate => normalizedMessage.includes(` ${candidate.alias} `))?.department ?? null;
};

const starters = [
  '¿Cuáles son los tres barrios más vulnerables y qué factores explican su situación?',
  'Explícame el IPM actual como si fuera un informe para una autoridad municipal.',
  'Diseña un escenario para reducir la carencia de agua con un presupuesto de USD 4 millones.',
  '¿Qué debería priorizarse en los próximos seis meses y por qué?'
];

export const TerritorialAICopilot: React.FC<Props> = ({
  role, departmentId, territoryName, year, afResult, neighborhoods, selectedNeighborhood,
  shocks, policies, lastSimulation, mlResult, onSelectNeighborhood, onApplyScenarioDraft, onNavigateScenarios, onSelectDepartment, realDataset, realModel
}) => {
  const safeNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const [messages, setMessages] = useState<AIChatMessage[]>([{
    id: 'welcome', role: 'assistant', timestamp: new Date().toISOString(), provider: 'local',
    content: `Copiloto territorial listo para analizar ${territoryName}. Consulto las métricas del gemelo digital y nunca sustituyo sus cálculos con estimaciones del modelo.`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<'auto' | 'langchain' | 'langflow' | 'local'>('auto');
  const [appliedDraftId, setAppliedDraftId] = useState<string | null>(null);
  const [showFlow, setShowFlow] = useState(true);
  const [pendingTerritorialQuery, setPendingTerritorialQuery] = useState<{ text: string; targetId: string } | null>(null);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  const mlPredictions = useMemo(() => {
    const trained = mlResult.activeTrainedSession;
    const selectedFeatures = trained?.config.selectedFeatures || ['viirs', 'ghsl', 'ndvi', 'distHospital', 'distEscuela', 'infra', 'trampa'];
    const stats = LiveModelTrainer.computeFeatureStats(neighborhoods, selectedFeatures);
    const weights = trained?.weights?.featureWeights || Object.fromEntries(
      mlResult.shapAttributions.map(item => [item.featureKey, item.directionEffect.startsWith('Aumenta') ? item.meanAbsoluteSHAP : -item.meanAbsoluteSHAP])
    );
    const bias = trained?.weights?.bias ?? afResult.M0;
    const rmse = trained?.finalMetrics?.rmse ?? mlResult.championModel.testMetrics.rmse;
    return neighborhoods.map(neighborhood => {
      const prediction = LiveModelTrainer.runInference({
        luminosidadNocturnaVIIRS: safeNumber(neighborhood.luminosidadNocturnaVIIRS),
        coberturaGHSLInformal: safeNumber(neighborhood.coberturaGHSLInformal),
        indiceVegetacionNDVI: safeNumber(neighborhood.indiceVegetacionNDVI),
        distanciaHospitalMin: safeNumber(neighborhood.distanciaHospitalMin),
        distanciaEscuelaMin: safeNumber(neighborhood.distanciaEscuelaMin),
        indiceInfraestructura: safeNumber(neighborhood.indiceInfraestructura) / 100,
        coeficienteTrampaPobreza: safeNumber(neighborhood.coeficienteTrampaPobreza)
      }, weights, bias, stats, trained ? `${trained.config.algorithm.toUpperCase()} · sesión entrenada` : mlResult.championModel.name, rmse, neighborhood.nombre, neighborhood.ipm_M0);
      return {
        neighborhoodId: neighborhood.id, neighborhoodName: neighborhood.nombre,
        observedM0: safeNumber(neighborhood.ipm_M0), predictedM0: prediction.predicted_M0,
        confidenceLow: prediction.confidenceInterval95[0], confidenceHigh: prediction.confidenceInterval95[1],
        category: prediction.povertyCategory,
        topDrivers: prediction.featureContributions.slice(0, 3).map(driver => `${driver.featureLabel}: ${driver.shapValue >= 0 ? '+' : ''}${driver.shapValue}`)
      };
    });
  }, [mlResult, neighborhoods, afResult.M0]);

  const officialHistory = useMemo(() => realDataset?.records.filter(r => r.department_id === departmentId).sort((a,b)=>a.year-b.year) || [], [realDataset, departmentId]);
  const officialLatest = officialHistory.at(-1);
  const officialPrediction = realModel?.predictions
    .filter(r => r.department_id === departmentId)
    .sort((a, b) => a.year - b.year)
    .at(-1);
  const context = useMemo<TerritorialAIContext>(() => ({
    officialData: officialHistory.length && realModel ? { indicator:'NBI', source:realDataset!.metadata.source, year:officialLatest!.year,
      observedPercent:officialLatest!.nbi_percent, previousPercent:officialHistory.at(-2)!.nbi_percent,
      modelR2:realModel.r2, modelRmse:realModel.rmse, predictedPercent:officialPrediction?.predicted ?? null,
      trainRows:realModel.trainRows, testRows:realModel.testRows } : undefined,
    role,
    departmentId,
    territoryName,
    year,
    selectedNeighborhood: selectedNeighborhood ? {
      id: selectedNeighborhood.id, name: selectedNeighborhood.nombre, district: selectedNeighborhood.distrito,
      ipmM0: safeNumber(selectedNeighborhood.ipm_M0), ipmH: safeNumber(selectedNeighborhood.ipm_H), ipmA: safeNumber(selectedNeighborhood.ipm_A),
      population: safeNumber(selectedNeighborhood.poblacionTotal)
    } : null,
    cityMetrics: {
      M0: safeNumber(afResult.M0), H: safeNumber(afResult.H), A: safeNumber(afResult.A),
      poorHouseholds: safeNumber(afResult.poorHouseholdsCount), totalHouseholds: safeNumber(afResult.totalHouseholds),
      extremePovertyRate: safeNumber(afResult.extremePovertyRate), gini: safeNumber(afResult.giniCoefficient),
      dimensions: Object.fromEntries(Object.entries(afResult.dimensionalContributionsPct).map(([key, value]) => [key, safeNumber(value)]))
    },
    neighborhoods: neighborhoods.map(n => ({
      id: n.id, name: n.nombre, district: n.distrito, ipmM0: safeNumber(n.ipm_M0), ipmH: safeNumber(n.ipm_H),
      ipmA: safeNumber(n.ipm_A), population: safeNumber(n.poblacionTotal), alert: n.nivelAlerta || 'normal',
      waterDeprivation: safeNumber(n.contribucionDimensiones?.vivienda_servicios), informalCoverage: safeNumber(n.coberturaGHSLInformal),
      infrastructureIndex: safeNumber(n.indiceInfraestructura)
    })),
    activeShockNames: shocks.filter(s => s.activo).map(s => s.nombre),
    activePolicyNames: policies.filter(p => p.activo).map(p => p.nombre),
    lastSimulation: lastSimulation ? {
      deltaIpm: safeNumber(lastSimulation.resumenImpacto.delta_ipm),
      householdsExitedPoverty: safeNumber(lastSimulation.resumenImpacto.hogaresSalieronPobreza),
      householdsEnteredPoverty: safeNumber(lastSimulation.resumenImpacto.hogaresCayeronPobreza),
      costEffectiveness: safeNumber(lastSimulation.resumenImpacto.costoEfectividadUSDporHogar)
    } : null,
    mlEngine: {
      modelName: mlResult.activeTrainedSession ? mlResult.activeTrainedSession.config.algorithm.toUpperCase() : mlResult.championModel.name,
      source: mlResult.activeTrainedSession ? 'live_trained' : 'calibrated_champion',
      r2: safeNumber(mlResult.activeTrainedSession?.finalMetrics?.r2 ?? mlResult.championModel.testMetrics.r2),
      rmse: safeNumber(mlResult.activeTrainedSession?.finalMetrics?.rmse ?? mlResult.championModel.testMetrics.rmse),
      sessionId: mlResult.activeTrainedSession?.sessionId ?? null,
      predictions: mlPredictions
    }
  }), [role, departmentId, territoryName, year, afResult, neighborhoods, selectedNeighborhood, shocks, policies, lastSimulation, mlResult, mlPredictions, officialHistory, realDataset, realModel, officialLatest, officialPrediction]);

  const executeRequest = async (clean: string, appendUser: boolean) => {
    if (appendUser) {
      const userMessage: AIChatMessage = { id: crypto.randomUUID(), role: 'user', content: clean, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, userMessage]);
    }
    setLoading(true);
    try {
      const response = await TerritorialAIService.chat({ message: clean, sessionId, preferredProvider: provider, context });
      setMessages(prev => [...prev, {
        id: response.auditId, role: 'assistant', content: response.answer, timestamp: new Date().toISOString(),
        provider: response.provider, evidence: response.evidence, suggestedActions: response.suggestedActions,
        scenarioDraft: response.scenarioDraft, executionTrace: response.executionTrace
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', timestamp: new Date().toISOString(), provider: 'local',
        content: `No pude consultar el servicio del copiloto. ${error instanceof Error ? error.message : 'Error desconocido'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pendingTerritorialQuery || departmentId !== pendingTerritorialQuery.targetId) return;
    const query = pendingTerritorialQuery.text;
    setPendingTerritorialQuery(null);
    void executeRequest(query, false);
  }, [departmentId, context, pendingTerritorialQuery]);

  const submit = async (text = input) => {
    const clean = text.trim();
    if (!clean || loading) return;
    setInput('');
    const requestedDepartment = resolveRequestedDepartment(clean);
    if (requestedDepartment && requestedDepartment.id !== departmentId) {
      const userMessage: AIChatMessage = { id: crypto.randomUUID(), role: 'user', content: clean, timestamp: new Date().toISOString() };
      const navigationMessage: AIChatMessage = {
        id: crypto.randomUUID(), role: 'assistant', timestamp: new Date().toISOString(), provider: 'local',
        content: `Territorio detectado: ${requestedDepartment.nombre}. Estoy trasladando el gemelo digital y cargaré sus datos antes de ejecutar la instrucción completa.`
      };
      setMessages(prev => [...prev, userMessage, navigationMessage]);
      setLoading(true);
      setPendingTerritorialQuery({ text: clean, targetId: requestedDepartment.id });
      onSelectDepartment(requestedDepartment.id);
      return;
    }
    await executeRequest(clean, true);
  };

  const selectEvidenceNeighborhood = (source: string) => {
    const found = neighborhoods.find(n => source.includes(n.id));
    if (found) onSelectNeighborhood(found);
  };

  return (
    <div className="space-y-5">
      <section className="border border-[#2A2A2E] bg-[#111113] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2E] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#00FFC2]/10 border border-[#00FFC2]/40 flex items-center justify-center"><Bot className="w-5 h-5 text-[#00FFC2]" /></div>
            <div>
              <h2 className="text-sm font-mono font-bold text-white">COPILOTO TERRITORIAL IA</h2>
              <p className="text-[11px] text-[#8E9299]">LangChain · Langflow · Evidencia del gemelo · Aprobación humana</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8E9299]">MOTOR</span>
            <select value={provider} onChange={e => setProvider(e.target.value as typeof provider)} className="bg-[#0A0A0B] border border-[#3A3A3F] text-xs font-mono rounded px-2 py-1.5 text-[#00FFC2]">
              <option value="auto">AUTO</option><option value="langchain">LANGCHAIN</option><option value="langflow">LANGFLOW</option><option value="local">LOCAL SEGURO</option>
            </select>
            <span className="px-2 py-1 rounded border border-[#22c55e]/40 text-[#22c55e] text-[9px] font-mono"><ShieldCheck className="w-3 h-3 inline mr-1" />SIN MICRODATOS</span>
            <span className="hidden 2xl:inline px-2 py-1 rounded border border-[#38BDF8]/40 text-[#38BDF8] text-[9px] font-mono"><MapPin className="w-3 h-3 inline mr-1" />NAVEGACIÓN NACIONAL</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] min-h-[620px]">
          <div className="flex flex-col border-r border-[#2A2A2E]">
            <div className="flex-1 p-4 space-y-4 max-h-[610px] overflow-y-auto">
              {messages.map(message => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-lg border p-3 ${message.role === 'user' ? 'bg-[#00FFC2]/10 border-[#00FFC2]/30' : 'bg-[#151518] border-[#2A2A2E]'}`}>
                    <div className="flex items-center gap-2 mb-2 text-[9px] font-mono uppercase">
                      {message.role === 'assistant' ? <Bot className="w-3 h-3 text-[#00FFC2]" /> : <span className="text-[#38BDF8]">CONSULTA</span>}
                      {message.provider && <span className="text-[#8E9299]">{message.provider}</span>}
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-line text-[#E0E0E0]">{message.content}</p>
                    {message.evidence && message.evidence.length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-2 mt-3">
                        {message.evidence.map(item => (
                          <button key={item.id} onClick={() => selectEvidenceNeighborhood(item.source)} className="text-left p-2 bg-[#0A0A0B] border border-[#2A2A2E] rounded hover:border-[#00FFC2]/50">
                            <div className="flex justify-between gap-2"><span className="text-[10px] text-[#8E9299]">{item.label}</span><Database className="w-3 h-3 text-[#38BDF8]" /></div>
                            <div className="font-mono text-xs text-white mt-1">{item.value}</div>
                            <div className="text-[8px] text-[#666] mt-1">{item.source}</div>
                          </button>
                        ))}
                      </div>
                    )}
                    {message.scenarioDraft && (
                      <div className="mt-3 p-3 border border-[#FFAA00]/40 bg-[#FFAA00]/5 rounded">
                        <div className="flex items-center gap-2 text-[#FFAA00] text-[10px] font-mono font-bold"><Braces className="w-4 h-4" /> BORRADOR · REQUIERE APROBACIÓN</div>
                        <h4 className="text-xs font-bold text-white mt-2">{message.scenarioDraft.title}</h4>
                        <p className="text-[10px] text-[#A0A0A6] mt-1">{message.scenarioDraft.rationale}</p>
                        <div className="flex gap-3 mt-2 text-[9px] font-mono"><span>{message.scenarioDraft.shocks.length} CHOQUES</span><span>{message.scenarioDraft.policies.length} POLÍTICAS</span></div>
                        <button onClick={() => { onApplyScenarioDraft(message.scenarioDraft!); setAppliedDraftId(message.id); }} disabled={appliedDraftId === message.id} className="mt-3 px-3 py-1.5 bg-[#FFAA00] text-black rounded text-[10px] font-mono font-bold disabled:opacity-50">
                          {appliedDraftId === message.id ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />APLICADO</> : 'REVISAR Y APLICAR AL CONFIGURADOR'}
                        </button>
                      </div>
                    )}
                    {message.executionTrace && showFlow && (
                      <div className="mt-3 border-t border-[#2A2A2E] pt-3">
                        <div className="text-[9px] font-mono text-[#A78BFA] mb-2"><Workflow className="w-3 h-3 inline mr-1" />TRAZA LANGGRAPH</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {message.executionTrace.map((step, index) => (
                            <React.Fragment key={`${message.id}-${step.node}`}>
                              <div title={step.detail} className={`px-2 py-1 rounded border text-[8px] font-mono ${step.status === 'completed' ? 'border-[#22c55e]/50 text-[#22c55e] bg-[#22c55e]/5' : step.status === 'fallback' ? 'border-[#FFAA00]/50 text-[#FFAA00] bg-[#FFAA00]/5' : 'border-[#3A3A3F] text-[#666]'}`}>
                                {step.label}
                              </div>
                              {index < message.executionTrace!.length - 1 && <span className="text-[#555]">→</span>}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="flex items-center gap-2 text-xs text-[#00FFC2]"><Loader2 className="w-4 h-4 animate-spin" /> Analizando evidencia territorial…</div>}
            </div>
            <div className="p-3 border-t border-[#2A2A2E] bg-[#0D0D0F]">
              <div className="flex gap-2">
                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }} placeholder="Menciona cualquier departamento: ‘Analiza La Libertad y diseña…’" className="flex-1 min-h-[58px] max-h-28 resize-none bg-[#111113] border border-[#3A3A3F] rounded p-3 text-xs outline-none focus:border-[#00FFC2]" />
                <button onClick={() => submit()} disabled={loading || !input.trim()} className="w-12 rounded bg-[#00FFC2] text-black flex items-center justify-center disabled:opacity-40"><Send className="w-4 h-4" /></button>
              </div>
              <p className="text-[9px] text-[#666] mt-2">Si mencionas otro departamento, el gemelo cambia de territorio antes de analizar. Enter envía · Shift+Enter crea una línea.</p>
            </div>
          </div>

          <aside className="p-4 space-y-5 bg-[#0D0D0F]">
            <div>
              <h3 className="text-[10px] font-mono font-bold text-[#00FFC2] mb-2"><MapPin className="w-3 h-3 inline mr-1" />CONTEXTO ACTIVO</h3>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between"><span className="text-[#8E9299]">Territorio</span><span className="text-white text-right">{territoryName}</span></div>
                <div className="flex justify-between"><span className="text-[#8E9299]">Año</span><span className="font-mono">{year}</span></div>
                <div className="flex justify-between"><span className="text-[#8E9299]">IPM M₀</span><span className="font-mono text-[#FFAA00]">{afResult.M0.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-[#8E9299]">Barrio</span><span className="text-right max-w-[180px]">{selectedNeighborhood?.nombre || 'Todos'}</span></div>
                <div className="flex justify-between gap-2"><span className="text-[#8E9299]">Motor analítico</span><span className="text-right text-[#A78BFA]">{context.mlEngine.modelName}</span></div>
                <div className="flex justify-between gap-2"><span className="text-[#8E9299]">Dato oficial</span><span className="text-right text-[#22c55e]">{context.officialData ? `INEI · NBI ${context.officialData.observedPercent.toFixed(2)}%` : 'Cargando…'}</span></div>
                <div className="flex justify-between"><span className="text-[#8E9299]">Estado ML</span><span className={context.mlEngine.source === 'live_trained' ? 'text-[#22c55e]' : 'text-[#FFAA00]'}>{context.mlEngine.source === 'live_trained' ? 'Entrenado en vivo' : 'Campeón calibrado'}</span></div>
                <div className="flex justify-between"><span className="text-[#8E9299]">Registros enviados</span><span className="text-[#22c55e]">Solo agregados</span></div>
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-mono font-bold text-[#38BDF8] mb-2"><Sparkles className="w-3 h-3 inline mr-1" />CONSULTAS SUGERIDAS</h3>
              <div className="space-y-2">{starters.map(q => <button key={q} onClick={() => submit(q)} className="w-full text-left p-2.5 rounded border border-[#2A2A2E] bg-[#111113] hover:border-[#38BDF8]/60 text-[10px] leading-relaxed">{q}</button>)}</div>
            </div>
            <div className="border border-[#2A2A2E] rounded p-3">
              <div className="flex items-center gap-2 text-[10px] font-mono text-white"><Workflow className="w-4 h-4 text-[#A78BFA]" /> ORQUESTACIÓN</div>
              <p className="text-[9px] text-[#8E9299] mt-2">LangChain interpreta y estructura. Langflow permite sustituir o versionar el flujo visual desde el backend.</p>
              <div className="mt-3 space-y-1.5 text-[9px] font-mono">
                <div className="flex items-center gap-2"><span className="w-16 text-[#38BDF8]">LANGCHAIN</span><span className="text-[#777]">LLM + salida estructurada</span></div>
                <div className="flex items-center gap-2"><span className="w-16 text-[#A78BFA]">LANGGRAPH</span><span className="text-[#777]">flujo, estado y gobernanza</span></div>
                <div className="flex items-center gap-2"><span className="w-16 text-[#FFAA00]">LANGFLOW</span><span className="text-[#777]">orquestación visual opcional</span></div>
              </div>
              <button onClick={() => setShowFlow(value => !value)} className="mt-3 block text-[9px] text-[#A78BFA] font-mono">{showFlow ? 'OCULTAR TRAZAS' : 'MOSTRAR TRAZAS'}</button>
              <button onClick={onNavigateScenarios} className="mt-3 text-[9px] text-[#00FFC2] font-mono">ABRIR CONFIGURADOR <ExternalLink className="w-3 h-3 inline" /></button>
            </div>
            <button onClick={() => { setMessages(messages.slice(0, 1)); setAppliedDraftId(null); }} className="text-[9px] text-[#8E9299] font-mono"><RotateCcw className="w-3 h-3 inline mr-1" />REINICIAR CONVERSACIÓN</button>
          </aside>
        </div>
      </section>
      <div className="flex items-start gap-2 text-[10px] text-[#8E9299] border border-[#FFAA00]/20 bg-[#FFAA00]/5 rounded p-3"><AlertTriangle className="w-4 h-4 text-[#FFAA00] shrink-0" /> El copiloto explica datos y prepara borradores. No altera políticas públicas ni ejecuta simulaciones sin una acción explícita del usuario.</div>
    </div>
  );
};
