import { Link } from 'react-router';
import {
  CheckCircle,
  ClipboardText,
  Eye,
  Play,
  XCircle
} from '@phosphor-icons/react';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { TableWrapper, TableHead, TableBody, TableRow, TableCell } from '../../../components/ui/TableWrapper.jsx';
import { formatDateTime, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function InspectorUnitTable({
  units,
  onRespondAssignment,
  onOpenRejectModal,
  onOpenInspection
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
        {units.map((u) => (
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
                <span className="font-semibold text-slate-700 dark:text-slate-300">{u.category_code}</span> ·
                SN: <span className="font-mono font-semibold">{u.serial_number}</span>{' '}
                {u.capacity ? `· ${u.capacity}` : ''}
              </div>
            </TableCell>
            <TableCell>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {u.start_at ? formatDateTime(u.start_at) : 'Belum dijadwalkan'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {SERVICE_TYPE_LABELS[u.service_type] || u.service_type}
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
              {u.assignment_status === 'MENUNGGU' ? (
                <div className="inline-flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onRespondAssignment(u.order_id, u.assignment_id, 'DITERIMA')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    <CheckCircle size={14} weight="bold" />
                    <span>Terima</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenRejectModal({ orderId: u.order_id, assignmentId: u.assignment_id, poNo: u.po_number || u.order_no, isCancel: false })}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <XCircle size={14} weight="bold" />
                    <span>Tolak</span>
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenInspection ? onOpenInspection(u) : null}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                      [
                        'LHPP_FINAL',
                        'LHPP_TERBIT',
                        'BAP_FINAL',
                        'SIAP_DISTRIBUSI',
                        'SELESAI'
                      ].includes(u.unit_status) || u.inspection_status === 'TERKIRIM'
                        ? 'border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                        : ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status) || u.inspection_id
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-[#C81E1E] hover:bg-[#a61717] text-white'
                    }`}
                  >
                    {[
                      'LHPP_FINAL',
                      'LHPP_TERBIT',
                      'BAP_FINAL',
                      'SIAP_DISTRIBUSI',
                      'SELESAI'
                    ].includes(u.unit_status) || u.inspection_status === 'TERKIRIM' ? (
                      <>
                        <Eye size={14} weight="bold" />
                        <span>Lihat Hasil</span>
                      </>
                    ) : ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status) || u.inspection_id ? (
                      <>
                        <ClipboardText size={14} weight="bold" />
                        <span>Lanjutkan Pemeriksaan</span>
                      </>
                    ) : (
                      <>
                        <Play size={13} weight="fill" />
                        <span>Mulai Pemeriksaan</span>
                      </>
                    )}
                  </button>
                  {!u.inspection_id && (
                    <button
                      type="button"
                      title="Batalkan penerimaan penugasan ini"
                      onClick={() => onOpenRejectModal({ orderId: u.order_id, assignmentId: u.assignment_id, poNo: u.po_number || u.order_no, isCancel: true })}
                      className="px-2 py-1.5 rounded text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                  )}
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableWrapper>
  );
}

