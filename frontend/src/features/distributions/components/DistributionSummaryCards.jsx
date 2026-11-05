export function DistributionSummaryCards({
  summary,
  statusFilter,
  targetFilter,
  onSelectStatus,
  onSelectTarget
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Total Berkas */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus('');
          if (onSelectTarget) onSelectTarget('');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          !statusFilter && !targetFilter
            ? 'border-slate-800 dark:border-slate-400 bg-slate-50 dark:bg-slate-800/80 ring-2 ring-slate-400/20'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Total Berkas
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
          {summary.total}
        </p>
      </button>

      {/* Siap Dikirim */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'SIAP_DIKIRIM' ? '' : 'SIAP_DIKIRIM');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          statusFilter === 'SIAP_DIKIRIM'
            ? 'border-amber-500 dark:border-amber-400 bg-amber-100/50 dark:bg-amber-950/40 ring-2 ring-amber-400/30'
            : 'border-amber-200/80 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-300'
        }`}
      >
        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
          Siap Dikirim
        </p>
        <p className="mt-1 text-2xl font-extrabold text-amber-800 dark:text-amber-300">
          {summary.siapKirim}
        </p>
      </button>

      {/* Dalam Pengiriman */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'DIKIRIM' ? '' : 'DIKIRIM');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          statusFilter === 'DIKIRIM'
            ? 'border-blue-500 dark:border-blue-400 bg-blue-100/50 dark:bg-blue-950/40 ring-2 ring-blue-400/30'
            : 'border-blue-200/80 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-300'
        }`}
      >
        <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
          Pengiriman
        </p>
        <p className="mt-1 text-2xl font-extrabold text-blue-800 dark:text-blue-300">
          {summary.dikirim}
        </p>
      </button>

      {/* Diterima */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'DITERIMA' ? '' : 'DITERIMA');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          statusFilter === 'DITERIMA'
            ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 ring-2 ring-emerald-400/30'
            : 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-300'
        }`}
      >
        <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
          Diterima
        </p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
          {summary.diterima}
        </p>
      </button>

      {/* Target Klien */}
      <button
        type="button"
        onClick={() => {
          if (onSelectTarget) onSelectTarget(targetFilter === 'KLIEN' ? '' : 'KLIEN');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          targetFilter === 'KLIEN'
            ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 ring-2 ring-indigo-400/30'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Target Klien
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
          {summary.targetKlien}
        </p>
      </button>

      {/* Target Disnaker */}
      <button
        type="button"
        onClick={() => {
          if (onSelectTarget) onSelectTarget(targetFilter === 'DISNAKER' ? '' : 'DISNAKER');
        }}
        className={`rounded-xl border p-4 shadow-2xs text-left transition-all cursor-pointer ${
          targetFilter === 'DISNAKER'
            ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-400/30'
            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
      >
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Target Disnaker
        </p>
        <p className="mt-1 text-2xl font-extrabold text-[#C81E1E] dark:text-rose-400">
          {summary.targetDisnaker}
        </p>
      </button>
    </div>
  );
}

