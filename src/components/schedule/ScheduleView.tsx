import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  Truck,
  Warehouse,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Edit2,
  Trash2,
  History,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { Appointment, Priority } from '../../types/logistics';
import { timeToMinutes } from '../../lib/logistics-engine';

export const ScheduleView: React.FC = () => {
  const {
    appointments,
    selectedDate,
    setSelectedDate,
    setIsAppointmentModalOpen,
    setSelectedAppointmentForEdit,
    setSelectedAppointmentForCheckin,
    setIsCheckinModalOpen,
    cancelAppointment,
    setSelectedAppointmentForHistory,
    loadOptimizationPreview,
    currentUser,
  } = useLogistics();

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isReadOnly = currentUser.role === 'LEITURA';

  // Filter appointments for the selected date
  const dayAppointments = appointments
    .filter((a) => a.date === selectedDate)
    .filter((a) => (filterPriority === 'all' ? true : a.priority === filterPriority))
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));

  // Morning shift: 07:00 to 11:00
  const morningTrucks = dayAppointments.filter((a) => timeToMinutes(a.scheduledTime) < 660);
  // Afternoon shift: 12:00 to 16:00
  const afternoonTrucks = dayAppointments.filter((a) => timeToMinutes(a.scheduledTime) >= 720);

  const handleEdit = (app: Appointment) => {
    setSelectedAppointmentForEdit(app);
    setIsAppointmentModalOpen(true);
  };

  const handleCheckin = (app: Appointment) => {
    setSelectedAppointmentForCheckin(app);
    setIsCheckinModalOpen(true);
  };

  const handleCancel = async (app: Appointment) => {
    if (confirm(`Tem certeza que deseja cancelar o agendamento do veículo ${app.plate}?`)) {
      await cancelAppointment(app.id);
    }
  };

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case 'URGENTE':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'ALTA':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BAIXA':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AGENDADO':
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">Agendado</span>;
      case 'NO_PATIO':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-300">No Pátio</span>;
      case 'AGUARDANDO_DOCA':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-300">Aguardando Doca</span>;
      case 'EM_DESCARREGAMENTO':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-300 animate-pulse">Em Descarregamento</span>;
      case 'FINALIZADO':
        return <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-purple-200">Finalizado</span>;
      case 'ATRASADO':
        return <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-semibold border border-rose-300">Atrasado</span>;
      case 'CANCELADO':
        return <span className="bg-slate-200 text-slate-500 line-through px-2 py-0.5 rounded text-[10px]">Cancelado</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const renderTruckCard = (app: Appointment) => (
    <div
      key={app.id}
      className={`p-3.5 rounded-xl border bg-white shadow-2xs hover:shadow-md transition-all ${
        app.status === 'CANCELADO' ? 'opacity-60 bg-slate-50' : 'hover:border-blue-400'
      }`}
    >
      {/* Top Header: Time, Plate, Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {app.scheduledTime}
          </span>
          <span className="font-mono font-bold text-sm text-blue-700 tracking-wide">
            {app.plate}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityStyle(app.priority)}`}>
            {app.priority}
          </span>
          {getStatusBadge(app.status)}
        </div>
      </div>

      {/* Driver, Carrier, Cargo */}
      <div className="space-y-1 text-xs text-slate-600 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-800 truncate">{app.driverName}</span>
          <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">{app.carrierName}</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 truncate">{app.cargoType}</span>
          <span className="font-mono font-semibold text-slate-700">
            {app.dockId ? `Doca ${app.dockId.toString().padStart(2, '0')}` : 'Doca Flexível'}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>Descarga est.: <strong>{app.estUnloadMinutes}m</strong></span>
          <span>Permanência est.: <strong>{app.estStayMinutes}m</strong></span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          onClick={() => setSelectedAppointmentForHistory(app)}
          className="text-xs text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1"
        >
          <History className="w-3.5 h-3.5" />
          <span>Histórico</span>
        </button>

        {!isReadOnly && app.status !== 'FINALIZADO' && app.status !== 'CANCELADO' && (
          <div className="flex items-center gap-1.5">
            {app.status === 'AGENDADO' && (
              <button
                onClick={() => handleCheckin(app)}
                className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
              >
                Check-in
              </button>
            )}
            <button
              onClick={() => handleEdit(app)}
              title="Editar Agendamento"
              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleCancel(app)}
              title="Cancelar Agendamento"
              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Schedule Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Day/Week selector & Date Navigator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'day' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Diária
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                viewMode === 'week' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visão Semanal
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <CalendarDays className="w-4 h-4 text-blue-600" />
            <span>Data: {selectedDate}</span>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="URGENTE">Urgente</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="all">Todos os Status</option>
            <option value="AGENDADO">Agendado</option>
            <option value="NO_PATIO">No Pátio</option>
            <option value="AGUARDANDO_DOCA">Aguardando Doca</option>
            <option value="EM_DESCARREGAMENTO">Em Descarregamento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="ATRASADO">Atrasado</option>
          </select>

          {!isReadOnly && (
            <>
              <button
                onClick={loadOptimizationPreview}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Otimizar Grade</span>
              </button>

              <button
                onClick={() => {
                  setSelectedAppointmentForEdit(null);
                  setIsAppointmentModalOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
              >
                + Novo Agendamento
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Operational Schedule Content */}
      <div className="space-y-6">
        {/* SHIFT 1: TURNO MANHÃ (07:00 - 11:00) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div>
                <h3 className="font-bold text-sm text-blue-950">Turno Manhã (07:00 às 11:00)</h3>
                <p className="text-[11px] text-blue-800">
                  {morningTrucks.length} caminhões programados · Capacidade simultânea controlada no pátio (máx 8)
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-blue-700 bg-white px-2.5 py-1 rounded border border-blue-200">
              Janela 07:00–11:00
            </span>
          </div>

          <div className="p-5">
            {morningTrucks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nenhum caminhão agendado para o turno da manhã com os filtros atuais.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {morningTrucks.map(renderTruckCard)}
              </div>
            )}
          </div>
        </div>

        {/* MANDATORY LUNCH INTERVAL: 11:00 - 12:00 -> STRICTLY BLOCKED */}
        <div className="relative rounded-xl border-2 border-amber-300 bg-amber-50/70 overflow-hidden shadow-xs p-6 text-center">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2 shadow-xs border border-amber-300">
              <Clock className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Intervalo Obrigatório Bloqueado · 11:00 às 12:00</span>
            </div>
            <h4 className="text-base font-bold text-amber-950">Pausa Operacional do Centro de Distribuição</h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              O período das 11:00 às 12:00 é reservado para refeição da equipe e manutenção preventiva das docas.
              <strong> O sistema proíbe rigorosamente agendamentos neste intervalo ou que atravessem o período.</strong>
            </p>
            <div className="mt-3 px-3 py-1 bg-white/80 rounded border border-amber-300/80 text-[11px] font-mono font-semibold text-amber-900">
              Capacidade Agendada: 0 veículos · Docas em pausa
            </div>
          </div>
        </div>

        {/* SHIFT 2: TURNO TARDE (12:00 - 16:00) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3.5 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                T
              </div>
              <div>
                <h3 className="font-bold text-sm text-indigo-950">Turno Tarde (12:00 às 16:00)</h3>
                <p className="text-[11px] text-indigo-800">
                  {afternoonTrucks.length} caminhões programados · Encerramento das operações do CD às 16:00
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded border border-indigo-200">
              Janela 12:00–16:00
            </span>
          </div>

          <div className="p-5">
            {afternoonTrucks.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Nenhum caminhão agendado para o turno da tarde com os filtros atuais.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {afternoonTrucks.map(renderTruckCard)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
