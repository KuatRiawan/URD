import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';

export function ClientFormModal({
  open,
  onClose,
  editing,
  formData,
  setFormData,
  formErr,
  saving,
  onSave
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Ubah Data Klien: ${editing.name}` : 'Tambah Perusahaan Klien'}
    >
      <form onSubmit={onSave} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
        {formErr && <Notice tone="error">{formErr}</Notice>}
        <div>
          <label htmlFor="client-name" className="block font-bold mb-1">
            Nama Perusahaan Klien *
          </label>
          <input
            id="client-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="client-npwp" className="block font-bold mb-1">
              NPWP
            </label>
            <input
              id="client-npwp"
              type="text"
              value={formData.npwp}
              onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="client-industry" className="block font-bold mb-1">
              Bidang Usaha
            </label>
            <input
              id="client-industry"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div>
          <label htmlFor="client-address" className="block font-bold mb-1">
            Alamat Kantor Utama
          </label>
          <textarea
            id="client-address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="client-email" className="block font-bold mb-1">
              Email Perusahaan
            </label>
            <input
              id="client-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="client-phone" className="block font-bold mb-1">
              Telepon
            </label>
            <input
              id="client-phone"
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        {editing && (
          <label className="flex items-center gap-2 font-semibold pt-1">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span>Status Klien Aktif</span>
          </label>
        )}
        <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 px-4 py-2 rounded bg-[#C81E1E] font-bold text-white hover:bg-[#991B1B] cursor-pointer"
          >
            {saving ? 'Menyimpan...' : 'Simpan Data Klien'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
