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
    <div className="flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nomor resi, PO, BAP, klien, atau objek uji..."
          className="w-full h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] pl-9 pr-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-none focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E] transition-colors"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2 min-w-0">
        <select
          value={targetFilter}
          onChange={(e) => setTargetFilter(e.target.value)}
          aria-label="Filter Target Penerima"
          className="w-full sm:w-auto h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] px-3 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E] transition-colors"
        >
          <option value="">Semua Target Penerima</option>
          <option value="KLIEN">Target: Klien</option>
          <option value="DISNAKER">Target: Disnaker</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter Status Pengiriman"
          className="w-full sm:w-auto h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] px-3 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E] transition-colors"
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

