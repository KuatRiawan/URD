import { Eye, FileDoc, FilePdf, ShareNetwork } from '@phosphor-icons/react';
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
import { formatDate } from '../../../lib/utils/format.js';

export function BapTable({ bapList, onPreviewPdf, onDownloadPdf, onDownloadDocx, onOpenDetail, onShareBap }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Berita Acara BAP */}
      <div className="sm:hidden space-y-3">
        {bapList.map((b) => {
          const picName = b.client_signer_name || b.document_data?.contact_name || b.contact_name || 'Belum diisi';
          const isPicSigned = Boolean(b.client_signed_at || b.client_signature_file_id);

          return (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] p-4 shadow-2xs space-y-3"
            >
              {/* Header: Nomor BAP & Status Dokumen */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block truncate">
                    {b.bap_no}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-[#C81E1E] dark:text-red-400 block mt-0.5">
                    PO: {b.po_number || b.order_no}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                    Tanggal BAP: {formatDate(b.inspection_date)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant={b.status === 'FINAL' ? 'success' : 'neutral'}>
                    {b.status === 'FINAL' ? 'FINAL' : 'DRAF BAP'}
                  </Badge>
                  <Badge variant={isPicSigned ? 'success' : 'warning'}>
                    {isPicSigned ? 'Sudah TTD PIC' : 'Belum TTD PIC'}
                  </Badge>
                </div>
              </div>

              {/* Info Unit Alat & Klien */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Unit Alat:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                    {b.object_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Kategori &amp; SN:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {b.category_code} · SN: {b.serial_number || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Perusahaan:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {b.client_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">PIC Klien:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {picName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Inspector:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {b.inspector_name || 'Ahli K3'}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  touchFriendly
                  onClick={() => onOpenDetail(b.id)}
                  className="flex-1"
                >
                  Detail BAP
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  touchFriendly
                  icon={Eye}
                  onClick={() => onPreviewPdf(b.id, b.bap_no)}
                >
                  Pratinjau
                </Button>
                <ActionMenu
                  label="Opsi"
                  items={[
                    onShareBap && {
                      key: 'share',
                      label: 'Bagikan BAP',
                      icon: ShareNetwork,
                      onClick: () => onShareBap(b)
                    },
                    {
                      key: 'pdf',
                      label: 'Unduh PDF BAP',
                      icon: FilePdf,
                      onClick: () => onDownloadPdf(b.id, b.bap_no)
                    },
                    onDownloadDocx && {
                      key: 'docx',
                      label: 'Unduh Word (.docx)',
                      icon: FileDoc,
                      onClick: () => onDownloadDocx(b.id, b.bap_no)
                    }
                  ]}
                />
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
              <TableCell isHeader>Nomor BAP &amp; PO</TableCell>
              <TableCell isHeader>Perusahaan &amp; PIC</TableCell>
              <TableCell isHeader>Unit Alat Diperiksa</TableCell>
              <TableCell isHeader>Inspector (Ahli K3)</TableCell>
              <TableCell isHeader>Status TTD PIC</TableCell>
              <TableCell isHeader>Status Dokumen</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {bapList.map((b) => {
              const picName = b.client_signer_name || b.document_data?.contact_name || b.contact_name || 'Belum diisi';
              const isPicSigned = Boolean(b.client_signed_at || b.client_signature_file_id);

              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{b.bap_no}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      PO: <span className="font-mono font-semibold text-[#C81E1E] dark:text-red-400">{b.po_number || b.order_no}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Tgl BAP: {formatDate(b.inspection_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-white">{b.client_name}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      PIC: <span className="font-medium text-slate-800 dark:text-slate-200">{picName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                      {b.install_location || b.client_address || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-white">{b.object_name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {b.category_code} · SN: <span className="font-mono">{b.serial_number || '-'}</span> {b.capacity ? `· ${b.capacity}` : ''}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {b.inspector_name || 'Ahli K3'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isPicSigned ? 'success' : 'warning'}>
                      {isPicSigned ? 'Sudah TTD PIC' : 'Belum TTD PIC'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.status === 'FINAL' ? 'success' : 'neutral'}>
                      {b.status === 'FINAL' ? 'FINAL (TERKUNCI)' : 'DRAF BAP'}
                    </Badge>
                    {b.lhpp_no && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        LHPP: {b.lhpp_no}
                      </div>
                    )}
                  </TableCell>
                  <TableCell align="right" className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => onOpenDetail(b.id)}
                      >
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        icon={Eye}
                        onClick={() => onPreviewPdf(b.id, b.bap_no)}
                      >
                        Pratinjau
                      </Button>
                      <ActionMenu
                        label="Opsi Dokumen BAP"
                        items={[
                          onShareBap && {
                            key: 'share',
                            label: 'Bagikan BAP',
                            icon: ShareNetwork,
                            onClick: () => onShareBap(b)
                          },
                          {
                            key: 'pdf',
                            label: 'Unduh PDF BAP',
                            icon: FilePdf,
                            onClick: () => onDownloadPdf(b.id, b.bap_no)
                          },
                          onDownloadDocx && {
                            key: 'docx',
                            label: 'Unduh Word (.docx)',
                            icon: FileDoc,
                            onClick: () => onDownloadDocx(b.id, b.bap_no)
                          }
                        ]}
                      />
                    </div>
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
