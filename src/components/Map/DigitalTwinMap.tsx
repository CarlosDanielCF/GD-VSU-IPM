import React, { useEffect, useRef, useState } from 'react';
import { NeighborhoodCell, BlockCell, UrbanPOI, ShockScenario, PolicyScenario } from '../../types';
import { DigitalTwin3DViewer } from './DigitalTwin3DViewer';
import L from 'leaflet';
import { toPng } from 'html-to-image';
import { 
  Layers, 
  MapPin, 
  Eye, 
  Flame, 
  Trees, 
  Home, 
  Activity, 
  AlertCircle, 
  ShieldAlert, 
  Info, 
  Maximize2, 
  ZoomIn, 
  ZoomOut,
  Box,
  Compass,
  HelpCircle,
  Download,
  LoaderCircle
} from 'lucide-react';

interface DigitalTwinMapProps {
  neighborhoods: NeighborhoodCell[];
  blocks: BlockCell[];
  pois: UrbanPOI[];
  selectedNeighborhood: NeighborhoodCell | null;
  onSelectNeighborhood: (neighborhood: NeighborhoodCell) => void;
  activeShocks: ShockScenario[];
  activePolicies: PolicyScenario[];
  currentYear: number;
  onOpenGuide?: () => void;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  neighborhoods,
  blocks,
  pois,
  selectedNeighborhood,
  onSelectNeighborhood,
  activeShocks,
  activePolicies,
  currentYear,
  onOpenGuide
}) => {
  // Mode: 3D WebGL Digital Twin vs 2D Leaflet Map
  const [viewDimension, setViewDimension] = useState<'3d' | '2d'>('3d');

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const poiLayerRef = useRef<L.LayerGroup | null>(null);
  const shockLayerRef = useRef<L.LayerGroup | null>(null);
  const policyLayerRef = useRef<L.LayerGroup | null>(null);

  // Layer Toggles
  const [activeMetric, setActiveMetric] = useState<'ipm' | 'viirs' | 'ndvi' | 'ghsl'>('ipm');
  const [showPOIs, setShowPOIs] = useState<boolean>(true);
  const [showShocks, setShowShocks] = useState<boolean>(true);
  const [showPolicies, setShowPolicies] = useState<boolean>(true);
  const [showBlocksDetail, setShowBlocksDetail] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const downloadCurrentView = async () => {
    if (!captureRef.current || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await document.fonts.ready;
      if (viewDimension === '2d') {
        mapInstanceRef.current?.invalidateSize();
        await new Promise(resolve => window.setTimeout(resolve, 350));
      } else {
        await new Promise<void>(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())));
      }
      const dataUrl = await toPng(captureRef.current, {
        backgroundColor: '#0A0A0B',
        cacheBust: true,
        pixelRatio: 2.5,
        filter: node => !(node instanceof HTMLElement && node.dataset.captureExclude === 'true'),
      });
      const context = selectedNeighborhood?.nombre || 'territorio';
      const safeContext = context.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
      const link = document.createElement('a');
      link.download = `gd-vsu-${viewDimension}-${safeContext || 'territorio'}-${currentYear}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('No se pudo exportar la vista del gemelo digital:', error);
      setExportError('No se pudo generar la imagen. Verifique que las capas del mapa hayan terminado de cargar.');
    } finally {
      setIsExporting(false);
    }
  };

  // Initialize 2D Leaflet Map when in 2D mode
  useEffect(() => {
    if (viewDimension !== '2d') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = neighborhoods.length > 0 && neighborhoods[0]?.centroide
        ? [neighborhoods[0].centroide[0], neighborhoods[0].centroide[1]]
        : [-12.0850, -77.0100];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        minZoom: 6,
        maxZoom: 18,
        zoomControl: false
      });

      // Dark theme CartoDB basemap for high-contrast geospatial analytics
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        subdomains: 'abcd',
        maxZoom: 19,
        crossOrigin: true
      }).addTo(map);

      mapInstanceRef.current = map;
      poiLayerRef.current = L.layerGroup().addTo(map);
      shockLayerRef.current = L.layerGroup().addTo(map);
      policyLayerRef.current = L.layerGroup().addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    } else {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [viewDimension]);

  // Update Neighborhood Polygons & Color Scales
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    // Color ramp based on active metric
    const getColor = (feature: any) => {
      const n: NeighborhoodCell = feature.properties;
      if (activeMetric === 'ipm') {
        const val = n.ipm_M0;
        return val >= 0.45 ? '#ef4444' : // Red (Critica)
               val >= 0.35 ? '#f97316' : // Orange (Alta)
               val >= 0.20 ? '#eab308' : // Yellow (Moderada)
               val >= 0.10 ? '#10b981' : // Emerald
                             '#06b6d4';  // Cyan (Muy baja)
      }
      if (activeMetric === 'viirs') {
        const val = n.luminosidadNocturnaVIIRS; // 0 - 60
        return val > 45 ? '#38bdf8' :
               val > 30 ? '#0ea5e9' :
               val > 15 ? '#0284c7' :
               val > 5  ? '#1e3a8a' : '#0f172a';
      }
      if (activeMetric === 'ndvi') {
        const val = n.indiceVegetacionNDVI; // 0 - 0.6
        return val > 0.4 ? '#22c55e' :
               val > 0.2 ? '#84cc16' :
               val > 0.1 ? '#eab308' : '#78716c';
      }
      if (activeMetric === 'ghsl') {
        const val = n.coberturaGHSLInformal; // 0 - 1
        return val > 0.75 ? '#dc2626' :
               val > 0.50 ? '#ea580c' :
               val > 0.20 ? '#ca8a04' : '#334155';
      }
      return '#06b6d4';
    };

    const geojsonData: any = {
      type: 'FeatureCollection',
      features: neighborhoods.map(n => ({
        type: 'Feature',
        properties: n,
        geometry: {
          type: 'Polygon',
          coordinates: [n.poligono.map(([lat, lng]) => [lng, lat])]
        }
      }))
    };

    geojsonLayerRef.current = L.geoJSON(geojsonData, {
      style: (feature: any) => {
        const isSelected = selectedNeighborhood?.id === feature.properties.id;
        return {
          fillColor: getColor(feature),
          weight: isSelected ? 3 : 1.2,
          opacity: 1,
          color: isSelected ? '#ffffff' : '#1e293b',
          dashArray: isSelected ? '4' : '',
          fillOpacity: isSelected ? 0.75 : 0.55
        };
      },
      onEachFeature: (feature, layer) => {
        const n: NeighborhoodCell = feature.properties;
        
        // Tooltip hover
        layer.bindTooltip(`
          <div class="p-1.5 font-sans">
            <div class="font-bold text-slate-900 text-xs">${n.nombre}</div>
            <div class="text-[11px] text-slate-600">${n.distrito} · Zona: ${n.zona}</div>
            <div class="mt-1 flex items-center justify-between text-xs gap-2">
              <span class="font-medium text-slate-700">IPM (M0):</span>
              <span class="font-bold font-mono ${n.ipm_M0 >= 0.40 ? 'text-red-600' : 'text-emerald-700'}">${n.ipm_M0.toFixed(3)}</span>
            </div>
            <div class="text-[10px] text-slate-500">Pobreza H: ${(n.ipm_H * 100).toFixed(0)}% · Extrema: ${(n.pobrezaExtremaPct * 100).toFixed(0)}%</div>
          </div>
        `, { sticky: true, className: 'leaflet-custom-tooltip' });

        layer.on({
          click: () => {
            onSelectNeighborhood(n);
          }
        });
      }
    }).addTo(map);

    // Auto fit bounds to new department/city polygons
    try {
      const bounds = geojsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
      }
    } catch (e) {
      // Ignore boundary calculation issues if coordinates empty
    }

  }, [neighborhoods, activeMetric, selectedNeighborhood]);

  // Update POIs Layer
  useEffect(() => {
    if (!poiLayerRef.current) return;
    poiLayerRef.current.clearLayers();

    if (!showPOIs) return;

    pois.forEach(poi => {
      const colorMap: Record<string, string> = {
        hospital: '#ef4444',
        escuela: '#3b82f6',
        mercado: '#10b981',
        banco_inclusion: '#f59e0b',
        centro_comunitario: '#8b5cf6',
        comisaria: '#64748b'
      };

      const color = colorMap[poi.tipo] || '#06b6d4';

      const marker = L.circleMarker([poi.lat, poi.lng], {
        radius: 5,
        fillColor: color,
        color: '#ffffff',
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9
      });

      marker.bindPopup(`
        <div class="p-2 font-sans">
          <div class="text-xs font-bold text-slate-900">${poi.nombre}</div>
          <div class="text-[11px] text-slate-600 uppercase tracking-wider font-semibold mt-0.5">${poi.tipo.replace('_', ' ')}</div>
          <div class="text-[11px] text-slate-500 mt-1">Radio Influencia: ${poi.radioInfluenciaMetros}m · Capacidad: ${poi.capacidad}</div>
          <div class="mt-1 text-[10px] font-medium ${poi.estado === 'saturado' ? 'text-amber-600' : 'text-emerald-600'}">
            Estado: ${poi.estado.toUpperCase()}
          </div>
        </div>
      `);

      poiLayerRef.current?.addLayer(marker);
    });
  }, [pois, showPOIs]);

  // Update Shocks Layer (Visual Footprint of Active Shocks)
  useEffect(() => {
    if (!shockLayerRef.current) return;
    shockLayerRef.current.clearLayers();

    if (!showShocks) return;

    activeShocks.filter(s => s.activo).forEach(shock => {
      if (shock.epicentroLat && shock.epicentroLng && shock.radioAfectacionKm) {
        const circle = L.circle([shock.epicentroLat, shock.epicentroLng], {
          radius: shock.radioAfectacionKm * 1000,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.22,
          weight: 2,
          dashArray: '6, 6'
        });

        circle.bindTooltip(`
          <div class="p-1 text-xs">
            <span class="font-bold text-red-600">🚨 ${shock.nombre}</span>
            <p class="text-[10px] text-slate-600">${shock.descripcion}</p>
          </div>
        `, { sticky: true });

        shockLayerRef.current?.addLayer(circle);
      }
    });
  }, [activeShocks, showShocks]);

  // Update Policy Intervention Target Zones
  useEffect(() => {
    if (!policyLayerRef.current) return;
    policyLayerRef.current.clearLayers();

    if (!showPolicies) return;

    activePolicies.filter(p => p.activo).forEach(policy => {
      policy.barriosObjetivoIds.forEach(bId => {
        const barrio = neighborhoods.find(n => n.id === bId);
        if (barrio) {
          const marker = L.circleMarker(barrio.centroide, {
            radius: 8,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.4,
            weight: 2
          });
          marker.bindTooltip(`
            <div class="text-xs p-1">
              <span class="font-bold text-emerald-600">🛡️ ${policy.nombre}</span>
              <p class="text-[10px] text-slate-600">Barrio focalizado: ${barrio.nombre}</p>
            </div>
          `);
          policyLayerRef.current?.addLayer(marker);
        }
      });
    });
  }, [activePolicies, neighborhoods, showPolicies]);

  // Pan to selected neighborhood
  useEffect(() => {
    if (selectedNeighborhood && mapInstanceRef.current) {
      mapInstanceRef.current.setView(selectedNeighborhood.centroide, 13, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedNeighborhood]);

  return (
    <div ref={captureRef} className="space-y-2 bg-[#0A0A0B] p-1">
      {/* Top Dimension Switcher Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0F0F11] border border-[#2A2A2E] rounded-sm font-mono text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] uppercase font-bold text-[#8E9299]">MODO VISUAL:</span>
          
          <button
            onClick={() => setViewDimension('3d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-bold uppercase transition-all cursor-pointer ${
              viewDimension === '3d'
                ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Simulador Gemelo Digital 3D (WebGL)</span>
          </button>

          <button
            onClick={() => setViewDimension('2d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-bold uppercase transition-all cursor-pointer ${
              viewDimension === '2d'
                ? 'bg-[#38BDF8] text-[#0A0A0B] shadow-sm'
                : 'text-[#8E9299] hover:text-white hover:bg-[#1A1A1D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vista SIG 2D (CartoDB/Leaflet)</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            data-capture-exclude="true"
            onClick={downloadCurrentView}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#141416] hover:bg-[#1A1A1D] disabled:opacity-60 text-white border border-[#38BDF8]/60 transition-all cursor-pointer"
            title={`Descargar la vista ${viewDimension.toUpperCase()} actual en PNG de alta resolución`}
          >
            {isExporting ? <LoaderCircle className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" /> : <Download className="w-3.5 h-3.5 text-[#38BDF8]" />}
            <span>{isExporting ? 'Generando…' : `Descargar imagen ${viewDimension.toUpperCase()}`}</span>
          </button>
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-sm text-[10px] font-bold uppercase bg-[#141416] hover:bg-[#1A1A1D] text-[#00FFC2] border border-[#00FFC2]/50 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#00FFC2]" />
              <span>Manual / Guía 3D</span>
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1 text-[10px] text-[#8E9299] bg-[#141416] px-2 py-1 border border-[#2A2A2E]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] animate-pulse"></span>
            <span>MESA_ABM // 10K AGENTES SINTÉTICOS</span>
          </div>
        </div>
      </div>

      {exportError && (
        <div data-capture-exclude="true" role="alert" className="px-3 py-2 text-xs font-mono text-[#FF8A8A] bg-[#211114] border border-[#FF4D4D]/50 rounded-sm">
          {exportError}
        </div>
      )}

      {/* 3D WebGL Digital Twin Simulation View */}
      {viewDimension === '3d' ? (
        <DigitalTwin3DViewer
          neighborhoods={neighborhoods}
          blocks={blocks}
          pois={pois}
          selectedNeighborhood={selectedNeighborhood}
          onSelectNeighborhood={onSelectNeighborhood}
          activeShocks={activeShocks}
          activePolicies={activePolicies}
          currentYear={currentYear}
          onOpenGuide={onOpenGuide}
        />
      ) : (
        /* 2D Leaflet SIG Map View */
        <div className="relative w-full h-[520px] lg:h-[620px] rounded-sm overflow-hidden border border-[#2A2A2E] bg-[#0A0A0B] shadow-2xl flex flex-col">
          
          {/* Map Control Bar Top Left */}
          <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-1.5 bg-[#111113]/95 backdrop-blur-md p-1.5 rounded-sm border border-[#2A2A2E] shadow-xl text-xs font-mono">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8E9299] px-2 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#00FFC2]" /> CAPA:
            </span>

            <button
              onClick={() => setActiveMetric('ipm')}
              className={`px-2.5 py-1 text-xs rounded-sm font-mono font-bold uppercase transition-all ${
                activeMetric === 'ipm' 
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm' 
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              IPM Alkire-Foster
            </button>

            <button
              onClick={() => setActiveMetric('viirs')}
              className={`px-2.5 py-1 text-xs rounded-sm font-mono font-bold uppercase transition-all ${
                activeMetric === 'viirs' 
                  ? 'bg-[#38BDF8] text-[#0A0A0B] shadow-sm' 
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              VIIRS Luz Nocturna
            </button>

            <button
              onClick={() => setActiveMetric('ndvi')}
              className={`px-2.5 py-1 text-xs rounded-sm font-mono font-bold uppercase transition-all ${
                activeMetric === 'ndvi' 
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm' 
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              NDVI Vegetación
            </button>

            <button
              onClick={() => setActiveMetric('ghsl')}
              className={`px-2.5 py-1 text-xs rounded-sm font-mono font-bold uppercase transition-all ${
                activeMetric === 'ghsl' 
                  ? 'bg-[#FF4D4D] text-[#0A0A0B] shadow-sm' 
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              GHSL Asentamientos
            </button>
          </div>

          {/* Layer Toggles Right */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 bg-[#111113]/95 backdrop-blur-md p-1.5 rounded-sm border border-[#2A2A2E] shadow-xl text-xs font-mono">
            <button
              onClick={() => setShowPOIs(!showPOIs)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm transition-colors ${
                showPOIs ? 'bg-[#1A1A1D] text-[#38BDF8] border border-[#38BDF8]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>POIs Infraestructura</span>
            </button>

            <button
              onClick={() => setShowShocks(!showShocks)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm transition-colors ${
                showShocks ? 'bg-[#1A1A1D] text-[#FF4D4D] border border-[#FF4D4D]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Zonas Choque</span>
            </button>

            <button
              onClick={() => setShowPolicies(!showPolicies)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-sm transition-colors ${
                showPolicies ? 'bg-[#1A1A1D] text-[#00FFC2] border border-[#00FFC2]/40' : 'text-[#8E9299] hover:bg-[#1A1A1D]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Focalización Políticas</span>
            </button>
          </div>

          {/* Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Coordinates & Legend Bottom Left */}
          <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
            <div className="flex gap-2">
              <div className="px-2 py-1 bg-[#111113] border border-[#2A2A2E] text-[10px] text-[#00FFC2] font-mono shadow-md">
                LAT: -12.0850
              </div>
              <div className="px-2 py-1 bg-[#111113] border border-[#2A2A2E] text-[10px] text-[#00FFC2] font-mono shadow-md">
                LNG: -77.0100
              </div>
              <div className="px-2 py-1 bg-[#111113] border border-[#2A2A2E] text-[10px] text-[#8E9299] font-mono shadow-md">
                EPSG: 4326
              </div>
            </div>

            <div className="bg-[#111113]/95 backdrop-blur-md p-3 rounded-sm border border-[#2A2A2E] shadow-2xl text-xs max-w-xs font-mono">
              <div className="font-bold text-[#E0E0E0] mb-1.5 flex items-center justify-between text-[11px]">
                <span className="uppercase">{activeMetric === 'ipm' ? 'IPM (M0) Alkire-Foster' : activeMetric.toUpperCase()}</span>
                <span className="text-[10px] text-[#00FFC2]">{currentYear}</span>
              </div>

              {activeMetric === 'ipm' && (
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-[#FF4D4D]"></span>
                    <span className="text-[#E0E0E0]">Crítica Roja (≥ 0.450)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-[#FFAA00]"></span>
                    <span className="text-[#E0E0E0]">Alta Vulnerabilidad (0.350 - 0.449)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-[#FBBF24]"></span>
                    <span className="text-[#E0E0E0]">Vulnerabilidad Moderada (0.200 - 0.349)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-2 bg-[#00FFC2]"></span>
                    <span className="text-[#E0E0E0]">Baja / Estable (&lt; 0.200)</span>
                  </div>
                </div>
              )}

              {activeMetric === 'viirs' && (
                <div className="text-[10px] text-[#8E9299]">
                  Luminosidad nocturna VIIRS (nW/cm²·sr). Zonas oscuras denotan déficit de red e informalidad.
                </div>
              )}

              {activeMetric === 'ndvi' && (
                <div className="text-[10px] text-[#8E9299]">
                  Índice de vegetación y calidad ambiental urbana.
                </div>
              )}

              {activeMetric === 'ghsl' && (
                <div className="text-[10px] text-[#8E9299]">
                  Huella de asentamientos humanos informales y morfología no regularizada.
                </div>
              )}
            </div>
          </div>

          {/* Selected Neighborhood Quick Badge Bottom Right */}
          {selectedNeighborhood && (
            <div className="absolute bottom-4 right-4 z-[1000] bg-[#111113]/95 backdrop-blur-md p-3.5 rounded-sm border border-[#00FFC2] shadow-2xl text-xs max-w-sm font-mono">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-sm">{selectedNeighborhood.nombre}</span>
                <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider ${
                  selectedNeighborhood.nivelAlerta === 'critica_roja' ? 'bg-[#1A1A1D] text-[#FF4D4D] border border-[#FF4D4D]/60' :
                  selectedNeighborhood.nivelAlerta === 'alta' ? 'bg-[#1A1A1D] text-[#FFAA00] border border-[#FFAA00]/60' :
                  'bg-[#1A1A1D] text-[#00FFC2] border border-[#00FFC2]/60'
                }`}>
                  {selectedNeighborhood.nivelAlerta}
                </span>
              </div>
              <div className="text-[10px] text-[#8E9299] mb-2">
                DISTRITO: {selectedNeighborhood.distrito} | POBLACIÓN: {selectedNeighborhood.poblacionTotal.toLocaleString()}
              </div>
              <div className="grid grid-cols-3 gap-2 bg-[#0A0A0B] p-2 rounded-sm border border-[#2A2A2E] text-center">
                <div>
                  <div className="text-[9px] text-[#8E9299] uppercase font-bold">IPM (M0)</div>
                  <div className="font-bold text-[#00FFC2] text-sm">{selectedNeighborhood.ipm_M0.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8E9299] uppercase font-bold">Pobreza (H)</div>
                  <div className="font-bold text-[#E0E0E0] text-sm">{(selectedNeighborhood.ipm_H * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-[9px] text-[#8E9299] uppercase font-bold">Extrema</div>
                  <div className="font-bold text-[#FF4D4D] text-sm">{(selectedNeighborhood.pobrezaExtremaPct * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
