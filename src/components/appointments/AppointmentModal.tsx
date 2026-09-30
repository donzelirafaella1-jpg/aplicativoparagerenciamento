import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  AlertTriangle,
  Clock,
  Warehouse,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { Appointment, Priority } from '../../types/logistics';
import { validateOperationalTimeWindow, validateYardCapacity } from '../../lib/logistics-engine';
import { logisticsService } from '../../services/logistics-service';

export const AppointmentModal: React.FC = () => {
  const {
    isAppointmentModalOpen,
    setIsAppointmentModalOpen,
    selectedAppointmentForEdit,
    createAppointment,
    updateAppointment,
    appointments,
    carriers,
    drivers,
    config,
    currentUser,
    selectedDate,
  } = useLogistics();

  const isEditing = Boolean(selectedAppointmentForEdit);

  // Form states
  const [plate, setPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [carrierId, setCarrierId] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [cargoType, setCargoType] = useState('Alimentos Refrigerados');
  const [priority, setPriority] = useState<Priority>('MEDIA');
  const [date, setDate] = useState(selectedDate);
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [estUnloadMinutes, setEstUnloadMinutes] = useState(45);
  const [estStayMinutes, setEstStayMinutes] = useState(60);
  const [dockId, setDockId] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');

  // Live validation state
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [windowError, setWindowError] = useState<string | null>(null);
  const [suggestedSlots, setSuggestedSlots] = useState<string[]>([]);
  const [allowOverride, setAllowOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset or fill form when opening
  useEffect(() => {
    if (selectedAppointmentForEdit) {
      setPlate(selectedAppointmentForEdit.plate);
      setDriverName(selectedAppointmentForEdit.driverName);
      setDriverPhone(selectedAppointmentForEdit.driverPhone);
      setCarrierId(selectedAppointmentForEdit.carrierId);
      setCarrierName(selectedAppointmentForEdit.carrierName);
      setCargoType(selectedAppointmentForEdit.cargoType);
      setPriority(selectedAppointmentForEdit.priority);
      setDate(selectedAppointmentForEdit.date);
      setScheduledTime(selectedAppointmentForEdit.scheduledTime);
      setEstUnloadMinutes(selectedAppointmentForEdit.estUnloadMinutes);
      setEstStayMinutes(selectedAppointmentForEdit.estStayMinutes);
      setDockId(selectedAppointmentForEdit.dockId);
      setNotes(selectedAppointmentForEdit.notes || '');
      setAllowOverride(Boolean(selectedAppointmentForEdit.overrideReason));
      setOverrideReason(selectedAppointmentForEdit.overrideReason || '');
    } else {
      setPlate('');
      setDriverName('');
      setDriverPhone('(11) 98765-4321');
      const defaultCarrier = carriers[0] || { id: 'c-01', name: 'Move Log Frota Própria' };
      setCarrierId(defaultCarrier.id);
      setCarrierName(defaultCarrier.name);
      setCargoType('Alimentos Refrigerados');
      setPriority('MEDIA');
      setDate(selectedDate);
      setScheduledTime('09:30');
      setEstUnloadMinutes(45);
      setEstStayMinutes(60);
      setDockId(undefined);
      setNotes('');
      setAllowOverride(false);
      setOverrideReason('');
    }
  }, [selectedAppointmentForEdit, isAppointmentModalOpen, carriers, selectedDate]);

  // Live validation trigger
  useEffect(() => {
    if (!isAppointmentModalOpen || !scheduledTime) return;

    // 1. Operational window & lunch break validation
    const winCheck = validateOperationalTimeWindow(scheduledTime, Number(estStayMinutes), config);
    if (!winCheck.valid) {
      setWindowError(winCheck.reason || 'Horário fora das janelas operacionais');
    } else {
      setWindowError(null);
    }

    // 2. Query capacity and suggested slots
    const checkCap = logisticsService.checkCapacity(
      date,
      scheduledTime,
      Number(estStayMinutes),
      selectedAppointmentForEdit?.id
    );

    if (!checkCap.valid) {
      if (checkCap.message) {
        setCapacityError(checkCap.message);
      }
      if (checkCap.suggestions) {
        setSuggestedSlots(checkCap.suggestions);
      }
    } else {
      setCapacityError(null);
      setSuggestedSlots([]);
    }
  }, [scheduledTime, estStayMinutes, date, isAppointmentModalOpen, selectedAppointmentForEdit, config]);

  if (!isAppointmentModalOpen) return null;

  const handleCarrierChange = (cId: string) => {
    const found = carriers.find((c) => c.id === cId);
    if (found) {
      setCarrierId(found.id);
      setCarrierName(found.name);
    }
  };

  const handleSelectDriver = (driverId: string) => {
    const found = drivers.find((d) => d.id === driverId);
    if (found) {
      setDriverName(found.name);
      setDriverPhone(found.phone);
      if (found.defaultPlate && !plate) {
        setPlate(found.defaultPlate);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (windowError) {
      return;
    }

    if (capacityError && !allowOverride) {
      return;
    }

    if (allowOverride && !overrideReason.trim()) {
      alert('Por favor, informe a justificativa operacional para autorizar a sobrecarga do pátio.');
      return;
    }

    setSubmitting(true);

    const payload = {
      plate: plate.toUpperCase().trim(),
      driverName,
      driverPhone,
      carrierId,
      carrierName,
      cargoType,
      priority,
      date,
      scheduledTime,
      estUnloadMinutes: Number(estUnloadMinutes),
      estStayMinutes: Number(estStayMinutes),
      dockId: dockId ? Number(dockId) : undefined,
      notes,
      allowOverride,
      overrideReason: allowOverride ? overrideReason : undefined,
    };

    let result;
    if (isEditing && selectedAppointmentForEdit) {
      result = await updateAppointment(selectedAppointmentForEdit.id, payload);
    } else {
      result = await createAppointment(payload);
    }

    setSubmitting(false);

    if (result.success) {
      setIsAppointmentModalOpen(false);
    } else {
      if (result.error) {
        setCapacityError(result.error);
      }
      if (result.suggestions) {
        setSuggestedSlots(result.suggestions);
      }
    }
  };

  const canOverride = currentUser.role === 'ADMIN' || currentUser.role === 'GESTOR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Editar Agendamento' : 'Novo Agendamento de Veículo'}
              </h3>
              <p className="text-xs text-slate-500">
                Centro de Distribuição Move Log · Validação de capacidade em tempo real
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAppointmentModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Operational Hours Reminder Banner */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Horários de Operação:</strong> 07:00 às 11:00 e 12:00 às 16:00.
              </span>
            </div>
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              11:00 às 12:00 Bloqueado
            </span>
          </div>

          {/* Conflict / Window Alert */}
          {windowError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Horário Não Permitido</p>
                <p className="mt-0.5 leading-relaxed">{windowError}</p>
                {suggestedSlots.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-rose-200">
                    <p className="font-semibold text-rose-800">Próximos horários disponíveis sugeridos:</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {suggestedSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setScheduledTime(slot)}
                          className="px-2.5 py-1 rounded bg-white text-blue-700 border border-blue-300 font-mono font-bold hover:bg-blue-50 transition-colors shadow-2xs"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overcapacity Warning */}
          {capacityError && !windowError && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-900">{capacityError}</p>
                <p className="mt-0.5 text-amber-800">
                  O pátio possui limite de 8 caminhões simultâneos e atingirá a capacidade máxima
                  com esta alocação.
                </p>

                {suggestedSlots.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-amber-200">
                    <p className="font-semibold text-amber-900">
                      Horários alternativos recomendados (pátio livre):
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {suggestedSlots.map((slot) => (
                        <button
                          type="button"
                          key={slot}
                          onClick={() => setScheduledTime(slot)}
                          className="px-2.5 py-1 rounded bg-white text-emerald-800 border border-emerald-300 font-mono font-bold hover:bg-emerald-50 transition-colors shadow-2xs"
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {canOverride && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-950">
                      <input
                        type="checkbox"
                        checked={allowOverride}
                        onChange={(e) => setAllowOverride(e.target.checked)}
                        className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Autorizar sobrecarga manual no pátio (Gestor / Administrador)</span>
                    </label>

                    {allowOverride && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Justificativa operacional obrigatória para auditoria..."
                          className="w-full text-xs p-2 rounded border border-amber-300 bg-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Row 1: Placa, Quick Driver Selector, Motorista */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Placa do Veículo *
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="Ex: MLG2A34"
                className="w-full text-xs uppercase font-mono font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preencher Motorista Frequente
              </label>
              <select
                onChange={(e) => handleSelectDriver(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecionar do cadastro...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.defaultPlate})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Motorista *
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="Nome completo"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Transportadora & Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transportadora *
              </label>
              <select
                required
                value={carrierId}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cnpj})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone / WhatsApp do Motorista
              </label>
              <input
                type="text"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="(11) 98765-4321"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 3: Tipo de Carga & Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo de Carga *
              </label>
              <select
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Alimentos Refrigerados">Alimentos Refrigerados</option>
                <option value="Bebidas e Laticínios">Bebidas e Laticínios</option>
                <option value="Produtos de Higiene e Perfumaria">Produtos de Higiene e Perfumaria</option>
                <option value="Eletrônicos e Informática">Eletrônicos e Informática</option>
                <option value="Materiais de Construção">Materiais de Construção</option>
                <option value="Produtos de Limpeza e Saneantes">Produtos de Limpeza e Saneantes</option>
                <option value="Bens de Consumo (FMCG)">Bens de Consumo (FMCG)</option>
                <option value="Carga Geral">Carga Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média (Padrão)</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente (Fila prioritária)</option>
              </select>
            </div>
          </div>

          {/* Row 4: Data, Horário Agendado, Doca */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horário Agendado *
              </label>
              <input
                type="time"
                required
                step="900"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Doca Pré-Alocada (Opcional)
              </label>
              <select
                value={dockId || ''}
                onChange={(e) => setDockId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Fila dinâmica (Automático)</option>
                {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Doca {d.toString().padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Tempos Estimados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo Estimado de Descarregamento (min)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                step={5}
                required
                value={estUnloadMinutes}
                onChange={(e) => setEstUnloadMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo Estimado de Permanência no CD (min) *
              </label>
              <input
                type="number"
                min={20}
                max={240}
                step={5}
                required
                value={estStayMinutes}
                onChange={(e) => setEstStayMinutes(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Utilizado para o cálculo de sobreposição e limite de 8 vagas no pátio.
              </span>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções de segurança, número do manifesto ou notas da carga..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {capacityError && !allowOverride ? (
              <span className="text-rose-600 font-medium">Confirmação bloqueada por capacidade</span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validações operacionais aprovadas
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAppointmentModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || Boolean(windowError) || (Boolean(capacityError) && !allowOverride)}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors shadow-xs"
            >
              {submitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Confirmar Agendamento'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
