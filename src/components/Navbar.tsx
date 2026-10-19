import React from 'react';
import { UserRole } from '../types';
import { PERU_DEPARTMENTS_DATA } from '../data/peruNationalData';
import { 
  Layers, 
  Sliders, 
  AlertTriangle, 
  FileText, 
  Code2, 
  ShieldCheck, 
  Play, 
  RefreshCw,
  Sparkles,
  Terminal,
  Activity,
  HelpCircle,
  Box,
  MapPin,
  Globe,
  Radio,
  Flame,
  Users,
  Download
  ,Bot, Database
} from 'lucide-react';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: 'dashboard' | 'real_data' | 'scenarios' | 'comparator' | 'forecasting' | 'ml_engine' | 'iot_sensors' | 'stress_test' | 'ai_copilot' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'real_data' | 'scenarios' | 'comparator' | 'forecasting' | 'ml_engine' | 'iot_sensors' | 'stress_test' | 'ai_copilot' | 'architecture') => void;
  onOpenReportModal: () => void;
  onOpenGovernanceModal: () => void;
  onOpenGuideModal: () => void;
  onOpenAgentInspector?: () => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  selectedCity: string;
  selectedDeptId: string;
  onSelectDepartment: (deptId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenGovernanceModal,
  onOpenGuideModal,
  onOpenAgentInspector,
  onRunSimulation,
  isSimulating,
  selectedCity,
  selectedDeptId,
  onSelectDepartment
}) => {
  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    admin: { label: 'ADMIN // ROOT', badgeColor: 'bg-[#1A1A1D] text-[#FF4D4D] border-[#FF4D4D]/40' },
    municipal_analyst: { label: 'ANALISTA MUNICIPAL', badgeColor: 'bg-[#1A1A1D] text-[#00FFC2] border-[#00FFC2]/40' },
    researcher: { label: 'CIENTÍFICO / INVESTIGADOR', badgeColor: 'bg-[#1A1A1D] text-[#38BDF8] border-[#38BDF8]/40' },
    community_validator: { label: 'VALIDADOR COMUNITARIO', badgeColor: 'bg-[#1A1A1D] text-[#FFAA00] border-[#FFAA00]/40' }
  };

  return (
    <header className="border-b border-[#2A2A2E] bg-[#111113] sticky top-0 z-50 text-[#E0E0E0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Brand & Technical Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#00FFC2] rounded-sm flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 border-2 border-[#0A0A0B] transform rotate-45"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight uppercase text-white font-mono flex items-center gap-1.5">
                  GD-VSU <span className="text-[#00FFC2] opacity-80">// PERÚ DIGITAL TWIN</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-mono font-bold bg-[#1A1A1D] text-[#00FFC2] border border-[#2A2A2E]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC2] mr-1 animate-pulse"></span>
                  COBERTURA_NACIONAL
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#8E9299] font-mono leading-none mt-0.5">
                <Globe className="w-3 h-3 text-[#00FFC2]" />
                <span className="text-[#00FFC2] font-semibold">PERÚ:</span>
                <select
                  value={selectedDeptId}
                  onChange={(e) => onSelectDepartment(e.target.value)}
                  className="bg-[#1A1A1D] text-[#00FFC2] border border-[#3A3A3F] hover:border-[#00FFC2] text-[10px] font-mono rounded px-1.5 py-0.5 outline-none cursor-pointer font-bold"
                >
                  {PERU_DEPARTMENTS_DATA.map(d => (
                    <option key={d.id} value={d.id} className="bg-[#111113] text-white">
                      {d.nombre} ({d.regionNatural.toUpperCase()}) - M0: {d.tasaPobrezaMultidimensional_M0.toFixed(3)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Technical Data Grid buttons */}
          <nav className="hidden lg:flex items-center space-x-1 bg-[#0A0A0B] p-1 rounded border border-[#2A2A2E]">
            <button onClick={() => setActiveTab('real_data')} className={`flex items-center space-x-1 px-2 py-1.5 rounded text-xs font-mono font-semibold ${activeTab === 'real_data' ? 'bg-[#38BDF8] text-black' : 'text-[#38BDF8] hover:bg-[#1A1A1D]'}`}><Database className="w-3.5 h-3.5"/><span>DATOS REALES</span></button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>MAPA & TELEMETRÍA</span>
            </button>

            <button
              onClick={() => setActiveTab('scenarios')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'scenarios'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ESCENARIOS</span>
            </button>

            <button
              onClick={() => setActiveTab('comparator')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'comparator'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>COMPARADOR A/B</span>
            </button>

            <button
              onClick={() => setActiveTab('forecasting')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'forecasting'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>ALERTAS & RADAR</span>
            </button>

            <button
              onClick={() => setActiveTab('iot_sensors')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'iot_sensors'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>TELEMETRÍA IoT</span>
            </button>

            <button
              onClick={() => setActiveTab('stress_test')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'stress_test'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#FF4D4D]" />
              <span>STRESS-TESTING</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_copilot')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'ai_copilot'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>COPILOTO IA</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-[#00FFC2] text-[#0A0A0B] shadow-sm'
                  : 'text-[#8E9299] hover:text-[#E0E0E0] hover:bg-[#1A1A1D]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>CÓDIGO PYTHON</span>
            </button>
          </nav>

          {/* Action Buttons & Governance */}
          <div className="flex items-center space-x-2">
            {/* Micro-Agent ABM Inspector Trigger */}
            {onOpenAgentInspector && (
              <button
                onClick={onOpenAgentInspector}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-[#141416] hover:bg-[#1A1A1D] text-[#38BDF8] border border-[#38BDF8]/40 hover:border-[#38BDF8] transition-all cursor-pointer shadow-sm"
                title="Inspeccionar Hogares y Micro-Agentes ABM a nivel de predio"
              >
                <Users className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden xl:inline">MICRO-AGENTES</span>
              </button>
            )}

            {/* Interactive Guide / Tour Trigger */}
            <button
              onClick={onOpenGuideModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-[#141416] hover:bg-[#1A1A1D] text-[#00FFC2] border border-[#00FFC2]/50 hover:border-[#00FFC2] transition-all cursor-pointer shadow-sm animate-pulse"
              title="Guía Interactiva y Manual del Gemelo Digital 3D"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#00FFC2]" />
              <span className="hidden sm:inline">GUÍA 3D // TOUR</span>
            </button>

            {/* Quick Simulation Trigger */}
            <button
              onClick={onRunSimulation}
              disabled={isSimulating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold bg-[#00FFC2] hover:bg-[#00e6af] text-[#0A0A0B] transition-all disabled:opacity-50 tracking-tight uppercase"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A0A0B]" />
                  <span>SIMULANDO...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>EJECUTAR ABM</span>
                </>
              )}
            </button>

            {/* Reports Trigger */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-medium bg-[#1A1A1D] hover:border-[#00FFC2] text-[#E0E0E0] border border-[#3A3A3F] transition-colors"
              title="Generar Reporte Municipal (PDF, Excel, GeoJSON)"
            >
              <FileText className="w-3.5 h-3.5 text-[#00FFC2]" />
              <span className="hidden sm:inline">REPORTES</span>
            </button>

            {/* Direct Project ZIP Download */}
            <a
              href="/gemelo-digital-vsu.zip"
              download="gemelo-digital-vsu.zip"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold bg-[#141416] hover:bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50 hover:border-[#22c55e] transition-all cursor-pointer shadow-sm"
              title="Descargar proyecto completo en ZIP para ejecutar localmente"
            >
              <Download className="w-3.5 h-3.5 text-[#22c55e]" />
              <span className="hidden xl:inline">DESCARGAR .ZIP</span>
            </a>

            {/* Governance & Role Switcher */}
            <button
              onClick={onOpenGovernanceModal}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${roleLabels[currentRole].badgeColor}`}
              title="Gobernanza de Datos & Control de Roles (RBAC)"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{roleLabels[currentRole].label}</span>
            </button>
          </div>

        </div>

        {/* Mobile Tab bar */}
        <div className="lg:hidden flex items-center justify-between py-2 border-t border-[#2A2A2E] overflow-x-auto space-x-2">
          <button onClick={() => setActiveTab('real_data')} className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'real_data' ? 'bg-[#38BDF8] text-black font-bold' : 'text-[#38BDF8]'}`}>DATOS REALES</button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            MAPA
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'scenarios' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            ESCENARIOS
          </button>
          <button
            onClick={() => setActiveTab('comparator')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'comparator' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            COMPARADOR
          </button>
          <button
            onClick={() => setActiveTab('forecasting')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'forecasting' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            ALERTAS
          </button>
          <button
            onClick={() => setActiveTab('iot_sensors')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'iot_sensors' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            IoT
          </button>
          <button
            onClick={() => setActiveTab('stress_test')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'stress_test' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            STRESS-TEST
          </button>
          <button
            onClick={() => setActiveTab('ai_copilot')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'ai_copilot' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            IA
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-2.5 py-1 text-xs font-mono rounded whitespace-nowrap ${activeTab === 'architecture' ? 'bg-[#00FFC2] text-[#0A0A0B] font-bold' : 'text-[#8E9299]'}`}
          >
            CÓDIGO
          </button>
        </div>
      </div>
    </header>
  );
};

