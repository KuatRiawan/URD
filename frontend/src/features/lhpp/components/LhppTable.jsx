import { DownloadSimple, Eye, FilePdf, Scroll } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
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
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openDetail(item.id)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                <Eye size={15} />
                <span>Kelola</span>
              </button>
              <button
                type="button"
                onClick={() => handlePreviewPdf(item.id, item.lhpp_no)}
                className="min-h-[42px] px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Eye size={15} />
                <span>Pratinjau</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(item.id, item.lhpp_no)}
                className="min-h-[42px] px-3 inline-flex items-center justify-center gap-1 rounded-xl bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] transition-colors cursor-pointer"
              >
                <DownloadSimple size={15} />
                <span>PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Nomor LHPP</th>
                <th className="py-3 px-4">Perusahaan Klien &amp; Order</th>
                <th className="py-3 px-4">Objek Uji K3</th>
                <th className="py-3 px-4">Ahli K3 &amp; Kesimpulan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                    <div>{item.lhpp_no || 'DRAF LHPP'}</div>
                    {item.bap_no && (
                      <div className="text-[11px] text-[#C81E1E] dark:text-red-400">BAP: {item.bap_no}</div>
                    )}
                    <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                      Revisi v{item.version || 1}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.client_name}</div>
                    <div className="font-mono text-slate-500 dark:text-slate-400">
                      PO: {item.po_number || item.order_no}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {item.category_code} · SN: {item.serial_number}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{item.inspector_name}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {CONCLUSION_LABELS[item.conclusion] || item.conclusion || '-'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                      {LHPP_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openDetail(item.id)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye size={15} />
                        <span>Kelola</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePreviewPdf(item.id, item.lhpp_no)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Eye size={15} />
                        <span>Pratinjau</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(item.id, item.lhpp_no)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        <DownloadSimple size={15} />
                        <span>PDF</span>
                      </button>
                    </div>
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
