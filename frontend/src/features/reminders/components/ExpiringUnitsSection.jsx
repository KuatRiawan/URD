import { useState } from 'react';
import {
  ArrowsClockwise,
  CalendarPlus,
  EnvelopeSimple,
  WarningOctagon,
  WhatsappLogo
} from '@phosphor-icons/react';
import { EmptyState, PaginationBar } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { FOLLOWUP_STATUS_LABELS, formatDate } from '../../../lib/utils/format.js';

export function ExpiringUnitsSection({
  datedUnits,
  expiryStateLabels,
  canManage,
  submitting,
  onOpenValidityModal,
  onCreateRenewalOrder
}) {
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const displayUnits = datedUnits.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <WarningOctagon size={18} className="text-[#C81E1E]" weight="bold" />
        <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
          Unit Alat Mendekati Jatuh Tempo ({datedUnits.length})
        </h2>
      </div>

      {datedUnits.length === 0 ? (
        <div className="p-6 bg-white dark:bg-[#151821] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <EmptyState
            title="Tidak ada unit jatuh tempo dalam jendela ini"
            description="Unit yang memiliki tanggal masa berlaku atau jadwal riksa uji berikutnya dalam jendela hari ini akan tampil di sini."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Mobile: Kartu Responsif Touch-Friendly */}
          <div className="md:hidden space-y-3">
            {displayUnits.map((item) => (
              <div
                key={item.object_id}
                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
              >
                {/* Header: Status & Hari Tersisa */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <Badge
                    tone={
                      item.expiryState === 'SUDAH_KEDALUWARSA' ||
                      item.expiryState === 'JATUH_TEMPO_PEMERIKSAAN'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {expiryStateLabels[item.expiryState] || item.expiryState}
                  </Badge>
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      item.days_remaining < 0
                        ? 'text-red-600 dark:text-red-400'
                        : item.days_remaining === 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                    }`}
                  >
                    {item.days_remaining < 0
                      ? `Lewat ${Math.abs(item.days_remaining)} hari`
                      : item.days_remaining === 0
                      ? 'Jatuh tempo hari ini'
                      : `${item.days_remaining} hari lagi`}
                  </span>
                </div>

                {/* Info Unit Alat & Klien */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Unit Alat:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] text-right truncate max-w-[200px]">
                      {item.object_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                    <span>Kategori &amp; SN:</span>
                    <span className="font-mono text-[#1D1D1F] dark:text-[#E5E5EA]">
                      {item.category_code} · SN: {item.serial_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Klien:</span>
                    <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7] text-right truncate max-w-[200px]">
                      {item.client_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Tgl Jatuh Tempo:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                      {formatDate(item.effective_valid_until)}
                    </span>
                  </div>
                  {item.suket_no && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                      <span>Suket:</span>
                      <span>{item.suket_no}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Tindak Lanjut:</span>
                    <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Mobile */}
                {canManage && (
                  <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      touchFriendly
                      icon={CalendarPlus}
                      onClick={() => onOpenValidityModal(item)}
                      className="flex-1"
                    >
                      Tindak Lanjut
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      touchFriendly
                      icon={ArrowsClockwise}
                      disabled={submitting}
                      onClick={() => onCreateRenewalOrder(item.object_id, item.object_name)}
                      className="flex-1"
                    >
                      PO Baru
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden md:block">
            <TableWrapper className="min-w-[960px]">
              <TableHead>
                <tr>
                  <TableCell isHeader className="w-[190px] min-w-[190px] whitespace-nowrap">Status Masa Berlaku</TableCell>
                  <TableCell isHeader className="w-[160px] whitespace-nowrap">Tanggal Jatuh Tempo</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Perusahaan Klien</TableCell>
                  <TableCell isHeader className="min-w-[190px]">Unit Alat &amp; Nomor Seri</TableCell>
                  <TableCell isHeader className="w-[160px]">Tindak Lanjut</TableCell>
                  <TableCell isHeader align="right" className="w-[180px] whitespace-nowrap">Aksi</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {displayUnits.map((item) => (
                  <TableRow key={item.object_id}>
                    <TableCell className="text-xs whitespace-nowrap min-w-[190px]">
                      <div className="inline-block whitespace-nowrap">
                        <Badge
                          tone={
                            item.expiryState === 'SUDAH_KEDALUWARSA' ||
                            item.expiryState === 'JATUH_TEMPO_PEMERIKSAAN'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {expiryStateLabels[item.expiryState] || item.expiryState}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D] tabular-nums whitespace-nowrap">
                        {item.days_remaining < 0
                          ? `Lewat ${Math.abs(item.days_remaining)} hari`
                          : item.days_remaining === 0
                          ? 'Jatuh tempo hari ini'
                          : `${item.days_remaining} hari lagi`}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                        {item.effective_valid_until ? formatDate(item.effective_valid_until) : (
                          <span className="text-[#86868B] dark:text-[#8E8E93] font-normal italic">Belum ditetapkan</span>
                        )}
                      </div>
                      {item.suket_no && (
                        <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5">Suket: {item.suket_no}</div>
                      )}
                      {item.last_lhpp_no && (
                        <div className="font-mono text-[11px] text-[#86868B] dark:text-[#8E8E93]">LHPP: {item.last_lhpp_no}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.client_name}</div>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        PIC: {item.contact_name || '-'} · {item.contact_phone || item.client_phone || '-'}
                      </div>
                      <div className="text-[#86868B] dark:text-[#8E8E93] text-[11px]">
                        {item.contact_email || item.client_email || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.object_name}</div>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        {item.category_code} · SN: <span className="font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">{item.serial_number}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                      </div>
                      {item.last_followup_note && (
                        <div className="text-[11px] text-[#6E6E73] dark:text-[#98989D] truncate max-w-xs mt-0.5">
                          {item.last_followup_note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {canManage && (
                          <>
                            <Button
                              variant="secondary"
                              size="xs"
                              icon={CalendarPlus}
                              onClick={() => onOpenValidityModal(item)}
                            >
                              Tindak Lanjut
                            </Button>
                            <ActionMenu
                              label="Aksi Perpanjangan"
                              items={[
                                {
                                  key: 'create_po',
                                  label: '+ Buat PO Perpanjangan',
                                  icon: ArrowsClockwise,
                                  onClick: () => onCreateRenewalOrder(item.object_id, item.object_name)
                                }
                              ]}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrapper>
          </div>

          <PaginationBar
            page={page}
            limit={pageSize}
            total={datedUnits.length}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
