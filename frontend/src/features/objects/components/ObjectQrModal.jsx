import { Modal } from '../../../components/ui/Modal.jsx';

export function ObjectQrModal({ qrModal, onClose }) {
  if (!qrModal) return null;

  return (
    <Modal
      open={Boolean(qrModal)}
      onClose={onClose}
      title="Kode QR Identitas Objek K3"
      maxWidth="max-w-sm"
    >
      <div className="text-center space-y-3 text-xs text-slate-800 dark:text-slate-200">
        <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 dark:border-slate-700 mx-auto shadow-sm">
          <img
            src={qrModal.qrDataUrl}
            alt={`QR Code ${qrModal.object.name}`}
            width="200"
            height="200"
            className="mx-auto"
          />
        </div>
        <p className="font-bold text-sm text-slate-900 dark:text-white">{qrModal.object.name}</p>
        <p className="font-mono text-slate-500 dark:text-slate-400">S/N: {qrModal.object.serial_number}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Pindai menggunakan perangkat staf yang telah masuk untuk membuka riwayat pemeriksaan alat ini.
        </p>
      </div>
    </Modal>
  );
}
