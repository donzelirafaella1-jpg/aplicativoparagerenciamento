import {
  Appointment,
  Carrier,
  Dock,
  Driver,
  OperationalConfig,
  WaitingQueueItem,
  YardSpot,
  AuditLog,
  OptimizationResult,
} from '../types/logistics';
import {
  DEFAULT_CONFIG,
  calculateCheckinDelta,
  calculateOperationalKPIs,
  calculateYardOccupancyTimeline,
  optimizeDailySchedule,
  suggestAvailableSlots,
  validateDockConflict,
  validateOperationalTimeWindow,
  validateYardCapacity,
  timeToMinutes,
  minutesToTime,
} from '../lib/logistics-engine';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_CARRIERS,
  INITIAL_DOCKS,
  INITIAL_DRIVERS,
  INITIAL_QUEUE,
  INITIAL_YARD_SPOTS,
  TODAY_DATE,
} from '../data/seed-data';

const STORAGE_KEY = 'movelog_tms_db_v1';

interface StoredData {
  appointments: Appointment[];
  yardSpots: YardSpot[];
  docks: Dock[];
  waitingQueue: WaitingQueueItem[];
  carriers: Carrier[];
  drivers: Driver[];
  config: OperationalConfig;
  auditLogs: AuditLog[];
}

class LogisticsService {
  private data: StoredData;

  constructor() {
    this.data = this.loadInitial();
  }

  private loadInitial(): StoredData {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.appointments) && parsed.appointments.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[Move Log TMS] Usando dados em memória:', e);
    }

    return {
      appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
      yardSpots: JSON.parse(JSON.stringify(INITIAL_YARD_SPOTS)),
      docks: JSON.parse(JSON.stringify(INITIAL_DOCKS)),
      waitingQueue: JSON.parse(JSON.stringify(INITIAL_QUEUE)),
      carriers: JSON.parse(JSON.stringify(INITIAL_CARRIERS)),
      drivers: JSON.parse(JSON.stringify(INITIAL_DRIVERS)),
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      auditLogs: [
        {
          id: 'log-01',
          timestamp: '07:00:00',
          action: 'Abertura de Turno CD Move Log',
          details: 'Operação matutina iniciada com 14 docas ativas e 8 vagas de pátio.',
          user: 'Sistema Central',
          role: 'ADMIN',
        },
      ],
    };
  }

  private save() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      }
    } catch (e) {
      // Ignore in memory
    }
  }

  reset() {
    this.data = {
      appointments: JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS)),
      yardSpots: JSON.parse(JSON.stringify(INITIAL_YARD_SPOTS)),
      docks: JSON.parse(JSON.stringify(INITIAL_DOCKS)),
      waitingQueue: JSON.parse(JSON.stringify(INITIAL_QUEUE)),
      carriers: JSON.parse(JSON.stringify(INITIAL_CARRIERS)),
      drivers: JSON.parse(JSON.stringify(INITIAL_DRIVERS)),
      config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          action: 'Reinicialização de Dados',
          details: 'Grade de 32 caminhões e pátio restaurados para estado padrão.',
          user: 'Gestor Logístico',
          role: 'GESTOR',
        },
      ],
    };
    this.save();
    return this.getState(TODAY_DATE);
  }

  logAction(action: string, details: string, user = 'Operador TMS', role: any = 'GESTOR', isOvercapacityOverride = false) {
    this.data.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      action,
      details,
      user,
      role,
      isOvercapacityOverride,
    });
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.save();
  }

  getState(date = TODAY_DATE) {
    const metrics = calculateOperationalKPIs(this.data.appointments, date, this.data.config);
    const timeline = calculateYardOccupancyTimeline(this.data.appointments, date, undefined, this.data.config);

    return {
      date,
      config: this.data.config,
      metrics,
      timeline,
      appointments: this.data.appointments,
      yardSpots: this.data.yardSpots,
      docks: this.data.docks,
      waitingQueue: this.data.waitingQueue,
      carriers: this.data.carriers,
      drivers: this.data.drivers,
      auditLogs: this.data.auditLogs.slice(0, 50),
    };
  }

  checkCapacity(date = TODAY_DATE, scheduledTime: string, estStayMinutes = 60, excludeId?: string) {
    const windowCheck = validateOperationalTimeWindow(scheduledTime, estStayMinutes, this.data.config);
    if (!windowCheck.valid) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, date, this.data.config, scheduledTime, 4);
      return {
        valid: false,
        reason: windowCheck.reason,
        suggestions,
      };
    }

    const capCheck = validateYardCapacity(this.data.appointments, { date, scheduledTime, estStayMinutes, excludeId }, this.data.config);
    if (!capCheck.valid) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, date, this.data.config, scheduledTime, 4);
      return {
        valid: false,
        message: capCheck.message,
        maxProjected: capCheck.maxProjected,
        conflictTime: capCheck.conflictTime,
        suggestions,
      };
    }

    return { valid: true, maxProjected: capCheck.maxProjected };
  }

  createAppointment(payload: any) {
    const {
      plate,
      driverName,
      driverPhone,
      carrierId,
      carrierName,
      cargoType,
      priority = 'MEDIA',
      date = TODAY_DATE,
      scheduledTime,
      estUnloadMinutes = 45,
      estStayMinutes = 60,
      dockId,
      notes,
      allowOverride = false,
      overrideReason,
      userName = 'Operador TMS',
      userRole = 'GESTOR',
    } = payload;

    if (!plate || !driverName || !scheduledTime) {
      return { success: false, error: 'Placa, motorista e horário são obrigatórios.' };
    }

    // 1. Operational window check
    const windowCheck = validateOperationalTimeWindow(scheduledTime, Number(estStayMinutes), this.data.config);
    if (!windowCheck.valid) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, date, this.data.config, scheduledTime);
      return { success: false, error: windowCheck.reason, suggestions };
    }

    // 2. Dock conflict check if dock specified
    if (dockId) {
      const dockConflict = validateDockConflict(this.data.appointments, Number(dockId), date, scheduledTime, Number(estUnloadMinutes));
      if (!dockConflict.valid) {
        return {
          success: false,
          error: `Conflito de doca: Doca ${dockId.toString().padStart(2, '0')} já está reservada para o veículo ${dockConflict.conflictWith?.plate} neste horário.`,
        };
      }
    }

    // 3. Yard capacity check
    const capCheck = validateYardCapacity(this.data.appointments, { date, scheduledTime, estStayMinutes: Number(estStayMinutes) }, this.data.config);
    if (!capCheck.valid && !allowOverride) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, date, this.data.config, scheduledTime);
      return {
        success: false,
        error: capCheck.message,
        overcapacity: true,
        conflictTime: capCheck.conflictTime,
        maxProjected: capCheck.maxProjected,
        suggestions,
      };
    }

    const nextCodeNum = this.data.appointments.length + 101;
    const newApp: Appointment = {
      id: `app-${Date.now()}`,
      code: `ML-0${nextCodeNum}`,
      plate: plate.toUpperCase().trim(),
      driverName,
      driverPhone: driverPhone || '(11) 99999-0000',
      carrierId: carrierId || 'c-01',
      carrierName: carrierName || 'Move Log Frota Própria',
      cargoType: cargoType || 'Carga Geral',
      priority,
      date,
      scheduledTime,
      estUnloadMinutes: Number(estUnloadMinutes),
      estStayMinutes: Number(estStayMinutes),
      dockId: dockId ? Number(dockId) : undefined,
      status: 'AGENDADO',
      notes,
      overrideReason: allowOverride ? overrideReason : undefined,
      history: [
        {
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          action: allowOverride ? 'Agendamento com Sobrecarga Autorizada' : 'Agendamento Criado',
          details: allowOverride
            ? `Capacidade excedida (${capCheck.maxProjected}/8). Justificativa: ${overrideReason}`
            : `Agendado para ${scheduledTime} com permanência estimada de ${estStayMinutes} min.`,
          user: userName,
        },
      ],
    };

    this.data.appointments.push(newApp);
    this.logAction(
      allowOverride ? 'Agendamento com Sobrecarga Manual' : 'Novo Agendamento Criado',
      `Veículo ${newApp.plate} (${newApp.carrierName}) agendado para ${newApp.scheduledTime}.${
        allowOverride ? ` Motivo: ${overrideReason}` : ''
      }`,
      userName,
      userRole,
      allowOverride
    );
    this.save();
    return { success: true, appointment: newApp };
  }

  updateAppointment(id: string, payload: any) {
    const index = this.data.appointments.findIndex((a) => a.id === id);
    if (index === -1) return { success: false, error: 'Agendamento não encontrado.' };

    const current = this.data.appointments[index];
    const {
      scheduledTime = current.scheduledTime,
      estStayMinutes = current.estStayMinutes,
      estUnloadMinutes = current.estUnloadMinutes,
      dockId = current.dockId,
      priority = current.priority,
      driverName = current.driverName,
      driverPhone = current.driverPhone,
      cargoType = current.cargoType,
      notes = current.notes,
      allowOverride = false,
      overrideReason,
      userName = 'Operador TMS',
      userRole = 'GESTOR',
    } = payload;

    const windowCheck = validateOperationalTimeWindow(scheduledTime, Number(estStayMinutes), this.data.config);
    if (!windowCheck.valid) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, current.date, this.data.config, scheduledTime);
      return { success: false, error: windowCheck.reason, suggestions };
    }

    const capCheck = validateYardCapacity(
      this.data.appointments,
      { date: current.date, scheduledTime, estStayMinutes: Number(estStayMinutes), excludeId: id },
      this.data.config
    );

    if (!capCheck.valid && !allowOverride) {
      const suggestions = suggestAvailableSlots(this.data.appointments, estStayMinutes, current.date, this.data.config, scheduledTime);
      return {
        success: false,
        error: capCheck.message,
        overcapacity: true,
        maxProjected: capCheck.maxProjected,
        suggestions,
      };
    }

    const updated: Appointment = {
      ...current,
      scheduledTime,
      estStayMinutes: Number(estStayMinutes),
      estUnloadMinutes: Number(estUnloadMinutes),
      dockId: dockId ? Number(dockId) : undefined,
      priority,
      driverName,
      driverPhone,
      cargoType,
      notes,
    };

    updated.history.push({
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      action: allowOverride ? 'Alteração com Sobrecarga Autorizada' : 'Agendamento Atualizado',
      details: `Horário: ${scheduledTime}, Doca: ${dockId || 'N/A'}, Prioridade: ${priority}.${
        allowOverride ? ` Justificativa: ${overrideReason}` : ''
      }`,
      user: userName,
    });

    this.data.appointments[index] = updated;
    this.logAction(
      allowOverride ? 'Alteração com Sobrecarga de Pátio' : 'Agendamento Editado',
      `Veículo ${updated.plate} readequado para ${updated.scheduledTime}.`,
      userName,
      userRole,
      allowOverride
    );
    this.save();
    return { success: true, appointment: updated };
  }

  cancelAppointment(id: string, userName = 'Operador TMS') {
    const target = this.data.appointments.find((a) => a.id === id);
    if (!target) return false;

    target.status = 'CANCELADO';
    target.history.push({
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      action: 'Agendamento Cancelado',
      details: 'Operação cancelada pelo usuário.',
      user: userName,
    });

    if (target.yardSpotId) {
      const spot = this.data.yardSpots.find((s) => s.id === target.yardSpotId);
      if (spot) {
        spot.isOccupied = false;
        spot.currentAppointmentId = undefined;
        spot.plate = undefined;
        spot.status = 'LIVRE';
      }
    }

    if (target.dockId) {
      const dock = this.data.docks.find((d) => d.id === target.dockId);
      if (dock && dock.currentAppointmentId === id) {
        dock.status = 'DISPONIVEL';
        dock.currentAppointmentId = undefined;
        dock.plate = undefined;
      }
    }

    this.data.waitingQueue = this.data.waitingQueue.filter((q) => q.appointmentId !== id);
    this.logAction('Agendamento Cancelado', `Agendamento ${target.code} (${target.plate}) cancelado.`, userName);
    this.save();
    return true;
  }

  performCheckin(appointmentId: string, realArrivalTime: string, notes?: string, userName = 'Portaria Move Log', userRole = 'OPERADOR_PATIO') {
    const target = this.data.appointments.find((a) => a.id === appointmentId);
    if (!target) return { success: false, error: 'Agendamento não encontrado.' };

    const arrivalTime = realArrivalTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const delta = calculateCheckinDelta(target.scheduledTime, arrivalTime);

    const availableSpot = this.data.yardSpots.find((s) => !s.isOccupied && s.status !== 'MANUTENCAO');
    if (!availableSpot) {
      return {
        success: false,
        error: 'Pátio completamente lotado (8/8 veículos). Aguarde a liberação de uma vaga na portaria.',
      };
    }

    availableSpot.isOccupied = true;
    availableSpot.currentAppointmentId = target.id;
    availableSpot.plate = target.plate;
    availableSpot.driver = target.driverName;
    availableSpot.carrier = target.carrierName;
    availableSpot.cargoType = target.cargoType;
    availableSpot.entryTime = arrivalTime;
    availableSpot.stayMinutes = 0;
    availableSpot.status = 'OCUPADO';
    availableSpot.dockTarget = target.dockId;

    target.realArrivalTime = arrivalTime;
    target.checkinNotes = notes;
    target.delayMinutes = delta.delayMinutes;
    target.isEarly = delta.isEarly;
    target.yardSpotId = availableSpot.id;

    let nextStatus: any = 'NO_PATIO';
    if (target.dockId) {
      const targetDock = this.data.docks.find((d) => d.id === target.dockId);
      if (targetDock && targetDock.status === 'DISPONIVEL') {
        nextStatus = 'EM_DESCARREGAMENTO';
        targetDock.status = 'EM_DESCARREGAMENTO';
        targetDock.currentAppointmentId = target.id;
        targetDock.plate = target.plate;
        targetDock.driver = target.driverName;
        targetDock.carrier = target.carrierName;
        targetDock.cargoType = target.cargoType;
        targetDock.entryTime = arrivalTime;
        targetDock.unloadStartTime = arrivalTime;
        targetDock.estUnloadMinutes = target.estUnloadMinutes;
        targetDock.elapsedMinutes = 0;
        targetDock.remainingMinutes = target.estUnloadMinutes;
        target.dockStartTime = arrivalTime;
      } else {
        nextStatus = 'AGUARDANDO_DOCA';
        this.data.waitingQueue.push({
          id: `q-${Date.now()}`,
          appointmentId: target.id,
          plate: target.plate,
          driver: target.driverName,
          carrier: target.carrierName,
          cargoType: target.cargoType,
          priority: target.priority,
          scheduledTime: target.scheduledTime,
          arrivalTime,
          waitingMinutes: 0,
          estServiceTime: minutesToTime(timeToMinutes(arrivalTime) + 20),
          status: 'AGUARDANDO',
        });
      }
    } else {
      nextStatus = 'AGUARDANDO_DOCA';
      this.data.waitingQueue.push({
        id: `q-${Date.now()}`,
        appointmentId: target.id,
        plate: target.plate,
        driver: target.driverName,
        carrier: target.carrierName,
        cargoType: target.cargoType,
        priority: target.priority,
        scheduledTime: target.scheduledTime,
        arrivalTime,
        waitingMinutes: 0,
        estServiceTime: minutesToTime(timeToMinutes(arrivalTime) + 20),
        status: 'AGUARDANDO',
      });
    }

    target.status = nextStatus;
    target.history.push({
      timestamp: arrivalTime,
      action: 'Check-in Realizado na Portaria',
      details: `${delta.message} Alocado na Vaga ${availableSpot.spotNumber}.`,
      user: userName,
    });

    this.logAction(
      'Check-in de Veículo',
      `Check-in concluído para ${target.plate}. ${delta.message} Vaga: ${availableSpot.spotNumber}.`,
      userName,
      userRole
    );

    this.save();
    return { success: true, delta, yardSpot: availableSpot, appointment: target };
  }

  allocateDock(dockId: number, appointmentId: string, userName = 'Operador de Doca', userRole = 'OPERADOR_DOCA') {
    const dock = this.data.docks.find((d) => d.id === Number(dockId));
    if (!dock) return { success: false, error: 'Doca não encontrada.' };
    if (dock.status === 'EM_DESCARREGAMENTO' || dock.status === 'MANUTENCAO') {
      return { success: false, error: `Doca ${dock.dockNumber} já está ocupada ou em manutenção.` };
    }

    const appItem = this.data.appointments.find((a) => a.id === appointmentId);
    if (!appItem) return { success: false, error: 'Veículo não encontrado.' };

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    dock.status = 'EM_DESCARREGAMENTO';
    dock.currentAppointmentId = appItem.id;
    dock.plate = appItem.plate;
    dock.driver = appItem.driverName;
    dock.carrier = appItem.carrierName;
    dock.cargoType = appItem.cargoType;
    dock.entryTime = nowTime;
    dock.unloadStartTime = nowTime;
    dock.estUnloadMinutes = appItem.estUnloadMinutes || 45;
    dock.elapsedMinutes = 0;
    dock.remainingMinutes = appItem.estUnloadMinutes || 45;

    appItem.dockId = dock.id;
    appItem.status = 'EM_DESCARREGAMENTO';
    appItem.dockStartTime = nowTime;

    this.data.waitingQueue = this.data.waitingQueue.filter((q) => q.appointmentId !== appItem.id);

    appItem.history.push({
      timestamp: nowTime,
      action: 'Alocação na Doca',
      details: `Direcionado para a Doca ${dock.dockNumber}. Início da descarga.`,
      user: userName,
    });

    this.logAction('Alocação de Doca', `Veículo ${appItem.plate} posicionado na Doca ${dock.dockNumber}.`, userName, userRole);
    this.save();
    return { success: true, dock, appointment: appItem };
  }

  finishUnload(dockId: number, userName = 'Operador de Doca', userRole = 'OPERADOR_DOCA') {
    const dock = this.data.docks.find((d) => d.id === Number(dockId));
    if (!dock) return { success: false, error: 'Doca não encontrada.' };

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const appItem = this.data.appointments.find((a) => a.id === dock.currentAppointmentId);

    if (appItem) {
      appItem.status = 'FINALIZADO';
      appItem.dockFinishTime = nowTime;
      appItem.departureTime = nowTime;

      if (appItem.yardSpotId) {
        const spot = this.data.yardSpots.find((s) => s.id === appItem.yardSpotId);
        if (spot) {
          spot.isOccupied = false;
          spot.currentAppointmentId = undefined;
          spot.plate = undefined;
          spot.status = 'LIVRE';
        }
      }

      appItem.history.push({
        timestamp: nowTime,
        action: 'Descarga Finalizada',
        details: `Descarga concluída com sucesso na Doca ${dock.dockNumber}. Veículo liberado para saída.`,
        user: userName,
      });

      this.logAction('Descarga Concluída', `Veículo ${appItem.plate} finalizou descarregamento na Doca ${dock.dockNumber}.`, userName, userRole);
    }

    dock.status = 'DISPONIVEL';
    dock.currentAppointmentId = undefined;
    dock.plate = undefined;
    dock.driver = undefined;
    dock.carrier = undefined;
    dock.cargoType = undefined;
    dock.entryTime = undefined;
    dock.unloadStartTime = undefined;
    dock.elapsedMinutes = undefined;
    dock.remainingMinutes = undefined;

    let nextQueueTruck: WaitingQueueItem | undefined;
    if (this.data.config.autoQueueAdvance && this.data.waitingQueue.length > 0) {
      const priorityWeight: Record<string, number> = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
      this.data.waitingQueue.sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));
      nextQueueTruck = this.data.waitingQueue[0];
    }

    this.save();
    return { success: true, dock, finishedTruck: appItem, nextRecommendedInQueue: nextQueueTruck };
  }

  moveYardSpot(fromSpotId: number, toSpotId: number, userName = 'Operador de Pátio', userRole = 'OPERADOR_PATIO') {
    const fromSpot = this.data.yardSpots.find((s) => s.id === Number(fromSpotId));
    const toSpot = this.data.yardSpots.find((s) => s.id === Number(toSpotId));

    if (!fromSpot || !toSpot) return { success: false, error: 'Vaga de pátio não encontrada.' };
    if (toSpot.isOccupied) return { success: false, error: `Vaga de destino ${toSpot.spotNumber} já está ocupada.` };

    toSpot.isOccupied = true;
    toSpot.currentAppointmentId = fromSpot.currentAppointmentId;
    toSpot.plate = fromSpot.plate;
    toSpot.driver = fromSpot.driver;
    toSpot.carrier = fromSpot.carrier;
    toSpot.cargoType = fromSpot.cargoType;
    toSpot.entryTime = fromSpot.entryTime;
    toSpot.stayMinutes = fromSpot.stayMinutes;
    toSpot.status = 'OCUPADO';
    toSpot.dockTarget = fromSpot.dockTarget;

    fromSpot.isOccupied = false;
    fromSpot.currentAppointmentId = undefined;
    fromSpot.plate = undefined;
    fromSpot.driver = undefined;
    fromSpot.carrier = undefined;
    fromSpot.status = 'LIVRE';

    if (toSpot.currentAppointmentId) {
      const appItem = this.data.appointments.find((a) => a.id === toSpot.currentAppointmentId);
      if (appItem) {
        appItem.yardSpotId = toSpot.id;
        appItem.history.push({
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          action: 'Movimentação no Pátio',
          details: `Veículo transferido da vaga ${fromSpot.spotNumber} para a vaga ${toSpot.spotNumber}.`,
          user: userName,
        });
      }
    }

    this.logAction('Movimentação de Pátio', `Veículo transferido da vaga ${fromSpot.spotNumber} para ${toSpot.spotNumber}.`, userName, userRole);
    this.save();
    return { success: true, fromSpot, toSpot };
  }

  getOptimizationPreview(date = TODAY_DATE): OptimizationResult {
    return optimizeDailySchedule(this.data.appointments, date, this.data.config);
  }

  applyOptimization(date = TODAY_DATE, userName = 'Gestor Logístico', userRole = 'GESTOR') {
    const result = optimizeDailySchedule(this.data.appointments, date, this.data.config);
    let appliedCount = 0;

    for (const suggestion of result.suggestions) {
      const target = this.data.appointments.find((a) => a.id === suggestion.appointmentId);
      if (target && (target.status === 'AGENDADO' || target.status === 'ATRASADO')) {
        target.scheduledTime = suggestion.suggestedScheduledTime;
        target.dockId = suggestion.suggestedDock;
        target.history.push({
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          action: 'Otimização de Agenda Aplicada',
          details: `Horário ajustado para ${suggestion.suggestedScheduledTime}, Doca sugerida: ${suggestion.suggestedDock}. Motivo: ${suggestion.reason}`,
          user: userName,
        });
        appliedCount++;
      }
    }

    this.logAction(
      'Otimização de Agenda Executada',
      `Agenda dos 32 caminhões rebalanceada. ${appliedCount} veículos reposicionados para eliminação de picos no pátio.`,
      userName,
      userRole
    );
    this.save();
    return { success: true, appliedCount, result };
  }

  updateConfig(newConfig: OperationalConfig, userName = 'Administrador') {
    this.data.config = { ...this.data.config, ...newConfig };
    this.logAction('Configurações Atualizadas', 'Parâmetros operacionais do CD Move Log modificados.', userName, 'ADMIN');
    this.save();
    return { success: true, config: this.data.config };
  }
}

export const logisticsService = new LogisticsService();
