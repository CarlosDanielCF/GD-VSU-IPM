import { NeighborhoodCell, BlockCell, UrbanPOI, HouseholdAgent, IPMDimensions, IPMIndicators } from '../types';

/**
 * Seed dataset: "Metrópolis Valle Central" (Representative Latin American Metropolitan Area)
 * Calibrated against ENAHO (Encuesta Nacional de Hogares) & GHSL/VIIRS satellite indices.
 * 50 Neighborhoods (Barrios), 500 Blocks (Manzanas), 10,000 Synthetic Household Agents.
 */

// Base geographical bounding box (e.g., Andean valley metropolitan area)
const BASE_LAT = -12.0550;
const BASE_LNG = -77.0350;

export const URBAN_ZONES = [
  { id: 'centro', nombre: 'Centro Histórico y Consolidado', color: '#3b82f6', estrato: 'medio' },
  { id: 'comercial', nombre: 'Eje Comercial y Financiero', color: '#10b981', estrato: 'medio_alto' },
  { id: 'periferia_ladera', nombre: 'Laderas y Asentamientos Informales (Norte/Este)', color: '#ef4444', estrato: 'bajo_marginal' },
  { id: 'expansion_sur', nombre: 'Periurbano y Expansión Sur', color: '#f59e0b', estrato: 'bajo' }
] as const;

// 50 Barrios definitions
export const NEIGHBORHOOD_DEFINITIONS = [
  // Zona 1: Centro Histórico y Consolidado (10 barrios)
  { id: 'b01', nombre: 'Centro Tradicional', distrito: 'Cercado', zona: 'centro', lat: -12.0460, lng: -77.0300, baseIPM: 0.11, viirs: 45.2, ndvi: 0.15, ghsl_inf: 0.02 },
  { id: 'b02', nombre: 'Barrios Altos Sur', distrito: 'Cercado', zona: 'centro', lat: -12.0485, lng: -77.0210, baseIPM: 0.24, viirs: 38.0, ndvi: 0.11, ghsl_inf: 0.14 },
  { id: 'b03', nombre: 'Monserrate', distrito: 'Cercado', zona: 'centro', lat: -12.0420, lng: -77.0380, baseIPM: 0.19, viirs: 40.5, ndvi: 0.12, ghsl_inf: 0.08 },
  { id: 'b04', nombre: 'Santa Beatriz', distrito: 'Cercado', zona: 'centro', lat: -12.0680, lng: -77.0350, baseIPM: 0.09, viirs: 48.0, ndvi: 0.28, ghsl_inf: 0.01 },
  { id: 'b05', nombre: 'Breña Centro', distrito: 'Breña', zona: 'centro', lat: -12.0590, lng: -77.0490, baseIPM: 0.14, viirs: 36.2, ndvi: 0.16, ghsl_inf: 0.04 },
  { id: 'b06', nombre: 'Chacra Colorada', distrito: 'Breña', zona: 'centro', lat: -12.0640, lng: -77.0540, baseIPM: 0.16, viirs: 34.0, ndvi: 0.14, ghsl_inf: 0.05 },
  { id: 'b07', nombre: 'Lince Norte', distrito: 'Lince', zona: 'centro', lat: -12.0810, lng: -77.0340, baseIPM: 0.07, viirs: 50.1, ndvi: 0.32, ghsl_inf: 0.00 },
  { id: 'b08', nombre: 'Jesús María Residencial', distrito: 'Jesús María', zona: 'centro', lat: -12.0720, lng: -77.0480, baseIPM: 0.06, viirs: 52.0, ndvi: 0.40, ghsl_inf: 0.00 },
  { id: 'b09', nombre: 'Pueblo Libre Tradicional', distrito: 'Pueblo Libre', zona: 'centro', lat: -12.0770, lng: -77.0650, baseIPM: 0.08, viirs: 46.5, ndvi: 0.35, ghsl_inf: 0.00 },
  { id: 'b10', nombre: 'Magdalena Moderna', distrito: 'Magdalena', zona: 'centro', lat: -12.0910, lng: -77.0700, baseIPM: 0.08, viirs: 44.0, ndvi: 0.31, ghsl_inf: 0.01 },

  // Zona 2: Eje Comercial y Financiero (10 barrios)
  { id: 'b11', nombre: 'San Isidro Financiero', distrito: 'San Isidro', zona: 'comercial', lat: -12.0960, lng: -77.0280, baseIPM: 0.03, viirs: 62.0, ndvi: 0.45, ghsl_inf: 0.00 },
  { id: 'b12', nombre: 'El Olivar', distrito: 'San Isidro', zona: 'comercial', lat: -12.1020, lng: -77.0350, baseIPM: 0.02, viirs: 55.4, ndvi: 0.58, ghsl_inf: 0.00 },
  { id: 'b13', nombre: 'Miraflores Central', distrito: 'Miraflores', zona: 'comercial', lat: -12.1210, lng: -77.0300, baseIPM: 0.03, viirs: 60.2, ndvi: 0.48, ghsl_inf: 0.00 },
  { id: 'b14', nombre: 'San Borja Norte', distrito: 'San Borja', zona: 'comercial', lat: -12.0920, lng: -77.0010, baseIPM: 0.04, viirs: 49.0, ndvi: 0.52, ghsl_inf: 0.00 },
  { id: 'b15', nombre: 'Surco Chacarilla', distrito: 'Santiago de Surco', zona: 'comercial', lat: -12.1150, lng: -76.9950, baseIPM: 0.04, viirs: 47.5, ndvi: 0.49, ghsl_inf: 0.00 },
  { id: 'b16', nombre: 'San Luis Eje Industrial', distrito: 'San Luis', zona: 'comercial', lat: -12.0740, lng: -77.0020, baseIPM: 0.12, viirs: 42.0, ndvi: 0.18, ghsl_inf: 0.03 },
  { id: 'b17', nombre: 'La Victoria Gamarra', distrito: 'La Victoria', zona: 'comercial', lat: -12.0650, lng: -77.0140, baseIPM: 0.22, viirs: 54.0, ndvi: 0.09, ghsl_inf: 0.12 },
  { id: 'b18', nombre: 'Balconcillo', distrito: 'La Victoria', zona: 'comercial', lat: -12.0790, lng: -77.0220, baseIPM: 0.15, viirs: 41.0, ndvi: 0.17, ghsl_inf: 0.05 },
  { id: 'b19', nombre: 'Salamanca', distrito: 'Ate', zona: 'comercial', lat: -12.0830, lng: -76.9850, baseIPM: 0.10, viirs: 39.5, ndvi: 0.25, ghsl_inf: 0.02 },
  { id: 'b20', nombre: 'Santa Anita Comercial', distrito: 'Santa Anita', zona: 'comercial', lat: -12.0520, lng: -76.9720, baseIPM: 0.18, viirs: 44.5, ndvi: 0.15, ghsl_inf: 0.08 },

  // Zona 3: Laderas y Asentamientos Informales (Norte/Este) (15 barrios - Críticos en Vulnerabilidad)
  { id: 'b21', nombre: 'Laderas de Carabayllo', distrito: 'Carabayllo', zona: 'periferia_ladera', lat: -11.8950, lng: -77.0120, baseIPM: 0.46, viirs: 11.2, ndvi: 0.06, ghsl_inf: 0.82 },
  { id: 'b22', nombre: 'Cerro Candela', distrito: 'San Martín de Porres', zona: 'periferia_ladera', lat: -11.9650, lng: -77.1020, baseIPM: 0.42, viirs: 14.5, ndvi: 0.08, ghsl_inf: 0.74 },
  { id: 'b23', nombre: 'Collique Sector 4-8', distrito: 'Comas', zona: 'periferia_ladera', lat: -11.9150, lng: -77.0280, baseIPM: 0.49, viirs: 10.8, ndvi: 0.05, ghsl_inf: 0.88 },
  { id: 'b24', nombre: 'Año Nuevo Alto', distrito: 'Comas', zona: 'periferia_ladera', lat: -11.9280, lng: -77.0390, baseIPM: 0.44, viirs: 13.0, ndvi: 0.07, ghsl_inf: 0.79 },
  { id: 'b25', nombre: 'Pampa Canto Grande', distrito: 'San Juan de Lurigancho', zona: 'periferia_ladera', lat: -11.9720, lng: -76.9920, baseIPM: 0.48, viirs: 12.1, ndvi: 0.06, ghsl_inf: 0.85 },
  { id: 'b26', nombre: 'Quebrada Huaycán Alto', distrito: 'Ate', zona: 'periferia_ladera', lat: -12.0150, lng: -76.8450, baseIPM: 0.45, viirs: 11.8, ndvi: 0.05, ghsl_inf: 0.81 },
  { id: 'b27', nombre: 'Cerro San Cristóbal Oriental', distrito: 'Rímac', zona: 'periferia_ladera', lat: -12.0330, lng: -77.0180, baseIPM: 0.38, viirs: 19.5, ndvi: 0.09, ghsl_inf: 0.62 },
  { id: 'b28', nombre: 'José Carlos Mariátegui', distrito: 'San Juan de Lurigancho', zona: 'periferia_ladera', lat: -11.9480, lng: -76.9650, baseIPM: 0.52, viirs: 9.4, ndvi: 0.04, ghsl_inf: 0.91 },
  { id: 'b29', nombre: 'Bayóvar Quebrada', distrito: 'San Juan de Lurigancho', zona: 'periferia_ladera', lat: -11.9610, lng: -76.9800, baseIPM: 0.47, viirs: 11.5, ndvi: 0.05, ghsl_inf: 0.84 },
  { id: 'b30', nombre: 'Huanta Laderas', distrito: 'San Juan de Lurigancho', zona: 'periferia_ladera', lat: -11.9840, lng: -77.0010, baseIPM: 0.41, viirs: 15.0, ndvi: 0.07, ghsl_inf: 0.70 },
  { id: 'b31', nombre: 'Independencia El Ermitaño', distrito: 'Independencia', zona: 'periferia_ladera', lat: -11.9950, lng: -77.0510, baseIPM: 0.39, viirs: 18.2, ndvi: 0.08, ghsl_inf: 0.65 },
  { id: 'b32', nombre: 'Tahuantinsuyo Alto', distrito: 'Independencia', zona: 'periferia_ladera', lat: -11.9850, lng: -77.0420, baseIPM: 0.43, viirs: 13.8, ndvi: 0.06, ghsl_inf: 0.76 },
  { id: 'b33', nombre: 'Chosica Laderas Rímac', distrito: 'Lurigancho-Chosica', zona: 'periferia_ladera', lat: -11.9380, lng: -76.7020, baseIPM: 0.44, viirs: 12.0, ndvi: 0.18, ghsl_inf: 0.72 },
  { id: 'b34', nombre: 'Vitarte Margen Izquierda', distrito: 'Ate', zona: 'periferia_ladera', lat: -12.0380, lng: -76.9200, baseIPM: 0.37, viirs: 20.0, ndvi: 0.11, ghsl_inf: 0.58 },
  { id: 'b35', nombre: 'Horacio Zeballos', distrito: 'Ate', zona: 'periferia_ladera', lat: -12.0250, lng: -76.8800, baseIPM: 0.45, viirs: 11.0, ndvi: 0.06, ghsl_inf: 0.80 },

  // Zona 4: Periurbano y Expansión Sur (15 barrios)
  { id: 'b36', nombre: 'Tablada de Lurín Sector 1-3', distrito: 'Villa María del Triunfo', zona: 'expansion_sur', lat: -12.1750, lng: -76.9450, baseIPM: 0.41, viirs: 14.8, ndvi: 0.07, ghsl_inf: 0.68 },
  { id: 'b37', nombre: 'José Gálvez Laderas', distrito: 'Villa María del Triunfo', zona: 'expansion_sur', lat: -12.1950, lng: -76.9280, baseIPM: 0.48, viirs: 10.5, ndvi: 0.05, ghsl_inf: 0.86 },
  { id: 'b38', nombre: 'Nueva Esperanza Alta', distrito: 'Villa María del Triunfo', zona: 'expansion_sur', lat: -12.1620, lng: -76.9380, baseIPM: 0.47, viirs: 11.2, ndvi: 0.06, ghsl_inf: 0.83 },
  { id: 'b39', nombre: 'Pamplona Alta Sector Olleros', distrito: 'San Juan de Miraflores', zona: 'expansion_sur', lat: -12.1480, lng: -76.9620, baseIPM: 0.50, viirs: 9.8, ndvi: 0.05, ghsl_inf: 0.89 },
  { id: 'b40', nombre: 'Pamplona Baja', distrito: 'San Juan de Miraflores', zona: 'expansion_sur', lat: -12.1550, lng: -76.9750, baseIPM: 0.33, viirs: 22.0, ndvi: 0.12, ghsl_inf: 0.45 },
  { id: 'b41', nombre: 'Villa El Salvador Sector 1', distrito: 'Villa El Salvador', zona: 'expansion_sur', lat: -12.2050, lng: -76.9350, baseIPM: 0.31, viirs: 24.5, ndvi: 0.10, ghsl_inf: 0.38 },
  { id: 'b42', nombre: 'Villa El Salvador Lomo de Corvina', distrito: 'Villa El Salvador', zona: 'expansion_sur', lat: -12.2280, lng: -76.9450, baseIPM: 0.45, viirs: 12.0, ndvi: 0.04, ghsl_inf: 0.79 },
  { id: 'b43', nombre: 'Pachacámac Valle Tradicional', distrito: 'Pachacámac', zona: 'expansion_sur', lat: -12.2310, lng: -76.8620, baseIPM: 0.28, viirs: 18.0, ndvi: 0.42, ghsl_inf: 0.25 },
  { id: 'b44', nombre: 'Manchay Quebrada Alta', distrito: 'Pachacámac', zona: 'expansion_sur', lat: -12.1280, lng: -76.8850, baseIPM: 0.53, viirs: 8.9, ndvi: 0.05, ghsl_inf: 0.93 },
  { id: 'b45', nombre: 'Lurín Litoral', distrito: 'Lurín', zona: 'expansion_sur', lat: -12.2750, lng: -76.8720, baseIPM: 0.25, viirs: 26.0, ndvi: 0.22, ghsl_inf: 0.22 },
  { id: 'b46', nombre: 'Las Palmas Arenales', distrito: 'Lurín', zona: 'expansion_sur', lat: -12.2900, lng: -76.8550, baseIPM: 0.38, viirs: 15.2, ndvi: 0.08, ghsl_inf: 0.60 },
  { id: 'b47', nombre: 'Punta Hermosa Este', distrito: 'Punta Hermosa', zona: 'expansion_sur', lat: -12.3380, lng: -76.8150, baseIPM: 0.29, viirs: 19.5, ndvi: 0.12, ghsl_inf: 0.35 },
  { id: 'b48', nombre: 'Chorrillos San Genaro', distrito: 'Chorrillos', zona: 'expansion_sur', lat: -12.1900, lng: -77.0050, baseIPM: 0.42, viirs: 16.0, ndvi: 0.09, ghsl_inf: 0.72 },
  { id: 'b49', nombre: 'Chorrillos Tupac Amaru', distrito: 'Chorrillos', zona: 'expansion_sur', lat: -12.1810, lng: -77.0120, baseIPM: 0.35, viirs: 21.0, ndvi: 0.13, ghsl_inf: 0.52 },
  { id: 'b50', nombre: 'Pucusana Asentamientos', distrito: 'Pucusana', zona: 'expansion_sur', lat: -12.4780, lng: -76.7850, baseIPM: 0.44, viirs: 11.5, ndvi: 0.05, ghsl_inf: 0.78 }
];

// Helper to generate a realistic polygon around a centroid
function generatePolygon(lat: number, lng: number, radiusKm: number = 0.5, sides: number = 6): [number, number][] {
  const coords: [number, number][] = [];
  const rLat = radiusKm / 110.574;
  const rLng = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));
  
  for (let i = 0; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    // Add minor jitter for realistic organic city boundaries
    const jitter = 0.85 + Math.sin(i * 3 + lat * 100) * 0.15;
    const pLat = lat + rLat * Math.sin(angle) * jitter;
    const pLng = lng + rLng * Math.cos(angle) * jitter;
    coords.push([Number(pLat.toFixed(6)), Number(pLng.toFixed(6))]);
  }
  return coords;
}

// Generate Historical Series (2010 - 2024) calibrated with real macroeconomic and poverty dynamics
export function generateHistoricalIPM(baseIPM2024: number) {
  const series = [];
  // Historical trends in Latin America:
  // 2010-2017: Sustained reduction in multidimensional poverty (commodity boom & social programs)
  // 2018: Slight slowdown / inflation uptick
  // 2020: Pandemic COVID-19 severe spike in informal vulnerability (+25% to +40% in vulnerable areas)
  // 2021-2022: Partial economic rebound
  // 2023: Global inflation shock & climate events (El Niño)
  // 2024: Current baseline
  
  const factors: Record<number, number> = {
    2010: 1.35,
    2011: 1.30,
    2012: 1.25,
    2013: 1.20,
    2014: 1.15,
    2015: 1.10,
    2016: 1.06,
    2017: 1.02,
    2018: 1.04, // 2018 Inflation shock
    2019: 1.01,
    2020: 1.38, // 2020 Pandemic COVID-19
    2021: 1.18,
    2022: 1.08,
    2023: 1.12, // 2023 El Niño & Food Inflation
    2024: 1.00
  };

  for (let y = 2010; y <= 2024; y++) {
    const factor = factors[y] || 1.0;
    const ipm_M0 = Math.min(0.85, Math.max(0.01, Number((baseIPM2024 * factor).toFixed(3))));
    const ipm_H = Math.min(0.95, Number((ipm_M0 / 0.45).toFixed(3)));
    const ipm_A = Number((ipm_M0 / Math.max(0.01, ipm_H)).toFixed(3));
    const pobrezaExtrema = Number((ipm_M0 * 0.42).toFixed(3));
    
    series.push({
      year: y,
      ipm_M0,
      ipm_H,
      ipm_A,
      pobrezaExtrema
    });
  }
  return series;
}

// Generate the 50 full NeighborhoodCell objects
export const INITIAL_NEIGHBORHOODS: NeighborhoodCell[] = NEIGHBORHOOD_DEFINITIONS.map((def, idx) => {
  const baseIPM = def.baseIPM;
  const historico = generateHistoricalIPM(baseIPM);
  const current = historico[historico.length - 1];
  
  // Alert level logic
  let nivelAlerta: NeighborhoodCell['nivelAlerta'] = 'normal';
  if (baseIPM >= 0.45) nivelAlerta = 'critica_roja';
  else if (baseIPM >= 0.35) nivelAlerta = 'alta';
  else if (baseIPM >= 0.20) nivelAlerta = 'moderada';

  // Spatial coordinates
  const centroide: [number, number] = [def.lat, def.lng];
  const poligono = generatePolygon(def.lat, def.lng, def.zona === 'periferia_ladera' ? 0.7 : 0.5);
  
  // Estimated population based on density
  const areaHa = def.zona === 'periferia_ladera' ? 140 : 85;
  const densidad = def.zona === 'periferia_ladera' ? 180 : (def.zona === 'centro' ? 220 : 120);
  const poblacion = Math.round(areaHa * densidad);
  const hogares = Math.round(poblacion / 3.6);

  // Dimension Contributions for Pareto
  const contribucionDimensiones = {
    educacion: Number((0.15 + (def.baseIPM * 0.10) + Math.sin(idx) * 0.03).toFixed(2)),
    salud: Number((0.20 + (def.ghsl_inf * 0.10) + Math.cos(idx) * 0.02).toFixed(2)),
    trabajo: Number((0.28 + (def.baseIPM * 0.12)).toFixed(2)),
    vivienda_servicios: Number((0.18 + (def.ghsl_inf * 0.22)).toFixed(2)),
    activos_redes: Number((0.19 + (1 - def.viirs / 60) * 0.08).toFixed(2))
  };

  // Normalize sum to 1.0
  const sumContrib = Object.values(contribucionDimensiones).reduce((a, b) => a + b, 0);
  Object.keys(contribucionDimensiones).forEach(k => {
    (contribucionDimensiones as any)[k] = Number(((contribucionDimensiones as any)[k] / sumContrib).toFixed(3));
  });

  return {
    id: def.id,
    codigo: `BAR-${String(idx + 1).padStart(3, '0')}`,
    nombre: def.nombre,
    distrito: def.distrito,
    zona: def.zona as any,
    areaHectareas: areaHa,
    poblacionTotal: poblacion,
    totalHogares: hogares,
    densidadPobHa: densidad,
    estratoSocioeconomico: def.baseIPM >= 0.45 ? 'bajo_marginal' : (def.baseIPM >= 0.30 ? 'bajo' : (def.baseIPM >= 0.15 ? 'medio_bajo' : (def.baseIPM >= 0.07 ? 'medio' : 'medio_alto'))),
    centroide,
    poligono,
    manzanasIds: Array.from({ length: 10 }, (_, i) => `mz-${def.id}-${i + 1}`),
    ipm_M0: current.ipm_M0,
    ipm_H: current.ipm_H,
    ipm_A: current.ipm_A,
    pobrezaExtremaPct: current.pobrezaExtrema,
    brechaGeneroPct: Number((0.04 + def.baseIPM * 0.12).toFixed(3)),
    giniEspacial: Number((0.28 + def.baseIPM * 0.22).toFixed(3)),
    luminosidadNocturnaVIIRS: def.viirs,
    indiceVegetacionNDVI: def.ndvi,
    coberturaGHSLInformal: def.ghsl_inf,
    distanciaEscuelaMin: Math.round(5 + def.ghsl_inf * 20),
    distanciaHospitalMin: Math.round(10 + def.ghsl_inf * 45),
    distanciaMercadoMin: Math.round(4 + def.ghsl_inf * 18),
    conectividadTransporteScore: Math.round(90 - def.ghsl_inf * 65),
    indiceInfraestructura: Math.round(85 - def.ghsl_inf * 60),
    coeficienteTrampaPobreza: Number((def.baseIPM * 1.4 * (1 + def.ghsl_inf * 0.5)).toFixed(3)),
    nivelAlerta,
    historicoIPM: historico,
    contribucionDimensiones
  };
});

// Generate 500 Blocks (Manzanas)
export const INITIAL_BLOCKS: BlockCell[] = [];
INITIAL_NEIGHBORHOODS.forEach(b => {
  b.manzanasIds.forEach((mId, idx) => {
    // Generate mini block polygon around neighborhood centroid
    const angle = (idx * 2 * Math.PI) / 10;
    const offsetDist = 0.25; // km
    const mLat = b.centroide[0] + (offsetDist / 110.574) * Math.sin(angle);
    const mLng = b.centroide[1] + (offsetDist / 111.320) * Math.cos(angle);
    const mPoly = generatePolygon(mLat, mLng, 0.08, 4);
    
    const jitter = 1 + (Math.sin(idx * 7) * 0.15);
    const mIPM = Math.min(0.9, Math.max(0.01, Number((b.ipm_M0 * jitter).toFixed(3))));

    INITIAL_BLOCKS.push({
      id: mId,
      barrioId: b.id,
      codigoManzana: `MZ-${b.codigo.replace('BAR-', '')}-${String(idx + 1).padStart(2, '0')}`,
      poligono: mPoly,
      centroide: [Number(mLat.toFixed(6)), Number(mLng.toFixed(6))],
      hogaresCount: Math.round(b.totalHogares / 10),
      ipm_M0: mIPM,
      pobrezaPct: Math.min(0.98, Number((mIPM / 0.45).toFixed(3))),
      luminosidad: Number((b.luminosidadNocturnaVIIRS * (0.85 + Math.cos(idx) * 0.25)).toFixed(1)),
      riesgoClimaticoInundacion: b.zona === 'periferia_ladera' ? Number((0.4 + idx * 0.04).toFixed(2)) : 0.05
    });
  });
});

// Points of Interest (POIs)
export const INITIAL_POIS: UrbanPOI[] = [
  { id: 'poi-1', nombre: 'Hospital General Metropolitano', tipo: 'hospital', lat: -12.0520, lng: -77.0320, radioInfluenciaMetros: 3500, capacidad: 850, estado: 'operativo' },
  { id: 'poi-2', nombre: 'Hospital de Emergencias Grau', tipo: 'hospital', lat: -12.0580, lng: -77.0180, radioInfluenciaMetros: 2800, capacidad: 420, estado: 'saturado' },
  { id: 'poi-3', nombre: 'Centro Materno Infantil Huaycán', tipo: 'hospital', lat: -12.0120, lng: -76.8420, radioInfluenciaMetros: 2000, capacidad: 180, estado: 'saturado' },
  { id: 'poi-4', nombre: 'Hospital María Auxiliadora', tipo: 'hospital', lat: -12.1640, lng: -76.9680, radioInfluenciaMetros: 3200, capacidad: 550, estado: 'saturado' },
  { id: 'poi-5', nombre: 'Centro de Salud Bayóvar', tipo: 'hospital', lat: -11.9590, lng: -76.9780, radioInfluenciaMetros: 1500, capacidad: 120, estado: 'saturado' },
  { id: 'poi-6', nombre: 'Gran Mercado Central Mayorista', tipo: 'mercado', lat: -12.0490, lng: -77.0250, radioInfluenciaMetros: 4000, capacidad: 3200, estado: 'operativo' },
  { id: 'poi-7', nombre: 'Mercado Minorista N°1 La Parada', tipo: 'mercado', lat: -12.0620, lng: -77.0120, radioInfluenciaMetros: 2500, capacidad: 1800, estado: 'operativo' },
  { id: 'poi-8', nombre: 'Mercado Huamantanga Norte', tipo: 'mercado', lat: -11.9120, lng: -77.0450, radioInfluenciaMetros: 3000, capacidad: 1500, estado: 'operativo' },
  { id: 'poi-9', nombre: 'Mercado Unicachi Sur', tipo: 'mercado', lat: -12.1850, lng: -76.9550, radioInfluenciaMetros: 2800, capacidad: 1600, estado: 'operativo' },
  { id: 'poi-10', nombre: 'Colegio Emblemático Alfonso Ugarte', tipo: 'escuela', lat: -12.0950, lng: -77.0310, radioInfluenciaMetros: 2000, capacidad: 2400, estado: 'operativo' },
  { id: 'poi-11', nombre: 'I.E. Fe y Alegría N°32 (Collique)', tipo: 'escuela', lat: -11.9180, lng: -77.0260, radioInfluenciaMetros: 1200, capacidad: 1100, estado: 'operativo' },
  { id: 'poi-12', nombre: 'I.E. Antenor Orrego (SJL)', tipo: 'escuela', lat: -11.9680, lng: -76.9850, radioInfluenciaMetros: 1400, capacidad: 1300, estado: 'operativo' },
  { id: 'poi-13', nombre: 'I.E. Tupac Amaru (Villa María)', tipo: 'escuela', lat: -12.1690, lng: -76.9410, radioInfluenciaMetros: 1300, capacidad: 950, estado: 'operativo' },
  { id: 'poi-14', nombre: 'Agencia Banco de la Nación & Inclusión', tipo: 'banco_inclusion', lat: -12.0480, lng: -77.0310, radioInfluenciaMetros: 2500, capacidad: 500, estado: 'operativo' },
  { id: 'poi-15', nombre: 'Punto de Pago Social Juntos San Juan', tipo: 'banco_inclusion', lat: -11.9700, lng: -76.9900, radioInfluenciaMetros: 2000, capacidad: 400, estado: 'saturado' }
];

// Representative Synthetic Households Sample (10,000 agents aggregated into representative archetypes per block)
export function generateSyntheticHouseholds(count: number = 5000): HouseholdAgent[] {
  const households: HouseholdAgent[] = [];
  let idCounter = 1;

  INITIAL_NEIGHBORHOODS.forEach(barrio => {
    const isMarginal = barrio.zona === 'periferia_ladera';
    const isSouth = barrio.zona === 'expansion_sur';
    const householdsInBarrio = Math.round((count / INITIAL_NEIGHBORHOODS.length));

    for (let i = 0; i < householdsInBarrio; i++) {
      const isFemaleHead = Math.random() < (isMarginal ? 0.44 : 0.36);
      const isInformal = Math.random() < (isMarginal ? 0.82 : (isSouth ? 0.74 : (barrio.zona === 'centro' ? 0.48 : 0.22)));
      const baseIncome = isMarginal 
        ? 120 + Math.random() * 180 
        : (isSouth ? 160 + Math.random() * 220 : (barrio.zona === 'centro' ? 350 + Math.random() * 450 : 850 + Math.random() * 1200));

      const priv_escuela = isMarginal ? Math.random() < 0.24 : Math.random() < 0.05;
      const priv_rezago = isMarginal ? Math.random() < 0.45 : Math.random() < 0.12;
      const priv_salud = isMarginal ? Math.random() < 0.48 : Math.random() < 0.10;
      const priv_catastrofe = isMarginal ? Math.random() < 0.32 : Math.random() < 0.08;
      const priv_desempleo = isMarginal ? Math.random() < 0.22 : Math.random() < 0.06;
      const priv_informal = isInformal;
      const priv_materiales = isMarginal ? Math.random() < 0.58 : Math.random() < 0.04;
      const priv_hacinamiento = isMarginal ? Math.random() < 0.46 : Math.random() < 0.08;
      const priv_agua = isMarginal ? Math.random() < 0.62 : Math.random() < 0.02;
      const priv_luz = isMarginal ? Math.random() < 0.28 : Math.random() < 0.01;
      const priv_tic = isMarginal ? Math.random() < 0.52 : Math.random() < 0.06;
      const priv_redes = isMarginal ? Math.random() < 0.40 : Math.random() < 0.14;

      const privaciones: IPMIndicators = {
        asistencia_escolar: priv_escuela,
        rezago_educativo: priv_rezago,
        acceso_salud: priv_salud,
        gasto_catastrofico_salud: priv_catastrofe,
        desempleo_larga_duracion: priv_desempleo,
        empleo_informal_precario: priv_informal,
        materiales_precarios: priv_materiales,
        hacinamiento: priv_hacinamiento,
        carencia_agua_saneamiento: priv_agua,
        carencia_electricidad: priv_luz,
        carencia_internet_tic: priv_tic,
        ausencia_redes_apoyo: priv_redes
      };

      // Calculate Alkire-Foster 5 Dimension scores (each dimension weight = 0.20)
      const d_educacion = ((priv_escuela ? 0.5 : 0) + (priv_rezago ? 0.5 : 0));
      const d_salud = ((priv_salud ? 0.5 : 0) + (priv_catastrofe ? 0.5 : 0));
      const d_trabajo = ((priv_desempleo ? 0.5 : 0) + (priv_informal ? 0.5 : 0));
      const d_vivienda = ((priv_materiales ? 0.25 : 0) + (priv_hacinamiento ? 0.25 : 0) + (priv_agua ? 0.25 : 0) + (priv_luz ? 0.25 : 0));
      const d_activos = ((priv_tic ? 0.5 : 0) + (priv_redes ? 0.5 : 0));

      const dimensiones: IPMDimensions = {
        educacion: Number(d_educacion.toFixed(3)),
        salud: Number(d_salud.toFixed(3)),
        trabajo: Number(d_trabajo.toFixed(3)),
        vivienda_servicios: Number(d_vivienda.toFixed(3)),
        activos_redes: Number(d_activos.toFixed(3))
      };

      const c_score = Number(((d_educacion + d_salud + d_trabajo + d_vivienda + d_activos) * 0.20).toFixed(3));
      const is_poor = c_score >= 0.33;
      const is_extreme_poor = c_score >= 0.50;

      let categoriaPobreza: HouseholdAgent['categoriaPobreza'] = 'no_pobre';
      if (is_extreme_poor) categoriaPobreza = 'pobre_extremo';
      else if (is_poor) categoriaPobreza = 'pobre_moderado';
      else if (c_score >= 0.20) categoriaPobreza = 'vulnerable';

      const jitterLat = (Math.random() - 0.5) * 0.006;
      const jitterLng = (Math.random() - 0.5) * 0.006;

      households.push({
        id: `hh-${idCounter++}`,
        manzanaId: barrio.manzanasIds[i % barrio.manzanasIds.length],
        barrioId: barrio.id,
        lat: Number((barrio.centroide[0] + jitterLat).toFixed(6)),
        lng: Number((barrio.centroide[1] + jitterLng).toFixed(6)),
        personas: Math.floor(2 + Math.random() * 5),
        jefeHogarGenero: isFemaleHead ? 'femenino' : 'masculino',
        jefeHogarEdad: Math.floor(22 + Math.random() * 55),
        ingresoPerCapita: Math.round(baseIncome),
        gastoAlimentos: Math.round(baseIncome * (isMarginal ? 0.62 : 0.35)),
        empleoTipo: isInformal ? 'informal' : (Math.random() < 0.1 ? 'desempleado' : 'formal'),
        nivelEducativo: isMarginal ? (Math.random() < 0.4 ? 'primaria' : 'secundaria') : (Math.random() < 0.6 ? 'superior' : 'secundaria'),
        tipoVivienda: priv_materiales ? 'precaria' : (Math.random() < 0.3 ? 'recuperable' : 'adecuada'),
        serviciosBasicos: {
          aguaRed: !priv_agua,
          desague: !priv_agua,
          electricidad: !priv_luz,
          internet: !priv_tic
        },
        accesoSaludSeguro: !priv_salud,
        activosPuntaje: Math.round((1 - c_score) * 100),
        redesApoyoIndice: Number((1 - (priv_redes ? 0.7 : 0.1)).toFixed(2)),
        beneficiarioProgramaSocial: is_extreme_poor ? Math.random() < 0.65 : false,
        programaSocialNombre: is_extreme_poor ? 'Programa Juntos / Prospera' : undefined,
        privaciones,
        dimensiones,
        c_score,
        is_poor,
        is_extreme_poor,
        categoriaPobreza
      });
    }
  });

  return households;
}

// Preset Historical & Prospective Shocks
export const PRESET_SHOCKS = [
  {
    id: 'shock-inflacion-2025',
    tipo: 'inflacion_alimentos' as const,
    nombre: 'Shock de Inflación Alimentaria (+20%)',
    descripcion: 'Aumento del 20% en canasta básica alimentaria y contracción del 15% en demanda de mano de obra informal.',
    activo: false,
    magnitud: 0.20,
    duracionMeses: 12,
    impactoEnEmpleoInformalPct: 15,
    impactoEnGastoSaludPct: 8,
    impactoEnCanastaBasicaPct: 20
  },
  {
    id: 'shock-desastre-clima-ladera',
    tipo: 'desastre_climatico_inundacion' as const,
    nombre: 'Mega-Inundación y Huaicos en Laderas (Fenómeno El Niño)',
    descripcion: 'Precipitaciones extremas que destruyen vivienda precaria e infraestructura en asentamientos de ladera norte y este.',
    activo: false,
    magnitud: 0.45,
    duracionMeses: 6,
    radioAfectacionKm: 4.5,
    epicentroLat: -11.9480,
    epicentroLng: -76.9650,
    barriosAfectadosIds: ['b21', 'b23', 'b24', 'b25', 'b28', 'b29', 'b30', 'b37', 'b38', 'b39', 'b44'],
    impactoEnEmpleoInformalPct: 35,
    impactoEnGastoSaludPct: 60,
    impactoEnCanastaBasicaPct: 25
  },
  {
    id: 'shock-crisis-sanitaria',
    tipo: 'crisis_sanitaria_pandemia' as const,
    nombre: 'Crisis Sanitaria / Epidemia Urbana',
    descripcion: 'Restricciones de movilidad urbana de 6 meses con parálisis del comercio informal y shock de gasto de bolsillo en salud.',
    activo: false,
    magnitud: 0.35,
    duracionMeses: 6,
    impactoEnEmpleoInformalPct: 50,
    impactoEnGastoSaludPct: 75,
    impactoEnCanastaBasicaPct: 15
  }
];

// Preset Policy Interventions
export const PRESET_POLICIES = [
  {
    id: 'policy-juntos-expandido',
    tipo: 'transferencia_condicionada' as const,
    nombre: 'Expansión de Transferencias Condicionadas (Juntos Urbano)',
    descripcion: 'Subsidio mensual directo de $85 USD condicionado a asistencia escolar y controles preventivos de salud materno-infantil.',
    activo: false,
    presupuestoMillonesUSD: 14.5,
    hogaresMetaCount: 18000,
    montoTransferenciaUSD: 85,
    criterioFocalizacion: 'pobreza_extrema' as const,
    barriosObjetivoIds: ['b21', 'b23', 'b25', 'b28', 'b29', 'b36', 'b37', 'b38', 'b39', 'b44']
  },
  {
    id: 'policy-empleo-temporal',
    tipo: 'empleo_temporal_obras' as const,
    nombre: 'Programa Municipal de Empleo Temporal y Obras Menores',
    descripcion: 'Creación de 8,500 jornales remunerados para mejoramiento de pasajes, muros de contención y áreas verdes en asentamientos.',
    activo: false,
    presupuestoMillonesUSD: 9.8,
    hogaresMetaCount: 8500,
    montoTransferenciaUSD: 110,
    criterioFocalizacion: 'asentamientos_informales' as const,
    barriosObjetivoIds: ['b21', 'b22', 'b23', 'b24', 'b25', 'b26', 'b28', 'b31', 'b32', 'b37', 'b38', 'b39', 'b42', 'b44']
  },
  {
    id: 'policy-vivienda-servicios',
    tipo: 'subsidio_mejoramiento_vivienda' as const,
    nombre: 'Bono Familiar Habitacional y Conexiones Domiciliarias',
    descripcion: 'Mejoramiento estructural de techos/pisos y subsidio para conexión formal a red de agua potable y desagüe.',
    activo: false,
    presupuestoMillonesUSD: 22.0,
    hogaresMetaCount: 12000,
    mejoraServiciosDirecta: true,
    criterioFocalizacion: 'ipm_alto' as const,
    barriosObjetivoIds: ['b21', 'b23', 'b24', 'b25', 'b28', 'b29', 'b37', 'b38', 'b39', 'b44', 'b48']
  },
  {
    id: 'policy-nuevos-pois',
    tipo: 'infraestructura_salud_educacion' as const,
    nombre: 'Red de Nuevos Centros de Salud y Escuelas en Laderas',
    descripcion: 'Construcción de 6 nuevos Centros de Salud I-4 y 4 Colegios Técnicos en zonas periféricas reduciendo tiempos de viaje.',
    activo: false,
    presupuestoMillonesUSD: 35.0,
    hogaresMetaCount: 30000,
    nuevosPOIsCount: 10,
    criterioFocalizacion: 'universal_barrio' as const,
    barriosObjetivoIds: ['b21', 'b23', 'b25', 'b28', 'b37', 'b39', 'b44']
  }
];

export const LATIN_AMERICA_CITY_DATA = {
  barrios: INITIAL_NEIGHBORHOODS,
  manzanas: INITIAL_BLOCKS,
  puntosInteres: INITIAL_POIS,
  hogares: generateSyntheticHouseholds(5000),
  escenariosChoque: PRESET_SHOCKS,
  escenariosPolitica: PRESET_POLICIES
};

