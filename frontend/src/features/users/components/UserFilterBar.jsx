import { MagnifyingGlass } from '@phosphor-icons/react';
import { ROLE_OPTIONS } from '../../../lib/utils/format.js';

export function UserFilterBar({ q, setQ, roleFilter, setRoleFilter }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama lengkap atau alamat email personel..."
          className="w-full h-9 pl-9 pr-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E] focus:outline-none"
        />
      </div>
      <select
        aria-label="Filter Peran Pengguna"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="h-9 px-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] focus:border-[#C81E1E] focus:outline-none cursor-pointer"
      >
        <option value="">Semua Peran RBAC</option>
        {ROLE_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

