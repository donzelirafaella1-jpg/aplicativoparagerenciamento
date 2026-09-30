import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Warehouse,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';

export const OptimizeModal: React.FC = () => {
  const {
    isOptimizeModalOpen,
    setIsOptimizeModalOpen,
    optimizationPreview,
    applyOptimization,
  } = useLogistics();

  const [applying, setApplying] = useState(false);

  if (!isOptimizeModalOpen || !optimizationPreview) return null;

  const handleApply = async () => {
    setApplying(true);
    await applyOptimization();
    setApplying(false);
  };

  const {
    suggestions,
    currentYardMaxOverlap,
    projectedYardMaxOverlap,
    currentAvgWaitMinutes,
    projectedAvgWaitMinutes,
    totalTrucksAnalyzed,
    adjustedCount,
    impactSummary,
  } = optimizationPreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-700 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg tracking-tight">Otimização Inteligente da Agenda</h3>
                <span className="text-[11px] font-semibold bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700">
                  Algoritmo Move Log
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                Prévia de balanceamento para os 32 caminhões diários e controle de sobreposição
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOptimizeModalOpen(false)}
            className="p-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Comparison Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Pico de Ocupação do Pátio
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-rose-600 line-through">
                {currentYardMaxOverlap}/8
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xl font-bold text-emerald-600 font-mono">
                {projectedYardMaxOverlap}/8
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
              Dentro do limite rigoroso de 8 vagas
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Tempo Médio de Espera
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-slate-400 line-through">
                {currentAvgWaitMinutes} min
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xl font-bold text-indigo-600 font-mono">
                {projectedAvgWaitMinutes} min
              </span>
            </div>
            <span className="text-[10px] text-indigo-700 font-medium mt-1 block">
              Redução de {currentAvgWaitMinutes - projectedAvgWaitMinutes} minutos por caminhão
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Veículos Analisados
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 font-mono">
                {totalTrucksAnalyzed}
              </span>
              <span className="text-xs text-slate-500">caminhões</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Grade completa do dia</span>
          </div>

          <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Ajustes Sugeridos
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-blue-600 font-mono">{adjustedCount}</span>
              <span className="text-xs text-slate-500">veículos reposicionados</span>
            </div>
            <span className="text-[10px] text-blue-700 font-medium mt-1 block">
              Minimizando impacto na rotina
            </span>
          </div>
        </div>

        {/* Impact Message */}
        <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-900">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{impactSummary}</span>
        </div>

        {/* Table of Suggestions */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Detalhamento dos Ajustes Propostos
          </h4>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Cód / Placa</th>
                  <th className="py-2.5 px-3">Transportadora</th>
                  <th className="py-2.5 px-3">Prioridade</th>
                  <th className="py-2.5 px-3 text-center">Horário Atual</th>
                  <th className="py-2.5 px-3 text-center">Horário Sugerido</th>
                  <th className="py-2.5 px-3 text-center">Doca Sugerida</th>
                  <th className="py-2.5 px-3">Justificativa Operacional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {suggestions.map((s) => {
                  const hasChanged =
                    s.currentScheduledTime !== s.suggestedScheduledTime ||
                    s.currentDock !== s.suggestedDock;
                  return (
                    <tr
                      key={s.appointmentId}
                      className={hasChanged ? 'bg-indigo-50/30 hover:bg-indigo-50/60' : 'hover:bg-slate-50'}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {s.plate}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          {s.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="truncate max-w-[150px] font-medium">{s.carrierName}</div>
                        <div className="text-[10px] text-slate-500 truncate">{s.driverName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            s.priority === 'URGENTE'
                              ? 'bg-rose-100 text-rose-800'
                              : s.priority === 'ALTA'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.priority}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                        {s.currentScheduledTime}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-700">
                        {s.suggestedScheduledTime}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                        Doca {s.suggestedDock.toString().padStart(2, '0')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                        {s.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            A aplicação da otimização requer confirmação explícita e atualizará toda a grade do dia.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOptimizeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Descartar
            </button>
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{applying ? 'Aplicando Otimização...' : 'Confirmar e Aplicar Otimização'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
