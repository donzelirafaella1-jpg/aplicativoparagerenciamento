import React, { useState, useEffect } from 'react';
import { X, Truck, Clock, CheckCircle2, AlertTriangle, AlertCircle, Warehouse } from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { calculateCheckinDelta } from '../../lib/logistics-engine';

export const CheckinModal: React.FC = () => {
  const {
    isCheckinModalOpen,
    setIsCheckinModalOpen,
    selectedAppointmentForCheckin,
    appointments,
    performCheckin,
    yardSpots,
  } = useLogistics();

  const [selectedAppId, setSelectedAppId] = useState('');
  const [realTime, setRealTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Eligible scheduled trucks
  const pendingTrucks = appointments.filter(
    (a) => a.status === 'AGENDADO' || a.status === 'ATRASADO'
  );

  useEffect(() => {
    if (selectedAppointmentForCheckin) {
      setSelectedAppId(selectedAppointmentForCheckin.id);
    } else if (pendingTrucks.length > 0) {
      setSelectedAppId(pendingTrucks[0].id);
    }

    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    setRealTime(`${hh}:${mm}`);
  }, [selectedAppointmentForCheckin, isCheckinModalOpen]);

  if (!isCheckinModalOpen) return null;

  const currentSelectedTruck = appointments.find((a) => a.id === selectedAppId);

  // Calculate delta live
  let deltaInfo = null;
  if (currentSelectedTruck && realTime) {
    deltaInfo = calculateCheckinDelta(currentSelectedTruck.scheduledTime, realTime);
  }

  // Available yard spots
  const freeYardSpots = yardSpots.filter((s) => !s.isOccupied && s.status !== 'MANUTENCAO');
  const yardIsFull = freeYardSpots.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !realTime) return;

    if (yardIsFull) {
      alert('Atenção: O pátio atingiu a capacidade máxima de 8 veículos. Aguarde liberação para registrar a entrada.');
      return;
    }

    setSubmitting(true);
    const res = await performCheckin(selectedAppId, realTime, notes);
    setSubmitting(false);

    if (res.success) {
      setIsCheckinModalOpen(false);
    } else {
      alert(res.error || 'Erro ao realizar check-in');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Check-in de Portaria</h3>
              <p className="text-xs text-slate-500">Registro de chegada física e direcionamento para vaga</p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckinModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Yard full warning */}
          {yardIsFull && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2.5 text-xs text-rose-900 font-medium">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>
                Pátio completamente lotado (8/8 veículos). Entrada temporariamente retida na portaria.
              </span>
            </div>
          )}

          {/* Select vehicle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Selecionar Caminhão Agendado *
            </label>
            <select
              required
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {pendingTrucks.length === 0 ? (
                <option value="">Nenhum caminhão aguardando chegada hoje</option>
              ) : (
                pendingTrucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.scheduledTime} · [{t.plate}] {t.carrierName} ({t.driverName})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Truck snapshot card */}
          {currentSelectedTruck && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {currentSelectedTruck.plate}
                </span>
                <span className="font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  Agendado: {currentSelectedTruck.scheduledTime}
                </span>
              </div>
              <div className="text-slate-600 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Motorista</span>
                  <span className="font-medium text-slate-800">{currentSelectedTruck.driverName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transportadora</span>
                  <span className="font-medium text-slate-800">{currentSelectedTruck.carrierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Carga</span>
                  <span className="font-medium text-slate-800">{currentSelectedTruck.cargoType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Doca Destino</span>
                  <span className="font-medium text-slate-800">
                    {currentSelectedTruck.dockId
                      ? `Doca ${currentSelectedTruck.dockId.toString().padStart(2, '0')}`
                      : 'Fila de Espera'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Real arrival time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Horário Real da Chegada na Portaria *
            </label>
            <input
              type="time"
              required
              value={realTime}
              onChange={(e) => setRealTime(e.target.value)}
              className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Delta calculation badge / banner */}
          {deltaInfo && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 font-medium ${
                deltaInfo.badgeType === 'late'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : deltaInfo.badgeType === 'early'
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              {deltaInfo.badgeType === 'late' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : deltaInfo.badgeType === 'early' ? (
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{deltaInfo.message}</span>
            </div>
          )}

          {/* Yard spot assignment info */}
          <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-slate-600" />
              <span className="text-slate-700 font-medium">Vaga no Pátio:</span>
            </div>
            {freeYardSpots.length > 0 ? (
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Vaga {freeYardSpots[0].spotNumber} (Próxima livre)
              </span>
            ) : (
              <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                Sem vagas disponíveis
              </span>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações da Portaria
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Número de lacre, condições do veículo ou observações do conferente..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCheckinModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || yardIsFull || !currentSelectedTruck}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white transition-colors shadow-xs"
            >
              {submitting ? 'Registrando...' : 'Confirmar Check-in & Liberar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
