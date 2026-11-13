import { DownloadSimple, Eye } from '@phosphor-icons/react';
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
import { PaginationBar } from '../../../components/feedback/StateViews.jsx';
import { formatDate, formatDateTime, ORDER_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { STATUS_TONE } from '../orderConstants.js';

export function OrderTable({
  orders,
  openOrderDetail,
  handleDownloadAssignmentPdf,
  handleDownloadBastPdf,
  page,
  limit = 15,
  total = 0,
  onPageChange,
  user
}) {
  const isMarketing = user?.role === 'MARKETING';
  const detailLabel = 'Detail';

  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Responsif Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => {
          const prog = order.unitProgress || {};
          const hasAssignments = Array.isArray(order.assignments) && order.assignments.length > 0;
          const isCompleted = order.status === 'SELESAI';
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
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Progres Alat</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {prog.completed || 0} / {prog.totalUnits || order.object_count || 0} Unit Selesai
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        (prog.totalUnits || order.object_count) > 0 &&
                        (prog.completed || 0) === (prog.totalUnits || order.object_count)
                          ? 'bg-emerald-500'
                          : 'bg-[#C81E1E]'
                      }`}
                      style={{
                        width: `${
                          (prog.totalUnits || order.object_count) > 0
                            ? Math.round(
                                ((prog.completed || 0) / (prog.totalUnits || order.object_count)) * 100
                              )
                            : 0
                        }%`
                      }}
                    />
                  </div>
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
                <Button
                  variant="secondary"
                  size="sm"
                  touchFriendly
                  icon={Eye}
                  onClick={() => openOrderDetail(order.id)}
                  className="flex-1"
                >
                  {detailLabel}
                </Button>
                {((!isMarketing && hasAssignments) || (isCompleted && handleDownloadBastPdf)) && (
                  <ActionMenu
                    label="Dokumen PO"
                    items={[
                      !isMarketing && hasAssignments && {
                        label: 'Surat Tugas (PDF)',
                        icon: DownloadSimple,
                        onClick: () => handleDownloadAssignmentPdf(order.id, order.order_no)
                      },
                      isCompleted && handleDownloadBastPdf && {
                        label: 'BAST (PDF)',
                        icon: DownloadSimple,
                        onClick: () => handleDownloadBastPdf(order.id, order.po_number, order.order_no)
                      }
                    ]}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Nomor PO &amp; Order</TableCell>
              <TableCell isHeader>Perusahaan Klien</TableCell>
              <TableCell isHeader>Jenis Layanan</TableCell>
              <TableCell isHeader>Progres Unit Alat</TableCell>
              <TableCell isHeader>Ahli K3 Ditugaskan</TableCell>
              <TableCell isHeader>Status PO</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const prog = order.unitProgress || {};
              const hasAssignments = Array.isArray(order.assignments) && order.assignments.length > 0;
              const isCompleted = order.status === 'SELESAI';
              return (
                <TableRow
                  key={order.id}
                  isClickable
                  onClick={() => openOrderDetail(order.id)}
                >
                  <TableCell className="font-mono font-bold text-xs">
                    <div className="text-[#C81E1E] dark:text-red-400">{order.po_number || order.order_no}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Order: {order.order_no}</div>
                    <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                      Tgl PO: {formatDate(order.po_date || order.requested_date)}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                    {order.client_name}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                    <div>{SERVICE_TYPE_LABELS[order.service_type] || order.service_type}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Sumber: {order.source}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between gap-2 font-bold text-slate-900 dark:text-white">
                      <span>{prog.completed || 0} / {prog.totalUnits || order.object_count || 0} Unit Selesai</span>
                      <span className="text-[11px] font-mono text-slate-500 font-normal">
                        {(prog.totalUnits || order.object_count) > 0
                          ? Math.round(
                              ((prog.completed || 0) / (prog.totalUnits || order.object_count)) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden my-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          (prog.totalUnits || order.object_count) > 0 &&
                          (prog.completed || 0) === (prog.totalUnits || order.object_count)
                            ? 'bg-emerald-500'
                            : 'bg-[#C81E1E]'
                        }`}
                        style={{
                          width: `${
                            (prog.totalUnits || order.object_count) > 0
                              ? Math.round(
                                  ((prog.completed || 0) / (prog.totalUnits || order.object_count)) * 100
                                )
                              : 0
                          }%`
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {order.start_at ? formatDateTime(order.start_at) : 'Belum dijadwalkan'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
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
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5 justify-end whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={() => openOrderDetail(order.id)}
                      >
                        {detailLabel}
                      </Button>
                      {((!isMarketing && hasAssignments) || (isCompleted && handleDownloadBastPdf)) && (
                        <ActionMenu
                          label="Dokumen PO"
                          items={[
                            !isMarketing && hasAssignments && {
                              label: 'Surat Tugas (PDF)',
                              icon: DownloadSimple,
                              onClick: () => handleDownloadAssignmentPdf(order.id, order.order_no)
                            },
                            isCompleted && handleDownloadBastPdf && {
                              label: 'BAST (PDF)',
                              icon: DownloadSimple,
                              onClick: () => handleDownloadBastPdf(order.id, order.po_number, order.order_no)
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

      <PaginationBar page={page} limit={limit} total={total} onPageChange={onPageChange} />
    </div>
  );
}
