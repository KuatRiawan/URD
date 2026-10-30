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
        className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs cursor-pointer ${
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
        className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs cursor-pointer ${
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
        className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs cursor-pointer ${
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
        className={`text-left rounded-xl p-4 sm:p-5 border transition-all shadow-xs cursor-pointer ${
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
  );
}

