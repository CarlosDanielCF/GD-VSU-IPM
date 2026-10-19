import React from 'react';
import { AlkireFosterResult, SimulationStepResult } from '../../types';
import { ArrowRight, ArrowLeftRight, TrendingUp, TrendingDown, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface SankeyTransitionsProps {
  afResult: AlkireFosterResult;
  lastStepResult?: SimulationStepResult;
}

export const SankeyTransitions: React.FC<SankeyTransitionsProps> = ({
  afResult,
  lastStepResult
}) => {
  const transitions = lastStepResult?.transicionesPobreza || {
    noPobreToVulnerable: 42,
    vulnerableToPobre: 28,
    pobreToExtremo: 14,
    extremoToPobre: 19,
    pobreToVulnerable: 35,
    vulnerableToNoPobre: 51
  };

  const nonPoorPct = (afResult.nonPoorRate * 100).toFixed(1);
  const vulnerablePct = (afResult.vulnerableRate * 100).toFixed(1);
  const moderatePoorPct = ((afResult.H - afResult.extremePovertyRate) * 100).toFixed(1);
  const extremePoorPct = (afResult.extremePovertyRate * 100).toFixed(1);

  return (
    <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md font-mono">
      
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-tight">
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#00FFC2]" />
            Flujos y Matriz de Transición de Pobreza (ABM Micro Dynamics)
          </h3>
          <p className="text-[10px] text-[#8E9299]">
            Movilidad dinámica de agentes entre estratos del Índice de Pobreza Multidimensional
          </p>
        </div>

        <span className="text-[10px] font-mono text-[#00FFC2] bg-[#1A1A1D] px-2 py-0.5 rounded-sm border border-[#2A2A2E]">
          AGENTES: {afResult.totalHouseholds.toLocaleString()}
        </span>
      </div>

      {/* Categories Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        
        {/* 1. No Pobre */}
        <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] rounded-sm p-3 text-center shadow-sm">
          <div className="text-[9px] font-bold text-[#00FFC2] uppercase tracking-widest mb-1">1. NO POBRE</div>
          <div className="text-xl font-bold font-mono text-white">{nonPoorPct}%</div>
          <div className="text-[9px] text-[#8E9299] mt-1 font-mono">c &lt; 0.20</div>
        </div>

        {/* 2. Vulnerable */}
        <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FFAA00] rounded-sm p-3 text-center shadow-sm">
          <div className="text-[9px] font-bold text-[#FFAA00] uppercase tracking-widest mb-1">2. VULNERABLE</div>
          <div className="text-xl font-bold font-mono text-white">{vulnerablePct}%</div>
          <div className="text-[9px] text-[#8E9299] mt-1 font-mono">0.20 ≤ c &lt; 0.33</div>
        </div>

        {/* 3. Pobre Moderado */}
        <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FF8800] rounded-sm p-3 text-center shadow-sm">
          <div className="text-[9px] font-bold text-[#FF8800] uppercase tracking-widest mb-1">3. POBRE MODERADO</div>
          <div className="text-xl font-bold font-mono text-white">{moderatePoorPct}%</div>
          <div className="text-[9px] text-[#8E9299] mt-1 font-mono">0.33 ≤ c &lt; 0.50</div>
        </div>

        {/* 4. Pobre Extremo */}
        <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] rounded-sm p-3 text-center shadow-sm">
          <div className="text-[9px] font-bold text-[#FF4D4D] uppercase tracking-widest mb-1">4. POBRE EXTREMO</div>
          <div className="text-xl font-bold font-mono text-white">{extremePoorPct}%</div>
          <div className="text-[9px] text-[#FF4D4D] mt-1 font-mono">c ≥ 0.50 (CRÍTICO)</div>
        </div>

      </div>

      {/* Transition Flows Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#0A0A0B] p-3 rounded-sm border border-[#2A2A2E] text-xs">
        
        {/* Deterioro / Caída */}
        <div className="space-y-1.5">
          <div className="font-bold text-[10px] text-[#FF4D4D] flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingDown className="w-3.5 h-3.5" />
            Flujos de Deterioro & Choque (Entrada a Pobreza):
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">No Pobre → Vulnerable</span>
            <span className="font-mono text-[#FF4D4D] font-bold">+{transitions.noPobreToVulnerable} ag.</span>
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">Vulnerable → Pobre</span>
            <span className="font-mono text-[#FF4D4D] font-bold">+{transitions.vulnerableToPobre} ag.</span>
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">Pobre Moderado → Extremo</span>
            <span className="font-mono text-[#FF4D4D] font-bold">+{transitions.pobreToExtremo} ag.</span>
          </div>
        </div>

        {/* Recuperación / Salida */}
        <div className="space-y-1.5">
          <div className="font-bold text-[10px] text-[#00FFC2] flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            Flujos de Salida de Pobreza (Efecto Políticas):
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">Pobre Extremo → Moderado</span>
            <span className="font-mono text-[#00FFC2] font-bold">+{transitions.extremoToPobre} ag.</span>
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">Pobre → Vulnerable</span>
            <span className="font-mono text-[#00FFC2] font-bold">+{transitions.pobreToVulnerable} ag.</span>
          </div>
          <div className="flex justify-between items-center bg-[#141416] px-2.5 py-1.5 rounded-sm border border-[#2A2A2E]">
            <span className="text-[#8E9299] text-[11px]">Vulnerable → No Pobre</span>
            <span className="font-mono text-[#00FFC2] font-bold">+{transitions.vulnerableToNoPobre} ag.</span>
          </div>
        </div>

      </div>

    </div>
  );
};
