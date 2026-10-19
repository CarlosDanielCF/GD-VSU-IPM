import React, { useState, useMemo } from 'react';
import { HouseholdAgent, NeighborhoodCell, IPMIndicators } from '../../types';
import { 
  Users, 
  Home, 
  Droplets, 
  Zap, 
  GraduationCap, 
  Heart, 
  Briefcase, 
  Wifi, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Sparkles, 
  X, 
  Search, 
  ArrowRight,
  TrendingDown,
  Building2,
  DollarSign
} from 'lucide-react';

interface MicroAgentInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  households: HouseholdAgent[];
  neighborhoods: NeighborhoodCell[];
  selectedNeighborhood: NeighborhoodCell | null;
}

export const MicroAgentInspectorModal: React.FC<MicroAgentInspectorModalProps> = ({
  isOpen,
  onClose,
  households,
  neighborhoods,
  selectedNeighborhood
}) => {
  const [filterBarrioId, setFilterBarrioId] = useState<string>(selectedNeighborhood?.id || '');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'POOR' | 'NON_POOR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('');

  // Counterfactual sandbox state on the inspected agent
  const [counterfactualOverrides, setCounterfactualOverrides] = useState<{
    aguaSaneamiento: boolean;
    empleoFormal: boolean;
    asistenciaEscolar: boolean;
    accesoSalud: boolean;
    internetTIC: boolean;
  }>({
    aguaSaneamiento: false,
    empleoFormal: false,
    asistenciaEscolar: false,
    accesoSalud: false,
    internetTIC: false
  });

  // Filter households
  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      if (filterBarrioId && h.barrioId !== filterBarrioId) return false;
      if (filterStatus === 'POOR' && !h.esPobreMultidimensional) return false;
      if (filterStatus === 'NON_POOR' && h.esPobreMultidimensional) return false;
      if (searchQuery && !h.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).slice(0, 100); // take first 100 for snappy performance
  }, [households, filterBarrioId, filterStatus, searchQuery]);

  // Selected agent
  const activeAgent = useMemo(() => {
    if (selectedHouseholdId) {
      const found = households.find(h => h.id === selectedHouseholdId);
      if (found) return found;
    }
    return filteredHouseholds[0] || households[0];
  }, [households, selectedHouseholdId, filteredHouseholds]);

  // Reset counterfactual when switching agent
  const handleSelectAgent = (agentId: string) => {
    setSelectedHouseholdId(agentId);
    setCounterfactualOverrides({
      aguaSaneamiento: false,
      empleoFormal: false,
      asistenciaEscolar: false,
      accesoSalud: false,
      internetTIC: false
    });
  };

  if (!isOpen) return null;

  // Compute counterfactual deprivation score c_i for this household
  // Alkire-Foster indicators weights:
  // Educación (2/10 = 0.20): asistencia (0.10), rezago (0.10)
  // Salud (2/10 = 0.20): acceso (0.10), gasto catastrófico (0.10)
  // Trabajo (2/10 = 0.20): desempleo (0.10), informalidad (0.10)
  // Vivienda & Servicios (3/10 = 0.30): materiales (0.075), hacinamiento (0.075), agua (0.075), electricidad (0.075)
  // Activos & TIC (1/10 = 0.10): internet (0.05), apoyo (0.05)
  const currentIndicators = activeAgent?.indicadoresPrivacion || ({} as IPMIndicators);

  const cfIndicators = {
    ...currentIndicators,
    carencia_agua_saneamiento: counterfactualOverrides.aguaSaneamiento ? false : currentIndicators.carencia_agua_saneamiento,
    empleo_informal_precario: counterfactualOverrides.empleoFormal ? false : currentIndicators.empleo_informal_precario,
    asistencia_escolar: counterfactualOverrides.asistenciaEscolar ? false : currentIndicators.asistencia_escolar,
    acceso_salud: counterfactualOverrides.accesoSalud ? false : currentIndicators.acceso_salud,
    carencia_internet_tic: counterfactualOverrides.internetTIC ? false : currentIndicators.carencia_internet_tic
  };

  // Recalculate score
  const weights: Record<keyof IPMIndicators, number> = {
    asistencia_escolar: 0.10,
    rezago_educativo: 0.10,
    acceso_salud: 0.10,
    gasto_catastrofico_salud: 0.10,
    desempleo_larga_duracion: 0.10,
    empleo_informal_precario: 0.10,
    materiales_precarios: 0.075,
    hacinamiento: 0.075,
    carencia_agua_saneamiento: 0.075,
    carencia_electricidad: 0.075,
    carencia_internet_tic: 0.05,
    ausencia_redes_apoyo: 0.05
  };

  let cfScore = 0;
  (Object.keys(cfIndicators) as (keyof IPMIndicators)[]).forEach(k => {
    if (cfIndicators[k]) {
      cfScore += (weights[k] || 0.08);
    }
  });

  const baseScore = activeAgent?.privationScore_ci || 0.40;
  const isCfPoor = cfScore >= 0.333;
  const wasPoor = baseScore >= 0.333;
  const isLiftedOut = wasPoor && !isCfPoor;

  const barrioName = neighborhoods.find(n => n.id === activeAgent?.barrioId)?.nombre || 'Barrio No Especificado';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono text-xs">
      <div className="bg-[#111113] border border-[#2A2A2E] rounded-sm max-w-5xl w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E]">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D221D] text-[#00FFC2] border border-[#184E42] flex items-center gap-1">
                <Users className="w-3 h-3" />
                RESOLUCIÓN MICRO-ESCALAR // MODELO BASADO EN AGENTES (ABM)
              </span>
              <span className="text-[10px] text-[#8E9299]">
                {households.length.toLocaleString()} agentes sintéticos en el Gemelo Digital
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mt-1">
              Ficha del Agente Sintético (Hogar #{activeAgent?.id || 'H-001'}) · {barrioName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#8E9299] hover:text-white hover:bg-[#1A1A1D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-[#0A0A0B] p-2.5 rounded border border-[#2A2A2E]">
          <div>
            <label className="block text-[10px] text-[#8E9299] mb-1">Filtrar por Barrio:</label>
            <select
              value={filterBarrioId}
              onChange={(e) => setFilterBarrioId(e.target.value)}
              className="w-full bg-[#1A1A1D] text-white text-xs px-2 py-1 rounded border border-[#333] outline-none"
            >
              <option value="">Todos los Barrios ({neighborhoods.length})</option>
              {neighborhoods.map(n => (
                <option key={n.id} value={n.id}>{n.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[#8E9299] mb-1">Estado de Pobreza IPM:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-[#1A1A1D] text-white text-xs px-2 py-1 rounded border border-[#333] outline-none"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="POOR">Pobre Multidimensional (ci &ge; 33.3%)</option>
              <option value="NON_POOR">No Pobre (ci &lt; 33.3%)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[10px] text-[#8E9299] mb-1">Buscar Hogar por ID:</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ej: h_0012..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1A1D] text-white text-xs pl-7 pr-2 py-1 rounded border border-[#333] outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#8E9299] absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Main 2-Column Split: Households Selector (Left) vs Agent Details & Counterfactual (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* HOUSEHOLDS LIST (4 cols) */}
          <div className="lg:col-span-4 space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            <span className="text-[10px] text-[#8E9299] uppercase font-bold block">
              Resultados ({filteredHouseholds.length} agentes):
            </span>
            {filteredHouseholds.map(h => {
              const isSelected = h.id === activeAgent?.id;
              return (
                <div
                  key={h.id}
                  onClick={() => handleSelectAgent(h.id)}
                  className={`p-2 rounded border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#141F28] border-[#38BDF8] shadow-sm'
                      : 'bg-[#141416] border-[#2A2A2E] hover:border-[#3A3A3F]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{h.id}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                      h.esPobreMultidimensional
                        ? 'bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40'
                        : 'bg-[#0D221D] text-[#00FFC2] border border-[#184E42]'
                    }`}>
                      {h.esPobreMultidimensional ? `POBRE (c=${Math.round(h.privationScore_ci * 100)}%)` : `NO POBRE (${Math.round(h.privationScore_ci * 100)}%)`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8E9299] mt-1">
                    <span>{h.personas} miembros ({h.empleoTipo})</span>
                    <span>S/ {Math.round(h.ingresoPerCapita * 3.75)}/mes/p</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AGENT DETAIL & MICRO-COUNTERFACTUAL (8 cols) */}
          <div className="lg:col-span-8 bg-[#141416] border border-[#2A2A2E] rounded p-4 space-y-4">
            
            {/* Demographic Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-[#222]">
              <div className="p-2 rounded bg-[#0A0A0B] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Tamaño Familiar:</span>
                <span className="text-sm font-bold text-white">{activeAgent?.personas} miembros</span>
                <span className="text-[9px] text-[#8E9299] block">Jefe {activeAgent?.jefeHogarGenero} ({activeAgent?.jefeHogarEdad} a.)</span>
              </div>

              <div className="p-2 rounded bg-[#0A0A0B] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Régimen Laboral:</span>
                <span className="text-sm font-bold text-[#FFAA00] uppercase">{activeAgent?.empleoTipo}</span>
                <span className="text-[9px] text-[#8E9299] block">Sin CTS ni Essalud</span>
              </div>

              <div className="p-2 rounded bg-[#0A0A0B] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Ingreso per Cápita:</span>
                <span className="text-sm font-bold text-[#00FFC2]">S/ {Math.round((activeAgent?.ingresoPerCapita || 0) * 3.75)}</span>
                <span className="text-[9px] text-[#8E9299] block">Canasta básica: S/ 450</span>
              </div>

              <div className="p-2 rounded bg-[#0A0A0B] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Score Privación c_i:</span>
                <span className={`text-sm font-bold ${activeAgent?.esPobreMultidimensional ? 'text-[#FF4D4D]' : 'text-[#00FFC2]'}`}>
                  {(baseScore * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] text-[#8E9299] block">Umbral k = 33.3%</span>
              </div>
            </div>

            {/* Alkire-Foster 10 Indicators Matrix */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#8E9299] uppercase font-bold block">
                Vector de Privaciones del Hogar (1 = Privado / 0 = Cubierto):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { key: 'carencia_agua_saneamiento', label: 'Sin Red de Agua', weight: '7.5%', active: cfIndicators.carencia_agua_saneamiento },
                  { key: 'empleo_informal_precario', label: 'Informalidad Laboral', weight: '10.0%', active: cfIndicators.empleo_informal_precario },
                  { key: 'asistencia_escolar', label: 'Inasistencia Escolar', weight: '10.0%', active: cfIndicators.asistencia_escolar },
                  { key: 'acceso_salud', label: 'Sin Seguro Médico', weight: '10.0%', active: cfIndicators.acceso_salud },
                  { key: 'hacinamiento', label: 'Hacinamiento Crítico', weight: '7.5%', active: cfIndicators.hacinamiento },
                  { key: 'materiales_precarios', label: 'Vivienda Precaria', weight: '7.5%', active: cfIndicators.materiales_precarios },
                  { key: 'carencia_electricidad', label: 'Sin Luz Formal', weight: '7.5%', active: cfIndicators.carencia_electricidad },
                  { key: 'carencia_internet_tic', label: 'Sin Internet / TIC', weight: '5.0%', active: cfIndicators.carencia_internet_tic },
                  { key: 'gasto_catastrofico_salud', label: 'Gasto Catastrófico', weight: '10.0%', active: cfIndicators.gasto_catastrofico_salud },
                ].map(ind => (
                  <div
                    key={ind.key}
                    className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${
                      ind.active
                        ? 'bg-[#2A1010] border-[#FF4D4D]/40 text-[#FF4D4D]'
                        : 'bg-[#0D221D] border-[#184E42] text-[#00FFC2]'
                    }`}
                  >
                    <span className="truncate">{ind.label}</span>
                    <span className="text-[9px] font-bold ml-1">{ind.active ? `+${ind.weight}` : '0%'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro-Counterfactual Simulator Controls */}
            <div className="p-3 rounded bg-[#0A0A0B] border border-[#2A2A2E] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00FFC2] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Simulador Contrafactual en Vivo para este Hogar:
                </span>
                <span className="text-[10px] text-[#8E9299]">
                  Active intervenciones directas sobre este agente
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCounterfactualOverrides(prev => ({ ...prev, aguaSaneamiento: !prev.aguaSaneamiento }))}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    counterfactualOverrides.aguaSaneamiento
                      ? 'bg-[#0D221D] border-[#00FFC2] text-[#00FFC2]'
                      : 'bg-[#141416] border-[#333] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>+ Conexión de Agua</span>
                    <span>{counterfactualOverrides.aguaSaneamiento ? '✓' : '+'}</span>
                  </div>
                  <span className="text-[9px] block text-[#666]">-7.5% en privación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCounterfactualOverrides(prev => ({ ...prev, empleoFormal: !prev.empleoFormal }))}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    counterfactualOverrides.empleoFormal
                      ? 'bg-[#0D221D] border-[#00FFC2] text-[#00FFC2]'
                      : 'bg-[#141416] border-[#333] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>+ Formalización Empleo</span>
                    <span>{counterfactualOverrides.empleoFormal ? '✓' : '+'}</span>
                  </div>
                  <span className="text-[9px] block text-[#666]">-10.0% en privación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCounterfactualOverrides(prev => ({ ...prev, asistenciaEscolar: !prev.asistenciaEscolar }))}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    counterfactualOverrides.asistenciaEscolar
                      ? 'bg-[#0D221D] border-[#00FFC2] text-[#00FFC2]'
                      : 'bg-[#141416] border-[#333] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>+ Beca Asistencia</span>
                    <span>{counterfactualOverrides.asistenciaEscolar ? '✓' : '+'}</span>
                  </div>
                  <span className="text-[9px] block text-[#666]">-10.0% en privación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCounterfactualOverrides(prev => ({ ...prev, accesoSalud: !prev.accesoSalud }))}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    counterfactualOverrides.accesoSalud
                      ? 'bg-[#0D221D] border-[#00FFC2] text-[#00FFC2]'
                      : 'bg-[#141416] border-[#333] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>+ Afiliación SIS Gratuita</span>
                    <span>{counterfactualOverrides.accesoSalud ? '✓' : '+'}</span>
                  </div>
                  <span className="text-[9px] block text-[#666]">-10.0% en privación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCounterfactualOverrides(prev => ({ ...prev, internetTIC: !prev.internetTIC }))}
                  className={`p-2 rounded text-left border transition-all cursor-pointer ${
                    counterfactualOverrides.internetTIC
                      ? 'bg-[#0D221D] border-[#00FFC2] text-[#00FFC2]'
                      : 'bg-[#141416] border-[#333] text-[#8E9299] hover:text-white'
                  }`}
                >
                  <div className="flex justify-between font-bold text-[10px]">
                    <span>+ Conectividad Comunal</span>
                    <span>{counterfactualOverrides.internetTIC ? '✓' : '+'}</span>
                  </div>
                  <span className="text-[9px] block text-[#666]">-5.0% en privación</span>
                </button>
              </div>

              {/* Counterfactual Outcome Indicator */}
              <div className="p-2.5 rounded bg-[#141416] border border-[#222] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#8E9299] block">Score Contrafactual Proyectado:</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-lg font-bold ${isCfPoor ? 'text-[#FF4D4D]' : 'text-[#00FFC2]'}`}>
                      c_i = {(cfScore * 100).toFixed(1)}%
                    </span>
                    <span className="text-[10px] text-[#8E9299]">
                      (Original: {(baseScore * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#8E9299] block">Resultado de la Política:</span>
                  {isLiftedOut ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D221D] text-[#00FFC2] border border-[#184E42] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ¡SALE DE LA POBREZA MULTIDIMENSIONAL!
                    </span>
                  ) : isCfPoor ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40">
                      Continúa en pobreza (requiere más apoyo)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D221D] text-[#00FFC2]">
                      Hogar no pobre consolidado
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#2A2A2E]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-bold bg-[#00FFC2] text-[#0A0A0B] cursor-pointer"
          >
            CERRAR FICHA DE AGENTE
          </button>
        </div>

      </div>
    </div>
  );
};
