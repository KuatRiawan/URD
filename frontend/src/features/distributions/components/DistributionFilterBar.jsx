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
    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor resi, PO, BAP, klien, atau objek uji..."
          className="w-full min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-2">
        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          className="min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Semua Target Penerima</option>
          <option value="KLIEN">Target: Klien</option>
          <option value="DISNAKER">Target: Disnaker</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
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

