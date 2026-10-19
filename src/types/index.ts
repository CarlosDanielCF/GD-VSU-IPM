/**
 * Types & Interfaces for the Urban Socioeconomic Vulnerability Digital Twin (GD-VSU)
 * Based on Alkire-Foster Multidimensional Poverty Index & Agent-Based Modeling (ABM)
 */

export type UserRole = 'admin' | 'municipal_analyst' | 'researcher' | 'community_validator';

export type PovertyCategory = 'no_pobre' | 'vulnerable' | 'pobre_moderado' | 'pobre_extremo';

// 5 Dimensions of Latin American Urban IPM (Alkire-Foster)
export interface IPMDimensions {
  educacion: number;          // 0-1 deprivation score (Weight: 0.20)
  salud: number;              // 0-1 deprivation score (Weight: 0.20)
  trabajo: number;            // 0-1 deprivation score (Weight: 0.20)
  vivienda_servicios: number; // 0-1 deprivation score (Weight: 0.20)
  activos_redes: number;      // 0-1 deprivation score (Weight: 0.20)
}

export interface AlkireFosterResult {
  M0: number;                  // Adjusted Headcount Ratio (MPI) = H * A (0 - 1)
  H: number;                   // Incidence / Headcount ratio (% of multidimensionally poor)
  A: number;                   // Average Intensity of deprivation among the poor (0 - 1)
  totalHouseholds: number;
  poorHouseholdsCount: number;
  extremePoorHouseholdsCount: number;
  extremePovertyRate: number;  // % with c_score >= 0.50
  vulnerableRate: number;      // % with 0.20 <= c_score < 0.33
  nonPoorRate: number;         // % with c_score < 0.20
  
  // Dimensional Censored Headcount Ratios (h_j(k))
  censoredDimensionalHeadcounts: {
    educacion: number;
    salud: number;
    trabajo: number;
    vivienda_servicios: number;
    activos_redes: number;
  };

  // Dimensional Percentage Contributions to M0: C_j = (w_j * h_j(k)) / M0
  dimensionalContributionsPct: {
    educacion: number;
    salud: number;
    trabajo: number;
    vivienda_servicios: number;
    activos_redes: number;
  };

  // Raw (Uncensored) Headcount Ratios for each of the 12 indicators
  rawIndicatorHeadcounts: Record<keyof IPMIndicators, number>;

  // Censored Headcount Ratios for each indicator
  censoredIndicatorHeadcounts: Record<keyof IPMIndicators, number>;

  // Spatial Inequality
  giniCoefficient: number;
  genderGap: {
    femaleHead_M0: number;
    maleHead_M0: number;
    ratio: number;
  };
}

export interface IPMIndicators {
  // Educación
  asistencia_escolar: boolean;      // privación si algún niño no asiste
  rezago_educativo: boolean;        // privación si adultos sin primaria/secundaria completa
  // Salud
  acceso_salud: boolean;            // privación sin aseguramiento médico
  gasto_catastrofico_salud: boolean; // privación si gasto en salud > 30% ingreso
  // Trabajo
  desempleo_larga_duracion: boolean;// privación si desempleado > 6 meses
  empleo_informal_precario: boolean;// privación si informal sin seguridad social
  // Vivienda y Servicios
  materiales_precarios: boolean;    // privación en piso/paredes/techo
  hacinamiento: boolean;            // > 3 personas por habitación
  carencia_agua_saneamiento: boolean;// sin agua potable o desagüe de red
  carencia_electricidad: boolean;   // sin conexión formal eléctrica
  // Activos y Redes
  carencia_internet_tic: boolean;   // sin conectividad digital básica
  ausencia_redes_apoyo: boolean;    // aislamiento social / sin remesas o apoyo
}

// Micro-level: Household Agent
export interface HouseholdAgent {
  id: string;
  manzanaId: string;
  barrioId: string;
  lat: number;
  lng: number;
  personas: number;
  jefeHogarGenero: 'femenino' | 'masculino';
  jefeHogarEdad: number;
  ingresoPerCapita: number;        // USD/mes ajustado a PPA
  gastoAlimentos: number;
  empleoTipo: 'formal' | 'informal' | 'desempleado' | 'inactivo';
  nivelEducativo: 'ninguno' | 'primaria' | 'secundaria' | 'superior';
  tipoVivienda: 'adecuada' | 'recuperable' | 'precaria';
  serviciosBasicos: {
    aguaRed: boolean;
    desague: boolean;
    electricidad: boolean;
    internet: boolean;
  };
  accesoSaludSeguro: boolean;
  activosPuntaje: number;          // 0-100
  redesApoyoIndice: number;        // 0-1
  beneficiarioProgramaSocial: boolean;
  programaSocialNombre?: string;
  
  // Computed Alkire-Foster status
  privaciones: IPMIndicators;
  dimensiones: IPMDimensions;
  c_score: number;                 // Sum of weighted deprivations (0 to 1)
  is_poor: boolean;                // c_score >= k (k = 0.33)
  is_extreme_poor: boolean;        // c_score >= 0.50
  categoriaPobreza: PovertyCategory;
}

// Meso-level: Neighborhood / Block Spatial Cell
export interface NeighborhoodCell {
  id: string;
  codigo: string;
  nombre: string;
  distrito: string;
  zona: 'centro' | 'comercial' | 'periferia_ladera' | 'expansion_sur';
  areaHectareas: number;
  poblacionTotal: number;
  totalHogares: number;
  densidadPobHa: number;
  estratoSocioeconomico: 'bajo_marginal' | 'bajo' | 'medio_bajo' | 'medio' | 'medio_alto';
  
  // Spatial coordinates & polygon representation
  centroide: [number, number];     // [lat, lng]
  poligono: [number, number][];     // Array of [lat, lng] coordinates
  manzanasIds: string[];
  
  // Aggregated indicators
  ipm_M0: number;                  // Alkire-Foster Adjusted Headcount Ratio M0 = H * A (0 - 1)
  ipm_H: number;                   // Incidence / Headcount Ratio H (% pobres)
  ipm_A: number;                   // Intensity A (promedio privaciones de los pobres)
  pobrezaExtremaPct: number;       // % de hogares con c_score >= 0.50
  brechaGeneroPct: number;         // Diferencia IPM jefe femenino vs masculino
  giniEspacial: number;            // Coeficiente Gini intra-barrio
  
  // Satellite & Urban infrastructure features
  luminosidadNocturnaVIIRS: number; // nW/(cm²·sr) 0-60 (indicador actividad económica)
  indiceVegetacionNDVI: number;     // -0.1 to 0.8 (áreas verdes y calidad ambiental)
  coberturaGHSLInformal: number;    // % huella urbana en asentamiento informal
  distanciaEscuelaMin: number;      // Minutos a pie
  distanciaHospitalMin: number;     // Minutos en transporte
  distanciaMercadoMin: number;      // Minutos a pie
  conectividadTransporteScore: number; // 0-100
  indiceInfraestructura: number;    // 0-100
  
  // Poverty Trap Vulnerability Dynamics
  coeficienteTrampaPobreza: number;// 0-1 probabilidad de estancamiento estructural
  nivelAlerta: 'normal' | 'moderada' | 'alta' | 'critica_roja';
  
  // Historical Series (2010 - 2024)
  historicoIPM: {
    year: number;
    ipm_M0: number;
    ipm_H: number;
    ipm_A: number;
    pobrezaExtrema: number;
  }[];
  
  // Dimension Contributions (Pareto)
  contribucionDimensiones: {
    educacion: number;
    salud: number;
    trabajo: number;
    vivienda_servicios: number;
    activos_redes: number;
  };
}

export interface BlockCell {
  id: string;
  barrioId: string;
  codigoManzana: string;
  poligono: [number, number][];
  centroide: [number, number];
  hogaresCount: number;
  ipm_M0: number;
  pobrezaPct: number;
  luminosidad: number;
  riesgoClimaticoInundacion: number; // 0-1
}

// Point of Interest (POI)
export interface UrbanPOI {
  id: string;
  nombre: string;
  tipo: 'hospital' | 'escuela' | 'mercado' | 'banco_inclusion' | 'centro_comunitario' | 'comisaria';
  lat: number;
  lng: number;
  radioInfluenciaMetros: number;
  capacidad: number;
  estado: 'operativo' | 'saturado' | 'nuevo_proyectado';
}

// Macro-level: External Shocks
export type ShockType = 'inflacion_alimentos' | 'desastre_climatico_inundacion' | 'crisis_sanitaria_pandemia' | 'shock_desempleo_recesion';

export interface ShockScenario {
  id: string;
  tipo: ShockType;
  nombre: string;
  descripcion: string;
  activo: boolean;
  magnitud: number;                 // Multiplier/percentage (e.g., 0.20 = +20% inflation)
  duracionMeses: number;
  radioAfectacionKm?: number;
  epicentroLat?: number;
  epicentroLng?: number;
  barriosAfectadosIds?: string[];
  impactoEnEmpleoInformalPct: number;
  impactoEnGastoSaludPct: number;
  impactoEnCanastaBasicaPct: number;
}

// Macro-level: Policy Interventions
export type PolicyType = 'transferencia_condicionada' | 'empleo_temporal_obras' | 'subsidio_mejoramiento_vivienda' | 'infraestructura_salud_educacion' | 'inclusion_digital_conectividad';

export interface PolicyScenario {
  id: string;
  tipo: PolicyType;
  nombre: string;
  descripcion: string;
  activo: boolean;
  presupuestoMillonesUSD: number;
  hogaresMetaCount: number;
  criterioFocalizacion: 'ipm_alto' | 'pobreza_extrema' | 'jefas_hogar' | 'asentamientos_informales' | 'universal_barrio';
  barriosObjetivoIds: string[];
  montoTransferenciaUSD?: number;
  mejoraServiciosDirecta?: boolean;
  nuevosPOIsCount?: number;
}

// Simulation Configuration & Run Result
export interface SimulationConfig {
  id: string;
  nombre: string;
  yearInicio: number;
  yearFin: number;
  stepMeses: number;
  shocks: ShockScenario[];
  policies: PolicyScenario[];
  calibracionGeneticaDEAP: boolean;
  monteCarloRuns: number;
  tasaDescuentoPobrezaVecindario: number; // neighborhood contagion rate (0.05 - 0.30)
}

export interface SimulationStepResult {
  step: number;
  fecha: string;                   // "2024-Q1", "2025-06", etc.
  year: number;
  mes: number;
  ciudad_ipm_M0: number;
  ciudad_ipm_H: number;
  ciudad_ipm_A: number;
  ciudad_pobreza_extrema_pct: number;
  ciudad_gini_espacial: number;
  barriosKpi: Record<string, {
    ipm_M0: number;
    ipm_H: number;
    ipm_A: number;
    pobrezaExtremaPct: number;
    alerta: 'normal' | 'moderada' | 'alta' | 'critica_roja';
  }>;
  transicionesPobreza: {
    noPobreToVulnerable: number;
    vulnerableToPobre: number;
    pobreToExtremo: number;
    extremoToPobre: number;
    pobreToVulnerable: number;
    vulnerableToNoPobre: number;
  };
  dimensionesPromedio: IPMDimensions;
}

export interface SimulationRunResult {
  id: string;
  config: SimulationConfig;
  timestamp: string;
  duracionEjecucionMs: number;
  resumenImpacto: {
    ipm_inicial: number;
    ipm_final: number;
    delta_ipm: number;
    delta_ipm_pct: number;
    hogaresSalieronPobreza: number;
    hogaresCayeronPobreza: number;
    barriosEnAlertaRojaInicial: number;
    barriosEnAlertaRojaFinal: number;
    costoEfectividadUSDporHogar: number;
  };
  pasos: SimulationStepResult[];
  prediccionAlertas: {
    meses3: NeighborhoodAlert[];
    meses6: NeighborhoodAlert[];
    meses12: NeighborhoodAlert[];
  };
}

export interface NeighborhoodAlert {
  barrioId: string;
  nombre: string;
  distrito: string;
  ipmActual: number;
  ipmProyectado: number;
  deltaProyectado: number;
  probabilidadSuperarUmbralCritico: number; // 0-1
  factoresClaveRiesgo: string[];
  recomendacionPolitica: string;
}

// User Audit Log for Governance
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  usuario: string;
  rol: UserRole;
  accion: string;
  detalles: string;
  escenarioId?: string;
}
