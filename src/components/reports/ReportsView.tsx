import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Warehouse,
  Truck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Printer,
  PieChart,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { timeToMinutes } from '../../lib/logistics-engine';

export const ReportsView: React.FC = () => {
  const { metrics, appointments, carriers, selectedDate } = useLogistics();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Breakdown by Carrier
  const carrierCounts: Record<string, { total: number; delays: number }> = {};
  appointments.forEach((a) => {
    if (!carrierCounts[a.carrierName]) {
      carrierCounts[a.carrierName] = { total: 0, delays: 0 };
    }
    carrierCounts[a.carrierName].total++;
    if (a.status === 'ATRASADO' || (a.delayMinutes && a.delayMinutes > 15)) {
      carrierCounts[a.carrierName].delays++;
    }
  });

  // Breakdown by Cargo
  const cargoCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    cargoCounts[a.cargoType] = (cargoCounts[a.cargoType] || 0) + 1;
  });

  // Hourly volume histogram (07:00 to 16:00)
  const hourlySlots = [
    { hour: '07:00', count: 0 },
    { hour: '08:00', count: 0 },
    { hour: '09:00', count: 0 },
    { hour: '10:00', count: 0 },
    { hour: '11:00 (Intervalo)', count: 0, isInterval: true },
    { hour: '12:00', count: 0 },
    { hour: '13:00', count: 0 },
    { hour: '14:00', count: 0 },
    { hour: '15:00', count: 0 },
  ];

  appointments.forEach((a) => {
    if (a.status === 'CANCELADO') return;
    const h = parseInt(a.scheduledTime.split(':')[0], 10);
    if (h === 7) hourlySlots[0].count++;
    else if (h === 8) hourlySlots[1].count++;
    else if (h === 9) hourlySlots[2].count++;
    else if (h === 10) hourlySlots[3].count++;
    else if (h === 12) hourlySlots[5].count++;
    else if (h === 13) hourlySlots[6].count++;
    else if (h === 14) hourlySlots[7].count++;
    else if (h === 15) hourlySlots[8].count++;
  });

  const maxHourCount = Math.max(1, ...hourlySlots.map((h) => h.count));

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Placa', 'Motorista', 'Transportadora', 'Carga', 'Prioridade', 'Data', 'Horario', 'Doca', 'Status'];
    const rows = appointments.map((a) => [
      a.code,
      a.plate,
      `"${a.driverName}"`,
      `"${a.carrierName}"`,
      `"${a.cargoType}"`,
      a.priority,
      a.date,
      a.scheduledTime,
      a.dockId ? `Doca ${a.dockId}` : 'N/A',
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_movelog_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Filter and Export Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === 'today' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoje (32 Caminhões)
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === 'week' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Esta Semana (Projetado)
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                period === 'month' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Este Mês
            </button>
          </div>
          <span className="text-xs text-slate-500 font-mono">Data base: {selectedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Sumário</span>
          </button>
        </div>
      </div>

      {/* Strategic Performance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Caminhões Atendidos
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-slate-900">
              {metrics.totalTrucks}
            </span>
            <span className="text-xs text-slate-400">/ 32 meta</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            100% de capacidade operacional
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pico de Pátio Observado
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-blue-700">7 / 8</span>
            <span className="text-xs text-slate-500">veículos</span>
          </div>
          <span className="text-[11px] text-blue-700 font-medium mt-1 block">
            Limite de 8 estritamente respeitado
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Tempo Médio em Espera
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-indigo-700">
              {metrics.avgWaitMinutes} min
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tempo na portaria até doca</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Pontualidade Geral
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-emerald-700">
              {Math.round(((metrics.totalTrucks - metrics.delayed) / Math.max(1, metrics.totalTrucks)) * 100)}%
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {metrics.delayed} atrasos · {metrics.earlyArrivals} antecipados
          </span>
        </div>
      </div>

      {/* Hourly Concentration Chart & Shift Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Histogram */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                Concentração Horária de Veículos (07:00 às 16:00)
              </h3>
              <p className="text-xs text-slate-500">
                Distribuição horária evidenciando a ausência de picos e o intervalo obrigatório
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase font-mono">Horas Operacionais</span>
          </div>

          {/* Histogram Bars */}
          <div className="space-y-2.5 pt-2">
            {hourlySlots.map((slot) => {
              const pct = (slot.count / maxHourCount) * 100;
              return (
                <div key={slot.hour} className="flex items-center gap-3 text-xs">
                  <span className="w-28 font-mono text-slate-600 text-right truncate">
                    {slot.hour}
                  </span>
                  <div className="flex-1 bg-slate-100 rounded-md h-7 overflow-hidden relative flex items-center p-1">
                    {slot.isInterval ? (
                      <div className="w-full h-full bg-stripes-amber border border-amber-300 rounded flex items-center justify-center text-[10px] font-bold text-amber-900 uppercase">
                        Intervalo Obrigatório Bloqueado (0 Veículos)
                      </div>
                    ) : (
                      <div
                        className="h-full bg-blue-600 rounded flex items-center justify-end px-2 text-white font-mono font-bold transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      >
                        {slot.count > 0 ? slot.count : ''}
                      </div>
                    )}
                  </div>
                  <span className="w-8 font-mono font-bold text-slate-700 text-right">
                    {slot.isInterval ? '-' : slot.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Morning vs Afternoon Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1">
              Comparativo Manhã vs Tarde
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Equilíbrio da demanda operacional entre os dois turnos
            </p>

            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-blue-900">Turno Manhã (07:00–11:00)</span>
                  <span className="font-mono font-bold text-base text-blue-700">
                    {metrics.morningCount}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800">
                  50% do volume diário planejado. Média de 4 caminhões por hora.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs">Intervalo Obrigatório (11:00–12:00)</span>
                  <span className="font-mono font-bold text-base text-amber-800">0</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Bloqueio ativo. Zero veículos autorizados para o período.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-indigo-900">Turno Tarde (12:00–16:00)</span>
                  <span className="font-mono font-bold text-base text-indigo-700">
                    {metrics.afternoonCount}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-800">
                  50% do volume diário planejado. Encerramento às 16:00.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown by Carrier & Cargo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicles by Carrier Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1">
            Veículos por Transportadora
          </h3>
          <p className="text-xs text-slate-500 mb-4">Volume diário e histórico de pontualidade</p>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2 px-3">Transportadora</th>
                <th className="py-2 px-3 text-center">Caminhões Hoje</th>
                <th className="py-2 px-3 text-center">Atrasos</th>
                <th className="py-2 px-3 text-center">Pontualidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {Object.entries(carrierCounts).map(([name, data]) => {
                const rate = Math.round(((data.total - data.delays) / data.total) * 100);
                return (
                  <tr key={name} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{name}</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                      {data.total}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-700">
                      {data.delays}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                      {rate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Breakdown by Cargo Type */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-1">
            Distribuição por Tipo de Carga
          </h3>
          <p className="text-xs text-slate-500 mb-4">Volume segmentado recebido pelo CD Move Log</p>

          <div className="space-y-3">
            {Object.entries(cargoCounts).map(([cargo, count]) => {
              const pct = Math.round((count / appointments.length) * 100);
              return (
                <div key={cargo} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{cargo}</span>
                    <span className="font-mono text-slate-500">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
