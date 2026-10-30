import { Modal } from '../../../components/ui/Modal.jsx';
import {
  DISTRIBUTION_DOC_TYPE_LABELS,
  DISTRIBUTION_TARGET_LABELS
} from '../../../lib/utils/format.js';
import { DISPATCH_MEDIA_OPTIONS } from './DistributionTable.jsx';

export function UpdateDistributionModal({
  open,
  onClose,
  selectedItem,
  updateStatus,
  setUpdateStatus,
  dispatchMedia,
  setDispatchMedia,
  trackingNumber,
  setTrackingNumber,
  dispatchNotes,
  setDispatchNotes,
  submitting,
  onSubmit
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pembaruan Status Pengiriman Dokumen"
      size="md"
    >
      {selectedItem && (
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3.5 space-y-1.5 border border-slate-200 dark:border-slate-700">
            <p className="font-bold text-slate-900 dark:text-white">
              {DISTRIBUTION_DOC_TYPE_LABELS[selectedItem.document_type] || selectedItem.document_type}
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Penerima: <strong className="text-slate-800 dark:text-slate-200">{DISTRIBUTION_TARGET_LABELS[selectedItem.recipient_target]}</strong> ({selectedItem.client_name})
            </p>
            <p className="text-slate-500 dark:text-slate-400 font-mono">
              No. PO: {selectedItem.po_number || '-'} | Unit: {selectedItem.object_name} (SN: {selectedItem.serial_number})
            </p>
          </div>

          <div>
            <label htmlFor="dist-status" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Status Baru Pengiriman
            </label>
            <select
              id="dist-status"
              value={updateStatus}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
            >
              <option value="DIKIRIM">Dalam Pengiriman (DIKIRIM)</option>
              <option value="DITERIMA">Telah Diterima (DITERIMA)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dist-media" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Media / Saluran Pengiriman
            </label>
            <select
              id="dist-media"
              value={dispatchMedia}
              onChange={(e) => setDispatchMedia(e.target.value)}
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500"
            >
              {DISPATCH_MEDIA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dist-tracking" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nomor Resi / Bukti Ekspedisi / Kode AWB
            </label>
            <input
              id="dist-tracking"
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Contoh: JNE-0291823901 atau Surat Jalan No. 102"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 font-mono placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label htmlFor="dist-notes" className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Catatan Pengiriman (Opsional)
            </label>
            <textarea
              id="dist-notes"
              rows={3}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="Nama penerima paket, foto tanda terima, atau keterangan serah terima..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-10 rounded-lg bg-[#C81E1E] px-4 py-2 font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Status'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

