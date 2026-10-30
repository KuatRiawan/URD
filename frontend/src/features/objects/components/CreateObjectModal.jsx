import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';

export function CreateObjectModal({
  open,
  onClose,
  handleSaveObject,
  formData,
  setFormData,
  formErr,
  saving,
  clients,
  categories,
  selectedCatMeta
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Objek Uji K3 Baru"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSaveObject} className="space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
        {formErr && <Notice tone="error">{formErr}</Notice>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="obj-client" className="block font-bold mb-1">
              Perusahaan Klien *
            </label>
            <select
              id="obj-client"
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
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
            <label htmlFor="obj-cat" className="block font-bold mb-1">
              Kategori Objek K3 *
            </label>
            <select
              id="obj-cat"
              required
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: Number(e.target.value), attributes: {} })
              }
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  [{cat.code}] {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="obj-name" className="block font-bold mb-1">
              Nama Alat / Objek Uji *
            </label>
            <input
              id="obj-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Overhead Travelling Crane 10 Ton"
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-sn" className="block font-bold mb-1">
              Nomor Seri (Unik per Klien) *
            </label>
            <input
              id="obj-sn"
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="obj-brand" className="block font-bold mb-1">
              Merek / Pabrikan
            </label>
            <input
              id="obj-brand"
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-model" className="block font-bold mb-1">
              Tipe / Model
            </label>
            <input
              id="obj-model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-year" className="block font-bold mb-1">
              Tahun Pembuatan
            </label>
            <input
              id="obj-year"
              type="number"
              min="1950"
              max="2100"
              value={formData.manufactureYear}
              onChange={(e) => setFormData({ ...formData, manufactureYear: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="obj-cap" className="block font-bold mb-1">
              Kapasitas
            </label>
            <input
              id="obj-cap"
              type="text"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Contoh: 10 Ton / 1250 kVA"
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-loc" className="block font-bold mb-1">
              Lokasi Pemasangan
            </label>
            <input
              id="obj-loc"
              type="text"
              value={formData.installLocation}
              onChange={(e) => setFormData({ ...formData, installLocation: e.target.value })}
              placeholder="Contoh: Hall Produksi Bay B"
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-prev" className="block font-bold mb-1">
              No. Suket Sebelumnya
            </label>
            <input
              id="obj-prev"
              type="text"
              value={formData.previousPermitNo}
              onChange={(e) => setFormData({ ...formData, previousPermitNo: e.target.value })}
              className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Atribut khusus per jenis objek */}
        {selectedCatMeta?.attribute_schema?.length > 0 && (
          <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white">
              Atribut Teknis Khusus ({selectedCatMeta.name})
            </p>
            {selectedCatMeta.attribute_schema.map((attr) => (
              <div key={attr.key}>
                <label htmlFor={`attr-${attr.key}`} className="block font-semibold mb-1">
                  {attr.label} ({attr.unit})
                </label>
                <input
                  id={`attr-${attr.key}`}
                  type="text"
                  value={formData.attributes[attr.key] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributes: { ...formData.attributes, [attr.key]: e.target.value }
                    })
                  }
                  className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                />
              </div>
            ))}
          </div>
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
            {saving ? 'Menyimpan...' : 'Simpan Objek Uji'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
