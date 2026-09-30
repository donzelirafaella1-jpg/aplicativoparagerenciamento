import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Truck,
  Warehouse,
  Clock,
  ListOrdered,
  Building2,
  Users,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useLogistics, ActiveTab } from '../../context/LogisticsContext';
import { UserRole } from '../../types/logistics';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    metrics,
    waitingQueue,
    currentUser,
    setCurrentUserRole,
    resetSeedData,
  } = useLogistics();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = React.useState(false);

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeAlert?: boolean;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agendamentos', icon: Truck, badge: metrics.totalTrucks },
    { id: 'schedule', label: 'Agenda Logística', icon: CalendarDays },
    {
      id: 'yard',
      label: 'Controle do Pátio',
      icon: Warehouse,
      badge: `${metrics.yardOccupied}/${metrics.yardCapacity}`,
      badgeAlert: metrics.yardOccupied >= metrics.yardCapacity,
    },
    {
      id: 'docks',
      label: 'Docas (14)',
      icon: Warehouse,
      badge: `${metrics.docksOccupied}/${metrics.totalDocks}`,
    },
    {
      id: 'queue',
      label: 'Fila de Espera',
      icon: ListOrdered,
      badge: waitingQueue.length > 0 ? waitingQueue.length : undefined,
    },
    { id: 'carriers', label: 'Transportadoras', icon: Building2 },
    { id: 'drivers', label: 'Motoristas', icon: Users },
    { id: 'reports', label: 'Relatórios & KPIs', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'ADMIN', label: 'Administrador', desc: 'Acesso irrestrito e parâmetros' },
    { role: 'GESTOR', label: 'Gestor Logístico', desc: 'Otimização, override e aprovações' },
    { role: 'OPERADOR_PATIO', label: 'Operador de Pátio', desc: 'Check-in e manobra de vagas' },
    { role: 'OPERADOR_DOCA', label: 'Operador de Doca', desc: 'Carga/descarga e liberação' },
    { role: 'LEITURA', label: 'Somente Leitura', desc: 'Consulta e auditoria' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <Truck className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight truncate">Move Log TMS</span>
            </div>
            <p className="text-xs text-slate-400 font-mono">CD Central · 14 Docas</p>
          </div>
        </div>

        {/* Operating status banner */}
        <div className="mt-3 px-2.5 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Operação Ativa
          </span>
          <span className="text-slate-400 font-mono text-[11px]">07:00–16:00</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Módulos Operacionais
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                    item.badgeAlert
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                      : isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Reset Seed Data */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={resetSeedData}
          title="Restaura a grade padrão de 32 caminhões e pátio para demonstração"
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded border border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar 32 Caminhões</span>
        </button>
      </div>

      {/* Role / User Switcher */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 relative">
        <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1 flex items-center justify-between">
          <span>Perfil Operacional</span>
          <ShieldCheck className="w-3 h-3 text-blue-400" />
        </div>

        <button
          onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition-colors"
        >
          <div className="truncate">
            <p className="font-medium text-slate-100 truncate">{currentUser.name}</p>
            <p className="text-[11px] text-blue-400 font-mono truncate">{currentUser.company}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-1" />
        </button>

        {isRoleDropdownOpen && (
          <div className="absolute bottom-16 left-3 right-3 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 z-50 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              Alternar Perfil para Teste
            </div>
            {roles.map((r) => (
              <button
                key={r.role}
                onClick={() => {
                  setCurrentUserRole(r.role);
                  setIsRoleDropdownOpen(false);
                }}
                className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                  currentUser.role === r.role
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium">{r.label}</div>
                <div className="text-[10px] text-slate-400 opacity-90">{r.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
