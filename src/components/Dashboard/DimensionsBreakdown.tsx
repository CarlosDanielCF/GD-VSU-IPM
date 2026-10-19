import React from 'react';
import { AlkireFosterResult, NeighborhoodCell } from '../../types';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { PieChart, BookOpen, HeartPulse, Briefcase, Home, Wifi, CheckCircle2, XCircle } from 'lucide-react';

interface DimensionsBreakdownProps {
  afResult: AlkireFosterResult;
  selectedNeighborhood: NeighborhoodCell | null;
}

export const DimensionsBreakdown: React.FC<DimensionsBreakdownProps> = ({
  afResult,
  selectedNeighborhood
}) => {
  // Radar data format for Recharts
  const radarData = [
    {
      dimension: 'Educación',
      ciudad: Number((afResult.censoredDimensionalHeadcounts.educacion * 100).toFixed(1)),
      barrio: selectedNeighborhood 
        ? Number((selectedNeighborhood.contribucionDimensiones.educacion * 100).toFixed(1)) 
        : Number((afResult.censoredDimensionalHeadcounts.educacion * 100).toFixed(1)),
      fullMark: 100
    },
    {
      dimension: 'Salud',
      ciudad: Number((afResult.censoredDimensionalHeadcounts.salud * 100).toFixed(1)),
      barrio: selectedNeighborhood 
        ? Number((selectedNeighborhood.contribucionDimensiones.salud * 100).toFixed(1)) 
        : Number((afResult.censoredDimensionalHeadcounts.salud * 100).toFixed(1)),
      fullMark: 100
    },
    {
      dimension: 'Trabajo / Empleo',
      ciudad: Number((afResult.censoredDimensionalHeadcounts.trabajo * 100).toFixed(1)),
      barrio: selectedNeighborhood 
        ? Number((selectedNeighborhood.contribucionDimensiones.trabajo * 100).toFixed(1)) 
        : Number((afResult.censoredDimensionalHeadcounts.trabajo * 100).toFixed(1)),
      fullMark: 100
    },
    {
      dimension: 'Vivienda & Servicios',
      ciudad: Number((afResult.censoredDimensionalHeadcounts.vivienda_servicios * 100).toFixed(1)),
      barrio: selectedNeighborhood 
        ? Number((selectedNeighborhood.contribucionDimensiones.vivienda_servicios * 100).toFixed(1)) 
        : Number((afResult.censoredDimensionalHeadcounts.vivienda_servicios * 100).toFixed(1)),
      fullMark: 100
    },
    {
      dimension: 'Activos & Redes TIC',
      ciudad: Number((afResult.censoredDimensionalHeadcounts.activos_redes * 100).toFixed(1)),
      barrio: selectedNeighborhood 
        ? Number((selectedNeighborhood.contribucionDimensiones.activos_redes * 100).toFixed(1)) 
        : Number((afResult.censoredDimensionalHeadcounts.activos_redes * 100).toFixed(1)),
      fullMark: 100
    }
  ];

  // Pareto Contribution data
  const paretoData = [
    { name: 'Trabajo (Informalidad)', contrib: afResult.dimensionalContributionsPct.trabajo, color: '#f59e0b' },
    { name: 'Vivienda y Servicios', contrib: afResult.dimensionalContributionsPct.vivienda_servicios, color: '#ef4444' },
    { name: 'Salud y Gasto Catastrófico', contrib: afResult.dimensionalContributionsPct.salud, color: '#ec4899' },
    { name: 'Educación y Rezago', contrib: afResult.dimensionalContributionsPct.educacion, color: '#3b82f6' },
    { name: 'Activos y Redes Digitales', contrib: afResult.dimensionalContributionsPct.activos_redes, color: '#8b5cf6' }
  ].sort((a, b) => b.contrib - a.contrib);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* 1. Radar Multidimensional Alkire-Foster */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 tracking-tight">
              <PieChart className="w-3.5 h-3.5 text-[#00FFC2]" />
              Descomposición por 5 Dimensiones Alkire-Foster
            </h3>
            <p className="text-[10px] text-[#8E9299] font-mono">
              {selectedNeighborhood ? `COMP: ${selectedNeighborhood.nombre} vs. METROPOLITANO` : 'Tasa de privación censurada promedio por dimensión'}
            </p>
          </div>
        </div>

        <div className="h-64 w-full font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#2A2A2E" />
              <PolarAngleAxis dataKey="dimension" stroke="#8E9299" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <PolarRadiusAxis angle={30} domain={[0, 60]} stroke="#3A3A3F" tick={{ fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              
              <Radar
                name="Promedio Ciudad"
                dataKey="ciudad"
                stroke="#00FFC2"
                fill="#00FFC2"
                fillOpacity={0.2}
              />

              {selectedNeighborhood && (
                <Radar
                  name={selectedNeighborhood.nombre}
                  dataKey="barrio"
                  stroke="#FF4D4D"
                  fill="#FF4D4D"
                  fillOpacity={0.35}
                />
              )}
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#111113', borderColor: '#2A2A2E', borderRadius: '2px', color: '#E0E0E0', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                formatter={(val: number) => [`${val}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#8E9299', fontFamily: 'JetBrains Mono' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Gráfico de Pareto: Contribución al IPM */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 tracking-tight">
              <Briefcase className="w-3.5 h-3.5 text-[#FFAA00]" />
              Contribución Porcentual al IPM (Pareto: C_j)
            </h3>
            <p className="text-[10px] text-[#8E9299] font-mono">
              Distribución de peso causal sobre el índice global M0
            </p>
          </div>
        </div>

        <div className="h-64 w-full font-mono">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paretoData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#2A2A2E" horizontal={false} />
              <XAxis type="number" domain={[0, 40]} stroke="#8E9299" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis type="category" dataKey="name" stroke="#8E9299" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111113', borderColor: '#2A2A2E', borderRadius: '2px', color: '#E0E0E0', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                formatter={(value: number) => [`${value}% del IPM total`, 'Contribución']}
              />
              <Bar dataKey="contrib" radius={[0, 2, 2, 0]} fill="#00FFC2" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
