import { Buildings, Cube, Eye, MapPin, Pencil } from '@phosphor-icons/react';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
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
            onClick={() => onOpenDetail(c.id)}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
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
                  <span>{c.location_count || 0} Lokasi Site</span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Cube size={13} />
                  <span>{c.object_count || 0} Objek Uji K3</span>
                </span>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div
              className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="secondary"
                size="sm"
                touchFriendly
                icon={Eye}
                onClick={() => onOpenDetail(c.id)}
                className="flex-1"
              >
                Detail
              </Button>
              {canEdit && onOpenEdit && (
                <ActionMenu
                  label={`Aksi klien ${c.name}`}
                  items={[
                    {
                      label: 'Ubah Data Klien',
                      icon: Pencil,
                      onClick: () => onOpenEdit(c)
                    }
                  ]}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Nama Perusahaan Klien</TableCell>
              <TableCell isHeader>Bidang Industri</TableCell>
              <TableCell isHeader>NPWP</TableCell>
              <TableCell isHeader>Lokasi &amp; Objek Alat</TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((c) => (
              <TableRow
                key={c.id}
                isClickable
                onClick={() => onOpenDetail(c.id)}
              >
                <TableCell>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                    {c.address || '-'}
                  </p>
                </TableCell>
                <TableCell className="text-slate-600 dark:text-slate-400 font-medium">
                  {c.industry || '-'}
                </TableCell>
                <TableCell className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {c.npwp || '-'}
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.location_count || 0}</span> Lokasi ·{' '}
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.object_count || 0}</span> Objek Uji
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={c.is_active ? 'SESUAI' : 'DIBATALKAN'}
                    label={c.is_active ? 'Aktif' : 'Nonaktif'}
                  />
                </TableCell>
                <TableCell align="right" className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Eye}
                      onClick={() => onOpenDetail(c.id)}
                    >
                      Detail
                    </Button>
                    {canEdit && onOpenEdit && (
                      <ActionMenu
                        label={`Opsi klien ${c.name}`}
                        items={[
                          {
                            label: 'Ubah Data Klien',
                            icon: Pencil,
                            onClick: () => onOpenEdit(c)
                          }
                        ]}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrapper>
      </div>

      <PaginationBar page={page} limit={15} total={total} onPageChange={onPageChange} />
    </div>
  );
}
