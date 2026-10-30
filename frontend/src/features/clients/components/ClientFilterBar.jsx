import { MagnifyingGlass } from '@phosphor-icons/react';

export function ClientFilterBar({ q, onSearchChange }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          aria-label="Cari nama klien, bidang usaha, atau NPWP"
          value={q}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama perusahaan klien, bidang usaha, atau NPWP..."
          className="w-full min-h-11 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>
    </div>
  );
}
