import { Modal } from '../../../components/ui/Modal.jsx';
import { SUKET_STATUS_LABELS } from '../../../lib/utils/format.js';

export function CreateSuketModal({
  open,
  onClose,
  handleCreateSuket,
  createForm,
  setCreateForm,
  objects,
  lhppList,
  submitting
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daftarkan Pengajuan / Penerbitan Suket K3"
      size="lg"
    >
      <form onSubmit={handleCreateSuket} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Objek Uji K3 *
            </label>
            <select
              required
              value={createForm.objectId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, objectId: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="">Pilih Objek Uji...</option>
              {objects.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.client_name} · SN: {o.serial_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Referensi Dokumen LHPP
            </label>
            <select
              value={createForm.lhppId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, lhppId: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="">Tanpa tautan LHPP...</option>
              {lhppList.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lhpp_no} ({l.object_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Nomor Suket K3 Disnaker
            </label>
            <input
              type="text"
              value={createForm.suketNo}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, suketNo: e.target.value }))}
              placeholder="Contoh: 560/1184/DISNAKER-K3/2026"
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Status Pengajuan *
            </label>
            <select
              value={createForm.status}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              {Object.entries(SUKET_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Tanggal Terbit
            </label>
            <input
              type="date"
              value={createForm.issuedDate}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, issuedDate: e.target.value }))
              }
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Masa Berlaku Sampai
            </label>
            <input
              type="date"
              value={createForm.validUntil}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, validUntil: e.target.value }))
              }
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Instansi Penerbit
          </label>
          <input
            type="text"
            value={createForm.issuer}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, issuer: e.target.value }))}
            className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
          />
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
            className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Suket K3'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
