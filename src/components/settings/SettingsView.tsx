import React, { useState } from 'react';
import {
  Settings,
  Warehouse,
  Clock,
  Shield,
  RotateCcw,
  CheckCircle2,
  Save,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';
import { useLogistics } from '../../context/LogisticsContext';
import { OperationalConfig } from '../../types/logistics';

export const SettingsView: React.FC = () => {
  const { config, updateConfig, resetSeedData, auditLogs, currentUser } = useLogistics();

  const [formConfig, setFormConfig] = useState<OperationalConfig>(config);
  const [saving, setSaving] = useState(false);

  const isReadOnly = currentUser.role === 'LEITURA' || currentUser.role === 'OPERADOR_DOCA' || currentUser.role === 'OPERADOR_PATIO';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateConfig(formConfig);
    setSaving(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Parâmetros Operacionais do CD Move Log</h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Move Log CD Central
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configuração de capacidade do pátio, 14 docas, janelas de horário e intervalos obrigatórios
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={resetSeedData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restaurar Grade Inicial de 32 Caminhões</span>
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900 font-medium">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Seu perfil atual ({currentUser.role}) possui permissão apenas de leitura. Para alterar parâmetros, alterne para <strong>Administrador</strong> ou <strong>Gestor Logístico</strong> no menu inferior esquerdo.
          </span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Capacidades Físicas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Warehouse className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Capacidades Físicas do Centro de Distribuição</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Capacidade Máxima do Pátio (Veículos Simultâneos)
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                min={4}
                max={20}
                value={formConfig.yardCapacity}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, yardCapacity: Number(e.target.value) })
                }
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Valor padrão: 8 vagas simultâneas. Bloqueio automático ao atingir o limite.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantidade de Docas Operacionais
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                min={6}
                max={30}
                value={formConfig.totalDocks}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, totalDocks: Number(e.target.value) })
                }
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Valor padrão: 14 docas ativas de 01 a 14.
              </span>
            </div>
          </div>
        </div>

        {/* Janelas de Horário e Intervalos */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Janelas Operacionais e Intervalo Obrigatório</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Abertura Turno Manhã
              </label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formConfig.morningStart}
                onChange={(e) => setFormConfig({ ...formConfig, morningStart: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Início Intervalo (Bloqueado)
              </label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formConfig.lunchStart}
                onChange={(e) => setFormConfig({ ...formConfig, lunchStart: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-amber-300 bg-amber-50/50 disabled:bg-slate-100 text-amber-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fim Intervalo / Início Tarde
              </label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formConfig.lunchEnd}
                onChange={(e) => setFormConfig({ ...formConfig, lunchEnd: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-amber-300 bg-amber-50/50 disabled:bg-slate-100 text-amber-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fechamento Operacional CD
              </label>
              <input
                type="time"
                disabled={isReadOnly}
                value={formConfig.afternoonEnd}
                onChange={(e) => setFormConfig({ ...formConfig, afternoonEnd: e.target.value })}
                className="w-full text-xs font-mono font-bold p-2.5 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Tempos Padrão e Regras */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <Shield className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Tempos Padrão e Regras de Negócio</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo Padrão de Descarregamento (minutos)
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                min={20}
                max={180}
                value={formConfig.defaultUnloadTime}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, defaultUnloadTime: Number(e.target.value) })
                }
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tempo Padrão de Permanência no Pátio (minutos)
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                min={30}
                max={240}
                value={formConfig.defaultStayTime}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, defaultStayTime: Number(e.target.value) })
                }
                className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 disabled:bg-slate-100"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formConfig.allowManualOverbooking}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, allowManualOverbooking: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Permitir que Gestores e Administradores autorizem sobrecarga manual no pátio mediante justificativa registrada
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={formConfig.autoQueueAdvance}
                onChange={(e) =>
                  setFormConfig({ ...formConfig, autoQueueAdvance: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Avanço automático da fila de espera quando uma doca for finalizada e liberada
              </span>
            </label>
          </div>

          {!isReadOnly && (
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Salvando...' : 'Salvar Alterações de Configuração'}</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* System Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Trilha de Auditoria Operacional</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">Últimos eventos do sistema</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex items-start justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">{log.action}</span>
                  {log.isOvercapacityOverride && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Sobrecarga Autorizada
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{log.details}</p>
                <span className="text-[10px] text-slate-400 font-mono">Usuário: {log.user} ({log.role})</span>
              </div>
              <span className="font-mono text-slate-400 text-[11px] shrink-0 ml-4">
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
