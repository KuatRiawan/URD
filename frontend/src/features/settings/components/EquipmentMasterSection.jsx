import { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Cube,
  Gauge,
  PencilSimple,
  Plus,
  Trash,
  WarningCircle
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useConfirm } from '../../../components/ui/FeedbackProvider.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDate } from '../../../lib/utils/format.js';

export function EquipmentMasterSection({
  categories = [],
  calibrationTools = [],
  onRefreshData,
  onFeedback,
  onError
}) {
  const confirm = useConfirm();
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 1);
  const [localTools, setLocalTools] = useState(calibrationTools);

  // Modal Edit Kategori & Skema Atribut
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    scopesText: '',
    attributes: []
  });
  const [savingCat, setSavingCat] = useState(false);

  // Modal Tambah / Edit Alat Ukur & Kalibrasi
  const [toolModal, setToolModal] = useState(null); // { mode: 'ADD' | 'EDIT', originalCode? }
  const [toolForm, setToolForm] = useState({
    code: '',
    name: '',
    brand: '',
    serialNo: '',
    category: 'PUBT / PAA',
    certNo: '',
    calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
    calibratedAt: '',
    validUntil: ''
  });
  const [savingTool, setSavingTool] = useState(false);

  useEffect(() => {
    if (Array.isArray(calibrationTools) && calibrationTools.length > 0) {
      setLocalTools(calibrationTools);
    }
  }, [calibrationTools]);

  useEffect(() => {
    if (!calibrationTools || calibrationTools.length === 0) {
      api
        .get('/system-settings/calibration-tools')
        .then((res) => {
          if (res.data?.items) setLocalTools(res.data.items);
        })
        .catch(() => {});
    }
  }, [calibrationTools]);

  const currentCategory = categories.find((c) => c.id === Number(selectedCatId)) || categories[0];

  const openEditCategoryModal = (cat) => {
    setEditingCategory(cat);
    const scopes = Array.isArray(cat.default_bap_scopes) ? cat.default_bap_scopes : [];
    const attrs = Array.isArray(cat.attribute_schema) ? cat.attribute_schema : [];
    setCatForm({
      name: cat.name || '',
      scopesText: scopes.join('\n'),
      attributes: attrs.map((a) => ({
        key: a.key || '',
        label: a.label || '',
        required: Boolean(a.required)
      }))
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingCat(true);
    try {
      const scopes = catForm.scopesText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const validAttrs = catForm.attributes.filter((a) => a.key.trim() && a.label.trim());

      const res = await api.put(`/system-settings/categories/${editingCategory.id}`, {
        name: catForm.name.trim(),
        default_bap_scopes: scopes,
        attribute_schema: validAttrs
      });

      setEditingCategory(null);
      if (onFeedback) onFeedback(res.data?.message || 'Master bidang K3 berhasil diperbarui.');
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Gagal memperbarui master kategori K3.');
    } finally {
      setSavingCat(false);
    }
  };

  const openAddToolModal = () => {
    setToolModal({ mode: 'ADD' });
    setToolForm({
      code: '',
      name: '',
      brand: '',
      serialNo: '',
      category: 'PUBT / PAA',
      certNo: '',
      calibrationLab: 'Lab Kalibrasi KAN - PT Sucofindo',
      calibratedAt: new Date().toISOString().slice(0, 10),
      validUntil: ''
    });
  };

  const openEditToolModal = (tool) => {
    setToolModal({ mode: 'EDIT', originalCode: tool.code });
    setToolForm({
      code: tool.code || '',
      name: tool.name || '',
      brand: tool.brand || '',
      serialNo: tool.serialNo || '',
      category: tool.category || 'PUBT / PAA',
      certNo: tool.certNo || '',
      calibrationLab: tool.calibrationLab || '',
      calibratedAt: tool.calibratedAt ? String(tool.calibratedAt).slice(0, 10) : '',
      validUntil: tool.validUntil ? String(tool.validUntil).slice(0, 10) : ''
    });
  };

  const handleSaveTool = async (e) => {
    e.preventDefault();
    if (!toolModal) return;
    setSavingTool(true);
    try {
      if (toolModal.mode === 'EDIT' && toolModal.originalCode) {
        const res = await api.put(
          `/system-settings/calibration-tools/${encodeURIComponent(toolModal.originalCode)}`,
          toolForm
        );
        if (res.data?.items) setLocalTools(res.data.items);
        if (onFeedback) onFeedback(res.data?.message || 'Data kalibrasi alat ukur berhasil diperbarui.');
      } else {
        const res = await api.post('/system-settings/calibration-tools', toolForm);
        if (res.data?.items) setLocalTools(res.data.items);
        if (onFeedback) onFeedback(res.data?.message || 'Alat ukur baru berhasil ditambahkan.');
      }
      setToolModal(null);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Gagal menyimpan data kalibrasi alat ukur.');
    } finally {
      setSavingTool(false);
    }
  };

  const handleDeleteTool = async (tool) => {
    const ok = await confirm({
      title: 'Hapus Alat Ukur dari Registri Kalibrasi',
      message: `Hapus alat ukur "${tool.name}" (${tool.code}) dari registri kalibrasi aktif?`,
      confirmLabel: 'Ya, Hapus Alat Ukur',
      tone: 'danger'
    });
    if (!ok) return;
    try {
      const res = await api.delete(`/system-settings/calibration-tools/${encodeURIComponent(tool.code)}`);
      if (res.data?.items) setLocalTools(res.data.items);
      if (onFeedback) onFeedback(res.data?.message || 'Alat ukur berhasil dihapus.');
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      if (onError) onError(err.response?.data?.message || 'Gagal menghapus alat ukur.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Master Kategori & Schema Atribut Objek Uji */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Cube size={20} className="text-[#C81E1E]" weight="bold" />
                <CardTitle>Master 7 Kategori Objek Uji K3 & Skema Atribut Teknis</CardTitle>
              </div>
              <CardDescription>
                Definisi teknis 7 bidang regulasi riksa uji K3 sesuai Permenaker RI beserta skema atribut nameplate dan ruang lingkup BAP.
              </CardDescription>
            </div>
            {currentCategory && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                icon={PencilSimple}
                onClick={() => openEditCategoryModal(currentCategory)}
              >
                Edit Skema Bidang {currentCategory.code}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
            {categories.map((cat) => {
              const isSelected = Number(selectedCatId) === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white dark:bg-rose-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="font-mono">{cat.code}</span>
                  <span>- {cat.name}</span>
                </button>
              );
            })}
          </div>

          {currentCategory && (
            <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{currentCategory.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                      {currentCategory.code}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Total Unit Alat Terdaftar dalam Sistem: <strong>{currentCategory.object_count || 0} Unit</strong> · Inspeksi selesai tetap terikat pada rekaman historisnya.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">Dasar Hukum: Permenaker RI</Badge>
                </div>
              </div>

              {/* Atribut Spesifikasi Nameplate */}
              <div>
                <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Atribut Spesifikasi Nameplate Objek Uji ({Array.isArray(currentCategory.attribute_schema) ? currentCategory.attribute_schema.length : 3} Field)
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {Array.isArray(currentCategory.attribute_schema) && currentCategory.attribute_schema.length > 0 ? (
                    currentCategory.attribute_schema.map((attr) => (
                      <div
                        key={attr.key}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 block">{attr.key}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{attr.label}</span>
                        </div>
                        {attr.required && <Badge tone="warning">Wajib</Badge>}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Identitas Pabrik</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Merk & Pabrik Pembuat</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Identitas Unit</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Nomor Seri & Tahun Pembuatan</span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Kapasitas Kerja</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">Kapasitas / Daya Teknis</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Ruang Lingkup Pemeriksaan BAP Default */}
              {Array.isArray(currentCategory.default_bap_scopes) && currentCategory.default_bap_scopes.length > 0 && (
                <div>
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Ruang Lingkup Pengujian Default (Berita Acara Pemeriksaan)
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {currentCategory.default_bap_scopes.map((scope, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Registri Peralatan Uji & Validitas Kalibrasi KAN */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Gauge size={20} className="text-[#C81E1E]" weight="bold" />
                <CardTitle>Registri Alat Ukur Riksa Uji & Sertifikat Kalibrasi KAN</CardTitle>
              </div>
              <CardDescription>
                Kelola daftar instrumen pengujian lapangan beserta nomor sertifikat dan masa berlaku kalibrasi dari laboratorium terakreditasi KAN.
              </CardDescription>
            </div>
            <Button
              type="button"
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={openAddToolModal}
            >
              Tambah Alat Ukur
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {localTools.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                Belum ada alat ukur terdaftar pada registri kalibrasi.
              </div>
            ) : (
              localTools.map((t) => {
                const status = t.validityStatus || 'VALID';
                const isExpired = status === 'EXPIRED';
                const isExpiring = status === 'EXPIRING_SOON';

                return (
                  <div
                    key={t.code}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {t.code}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {t.name}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ({t.brand})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        No. Sertifikat KAN: <strong className="text-slate-800 dark:text-slate-200">{t.certNo}</strong> · Lab: {t.calibrationLab || 'Terakreditasi KAN'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                        <span>Bidang K3: <strong>{t.category}</strong></span>
                        {t.serialNo && <span>· S/N: <code className="font-mono">{t.serialNo}</code></span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0 text-[11px]">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Berlaku s/d: {formatDate(t.validUntil)}
                        </span>
                        {isExpired ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400 inline-flex items-center gap-1">
                            <WarningCircle size={13} weight="fill" />
                            Kalibrasi Kedaluwarsa
                          </span>
                        ) : isExpiring ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                            <Clock size={13} weight="fill" />
                            Akan Habis ({t.daysRemaining} hr)
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle size={13} weight="fill" />
                            Terkalibrasi Sah
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditToolModal(t)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit / Perbarui Sertifikat Kalibrasi"
                          aria-label={`Edit kalibrasi ${t.name}`}
                        >
                          <PencilSimple size={15} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTool(t)}
                          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="Hapus Alat Ukur"
                          aria-label={`Hapus alat ukur ${t.name}`}
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Edit Skema Kategori K3 */}
      {editingCategory && (
        <Modal
          open={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          title={`Edit Master Bidang [${editingCategory.code}]`}
        >
          <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Resmi Bidang Pengawasan K3 *
              </label>
              <input
                type="text"
                required
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ruang Lingkup Pemeriksaan BAP Default (Satu lingkup per baris)
              </label>
              <textarea
                rows={4}
                value={catForm.scopesText}
                onChange={(e) => setCatForm({ ...catForm, scopesText: e.target.value })}
                placeholder="Pemeriksaan Dokumen Teknis&#10;Pemeriksaan Visual&#10;Pengujian Fungsi & Pengaman"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono text-[11px]"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditingCategory(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" loading={savingCat}>
                Simpan Skema Bidang
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Tambah / Edit Alat Ukur Kalibrasi */}
      {toolModal && (
        <Modal
          open={Boolean(toolModal)}
          onClose={() => setToolModal(null)}
          title={
            toolModal.mode === 'EDIT'
              ? `Perbarui Sertifikat Kalibrasi: ${toolForm.code}`
              : 'Tambah Alat Ukur & Sertifikat Kalibrasi KAN'
          }
        >
          <form onSubmit={handleSaveTool} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kode Inventaris Alat *
                </label>
                <input
                  type="text"
                  required
                  value={toolForm.code}
                  onChange={(e) => setToolForm({ ...toolForm, code: e.target.value })}
                  placeholder="Contoh: UTM-NDT-07"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bidang Riksa Uji Terkait *
                </label>
                <input
                  type="text"
                  required
                  value={toolForm.category}
                  onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
                  placeholder="Contoh: PUBT / PAA"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Alat Ukur / Instrumen Pengujian *
              </label>
              <input
                type="text"
                required
                value={toolForm.name}
                onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                placeholder="Contoh: Ultrasonic Thickness Gauge Digital"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Merk / Tipe Instrumen *
                </label>
                <input
                  type="text"
                  required
                  value={toolForm.brand}
                  onChange={(e) => setToolForm({ ...toolForm, brand: e.target.value })}
                  placeholder="Contoh: Olympus 38DL PLUS"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Seri Alat (Serial Number)
                </label>
                <input
                  type="text"
                  value={toolForm.serialNo}
                  onChange={(e) => setToolForm({ ...toolForm, serialNo: e.target.value })}
                  placeholder="Contoh: OL-38DL-99281"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Sertifikat Kalibrasi KAN *
                </label>
                <input
                  type="text"
                  required
                  value={toolForm.certNo}
                  onChange={(e) => setToolForm({ ...toolForm, certNo: e.target.value })}
                  placeholder="Contoh: KAL-2026-0081/KAN"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Laboratorium Kalibrasi
                </label>
                <input
                  type="text"
                  value={toolForm.calibrationLab}
                  onChange={(e) => setToolForm({ ...toolForm, calibrationLab: e.target.value })}
                  placeholder="Lab Kalibrasi KAN - PT Sucofindo"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tanggal Kalibrasi Terakhir
                </label>
                <input
                  type="date"
                  value={toolForm.calibratedAt}
                  onChange={(e) => setToolForm({ ...toolForm, calibratedAt: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Berlaku Sampai Tanggal *
                </label>
                <input
                  type="date"
                  required
                  value={toolForm.validUntil}
                  onChange={(e) => setToolForm({ ...toolForm, validUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setToolModal(null)}>
                Batal
              </Button>
              <Button type="submit" variant="primary" loading={savingTool}>
                {toolModal.mode === 'EDIT' ? 'Simpan Perubahan Kalibrasi' : 'Simpan Alat Ukur'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

