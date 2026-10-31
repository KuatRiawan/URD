import { Buildings, MapPin, Cube } from '@phosphor-icons/react';
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
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Responsif Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {items.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            {/* Header Kartu: Nama & Status */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {c.name}
                </h3>
                {c.industry && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {c.industry}
                  </p>
                )}
              </div>
              <StatusBadge
                status={c.is_active ? 'SESUAI' : 'DIBATALKAN'}
                label={c.is_active ? 'Aktif' : 'Nonaktif'}
              />
            </div>

            {/* Konten Kartu */}
            <div className="space-y-1.5 text-xs">
              {c.npwp && (
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>NPWP:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {c.npwp}
                  </span>
                </div>
              )}
              {c.address && (
                <div className="flex items-start gap-1.5 text-slate-500 dark:text-slate-400 pt-0.5">
                  <MapPin size={14} className="shrink-0 mt-0.5 text-slate-400" />
                  <span className="line-clamp-2 text-[11px] leading-snug">{c.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <Buildings size={13} />
                  <span>{c.location_count || 0} Lokasi</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Cube size={13} />
                  <span>{c.object_count || 0} Objek Uji</span>
                </span>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenDetail(c.id)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Lokasi &amp; PIC
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenEdit(c)}
                  className="min-h-[42px] px-4 inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Ubah
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
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
                      className="min-h-9 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      Lokasi &amp; PIC
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onOpenEdit(c)}
                        className="min-h-9 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 font-semibold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
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
      </div>

      <PaginationBar page={page} limit={15} total={total} onPageChange={onPageChange} />
    </div>
  );
}
