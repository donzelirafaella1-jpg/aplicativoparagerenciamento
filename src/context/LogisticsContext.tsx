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
import { logisticsService } from '../services/logistics-service';

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

  // Operational State loaded from LogisticsService
  const initial = logisticsService.getState(TODAY_DATE);
  const [config, setConfig] = useState<OperationalConfig>(initial.config);
  const [appointments, setAppointments] = useState<Appointment[]>(initial.appointments);
  const [yardSpots, setYardSpots] = useState<YardSpot[]>(initial.yardSpots);
  const [docks, setDocks] = useState<Dock[]>(initial.docks);
  const [waitingQueue, setWaitingQueue] = useState<WaitingQueueItem[]>(initial.waitingQueue);
  const [carriers, setCarriers] = useState<Carrier[]>(initial.carriers);
  const [drivers, setDrivers] = useState<Driver[]>(initial.drivers);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initial.auditLogs);
  const [metrics, setMetrics] = useState<OperationalMetrics>(initial.metrics);

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
      // 1. Fetch from centralized logisticsService
      const state = logisticsService.getState(selectedDate);
      setConfig(state.config || DEFAULT_CONFIG);
      setAppointments([...state.appointments]);
      setYardSpots([...state.yardSpots]);
      setDocks([...state.docks]);
      setWaitingQueue([...state.waitingQueue]);
      setCarriers([...state.carriers]);
      setDrivers([...state.drivers]);
      setAuditLogs([...state.auditLogs]);
      setMetrics(state.metrics);

      // 2. Also optionally try API if running fullstack Express
      try {
        const res = await fetch(`/api/state?date=${selectedDate}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data && data.appointments) {
              setConfig(data.config || state.config);
              setAppointments(data.appointments);
              setYardSpots(data.yardSpots);
              setDocks(data.docks);
              setWaitingQueue(data.waitingQueue);
              setCarriers(data.carriers);
              setDrivers(data.drivers);
              setAuditLogs(data.auditLogs);
              setMetrics(data.metrics);
            }
          }
        }
      } catch (apiErr) {
        // Fallback to logisticsService
      }
    } catch (err) {
      console.error('[Move Log TMS] Erro na sincronização:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 15000);
    return () => clearInterval(interval);
  }, [refreshState]);

  const createAppointment = async (formData: any) => {
    try {
      const res = logisticsService.createAppointment({
        ...formData,
        userName: currentUser.name,
        userRole: currentUser.role,
      });

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Falha ao criar agendamento.',
          suggestions: res.suggestions || [],
        };
      }

      addToast('success', 'Agendamento Confirmado', `Veículo ${res.appointment?.plate} agendado com sucesso para ${res.appointment?.scheduledTime}.`);
      await refreshState();

      // Background API sync if available
      fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao processar' };
    }
  };

  const updateAppointment = async (id: string, formData: any) => {
    try {
      const res = logisticsService.updateAppointment(id, {
        ...formData,
        userName: currentUser.name,
        userRole: currentUser.role,
      });

      if (!res.success) {
        return {
          success: false,
          error: res.error || 'Falha ao atualizar agendamento.',
          suggestions: res.suggestions || [],
        };
      }

      addToast('success', 'Agendamento Atualizado', `Veículo ${res.appointment?.plate} readequado para ${res.appointment?.scheduledTime}.`);
      await refreshState();

      fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao processar' };
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const success = logisticsService.cancelAppointment(id, currentUser.name);
      if (!success) {
        addToast('error', 'Erro ao Cancelar', 'Não foi possível cancelar o agendamento.');
        return false;
      }

      addToast('info', 'Agendamento Cancelado', 'Agendamento cancelado e recursos liberados no Centro de Distribuição.');
      await refreshState();

      fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message || 'Falha na requisição.');
      return false;
    }
  };

  const performCheckin = async (appointmentId: string, realArrivalTime: string, notes?: string) => {
    try {
      const res = logisticsService.performCheckin(
        appointmentId,
        realArrivalTime,
        notes,
        currentUser.name,
        currentUser.role
      );

      if (!res.success) {
        return { success: false, error: res.error || 'Falha ao registrar check-in' };
      }

      addToast(
        res.delta && res.delta.delayMinutes > 15 ? 'warning' : 'success',
        'Check-in Realizado com Sucesso',
        `${res.delta?.message} Direcionado para Vaga ${res.yardSpot?.spotNumber}.`
      );
      await refreshState();

      fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          realArrivalTime,
          notes,
          userName: currentUser.name,
          userRole: currentUser.role,
        }),
      }).catch(() => {});

      return { success: true, message: res.delta?.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao processar check-in.' };
    }
  };

  const allocateDock = async (dockId: number, appointmentId: string) => {
    try {
      const res = logisticsService.allocateDock(dockId, appointmentId, currentUser.name, currentUser.role);
      if (!res.success) {
        addToast('error', 'Falha na Alocação', res.error || 'Não foi possível alocar a doca.');
        return false;
      }

      addToast('success', 'Doca Alocada', `Veículo posicionado na Doca ${res.dock?.dockNumber}. Início do descarregamento.`);
      await refreshState();

      fetch('/api/docks/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dockId, appointmentId, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const finishUnload = async (dockId: number) => {
    try {
      const res = logisticsService.finishUnload(dockId, currentUser.name, currentUser.role);
      if (!res.success) {
        addToast('error', 'Erro', res.error || 'Falha ao finalizar descarregamento.');
        return false;
      }

      addToast(
        'success',
        'Descarregamento Finalizado',
        `Doca ${res.dock?.dockNumber} liberada e veículo encaminhado para saída do CD.`
      );

      if (res.nextRecommendedInQueue) {
        addToast(
          'info',
          'Próximo da Fila de Espera',
          `Veículo ${res.nextRecommendedInQueue.plate} (${res.nextRecommendedInQueue.carrier}) recomendado para a Doca ${res.dock?.dockNumber}.`
        );
      }

      await refreshState();

      fetch('/api/docks/finish-unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dockId, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const moveYardSpot = async (fromSpotId: number, toSpotId: number) => {
    try {
      const res = logisticsService.moveYardSpot(fromSpotId, toSpotId, currentUser.name, currentUser.role);
      if (!res.success) {
        addToast('error', 'Erro ao Mover', res.error || 'Não foi possível mover o veículo.');
        return false;
      }

      addToast('success', 'Pátio Atualizado', `Veículo transferido para vaga ${res.toSpot?.spotNumber}.`);
      await refreshState();

      fetch('/api/yard/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromSpotId, toSpotId, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const loadOptimizationPreview = async () => {
    try {
      const preview = logisticsService.getOptimizationPreview(selectedDate);
      setOptimizationPreview(preview);
      setIsOptimizeModalOpen(true);
    } catch (err: any) {
      addToast('error', 'Falha ao Calcular Otimização', err.message);
    }
  };

  const applyOptimization = async () => {
    try {
      const res = logisticsService.applyOptimization(selectedDate, currentUser.name, currentUser.role);
      if (!res.success) {
        addToast('error', 'Erro', 'Falha ao aplicar otimização.');
        return false;
      }

      addToast(
        'success',
        'Otimização Aplicada com Sucesso!',
        `${res.appliedCount} caminhões reposicionados. Pico de pátio estabilizado.`
      );
      setIsOptimizeModalOpen(false);
      await refreshState();

      fetch('/api/optimize/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, userName: currentUser.name, userRole: currentUser.role }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const updateConfig = async (newConfig: OperationalConfig) => {
    try {
      const res = logisticsService.updateConfig(newConfig, currentUser.name);
      setConfig(res.config);
      addToast('success', 'Configurações Atualizadas', 'Parâmetros operacionais do CD Move Log salvos.');
      await refreshState();

      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newConfig, userName: currentUser.name }),
      }).catch(() => {});

      return true;
    } catch (err: any) {
      addToast('error', 'Erro', err.message);
      return false;
    }
  };

  const resetSeedData = async () => {
    try {
      logisticsService.reset();
      addToast('info', 'Dados Reinicializados', 'Os 32 caminhões e estado inicial do CD Move Log foram restaurados.');
      await refreshState();

      fetch('/api/reset', { method: 'POST' }).catch(() => {});
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
