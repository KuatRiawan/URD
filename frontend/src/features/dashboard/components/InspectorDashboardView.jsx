import { Link } from 'react-router';
import {
  ArrowClockwise,
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

export function InspectorDashboardView({
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
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all shadow-2xs cursor-pointer"
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
      <InspectorMetricCards
        categorizedUnits={categorizedUnits}
        fieldTab={fieldTab}
        setFieldTab={setFieldTab}
        setDisplayMode={setDisplayMode}
      />

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
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
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
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
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
                  onClick={() => setFieldTab('ALL')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    fieldTab === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Semua ({assignedUnits.length})
                </button>
                {categorizedUnits.confirmation.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFieldTab('CONFIRMATION')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
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
                  className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    fieldTab === 'COMPLETED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Selesai ({categorizedUnits.completed.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Rendering Konten Unit: Berdasarkan Tab atau 3 Area Seksi Stacked */}
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
                />
              ))}
            </div>
          ) : (
            <InspectorUnitTable
              units={filteredUnitsForTab}
              onRespondAssignment={onRespondAssignment}
              onOpenRejectModal={setRejectModalData}
            />
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
                  {todayFiltered.map((u) => (
                    <InspectorUnitCard
                      key={`${u.order_id}-${u.object_id}`}
                      unit={u}
                      onRespondAssignment={onRespondAssignment}
                      onOpenRejectModal={setRejectModalData}
                    />
                  ))}
                </div>
              ) : (
                <InspectorUnitTable
                  units={todayFiltered}
                  onRespondAssignment={onRespondAssignment}
                  onOpenRejectModal={setRejectModalData}
                />
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
                  {pendingFiltered.map((u) => (
                    <InspectorUnitCard
                      key={`${u.order_id}-${u.object_id}`}
                      unit={u}
                      onRespondAssignment={onRespondAssignment}
                      onOpenRejectModal={setRejectModalData}
                    />
                  ))}
                </div>
              ) : (
                <InspectorUnitTable
                  units={pendingFiltered}
                  onRespondAssignment={onRespondAssignment}
                  onOpenRejectModal={setRejectModalData}
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
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Persiapan Alat &amp; Berkas</span>
              </div>
              {upcomingFiltered.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic py-2">
                  Belum ada penugasan baru yang dijadwalkan pada hari-hari berikutnya.
                </p>
              ) : fieldViewMode === 'CARDS' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingFiltered.map((u) => (
                    <InspectorUnitCard
                      key={`${u.order_id}-${u.object_id}`}
                      unit={u}
                      onRespondAssignment={onRespondAssignment}
                      onOpenRejectModal={setRejectModalData}
                    />
                  ))}
                </div>
              ) : (
                <InspectorUnitTable
                  units={upcomingFiltered}
                  onRespondAssignment={onRespondAssignment}
                  onOpenRejectModal={setRejectModalData}
                />
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
                    {completedFiltered.map((u) => (
                      <InspectorUnitCard
                        key={`${u.order_id}-${u.object_id}`}
                        unit={u}
                        onRespondAssignment={onRespondAssignment}
                        onOpenRejectModal={setRejectModalData}
                      />
                    ))}
                  </div>
                ) : (
                  <InspectorUnitTable
                    units={completedFiltered}
                    onRespondAssignment={onRespondAssignment}
                    onOpenRejectModal={setRejectModalData}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </section>

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
