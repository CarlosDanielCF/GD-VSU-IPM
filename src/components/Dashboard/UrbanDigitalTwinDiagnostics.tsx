import React, { useState, useEffect } from 'react';
import { 
  NeighborhoodCell, 
  HouseholdAgent, 
  ShockScenario, 
  PolicyScenario 
} from '../../types';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Flame, 
  Gauge, 
  HeartHandshake, 
  Home, 
  Layers, 
  Radio, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Wrench, 
  Zap, 
  Sliders, 
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  LifeBuoy
} from 'lucide-react';

export interface UrbanSubsystemDiagnostic {
  subsystemId: string;
  name: string;
  category: 'motor_economico' | 'red_hidrica_sanitaria' | 'soporte_nutricional' | 'cobertura_educativa' | 'integridad_habitacional';
  analogousTo: string; // e.g. "Turbina 1 / Motor Principal", "Sistema Hidráulico"
  telemetrySource: string; // e.g. "ENAHO Empleo + SUNAT Microdatos", "SEDAPAL + Sensor IoT Presión"
  status: 'OPTIMAL' | 'DEGRADED' | 'WARNING' | 'CRITICAL_FAILURE';
  healthScore: number; // 0 - 100%
  failureProbabilityNext6Months: number; // 0 - 100%
  symptom: string;
  rootCause: string;
  affectedPopulation: number;
  recommendedPrescription: {
    title: string;
    protocol: string;
    costUSD: number;
    expectedRecoveryDays: number;
    impactDeltaM0: number; // reduction in poverty
    actionType: 'EMERGENCY_DISPATCH' | 'PREVENTIVE_MAINTENANCE' | 'STRUCTURAL_UPGRADE';
  };
}

interface UrbanDigitalTwinDiagnosticsProps {
  selectedNeighborhood: NeighborhoodCell | null;
  neighborhoods: NeighborhoodCell[];
  activeShocks: ShockScenario[];
  activePolicies: PolicyScenario[];
  currentYear: number;
  onApplyPrescription: (prescription: UrbanSubsystemDiagnostic['recommendedPrescription'], subsystemName: string) => void;
  onSelectNeighborhood: (neighborhood: NeighborhoodCell) => void;
}

export const UrbanDigitalTwinDiagnostics: React.FC<UrbanDigitalTwinDiagnosticsProps> = ({
  selectedNeighborhood,
  neighborhoods,
  activeShocks,
  activePolicies,
  currentYear,
  onApplyPrescription,
  onSelectNeighborhood
}) => {
  const currentTarget = selectedNeighborhood || (neighborhoods.length > 0 ? neighborhoods[0] : null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>(null);
  const [simulationStressLevel, setSimulationStressLevel] = useState<number>(0);
  const [isSimulatingLiveTelemetry, setIsSimulatingLiveTelemetry] = useState<boolean>(true);
  const [liveTelemetryTick, setLiveTelemetryTick] = useState<number>(0);

  // Live telemetry pulse simulation
  useEffect(() => {
    if (!isSimulatingLiveTelemetry) return;
    const interval = setInterval(() => {
      setLiveTelemetryTick(prev => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, [isSimulatingLiveTelemetry]);

  if (!currentTarget) return null;

  // Derive Subsystems Health based on multidimensional indicators & active shocks
  const inflationShock = activeShocks.find(s => s.activo && s.tipo === 'inflacion_alimentos');
  const climateShock = activeShocks.find(s => s.activo && s.tipo === 'desastre_climatico_inundacion');
  const healthShock = activeShocks.find(s => s.activo && s.tipo === 'crisis_sanitaria_pandemia');
  const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const employmentDeprivation = clamp01(currentTarget.coberturaGHSLInformal * 0.65 + currentTarget.ipm_H * 0.35);
  const waterDeprivation = clamp01((100 - currentTarget.indiceInfraestructura) / 100);
  const nutritionDeprivation = clamp01(currentTarget.ipm_M0 * 1.15);
  const healthDeprivation = clamp01(currentTarget.distanciaHospitalMin / 90);
  const housingDeprivation = clamp01(currentTarget.coberturaGHSLInformal * 0.7 + waterDeprivation * 0.3);

  // Subsystems Diagnostics Matrix
  const subsystems: UrbanSubsystemDiagnostic[] = [
    {
      subsystemId: 'sub_employment',
      name: 'Motor 1: Generación de Ingreso & Empleo Formal',
      category: 'motor_economico',
      analogousTo: 'Turbina de Propulsión Principal (Generador de Empuje)',
      telemetrySource: 'Censo + ENAHO Subempleo (Frecuencia: Diaria)',
      healthScore: Math.max(12, Math.round((1 - employmentDeprivation) * 100 - (inflationShock ? 22 : 0) - simulationStressLevel * 15)),
      status: employmentDeprivation > 0.75 ? 'CRITICAL_FAILURE' : employmentDeprivation > 0.50 ? 'WARNING' : 'OPTIMAL',
      failureProbabilityNext6Months: Math.min(98, Math.round(employmentDeprivation * 100 + (inflationShock ? 18 : 0))),
      symptom: `${(employmentDeprivation * 100).toFixed(0)}% de privación laboral proxy (informalidad espacial + incidencia IPM).`,
      rootCause: 'Caída de demanda local agregada e inelasticidad salarial ante costo de canasta.',
      affectedPopulation: Math.round(currentTarget.poblacionTotal * employmentDeprivation),
      recommendedPrescription: {
        title: 'Inyección de Liquidez y Empleo Temporal Lurawi',
        protocol: 'Activación de transferencias de emergencia condicionadas + jornales de infraestructura rápida.',
        costUSD: Math.round(currentTarget.poblacionTotal * 45),
        expectedRecoveryDays: 30,
        impactDeltaM0: -0.042,
        actionType: 'EMERGENCY_DISPATCH'
      }
    },
    {
      subsystemId: 'sub_water_sanitation',
      name: 'Sub-red 2: Distribución Hidráulica & Saneamiento',
      category: 'red_hidrica_sanitaria',
      analogousTo: 'Sistema Hidráulico y Circuitos de Presión Crítica',
      telemetrySource: 'Telemetría Sensores SEDAPAL + Geo-Catastro',
      healthScore: Math.max(8, Math.round((1 - waterDeprivation) * 100 - (climateShock ? 35 : 0) - simulationStressLevel * 20)),
      status: waterDeprivation > 0.65 ? 'CRITICAL_FAILURE' : waterDeprivation > 0.35 ? 'WARNING' : 'OPTIMAL',
      failureProbabilityNext6Months: Math.min(95, Math.round(waterDeprivation * 100 + (climateShock ? 25 : 5))),
      symptom: `${(waterDeprivation * 100).toFixed(0)}% de brecha proxy de infraestructura y servicios básicos.`,
      rootCause: 'Falta de red matriz en cotas superiores a 400 msnm y rotura de conexiones informales.',
      affectedPopulation: Math.round(currentTarget.poblacionTotal * waterDeprivation),
      recommendedPrescription: {
        title: 'Mantenimiento Preventivo / Conexión Rápida de Reservorios',
        protocol: 'Instalación de reservorios comunales con cloración automática y subsidio al m³.',
        costUSD: Math.round(currentTarget.poblacionTotal * 65),
        expectedRecoveryDays: 45,
        impactDeltaM0: -0.055,
        actionType: 'STRUCTURAL_UPGRADE'
      }
    },
    {
      subsystemId: 'sub_food_security',
      name: 'Módulo 3: Seguridad Alimentaria & Ollas Comunes',
      category: 'soporte_nutricional',
      analogousTo: 'Sistema de Combustible y Reserva Energética de Vuelo',
      telemetrySource: 'Registro Georreferenciado Ollas Comunes + MIDIS',
      healthScore: Math.max(15, Math.round((1 - nutritionDeprivation) * 100 - (inflationShock ? 30 : 0))),
      status: nutritionDeprivation > 0.50 || !!inflationShock ? 'CRITICAL_FAILURE' : nutritionDeprivation > 0.30 ? 'WARNING' : 'OPTIMAL',
      failureProbabilityNext6Months: Math.min(92, Math.round(nutritionDeprivation * 100 + (inflationShock ? 30 : 0))),
      symptom: 'Agotamiento de stock nutricional proteico en comedores y aumento de anemia en infantes < 3 años.',
      rootCause: 'Incremento del 32% en precio mayorista de huevos, legumbres y gas licuado de petróleo (GLP).',
      affectedPopulation: Math.round(currentTarget.poblacionTotal * nutritionDeprivation),
      recommendedPrescription: {
        title: 'Despacho de Urgencia Qali Warma Urbano + Vales GLP',
        protocol: 'Rutas logísticas garantizadas a 100% de ollas registradas y subsidio directo a raciones.',
        costUSD: Math.round(currentTarget.poblacionTotal * 28),
        expectedRecoveryDays: 14,
        impactDeltaM0: -0.038,
        actionType: 'EMERGENCY_DISPATCH'
      }
    },
    {
      subsystemId: 'sub_health_capacity',
      name: 'Módulo 4: Resiliencia Sanitaria & Postas de Salud',
      category: 'cobertura_educativa',
      analogousTo: 'Sistema de Soporte Vital y Oxigenación de Cabina',
      telemetrySource: 'MINSA SUSALUD Capacidad Camas / Turnos Médicos',
      healthScore: Math.max(10, Math.round((1 - healthDeprivation) * 100 - (healthShock ? 40 : 0))),
      status: healthDeprivation > 0.55 || !!healthShock ? 'CRITICAL_FAILURE' : healthDeprivation > 0.30 ? 'WARNING' : 'OPTIMAL',
      failureProbabilityNext6Months: Math.min(88, Math.round(healthDeprivation * 100 + (healthShock ? 35 : 0))),
      symptom: 'Tiempo de espera en triaje > 4.5 horas y desabastecimiento de medicamentos esenciales Nivel I.',
      rootCause: 'Sobrecarga de demanda ambulatoria y déficit de médicos especialistas de atención primaria.',
      affectedPopulation: Math.round(currentTarget.poblacionTotal * healthDeprivation),
      recommendedPrescription: {
        title: 'Brigadas Médicas Móviles y Reposición de Botiquines',
        protocol: 'Despliegue de 3 unidades itinerantes con telemedicina y entrega gratuita de fármacos.',
        costUSD: Math.round(currentTarget.poblacionTotal * 35),
        expectedRecoveryDays: 21,
        impactDeltaM0: -0.031,
        actionType: 'PREVENTIVE_MAINTENANCE'
      }
    },
    {
      subsystemId: 'sub_habitat_slope',
      name: 'Módulo 5: Integridad Estructural del Hábitat & Laderas',
      category: 'integridad_habitacional',
      analogousTo: 'Fuselaje y Superficie Alar (Integridad Estructural)',
      telemetrySource: 'Imágenes Satelitales SAR Sentinel-1 + CENEPRED',
      healthScore: Math.max(5, Math.round((1 - housingDeprivation) * 100 - (climateShock ? 45 : 0))),
      status: housingDeprivation > 0.60 || !!climateShock ? 'CRITICAL_FAILURE' : housingDeprivation > 0.35 ? 'WARNING' : 'OPTIMAL',
      failureProbabilityNext6Months: Math.min(99, Math.round(housingDeprivation * 100 + (climateShock ? 40 : 10))),
      symptom: 'Asentamientos en pircas inestables con pendiente > 25° expuestas a socavamiento.',
      rootCause: 'Falta de muros de contención cimentados y autoconstrucción sin asistencia técnica.',
      affectedPopulation: Math.round(currentTarget.poblacionTotal * housingDeprivation),
      recommendedPrescription: {
        title: 'Reforzamiento Geotécnico & Muros de Contención',
        protocol: 'Muros de gravedad con gaviones en quebradas críticas + geomallas de estabilización.',
        costUSD: Math.round(currentTarget.poblacionTotal * 90),
        expectedRecoveryDays: 60,
        impactDeltaM0: -0.048,
        actionType: 'STRUCTURAL_UPGRADE'
      }
    }
  ];

  // Overall City/District Aircraft-like Health Index
  const averageHealth = Math.round(subsystems.reduce((acc, s) => acc + s.healthScore, 0) / subsystems.length);
  const criticalFailures = subsystems.filter(s => s.status === 'CRITICAL_FAILURE');
  const activeSelectedSub = subsystems.find(s => s.subsystemId === selectedSubsystem) || subsystems[0];

  return (
    <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 font-mono text-xs space-y-4 shadow-2xl">
      
      {/* Header: Digital Twin Cockpit Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2A2E] pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-[#141416] border border-[#00FFC2]/50 text-[#00FFC2] rounded-sm shadow-sm">
            <Gauge className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">
                Tablero de Diagnóstico & Telemetría en Tiempo Real del Gemelo Digital
              </h2>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-bold bg-[#141416] text-[#00FFC2] border border-[#184E42]">
                STATUS: {criticalFailures.length > 0 ? 'ALERTA DE SISTEMA' : 'OPERACIONAL'}
              </span>
            </div>
            <p className="text-[11px] text-[#8E9299]">
              Análogo a la telemetría de turbinas y fuselaje en un gemelo de aviación: Monitorea fallas socioeconómicas y predice colapsos antes de que ocurran.
            </p>
          </div>
        </div>

        {/* Live Telemetry Ping */}
        <div className="flex items-center space-x-2 bg-[#141416] px-3 py-1.5 rounded-sm border border-[#2A2A2E]">
          <div className={`w-2 h-2 rounded-full ${isSimulatingLiveTelemetry ? 'bg-[#00FFC2] animate-ping' : 'bg-gray-500'}`} />
          <span className="text-[10px] text-[#8E9299]">STREAM DE DATOS EN VIVO:</span>
          <span className="text-[10px] font-bold text-white font-mono">TICK #{liveTelemetryTick}</span>
          <button
            onClick={() => setIsSimulatingLiveTelemetry(!isSimulatingLiveTelemetry)}
            className="p-1 text-[#8E9299] hover:text-white"
            title="Pausar/Reanudar telemetría en vivo"
          >
            <RefreshCw className={`w-3 h-3 ${isSimulatingLiveTelemetry ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Barrio Selector & Quick Aircraft-like Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        
        {/* Neighborhood Selector & Structural Overview */}
        <div className="lg:col-span-1 bg-[#141416] border border-[#2A2A2E] p-3 rounded-sm space-y-2.5">
          <div className="text-[10px] text-[#8E9299] uppercase font-bold flex items-center justify-between">
            <span>UNIDAD MONITOREADA</span>
            <span className="text-[#00FFC2]">{currentTarget.distrito}</span>
          </div>
          
          <select
            value={currentTarget.id}
            onChange={(e) => {
              const target = neighborhoods.find(n => n.id === e.target.value);
              if (target) onSelectNeighborhood(target);
            }}
            className="w-full bg-[#0A0A0B] border border-[#2A2A2E] text-white p-2 rounded-sm text-xs font-mono font-bold focus:border-[#00FFC2] outline-hidden cursor-pointer"
          >
            {neighborhoods.map(n => (
              <option key={n.id} value={n.id}>
                {n.nombre} (IPM: {n.ipm_M0.toFixed(3)})
              </option>
            ))}
          </select>

          {/* Master Health Bar */}
          <div className="pt-2 border-t border-[#2A2A2E] space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#8E9299]">ÍNDICE DE SALUD DEL SISTEMA:</span>
              <span className={`font-bold font-mono ${averageHealth < 40 ? 'text-[#FF4D4D]' : averageHealth < 70 ? 'text-[#FFAA00]' : 'text-[#00FFC2]'}`}>
                {averageHealth}%
              </span>
            </div>
            <div className="w-full bg-[#0A0A0B] h-2 rounded-none overflow-hidden border border-[#2A2A2E]">
              <div 
                className={`h-full transition-all duration-500 ${averageHealth < 40 ? 'bg-[#FF4D4D]' : averageHealth < 70 ? 'bg-[#FFAA00]' : 'bg-[#00FFC2]'}`}
                style={{ width: `${averageHealth}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-[#8E9299]">
              <span>0% (Falla Catastrófica)</span>
              <span>100% (Resiliencia Óptima)</span>
            </div>
          </div>

          {/* Active Stress Test Injector */}
          <div className="pt-2 border-t border-[#2A2A2E] space-y-1">
            <div className="flex justify-between text-[9px] text-[#8E9299]">
              <span>SIMULADOR DE ESTRÉS // WHAT-IF:</span>
              <span className="text-[#FFAA00] font-bold">+{simulationStressLevel * 10}% CARGA</span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={simulationStressLevel}
              onChange={(e) => setSimulationStressLevel(parseInt(e.target.value))}
              className="w-full h-1 bg-[#0A0A0B] accent-[#FFAA00] rounded-none cursor-pointer"
            />
            <div className="text-[8px] text-[#8E9299]">
              {simulationStressLevel === 0 && 'Condición nominal estándar.'}
              {simulationStressLevel === 1 && 'Estrés moderado: +10% inflación canasta.'}
              {simulationStressLevel === 2 && 'Estrés severo: shock de empleo + corte hídrico.'}
              {simulationStressLevel === 3 && 'Estrés crítico: colapso simultáneo multidimensional.'}
            </div>
          </div>
        </div>

        {/* 5 Urban Subsystems Status (Like aircraft engines/circuits) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-5 gap-2">
          {subsystems.map((sub) => {
            const isSelected = (selectedSubsystem || subsystems[0].subsystemId) === sub.subsystemId;
            return (
              <div
                key={sub.subsystemId}
                onClick={() => setSelectedSubsystem(sub.subsystemId)}
                className={`p-2.5 rounded-sm border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-[#1A1A1D] border-[#00FFC2] shadow-md ring-1 ring-[#00FFC2]/30' 
                    : 'bg-[#141416] border-[#2A2A2E] hover:border-[#8E9299]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      sub.status === 'CRITICAL_FAILURE' ? 'bg-[#FF4D4D] animate-ping' :
                      sub.status === 'WARNING' ? 'bg-[#FFAA00]' : 'bg-[#00FFC2]'
                    }`} />
                    <span className={`text-[8px] font-bold uppercase px-1 py-0.5 rounded-xs ${
                      sub.status === 'CRITICAL_FAILURE' ? 'bg-[#1E1114] text-[#FF4D4D] border border-[#FF4D4D]' :
                      sub.status === 'WARNING' ? 'bg-[#241B08] text-[#FFAA00] border border-[#FFAA00]' :
                      'bg-[#0D221D] text-[#00FFC2] border border-[#00FFC2]'
                    }`}>
                      {sub.status === 'CRITICAL_FAILURE' ? 'FALLA' : sub.status === 'WARNING' ? 'ALERTA' : 'OK'}
                    </span>
                  </div>

                  <div className="text-[10px] font-bold text-white uppercase line-clamp-2 mb-1">
                    {sub.name}
                  </div>
                  
                  <div className="text-[8px] text-[#8E9299] line-clamp-1 italic mb-2">
                    {sub.analogousTo}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#2A2A2E]/60">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[#8E9299]">Salud:</span>
                    <span className={`font-bold font-mono ${sub.healthScore < 40 ? 'text-[#FF4D4D]' : sub.healthScore < 70 ? 'text-[#FFAA00]' : 'text-[#00FFC2]'}`}>
                      {sub.healthScore}%
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[#8E9299]">Riesgo Falla 6M:</span>
                    <span className="font-bold text-white font-mono">{sub.failureProbabilityNext6Months}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Deep Component Diagnostic & Prescriptive Action Plan (What to do when something fails) */}
      <div className="bg-[#141416] border border-[#2A2A2E] p-4 rounded-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2A2E] pb-2.5">
          <div className="flex items-center space-x-2">
            <Wrench className="w-4 h-4 text-[#00FFC2]" />
            <h3 className="text-xs font-bold text-white uppercase">
              Diagnóstico Detallado del Componente: <span className="text-[#00FFC2]">{activeSelectedSub.name}</span>
            </h3>
          </div>
          <div className="text-[10px] text-[#8E9299] flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Fuente de Telemetría: <strong className="text-white">{activeSelectedSub.telemetrySource}</strong></span>
          </div>
        </div>

        {/* Symptoms & Root Cause Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-sm space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[#FF4D4D] text-[10px] font-bold uppercase">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Síntoma / Anomalía Detectada por el Gemelo:</span>
            </div>
            <p className="text-[11px] text-white leading-relaxed">
              {activeSelectedSub.symptom}
            </p>
            <div className="text-[10px] text-[#8E9299]">
              Población directamente afectada en este polígono: <strong className="text-[#FF4D4D] font-mono">{activeSelectedSub.affectedPopulation.toLocaleString()} personas</strong>.
            </div>
          </div>

          <div className="p-3 bg-[#0A0A0B] border border-[#2A2A2E] rounded-sm space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[#FFAA00] text-[10px] font-bold uppercase">
              <Cpu className="w-3.5 h-3.5" />
              <span>Causa Raíz Mecánica / Estructural:</span>
            </div>
            <p className="text-[11px] text-white leading-relaxed">
              {activeSelectedSub.rootCause}
            </p>
            <div className="text-[10px] text-[#8E9299]">
              Probabilidad de entrada a trampa de pobreza crónica a 6 meses: <strong className="text-white font-mono">{activeSelectedSub.failureProbabilityNext6Months}%</strong>.
            </div>
          </div>
        </div>

        {/* Prescriptive Maintenance & Action Plan (What to do immediately) */}
        <div className="p-3.5 bg-[#0D221D] border border-[#184E42] rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-[#00FFC2]" />
              <span className="text-[10px] font-bold uppercase text-[#00FFC2] tracking-wider">
                PRESCRIPCIÓN DE MANTENIMIENTO PREVENTIVO // ACCIÓN DE POLÍTICA RECOMENDADA
              </span>
            </div>
            <div className="text-xs font-bold text-white">
              {activeSelectedSub.recommendedPrescription.title}
            </div>
            <p className="text-[11px] text-[#8E9299]">
              {activeSelectedSub.recommendedPrescription.protocol}
            </p>
            <div className="flex flex-wrap gap-3 text-[10px] pt-1">
              <span className="text-[#8E9299]">
                Costo Estimado: <strong className="text-white font-mono">${activeSelectedSub.recommendedPrescription.costUSD.toLocaleString()} USD</strong>
              </span>
              <span className="text-[#8E9299]">
                Tiempo de Respuesta: <strong className="text-[#00FFC2] font-mono">{activeSelectedSub.recommendedPrescription.expectedRecoveryDays} días</strong>
              </span>
              <span className="text-[#8E9299]">
                Reducción Esperada de Pobreza: <strong className="text-[#38BDF8] font-mono">&Delta;M₀ {activeSelectedSub.recommendedPrescription.impactDeltaM0.toFixed(3)}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={() => onApplyPrescription(activeSelectedSub.recommendedPrescription, activeSelectedSub.name)}
            className="w-full md:w-auto px-4 py-2 bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] text-xs font-bold uppercase rounded-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar Acción Correctiva</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
