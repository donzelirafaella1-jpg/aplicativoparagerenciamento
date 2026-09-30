import React from 'react';
import { X, Clock, User, ShieldAlert, CheckCircle2, History } from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const AuditHistoryModal: React.FC = () => {
  const { selectedAppointmentForHistory, setSelectedAppointmentForHistory } = useLogistics();

  if (!selectedAppointmentForHistory) return null;

  const app = selectedAppointmentForHistory;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Histórico & Rastreabilidade</h3>
                <span className="text-xs font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                  {app.plate}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {app.code} · {app.carrierName} · {app.driverName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedAppointmentForHistory(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Strip */}
        <div className="px-6 py-3 bg-blue-50/50 border-b border-blue-100/60 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-500 block">Agendado Para:</span>
            <span className="font-semibold text-slate-900 font-mono">{app.scheduledTime}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Horário Real Entrada:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {app.realArrivalTime || 'Aguardando'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Doca Designada:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {app.dockId ? `Doca ${app.dockId.toString().padStart(2, '0')}` : 'Fila de Espera'}
            </span>
          </div>
        </div>

        {/* History Timeline */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {app.overrideReason && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Autorização Especial de Sobrecarga:</span>
                <p className="mt-0.5 text-amber-800">{app.overrideReason}</p>
              </div>
            </div>
          )}

          <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {app.history.map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="absolute -left-6 mt-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-blue-600 shadow-xs" />
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-900">{item.action}</span>
                    <span className="font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.details}</p>
                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>Registrado por: </span>
                    <span className="font-medium text-slate-700">{item.user}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={() => setSelectedAppointmentForHistory(null)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Fechar Histórico
          </button>
        </div>
      </div>
    </div>
  );
};
