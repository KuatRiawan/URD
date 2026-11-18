import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function RejectAssignmentModal({
  rejectModalData,
  onClose,
  rejectReason,
  setRejectReason,
  actionLoading,
  onConfirm
}) {
  const modalFooter = (
    <div className="flex items-center justify-end gap-2.5 w-full">
      <Button
        type="button"
        variant="secondary"
        size="md"
        disabled={actionLoading}
        onClick={onClose}
      >
        Kembali
      </Button>
      <Button
        type="button"
        variant="danger"
        size="md"
        disabled={actionLoading || !rejectReason.trim()}
        loading={actionLoading}
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
      >
        {rejectModalData?.isCancel ? 'Konfirmasi Batal' : 'Tolak Penugasan'}
      </Button>
    </div>
  );

  return (
    <Modal
      open={Boolean(rejectModalData)}
      onClose={onClose}
      title={rejectModalData?.isCancel ? 'Batalkan Penerimaan Penugasan' : 'Tolak Penugasan Riksa Uji'}
      size="sm"
      footer={modalFooter}
    >
      <div className="space-y-4 text-xs">
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
          {rejectModalData?.isCancel
            ? `Apakah Anda yakin ingin membatalkan penerimaan penugasan untuk PO/Order ${rejectModalData?.poNo}? Unit akan dikembalikan ke status Terjadwal agar dapat ditugaskan kembali.`
            : `Mohon tuliskan alasan penolakan penugasan PO/Order ${rejectModalData?.poNo} (misal: jadwal bentrok atau berhalangan).`}
        </p>
        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
            Alasan {rejectModalData?.isCancel ? 'Pembatalan' : 'Penolakan'} *
          </label>
          <textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tuliskan alasan jelas..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>
    </Modal>
  );
}
