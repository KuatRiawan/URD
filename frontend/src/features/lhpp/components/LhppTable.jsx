import { DownloadSimple, Eye, FilePdf, PencilSimpleLine } from '@phosphor-icons/react';
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
import { CONCLUSION_LABELS, LHPP_STATUS_LABELS } from '../../../lib/utils/format.js';
import { STATUS_TONE } from '../lhppConstants.js';

export function LhppTable({
  items,
  openDetail,
  handlePreviewPdf,
  handleDownloadPdf
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Dokumen LHPP */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            {/* Header: Nomor LHPP & Status */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <span className="font-mono font-bold text-sm text-[#C81E1E] dark:text-red-400 block truncate">
                  {item.lhpp_no || 'DRAF LHPP'}
                </span>
                {item.bap_no && (
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
                    BAP: {item.bap_no}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Revisi v{item.version || 1}
                </span>
              </div>
              <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                {LHPP_STATUS_LABELS[item.status] || item.status}
              </Badge>
            </div>

            {/* Info Objek Uji & Klien */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Objek Uji:</span>
                <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                  {item.object_name}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Kategori &amp; SN:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {item.category_code} · SN: {item.serial_number}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Klien / PO:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {item.client_name} ({item.po_number || item.order_no})
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Ahli K3:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {item.inspector_name || '-'}
                </span>
              </div>
              {item.conclusion && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Hasil:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {CONCLUSION_LABELS[item.conclusion] || item.conclusion}
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                touchFriendly
                icon={Eye}
                onClick={() => openDetail(item.id)}
                className="flex-1"
              >
                Detail
              </Button>
              <ActionMenu
                label="Opsi Dokumen"
                items={[
                  {
                    key: 'preview',
                    label: 'Pratinjau PDF',
                    icon: Eye,
                    onClick: () => handlePreviewPdf(item.id, item.lhpp_no)
                  },
                  {
                    key: 'pdf',
                    label: 'Unduh Berkas PDF',
                    icon: FilePdf,
                    onClick: () => handleDownloadPdf(item.id, item.lhpp_no)
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
              <TableCell isHeader>Nomor LHPP</TableCell>
              <TableCell isHeader>Perusahaan Klien &amp; Order</TableCell>
              <TableCell isHeader>Objek Uji K3</TableCell>
              <TableCell isHeader>Ahli K3 &amp; Kesimpulan</TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                  <div>{item.lhpp_no || 'DRAF LHPP'}</div>
                  {item.bap_no && (
                    <div className="text-[11px] text-[#C81E1E] dark:text-red-400">BAP: {item.bap_no}</div>
                  )}
                  <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                    Revisi v{item.version || 1}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{item.client_name}</div>
                  <div className="font-mono text-slate-500 dark:text-slate-400">
                    PO: {item.po_number || item.order_no}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {item.category_code} · SN: {item.serial_number}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{item.inspector_name}</div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {CONCLUSION_LABELS[item.conclusion] || item.conclusion || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                    {LHPP_STATUS_LABELS[item.status] || item.status}
                  </Badge>
                </TableCell>
                <TableCell align="right" className="whitespace-nowrap">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Eye}
                      onClick={() => openDetail(item.id)}
                      title="Buka form review &amp; quality control LHPP"
                    >
                      Detail
                    </Button>
                    <ActionMenu
                      label="Opsi Dokumen LHPP"
                      items={[
                        {
                          key: 'preview',
                          label: 'Pratinjau PDF',
                          icon: Eye,
                          onClick: () => handlePreviewPdf(item.id, item.lhpp_no)
                        },
                        {
                          key: 'pdf',
                          label: 'Unduh Berkas PDF',
                          icon: FilePdf,
                          onClick: () => handleDownloadPdf(item.id, item.lhpp_no)
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
