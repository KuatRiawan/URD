import { Link } from 'react-router';
import {
  Alarm,
  ArrowClockwise,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Certificate,
  ChartLineUp,
  CheckCircle,
  Clock,
  DownloadSimple,
  HourglassMedium,
  Plus,
  ShieldCheck,
  User,
  UsersThree,
  Wrench
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { SplineAreaChart } from '../SplineAreaChart.jsx';
import { IndonesiaMapWidget } from '../IndonesiaMapWidget.jsx';
import { WorkQueueWidget } from '../WorkQueueWidget.jsx';
import { formatRelativeTime } from '../../../lib/utils/format.js';

export function ManagementDashboardView({
  user,
  data,
  loadSummary,
  refreshing,
  period,
  setPeriod
}) {
  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dasbor Operasional"
        subtitle="Pembaruan berkala · Terhubung langsung ke data operasional PT Upaya Riksa Daya"
        actions={
          <>
            {['ADMIN_KANTOR', 'ADMIN_SISTEM', 'MARKETING'].includes(user?.role) && (
              <Link
                to="/app/orders"
                className="inline-flex items-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a61717] transition-all shadow-xs"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Catat PO Baru</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => loadSummary(true)}
              disabled={refreshing}
              title="Perbarui data"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowClockwise
                size={16}
                weight="bold"
                className={refreshing ? 'animate-spin text-[#C81E1E]' : ''}
              />
            </button>
            <a
              href="/api/v1/dashboard/export-recap.csv"
              title="Ekspor Rekap CSV"
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
            >
              <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            </a>
          </>
        }
      />

      {/* 2. Metis Horizontal Stats Counter Cards (4-column grid) */}
      <section aria-label="Metrik Operasional Utama" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PO & Order Berjalan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Briefcase size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Order Berjalan
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                {m.activeOrders}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1.5">
                <ArrowUp size={12} weight="bold" />
                <span>{m.newOrders} PO baru</span>
                <span className="text-slate-400 dark:text-slate-600 font-normal">· {m.completedOrders} selesai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Objek Uji & Perusahaan Klien */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-brand-500/10 dark:bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-brand-500/20 flex items-center justify-center shrink-0">
              <Wrench size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Objek Uji Aktif
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

        {/* Card 3: LHPP Siap Finalisasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <HourglassMedium size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                LHPP Siap Finalisasi
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-tight">
                {m.lhppWaitingReview}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1.5">
                <CheckCircle size={13} weight="bold" className="text-emerald-500" />
                <span>{m.lhppPublished} LHPP disetujui terbit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Suket Mendekati Masa Berlaku */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Certificate size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Suket &le; 90 Hari
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#C81E1E] dark:text-rose-400 tabular-nums leading-none tracking-tight">
                {m.suketExpiring90d}
              </div>
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1.5">
                <Alarm size={13} weight="bold" />
                <span>{m.suketExpiring30d} dalam &le; 30 hari</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Metis Main Section: 8-Column Trend Chart & Work Queue + 4-Column Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8-cols): Operational Overview Chart & Pipeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
            {/* Metis Card Header with Period Buttons */}
            <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ChartLineUp size={18} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                  <span>Tren &amp; Volume Riksa Uji</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Perbandingan order masuk dan pekerjaan yang terselesaikan
                </p>
              </div>

              {/* Metis Signature Period Button Group */}
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold self-start sm:self-center shadow-2xs">
                {['7D', '30D', '90D', '1Y'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      period === p
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Metis Spline Chart Body */}
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
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  Arahkan kursor pada kurva untuk detail
                </span>
              </div>

              <SplineAreaChart
                monthlyTrend={data?.analytics?.monthlyTrend || []}
                period={period}
              />
            </div>

            {/* Metis Operational Pipeline Strip */}
            <div className="border-t border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Order Baru
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{m.newOrders || 0}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Dalam Proses
                  </p>
                  <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">{m.activeOrders || 0}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Siap Finalisasi
                  </p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">{m.lhppWaitingReview || 0}</p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/80">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    LHPP Terbit
                  </p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{m.lhppPublished || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Queue */}
          <WorkQueueWidget onRefresh={() => loadSummary(true)} />
        </div>

        {/* Right Column (4-cols): Recent Activity Stream */}
        <div className="lg:col-span-4 space-y-6">
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

            <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[460px] overflow-y-auto">
              {(data?.recentActivities || []).length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
                  Belum ada aktivitas operasional tercatat hari ini.
                </p>
              ) : (
                (data?.recentActivities || []).map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
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

          {/* Quick Help Card */}
          <div className="rounded-xl border border-rose-200/70 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/20 dark:to-slate-900 p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 text-[#C81E1E] dark:text-rose-400">
              <ShieldCheck size={20} weight="bold" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Integritas Riksa Uji K3
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Seluruh proses riksa uji dari pencatatan PO multi-unit, lembar kerja digital, BAP, hingga penerbitan LHPP dilindungi oleh jejak audit sistem yang tidak dapat diubah (append-only).
            </p>
            <div className="pt-1">
              <Link
                to="/app/audit-log"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
              >
                <span>Buka Log Audit Lengkap</span>
                <ArrowRight size={13} weight="bold" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Lower Section: Sebaran Geografis Objek Uji */}
      <section aria-label="Sebaran Geografis Objek Uji K3">
        <IndonesiaMapWidget provinceDistribution={data?.analytics?.provinceDistribution || []} />
      </section>
    </div>
  );
}

