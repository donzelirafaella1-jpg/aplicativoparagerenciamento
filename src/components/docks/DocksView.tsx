import React, { useState } from 'react';
import {
  Truck,
  Warehouse,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  ArrowRight,
  Filter,
  Users,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { DockStatus } from '../../types/logistics';

export const DocksView: React.FC = () => {
  const {
    docks,
    metrics,
    appointments,
    waitingQueue,
    allocateDock,
    finishUnload,
    currentUser,
    setSelectedAppointmentForHistory,
  } = useLogistics();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDockForManualAlloc, setSelectedDockForManualAlloc] = useState<number | null>(null);
  const [selectedTruckIdForAlloc, setSelectedTruckIdForAlloc] = useState<string>('');

  const isReadOnly = currentUser.role === 'LEITURA';

  // Trucks currently in yard or in queue eligible for dock allocation
  const eligibleTrucks = appointments.filter(
    (a) =>
      (a.status === 'NO_PATIO' || a.status === 'AGUARDANDO_DOCA') &&
      (!a.dockId || a.status === 'AGUARDANDO_DOCA')
  );

  const handleManualAllocate = async () => {
    if (!selectedDockForManualAlloc || !selectedTruckIdForAlloc) return;
    await allocateDock(selectedDockForManualAlloc, selectedTruckIdForAlloc);
    setSelectedDockForManualAlloc(null);
    setSelectedTruckIdForAlloc('');
  };

  const handleFinishUnload = async (dockId: number) => {
    if (confirm(`Confirma a conclusão do descarregamento e liberação da Doca ${dockId.toString().padStart(2, '0')}?`)) {
      await finishUnload(dockId);
    }
  };

  const filteredDocks = docks.filter((d) => (filterStatus === 'all' ? true : d.status === filterStatus));

  return (
    <div className="p-6 space-y-6">
      {/* Top Docks Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Docas em Operação
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-700">{metrics.docksOccupied}</span>
            <span className="text-xs text-slate-500">de 14 docas</span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium mt-1 block">
            Taxa de ocupação: {metrics.docksOccupancyRate}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Docas Disponíveis
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-700">
              {metrics.docksAvailable}
            </span>
            <span className="text-xs text-slate-500">livres</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Prontas para acolher descarregamento
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tempo Médio de Descarga
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-purple-700">
              {metrics.avgUnloadMinutes}
            </span>
            <span className="text-xs text-slate-500">minutos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Meta padrão: 45 min</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Fila de Espera por Doca
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-700">
              {waitingQueue.length}
            </span>
            <span className="text-xs text-slate-500">veículos</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            Prioridade automática em vigor
          </span>
        </div>
      </div>

      {/* Manual Allocation Drawer / Modal */}
      {selectedDockForManualAlloc && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <Warehouse className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Alocação na <strong>Doca {selectedDockForManualAlloc.toString().padStart(2, '0')}</strong>:{' '}
              Selecione o caminhão do pátio ou da fila:
            </span>
            <select
              value={selectedTruckIdForAlloc}
              onChange={(e) => setSelectedTruckIdForAlloc(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-blue-300 bg-white font-mono font-bold ml-2"
            >
              <option value="">Escolher caminhão disponível...</option>
              {eligibleTrucks.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.plate}] {t.carrierName} ({t.priority}) - Chegou {t.realArrivalTime || t.scheduledTime}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setSelectedDockForManualAlloc(null);
                setSelectedTruckIdForAlloc('');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleManualAllocate}
              disabled={!selectedTruckIdForAlloc}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              Confirmar Alocação
            </button>
          </div>
        </div>
      )}

      {/* Docks Control Board */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Quadro de Monitoramento das 14 Docas
            </h3>
            <p className="text-xs text-slate-500">
              Operação em tempo real: status, tempo transcorrido, tempo restante e liberação
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700"
            >
              <option value="all">Todas as Docas (14)</option>
              <option value="DISPONIVEL">Disponíveis</option>
              <option value="EM_DESCARREGAMENTO">Em Descarregamento</option>
              <option value="AGUARDANDO_VEICULO">Aguardando Veículo</option>
              <option value="FINALIZADA">Finalizadas</option>
            </select>
          </div>
        </div>

        {/* 14 Docks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocks.map((dock) => {
            const isBusy = dock.status === 'EM_DESCARREGAMENTO';
            const isWaiting = dock.status === 'AGUARDANDO_VEICULO';
            const isDone = dock.status === 'FINALIZADA';
            const isAvailable = dock.status === 'DISPONIVEL';

            const app = appointments.find((a) => a.id === dock.currentAppointmentId);

            return (
              <div
                key={dock.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  isBusy
                    ? 'bg-blue-50/40 border-blue-300 shadow-xs'
                    : isWaiting
                    ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                    : isDone
                    ? 'bg-purple-50/40 border-purple-200'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Header: Dock number and Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                        DOCA {dock.dockNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isBusy
                          ? 'bg-blue-600 text-white'
                          : isWaiting
                          ? 'bg-amber-100 text-amber-900'
                          : isDone
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isBusy
                        ? 'DESCARREGANDO'
                        : isWaiting
                        ? 'AGUARDANDO VEÍCULO'
                        : isDone
                        ? 'FINALIZADA'
                        : 'DISPONÍVEL'}
                    </span>
                  </div>

                  {/* Vehicle Details if occupied */}
                  {dock.plate ? (
                    <div className="space-y-1.5 text-xs text-slate-700 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-blue-900">
                          {dock.plate}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Entrada: {dock.entryTime || '--:--'}
                        </span>
                      </div>
                      <div className="font-medium text-slate-800 truncate">{dock.driver}</div>
                      <div className="text-[11px] text-slate-500 truncate">{dock.carrier}</div>
                      <div className="text-[11px] text-slate-600 truncate">{dock.cargoType}</div>

                      {/* Progress bar for unloading */}
                      {isBusy && (
                        <div className="pt-2">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-slate-500">Transcorrido: {dock.elapsedMinutes || 25}m</span>
                            <span className="font-semibold text-blue-700">Restante: {dock.remainingMinutes || 20}m</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (((dock.elapsedMinutes || 25) / (dock.estUnloadMinutes || 45)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <Warehouse className="w-7 h-7 mx-auto text-slate-300 mb-1" />
                      <span>Doca totalmente livre</span>
                    </div>
                  )}
                </div>

                {/* Actions bottom */}
                {!isReadOnly && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    {isAvailable && (
                      <button
                        onClick={() => setSelectedDockForManualAlloc(dock.id)}
                        className="w-full py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold transition-colors"
                      >
                        + Alocar Veículo Manual
                      </button>
                    )}

                    {isBusy && (
                      <button
                        onClick={() => handleFinishUnload(dock.id)}
                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        Concluir & Liberar Doca
                      </button>
                    )}

                    {isWaiting && (
                      <button
                        onClick={() => setSelectedDockForManualAlloc(dock.id)}
                        className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-2xs"
                      >
                        Confirmar Entrada na Doca
                      </button>
                    )}

                    {isDone && (
                      <button
                        onClick={() => handleFinishUnload(dock.id)}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
                      >
                        Liberar Doca
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
