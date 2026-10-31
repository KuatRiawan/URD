import { Eye } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import {
  FOLLOWUP_STATUS_LABELS,
  formatDate,
  SUKET_STATUS_LABELS
} from '../../../lib/utils/format.js';

const STATUS_TONE = {
  BERKAS_DISIAPKAN: 'neutral',
  DIAJUKAN: 'info',
  DALAM_PROSES: 'warning',
  TERBIT: 'success',
  PERLU_PERBAIKAN: 'danger'
};

export function SuketTable({ items, onOpenDetail }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Registri Suket K3 */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const days = item.days_remaining;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
            >
              {/* Header: No Suket & Status */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block truncate">
                    {item.suket_no || 'Belum Terbit Nomor'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {item.issuer || '-'}
                  </span>
                </div>
                <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                  {SUKET_STATUS_LABELS[item.status] || item.status}
                </Badge>
              </div>

              {/* Info Klien & Objek */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Klien:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                    {item.client_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Objek Uji:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {item.object_name} (SN: {item.serial_number})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Masa Berlaku:</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.valid_until ? formatDate(item.valid_until) : '-'}
                    </span>
                    {days !== null && days !== undefined && (
                      <span
                        className={`block text-[10px] font-bold ${
                          days < 0
                            ? 'text-red-700 dark:text-red-400'
                            : days <= 60
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {days < 0 ? `Kedaluwarsa ${Math.abs(days)} hari lalu` : `Sisa ${days} hari`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Follow-Up:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenDetail(item.id)}
                  className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Kelola Suket K3</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">No. Suket &amp; Instansi</th>
                <th className="py-3 px-4">Perusahaan Klien</th>
                <th className="py-3 px-4">Objek Uji K3</th>
                <th className="py-3 px-4">Masa Berlaku</th>
                <th className="py-3 px-4">Status Penerbitan</th>
                <th className="py-3 px-4">Status Follow-Up</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {items.map((item) => {
                const days = item.days_remaining;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.suket_no || 'Belum Terbit Nomor'}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">{item.issuer || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-slate-100">
                      {item.client_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {item.category_code} · SN: {item.serial_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.valid_until ? formatDate(item.valid_until) : '-'}
                      </div>
                      {days !== null && days !== undefined && (
                        <div
                          className={`text-[11px] font-bold ${
                            days < 0
                              ? 'text-red-700 dark:text-red-400'
                              : days <= 60
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {days < 0
                            ? `Kedaluwarsa ${Math.abs(days)} hari lalu`
                            : `Sisa ${days} hari`}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                        {SUKET_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item.id)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye size={15} />
                        <span>Kelola</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
