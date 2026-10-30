import { useCallback, useEffect, useMemo, useState } from 'react';
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

  // Inspector Field Dashboard Filters & Controls
  const [fieldSearch, setFieldSearch] = useState('');
  const [fieldTab, setFieldTab] = useState('TODAY'); // 'TODAY' | 'PENDING' | 'UPCOMING' | 'COMPLETED' | 'ALL'
  const [fieldViewMode, setFieldViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [displayMode, setDisplayMode] = useState('TABBED'); // 'TABBED' | 'STACKED'

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

  const assignedUnits = useMemo(() => data?.assignedUnits || [], [data]);

  // Klasifikasi unit lapangan ke dalam 3 area operasional utama
  const categorizedUnits = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const todayList = [];
    const pendingList = [];
    const upcomingList = [];
    const completedList = [];

    assignedUnits.forEach((u) => {
      const isFinished = [
        'LHPP_FINAL',
        'LHPP_TERBIT',
        'BAP_FINAL',
        'SIAP_DISTRIBUSI',
        'SEBAGIAN_DOKUMEN_DIKIRIM',
        'SELESAI'
      ].includes(u.unit_status);

      if (isFinished) {
        completedList.push(u);
        return;
      }

      let scheduleDateStr = null;
      if (u.start_at) {
        const sDate = new Date(u.start_at);
        scheduleDateStr = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}`;
      }

      const isInspectingNow = u.unit_status === 'SEDANG_DIPERIKSA';
      const isScheduledToday = scheduleDateStr === todayStr;

      if (isScheduledToday || isInspectingNow) {
        todayList.push(u);
        return;
      }

      const isFuture = scheduleDateStr && scheduleDateStr > todayStr;
      if (isFuture) {
        upcomingList.push(u);
        return;
      }

      // Unit yang perlu tindakan lanjutan (checklist belum lengkap, menunggu ttd, dikembalikan, atau draf)
      pendingList.push(u);
    });

    return {
      today: todayList,
      pending: pendingList,
      upcoming: upcomingList,
      completed: completedList
    };
  }, [assignedUnits]);

  // Filter pencarian pada unit yang ditugaskan
  const matchesSearch = useCallback(
    (u) => {
      if (!fieldSearch.trim()) return true;
      const q = fieldSearch.toLowerCase().trim();
      return (
        (u.object_name && String(u.object_name).toLowerCase().includes(q)) ||
        (u.serial_number && String(u.serial_number).toLowerCase().includes(q)) ||
        (u.client_name && String(u.client_name).toLowerCase().includes(q)) ||
        (u.po_number && String(u.po_number).toLowerCase().includes(q)) ||
        (u.order_no && String(u.order_no).toLowerCase().includes(q)) ||
        (u.location_name && String(u.location_name).toLowerCase().includes(q)) ||
        (u.location_address && String(u.location_address).toLowerCase().includes(q)) ||
        (u.category_code && String(u.category_code).toLowerCase().includes(q))
      );
    },
    [fieldSearch]
  );

  const filteredUnitsForTab = useMemo(() => {
    let list = [];
    if (fieldTab === 'TODAY') list = categorizedUnits.today;
    else if (fieldTab === 'PENDING') list = categorizedUnits.pending;
    else if (fieldTab === 'UPCOMING') list = categorizedUnits.upcoming;
    else if (fieldTab === 'COMPLETED') list = categorizedUnits.completed;
    else list = assignedUnits;

    return list.filter(matchesSearch);
  }, [fieldTab, categorizedUnits, assignedUnits, matchesSearch]);

  if (loading) return <LoadingState message="Memuat ringkasan operasional PT Upaya Riksa Daya..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadSummary()} />;
  if (!data) return null;

  const m = data.metrics || {};
  const isInspector = ['INSPECTOR', 'AHLI_K3'].includes(user?.role);

  // ---------------------------------------------------------------------------
  // TAMPILAN KHUSUS INSPECTOR (FIELD-FIRST, 3 AREA OPERASIONAL, MOBILE/TABLET READY)
  // ---------------------------------------------------------------------------
  if (isInspector) {
    const todayFiltered = categorizedUnits.today.filter(matchesSearch);
    const pendingFiltered = categorizedUnits.pending.filter(matchesSearch);
    const upcomingFiltered = categorizedUnits.upcoming.filter(matchesSearch);
    const completedFiltered = categorizedUnits.completed.filter(matchesSearch);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dasbor Lapangan Inspector"
          subtitle="Pekerjaan riksa uji teknis lapangan, verifikasi unit, pengisian checklist, dokumentasi foto, dan tanda tangan digital"
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

        {/* 4 Kartu Status Lapangan Ringkas (Mudah Dibaca di Lapangan) */}
        <section aria-label="Ringkasan Operasional Lapangan" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Pekerjaan Hari Ini */}
          <button
            type="button"
            onClick={() => {
              setFieldTab('TODAY');
              setDisplayMode('TABBED');
            }}
            className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs ${
              fieldTab === 'TODAY'
                ? 'border-[#C81E1E] bg-rose-50/50 dark:bg-rose-950/20 ring-2 ring-[#C81E1E]/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                <CalendarCheck size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-0.5">
                  Pekerjaan Hari Ini
                </p>
                <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                  {categorizedUnits.today.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Unit aktif &amp; terjadwal hari ini
                </div>
              </div>
            </div>
          </button>

          {/* Card 2: Pekerjaan Belum Selesai */}
          <button
            type="button"
            onClick={() => {
              setFieldTab('PENDING');
              setDisplayMode('TABBED');
            }}
            className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs ${
              fieldTab === 'PENDING'
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                <HourglassMedium size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-0.5">
                  Belum Selesai
                </p>
                <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums leading-none">
                  {categorizedUnits.pending.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Draf, TTD, atau revisi
                </div>
              </div>
            </div>
          </button>

          {/* Card 3: Pekerjaan Mendatang */}
          <button
            type="button"
            onClick={() => {
              setFieldTab('UPCOMING');
              setDisplayMode('TABBED');
            }}
            className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs ${
              fieldTab === 'UPCOMING'
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                <CalendarBlank size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-0.5">
                  Pekerjaan Mendatang
                </p>
                <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums leading-none">
                  {categorizedUnits.upcoming.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Terjadwal hari berikutnya
                </div>
              </div>
            </div>
          </button>

          {/* Card 4: Riwayat Selesai */}
          <button
            type="button"
            onClick={() => {
              setFieldTab('COMPLETED');
              setDisplayMode('TABBED');
            }}
            className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs ${
              fieldTab === 'COMPLETED'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle size={22} weight="bold" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                  Riksa Uji Selesai
                </p>
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                  {categorizedUnits.completed.length}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Dokumen LHPP &amp; BAP terbit
                </div>
              </div>
            </div>
          </button>
        </section>

        {/* Kontrol Pencarian, Pilihan Tab, dan Tampilan */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Daftar Unit Operasional Riksa Uji</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {assignedUnits.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih unit alat di bawah untuk membuka form pemeriksaan teknis, dokumentasi foto, dan tanda tangan berita acara
                </p>
              </div>

              {/* Tombol Pengatur Tampilan (Kartu vs Tabel & Tab vs Stacked) */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('TABBED')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      displayMode === 'TABBED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tampilan Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('STACKED')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      displayMode === 'STACKED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua Seksi
                  </button>
                </div>

                <div className="inline-flex items-center p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setFieldViewMode('CARDS')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      fieldViewMode === 'CARDS'
                        ? 'bg-[#C81E1E] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <SquaresFour size={14} weight="bold" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldViewMode('TABLE')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                      fieldViewMode === 'TABLE'
                        ? 'bg-[#C81E1E] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Table size={14} weight="bold" />
                    <span>Tabel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Kolom Pencarian Cepat & Tab Navigasi Lapangan */}
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

              {displayMode === 'TABBED' && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFieldTab('TODAY')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      fieldTab === 'TODAY'
                        ? 'bg-[#C81E1E] text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Hari Ini ({categorizedUnits.today.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('PENDING')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      fieldTab === 'PENDING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Belum Selesai ({categorizedUnits.pending.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('UPCOMING')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      fieldTab === 'UPCOMING'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mendatang ({categorizedUnits.upcoming.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('COMPLETED')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      fieldTab === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Selesai ({categorizedUnits.completed.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('ALL')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all ${
                      fieldTab === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({assignedUnits.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rendering Konten Unit: Berdasarkan Tab atau 3 Area Seksi Stacked */}
          {displayMode === 'TABBED' ? (
            /* MODE TAB TUNGGAL */
            filteredUnitsForTab.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="Tidak Ada Unit pada Kategori Ini"
                  description={
                    fieldSearch
                      ? 'Tidak ada unit alat yang cocok dengan kata kunci pencarian Anda.'
                      : 'Belum ada unit riksa uji pada kelompok ini saat ini.'
                  }
                />
              </div>
            ) : fieldViewMode === 'CARDS' ? (
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUnitsForTab.map((u) => renderInspectorUnitCard(u, handleDownloadPdf))}
              </div>
            ) : (
              renderInspectorUnitTable(filteredUnitsForTab, handleDownloadPdf)
            )
          ) : (
            /* MODE SEMUA 3 SEKSI STACKED */
            <div className="p-4 sm:p-5 space-y-8">
              {/* Seksi 1: Pekerjaan Hari Ini */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#C81E1E]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                      1. Pekerjaan Hari Ini ({todayFiltered.length})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Prioritas Utama</span>
                </div>
                {todayFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                    Tidak ada jadwal riksa uji lapangan baru untuk hari ini.
                  </p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayFiltered.map((u) => renderInspectorUnitCard(u, handleDownloadPdf))}
                  </div>
                ) : (
                  renderInspectorUnitTable(todayFiltered, handleDownloadPdf)
                )}
              </div>

              {/* Seksi 2: Pekerjaan Belum Selesai */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                      2. Pekerjaan Belum Selesai ({pendingFiltered.length})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Perlu Tindakan Lanjutan</span>
                </div>
                {pendingFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                    Semua pemeriksaan yang berjalan telah diselesaikan dan ditandatangani.
                  </p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingFiltered.map((u) => renderInspectorUnitCard(u, handleDownloadPdf))}
                  </div>
                ) : (
                  renderInspectorUnitTable(pendingFiltered, handleDownloadPdf)
                )}
              </div>

              {/* Seksi 3: Pekerjaan Mendatang */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200 dark:border-blue-900/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                      3. Pekerjaan Mendatang ({upcomingFiltered.length})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Persiapan Alat &amp; Berkas</span>
                </div>
                {upcomingFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                    Belum ada penugasan baru yang dijadwalkan pada hari-hari berikutnya.
                  </p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingFiltered.map((u) => renderInspectorUnitCard(u, handleDownloadPdf))}
                  </div>
                ) : (
                  renderInspectorUnitTable(upcomingFiltered, handleDownloadPdf)
                )}
              </div>

              {/* Seksi 4: Riwayat Selesai */}
              {completedFiltered.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/60">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                        4. Riwayat Riksa Uji Selesai ({completedFiltered.length})
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Arsip Terbit</span>
                  </div>
                  {fieldViewMode === 'CARDS' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {completedFiltered.map((u) => renderInspectorUnitCard(u, handleDownloadPdf))}
                    </div>
                  ) : (
                    renderInspectorUnitTable(completedFiltered, handleDownloadPdf)
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Antrean Pekerjaan Saya (Work Queue) */}
        <section aria-label="Antrean Pekerjaan Saya">
          <WorkQueueWidget />
        </section>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // TAMPILAN DASHBOARD UTAMA (ADMIN SISTEM, MARKETING, PIMPINAN) - METIS THEME
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

          {/* Action Queue */}
          <WorkQueueWidget />
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
                {(data.recentActivities || []).length} entri
              </span>
            </div>

            <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[460px] overflow-y-auto">
              {(data.recentActivities || []).length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-8">
                  Belum ada aktivitas operasional tercatat hari ini.
                </p>
              ) : (
                (data.recentActivities || []).map((act) => (
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
        <IndonesiaMapWidget provinceDistribution={data.analytics?.provinceDistribution || []} />
      </section>
    </div>
  );
}

// -----------------------------------------------------------------------------
// HELPER KOMPONEN KARTU UNIT UNTUK INSPECTOR
// -----------------------------------------------------------------------------
function renderInspectorUnitCard(u, handleDownloadPdf) {
  const isCompleted = [
    'LHPP_FINAL',
    'LHPP_TERBIT',
    'BAP_FINAL',
    'SIAP_DISTRIBUSI',
    'SEBAGIAN_DOKUMEN_DIKIRIM',
    'SELESAI'
  ].includes(u.unit_status);
  const isInProgress = ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status);
  const isWaitingSign = ['MENUNGGU_TTD', 'PEMERIKSAAN_TERKIRIM'].includes(u.unit_status);
  const isReturned = u.lhpp_status === 'DIKEMBALIKAN';

  const contactPhone = u.contact_phone || u.client_phone;
  const waNumber = contactPhone ? contactPhone.replace(/\D/g, '').replace(/^0/, '62') : null;

  return (
    <div
      key={`${u.order_id}-${u.object_id}`}
      className={`rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs ${
        isReturned
          ? 'border-rose-400 bg-rose-50/20 dark:border-rose-800 dark:bg-rose-950/10'
          : isInProgress
          ? 'border-blue-300 dark:border-blue-800'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
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

        {/* Informasi Utama Unit Alat */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {u.object_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              SN: <strong className="font-mono text-slate-800 dark:text-slate-200">{u.serial_number}</strong>
            </span>
            {u.capacity && (
              <>
                <span>·</span>
                <span>Kapasitas: <strong className="text-slate-800 dark:text-slate-200">{u.capacity}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Info PO & Perusahaan Klien */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
              PO: {u.po_number || u.order_no}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {SERVICE_TYPE_LABELS[u.service_type] || u.service_type}
            </span>
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{u.client_name}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5 text-[11px]">
            <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {u.location_name ? `${u.location_name} · ` : ''}
              {u.location_address || u.install_location || u.client_address || 'Lokasi belum diinput'}
            </span>
          </div>

          {/* Kontak PIC Lapangan */}
          {contactPhone && (
            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                PIC: <strong className="text-slate-800 dark:text-slate-200">{u.contact_name || 'Petugas Lapangan'}</strong>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${contactPhone}`}
                  title="Hubungi telepon"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                >
                  <Phone size={12} weight="bold" />
                  <span>Telepon</span>
                </a>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Hubungi WhatsApp"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    <WhatsappLogo size={12} weight="bold" />
                    <span>WA</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Catatan Revisi jika LHPP dikembalikan */}
        {isReturned && u.review_notes && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-800 dark:text-rose-300">
            <span className="font-bold flex items-center gap-1 mb-0.5">
              <WarningCircle size={14} weight="bold" /> Catatan Revisi Riksa Uji:
            </span>
            <p>{u.review_notes}</p>
          </div>
        )}
      </div>

      {/* Action Strip: 1 Aksi Utama yang Jelas dan Terarah Sesuai Status */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {u.start_at ? `Jadwal: ${formatDate(u.start_at)}` : 'Jadwal operasional'}
        </div>

        <div className="flex items-center gap-2">
          {isCompleted ? (
            <Link
              to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs font-bold shadow-2xs"
            >
              <CheckCircle size={15} weight="bold" className="text-emerald-600" />
              <span>Lihat Hasil Pemeriksaan</span>
            </Link>
          ) : isInProgress ? (
            <Link
              to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold shadow-2xs"
            >
              <ClipboardText size={15} weight="bold" />
              <span>Lanjutkan Pemeriksaan</span>
            </Link>
          ) : (
            <Link
              to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a61717] transition-all text-xs font-bold shadow-2xs"
            >
              <ClipboardText size={15} weight="bold" />
              <span>Mulai Pemeriksaan</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// HELPER TABEL UNIT UNTUK INSPECTOR
// -----------------------------------------------------------------------------
function renderInspectorUnitTable(units, handleDownloadPdf) {
  return (
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
        {units.map((u) => (
          <TableRow key={`${u.order_id}-${u.object_id}`}>
            <TableCell>
              <div className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
                {u.po_number || u.order_no}
              </div>
              <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{u.client_name}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
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
            </TableCell>
            <TableCell className="text-right">
              <div className="inline-flex items-center justify-end gap-1.5">
                <Link
                  to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs ${
                    [
                      'LHPP_FINAL',
                      'LHPP_TERBIT',
                      'BAP_FINAL',
                      'SIAP_DISTRIBUSI',
                      'SELESAI'
                    ].includes(u.unit_status) || u.inspection_status === 'TERKIRIM'
                      ? 'border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                      : ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-[#C81E1E] text-white hover:bg-[#a61717]'
                  }`}
                >
                  {[
                    'LHPP_FINAL',
                    'LHPP_TERBIT',
                    'BAP_FINAL',
                    'SIAP_DISTRIBUSI',
                    'SELESAI'
                  ].includes(u.unit_status) || u.inspection_status === 'TERKIRIM'
                    ? 'Lihat Hasil'
                    : ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status)
                    ? 'Lanjutkan Uji'
                    : 'Mulai Pemeriksaan'}
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableWrapper>
  );
}
