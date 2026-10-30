import { Eye, FilePdf } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function BapTable({ bapList, onPreviewPdf, onDownloadPdf, onOpenDetail }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Nomor BAP &amp; PO</th>
              <th className="py-3.5 px-4">Klien &amp; Lokasi</th>
              <th className="py-3.5 px-4">Unit Alat Diperiksa</th>
              <th className="py-3.5 px-4">Inspector</th>
              <th className="py-3.5 px-4">Hasil Riksa Uji</th>
              <th className="py-3.5 px-4">Status BAP</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
            {bapList.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-slate-900 dark:text-white">{b.bap_no}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    PO: <span className="font-mono font-semibold">{b.po_number || b.order_no}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500">
                    Tgl Periksa: {formatDate(b.inspection_date)}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-white">{b.client_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{b.install_location || '-'}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-900 dark:text-white">{b.object_name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {b.category_code} · SN: {b.serial_number} {b.capacity ? `· ${b.capacity}` : ''}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs font-medium">
                  {b.inspector_name}
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={b.is_compliant ? 'success' : 'danger'}>
                    {b.is_compliant ? 'MEMENUHI SYARAT K3' : 'TIDAK MEMENUHI'}
                  </Badge>
                </td>
                <td className="py-3.5 px-4">
                  <Badge variant={b.status === 'FINAL' ? 'success' : 'warning'}>
                    {b.status === 'FINAL' ? 'FINAL (TERKUNCI)' : 'DRAF BAP'}
                  </Badge>
                  {b.lhpp_no && (
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                      LHPP: {b.lhpp_no}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right space-x-2">
                  <button
                    type="button"
                    onClick={() => onPreviewPdf(b.id, b.bap_no)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md cursor-pointer"
                  >
                    <Eye size={15} />
                    Pratinjau
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadPdf(b.id, b.bap_no)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#C81E1E] dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md cursor-pointer"
                  >
                    <FilePdf size={15} weight="bold" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenDetail(b.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-md cursor-pointer"
                  >
                    Buka BAP
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
