import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function CsvImportModal({
  open,
  onClose,
  csvTargetOrderId,
  csvText,
  setCsvText,
  handleImportCsv,
  submitting
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={csvTargetOrderId ? 'Impor Tambahan Unit via CSV ke PO' : 'Impor CSV Unit ke Form PO'}
      size="lg"
    >
      <form onSubmit={handleImportCsv} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        <div>
          <label htmlFor="csv-order-text" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Format CSV: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-mono text-[11px]">KODE_KATEGORI,NAMA_UNIT,MEREK,MODEL,NOMOR_SERI,TAHUN,KAPASITAS,LOKASI_PASANG,CATATAN</code>
          </label>
          <textarea
            id="csv-order-text"
            rows={8}
            required
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 leading-relaxed text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={submitting}
            loading={submitting}
          >
            Impor Data CSV
          </Button>
        </div>
      </form>
    </Modal>
  );
}
