import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import {
  Alarm,
  ArrowClockwise,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Buildings,
  CalendarCheck,
  Certificate,
  ChartLineUp,
  CheckCircle,
  Clock,
  Cube,
  DownloadSimple,
  FileText,
  HourglassMedium,
  Plus,
  ShieldCheck,
  Truck,
  User,
  Users,
  UsersThree,
  WarningCircle,
  WarningOctagon,
  Wrench
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Badge, statusTone } from '../../../components/ui/Badge.jsx';
import { SplineAreaChart } from '../SplineAreaChart.jsx';
import { IndonesiaMapWidget } from '../IndonesiaMapWidget.jsx';
import { WorkQueueWidget } from '../WorkQueueWidget.jsx';
import { formatRelativeTime, ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';
import { ExecutiveDashboardView } from './ExecutiveDashboardView.jsx';

const DashboardPoCreator = lazy(() =>
  import('./DashboardPoCreator.jsx').then((module) => ({ default: module.DashboardPoCreator }))
);

/**
 * Kartu Pemantauan Beban Kerja Personel Ahli K3
 * Membantu Admin Kantor dan Pimpinan melihat kapasitas dan keseimbangan penugasan
 */
function InspectorWorkloadCard({ workload = [] }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
      <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersThree size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Beban Kerja Ahli K3
          </h2>
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {workload.length} Personel
        </span>
      </div>

      <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[340px] overflow-y-auto">
        {workload.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
            Belum ada data penugasan Ahli K3 tercatat.
          </p>
        ) : (
          workload.map((insp) => (
            <div key={insp.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {insp.full_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {insp.completed_inspections || 0} pengujian selesai
                </p>
              </div>
              <Badge
                tone={
                  Number(insp.active_assignments || 0) > 3
                    ? 'warning'
                    : Number(insp.active_assignments || 0) > 0
                    ? 'info'
                    : 'neutral'
                }
                size="xs"
              >
                {insp.active_assignments || 0} tugas aktif
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ManagementDashboardView({
  user,
  data,
  loadSummary,
  refreshing,
  period,
  setPeriod
}) {
  const m = data?.metrics || {};
  const [poCreatorOpen, setPoCreatorOpen] = useState(false);

  const role = user?.role;
  const isMarketing = role === 'MARKETING';
  const isAdminKantor = role === 'ADMIN_KANTOR';
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(role);

  if (isPimpinan) {
    return (
      <ExecutiveDashboardView
        user={user}
        data={data}
        loadSummary={loadSummary}
        refreshing={refreshing}
        period={period}
        setPeriod={setPeriod}
      />
    );
  }

  const roleHeader = isMarketing
    ? {
        title: 'Dasbor Komersial & Relasi Klien',
        subtitle: 'Pemantauan relasi klien, progres PO masuk, dan peluang perpanjangan Suket K3 berkala'
      }
    : isAdminKantor
    ? {
        title: 'Dasbor Operasional',
        subtitle: 'Kendali penugasan Ahli K3, antrean QC berkas riksa uji, dan penerbitan dokumen resmi'
      }
    : {
        title: 'Dasbor Sistem',
        subtitle: 'Status platform, jejak audit operasional, dan administrasi modul'
      };

  return (
    <div className="space-y-6">
      <PageHeader
        title={roleHeader.title}
        subtitle={roleHeader.subtitle}
        actions={
          <div className="flex items-center gap-2">
            {['ADMIN_KANTOR', 'ADMIN_SISTEM', 'MARKETING'].includes(role) && (
              <button
                type="button"
                onClick={() => setPoCreatorOpen(true)}
                className="h-9 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-bold text-white hover:bg-[#a61717] transition-all shadow-xs cursor-pointer"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Buat PO Baru</span>
              </button>
            )}
            <a
              href="/api/v1/dashboard/export-recap.csv"
              title="Ekspor Rekap CSV"
              className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
            >
              <DownloadSimple size={15} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Unduh Rekap</span>
            </a>
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              title="Perbarui data"
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={refreshing ? 'animate-spin text-[#C81E1E]' : ''}
              />
            </button>
          </div>
        }
      />

      {/* 1.5. Operational Issues Alert Banner */}
      {Number(m.openIssues || 0) > 0 && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="h-8 w-8 rounded-lg bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <WarningCircle size={18} weight="bold" />
            </span>
            <div>
              <p className="font-bold text-slate-900 dark:text-slate-100">
                Perhatian Operasional: {m.openIssues} Kendala Lapangan Terbuka
                {Number(m.highPriorityIssues || 0) > 0 && ` (${m.highPriorityIssues} Urgensi Tinggi)`}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Terdapat kendala teknis atau ketidaksesuaian nameplate unit di lapangan yang memerlukan tindakan koordinasi atau klarifikasi.
              </p>
            </div>
          </div>
          <Link
            to="/app/issues"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] text-white text-xs font-bold transition-all shadow-2xs"
          >
            <span>Tinjau Kendala Lapangan</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      )}

      {/* 2. Metis Horizontal Stats Counter Cards (4-column grid) - Role-Tailored */}
      <section aria-label="Metrik Operasional Utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isMarketing ? (
          <>
            {/* Marketing Card 1: PO & Order Berjalan */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Briefcase size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Order PO Berjalan
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                    {m.activeOrders || 0}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                    <ArrowUp size={12} weight="bold" />
                    <span>{m.newOrders || 0} PO baru</span>
                    <span className="text-slate-400 dark:text-slate-600 font-normal">· {m.completedOrders || 0} selesai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Card 2: Perusahaan Klien Aktif */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Buildings size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Perusahaan Klien Aktif
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                    {m.activeClients || 0}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <Cube size={13} weight="bold" />
                    <span>{m.activeObjects || 0} unit alat terdaftar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Card 3: Peluang Repeat Order (Suket <= 30 Hari) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <Alarm size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Peluang Repeat Order
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#C81E1E] dark:text-rose-400 tabular-nums leading-none tracking-tight">
                    {m.suketExpiring30d || 0}
                  </div>
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1.5">
                    <span>Suket habis &le; 30 hari (Urgensi)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Card 4: Prospek Perpanjangan (Suket <= 90 Hari) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <Certificate size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Prospek Suket Habis
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-tight">
                    {m.suketExpiring90d || 0}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1.5">
                    <span>Pipeline &le; 90 hari ke depan</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : isAdminKantor ? (
          <>
            {/* Admin Kantor Card 1: PO Menunggu Jadwal */}
            <Link
              to="/app/schedule"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all cursor-pointer block"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarCheck size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    PO Menunggu Jadwal
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
                    {m.newOrders || 0}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1.5">
                    <span>{m.activeOrders || 0} order berjalan</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Admin Kantor Card 2: Unit Sedang Diinspeksi */}
            <Link
              to="/app/inspections"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all cursor-pointer block"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wrench size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Unit Sedang Diinspeksi
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-[-0.02em]">
                    {m.inspectingUnits || 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span>{m.waitingInspectionUnits || 0} unit antre</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Admin Kantor Card 3: Antrean QC LHPP */}
            <Link
              to="/app/lhpp?status=SIAP_PREVIEW"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all cursor-pointer block"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <HourglassMedium size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Antrean QC: LHPP Siap
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-[#C81E1E] dark:text-rose-400 tabular-nums leading-none tracking-[-0.02em]">
                    {m.lhppWaitingReview || 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span className="text-amber-600 font-bold">{m.revisionUnits || 0} revisi</span>
                    <span>· {m.lhppPublished || 0} terbit</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Admin Kantor Card 4: Berkas Siap Kirim (BAST) */}
            <Link
              to="/app/distributions?status=SIAP_DIKIRIM"
              className="group bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.14] transition-all cursor-pointer block"
            >
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Truck size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] mb-0.5">
                    Berkas Siap Kirim (BAST)
                  </p>
                  <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none tracking-[-0.02em]">
                    {m.documentPipeline?.dist_pending ?? m.docsPendingDelivery ?? 0}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1 mt-1.5">
                    <span>{m.documentPipeline?.dist_dispatched ?? m.docsDispatched ?? 0} terkirim</span>
                    <ArrowRight size={12} weight="bold" className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          </>
        ) : isPimpinan ? (
          <>
            {/* Pimpinan Card 1: Total Volume Order */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Briefcase size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Total Volume Order
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                    {m.totalOrders || (m.activeOrders || 0) + (m.completedOrders || 0)}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <span className="text-blue-600 font-bold">{m.activeOrders || 0} Berjalan</span>
                    <span>·</span>
                    <span className="text-emerald-600 font-bold">{m.completedOrders || 0} Selesai</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pimpinan Card 2: Efisiensi SLA Penyelesaian */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Clock size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Efisiensi Rata-Rata SLA
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none tracking-tight">
                    {m.avgCompletionHours ? `${m.avgCompletionHours} Jam` : '24 Jam'}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <span>Waktu siklus order hingga tuntas</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pimpinan Card 3: Unit Alat Tersertifikasi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Unit Alat Tersertifikasi
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums leading-none tracking-tight">
                    {m.completedUnits || 0}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <span>Dari {m.totalUnits || m.activeObjects || 0} unit terdaftar</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pimpinan Card 4: Kepatuhan Suket K3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Kepatuhan Suket K3
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-tight">
                    {m.suketPublished || m.documentPipeline?.suket_published || 0}
                  </div>
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1.5">
                    <Alarm size={13} weight="bold" />
                    <span>{m.suketExpiring30d || 0} unit habis &le; 30 hari</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Admin Sistem Card 1: Total Order Masuk */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Briefcase size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Total Order Masuk
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                    {m.totalOrders || (m.activeOrders || 0) + (m.completedOrders || 0)}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                    <ArrowUp size={12} weight="bold" />
                    <span>{m.activeOrders || 0} aktif berjalan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Sistem Card 2: Basis Data Objek Uji */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <Cube size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Basis Data Objek Uji
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                    {m.activeObjects || 0}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <UsersThree size={13} weight="bold" />
                    <span>{m.activeClients || 0} Perusahaan Klien</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Sistem Card 3: Dokumen LHPP Terbit */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileText size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Dokumen LHPP Terbit
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none tracking-tight">
                    {m.lhppPublished || 0}
                  </div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                    <span>{m.lhppWaitingReview || 0} menunggu review QC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Sistem Card 4: Kendala Operasional */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-center">
                <div className="h-11 w-11 rounded-lg bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                  <WarningOctagon size={22} weight="bold" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 ms-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                    Kendala Operasional
                  </p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#C81E1E] dark:text-rose-400 tabular-nums leading-none tracking-tight">
                    {m.openIssues || 0}
                  </div>
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1.5">
                    <span>{m.highPriorityIssues || 0} isu prioritas tinggi</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* 2.5. Operational or Commercial Pipeline Widget */}
      {isMarketing ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Briefcase size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
              <span>Pipeline Komersial &amp; Siklus Order Klien</span>
            </h2>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Total {m.totalOrders || (m.activeOrders || 0) + (m.completedOrders || 0)} Order Klien
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-card 1: Status Siklus PO Klien */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  <span>Tahapan Progres Order Klien</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">PO Baru</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{m.newOrders || 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate">Proses Riksa</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{m.activeOrders || 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate">QC Dokumen</p>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{m.lhppWaitingReview || 0}</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">Selesai</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.completedOrders || 0}</p>
                </div>
              </div>
            </div>

            {/* Sub-card 2: Potensi Repeat Order Suket Kemnaker */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Certificate size={14} className="text-slate-500" />
                  <span>Potensi Repeat Order (Suket Kemnaker)</span>
                </span>
                <Link to="/app/reminders" className="text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:underline">
                  Buka Reminder &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-red-200/70 dark:border-red-900/40">
                  <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 truncate">&le; 30 Hari</p>
                  <p className="text-base font-extrabold text-red-600 dark:text-red-400 mt-0.5">{m.suketExpiring30d || 0}</p>
                  <p className="text-[9px] text-red-500/80 mt-0.5">urgent follow</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-amber-200/70 dark:border-amber-900/40">
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate">&le; 90 Hari</p>
                  <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{m.suketExpiring90d || 0}</p>
                  <p className="text-[9px] text-amber-500/80 mt-0.5">pipeline</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">Total Objek</p>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{m.activeObjects || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">unit alat</p>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70">
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">Klien Aktif</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.activeClients || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">perusahaan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Wrench size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
              <span>Pipeline Operasional: Siklus Unit &amp; Status Dokumen</span>
            </h2>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Total {m.totalUnits || m.activeObjects || 0} Unit Alat
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sub-card 1: Tahapan Siklus Unit Alat */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-slate-500" />
                  <span>Tahapan Siklus Unit Lapangan</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Link
                  to="/app/schedule"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">Menunggu</p>
                  <p className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">{m.waitingInspectionUnits || 0}</p>
                </Link>
                <Link
                  to="/app/inspections"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate">Inspeksi</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{m.inspectingUnits || 0}</p>
                </Link>
                <Link
                  to="/app/lhpp?status=DIKEMBALIKAN"
                  className={`p-2 rounded-lg bg-white dark:bg-slate-800 border hover:border-amber-500 hover:shadow-2xs transition-all block cursor-pointer ${Number(m.revisionUnits || 0) > 0 ? 'border-amber-300 dark:border-amber-800 bg-amber-50/30' : 'border-slate-200/70 dark:border-slate-700/70'}`}
                >
                  <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 truncate">Perlu Revisi</p>
                  <p className={`text-base font-extrabold ${Number(m.revisionUnits || 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'} mt-0.5`}>
                    {m.revisionUnits || 0}
                  </p>
                </Link>
                <Link
                  to="/app/lhpp?status=FINAL"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">Selesai</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.completedUnits || 0}</p>
                </Link>
              </div>
            </div>

            {/* Sub-card 2: Pipeline Dokumen & Distribusi */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <FileText size={14} className="text-slate-500" />
                  <span>Dokumen Resmi &amp; Distribusi</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                  <Truck size={13} />
                  <span>{m.docsDispatched || 0} Terkirim</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Link
                  to="/app/bap?status=FINAL"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 truncate">BAP Final</p>
                  <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{m.bapFinal || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{m.bapDraft || 0} draft</p>
                </Link>
                <Link
                  to="/app/lhpp?status=FINAL"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate">LHPP Terbit</p>
                  <p className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{m.lhppPublished || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{m.lhppWaitingReview || 0} QC</p>
                </Link>
                <Link
                  to="/app/suket"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">Suket Disnaker</p>
                  <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">{m.suketPublished || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">tercatat</p>
                </Link>
                <Link
                  to="/app/distributions?status=SIAP_DIKIRIM"
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-2xs transition-all block cursor-pointer"
                >
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">Siap Kirim</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{m.docsPendingDelivery || 0}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{m.docsDispatched || 0} terkirim</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Metis Main Section: 8-Column Trend Chart & Work Queue + 4-Column Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8-cols): Operational Overview Chart & Pipeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Untuk Admin Kantor: Tampilkan Antrean Kerja Operasional Prioritas di Paling Atas */}
          {isAdminKantor && (
            <WorkQueueWidget onRefresh={() => loadSummary(true)} />
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            {/* Metis Card Header with Period Buttons */}
            <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ChartLineUp size={18} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                <span>Tren &amp; Volume Riksa Uji</span>
              </h2>

              {/* Period Button Group */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold self-start sm:self-center shadow-2xs">
                {['7D', '30D', '90D', '1Y'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPeriod(p);
                      if (loadSummary) loadSummary(false, p);
                    }}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${period === p
                        ? 'bg-[#C81E1E] text-white font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Spline Chart Body */}
            <div className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3 gap-2">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C81E1E]" /> Total Order
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Riksa Uji Selesai
                  </span>
                </div>
              </div>

              <SplineAreaChart
                monthlyTrend={data?.analytics?.monthlyTrend || []}
                period={period}
              />
            </div>
          </div>

          {/* Action Queue: Only for Operational Admin roles, replaced by geographic distribution for Marketing */}
          {isMarketing ? (
            <IndonesiaMapWidget regions={data?.analytics?.regionalMapping || []} />
          ) : !isAdminKantor ? (
            <WorkQueueWidget onRefresh={() => loadSummary(true)} />
          ) : null}
        </div>

        {/* Right Column (4-cols): Role-Tailored Activity Stream, Workload, and Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          {isMarketing ? (
            <>
              {/* 1. Pengingat Suket Klien (Peluang Repeat Order) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Alarm size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Pengingat Suket (Repeat Order)
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {Number(m.suketExpiring90d || 0)} Klien
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl border border-red-200/80 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                        Habis &le; 30 Hari
                      </p>
                      <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                        {m.suketExpiring30d || 0}
                      </p>
                      <span className="text-[10px] text-red-600/80 dark:text-red-400/80 font-medium">Urgensi Tinggi</span>
                    </div>

                    <div className="p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Habis &le; 90 Hari
                      </p>
                      <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                        {m.suketExpiring90d || 0}
                      </p>
                      <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-medium">Follow-Up Rutin</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      to="/app/reminders"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                    >
                      <span>Buka Daftar Pengingat &amp; Kontak Klien</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 2. Pemantauan Status PO Klien Terkini */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      PO Klien Terkini Dipantau
                    </h2>
                  </div>
                  <Link
                    to="/app/orders"
                    className="text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
                  >
                    Semua PO
                  </Link>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[380px] overflow-y-auto">
                  {(data?.recentOrders || []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada PO aktif tercatat.
                    </p>
                  ) : (
                    (data?.recentOrders || []).slice(0, 5).map((ord) => (
                      <Link
                        key={ord.id}
                        to={`/app/orders?orderNo=${encodeURIComponent(ord.order_no)}`}
                        className="py-3 first:pt-0 last:pb-0 block group hover:bg-slate-50 dark:hover:bg-slate-800/50 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#C81E1E] truncate">
                              {ord.order_no}
                            </p>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium truncate mt-0.5">
                              {ord.client_name}
                            </p>
                          </div>
                          <Badge tone={statusTone(ord.status)} size="sm">
                            {ORDER_STATUS_LABELS[ord.status] || ord.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                          <span>{ord.service_type?.replace(/_/g, ' ') || 'Riksa Uji'}</span>
                          <span>{formatRelativeTime(ord.created_at)}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Aksi Cepat & Navigasi Komersial */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Aksi Cepat Marketing
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setPoCreatorOpen(true)}
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:bg-rose-100/70 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Plus size={15} weight="bold" />
                      <span>Buat PO Baru Multi-Unit</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </button>
                  <Link
                    to="/app/clients"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <UsersThree size={15} weight="bold" />
                      <span>Kelola Klien &amp; Banyak PIC</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/objects"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench size={15} weight="bold" />
                      <span>Basis Data Objek Uji K3</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>
            </>
          ) : isAdminKantor ? (
            <>
              {/* Admin Kantor: Beban Kerja Ahli K3 untuk Penjadwalan */}
              <InspectorWorkloadCard workload={data?.inspectorWorkload || []} />

              {/* Admin Kantor: Aksi Cepat Operasional */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Aksi Cepat Operasional Kantor
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/app/schedule"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/20 text-xs font-bold text-blue-700 dark:text-blue-400 hover:bg-blue-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <CalendarCheck size={15} weight="bold" />
                      <span>Kelola Jadwal &amp; Penugasan K3</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/lhpp"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <HourglassMedium size={15} weight="bold" />
                      <span>Review &amp; QC Dokumen LHPP</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/suket"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/20 text-xs font-bold text-purple-700 dark:text-purple-400 hover:bg-purple-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={15} weight="bold" />
                      <span>Registri Suket Disnaker</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/distributions"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Truck size={15} weight="bold" />
                      <span>Distribusi Berkas &amp; BAST</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Log Aktivitas Terkini */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Log Aktivitas Terkini
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {(data?.recentActivities || []).length} entri
                  </span>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[360px] overflow-y-auto">
                  {(data?.recentActivities || []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada aktivitas operasional hari ini.
                    </p>
                  ) : (
                    (data?.recentActivities || []).map((act) => (
                      <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                          <User size={13} weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {act.action?.replace(/_/g, ' ') || 'Aktivitas'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {act.user_name || 'Sistem'} · {act.user_role || '-'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatRelativeTime(act.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : isPimpinan ? (
            <>
              {/* Pimpinan: Beban Kerja Tim Ahli K3 */}
              <InspectorWorkloadCard workload={data?.inspectorWorkload || []} />

              {/* Pimpinan: Pintasan Kepatuhan & Log Audit */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Pengawasan &amp; Kepatuhan
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">Eksekutif</span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/app/audit-logs"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Clock size={14} className="text-slate-500" />
                      <span>Log Audit Operasional</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                  <Link
                    to="/app/lhpp"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-slate-500" />
                      <span>Dokumen LHPP &amp; BAP</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                  <Link
                    to="/app/suket"
                    className="h-9 inline-flex items-center justify-between px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Certificate size={14} className="text-slate-500" />
                      <span>Registri Suket Disnaker</span>
                    </span>
                    <ArrowRight size={13} weight="bold" className="text-slate-400" />
                  </Link>
                </div>
              </div>

              {/* Log Aktivitas Terkini */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Log Aktivitas Terkini
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {(data?.recentActivities || []).length} entri
                  </span>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[360px] overflow-y-auto">
                  {(data?.recentActivities || []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada aktivitas operasional tercatat.
                    </p>
                  ) : (
                    (data?.recentActivities || []).map((act) => (
                      <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                          <User size={13} weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {act.action?.replace(/_/g, ' ') || 'Aktivitas'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {act.user_name || 'Sistem'} · {act.user_role || '-'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatRelativeTime(act.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Admin Sistem: Aksi Cepat Administrasi */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Aksi Cepat Administrasi Sistem
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    to="/app/users"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/20 text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100/70 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={15} weight="bold" />
                      <span>Manajemen Akun &amp; Role Pengguna</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/audit-logs"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={15} weight="bold" />
                      <span>Log Audit Sistem Mendalam</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                  <Link
                    to="/app/settings"
                    className="w-full inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench size={15} weight="bold" />
                      <span>Pengaturan &amp; Parameter Sistem</span>
                    </span>
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>

              {/* Beban Kerja Ahli K3 */}
              <InspectorWorkloadCard workload={data?.inspectorWorkload || []} />

              {/* Log Aktivitas Terkini */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
                <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Log Aktivitas Terkini
                    </h2>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    {(data?.recentActivities || []).length} entri
                  </span>
                </div>

                <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[340px] overflow-y-auto">
                  {(data?.recentActivities || []).length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">
                      Belum ada aktivitas tercatat hari ini.
                    </p>
                  ) : (
                    (data?.recentActivities || []).map((act) => (
                      <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 mt-0.5">
                          <User size={13} weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                            {act.action?.replace(/_/g, ' ') || 'Aktivitas'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {act.user_name || 'Sistem'} · {act.user_role || '-'}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                            {formatRelativeTime(act.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. Lower Section: Sebaran Geografis Objek Uji (khusus untuk selain Marketing, karena Marketing sudah tampil di atas) */}
      {!isMarketing && (
        <section aria-label="Sebaran Geografis Objek Uji K3">
          <IndonesiaMapWidget regions={data?.analytics?.regionalMapping || []} />
        </section>
      )}

      {poCreatorOpen && (
        <Suspense fallback={null}>
          <DashboardPoCreator open={poCreatorOpen} onClose={() => setPoCreatorOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
