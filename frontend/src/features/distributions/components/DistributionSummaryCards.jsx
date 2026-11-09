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
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          !statusFilter && !targetFilter
            ? 'border-[#C81E1E] bg-[#C81E1E]/[0.04] dark:bg-rose-950/20 shadow-[0_2px_10px_rgba(200,30,30,0.08)]'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.15]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Total Berkas
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
          {summary.total}
        </p>
      </button>

      {/* Siap Dikirim */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'SIAP_DIKIRIM' ? '' : 'SIAP_DIKIRIM');
        }}
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          statusFilter === 'SIAP_DIKIRIM'
            ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 shadow-[0_2px_10px_rgba(245,158,11,0.1)]'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Siap Dikirim
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-amber-600 dark:text-amber-400">
          {summary.siapKirim}
        </p>
      </button>

      {/* Dalam Pengiriman */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'DIKIRIM' ? '' : 'DIKIRIM');
        }}
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          statusFilter === 'DIKIRIM'
            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 shadow-[0_2px_10px_rgba(59,130,246,0.1)]'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Pengiriman
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-blue-600 dark:text-blue-400">
          {summary.dikirim}
        </p>
      </button>

      {/* Diterima */}
      <button
        type="button"
        onClick={() => {
          if (onSelectStatus) onSelectStatus(statusFilter === 'DITERIMA' ? '' : 'DITERIMA');
        }}
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          statusFilter === 'DITERIMA'
            ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 shadow-[0_2px_10px_rgba(16,185,129,0.1)]'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Diterima
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-emerald-600 dark:text-emerald-400">
          {summary.diterima}
        </p>
      </button>

      {/* Target Klien */}
      <button
        type="button"
        onClick={() => {
          if (onSelectTarget) onSelectTarget(targetFilter === 'KLIEN' ? '' : 'KLIEN');
        }}
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          targetFilter === 'KLIEN'
            ? 'border-[#C81E1E] bg-[#C81E1E]/[0.04] dark:bg-rose-950/20'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Target Klien
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
          {summary.targetKlien}
        </p>
      </button>

      {/* Target Disnaker */}
      <button
        type="button"
        onClick={() => {
          if (onSelectTarget) onSelectTarget(targetFilter === 'DISNAKER' ? '' : 'DISNAKER');
        }}
        className={`rounded-2xl border p-4 text-left transition-all cursor-pointer ${
          targetFilter === 'DISNAKER'
            ? 'border-[#C81E1E] bg-[#C81E1E]/[0.04] dark:bg-rose-950/20'
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14]'
        }`}
      >
        <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Target Disnaker
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-[#C81E1E] dark:text-rose-400">
          {summary.targetDisnaker}
        </p>
      </button>
    </div>
  );
}

