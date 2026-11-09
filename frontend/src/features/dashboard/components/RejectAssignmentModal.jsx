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
  return (
    <Modal
      open={Boolean(rejectModalData)}
      onClose={onClose}
      title={rejectModalData?.isCancel ? 'Batalkan Penerimaan Penugasan' : 'Tolak Penugasan Riksa Uji'}
      size="sm"
    >
      <div className="space-y-4 text-xs">
        <p className="text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
          {rejectModalData?.isCancel
            ? `Apakah Anda yakin ingin membatalkan penerimaan penugasan untuk PO/Order ${rejectModalData?.poNo}? Unit akan dikembalikan ke status Terjadwal agar dapat ditugaskan kembali.`
            : `Mohon tuliskan alasan penolakan penugasan PO/Order ${rejectModalData?.poNo} (misal: jadwal bentrok atau berhalangan).`}
        </p>
        <div>
          <label className="block text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold mb-1.5">
            Alasan {rejectModalData?.isCancel ? 'Pembatalan' : 'Penolakan'} *
          </label>
          <textarea
            rows={3}
            required
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Tuliskan alasan jelas..."
            className="w-full rounded-[10px] border border-black/[0.12] dark:border-white/[0.12] bg-white dark:bg-[#1C1F2B] p-2.5 text-xs text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E]"
          />
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={actionLoading}
            onClick={onClose}
          >
            Kembali
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
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
          >
            {actionLoading ? 'Memproses...' : rejectModalData?.isCancel ? 'Konfirmasi Batal' : 'Tolak Penugasan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
