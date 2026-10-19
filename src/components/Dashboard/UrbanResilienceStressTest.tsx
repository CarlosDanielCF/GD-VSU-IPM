import React, { useState, useMemo } from 'react';
import { NeighborhoodCell, AlkireFosterResult, PolicyScenario } from '../../types';
import { 
  Flame, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Zap, 
  TrendingDown, 
  TrendingUp, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  HeartCrack,
  Droplets,
  Building,
  Sparkles,
  Users
} from 'lucide-react';
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

export interface StressScenarioConfig {
  id: string;
  name: string;
  category: 'sismico' | 'climatico_elnino' | 'economico_inflacion' | 'hidrico_sequia';
  severity: 'SEVERA' | 'CATASTRÓFICA' | 'EXTREMA';
  description: string;
  triggerEvent: string;
  timelineSteps: {
    day: number;
    title: string;
    subsystemImpact: string;
    vulnerablePopulationAtRisk: number;
    projectedDeltaM0: number; // increase in M0
    cascadingFailures: string[];
  }[];
  resiliencePackage: {
    title: string;
    costUSD: number;
    interventions: string[];
    recoveryDays: number;
    netPovertyMitigatedPct: number;
  };
}

const STRESS_SCENARIOS: StressScenarioConfig[] = [
  {
    id: 'stress_sismo_8_2',
    name: 'Mega-Sismo 8.2 Mw (Falla de Subducción Placas Nazca - Sudamericana)',
    category: 'sismico',
    severity: 'CATASTRÓFICA',
    description: 'Ruptura sísmica mayor con aceleración pico PGA > 0.65g. Colapso de viviendas precarias en laderas de más de 35° de pendiente y ruptura de redes de agua potable.',
    triggerEvent: 'Movimiento telúrico de 85 segundos con epicentro en la costa central a 35 km de profundidad.',
    timelineSteps: [
      {
        day: 0,
        title: 'T=0h: Impacto Físico Inmediato',
        subsystemImpact: 'Colapso de 14,200 viviendas autoconstruidas en pircas y ruptura de 12 tuberías matrices de SEDAPAL.',
        vulnerablePopulationAtRisk: 85000,
        projectedDeltaM0: +0.035,
        cascadingFailures: ['Corte de agua potable al 78% de laderas', 'Bloqueo de vías por derrumbes', 'Colapso de postas médicas locales']
      },
      {
        day: 15,
        title: 'T=+15d: Crisis Sanitaria & Alimentaria',
        subsystemImpact: 'Multiplicación x4 del costo de agua por cisterna privada informal. Desabastecimiento de ollas comunes.',
        vulnerablePopulationAtRisk: 140000,
        projectedDeltaM0: +0.068,
        cascadingFailures: ['Aparición de brotes diarreicos infantiles', 'Familias agotando ahorros en compra de agua', 'Paralización de comercio informal']
      },
      {
        day: 60,
        title: 'T=+60d: Deserción Escolar & Empleo Precario',
        subsystemImpact: 'Escuelas dañadas no reanudan clases presenciales. Menores de edad se incorporan a trabajo informal callejero.',
        vulnerablePopulationAtRisk: 210000,
        projectedDeltaM0: +0.095,
        cascadingFailures: ['Deserción escolar de 8.5% en secundaria', 'Empeoramiento de desnutrición crónica', 'Venta desesperada de activos productivos']
      },
      {
        day: 180,
        title: 'T=+180d: Trampa de Pobreza Estructural',
        subsystemImpact: 'Sin reconstrucción guiada, los hogares reconstruyen con materiales más precarios y deudas a usura.',
        vulnerablePopulationAtRisk: 260000,
        projectedDeltaM0: +0.112,
        cascadingFailures: ['Inercia intergeneracional de pobreza', 'Exclusión financiera', 'Multiplicación de asentamientos en zonas de alto riesgo']
      }
    ],
    resiliencePackage: {
      title: 'Plan Escudo Urbano: Reconstrucción Antisísmica & Malla Hídrica Segura',
      costUSD: 45000000,
      recoveryDays: 90,
      netPovertyMitigatedPct: 65,
      interventions: [
        'Despliegue de 120 tanques nodriza comunitarios con agua potable gratuita',
        'Bono de Emergencia Habitacional con supervisión técnica de ingenieros estructurales',
        'Muros de contención geotécnicos con anclajes profundos en laderas críticas',
        'Aulas temporales modulares con internet satelital'
      ]
    }
  },
  {
    id: 'stress_elnino_huaycos',
    name: 'Fenómeno El Niño Costero Extraordinario (Huaycos & Lluvias Torrenciales)',
    category: 'climatico_elnino',
    severity: 'EXTREMA',
    description: 'Precipitaciones anómalas de 65 mm/24h en cuencas medias y altas. Activación simultánea de 22 quebradas secas con flujos de detritos y lodo.',
    triggerEvent: 'Anomalía térmica en el mar (+4.5°C) que desencadena tormentas convectivas severas sobre las cuencas.',
    timelineSteps: [
      {
        day: 0,
        title: 'T=0h: Activación de Quebradas',
        subsystemImpact: 'Bajada de lodo y rocas que arrasa puentes peatonales, tuberías aéreas y viviendas en cauces secos.',
        vulnerablePopulationAtRisk: 62000,
        projectedDeltaM0: +0.028,
        cascadingFailures: ['Aislamiento de 35 asentamientos humanos', 'Turbidez extrema en La Atarjea detiene potabilización']
      },
      {
        day: 15,
        title: 'T=+15d: Epidemia de Dengue & Inundación Continua',
        subsystemImpact: 'Aguas estancadas y destrucción de desagües multiplican vectores de dengue y enfermedades gastrointestinales.',
        vulnerablePopulationAtRisk: 110000,
        projectedDeltaM0: +0.052,
        cascadingFailures: ['Saturación de hospitales del cono norte y este', 'Pérdida de medicamentos y vacunas por humedad']
      },
      {
        day: 60,
        title: 'T=+60d: Pérdida Masiva de Empleos de Construcción',
        subsystemImpact: 'Paralización de obras civiles y cierre de mercados zonales por lodo solidificado.',
        vulnerablePopulationAtRisk: 165000,
        projectedDeltaM0: +0.075,
        cascadingFailures: ['Caída de 42% en ingresos de obreros informales', 'Desabastecimiento de alimentos frescos']
      },
      {
        day: 180,
        title: 'T=+180d: Migración Intraurbana Crítica',
        subsystemImpact: 'Familias desplazadas forman nuevos cinturones de extrema precariedad en laderas aún más empinadas.',
        vulnerablePopulationAtRisk: 195000,
        projectedDeltaM0: +0.089,
        cascadingFailures: ['Pérdida de títulos de posesión', 'Sobreexplotación de servicios básicos en zonas receptoras']
      }
    ],
    resiliencePackage: {
      title: 'Plan Diques de Retención, Descolmatación & Salud Móvil El Niño',
      costUSD: 28000000,
      recoveryDays: 60,
      netPovertyMitigatedPct: 72,
      interventions: [
        'Instalación de barreras dinámicas y mallas de acero en gargantas de quebradas',
        'Fumigación masiva y brigadas móviles de salud con tratamiento de rehidratación',
        'Empleo temporal remunerado para limpieza y dragado de cauces urbanos',
        'Subsidio de arrendamiento temporal seguro para familias en cauces de alto riesgo'
      ]
    }
  },
  {
    id: 'stress_inflacion_alimentos',
    name: 'Shock Hiperinflacionario de Alimentos Básicos & Gas (+35%)',
    category: 'economico_inflacion',
    severity: 'SEVERA',
    description: 'Disrupción global en importaciones de trigo, fertilizantes y GLP que dispara la canasta básica alimentaria en estratos socioeconómicos D y E.',
    triggerEvent: 'Conflicto geopolítico y depreciación cambiaria que incrementa el precio del pollo, aceite, arroz y gas doméstico.',
    timelineSteps: [
      {
        day: 0,
        title: 'T=0h: Shock de Precios en Mercados Zonales',
        subsystemImpact: 'El gasto alimentario pasa a absorber el 74% de los ingresos familiares totales de hogares vulnerables.',
        vulnerablePopulationAtRisk: 320000,
        projectedDeltaM0: +0.022,
        cascadingFailures: ['Reducción de porciones proteicas en hogares', 'Sobredemanda inmediata en comedores y ollas comunes']
      },
      {
        day: 15,
        title: 'T=+15d: Déficit Calórico & Deuda Doméstica',
        subsystemImpact: 'Ollas comunes cierran por falta de víveres o triplican costo del plato solidario. Hogares recurren al fiado informal.',
        vulnerablePopulationAtRisk: 410000,
        projectedDeltaM0: +0.048,
        cascadingFailures: ['Tasa de interés de crédito informal (gota a gota) llega al 20% mensual', 'Hogares sacrifican gastos de salud y educación']
      },
      {
        day: 60,
        title: 'T=+60d: Retraso Escolar & Anemia Severa',
        subsystemImpact: 'Aumento de 12 puntos porcentuales en anemia infantil en menores de 3 años. Ausentismo escolar por hambre.',
        vulnerablePopulationAtRisk: 480000,
        projectedDeltaM0: +0.071,
        cascadingFailures: ['Caída irreversible del desarrollo cognitivo temprano', 'Protestas y bloqueos de vías logísticas']
      },
      {
        day: 180,
        title: 'T=+180d: Pobreza Extrema Crónica',
        subsystemImpact: 'El IPM metropolitano retrocede 6 años en avances de superación de pobreza.',
        vulnerablePopulationAtRisk: 520000,
        projectedDeltaM0: +0.084,
        cascadingFailures: ['Trampa nutricional intergeneracional', 'Aumento de criminalidad oportunista en ejes comerciales']
      }
    ],
    resiliencePackage: {
      title: 'Plan Canasta Nutricional de Emergencia & Tarifa Social de Energía',
      costUSD: 22000000,
      recoveryDays: 45,
      netPovertyMitigatedPct: 80,
      interventions: [
        'Abastecimiento directo Estado-Ollas Comunes con productos agrícolas nacionales',
        'Bono Proteico Digital condicionado a controles de peso y talla en postas de salud',
        'Vales de GLP subsidiado para comedores populares',
        'Créditos solidarios de fomento comunal con tasa cero'
      ]
    }
  }
];

interface UrbanResilienceStressTestProps {
  neighborhoods: NeighborhoodCell[];
  baselineAF: AlkireFosterResult;
  selectedCity: string;
  onApplyResiliencePlan?: (packageData: StressScenarioConfig['resiliencePackage']) => void;
}

export const UrbanResilienceStressTest: React.FC<UrbanResilienceStressTestProps> = ({
  neighborhoods,
  baselineAF,
  selectedCity,
  onApplyResiliencePlan
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('stress_sismo_8_2');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isResilienceActive, setIsResilienceActive] = useState<boolean>(false);
  const [isSimulatingStress, setIsSimulatingStress] = useState<boolean>(false);

  const activeScenario = useMemo(() => {
    return STRESS_SCENARIOS.find(s => s.id === selectedScenarioId) || STRESS_SCENARIOS[0];
  }, [selectedScenarioId]);

  // Generate Recharts comparison data across the 180 days
  const chartData = useMemo(() => {
    const baseM0 = baselineAF.M0;
    return activeScenario.timelineSteps.map(step => {
      const degradedM0 = Number((baseM0 + step.projectedDeltaM0).toFixed(4));
      const mitigatedDelta = isResilienceActive ? step.projectedDeltaM0 * (1 - activeScenario.resiliencePackage.netPovertyMitigatedPct / 100) : step.projectedDeltaM0;
      const resilientM0 = Number((baseM0 + mitigatedDelta).toFixed(4));

      return {
        dia: `Día ${step.day}`,
        sinIntervencion: degradedM0,
        conResiliencia: resilientM0,
        baseM0: Number(baseM0.toFixed(4)),
        deltaPobrezaPct: Math.round((step.projectedDeltaM0 / baseM0) * 100)
      };
    });
  }, [activeScenario, baselineAF, isResilienceActive]);

  // Auto-run simulation stepper
  const handleStartStressSimulation = () => {
    setIsSimulatingStress(true);
    setCurrentStepIndex(0);
    let step = 0;

    const interval = setInterval(() => {
      step++;
      if (step < activeScenario.timelineSteps.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setIsSimulatingStress(false);
      }
    }, 1200);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsResilienceActive(false);
    setIsSimulatingStress(false);
  };

  const activeStep = activeScenario.timelineSteps[currentStepIndex];

  return (
    <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] space-y-4 font-mono text-xs">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#2A2A2E] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40 flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-[#FF4D4D]" />
              INSPECCIÓN DE ESTRÉS EXTREMO // PRUEBAS DE CARGA CATASTRÓFICA
            </span>
            <span className="text-[10px] text-[#8E9299]">
              Gemelo Digital: {selectedCity} · M₀ Base: {baselineAF.M0.toFixed(4)}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
            Inyector de Shocks & Simulador de Resiliencia y Cascadas Urbanas
          </h3>
          <p className="text-xs text-[#8E9299] max-w-3xl mt-0.5">
            Somete el Gemelo Digital a sismos mayores, huaycos o inflación desbocada para analizar la propagación temporal en cadena entre sistemas de agua, salud, empleo y habitabilidad.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded text-xs font-bold bg-[#1A1A1D] hover:bg-[#252528] text-[#8E9299] hover:text-white border border-[#333] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>REINICIAR</span>
          </button>

          <button
            onClick={handleStartStressSimulation}
            disabled={isSimulatingStress}
            className="px-4 py-1.5 rounded text-xs font-bold bg-[#FF4D4D] hover:bg-[#E03B3B] text-white flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            {isSimulatingStress ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isSimulatingStress ? 'PROPAGANDO SHOCK...' : 'DISPARAR SHOCK CATASTRÓFICO'}</span>
          </button>
        </div>
      </div>

      {/* 2. Scenario Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STRESS_SCENARIOS.map(sc => {
          const isSelected = sc.id === activeScenario.id;
          return (
            <div
              key={sc.id}
              onClick={() => {
                setSelectedScenarioId(sc.id);
                setCurrentStepIndex(0);
                setIsResilienceActive(false);
              }}
              className={`p-3 rounded border transition-all cursor-pointer space-y-1.5 ${
                isSelected
                  ? 'bg-[#1C1215] border-[#FF4D4D] shadow-md'
                  : 'bg-[#141416] border-[#2A2A2E] hover:border-[#3A3A3F]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  sc.severity === 'CATASTRÓFICA' 
                    ? 'bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40' 
                    : 'bg-[#261805] text-[#FFAA00] border border-[#FFAA00]/40'
                }`}>
                  {sc.severity}
                </span>
                <span className="text-[10px] text-[#8E9299]">{sc.timelineSteps.length} fases</span>
              </div>
              <h4 className="text-xs font-bold text-white leading-tight">{sc.name}</h4>
              <p className="text-[10px] text-[#8E9299] line-clamp-2 leading-relaxed">
                {sc.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 3. Timeline Step Progress Bar */}
      <div className="p-3 rounded bg-[#0A0A0B] border border-[#2A2A2E] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#8E9299] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FF4D4D]" />
            Línea Temporal de Propagación de Falla ({activeStep.day === 0 ? 'Día 0 (Inmediato)' : `+${activeStep.day} días`}):
          </span>
          <span className="text-[#FF4D4D] font-bold">
            Población en Alto Riesgo: ~{activeStep.vulnerablePopulationAtRisk.toLocaleString()} personas
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {activeScenario.timelineSteps.map((step, idx) => (
            <button
              key={step.day}
              onClick={() => setCurrentStepIndex(idx)}
              className={`p-2 rounded text-left border transition-all cursor-pointer ${
                idx === currentStepIndex
                  ? 'bg-[#2A1010] border-[#FF4D4D] text-white shadow-sm'
                  : idx < currentStepIndex
                  ? 'bg-[#141416] border-[#184E42] text-[#00FFC2]'
                  : 'bg-[#141416] border-[#222] text-[#666]'
              }`}
            >
              <div className="flex justify-between text-[10px] font-bold">
                <span>Día {step.day}</span>
                <span>{step.projectedDeltaM0 > 0 ? `+${(step.projectedDeltaM0 * 100).toFixed(1)}% M₀` : ''}</span>
              </div>
              <span className="text-[9px] block truncate mt-0.5">{step.title.split(':')[1] || step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main Deep Dive: Cascading Failures & Resilience Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* CASCADING FAILURES BREAKDOWN (6 cols) */}
        <div className="lg:col-span-6 bg-[#141416] border border-[#2A2A2E] rounded p-3.5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#222]">
            <div className="flex items-center gap-1.5">
              <HeartCrack className="w-4 h-4 text-[#FF4D4D]" />
              <h4 className="text-xs font-bold text-white uppercase">
                Diagnóstico de Daños en Cascada ({activeStep.title})
              </h4>
            </div>
            <span className="text-[10px] text-[#FF4D4D] font-bold">
              &Delta; M₀: +{activeStep.projectedDeltaM0.toFixed(4)}
            </span>
          </div>

          <div className="p-2.5 rounded bg-[#1C1215] border border-[#FF4D4D]/30 space-y-1">
            <span className="text-[10px] text-[#FF4D4D] font-bold block">Colapso Principal de Subsistema:</span>
            <p className="text-xs text-white leading-relaxed">{activeStep.subsystemImpact}</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-[#8E9299] uppercase font-bold block">
              Efectos Secundarios de Derrama Espacial:
            </span>
            <div className="space-y-1">
              {activeStep.cascadingFailures.map((cf, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#0A0A0B] border border-[#222]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D] shrink-0" />
                  <span className="text-xs text-[#E0E0E0]">{cf}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resilience Action Package Box */}
          <div className="pt-2 border-t border-[#222] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#00FFC2] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {activeScenario.resiliencePackage.title}
              </span>
              <span className="text-[10px] text-[#8E9299]">
                Costo: ${(activeScenario.resiliencePackage.costUSD / 1000000).toFixed(1)}M USD
              </span>
            </div>

            <p className="text-[10px] text-[#8E9299] leading-relaxed">
              Mitiga el <strong className="text-[#00FFC2]">{activeScenario.resiliencePackage.netPovertyMitigatedPct}%</strong> del impacto proyectado en el IPM en un lapso de {activeScenario.resiliencePackage.recoveryDays} días.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {activeScenario.resiliencePackage.interventions.map((action, i) => (
                <div key={i} className="p-1.5 rounded bg-[#0D221D] border border-[#184E42] text-[10px] text-[#00FFC2] flex items-center gap-1 truncate">
                  <span>✓</span>
                  <span className="truncate">{action}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setIsResilienceActive(!isResilienceActive);
                if (onApplyResiliencePlan && !isResilienceActive) {
                  onApplyResiliencePlan(activeScenario.resiliencePackage);
                }
              }}
              className={`w-full py-2 rounded font-bold cursor-pointer transition-all flex items-center justify-center gap-2 text-xs ${
                isResilienceActive
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-md'
                  : 'bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#00FFC2]/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isResilienceActive ? '✓ PROTOCOLO DE RESILIENCIA ACTIVADO' : 'ACTIVAR PROTOCOLO DE RESILIENCIA DEL GEMELO'}</span>
            </button>
          </div>
        </div>

        {/* RESILIENCE & POVERTY TRAJECTORY CHART (6 cols) */}
        <div className="lg:col-span-6 bg-[#0A0A0B] border border-[#2A2A2E] rounded p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <div>
                <h4 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
                  Curva de Resiliencia del Gemelo Digital (M₀ vs Tiempo)
                </h4>
                <p className="text-[10px] text-[#8E9299] mt-0.5">
                  Comparativa: Trayectoria Degenerativa Sin Mitigación vs. Trayectoria con Paquete de Resiliencia.
                </p>
              </div>
            </div>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="dia" stroke="#666" tick={{ fontSize: 10, fill: '#888' }} />
                  <YAxis stroke="#666" tick={{ fontSize: 10, fill: '#888' }} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '10px' }}
                    formatter={(val: any) => [Number(val).toFixed(4), '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '6px' }} />
                  
                  {/* Baseline reference */}
                  <Line 
                    type="monotone" 
                    dataKey="baseM0" 
                    name="Línea Base As-Is (M₀)" 
                    stroke="#888" 
                    strokeDasharray="4 4" 
                    strokeWidth={1.5}
                    dot={false}
                  />

                  {/* Without intervention */}
                  <Line 
                    type="monotone" 
                    dataKey="sinIntervencion" 
                    name="Sin Intervención (Degradación)" 
                    stroke="#FF4D4D" 
                    strokeWidth={2.2}
                    dot={{ r: 3, fill: '#FF4D4D' }}
                  />

                  {/* With resilience */}
                  <Line 
                    type="monotone" 
                    dataKey="conResiliencia" 
                    name="Con Paquete de Resiliencia" 
                    stroke="#00FFC2" 
                    strokeWidth={2.4}
                    dot={{ r: 4, fill: '#00FFC2' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-2.5 rounded bg-[#141416] border border-[#222] flex items-center justify-between text-[11px]">
            <div>
              <span className="text-[#8E9299] block">IPM Proyectado a 180 días:</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-base font-bold ${isResilienceActive ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                  M₀ = {chartData[chartData.length - 1]?.conResiliencia}
                </span>
                <span className="text-[10px] text-[#8E9299]">
                  ({isResilienceActive ? 'Protegido con Resiliencia' : 'Crítico sin intervención'})
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[#8E9299] block">Familias Protegidas:</span>
              <span className="text-base font-bold text-white">
                {isResilienceActive ? '~48,500' : '0'} hogares
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
