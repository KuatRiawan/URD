import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Alarm,
  ArrowClockwise,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Briefcase,
  Building,
  CalendarBlank,
  CalendarCheck,
  Camera,
  Certificate,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Clock,
  DownloadSimple,
  FileText,
  Funnel,
  HourglassMedium,
  ListChecks,
  MagnifyingGlass,
  MapPin,
  PenNib,
  Phone,
  Plus,
  Scroll,
  ShieldCheck,
  ShieldWarning,
  Sparkle,
  SquaresFour,
  Table,
  User,
  UsersThree,
  WarningCircle,
  WarningOctagon,
  WhatsappLogo,
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
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldStatusFilter, setFieldStatusFilter] = useState('ALL');
  const [fieldViewMode, setFieldViewMode] = useState('CARDS');

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
  const isInspector = ['INSPECTOR', 'AHLI_K3'].includes(user?.role);

  const assignedUnits = data.assignedUnits || [];
  const todoUnits = assignedUnits.filter((u) =>
    ['BELUM_DIJADWALKAN', 'TERJADWAL', 'DITUGASKAN'].includes(u.unit_status)
  );
  const inProgressUnits = assignedUnits.filter((u) =>
    ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status)
  );
  const waitingDocsUnits = assignedUnits.filter((u) =>
    [
      'MENUNGGU_TTD',
      'PEMERIKSAAN_TERKIRIM',
      'FORM_TERKIRIM',
      'LHPP_DRAF',
      'LHPP_DIPROSES',
      'LHPP_SIAP_PREVIEW',
      'BAP_DRAF',
      'BAP_DIPROSES',
      'BAP_SIAP_PREVIEW'
    ].includes(u.unit_status)
  );
  const doneUnits = assignedUnits.filter((u) =>
    [
      'LHPP_FINAL',
      'LHPP_TERBIT',
      'BAP_FINAL',
      'SIAP_DISTRIBUSI',
      'SEBAGIAN_DOKUMEN_DIKIRIM',
      'SELESAI'
    ].includes(u.unit_status)
  );

  const filteredAssignedUnits = assignedUnits.filter((u) => {
    if (fieldSearch.trim()) {
      const q = fieldSearch.toLowerCase();
      const match =
        (u.object_name && u.object_name.toLowerCase().includes(q)) ||
        (u.serial_number && u.serial_number.toLowerCase().includes(q)) ||
        (u.client_name && u.client_name.toLowerCase().includes(q)) ||
        (u.po_number && u.po_number.toLowerCase().includes(q)) ||
        (u.order_no && u.order_no.toLowerCase().includes(q)) ||
        (u.location_name && u.location_name.toLowerCase().includes(q)) ||
        (u.location_address && u.location_address.toLowerCase().includes(q)) ||
        (u.category_code && u.category_code.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (fieldStatusFilter === 'TODO') {
      return ['BELUM_DIJADWALKAN', 'TERJADWAL', 'DITUGASKAN'].includes(u.unit_status);
    }
    if (fieldStatusFilter === 'IN_PROGRESS') {
      return ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status);
    }
    if (fieldStatusFilter === 'WAITING_DOCS') {
      return [
        'MENUNGGU_TTD',
        'PEMERIKSAAN_TERKIRIM',
        'FORM_TERKIRIM',
        'LHPP_DRAF',
        'LHPP_DIPROSES',
        'LHPP_SIAP_PREVIEW',
        'BAP_DRAF',
        'BAP_DIPROSES',
        'BAP_SIAP_PREVIEW'
      ].includes(u.unit_status);
    }
    if (fieldStatusFilter === 'DONE') {
      return [
        'LHPP_FINAL',
        'LHPP_TERBIT',
        'BAP_FINAL',
        'SIAP_DISTRIBUSI',
        'SEBAGIAN_DOKUMEN_DIKIRIM',
        'SELESAI'
      ].includes(u.unit_status);
    }
    return true;
  });

  // ---------------------------------------------------------------------------
  // TAMPILAN KHUSUS INSPECTOR (FIELD-FIRST & MOBILE/TABLET OPTIMIZED)
  // ---------------------------------------------------------------------------
  if (isInspector) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dasbor Lapangan Inspector"
          subtitle="Fokus riksa uji lapangan, pengisian checklist alat K3, dokumentasi foto, dan tanda tangan digital"
          actions={
            <>
              <Link
                to="/app/inspections"
                className="inline-flex items-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#a61717] transition-all shadow-xs"
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

        {/* 4 Kartu Metrik Praktis Lapangan (Tanpa Grafik Rumit) */}
        <section aria-label="Ringkasan Kerja Lapangan" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Total Unit Ditugaskan */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Wrench size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Unit Ditugaskan
                </p>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {assignedUnits.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {m.activeAssignments || 0} PO aktif berjalan
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Sedang Dikerjakan / Draf */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FileText size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Sedang Dikerjakan
                </p>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {inProgressUnits.length || m.draftInspections || 0}
                </div>
                <div className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1 truncate">
                  Checklist sedang diisi
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Menunggu TTD / BAP */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Scroll size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  Menunggu TTD / BAP
                </p>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                  {waitingDocsUnits.length || m.draftBap || 0}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  TTD PIC &amp; Inspector
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Selesai / LHPP Final */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                  LHPP Final &amp; Terbit
                </p>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                  {doneUnits.length || m.publishedLhpp || 0}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                  Dokumen riksa uji selesai
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Banner Panduan Riksa Uji Lapangan Ringkas */}
        <div className="rounded-xl border border-brand-500/20 bg-rose-50/50 dark:bg-rose-950/20 p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#C81E1E] text-white flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck size={18} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Mode Riksa Uji Lapangan Aktif
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Pastikan identitas unit alat sesuai kondisi fisik, isi form butir uji wajib, ambil foto dokumentasi temuan, dan lakukan penandatanganan digital bersama PIC Klien di lokasi.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
            <Link
              to="/app/bap"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Arsip BAP
            </Link>
            <Link
              to="/app/lhpp"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Arsip LHPP
            </Link>
          </div>
        </div>

        {/* Section Utama: Daftar Unit Alat dengan Kontrol Filter & Switch Tampilan */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Unit Alat yang Ditugaskan</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {filteredAssignedUnits.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih unit alat di bawah untuk membuka form checklist dan dokumentasi riksa uji
                </p>
              </div>

              {/* View Switcher: Card vs Table */}
              <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setFieldViewMode('CARDS')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    fieldViewMode === 'CARDS'
                      ? 'bg-[#C81E1E] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <SquaresFour size={14} weight="bold" />
                  <span>Kartu Lapangan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFieldViewMode('TABLE')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    fieldViewMode === 'TABLE'
                      ? 'bg-[#C81E1E] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Table size={14} weight="bold" />
                  <span>Tabel Ringkas</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Cari nama alat, no seri, klien, PO, atau lokasi..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#C81E1E] dark:focus:border-rose-500"
                />
              </div>

              {/* Status Filter Tabs (Touch Friendly) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFieldStatusFilter('ALL')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    fieldStatusFilter === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Semua ({assignedUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldStatusFilter('TODO')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    fieldStatusFilter === 'TODO'
                      ? 'bg-[#C81E1E] text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Perlu Diperiksa ({todoUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldStatusFilter('IN_PROGRESS')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    fieldStatusFilter === 'IN_PROGRESS'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Sedang Berjalan ({inProgressUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldStatusFilter('WAITING_DOCS')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    fieldStatusFilter === 'WAITING_DOCS'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Menunggu TTD / Dokumen ({waitingDocsUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldStatusFilter('DONE')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                    fieldStatusFilter === 'DONE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Selesai ({doneUnits.length})
                </button>
              </div>
            </div>
          </div>

          {/* Isi Konten: Kartu Lapangan vs Tabel Ringkas */}
          {!filteredAssignedUnits.length ? (
            <div className="p-8">
              <EmptyState
                title="Tidak Ada Unit Alat yang Sesuai"
                description={
                  fieldSearch || fieldStatusFilter !== 'ALL'
                    ? 'Tidak ada unit alat yang cocok dengan filter atau kata kunci pencarian Anda.'
                    : 'Belum ada unit alat yang ditugaskan kepada Anda saat ini.'
                }
              />
            </div>
          ) : fieldViewMode === 'CARDS' ? (
            /* TAMPILAN KARTU LAPANGAN (TOUCH FRIENDLY FOR FIELD TABLETS / MOBILES) */
            <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignedUnits.map((u) => {
                const isCompleted = ['LHPP_FINAL', 'LHPP_TERBIT', 'BAP_FINAL', 'SIAP_DISTRIBUSI', 'SELESAI'].includes(
                  u.unit_status
                );
                const isInProgress = ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status);
                const isWaitingSign = ['MENUNGGU_TTD', 'PEMERIKSAAN_TERKIRIM'].includes(u.unit_status);

                return (
                  <div
                    key={`${u.order_id}-${u.object_id}`}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                  >
                    <div className="space-y-3.5">
                      {/* Top Bar: Kategori & Status Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-[#C81E1E] dark:text-rose-400 font-extrabold text-[11px] tracking-wide">
                          <span>{u.category_code}</span>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {u.category_name || 'Riksa Uji K3'}
                          </span>
                        </div>
                        <StatusBadge status={u.unit_status} />
                      </div>

                      {/* Judul Alat & Spesifikasi Utama */}
                      <div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                          {u.object_name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>
                            No. Seri: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{u.serial_number}</span>
                          </span>
                          {u.capacity && (
                            <>
                              <span>·</span>
                              <span>Kapasitas: <span className="font-semibold text-slate-700 dark:text-slate-300">{u.capacity}</span></span>
                            </>
                          )}
                          {u.install_location && (
                            <>
                              <span>·</span>
                              <span>Lokasi: {u.install_location}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Informasi Klien & Lokasi Kerja */}
                      <div className="rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 p-3 space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <Building size={16} className="text-slate-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100">{u.client_name}</p>
                            <p className="text-[11px] text-[#C81E1E] dark:text-rose-400 font-mono font-semibold">
                              PO: {u.po_number || u.order_no}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                          <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed">
                            {u.location_name ? `${u.location_name} - ` : ''}
                            {u.location_address || u.client_address || 'Alamat lokasi pemeriksaan'}
                            {u.location_city ? `, ${u.location_city}` : ''}
                          </p>
                        </div>

                        {/* Kontak PIC Lapangan dengan Tombol Cepat */}
                        {(u.contact_name || u.contact_phone) && (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <User size={14} className="text-slate-400 shrink-0" />
                              <span className="font-semibold truncate">PIC: {u.contact_name || 'PIC Klien'}</span>
                            </div>
                            {u.contact_phone && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${u.contact_phone}`}
                                  title="Hubungi PIC via Telepon"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-semibold hover:bg-slate-300"
                                >
                                  <Phone size={12} weight="bold" />
                                  <span>Telepon</span>
                                </a>
                                <a
                                  href={`https://wa.me/${u.contact_phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Hubungi PIC via WhatsApp"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold hover:bg-emerald-200"
                                >
                                  <WhatsappLogo size={13} weight="bold" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Jadwal Pelaksanaan */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <CalendarBlank size={15} className="text-slate-400 shrink-0" />
                        <span>
                          Jadwal: <span className="font-semibold text-slate-800 dark:text-slate-200">{u.start_at ? formatDateTime(u.start_at) : 'Belum dijadwalkan'}</span>
                        </span>
                        <span>·</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {SERVICE_TYPE_LABELS[u.service_type] || u.service_type}
                        </span>
                      </div>

                      {/* Nomor Dokumen jika sudah terbit */}
                      {(u.bap_no || u.lhpp_no) && (
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs space-y-1">
                          {u.bap_no && (
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-slate-500">No. BAP:</span>
                              <span className="font-bold text-[#C81E1E] dark:text-rose-400">{u.bap_no}</span>
                            </div>
                          )}
                          {u.lhpp_no && (
                            <div className="flex items-center justify-between font-mono text-[11px]">
                              <span className="text-slate-500">No. LHPP:</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{u.lhpp_no}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Catatan Review bila ada koreksi */}
                      {u.review_notes && (
                        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 p-2.5 text-xs text-rose-800 dark:text-rose-300">
                          <span className="font-bold">Catatan Perbaikan: </span>
                          <span>{u.review_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Lapangan yang Menonjol & Mudah Ditekan */}
                    <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <Link
                        to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
                        className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-xs"
                      >
                        {isInProgress ? (
                          <>
                            <ClipboardText size={18} weight="bold" />
                            <span>Lanjutkan Ceklis &amp; Foto</span>
                          </>
                        ) : isWaitingSign ? (
                          <>
                            <PenNib size={18} weight="bold" />
                            <span>Tanda Tangan &amp; Finalisasi</span>
                          </>
                        ) : isCompleted ? (
                          <>
                            <FileText size={18} weight="bold" />
                            <span>Lihat Hasil Pengujian</span>
                          </>
                        ) : (
                          <>
                            <Wrench size={18} weight="bold" />
                            <span>Mulai Riksa Uji Lapangan</span>
                          </>
                        )}
                      </Link>

                      {/* Tombol Cepat Unduh Dokumen (jika BAP / LHPP sudah ada) */}
                      {(u.bap_id || u.lhpp_id) && (
                        <div className="flex items-center gap-2 pt-1">
                          {u.bap_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadPdf(
                                  `/bap/${u.bap_id}/pdf`,
                                  `${(u.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                                )
                              }
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs"
                            >
                              <DownloadSimple size={14} weight="bold" />
                              <span>Unduh BAP</span>
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
                              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs"
                            >
                              <DownloadSimple size={14} weight="bold" />
                              <span>Unduh LHPP</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAMPILAN TABEL RINGKAS (UNTUK INSPEKSI CEPAT BARIS PER BARIS) */
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
                {filteredAssignedUnits.map((u) => (
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

        {/* Antrean Pekerjaan Saya (Work Queue) untuk Notifikasi Tindak Lanjut */}
        <section aria-label="Antrean Pekerjaan Saya">
          <WorkQueueWidget />
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
