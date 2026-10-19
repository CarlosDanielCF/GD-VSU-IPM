import React, { useState } from 'react';
import { NeighborhoodAlert, NeighborhoodCell } from '../../types';
import { 
  AlertTriangle, 
  Clock, 
  ShieldAlert, 
  Lightbulb, 
  Sliders, 
  TrendingUp, 
  Compass, 
  CheckCircle,
  Flame,
  Building
} from 'lucide-react';

interface EarlyWarningPanelProps {
  alerts3m: NeighborhoodAlert[];
  alerts6m: NeighborhoodAlert[];
  alerts12m: NeighborhoodAlert[];
  sensitivityAnalysis: {
    dimension: string;
    mejoraPct: number;
    reduccionIPM_Pct: number;
    elasticidad: number;
    eficienciaInversion: string;
  }[];
  onSelectNeighborhoodById: (barrioId: string) => void;
}

export const EarlyWarningPanel: React.FC<EarlyWarningPanelProps> = ({
  alerts3m,
  alerts6m,
  alerts12m,
  sensitivityAnalysis,
  onSelectNeighborhoodById
}) => {
  const [selectedHorizon, setSelectedHorizon] = useState<'3m' | '6m' | '12m'>('6m');

  const currentAlerts = selectedHorizon === '3m' ? alerts3m : (selectedHorizon === '6m' ? alerts6m : alerts12m);

  return (
    <div className="space-y-5 font-mono">
      
      {/* Header & Horizon Selector */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <AlertTriangle className="w-4 h-4 text-[#FF4D4D]" />
            Sistema de Alerta Temprana & Radar de Vulnerabilidad
          </h2>
          <p className="text-[10px] text-[#8E9299] mt-0.5">
            Detección anticipada de barrios con alta probabilidad de caer en trampas de pobreza estructural a 3, 6 y 12 meses.
          </p>
        </div>

        {/* Horizon Tabs */}
        <div className="flex items-center bg-[#0A0A0B] p-1 rounded-sm border border-[#2A2A2E]">
          <button
            onClick={() => setSelectedHorizon('3m')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              selectedHorizon === '3m' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Horizonte 3M
          </button>
          <button
            onClick={() => setSelectedHorizon('6m')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              selectedHorizon === '6m' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Horizonte 6M
          </button>
          <button
            onClick={() => setSelectedHorizon('12m')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              selectedHorizon === '12m' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Horizonte 12M
          </button>
        </div>
      </div>

      {/* Main Grid: Alerts List & Sensitivity Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left: Ranked High-Risk Neighborhoods (2 Columns) */}
        <div className="lg:col-span-2 bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E] mb-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-tight">
              <ShieldAlert className="w-3.5 h-3.5 text-[#FF4D4D]" />
              Ranking de Barrios con Riesgo Crítico ({selectedHorizon.toUpperCase()})
            </h3>
            <span className="text-[10px] text-[#FF4D4D] font-mono">
              {currentAlerts.filter(a => a.ipmProyectado >= 0.40).length} ZONAS EN SEMÁFORO ROJO
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {currentAlerts.slice(0, 10).map((alert, idx) => (
              <div
                key={alert.barrioId}
                onClick={() => onSelectNeighborhoodById(alert.barrioId)}
                className="p-3 rounded-sm bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] hover:border-[#00FFC2] transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-sm bg-[#1E1114] text-[#FF4D4D] font-bold font-mono text-[10px] flex items-center justify-center border border-[#521C24]">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white hover:text-[#00FFC2] transition-colors">
                        {alert.nombre}
                      </h4>
                      <span className="text-[10px] text-[#8E9299]">{alert.distrito}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[9px] text-[#8E9299] uppercase">IPM PROYECTADO</div>
                    <div className="font-mono text-sm font-bold text-[#FF4D4D]">
                      {alert.ipmProyectado.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {alert.factoresClaveRiesgo.map((factor, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-1.5 py-0.5 rounded-sm text-[9px] font-mono bg-[#1E1114] text-[#FF4D4D] border border-[#521C24]"
                    >
                      {factor}
                    </span>
                  ))}
                </div>

                {/* Recommendation */}
                <div className="mt-2 pt-2 border-t border-[#2A2A2E] flex items-start space-x-1.5 text-[10px] text-[#8E9299]">
                  <Lightbulb className="w-3 h-3 text-[#FFAA00] shrink-0 mt-0.5" />
                  <p className="text-[10px] font-sans">
                    <strong className="text-[#FFAA00] font-mono">RECOMENDACIÓN:</strong> {alert.recomendacionPolitica}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: What-If Sensitivity Analysis */}
        <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="pb-3 border-b border-[#2A2A2E] mb-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-tight">
                <Sliders className="w-3.5 h-3.5 text-[#00FFC2]" />
                Análisis de Sensibilidad ("What-If")
              </h3>
              <p className="text-[10px] text-[#8E9299] mt-0.5">
                Elasticidad del IPM ante mejora del 10% en cada dimensión Alkire-Foster.
              </p>
            </div>

            <div className="space-y-2.5">
              {sensitivityAnalysis.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-sm bg-[#141416] border border-[#2A2A2E]">
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="font-bold text-white">{item.dimension}</span>
                    <span className="font-mono text-[#00FFC2] font-bold">-{item.reduccionIPM_Pct}% IPM</span>
                  </div>
                  
                  {/* Progress bar representing elasticity */}
                  <div className="w-full h-1 bg-[#1A1A1D] rounded-none overflow-hidden my-1">
                    <div 
                      className="h-full bg-[#00FFC2]"
                      style={{ width: `${Math.min(100, item.elasticidad * 350)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-[#8E9299]">
                    <span>ELASTICIDAD: <strong className="text-white font-mono">{item.elasticidad}</strong></span>
                    <span className="text-[#00FFC2] font-mono">{item.eficienciaInversion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-sm bg-[#0D221D] border border-[#184E42] text-[10px] text-[#00FFC2] font-mono">
            <strong>HALLAZGO CLAVE:</strong> Formalización laboral y empleo temporal generan la mayor elasticidad (-2.8% por cada 10% de mejora), actuando como multiplicador amortiguador.
          </div>
        </div>

      </div>

    </div>
  );
};
