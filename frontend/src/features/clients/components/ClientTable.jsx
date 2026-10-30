import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { PaginationBar } from '../../../components/feedback/StateViews.jsx';

export function ClientTable({
  items,
  total,
  page,
  onPageChange,
  canEdit,
  onOpenDetail,
  onOpenEdit
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
              <th className="py-3 px-4 font-bold">Nama Perusahaan</th>
              <th className="py-3 px-4 font-bold">Bidang Usaha</th>
              <th className="py-3 px-4 font-bold">NPWP</th>
              <th className="py-3 px-4 font-bold">Lokasi / Alat</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {items.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                    {c.address || '-'}
                  </p>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{c.industry || '-'}</td>
                <td className="py-3 px-4 font-mono text-slate-900 dark:text-slate-200">{c.npwp || '-'}</td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.location_count}</span> lokasi ·{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.object_count}</span> objek
                </td>
                <td className="py-3 px-4">
                  <StatusBadge
                    status={c.is_active ? 'SESUAI' : 'DIBATALKAN'}
                    label={c.is_active ? 'Aktif' : 'Nonaktif'}
                  />
                </td>
                <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(c.id)}
                    className="min-h-9 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    Lokasi & PIC
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onOpenEdit(c)}
                      className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-semibold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      Ubah
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} limit={15} total={total} onPageChange={onPageChange} />
    </div>
  );
}
