import React from 'react';
import { NeighborhoodCell, SimulationRunResult, AlkireFosterResult } from '../../types';
import { 
  ArrowRight, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle,
  Building,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

interface ScenarioComparatorProps {
  baselineAF: AlkireFosterResult;
  simulatedAF: AlkireFosterResult;
  lastSimResult: SimulationRunResult | null;
  neighborhoods: NeighborhoodCell[];
}

export const ScenarioComparator: React.FC<ScenarioComparatorProps> = ({
  baselineAF,
  simulatedAF,
  lastSimResult,
  neighborhoods
}) => {
  const deltaM0 = simulatedAF.M0 - baselineAF.M0;
  const deltaM0_pct = baselineAF.M0 > 0 ? (deltaM0 / baselineAF.M0) * 100 : 0;
  const poorDiff = baselineAF.poorHouseholdsCount - simulatedAF.poorHouseholdsCount;

  const comparisonData = [
    {
      indicador: 'IPM (M0)',
      'Línea Base': baselineAF.M0,
      'Escenario ABM': simulatedAF.M0
    },
    {
      indicador: 'Incidencia H (%)',
      'Línea Base': Number((baselineAF.H * 100).toFixed(1)),
      'Escenario ABM': Number((simulatedAF.H * 100).toFixed(1))
    },
    {
      indicador: 'Intensidad A (%)',
      'Línea Base': Number((baselineAF.A * 100).toFixed(1)),
      'Escenario ABM': Number((simulatedAF.A * 100).toFixed(1))
    },
    {
      indicador: 'Pobreza Extrema (%)',
      'Línea Base': Number((baselineAF.extremePovertyRate * 100).toFixed(1)),
      'Escenario ABM': Number((simulatedAF.extremePovertyRate * 100).toFixed(1))
    }
  ];

  const dimensionsDiffData = [
    {
      dimension: 'Educación',
      'Línea Base': Number((baselineAF.censoredDimensionalHeadcounts.educacion * 100).toFixed(1)),
      'Simulado': Number((simulatedAF.censoredDimensionalHeadcounts.educacion * 100).toFixed(1))
    },
    {
      dimension: 'Salud',
      'Línea Base': Number((baselineAF.censoredDimensionalHeadcounts.salud * 100).toFixed(1)),
      'Simulado': Number((simulatedAF.censoredDimensionalHeadcounts.salud * 100).toFixed(1))
    },
    {
      dimension: 'Trabajo',
      'Línea Base': Number((baselineAF.censoredDimensionalHeadcounts.trabajo * 100).toFixed(1)),
      'Simulado': Number((simulatedAF.censoredDimensionalHeadcounts.trabajo * 100).toFixed(1))
    },
    {
      dimension: 'Vivienda',
      'Línea Base': Number((baselineAF.censoredDimensionalHeadcounts.vivienda_servicios * 100).toFixed(1)),
      'Simulado': Number((simulatedAF.censoredDimensionalHeadcounts.vivienda_servicios * 100).toFixed(1))
    },
    {
      dimension: 'Activos/TIC',
      'Línea Base': Number((baselineAF.censoredDimensionalHeadcounts.activos_redes * 100).toFixed(1)),
      'Simulado': Number((simulatedAF.censoredDimensionalHeadcounts.activos_redes * 100).toFixed(1))
    }
  ];

  return (
    <div className="space-y-5 font-mono">
      
      {/* Header Summary */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="w-4 h-4 text-[#00FFC2]" />
              Comparador de Escenarios: Línea Base vs. Paquete Simulado
            </h2>
            <p className="text-[10px] text-[#8E9299] mt-0.5">
              Evaluación de costo-efectividad de políticas públicas e impacto de choques en el gemelo digital.
            </p>
          </div>
        </div>

        {/* Delta Callout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Delta IPM */}
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] border-l-2 border-l-[#00FFC2]">
            <div className="text-[10px] text-[#8E9299] uppercase tracking-wider">Impacto Neto en IPM (M₀)</div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-xl font-bold font-mono ${deltaM0 <= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                {deltaM0 <= 0 ? '' : '+'}{deltaM0.toFixed(4)}
              </span>
              <span className={`text-xs font-mono font-bold ${deltaM0 <= 0 ? 'text-[#00FFC2]' : 'text-[#FF4D4D]'}`}>
                ({deltaM0_pct <= 0 ? '' : '+'}{deltaM0_pct.toFixed(1)}%)
              </span>
            </div>
            <div className="text-[9px] text-[#8E9299] mt-1">
              {deltaM0 <= 0 ? 'Reducción favorable de pobreza' : 'Aumento de vulnerabilidad'}
            </div>
          </div>

          {/* Hogares Impactados */}
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] border-l-2 border-l-[#38BDF8]">
            <div className="text-[10px] text-[#8E9299] uppercase tracking-wider">Hogares Salidos de Pobreza</div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#38BDF8]">
                {poorDiff > 0 ? poorDiff.toLocaleString() : 0}
              </span>
              <span className="text-[10px] text-[#8E9299]">hogares</span>
            </div>
            <div className="text-[9px] text-[#8E9299] mt-1">
              Superaron umbral k=0.33
            </div>
          </div>

          {/* Costo Efectividad */}
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] border-l-2 border-l-[#FFAA00]">
            <div className="text-[10px] text-[#8E9299] uppercase tracking-wider">Costo por Hogar Salido</div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#FFAA00]">
                ${lastSimResult?.resumenImpacto.costoEfectividadUSDporHogar || 850}
              </span>
              <span className="text-[10px] text-[#8E9299]">USD/hogar</span>
            </div>
            <div className="text-[9px] text-[#8E9299] mt-1">
              Eficiencia de inversión social
            </div>
          </div>

          {/* Reducción en Barrios Críticos */}
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] border-l-2 border-l-[#00FFC2]">
            <div className="text-[10px] text-[#8E9299] uppercase tracking-wider">Barrios en Alerta Roja</div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold font-mono text-[#00FFC2]">
                {lastSimResult?.resumenImpacto.barriosEnAlertaRojaFinal || 0}
              </span>
              <span className="text-[10px] text-[#8E9299]">
                (INICIAL: {lastSimResult?.resumenImpacto.barriosEnAlertaRojaInicial || 8})
              </span>
            </div>
            <div className="text-[9px] text-[#8E9299] mt-1">
              Desactivación de trampas de pobreza
            </div>
          </div>

        </div>
      </div>

      {/* Side by Side Dimensional Shifts */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md">
        <h3 className="text-xs font-bold text-white uppercase tracking-tight mb-1">
          Comparativa de Privaciones por Dimensión Alkire-Foster
        </h3>
        <p className="text-[10px] text-[#8E9299] mb-4">
          Tasa de privación censurada antes vs. después de la intervención de políticas y choques.
        </p>

        <div className="h-72 w-full font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dimensionsDiffData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2E" />
              <XAxis dataKey="dimension" stroke="#8E9299" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#8E9299" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111113', borderColor: '#2A2A2E', borderRadius: '2px', color: '#E0E0E0', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                formatter={(val: number) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="Línea Base" fill="#3A3A3F" radius={[2, 2, 0, 0]} />
              <Bar dataKey="Simulado" fill="#00FFC2" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
