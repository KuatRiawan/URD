import { DownloadSimple, Eye } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate, formatDateTime, ORDER_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { STATUS_TONE } from '../orderConstants.js';

export function OrderTable({
  orders,
  openOrderDetail,
  handleDownloadAssignmentPdf
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
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
                  <td className="py-3.5 px-4 text-right">
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
  );
}

