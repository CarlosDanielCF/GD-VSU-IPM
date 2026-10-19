import 'dotenv/config';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';

const app = express();
const port = Number(process.env.AI_SERVER_PORT || 3001);
app.use(express.json({ limit: '2mb' }));

// Department datasets are heterogeneous. Missing optional indicators are
// normalized instead of rejecting an otherwise valid territorial request.
const SafeNumber = z.number().finite().catch(0);

const RequestSchema = z.object({
  message: z.string().min(2).max(4000),
  sessionId: z.string().min(3).max(200),
  preferredProvider: z.enum(['auto', 'langchain', 'langflow', 'local']).default('auto'),
  context: z.object({
    officialData: z.object({ indicator:z.literal('NBI'), source:z.string(), year:z.number(), observedPercent:SafeNumber, previousPercent:SafeNumber, modelR2:SafeNumber, modelRmse:SafeNumber, predictedPercent:SafeNumber.nullable(), trainRows:z.number(), testRows:z.number() }).optional(),
    role: z.string(), departmentId: z.string(), territoryName: z.string(), year: z.number(),
    selectedNeighborhood: z.object({ id: z.string(), name: z.string(), district: z.string(), ipmM0: SafeNumber, ipmH: SafeNumber, ipmA: SafeNumber, population: SafeNumber }).nullable(),
    cityMetrics: z.object({ M0: SafeNumber, H: SafeNumber, A: SafeNumber, poorHouseholds: SafeNumber, totalHouseholds: SafeNumber, extremePovertyRate: SafeNumber, gini: SafeNumber, dimensions: z.record(z.string(), SafeNumber) }),
    neighborhoods: z.array(z.object({ id: z.string(), name: z.string(), district: z.string(), ipmM0: SafeNumber, ipmH: SafeNumber, ipmA: SafeNumber, population: SafeNumber, alert: z.string().catch('normal'), waterDeprivation: SafeNumber, informalCoverage: SafeNumber, infrastructureIndex: SafeNumber })).max(100),
    activeShockNames: z.array(z.string()), activePolicyNames: z.array(z.string()),
    lastSimulation: z.object({ deltaIpm: SafeNumber, householdsExitedPoverty: SafeNumber, householdsEnteredPoverty: SafeNumber, costEffectiveness: SafeNumber }).nullable()
    ,mlEngine: z.object({
      modelName: z.string(), source: z.enum(['live_trained', 'calibrated_champion']), r2: SafeNumber, rmse: SafeNumber, sessionId: z.string().nullable(),
      predictions: z.array(z.object({ neighborhoodId: z.string(), neighborhoodName: z.string(), observedM0: SafeNumber, predictedM0: SafeNumber, confidenceLow: SafeNumber, confidenceHigh: SafeNumber, category: z.string(), topDrivers: z.array(z.string()) })).max(100)
    }).optional().default({ modelName: 'Motor ML calibrado GD-VSU', source: 'calibrated_champion', r2: 0, rmse: 0, sessionId: null, predictions: [] })
  })
});

type RequestPayload = z.infer<typeof RequestSchema>;

const ModelResponseSchema = z.object({
  answer: z.string(), suggestedActions: z.array(z.string()).max(4), createScenarioDraft: z.boolean(),
  scenarioTitle: z.string().optional(), scenarioRationale: z.string().optional(), budgetMillions: z.number().min(0).max(10000).optional(),
  interventionType: z.enum(['water', 'employment', 'housing', 'health_education', 'connectivity']).optional(),
  includeShock: z.enum(['none', 'inflation', 'flood', 'health', 'unemployment']).optional()
});

const auditLog: Array<{ id: string; at: string; sessionId: string; provider: string; role: string; territory: string; message: string }> = [];
const rankNeighborhoods = (payload: RequestPayload) => [...payload.context.neighborhoods].sort((a, b) => b.ipmM0 - a.ipmM0);

function collectEvidence(payload: RequestPayload) {
  const evidence = [
    { id: 'city-m0', label: 'IPM ajustado M₀', value: payload.context.cityMetrics.M0.toFixed(4), source: `Motor Alkire-Foster · ${payload.context.territoryName}`, confidence: 'high' },
    { id: 'city-ha', label: 'Incidencia / Intensidad', value: `H ${(payload.context.cityMetrics.H * 100).toFixed(1)}% · A ${(payload.context.cityMetrics.A * 100).toFixed(1)}%`, source: 'Agregación vigente del gemelo digital', confidence: 'high' }
  ];
  if (payload.context.officialData) evidence.unshift({ id:'official-nbi', label:`NBI oficial ${payload.context.officialData.year}`, value:`${payload.context.officialData.observedPercent.toFixed(2)}%`, source:payload.context.officialData.source, confidence:'high' as const });
  rankNeighborhoods(payload).slice(0, 3).forEach((n, index) => evidence.push({
    id: `neighborhood-${n.id}`, label: `Prioridad ${index + 1}: ${n.name}`, value: `M₀ ${n.ipmM0.toFixed(3)} · ${n.population.toLocaleString('es-PE')} hab.`, source: `Barrio ${n.id} · ${n.district}`, confidence: 'high'
  }));
  const highestPrediction = [...payload.context.mlEngine.predictions].sort((a, b) => b.predictedM0 - a.predictedM0)[0];
  if (highestPrediction) evidence.push({
    id: 'trained-model', label: `Predicción · ${highestPrediction.neighborhoodName}`,
    value: `M₀ ${highestPrediction.predictedM0.toFixed(3)} · IC95% [${highestPrediction.confidenceLow.toFixed(3)}, ${highestPrediction.confidenceHigh.toFixed(3)}]`,
    source: `${payload.context.mlEngine.modelName} · ${payload.context.mlEngine.source === 'live_trained' ? 'entrenado en vivo' : 'campeón calibrado'}`,
    confidence: 'high'
  });
  return evidence;
}

function detectBudget(message: string) {
  const match = message.match(/(?:usd|us\$|\$)?\s*(\d+(?:[.,]\d+)?)\s*(?:millones?|m\b)/i);
  return match ? Number(match[1].replace(',', '.')) : 4;
}

function localAnalysis(payload: RequestPayload) {
  const text = payload.message.toLowerCase();
  const top = rankNeighborhoods(payload).slice(0, 3);
  const dominantDimension = Object.entries(payload.context.cityMetrics.dimensions).sort((a, b) => b[1] - a[1])[0];
  const wantsScenario = /(diseña|disena|crea|prop[oó]n|escenario|simula|intervenci[oó]n)/i.test(text);
  const interventionType = /agua|saneamiento|cisterna/.test(text) ? 'water' : /empleo|trabajo/.test(text) ? 'employment' : /vivienda|techo|material/.test(text) ? 'housing' : /salud|educaci/.test(text) ? 'health_education' : /internet|conectividad|digital/.test(text) ? 'connectivity' : 'water';
  const includeShock = /inunda|huayco|lluvia/.test(text) ? 'flood' : /inflaci|alimento/.test(text) ? 'inflation' : /pandemia|sanitaria/.test(text) ? 'health' : /desempleo|recesi/.test(text) ? 'unemployment' : 'none';
  const locationText = top.map((n, i) => `${i + 1}. ${n.name} (${n.district}), M₀=${n.ipmM0.toFixed(3)}, alerta=${n.alert}`).join('\n');
  let answer = `Diagnóstico para ${payload.context.territoryName} (${payload.context.year}): M₀=${payload.context.cityMetrics.M0.toFixed(4)}, con incidencia H=${(payload.context.cityMetrics.H * 100).toFixed(1)}% e intensidad A=${(payload.context.cityMetrics.A * 100).toFixed(1)}%.`;
  if (payload.context.officialData) {
    const official = payload.context.officialData;
    answer = `Dato oficial prioritario para ${payload.context.territoryName}: NBI ${official.year}=${official.observedPercent.toFixed(2)}% (año previo ${official.previousPercent.toFixed(2)}%). El motor temporal fue entrenado con ${official.trainRows} observaciones y probado con ${official.testRows}: R²=${official.modelR2.toFixed(3)}, RMSE=${official.modelRmse.toFixed(2)} pp${official.predictedPercent == null ? '' : ` y predicción 2025=${official.predictedPercent.toFixed(2)}%`}. NBI no equivale al IPM.\n\nContexto experimental complementario del gemelo: ${answer}`;
  }
  answer += `\n\nTerritorios con mayor prioridad:\n${locationText || 'No existen barrios cargados.'}`;
  if (dominantDimension) answer += `\n\nLa mayor contribución dimensional registrada es ${dominantDimension[0].replaceAll('_', ' ')} (${Number(dominantDimension[1]).toFixed(1)}%).`;
  if (payload.context.lastSimulation) answer += `\n\nLa última simulación produjo ΔM₀=${payload.context.lastSimulation.deltaIpm.toFixed(4)} y ${payload.context.lastSimulation.householdsExitedPoverty.toLocaleString('es-PE')} hogares salieron de pobreza.`;
  const predictedRisk = [...payload.context.mlEngine.predictions].sort((a, b) => b.predictedM0 - a.predictedM0)[0];
  if (predictedRisk) answer += `\n\nMotor ML ${payload.context.mlEngine.modelName} (${payload.context.mlEngine.source === 'live_trained' ? 'sesión entrenada' : 'modelo campeón calibrado'}, R²=${payload.context.mlEngine.r2.toFixed(3)}): el mayor M₀ predicho corresponde a ${predictedRisk.neighborhoodName}, con ${predictedRisk.predictedM0.toFixed(4)} e IC95% [${predictedRisk.confidenceLow.toFixed(4)}, ${predictedRisk.confidenceHigh.toFixed(4)}]. Factores principales: ${predictedRisk.topDrivers.join('; ')}.`;
  answer += '\n\nRecomendación: focalizar primero los barrios de mayor M₀, verificar cobertura y costo con el configurador ABM, y documentar los supuestos antes de adoptar una decisión.';
  return { answer, suggestedActions: ['Seleccionar el barrio de mayor prioridad', 'Revisar la descomposición dimensional'], wantsScenario, interventionType, includeShock, budgetMillions: detectBudget(payload.message) };
}

function createScenarioDraft(payload: RequestPayload, input: { title?: string; rationale?: string; budgetMillions: number; interventionType: string; includeShock: string }) {
  const targets = rankNeighborhoods(payload).slice(0, 3);
  const now = Date.now();
  const policyMap: Record<string, { tipo: string; name: string; description: string }> = {
    water: { tipo: 'subsidio_mejoramiento_vivienda', name: 'Acceso seguro a agua y saneamiento', description: 'Ampliación de conexiones, almacenamiento seguro y mejora del saneamiento en zonas priorizadas.' },
    employment: { tipo: 'empleo_temporal_obras', name: 'Empleo temporal resiliente', description: 'Empleo local para obras de mitigación e infraestructura barrial.' },
    housing: { tipo: 'subsidio_mejoramiento_vivienda', name: 'Mejoramiento integral de vivienda', description: 'Refuerzo de materiales, reducción de hacinamiento y conexión a servicios.' },
    health_education: { tipo: 'infraestructura_salud_educacion', name: 'Cobertura social territorial', description: 'Ampliación de servicios de salud y educación en zonas con mayor IPM.' },
    connectivity: { tipo: 'inclusion_digital_conectividad', name: 'Inclusión y conectividad digital', description: 'Conectividad comunitaria y acceso digital para hogares vulnerables.' }
  };
  const shockMap: Record<string, { tipo: string; name: string; description: string; magnitud: number }> = {
    flood: { tipo: 'desastre_climatico_inundacion', name: 'Inundación focalizada', description: 'Evento hidrometeorológico severo sobre zonas priorizadas.', magnitud: 0.65 },
    inflation: { tipo: 'inflacion_alimentos', name: 'Inflación de alimentos', description: 'Incremento sostenido de la canasta alimentaria.', magnitud: 0.25 },
    health: { tipo: 'crisis_sanitaria_pandemia', name: 'Crisis sanitaria', description: 'Presión extraordinaria sobre salud e ingresos.', magnitud: 0.45 },
    unemployment: { tipo: 'shock_desempleo_recesion', name: 'Choque de desempleo', description: 'Contracción del empleo formal e informal.', magnitud: 0.30 }
  };
  const policy = policyMap[input.interventionType] || policyMap.water;
  const shock = shockMap[input.includeShock];
  return {
    title: input.title || `Intervención focalizada · ${payload.context.territoryName}`,
    rationale: input.rationale || `Prioriza ${targets.map(n => n.name).join(', ')} por su nivel relativo de vulnerabilidad multidimensional.`,
    shocks: shock ? [{ id: `ai-shock-${now}`, tipo: shock.tipo, nombre: shock.name, descripcion: shock.description, activo: true, magnitud: shock.magnitud, duracionMeses: 6, barriosAfectadosIds: targets.map(n => n.id), impactoEnEmpleoInformalPct: 0.12, impactoEnGastoSaludPct: 0.10, impactoEnCanastaBasicaPct: 0.08 }] : [],
    policies: [{ id: `ai-policy-${now}`, tipo: policy.tipo, nombre: `IA: ${policy.name}`, descripcion: `${policy.description} [Borrador generado; requiere validación humana]`, activo: true, presupuestoMillonesUSD: input.budgetMillions, hogaresMetaCount: Math.max(100, Math.round(targets.reduce((sum, n) => sum + n.population, 0) / 4)), criterioFocalizacion: 'ipm_alto', barriosObjetivoIds: targets.map(n => n.id), mejoraServiciosDirecta: true }],
    assumptions: ['Focalización inicial por M₀ observado', 'Costo distribuido proporcionalmente entre barrios objetivo', 'Horizonte de evaluación sujeto al configurador ABM'],
    warnings: ['Borrador analítico: validar costos unitarios y capacidad de ejecución', 'La correlación territorial no implica causalidad', 'Debe aprobarse antes de ejecutar la simulación']
  };
}

async function runLangChain(payload: RequestPayload) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') return null;
  const model = new ChatGoogleGenerativeAI({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', temperature: 0.15, apiKey: process.env.GEMINI_API_KEY });
  const structured = model.withStructuredOutput(ModelResponseSchema);
  const compactContext = { ...payload.context, neighborhoods: rankNeighborhoods(payload).slice(0, 12) };
  return structured.invoke([
    new SystemMessage('Eres un copiloto de planificación pública para un gemelo digital socioeconómico peruano. Usa exclusivamente los datos entregados; no inventes métricas. Explica M0, H y A con rigor. Si piden diseñar o simular una intervención, devuelve createScenarioDraft=true. Toda propuesta es un borrador sujeto a aprobación humana. Responde en español claro y menciona limitaciones relevantes.'),
    new HumanMessage(`Consulta: ${payload.message}\n\nContexto agregado seguro:\n${JSON.stringify(compactContext)}`)
  ]);
}

function extractLangflowText(data: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (value: unknown): string | null => {
    if (!value || seen.has(value)) return null;
    if (typeof value === 'string') return value.length > 20 ? value : null;
    if (typeof value !== 'object') return null;
    seen.add(value);
    const obj = value as Record<string, unknown>;
    for (const key of ['message', 'text', 'content']) if (typeof obj[key] === 'string' && (obj[key] as string).length > 20) return obj[key] as string;
    for (const nested of Object.values(obj)) { const result = walk(nested); if (result) return result; }
    return null;
  };
  return walk(data);
}

async function runLangflow(payload: RequestPayload) {
  const base = process.env.LANGFLOW_URL?.replace(/\/$/, '');
  const flowId = process.env.LANGFLOW_FLOW_ID;
  if (!base || !flowId) return null;
  const response = await fetch(`${base}/api/v1/run/${flowId}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(process.env.LANGFLOW_API_KEY ? { 'x-api-key': process.env.LANGFLOW_API_KEY } : {}) },
    body: JSON.stringify({ input_value: `${payload.message}\n\nCONTEXTO GD-VSU:\n${JSON.stringify(payload.context)}`, input_type: 'chat', output_type: 'chat', session_id: payload.sessionId })
  });
  if (!response.ok) throw new Error(`Langflow respondió ${response.status}`);
  return extractLangflowText(await response.json());
}

type ExecutionStep = {
  node: 'context_guard' | 'evidence_tools' | 'langchain_reasoning' | 'langflow_workflow' | 'scenario_draft' | 'human_governance';
  label: string;
  status: 'completed' | 'skipped' | 'fallback';
  detail: string;
};

type LocalResult = ReturnType<typeof localAnalysis>;
type ScenarioDraft = ReturnType<typeof createScenarioDraft>;

const CopilotState = Annotation.Root({
  payload: Annotation<RequestPayload>(),
  local: Annotation<LocalResult>(),
  answer: Annotation<string>(),
  provider: Annotation<'local' | 'langchain' | 'langflow'>(),
  evidence: Annotation<ReturnType<typeof collectEvidence>>(),
  suggestedActions: Annotation<string[]>(),
  scenarioInput: Annotation<{ title?: string; rationale?: string; budgetMillions: number; interventionType: string; includeShock: string }>(),
  scenarioDraft: Annotation<ScenarioDraft | undefined>(),
  limitations: Annotation<string[]>(),
  trace: Annotation<ExecutionStep[]>({ reducer: (current, update) => current.concat(update), default: () => [] })
});

const copilotGraph = new StateGraph(CopilotState)
  .addNode('context_guard', (state) => ({
    limitations: ['Análisis basado en datos agregados del estado actual', 'Las propuestas requieren validación y aprobación humana'],
    trace: [{ node: 'context_guard' as const, label: 'CONTEXTO', status: 'completed' as const, detail: `${state.payload.context.neighborhoods.length} barrios normalizados; no se enviaron microdatos de hogares.` }]
  }))
  .addNode('evidence_tools', (state) => {
    const local = localAnalysis(state.payload);
    return {
      local, evidence: collectEvidence(state.payload), answer: local.answer, provider: 'local' as const,
      suggestedActions: local.suggestedActions,
      scenarioInput: { budgetMillions: local.budgetMillions, interventionType: local.interventionType, includeShock: local.includeShock },
    trace: [{ node: 'evidence_tools' as const, label: 'MOTOR ML', status: 'completed' as const, detail: `${state.payload.context.mlEngine.modelName} (${state.payload.context.mlEngine.source}) + Alkire-Foster + ABM.` }]
    };
  })
  .addNode('reasoning', async (state) => {
    const preferred = state.payload.preferredProvider;
    if (preferred === 'langflow' || (preferred === 'auto' && process.env.LANGFLOW_URL && process.env.LANGFLOW_FLOW_ID)) {
      const output = await runLangflow(state.payload);
      if (output) return {
        answer: output, provider: 'langflow' as const,
        trace: [
          { node: 'langflow_workflow' as const, label: 'LANGFLOW', status: 'completed' as const, detail: 'Flujo visual externo ejecutado mediante la API privada.' },
          { node: 'langchain_reasoning' as const, label: 'LANGCHAIN', status: 'skipped' as const, detail: 'El flujo Langflow seleccionado produjo la respuesta.' }
        ]
      };
      return { trace: [
        { node: 'langflow_workflow' as const, label: 'LANGFLOW', status: 'fallback' as const, detail: 'Langflow no está configurado; se usó el motor local universal.' },
        { node: 'langchain_reasoning' as const, label: 'LANGCHAIN', status: 'skipped' as const, detail: 'No hay un modelo LangChain configurado.' }
      ] };
    }
    if (preferred !== 'local') {
      const output = await runLangChain(state.payload);
      if (output) return {
        answer: output.answer, suggestedActions: output.suggestedActions, provider: 'langchain' as const,
        local: { ...state.local, wantsScenario: output.createScenarioDraft },
        scenarioInput: { title: output.scenarioTitle, rationale: output.scenarioRationale, budgetMillions: output.budgetMillions ?? state.local.budgetMillions, interventionType: output.interventionType ?? state.local.interventionType, includeShock: output.includeShock ?? state.local.includeShock },
        trace: [
          { node: 'langchain_reasoning' as const, label: 'LANGCHAIN', status: 'completed' as const, detail: 'Modelo con salida Zod estructurada y contexto territorial agregado.' },
          { node: 'langflow_workflow' as const, label: 'LANGFLOW', status: 'skipped' as const, detail: 'Langflow no fue la ruta seleccionada.' }
        ]
      };
      return { trace: [
        { node: 'langchain_reasoning' as const, label: 'LANGCHAIN', status: 'fallback' as const, detail: 'No hay GEMINI_API_KEY; se mantuvo el análisis determinístico.' },
        { node: 'langflow_workflow' as const, label: 'LANGFLOW', status: 'skipped' as const, detail: 'Langflow no fue la ruta seleccionada.' }
      ] };
    }
    return { trace: [
      { node: 'langchain_reasoning' as const, label: 'LANGCHAIN', status: 'skipped' as const, detail: 'El usuario seleccionó LOCAL SEGURO.' },
      { node: 'langflow_workflow' as const, label: 'LANGFLOW', status: 'skipped' as const, detail: 'El usuario seleccionó LOCAL SEGURO.' }
    ] };
  })
  .addNode('scenario_draft', (state) => state.local.wantsScenario ? {
    scenarioDraft: createScenarioDraft(state.payload, state.scenarioInput),
    trace: [{ node: 'scenario_draft' as const, label: 'BORRADOR', status: 'completed' as const, detail: 'Choques y políticas convertidos a los contratos nativos del simulador.' }]
  } : {
    trace: [{ node: 'scenario_draft' as const, label: 'BORRADOR', status: 'skipped' as const, detail: 'La consulta no solicitó crear una intervención.' }]
  })
  .addNode('human_governance', (state) => ({
    trace: [{ node: 'human_governance' as const, label: 'GOBERNANZA', status: 'completed' as const, detail: state.scenarioDraft ? 'El borrador requiere aprobación antes de incorporarse al configurador.' : 'Respuesta de solo lectura; no se modificó el gemelo.' }]
  }))
  .addEdge(START, 'context_guard')
  .addEdge('context_guard', 'evidence_tools')
  .addEdge('evidence_tools', 'reasoning')
  .addEdge('reasoning', 'scenario_draft')
  .addEdge('scenario_draft', 'human_governance')
  .addEdge('human_governance', END)
  .compile();

app.get('/api/ai/health', (_req, res) => res.json({ status: 'ok', mode: process.env.GEMINI_API_KEY ? 'hybrid' : 'local-safe', langgraph: true, langchain: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'), langflow: Boolean(process.env.LANGFLOW_URL && process.env.LANGFLOW_FLOW_ID) }));

app.get('/api/ai/flow', (_req, res) => res.json({
  framework: 'LangGraph',
  nodes: [
    { id: 'context_guard', label: 'Normalización y privacidad', technology: 'LangGraph + Zod' },
    { id: 'evidence_tools', label: 'Herramientas del gemelo', technology: 'Alkire-Foster + ABM' },
    { id: 'reasoning', label: 'Razonamiento estructurado', technology: 'LangChain o Langflow' },
    { id: 'scenario_draft', label: 'Borrador tipado', technology: 'Contratos GD-VSU' },
    { id: 'human_governance', label: 'Aprobación humana', technology: 'LangGraph governance' }
  ],
  edges: [['context_guard', 'evidence_tools'], ['evidence_tools', 'reasoning'], ['reasoning', 'scenario_draft'], ['scenario_draft', 'human_governance']]
}));

app.post('/api/ai/chat', async (req, res) => {
  const parsed = RequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Solicitud inválida', details: parsed.error.flatten() });
  const payload = parsed.data;
  const auditId = randomUUID();
  try {
    const result = await copilotGraph.invoke({
      payload, local: localAnalysis(payload), answer: '', provider: 'local', evidence: [], suggestedActions: [],
      scenarioInput: { budgetMillions: 4, interventionType: 'water', includeShock: 'none' }, scenarioDraft: undefined, limitations: [], trace: []
    });
    auditLog.push({ id: auditId, at: new Date().toISOString(), sessionId: payload.sessionId, provider: result.provider, role: payload.context.role, territory: payload.context.departmentId, message: payload.message });
    if (auditLog.length > 500) auditLog.shift();
    res.json({ answer: result.answer, provider: result.provider, evidence: result.evidence, suggestedActions: result.suggestedActions, ...(result.scenarioDraft ? { scenarioDraft: result.scenarioDraft } : {}), auditId, limitations: result.limitations, executionTrace: result.trace });
  } catch (error) {
    res.status(502).json({ error: 'No fue posible completar el flujo IA', detail: error instanceof Error ? error.message : String(error), auditId });
  }
});

app.get('/api/ai/audit', (_req, res) => res.json(auditLog.slice(-100).reverse()));
app.listen(port, () => console.log(`[GD-VSU AI] API disponible en http://localhost:${port}`));
