import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  ClipboardText,
  MagnifyingGlass,
  Plus,
  SquaresFour,
  Table
} from '@phosphor-icons/react';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { InspectorMetricCards } from './InspectorMetricCards.jsx';
import { InspectorUnitCard } from './InspectorUnitCard.jsx';
import { InspectorUnitTable } from './InspectorUnitTable.jsx';
import { RejectAssignmentModal } from './RejectAssignmentModal.jsx';
import { InspectionDetailModal } from '../../inspections/components/InspectionDetailModal.jsx';
import { PdfPreviewModal } from '../../inspections/components/PdfPreviewModal.jsx';
import { api } from '../../../lib/api/axios.js';

export function InspectorDashboardView({
  user,
  refreshing,
  loadSummary,
  categorizedUnits,
  assignedUnits,
  fieldTab,
  setFieldTab,
  displayMode,
  setDisplayMode,
  fieldViewMode,
  setFieldViewMode,
  fieldSearch,
  setFieldSearch,
  filteredUnitsForTab,
  matchesSearch,
  onRespondAssignment,
  rejectModalData,
  setRejectModalData,
  rejectReason,
  setRejectReason,
  actionLoading
}) {
  const [activeInspectionId, setActiveInspectionId] = useState(null);
  const [openingInspection, setOpeningInspection] = useState(false);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');

  const handleOpenInspection = async (u) => {
    if (u.inspection_id) {
      setActiveInspectionId(u.inspection_id);
      return;
    }
    try {
      setOpeningInspection(true);
      const res = await api.post('/inspections/start', {
        orderId: u.order_id,
        objectId: u.object_id
      });
      if (res.data?.inspection?.id) {
        setActiveInspectionId(res.data.inspection.id);
      }
      if (loadSummary) loadSummary();
    } catch (err) {
      alert(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal membuka lembar pemeriksaan.'
      );
    } finally {
      setOpeningInspection(false);
    }
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
      alert('Gagal memuat pratinjau dokumen PDF.');
    }
  };

  const todayFiltered = categorizedUnits.today.filter(matchesSearch);
  const pendingFiltered = categorizedUnits.pending.filter(matchesSearch);
  const upcomingFiltered = categorizedUnits.upcoming.filter(matchesSearch);
  const completedFiltered = categorizedUnits.completed.filter(matchesSearch);

  const activeTodayUnit =
    categorizedUnits.today.find((u) => u.unit_status !== 'SELESAI') ||
    categorizedUnits.today[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================================================== */}
      {/* TAMPILAN MOBILE: Desain Mengacu React-Native-UI-Templates      */}
      {/* (HomeDesignCourse & PopulerCourseListView)                     */}
      {/* ============================================================== */}
      <div className="sm:hidden space-y-4">
        {/* 1. Header Ringkas (Greeting & Judul Halaman) */}
        <div className="pt-1">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            Halo, {user?.fullName?.split(' ')[0] || 'Inspector'}
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Tugas Riksa Uji
          </h1>
        </div>

        {/* 2. Floating Search Bar (Rounded-2xl Elevated Card) */}
        <div className="relative">
          <input
            type="text"
            value={fieldSearch}
            onChange={(e) => setFieldSearch(e.target.value)}
            placeholder="Cari alat, nomor seri, klien, PO..."
            className="w-full h-12 pl-4 pr-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E] transition-all shadow-2xs"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <MagnifyingGlass size={18} weight="bold" />
          </div>
        </div>

        {/* 3. Horizontal Pill Categories (Category Chips) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kategori &amp; Status
            </span>
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
              {assignedUnits.length} Total Unit
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-3.5 px-3.5">
            <button
              type="button"
              onClick={() => {
                setFieldTab('ALL');
                setDisplayMode('TABBED');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                fieldTab === 'ALL'
                  ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
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
                className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer select-none active:scale-95 ${
                  fieldTab === 'CONFIRMATION'
                    ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Konfirmasi ({categorizedUnits.confirmation.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFieldTab('TODAY');
                setDisplayMode('TABBED');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                fieldTab === 'TODAY'
                  ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
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
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                fieldTab === 'PENDING'
                  ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
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
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                fieldTab === 'UPCOMING'
                  ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
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
              className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                fieldTab === 'COMPLETED'
                  ? 'bg-[#C81E1E] text-white shadow-md shadow-rose-500/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              Selesai ({categorizedUnits.completed.length})
            </button>
          </div>
        </div>

        {/* 4. Horizontal Featured Card: Prioritas Hari Ini */}
        {activeTodayUnit && (fieldTab === 'ALL' || fieldTab === 'TODAY') && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Prioritas Lapangan
              </span>
              <span className="text-[11px] font-bold text-[#C81E1E]">Hari Ini</span>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 p-4 text-white shadow-md border border-slate-800/80">
              <div className="flex items-start gap-3">
                <div className="w-13 h-13 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <ClipboardText size={24} className="text-rose-400" weight="duotone" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wide">
                    {activeTodayUnit.category_code} · {activeTodayUnit.category_name}
                  </div>
                  <h4 className="text-base font-extrabold text-white mt-1 leading-snug truncate">
                    {activeTodayUnit.object_name}
                  </h4>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {activeTodayUnit.client_name}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-300 truncate">
                  SN: {activeTodayUnit.serial_number}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenInspection(activeTodayUnit)}
                  className="inline-flex items-center gap-1.5 px-4 min-h-[38px] rounded-xl bg-[#C81E1E] text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <span>Mulai Pemeriksaan</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Daftar Unit Alat */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Daftar Unit Alat
            </h2>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
              {filteredUnitsForTab.length} Unit
            </span>
          </div>

          {filteredUnitsForTab.length === 0 ? (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 text-center shadow-xs">
              <EmptyState
                title="Tidak Ada Unit pada Kategori Ini"
                description={
                  fieldSearch
                    ? 'Tidak ada unit alat yang cocok dengan kata kunci pencarian Anda.'
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAMPILAN DESKTOP: Tetap Lengkap dengan Mode Tabel & Statistik   */}
      {/* ============================================================== */}
      <div className="hidden sm:block space-y-6">
        {/* Header Halaman Desktop */}
        <PageHeader
          title="Dasbor Lapangan Inspector"
          subtitle="Pekerjaan riksa uji teknis lapangan, verifikasi unit, pengisian checklist, dokumentasi foto, dan tanda tangan digital"
          actions={
            <div className="flex items-center gap-2">
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

              {/* Tombol Pengatur Tampilan Desktop (Kartu vs Tabel & Tab vs Stacked) */}
              <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                <div className="inline-flex items-center p-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('TABBED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      displayMode === 'TABBED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Tampilan Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('STACKED')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      displayMode === 'STACKED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Semua Seksi
                  </button>
                </div>

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
                  value={fieldSearch}
                  onChange={(e) => setFieldSearch(e.target.value)}
                  placeholder="Cari nama alat, no seri, klien, PO, atau lokasi..."
                  className="w-full min-h-[44px] pl-9.5 pr-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#C81E1E] dark:focus:border-rose-500 shadow-2xs transition-colors"
                />
              </div>

              {displayMode === 'TABBED' && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setFieldTab('ALL')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer active:scale-[0.98] ${
                      fieldTab === 'ALL'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Semua ({assignedUnits.length})
                  </button>
                  {categorizedUnits.confirmation.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFieldTab('CONFIRMATION')}
                      className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 select-none cursor-pointer active:scale-[0.98] ${
                        fieldTab === 'CONFIRMATION'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>Perlu Konfirmasi ({categorizedUnits.confirmation.length})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setFieldTab('TODAY')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer active:scale-[0.98] ${
                      fieldTab === 'TODAY'
                        ? 'bg-[#C81E1E] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Hari Ini ({categorizedUnits.today.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('PENDING')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer active:scale-[0.98] ${
                      fieldTab === 'PENDING'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Belum Selesai ({categorizedUnits.pending.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('UPCOMING')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer active:scale-[0.98] ${
                      fieldTab === 'UPCOMING'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Mendatang ({categorizedUnits.upcoming.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFieldTab('COMPLETED')}
                    className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all select-none cursor-pointer active:scale-[0.98] ${
                      fieldTab === 'COMPLETED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Selesai ({categorizedUnits.completed.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Rendering Konten Unit Desktop: Berdasarkan Tab atau 3 Area Seksi Stacked */}
          {displayMode === 'TABBED' ? (
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
                {filteredUnitsForTab.map((u) => (
                  <InspectorUnitCard
                    key={`${u.order_id}-${u.object_id}`}
                    unit={u}
                    onRespondAssignment={onRespondAssignment}
                    onOpenRejectModal={setRejectModalData}
                    onOpenInspection={handleOpenInspection}
                  />
                ))}
              </div>
            ) : (
              <InspectorUnitTable
                units={filteredUnitsForTab}
                onRespondAssignment={onRespondAssignment}
                onOpenRejectModal={setRejectModalData}
                onOpenInspection={handleOpenInspection}
              />
            )
          ) : (
            /* MODE SEMUA 3 SEKSI STACKED DESKTOP */
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
                  <span className="text-xs font-bold text-[#C81E1E]">Target Hari Ini</span>
                </div>
                {todayFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 italic">Tidak ada jadwal pekerjaan riksa uji hari ini.</p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {todayFiltered.map((u) => (
                      <InspectorUnitCard
                        key={`${u.order_id}-${u.object_id}`}
                        unit={u}
                        onRespondAssignment={onRespondAssignment}
                        onOpenRejectModal={setRejectModalData}
                        onOpenInspection={handleOpenInspection}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectorUnitTable
                    units={todayFiltered}
                    onRespondAssignment={onRespondAssignment}
                    onOpenRejectModal={setRejectModalData}
                    onOpenInspection={handleOpenInspection}
                  />
                )}
              </div>

              {/* Seksi 2: Belum Selesai (Draf/Revisi) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100">
                      2. Belum Selesai ({pendingFiltered.length})
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pemeriksaan / Draf Tertunda</span>
                </div>
                {pendingFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 italic">Semua checklist terisi lengkap dan tidak ada catatan revisi tertunda.</p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingFiltered.map((u) => (
                      <InspectorUnitCard
                        key={`${u.order_id}-${u.object_id}`}
                        unit={u}
                        onRespondAssignment={onRespondAssignment}
                        onOpenRejectModal={setRejectModalData}
                        onOpenInspection={handleOpenInspection}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectorUnitTable
                    units={pendingFiltered}
                    onRespondAssignment={onRespondAssignment}
                    onOpenRejectModal={setRejectModalData}
                    onOpenInspection={handleOpenInspection}
                  />
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
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Jadwal Operasional</span>
                </div>
                {upcomingFiltered.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 italic">Tidak ada antrean jadwal penugasan mendatang.</p>
                ) : fieldViewMode === 'CARDS' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingFiltered.map((u) => (
                      <InspectorUnitCard
                        key={`${u.order_id}-${u.object_id}`}
                        unit={u}
                        onRespondAssignment={onRespondAssignment}
                        onOpenRejectModal={setRejectModalData}
                        onOpenInspection={handleOpenInspection}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectorUnitTable
                    units={upcomingFiltered}
                    onRespondAssignment={onRespondAssignment}
                    onOpenRejectModal={setRejectModalData}
                    onOpenInspection={handleOpenInspection}
                  />
                )}
              </div>

              {/* Seksi 4: Selesai */}
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
                      {completedFiltered.map((u) => (
                        <InspectorUnitCard
                          key={`${u.order_id}-${u.object_id}`}
                          unit={u}
                          onRespondAssignment={onRespondAssignment}
                          onOpenRejectModal={setRejectModalData}
                          onOpenInspection={handleOpenInspection}
                        />
                      ))}
                    </div>
                  ) : (
                    <InspectorUnitTable
                      units={completedFiltered}
                      onRespondAssignment={onRespondAssignment}
                      onOpenRejectModal={setRejectModalData}
                      onOpenInspection={handleOpenInspection}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal Lembar Kerja Riksa Uji Terpadu */}
      {activeInspectionId && (
        <InspectionDetailModal
          inspectionId={activeInspectionId}
          onClose={() => {
            setActiveInspectionId(null);
            if (loadSummary) loadSummary();
          }}
          isInspector={true}
          user={user}
          onSaved={() => {
            if (loadSummary) loadSummary();
          }}
          onPreviewPdf={handlePreviewPdf}
        />
      )}

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
