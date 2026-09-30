import React from 'react';
import {
  Calendar,
  Clock,
  PlusCircle,
  Truck,
  Sparkles,
  AlertTriangle,
  Warehouse,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const Header: React.FC = () => {
  const {
    activeTab,
    metrics,
    selectedDate,
    setSelectedDate,
    setIsAppointmentModalOpen,
    setSelectedAppointmentForEdit,
    setIsCheckinModalOpen,
    setSelectedAppointmentForCheckin,
    loadOptimizationPreview,
    refreshState,
    loading,
    currentUser,
  } = useLogistics();

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Centro de Controle Operacional',
      subtitle: 'Visão em tempo real de pátio, 14 docas e fluxo dos 32 caminhões diários',
    },
    appointments: {
      title: 'Gestão de Agendamentos',
      subtitle: 'Controle de chegadas, capacidade do pátio e validação operacional',
    },
    schedule: {
      title: 'Agenda Logística Diária & Semanal',
      subtitle: 'Janelas 07:00–11:00 e 12:00–16:00 · Intervalo 11:00–12:00 bloqueado',
    },
    yard: {
      title: 'Controle de Pátio (8 Vagas)',
      subtitle: 'Monitoramento em tempo real das vagas P01 a P08 e tempo de permanência',
    },
    docks: {
      title: 'Gestão das 14 Docas de Descarregamento',
      subtitle: 'Status em tempo real, alocação de veículos e tempos de descarga',
    },
    queue: {
      title: 'Fila de Espera Dinâmica',
      subtitle: 'Sequenciamento por prioridade e liberação imediata de docas',
    },
    carriers: {
      title: 'Diretório de Transportadoras',
      subtitle: 'Histórico de pontualidade, frotas e indicadores operacionais',
    },
    drivers: {
      title: 'Cadastro e Controle de Motoristas',
      subtitle: 'Registro de condutores, veículos vinculados e status de trânsito',
    },
    reports: {
      title: 'Relatórios Gerenciais & Indicadores',
      subtitle: 'Análise de tempos médios, pico de ocupação e comparação manhã vs tarde',
    },
    settings: {
      title: 'Configurações Operacionais da Move Log',
      subtitle: 'Parâmetros de capacidade, janelas de horário e regras de sobrecarga',
    },
  };

  const currentInfo = tabTitles[activeTab] || {
    title: 'Move Log TMS',
    subtitle: 'Gestão Operacional de Transporte',
  };

  const handleOpenNewAppointment = () => {
    setSelectedAppointmentForEdit(null);
    setIsAppointmentModalOpen(true);
  };

  const handleOpenCheckin = () => {
    setSelectedAppointmentForCheckin(null);
    setIsCheckinModalOpen(true);
  };

  const isReadOnly = currentUser.role === 'LEITURA';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & subtitle */}
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{currentInfo.title}</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Move Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{currentInfo.subtitle}</p>
        </div>

        {/* Operational Status Badges & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Yard capacity pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              metrics.capacityAlert
                ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                : metrics.yardOccupied >= 7
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Warehouse className="w-3.5 h-3.5 text-slate-500" />
            <span>Pátio:</span>
            <span className="font-mono font-bold">
              {metrics.yardOccupied} / {metrics.yardCapacity}
            </span>
            {metrics.capacityAlert && (
              <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-100 px-1 rounded">
                LOTADO
              </span>
            )}
          </div>

          {/* Docks status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Docas:</span>
            <span className="font-mono font-bold text-slate-900">
              {metrics.docksOccupied} / {metrics.totalDocks}
            </span>
            <span className="text-[11px] text-slate-500">({metrics.docksAvailable} livres)</span>
          </div>

          {/* Interval indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50/60 text-[11px] text-amber-900 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>11:00–12:00 Bloqueado</span>
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-slate-800 font-medium focus:outline-hidden bg-transparent"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={refreshState}
            disabled={loading}
            title="Atualizar dados"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {!isReadOnly && (
            <div className="flex items-center gap-2">
              {/* Check-in Button */}
              <button
                onClick={handleOpenCheckin}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Check-in</span>
              </button>

              {/* Optimize Schedule Button */}
              <button
                onClick={loadOptimizationPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
                title="Balanceia os 32 caminhões e elimina sobrecarga do pátio"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Otimizar Agenda</span>
              </button>

              {/* New Appointment Button */}
              <button
                onClick={handleOpenNewAppointment}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Novo Agendamento</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
