import React from 'react';
import { AlkireFosterResult, NeighborhoodCell } from '../../types';
import { 
  Users, 
  AlertOctagon, 
  Scale, 
  BarChart3,
  Percent,
  Activity
} from 'lucide-react';

interface OverviewKPIsProps {
  afResult: AlkireFosterResult;
  neighborhoods: NeighborhoodCell[];
  currentYear: number;
  isSimulatedHorizon: boolean;
}

export const OverviewKPIs: React.FC<OverviewKPIsProps> = ({
  afResult,
  neighborhoods,
  currentYear,
  isSimulatedHorizon
}) => {
  const redAlertCount = neighborhoods.filter(n => n.nivelAlerta === 'critica_roja').length;
  const highAlertCount = neighborhoods.filter(n => n.nivelAlerta === 'alta').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      
      {/* 1. IPM Metropolitano (M0) */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">IPM Global (M₀)</p>
          <BarChart3 className="w-3.5 h-3.5 text-[#00FFC2]" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#00FFC2] tracking-tight">
            {afResult.M0.toFixed(4)}
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">H × A</span>
        </div>
        <p className="mt-1 text-[9px] text-[#8E9299] font-mono uppercase tracking-wider">
          Alkire-Foster (k=0.33)
        </p>
      </div>

      {/* 2. Incidencia de Pobreza (H) */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#38BDF8] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">Incidencia (H)</p>
          <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#E0E0E0]">
            {(afResult.H * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">
            {afResult.poorHouseholdsCount.toLocaleString()} hog.
          </span>
        </div>
        <p className="mt-1 text-[9px] text-[#8E9299] font-mono uppercase tracking-wider">
          Hogares pobres
        </p>
      </div>

      {/* 3. Intensidad Media de Privación (A) */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#FFAA00] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">Intensidad (A)</p>
          <Percent className="w-3.5 h-3.5 text-[#FFAA00]" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#FFAA00]">
            {(afResult.A * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">avg_depr</span>
        </div>
        <p className="mt-1 text-[9px] text-[#8E9299] font-mono uppercase tracking-wider">
          Privación simultánea
        </p>
      </div>

      {/* 4. Pobreza Extrema */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">Pobreza Extrema</p>
          <AlertOctagon className="w-3.5 h-3.5 text-[#FF4D4D]" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#FF4D4D]">
            {(afResult.extremePovertyRate * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">c ≥ 0.50</span>
        </div>
        <p className="mt-1 text-[9px] text-[#FF4D4D] font-mono uppercase tracking-wider">
          {afResult.extremePoorHouseholdsCount.toLocaleString()} hog. críticos
        </p>
      </div>

      {/* 5. Barrios en Alerta Crítica */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">Alertas Críticas</p>
          <span className="w-2 h-2 rounded-full bg-[#FF4D4D] animate-ping"></span>
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#FF4D4D]">
            {redAlertCount}
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">/ {neighborhoods.length} sectores</span>
        </div>
        <p className="mt-1 text-[9px] text-[#FFAA00] font-mono uppercase tracking-wider">
          +{highAlertCount} alerta alta
        </p>
      </div>

      {/* 6. Desigualdad & Gini Espacial */}
      <div className="bg-[#1A1A1D] border border-[#2A2A2E] border-l-2 border-l-[#A855F7] rounded-sm p-3 flex flex-col justify-between shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest">Gini Espacial</p>
          <Scale className="w-3.5 h-3.5 text-[#A855F7]" />
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-xl font-bold font-mono text-[#A855F7]">
            {afResult.giniCoefficient.toFixed(3)}
          </span>
          <span className="text-[10px] text-[#8E9299] font-mono">desig.</span>
        </div>
        <p className="mt-1 text-[9px] text-[#8E9299] font-mono uppercase tracking-wider">
          Brecha género: 1.38x
        </p>
      </div>

    </div>
  );
};

