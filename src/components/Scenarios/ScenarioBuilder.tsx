import React from 'react';
import { ShockScenario, PolicyScenario, SimulationConfig, NeighborhoodCell } from '../../types';
import { 
  Sliders, 
  Flame, 
  ShieldCheck, 
  DollarSign, 
  Zap, 
  AlertTriangle, 
  Play, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  Building,
  HeartPulse,
  Home
} from 'lucide-react';

interface ScenarioBuilderProps {
  shocks: ShockScenario[];
  policies: PolicyScenario[];
  neighborhoods: NeighborhoodCell[];
  onToggleShock: (shockId: string) => void;
  onUpdateShockMagnitud: (shockId: string, magnitud: number) => void;
  onTogglePolicy: (policyId: string) => void;
  onUpdatePolicyBudget: (policyId: string, budget: number) => void;
  onApplyPreset: (presetType: 'shock_crisis' | 'policy_package' | 'ods_eradication') => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({
  shocks,
  policies,
  neighborhoods,
  onToggleShock,
  onUpdateShockMagnitud,
  onTogglePolicy,
  onUpdatePolicyBudget,
  onApplyPreset,
  onRunSimulation,
  isSimulating
}) => {
  const totalPolicyBudget = policies
    .filter(p => p.activo)
    .reduce((acc, p) => acc + p.presupuestoMillonesUSD, 0);

  const activeShocksCount = shocks.filter(s => s.activo).length;
  const activePoliciesCount = policies.filter(p => p.activo).length;

  return (
    <div className="space-y-5 font-mono">
      
      {/* Header & Presets Bar */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <Sliders className="w-4 h-4 text-[#00FFC2]" />
            Configuración de Choques Exógenos y Políticas Públicas
          </h2>
          <p className="text-[10px] text-[#8E9299] mt-0.5">
            Definición de parámetros macroeconómicos, climáticos y de intervención social para inyección ABM.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onApplyPreset('shock_crisis')}
            className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#1E1114] hover:bg-[#2E151A] text-[#FF4D4D] border border-[#521C24] transition-colors flex items-center gap-1.5"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Preset: Crisis & Choque</span>
          </button>

          <button
            onClick={() => onApplyPreset('policy_package')}
            className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#0D221D] hover:bg-[#13332B] text-[#00FFC2] border border-[#184E42] transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Preset: Paquete de Protección</span>
          </button>

          <button
            onClick={() => onApplyPreset('ods_eradication')}
            className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#1B1228] hover:bg-[#281A3C] text-[#C084FC] border border-[#48286E] transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset: Meta ODS 1 (2030)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Shocks Column vs Policies Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left: Choques Externos (ShockAgent) */}
        <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E] mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-sm bg-[#1E1114] text-[#FF4D4D] border border-[#521C24]">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tight">Inyección de Choques Exógenos</h3>
                  <span className="text-[10px] text-[#FF4D4D] font-mono">{activeShocksCount} CHOQUES ACTIVOS</span>
                </div>
              </div>
            </div>

            {/* Shock Cards */}
            <div className="space-y-3">
              {shocks.map(shock => (
                <div 
                  key={shock.id}
                  className={`p-3 rounded-sm border transition-all ${
                    shock.activo 
                      ? 'bg-[#141416] border-l-2 border-l-[#FF4D4D] border-t-[#2A2A2E] border-r-[#2A2A2E] border-b-[#2A2A2E]' 
                      : 'bg-[#0A0A0B] border-[#2A2A2E] opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        checked={shock.activo}
                        onChange={() => onToggleShock(shock.id)}
                        className="mt-0.5 w-3.5 h-3.5 rounded-sm text-[#FF4D4D] bg-[#1A1A1D] border-[#2A2A2E] focus:ring-0 accent-[#FF4D4D] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{shock.nombre}</span>
                        <p className="text-[10px] text-[#8E9299] mt-0.5 leading-relaxed font-sans">{shock.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  {shock.activo && (
                    <div className="mt-3 pt-2.5 border-t border-[#2A2A2E] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8E9299]">Intensidad del Choque:</span>
                        <span className="font-mono text-[#FF4D4D] font-bold">{(shock.magnitud * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min={0.05}
                        max={0.60}
                        step={0.05}
                        value={shock.magnitud}
                        onChange={(e) => onUpdateShockMagnitud(shock.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1A1A1D] rounded-sm appearance-none cursor-pointer accent-[#FF4D4D]"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-[#8E9299]">
                        <span>Moderado (+5%)</span>
                        <span>Severo (+60%)</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Políticas Públicas (PolicyAgent) */}
        <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E] mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-sm bg-[#0D221D] text-[#00FFC2] border border-[#184E42]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-tight">Paquetes de Políticas Públicas</h3>
                  <span className="text-[10px] text-[#00FFC2] font-mono">
                    {activePoliciesCount} ACTIVAS · PPTO: ${totalPolicyBudget.toFixed(1)}M USD
                  </span>
                </div>
              </div>
            </div>

            {/* Policy Cards */}
            <div className="space-y-3">
              {policies.map(policy => (
                <div 
                  key={policy.id}
                  className={`p-3 rounded-sm border transition-all ${
                    policy.activo 
                      ? 'bg-[#141416] border-l-2 border-l-[#00FFC2] border-t-[#2A2A2E] border-r-[#2A2A2E] border-b-[#2A2A2E]' 
                      : 'bg-[#0A0A0B] border-[#2A2A2E] opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2.5">
                      <input
                        type="checkbox"
                        checked={policy.activo}
                        onChange={() => onTogglePolicy(policy.id)}
                        className="mt-0.5 w-3.5 h-3.5 rounded-sm text-[#00FFC2] bg-[#1A1A1D] border-[#2A2A2E] focus:ring-0 accent-[#00FFC2] cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">{policy.nombre}</span>
                        <p className="text-[10px] text-[#8E9299] mt-0.5 leading-relaxed font-sans">{policy.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  {policy.activo && (
                    <div className="mt-3 pt-2.5 border-t border-[#2A2A2E] space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#8E9299]">Presupuesto Asignado:</span>
                        <span className="font-mono text-[#00FFC2] font-bold">${policy.presupuestoMillonesUSD.toFixed(1)}M USD</span>
                      </div>
                      <input
                        type="range"
                        min={1.0}
                        max={50.0}
                        step={1.0}
                        value={policy.presupuestoMillonesUSD}
                        onChange={(e) => onUpdatePolicyBudget(policy.id, Number(e.target.value))}
                        className="w-full h-1.5 bg-[#1A1A1D] rounded-sm appearance-none cursor-pointer accent-[#00FFC2]"
                      />
                      <div className="flex items-center justify-between text-[9px] text-[#8E9299]">
                        <span>FOCALIZACIÓN: <strong className="text-white">{policy.criterioFocalizacion.replace('_', ' ')}</strong></span>
                        <span>META: <strong className="text-white">{policy.hogaresMetaCount.toLocaleString()} HOGARES</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Execution Action Footer */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex items-center justify-between">
        <div className="text-[11px] text-[#8E9299]">
          <span className="font-bold text-white block mb-0.5 uppercase tracking-wide">LISTO PARA SIMULAR EN EL GEMELO DIGITAL:</span>
          Simula 10,000 agentes sintéticos en horizonte trimestral 2024-2030 con calibración genética DEAP.
        </div>

        <button
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="px-5 py-2.5 rounded-sm font-mono font-bold text-xs uppercase tracking-wider bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] border border-[#00FFC2] flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'Simulando Agentes...' : 'Ejecutar Simulación ABM'}</span>
        </button>
      </div>

    </div>
  );
};
