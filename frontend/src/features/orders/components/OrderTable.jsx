import { DownloadSimple, Eye, CaretRight, ClipboardText } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate, formatDateTime, ORDER_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { STATUS_TONE } from '../orderConstants.js';

export function OrderTable({
  orders,
  openOrderDetail,
  handleDownloadAssignmentPdf
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Responsif Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => {
          const prog = order.unitProgress || {};
          return (
            <div
              key={order.id}
              onClick={() => openOrderDetail(order.id)}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99] transition-all cursor-pointer"
            >
              {/* Header Kartu: Nomor PO & Status */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-mono font-bold text-sm text-[#C81E1E] dark:text-red-400 block">
                    {order.po_number || order.order_no}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Order: {order.order_no}
                  </span>
                </div>
                <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                  {ORDER_STATUS_LABELS[order.status] || order.status}
                </Badge>
              </div>

              {/* Isi Kartu: Info Klien & Layanan */}
              <div className="py-2.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Klien</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-right truncate max-w-[200px]">
                    {order.client_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Layanan</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {SERVICE_TYPE_LABELS[order.service_type] || order.service_type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Progres Alat</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {prog.completed || 0} / {prog.totalUnits || order.object_count || 0} Unit Selesai
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tgl PO</span>
                  <span className="text-slate-600 dark:text-slate-400">
                    {formatDate(order.po_date || order.requested_date)}
                  </span>
                </div>
              </div>

              {/* Footer Kartu & Tombol Aksi */}
              <div
                className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => openOrderDetail(order.id)}
                  className="flex-1 min-h-10 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] active:scale-[0.98] transition-all cursor-pointer shadow-xs"
                >
                  <Eye size={15} weight="bold" />
                  <span>Buka Detail PO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAssignmentPdf(order.id, order.order_no)}
                  title="Unduh Surat Tugas PDF"
                  className="min-h-10 px-3 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <DownloadSimple size={15} />
                  <span className="hidden xs:inline">Surat Tugas</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4">Nomor PO &amp; Order</th>
                <th className="py-3 px-4">Perusahaan Klien</th>
                <th className="py-3 px-4">Jenis Layanan</th>
                <th className="py-3 px-4">Progres Unit Alat</th>
                <th className="py-3 px-4">Ahli K3 Ditugaskan</th>
                <th className="py-3 px-4">Status PO</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {orders.map((order) => {
                const prog = order.unitProgress || {};
                return (
                  <tr
                    key={order.id}
                    onClick={() => openOrderDetail(order.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                      <div className="text-[#C81E1E] dark:text-red-400">{order.po_number || order.order_no}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Order: {order.order_no}</div>
                      <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                        Tgl PO: {formatDate(order.po_date || order.requested_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {order.client_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                      <div>{SERVICE_TYPE_LABELS[order.service_type] || order.service_type}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Sumber: {order.source}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {prog.completed || 0} / {prog.totalUnits || order.object_count || 0} Unit Selesai
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {order.start_at ? formatDateTime(order.start_at) : 'Belum dijadwalkan'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {(order.assignments || []).length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-500">Belum ditugaskan</span>
                      ) : (
                        <div className="space-y-1">
                          {(order.assignments || []).map((asg) => (
                            <div key={asg.id} className="flex items-center gap-1.5">
                              <span className="font-medium text-slate-900 dark:text-slate-100">{asg.fullName}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {asg.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openOrderDetail(order.id)}
                          className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Eye size={15} />
                          <span>Kelola PO</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadAssignmentPdf(order.id, order.order_no)}
                          title="Unduh Surat Tugas PDF"
                          className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-700 dark:border-slate-600 bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 dark:hover:bg-slate-600 cursor-pointer"
                        >
                          <DownloadSimple size={15} />
                          <span>Surat Tugas</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
