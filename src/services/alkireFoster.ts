import { HouseholdAgent, IPMDimensions, IPMIndicators } from '../types';

/**
 * Alkire-Foster Multidimensional Poverty Index (IPM / MPI) Engine
 * Formal Implementation of Alkire & Foster (2011, JPubE) Dual-Cutoff Methodology
 * Extended with Spatial Aggregations and Dimensional Contributions (Pareto).
 */

export interface AlkireFosterWeights {
  educacion: number;          // Default 0.20
  salud: number;              // Default 0.20
  trabajo: number;            // Default 0.20
  vivienda_servicios: number; // Default 0.20
  activos_redes: number;      // Default 0.20
}

export const DEFAULT_WEIGHTS: AlkireFosterWeights = {
  educacion: 0.20,
  salud: 0.20,
  trabajo: 0.20,
  vivienda_servicios: 0.20,
  activos_redes: 0.20
};

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

/**
 * Computes the Alkire-Foster IPM for a given population of household agents
 * @param households Array of HouseholdAgent
 * @param k Poverty cutoff threshold (default 0.33, i.e., at least 33% weighted deprivations)
 * @param weights Weights for the 5 dimensions (each dimension sums to 1.0)
 */
export function calculateAlkireFoster(
  households: HouseholdAgent[],
  k: number = 0.33,
  weights: AlkireFosterWeights = DEFAULT_WEIGHTS
): AlkireFosterResult {
  const n = households.length;
  if (n === 0) {
    return {
      M0: 0,
      H: 0,
      A: 0,
      totalHouseholds: 0,
      poorHouseholdsCount: 0,
      extremePoorHouseholdsCount: 0,
      extremePovertyRate: 0,
      vulnerableRate: 0,
      nonPoorRate: 0,
      censoredDimensionalHeadcounts: { educacion: 0, salud: 0, trabajo: 0, vivienda_servicios: 0, activos_redes: 0 },
      dimensionalContributionsPct: { educacion: 20, salud: 20, trabajo: 20, vivienda_servicios: 20, activos_redes: 20 },
      rawIndicatorHeadcounts: {} as any,
      censoredIndicatorHeadcounts: {} as any,
      giniCoefficient: 0,
      genderGap: { femaleHead_M0: 0, maleHead_M0: 0, ratio: 1 }
    };
  }

  let poorCount = 0;
  let extremePoorCount = 0;
  let vulnerableCount = 0;
  let sumCensoredScores = 0;

  // Track raw and censored indicator counts
  const rawCounts: Record<keyof IPMIndicators, number> = {
    asistencia_escolar: 0,
    rezago_educativo: 0,
    acceso_salud: 0,
    gasto_catastrofico_salud: 0,
    desempleo_larga_duracion: 0,
    empleo_informal_precario: 0,
    materiales_precarios: 0,
    hacinamiento: 0,
    carencia_agua_saneamiento: 0,
    carencia_electricidad: 0,
    carencia_internet_tic: 0,
    ausencia_redes_apoyo: 0
  };

  const censoredCounts: Record<keyof IPMIndicators, number> = {
    asistencia_escolar: 0,
    rezago_educativo: 0,
    acceso_salud: 0,
    gasto_catastrofico_salud: 0,
    desempleo_larga_duracion: 0,
    empleo_informal_precario: 0,
    materiales_precarios: 0,
    hacinamiento: 0,
    carencia_agua_saneamiento: 0,
    carencia_electricidad: 0,
    carencia_internet_tic: 0,
    ausencia_redes_apoyo: 0
  };

  let femalePoorSum = 0;
  let femaleTotal = 0;
  let malePoorSum = 0;
  let maleTotal = 0;

  const censoredDimensionalSums = {
    educacion: 0,
    salud: 0,
    trabajo: 0,
    vivienda_servicios: 0,
    activos_redes: 0
  };

  const scoresList: number[] = [];

  households.forEach(hh => {
    // 1. Calculate weighted deprivation score c_i
    const dimScore = (
      hh.dimensiones.educacion * weights.educacion +
      hh.dimensiones.salud * weights.salud +
      hh.dimensiones.trabajo * weights.trabajo +
      hh.dimensiones.vivienda_servicios * weights.vivienda_servicios +
      hh.dimensiones.activos_redes * weights.activos_redes
    );

    scoresList.push(dimScore);

    // Track raw indicator deprivations
    (Object.keys(hh.privaciones) as (keyof IPMIndicators)[]).forEach(ind => {
      if (hh.privaciones[ind]) rawCounts[ind]++;
    });

    // Gender tracking
    if (hh.jefeHogarGenero === 'femenino') {
      femaleTotal++;
    } else {
      maleTotal++;
    }

    // 2. Dual-cutoff identification step: g_i^0(k) = 1 if c_i >= k
    const isPoor = dimScore >= k;
    const isExtreme = dimScore >= 0.50;
    const isVulnerable = dimScore >= 0.20 && dimScore < k;

    if (isPoor) {
      poorCount++;
      sumCensoredScores += dimScore;

      // Track censored dimensions
      censoredDimensionalSums.educacion += hh.dimensiones.educacion;
      censoredDimensionalSums.salud += hh.dimensiones.salud;
      censoredDimensionalSums.trabajo += hh.dimensiones.trabajo;
      censoredDimensionalSums.vivienda_servicios += hh.dimensiones.vivienda_servicios;
      censoredDimensionalSums.activos_redes += hh.dimensiones.activos_redes;

      // Track censored indicators
      (Object.keys(hh.privaciones) as (keyof IPMIndicators)[]).forEach(ind => {
        if (hh.privaciones[ind]) censoredCounts[ind]++;
      });

      if (hh.jefeHogarGenero === 'femenino') femalePoorSum += dimScore;
      else malePoorSum += dimScore;
    }

    if (isExtreme) extremePoorCount++;
    if (isVulnerable) vulnerableCount++;
  });

  // Multidimensional Headcount Ratio H
  const H = poorCount / n;

  // Average Poverty Intensity A among the poor
  const A = poorCount > 0 ? sumCensoredScores / poorCount : 0;

  // Adjusted Headcount Ratio M0 = H * A = (1/n) * sum(c_i(k))
  const M0 = sumCensoredScores / n;

  // Dimensional Censored Headcounts h_j(k)
  const censoredDimensionalHeadcounts = {
    educacion: censoredDimensionalSums.educacion / n,
    salud: censoredDimensionalSums.salud / n,
    trabajo: censoredDimensionalSums.trabajo / n,
    vivienda_servicios: censoredDimensionalSums.vivienda_servicios / n,
    activos_redes: censoredDimensionalSums.activos_redes / n
  };

  // Dimensional Percentage Contributions C_j = (w_j * h_j(k)) / M0
  const dimensionalContributionsPct = {
    educacion: M0 > 0 ? (weights.educacion * censoredDimensionalHeadcounts.educacion / M0) * 100 : 20,
    salud: M0 > 0 ? (weights.salud * censoredDimensionalHeadcounts.salud / M0) * 100 : 20,
    trabajo: M0 > 0 ? (weights.trabajo * censoredDimensionalHeadcounts.trabajo / M0) * 100 : 20,
    vivienda_servicios: M0 > 0 ? (weights.vivienda_servicios * censoredDimensionalHeadcounts.vivienda_servicios / M0) * 100 : 20,
    activos_redes: M0 > 0 ? (weights.activos_redes * censoredDimensionalHeadcounts.activos_redes / M0) * 100 : 20
  };

  // Raw & Censored Indicator Headcounts
  const rawIndicatorHeadcounts = {} as Record<keyof IPMIndicators, number>;
  const censoredIndicatorHeadcounts = {} as Record<keyof IPMIndicators, number>;
  (Object.keys(rawCounts) as (keyof IPMIndicators)[]).forEach(kInd => {
    rawIndicatorHeadcounts[kInd] = rawCounts[kInd] / n;
    censoredIndicatorHeadcounts[kInd] = censoredCounts[kInd] / n;
  });

  // Calculate Gini Coefficient of deprivation scores
  const giniCoefficient = calculateGini(scoresList);

  const femaleHead_M0 = femaleTotal > 0 ? femalePoorSum / femaleTotal : 0;
  const maleHead_M0 = maleTotal > 0 ? malePoorSum / maleTotal : 0;
  const ratio = maleHead_M0 > 0 ? Number((femaleHead_M0 / maleHead_M0).toFixed(2)) : 1.0;

  return {
    M0: Number(M0.toFixed(4)),
    H: Number(H.toFixed(4)),
    A: Number(A.toFixed(4)),
    totalHouseholds: n,
    poorHouseholdsCount: poorCount,
    extremePoorHouseholdsCount: extremePoorCount,
    extremePovertyRate: Number((extremePoorCount / n).toFixed(4)),
    vulnerableRate: Number((vulnerableCount / n).toFixed(4)),
    nonPoorRate: Number(((n - poorCount - vulnerableCount) / n).toFixed(4)),
    censoredDimensionalHeadcounts: {
      educacion: Number(censoredDimensionalHeadcounts.educacion.toFixed(4)),
      salud: Number(censoredDimensionalHeadcounts.salud.toFixed(4)),
      trabajo: Number(censoredDimensionalHeadcounts.trabajo.toFixed(4)),
      vivienda_servicios: Number(censoredDimensionalHeadcounts.vivienda_servicios.toFixed(4)),
      activos_redes: Number(censoredDimensionalHeadcounts.activos_redes.toFixed(4))
    },
    dimensionalContributionsPct: {
      educacion: Number(dimensionalContributionsPct.educacion.toFixed(1)),
      salud: Number(dimensionalContributionsPct.salud.toFixed(1)),
      trabajo: Number(dimensionalContributionsPct.trabajo.toFixed(1)),
      vivienda_servicios: Number(dimensionalContributionsPct.vivienda_servicios.toFixed(1)),
      activos_redes: Number(dimensionalContributionsPct.activos_redes.toFixed(1))
    },
    rawIndicatorHeadcounts,
    censoredIndicatorHeadcounts,
    giniCoefficient: Number(giniCoefficient.toFixed(3)),
    genderGap: {
      femaleHead_M0: Number(femaleHead_M0.toFixed(3)),
      maleHead_M0: Number(maleHead_M0.toFixed(3)),
      ratio
    }
  };
}

/**
 * Standard Gini coefficient algorithm for continuous distributions
 */
function calculateGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  let cumulativeSum = 0;
  let totalSum = 0;
  
  for (let i = 0; i < n; i++) {
    totalSum += sorted[i];
    cumulativeSum += sorted[i] * (i + 1);
  }
  
  if (totalSum === 0) return 0;
  const gini = (2 * cumulativeSum) / (n * totalSum) - (n + 1) / n;
  return Math.max(0, Math.min(1, gini));
}

export const AlkireFosterEngine = {
  calculateMPI: calculateAlkireFoster,
  calculateGini
};

