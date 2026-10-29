import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Alarm,
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Briefcase,
  CalendarCheck,
  Certificate,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Clock,
  DownloadSimple,
  FileText,
  HourglassMedium,
  ListChecks,
  MapPin,
  Plus,
  Scroll,
  ShieldCheck,
  ShieldWarning,
  UsersThree,
  WarningCircle,
  WarningOctagon,
  Wrench
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/feedback/StateViews.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { TableWrapper, TableHead, TableBody, TableRow, TableCell } from '../../components/ui/TableWrapper.jsx';
import { WorkQueueWidget } from './WorkQueueWidget.jsx';
import { SplineAreaChart } from './SplineAreaChart.jsx';
import { IndonesiaMapWidget } from './IndonesiaMapWidget.jsx';
import { api } from '../../lib/api/axios.js';
import {
  extractErrorMessage,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  ORDER_STATUS_LABELS,
  ROLE_LABELS,
  SERVICE_TYPE_LABELS
} from '../../lib/utils/format.js';

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30D');

  const loadSummary = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const res = await api.get('/dashboard/summary');
      setData(res.data);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleDownloadPdf = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  if (loading) return <LoadingState message="Memuat ringkasan operasional PT Upaya Riksa Daya..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadSummary()} />;
  if (!data) return null;

  const m = data.metrics || {};
  const isInspector = user?.role === 'AHLI_K3';

  // ---------------------------------------------------------------------------
  // TAMPILAN KHUSUS AHLI K3 (LAPANGAN) - METIS THEME
  // ---------------------------------------------------------------------------
  if (isInspector) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dasbor Lapangan Ahli K3"
          subtitle="Penugasan aktif, lembar pengujian riksa uji, BAP, dan dokumen LHPP Anda"
          actions={
            <>
              <Link
                to="/app/inspections"
                className="inline-flex items-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a61717] transition-all shadow-xs"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Form Uji Lapangan</span>
              </Link>
              <button
                type="button"
                onClick={() => loadSummary(true)}
                disabled={refreshing}
                title="Perbarui data"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
              >
                <ArrowClockwise
                  size={16}
                  weight="bold"
                  className={refreshing ? 'animate-spin text-[#C81E1E]' : ''}
                />
              </button>
            </>
          }
        />

        {/* Metis Horizontal Stats Cards Grid */}
        <section aria-label="Metrik Kerja Ahli K3" className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: PO Aktif */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-lg bg-brand-500/10 dark:bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-brand-500/20 flex items-center justify-center shrink-0">
                <ClipboardText size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 ms-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  PO Aktif
                </p>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {m.activeAssignments}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {m.pendingConfirmation} menunggu konfirmasi
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Form Uji Draf */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FileText size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 ms-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Form Uji Draf
                </p>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {m.draftInspections}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Sedang dikerjakan
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Draf BAP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Scroll size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 ms-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Berita Acara
                </p>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                  {m.draftBap || 0}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {m.finalBap || 0} BAP final
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Perlu Revisi */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <WarningOctagon size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 ms-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Perlu Revisi
                </p>
                <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums leading-none">
                  {m.returnedLhpp}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Dikembalikan reviewer
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: LHPP Terbit */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0 ms-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  LHPP Terbit
                </p>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                  {m.publishedLhpp}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Disetujui Pimpinan
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metis 2-Column Section: Work Queue + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <WorkQueueWidget />
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
              <div className="px-5 py-3.5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Aktivitas Penugasan Terkini
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Live Feed</span>
              </div>
              <div className="p-4 flex-1 overflow-y-auto max-h-80 scrollbar-thin divide-y divide-slate-100 dark:divide-slate-800">
                {!data.recentActivities?.length ? (
                  <p className="text-xs text-slate-400 text-center py-8">Belum ada aktivitas baru.</p>
                ) : (
                  data.recentActivities.map((act) => (
                    <div key={act.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                      <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs">
                        <Clock size={14} weight="bold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {act.action || 'Aktivitas'} · {act.entity || 'Sistem'}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {act.user_name || 'Sistem'} · {formatRelativeTime(act.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metis Table Card: Daftar Unit Alat yang Ditugaskan */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Unit Alat yang Ditugaskan kepada Anda ({(data.assignedUnits || []).length} Unit)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar objek uji lapangan, status Berita Acara (BAP), dan laporan hasil (LHPP)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <Link to="/app/bap" className="text-[#C81E1E] dark:text-rose-400 hover:underline">
                Buka Arsip BAP
              </Link>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <Link to="/app/lhpp" className="text-slate-600 dark:text-slate-300 hover:underline">
                Buka Arsip LHPP
              </Link>
            </div>
          </div>

          {!data.assignedUnits?.length ? (
            <div className="p-8">
              <EmptyState
                title="Belum Ada Unit Alat yang Ditugaskan"
                description="Unit alat dari PO yang ditugaskan kepada Anda akan tampil lengkap beserta jadwal, status BAP, dan LHPP di sini."
              />
            </div>
          ) : (
            <TableWrapper containerClassName="border-0 shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableCell isHeader>Nomor PO &amp; Klien</TableCell>
                  <TableCell isHeader>Unit Alat &amp; Spesifikasi</TableCell>
                  <TableCell isHeader>Jadwal &amp; Layanan</TableCell>
                  <TableCell isHeader>Status &amp; Dokumen</TableCell>
                  <TableCell isHeader className="text-right">Aksi Pelaksanaan</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {data.assignedUnits.map((u) => (
                  <TableRow key={`${u.order_id}-${u.object_id}`}>
                    <TableCell>
                      <div className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
                        {u.po_number || u.order_no}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{u.client_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {u.location_name || u.install_location || u.client_address || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{u.object_name}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{u.category_code}</span> ·
                        SN: <span className="font-mono font-semibold">{u.serial_number}</span>{' '}
                        {u.capacity ? `· ${u.capacity}` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {u.start_at ? formatDateTime(u.start_at) : 'Belum dijadwalkan'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {SERVICE_TYPE_LABELS[u.service_type] || u.service_type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={u.unit_status} />
                      {u.bap_no && (
                        <div className="mt-1 font-mono text-[11px] font-bold text-[#C81E1E] dark:text-rose-400">
                          BAP: {u.bap_no} ({u.bap_status})
                        </div>
                      )}
                      {u.lhpp_no && (
                        <div className="mt-0.5 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          LHPP: {u.lhpp_no} ({u.lhpp_status})
                        </div>
                      )}
                      {u.review_notes && u.lhpp_status === 'DIKEMBALIKAN' && (
                        <div className="mt-1 text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                          Catatan: {u.review_notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <Link
                          to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white font-bold hover:bg-[#a61717] text-xs shadow-2xs"
                        >
                          {u.inspection_status === 'TERKIRIM' ? 'Lihat Form Uji' : 'Kerjakan Uji'}
                        </Link>
                        {u.bap_id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadPdf(
                                `/bap/${u.bap_id}/pdf`,
                                `${(u.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            <span>BAP</span>
                          </button>
                        )}
                        {u.lhpp_id && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadPdf(
                                `/lhpp/${u.lhpp_id}/pdf`,
                                `${(u.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/60"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            <span>LHPP</span>
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrapper>
          )}
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TAMPILAN DASHBOARD UTAMA (ADMIN SISTEM, ADMIN KANTOR, PIMPINAN) - METIS THEME
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dasbor Operasional & Manajemen K3"
        subtitle="Pembaruan berkala · Terhubung langsung ke data operasional PT Upaya Riksa Daya"
        actions={
          <>
            {['ADMIN_KANTOR', 'ADMIN_SISTEM'].includes(user?.role) && (
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
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs"
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

        {/* Card 3: LHPP Menunggu Review */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center">
            <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <HourglassMedium size={22} weight="bold" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0 ms-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                Review LHPP
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
                    className={`px-3 py-1 rounded-md transition-all ${
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
                monthlyTrend={data.analytics?.monthlyTrend || []}
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
                    Review LHPP
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

          {/* Unified Work Queue (Action Queue) */}
          <WorkQueueWidget />
        </div>

        {/* Right Column (4-cols): Metis Signature Recent Activity Feed */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Log Aktivitas Terkini
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Riwayat audit &amp; penanganan sistem
                </p>
              </div>
              <Link
                to="/app/audit-logs"
                className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
              >
                Semua Log →
              </Link>
            </div>

            {/* Metis Activity Feed List */}
            <div className="p-4 flex-1 overflow-y-auto max-h-[560px] scrollbar-thin divide-y divide-slate-100 dark:divide-slate-800">
              {!data.recentActivities?.length ? (
                <p className="text-xs text-slate-400 text-center py-12">Belum ada aktivitas tercatat.</p>
              ) : (
                data.recentActivities.map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      <Clock size={16} weight="bold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                        {act.action || 'Aktivitas'} · <span className="font-mono text-slate-600 dark:text-slate-400">{act.entity || 'Sistem'}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {act.user_name || 'Sistem'} ({ROLE_LABELS[act.user_role] || act.user_role || 'Sistem'})
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatRelativeTime(act.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Metis Secondary Section: Recent Orders Table (8-cols) + Distribution Card (4-cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8-cols): Recent Orders Table */}
        <section className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Purchase Order Terbaru
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pekerjaan riksa uji yang baru dicatat dan sedang berjalan
              </p>
            </div>
            <Link
              to="/app/orders"
              className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
            >
              Kelola Semua Order →
            </Link>
          </div>

          {!data.recentOrders?.length ? (
            <div className="p-6">
              <EmptyState
                title="Belum Ada Order Pemeriksaan"
                description="Order pemeriksaan yang baru dicatat akan tampil secara otomatis pada tabel ini."
              />
            </div>
          ) : (
            <TableWrapper containerClassName="border-0 shadow-none rounded-none">
              <TableHead>
                <tr>
                  <TableCell isHeader>Nomor Order</TableCell>
                  <TableCell isHeader>Perusahaan Klien</TableCell>
                  <TableCell isHeader>Layanan</TableCell>
                  <TableCell isHeader>Status</TableCell>
                  <TableCell isHeader>Tanggal</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {data.recentOrders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono font-bold">
                      <Link
                        to={`/app/orders?orderId=${ord.id}`}
                        className="text-[#C81E1E] dark:text-rose-400 hover:underline"
                      >
                        {ord.order_no}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                      {ord.client_name}
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                      {SERVICE_TYPE_LABELS[ord.service_type] || ord.service_type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={ord.status}
                        label={ORDER_STATUS_LABELS[ord.status] || ord.status}
                      />
                    </TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                      {formatDate(ord.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrapper>
          )}
        </section>

        {/* Right (4-cols): Metis Status & Equipment Distribution Card */}
        <section className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <ChartBar size={18} className="text-[#C81E1E] dark:text-rose-400" weight="bold" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Distribusi Objek per Bidang K3
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Komposisi</span>
            </div>

            {(() => {
              const cats = data.analytics?.categoryDistribution || [];
              const totalUnits = cats.reduce((acc, c) => acc + Number(c.unit_count || 0), 0);
              const maxCount = Math.max(...cats.map((c) => Number(c.unit_count || 0)), 1);

              return (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>Total Database Unit</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{totalUnits} Unit</span>
                  </div>
                  <div className="space-y-3">
                    {cats.slice(0, 5).map((cat) => {
                      const count = Number(cat.unit_count || 0);
                      const pct = totalUnits > 0 ? Math.round((count / totalUnits) * 100) : 0;
                      const barWidth = Math.round((count / maxCount) * 100);
                      return (
                        <div key={cat.code} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {cat.code}{' '}
                              <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                                ({cat.name})
                              </span>
                            </span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {count} unit ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              style={{ width: `${barWidth}%` }}
                              className="h-full rounded-full bg-[#C81E1E] dark:bg-rose-500"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>
      </div>

      {/* 5. Peta Interaktif Sebaran Wilayah Pengujian Indonesia */}
      {data.analytics?.regionalMapping && (
        <IndonesiaMapWidget regions={data.analytics.regionalMapping} />
      )}

      {/* 6. Beban Kerja Tim Ahli K3 */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Beban Kerja Tim Ahli K3
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi penugasan lapangan dan kapasitas personel
            </p>
          </div>
          <Link
            to="/app/schedule"
            className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 hover:underline"
          >
            Jadwal &amp; Penugasan →
          </Link>
        </div>

        {!data.inspectorWorkload?.length ? (
          <div className="p-6">
            <EmptyState title="Belum Ada Personel Ahli K3 Terdaftar" />
          </div>
        ) : (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {data.inspectorWorkload.map((ins) => (
              <div
                key={ins.id}
                className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{ins.full_name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {ins.completed_inspections} inspeksi selesai disetujui
                  </p>
                </div>
                <span className="shrink-0 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 text-xs shadow-2xs">
                  {ins.active_assignments} Tugas Aktif
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
