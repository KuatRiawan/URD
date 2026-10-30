import { CalendarPlus, WarningOctagon } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function MissingValiditySection({
  missingValidityItems,
  canManage,
  onOpenValidityModal
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-amber-300 dark:border-amber-800/60 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/40 bg-amber-50/60 dark:bg-amber-950/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WarningOctagon size={20} className="text-amber-700 dark:text-amber-400" weight="bold" />
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Unit Belum Ada Tanggal Masa Berlaku / Data Masa Berlaku Belum Lengkap (
              {missingValidityItems.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Sistem tidak mengarang tanggal jatuh tempo bila tanggal berlaku resmi belum dicatat pada Suket, LHPP, atau data unit.
            </p>
          </div>
        </div>
      </div>

      {missingValidityItems.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Seluruh unit aktif telah memiliki tanggal masa berlaku"
            description="Tidak ada unit yang belum tercatat tanggal masa berlakunya."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Unit Alat &amp; Kategori</th>
                <th className="py-3 px-4">Perusahaan Klien</th>
                <th className="py-3 px-4">Pemeriksaan Terakhir</th>
                <th className="py-3 px-4">Status Data Masa Berlaku</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {missingValidityItems.map((u) => (
                <tr key={u.object_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.object_name}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {u.category_code} · SN: <span className="font-mono">{u.serial_number}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {u.client_name}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {u.last_inspected_at
                      ? `Tgl: ${formatDate(u.last_inspected_at)} (${u.last_po_number || u.last_order_no})`
                      : 'Belum pernah diperiksa'}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <Badge tone="warning">Belum Ada Tanggal Masa Berlaku</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onOpenValidityModal(u)}
                        className="min-h-9 inline-flex items-center gap-1.5 rounded bg-slate-900 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600 cursor-pointer"
                      >
                        <CalendarPlus size={15} />
                        <span>Tetapkan Tanggal Masa Berlaku</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

