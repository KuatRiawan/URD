import { MagnifyingGlass } from '@phosphor-icons/react';

export function DistributionFilterBar({
  searchQuery,
  setSearchQuery,
  targetFilter,
  setTargetFilter,
  statusFilter,
  setStatusFilter
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor resi, PO, BAP, klien, atau objek uji..."
          className="w-full h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#C81E1E] transition-colors"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 min-w-0">
        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          aria-label="Filter Target Penerima"
          className="w-full sm:w-auto h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C81E1E] transition-colors"
        >
          <option value="">Semua Target Penerima</option>
          <option value="KLIEN">Target: Klien</option>
          <option value="DISNAKER">Target: Disnaker</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter Status Pengiriman"
          className="w-full sm:w-auto h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C81E1E] transition-colors"
        >
          <option value="">Semua Status Pengiriman</option>
          <option value="SIAP_DIKIRIM">Siap Dikirim</option>
          <option value="DIKIRIM">Dalam Pengiriman</option>
          <option value="DITERIMA">Telah Diterima</option>
        </select>
      </div>
    </div>
  );
}

