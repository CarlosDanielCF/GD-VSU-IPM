import { NeighborhoodCell, BlockCell, UrbanPOI, HouseholdAgent, ShockScenario, PolicyScenario, IPMDimensions, IPMIndicators } from '../types';

export interface PeruDepartmentData {
  id: string;
  nombre: string;
  regionNatural: 'costa' | 'sierra' | 'selva';
  centroide: [number, number]; // [lat, lng]
  zoomDefault: number;
  poblacionTotal: number;
  tasaPobrezaMultidimensional_M0: number;
  tasaPobrezaMonetaria_Pct: number;
  tasaInformalidadLaboral_Pct: number;
  coberturaAguaRed_Pct: number;
  brechaConectividad_Pct: number;
  vulnerabilidadClimaticaDesc: string;
  ciudadesPrincipales: string[];
}

export const PERU_DEPARTMENTS_DATA: PeruDepartmentData[] = [
  {
    id: 'lima',
    nombre: 'Lima Metropolitana',
    regionNatural: 'costa',
    centroide: [-12.0550, -77.0350],
    zoomDefault: 11,
    poblacionTotal: 10150000,
    tasaPobrezaMultidimensional_M0: 0.185,
    tasaPobrezaMonetaria_Pct: 27.5,
    tasaInformalidadLaboral_Pct: 68.2,
    coberturaAguaRed_Pct: 88.5,
    brechaConectividad_Pct: 18.0,
    vulnerabilidadClimaticaDesc: 'Laderas hiperáridas, sismos de alta magnitud y huaicos en cuencas de Rímac, Lurín y Chillón.',
    ciudadesPrincipales: ['Lima Centro', 'SJL', 'VMT', 'Comas', 'Ate']
  },
  {
    id: 'callao',
    nombre: 'Callao (Prov. Constitucional)',
    regionNatural: 'costa',
    centroide: [-12.0565, -77.1181],
    zoomDefault: 12,
    poblacionTotal: 1130000,
    tasaPobrezaMultidimensional_M0: 0.198,
    tasaPobrezaMonetaria_Pct: 28.1,
    tasaInformalidadLaboral_Pct: 69.4,
    coberturaAguaRed_Pct: 91.2,
    brechaConectividad_Pct: 19.5,
    vulnerabilidadClimaticaDesc: 'Riesgo de tsunami costero, erosión litoral en Ventanilla y contaminación ambiental industrial.',
    ciudadesPrincipales: ['Callao Cercado', 'Ventanilla', 'Bellavista', 'Carmen de la Legua', 'Mi Perú']
  },
  {
    id: 'arequipa',
    nombre: 'Arequipa (Metrópoli del Sur)',
    regionNatural: 'costa',
    centroide: [-16.4090, -71.5375],
    zoomDefault: 12,
    poblacionTotal: 1490000,
    tasaPobrezaMultidimensional_M0: 0.162,
    tasaPobrezaMonetaria_Pct: 19.8,
    tasaInformalidadLaboral_Pct: 64.0,
    coberturaAguaRed_Pct: 89.0,
    brechaConectividad_Pct: 22.5,
    vulnerabilidadClimaticaDesc: 'Asentamientos en faldas de volcanes (Misti/Chachani), sequías y torrenteras aluviales.',
    ciudadesPrincipales: ['Arequipa Centro', 'Cerro Colorado', 'Paucarpata', 'Cayma', 'Yura']
  },
  {
    id: 'cusco',
    nombre: 'Cusco (Región Sur Andina)',
    regionNatural: 'sierra',
    centroide: [-13.5319, -71.9675],
    zoomDefault: 12,
    poblacionTotal: 1360000,
    tasaPobrezaMultidimensional_M0: 0.342,
    tasaPobrezaMonetaria_Pct: 34.8,
    tasaInformalidadLaboral_Pct: 81.5,
    coberturaAguaRed_Pct: 76.2,
    brechaConectividad_Pct: 42.0,
    vulnerabilidadClimaticaDesc: 'Heladas andinas extremas, deslizamientos en quebradas y alta dispersión en periferias de altura.',
    ciudadesPrincipales: ['Cusco Metropolitano', 'Santiago', 'San Jerónimo', 'Sicuani', 'Quillabamba']
  },
  {
    id: 'la_libertad',
    nombre: 'La Libertad - Trujillo',
    regionNatural: 'costa',
    centroide: [-8.1116, -79.0287],
    zoomDefault: 12,
    poblacionTotal: 2020000,
    tasaPobrezaMultidimensional_M0: 0.265,
    tasaPobrezaMonetaria_Pct: 28.4,
    tasaInformalidadLaboral_Pct: 74.0,
    coberturaAguaRed_Pct: 82.0,
    brechaConectividad_Pct: 31.0,
    vulnerabilidadClimaticaDesc: 'Huaicos por quebradas San Ildefonso y El León, arenales periurbanos en El Porvenir.',
    ciudadesPrincipales: ['Trujillo', 'El Porvenir', 'La Esperanza', 'Florencia de Mora', 'Huanchaco']
  },
  {
    id: 'piura',
    nombre: 'Piura (Costa Norte - Fenómeno El Niño)',
    regionNatural: 'costa',
    centroide: [-5.1945, -80.6328],
    zoomDefault: 12,
    poblacionTotal: 2050000,
    tasaPobrezaMultidimensional_M0: 0.368,
    tasaPobrezaMonetaria_Pct: 37.2,
    tasaInformalidadLaboral_Pct: 82.0,
    coberturaAguaRed_Pct: 69.5,
    brechaConectividad_Pct: 46.0,
    vulnerabilidadClimaticaDesc: 'Inundaciones recurrentes por Fenómeno El Niño, dengue endémico y colapso de drenaje pluvial.',
    ciudadesPrincipales: ['Piura', 'Sullana', 'Castilla', 'Catacaos', 'Talara']
  },
  {
    id: 'lambayeque',
    nombre: 'Lambayeque - Chiclayo',
    regionNatural: 'costa',
    centroide: [-6.7714, -79.8409],
    zoomDefault: 12,
    poblacionTotal: 1310000,
    tasaPobrezaMultidimensional_M0: 0.285,
    tasaPobrezaMonetaria_Pct: 30.5,
    tasaInformalidadLaboral_Pct: 75.8,
    coberturaAguaRed_Pct: 79.0,
    brechaConectividad_Pct: 34.0,
    vulnerabilidadClimaticaDesc: 'Colapso de red de desagüe por lluvias torrenciales de El Niño y anegamiento en José Leonardo Ortiz.',
    ciudadesPrincipales: ['Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Lambayeque', 'Ferreñafe']
  },
  {
    id: 'junin',
    nombre: 'Junín - Huancayo (Valle del Mantaro)',
    regionNatural: 'sierra',
    centroide: [-12.0651, -75.2049],
    zoomDefault: 12,
    poblacionTotal: 1370000,
    tasaPobrezaMultidimensional_M0: 0.298,
    tasaPobrezaMonetaria_Pct: 30.1,
    tasaInformalidadLaboral_Pct: 79.5,
    coberturaAguaRed_Pct: 78.5,
    brechaConectividad_Pct: 38.0,
    vulnerabilidadClimaticaDesc: 'Crecimiento no planificado en suelo agrícola del valle, heladas y contaminación de cuenca.',
    ciudadesPrincipales: ['Huancayo', 'El Tambo', 'Chilca', 'Tarma', 'La Merced']
  },
  {
    id: 'ancash',
    nombre: 'Áncash - Chimbote & Huaraz',
    regionNatural: 'costa',
    centroide: [-9.0744, -78.5936],
    zoomDefault: 12,
    poblacionTotal: 1180000,
    tasaPobrezaMultidimensional_M0: 0.315,
    tasaPobrezaMonetaria_Pct: 32.4,
    tasaInformalidadLaboral_Pct: 78.0,
    coberturaAguaRed_Pct: 76.0,
    brechaConectividad_Pct: 39.5,
    vulnerabilidadClimaticaDesc: 'Riesgo aluviónico de lagunas glaciares en el Callejón de Huaylas y erosión marina en Chimbote.',
    ciudadesPrincipales: ['Chimbote', 'Nuevo Chimbote', 'Huaraz', 'Independencia', 'Casma']
  },
  {
    id: 'ica',
    nombre: 'Ica - Chincha & Pisco',
    regionNatural: 'costa',
    centroide: [-14.0678, -75.7286],
    zoomDefault: 12,
    poblacionTotal: 980000,
    tasaPobrezaMultidimensional_M0: 0.178,
    tasaPobrezaMonetaria_Pct: 20.2,
    tasaInformalidadLaboral_Pct: 66.5,
    coberturaAguaRed_Pct: 86.0,
    brechaConectividad_Pct: 24.0,
    vulnerabilidadClimaticaDesc: 'Estrés hídrico en acuífero subterráneo, desbordes del río Ica e informalidad en campamentos agroexportadores.',
    ciudadesPrincipales: ['Ica', 'Chincha Alta', 'Pisco', 'Nasca', 'Paracas']
  },
  {
    id: 'cajamarca',
    nombre: 'Cajamarca (Sierra Norte)',
    regionNatural: 'sierra',
    centroide: [-7.1638, -78.5003],
    zoomDefault: 12,
    poblacionTotal: 1450000,
    tasaPobrezaMultidimensional_M0: 0.428,
    tasaPobrezaMonetaria_Pct: 44.5,
    tasaInformalidadLaboral_Pct: 87.0,
    coberturaAguaRed_Pct: 62.0,
    brechaConectividad_Pct: 54.0,
    vulnerabilidadClimaticaDesc: 'Alta ruralidad periurbana, erosión hídrica, desnutrición crónica y brecha de saneamiento.',
    ciudadesPrincipales: ['Cajamarca', 'Jaén', 'Chota', 'Celendín', 'Bambamarca']
  },
  {
    id: 'puno',
    nombre: 'Puno - Juliaca (Altiplano)',
    regionNatural: 'sierra',
    centroide: [-15.8402, -70.0219],
    zoomDefault: 12,
    poblacionTotal: 1230000,
    tasaPobrezaMultidimensional_M0: 0.410,
    tasaPobrezaMonetaria_Pct: 41.2,
    tasaInformalidadLaboral_Pct: 88.5,
    coberturaAguaRed_Pct: 64.5,
    brechaConectividad_Pct: 52.0,
    vulnerabilidadClimaticaDesc: 'Friaje y heladas a 3,820 msnm, informalidad de comercio fronterizo y déficit de drenaje.',
    ciudadesPrincipales: ['Juliaca', 'Puno', 'Ilave', 'Ayaviri', 'Azángaro']
  },
  {
    id: 'loreto',
    nombre: 'Loreto - Iquitos (Amazonía Urbana)',
    regionNatural: 'selva',
    centroide: [-3.7491, -73.2538],
    zoomDefault: 12,
    poblacionTotal: 1030000,
    tasaPobrezaMultidimensional_M0: 0.445,
    tasaPobrezaMonetaria_Pct: 43.5,
    tasaInformalidadLaboral_Pct: 86.4,
    coberturaAguaRed_Pct: 58.0,
    brechaConectividad_Pct: 58.0,
    vulnerabilidadClimaticaDesc: 'Viviendas palafíticas inundables (Belén), aislamiento fluvial, leptospirosis y dengue.',
    ciudadesPrincipales: ['Iquitos', 'Belén', 'Punchana', 'San Juan Bautista', 'Yurimaguas']
  },
  {
    id: 'san_martin',
    nombre: 'San Martín - Tarapoto & Moyobamba',
    regionNatural: 'selva',
    centroide: [-6.4869, -76.3686],
    zoomDefault: 12,
    poblacionTotal: 900000,
    tasaPobrezaMultidimensional_M0: 0.320,
    tasaPobrezaMonetaria_Pct: 31.8,
    tasaInformalidadLaboral_Pct: 81.0,
    coberturaAguaRed_Pct: 71.0,
    brechaConectividad_Pct: 44.0,
    vulnerabilidadClimaticaDesc: 'Inundaciones por crecidas del río Huallaga, deforestación de cabeceras y altas temperaturas.',
    ciudadesPrincipales: ['Tarapoto', 'Moyobamba', 'Morales', 'La Banda de Shilcayo', 'Rioja']
  },
  {
    id: 'ucayali',
    nombre: 'Ucayali - Pucallpa (Selva Central)',
    regionNatural: 'selva',
    centroide: [-8.3791, -74.5539],
    zoomDefault: 12,
    poblacionTotal: 510000,
    tasaPobrezaMultidimensional_M0: 0.385,
    tasaPobrezaMonetaria_Pct: 36.8,
    tasaInformalidadLaboral_Pct: 83.2,
    coberturaAguaRed_Pct: 61.0,
    brechaConectividad_Pct: 49.0,
    vulnerabilidadClimaticaDesc: 'Inundaciones por crecida del río Ucayali, olas de calor extremo e informalidad maderera.',
    ciudadesPrincipales: ['Pucallpa', 'Yarinacocha', 'Manantay', 'Aguaytía']
  },
  {
    id: 'huanuco',
    nombre: 'Huánuco - Tingo María',
    regionNatural: 'sierra',
    centroide: [-9.9306, -76.2422],
    zoomDefault: 12,
    poblacionTotal: 760000,
    tasaPobrezaMultidimensional_M0: 0.435,
    tasaPobrezaMonetaria_Pct: 42.0,
    tasaInformalidadLaboral_Pct: 86.0,
    coberturaAguaRed_Pct: 63.5,
    brechaConectividad_Pct: 53.0,
    vulnerabilidadClimaticaDesc: 'Deslizamientos en laderas del río Huallaga, déficit de saneamiento básico en quebradas.',
    ciudadesPrincipales: ['Huánuco', 'Amarilis', 'Pillco Marca', 'Tingo María']
  },
  {
    id: 'ayacucho',
    nombre: 'Ayacucho - Huamanga',
    regionNatural: 'sierra',
    centroide: [-13.1631, -74.2236],
    zoomDefault: 12,
    poblacionTotal: 670000,
    tasaPobrezaMultidimensional_M0: 0.420,
    tasaPobrezaMonetaria_Pct: 40.5,
    tasaInformalidadLaboral_Pct: 85.2,
    coberturaAguaRed_Pct: 67.0,
    brechaConectividad_Pct: 48.0,
    vulnerabilidadClimaticaDesc: 'Erosión hídrica en laderas de Huamanga, escasez de agua en estiaje y pobreza estructural.',
    ciudadesPrincipales: ['Ayacucho (Huamanga)', 'San Juan Bautista', 'Carmen Alto', 'Huanta']
  },
  {
    id: 'apurimac',
    nombre: 'Apurímac - Abancay & Andahuaylas',
    regionNatural: 'sierra',
    centroide: [-13.6339, -72.8814],
    zoomDefault: 12,
    poblacionTotal: 430000,
    tasaPobrezaMultidimensional_M0: 0.440,
    tasaPobrezaMonetaria_Pct: 43.1,
    tasaInformalidadLaboral_Pct: 87.5,
    coberturaAguaRed_Pct: 65.0,
    brechaConectividad_Pct: 55.0,
    vulnerabilidadClimaticaDesc: 'Topografía muy accidentada, deslizamientos en quebradas y aislamiento de servicios urbanos.',
    ciudadesPrincipales: ['Abancay', 'Andahuaylas', 'Talavera', 'San Jerónimo']
  },
  {
    id: 'huancavelica',
    nombre: 'Huancavelica (Andes Centrales)',
    regionNatural: 'sierra',
    centroide: [-12.7872, -74.9727],
    zoomDefault: 12,
    poblacionTotal: 350000,
    tasaPobrezaMultidimensional_M0: 0.465,
    tasaPobrezaMonetaria_Pct: 47.2,
    tasaInformalidadLaboral_Pct: 89.2,
    coberturaAguaRed_Pct: 59.0,
    brechaConectividad_Pct: 62.0,
    vulnerabilidadClimaticaDesc: 'Pobreza extrema histórica, heladas severas a 3,670 msnm y dispersión geográfica extrema.',
    ciudadesPrincipales: ['Huancavelica', 'Ascensión', 'Pampas', 'Lircay']
  },
  {
    id: 'pasco',
    nombre: 'Pasco - Cerro de Pasco',
    regionNatural: 'sierra',
    centroide: [-10.6675, -76.2561],
    zoomDefault: 12,
    poblacionTotal: 270000,
    tasaPobrezaMultidimensional_M0: 0.395,
    tasaPobrezaMonetaria_Pct: 38.0,
    tasaInformalidadLaboral_Pct: 83.0,
    coberturaAguaRed_Pct: 66.0,
    brechaConectividad_Pct: 47.0,
    vulnerabilidadClimaticaDesc: 'Ciudad minera a 4,330 msnm, frío extremo, pasivos ambientales mineros y déficit hídrico.',
    ciudadesPrincipales: ['Cerro de Pasco', 'Chaupimarca', 'Yanacancha', 'Oxapampa', 'Villa Rica']
  },
  {
    id: 'tacna',
    nombre: 'Tacna (Frontera Sur)',
    regionNatural: 'costa',
    centroide: [-18.0146, -70.2536],
    zoomDefault: 12,
    poblacionTotal: 380000,
    tasaPobrezaMultidimensional_M0: 0.170,
    tasaPobrezaMonetaria_Pct: 21.0,
    tasaInformalidadLaboral_Pct: 65.5,
    coberturaAguaRed_Pct: 88.0,
    brechaConectividad_Pct: 23.0,
    vulnerabilidadClimaticaDesc: 'Déficit hídrico en cuenca del Caplina, sismicidad y asentamientos en quebrada del Diablo.',
    ciudadesPrincipales: ['Tacna Cercado', 'Coronel Gregorio Albarracín', 'Alto de la Alianza', 'Ciudad Nueva']
  },
  {
    id: 'moquegua',
    nombre: 'Moquegua - Ilo',
    regionNatural: 'costa',
    centroide: [-17.1983, -70.9357],
    zoomDefault: 12,
    poblacionTotal: 195000,
    tasaPobrezaMultidimensional_M0: 0.155,
    tasaPobrezaMonetaria_Pct: 18.5,
    tasaInformalidadLaboral_Pct: 62.0,
    coberturaAguaRed_Pct: 90.5,
    brechaConectividad_Pct: 20.0,
    vulnerabilidadClimaticaDesc: 'Actividad volcánica (Ubinas), sequías periódicas y riesgo de tsunami en el puerto de Ilo.',
    ciudadesPrincipales: ['Moquegua', 'Samegua', 'Ilo', 'Pacocha']
  },
  {
    id: 'tumbes',
    nombre: 'Tumbes (Frontera Norte)',
    regionNatural: 'costa',
    centroide: [-3.5669, -80.4515],
    zoomDefault: 12,
    poblacionTotal: 255000,
    tasaPobrezaMultidimensional_M0: 0.335,
    tasaPobrezaMonetaria_Pct: 33.0,
    tasaInformalidadLaboral_Pct: 79.0,
    coberturaAguaRed_Pct: 72.0,
    brechaConectividad_Pct: 41.0,
    vulnerabilidadClimaticaDesc: 'Desborde del río Tumbes por lluvias de El Niño, contaminación por metales pesados en la cuenca binacional.',
    ciudadesPrincipales: ['Tumbes', 'Zarumilla', 'Aguas Verdes', 'Corrales']
  },
  {
    id: 'amazonas',
    nombre: 'Amazonas - Chachapoyas & Bagua',
    regionNatural: 'selva',
    centroide: [-6.2294, -77.8728],
    zoomDefault: 12,
    poblacionTotal: 430000,
    tasaPobrezaMultidimensional_M0: 0.430,
    tasaPobrezaMonetaria_Pct: 42.5,
    tasaInformalidadLaboral_Pct: 86.5,
    coberturaAguaRed_Pct: 61.5,
    brechaConectividad_Pct: 56.0,
    vulnerabilidadClimaticaDesc: 'Deslizamientos y fallas geológicas en la cuenca del Utcubamba, aislamiento de comunidades nativas.',
    ciudadesPrincipales: ['Chachapoyas', 'Bagua Grande', 'Bagua', 'Pedro Ruiz Gallo']
  },
  {
    id: 'madre_de_dios',
    nombre: 'Madre de Dios - Puerto Maldonado',
    regionNatural: 'selva',
    centroide: [-12.5933, -69.1891],
    zoomDefault: 12,
    poblacionTotal: 180000,
    tasaPobrezaMultidimensional_M0: 0.350,
    tasaPobrezaMonetaria_Pct: 34.0,
    tasaInformalidadLaboral_Pct: 82.5,
    coberturaAguaRed_Pct: 65.0,
    brechaConectividad_Pct: 47.0,
    vulnerabilidadClimaticaDesc: 'Inundaciones por ríos Madre de Dios y Tambopata, friajes amazónicos e impacto de minería informal.',
    ciudadesPrincipales: ['Puerto Maldonado', 'Tambopata', 'Inambari', 'Iberia']
  }
];

// Helper to generate polygon
function generatePolygonCoords(lat: number, lng: number, radiusKm: number = 0.5, sides: number = 6): [number, number][] {
  const coords: [number, number][] = [];
  const rLat = radiusKm / 110.574;
  const rLng = radiusKm / (111.320 * Math.cos((lat * Math.PI) / 180));
  
  for (let i = 0; i <= sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    const jitter = 0.85 + Math.sin(i * 3 + lat * 100) * 0.15;
    const pLat = lat + rLat * Math.sin(angle) * jitter;
    const pLng = lng + rLng * Math.cos(angle) * jitter;
    coords.push([Number(pLat.toFixed(6)), Number(pLng.toFixed(6))]);
  }
  return coords;
}

// Generate Department-Specific Neighborhoods and Households
export function generateDepartmentData(deptId: string): {
  barrios: NeighborhoodCell[];
  manzanas: BlockCell[];
  puntosInteres: UrbanPOI[];
  hogares: HouseholdAgent[];
  escenariosChoque: ShockScenario[];
  escenariosPolitica: PolicyScenario[];
} {
  const dept = PERU_DEPARTMENTS_DATA.find(d => d.id === deptId) || PERU_DEPARTMENTS_DATA[0];
  const baseLat = dept.centroide[0];
  const baseLng = dept.centroide[1];

  const barrios: NeighborhoodCell[] = [];
  const manzanas: BlockCell[] = [];
  const puntosInteres: UrbanPOI[] = [];

  // Define 10 distinct urban sectors/neighborhoods per department
  const sectorNames = [
    { name: `Centro Histórico & Casco Urbano (${dept.nombre.split(' ')[0]})`, type: 'centro' as const, ipmMult: 0.55 },
    { name: `Eje Comercial e Industrial`, type: 'comercial' as const, ipmMult: 0.70 },
    { name: `Sector Residencial Consolidado`, type: 'centro' as const, ipmMult: 0.60 },
    { name: `Periferia Nor-Este (Asentamiento de Ladera/Ribera)`, type: 'periferia_ladera' as const, ipmMult: 1.45 },
    { name: `Quebrada Alta & Laderas de Vulnerabilidad`, type: 'periferia_ladera' as const, ipmMult: 1.60 },
    { name: `Zona de Expansión Periurbana Sur`, type: 'expansion_sur' as const, ipmMult: 1.25 },
    { name: `Corredor de Mercado Mayorista y Logístico`, type: 'comercial' as const, ipmMult: 0.95 },
    { name: `Asentamiento Humano Nueva Esperanza`, type: 'periferia_ladera' as const, ipmMult: 1.55 },
    { name: `Comunidad Periurbana Agrícola-Urbana`, type: 'expansion_sur' as const, ipmMult: 1.15 },
    { name: `Ribera / Zona de Riesgo Hídrico-Aluvial`, type: 'periferia_ladera' as const, ipmMult: 1.50 }
  ];

  sectorNames.forEach((sec, idx) => {
    const angle = (idx * 2 * Math.PI) / 10;
    const distanceKm = 1.2 + (idx % 4) * 0.9;
    const bLat = Number((baseLat + (distanceKm / 110.574) * Math.sin(angle)).toFixed(6));
    const bLng = Number((baseLng + (distanceKm / (111.320 * Math.cos((baseLat * Math.PI) / 180))) * Math.cos(angle)).toFixed(6));
    
    const baseIPM = Number(Math.min(0.75, Math.max(0.04, dept.tasaPobrezaMultidimensional_M0 * sec.ipmMult)).toFixed(3));
    const areaHa = sec.type === 'periferia_ladera' ? 120 : (sec.type === 'centro' ? 90 : 75);
    const densidad = sec.type === 'periferia_ladera' ? 160 : 210;
    const poblacion = Math.round(areaHa * densidad);
    const hogares = Math.round(poblacion / 3.6);

    const historico = [];
    const factors: Record<number, number> = {
      2010: 1.35, 2011: 1.30, 2012: 1.25, 2013: 1.20, 2014: 1.15,
      2015: 1.10, 2016: 1.06, 2017: 1.02, 2018: 1.04, 2019: 1.01,
      2020: 1.38, 2021: 1.18, 2022: 1.08, 2023: 1.12, 2024: 1.00
    };
    for (let y = 2010; y <= 2024; y++) {
      const f = factors[y] || 1.0;
      const ipm_M0 = Math.min(0.85, Math.max(0.01, Number((baseIPM * f).toFixed(3))));
      const ipm_H = Math.min(0.95, Number((ipm_M0 / 0.45).toFixed(3)));
      const ipm_A = Number((ipm_M0 / Math.max(0.01, ipm_H)).toFixed(3));
      historico.push({
        year: y,
        ipm_M0,
        ipm_H,
        ipm_A,
        pobrezaExtrema: Number((ipm_M0 * 0.42).toFixed(3))
      });
    }

    const current = historico[historico.length - 1];
    let nivelAlerta: NeighborhoodCell['nivelAlerta'] = 'normal';
    if (baseIPM >= 0.45) nivelAlerta = 'critica_roja';
    else if (baseIPM >= 0.35) nivelAlerta = 'alta';
    else if (baseIPM >= 0.20) nivelAlerta = 'moderada';

    const bId = `dept-${dept.id}-b${idx + 1}`;
    const manzanasIds = Array.from({ length: 6 }, (_, mIdx) => `mz-${bId}-${mIdx + 1}`);

    const viirs = sec.type === 'centro' ? 45.0 : (sec.type === 'comercial' ? 52.0 : 12.0);
    const ghsl_inf = sec.type === 'periferia_ladera' ? 0.78 : (sec.type === 'expansion_sur' ? 0.45 : 0.05);

    const contribucionDimensiones = {
      educacion: Number((0.18 + baseIPM * 0.08).toFixed(3)),
      salud: Number((0.22 + ghsl_inf * 0.09).toFixed(3)),
      trabajo: Number((0.26 + (dept.tasaInformalidadLaboral_Pct / 100) * 0.12).toFixed(3)),
      vivienda_servicios: Number((0.20 + (1 - dept.coberturaAguaRed_Pct / 100) * 0.15).toFixed(3)),
      activos_redes: Number((0.14 + (dept.brechaConectividad_Pct / 100) * 0.10).toFixed(3))
    };
    const sumContrib = Object.values(contribucionDimensiones).reduce((a, b) => a + b, 0);
    Object.keys(contribucionDimensiones).forEach(k => {
      (contribucionDimensiones as any)[k] = Number(((contribucionDimensiones as any)[k] / sumContrib).toFixed(3));
    });

    const neighborhoodObj: NeighborhoodCell = {
      id: bId,
      codigo: `SEC-${dept.id.toUpperCase()}-${String(idx + 1).padStart(2, '0')}`,
      nombre: sec.name,
      distrito: dept.ciudadesPrincipales[idx % dept.ciudadesPrincipales.length],
      zona: sec.type,
      areaHectareas: areaHa,
      poblacionTotal: poblacion,
      totalHogares: hogares,
      densidadPobHa: densidad,
      estratoSocioeconomico: baseIPM >= 0.45 ? 'bajo_marginal' : (baseIPM >= 0.30 ? 'bajo' : (baseIPM >= 0.15 ? 'medio_bajo' : 'medio')),
      centroide: [bLat, bLng],
      poligono: generatePolygonCoords(bLat, bLng, sec.type === 'periferia_ladera' ? 0.65 : 0.45),
      manzanasIds,
      ipm_M0: current.ipm_M0,
      ipm_H: current.ipm_H,
      ipm_A: current.ipm_A,
      pobrezaExtremaPct: current.pobrezaExtrema,
      brechaGeneroPct: Number((0.05 + baseIPM * 0.10).toFixed(3)),
      giniEspacial: Number((0.30 + baseIPM * 0.20).toFixed(3)),
      luminosidadNocturnaVIIRS: viirs,
      indiceVegetacionNDVI: dept.regionNatural === 'selva' ? 0.65 : (dept.regionNatural === 'sierra' ? 0.32 : 0.08),
      coberturaGHSLInformal: ghsl_inf,
      distanciaEscuelaMin: Math.round(6 + ghsl_inf * 18),
      distanciaHospitalMin: Math.round(12 + ghsl_inf * 40),
      distanciaMercadoMin: Math.round(5 + ghsl_inf * 15),
      conectividadTransporteScore: Math.round(85 - ghsl_inf * 55),
      indiceInfraestructura: Math.round(80 - ghsl_inf * 50),
      coeficienteTrampaPobreza: Number((baseIPM * 1.35 * (1 + ghsl_inf * 0.4)).toFixed(3)),
      nivelAlerta,
      historicoIPM: historico,
      contribucionDimensiones
    };

    barrios.push(neighborhoodObj);

    // Generate Blocks for this neighborhood
    manzanasIds.forEach((mId, mIdx) => {
      const mAngle = (mIdx * 2 * Math.PI) / 6;
      const mDist = 0.22;
      const mLat = bLat + (mDist / 110.574) * Math.sin(mAngle);
      const mLng = bLng + (mDist / 111.320) * Math.cos(mAngle);
      manzanas.push({
        id: mId,
        barrioId: bId,
        codigoManzana: `MZ-${dept.id.toUpperCase()}-${idx + 1}-${mIdx + 1}`,
        poligono: generatePolygonCoords(mLat, mLng, 0.08, 4),
        centroide: [Number(mLat.toFixed(6)), Number(mLng.toFixed(6))],
        hogaresCount: Math.round(hogares / 6),
        ipm_M0: Math.min(0.9, Math.max(0.01, Number((baseIPM * (0.9 + Math.sin(mIdx * 5) * 0.2)).toFixed(3)))),
        pobrezaPct: Math.min(0.98, Number((baseIPM / 0.45).toFixed(3))),
        luminosidad: Number((viirs * (0.8 + Math.cos(mIdx) * 0.3)).toFixed(1)),
        riesgoClimaticoInundacion: sec.type === 'periferia_ladera' ? 0.65 : 0.08
      });
    });

    // Generate POIs
    if (idx % 2 === 0) {
      puntosInteres.push({
        id: `poi-${dept.id}-${idx}-hosp`,
        nombre: `Hospital / Posta Médica ${sec.name.split(' ')[0]}`,
        tipo: 'hospital',
        lat: Number((bLat + 0.003).toFixed(6)),
        lng: Number((bLng + 0.003).toFixed(6)),
        radioInfluenciaMetros: 2500,
        capacidad: 250,
        estado: baseIPM > 0.35 ? 'saturado' : 'operativo'
      });
    }
    if (idx % 2 === 1) {
      puntosInteres.push({
        id: `poi-${dept.id}-${idx}-esc`,
        nombre: `I.E. Emblemática & Técnica (${dept.nombre.split(' ')[0]})`,
        tipo: 'escuela',
        lat: Number((bLat - 0.002).toFixed(6)),
        lng: Number((bLng - 0.002).toFixed(6)),
        radioInfluenciaMetros: 1800,
        capacidad: 850,
        estado: 'operativo'
      });
    }
  });

  // Generate Households for this department
  const households: HouseholdAgent[] = [];
  let hhCounter = 1;
  barrios.forEach(b => {
    const isMarginal = b.zona === 'periferia_ladera';
    const hhCount = 100;
    for (let i = 0; i < hhCount; i++) {
      const isFemaleHead = Math.random() < 0.42;
      const isInformal = Math.random() < (dept.tasaInformalidadLaboral_Pct / 100 * (isMarginal ? 1.15 : 0.85));
      const baseIncome = isMarginal ? 130 + Math.random() * 150 : 280 + Math.random() * 400;

      const priv_escuela = isMarginal ? Math.random() < 0.22 : Math.random() < 0.06;
      const priv_rezago = isMarginal ? Math.random() < 0.44 : Math.random() < 0.14;
      const priv_salud = isMarginal ? Math.random() < 0.45 : Math.random() < 0.12;
      const priv_catastrofe = isMarginal ? Math.random() < 0.30 : Math.random() < 0.08;
      const priv_desempleo = isMarginal ? Math.random() < 0.20 : Math.random() < 0.06;
      const priv_informal = isInformal;
      const priv_materiales = isMarginal ? Math.random() < 0.55 : Math.random() < 0.05;
      const priv_hacinamiento = isMarginal ? Math.random() < 0.44 : Math.random() < 0.09;
      const priv_agua = isMarginal ? Math.random() < (1 - dept.coberturaAguaRed_Pct / 100 * 0.9) : Math.random() < 0.03;
      const priv_luz = isMarginal ? Math.random() < 0.25 : Math.random() < 0.02;
      const priv_tic = isMarginal ? Math.random() < (dept.brechaConectividad_Pct / 100 * 1.2) : Math.random() < 0.08;
      const priv_redes = isMarginal ? Math.random() < 0.38 : Math.random() < 0.12;

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

      households.push({
        id: `hh-${dept.id}-${hhCounter++}`,
        manzanaId: b.manzanasIds[i % b.manzanasIds.length],
        barrioId: b.id,
        lat: Number((b.centroide[0] + (Math.random() - 0.5) * 0.005).toFixed(6)),
        lng: Number((b.centroide[1] + (Math.random() - 0.5) * 0.005).toFixed(6)),
        personas: Math.floor(2 + Math.random() * 5),
        jefeHogarGenero: isFemaleHead ? 'femenino' : 'masculino',
        jefeHogarEdad: Math.floor(22 + Math.random() * 55),
        ingresoPerCapita: Math.round(baseIncome),
        gastoAlimentos: Math.round(baseIncome * (isMarginal ? 0.60 : 0.38)),
        empleoTipo: isInformal ? 'informal' : (Math.random() < 0.1 ? 'desempleado' : 'formal'),
        nivelEducativo: isMarginal ? (Math.random() < 0.4 ? 'primaria' : 'secundaria') : (Math.random() < 0.5 ? 'superior' : 'secundaria'),
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
        beneficiarioProgramaSocial: is_extreme_poor ? Math.random() < 0.70 : false,
        programaSocialNombre: is_extreme_poor ? 'Programa Juntos / Pensión 65' : undefined,
        privaciones,
        dimensiones,
        c_score,
        is_poor,
        is_extreme_poor,
        categoriaPobreza
      });
    }
  });

  // Department-specific Shocks
  const escenariosChoque: ShockScenario[] = [
    {
      id: `shock-${dept.id}-inflacion`,
      tipo: 'inflacion_alimentos',
      nombre: `Shock de Inflación Alimentaria en ${dept.nombre}`,
      descripcion: `Aumento del 25% en la canasta de alimentos básicos en mercados de ${dept.nombre}.`,
      activo: false,
      magnitud: 0.25,
      duracionMeses: 12,
      impactoEnEmpleoInformalPct: 18,
      impactoEnGastoSaludPct: 10,
      impactoEnCanastaBasicaPct: 25
    },
    {
      id: `shock-${dept.id}-clima`,
      tipo: 'desastre_climatico_inundacion',
      nombre: `Shock Climático Regional: ${dept.vulnerabilidadClimaticaDesc.split(',')[0]}`,
      descripcion: `Impacto severo sobre infraestructura y hábitat: ${dept.vulnerabilidadClimaticaDesc}`,
      activo: false,
      magnitud: 0.40,
      duracionMeses: 6,
      radioAfectacionKm: 5.0,
      epicentroLat: baseLat,
      epicentroLng: baseLng,
      barriosAfectadosIds: barrios.filter(b => b.zona === 'periferia_ladera').map(b => b.id),
      impactoEnEmpleoInformalPct: 35,
      impactoEnGastoSaludPct: 55,
      impactoEnCanastaBasicaPct: 20
    }
  ];

  // Department-specific Policies
  const escenariosPolitica: PolicyScenario[] = [
    {
      id: `policy-${dept.id}-transferencia`,
      tipo: 'transferencia_condicionada',
      nombre: `Bono Alimentario Urbano Focalizado - ${dept.nombre}`,
      descripcion: `Transferencia condicionada de emergencia de $85 USD para familias en pobreza extrema de ${dept.nombre}.`,
      activo: false,
      presupuestoMillonesUSD: 12.0,
      hogaresMetaCount: 15000,
      montoTransferenciaUSD: 85,
      criterioFocalizacion: 'pobreza_extrema',
      barriosObjetivoIds: barrios.filter(b => b.ipm_M0 > 0.30).map(b => b.id)
    },
    {
      id: `policy-${dept.id}-agua-vivienda`,
      tipo: 'subsidio_mejoramiento_vivienda',
      nombre: `Plan Maestro de Agua, Saneamiento & Muros de Contención`,
      descripcion: `Cierre de brechas de agua potable y reforzamiento estructural en asentamientos vulnerables.`,
      activo: false,
      presupuestoMillonesUSD: 28.0,
      hogaresMetaCount: 18000,
      mejoraServiciosDirecta: true,
      criterioFocalizacion: 'asentamientos_informales',
      barriosObjetivoIds: barrios.filter(b => b.zona === 'periferia_ladera').map(b => b.id)
    },
    {
      id: `policy-${dept.id}-empleo`,
      tipo: 'empleo_temporal_obras',
      nombre: `Lurawi Perú Urbano - Empleo Rápido en Infraestructura Barrial`,
      descripcion: `Jornales remunerados para obras comunales de mitigación de riesgo y limpieza urbana.`,
      activo: false,
      presupuestoMillonesUSD: 8.5,
      hogaresMetaCount: 9000,
      montoTransferenciaUSD: 110,
      criterioFocalizacion: 'ipm_alto',
      barriosObjetivoIds: barrios.map(b => b.id)
    }
  ];

  return {
    barrios,
    manzanas,
    puntosInteres,
    hogares: households,
    escenariosChoque,
    escenariosPolitica
  };
}
