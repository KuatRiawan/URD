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
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] rounded-xl w-full max-w-2xl overflow-x-auto border border-black/[0.06] dark:border-white/[0.08]">
        {QUICK_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                  : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input & Detailed Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] items-stretch sm:items-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Cari nomor PO, nomor order, atau nama klien"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor PO, nomor order, atau nama klien..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="Filter Status Order"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]"
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
              className="h-9 px-2.5 inline-flex items-center gap-1 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-white/[0.06] text-xs font-medium text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] cursor-pointer"
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
