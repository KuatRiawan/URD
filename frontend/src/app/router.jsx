import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuth } from './providers/AuthProvider.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoadingState } from '../components/feedback/StateViews.jsx';

import { LoginPage } from '../features/auth/LoginPage.jsx';
import { VerificationPage } from '../features/public/VerificationPage.jsx';
import { ClientPortalPage } from '../features/public/ClientPortalPage.jsx';
import { ForbiddenPage } from '../features/auth/ForbiddenPage.jsx';
import { DashboardPage } from '../features/dashboard/DashboardPage.jsx';
import { ClientsPage } from '../features/clients/ClientsPage.jsx';
import { ObjectsPage } from '../features/objects/ObjectsPage.jsx';
import { OrdersPage } from '../features/orders/OrdersPage.jsx';
import { SchedulePage } from '../features/scheduling/SchedulePage.jsx';
import { InspectionsPage } from '../features/inspections/InspectionsPage.jsx';
import { BapPage } from '../features/bap/BapPage.jsx';
import { LhppPage } from '../features/lhpp/LhppPage.jsx';
import { HistoryPage } from '../features/history/HistoryPage.jsx';
import { SuketPage } from '../features/suket/SuketPage.jsx';
import { RemindersPage } from '../features/reminders/RemindersPage.jsx';
import { UsersPage } from '../features/users/UsersPage.jsx';
import { NotificationsPage } from '../features/notifications/NotificationsPage.jsx';
import { AuditLogPage } from '../features/audit-log/AuditLogPage.jsx';
import { SettingsPage } from '../features/settings/SettingsPage.jsx';

export function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8] p-6">
        <LoadingState message="Memeriksa sesi keamanan PT Upaya Riksa Daya..." />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to="/app/dashboard" replace />;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5F8] p-6">
        <LoadingState message="Memverifikasi hak akses pengguna..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function RequireRole({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ForbiddenPage />;
  }
  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verifikasi/:code" element={<VerificationPage />} />
      <Route path="/portal/:token" element={<ClientPortalPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="clients"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <ClientsPage />
            </RequireRole>
          }
        />
        <Route
          path="objects"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <ObjectsPage />
            </RequireRole>
          }
        />
        <Route
          path="orders"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <OrdersPage />
            </RequireRole>
          }
        />
        <Route
          path="schedule"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <SchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="scheduling"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <SchedulePage />
            </RequireRole>
          }
        />
        <Route
          path="inspections"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <InspectionsPage />
            </RequireRole>
          }
        />
        <Route
          path="bap"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <BapPage />
            </RequireRole>
          }
        />
        <Route
          path="lhpp"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <LhppPage />
            </RequireRole>
          }
        />
        <Route
          path="history"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']}>
              <HistoryPage />
            </RequireRole>
          }
        />
        <Route
          path="suket"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN']}>
              <SuketPage />
            </RequireRole>
          }
        />
        <Route
          path="reminders"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN']}>
              <RemindersPage />
            </RequireRole>
          }
        />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route
          path="users"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM']}>
              <UsersPage />
            </RequireRole>
          }
        />
        <Route
          path="audit-logs"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'PIMPINAN']}>
              <AuditLogPage />
            </RequireRole>
          }
        />
        <Route
          path="audit-log"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'PIMPINAN']}>
              <AuditLogPage />
            </RequireRole>
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
