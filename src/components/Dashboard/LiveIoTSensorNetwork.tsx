import React, { useState, useEffect, useMemo } from 'react';
import { NeighborhoodCell } from '../../types';
import { 
  Radio, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  Wind, 
  Mountain, 
  Sun, 
  Bus, 
  HeartHandshake, 
  RefreshCw, 
  Sliders, 
  Play, 
  Pause, 
  Zap, 
  Wifi, 
  Database,
  BarChart3,
  TrendingUp,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export interface IoTSensorNode {
  id: string;
  code: string;
  name: string;
  type: 'air_quality' | 'water_pressure' | 'geotech_slope' | 'radiometer_viirs' | 'transit_flow' | 'nutrition_stock';
  zone: string;
  barrioNombre: string;
  status: 'ONLINE' | 'WARNING' | 'CRITICAL' | 'CALIBRATING';
  lastPingSecondsAgo: number;
  batteryPct: number;
  primaryValue: number;
  unit: string;
  secondaryValue: number;
  secondaryUnit: string;
  thresholdMax: number;
  history: { time: string; value: number; benchmark: number }[];
  locationDesc: string;
  correlatedDimension: 'Salud' | 'Vivienda' | 'Entorno' | 'Seguridad' | 'Educación';
}

interface LiveIoTSensorNetworkProps {
  neighborhoods: NeighborhoodCell[];
  selectedCity: string;
  onSelectBarrio?: (barrioId: string) => void;
}

export const LiveIoTSensorNetwork: React.FC<LiveIoTSensorNetworkProps> = ({
  neighborhoods,
  selectedCity,
  onSelectBarrio
}) => {
  // Streaming state
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamTick, setStreamTick] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'air_quality' | 'water_pressure' | 'geotech_slope' | 'radiometer_viirs' | 'transit_flow' | 'nutrition_stock'>('ALL');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('sensor_water_01');
  const [simulatedAnomaly, setSimulatedAnomaly] = useState<string | null>(null);

  // Generate dynamic sensor nodes tied to the current city neighborhoods
  const sensorNodes: IoTSensorNode[] = useMemo(() => {
    const bLad = neighborhoods.find(n => n.zona === 'periferia_ladera') || neighborhoods[0] || { nombre: 'Ladera Alta', id: 'b01' };
    const bCom = neighborhoods.find(n => n.zona === 'comercial') || neighborhoods[1] || { nombre: 'Eje Comercial', id: 'b02' };
    const bSur = neighborhoods.find(n => n.zona === 'expansion_sur') || neighborhoods[2] || { nombre: 'Sector Sur', id: 'b03' };
    const bCen = neighborhoods.find(n => n.zona === 'centro') || neighborhoods[3] || { nombre: 'Centro Histórico', id: 'b04' };

    return [
      {
        id: 'sensor_water_01',
        code: 'HYD-SED-902',
        name: 'Presión Hidráulica & Caudal Matriz Norte',
        type: 'water_pressure',
        zone: 'Periferia Ladera',
        barrioNombre: bLad.nombre,
        status: simulatedAnomaly === 'water_drop' ? 'CRITICAL' : 'WARNING',
        lastPingSecondsAgo: 2,
        batteryPct: 94,
        primaryValue: simulatedAnomaly === 'water_drop' ? 0.6 : 2.1,
        unit: 'bar',
        secondaryValue: simulatedAnomaly === 'water_drop' ? 32 : 142,
        secondaryUnit: 'L/s',
        thresholdMax: 3.5,
        locationDesc: 'Tubería Matriz Reservorio R-4 Laderas',
        correlatedDimension: 'Vivienda',
        history: [
          { time: '06:00', value: 2.3, benchmark: 2.5 },
          { time: '08:00', value: 1.8, benchmark: 2.5 },
          { time: '10:00', value: 2.0, benchmark: 2.5 },
          { time: '12:00', value: 1.7, benchmark: 2.5 },
          { time: '14:00', value: simulatedAnomaly === 'water_drop' ? 0.9 : 2.2, benchmark: 2.5 },
          { time: '16:00', value: simulatedAnomaly === 'water_drop' ? 0.6 : 2.1, benchmark: 2.5 },
        ]
      },
      {
        id: 'sensor_air_01',
        code: 'AIR-SEN-404',
        name: 'Estación de Material Particulado PM2.5 & CO2',
        type: 'air_quality',
        zone: 'Eje Comercial / Vía Expresa',
        barrioNombre: bCom.nombre,
        status: simulatedAnomaly === 'air_spike' ? 'CRITICAL' : 'ONLINE',
        lastPingSecondsAgo: 1,
        batteryPct: 98,
        primaryValue: simulatedAnomaly === 'air_spike' ? 78.4 : 38.6,
        unit: 'µg/m³',
        secondaryValue: simulatedAnomaly === 'air_spike' ? 680 : 495,
        secondaryUnit: 'ppm CO2',
        thresholdMax: 50.0,
        locationDesc: 'Estación Fija de Monitoreo Ambiental EPA-SENAMHI',
        correlatedDimension: 'Salud',
        history: [
          { time: '06:00', value: 25.1, benchmark: 25.0 },
          { time: '08:00', value: 46.2, benchmark: 25.0 },
          { time: '10:00', value: 41.0, benchmark: 25.0 },
          { time: '12:00', value: 36.5, benchmark: 25.0 },
          { time: '14:00', value: simulatedAnomaly === 'air_spike' ? 65.0 : 38.0, benchmark: 25.0 },
          { time: '16:00', value: simulatedAnomaly === 'air_spike' ? 78.4 : 38.6, benchmark: 25.0 },
        ]
      },
      {
        id: 'sensor_geo_01',
        code: 'GEO-SLP-711',
        name: 'Inclinómetro & Acelerómetro en Talud de Ladera',
        type: 'geotech_slope',
        zone: 'Periferia Ladera Alta',
        barrioNombre: bLad.nombre,
        status: simulatedAnomaly === 'slope_instability' ? 'CRITICAL' : 'ONLINE',
        lastPingSecondsAgo: 4,
        batteryPct: 89,
        primaryValue: simulatedAnomaly === 'slope_instability' ? 1.42 : 0.05,
        unit: '° inclinación',
        secondaryValue: simulatedAnomaly === 'slope_instability' ? 0.082 : 0.011,
        secondaryUnit: 'g aceleración',
        thresholdMax: 0.50,
        locationDesc: 'Quebrada Escarpada Muro de Contención Pirca',
        correlatedDimension: 'Entorno',
        history: [
          { time: '06:00', value: 0.04, benchmark: 0.15 },
          { time: '08:00', value: 0.05, benchmark: 0.15 },
          { time: '10:00', value: 0.05, benchmark: 0.15 },
          { time: '12:00', value: 0.06, benchmark: 0.15 },
          { time: '14:00', value: simulatedAnomaly === 'slope_instability' ? 0.85 : 0.05, benchmark: 0.15 },
          { time: '16:00', value: simulatedAnomaly === 'slope_instability' ? 1.42 : 0.05, benchmark: 0.15 },
        ]
      },
      {
        id: 'sensor_viirs_01',
        code: 'SAT-VRS-08',
        name: 'Radiómetro Nocturno Satelital & Alumbrado LED',
        type: 'radiometer_viirs',
        zone: 'Expansión Sur',
        barrioNombre: bSur.nombre,
        status: 'ONLINE',
        lastPingSecondsAgo: 8,
        batteryPct: 100,
        primaryValue: 14.8,
        unit: 'nW/cm²/sr',
        secondaryValue: 71,
        secondaryUnit: '% cobertura LED',
        thresholdMax: 45.0,
        locationDesc: 'Puntos de Luminosidad VIIRS / Calibración Suomi NPP',
        correlatedDimension: 'Seguridad',
        history: [
          { time: '20:00', value: 12.1, benchmark: 20.0 },
          { time: '22:00', value: 15.4, benchmark: 20.0 },
          { time: '00:00', value: 14.8, benchmark: 20.0 },
          { time: '02:00', value: 13.9, benchmark: 20.0 },
          { time: '04:00', value: 12.8, benchmark: 20.0 },
          { time: '06:00', value: 14.8, benchmark: 20.0 },
        ]
      },
      {
        id: 'sensor_transit_01',
        code: 'TRN-MET-112',
        name: 'Sensor de Flujo Intermodal & Estación de Alimentadores',
        type: 'transit_flow',
        zone: 'Centro Histórico / Nodo Intermodal',
        barrioNombre: bCen.nombre,
        status: 'ONLINE',
        lastPingSecondsAgo: 2,
        batteryPct: 96,
        primaryValue: 2450,
        unit: 'pasajeros/h',
        secondaryValue: 6.8,
        secondaryUnit: 'min espera',
        thresholdMax: 3200,
        locationDesc: 'Torniquetes Ópticos y Sensores LiDAR de Andén',
        correlatedDimension: 'Educación',
        history: [
          { time: '06:00', value: 1100, benchmark: 2000 },
          { time: '08:00', value: 3100, benchmark: 2000 },
          { time: '10:00', value: 1800, benchmark: 2000 },
          { time: '12:00', value: 1950, benchmark: 2000 },
          { time: '14:00', value: 2200, benchmark: 2000 },
          { time: '16:00', value: 2450, benchmark: 2000 },
        ]
      },
      {
        id: 'sensor_nutri_01',
        code: 'NUT-OLL-034',
        name: 'Telemetría de Almacén & Raciones en Red de Ollas Comunes',
        type: 'nutrition_stock',
        zone: 'Periferia Ladera',
        barrioNombre: bLad.nombre,
        status: simulatedAnomaly === 'food_shortage' ? 'CRITICAL' : 'WARNING',
        lastPingSecondsAgo: 3,
        batteryPct: 91,
        primaryValue: simulatedAnomaly === 'food_shortage' ? 1.2 : 4.5,
        unit: 'días stock',
        secondaryValue: simulatedAnomaly === 'food_shortage' ? 1480 : 1240,
        secondaryUnit: 'raciones/día',
        thresholdMax: 7.0,
        locationDesc: 'Balanza Digital IoT Almacén Comunitario Manos Unidas',
        correlatedDimension: 'Salud',
        history: [
          { time: 'Lun', value: 6.5, benchmark: 5.0 },
          { time: 'Mar', value: 5.8, benchmark: 5.0 },
          { time: 'Mié', value: 5.0, benchmark: 5.0 },
          { time: 'Jue', value: 4.6, benchmark: 5.0 },
          { time: 'Vie', value: simulatedAnomaly === 'food_shortage' ? 2.1 : 4.8, benchmark: 5.0 },
          { time: 'Hoy', value: simulatedAnomaly === 'food_shortage' ? 1.2 : 4.5, benchmark: 5.0 },
        ]
      }
    ];
  }, [neighborhoods, simulatedAnomaly]);

  // Live streaming clock
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setStreamTick(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  // Filtered sensors
  const filteredSensors = useMemo(() => {
    if (activeFilter === 'ALL') return sensorNodes;
    return sensorNodes.filter(s => s.type === activeFilter);
  }, [sensorNodes, activeFilter]);

  const activeSensor = useMemo(() => {
    return sensorNodes.find(s => s.id === selectedSensorId) || sensorNodes[0];
  }, [sensorNodes, selectedSensorId]);

  // Global telemetry statistics
  const stats = useMemo(() => {
    const total = sensorNodes.length;
    const online = sensorNodes.filter(s => s.status === 'ONLINE').length;
    const warning = sensorNodes.filter(s => s.status === 'WARNING').length;
    const critical = sensorNodes.filter(s => s.status === 'CRITICAL').length;
    const avgBattery = Math.round(sensorNodes.reduce((acc, s) => acc + s.batteryPct, 0) / total);
    return { total, online, warning, critical, avgBattery };
  }, [sensorNodes]);

  return (
    <div className="p-4 rounded-sm bg-[#111113] border border-[#2A2A2E] space-y-4 font-mono text-xs">
      
      {/* 1. Header & Live Stream Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#2A2A2E] gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0D221D] text-[#00FFC2] border border-[#184E42] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-[#00FFC2] animate-ping' : 'bg-[#666]'}`} />
              TELEMETRÍA IoT // SINCRONIZACIÓN FÍSICO-DIGITAL EN TIEMPO REAL
            </span>
            <span className="text-[10px] text-[#8E9299]">
              Territorio: {selectedCity} · Tick #{streamTick}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1 flex items-center gap-2">
            Red de Sensores Urbanos & Telemetría Satelital de Alta Frecuencia
          </h3>
          <p className="text-xs text-[#8E9299] max-w-3xl mt-0.5">
            Flujo bidireccional continuo que alimenta el Gemelo Digital con datos hidrológicos, calidad ambiental, estabilidad de laderas, radiometría nocturna y abastecimiento social.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulation Anomaly Injectors */}
          <div className="flex items-center gap-1 bg-[#141416] p-1 rounded border border-[#333]">
            <span className="text-[10px] text-[#8E9299] px-1">Inyectar Anomalía:</span>
            <button
              onClick={() => setSimulatedAnomaly(simulatedAnomaly === 'water_drop' ? null : 'water_drop')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                simulatedAnomaly === 'water_drop' ? 'bg-[#FF4D4D] text-white' : 'bg-[#1A1A1D] text-[#8E9299] hover:text-white'
              }`}
            >
              Fuga Agua
            </button>
            <button
              onClick={() => setSimulatedAnomaly(simulatedAnomaly === 'slope_instability' ? null : 'slope_instability')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                simulatedAnomaly === 'slope_instability' ? 'bg-[#FF4D4D] text-white' : 'bg-[#1A1A1D] text-[#8E9299] hover:text-white'
              }`}
            >
              Inclinación Talud
            </button>
            <button
              onClick={() => setSimulatedAnomaly(simulatedAnomaly === 'air_spike' ? null : 'air_spike')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                simulatedAnomaly === 'air_spike' ? 'bg-[#FFAA00] text-black' : 'bg-[#1A1A1D] text-[#8E9299] hover:text-white'
              }`}
            >
              Pico PM2.5
            </button>
          </div>

          {/* Pause / Resume Streaming */}
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`px-3 py-1.5 rounded-sm font-bold flex items-center gap-1.5 cursor-pointer border ${
              isStreaming 
                ? 'bg-[#141F28] text-[#38BDF8] border-[#38BDF8]/40' 
                : 'bg-[#1A1A1D] text-[#8E9299] border-[#3A3A3F]'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isStreaming ? 'STREAMING ACTIVO' : 'PAUSADO'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
          <span className="text-[10px] text-[#8E9299] flex items-center gap-1">
            <Database className="w-3 h-3 text-[#00FFC2]" /> Sensores Enlazados:
          </span>
          <span className="text-base font-bold text-white">{stats.total} estaciones</span>
          <span className="text-[9px] text-[#00FFC2] block">100% calibradas</span>
        </div>

        <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
          <span className="text-[10px] text-[#8E9299] flex items-center gap-1">
            <Wifi className="w-3 h-3 text-[#38BDF8]" /> Frecuencia de Muestreo:
          </span>
          <span className="text-base font-bold text-[#38BDF8]">10 Hz (0.1s)</span>
          <span className="text-[9px] text-[#8E9299] block">Latencia MQTT: 14ms</span>
        </div>

        <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
          <span className="text-[10px] text-[#8E9299] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-[#FFAA00]" /> Alertas Preventivas:
          </span>
          <span className="text-base font-bold text-[#FFAA00]">{stats.warning} warning</span>
          <span className="text-[9px] text-[#8E9299] block">Umbrales intermedios</span>
        </div>

        <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
          <span className="text-[10px] text-[#8E9299] flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#FF4D4D]" /> Nivel Crítico:
          </span>
          <span className="text-base font-bold text-[#FF4D4D]">{stats.critical} crítico</span>
          <span className="text-[9px] text-[#FF4D4D] block">{stats.critical > 0 ? 'Protocolo activado' : 'Sin fallas'}</span>
        </div>

        <div className="p-2.5 rounded bg-[#141416] border border-[#2A2A2E] space-y-1">
          <span className="text-[10px] text-[#8E9299] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#00FFC2]" /> Confiabilidad Física:
          </span>
          <span className="text-base font-bold text-[#00FFC2]">99.84%</span>
          <span className="text-[9px] text-[#8E9299] block">Batería prom: {stats.avgBattery}%</span>
        </div>
      </div>

      {/* 3. Sensor Category Filter Tabs */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {[
          { id: 'ALL', label: 'Todos los Sensores', icon: Activity },
          { id: 'water_pressure', label: 'Red Hídrica (SEDAPAL)', icon: Droplets },
          { id: 'air_quality', label: 'Calidad del Aire (PM2.5)', icon: Wind },
          { id: 'geotech_slope', label: 'Geotécnica de Laderas', icon: Mountain },
          { id: 'radiometer_viirs', label: 'Radiometría VIIRS', icon: Sun },
          { id: 'transit_flow', label: 'Movilidad & Metro', icon: Bus },
          { id: 'nutrition_stock', label: 'Soporte Alimentario', icon: HeartHandshake },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-[#00FFC2] text-[#0A0A0B]' 
                  : 'bg-[#141416] text-[#8E9299] hover:text-white border border-[#2A2A2E]'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Sensor Grid & Live Graph Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* SENSORS LIST (5 cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredSensors.map(sensor => {
            const isSelected = sensor.id === activeSensor.id;
            return (
              <div
                key={sensor.id}
                onClick={() => setSelectedSensorId(sensor.id)}
                className={`p-3 rounded border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#141F28] border-[#38BDF8] shadow-md'
                    : 'bg-[#141416] border-[#2A2A2E] hover:border-[#3A3A3F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-[#8E9299] font-bold">{sensor.code}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#0A0A0B] text-[#00FFC2] border border-[#222]">
                      {sensor.correlatedDimension}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    sensor.status === 'CRITICAL'
                      ? 'bg-[#2A1010] text-[#FF4D4D] border border-[#FF4D4D]/40 animate-pulse'
                      : sensor.status === 'WARNING'
                      ? 'bg-[#261805] text-[#FFAA00] border border-[#FFAA00]/40'
                      : 'bg-[#0D221D] text-[#00FFC2] border border-[#184E42]'
                  }`}>
                    {sensor.status}
                  </span>
                </div>

                <div className="mt-1">
                  <h4 className="text-xs font-bold text-white truncate">{sensor.name}</h4>
                  <p className="text-[10px] text-[#8E9299] truncate">
                    {sensor.barrioNombre} ({sensor.zone})
                  </p>
                </div>

                <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-[#222]">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-[#00FFC2]">{sensor.primaryValue}</span>
                    <span className="text-[10px] text-[#8E9299]">{sensor.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-white">{sensor.secondaryValue}</span>
                    <span className="text-[9px] text-[#8E9299] ml-1">{sensor.secondaryUnit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIVE SENSOR DEEP DIVE & TELEMETRY CHART (7 cols) */}
        <div className="lg:col-span-7 bg-[#0A0A0B] border border-[#2A2A2E] rounded p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#222]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#38BDF8]">{activeSensor.code}</span>
                  <span className="text-[10px] text-[#8E9299]">· {activeSensor.locationDesc}</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-0.5">{activeSensor.name}</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#8E9299] block">Batería & Señal</span>
                <span className="text-xs font-bold text-[#00FFC2]">{activeSensor.batteryPct}% · LoRaWAN 915MHz</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 my-2.5">
              <div className="p-2 rounded bg-[#141416] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Lectura Actual:</span>
                <span className="text-base font-bold text-[#00FFC2]">
                  {activeSensor.primaryValue} {activeSensor.unit}
                </span>
              </div>
              <div className="p-2 rounded bg-[#141416] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Umbral de Alerta:</span>
                <span className="text-base font-bold text-[#FFAA00]">
                  {activeSensor.thresholdMax} {activeSensor.unit}
                </span>
              </div>
              <div className="p-2 rounded bg-[#141416] border border-[#222]">
                <span className="text-[9px] text-[#8E9299] block">Barrio Asociado:</span>
                <span className="text-xs font-bold text-white block truncate">
                  {activeSensor.barrioNombre}
                </span>
              </div>
            </div>

            {/* Time Series Recharts Graph */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-[#8E9299]">
                <span>Evolución Temporal del Sensor (Últimas 12h):</span>
                <span className="text-[#00FFC2]">Línea Turquesa: Sensor / Gris: Umbral Base</span>
              </div>
              <div className="h-44 w-full bg-[#111113] rounded border border-[#222] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeSensor.history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="sensorArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00FFC2" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#00FFC2" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="time" stroke="#666" tick={{ fontSize: 9, fill: '#888' }} />
                    <YAxis stroke="#666" tick={{ fontSize: 9, fill: '#888' }} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#333', fontSize: '10px' }}
                      formatter={(val: any) => [`${val} ${activeSensor.unit}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Valor Sensor" 
                      stroke="#00FFC2" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#sensorArea)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      name="Umbral Estándar" 
                      stroke="#666" 
                      strokeDasharray="4 4" 
                      dot={false} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="p-2 rounded bg-[#141416] border border-[#222] flex items-center justify-between text-[10px]">
            <span className="text-[#8E9299]">
              Influencia en Gemelo Digital: Alimenta el cálculo del IPM dimensión <strong className="text-white">{activeSensor.correlatedDimension}</strong>.
            </span>
            <button
              onClick={() => {
                const b = neighborhoods.find(n => n.nombre === activeSensor.barrioNombre);
                if (b && onSelectBarrio) onSelectBarrio(b.id);
              }}
              className="px-2 py-1 rounded bg-[#1A1A1D] hover:bg-[#252528] text-[#00FFC2] border border-[#00FFC2]/40 font-bold cursor-pointer"
            >
              Focalizar en Mapa &rarr;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
