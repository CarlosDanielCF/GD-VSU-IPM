import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserRole, 
  ShockScenario, 
  PolicyScenario, 
  NeighborhoodCell, 
  BlockCell, 
  UrbanPOI, 
  SimulationConfig, 
  SimulationRunResult,
  AlkireFosterResult,
  NeighborhoodAlert
} from './types';
import { LATIN_AMERICA_CITY_DATA } from './data/latinAmericaCityData';
import { PERU_DEPARTMENTS_DATA, generateDepartmentData } from './data/peruNationalData';
import { AlkireFosterEngine } from './services/alkireFoster';
import { ABMSimulator } from './services/abmSimulator';
import { MLEngineService } from './services/mlEngineService';
import type { MLFullEngineResult } from './types/mlTypes';

// Components
import { Navbar } from './components/Navbar';
import { DigitalTwinMap } from './components/Map/DigitalTwinMap';
import { OverviewKPIs } from './components/Dashboard/OverviewKPIs';
import { TimeTravelSlider } from './components/Dashboard/TimeTravelSlider';
import { DimensionsBreakdown } from './components/Dashboard/DimensionsBreakdown';
import { SankeyTransitions } from './components/Dashboard/SankeyTransitions';
import { UrbanDigitalTwinDiagnostics, UrbanSubsystemDiagnostic } from './components/Dashboard/UrbanDigitalTwinDiagnostics';
import { ScenarioBuilder } from './components/Scenarios/ScenarioBuilder';
import { ScenarioComparator } from './components/Scenarios/ScenarioComparator';
import { EarlyWarningPanel } from './components/Forecasting/EarlyWarningPanel';
import { ArchitectureExplorer } from './components/Architecture/ArchitectureExplorer';
import { LiveIoTSensorNetwork } from './components/Dashboard/LiveIoTSensorNetwork';
import { UrbanResilienceStressTest } from './components/Dashboard/UrbanResilienceStressTest';
import { MicroAgentInspectorModal } from './components/Dashboard/MicroAgentInspectorModal';
import { ReportGeneratorModal } from './components/Reports/ReportGeneratorModal';
import { AuditGovernanceModal } from './components/Governance/AuditGovernanceModal';
import { InteractiveGuideModal } from './components/Guide/InteractiveGuideModal';
import { TerritorialAICopilot } from './components/AI/TerritorialAICopilot';
import type { AIScenarioDraft } from './types/aiTypes';
import { SystemInterpretabilityPanel } from './components/Interpretability/SystemInterpretabilityPanel';
import { RealDataEnginePanel } from './components/Analytics/RealDataEnginePanel';
import { loadRealDataset, trainRealModel } from './services/realDataEngine';
import type { RealDataset, RealModelResult } from './types/realData';
import type { DatasetProfile } from './types/realData';

export default function App() {
  // Navigation & Role
  const [activeTab, setActiveTab] = useState<'dashboard' | 'real_data' | 'scenarios' | 'comparator' | 'forecasting' | 'ml_engine' | 'iot_sensors' | 'stress_test' | 'ai_copilot' | 'architecture'>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('municipal_analyst');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('lima');
  const [selectedCity, setSelectedCity] = useState<string>('Lima Metropolitana y Callao');
  const [isAgentInspectorOpen, setIsAgentInspectorOpen] = useState<boolean>(false);

  // Timeline
  const [currentYear, setCurrentYear] = useState<number>(2024);

  // Entities & Geospatial Data
  const [currentHouseholds, setCurrentHouseholds] = useState(LATIN_AMERICA_CITY_DATA.hogares);
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodCell[]>(LATIN_AMERICA_CITY_DATA.barrios);
  const [blocks, setBlocks] = useState<BlockCell[]>(LATIN_AMERICA_CITY_DATA.manzanas);
  const [pois, setPois] = useState<UrbanPOI[]>(LATIN_AMERICA_CITY_DATA.puntosInteres);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodCell | null>(null);

  // Shocks & Policies
  const [shocks, setShocks] = useState<ShockScenario[]>(LATIN_AMERICA_CITY_DATA.escenariosChoque);
  const [policies, setPolicies] = useState<PolicyScenario[]>(LATIN_AMERICA_CITY_DATA.escenariosPolitica);

  // Switch Peru Department / Regional Digital Twin
  const handleSelectDepartment = useCallback((deptId: string) => {
    setSelectedDeptId(deptId);
    const deptInfo = PERU_DEPARTMENTS_DATA.find(d => d.id === deptId);
    if (deptInfo) {
      setSelectedCity(deptInfo.nombre);
    }
    
    // Generate specialized spatial, household and socioeconomic data for this department
    const deptDataset = generateDepartmentData(deptId);
    setNeighborhoods(deptDataset.barrios);
    setBlocks(deptDataset.manzanas);
    setPois(deptDataset.puntosInteres);
    setCurrentHouseholds(deptDataset.hogares);
    setShocks(deptDataset.escenariosChoque);
    setPolicies(deptDataset.escenariosPolitica);
    setSelectedNeighborhood(null);
    setLastSimResult(null);
    setCurrentYear(2024);
  }, []);

  // Simulation Status
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lastSimResult, setLastSimResult] = useState<SimulationRunResult | null>(null);
  const [trainedMLResult, setTrainedMLResult] = useState<MLFullEngineResult | null>(null);
  const [realDataset, setRealDataset] = useState<RealDataset | null>(null);
  const [realModel, setRealModel] = useState<RealModelResult | null>(null);
  const [realDataError, setRealDataError] = useState<string | null>(null);

  useEffect(() => { loadRealDataset().then(data => { setRealDataset(data); setRealModel(trainRealModel(data)); }).catch(error => setRealDataError(String(error))); }, []);
  const handleDatasetChange = useCallback((data: RealDataset, _profile: DatasetProfile) => { setRealDataset(data); setRealModel(trainRealModel(data)); setRealDataError(null); }, []);
  const resetRealDataset = useCallback(() => { setRealDataError(null); loadRealDataset().then(data => { setRealDataset(data); setRealModel(trainRealModel(data)); }).catch(error => setRealDataError(String(error))); }, []);

  const calibratedMLResult = useMemo(
    () => MLEngineService.runFullEngine(neighborhoods, selectedCity),
    [neighborhoods, selectedCity]
  );
  const activeMLResult = trainedMLResult || calibratedMLResult;

  useEffect(() => {
    setTrainedMLResult(null);
  }, [selectedDeptId]);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Compute Alkire-Foster Multidimensional Poverty Index
  const baselineAF: AlkireFosterResult = useMemo(() => {
    return AlkireFosterEngine.calculateMPI(currentHouseholds);
  }, [currentHouseholds]);

  const currentAF: AlkireFosterResult = useMemo(() => {
    if (lastSimResult && currentYear > 2024) {
      return lastSimResult.indicadoresFinales;
    }
    // Interpolate historically for years 2010 to 2024
    if (currentYear < 2024) {
      const yearFactor = (2024 - currentYear) * 0.006;
      const simulatedM0 = Math.max(0.08, baselineAF.M0 + yearFactor + (currentYear === 2020 ? 0.05 : 0));
      return {
        ...baselineAF,
        M0: Number(simulatedM0.toFixed(4)),
        H: Number((simulatedM0 / baselineAF.A).toFixed(4)),
        poorHouseholdsCount: Math.round((simulatedM0 / baselineAF.A) * baselineAF.totalHouseholds)
      };
    }
    return baselineAF;
  }, [baselineAF, lastSimResult, currentYear]);

  // Early Warning Alerts
  const alerts3m: NeighborhoodAlert[] = useMemo(() => {
    return neighborhoods
      .filter(n => n.ipm_M0 >= 0.35)
      .map(n => ({
        barrioId: n.id,
        nombre: n.nombre,
        distrito: n.distrito,
        ipmProyectado: Number((n.ipm_M0 * 1.05).toFixed(3)),
        nivelRiesgo: n.ipm_M0 >= 0.45 ? 'critico' : 'alto',
        factoresClaveRiesgo: ['Informalidad laboral >75%', 'Precios de alimentos volátiles', 'GHSL en ladera'],
        recomendacionPolitica: 'Refuerzo de transferencias directas y ollas comunes.'
      }));
  }, [neighborhoods]);

  const alerts6m: NeighborhoodAlert[] = useMemo(() => {
    return neighborhoods
      .filter(n => n.ipm_M0 >= 0.30)
      .map(n => ({
        barrioId: n.id,
        nombre: n.nombre,
        distrito: n.distrito,
        ipmProyectado: Number((n.ipm_M0 * 1.09).toFixed(3)),
        nivelRiesgo: n.ipm_M0 >= 0.40 ? 'critico' : 'medio',
        factoresClaveRiesgo: ['Saturación de centros de salud', 'Déficit de agua por cisterna'],
        recomendacionPolitica: 'Ampliación de red pública de agua y subsidio tarifario.'
      }));
  }, [neighborhoods]);

  const alerts12m: NeighborhoodAlert[] = useMemo(() => {
    return neighborhoods
      .filter(n => n.ipm_M0 >= 0.25)
      .map(n => ({
        barrioId: n.id,
        nombre: n.nombre,
        distrito: n.distrito,
        ipmProyectado: Number((n.ipm_M0 * 1.14).toFixed(3)),
        nivelRiesgo: n.ipm_M0 >= 0.40 ? 'critico' : 'medio',
        factoresClaveRiesgo: ['Riesgo de remoción en masa (Lluvias El Niño)', 'Falta de empleo formal'],
        recomendacionPolitica: 'Programa de empleo temporal en infraestructura de contención.'
      }));
  }, [neighborhoods]);

  const sensitivityAnalysis = useMemo(() => {
    return [
      { dimension: 'Empleo & Trabajo Formal', mejoraPct: 10, reduccionIPM_Pct: 2.8, elasticidad: 0.28, eficienciaInversion: 'Muy Alta' },
      { dimension: 'Vivienda & Agua Potable', mejoraPct: 10, reduccionIPM_Pct: 2.4, elasticidad: 0.24, eficienciaInversion: 'Alta' },
      { dimension: 'Salud & Seguro Integral', mejoraPct: 10, reduccionIPM_Pct: 1.9, elasticidad: 0.19, eficienciaInversion: 'Media-Alta' },
      { dimension: 'Educación & Acceso Digital', mejoraPct: 10, reduccionIPM_Pct: 1.5, elasticidad: 0.15, eficienciaInversion: 'Media' },
      { dimension: 'Conectividad & TIC', mejoraPct: 10, reduccionIPM_Pct: 1.1, elasticidad: 0.11, eficienciaInversion: 'Media' }
    ];
  }, []);

  // Shock Handlers
  const handleToggleShock = useCallback((shockId: string) => {
    setShocks(prev => prev.map(s => s.id === shockId ? { ...s, activo: !s.activo } : s));
  }, []);

  const handleUpdateShockMagnitud = useCallback((shockId: string, magnitud: number) => {
    setShocks(prev => prev.map(s => s.id === shockId ? { ...s, magnitud } : s));
  }, []);

  // Policy Handlers
  const handleTogglePolicy = useCallback((policyId: string) => {
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, activo: !p.activo } : p));
  }, []);

  const handleUpdatePolicyBudget = useCallback((policyId: string, budget: number) => {
    setPolicies(prev => prev.map(p => p.id === policyId ? { ...p, presupuestoMillonesUSD: budget } : p));
  }, []);

  // Presets
  const handleApplyPreset = useCallback((preset: 'shock_crisis' | 'policy_package' | 'ods_eradication') => {
    if (preset === 'shock_crisis') {
      setShocks(prev => prev.map(s => ({ ...s, activo: s.id === 'shock_inflacion_alimentos' || s.id === 'shock_inundacion_ladera' })));
      setPolicies(prev => prev.map(p => ({ ...p, activo: false })));
    } else if (preset === 'policy_package') {
      setShocks(prev => prev.map(s => ({ ...s, activo: false })));
      setPolicies(prev => prev.map(p => ({ ...p, activo: true })));
    } else if (preset === 'ods_eradication') {
      setShocks(prev => prev.map(s => ({ ...s, activo: false })));
      setPolicies(prev => prev.map(p => ({ ...p, activo: true, presupuestoMillonesUSD: p.presupuestoMillonesUSD * 1.5 })));
    }
  }, []);

  // Run ABM Simulation Trigger
  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);

    setTimeout(() => {
      const result = ABMSimulator.runSimulation(
        currentHouseholds,
        neighborhoods,
        shocks,
        policies,
        {
          yearInicio: 2024,
          yearFin: 2030,
          stepMeses: 3,
          calibracionGeneticaDEAP: true,
          monteCarloRuns: 10
        }
      );

      setLastSimResult(result);
      setNeighborhoods(result.barriosActualizados);
      setCurrentYear(2030);
      setIsSimulating(false);
      setActiveTab('comparator');
    }, 600);
  }, [currentHouseholds, neighborhoods, shocks, policies]);

  // Prescriptive Action Handler directly from Digital Twin Engine
  const handleApplyPrescription = useCallback((
    prescription: UrbanSubsystemDiagnostic['recommendedPrescription'],
    subsystemName: string
  ) => {
    // Automatically provision and activate an emergency mitigation policy
    const newPolicyId = `policy_rx_${Date.now()}`;
    const dynamicPolicy: PolicyScenario = {
      id: newPolicyId,
      nombre: `RX-URGENTE: ${prescription.title}`,
      tipo: prescription.actionType === 'EMERGENCY_DISPATCH' ? 'transferencia_condicionada' :
            prescription.actionType === 'STRUCTURAL_UPGRADE' ? 'subsidio_mejoramiento_vivienda' : 'empleo_temporal_obras',
      activo: true,
      presupuestoMillonesUSD: Number((prescription.costUSD / 1000000).toFixed(3)) || 0.15,
      hogaresMetaCount: 1200,
      criterioFocalizacion: selectedNeighborhood ? 'ipm_alto' : 'universal_barrio',
      barriosObjetivoIds: selectedNeighborhood ? [selectedNeighborhood.id] : [],
      descripcion: `${prescription.protocol} [Origen: Prescripción de Falla en ${subsystemName}]`
    };

    setPolicies(prev => [dynamicPolicy, ...prev]);
    // Run simulation to instantly see the predictive recovery curve
    setTimeout(() => {
      handleRunSimulation();
    }, 100);
  }, [selectedNeighborhood, handleRunSimulation]);

  // Select Neighborhood by ID from Alerta Radar
  const handleSelectNeighborhoodById = useCallback((barrioId: string) => {
    const barrio = neighborhoods.find(n => n.id === barrioId);
    if (barrio) {
      setSelectedNeighborhood(barrio);
      setActiveTab('dashboard');
    }
  }, [neighborhoods]);

  // AI drafts are always staged in the scenario configurator; they never run automatically.
  const handleApplyAIScenarioDraft = useCallback((draft: AIScenarioDraft) => {
    setShocks(prev => [...draft.shocks, ...prev]);
    setPolicies(prev => [...draft.policies, ...prev]);
    setActiveTab('scenarios');
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] tech-grid-bg text-[#E0E0E0] flex flex-col font-sans selection:bg-[#00FFC2] selection:text-[#0A0A0B]">
      
      {/* 1. Global Navigation Bar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenGovernanceModal={() => setIsGovernanceModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        onOpenAgentInspector={() => setIsAgentInspectorOpen(true)}
        onRunSimulation={handleRunSimulation}
        isSimulating={isSimulating}
        selectedCity={selectedCity}
        selectedDeptId={selectedDeptId}
        onSelectDepartment={handleSelectDepartment}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        
        {/* Top KPIs Summary Bar */}
        <OverviewKPIs
          afResult={currentAF}
          neighborhoods={neighborhoods}
          currentYear={currentYear}
          isSimulatedHorizon={currentYear > 2024}
        />

        {/* Contextual explanation shared by every table and figure in the active module. */}
        <SystemInterpretabilityPanel
          module={activeTab}
          territory={selectedCity}
          year={currentYear}
          m0={currentAF.M0}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5">
            {/* Interactive Timeline Player */}
            <TimeTravelSlider
              currentYear={currentYear}
              onYearChange={setCurrentYear}
              minYear={2010}
              maxYear={2030}
            />

            {/* Interactive 3D WebGL / 2D GIS Digital Twin Map */}
            <DigitalTwinMap
              neighborhoods={neighborhoods}
              blocks={blocks}
              pois={pois}
              selectedNeighborhood={selectedNeighborhood}
              onSelectNeighborhood={setSelectedNeighborhood}
              activeShocks={shocks}
              activePolicies={policies}
              currentYear={currentYear}
              onOpenGuide={() => setIsGuideModalOpen(true)}
            />

            {/* Urban Digital Twin Aircraft-like Subsystem Diagnostics & Failure Telemetry */}
            <UrbanDigitalTwinDiagnostics
              selectedNeighborhood={selectedNeighborhood}
              neighborhoods={neighborhoods}
              activeShocks={shocks}
              activePolicies={policies}
              currentYear={currentYear}
              onApplyPrescription={handleApplyPrescription}
              onSelectNeighborhood={setSelectedNeighborhood}
            />

            {/* Alkire-Foster 5 Dimensions Radar & Pareto Decomposition */}
            <DimensionsBreakdown
              afResult={currentAF}
              selectedNeighborhood={selectedNeighborhood}
            />

            {/* Micro Transitions & Poverty Flow Matrix */}
            <SankeyTransitions
              afResult={currentAF}
              lastStepResult={lastSimResult?.pasosTrimestrales[lastSimResult.pasosTrimestrales.length - 1]}
            />
          </div>
        )}

        {activeTab === 'real_data' && <RealDataEnginePanel dataset={realDataset} model={realModel} error={realDataError} departmentId={selectedDeptId} onDatasetChange={handleDatasetChange} onReset={resetRealDataset} />}

        {activeTab === 'scenarios' && (
          <ScenarioBuilder
            shocks={shocks}
            policies={policies}
            neighborhoods={neighborhoods}
            onToggleShock={handleToggleShock}
            onUpdateShockMagnitud={handleUpdateShockMagnitud}
            onTogglePolicy={handleTogglePolicy}
            onUpdatePolicyBudget={handleUpdatePolicyBudget}
            onApplyPreset={handleApplyPreset}
            onRunSimulation={handleRunSimulation}
            isSimulating={isSimulating}
          />
        )}

        {activeTab === 'comparator' && (
          <ScenarioComparator
            baselineAF={baselineAF}
            simulatedAF={currentAF}
            lastSimResult={lastSimResult}
            neighborhoods={neighborhoods}
          />
        )}

        {activeTab === 'forecasting' && (
          <EarlyWarningPanel
            alerts3m={alerts3m}
            alerts6m={alerts6m}
            alerts12m={alerts12m}
            sensitivityAnalysis={sensitivityAnalysis}
            onSelectNeighborhoodById={handleSelectNeighborhoodById}
          />
        )}

        {activeTab === 'iot_sensors' && (
          <LiveIoTSensorNetwork
            neighborhoods={neighborhoods}
            selectedNeighborhood={selectedNeighborhood}
          />
        )}

        {activeTab === 'stress_test' && (
          <UrbanResilienceStressTest
            neighborhoods={neighborhoods}
            activeShocks={shocks}
            activePolicies={policies}
            afResult={currentAF}
          />
        )}

        {activeTab === 'ai_copilot' && (
          <TerritorialAICopilot
            role={currentRole}
            departmentId={selectedDeptId}
            territoryName={selectedCity}
            year={currentYear}
            afResult={currentAF}
            neighborhoods={neighborhoods}
            selectedNeighborhood={selectedNeighborhood}
            shocks={shocks}
            policies={policies}
            lastSimulation={lastSimResult}
            mlResult={activeMLResult}
            onSelectNeighborhood={(neighborhood) => {
              setSelectedNeighborhood(neighborhood);
              setActiveTab('dashboard');
            }}
            onApplyScenarioDraft={handleApplyAIScenarioDraft}
            onNavigateScenarios={() => setActiveTab('scenarios')}
            onSelectDepartment={handleSelectDepartment}
            realDataset={realDataset}
            realModel={realModel}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureExplorer />
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#2A2A2E] bg-[#111113] py-3 text-center text-xs text-[#8E9299] font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GD-VSU // URBAN DIGITAL TWIN · ALKIRE-FOSTER METRIC (M₀ = H × A, k=0.33)</span><span className="text-[10px] text-[#00FFC2]">MESA_ABM · NSGA-II · POSTGIS · LEAFLET · RECHARTS</span>
        </div>
      </footer>

      {/* 4. Modals */}
      <MicroAgentInspectorModal
        isOpen={isAgentInspectorOpen}
        onClose={() => setIsAgentInspectorOpen(false)}
        households={currentHouseholds}
        neighborhoods={neighborhoods}
      />

      <ReportGeneratorModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        neighborhoods={neighborhoods}
        blocks={blocks}
        afResult={currentAF}
        lastSimResult={lastSimResult}
        selectedCity={selectedCity}
      />

      <AuditGovernanceModal
        isOpen={isGovernanceModalOpen}
        onClose={() => setIsGovernanceModalOpen(false)}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
      />

      <InteractiveGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
        }}
        onRunSimulation={handleRunSimulation}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

    </div>
  );
}
