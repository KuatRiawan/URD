import { Modal } from '../../../components/ui/Modal.jsx';

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
      <form onSubmit={handleImportCsv} className="space-y-4 text-slate-800 dark:text-slate-200">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Format CSV: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">KODE_KATEGORI,NAMA_UNIT,MEREK,MODEL,NOMOR_SERI,TAHUN,KAPASITAS,LOKASI_PASANG,CATATAN</code>
        </p>
        <textarea
          rows={8}
          required
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          className="w-full font-mono text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 leading-relaxed text-slate-900 dark:text-slate-100"
        />
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : 'Impor Data CSV'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
