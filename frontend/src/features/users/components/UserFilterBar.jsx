import { MagnifyingGlass } from '@phosphor-icons/react';
import { ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserFilterBar({ q, setQ, roleFilter, setRoleFilter }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama lengkap atau alamat email personel..."
          className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
        />
      </div>
      <select
        aria-label="Filter Peran Pengguna"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
      >
        <option value="">Semua Peran RBAC</option>
        {Object.entries(ROLE_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

