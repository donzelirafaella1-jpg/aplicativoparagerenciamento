/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogisticsProvider, useLogistics } from './context/LogisticsContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { AuditHistoryModal } from './components/common/AuditHistoryModal';
import { AppointmentModal } from './components/appointments/AppointmentModal';
import { CheckinModal } from './components/checkin/CheckinModal';
import { OptimizeModal } from './components/optimize/OptimizeModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { ScheduleView } from './components/schedule/ScheduleView';
import { AppointmentsView } from './components/appointments/AppointmentsView';
import { YardView } from './components/yard/YardView';
import { DocksView } from './components/docks/DocksView';
import { QueueView } from './components/queue/QueueView';
import { CarriersView } from './components/entities/CarriersView';
import { DriversView } from './components/entities/DriversView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const { activeTab } = useLogistics();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'appointments':
        return <AppointmentsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'yard':
        return <YardView />;
      case 'docks':
        return <DocksView />;
      case 'queue':
        return <QueueView />;
      case 'carriers':
        return <CarriersView />;
      case 'drivers':
        return <DriversView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* Move Log Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50/60">
          {renderActiveView()}
        </main>
      </div>

      {/* Modals & Overlays */}
      <AppointmentModal />
      <CheckinModal />
      <OptimizeModal />
      <AuditHistoryModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <LogisticsProvider>
      <MainLayout />
    </LogisticsProvider>
  );
}
