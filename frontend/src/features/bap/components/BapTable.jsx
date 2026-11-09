import { Eye, FileDoc, FilePdf } from '@phosphor-icons/react';
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

export function BapTable({ bapList, onPreviewPdf, onDownloadPdf, onDownloadDocx, onOpenDetail }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Berita Acara BAP */}
      <div className="sm:hidden space-y-3">
        {bapList.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            {/* Header: Nomor BAP & Status */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block truncate">
                  {b.bap_no}
                </span>
                <span className="text-[11px] font-mono text-[#C81E1E] dark:text-red-400 block">
                  PO: {b.po_number || b.order_no}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Tgl Periksa: {formatDate(b.inspection_date)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={b.status === 'FINAL' ? 'success' : 'warning'}>
                  {b.status === 'FINAL' ? 'FINAL' : 'DRAF BAP'}
                </Badge>
                {b.lhpp_no && (
                  <span className="text-[10px] font-mono text-slate-400">
                    LHPP: {b.lhpp_no}
                  </span>
                )}
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
                  {b.category_code} · SN: {b.serial_number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Klien:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {b.client_name}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Inspector:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {b.inspector_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hasil Riksa Uji:</span>
                <Badge variant={b.is_compliant ? 'success' : 'danger'}>
                  {b.is_compliant ? 'MEMENUHI SYARAT K3' : 'TIDAK MEMENUHI'}
                </Badge>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                touchFriendly
                onClick={() => onOpenDetail(b.id)}
                className="flex-1"
              >
                Detail
              </Button>
              <ActionMenu
                label="Dokumen BAP"
                items={[
                  {
                    key: 'preview',
                    label: 'Pratinjau PDF',
                    icon: Eye,
                    onClick: () => onPreviewPdf(b.id, b.bap_no)
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
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Nomor BAP &amp; PO</TableCell>
              <TableCell isHeader>Klien &amp; Lokasi</TableCell>
              <TableCell isHeader>Unit Alat Diperiksa</TableCell>
              <TableCell isHeader>Inspector</TableCell>
              <TableCell isHeader>Hasil Riksa Uji</TableCell>
              <TableCell isHeader>Status BAP</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {bapList.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{b.bap_no}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    PO: <span className="font-mono font-semibold">{b.po_number || b.order_no}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Tgl Periksa: {formatDate(b.inspection_date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-slate-900 dark:text-white">{b.client_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{b.install_location || '-'}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-slate-900 dark:text-white">{b.object_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {b.category_code} · SN: {b.serial_number} {b.capacity ? `· ${b.capacity}` : ''}
                  </div>
                </TableCell>
                <TableCell className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                  {b.inspector_name}
                </TableCell>
                <TableCell>
                  <Badge variant={b.is_compliant ? 'success' : 'danger'}>
                    {b.is_compliant ? 'MEMENUHI SYARAT K3' : 'TIDAK MEMENUHI'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={b.status === 'FINAL' ? 'success' : 'warning'}>
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
                    <ActionMenu
                      label="Opsi Dokumen BAP"
                      items={[
                        {
                          key: 'preview',
                          label: 'Pratinjau PDF',
                          icon: Eye,
                          onClick: () => onPreviewPdf(b.id, b.bap_no)
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
            ))}
          </TableBody>
        </TableWrapper>
      </div>
    </div>
  );
}
