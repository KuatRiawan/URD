import { Modal } from '../../../components/ui/Modal.jsx';

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
      <form onSubmit={handleCsvImport} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
        {csvFeedback && (
          <div className="rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 font-semibold text-slate-900 dark:text-slate-100">
            {csvFeedback}
          </div>
        )}
        <div>
          <label htmlFor="csv-client" className="block font-bold mb-1">
            Pilih Perusahaan Klien *
          </label>
          <select
            id="csv-client"
            required
            value={csvClientId}
            onChange={(e) => setCsvClientId(e.target.value)}
            className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
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
          <label htmlFor="csv-content" className="block font-bold mb-1">
            Data CSV (Header: kategori,nama,merek,tipe,nomor_seri,tahun,kapasitas,lokasi)
          </label>
          <textarea
            id="csv-content"
            rows={6}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 font-mono text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="submit"
            className="min-h-11 px-4 py-2 rounded bg-[#C81E1E] font-bold text-white hover:bg-[#991B1B] cursor-pointer"
          >
            Validasi &amp; Impor Baris
          </button>
        </div>
      </form>
    </Modal>
  );
}
