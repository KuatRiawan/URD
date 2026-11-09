import { WarningCircle } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

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
  const isNameConflict = formErr?.toLowerCase().includes('nama') || formErr?.toLowerCase().includes('klien dengan nama');
  const isNpwpConflict = formErr?.toLowerCase().includes('npwp');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? `Ubah Data Klien: ${editing.name}` : 'Tambah Perusahaan Klien Baru'}
      size="md"
    >
      <form onSubmit={onSave} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {formErr && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-medium">
            <WarningCircle size={15} className="shrink-0 text-[#C81E1E]" weight="bold" />
            <span>{formErr}</span>
          </div>
        )}

        <div>
          <label htmlFor="client-name" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
            Nama Resmi Perusahaan Klien *
          </label>
          <input
            id="client-name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Contoh: PT Sumber Makmur Sentosa"
            className={`w-full min-h-10 rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 ${
              isNameConflict
                ? 'border-red-500 focus:ring-red-400 focus:border-red-500'
                : 'border-slate-300 dark:border-slate-700'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="client-npwp" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Nomor NPWP
            </label>
            <input
              id="client-npwp"
              type="text"
              value={formData.npwp}
              onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
              placeholder="01.234.567.8-901.000"
              className={`w-full min-h-10 rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 ${
                isNpwpConflict
                  ? 'border-red-500 focus:ring-red-400 focus:border-red-500'
                  : 'border-slate-300 dark:border-slate-700'
              }`}
            />
          </div>
          <div>
            <label htmlFor="client-industry" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Bidang Industri
            </label>
            <input
              id="client-industry"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Contoh: Manufaktur / Otomotif"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="client-address" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
            Alamat Kantor Utama
          </label>
          <textarea
            id="client-address"
            rows={2}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Jl. Raya Industri Blok A No. 1, Kawasan Industri..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="client-email" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Email Resmi Kantor
            </label>
            <input
              id="client-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@perusahaan.co.id"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="client-phone" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Telepon Kantor
            </label>
            <input
              id="client-phone"
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="(021) 8901234"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="client-internal-notes" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
            Catatan Khusus Internal Marketing
          </label>
          <textarea
            id="client-internal-notes"
            rows={2}
            value={formData.internalNotes || ''}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            placeholder="Preferensi penagihan, siklus audit K3 tahunan klien, kontak khusus..."
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 leading-relaxed"
          />
        </div>

        {editing && (
          <label className="flex items-center gap-2 font-semibold pt-1 text-slate-800 dark:text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
            />
            <span>Status Klien Aktif</span>
          </label>
        )}

        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end gap-2.5">
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
            disabled={saving}
            loading={saving}
          >
            {editing ? 'Simpan Perubahan' : 'Tambah Klien'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
