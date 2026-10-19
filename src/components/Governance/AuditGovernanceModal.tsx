import React from 'react';
import { UserRole } from '../../types';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Eye, 
  KeyRound, 
  FileCheck, 
  UserCheck, 
  History,
  CheckCircle,
  Database
} from 'lucide-react';

interface AuditGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const AuditGovernanceModal: React.FC<AuditGovernanceModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange
}) => {
  if (!isOpen) return null;

  const rolesList: { role: UserRole; title: string; desc: string; permissions: string[] }[] = [
    {
      role: 'admin',
      title: 'Administrador del Sistema',
      desc: 'Acceso total a calibración genética DEAP, reentrenamiento de pesos, inyección de choques macro y configuración de base PostGIS.',
      permissions: ['Ejecutar simulaciones Monte Carlo', 'Modificar pesos de corte Alkire-Foster', 'Descargar microdatos sintéticos', 'Reconfigurar topología urbana']
    },
    {
      role: 'municipal_analyst',
      title: 'Analista Municipal',
      desc: 'Diseño y simulación de programas sociales, evaluación de presupuesto de obras públicas y exportación de informes técnicos.',
      permissions: ['Simular paquetes de políticas públicas', 'Visualizar mapas de calor y alertas tempranas', 'Exportar reportes PDF y matrices CSV', 'Focalizar barrios prioritarios']
    },
    {
      role: 'researcher',
      title: 'Investigador / Científico de Datos',
      desc: 'Auditoría de matrices de transición de pobreza, análisis de sensibilidad elástica, y verificación de scripts Python Mesa/DEAP.',
      permissions: ['Explorar código fuente Python', 'Consultar series temporales 2010-2030', 'Descargar capas GeoJSON', 'Auditar matrices de transición']
    },
    {
      role: 'community_validator',
      title: 'Comunidad / Validador Social',
      desc: 'Participación ciudadana, validación comunitaria de necesidades barriales y consulta de semáforos de vulnerabilidad pública.',
      permissions: ['Consultar indicadores agregados a nivel barrio', 'Reportar discrepancias territoriales', 'Visualizar metas ODS 1', 'Modo de solo lectura transparente']
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono">
      <div className="bg-[#0F0F11] border border-[#2A2A2E] rounded-sm w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2A2A2E] bg-[#0A0A0B]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-sm bg-[#0D221D] text-[#00FFC2] border border-[#184E42]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-tight">Gobernanza de Datos, Ética & Control de Roles (RBAC)</h3>
              <p className="text-[10px] text-[#8E9299]">Privacidad diferencial, anonimización geoespacial y trazabilidad de decisiones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-[#8E9299] hover:text-white hover:bg-[#1A1A1D] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[520px] overflow-y-auto">
          
          {/* 1. Protocolo de Privacidad y Ética de Datos */}
          <div className="bg-[#141416] border border-[#2A2A2E] border-l-2 border-l-[#00FFC2] p-3 rounded-sm space-y-1.5">
            <div className="flex items-center space-x-2 text-[10px] font-bold text-[#00FFC2] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Protocolo de Protección de Microdatos Sensibles</span>
            </div>
            <p className="text-[10px] text-[#8E9299] leading-relaxed font-sans">
              El GD-VSU implementa <strong className="text-white font-mono">Privacidad Diferencial (&epsilon; = 0.5)</strong> y perturbación gaussiana espacial en los centroides de micro-agentes para evitar re-identificación de hogares. Los microdatos son 100% sintéticos, calibrados estadísticamente contra ENAHO y Censo Nacional.
            </p>
          </div>

          {/* 2. Selector de Roles Activos */}
          <div>
            <h4 className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider mb-2.5">
              Seleccione su Rol Operativo en el Gemelo Digital:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {rolesList.map(item => (
                <div
                  key={item.role}
                  onClick={() => onRoleChange(item.role)}
                  className={`p-3 rounded-sm border transition-all cursor-pointer ${
                    currentRole === item.role
                      ? 'bg-[#0D221D] border-[#00FFC2] border-l-2 border-l-[#00FFC2]'
                      : 'bg-[#141416] border-[#2A2A2E] hover:border-[#8E9299]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white uppercase">{item.title}</span>
                    {currentRole === item.role && (
                      <span className="w-2 h-2 rounded-full bg-[#00FFC2]"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8E9299] mb-2 leading-relaxed font-sans">{item.desc}</p>
                  
                  <div className="space-y-1 pt-2 border-t border-[#2A2A2E]">
                    {item.permissions.map((perm, pIdx) => (
                      <div key={pIdx} className="text-[10px] text-[#8E9299] flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-[#00FFC2] shrink-0" />
                        <span className="font-mono">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Trazabilidad de Auditoría */}
          <div className="bg-[#141416] border border-[#2A2A2E] p-3 rounded-sm">
            <div className="flex items-center justify-between text-[10px] mb-2">
              <span className="font-bold text-white flex items-center gap-1.5 uppercase">
                <History className="w-3.5 h-3.5 text-[#00FFC2]" />
                Registro de Auditoría de Simulación (Audit Trail)
              </span>
              <span className="font-mono text-[9px] text-[#8E9299]">SHA-256 Checksum: c84f...92a1</span>
            </div>
            <div className="font-mono text-[10px] text-[#8E9299] space-y-0.5">
              <div>[2026-08-30 22:30:12] SIM_INIT: Modelo ABM cargado con 10,000 agentes sintéticos.</div>
              <div>[2026-08-30 22:31:05] CALIBRATION_DEAP: Ajuste genético completado (RMSE = 0.024).</div>
              <div>[2026-08-30 22:32:44] POLICY_DEPLOY: Paquete Juntos Urbano asignado a 8 barrios laderas.</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#2A2A2E] bg-[#0A0A0B] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase bg-[#00FFC2] hover:bg-[#00E5AE] text-[#0A0A0B] transition-colors cursor-pointer"
          >
            Guardar y Aplicar
          </button>
        </div>

      </div>
    </div>
  );
};
