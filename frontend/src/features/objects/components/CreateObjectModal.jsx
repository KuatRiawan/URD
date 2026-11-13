import { useState, useEffect, useMemo } from 'react';
import { Cube, FolderPlus, Info, ShieldCheck, Tag, WarningCircle } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { api } from '../../../lib/api/axios.js';

export function CreateObjectModal({
  open,
  onClose,
  handleSaveObject,
  formData,
  setFormData,
  formErr,
  saving,
  clients,
  selectedCatMeta
}) {
  const [domains, setDomains] = useState([]);
  const [equipmentGroups, setEquipmentGroups] = useState([]);
  const [allEquipmentTypes, setAllEquipmentTypes] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState([]);
  const [selectedDomainCode, setSelectedDomainCode] = useState('');

  // Fetch dynamic master data on open
  useEffect(() => {
    if (!open) return;
    let isMounted = true;

    Promise.all([
      api.get('/equipment-types/domains'),
      api.get('/equipment-types/groups?active=true'),
      api.get('/equipment-types?active=true'),
      api.get('/equipment-types/inspection-types')
    ])
      .then(([domRes, grpRes, eqRes, inspRes]) => {
        if (!isMounted) return;
        if (domRes.data?.domains) setDomains(domRes.data.domains);
        if (grpRes.data?.items) setEquipmentGroups(grpRes.data.items);
        if (eqRes.data?.items) setAllEquipmentTypes(eqRes.data.items);
        if (inspRes.data?.inspectionTypes) setInspectionTypes(inspRes.data.inspectionTypes);

        // Inisialisasi domain dari categoryId bila belum terpilih
        if (!selectedDomainCode && domRes.data?.domains?.length > 0) {
          const matchedDom = domRes.data.domains.find(
            (d) => Number(d.legacy_category_id) === Number(formData.categoryId)
          );
          setSelectedDomainCode(matchedDom ? matchedDom.code : domRes.data.domains[0].code);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [open]);

  // Filter jenis alat (equipment groups) berdasarkan domain terpilih
  const availableGroups = useMemo(() => {
    if (!selectedDomainCode) return [];
    return equipmentGroups.filter((g) => g.domain_code === selectedDomainCode);
  }, [equipmentGroups, selectedDomainCode]);

  // Filter nama alat (equipment names) berdasarkan domain & jenis alat terpilih
  const availableNames = useMemo(() => {
    if (!selectedDomainCode) return [];
    return allEquipmentTypes.filter((t) => {
      if (t.domain_code !== selectedDomainCode) return false;
      if (formData.equipmentGroupId) {
        return t.group_id === formData.equipmentGroupId;
      }
      return true;
    });
  }, [allEquipmentTypes, selectedDomainCode, formData.equipmentGroupId]);

  // Ambil metadata nama alat yang aktif terpilih
  const currentUnitMeta = useMemo(() => {
    const targetId = formData.equipmentNameId || formData.equipmentTypeId;
    if (targetId) {
      return allEquipmentTypes.find((t) => t.id === targetId);
    }
    return null;
  }, [allEquipmentTypes, formData.equipmentNameId, formData.equipmentTypeId]);

  // Atribut spesifikasi teknis dinamis
  const activeAttributeSchema = useMemo(() => {
    if (currentUnitMeta && Array.isArray(currentUnitMeta.attribute_schema) && currentUnitMeta.attribute_schema.length > 0) {
      return currentUnitMeta.attribute_schema;
    }
    if (selectedCatMeta && Array.isArray(selectedCatMeta.attribute_schema)) {
      return selectedCatMeta.attribute_schema;
    }
    return [];
  }, [currentUnitMeta, selectedCatMeta]);

  // Handler pergantian domain
  const handleDomainChange = (domainCode) => {
    setSelectedDomainCode(domainCode);
    const matchedDom = domains.find((d) => d.code === domainCode);
    const newCatId = matchedDom?.legacy_category_id || formData.categoryId;

    setFormData((prev) => ({
      ...prev,
      categoryId: newCatId,
      equipmentGroupId: '',
      equipmentTypeId: '',
      equipmentNameId: '',
      equipmentSubtypeId: '',
      attributes: {}
    }));
  };

  // Handler pergantian jenis alat (Equipment Type / Group)
  const handleGroupChange = (groupId) => {
    setFormData((prev) => ({
      ...prev,
      equipmentGroupId: groupId,
      equipmentTypeId: '',
      equipmentNameId: '',
      equipmentSubtypeId: '',
      attributes: {}
    }));
  };

  // Handler pergantian nama alat (Equipment Name)
  const handleNameChange = (nameId) => {
    const selectedItem = allEquipmentTypes.find((t) => t.id === nameId);
    setFormData((prev) => ({
      ...prev,
      equipmentGroupId: prev.equipmentGroupId || selectedItem?.group_id || '',
      equipmentTypeId: nameId,
      equipmentNameId: nameId,
      equipmentSubtypeId: '',
      // Berikan nama unit default jika belum diisi
      name: prev.name.trim() ? prev.name : (selectedItem ? selectedItem.name : prev.name),
      attributes: {}
    }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Objek Uji K3 Baru"
      subtitle="Pendaftaran identitas unit alat ke katalog riksa uji keselamatan dan kesehatan kerja."
      size="lg"
    >
      <form onSubmit={handleSaveObject} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {formErr && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-400 font-medium">
            <WarningCircle size={15} className="shrink-0 text-[#C81E1E]" weight="bold" />
            <span>{formErr}</span>
          </div>
        )}

        {/* 1. Baris Klien & Bidang Riksa Uji */}
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
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer"
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
            <label htmlFor="obj-domain" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Bidang Riksa Uji K3 *
            </label>
            <select
              id="obj-domain"
              required
              value={selectedDomainCode}
              onChange={(e) => handleDomainChange(e.target.value)}
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
            >
              {domains.map((dom) => (
                <option key={dom.code} value={dom.code}>
                  [{dom.code}] {dom.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Baris Klasifikasi 3-Level: Bidang Riksa Uji -> Jenis Alat -> Nama Alat */}
        <div className="space-y-3 p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/60 dark:bg-white/[0.03]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="obj-equipment-group" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FolderPlus size={14} className="text-[#C81E1E]" />
                <span>Jenis Alat (Equipment Type) *</span>
              </label>
              <select
                id="obj-equipment-group"
                required
                value={formData.equipmentGroupId || ''}
                onChange={(e) => handleGroupChange(e.target.value)}
                className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
              >
                <option value="">-- Pilih Jenis Alat --</option>
                {availableGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.total_types_count || g.total_names_count || 0} nama alat)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="obj-equipment-name" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Cube size={14} className="text-[#C81E1E]" />
                <span>Nama Alat (Equipment Name) *</span>
              </label>
              <select
                id="obj-equipment-name"
                required
                value={formData.equipmentNameId || formData.equipmentTypeId || ''}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={!formData.equipmentGroupId && availableGroups.length > 0}
                className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium disabled:opacity-50"
              >
                <option value="">
                  {!formData.equipmentGroupId && availableGroups.length > 0
                    ? '-- Pilih Jenis Alat Terlebih Dahulu --'
                    : '-- Pilih Nama Alat --'}
                </option>
                {availableNames.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#6E6E73] dark:text-[#98989D] pt-1">
            <span>
              {availableNames.length} nama alat terdaftar pada jenis alat ini.
            </span>
            <span className="font-semibold text-[#1D1D1F] dark:text-[#E5E5EA]">
              Klasifikasi Resmi URD (3 Level)
            </span>
          </div>
        </div>

        {/* 3. Baris Nama Unit & Nomor Seri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="obj-name" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Nama Objek / Tag Unit Alat *
            </label>
            <input
              id="obj-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Overhead Crane 10 Ton Bay 3"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
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
              placeholder="Contoh: SN-CR-2024-001"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 4. Baris Merek, Model & Tahun */}
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
              placeholder="Contoh: Demag / Toyota"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
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
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
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
              placeholder="2023"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        {/* 5. Baris Kapasitas, Lokasi & Jenis Pemeriksaan */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label htmlFor="obj-cap" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Kapasitas / Beban Nominal
            </label>
            <input
              id="obj-cap"
              type="text"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="Contoh: 10 Ton / 1250 kVA"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
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
              placeholder="Contoh: Workshop Fabrikasi A"
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label htmlFor="obj-inspection-type" className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
              Jenis Pemeriksaan K3
            </label>
            <select
              id="obj-inspection-type"
              value={formData.inspectionTypeCode || 'BERKALA'}
              onChange={(e) => setFormData({ ...formData, inspectionTypeCode: e.target.value })}
              className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer font-medium"
            >
              {inspectionTypes.length > 0 ? (
                inspectionTypes.map((it) => (
                  <option key={it.code} value={it.code}>
                    {it.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="PERTAMA">Pemeriksaan Pertama</option>
                  <option value="BERKALA">Pemeriksaan Berkala</option>
                  <option value="KHUSUS">Pemeriksaan Khusus</option>
                  <option value="ULANG">Pemeriksaan Ulang</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 6. Spesifikasi Teknis Tambahan (Nameplate Dinamis) */}
        {activeAttributeSchema.length > 0 && (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/60 dark:bg-white/[0.03] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <Tag size={14} className="text-[#C81E1E]" />
                <span>Spesifikasi Nameplate {currentUnitMeta?.name || selectedDomainCode}</span>
              </p>
              <span className="text-[11px] font-semibold text-slate-500">
                Sesuai Standar LHPP Resmi
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeAttributeSchema.map((attr) => (
                <div key={attr.key}>
                  <label htmlFor={`attr-${attr.key}`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {attr.label} {attr.unit ? `(${attr.unit})` : ''} {attr.required ? '*' : ''}
                  </label>
                  <input
                    id={`attr-${attr.key}`}
                    type="text"
                    required={Boolean(attr.required)}
                    placeholder={`Isi ${attr.label.toLowerCase()}...`}
                    value={formData.attributes[attr.key] || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        attributes: { ...formData.attributes, [attr.key]: e.target.value }
                      })
                    }
                    className="w-full min-h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Tombol Aksi */}
        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
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
            loading={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Objek Uji'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
