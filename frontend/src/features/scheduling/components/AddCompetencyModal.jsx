import { Modal } from '../../../components/ui/Modal.jsx';

export function AddCompetencyModal({
  open,
  onClose,
  selectedInspector,
  compForm,
  setCompForm,
  categories,
  submitting,
  onSubmit
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        selectedInspector
          ? `Tambah SKP Ahli K3: ${selectedInspector.fullName}`
          : 'Tambah SKP Ahli K3'
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Bidang Kompetensi K3 *
          </label>
          <select
            required
            value={compForm.categoryId}
            onChange={(e) => setCompForm((prev) => ({ ...prev, categoryId: e.target.value }))}
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
          >
            <option value="">Pilih Bidang...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} ({cat.name})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Nomor SKP / Lisensi Kemnaker *
          </label>
          <input
            type="text"
            required
            value={compForm.certificateNo}
            onChange={(e) => setCompForm((prev) => ({ ...prev, certificateNo: e.target.value }))}
            placeholder="Contoh: KEP.412/NAKER-BINWASK3/2026"
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Tanggal Terbit
            </label>
            <input
              type="date"
              value={compForm.validFrom}
              onChange={(e) => setCompForm((prev) => ({ ...prev, validFrom: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Berlaku Sampai *
            </label>
            <input
              type="date"
              required
              value={compForm.validUntil}
              onChange={(e) => setCompForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Menyimpan...' : 'Simpan SKP'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

