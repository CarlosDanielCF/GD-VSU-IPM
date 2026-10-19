import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  History, 
  Compass, 
  Sparkles,
  Activity
} from 'lucide-react';

interface TimeTravelSliderProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  minYear?: number;
  maxYear?: number;
}

export const TimeTravelSlider: React.FC<TimeTravelSliderProps> = ({
  currentYear,
  onYearChange,
  minYear = 2010,
  maxYear = 2030
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1000); // ms per step

  // Auto playback loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        onYearChange(prev => {
          if (prev >= maxYear) {
            setIsPlaying(false);
            return maxYear;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, maxYear, onYearChange]);

  const milestones: Record<number, { title: string; type: 'shock' | 'policy' | 'calibration'; desc: string }> = {
    2018: { title: 'Shock Inflacionario Regional', type: 'shock', desc: 'Aumento del 12% en canasta básica' },
    2020: { title: 'Pandemia COVID-19', type: 'shock', desc: 'Restricciones de movilidad urbana y parálisis informal' },
    2023: { title: 'Fenómeno El Niño Costero', type: 'shock', desc: 'Lluvias intensas e inundaciones en laderas' },
    2024: { title: 'Línea Base / Calibración DEAP', type: 'calibration', desc: 'Línea de base del Gemelo Digital' },
    2027: { title: 'Meta ODS 1 (Proyección ABM)', type: 'policy', desc: 'Horizonte prospectivo de políticas' }
  };

  const isProspective = currentYear > 2024;

  return (
    <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md">
      
      {/* Header & Mode Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-[#00FFC2]" />
          <h2 className="text-[10px] text-[#8E9299] uppercase font-bold tracking-widest">
            Línea de Tiempo del Gemelo Digital (ABM Timeline)
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          {isProspective ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-[#1A1A1D] text-[#00FFC2] border border-[#00FFC2]/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] mr-1.5 animate-pulse"></span>
              PROYECCIÓN PROSPECTIVA ABM (2025-2030)
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-[#1A1A1D] text-[#38BDF8] border border-[#38BDF8]/40">
              <Compass className="w-3 h-3 mr-1" />
              SERIE HISTÓRICA ENAHO (2010-2024)
            </span>
          )}
        </div>
      </div>

      {/* Main Slider Track */}
      <div className="relative my-3 px-1">
        <input
          type="range"
          min={minYear}
          max={maxYear}
          step={1}
          value={currentYear}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="w-full h-1.5 bg-[#2A2A2E] rounded-none appearance-none cursor-pointer accent-[#00FFC2] focus:outline-none"
        />

        {/* Year Ticks */}
        <div className="flex justify-between text-[10px] font-mono text-[#8E9299] mt-1.5">
          <span>2010</span>
          <span>2014</span>
          <span className="text-[#FFAA00]">2018 (Shock)</span>
          <span className="text-[#FF4D4D] font-bold">2020 (COVID)</span>
          <span className="text-[#00FFC2] font-bold">2024 (Base)</span>
          <span>2027</span>
          <span className="text-[#00FFC2]">2030 (ODS)</span>
        </div>
      </div>

      {/* Controller Controls & Milestone Callout */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#2A2A2E]">
        
        {/* Playback Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onYearChange(Math.max(minYear, currentYear - 1))}
            className="p-1.5 rounded-sm bg-[#1A1A1D] hover:border-[#00FFC2] border border-[#3A3A3F] text-[#E0E0E0] transition-colors"
            title="Año Anterior"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-sm text-xs font-mono font-bold tracking-tight uppercase transition-all ${
              isPlaying
                ? 'bg-[#FFAA00] text-[#0A0A0B]'
                : 'bg-[#00FFC2] text-[#0A0A0B] hover:bg-[#00e6af]'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSAR</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>REPRODUCIR</span>
              </>
            )}
          </button>

          <button
            onClick={() => onYearChange(Math.min(maxYear, currentYear + 1))}
            className="p-1.5 rounded-sm bg-[#1A1A1D] hover:border-[#00FFC2] border border-[#3A3A3F] text-[#E0E0E0] transition-colors"
            title="Año Siguiente"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#0A0A0B] p-0.5 rounded-sm border border-[#2A2A2E] ml-2">
            {[1500, 800, 400].map((speed, i) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-none ${
                  playbackSpeed === speed ? 'bg-[#1A1A1D] text-[#00FFC2] font-bold border border-[#00FFC2]/50' : 'text-[#8E9299]'
                }`}
              >
                {i === 0 ? '1x' : i === 1 ? '2x' : '4x'}
              </button>
            ))}
          </div>
        </div>

        {/* Current Year Display & Milestone */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-[9px] text-[#8E9299] uppercase font-bold tracking-widest block">Periodo Activo</span>
            <span className="font-mono text-lg font-bold text-[#00FFC2]">{currentYear}</span>
          </div>

          {/* Milestone Highlight */}
          {milestones[currentYear] && (
            <div className={`text-xs px-2.5 py-1 rounded-sm border flex items-center gap-1.5 font-mono ${
              milestones[currentYear].type === 'shock' ? 'bg-[#1A1A1D] text-[#FF4D4D] border-[#FF4D4D]/50' :
              milestones[currentYear].type === 'calibration' ? 'bg-[#1A1A1D] text-[#00FFC2] border-[#00FFC2]/50' :
              'bg-[#1A1A1D] text-[#00FFC2] border-[#00FFC2]/50'
            }`}>
              <Activity className="w-3.5 h-3.5" />
              <div>
                <span className="font-bold">{milestones[currentYear].title}: </span>
                <span className="text-[11px] opacity-90">{milestones[currentYear].desc}</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

