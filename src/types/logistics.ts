export type Priority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export type AppointmentStatus =
  | 'AGENDADO'
  | 'NO_PATIO'
  | 'AGUARDANDO_DOCA'
  | 'EM_DESCARREGAMENTO'
  | 'FINALIZADO'
  | 'ATRASADO'
  | 'CANCELADO';

export type DockStatus =
  | 'DISPONIVEL'
  | 'AGUARDANDO_VEICULO'
  | 'EM_DESCARREGAMENTO'
  | 'FINALIZADA'
  | 'MANUTENCAO';

export type UserRole =
  | 'ADMIN'
  | 'GESTOR'
  | 'OPERADOR_PATIO'
  | 'OPERADOR_DOCA'
  | 'LEITURA';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  role: UserRole;
  isOvercapacityOverride?: boolean;
}

export interface Appointment {
  id: string;
  code: string; // e.g. "ML-0101"
  plate: string;
  driverName: string;
  driverPhone: string;
  driverCpf?: string;
  carrierId: string;
  carrierName: string;
  cargoType: string;
  priority: Priority;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  realArrivalTime?: string; // HH:mm
  departureTime?: string; // HH:mm
  estUnloadMinutes: number;
  estStayMinutes: number;
  dockId?: number; // 1 to 14
  yardSpotId?: number; // 1 to 8
  status: AppointmentStatus;
  notes?: string;
  checkinNotes?: string;
  delayMinutes?: number; // positive = late, negative = early
  isEarly?: boolean;
  dockStartTime?: string;
  dockFinishTime?: string;
  history: {
    timestamp: string;
    action: string;
    details: string;
    user: string;
  }[];
  overrideReason?: string;
}

export interface YardSpot {
  id: number;
  spotNumber: string; // "P01" .. "P08"
  isOccupied: boolean;
  currentAppointmentId?: string;
  plate?: string;
  driver?: string;
  carrier?: string;
  cargoType?: string;
  entryTime?: string;
  stayMinutes?: number;
  status: 'LIVRE' | 'OCUPADO' | 'MANUTENCAO';
  dockTarget?: number;
}

export interface Dock {
  id: number;
  dockNumber: string; // "01" .. "14"
  status: DockStatus;
  currentAppointmentId?: string;
  plate?: string;
  driver?: string;
  carrier?: string;
  cargoType?: string;
  entryTime?: string;
  unloadStartTime?: string;
  estUnloadMinutes?: number;
  elapsedMinutes?: number;
  remainingMinutes?: number;
}

export interface WaitingQueueItem {
  id: string;
  appointmentId: string;
  plate: string;
  driver: string;
  carrier: string;
  cargoType: string;
  priority: Priority;
  scheduledTime: string;
  arrivalTime: string;
  waitingMinutes: number;
  estServiceTime: string;
  status: 'AGUARDANDO' | 'CHAMADO' | 'ALOCADO';
}

export interface Carrier {
  id: string;
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  totalTrips: number;
  delaysCount: number;
  onTimeRate: number; // percentage
  status: 'ATIVA' | 'INATIVA';
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  carrierName: string;
  defaultPlate: string;
  totalTrips: number;
  rating: number; // 1-5
  status: 'APTO' | 'EM_TRANSITO' | 'BLOQUEADO';
}

export interface OperationalConfig {
  companyName: string;
  yardCapacity: number; // 8
  totalDocks: number; // 14
  morningStart: string; // "07:00"
  morningEnd: string; // "11:00"
  lunchStart: string; // "11:00"
  lunchEnd: string; // "12:00"
  afternoonStart: string; // "12:00"
  afternoonEnd: string; // "16:00"
  defaultUnloadTime: number; // 45
  defaultStayTime: number; // 60
  allowManualOverbooking: boolean;
  autoQueueAdvance: boolean;
}

export interface OperationalMetrics {
  totalTrucks: number;
  scheduled: number;
  awaitingArrival: number;
  inYard: number;
  awaitingDock: number;
  unloading: number;
  finished: number;
  delayed: number;
  earlyArrivals: number;
  yardOccupied: number;
  yardCapacity: number;
  yardAvailable: number;
  yardOccupancyRate: number;
  docksOccupied: number;
  totalDocks: number;
  docksAvailable: number;
  docksOccupancyRate: number;
  nextAvailableSlot: string;
  avgWaitMinutes: number;
  avgUnloadMinutes: number;
  avgStayMinutes: number;
  morningCount: number;
  afternoonCount: number;
  capacityAlert: boolean;
}

export interface OptimizationSuggestion {
  appointmentId: string;
  code: string;
  plate: string;
  driverName: string;
  carrierName: string;
  priority: Priority;
  currentScheduledTime: string;
  suggestedScheduledTime: string;
  currentDock?: number;
  suggestedDock: number;
  estStayMinutes: number;
  estUnloadMinutes: number;
  timeShiftMinutes: number;
  reason: string;
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[];
  currentYardMaxOverlap: number;
  projectedYardMaxOverlap: number;
  currentPeakTime: string;
  projectedPeakTime: string;
  currentAvgWaitMinutes: number;
  projectedAvgWaitMinutes: number;
  totalTrucksAnalyzed: number;
  adjustedCount: number;
  impactSummary: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
}
