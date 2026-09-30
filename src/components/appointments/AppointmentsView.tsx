import React, { useState } from 'react';
import {
  Truck,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  History,
  CheckCircle2,
  Clock,
  Sparkles,
  Warehouse,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { Appointment } from '../../types/logistics';
import { timeToMinutes } from '../../lib/logistics-engine';

export const AppointmentsView: React.FC = () => {
  const {
    appointments,
    selectedDate,
    setIsAppointmentModalOpen,
    setSelectedAppointmentForEdit,
    setIsCheckinModalOpen,
    setSelectedAppointmentForCheckin,
    setSelectedAppointmentForHistory,
    cancelAppointment,
    currentUser,
  } = useLogistics();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterShift, setFilterShift] = useState('all'); // all, morning, afternoon

  const isReadOnly = currentUser.role === 'LEITURA';

  // Filter list
  const filtered = appointments
    .filter((a) => a.date === selectedDate)
    .filter((a) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        a.plate.toLowerCase().includes(term) ||
        a.code.toLowerCase().includes(term) ||
        a.driverName.toLowerCase().includes(term) ||
        a.carrierName.toLowerCase().includes(term) ||
        a.cargoType.toLowerCase().includes(term)
      );
    })
    .filter((a) => (filterPriority === 'all' ? true : a.priority === filterPriority))
    .filter((a) => (filterStatus === 'all' ? true : a.status === filterStatus))
    .filter((a) => {
      if (filterShift === 'all') return true;
      const mins = timeToMinutes(a.scheduledTime);
      if (filterShift === 'morning') return mins < 660; // < 11:00
      if (filterShift === 'afternoon') return mins >= 720; // >= 12:00
      return true;
    })
    .sort((a, b) => timeToMinutes(a.scheduledTime) - timeToMinutes(b.scheduledTime));

  const handleEdit = (app: Appointment) => {
    setSelectedAppointmentForEdit(app);
    setIsAppointmentModalOpen(true);
  };

  const handleCheckin = (app: Appointment) => {
    setSelectedAppointmentForCheckin(app);
    setIsCheckinModalOpen(true);
  };

  const handleCancel = async (app: Appointment) => {
    if (confirm(`Confirma o cancelamento do agendamento para o veículo ${app.plate}?`)) {
      await cancelAppointment(app.id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por placa, motorista, transportadora ou carga..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters and New Appointment button */}
        <div className="flex items-center flex-wrap gap-2.5">
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Todos os Turnos</option>
            <option value="morning">Manhã (07:00–11:00)</option>
            <option value="afternoon">Tarde (12:00–16:00)</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="URGENTE">Urgente</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Todos os Status</option>
            <option value="AGENDADO">Agendado</option>
            <option value="NO_PATIO">No Pátio</option>
            <option value="AGUARDANDO_DOCA">Aguardando Doca</option>
            <option value="EM_DESCARREGAMENTO">Em Descarregamento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          {!isReadOnly && (
            <button
              onClick={() => {
                setSelectedAppointmentForEdit(null);
                setIsAppointmentModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm">Lista Geral de Agendamentos</span>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {filtered.length} veículos exibidos
            </span>
          </div>
          <span className="text-xs text-slate-500">Data de referência: {selectedDate}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Cód</th>
                <th className="py-2.5 px-3">Placa</th>
                <th className="py-2.5 px-3">Motorista</th>
                <th className="py-2.5 px-3">Transportadora</th>
                <th className="py-2.5 px-3">Carga</th>
                <th className="py-2.5 px-3 text-center">Prioridade</th>
                <th className="py-2.5 px-3 text-center">Horário Agendado</th>
                <th className="py-2.5 px-3 text-center">Permanência Est.</th>
                <th className="py-2.5 px-3 text-center">Doca</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Nenhum agendamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      app.status === 'CANCELADO' ? 'opacity-50 bg-slate-50/80' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-medium text-slate-500">{app.code}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                      {app.plate}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-800">{app.driverName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{app.driverPhone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-[150px] truncate" title={app.carrierName}>
                      {app.carrierName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-[140px] truncate" title={app.cargoType}>
                      {app.cargoType}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          app.priority === 'URGENTE'
                            ? 'bg-rose-100 text-rose-800'
                            : app.priority === 'ALTA'
                            ? 'bg-amber-100 text-amber-800'
                            : app.priority === 'MEDIA'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {app.priority}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                      {app.scheduledTime}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {app.estStayMinutes} min
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                      {app.dockId ? `Doca ${app.dockId.toString().padStart(2, '0')}` : 'Automático'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          app.status === 'AGENDADO'
                            ? 'bg-slate-100 text-slate-700'
                            : app.status === 'NO_PATIO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'AGUARDANDO_DOCA'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'EM_DESCARREGAMENTO'
                            ? 'bg-blue-100 text-blue-800 font-bold'
                            : app.status === 'FINALIZADO'
                            ? 'bg-purple-100 text-purple-800'
                            : app.status === 'ATRASADO'
                            ? 'bg-rose-100 text-rose-800 font-bold'
                            : 'bg-slate-200 text-slate-500 line-through'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedAppointmentForHistory(app)}
                          title="Ver Histórico de Eventos"
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {!isReadOnly && app.status !== 'FINALIZADO' && app.status !== 'CANCELADO' && (
                          <>
                            {app.status === 'AGENDADO' && (
                              <button
                                onClick={() => handleCheckin(app)}
                                title="Check-in na Portaria"
                                className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[10px]"
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
