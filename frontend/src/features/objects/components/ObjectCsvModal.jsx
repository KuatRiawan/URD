import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function ObjectCsvModal({
  open,
  onClose,
  handleCsvImport,
  csvClientId,
  setCsvClientId,
  csvText,
  setCsvText,
  csvFeedback,
  clients
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Impor Data Objek Uji Massal (CSV)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleCsvImport} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {csvFeedback && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 font-semibold text-slate-900 dark:text-slate-100">
            {csvFeedback}
          </div>
        )}
        <div>
          <label htmlFor="csv-client" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Pilih Perusahaan Klien *
          </label>
          <select
            id="csv-client"
            required
            value={csvClientId}
            onChange={(e) => setCsvClientId(e.target.value)}
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="">-- Pilih Klien --</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="csv-content" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Data CSV (Header: kategori,nama,merek,tipe,nomor_seri,tahun,kapasitas,lokasi)
          </label>
          <textarea
            id="csv-content"
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>
        <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
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
          >
            Validasi &amp; Impor Baris
          </Button>
        </div>
      </form>
    </Modal>
  );
}
