import { Buildings, PaperPlaneTilt } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
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
  DITERIMA: 'success'
};

export const DISPATCH_MEDIA_OPTIONS = [
  { value: 'KURIR', label: 'Kurir / Ekspedisi (JNE, TIKI, dsb)' },
  { value: 'SERAH_TERIMA_LANGSUNG', label: 'Serah Terima Langsung di Lokasi' },
  { value: 'EMAIL', label: 'Email Resmi Perusahaan' },
  { value: 'WHATSAPP', label: 'WhatsApp / WABA Resmi' },
  { value: 'PORTAL_KLIEN', label: 'Unduhan Portal Klien' }
];

export function DistributionTable({
  distributions,
  isMarketingOrAdmin,
  onOpenUpdateModal
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Distribusi Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {distributions.map((item) => (
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
                    item.recipient_target === 'DISNAKER'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                  }`}
                >
                  <Buildings size={12} weight="bold" />
                  <span>Penerima: {DISTRIBUTION_TARGET_LABELS[item.recipient_target] || item.recipient_target}</span>
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
                  {item.client_name || '-'} ({item.po_number || '-'})
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Unit Objek:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                  {item.object_name || 'Unit Alat'} (SN: {item.serial_number || '-'})
                </span>
              </div>
              {(item.bap_no || item.lhpp_no) && (
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  <span>No. Referensi:</span>
                  <span>{item.bap_no ? `BAP: ${item.bap_no}` : `LHPP: ${item.lhpp_no}`}</span>
                </div>
              )}
              {item.dispatch_media && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Pengiriman:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {DISPATCH_MEDIA_OPTIONS.find((o) => o.value === item.dispatch_media)?.label || item.dispatch_media}
                    {item.tracking_number ? ` (Resi: ${item.tracking_number})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Tombol Aksi Mobile */}
            {isMarketingOrAdmin && item.status !== 'DITERIMA' && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => onOpenUpdateModal(item)}
                  className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] transition-colors cursor-pointer"
                >
                  <PaperPlaneTilt size={15} weight="bold" />
                  <span>Update Status Kirim</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">Dokumen &amp; Target</th>
                <th scope="col" className="px-4 py-3.5">Perusahaan Klien &amp; PO</th>
                <th scope="col" className="px-4 py-3.5">Unit Objek Uji</th>
                <th scope="col" className="px-4 py-3.5">Nomor Referensi</th>
                <th scope="col" className="px-4 py-3.5">Ekspedisi &amp; Resi</th>
                <th scope="col" className="px-4 py-3.5">Status Pengiriman</th>
                <th scope="col" className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {distributions.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {DISTRIBUTION_DOC_TYPE_LABELS[item.document_type] || item.document_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          item.recipient_target === 'DISNAKER'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
                        }`}
                      >
                        <Buildings size={12} weight="bold" />
                        <span>Penerima: {DISTRIBUTION_TARGET_LABELS[item.recipient_target] || item.recipient_target}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.client_name || '-'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.po_number || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.object_name || 'Unit Alat'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        SN: {item.serial_number || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-1 text-[11px] font-mono">
                      {item.bap_no && (
                        <span className="block text-slate-700 dark:text-slate-300">
                          BAP: {item.bap_no}
                        </span>
                      )}
                      {item.lhpp_no && (
                        <span className="block text-slate-700 dark:text-slate-300">
                          LHPP: {item.lhpp_no}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {item.dispatch_media ? (
                          DISPATCH_MEDIA_OPTIONS.find((o) => o.value === item.dispatch_media)?.label || item.dispatch_media
                        ) : (
                          <span className="text-slate-400 italic">Belum dikirim</span>
                        )}
                      </p>
                      {item.tracking_number && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                          Resi: {item.tracking_number}
                        </p>
                      )}
                      {item.dispatched_at && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Kirim: {formatDateTime(item.dispatched_at)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={STATUS_TONES[item.status] || 'neutral'}>
                      {DISTRIBUTION_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {isMarketingOrAdmin && item.status !== 'DITERIMA' ? (
                      <button
                        type="button"
                        onClick={() => onOpenUpdateModal(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-[#C81E1E] hover:border-[#C81E1E] hover:text-white transition-colors cursor-pointer"
                      >
                        <PaperPlaneTilt size={14} weight="bold" />
                        <span>Update Kirim</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.status === 'DITERIMA' ? 'Tuntas' : 'Monitoring'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
