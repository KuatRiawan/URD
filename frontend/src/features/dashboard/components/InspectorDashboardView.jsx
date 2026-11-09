import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ArrowRight,
  ArrowsClockwise,
  CheckCircle,
  ClipboardText,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  Table,
  WifiHigh,
  WifiSlash,
  X
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { InspectorMetricCards } from './InspectorMetricCards.jsx';
import { InspectorUnitCard } from './InspectorUnitCard.jsx';
import { InspectorUnitTable } from './InspectorUnitTable.jsx';
import { RejectAssignmentModal } from './RejectAssignmentModal.jsx';
import { AssignmentDetailModal } from './AssignmentDetailModal.jsx';
import { InspectionDetailModal } from '../../inspections/components/InspectionDetailModal.jsx';
import { PdfPreviewModal } from '../../inspections/components/PdfPreviewModal.jsx';
import { OfflineSyncDrawer } from '../../inspections/components/OfflineSyncDrawer.jsx';
import { api } from '../../../lib/api/axios.js';
import { getPendingSyncSummary } from '../../../lib/utils/offline-sync.js';

export function InspectorDashboardView({
  user,
  loadSummary,
  categorizedUnits,
  assignedUnits,
  fieldTab,
  setFieldTab,
  _displayMode,
  setDisplayMode,
  fieldViewMode,
  setFieldViewMode,
  fieldSearch,
  setFieldSearch,
  filteredUnitsForTab,
  _matchesSearch,
  onRespondAssignment,
  rejectModalData,
  setRejectModalData,
  rejectReason,
  setRejectReason,
  actionLoading
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const activeInspectionId = searchParams.get('inspectionId') || null;
  const [openingInspection, setOpeningInspection] = useState(false);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (actionError) {
      toast(actionError, 'error');
      setActionError('');
    }
  }, [actionError, toast]);

  // Modal Detail Tugas & Drawer Offline
  const [selectedDetailUnit, setSelectedDetailUnit] = useState(null);
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  // Monitor status offline & pending sync
  useEffect(() => {
    const checkSync = async () => {
      try {
        const sum = await getPendingSyncSummary();
        setPendingSyncCount(sum.totalPending || 0);
      } catch {
        setPendingSyncCount(0);
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 15000);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Pulihkan sesi inspeksi jika halaman di-reload oleh browser mobile saat mengambil foto (hanya pada initial mount)
  useEffect(() => {
    const urlId = searchParams.get('inspectionId');
    if (urlId) {
      try {
        sessionStorage.setItem('urd_active_inspection_id', urlId);
      } catch {
        void 0;
      }
    } else {
      try {
        const storedId = sessionStorage.getItem('urd_active_inspection_id');
        if (storedId) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set('inspectionId', storedId);
              return next;
            },
            { replace: true }
          );
        }
      } catch {
        void 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenInspection = async (u) => {
    const targetId = u.inspection_id;
    if (targetId) {
      try {
        sessionStorage.setItem('urd_active_inspection_id', targetId);
      } catch {
        void 0;
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('inspectionId', targetId);
          return next;
        },
        { replace: true }
      );
      return;
    }
    try {
      setOpeningInspection(true);
      const res = await api.post('/inspections/start', {
        orderId: u.order_id,
        objectId: u.object_id
      });
      const newId = res.data?.inspection?.id;
      if (newId) {
        try {
          sessionStorage.setItem('urd_active_inspection_id', newId);
        } catch {
          void 0;
        }
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('inspectionId', newId);
            return next;
          },
          { replace: true }
        );
      }
      if (loadSummary) loadSummary(true);
    } catch (err) {
      setActionError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal membuka lembar pemeriksaan.'
      );
    } finally {
      setOpeningInspection(false);
    }
  };

  const handleCloseInspection = () => {
    try {
      sessionStorage.removeItem('urd_active_inspection_id');
    } catch {
      void 0;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('inspectionId');
        return next;
      },
      { replace: true }
    );
    if (loadSummary) loadSummary(true);
  };

  const handlePreviewPdf = async (endpoint, title, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfTitle(title);
      setPreviewPdfFilename(filename || 'dokumen.pdf');
      setPdfPreviewModalOpen(true);
    } catch {
      setActionError('Gagal memuat pratinjau dokumen PDF.');
    }
  };

  const activeTodayUnit =
    categorizedUnits.today.find((u) => u.unit_status !== 'SELESAI') ||
    categorizedUnits.today[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================================================== */}
      {/* TAMPILAN MOBILE: Ringkas, Ergonomis, Khusus Operasional Lapangan */}
      {/* ============================================================== */}
      <div className="sm:hidden space-y-3.5">
        {/* 1. Header Ringkas + Status Offline/Sync */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
              Halo, {user?.fullName?.split(' ')[0] || 'Inspector'}
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Tugas Riksa Uji
            </h1>
          </div>

          {/* Tombol Status Offline / Sync */}
          <button
            type="button"
            onClick={() => setOfflineDrawerOpen(true)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs border ${
              !isOnline
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                : pendingSyncCount > 0
                ? 'bg-rose-50 text-[#C81E1E] border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
            }`}
            title="Buka panel status penyimpanan offline &amp; antrean sinkronisasi"
          >
            {!isOnline ? (
              <>
                <WifiSlash size={14} weight="bold" />
                <span>Offline</span>
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <ArrowsClockwise size={14} weight="bold" className="animate-spin" />
                <span>{pendingSyncCount} Antrean</span>
              </>
            ) : (
              <>
                <WifiHigh size={14} weight="bold" />
                <span>Online</span>
              </>
            )}
          </button>
        </div>

        {/* 2. Floating Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Cari alat, nomor seri, klien, PO..."
            className="w-full h-11 pl-3.5 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E] shadow-2xs"
          />
          {fieldSearch ? (
            <button
              type="button"
              onClick={() => setFieldSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} weight="bold" />
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <MagnifyingGlass size={16} weight="bold" />
            </div>
          )}
        </div>

        {/* 3. Horizontal Pill Categories (Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-3.5 px-3.5">
          <button
            type="button"
            onClick={() => {
              setFieldTab('ALL');
              setDisplayMode('TABBED');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
              fieldTab === 'ALL'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Semua ({assignedUnits.length})
          </button>

          {categorizedUnits.confirmation.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setFieldTab('CONFIRMATION');
                setDisplayMode('TABBED');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                fieldTab === 'CONFIRMATION'
                  ? 'bg-[#C81E1E] text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Konfirmasi ({categorizedUnits.confirmation.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setFieldTab('TODAY');
              setDisplayMode('TABBED');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
              fieldTab === 'TODAY'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Hari Ini ({categorizedUnits.today.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFieldTab('PENDING');
              setDisplayMode('TABBED');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
              fieldTab === 'PENDING'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Belum Selesai ({categorizedUnits.pending.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFieldTab('UPCOMING');
              setDisplayMode('TABBED');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
              fieldTab === 'UPCOMING'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Mendatang ({categorizedUnits.upcoming.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFieldTab('COMPLETED');
              setDisplayMode('TABBED');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
              fieldTab === 'COMPLETED'
                ? 'bg-[#C81E1E] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Selesai ({categorizedUnits.completed.length})
          </button>
        </div>

        {/* 4. Priority Hero Card (Hari Ini) - Apple-Inspired Light Surface with URD Red Accent */}
        {activeTodayUnit && (fieldTab === 'ALL' || fieldTab === 'TODAY') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
                Prioritas Lapangan Hari Ini
              </span>
              <span className="text-[10px] font-bold text-[#C81E1E] bg-[#C81E1E]/10 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full">
                Jadwal Aktif
              </span>
            </div>
            <div className="rounded-2xl bg-white dark:bg-[#151821] p-4 text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-6px_rgba(0,0,0,0.06)] border border-black/[0.07] dark:border-white/[0.08]">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#C81E1E]/10 flex items-center justify-center shrink-0 border border-[#C81E1E]/15">
                  <ClipboardText size={22} className="text-[#C81E1E] dark:text-rose-400" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded-md bg-[#F5F5F7] dark:bg-white/[0.06] text-[#C81E1E] dark:text-rose-300 text-[10px] font-semibold">
                    {activeTodayUnit.category_code} &bull; {activeTodayUnit.category_name}
                  </div>
                  <h4 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-1 leading-snug truncate tracking-[-0.015em]">
                    {activeTodayUnit.object_name}
                  </h4>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D] truncate mt-0.5">
                    {activeTodayUnit.client_name}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.07] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D] truncate">
                  SN: {activeTodayUnit.serial_number || '-'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailUnit(activeTodayUnit)}
                    className="px-3.5 min-h-[40px] rounded-[10px] border border-black/[0.08] dark:border-white/[0.10] bg-[#F5F5F7] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] text-xs font-semibold hover:bg-black/[0.06] transition-all cursor-pointer"
                  >
                    Detail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenInspection(activeTodayUnit)}
                    disabled={openingInspection}
                    className="inline-flex items-center gap-1.5 px-4 min-h-[40px] rounded-[10px] bg-[#C81E1E] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(200,30,30,0.25)] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
                  >
                    <span>{openingInspection ? 'Membuka...' : 'Mulai Uji'}</span>
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Daftar Unit Alat Mobile */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Daftar Unit Pemeriksaan
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {filteredUnitsForTab.length} Unit
            </span>
          </div>

          {filteredUnitsForTab.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center shadow-xs">
              <EmptyState
                title="Tidak Ada Unit pada Kategori Ini"
                description={
                  fieldSearch
                    ? 'Tidak ada unit alat yang cocok dengan kata kunci pencarian.'
                    : 'Belum ada unit riksa uji pada kelompok status ini.'
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUnitsForTab.map((u) => (
                <InspectorUnitCard
                  key={`${u.order_id}-${u.object_id}`}
                  unit={u}
                  onRespondAssignment={onRespondAssignment}
                  onOpenRejectModal={setRejectModalData}
                  onOpenInspection={handleOpenInspection}
                  onOpenDetailModal={setSelectedDetailUnit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAMPILAN DESKTOP & TABLET: Profesional, Efisien, Bebas Slop   */}
      {/* ============================================================== */}
      <div className="hidden sm:block space-y-6">
        {/* Header Halaman Desktop */}
        <PageHeader
          title="Dasbor Lapangan Inspector"
          subtitle="Pelaksanaan riksa uji lapangan, checklist teknis K3, dan berita acara."
          actions={
            <div className="flex items-center gap-2">
              {/* Tombol Antrean Offline Desktop */}
              <button
                type="button"
                onClick={() => setOfflineDrawerOpen(true)}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                  !isOnline
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                    : pendingSyncCount > 0
                    ? 'bg-rose-50 text-[#C81E1E] border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {!isOnline ? (
                  <>
                    <WifiSlash size={16} weight="bold" />
                    <span>Mode Offline</span>
                  </>
                ) : (
                  <>
                    <WifiHigh size={16} weight="bold" className={pendingSyncCount > 0 ? 'text-[#C81E1E]' : 'text-emerald-500'} />
                    <span>Sinkronisasi {pendingSyncCount > 0 ? `(${pendingSyncCount})` : ''}</span>
                  </>
                )}
              </button>

              <Link
                to="/app/inspections"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C81E1E] px-4 min-h-[44px] text-xs sm:text-sm font-bold text-white hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-xs"
              >
                <Plus size={16} weight="bold" aria-hidden="true" />
                <span>Form Uji Lapangan</span>
              </Link>
            </div>
          }
        />

        {/* 4 Kartu Status Lapangan Ringkas Desktop */}
        <InspectorMetricCards
          categorizedUnits={categorizedUnits}
          fieldTab={fieldTab}
          setFieldTab={setFieldTab}
          setDisplayMode={setDisplayMode}
        />

        {/* Kontrol Pencarian, Pilihan Tab, dan Tampilan Desktop */}
        <section className="bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-black/[0.06] dark:border-white/[0.07] bg-[#F5F5F7]/50 dark:bg-[#11141C] space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Daftar Unit Operasional Riksa Uji</span>
                <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {assignedUnits.length}
                </span>
              </h2>

              {/* Tombol Pengatur Tampilan Desktop (Kartu vs Tabel) */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFieldViewMode('CARDS')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      fieldViewMode === 'CARDS'
                        ? 'bg-[#C81E1E] text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <SquaresFour size={14} weight="bold" />
                    <span>Kartu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldViewMode('TABLE')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      fieldViewMode === 'TABLE'
                        ? 'bg-[#C81E1E] text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Table size={14} weight="bold" />
                    <span>Tabel</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Kolom Pencarian Cepat & Tab Navigasi Lapangan Desktop */}
            <div className="flex flex-col md:flex-row gap-3 pt-1">
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari nama objek alat, nomor seri, nama klien, atau nomor PO..."
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
                />
                {fieldSearch && (
                  <button
                    type="button"
                    onClick={() => setFieldSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X size={14} weight="bold" />
                  </button>
                )}
              </div>

              {/* Tab Filter Lapangan */}
              <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFieldTab('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    fieldTab === 'ALL'
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({assignedUnits.length})
                </button>
                {categorizedUnits.confirmation.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFieldTab('CONFIRMATION')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      fieldTab === 'CONFIRMATION'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-2xs'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50/50'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span>Konfirmasi ({categorizedUnits.confirmation.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setFieldTab('TODAY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    fieldTab === 'TODAY'
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Hari Ini ({categorizedUnits.today.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldTab('PENDING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    fieldTab === 'PENDING'
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Belum Selesai ({categorizedUnits.pending.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldTab('UPCOMING')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    fieldTab === 'UPCOMING'
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mendatang ({categorizedUnits.upcoming.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFieldTab('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    fieldTab === 'COMPLETED'
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Selesai ({categorizedUnits.completed.length})
                </button>
              </div>
            </div>
          </div>

          {/* Konten Daftar Desktop */}
          {filteredUnitsForTab.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="Tidak Ada Unit pada Kategori Ini"
                description={
                  fieldSearch
                    ? 'Tidak ada unit alat yang cocok dengan kata kunci pencarian.'
                    : 'Belum ada unit riksa uji pada kelompok status ini.'
                }
              />
            </div>
          ) : fieldViewMode === 'CARDS' ? (
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnitsForTab.map((u) => (
                <InspectorUnitCard
                  key={`${u.order_id}-${u.object_id}`}
                  unit={u}
                  onRespondAssignment={onRespondAssignment}
                  onOpenRejectModal={setRejectModalData}
                  onOpenInspection={handleOpenInspection}
                  onOpenDetailModal={setSelectedDetailUnit}
                />
              ))}
            </div>
          ) : (
            <InspectorUnitTable
              units={filteredUnitsForTab}
              onRespondAssignment={onRespondAssignment}
              onOpenRejectModal={setRejectModalData}
              onOpenInspection={handleOpenInspection}
              onOpenDetailModal={setSelectedDetailUnit}
            />
          )}
        </section>
      </div>

      {/* Modal Lembar Kerja Riksa Uji Terpadu */}
      {activeInspectionId && (
        <InspectionDetailModal
          inspectionId={activeInspectionId}
          onClose={handleCloseInspection}
          isInspector={true}
          user={user}
          onSaved={() => {
            if (loadSummary) loadSummary(true);
          }}
          onPreviewPdf={handlePreviewPdf}
        />
      )}

      {/* Modal Detail Tugas & Surat Tugas */}
      {selectedDetailUnit && (
        <AssignmentDetailModal
          isOpen={Boolean(selectedDetailUnit)}
          onClose={() => setSelectedDetailUnit(null)}
          unit={selectedDetailUnit}
          onRespondAssignment={onRespondAssignment}
          onOpenRejectModal={setRejectModalData}
          onOpenInspection={handleOpenInspection}
          onPreviewPdf={handlePreviewPdf}
        />
      )}

      {/* Drawer Penyimpanan Offline & Antrean Sinkronisasi */}
      <OfflineSyncDrawer
        isOpen={offlineDrawerOpen}
        onClose={() => {
          setOfflineDrawerOpen(false);
          getPendingSyncSummary().then((s) => setPendingSyncCount(s.totalPending || 0)).catch(() => {});
        }}
        onSyncComplete={() => {
          if (loadSummary) loadSummary(true);
        }}
      />

      {/* Modal Pratinjau Dokumen PDF Resmi */}
      {pdfPreviewModalOpen && (
        <PdfPreviewModal
          open={pdfPreviewModalOpen}
          onClose={() => {
            setPdfPreviewModalOpen(false);
            if (previewPdfUrl) {
              window.URL.revokeObjectURL(previewPdfUrl);
              setPreviewPdfUrl(null);
            }
          }}
          title={previewPdfTitle}
          pdfUrl={previewPdfUrl}
          filename={previewPdfFilename}
        />
      )}

      {/* Modal Konfirmasi Tolak / Batal Penugasan */}
      <RejectAssignmentModal
        rejectModalData={rejectModalData}
        onClose={() => setRejectModalData(null)}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        actionLoading={actionLoading}
        onConfirm={onRespondAssignment}
      />
    </div>
  );
}
