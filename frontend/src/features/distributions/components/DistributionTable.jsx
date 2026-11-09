import { Buildings, DownloadSimple, Eye, PaperPlaneTilt } from '@phosphor-icons/react';
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
import {
  formatDateTime,
  DISTRIBUTION_DOC_TYPE_LABELS,
  DISTRIBUTION_STATUS_LABELS,
  DISTRIBUTION_TARGET_LABELS
} from '../../../lib/utils/format.js';

const STATUS_TONES = {
  MENUNGGU_DOKUMEN: 'neutral',
  SIAP_DIKIRIM: 'warning',
  DIKIRIM: 'info',
  DITERIMA: 'success',
  PERLU_KIRIM_ULANG: 'danger'
};

export const DISPATCH_MEDIA_OPTIONS = [
  { value: 'KURIR_FISIK', label: 'Kurir / Ekspedisi (JNE, TIKI, dsb)' },
  { value: 'LANGSUNG', label: 'Serah Terima Langsung di Lokasi' },
  { value: 'EMAIL', label: 'Email Resmi Perusahaan' },
  { value: 'WHATSAPP', label: 'WhatsApp / WABA Resmi' },
  { value: 'PORTAL', label: 'Unduhan Portal Klien' }
];

export function DistributionTable({
  distributions,
  isMarketingOrAdmin,
  onOpenUpdateModal,
  onPreviewBast,
  onDownloadBast
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Distribusi Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {distributions.map((item) => {
          const target = item.target_destination || item.recipient_target || 'KLIEN';
          const docNo = item.document_no || item.bap_no || item.lhpp_no;
          const trackingRef = item.tracking_reference || item.tracking_number;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
            >
              {/* Header: Dokumen & Status */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    {DISTRIBUTION_DOC_TYPE_LABELS[item.document_type] || item.document_type}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold mt-1 ${
                      target === 'DISNAKER'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    <Buildings size={12} weight="bold" />
                    <span>Penerima: {DISTRIBUTION_TARGET_LABELS[target] || target}</span>
                  </span>
                </div>
                <Badge tone={STATUS_TONES[item.status] || 'neutral'}>
                  {DISTRIBUTION_STATUS_LABELS[item.status] || item.status}
                </Badge>
              </div>

              {/* Info Klien, Unit, dan Dokumen */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Klien / PO:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                    {item.client_name || '-'} ({item.po_number || item.order_no || '-'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Unit Objek:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {item.object_name || 'Unit Alat'} (SN: {item.serial_number || '-'})
                  </span>
                </div>
                {docNo && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    <span>No. Dokumen:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{docNo}</span>
                  </div>
                )}
                {item.dispatch_media && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Pengiriman:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {DISPATCH_MEDIA_OPTIONS.find((o) => o.value === item.dispatch_media)?.label || item.dispatch_media}
                      {trackingRef ? ` (Resi: ${trackingRef})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Tombol Aksi Mobile: Aksi Operasional + Pratinjau & ActionMenu */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {isMarketingOrAdmin && item.status !== 'DITERIMA' && (
                  <Button
                    variant="primary"
                    size="sm"
                    touchFriendly
                    icon={PaperPlaneTilt}
                    onClick={() => onOpenUpdateModal(item)}
                    className="flex-1"
                  >
                    Perbarui Status
                  </Button>
                )}
                {item.order_id && onPreviewBast && (
                  <Button
                    variant="secondary"
                    size="sm"
                    touchFriendly
                    icon={Eye}
                    onClick={() => onPreviewBast(item.order_id, item.po_number || item.order_no || item.client_name)}
                    className="flex-1"
                  >
                    Pratinjau BAST
                  </Button>
                )}
                {item.order_id && onDownloadBast && (
                  <ActionMenu
                    label="Dokumen BAST"
                    items={[
                      {
                        label: 'Unduh BAST (PDF)',
                        icon: DownloadSimple,
                        onClick: () => onDownloadBast(item.order_id, item.po_number || item.order_no || item.client_name)
                      }
                    ]}
                  />
                )}
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
              <TableCell isHeader>Dokumen &amp; Target</TableCell>
              <TableCell isHeader>Perusahaan Klien &amp; PO</TableCell>
              <TableCell isHeader>Unit Objek Uji</TableCell>
              <TableCell isHeader>Nomor Referensi</TableCell>
              <TableCell isHeader>Ekspedisi &amp; Resi</TableCell>
              <TableCell isHeader>Status Pengiriman</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {distributions.map((item) => {
              const target = item.target_destination || item.recipient_target || 'KLIEN';
              const docNo = item.document_no || item.bap_no || item.lhpp_no;
              const trackingRef = item.tracking_reference || item.tracking_number;
              const dispatchDate = item.dispatch_date || item.dispatched_at;
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {DISTRIBUTION_DOC_TYPE_LABELS[item.document_type] || item.document_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          target === 'DISNAKER'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        <Buildings size={12} weight="bold" />
                        <span>Penerima: {DISTRIBUTION_TARGET_LABELS[target] || target}</span>
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.client_name || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.po_number || item.order_no || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.object_name || 'Unit Alat'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        SN: {item.serial_number || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-[11px] font-mono">
                      {docNo ? (
                        <span className="block font-bold text-slate-800 dark:text-slate-200">
                          {item.document_type}: {docNo}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {item.recipient_name && (
                        <span className="block text-[10px] font-sans text-slate-500 dark:text-slate-400">
                          UP: {item.recipient_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.dispatch_media ? (
                          DISPATCH_MEDIA_OPTIONS.find((o) => o.value === item.dispatch_media)?.label || item.dispatch_media
                        ) : (
                          <span className="text-slate-400 italic">Belum dikirim</span>
                        )}
                      </p>
                      {trackingRef && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Resi: {trackingRef}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[220px]">
                          Catatan: {item.notes}
                        </p>
                      )}
                      {dispatchDate && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Tanggal: {formatDateTime(dispatchDate)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONES[item.status] || 'neutral'}>
                      {DISTRIBUTION_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {isMarketingOrAdmin && item.status !== 'DITERIMA' ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={PaperPlaneTilt}
                          onClick={() => onOpenUpdateModal(item)}
                        >
                          Perbarui Status
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium px-1.5">
                          {item.status === 'DITERIMA' ? 'Tuntas' : 'Monitoring'}
                        </span>
                      )}
                      {item.order_id && (onPreviewBast || onDownloadBast) && (
                        <ActionMenu
                          label="Dokumen BAST"
                          items={[
                            onPreviewBast && {
                              label: 'Pratinjau BAST',
                              icon: Eye,
                              onClick: () => onPreviewBast(item.order_id, item.po_number || item.order_no || item.client_name)
                            },
                            onDownloadBast && {
                              label: 'Unduh BAST (PDF)',
                              icon: DownloadSimple,
                              onClick: () => onDownloadBast(item.order_id, item.po_number || item.order_no || item.client_name)
                            }
                          ]}
                        />
                      )}
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
