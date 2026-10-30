import { MagnifyingGlass } from '@phosphor-icons/react';
import { ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';

export function OrderFilterBar({ q, setQ, statusFilter, setStatusFilter }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="relative flex-1">
        <MagnifyingGlass
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nomor PO, nomor order, atau nama klien..."
          className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#475569] dark:focus:border-slate-500 focus:outline-none"
        />
      </div>
      <select
        aria-label="Filter Status Order"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
      >
        <option value="">Semua Status PO</option>
        {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

