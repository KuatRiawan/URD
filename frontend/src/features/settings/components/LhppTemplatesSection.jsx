import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  CheckCircle,
  ClockCounterClockwise,
  Cube,
  Eye,
  FileDoc,
  FilePdf,
  FilePlus,
  Funnel,
  GitBranch,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  ShieldCheck,
  WarningCircle
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { LoadingState, EmptyState, ErrorBanner } from '../../../components/feedback/StateViews.jsx';

const URD_DOMAINS = [
  { code: 'PAPA', name: 'Pesawat Angkat & Pesawat Angkut' },
  { code: 'PUBT', name: 'Pesawat Uap & Bejana Tekan' },
  { code: 'PTP', name: 'Pesawat Tenaga & Produksi' },
  { code: 'ILPP', name: 'Instalasi Listrik & Penyalur Petir' },
  { code: 'IPK', name: 'Instalasi Proteksi Kebakaran' },
  { code: 'ELEVATOR_ESKALATOR', name: 'Elevator & Eskalator' },
  { code: 'ANCHOR_LIFELINE', name: 'Anchor & Lifeline' }
];

export function LhppTemplatesSection() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Filter state
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [formatFilter, setFormatFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewMeta, setPreviewMeta] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    code: '',
    name: '',
    inspection_domain: 'PAPA',
    equipment_type_id: '',
    equipment_subtype: '',
    inspection_type: 'SEMUA',
    output_format: 'PDF',
    layout_engine: 'HTML_TO_PDF',
    description: '',
    version_code: 'v1.0.0',
    title: '',
    regulation_reference: ''
  });

  const [versionForm, setVersionForm] = useState({
    version_code: '',
    change_notes: '',
    publish_now: true
  });

  // Fetch templates & equipment types
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tplRes, eqRes] = await Promise.all([
        api.get('/lhpp-templates'),
        api.get('/equipment-types')
      ]);
      setTemplates(tplRes.data?.data || []);
      setEquipmentTypes(eqRes.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memuat template LHPP dari server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      if (domainFilter !== 'ALL' && tpl.inspection_domain !== domainFilter) return false;
      if (formatFilter !== 'ALL' && tpl.output_format !== formatFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesCode = tpl.code?.toLowerCase().includes(q);
        const matchesName = tpl.name?.toLowerCase().includes(q);
        const matchesEq = tpl.equipment_type_name?.toLowerCase().includes(q);
        const matchesReg = tpl.active_version?.regulation_reference?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesEq && !matchesReg) return false;
      }
      return true;
    });
  }, [templates, domainFilter, formatFilter, searchQuery]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setForm({
      code: '',
      name: '',
      inspection_domain: 'PAPA',
      equipment_type_id: '',
      equipment_subtype: '',
      inspection_type: 'SEMUA',
      output_format: 'PDF',
      layout_engine: 'HTML_TO_PDF',
      description: '',
      version_code: 'v1.0.0',
      title: '',
      regulation_reference: ''
    });
    setCreateModalOpen(true);
  };

  // Submit Create Template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast('Kode dan Nama Template wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/lhpp-templates', {
        ...form,
        equipment_type_id: form.equipment_type_id ? Number(form.equipment_type_id) : null
      });
      toast(`Template LHPP ${form.code} berhasil didaftarkan.`, 'success');
      setCreateModalOpen(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Gagal mendaftarkan template LHPP.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open edit modal
  const handleOpenEdit = (template) => {
    setSelectedTemplate(template);
    setForm({
      code: template.code,
      name: template.name,
      inspection_domain: template.inspection_domain,
      equipment_type_id: template.equipment_type_id || '',
      equipment_subtype: template.equipment_subtype || '',
      inspection_type: template.inspection_type || 'SEMUA',
      output_format: template.output_format || 'PDF',
      layout_engine: template.layout_engine || 'HTML_TO_PDF',
      description: template.description || '',
      is_active: template.is_active
    });
    setEditModalOpen(true);
  };

  // Submit Edit Template
  const handleEditTemplate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/lhpp-templates/${selectedTemplate.id}`, {
        ...form,
        equipment_type_id: form.equipment_type_id ? Number(form.equipment_type_id) : null
      });
      toast(`Konfigurasi template ${form.code} berhasil diperbarui.`, 'success');
      setEditModalOpen(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Gagal memperbarui template.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open version history modal
  const handleOpenVersions = async (template) => {
    setSelectedTemplate(template);
    try {
      const res = await api.get(`/lhpp-templates/${template.id}`);
      setSelectedTemplate(res.data?.data || template);
      const activeVer = res.data?.data?.active_version?.version_code || 'v1.0.0';
      const parts = activeVer.replace('v', '').split('.').map(Number);
      const nextPatch = `v${parts[0] || 1}.${parts[1] || 0}.${(parts[2] || 0) + 1}`;
      setVersionForm({
        version_code: nextPatch,
        change_notes: '',
        publish_now: true
      });
      setVersionModalOpen(true);
    } catch {
      toast('Gagal memuat detail versi template.', 'error');
    }
  };

  // Submit publish new version
  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!versionForm.version_code.trim()) {
      toast('Nomor versi wajib diisi.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/lhpp-templates/${selectedTemplate.id}/versions`, {
        version_code: versionForm.version_code.trim(),
        change_notes: versionForm.change_notes.trim(),
        publish_now: versionForm.publish_now
      });
      toast(`Versi baru ${versionForm.version_code} berhasil dipublikasikan.`, 'success');
      setVersionModalOpen(false);
      loadData();
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Gagal merilis versi template baru.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle preview sample LHPP
  const handlePreviewSample = async (template) => {
    try {
      setSelectedTemplate(template);
      const res = await api.post(`/lhpp-templates/${template.id}/preview`, {
        sampleContext: {
          clientName: 'PT Sampel Industri Makmur',
          objectName: `${template.equipment_type_name || 'Unit Alat'} K3`,
          serialNumber: 'SN-SAMPLE-2026',
          inspectorName: 'Ir. Budi Santoso (Ahli K3 Spesialis)',
          companyName: 'PT Upaya Riksa Daya',
          lhppNo: `TEST/INSP-${template.inspection_domain}/PJK3-URD/XI/2026`
        }
      });
      setPreviewHtml(res.data?.data?.html || '<p>Tidak ada pratinjau</p>');
      setPreviewMeta(res.data?.data?.metadata || null);
      setPreviewModalOpen(true);
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Gagal menghasilkan sampel pratinjau LHPP.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Aksi Cepat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-tight">
            Master Engine Template Dokumen LHPP (Multi-Domain)
          </h3>
          <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
            Konfigurasi template laporan hasil pemeriksaan riksa uji K3 spesifik jenis alat untuk 7 bidang Kemnaker RI.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenCreate}
        >
          Tambah Template LHPP
        </Button>
      </div>

      {/* Ringkasan Metrik Template */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">Total Template</p>
          <p className="text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-1 font-mono">{templates.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Semua Bidang Riksa Uji</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">Bidang URD</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">7 / 7</p>
          <p className="text-[11px] text-slate-500 mt-0.5">PAPA, PUBT, PTP, dkk</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">Format Dokumen</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">PDF &amp; Word</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Kemnaker + Disnaker</p>
        </div>
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">Integritas &amp; Versi</p>
          <p className="text-2xl font-bold text-[#C81E1E] dark:text-rose-400 mt-1 font-mono">SHA-256</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Copy-on-Write Versioning</p>
        </div>
      </div>

      {/* Filter Toolbar Apple-Style */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#151821] p-3 rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode, nama template, atau dasar hukum..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#1C1F2B] text-xs text-[#1D1D1F] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Domain */}
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#1C1F2B] px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Semua Bidang URD</option>
            {URD_DOMAINS.map((d) => (
              <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
            ))}
          </select>

          {/* Filter Format */}
          <select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-[#F5F5F7] dark:bg-[#1C1F2B] px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">Semua Format</option>
            <option value="PDF">PDF Resmi</option>
            <option value="DOCX">Word (.docx)</option>
          </select>
        </div>
      </div>

      {/* Tabel Template LHPP */}
      {loading ? (
        <LoadingState label="Memuat katalog template dokumen LHPP..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          title="Tidak ada template LHPP ditemukan"
          description="Ubah filter pencarian atau buat template dokumen LHPP baru."
          actionLabel="Tambah Template LHPP"
          onAction={handleOpenCreate}
        />
      ) : (
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Kode &amp; Nama Template</TableCell>
              <TableCell isHeader>Bidang &amp; Jenis Unit</TableCell>
              <TableCell isHeader>Dasar Hukum / Regulasi</TableCell>
              <TableCell isHeader>Versi Aktif</TableCell>
              <TableCell isHeader>Format</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {filteredTemplates.map((tpl) => {
              const activeVer = tpl.active_version;
              return (
                <TableRow key={tpl.id}>
                  <TableCell className="text-xs">
                    <div className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
                      {tpl.code}
                    </div>
                    <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mt-0.5">
                      {tpl.name}
                    </div>
                    {tpl.description && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs mt-0.5">
                        {tpl.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                        {tpl.inspection_domain}
                      </span>
                    </div>
                    <div className="font-medium text-slate-700 dark:text-slate-300 mt-1">
                      {tpl.equipment_type_name || 'Semua Unit Bidang'}
                    </div>
                    {tpl.equipment_subtype && (
                      <div className="text-[11px] text-slate-500">
                        Subtipe: {tpl.equipment_subtype}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs">
                    <div className="text-slate-700 dark:text-slate-300 font-medium truncate">
                      {activeVer?.regulation_reference || 'Sesuai Standar Kemnaker RI'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      Judul: {activeVer?.title || tpl.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="inline-flex items-center gap-1.5">
                      <Badge tone="success">
                        {activeVer?.version_code || 'v1.0.0'}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {tpl.version_count || 1} rilis
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                      {tpl.output_format === 'DOCX' ? <FileDoc size={13} /> : <FilePdf size={13} />}
                      <span>{tpl.output_format}</span>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <div className="inline-flex items-center gap-1.5 justify-end whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={() => handlePreviewSample(tpl)}
                        title="Lihat Pratinjau Sampel"
                      >
                        Sampel
                      </Button>
                      <ActionMenu
                        label={`Opsi Template ${tpl.code}`}
                        items={[
                          {
                            key: 'edit',
                            label: 'Ubah Konfigurasi',
                            icon: PencilSimple,
                            onClick: () => handleOpenEdit(tpl)
                          },
                          {
                            key: 'versions',
                            label: 'Riwayat Versi (Copy-on-Write)',
                            icon: GitBranch,
                            onClick: () => handleOpenVersions(tpl)
                          }
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableWrapper>
      )}

      {/* Modal Tambah Template Baru */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Daftarkan Template Dokumen LHPP Baru"
        size="lg"
      >
        <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Kode Template *
              </label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="misal: PAPA-CRANE-01"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nama Laporan LHPP *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="misal: Laporan Pemeriksaan Crane & Hoist"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Bidang Riksa Uji *
              </label>
              <select
                value={form.inspection_domain}
                onChange={(e) => setForm({ ...form, inspection_domain: e.target.value, equipment_type_id: '' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                {URD_DOMAINS.map((d) => (
                  <option key={d.code} value={d.code}>{d.code} — {d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Jenis Unit Terkait
              </label>
              <select
                value={form.equipment_type_id}
                onChange={(e) => setForm({ ...form, equipment_type_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="">Semua Unit dalam Bidang Ini</option>
                {equipmentTypes
                  .filter((eq) => eq.domain_code === form.inspection_domain)
                  .map((eq) => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Format Output
              </label>
              <select
                value={form.output_format}
                onChange={(e) => setForm({ ...form, output_format: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="PDF">PDF Resmi (Watermark + QR)</option>
                <option value="DOCX">Microsoft Word (.docx)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Dasar Hukum / Standar Regulasi
            </label>
            <input
              type="text"
              value={form.regulation_reference}
              onChange={(e) => setForm({ ...form, regulation_reference: e.target.value })}
              placeholder="misal: Permenaker RI No. 8 Tahun 2020 tentang K3 Pesawat Angkat dan Pesawat Angkut"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Deskripsi Ruang Lingkup
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Catatan ruang lingkup pemeriksaan dan peruntukan template..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={submitting}
            >
              Simpan Template
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ubah Konfigurasi Template */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Ubah Template LHPP: ${selectedTemplate?.code}`}
        size="lg"
      >
        <form onSubmit={handleEditTemplate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Kode Template
              </label>
              <input
                type="text"
                disabled
                value={form.code}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 font-mono text-xs cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nama Laporan LHPP *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Format Output
              </label>
              <select
                value={form.output_format}
                onChange={(e) => setForm({ ...form, output_format: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="PDF">PDF Resmi</option>
                <option value="DOCX">Microsoft Word (.docx)</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Subtipe Unit (Opsional)
              </label>
              <input
                type="text"
                value={form.equipment_subtype || ''}
                onChange={(e) => setForm({ ...form, equipment_subtype: e.target.value })}
                placeholder="misal: Mobile Crane, Overhead Crane"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Deskripsi Template
            </label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={submitting}
            >
              Perbarui Konfigurasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Riwayat Versi (Copy-on-Write) */}
      <Modal
        open={versionModalOpen}
        onClose={() => setVersionModalOpen(false)}
        title={`Riwayat Versi: ${selectedTemplate?.name}`}
        size="xl"
      >
        <div className="space-y-6 text-xs">
          {/* Form Rilis Versi Baru (Copy-on-Write) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <GitBranch size={16} className="text-[#C81E1E]" />
              <span>Publikasikan Versi Baru (Copy-on-Write)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Setiap rilis versi baru bersifat immutable dan tidak akan mengubah arsip dokumen LHPP yang telah diterbitkan sebelumnya.
            </p>

            <form onSubmit={handleCreateVersion} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Versi *
                </label>
                <input
                  type="text"
                  required
                  value={versionForm.version_code}
                  onChange={(e) => setVersionForm({ ...versionForm, version_code: e.target.value })}
                  placeholder="v1.1.0"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Perubahan (Changelog)
                </label>
                <input
                  type="text"
                  value={versionForm.change_notes}
                  onChange={(e) => setVersionForm({ ...versionForm, change_notes: e.target.value })}
                  placeholder="Penyesuaian bab uji beban dan kalibrasi..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  Rilis Versi {versionForm.version_code}
                </Button>
              </div>
            </form>
          </div>

          {/* Daftar Versi Tersimpan */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Daftar Versi Snapshot Tersimpan</h4>
            <div className="space-y-2">
              {(selectedTemplate?.versions || []).map((ver) => {
                const isActive = ver.id === selectedTemplate?.active_version_id;
                return (
                  <div
                    key={ver.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      isActive
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs">{ver.version_code}</span>
                        {isActive && <Badge tone="success">Aktif Saat Ini</Badge>}
                        {ver.status === 'PUBLISHED' && !isActive && <Badge tone="neutral">Arsip Rilis</Badge>}
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        {ver.change_notes || 'Rilis awal template.'}
                      </div>
                      {ver.regulation_reference && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Dasar: {ver.regulation_reference}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      {ver.published_at ? new Date(ver.published_at).toLocaleDateString('id-ID') : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Sampel Pratinjau LHPP */}
      <Modal
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Pratinjau Sampel LHPP: ${selectedTemplate?.code}`}
        size="2xl"
      >
        <div className="space-y-4">
          {previewMeta && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-bold">Template: {previewMeta.templateCode} ({previewMeta.versionCode})</span>
              <span className="font-mono text-slate-500">Hash: {previewMeta.contentHash?.substring(0, 16)}...</span>
            </div>
          )}

          <div
            className="w-full max-h-[60vh] overflow-y-auto p-6 bg-white text-slate-900 rounded-xl border border-slate-200 shadow-inner"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewModalOpen(false)}
            >
              Tutup Pratinjau
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
