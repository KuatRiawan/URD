import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';

export function OrderFilterBar({ q, setQ, statusFilter, setStatusFilter }) {
  const hasFilter = Boolean(q || statusFilter);

  const QUICK_TABS = [
    { key: '', label: 'Semua PO' },
    { key: 'ORDER_BARU', label: 'PO Baru' },
    { key: 'TERJADWAL', label: 'Terjadwal' },
    { key: 'SEDANG_DIPERIKSA', label: 'Diperiksa' },
    { key: 'MENUNGGU_DOKUMEN', label: 'Tunggu Dokumen' },
    { key: 'SELESAI', label: 'Selesai' }
  ];

  return (
    <div className="space-y-3">
      {/* Quick Status Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full max-w-2xl overflow-x-auto border border-slate-200/60 dark:border-slate-700/60">
        {QUICK_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`py-1.5 px-3 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input & Detailed Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 items-stretch sm:items-center shadow-2xs">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari nomor PO, nomor order, atau nama klien"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor PO, nomor order, atau nama klien..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter Status Order"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="">Semua Status PO</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                setStatusFilter('');
              }}
              aria-label="Reset Filter"
              className="h-9 px-2.5 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
