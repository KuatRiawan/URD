import { CalendarPlus, WarningOctagon } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function MissingValiditySection({
  missingValidityItems,
  canManage,
  onOpenValidityModal
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <WarningOctagon size={18} className="text-amber-600 dark:text-amber-400" weight="bold" />
        <div>
          <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
            Unit Belum Ada Tanggal Masa Berlaku ({missingValidityItems.length})
          </h2>
          <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">
            Sistem tidak mengarang tanggal jatuh tempo bila tanggal berlaku resmi belum dicatat pada Suket, LHPP, atau data unit.
          </p>
        </div>
      </div>

      {missingValidityItems.length === 0 ? (
        <div className="p-6 bg-white dark:bg-[#151821] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <EmptyState
            title="Seluruh unit aktif telah memiliki tanggal masa berlaku"
            description="Tidak ada unit yang belum tercatat tanggal masa berlakunya."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Mobile: Kartu Responsif */}
          <div className="md:hidden space-y-3">
            {missingValidityItems.map((u) => (
              <div
                key={u.object_id}
                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">
                      {u.object_name}
                    </h3>
                    <p className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                      {u.category_code} · SN: {u.serial_number}
                    </p>
                  </div>
                  <Badge tone="warning">Belum Ada Tanggal</Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Perusahaan Klien:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] text-right truncate max-w-[200px]">
                      {u.client_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                    <span>Pemeriksaan Terakhir:</span>
                    <span className="text-right">
                      {u.last_inspected_at
                        ? `${formatDate(u.last_inspected_at)} (${u.last_po_number || u.last_order_no})`
                        : 'Belum pernah diperiksa'}
                    </span>
                  </div>
                </div>

                {canManage && (
                  <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <Button
                      variant="primary"
                      size="touch"
                      icon={CalendarPlus}
                      onClick={() => onOpenValidityModal(u)}
                      className="w-full"
                    >
                      Tetapkan Tanggal Masa Berlaku
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden md:block">
            <TableWrapper>
              <TableHead>
                <tr>
                  <TableCell isHeader className="min-w-[200px]">Unit Alat &amp; Kategori</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Perusahaan Klien</TableCell>
                  <TableCell isHeader className="w-[180px]">Pemeriksaan Terakhir</TableCell>
                  <TableCell isHeader className="w-[170px]">Status Data</TableCell>
                  <TableCell isHeader align="right" className="w-[180px]">Tindakan</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {missingValidityItems.map((u) => (
                  <TableRow key={u.object_id}>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{u.object_name}</div>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        {u.category_code} · SN: <span className="font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">{u.serial_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {u.client_name}
                    </TableCell>
                    <TableCell className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                      {u.last_inspected_at
                        ? `${formatDate(u.last_inspected_at)} (${u.last_po_number || u.last_order_no})`
                        : 'Belum pernah diperiksa'}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge tone="warning">Belum Ada Tanggal</Badge>
                    </TableCell>
                    <TableCell align="right">
                      {canManage && (
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={CalendarPlus}
                          onClick={() => onOpenValidityModal(u)}
                        >
                          Tetapkan Tanggal
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrapper>
          </div>
        </>
      )}
    </section>
  );
}
