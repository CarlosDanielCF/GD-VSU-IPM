import {
  HouseholdAgent,
  NeighborhoodCell,
  ShockScenario,
  PolicyScenario,
  SimulationConfig,
  SimulationStepResult,
  SimulationRunResult,
  NeighborhoodAlert,
  IPMDimensions,
  IPMIndicators
} from '../types';
import { calculateAlkireFoster } from './alkireFoster';

/**
 * Universal Multi-Agent Simulation Engine (ABM-DT)
 * 3-Tier Hierarchical Simulation: Micro (Households) <-> Meso (Neighborhoods) <-> Macro (City, Policies & Shocks)
 */

export class ABMSimulator {
  private initialHouseholds: HouseholdAgent[];
  private initialNeighborhoods: NeighborhoodCell[];

  constructor(households: HouseholdAgent[], neighborhoods: NeighborhoodCell[]) {
    // Deep clone to ensure pristine state
    this.initialHouseholds = JSON.parse(JSON.stringify(households));
    this.initialNeighborhoods = JSON.parse(JSON.stringify(neighborhoods));
  }

  /**
   * Runs the complete prospective multi-step ABM simulation (e.g., 2024 to 2030)
   */
  public runSimulation(config: SimulationConfig): SimulationRunResult {
    const startTime = Date.now();
    let currentHouseholds: HouseholdAgent[] = JSON.parse(JSON.stringify(this.initialHouseholds));
    let currentNeighborhoods: NeighborhoodCell[] = JSON.parse(JSON.stringify(this.initialNeighborhoods));

    const steps: SimulationStepResult[] = [];
    const totalSteps = (config.yearFin - config.yearInicio) * 4; // Quarterly steps
    const activeShocks = config.shocks.filter(s => s.activo);
    const activePolicies = config.policies.filter(p => p.activo);

    let previousPovertyMap = new Map<string, HouseholdAgent['categoriaPobreza']>();
    currentHouseholds.forEach(h => previousPovertyMap.set(h.id, h.categoriaPobreza));

    // Baseline calculation at Step 0
    const baselineAF = calculateAlkireFoster(currentHouseholds);
    
    // Neighborhood lookup map
    const neighborhoodMap = new Map<string, NeighborhoodCell>();
    currentNeighborhoods.forEach(n => neighborhoodMap.set(n.id, n));

    let stepCounter = 0;
    for (let y = config.yearInicio; y <= config.yearFin; y++) {
      for (let q = 1; q <= 4; q++) {
        // Stop if we exceed final year's Q4
        if (y === config.yearFin && q > 4) break;

        const currentMonth = (y - config.yearInicio) * 12 + q * 3;
        stepCounter++;

        // 1. Apply Macro Shocks active during this time window
        const activeShocksInStep = activeShocks.filter(s => currentMonth <= s.duracionMeses);

        // 2. Apply Active Public Policies
        const activePoliciesInStep = activePolicies;

        // 3. Step every Household Agent (Micro Level)
        const transitions = {
          noPobreToVulnerable: 0,
          vulnerableToPobre: 0,
          pobreToExtremo: 0,
          extremoToPobre: 0,
          pobreToVulnerable: 0,
          vulnerableToNoPobre: 0
        };

        currentHouseholds = currentHouseholds.map(household => {
          const barrio = neighborhoodMap.get(household.barrioId);
          const updatedHH = this.stepHousehold(
            household,
            barrio,
            activeShocksInStep,
            activePoliciesInStep,
            config.tasaDescuentoPobrezaVecindario
          );

          // Track state transitions
          const oldCat = previousPovertyMap.get(household.id)!;
          const newCat = updatedHH.categoriaPobreza;

          if (oldCat === 'no_pobre' && (newCat === 'vulnerable' || newCat === 'pobre_moderado')) transitions.noPobreToVulnerable++;
          if (oldCat === 'vulnerable' && (newCat === 'pobre_moderado' || newCat === 'pobre_extremo')) transitions.vulnerableToPobre++;
          if (oldCat === 'pobre_moderado' && newCat === 'pobre_extremo') transitions.pobreToExtremo++;
          if (oldCat === 'pobre_extremo' && newCat === 'pobre_moderado') transitions.extremoToPobre++;
          if (oldCat === 'pobre_moderado' && (newCat === 'vulnerable' || newCat === 'no_pobre')) transitions.pobreToVulnerable++;
          if (oldCat === 'vulnerable' && newCat === 'no_pobre') transitions.vulnerableToNoPobre++;

          previousPovertyMap.set(household.id, newCat);
          return updatedHH;
        });

        // 4. Update Meso-level Neighborhood Aggregates
        const barriosKpi: SimulationStepResult['barriosKpi'] = {};
        
        currentNeighborhoods.forEach(barrio => {
          const barrioHouseholds = currentHouseholds.filter(h => h.barrioId === barrio.id);
          const barrioAF = calculateAlkireFoster(barrioHouseholds);

          let alerta: NeighborhoodCell['nivelAlerta'] = 'normal';
          if (barrioAF.M0 >= 0.45) alerta = 'critica_roja';
          else if (barrioAF.M0 >= 0.35) alerta = 'alta';
          else if (barrioAF.M0 >= 0.20) alerta = 'moderada';

          barrio.ipm_M0 = barrioAF.M0;
          barrio.ipm_H = barrioAF.H;
          barrio.ipm_A = barrioAF.A;
          barrio.pobrezaExtremaPct = barrioAF.extremePovertyRate;
          barrio.nivelAlerta = alerta;

          barriosKpi[barrio.id] = {
            ipm_M0: barrioAF.M0,
            ipm_H: barrioAF.H,
            ipm_A: barrioAF.A,
            pobrezaExtremaPct: barrioAF.extremePovertyRate,
            alerta
          };
        });

        // 5. Macro-level City Aggregates
        const cityAF = calculateAlkireFoster(currentHouseholds);

        steps.push({
          step: stepCounter,
          fecha: `${y}-Q${q}`,
          year: y,
          mes: q * 3,
          ciudad_ipm_M0: cityAF.M0,
          ciudad_ipm_H: cityAF.H,
          ciudad_ipm_A: cityAF.A,
          ciudad_pobreza_extrema_pct: cityAF.extremePovertyRate,
          ciudad_gini_espacial: cityAF.giniCoefficient,
          barriosKpi,
          transicionesPobreza: transitions,
          dimensionesPromedio: {
            educacion: cityAF.censoredDimensionalHeadcounts.educacion,
            salud: cityAF.censoredDimensionalHeadcounts.salud,
            trabajo: cityAF.censoredDimensionalHeadcounts.trabajo,
            vivienda_servicios: cityAF.censoredDimensionalHeadcounts.vivienda_servicios,
            activos_redes: cityAF.censoredDimensionalHeadcounts.activos_redes
          }
        });
      }
    }

    const finalStep = steps[steps.length - 1];
    const delta_ipm = finalStep ? Number((finalStep.ciudad_ipm_M0 - baselineAF.M0).toFixed(4)) : 0;
    const delta_ipm_pct = baselineAF.M0 > 0 ? Number(((delta_ipm / baselineAF.M0) * 100).toFixed(2)) : 0;

    // Calculate budget spent
    const totalBudget = activePolicies.reduce((acc, p) => acc + p.presupuestoMillonesUSD * 1_000_000, 0);
    const poorDiff = (baselineAF.poorHouseholdsCount - (finalStep ? Math.round(finalStep.ciudad_ipm_H * currentHouseholds.length) : 0));
    const costoEfectividad = poorDiff > 0 ? Math.round(totalBudget / poorDiff) : 0;

    // Compute Early Warnings at 3, 6, 12 months from current prospective step
    const prediccionAlertas = this.generateEarlyWarnings(steps, currentNeighborhoods);

    const initialRedCount = this.initialNeighborhoods.filter(b => b.nivelAlerta === 'critica_roja').length;
    const finalRedCount = currentNeighborhoods.filter(b => b.nivelAlerta === 'critica_roja').length;

    return {
      id: `sim-${Date.now()}`,
      config,
      timestamp: new Date().toISOString(),
      duracionEjecucionMs: Date.now() - startTime,
      resumenImpacto: {
        ipm_inicial: baselineAF.M0,
        ipm_final: finalStep ? finalStep.ciudad_ipm_M0 : baselineAF.M0,
        delta_ipm,
        delta_ipm_pct,
        hogaresSalieronPobreza: Math.max(0, poorDiff),
        hogaresCayeronPobreza: Math.max(0, -poorDiff),
        barriosEnAlertaRojaInicial: initialRedCount,
        barriosEnAlertaRojaFinal: finalRedCount,
        costoEfectividadUSDporHogar: costoEfectividad
      },
      pasos: steps,
      prediccionAlertas
    };
  }

  /**
   * Micro-level state transition rules for an individual HouseholdAgent
   */
  private stepHousehold(
    hh: HouseholdAgent,
    barrio: NeighborhoodCell | undefined,
    shocks: ShockScenario[],
    policies: PolicyScenario[],
    contagionRate: number
  ): HouseholdAgent {
    const next = { ...hh, privaciones: { ...hh.privaciones }, serviciosBasicos: { ...hh.serviciosBasicos } };
    const barrioIPM = barrio ? barrio.ipm_M0 : 0.20;
    const isSlope = barrio?.zona === 'periferia_ladera';

    // 1. Natural drift & Neighborhood Contagion (Poverty Trap Feedback)
    // Higher neighborhood IPM increases probability of falling into poverty
    const contagionEffect = barrioIPM * contagionRate * 0.1;
    let netIncomeMultiplier = 1.0;

    // 2. Process Shocks
    shocks.forEach(shock => {
      // Check spatial bounding for localized shocks (e.g. flood)
      const isAffectedArea = !shock.barriosAfectadosIds || shock.barriosAfectadosIds.includes(hh.barrioId);
      if (!isAffectedArea) return;

      if (shock.tipo === 'inflacion_alimentos') {
        netIncomeMultiplier *= (1 - shock.magnitud * 0.45);
        if (hh.empleoTipo === 'informal') {
          if (Math.random() < 0.18) next.privaciones.empleo_informal_precario = true;
        }
      }

      if (shock.tipo === 'desastre_climatico_inundacion' && isSlope) {
        if (Math.random() < shock.magnitud * 0.75) {
          next.privaciones.materiales_precarios = true;
          next.privaciones.carencia_agua_saneamiento = true;
          next.privaciones.gasto_catastrofico_salud = true;
        }
      }

      if (shock.tipo === 'crisis_sanitaria_pandemia') {
        if (hh.empleoTipo === 'informal') {
          netIncomeMultiplier *= 0.55;
          if (Math.random() < 0.35) next.privaciones.desempleo_larga_duracion = true;
        }
        if (Math.random() < 0.30) next.privaciones.gasto_catastrofico_salud = true;
      }
    });

    // 3. Process Policies
    policies.forEach(policy => {
      const isTargetBarrio = !policy.barriosObjetivoIds.length || policy.barriosObjetivoIds.includes(hh.barrioId);
      if (!isTargetBarrio) return;

      // Check eligibility
      let eligible = false;
      if (policy.criterioFocalizacion === 'universal_barrio') eligible = true;
      if (policy.criterioFocalizacion === 'pobreza_extrema' && hh.is_extreme_poor) eligible = true;
      if (policy.criterioFocalizacion === 'ipm_alto' && (hh.is_poor || hh.is_extreme_poor)) eligible = true;
      if (policy.criterioFocalizacion === 'jefas_hogar' && hh.jefeHogarGenero === 'femenino') eligible = true;
      if (policy.criterioFocalizacion === 'asentamientos_informales' && isSlope) eligible = true;

      if (!eligible) return;

      if (policy.tipo === 'transferencia_condicionada') {
        netIncomeMultiplier *= 1.35;
        next.beneficiarioProgramaSocial = true;
        next.programaSocialNombre = policy.nombre;
        // Conditionality flips schooling & health
        if (Math.random() < 0.80) next.privaciones.asistencia_escolar = false;
        if (Math.random() < 0.65) next.privaciones.acceso_salud = false;
      }

      if (policy.tipo === 'empleo_temporal_obras') {
        if (hh.empleoTipo === 'desempleado' || hh.empleoTipo === 'informal') {
          netIncomeMultiplier *= 1.40;
          if (Math.random() < 0.70) next.privaciones.desempleo_larga_duracion = false;
          if (Math.random() < 0.50) next.privaciones.empleo_informal_precario = false;
        }
      }

      if (policy.tipo === 'subsidio_mejoramiento_vivienda') {
        if (Math.random() < 0.75) {
          next.privaciones.materiales_precarios = false;
          next.privaciones.carencia_agua_saneamiento = false;
          next.serviciosBasicos.aguaRed = true;
          next.serviciosBasicos.desague = true;
        }
      }

      if (policy.tipo === 'infraestructura_salud_educacion') {
        if (Math.random() < 0.60) next.privaciones.acceso_salud = false;
        if (Math.random() < 0.70) next.privaciones.asistencia_escolar = false;
      }

      if (policy.tipo === 'inclusion_digital_conectividad') {
        next.privaciones.carencia_internet_tic = false;
        next.serviciosBasicos.internet = true;
      }
    });

    // Update income
    next.ingresoPerCapita = Math.max(40, Math.round(hh.ingresoPerCapita * netIncomeMultiplier));

    // Recompute Alkire-Foster dimensions
    const p = next.privaciones;
    const d_educacion = (p.asistencia_escolar ? 0.5 : 0) + (p.rezago_educativo ? 0.5 : 0);
    const d_salud = (p.acceso_salud ? 0.5 : 0) + (p.gasto_catastrofico_salud ? 0.5 : 0);
    const d_trabajo = (p.desempleo_larga_duracion ? 0.5 : 0) + (p.empleo_informal_precario ? 0.5 : 0);
    const d_vivienda = (p.materiales_precarios ? 0.25 : 0) + (p.hacinamiento ? 0.25 : 0) + (p.carencia_agua_saneamiento ? 0.25 : 0) + (p.carencia_electricidad ? 0.25 : 0);
    const d_activos = (p.carencia_internet_tic ? 0.5 : 0) + (p.ausencia_redes_apoyo ? 0.5 : 0);

    const dimensiones: IPMDimensions = {
      educacion: Number(d_educacion.toFixed(3)),
      salud: Number(d_salud.toFixed(3)),
      trabajo: Number(d_trabajo.toFixed(3)),
      vivienda_servicios: Number(d_vivienda.toFixed(3)),
      activos_redes: Number(d_activos.toFixed(3))
    };

    const c_score = Number(((d_educacion + d_salud + d_trabajo + d_vivienda + d_activos) * 0.20 + contagionEffect).toFixed(3));
    const is_poor = c_score >= 0.33;
    const is_extreme_poor = c_score >= 0.50;

    let categoriaPobreza: HouseholdAgent['categoriaPobreza'] = 'no_pobre';
    if (is_extreme_poor) categoriaPobreza = 'pobre_extremo';
    else if (is_poor) categoriaPobreza = 'pobre_moderado';
    else if (c_score >= 0.20) categoriaPobreza = 'vulnerable';

    next.dimensiones = dimensiones;
    next.c_score = Math.min(1.0, c_score);
    next.is_poor = is_poor;
    next.is_extreme_poor = is_extreme_poor;
    next.categoriaPobreza = categoriaPobreza;

    return next;
  }

  /**
   * Generates predictive alerts for 3, 6, and 12 months ahead
   */
  private generateEarlyWarnings(
    steps: SimulationStepResult[],
    neighborhoods: NeighborhoodCell[]
  ): SimulationRunResult['prediccionAlertas'] {
    const step3 = steps[Math.min(1, steps.length - 1)];
    const step6 = steps[Math.min(2, steps.length - 1)];
    const step12 = steps[Math.min(4, steps.length - 1)];

    const createAlertsForStep = (stepObj: SimulationStepResult, months: number): NeighborhoodAlert[] => {
      const alerts: NeighborhoodAlert[] = [];

      neighborhoods.forEach(b => {
        const kpi = stepObj.barriosKpi[b.id];
        if (!kpi) return;

        const delta = Number((kpi.ipm_M0 - b.ipm_M0).toFixed(3));
        const prob = Math.min(1.0, Math.max(0.05, Number((kpi.ipm_M0 / 0.45).toFixed(2))));

        // Key risk factors
        const factors: string[] = [];
        if (b.zona === 'periferia_ladera') factors.push('Alta vulnerabilidad física en laderas');
        if (b.coberturaGHSLInformal > 0.6) factors.push('Asentamiento no regularizado');
        if (b.luminosidadNocturnaVIIRS < 15) factors.push('Baja densidad de actividad económica formal');
        if (kpi.ipm_M0 > 0.40) factors.push('Riesgo inminente de trampa de pobreza estructural');

        let recom = 'Monitoreo preventivo y reforzamiento de comedores populares.';
        if (kpi.ipm_M0 >= 0.45) {
          recom = 'Activación prioritaria de transferencias condicionadas (Juntos) y brigadas médicas móviles.';
        } else if (kpi.ipm_M0 >= 0.35) {
          recom = 'Inyección de programas de empleo temporal municipal y ampliación de subsidio habitacional.';
        }

        alerts.push({
          barrioId: b.id,
          nombre: b.nombre,
          distrito: b.distrito,
          ipmActual: b.ipm_M0,
          ipmProyectado: kpi.ipm_M0,
          deltaProyectado: delta,
          probabilidadSuperarUmbralCritico: prob,
          factoresClaveRiesgo: factors,
          recomendacionPolitica: recom
        });
      });

      // Sort by highest projected IPM and highest risk
      return alerts.sort((a, b) => b.ipmProyectado - a.ipmProyectado);
    };

    return {
      meses3: createAlertsForStep(step3, 3),
      meses6: createAlertsForStep(step6, 6),
      meses12: createAlertsForStep(step12, 12)
    };
  }

  /**
   * Calculates sensitivity analysis (elasticity of IPM to individual dimensional improvements)
   */
  public calculateSensitivityAnalysis(): {
    dimension: string;
    mejoraPct: number;
    reduccionIPM_Pct: number;
    elasticidad: number;
    eficienciaInversion: string;
  }[] {
    const baseAF = calculateAlkireFoster(this.initialHouseholds);
    const dimensions = ['educacion', 'salud', 'trabajo', 'vivienda_servicios', 'activos_redes'] as const;

    return dimensions.map(dim => {
      const simulatedHouseholds = this.initialHouseholds.map(hh => {
        const copy = { ...hh, dimensiones: { ...hh.dimensiones } };
        // Apply 10% improvement in this dimension
        copy.dimensiones[dim] = Math.max(0, copy.dimensiones[dim] * 0.90);
        return copy;
      });

      const newAF = calculateAlkireFoster(simulatedHouseholds);
      const deltaIPM = baseAF.M0 - newAF.M0;
      const reduccionPct = baseAF.M0 > 0 ? (deltaIPM / baseAF.M0) * 100 : 0;
      const elasticidad = Number((reduccionPct / 10).toFixed(2));

      let eficiencia = 'Media';
      if (elasticidad >= 0.22) eficiencia = 'Muy Alta (Efecto Multiplicador)';
      else if (elasticidad >= 0.18) eficiencia = 'Alta';

      return {
        dimension: dim === 'educacion' ? 'Educación (Asistencia y Rezago)' :
                   dim === 'salud' ? 'Salud (Seguro y Gasto Catastrófico)' :
                   dim === 'trabajo' ? 'Trabajo (Empleo Formal y Jornales)' :
                   dim === 'vivienda_servicios' ? 'Vivienda y Servicios (Agua/Luz/Materiales)' : 'Activos y Redes (TICs y Apoyo)',
        mejoraPct: 10,
        reduccionIPM_Pct: Number(reduccionPct.toFixed(2)),
        elasticidad,
        eficienciaInversion: eficiencia
      };
    });
  }

  /**
   * Static convenience method to run simulation on a population of households and neighborhoods
   */
  public static runSimulation(
    households: HouseholdAgent[],
    neighborhoods: NeighborhoodCell[],
    shocks: ShockScenario[],
    policies: PolicyScenario[],
    options?: Partial<SimulationConfig>
  ): SimulationRunResult & {
    barriosActualizados: NeighborhoodCell[];
    hogaresActualizados: HouseholdAgent[];
    indicadoresFinales: ReturnType<typeof calculateAlkireFoster>;
    pasosTrimestrales: SimulationStepResult[];
  } {
    const simulator = new ABMSimulator(households, neighborhoods);
    const config: SimulationConfig = {
      id: options?.id || 'sim-live',
      nombre: options?.nombre || 'Simulación Prospectiva 2024-2030',
      yearInicio: options?.yearInicio || 2024,
      yearFin: options?.yearFin || 2030,
      stepMeses: options?.stepMeses || 3,
      shocks,
      policies,
      calibracionGeneticaDEAP: options?.calibracionGeneticaDEAP ?? true,
      monteCarloRuns: options?.monteCarloRuns || 10,
      tasaDescuentoPobrezaVecindario: options?.tasaDescuentoPobrezaVecindario || 0.15
    };

    const simResult = simulator.runSimulation(config);
    
    // Compute updated neighborhoods with final step indicators
    const lastStep = simResult.pasos[simResult.pasos.length - 1];
    const barriosActualizados = neighborhoods.map(n => {
      const kpi = lastStep?.barriosKpi[n.id];
      if (kpi) {
        return {
          ...n,
          ipm_M0: kpi.ipm_M0,
          ipm_H: kpi.ipm_H,
          ipm_A: kpi.ipm_A,
          pobrezaExtremaPct: kpi.pobrezaExtremaPct,
          nivelAlerta: kpi.alerta
        };
      }
      return n;
    });

    const indicadoresFinales = calculateAlkireFoster(households);
    indicadoresFinales.M0 = lastStep ? lastStep.ciudad_ipm_M0 : simResult.resumenImpacto.ipm_final;
    indicadoresFinales.H = lastStep ? lastStep.ciudad_ipm_H : indicadoresFinales.H;
    indicadoresFinales.A = lastStep ? lastStep.ciudad_ipm_A : indicadoresFinales.A;
    indicadoresFinales.extremePovertyRate = lastStep ? lastStep.ciudad_pobreza_extrema_pct : indicadoresFinales.extremePovertyRate;

    return {
      ...simResult,
      barriosActualizados,
      hogaresActualizados: households,
      indicadoresFinales,
      pasosTrimestrales: simResult.pasos
    };
  }
}

