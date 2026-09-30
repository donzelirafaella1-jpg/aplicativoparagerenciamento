import React, { useState } from 'react';
import {
  Warehouse,
  Truck,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  ArrowUpRight,
  CheckCircle2,
  ListOrdered,
  PlusCircle,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const YardView: React.FC = () => {
  const {
    yardSpots,
    metrics,
    moveYardSpot,
    allocateDock,
    docks,
    setIsCheckinModalOpen,
    setSelectedAppointmentForHistory,
    appointments,
    currentUser,
  } = useLogistics();

  const [selectedSpotForMove, setSelectedSpotForMove] = useState<number | null>(null);
  const [selectedTargetSpot, setSelectedTargetSpot] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);

  const isReadOnly = currentUser.role === 'LEITURA';

  const handleMoveSpot = async () => {
    if (!selectedSpotForMove || !selectedTargetSpot) return;
    setMoving(true);
    await moveYardSpot(selectedSpotForMove, selectedTargetSpot);
    setMoving(false);
    setSelectedSpotForMove(null);
    setSelectedTargetSpot(null);
  };

  const handleSendToDock = async (spotId: number, appointmentId?: string) => {
    if (!appointmentId) return;
    // Find available dock
    const freeDock = docks.find((d) => d.status === 'DISPONIVEL');
    if (!freeDock) {
      alert('Todas as 14 docas estão ocupadas no momento. O veículo permanece no pátio aguardando liberação.');
      return;
    }

    if (confirm(`Deseja direcionar o veículo para a Doca ${freeDock.dockNumber}?`)) {
      await allocateDock(freeDock.id, appointmentId);
    }
  };

  const freeSpots = yardSpots.filter((s) => !s.isOccupied);

  return (
    <div className="p-6 space-y-6">
      {/* 8/8 Capacity Emergency Banner */}
      {metrics.yardOccupied >= metrics.yardCapacity && (
        <div className="p-4 rounded-xl bg-rose-600 text-white shadow-xl flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">CAPACIDADE DO PÁTIO ATINGIDA: 8 / 8 VEÍCULOS</h3>
              <p className="text-xs text-rose-100">
                O limite operacional máximo de permanência simultânea foi alcançado. Bloqueio automático de novas entradas ativo na portaria.
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs bg-white text-rose-700 px-3 py-1.5 rounded-lg shrink-0">
            0 VAGAS DISPONÍVEIS
          </span>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Pátio Status */}
        <div
          className={`p-4 rounded-xl border shadow-2xs ${
            metrics.yardOccupied >= 8
              ? 'bg-rose-50 border-rose-300'
              : metrics.yardOccupied >= 7
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200'
          }`}
        >
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Ocupação do Pátio
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold font-mono ${
                metrics.yardOccupied >= 8 ? 'text-rose-700' : 'text-slate-900'
              }`}
            >
              {metrics.yardOccupied} / {metrics.yardCapacity}
            </span>
            <span className="text-xs text-slate-500">veículos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.yardAvailable} vaga(s) livre(s) restante(s)
          </span>
        </div>

        {/* Vagas Disponíveis */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Vagas Livres
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-700">
              {metrics.yardAvailable}
            </span>
            <span className="text-xs text-slate-500">de 8 posições</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            Prontas para acolhimento
          </span>
        </div>

        {/* Tempo Médio de Permanência */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Permanência Média
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-700">{metrics.avgStayMinutes}</span>
            <span className="text-xs text-slate-500">minutos</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Desde a entrada até a saída</span>
        </div>

        {/* Veículos Aguardando Doca */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Aguardando Doca
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-700">
              {metrics.awaitingDock}
            </span>
            <span className="text-xs text-slate-500">no pátio</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Aguardando doca liberar</span>
        </div>
      </div>

      {/* Spot Move Toolbar when active */}
      {selectedSpotForMove && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>
              Manobra de Pátio: Selecionada Vaga{' '}
              <strong>P0{selectedSpotForMove}</strong>. Escolha a vaga de destino:
            </span>
            <select
              value={selectedTargetSpot || ''}
              onChange={(e) => setSelectedTargetSpot(Number(e.target.value))}
              className="ml-2 text-xs p-1.5 rounded border border-blue-300 bg-white font-mono font-bold"
            >
              <option value="">Selecionar vaga livre...</option>
              {freeSpots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.spotNumber} (Livre)
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedSpotForMove(null);
                setSelectedTargetSpot(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleMoveSpot}
              disabled={!selectedTargetSpot || moving}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold"
            >
              {moving ? 'Manobrando...' : 'Confirmar Manobra'}
            </button>
          </div>
        </div>
      )}

      {/* Visual Layout of the 8 Yard Positions */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              Mapa Operacional do Pátio (Vagas P01 a P08)
            </h3>
            <p className="text-xs text-slate-500">
              Controle físico individualizado com tempo de permanência e doca de destino
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setIsCheckinModalOpen(true)}
              disabled={metrics.yardOccupied >= metrics.yardCapacity}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Receber Veículo no Pátio</span>
            </button>
          )}
        </div>

        {/* 8 Spots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {yardSpots.map((spot) => {
            const app = appointments.find((a) => a.id === spot.currentAppointmentId);

            return (
              <div
                key={spot.id}
                className={`p-4 rounded-xl border transition-all relative ${
                  spot.isOccupied
                    ? 'bg-slate-900 border-slate-800 text-white shadow-md'
                    : 'bg-slate-50/70 border-dashed border-slate-300 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {/* Header: Spot Name & Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-blue-400">
                      {spot.spotNumber}
                    </span>
                    <span className="text-[10px] text-slate-400">Baia {spot.id}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      spot.isOccupied
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {spot.isOccupied ? 'OCUPADO' : 'DISPONÍVEL'}
                  </span>
                </div>

                {spot.isOccupied ? (
                  <div className="space-y-2">
                    {/* Plate & Carrier */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-base text-amber-300 tracking-wide">
                          {spot.plate}
                        </span>
                        {spot.dockTarget && (
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/80">
                            Doca {spot.dockTarget.toString().padStart(2, '0')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        {spot.driver}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{spot.carrier}</p>
                    </div>

                    {/* Cargo & Times */}
                    <div className="pt-2 border-t border-slate-800 text-[11px] space-y-1 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Carga:</span>
                        <span className="truncate max-w-[120px] font-medium">{spot.cargoType}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Entrada CD:</span>
                        <span className="text-white font-semibold">{spot.entryTime}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">Tempo no Pátio:</span>
                        <span className="text-amber-400 font-semibold">{spot.stayMinutes || 15} min</span>
                      </div>
                    </div>

                    {/* Action buttons inside card */}
                    {!isReadOnly && (
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                        <button
                          onClick={() => setSelectedSpotForMove(spot.id)}
                          className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 transition-colors text-center"
                        >
                          Manobrar
                        </button>
                        <button
                          onClick={() => handleSendToDock(spot.id, spot.currentAppointmentId)}
                          className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-[11px] font-semibold text-white transition-colors text-center"
                        >
                          Enviar Doca
                        </button>
                        {app && (
                          <button
                            onClick={() => setSelectedAppointmentForHistory(app)}
                            title="Consultar Histórico"
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <Warehouse className="w-8 h-8 text-slate-300 mb-1" />
                    <span className="text-xs font-semibold text-slate-600">Vaga Livre</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Pronta para check-in</span>
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
