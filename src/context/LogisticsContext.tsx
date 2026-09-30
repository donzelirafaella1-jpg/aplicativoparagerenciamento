import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  Appointment,
  Carrier,
  Dock,
  Driver,
  OperationalConfig,
  OperationalMetrics,
  OptimizationResult,
  UserRole,
  UserSession,
  WaitingQueueItem,
  YardSpot,
  AuditLog,
} from '../types/logistics';
import { DEFAULT_CONFIG, calculateOperationalKPIs } from '../lib/logistics-engine';
import { TODAY_DATE } from '../data/seed-data';

export type ActiveTab =
  | 'dashboard'
  | 'appointments'
  | 'schedule'
  | 'yard'
  | 'docks'
  | 'queue'
  | 'carriers'
  | 'drivers'
  | 'reports'
  | 'settings';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface LogisticsContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: UserSession;
  setCurrentUserRole: (role: UserRole) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  config: OperationalConfig;
  metrics: OperationalMetrics;
  appointments: Appointment[];
  yardSpots: YardSpot[];
  docks: Dock[];
  waitingQueue: WaitingQueueItem[];
  carriers: Carrier[];
  drivers: Driver[];
  auditLogs: AuditLog[];
  loading: boolean;
  refreshState: () => Promise<void>;
  
  // Modals state
  isAppointmentModalOpen: boolean;
  setIsAppointmentModalOpen: (open: boolean) => void;
  selectedAppointmentForEdit: Appointment | null;
  setSelectedAppointmentForEdit: (app: Appointment | null) => void;

  isCheckinModalOpen: boolean;
  setIsCheckinModalOpen: (open: boolean) => void;
  selectedAppointmentForCheckin: Appointment | null;
  setSelectedAppointmentForCheckin: (app: Appointment | null) => void;

  isOptimizeModalOpen: boolean;
  setIsOptimizeModalOpen: (open: boolean) => void;
  optimizationPreview: OptimizationResult | null;
  loadOptimizationPreview: () => Promise<void>;
  applyOptimization: () => Promise<boolean>;

  selectedAppointmentForHistory: Appointment | null;
  setSelectedAppointmentForHistory: (app: Appointment | null) => void;

  // Actions
  createAppointment: (data: any) => Promise<{ success: boolean; error?: string; suggestions?: string[] }>;
  updateAppointment: (id: string, data: any) => Promise<{ success: boolean; error?: string; suggestions?: string[] }>;
  cancelAppointment: (id: string) => Promise<boolean>;
  performCheckin: (appointmentId: string, realArrivalTime: string, notes?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  allocateDock: (dockId: number, appointmentId: string) => Promise<boolean>;
  finishUnload: (dockId: number) => Promise<boolean>;
  moveYardSpot: (fromSpotId: number, toSpotId: number) => Promise<boolean>;
  updateConfig: (newConfig: OperationalConfig) => Promise<boolean>;
  resetSeedData: () => Promise<void>;

  // Toasts
  toasts: ToastNotification[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_DATE);
  const [loading, setLoading] = useState<boolean>(true);

  // User Profile
  const [currentUser, setCurrentUser] = useState<UserSession>({
    id: 'usr-01',
    name: 'Roberto Miranda',
    email: 'roberto.miranda@movelog.com.br',
    role: 'GESTOR',
    company: 'Move Log',
  });

  // Operational State
  const [config, setConfig] = useState<OperationalConfig>(DEFAULT_CONFIG);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [yardSpots, setYardSpots] = useState<YardSpot[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [waitingQueue, setWaitingQueue] = useState<WaitingQueueItem[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [metrics, setMetrics] = useState<OperationalMetrics>(() =>
    calculateOperationalKPIs([], TODAY_DATE, DEFAULT_CONFIG)
  );

  // Modals
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointmentForEdit, setSelectedAppointmentForEdit] = useState<Appointment | null>(null);

  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [selectedAppointmentForCheckin, setSelectedAppointmentForCheckin] = useState<Appointment | null>(null);

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizationPreview, setOptimizationPreview] = useState<OptimizationResult | null>(null);

  const [selectedAppointmentForHistory, setSelectedAppointmentForHistory] = useState<Appointment | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setCurrentUserRole = (role: UserRole) => {
    const roleLabels: Record<UserRole, string> = {
      ADMIN: 'Administrador Geral',
      GESTOR: 'Gestor Logístico',
      OPERADOR_PATIO: 'Operador de Pátio',
      OPERADOR_DOCA: 'Operador de Doca',
      LEITURA: 'Usuário Somente Leitura',
    };
    setCurrentUser((prev) => ({ ...prev, role, name: `${prev.name.split(' (')[0]} (${roleLabels[role]})` }));
    addToast('info', 'Perfil Operacional Alterado', `Sessão alterada para perfil: ${roleLabels[role]}`);
  };

  const refreshState = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?date=${selectedDate}`);
      if (!res.ok) throw new Error('Falha ao sincronizar dados');
      const data = await res.json();
      setConfig(data.config || DEFAULT_CONFIG);
      setAppointments(data.appointments || []);
      setYardSpots(data.yardSpots || []);
      setDocks(data.docks || []);
      setWaitingQueue(data.waitingQueue || []);
      setCarriers(data.carriers || []);
      setDrivers(data.drivers || []);
      setAuditLogs(data.auditLogs || []);
      setMetrics(data.metrics || calculateOperationalKPIs(data.appointments || [], selectedDate, data.config || DEFAULT_CONFIG));
    } catch (err) {
      console.error('[Move Log TMS] Erro na sincronização:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [refreshState]);

  const createAppointment = async (formData: any) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Falha ao criar agendamento.',
          suggestions: data.suggestions || [],
        };
      }

      addToast('success', 'Agendamento Confirmado', `Veículo ${data.plate} agendado com sucesso para ${data.scheduledTime}.`);
      await refreshState();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão' };
    }
  };

  const updateAppointment = async (id: string, formData: any) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Falha ao atualizar agendamento.',
          suggestions: data.suggestions || [],
        };
      }

      addToast('success', 'Agendamento Atualizado', `Veículo ${data.plate} readequado para ${data.scheduledTime}.`);
      await refreshState();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro de conexão' };
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser.name, userRole: currentUser.role }),
      });

      if (!res.ok) {
        const data = await res.json();
        addToast('error', 'Erro ao Cancelar', data.error || 'Não foi possível cancelar.');
        return false;
      }

      addToast('info', 'Agendamento Cancelado', 'Agendamento cancelado e recursos liberados no Centro de Distribuição.');
      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message || 'Falha na requisição.');
      return false;
    }
  };

  const performCheckin = async (appointmentId: string, realArrivalTime: string, notes?: string) => {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          realArrivalTime,
          notes,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Falha ao registrar check-in' };
      }

      addToast(
        data.delta.delayMinutes > 15 ? 'warning' : 'success',
        'Check-in Realizado com Sucesso',
        `${data.delta.message} Direcionado para Vaga ${data.yardSpot.spotNumber}.`
      );
      await refreshState();
      return { success: true, message: data.delta.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao conectar ao servidor.' };
    }
  };

  const allocateDock = async (dockId: number, appointmentId: string) => {
    try {
      const res = await fetch('/api/docks/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dockId, appointmentId, userName: currentUser.name, userRole: currentUser.role }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Falha na Alocação', data.error || 'Não foi possível alocar a doca.');
        return false;
      }

      addToast('success', 'Doca Alocada', `Veículo posicionado na Doca ${data.dock.dockNumber}. Início do descarregamento.`);
      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const finishUnload = async (dockId: number) => {
    try {
      const res = await fetch('/api/docks/finish-unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dockId, userName: currentUser.name, userRole: currentUser.role }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Erro', data.error || 'Falha ao finalizar descarregamento.');
        return false;
      }

      addToast(
        'success',
        'Descarregamento Finalizado',
        `Doca ${data.dock.dockNumber} liberada e veículo encaminhado para saída do CD.`
      );

      if (data.nextRecommendedInQueue) {
        addToast(
          'info',
          'Próximo da Fila de Espera',
          `Veículo ${data.nextRecommendedInQueue.plate} (${data.nextRecommendedInQueue.carrier}) recomendado para a Doca ${data.dock.dockNumber}.`
        );
      }

      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const moveYardSpot = async (fromSpotId: number, toSpotId: number) => {
    try {
      const res = await fetch('/api/yard/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromSpotId, toSpotId, userName: currentUser.name, userRole: currentUser.role }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Erro ao Mover', data.error || 'Não foi possível mover o veículo.');
        return false;
      }

      addToast('success', 'Pátio Atualizado', `Veículo transferido para vaga ${data.toSpot.spotNumber}.`);
      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const loadOptimizationPreview = async () => {
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });
      const data = await res.json();
      setOptimizationPreview(data);
      setIsOptimizeModalOpen(true);
    } catch (err: any) {
      addToast('error', 'Falha ao Calcular Otimização', err.message);
    }
  };

  const applyOptimization = async () => {
    try {
      const res = await fetch('/api/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Erro', data.error || 'Falha ao aplicar otimização.');
        return false;
      }

      addToast(
        'success',
        'Otimização Aplicada com Sucesso!',
        `${data.appliedCount} caminhões reposicionados. Pico de pátio estabilizado.`
      );
      setIsOptimizeModalOpen(false);
      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const updateConfig = async (newConfig: OperationalConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          userName: currentUser.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        addToast('error', 'Erro', 'Falha ao salvar configurações.');
        return false;
      }

      setConfig(data.config);
      addToast('success', 'Configurações Atualizadas', 'Parâmetros operacionais do CD Move Log salvos.');
      await refreshState();
      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const resetSeedData = async () => {
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        addToast('info', 'Dados Reinicializados', 'Os 32 caminhões e estado inicial do CD Move Log foram restaurados.');
        await refreshState();
      }
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
    }
  };

  return (
    <LogisticsContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUserRole,
        selectedDate,
        setSelectedDate,
        config,
        metrics,
        appointments,
        yardSpots,
        docks,
        waitingQueue,
        carriers,
        drivers,
        auditLogs,
        loading,
        refreshState,
        isAppointmentModalOpen,
        setIsAppointmentModalOpen,
        selectedAppointmentForEdit,
        setSelectedAppointmentForEdit,
        isCheckinModalOpen,
        setIsCheckinModalOpen,
        selectedAppointmentForCheckin,
        setSelectedAppointmentForCheckin,
        isOptimizeModalOpen,
        setIsOptimizeModalOpen,
        optimizationPreview,
        loadOptimizationPreview,
        applyOptimization,
        selectedAppointmentForHistory,
        setSelectedAppointmentForHistory,
        createAppointment,
        updateAppointment,
        cancelAppointment,
        performCheckin,
        allocateDock,
        finishUnload,
        moveYardSpot,
        updateConfig,
        resetSeedData,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (!context) {
    throw new Error('useLogistics deve ser usado dentro de um LogisticsProvider');
  }
  return context;
};
