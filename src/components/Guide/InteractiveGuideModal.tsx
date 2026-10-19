import React, { useState } from 'react';
import { 
  HelpCircle, 
  X, 
  Play, 
  Box, 
  Layers, 
  Sliders, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Code2, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle, 
  Activity, 
  RotateCw,
  Eye,
  Compass,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: 'dashboard' | 'scenarios' | 'comparator' | 'forecasting' | 'ml_engine' | 'iot_sensors' | 'stress_test' | 'ai_copilot' | 'architecture') => void;
  onTriggerPreset?: (preset: 'shock_crisis' | 'policy_package' | 'ods_eradication') => void;
  onRunSimulation?: () => void;
  onOpenReportModal?: () => void;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onTriggerPreset,
  onRunSimulation,
  onOpenReportModal
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  if (!isOpen) return null;

  const steps = [
    {
      id: 'intro',
      title: '1. ¿Qué es el Gemelo Digital Urbano (GD-VSU)?',
      subtitle: 'Simulador 3D basado en Agentes (ABM) + Métrica Alkire-Foster + Datos Satelitales',
      category: 'FUNDAMENTOS',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            El <strong className="text-white font-mono">Gemelo Digital de Vulnerabilidad Socioeconómica Urbana (GD-VSU)</strong> es una réplica computacional tridimensional interactiva de la estructura social, económica y física de la metrópoli (Lima Metropolitana).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-3">
            <div className="p-3 bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] rounded-sm">
              <div className="text-[10px] text-[#00FFC2] uppercase font-bold mb-1">Micro (Hogares)</div>
              <p className="text-[11px] text-white">10,000 agentes sintéticos con 12 privaciones censales calibradas con ENAHO.</p>
            </div>
            <div className="p-3 bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#38BDF8] rounded-sm">
              <div className="text-[10px] text-[#38BDF8] uppercase font-bold mb-1">Meso (Barrios)</div>
              <p className="text-[11px] text-white">50 polígonos urbanos con telemetría satelital VIIRS, NDVI y huella GHSL.</p>
            </div>
            <div className="p-3 bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FFAA00] rounded-sm">
              <div className="text-[10px] text-[#FFAA00] uppercase font-bold mb-1">Macro (Políticas)</div>
              <p className="text-[11px] text-white">Simulación prospectiva 2024-2030 con choques climáticos e inflación.</p>
            </div>
          </div>
          <div className="p-2.5 bg-[#0D221D] border border-[#184E42] rounded-sm text-[#00FFC2] text-[11px] flex items-center gap-2">
            <Cpu className="w-4 h-4 shrink-0" />
            <span>Fórmula Central de Pobreza Multidimensional: <strong className="font-mono text-white">M₀ = H × A</strong> con umbral dual <strong className="font-mono text-white">k = 0.33</strong> (Alkire-Foster).</span>
          </div>
        </div>
      ),
      actionLabel: 'Ver Mapa & Telemetría',
      actionTab: 'dashboard' as const
    },
    {
      id: 'navigation3d',
      title: '2. Navegación y Controles del Simulador 3D',
      subtitle: 'Exploración WebGL tridimensional, extrusión de manzanas y cámaras orbitales',
      category: 'INTERFAZ 3D',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            En la vista <strong className="text-white font-mono">MAPA & TELEMETRÍA</strong> puedes alternar entre la <strong className="text-[#00FFC2]">Vista 3D WebGL</strong> y la <strong className="text-[#38BDF8]">Vista SIG 2D</strong>. En el espacio 3D, la altura de cada manzana representa directamente su nivel de vulnerabilidad o tasa de pobreza $M_0$.
          </p>
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] space-y-2">
            <div className="font-bold text-white uppercase text-[10px] tracking-wider text-[#00FFC2]">
              Modos de Renderizado 3D:
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>• <strong className="text-white">Cyber LIDAR:</strong> Malla wireframe con antenas de alerta crítica.</div>
              <div>• <strong className="text-white">Térmico IPM:</strong> Gradiente térmico según severidad de pobreza.</div>
              <div>• <strong className="text-white">Satelital VIIRS:</strong> Fotometría nocturna y déficit de red eléctrica.</div>
              <div>• <strong className="text-white">Topografía:</strong> Pendientes de laderas y riesgo de deslizamiento.</div>
            </div>
          </div>
          <div className="bg-[#141416] p-2.5 rounded-sm border border-[#2A2A2E] text-[11px] text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#00FFC2]" />
              <strong>Controles:</strong> Click+Arrastrar (Rotar 360°), Rueda (Zoom), Preset Cámara (45°, Cenital, Rasante).
            </span>
          </div>
        </div>
      ),
      actionLabel: 'Probar Simulador 3D',
      actionTab: 'dashboard' as const
    },
    {
      id: 'shocks',
      title: '3. Inyección de Choques Exógenos',
      subtitle: 'Simulación del impacto de inflación de alimentos, desastres en laderas y saturación sanitaria',
      category: 'DINÁMICA DE SISTEMAS',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            En la pestaña <strong className="text-white font-mono">ESCENARIOS</strong> puedes activar choques macroeconómicos o climáticos para evaluar la resiliencia urbana.
          </p>
          <div className="space-y-2">
            <div className="p-2.5 bg-[#1E1114] border border-[#521C24] rounded-sm text-[#FF4D4D] flex items-center justify-between">
              <div>
                <span className="font-bold uppercase text-[10px]">1. Inflación de Alimentos (+30% Canasta Básica)</span>
                <p className="text-[10px] text-[#8E9299] mt-0.5">Empuja a hogares con empleo informal al corte de pobreza calórica.</p>
              </div>
            </div>
            <div className="p-2.5 bg-[#1E1114] border border-[#521C24] rounded-sm text-[#FF4D4D] flex items-center justify-between">
              <div>
                <span className="font-bold uppercase text-[10px]">2. Inundación y Huayco en Laderas (Fenómeno El Niño)</span>
                <p className="text-[10px] text-[#8E9299] mt-0.5">Afecta viviendas en pendientes &gt;25° y corta suministro de agua potable.</p>
              </div>
            </div>
          </div>
          <p className="text-[11px]">
            Puedes ajustar la magnitud de cada choque y visualizar las ondas de choque expansivas en el gemelo 3D.
          </p>
        </div>
      ),
      actionLabel: 'Ir a Configurador de Escenarios',
      actionTab: 'scenarios' as const
    },
    {
      id: 'policies',
      title: '4. Formulación de Paquetes de Políticas Públicas',
      subtitle: 'Asignación presupuestal en USD y focalización territorial de intervenciones sociales',
      category: 'POLÍTICAS SOCIALES',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            Prueba cómo diferentes programas gubernamentales contrarrestan los choques y reducen el IPM $M_0$:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-[#0D221D] border border-[#184E42] rounded-sm text-[#00FFC2]">
              <strong className="text-white">Juntos Urbano:</strong> Transferencias monetarias condicionadas a asistencia escolar y salud.
            </div>
            <div className="p-2.5 bg-[#0D221D] border border-[#184E42] rounded-sm text-[#00FFC2]">
              <strong className="text-white">Lurawi / Empleo Temporal:</strong> Jornales en obras de contención y muros en laderas.
            </div>
            <div className="p-2.5 bg-[#0D221D] border border-[#184E42] rounded-sm text-[#00FFC2]">
              <strong className="text-white">Ollas Comunes & Qali Warma:</strong> Subsidio alimentario directo contra inflación.
            </div>
            <div className="p-2.5 bg-[#0D221D] border border-[#184E42] rounded-sm text-[#00FFC2]">
              <strong className="text-white">Agua al Barrio:</strong> Camiones cisterna subsidiados y conexiones domiciliarias.
            </div>
          </div>
        </div>
      ),
      actionLabel: 'Explorar Políticas',
      actionTab: 'scenarios' as const
    },
    {
      id: 'comparator',
      title: '5. Comparador A/B de Escenarios & Costo-Efectividad',
      subtitle: 'Medición rigurosa de hogares salvados de la pobreza y retorno social de inversión',
      category: 'EVALUACIÓN DE IMPACTO',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            Al pulsar <strong className="text-white font-mono">EJECUTAR ABM</strong>, el motor calcula el horizonte 2024-2030 y te dirige a la pestaña <strong className="text-white font-mono">COMPARADOR A/B</strong>.
          </p>
          <div className="bg-[#141416] p-3 rounded-sm border border-[#2A2A2E] space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8E9299]">Delta de IPM (&Delta;M₀):</span>
              <span className="text-[#00FFC2] font-bold font-mono">-0.0512 (-19.3%)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8E9299]">Hogares Salidos de Pobreza:</span>
              <span className="text-[#38BDF8] font-bold font-mono">+1,240 hogares</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8E9299]">Costo-Efectividad Promedio:</span>
              <span className="text-[#FFAA00] font-bold font-mono">$850 USD / hogar</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8E9299]">Barrios en Alerta Roja Final:</span>
              <span className="text-[#00FFC2] font-bold font-mono">2 (Inicial: 8)</span>
            </div>
          </div>
        </div>
      ),
      actionLabel: 'Ver Comparador A/B',
      actionTab: 'comparator' as const
    },
    {
      id: 'radar',
      title: '6. Radar de Alerta Temprana & Sensibilidad ("What-If")',
      subtitle: 'Detección anticipada de trampas de pobreza a 3, 6 y 12 meses',
      category: 'PROSPECTIVA',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            En la pestaña <strong className="text-white font-mono">ALERTAS & RADAR</strong> puedes examinar qué barrios están a punto de cruzar el umbral crítico antes de que se produzca una crisis irreversible.
          </p>
          <div className="p-3 bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] rounded-sm space-y-1">
            <div className="text-[10px] text-[#FF4D4D] font-bold uppercase">Análisis de Sensibilidad ("What-If")</div>
            <p className="text-[11px] text-[#8E9299]">
              Calcula la elasticidad de reducción de pobreza ante mejoras en cada dimensión. Por ejemplo, la formalización laboral genera una reducción del <strong className="text-white font-mono">-2.8% de IPM</strong> por cada 10% de avance.
            </p>
          </div>
        </div>
      ),
      actionLabel: 'Abrir Radar de Alerta',
      actionTab: 'forecasting' as const
    },
    {
      id: 'reports',
      title: '7. Exportación de Reportes Oficiales & Código Fuente',
      subtitle: 'Descarga de informes ejecutivos PDF, matrices CSV, GeoJSON SIG y scripts Python Mesa',
      category: 'TRANSFERENCIA TÉCNICA',
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-[#8E9299]">
          <p>
            El Gemelo Digital cuenta con herramientas de gobernanza y exportación para toma de decisiones en el sector público:
          </p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-[#141416] border border-[#2A2A2E] rounded-sm">
              <strong className="text-white uppercase text-[10px] block mb-1">Informe PDF Municipal</strong>
              Resumen ejecutivo listo para imprimir con mapas y tablas de Pareto.
            </div>
            <div className="p-2.5 bg-[#141416] border border-[#2A2A2E] rounded-sm">
              <strong className="text-white uppercase text-[10px] block mb-1">Capas GeoJSON (SIG)</strong>
              Polígonos espaciales listos para abrir en QGIS o ArcGIS.
            </div>
            <div className="p-2.5 bg-[#141416] border border-[#2A2A2E] rounded-sm">
              <strong className="text-white uppercase text-[10px] block mb-1">Matriz CSV Excel</strong>
              Microdatos anonimizados con Privacidad Diferencial (&epsilon;=0.5).
            </div>
            <div className="p-2.5 bg-[#141416] border border-[#2A2A2E] rounded-sm">
              <strong className="text-white uppercase text-[10px] block mb-1">Código Python (Mesa)</strong>
              Repositorio completo con agentes Mesa y algoritmos genéticos DEAP.
            </div>
          </div>
        </div>
      ),
      actionLabel: 'Ver Repositorio de Código Python',
      actionTab: 'architecture' as const
    }
  ];

  const current = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleAction = () => {
    if (current.actionTab) {
      onNavigateTab(current.actionTab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono select-none">
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2E] bg-[#0A0A0B]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-sm bg-[#0D221D] text-[#00FFC2] border border-[#184E42]">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-tight">
                  Guía Interactiva & Manual del Gemelo Digital 3D
                </h3>
                <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold bg-[#1A1A1D] text-[#00FFC2] border border-[#2A2A2E]">
                  PASO {currentStep + 1}/{steps.length}
                </span>
              </div>
              <p className="text-[10px] text-[#8E9299]">{current.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#8E9299] hover:text-white hover:bg-[#1A1A1D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="grid grid-cols-7 gap-1 px-4 pt-3 bg-[#0A0A0B]">
          {steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-none transition-all ${
                idx === currentStep 
                  ? 'bg-[#00FFC2]' 
                  : idx < currentStep 
                    ? 'bg-[#184E42]' 
                    : 'bg-[#1A1A1D]'
              }`}
              title={s.title}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
          <div>
            <h4 className="text-sm font-bold text-white uppercase">{current.title}</h4>
            <p className="text-[11px] text-[#00FFC2] font-mono mt-0.5">{current.subtitle}</p>
          </div>

          <div className="pt-2">
            {current.content}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-3.5 border-t border-[#2A2A2E] bg-[#0A0A0B] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#141416] hover:bg-[#1A1A1D] text-[#8E9299] hover:text-white border border-[#2A2A2E] disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#141416] hover:bg-[#1A1A1D] text-white border border-[#2A2A2E] transition-colors flex items-center gap-1"
            >
              <span>{currentStep === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {current.actionLabel && (
            <button
              onClick={handleAction}
              className="px-3.5 py-1.5 rounded-sm text-[10px] font-bold uppercase bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>{current.actionLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
