import React, { useState } from 'react';
import { Building2, Phone, Mail, FileText, CheckCircle2, AlertTriangle, Search, PlusCircle } from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { Carrier } from '../../types/logistics';

export const CarriersView: React.FC = () => {
  const { carriers, appointments, currentUser } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = carriers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.cnpj.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar transportadora por razão social, CNPJ ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">
            {carriers.length} transportadoras homologadas
          </span>
        </div>
      </div>

      {/* Carriers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((carrier) => {
          // Calculate today's trucks for this carrier
          const todayTrucks = appointments.filter((a) => a.carrierId === carrier.id);

          return (
            <div
              key={carrier.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      carrier.status === 'ATIVA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {carrier.status}
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm tracking-tight mb-1 truncate">
                  {carrier.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-500 mb-3">{carrier.cnpj}</p>

                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{carrier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{carrier.email}</span>
                  </div>
                </div>
              </div>

              {/* Metrics strip */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Viagens CD</span>
                  <span className="font-mono font-bold text-slate-800">{carrier.totalTrips}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Hoje</span>
                  <span className="font-mono font-bold text-blue-700">{todayTrucks.length} veíc.</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Pontualidade</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {carrier.onTimeRate}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
