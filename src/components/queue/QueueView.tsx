import React from 'react';
import {
  ListOrdered,
  Truck,
  Clock,
  ArrowRight,
  Warehouse,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const QueueView: React.FC = () => {
  const { waitingQueue, docks, allocateDock, currentUser, setSelectedAppointmentForHistory, appointments } = useLogistics();

  const isReadOnly = currentUser.role === 'LEITURA';
  const availableDocks = docks.filter((d) => d.status === 'DISPONIVEL');

  const handleAllocateQuick = async (appointmentId: string, dockId: number) => {
    await allocateDock(dockId, appointmentId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Fila de Espera Dinâmica por Doca</h3>
            <span className="font-mono text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded">
              {waitingQueue.length} veículos aguardando
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sequenciamento inteligente por prioridade de carga e horário de check-in na portaria
          </p>
        </div>

        {/* Free docks counter */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
            <span className="text-slate-500 block">Docas Livres Agora:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {availableDocks.length} / 14 docas
            </span>
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <span className="font-bold text-slate-900 text-sm">Ordem de Atendimento</span>
          <span className="text-xs text-slate-500">
            Regra de atendimento: Urgente &gt; Alta &gt; Média &gt; Baixa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 text-center">Posição</th>
                <th className="py-2.5 px-4">Placa / Veículo</th>
                <th className="py-2.5 px-4">Motorista & Transportadora</th>
                <th className="py-2.5 px-4">Tipo de Carga</th>
                <th className="py-2.5 px-4 text-center">Prioridade</th>
                <th className="py-2.5 px-4 text-center">Chegada Portaria</th>
                <th className="py-2.5 px-4 text-center">Tempo em Espera</th>
                <th className="py-2.5 px-4 text-center">Previsão Atendimento</th>
                <th className="py-2.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {waitingQueue.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <span className="text-sm font-semibold text-slate-700 block">
                      Fila de espera zerada!
                    </span>
                    <span className="text-xs text-slate-500">
                      Todos os caminhões que chegaram foram direcionados às suas docas.
                    </span>
                  </td>
                </tr>
              ) : (
                waitingQueue.map((item, index) => {
                  const app = appointments.find((a) => a.id === item.appointmentId);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-sm bg-slate-100 text-slate-800 px-2.5 py-1 rounded-full border border-slate-200">
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 text-sm block">
                          {item.plate}
                        </span>
                        <span className="text-[10px] text-slate-500">Agendado: {item.scheduledTime}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{item.driver}</div>
                        <div className="text-[11px] text-slate-500">{item.carrier}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{item.cargoType}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.priority === 'URGENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : item.priority === 'ALTA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                        {item.arrivalTime}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-700">
                        {item.waitingMinutes} min
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {item.estServiceTime}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isReadOnly && availableDocks.length > 0 ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[11px] text-slate-500">Alocar:</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAllocateQuick(item.appointmentId, Number(e.target.value));
                                }
                              }}
                              className="text-xs p-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold"
                            >
                              <option value="">Doca livre...</option>
                              {availableDocks.map((d) => (
                                <option key={d.id} value={d.id}>
                                  Doca {d.dockNumber}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Aguardando doca liberar</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
