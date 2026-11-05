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
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-xs transition-colors"
          >
            Tutup
          </button>
          <button
            type="submit"
            className="h-10 px-4.5 rounded-lg bg-[#C81E1E] font-bold text-white hover:bg-[#a11616] cursor-pointer text-xs transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
          >
            Validasi &amp; Impor Baris
          </button>
        </div>
      </form>
    </Modal>
  );
}
