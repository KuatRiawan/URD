import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  BellRinging,
  Briefcase,
  Buildings,
  CheckCircle,
  ClockCountdown,
  FileText,
  HourglassMedium,
  Plus,
  ShieldCheck,
  TrendUp
} from '@phosphor-icons/react';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Badge, statusTone } from '../../../components/ui/Badge.jsx';
import { formatDateTime, ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';
import { SplineAreaChart } from '../SplineAreaChart.jsx';
import { IndonesiaMapWidget } from '../IndonesiaMapWidget.jsx';

const DashboardPoCreator = lazy(() =>
  import('./DashboardPoCreator.jsx').then((module) => ({ default: module.DashboardPoCreator }))
);

const PERIOD_OPTIONS = [
  { id: '7D', label: '7 Hari' },
  { id: '30D', label: '30 Hari' },
  { id: '90D', label: '90 Hari' },
  { id: '1Y', label: '1 Tahun' }
];

function formatActivitySummary(act) {
  if (!act) return '-';
  const summary = act.summary;
  if (typeof summary === 'string' && summary.trim()) {
    return summary;
  }
  if (typeof summary === 'object' && summary !== null) {
    if (act.action === 'USER_UPDATE_PROFILE') {
      return `Pembaruan profil: ${summary.fullName || 'Marketing'}`;
    }
    if (act.action === 'AUTH_LOGIN') {
      return `Sesi login (${summary.role || 'Marketing'})`;
    }
    if (act.action === 'CREATE_ORDER') {
      return `PO Baru: ${summary.poNumber || summary.orderNo || 'PO Klien'}`;
    }
    if (summary.message) return String(summary.message);
    if (summary.note) return String(summary.note);
    if (summary.clientName) return `Klien: ${summary.clientName}`;
    if (summary.email) return `Autentikasi: ${summary.email}`;
    try {
      const parts = Object.entries(summary)
        .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
        .map(([, v]) => String(v));
      if (parts.length > 0) return parts.join(' · ');
    } catch {
      // fallback
    }
  }
  return act.action ? act.action.replace(/_/g, ' ') : 'Aktivitas Operasional';
}

export function MarketingDashboardView({
  data,
  loadSummary,
  period = '30D',
  setPeriod
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [internalPeriod, setInternalPeriod] = useState('30D');

  const activePeriod = period || internalPeriod;
  const handlePeriodChange = setPeriod || setInternalPeriod;

  const metrics = data?.metrics || {};
  const recentOrders = data?.recentOrders || [];
  const urgentExpiringUnits = data?.urgentExpiringUnits || [];
  const recentActivities = data?.recentActivities || [];
  const analytics = data?.analytics || {};

  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, []);

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100">
      {/* Header Workspace Marketing */}
      <PageHeader
        title={`${greetingTime}, ${user?.fullName || 'Tim Marketing'}`}
        subtitle="Monitoring klien, PO pemeriksaan, dan siklus perpanjangan riksa uji K3."
        actions={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              to="/app/reminders"
              className="flex-1 sm:flex-initial h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <BellRinging size={15} className="text-amber-600 dark:text-amber-400" />
              <span className="truncate">Pengingat</span>
            </Link>
            <button
              type="button"
              onClick={() => setPoModalOpen(true)}
              className="flex-1 sm:flex-initial h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-semibold text-white hover:bg-[#a11616] shadow-2xs cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
            >
              <Plus size={15} weight="bold" />
              <span className="truncate">+ Buat PO</span>
            </button>
          </div>
        }
      />

      {/* Grid 4 KPI Utama Operasional PO */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Klien Dikelola */}
        <button
          type="button"
          onClick={() => navigate('/app/clients')}
          className="group text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Klien Dikelola</span>
            <span className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Buildings size={16} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {metrics.managedClients ?? 0}
          </p>
        </button>

        {/* Card 2: PO Baru */}
        <button
          type="button"
          onClick={() => navigate('/app/orders?status=TERDAFTAR')}
          className="group text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">PO Baru (Menunggu Jadwal)</span>
            <span className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <HourglassMedium size={16} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {metrics.awaitingScheduleOrders ?? metrics.newOrders ?? 0}
          </p>
        </button>

        {/* Card 3: PO Berjalan */}
        <button
          type="button"
          onClick={() => navigate('/app/orders')}
          className="group text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">PO Berjalan</span>
            <span className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Briefcase size={16} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {metrics.activeOrders ?? 0}
          </p>
        </button>

        {/* Card 4: Jatuh Tempo */}
        <button
          type="button"
          onClick={() => navigate('/app/reminders')}
          className="group text-left p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="text-xs font-medium">Jatuh Tempo (&le; 30 Hari)</span>
            <span className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400">
              <BellRinging size={16} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-[#C81E1E] dark:text-rose-400">
            {metrics.expiringUnitsCount ?? 0}
          </p>
        </button>
      </div>

      {/* Pipeline Pengingat Strip */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Distribusi Siklus Pengingat:
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 text-red-700 dark:text-red-300 font-mono text-[11px] font-bold">
            H-7: {metrics.remindersH7 ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
            H-14: {metrics.remindersH14 ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold">
            H-30: {metrics.remindersH30 ?? 0}
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-600 dark:text-slate-400">
            Follow-Up Tertunda: <strong className="font-bold text-amber-600 dark:text-amber-400">{metrics.pendingFollowupsCount ?? 0}</strong>
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-600 dark:text-slate-400">
            Konversi Sukses: <strong className="font-bold text-emerald-600 dark:text-emerald-400">{metrics.renewedClientsCount ?? 0}</strong>
          </span>
        </div>
        <Link
          to="/app/reminders"
          className="text-xs font-semibold text-[#C81E1E] hover:underline cursor-pointer"
        >
          Lihat Semua Pengingat &rarr;
        </Link>
      </div>

      {/* Grid 12 Kolom (7 Col Chart, 5 Col PO Terbaru) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri (7 Col): Tren Analisis Volume PO & Riksa Uji */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendUp size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Tren Volume Order &amp; Penyelesaian</span>
            </h3>

            {/* Filter Periode */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 p-0.5 text-xs font-medium self-start sm:self-center shadow-2xs overflow-x-auto max-w-full">
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = activePeriod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePeriodChange(opt.id)}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-[#C81E1E]" /> Total PO Masuk
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
              <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Riksa Uji Tuntas
            </span>
          </div>

          {/* Kurva Grafik Spline */}
          <div className="pt-2">
            <SplineAreaChart monthlyTrend={analytics?.monthlyTrend || []} period={activePeriod} />
          </div>
        </div>

        {/* Kolom Kanan (5 Col): Kartu PO Terbaru */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Briefcase size={16} className="text-[#C81E1E]" weight="bold" />
                <span>PO Terbaru Didaftarkan</span>
              </h3>
              <Link
                to="/app/orders"
                className="text-[11px] font-bold text-[#C81E1E] hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E] rounded-md px-1"
              >
                Semua PO
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-8 text-center">
                Belum ada PO pemeriksaan terdaftar.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentOrders.slice(0, 5).map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => navigate('/app/orders')}
                    className="w-full text-left py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                        {ord.po_number || ord.order_no}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {ord.client_name} · {ord.unit_count || 1} Unit
                      </p>
                    </div>
                    <Badge tone={statusTone(ord.status)}>
                      {ORDER_STATUS_LABELS[ord.status] || ord.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Footer Strip */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total: <strong className="text-slate-900 dark:text-white">{metrics.totalOrders ?? recentOrders.length} PO</strong>
            </span>
            <button
              type="button"
              onClick={() => setPoModalOpen(true)}
              className="text-xs font-bold text-[#C81E1E] hover:underline inline-flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E] rounded-md px-1"
            >
              <span>+ Buat PO Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Konten Kerja: Unit Mendesak & Kinerja Follow-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri (7 Col): Unit Alat Membutuhkan Follow-Up Segera */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ClockCountdown size={17} className="text-[#C81E1E]" weight="bold" />
              <span>Unit K3 Mendesak untuk Tindak Lanjut</span>
            </h3>
            <Link
              to="/app/reminders"
              className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E] rounded-md px-1"
            >
              Semua Unit
            </Link>
          </div>

          {urgentExpiringUnits.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 space-y-2">
              <CheckCircle size={32} className="mx-auto text-emerald-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Tidak ada unit mendesak.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgentExpiringUnits.map((u) => {
                const days = Number(u.days_remaining);
                const isUrgent = days <= 7;
                return (
                  <div key={u.id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[220px]">
                          {u.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 shrink-0">
                          {u.category_code}
                        </span>
                        {u.serial_number && (
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                            SN: {u.serial_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {u.client_name}
                        </span>
                        {u.contact_name && (
                          <span className="truncate">· PIC: {u.contact_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-bold ${days <= 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : isUrgent
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                      >
                        {days <= 0 ? 'JATUH TEMPO' : `Sisa ${days} Hari`}
                      </span>
                      <Link
                        to="/app/reminders"
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                      >
                        Tindak Lanjut
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan (5 Col): Kinerja Follow-Up & Aktivitas Terkini */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card: Status Kinerja Konversi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
                <span>Kinerja Konversi &amp; Follow-Up</span>
              </h3>
              <Link
                to="/app/reminders"
                className="text-[11px] font-bold text-[#C81E1E] hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E] rounded-md px-1"
              >
                Pengingat
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Belum Selesai
                </span>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {metrics.pendingFollowupsCount ?? 0}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Konversi Sukses
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {metrics.renewedClientsCount ?? 0}
                </p>
              </div>
            </div>

            {/* Aksi Cepat Marketing */}
            <div className="pt-1 flex items-center gap-2">
              <Link
                to="/app/reminders"
                className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Jadwal Pengingat
              </Link>
              <button
                type="button"
                onClick={() => setPoModalOpen(true)}
                className="flex-1 h-9 inline-flex items-center justify-center rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] transition-colors cursor-pointer shadow-xs"
              >
                + Buat PO Perpanjangan
              </button>
            </div>
          </div>

          {/* Card: Aktivitas Operasional Tim Marketing Terkini */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText size={16} className="text-blue-500" weight="bold" />
                <span>Aktivitas Operasional Terkini</span>
              </h3>
            </div>
            {recentActivities.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                Belum ada aktivitas tercatat hari ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {recentActivities.slice(0, 4).map((act) => (
                  <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5">
                    <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                      {formatActivitySummary(act)}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                      <span>{act.user_name || 'Marketing'}</span>
                      <span>{formatDateTime(act.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pemetaan Sebaran Objek Uji per Wilayah (Paling Bawah - Luas & Spasial Penuh) */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Buildings size={16} className="text-[#C81E1E]" weight="bold" />
            <span>Sebaran Geospasial Objek Uji Nasional</span>
          </h2>
          <Link
            to="/app/clients"
            className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E] rounded-md px-1"
          >
            Buka Basis Klien
          </Link>
        </div>
        <IndonesiaMapWidget regions={analytics?.regionalMapping || []} />
      </div>

      {/* Modal Pembuatan PO Cepat dari Dashboard */}
      {poModalOpen && (
        <Suspense fallback={null}>
          <DashboardPoCreator
            open={poModalOpen}
            onClose={() => {
              setPoModalOpen(false);
              loadSummary(true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
