import React from 'react';
import {
  Truck,
  Warehouse,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ListOrdered,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const DashboardView: React.FC = () => {
  const {
    metrics,
    appointments,
    yardSpots,
    docks,
    waitingQueue,
    setActiveTab,
    setIsAppointmentModalOpen,
    setIsCheckinModalOpen,
    loadOptimizationPreview,
    setSelectedAppointmentForHistory,
  } = useLogistics();

  const activeInYardTrucks = appointments.filter(
    (a) => a.status === 'NO_PATIO' || a.status === 'AGUARDANDO_DOCA' || a.status === 'EM_DESCARREGAMENTO'
  );

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner Alert when Yard Capacity is near or at limit */}
      {metrics.capacityAlert ? (
        <div className="p-4 rounded-xl bg-rose-600 text-white shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-700">
              <AlertTriangle className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">ALERTA CRÍTICO DE CAPACIDADE DE PÁTIO</h3>
              <p className="text-xs text-rose-100 mt-0.5">
                O Centro de Distribuição atingiu a capacidade máxima ({metrics.yardOccupied}/{metrics.yardCapacity} veículos). Novos acessos na portaria devem aguardar desocupação de vaga.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('yard')}
            className="px-3.5 py-1.5 rounded-lg bg-white text-rose-700 font-semibold text-xs hover:bg-rose-50 transition-colors shrink-0 ml-4"
          >
            Gerenciar Pátio
          </button>
        </div>
      ) : metrics.yardOccupied >= 7 ? (
        <div className="p-3.5 rounded-xl bg-amber-500 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-100" />
            <div>
              <h3 className="font-bold text-xs tracking-tight">Atenção: Pátio em Atenção ({metrics.yardOccupied}/{metrics.yardCapacity})</h3>
              <p className="text-[11px] text-amber-100">
                Apenas {metrics.yardAvailable} vaga livre restante. Priorize a alocação de docas para evitar retenção.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('yard')}
            className="px-3 py-1 rounded bg-white text-amber-800 text-xs font-semibold hover:bg-amber-50"
          >
            Ver Vagas
          </button>
        </div>
      ) : null}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Trucks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Caminhões</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{metrics.totalTrucks}</span>
            <span className="text-xs text-slate-400">/ 32 meta</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Total programado hoje</span>
        </div>

        {/* Yard Occupancy */}
        <div
          className={`p-4 rounded-xl border shadow-2xs ${
            metrics.yardOccupied >= metrics.yardCapacity
              ? 'bg-rose-50 border-rose-300'
              : metrics.yardOccupied >= 7
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">No Pátio</span>
            <Warehouse
              className={`w-4 h-4 ${
                metrics.yardOccupied >= 7 ? 'text-rose-600' : 'text-blue-600'
              }`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-bold font-mono ${
                metrics.yardOccupied >= 7 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {metrics.yardOccupied}
            </span>
            <span className="text-xs text-slate-500">/ {metrics.yardCapacity} máx</span>
          </div>
          <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                metrics.yardOccupied >= 8
                  ? 'bg-rose-600'
                  : metrics.yardOccupied >= 7
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, (metrics.yardOccupied / metrics.yardCapacity) * 100)}%` }}
            />
          </div>
        </div>

        {/* Docks Occupied */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Docas Ativas</span>
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{metrics.docksOccupied}</span>
            <span className="text-xs text-slate-400">/ {metrics.totalDocks} total</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            {metrics.docksAvailable} docas livres
          </span>
        </div>

        {/* Awaiting Dock / Queue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aguardando Doca</span>
            <ListOrdered className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-700">{metrics.awaitingDock}</span>
            <span className="text-xs text-slate-400">em fila</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Fila dinâmica do pátio</span>
        </div>

        {/* Finished */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finalizados</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">{metrics.finished}</span>
            <span className="text-xs text-slate-400">concluídos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Saída do CD efetuada</span>
        </div>

        {/* Next Available Slot */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Próxima Vaga</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-blue-700">
              {metrics.nextAvailableSlot}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Janela operacional livre</span>
        </div>
      </div>

      {/* Average Times & Shift Breakdown Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tempo Médio de Espera</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {metrics.avgWaitMinutes} minutos
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Tempo Médio de Descarga</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {metrics.avgUnloadMinutes} minutos
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Permanência Média Total</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {metrics.avgStayMinutes} minutos
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Pontualidade & Desvios</span>
            <span className="text-xs font-semibold text-slate-800">
              {metrics.delayed} atrasos · {metrics.earlyArrivals} antecipados
            </span>
          </div>
        </div>
      </div>

      {/* Operational Timeline & Visual Flow */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Grade Operacional do Dia (32 Caminhões)
            </h3>
            <p className="text-xs text-slate-500">
              Distribuição planejada respeitando capacidade do pátio e o intervalo obrigatório
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadOptimizationPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otimizar Grade</span>
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <span>Ver Agenda Completa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Shift Bar */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-2 text-center text-xs">
            {/* Morning Shift: 07:00 to 11:00 (5 cols) */}
            <div className="col-span-5 bg-blue-50/80 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-blue-900">
                <span>Turno Matutino</span>
                <span className="font-mono">07:00 – 11:00</span>
              </div>
              <div className="text-left text-xs text-slate-600">
                <span className="font-bold text-blue-700 font-mono text-sm">
                  {metrics.morningCount}
                </span>{' '}
                caminhões agendados · Docas ativas
              </div>
            </div>

            {/* Lunch Interval: 11:00 to 12:00 (2 cols) -> STRICTLY BLOCKED */}
            <div className="col-span-2 bg-stripes-amber border-2 border-amber-300 rounded-lg p-2.5 flex flex-col items-center justify-center text-amber-900 shadow-inner">
              <Clock className="w-4 h-4 text-amber-700 mb-0.5" />
              <span className="font-bold text-[11px] uppercase tracking-wider">Intervalo CD</span>
              <span className="text-[10px] font-mono font-bold text-amber-800">11:00 – 12:00</span>
              <span className="text-[9px] text-amber-800/90 font-medium">Bloqueio Total</span>
            </div>

            {/* Afternoon Shift: 12:00 to 16:00 (5 cols) */}
            <div className="col-span-5 bg-indigo-50/80 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs mb-1 font-semibold text-indigo-900">
                <span>Turno Vespertino</span>
                <span className="font-mono">12:00 – 16:00</span>
              </div>
              <div className="text-left text-xs text-slate-600">
                <span className="font-bold text-indigo-700 font-mono text-sm">
                  {metrics.afternoonCount}
                </span>{' '}
                caminhões agendados · Fluxo contínuo
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Yard Preview + Active Docks & Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yard Radar (8 Spots) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Status do Pátio (8 Vagas)</h3>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    metrics.yardOccupied >= 8
                      ? 'bg-rose-100 text-rose-800'
                      : metrics.yardOccupied >= 7
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {metrics.yardOccupied} / {metrics.yardCapacity} Ocupadas
                </span>
              </div>
              <p className="text-xs text-slate-500">Capacidade física máxima: 8 veículos simultâneos</p>
            </div>
            <button
              onClick={() => setActiveTab('yard')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <span>Ver mapa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {yardSpots.map((spot) => (
              <div
                key={spot.id}
                onClick={() => setActiveTab('yard')}
                className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                  spot.isOccupied
                    ? 'bg-slate-900 border-slate-800 text-white shadow-xs'
                    : 'bg-slate-50 border-dashed border-slate-300 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-blue-400">{spot.spotNumber}</span>
                  <span
                    className={`text-[9px] font-semibold px-1 rounded ${
                      spot.isOccupied ? 'bg-blue-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    {spot.isOccupied ? 'OCUPADO' : 'LIVRE'}
                  </span>
                </div>
                {spot.isOccupied ? (
                  <div className="space-y-0.5">
                    <p className="font-mono font-bold text-xs truncate text-amber-300">
                      {spot.plate}
                    </p>
                    <p className="text-[10px] text-slate-300 truncate">{spot.driver}</p>
                    <p className="text-[9px] text-slate-400 font-mono">Entrada: {spot.entryTime}</p>
                  </div>
                ) : (
                  <div className="py-2 text-center text-slate-400 text-[11px]">Vaga Livre</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 14 Docks Overview & Waiting Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                  Docas de Descarregamento (14)
                </h3>
                <p className="text-xs text-slate-500">
                  {metrics.docksOccupied} em operação · {metrics.docksAvailable} disponíveis
                </p>
              </div>
              <button
                onClick={() => setActiveTab('docks')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <span>Ver todas as 14 docas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Docks mini grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-4">
              {docks.map((dock) => {
                const isBusy = dock.status === 'EM_DESCARREGAMENTO';
                const isWaiting = dock.status === 'AGUARDANDO_VEICULO';
                return (
                  <div
                    key={dock.id}
                    title={`Doca ${dock.dockNumber} - ${dock.status} ${
                      dock.plate ? `(${dock.plate})` : ''
                    }`}
                    onClick={() => setActiveTab('docks')}
                    className={`py-2 px-1 text-center rounded border text-xs cursor-pointer transition-colors ${
                      isBusy
                        ? 'bg-blue-600 border-blue-700 text-white font-bold'
                        : isWaiting
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium hover:bg-emerald-100'
                    }`}
                  >
                    <span className="font-mono text-[11px] block">{dock.dockNumber}</span>
                    <span className="text-[9px] block opacity-80 truncate">
                      {isBusy ? dock.plate?.slice(0, 4) : isWaiting ? 'Espera' : 'Livre'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Waiting Queue Mini List */}
            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fila de Espera por Doca ({waitingQueue.length})</span>
                </span>
                <button
                  onClick={() => setActiveTab('queue')}
                  className="text-[11px] text-blue-600 hover:underline"
                >
                  Gerenciar Fila
                </button>
              </div>

              {waitingQueue.length === 0 ? (
                <p className="text-xs text-slate-400 py-1">Nenhum veículo aguardando doca no momento.</p>
              ) : (
                <div className="space-y-1.5">
                  {waitingQueue.slice(0, 3).map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700">#{idx + 1}</span>
                        <span className="font-mono font-semibold text-slate-900">{item.plate}</span>
                        <span className="text-slate-500 truncate max-w-[120px]">{item.carrier}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            item.priority === 'URGENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.priority}
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          Chegada: {item.arrivalTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Operational Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Movimentações em Andamento no CD
            </h3>
            <p className="text-xs text-slate-500">
              Veículos atualmente no pátio ou em processo de descarregamento
            </p>
          </div>
          <button
            onClick={() => setIsCheckinModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
          >
            Registrar Novo Check-in
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Cód / Placa</th>
                <th className="py-2.5 px-4">Motorista & Transportadora</th>
                <th className="py-2.5 px-4">Carga</th>
                <th className="py-2.5 px-4 text-center">Horário Agendado</th>
                <th className="py-2.5 px-4 text-center">Entrada Real</th>
                <th className="py-2.5 px-4 text-center">Status / Local</th>
                <th className="py-2.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {activeInYardTrucks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    Nenhum veículo ativo no pátio neste momento.
                  </td>
                </tr>
              ) : (
                activeInYardTrucks.map((truck) => (
                  <tr key={truck.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {truck.plate}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{truck.code}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{truck.driverName}</div>
                      <div className="text-[11px] text-slate-500">{truck.carrierName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{truck.cargoType}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {truck.scheduledTime}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-blue-700">
                      {truck.realArrivalTime || '--:--'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-semibold px-2 py-1 rounded inline-block ${
                          truck.status === 'EM_DESCARREGAMENTO'
                            ? 'bg-blue-100 text-blue-800'
                            : truck.status === 'AGUARDANDO_DOCA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {truck.status === 'EM_DESCARREGAMENTO'
                          ? `Doca ${truck.dockId?.toString().padStart(2, '0')}`
                          : truck.status === 'AGUARDANDO_DOCA'
                          ? 'Aguardando Doca'
                          : `Vaga P0${truck.yardSpotId || 1}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedAppointmentForHistory(truck)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Histórico
                      </button>
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
