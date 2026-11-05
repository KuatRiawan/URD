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
      subtitle="Pendaftaran identitas unit alat untuk riksa uji keselamatan dan kesehatan kerja."
      size="lg"
    >
      <form onSubmit={handleSaveObject} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {formErr && <Notice tone="error">{formErr}</Notice>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="obj-client" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Perusahaan Klien *
            </label>
            <select
              id="obj-client"
              required
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="">-- Pilih Perusahaan Klien --</option>
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="obj-cat" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Bidang / Kategori Objek K3 *
            </label>
            <select
              id="obj-cat"
              required
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: Number(e.target.value), attributes: {} })
              }
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  [{cat.code}] {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="obj-name" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Nama Objek / Unit Alat *
            </label>
            <input
              id="obj-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Overhead Travelling Crane 10 Ton"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-sn" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Nomor Seri / Tag Pabrik *
            </label>
            <input
              id="obj-sn"
              type="text"
              required
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="Contoh: CR-2024-001"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label htmlFor="obj-brand" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Merek / Pabrikan
            </label>
            <input
              id="obj-brand"
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Contoh: Demag / Mitsubishi"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-model" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Tipe / Model
            </label>
            <input
              id="obj-model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Contoh: ZKKE-5T"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-year" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Tahun Pembuatan
            </label>
            <input
              id="obj-year"
              type="number"
              min="1950"
              max="2100"
              value={formData.manufactureYear}
              onChange={(e) => setFormData({ ...formData, manufactureYear: e.target.value })}
              placeholder="2022"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label htmlFor="obj-cap" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Kapasitas / Beban SWL
            </label>
            <input
              id="obj-cap"
              type="text"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Contoh: 10 Ton / 1250 kVA"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-loc" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Lokasi Pemasangan / Site
            </label>
            <input
              id="obj-loc"
              type="text"
              value={formData.installLocation}
              onChange={(e) => setFormData({ ...formData, installLocation: e.target.value })}
              placeholder="Contoh: Workshop Bay 2"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-prev" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              No. Suket Sebelumnya
            </label>
            <input
              id="obj-prev"
              type="text"
              value={formData.previousPermitNo}
              onChange={(e) => setFormData({ ...formData, previousPermitNo: e.target.value })}
              placeholder="566/123/DISNAKER/2023"
              className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Atribut khusus per jenis objek (Standar LHPP K3) */}
        {selectedCatMeta?.attribute_schema?.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Spesifikasi Teknis Tambahan ({selectedCatMeta.name})
              </p>
              <span className="text-[11px] font-semibold text-slate-500">
                Sesuai Template LHPP K3
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedCatMeta.attribute_schema.map((attr) => (
                <div key={attr.key}>
                  <label htmlFor={`attr-${attr.key}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {attr.label} {attr.unit ? `(${attr.unit})` : ''}
                  </label>
                  <input
                    id={`attr-${attr.key}`}
                    type="text"
                    placeholder={attr.placeholder || `Isi ${attr.label.toLowerCase()}...`}
                    value={formData.attributes[attr.key] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [attr.key]: e.target.value }
                      })
                    }
                    className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer shadow-2xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 rounded-lg bg-[#C81E1E] font-bold text-xs text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
          >
            {saving ? 'Menyimpan...' : 'Simpan Objek Uji'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
