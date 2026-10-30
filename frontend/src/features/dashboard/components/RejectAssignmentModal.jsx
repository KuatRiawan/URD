import { Modal } from '../../../components/ui/Modal.jsx';

export function RejectAssignmentModal({
  rejectModalData,
  onClose,
  rejectReason,
  setRejectReason,
  actionLoading,
  onConfirm
}) {
  return (
    <Modal
      open={Boolean(rejectModalData)}
      onClose={onClose}
      title={rejectModalData?.isCancel ? 'Batalkan Penerimaan Penugasan' : 'Tolak Penugasan Riksa Uji'}
      size="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-600 dark:text-slate-300">
          {rejectModalData?.isCancel
            ? `Apakah Anda yakin ingin membatalkan penerimaan penugasan untuk PO/Order ${rejectModalData?.poNo}? Unit akan dikembalikan ke status Terjadwal agar dapat ditugaskan kembali.`
            : `Mohon tuliskan alasan penolakan penugasan PO/Order ${rejectModalData?.poNo} (misal: jadwal bentrok atau berhalangan).`}
        </p>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
            Alasan {rejectModalData?.isCancel ? 'Pembatalan' : 'Penolakan'} *
          </label>
          <textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tuliskan alasan jelas..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={actionLoading}
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="button"
            disabled={actionLoading || !rejectReason.trim()}
            onClick={() =>
              onConfirm(
                rejectModalData.orderId,
                rejectModalData.assignmentId,
                'DITOLAK',
                rejectModalData.isCancel
                  ? `Dibatalkan oleh inspector: ${rejectReason.trim()}`
                  : rejectReason.trim()
              )
            }
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {actionLoading ? 'Memproses...' : rejectModalData?.isCancel ? 'Konfirmasi Batal' : 'Tolak Penugasan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

