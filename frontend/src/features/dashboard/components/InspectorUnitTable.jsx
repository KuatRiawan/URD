import {
  CheckCircle,
  Eye,
  Info,
  Play,
  XCircle
} from '@phosphor-icons/react';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { TableWrapper, TableHead, TableBody, TableRow, TableCell } from '../../../components/ui/TableWrapper.jsx';
import { formatDateTime, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function InspectorUnitTable({
  units,
  onRespondAssignment,
  onOpenRejectModal,
  onOpenInspection,
  onOpenDetailModal
}) {
  return (
    <TableWrapper containerClassName="border-0 shadow-none rounded-none">
      <TableHead>
        <tr>
          <TableCell isHeader>Nomor PO &amp; Klien</TableCell>
          <TableCell isHeader>Unit Alat &amp; Spesifikasi</TableCell>
          <TableCell isHeader>Jadwal &amp; Layanan</TableCell>
          <TableCell isHeader>Status &amp; Dokumen</TableCell>
          <TableCell isHeader className="text-right">Aksi Pelaksanaan</TableCell>
        </tr>
      </TableHead>
      <TableBody>
        {units.map((u) => {
          const isCompleted = [
            'LHPP_FINAL',
            'LHPP_TERBIT',
            'BAP_FINAL',
            'SIAP_DISTRIBUSI',
            'SELESAI'
          ].includes(u.unit_status) || u.inspection_status === 'TERKIRIM';
          const isInProgress = ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status) || u.inspection_id;

          return (
            <TableRow key={`${u.order_id}-${u.object_id}`}>
              <TableCell>
                <div className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
                  {u.po_number || u.order_no}
                </div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{u.client_name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">
                  {u.location_name || u.install_location || u.client_address || '-'}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-bold text-slate-900 dark:text-slate-100">{u.object_name}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{u.category_code}</span> &bull;{' '}
                  SN: <span className="font-mono font-semibold">{u.serial_number || '-'}</span>{' '}
                  {u.capacity ? `&bull; ${u.capacity}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-semibold text-slate-900 dark:text-slate-100">
                  {u.start_at ? formatDateTime(u.start_at) : 'Belum dijadwalkan'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {SERVICE_TYPE_LABELS[u.service_type] || u.service_type || 'Riksa Uji'}
                </div>
              </TableCell>
              <TableCell>
                {u.assignment_status === 'MENUNGGU' ? (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    Menunggu Konfirmasi
                  </span>
                ) : (
                  <>
                    <StatusBadge status={u.unit_status} />
                    {u.bap_no && (
                      <div className="mt-1 font-mono text-[11px] font-bold text-[#C81E1E] dark:text-rose-400">
                        BAP: {u.bap_no} ({u.bap_status})
                      </div>
                    )}
                    {u.lhpp_no && (
                      <div className="mt-0.5 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        LHPP: {u.lhpp_no} ({u.lhpp_status})
                      </div>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                  {onOpenDetailModal && (
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Info}
                      onClick={() => onOpenDetailModal(u)}
                      title="Lihat rincian tugas &amp; Surat Tugas"
                    >
                      Detail
                    </Button>
                  )}

                  {u.assignment_status === 'MENUNGGU' ? (
                    <>
                      <Button
                        variant="primary"
                        size="xs"
                        icon={CheckCircle}
                        onClick={() => onRespondAssignment(u.order_id, u.assignment_id, 'DITERIMA')}
                      >
                        Terima
                      </Button>
                      <Button
                        variant="destructive"
                        size="xs"
                        icon={XCircle}
                        onClick={() =>
                          onOpenRejectModal({
                            orderId: u.order_id,
                            assignmentId: u.assignment_id,
                            poNo: u.po_number || u.order_no,
                            isCancel: false
                          })
                        }
                      >
                        Tolak
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant={isCompleted ? 'outline' : 'primary'}
                      size="xs"
                      icon={isCompleted ? Eye : Play}
                      onClick={() => (onOpenInspection ? onOpenInspection(u) : null)}
                    >
                      {isCompleted ? 'Hasil' : isInProgress ? 'Lanjut' : 'Mulai'}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </TableWrapper>
  );
}
