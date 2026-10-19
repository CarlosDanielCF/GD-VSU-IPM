import React, { useState } from 'react';
import { PYTHON_CODEBASE, CodeFile } from '../../services/pythonCodebaseFiles';
import { ReportGenerator } from '../../services/reportGenerator';
import { 
  Code2, 
  Layers, 
  Database, 
  Cpu, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  BookOpen, 
  Terminal,
  Workflow,
  Server
} from 'lucide-react';

export const ArchitectureExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PYTHON_CODEBASE[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'datamodel' | 'codebase'>('architecture');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const filename = selectedFile.path.split('/').pop() || 'script.py';
    ReportGenerator.downloadFile(selectedFile.content, filename, 'text/plain');
  };

  return (
    <div className="space-y-5 font-mono">
      
      {/* Navigation Sub-Tabs */}
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <Code2 className="w-4 h-4 text-[#00FFC2]" />
            Arquitectura de Software & Repositorio de Código Python
          </h2>
          <p className="text-[10px] text-[#8E9299] mt-0.5">
            Especificación técnica formal, modelo de datos espacial PostGIS y motor ABM en Python (Mesa / DEAP).
          </p>
        </div>

        <div className="flex items-center space-x-1.5 bg-[#0A0A0B] p-1 rounded-sm border border-[#2A2A2E]">
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              activeSubTab === 'architecture' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Diagrama & Flujo
          </button>
          <button
            onClick={() => setActiveSubTab('datamodel')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              activeSubTab === 'datamodel' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Modelo ER
          </button>
          <button
            onClick={() => setActiveSubTab('codebase')}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase transition-all rounded-sm ${
              activeSubTab === 'codebase' ? 'bg-[#00FFC2] text-[#0A0A0B]' : 'text-[#8E9299] hover:text-white'
            }`}
          >
            Explorador Código
          </button>
        </div>
      </div>

      {/* 1. Architecture Overview Tab */}
      {activeSubTab === 'architecture' && (
        <div className="space-y-5">
          {/* Component Diagram Box */}
          <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-5 shadow-md">
            <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-tight">
              <Workflow className="w-4 h-4 text-[#00FFC2]" />
              Arquitectura en 3 Niveles Jerárquicos del Gemelo Digital (ABM-DT)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              
              {/* Micro Level */}
              <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] rounded-sm p-4">
                <div className="flex items-center space-x-2 text-[#00FFC2] font-bold text-xs mb-2 uppercase">
                  <span className="w-4 h-4 rounded-sm bg-[#0D221D] flex items-center justify-center text-[10px] border border-[#184E42]">1</span>
                  <span>Nivel Micro (Hogares / Personas)</span>
                </div>
                <ul className="text-[11px] text-[#8E9299] space-y-1.5 font-sans">
                  <li>• <strong className="text-white font-mono">HouseholdAgent (Mesa):</strong> Atributos sociodemográficos de 10,000 agentes sintéticos.</li>
                  <li>• <strong className="text-white font-mono">12 Indicadores de Privación:</strong> Educación, salud, empleo informal, vivienda precaria, agua, TIC.</li>
                  <li>• <strong className="text-white font-mono">Dinámica Micro:</strong> Reglas probabilísticas de choque de ingresos, gasto catastrófico y formalización.</li>
                </ul>
              </div>

              {/* Meso Level */}
              <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#38BDF8] rounded-sm p-4">
                <div className="flex items-center space-x-2 text-[#38BDF8] font-bold text-xs mb-2 uppercase">
                  <span className="w-4 h-4 rounded-sm bg-[#0B1E28] flex items-center justify-center text-[10px] border border-[#183B4E]">2</span>
                  <span>Nivel Meso (Barrios / Manzanas)</span>
                </div>
                <ul className="text-[11px] text-[#8E9299] space-y-1.5 font-sans">
                  <li>• <strong className="text-white font-mono">NeighborhoodCell (GeoMesa):</strong> Celdas espaciales con geometrías poligonales PostGIS.</li>
                  <li>• <strong className="text-white font-mono">Variables Satelitales:</strong> VIIRS Nighttime Lights, NDVI Vegetación, GHSL Informalidad.</li>
                  <li>• <strong className="text-white font-mono">Trampas Espaciales:</strong> Retroalimentación de contagio barrial (&tau;<sub>trap</sub>).</li>
                </ul>
              </div>

              {/* Macro Level */}
              <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FFAA00] rounded-sm p-4">
                <div className="flex items-center space-x-2 text-[#FFAA00] font-bold text-xs mb-2 uppercase">
                  <span className="w-4 h-4 rounded-sm bg-[#241B08] flex items-center justify-center text-[10px] border border-[#4E3918]">3</span>
                  <span>Nivel Macro (Ciudad & Políticas)</span>
                </div>
                <ul className="text-[11px] text-[#8E9299] space-y-1.5 font-sans">
                  <li>• <strong className="text-white font-mono">CityModel:</strong> Planificador espacial de simulación temporal prospectiva.</li>
                  <li>• <strong className="text-white font-mono">ShockAgent:</strong> Inflación de alimentos, inundaciones en laderas, crisis sanitarias.</li>
                  <li>• <strong className="text-white font-mono">PolicyAgent:</strong> Transferencias condicionadas, jornales temporales, subsidio habitacional.</li>
                </ul>
              </div>

            </div>

            {/* Scientific Stack Matrix */}
            <div className="mt-5 pt-4 border-t border-[#2A2A2E]">
              <h4 className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-3">
                Stack Tecnológico de Producción
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#141416] p-2.5 rounded-sm border border-[#2A2A2E]">
                  <div className="text-[#8E9299] text-[9px] uppercase">Motor ABM</div>
                  <div className="font-bold text-[#00FFC2] font-mono mt-0.5 text-xs">Mesa 2.2 + GeoMesa</div>
                </div>
                <div className="bg-[#141416] p-2.5 rounded-sm border border-[#2A2A2E]">
                  <div className="text-[#8E9299] text-[9px] uppercase">Optimización Genética</div>
                  <div className="font-bold text-[#00FFC2] font-mono mt-0.5 text-xs">DEAP (NSGA-II)</div>
                </div>
                <div className="bg-[#141416] p-2.5 rounded-sm border border-[#2A2A2E]">
                  <div className="text-[#8E9299] text-[9px] uppercase">Base Espacial</div>
                  <div className="font-bold text-[#00FFC2] font-mono mt-0.5 text-xs">PostgreSQL 15 + PostGIS</div>
                </div>
                <div className="bg-[#141416] p-2.5 rounded-sm border border-[#2A2A2E]">
                  <div className="text-[#8E9299] text-[9px] uppercase">Backend Async</div>
                  <div className="font-bold text-[#00FFC2] font-mono mt-0.5 text-xs">FastAPI + Pydantic v2</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Data Model ER Tab */}
      {activeSubTab === 'datamodel' && (
        <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-tight">
            <Database className="w-4 h-4 text-[#00FFC2]" />
            Esquema Entidad-Relación Geoespacial (PostGIS & TimescaleDB)
          </h3>
          <p className="text-[10px] text-[#8E9299]">
            Tablas espaciales con soporte para índices R-Tree (GIST) e hipertablas de series de tiempo para indicadores IPM.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Table: barrios */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-sm p-3.5">
              <div className="font-bold text-[#00FFC2] text-xs font-mono mb-2 flex items-center justify-between">
                <span>TABLE barrios</span>
                <span className="text-[9px] text-[#8E9299]">Meso Polygon</span>
              </div>
              <ul className="text-xs font-mono text-[#8E9299] space-y-1">
                <li><strong className="text-[#FFAA00]">id</strong> VARCHAR(50) [PK]</li>
                <li><strong>codigo</strong> VARCHAR(20) [UNIQUE]</li>
                <li><strong>nombre</strong> VARCHAR(100)</li>
                <li><strong>distrito</strong> VARCHAR(100)</li>
                <li><strong>geom</strong> GEOMETRY(Polygon, 4326) [GIST]</li>
                <li><strong>centroide</strong> GEOMETRY(Point, 4326)</li>
                <li><strong>viirs_nightlights</strong> FLOAT</li>
                <li><strong>ndvi_vegetacion</strong> FLOAT</li>
                <li><strong>ghsl_informal_ratio</strong> FLOAT</li>
              </ul>
            </div>

            {/* Table: manzanas */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-sm p-3.5">
              <div className="font-bold text-[#38BDF8] text-xs font-mono mb-2 flex items-center justify-between">
                <span>TABLE manzanas</span>
                <span className="text-[9px] text-[#8E9299]">Micro Polygon</span>
              </div>
              <ul className="text-xs font-mono text-[#8E9299] space-y-1">
                <li><strong className="text-[#FFAA00]">id</strong> VARCHAR(50) [PK]</li>
                <li><strong>barrio_id</strong> VARCHAR(50) [FK &rarr; barrios.id]</li>
                <li><strong>codigo_manzana</strong> VARCHAR(30)</li>
                <li><strong>geom</strong> GEOMETRY(Polygon, 4326) [GIST]</li>
                <li><strong>hogares_count</strong> INTEGER</li>
              </ul>
            </div>

            {/* Table: puntos_interes */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-sm p-3.5">
              <div className="font-bold text-[#C084FC] text-xs font-mono mb-2 flex items-center justify-between">
                <span>TABLE puntos_interes</span>
                <span className="text-[9px] text-[#8E9299]">Urban POIs</span>
              </div>
              <ul className="text-xs font-mono text-[#8E9299] space-y-1">
                <li><strong className="text-[#FFAA00]">id</strong> VARCHAR(50) [PK]</li>
                <li><strong>nombre</strong> VARCHAR(150)</li>
                <li><strong>tipo</strong> VARCHAR(50) [hospital/escuela/mercado]</li>
                <li><strong>geom</strong> GEOMETRY(Point, 4326) [GIST]</li>
                <li><strong>radio_influencia_m</strong> INTEGER</li>
                <li><strong>capacidad</strong> INTEGER</li>
              </ul>
            </div>

            {/* Table: series_temporales_ipm */}
            <div className="bg-[#141416] border border-[#2A2A2E] rounded-sm p-3.5">
              <div className="font-bold text-[#FF4D4D] text-xs font-mono mb-2 flex items-center justify-between">
                <span>TABLE series_temporales_ipm</span>
                <span className="text-[9px] text-[#8E9299]">TimescaleDB Hypertable</span>
              </div>
              <ul className="text-xs font-mono text-[#8E9299] space-y-1">
                <li><strong className="text-[#FFAA00]">id</strong> BIGINT [PK]</li>
                <li><strong className="text-[#FF4D4D]">timestamp</strong> TIMESTAMPTZ [PARTITION]</li>
                <li><strong>barrio_id</strong> VARCHAR(50) [FK]</li>
                <li><strong>ipm_M0</strong> FLOAT (Alkire-Foster)</li>
                <li><strong>ipm_H</strong> FLOAT (Incidencia)</li>
                <li><strong>ipm_A</strong> FLOAT (Intensidad)</li>
                <li><strong>pobreza_extrema_pct</strong> FLOAT</li>
              </ul>
            </div>

          </div>
        </div>
      )}

      {/* 3. Codebase File Explorer Tab */}
      {activeSubTab === 'codebase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* File Selector Sidebar */}
          <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-3 shadow-md space-y-1.5">
            <h4 className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-2">
              Archivos del Repositorio
            </h4>

            {PYTHON_CODEBASE.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left p-2 rounded-sm text-xs transition-all flex items-center justify-between ${
                  selectedFile.path === file.path
                    ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold'
                    : 'text-[#8E9299] hover:bg-[#1A1A1D] hover:text-white bg-[#141416] border border-[#2A2A2E]'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-mono text-[11px]">{file.path.split('/').pop()}</span>
                </div>
                <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded-sm bg-[#0A0A0B] text-[#8E9299]">
                  {file.category}
                </span>
              </button>
            ))}
          </div>

          {/* Code Viewer Panel */}
          <div className="lg:col-span-2 bg-[#0F0F11] border border-[#2A2A2E] rounded-sm p-4 shadow-md flex flex-col justify-between">
            <div>
              {/* File Info Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2E] mb-3">
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">{selectedFile.path}</h4>
                  <p className="text-[10px] text-[#8E9299] mt-0.5 font-sans">{selectedFile.description}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyCode}
                    className="px-2 py-1 rounded-sm bg-[#1A1A1D] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] transition-colors flex items-center gap-1 text-[10px] uppercase font-mono"
                    title="Copiar Código"
                  >
                    {copied ? <Check className="w-3 h-3 text-[#00FFC2]" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={handleDownloadFile}
                    className="px-2 py-1 rounded-sm bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] border border-[#00FFC2] transition-colors flex items-center gap-1 text-[10px] uppercase font-mono font-bold"
                    title="Descargar Archivo"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar</span>
                  </button>
                </div>
              </div>

              {/* Code Pre Container */}
              <div className="bg-[#0A0A0B] p-3.5 rounded-sm border border-[#2A2A2E] max-h-[480px] overflow-auto">
                <pre className="font-mono text-[11px] text-[#00FFC2] leading-relaxed whitespace-pre">
                  {selectedFile.content}
                </pre>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
