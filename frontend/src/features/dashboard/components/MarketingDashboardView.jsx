import { lazy, Suspense, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  ArrowRight,
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
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header Workspace Marketing */}
      <PageHeader
        title={`${greetingTime}, ${user?.fullName || 'Tim Marketing'}`}
        subtitle="Monitoring terpadu klien, Purchase Order pemeriksaan, dan siklus perpanjangan riksa uji K3."
        actions={
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link
              to="/app/reminders"
              className="flex-1 sm:flex-initial h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <BellRinging size={15} className="text-amber-600 dark:text-amber-400" />
              <span>Pengingat Suket</span>
            </Link>
            <button
              type="button"
              onClick={() => setPoModalOpen(true)}
              className="flex-1 sm:flex-initial h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C81E1E] px-4 text-xs font-bold text-white hover:bg-[#a11616] shadow-2xs cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
            >
              <Plus size={15} weight="bold" />
              <span>Buat PO Baru</span>
            </button>
          </div>
        }
      />

      {/* Grid 4 KPI Utama Operasional Komersial */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Klien Dikelola */}
        <button
          type="button"
          onClick={() => navigate('/app/clients')}
          className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Klien Dikelola</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <Buildings size={16} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.managedClients ?? 0}
            </p>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Mitra aktif
            </span>
          </div>
        </button>

        {/* Card 2: PO Menunggu Jadwal */}
        <button
          type="button"
          onClick={() => navigate('/app/orders?status=TERDAFTAR')}
          className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">PO Menunggu Jadwal</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <HourglassMedium size={16} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.awaitingScheduleOrders ?? metrics.newOrders ?? 0}
            </p>
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              Perlu penugasan
            </span>
          </div>
        </button>

        {/* Card 3: PO Berjalan */}
        <button
          type="button"
          onClick={() => navigate('/app/orders')}
          className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">PO Sedang Berjalan</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <Briefcase size={16} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {metrics.activeOrders ?? 0}
            </p>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Tahap lapangan &amp; QC
            </span>
          </div>
        </button>

        {/* Card 4: Jatuh Tempo 30 Hari */}
        <button
          type="button"
          onClick={() => navigate('/app/reminders')}
          className="group text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Jatuh Tempo Suket</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              <BellRinging size={16} />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-[#C81E1E] dark:text-rose-400 tracking-tight">
              {metrics.expiringUnitsCount ?? 0}
            </p>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              Dalam &le; 30 Hari
            </span>
          </div>
        </button>
      </div>

      {/* Ringkasan Siklus Pengingat & Kinerja Konversi */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Siklus Pengingat Klien:
          </span>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>H-7: <strong>{metrics.remindersH7 ?? 0}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>H-14: <strong>{metrics.remindersH14 ?? 0}</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>H-30: <strong>{metrics.remindersH30 ?? 0}</strong></span>
            </span>
          </div>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400">
            Follow-Up Tertunda: <strong className="text-amber-600 dark:text-amber-400">{metrics.pendingFollowupsCount ?? 0}</strong>
          </span>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">·</span>
          <span className="text-slate-600 dark:text-slate-400">
            Konversi Perpanjangan: <strong className="text-emerald-600 dark:text-emerald-400">{metrics.renewedClientsCount ?? 0} Klien</strong>
          </span>
        </div>
        <Link
          to="/app/reminders"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer self-start md:self-center"
        >
          <span>Pusat Pengingat</span>
          <ArrowRight size={13} weight="bold" />
        </Link>
      </div>

      {/* Grid Analisis Volume PO & PO Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri (7 Col): Tren Volume Order & Riksa Uji */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendUp size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Tren Order &amp; Penyelesaian Unit</span>
            </h3>

            {/* Filter Periode */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium self-start sm:self-center">
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = activePeriod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePeriodChange(opt.id)}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
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
          <div className="flex items-center gap-5 text-xs">
            <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C81E1E]" /> PO Didaftarkan
            </span>
            <span className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Riksa Uji Tuntas
            </span>
          </div>

          {/* Kurva Grafik Spline */}
          <div className="pt-2">
            <SplineAreaChart monthlyTrend={analytics?.monthlyTrend || []} period={activePeriod} />
          </div>
        </div>

        {/* Kolom Kanan (5 Col): PO Terbaru Didaftarkan */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Briefcase size={16} className="text-[#C81E1E]" weight="bold" />
                <span>PO Terbaru Didaftarkan</span>
              </h3>
              <Link
                to="/app/orders"
                className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
              >
                Lihat Semua
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
                    className="w-full text-left py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-xs text-slate-900 dark:text-white truncate">
                        {ord.po_number || ord.order_no}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
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
              Total PO: <strong className="text-slate-900 dark:text-white">{metrics.totalOrders ?? recentOrders.length}</strong>
            </span>
            <button
              type="button"
              onClick={() => setPoModalOpen(true)}
              className="text-xs font-bold text-[#C81E1E] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} weight="bold" />
              <span>Buat PO Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Unit Mendesak & Kinerja Follow-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Kolom Kiri (7 Col): Unit Alat Jatuh Tempo */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ClockCountdown size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Unit K3 Mendesak untuk Tindak Lanjut</span>
            </h3>
            <Link
              to="/app/reminders"
              className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
            >
              Semua Unit
            </Link>
          </div>

          {urgentExpiringUnits.length === 0 ? (
            <div className="text-center py-10 text-slate-400 dark:text-slate-500 space-y-2">
              <CheckCircle size={28} className="mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Semua masa berlaku unit alat aman (tidak ada unit jatuh tempo segera).
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgentExpiringUnits.map((u) => {
                const days = Number(u.days_remaining);
                const isUrgent = days <= 7;
                return (
                  <div key={u.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {u.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {u.category_code}
                        </span>
                        {u.serial_number && (
                          <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            SN: {u.serial_number}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {u.client_name}
                        </span>
                        {u.contact_name && (
                          <span>· PIC: {u.contact_name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                          days <= 0
                            ? 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/60'
                            : isUrgent
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {days <= 0 ? 'JATUH TEMPO' : `Sisa ${days} Hari`}
                      </span>
                      <Link
                        to="/app/reminders"
                        className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center cursor-pointer shadow-2xs"
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

        {/* Kolom Kanan (5 Col): Kinerja Follow-Up & Aktivitas Operasional */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Kinerja Follow-Up */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
                <span>Kinerja Follow-Up &amp; Repeat Order</span>
              </h3>
              <Link
                to="/app/reminders"
                className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
              >
                Pengingat
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Perlu Dihubungi
                </span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {metrics.pendingFollowupsCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Unit mendekati batas</span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                  Konversi Berhasil
                </span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {metrics.renewedClientsCount ?? 0}
                </p>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Repeat order klien</span>
              </div>
            </div>

            <div className="pt-1 flex items-center gap-2">
              <Link
                to="/app/reminders"
                className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Buka Jadwal Pengingat
              </Link>
              <button
                type="button"
                onClick={() => setPoModalOpen(true)}
                className="flex-1 h-9 inline-flex items-center justify-center rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] transition-colors cursor-pointer shadow-2xs"
              >
                + PO Perpanjangan
              </button>
            </div>
          </div>

          {/* Aktivitas Operasional Terkini */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
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
                    <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
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

      {/* Sebaran Geospasial Objek Uji Nasional */}
      <div className="w-full space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Buildings size={16} className="text-[#C81E1E]" weight="bold" />
            <span>Sebaran Geospasial Objek Uji Nasional</span>
          </h2>
          <Link
            to="/app/clients"
            className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
          >
            Buka Direktori Klien
          </Link>
        </div>
        <IndonesiaMapWidget regions={analytics?.regionalMapping || []} />
      </div>

      {/* Modal Pembuatan PO dari Dashboard */}
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
