import {
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  HourglassMedium
} from '@phosphor-icons/react';

export function InspectorMetricCards({
  categorizedUnits,
  fieldTab,
  setFieldTab,
  setDisplayMode
}) {
  return (
    <section aria-label="Ringkasan Operasional Lapangan" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Card 1: Pekerjaan Hari Ini */}
      <button
        type="button"
        onClick={() => {
          setFieldTab('TODAY');
          setDisplayMode('TABBED');
        }}
        className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer select-none active:scale-[0.985] ${
          fieldTab === 'TODAY'
            ? 'border-[#C81E1E] bg-[#C81E1E]/[0.03] dark:bg-rose-950/20 ring-2 ring-[#C81E1E]/15 shadow-[0_4px_16px_-4px_rgba(200,30,30,0.10)]'
            : 'bg-white dark:bg-[#151821] border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
          <div className="flex items-center justify-between sm:justify-start">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
              <CalendarCheck size={20} weight="bold" aria-hidden="true" />
            </div>
            <div className="sm:hidden text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
              {categorizedUnits.today.length}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#C81E1E] dark:text-rose-400 mb-0.5">
              Pekerjaan Hari Ini
            </p>
            <div className="hidden sm:block text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums leading-none tracking-[-0.02em]">
              {categorizedUnits.today.length}
            </div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5 sm:mt-1 leading-tight">
              Unit aktif hari ini
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
        className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer select-none active:scale-[0.985] ${
          fieldTab === 'PENDING'
            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-500/15'
            : 'bg-white dark:bg-[#151821] border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
          <div className="flex items-center justify-between sm:justify-start">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <HourglassMedium size={20} weight="bold" aria-hidden="true" />
            </div>
            <div className="sm:hidden text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {categorizedUnits.pending.length}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">
              Belum Selesai
            </p>
            <div className="hidden sm:block text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums leading-none tracking-[-0.02em]">
              {categorizedUnits.pending.length}
            </div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5 sm:mt-1 leading-tight">
              Draf &amp; revisi form
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
        className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer select-none active:scale-[0.985] ${
          fieldTab === 'UPCOMING'
            ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/15'
            : 'bg-white dark:bg-[#151821] border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
          <div className="flex items-center justify-between sm:justify-start">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CalendarBlank size={20} weight="bold" aria-hidden="true" />
            </div>
            <div className="sm:hidden text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {categorizedUnits.upcoming.length}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">
              Mendatang
            </p>
            <div className="hidden sm:block text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-none tracking-[-0.02em]">
              {categorizedUnits.upcoming.length}
            </div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5 sm:mt-1 leading-tight">
              Jadwal berikutnya
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
        className={`text-left rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer select-none active:scale-[0.985] ${
          fieldTab === 'COMPLETED'
            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/15'
            : 'bg-white dark:bg-[#151821] border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.14] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
          <div className="flex items-center justify-between sm:justify-start">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle size={20} weight="bold" aria-hidden="true" />
            </div>
            <div className="sm:hidden text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {categorizedUnits.completed.length}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
              Riksa Uji Selesai
            </p>
            <div className="hidden sm:block text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none tracking-[-0.02em]">
              {categorizedUnits.completed.length}
            </div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5 sm:mt-1 leading-tight">
              Dokumen terbit
            </div>
          </div>
        </div>
      </button>
    </section>
  );
}
