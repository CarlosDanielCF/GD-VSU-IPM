import React, { useState, useMemo } from 'react';
import { NeighborhoodCell, BlockCell, SimulationRunResult, AlkireFosterResult } from '../../types';
import { ReportGenerator } from '../../services/reportGenerator';
import { MLEngineService } from '../../services/mlEngineService';
import { 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Download, 
  Printer, 
  Building2, 
  CheckCircle, 
  Layers,
  Sparkles,
  Cpu
} from 'lucide-react';

interface ReportGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  neighborhoods: NeighborhoodCell[];
  blocks: BlockCell[];
  afResult: AlkireFosterResult;
  lastSimResult: SimulationRunResult | null;
  selectedCity: string;
}

export const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({
  isOpen,
  onClose,
  neighborhoods,
  blocks,
  afResult,
  lastSimResult,
  selectedCity
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const mlResult = useMemo(() => {
    return MLEngineService.runFullEngine(neighborhoods, selectedCity);
  }, [neighborhoods, selectedCity]);

  if (!isOpen) return null;

  const handleDownloadGeoJSON = () => {
    const geojson = ReportGenerator.generateGeoJSON(neighborhoods, blocks);
    ReportGenerator.downloadFile(geojson, `GD_VSU_Geometrias_IPM_${selectedCity.replace(/\s+/g, '_')}.geojson`, 'application/geo+json');
    setDownloadSuccess('Capa GeoJSON descargada exitosamente para SIG (QGIS/ArcGIS).');
  };

  const handleDownloadCSV = () => {
    const csv = ReportGenerator.generateComprehensiveCSV(neighborhoods, afResult, mlResult, selectedCity);
    ReportGenerator.downloadFile(csv, `GD_VSU_Libro_Excel_ML_EDA_Validacion_${selectedCity.replace(/\s+/g, '_')}.csv`, 'text/csv');
    setDownloadSuccess('Libro completo Excel (.csv) con EDA, Modelos, K-Fold, Hiperparámetros, Pruebas Robustas y SHAP descargado.');
  };

  const handleDownloadWordDoc = () => {
    const doc = ReportGenerator.generateWordDocument(neighborhoods, afResult, mlResult, selectedCity);
    ReportGenerator.downloadFile(doc, `Informe_Tecnico_Cientifico_ML_GD_VSU_${selectedCity.replace(/\s+/g, '_')}.doc`, 'application/msword');
    setDownloadSuccess('Informe formal de Política Pública y Machine Learning descargado en formato Word (.doc).');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2E] bg-[#0A0A0B]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-sm bg-[#0D221D] text-[#00FFC2] border border-[#184E42]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-tight">Generador de Reportes Técnicos & Capas SIG</h3>
              <p className="text-[10px] text-[#8E9299]">Exportación oficial para municipalidades, ministerios y SIG</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#8E9299] hover:text-white hover:bg-[#1A1A1D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          
          {downloadSuccess && (
            <div className="p-2.5 rounded-sm bg-[#0D221D] border border-[#184E42] text-[#00FFC2] text-[10px] flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#00FFC2] shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Export Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. PDF Report */}
            <div className="p-3.5 rounded-sm bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FF4D4D] hover:border-[#FF4D4D] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[#FF4D4D] mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="font-bold text-xs text-white uppercase">Informe Técnico PDF</span>
                </div>
                <p className="text-[10px] text-[#8E9299] font-sans">
                  Informe ejecutivo municipal con mapas de calor, gráficos de Pareto y desglose de 5 dimensiones.
                </p>
              </div>
              <button
                onClick={handlePrintPDF}
                className="mt-3 w-full py-1.5 px-3 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#FF4D4D] hover:bg-[#E03E3E] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3 h-3" />
                <span>Imprimir / Guardar PDF</span>
              </button>
            </div>

            {/* 2. Excel CSV Matrix */}
            <div className="p-3.5 rounded-sm bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] hover:border-[#00FFC2] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[#00FFC2] mb-1">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="font-bold text-xs text-white uppercase">Matriz Excel (CSV)</span>
                </div>
                <p className="text-[10px] text-[#8E9299] font-sans">
                  Tabla de 50 barrios con IPM (M0, H, A), indicadores VIIRS, NDVI, GHSL y 12 privaciones censales.
                </p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="mt-3 w-full py-1.5 px-3 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Descargar CSV Excel</span>
              </button>
            </div>

            {/* 3. Word Policy Brief */}
            <div className="p-3.5 rounded-sm bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#38BDF8] hover:border-[#38BDF8] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[#38BDF8] mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="font-bold text-xs text-white uppercase">Policy Brief Word (.doc)</span>
                </div>
                <p className="text-[10px] text-[#8E9299] font-sans">
                  Documento formal de política pública con narrativa, evidencia cuantitativa y hoja de ruta.
                </p>
              </div>
              <button
                onClick={handleDownloadWordDoc}
                className="mt-3 w-full py-1.5 px-3 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#38BDF8] hover:bg-[#0EA5E9] text-[#0A0A0B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>Descargar Word (.doc)</span>
              </button>
            </div>

            {/* 4. GeoJSON Layers */}
            <div className="p-3.5 rounded-sm bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#FFAA00] hover:border-[#FFAA00] transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-1.5 text-[#FFAA00] mb-1">
                  <FileCode className="w-4 h-4" />
                  <span className="font-bold text-xs text-white uppercase">Capas GeoJSON (SIG)</span>
                </div>
                <p className="text-[10px] text-[#8E9299] font-sans">
                  Geometrías poligonales con atributos espaciales completas para importación directa en QGIS o ArcGIS.
                </p>
              </div>
              <button
                onClick={handleDownloadGeoJSON}
                className="mt-3 w-full py-1.5 px-3 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#FFAA00] hover:bg-[#E69900] text-[#0A0A0B] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3 h-3" />
                <span>Descargar GeoJSON</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2A2A2E] bg-[#0A0A0B] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm text-[10px] font-mono uppercase bg-[#1A1A1D] hover:bg-[#2A2A2E] text-white border border-[#2A2A2E] transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
