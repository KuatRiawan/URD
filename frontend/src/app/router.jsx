import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router';
import { useAuth } from './providers/AuthProvider.jsx';
import { AppLayout } from '../components/layout/AppLayout.jsx';
import { LoadingState } from '../components/feedback/StateViews.jsx';

import { LoginPage } from '../features/auth/LoginPage.jsx';

const loadPage = (importPage, exportName) =>
  lazy(() => importPage().then((module) => ({ default: module[exportName] })));

const VerificationPage = loadPage(() => import('../features/public/VerificationPage.jsx'), 'VerificationPage');
const ClientPortalPage = loadPage(() => import('../features/public/ClientPortalPage.jsx'), 'ClientPortalPage');
const ForbiddenPage = loadPage(() => import('../features/auth/ForbiddenPage.jsx'), 'ForbiddenPage');
const DashboardPage = loadPage(() => import('../features/dashboard/DashboardPage.jsx'), 'DashboardPage');
const ClientsPage = loadPage(() => import('../features/clients/ClientsPage.jsx'), 'ClientsPage');
const ObjectsPage = loadPage(() => import('../features/objects/ObjectsPage.jsx'), 'ObjectsPage');
const OrdersPage = loadPage(() => import('../features/orders/OrdersPage.jsx'), 'OrdersPage');
const SchedulePage = loadPage(() => import('../features/scheduling/SchedulePage.jsx'), 'SchedulePage');
const InspectionsPage = loadPage(() => import('../features/inspections/InspectionsPage.jsx'), 'InspectionsPage');
const BapPage = loadPage(() => import('../features/bap/BapPage.jsx'), 'BapPage');
const LhppPage = loadPage(() => import('../features/lhpp/LhppPage.jsx'), 'LhppPage');
const HistoryPage = loadPage(() => import('../features/history/HistoryPage.jsx'), 'HistoryPage');
const SuketPage = loadPage(() => import('../features/suket/SuketPage.jsx'), 'SuketPage');
const RemindersPage = loadPage(() => import('../features/reminders/RemindersPage.jsx'), 'RemindersPage');
const UsersPage = loadPage(() => import('../features/users/UsersPage.jsx'), 'UsersPage');
const NotificationsPage = loadPage(() => import('../features/notifications/NotificationsPage.jsx'), 'NotificationsPage');
const AuditLogPage = loadPage(() => import('../features/audit-log/AuditLogPage.jsx'), 'AuditLogPage');
const SettingsPage = loadPage(() => import('../features/settings/SettingsPage.jsx'), 'SettingsPage');
const DocumentDistributionPage = loadPage(() => import('../features/distributions/DocumentDistributionPage.jsx'), 'DocumentDistributionPage');
const IssuesPage = loadPage(() => import('../features/issues/IssuesPage.jsx'), 'IssuesPage');

const ROLE_ALIASES = {
  ADMIN_KANTOR: 'MARKETING',
  MARKETING: 'ADMIN_KANTOR',
  AHLI_K3: 'INSPECTOR',
  INSPECTOR: 'AHLI_K3',
  MANAGER: 'PIMPINAN',
  PIMPINAN: 'MANAGER'
};

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
  if (allowedRoles) {
    const userRole = user.role;
    const aliasRole = ROLE_ALIASES[userRole];
    const hasRole = allowedRoles.includes(userRole) || (aliasRole && allowedRoles.includes(aliasRole));
    if (!hasRole) {
      return <ForbiddenPage />;
    }
  }
  return children;
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingState message="Memuat halaman PT Upaya Riksa Daya..." />}>
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
          path="distributions"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'PIMPINAN', 'MANAGER']}>
              <DocumentDistributionPage />
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
          path="issues"
          element={
            <RequireRole allowedRoles={['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR', 'INSPECTOR', 'AHLI_K3', 'PIMPINAN', 'MANAGER']}>
              <IssuesPage />
            </RequireRole>
          }
        />
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
    </Suspense>
  );
}
