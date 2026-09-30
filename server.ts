import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Appointment,
  Carrier,
  Dock,
  Driver,
  OperationalConfig,
  WaitingQueueItem,
  YardSpot,
  AuditLog,
} from './src/types/logistics.ts';
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
} from './src/lib/logistics-engine.ts';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_CARRIERS,
  INITIAL_DOCKS,
  INITIAL_DRIVERS,
  INITIAL_QUEUE,
  INITIAL_YARD_SPOTS,
  TODAY_DATE,
} from './src/data/seed-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Database Store
class LogisticsStore {
  appointments: Appointment[] = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
  yardSpots: YardSpot[] = JSON.parse(JSON.stringify(INITIAL_YARD_SPOTS));
  docks: Dock[] = JSON.parse(JSON.stringify(INITIAL_DOCKS));
  waitingQueue: WaitingQueueItem[] = JSON.parse(JSON.stringify(INITIAL_QUEUE));
  carriers: Carrier[] = JSON.parse(JSON.stringify(INITIAL_CARRIERS));
  drivers: Driver[] = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
  config: OperationalConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  auditLogs: AuditLog[] = [
    {
      id: 'log-01',
      timestamp: '07:00:00',
      action: 'Abertura de Turno CD Move Log',
      details: 'Operação matutina iniciada com 14 docas ativas e 8 vagas de pátio.',
      user: 'Sistema Central',
      role: 'ADMIN',
    },
  ];

  reset() {
    this.appointments = JSON.parse(JSON.stringify(INITIAL_APPOINTMENTS));
    this.yardSpots = JSON.parse(JSON.stringify(INITIAL_YARD_SPOTS));
    this.docks = JSON.parse(JSON.stringify(INITIAL_DOCKS));
    this.waitingQueue = JSON.parse(JSON.stringify(INITIAL_QUEUE));
    this.carriers = JSON.parse(JSON.stringify(INITIAL_CARRIERS));
    this.drivers = JSON.parse(JSON.stringify(INITIAL_DRIVERS));
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      action: 'Reinicialização de Dados',
      details: 'Grade de 32 caminhões e pátio restaurados para estado padrão.',
      user: 'Gestor Logístico',
      role: 'GESTOR',
    });
  }

  logAction(action: string, details: string, user: string = 'Operador TMS', role: any = 'GESTOR', isOvercapacityOverride = false) {
    this.auditLogs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      action,
      details,
      user,
      role,
      isOvercapacityOverride,
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }
}

const store = new LogisticsStore();

const app = express();
app.use(express.json());

// API Endpoints

// 1. Get full operational state
app.get('/api/state', (req: Request, res: Response) => {
  const date = (req.query.date as string) || TODAY_DATE;
  const metrics = calculateOperationalKPIs(store.appointments, date, store.config);
  const timeline = calculateYardOccupancyTimeline(store.appointments, date, undefined, store.config);

  res.json({
    date,
    config: store.config,
    metrics,
    timeline,
    appointments: store.appointments,
    yardSpots: store.yardSpots,
    docks: store.docks,
    waitingQueue: store.waitingQueue,
    carriers: store.carriers,
    drivers: store.drivers,
    auditLogs: store.auditLogs.slice(0, 50),
  });
});

// 2. Validate yard capacity / check slot availability
app.post('/api/appointments/check-capacity', (req: Request, res: Response) => {
  const { date = TODAY_DATE, scheduledTime, estStayMinutes = 60, excludeId } = req.body;

  // Window validation
  const windowCheck = validateOperationalTimeWindow(scheduledTime, estStayMinutes, store.config);
  if (!windowCheck.valid) {
    const suggestions = suggestAvailableSlots(
      store.appointments,
      estStayMinutes,
      date,
      store.config,
      scheduledTime,
      4
    );
    return res.status(400).json({
      valid: false,
      reason: windowCheck.reason,
      suggestions,
    });
  }

  // Capacity validation
  const capCheck = validateYardCapacity(
    store.appointments,
    { date, scheduledTime, estStayMinutes, excludeId },
    store.config
  );

  if (!capCheck.valid) {
    const suggestions = suggestAvailableSlots(
      store.appointments,
      estStayMinutes,
      date,
      store.config,
      scheduledTime,
      4
    );
    return res.status(400).json({
      valid: false,
      message: capCheck.message,
      maxProjected: capCheck.maxProjected,
      conflictTime: capCheck.conflictTime,
      suggestions,
    });
  }

  res.json({
    valid: true,
    maxProjected: capCheck.maxProjected,
  });
});

// 3. Create appointment
app.post('/api/appointments', (req: Request, res: Response) => {
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
  } = req.body;

  if (!plate || !driverName || !scheduledTime) {
    return res.status(400).json({ error: 'Placa, motorista e horário são obrigatórios.' });
  }

  // 1. Operational window check
  const windowCheck = validateOperationalTimeWindow(scheduledTime, estStayMinutes, store.config);
  if (!windowCheck.valid) {
    const suggestions = suggestAvailableSlots(store.appointments, estStayMinutes, date, store.config, scheduledTime);
    return res.status(400).json({
      error: windowCheck.reason,
      suggestions,
    });
  }

  // 2. Dock conflict check if dock specified
  if (dockId) {
    const dockConflict = validateDockConflict(store.appointments, dockId, date, scheduledTime, estUnloadMinutes);
    if (!dockConflict.valid) {
      return res.status(400).json({
        error: `Conflito de doca: Doca ${dockId.toString().padStart(2, '0')} já está reservada para o veículo ${dockConflict.conflictWith?.plate} neste horário.`,
      });
    }
  }

  // 3. Yard capacity check
  const capCheck = validateYardCapacity(
    store.appointments,
    { date, scheduledTime, estStayMinutes },
    store.config
  );

  if (!capCheck.valid && !allowOverride) {
    const suggestions = suggestAvailableSlots(store.appointments, estStayMinutes, date, store.config, scheduledTime);
    return res.status(400).json({
      error: capCheck.message,
      overcapacity: true,
      conflictTime: capCheck.conflictTime,
      maxProjected: capCheck.maxProjected,
      suggestions,
    });
  }

  const nextCodeNum = store.appointments.length + 101;
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

  store.appointments.push(newApp);

  store.logAction(
    allowOverride ? 'Agendamento com Sobrecarga Manual' : 'Novo Agendamento Criado',
    `Veículo ${newApp.plate} (${newApp.carrierName}) agendado para ${newApp.scheduledTime}.${
      allowOverride ? ` Motivo: ${overrideReason}` : ''
    }`,
    userName,
    userRole,
    allowOverride
  );

  res.status(201).json(newApp);
});

// 4. Update appointment
app.put('/api/appointments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = store.appointments.findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const current = store.appointments[index];
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
  } = req.body;

  // Window validation
  const windowCheck = validateOperationalTimeWindow(scheduledTime, estStayMinutes, store.config);
  if (!windowCheck.valid) {
    const suggestions = suggestAvailableSlots(store.appointments, estStayMinutes, current.date, store.config, scheduledTime);
    return res.status(400).json({ error: windowCheck.reason, suggestions });
  }

  // Yard capacity validation
  const capCheck = validateYardCapacity(
    store.appointments,
    { date: current.date, scheduledTime, estStayMinutes, excludeId: id },
    store.config
  );

  if (!capCheck.valid && !allowOverride) {
    const suggestions = suggestAvailableSlots(store.appointments, estStayMinutes, current.date, store.config, scheduledTime);
    return res.status(400).json({
      error: capCheck.message,
      overcapacity: true,
      maxProjected: capCheck.maxProjected,
      suggestions,
    });
  }

  // Update appointment
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

  store.appointments[index] = updated;

  store.logAction(
    allowOverride ? 'Alteração com Sobrecarga de Pátio' : 'Agendamento Editado',
    `Veículo ${updated.plate} readequado para ${updated.scheduledTime}.`,
    userName,
    userRole,
    allowOverride
  );

  res.json(updated);
});

// 5. Cancel appointment
app.delete('/api/appointments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const appIndex = store.appointments.findIndex((a) => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }

  const target = store.appointments[appIndex];
  target.status = 'CANCELADO';
  target.history.push({
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    action: 'Agendamento Cancelado',
    details: 'Operação cancelada pelo usuário.',
    user: req.body.userName || 'Operador TMS',
  });

  // Release any yard spot
  if (target.yardSpotId) {
    const spot = store.yardSpots.find((s) => s.id === target.yardSpotId);
    if (spot) {
      spot.isOccupied = false;
      spot.currentAppointmentId = undefined;
      spot.plate = undefined;
      spot.status = 'LIVRE';
    }
  }

  // Release dock if any
  if (target.dockId) {
    const dock = store.docks.find((d) => d.id === target.dockId);
    if (dock && dock.currentAppointmentId === id) {
      dock.status = 'DISPONIVEL';
      dock.currentAppointmentId = undefined;
      dock.plate = undefined;
    }
  }

  // Remove from queue if any
  store.waitingQueue = store.waitingQueue.filter((q) => q.appointmentId !== id);

  store.logAction('Agendamento Cancelado', `Agendamento ${target.code} (${target.plate}) cancelado.`, req.body.userName || 'Operador TMS');

  res.json({ success: true, appointment: target });
});

// 6. Check-in endpoint with automatic delta calculation
app.post('/api/checkin', (req: Request, res: Response) => {
  const { appointmentId, realArrivalTime, notes, userName = 'Portaria Move Log', userRole = 'OPERADOR_PATIO' } = req.body;

  const target = store.appointments.find((a) => a.id === appointmentId);
  if (!target) {
    return res.status(404).json({ error: 'Agendamento não encontrado para check-in.' });
  }

  const arrivalTime = realArrivalTime || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const delta = calculateCheckinDelta(target.scheduledTime, arrivalTime);

  // Check if yard is currently full (all 8 spots occupied)
  const availableSpot = store.yardSpots.find((s) => !s.isOccupied && s.status !== 'MANUTENCAO');
  if (!availableSpot) {
    return res.status(400).json({
      error: 'Pátio completamente lotado (8/8 veículos). Aguarde a liberação de uma vaga na portaria.',
      fullYard: true,
    });
  }

  // Assign yard spot
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

  // Determine next status: if dock is assigned & available, proceed to dock or queue
  let nextStatus: any = 'NO_PATIO';
  if (target.dockId) {
    const targetDock = store.docks.find((d) => d.id === target.dockId);
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
      // Add to waiting queue
      store.waitingQueue.push({
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
    // No dock assigned yet, put in waiting queue
    nextStatus = 'AGUARDANDO_DOCA';
    store.waitingQueue.push({
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

  store.logAction(
    'Check-in de Veículo',
    `Check-in concluído para ${target.plate}. ${delta.message} Vaga: ${availableSpot.spotNumber}.`,
    userName,
    userRole
  );

  res.json({
    success: true,
    appointment: target,
    delta,
    yardSpot: availableSpot,
  });
});

// 7. Dock Management: Allocate dock to truck
app.post('/api/docks/allocate', (req: Request, res: Response) => {
  const { dockId, appointmentId, userName = 'Operador de Doca', userRole = 'OPERADOR_DOCA' } = req.body;

  const dock = store.docks.find((d) => d.id === Number(dockId));
  if (!dock) return res.status(404).json({ error: 'Doca não encontrada.' });

  if (dock.status === 'EM_DESCARREGAMENTO' || dock.status === 'MANUTENCAO') {
    return res.status(400).json({ error: `Doca ${dock.dockNumber} já está ocupada ou em manutenção.` });
  }

  const appItem = store.appointments.find((a) => a.id === appointmentId);
  if (!appItem) return res.status(404).json({ error: 'Veículo não encontrado.' });

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

  // Remove from waiting queue if in it
  store.waitingQueue = store.waitingQueue.filter((q) => q.appointmentId !== appItem.id);

  appItem.history.push({
    timestamp: nowTime,
    action: 'Alocação na Doca',
    details: `Direcionado para a Doca ${dock.dockNumber}. Início da descarga.`,
    user: userName,
  });

  store.logAction(
    'Alocação de Doca',
    `Veículo ${appItem.plate} posicionado na Doca ${dock.dockNumber}.`,
    userName,
    userRole
  );

  res.json({ success: true, dock, appointment: appItem });
});

// 8. Dock Management: Finish unload & release dock
app.post('/api/docks/finish-unload', (req: Request, res: Response) => {
  const { dockId, userName = 'Operador de Doca', userRole = 'OPERADOR_DOCA' } = req.body;

  const dock = store.docks.find((d) => d.id === Number(dockId));
  if (!dock) return res.status(404).json({ error: 'Doca não encontrada.' });

  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const appItem = store.appointments.find((a) => a.id === dock.currentAppointmentId);

  if (appItem) {
    appItem.status = 'FINALIZADO';
    appItem.dockFinishTime = nowTime;
    appItem.departureTime = nowTime;

    // Free yard spot
    if (appItem.yardSpotId) {
      const spot = store.yardSpots.find((s) => s.id === appItem.yardSpotId);
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

    store.logAction(
      'Descarga Concluída',
      `Veículo ${appItem.plate} finalizou descarregamento na Doca ${dock.dockNumber}.`,
      userName,
      userRole
    );
  }

  // Release dock
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

  // Auto-advance waiting queue if configured
  let nextQueueTruck: WaitingQueueItem | undefined;
  if (store.config.autoQueueAdvance && store.waitingQueue.length > 0) {
    // Sort by priority (URGENTE > ALTA > MEDIA > BAIXA)
    const priorityWeight: Record<string, number> = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
    store.waitingQueue.sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));
    nextQueueTruck = store.waitingQueue[0];
  }

  res.json({
    success: true,
    dock,
    finishedTruck: appItem,
    nextRecommendedInQueue: nextQueueTruck,
  });
});

// 9. Optimize Schedule Preview & Apply
app.post('/api/optimize', (req: Request, res: Response) => {
  const date = (req.body.date as string) || TODAY_DATE;
  const result = optimizeDailySchedule(store.appointments, date, store.config);
  res.json(result);
});

app.post('/api/optimize/apply', (req: Request, res: Response) => {
  const date = (req.body.date as string) || TODAY_DATE;
  const { userName = 'Gestor Logístico', userRole = 'GESTOR' } = req.body;
  const result = optimizeDailySchedule(store.appointments, date, store.config);

  let appliedCount = 0;
  for (const suggestion of result.suggestions) {
    const target = store.appointments.find((a) => a.id === suggestion.appointmentId);
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

  store.logAction(
    'Otimização de Agenda Executada',
    `Agenda dos 32 caminhões rebalanceada. ${appliedCount} veículos reposicionados para eliminação de picos no pátio.`,
    userName,
    userRole
  );

  res.json({
    success: true,
    appliedCount,
    result,
  });
});

// 10. Yard spot management (manual move)
app.post('/api/yard/move', (req: Request, res: Response) => {
  const { fromSpotId, toSpotId, userName = 'Operador de Pátio', userRole = 'OPERADOR_PATIO' } = req.body;

  const fromSpot = store.yardSpots.find((s) => s.id === Number(fromSpotId));
  const toSpot = store.yardSpots.find((s) => s.id === Number(toSpotId));

  if (!fromSpot || !toSpot) return res.status(404).json({ error: 'Vaga de pátio não encontrada.' });
  if (toSpot.isOccupied) return res.status(400).json({ error: `Vaga de destino ${toSpot.spotNumber} já está ocupada.` });

  // Move vehicle
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

  // Clear source
  fromSpot.isOccupied = false;
  fromSpot.currentAppointmentId = undefined;
  fromSpot.plate = undefined;
  fromSpot.driver = undefined;
  fromSpot.carrier = undefined;
  fromSpot.status = 'LIVRE';

  if (toSpot.currentAppointmentId) {
    const appItem = store.appointments.find((a) => a.id === toSpot.currentAppointmentId);
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

  store.logAction(
    'Movimentação de Pátio',
    `Veículo transferido da vaga ${fromSpot.spotNumber} para ${toSpot.spotNumber}.`,
    userName,
    userRole
  );

  res.json({ success: true, fromSpot, toSpot });
});

// 11. Configuration update
app.post('/api/config', (req: Request, res: Response) => {
  const newConfig: OperationalConfig = req.body;
  store.config = { ...store.config, ...newConfig };
  store.logAction('Configurações Atualizadas', 'Parâmetros operacionais do CD Move Log modificados.', req.body.userName || 'Administrador', 'ADMIN');
  res.json({ success: true, config: store.config });
});

// 12. Reset to 32 initial trucks seed
app.post('/api/reset', (req: Request, res: Response) => {
  store.reset();
  res.json({ success: true, message: 'Dados reinicializados com sucesso.' });
});

// Serve frontend in Vite dev mode or static production
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Vite Dev Server Middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Move Log TMS] Servidor operacional rodando na porta ${PORT}`);
  });
}

startServer();
