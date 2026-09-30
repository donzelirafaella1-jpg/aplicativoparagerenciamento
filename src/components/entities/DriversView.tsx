import React, { useState } from 'react';
import { Users, Phone, Truck, Search, ShieldCheck, Clock } from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const DriversView: React.FC = () => {
  const { drivers, appointments } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = drivers.filter((d) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      d.cpf.toLowerCase().includes(term) ||
      d.carrierName.toLowerCase().includes(term) ||
      d.defaultPlate.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por motorista, CPF, transportadora ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {drivers.length} motoristas cadastrados
          </span>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((driver) => {
          // Check if currently on-site or scheduled today
          const todayAppointment = appointments.find(
            (a) => a.driverName.toLowerCase() === driver.name.toLowerCase()
          );

          return (
            <div
              key={driver.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      driver.status === 'APTO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : driver.status === 'EM_TRANSITO'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {driver.status === 'APTO'
                      ? 'APTO'
                      : driver.status === 'EM_TRANSITO'
                      ? 'EM TRÂNSITO'
                      : 'BLOQUEADO'}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm tracking-tight mb-0.5 truncate">
                  {driver.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-400 mb-2">{driver.cpf}</p>
                <p className="text-xs text-blue-700 font-medium truncate mb-3">
                  {driver.carrierName}
                </p>

                <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telefone:</span>
                    <span className="font-mono">{driver.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Placa Principal:</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {driver.defaultPlate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Avaliação CD:</span>
                    <span className="font-bold text-amber-600">★ {driver.rating} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Today's status */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {todayAppointment ? (
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px]">
                    <span className="text-slate-500 block">Viagem Hoje:</span>
                    <span className="font-mono font-bold text-blue-800">
                      {todayAppointment.scheduledTime} · {todayAppointment.status}
                    </span>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 text-center py-1">
                    Sem escala agendada para hoje
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
