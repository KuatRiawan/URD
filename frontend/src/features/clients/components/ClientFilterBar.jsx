import { MagnifyingGlass } from '@phosphor-icons/react';

export function ClientFilterBar({ q, onSearchChange }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Cari nama klien, bidang usaha, atau NPWP"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama perusahaan klien, bidang usaha, atau NPWP..."
          className="w-full h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] pl-9 pr-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
        />
      </div>
      {q && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="h-9 px-3 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-white/[0.06] text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] cursor-pointer"
        >
          Reset Pencarian
        </button>
      )}
    </div>
  );
}
