export function DistributionSummaryCards({ summary }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Berkas
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
          {summary.total}
        </p>
      </div>
      <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          Siap Dikirim
        </p>
        <p className="mt-1 text-2xl font-extrabold text-amber-800 dark:text-amber-300">
          {summary.siapKirim}
        </p>
      </div>
      <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
          Dalam Pengiriman
        </p>
        <p className="mt-1 text-2xl font-extrabold text-blue-800 dark:text-blue-300">
          {summary.dikirim}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          Diterima
        </p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
          {summary.diterima}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Target Klien
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
          {summary.targetKlien}
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Target Disnaker
        </p>
        <p className="mt-1 text-2xl font-extrabold text-[#C81E1E] dark:text-rose-400">
          {summary.targetDisnaker}
        </p>
      </div>
    </div>
  );
}

