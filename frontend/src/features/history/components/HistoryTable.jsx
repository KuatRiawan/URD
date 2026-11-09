import {
  FilePdf,
  Truck
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { formatDate, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function HistoryTable({ items, downloadPdf, onSelectRecord }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Riwayat Pemeriksaan */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const effectiveValidity =
            item.suket_valid_until ||
            item.next_inspection_date ||
            item.recommended_valid_until;
          return (
            <div
              key={item.inspection_id}
              className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
            >
              {/* Header: Tanggal & PO */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-[#C81E1E] dark:text-red-400 block truncate">
                    PO: {item.po_number || item.order_no}
                  </span>
                  <span className="text-[10px] text-[#86868B] dark:text-[#8E8E93] block mt-0.5 font-mono">
                    Tanggal: {formatDate(item.inspected_at || item.submitted_at)}
                  </span>
                </div>
                <Badge
                  tone={
                    item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                      ? 'danger'
                      : item.conclusion
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {item.conclusion ? item.conclusion.replace(/_/g, ' ') : item.inspection_status}
                </Badge>
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
                  <span className="text-[#6E6E73] dark:text-[#98989D]">Inspector:</span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {item.inspector_name}
                  </span>
                </div>

                {/* Referensi Dokumen PDF */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.bap_id && (
                    <Button
                      variant="soft"
                      size="xs"
                      icon={FilePdf}
                      onClick={() =>
                        downloadPdf(
                          `/bap/${item.bap_id}/pdf`,
                          `${(item.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      title="Unduh BAP (PDF)"
                    >
                      {item.bap_no}
                    </Button>
                  )}
                  {item.lhpp_id && (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={FilePdf}
                      onClick={() =>
                        downloadPdf(
                          `/lhpp/${item.lhpp_id}/pdf`,
                          `${(item.lhpp_no || 'Draf-LHPP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      title="Unduh LHPP (PDF)"
                    >
                      {item.lhpp_no || 'LHPP'}
                    </Button>
                  )}
                </div>

                {effectiveValidity && (
                  <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.06] text-[11px]">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Masa Berlaku:</span>
                    <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                      {formatDate(effectiveValidity)} {item.suket_no ? `(Suket: ${item.suket_no})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Button
                  variant="secondary"
                  size="touch"
                  onClick={() => onSelectRecord(item)}
                  className="w-full"
                >
                  Lihat Rincian &amp; Audit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Tanggal &amp; PO</TableCell>
              <TableCell isHeader>Unit Alat &amp; Klien</TableCell>
              <TableCell isHeader>Jenis &amp; Inspector</TableCell>
              <TableCell isHeader>Hasil Pemeriksaan</TableCell>
              <TableCell isHeader>Dokumen BAP &amp; LHPP</TableCell>
              <TableCell isHeader>Masa Berlaku / Jadwal</TableCell>
              <TableCell isHeader align="right">Detail</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const effectiveValidity =
                item.suket_valid_until ||
                item.next_inspection_date ||
                item.recommended_valid_until;
              const delivered = Array.isArray(item.deliveries) && item.deliveries.length > 0;

              return (
                <TableRow
                  key={item.inspection_id}
                  isClickable
                  onClick={() => onSelectRecord(item)}
                >
                  <TableCell className="text-xs">
                    <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {formatDate(item.inspected_at || item.submitted_at)}
                    </div>
                    <div className="text-xs font-mono font-bold text-[#C81E1E]">
                      PO: {item.po_number || item.order_no}
                    </div>
                    <div className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                      Order: {item.order_no}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.object_name}</div>
                    <div className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                      {item.category_code} · SN: <span className="font-mono">{item.serial_number}</span>
                    </div>
                    <div className="text-xs text-[#86868B] dark:text-[#8E8E93]">{item.client_name}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {SERVICE_TYPE_LABELS[item.service_type] || item.service_type}
                    </div>
                    <div className="text-xs text-[#6E6E73] dark:text-[#98989D]">
                      Oleh: {item.inspector_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge
                      tone={
                        item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                          ? 'danger'
                          : item.conclusion
                          ? 'success'
                          : 'neutral'
                      }
                    >
                      {item.conclusion
                        ? item.conclusion.replace(/_/g, ' ')
                        : item.inspection_status}
                    </Badge>
                    {item.findings?.length > 0 && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                        {item.findings.length} temuan tercatat
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs space-y-1">
                    {item.bap_id ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {item.bap_no}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={FilePdf}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(
                              `/bap/${item.bap_id}/pdf`,
                              `${(item.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                            );
                          }}
                          className="text-[#C81E1E] hover:text-[#A61717]"
                        >
                          PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#86868B] dark:text-[#8E8E93]">BAP belum dibuat</div>
                    )}

                    {item.lhpp_id ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                          {item.lhpp_no || `LHPP (${item.lhpp_status})`}
                        </span>
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={FilePdf}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPdf(
                              `/lhpp/${item.lhpp_id}/pdf`,
                              `${(item.lhpp_no || 'Draf-LHPP').replace(/\//g, '-')}.pdf`
                            );
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                        >
                          PDF
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-[#86868B] dark:text-[#8E8E93]">LHPP belum dibuat</div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {effectiveValidity ? (
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                          {formatDate(effectiveValidity)}
                        </div>
                        {item.suket_no && (
                          <div className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D]">
                            Suket: {item.suket_no}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Badge tone="warning">Belum Ada Tanggal Masa Berlaku</Badge>
                    )}
                    <div className="mt-1">
                      {delivered ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Truck size={12} weight="bold" /> Diserahkan ke klien
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                          Belum diserahkan
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => onSelectRecord(item)}
                    >
                      Rincian
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableWrapper>
      </div>
    </div>
  );
}
