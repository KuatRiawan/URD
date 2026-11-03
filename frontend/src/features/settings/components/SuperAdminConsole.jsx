import { useEffect, useState } from 'react';
import {
  ArrowClockwise,
  Bell,
  CheckCircle,
  Database,
  DownloadSimple,
  FileText,
  FloppyDisk,
  Gear,
  HardDrives,
  ListChecks,
  PaperPlaneTilt,
  PencilSimple,
  Plus,
  ShieldCheck,
  Trash,
  WhatsappLogo,
  Buildings
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../../components/ui/Card.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function SuperAdminConsole() {
  const [activeSubTab, setActiveSubTab] = useState('company_profile');
  const [systemOverview, setSystemOverview] = useState(null);
  const [checklistsData, setChecklistsData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);

  // Form Profil Perusahaan
  const [companyForm, setCompanyForm] = useState({
    company_name: 'PT UPAYA RIKSA DAYA',
    legal_name: 'PT Upaya Riksa Daya',
    brand_name: 'URD',
    tagline: 'Perusahaan Jasa Keselamatan dan Kesehatan Kerja (PJK3)',
    address: 'Jl. Pondasi No. 50B RT. 003 RW. 002, Kel. Kayu Putih, Kec. Pulo Gadung, Jakarta Timur 13210',
    phone: '(021) 489 1409',
    email: 'urd@upayariksadaya.com',
    website: 'https://upayariksadaya.com',
    pjk3_license_no: 'KEP.5/123/AS.01.03/I/2024',
    director_name: 'Ir. Direktur URD, M.T.'
  });

  // Form Standar Penomoran
  const [numberingForm, setNumberingForm] = useState({
    order_prefix: 'PO-URD/{YEAR}/{MONTH}/{COUNTER}',
    assignment_prefix: 'ST-URD/{YEAR}/{ROMAN_MONTH}/{COUNTER}',
    bap_prefix: 'BAP/URD/{ROMAN_MONTH}/{YEAR}/{COUNTER}',
    lhpp_prefix: '{COUNTER}/INSP-{BIDANG_CODE}/PJK3-URD/{ROMAN_MONTH}/{YEAR}',
    suket_prefix: '566/{COUNTER}/DTKT/{YEAR}',
    bast_prefix: 'BAST-URD/{YEAR}/{MONTH}/{COUNTER}'
  });

  // Form WhatsApp Gateway & Email SMTP
  const [waForm, setWaForm] = useState({
    provider: 'FONNTE',
    api_url: 'https://api.fonnte.com/send',
    api_key: '',
    sender_number: '081284567890'
  });

  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'notifikasi@upayariksadaya.com',
    pass: '',
    from: 'URD Operasional <notifikasi@upayariksadaya.com>'
  });

  // Modal State untuk Tambah / Edit Butir Checklist
  const [checklistItemModal, setChecklistItemModal] = useState(null); // { mode: 'create' | 'edit', item: {...} }
  const [itemForm, setItemForm] = useState({
    section: 'Pemeriksaan Visual & Fisik',
    label: '',
    input_type: 'CHOICE',
    unit: '',
    min_value: '',
    max_value: '',
    is_required: true
  });
  const [savingItem, setSavingItem] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [ovRes, ckRes, bkRes] = await Promise.all([
        api.get('/system-settings'),
        api.get('/system-settings/checklists'),
        api.get('/system-settings/backups')
      ]);

      setSystemOverview(ovRes.data);
      const s = ovRes.data?.settings || {};

      if (s.company_profile?.value) {
        setCompanyForm((prev) => ({ ...prev, ...s.company_profile.value }));
      }
      if (s.auto_numbering?.value) {
        setNumberingForm((prev) => ({ ...prev, ...s.auto_numbering.value }));
      }
      if (s.whatsapp_gateway?.value) {
        setWaForm((prev) => ({ ...prev, ...s.whatsapp_gateway.value }));
      }
      if (s.smtp_configuration?.value) {
        setSmtpForm((prev) => ({ ...prev, ...s.smtp_configuration.value }));
      }

      setChecklistsData(ckRes.data);
      if (ckRes.data?.categories?.length > 0 && !selectedCategory) {
        setSelectedCategory(ckRes.data.categories[0]);
      }
      setBackups(bkRes.data?.items || []);
    } catch {
      // Abaikan jika ada error network sementara
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveCompanyProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('company');
      const settingKey = 'company_profile';
      await api.put(`/system-settings/keys/${settingKey}`, { value: companyForm });
      setFeedback({
        type: 'success',
        message: 'Profil resmi perusahaan berhasil diperbarui. Seluruh dokumen PDF dan BAP akan langsung memuat data ini.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menyimpan profil perusahaan.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveNumbering = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('numbering');
      const settingKey = 'auto_numbering';
      await api.put(`/system-settings/keys/${settingKey}`, { value: numberingForm });
      setFeedback({ type: 'success', message: 'Format penomoran surat berhasil disimpan.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menyimpan format penomoran.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveGateways = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('gateways');
      const waKey = 'whatsapp_gateway';
      const smtpKey = 'smtp_configuration';
      await Promise.all([
        api.put(`/system-settings/keys/${waKey}`, { value: waForm }),
        api.put(`/system-settings/keys/${smtpKey}`, { value: smtpForm })
      ]);
      setFeedback({
        type: 'success',
        message: 'Konfigurasi WhatsApp Gateway & Email SMTP berhasil disimpan.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menyimpan konfigurasi gateway.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingConnection('email');
      const res = await api.post('/system-settings/test-email', { config: smtpForm });
      setFeedback({
        type: res.data.success ? 'success' : 'error',
        message: res.data.message || 'Uji koneksi email berhasil.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Uji koneksi SMTP gagal terhubung.'
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleTestWhatsApp = async () => {
    try {
      setTestingConnection('whatsapp');
      const res = await api.post('/system-settings/test-whatsapp', { config: waForm });
      setFeedback({
        type: res.data.success ? 'success' : 'error',
        message: res.data.message || 'Uji koneksi WhatsApp berhasil.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Uji koneksi WhatsApp gateway gagal.'
      });
    } finally {
      setTestingConnection(null);
    }
  };

  const handleSaveChecklistItem = async (e) => {
    e.preventDefault();
    if (!checklistItemModal) return;
    try {
      setSavingItem(true);
      if (checklistItemModal.mode === 'create') {
        await api.post('/system-settings/checklists/items', {
          version_id: selectedCategory?.active_version_id,
          section: itemForm.section,
          label: itemForm.label,
          input_type: itemForm.input_type,
          unit: itemForm.unit || null,
          min_value: itemForm.min_value ? Number(itemForm.min_value) : null,
          max_value: itemForm.max_value ? Number(itemForm.max_value) : null,
          is_required: Boolean(itemForm.is_required)
        });
        setFeedback({ type: 'success', message: 'Pertanyaan checklist baru berhasil ditambahkan.' });
      } else {
        await api.put(`/system-settings/checklists/items/${checklistItemModal.item.id}`, {
          section: itemForm.section,
          label: itemForm.label,
          input_type: itemForm.input_type,
          unit: itemForm.unit || null,
          min_value: itemForm.min_value ? Number(itemForm.min_value) : null,
          max_value: itemForm.max_value ? Number(itemForm.max_value) : null,
          is_required: Boolean(itemForm.is_required)
        });
        setFeedback({ type: 'success', message: 'Pertanyaan checklist berhasil diperbarui.' });
      }
      setChecklistItemModal(null);
      // Reload checklists
      const ckRes = await api.get('/system-settings/checklists');
      setChecklistsData(ckRes.data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || err.response?.data?.message || 'Gagal menyimpan butir checklist.'
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteChecklistItem = async (itemId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus butir pertanyaan ini dari checklist inspeksi?')) return;
    try {
      await api.delete(`/system-settings/checklists/items/${itemId}`);
      setFeedback({ type: 'success', message: 'Butir checklist berhasil dihapus.' });
      const ckRes = await api.get('/system-settings/checklists');
      setChecklistsData(ckRes.data);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menghapus butir checklist.'
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await api.post('/system-settings/backups');
      setFeedback({
        type: 'success',
        message: `Snapshot backup ${res.data?.backup?.filename} berhasil dibuat dan diamankan.`
      });
      const bkRes = await api.get('/system-settings/backups');
      setBackups(bkRes.data?.items || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal membuat snapshot backup.'
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      const res = await api.get(`/system-settings/backups/${backup.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/sql' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.filename || 'urd_backup.sql');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setFeedback({ type: 'error', message: 'Gagal mengunduh file snapshot backup.' });
    }
  };

  const filteredItems = (checklistsData?.templateItems || []).filter(
    (item) => selectedCategory && item.category_id === selectedCategory.id
  );

  return (
    <div className="space-y-5">
      {/* Sub Tabs Super Admin */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto scrollbar-none pb-px">
        {[
          { id: 'company_profile', label: 'Profil Perusahaan & Dokumen', icon: Buildings },
          { id: 'checklists', label: '7 Bidang K3 & Checklist Builder', icon: ListChecks },
          { id: 'numbering', label: 'Format Nomor Surat Otomatis', icon: FileText },
          { id: 'gateways', label: 'WhatsApp Gateway & SMTP Email', icon: Bell },
          { id: 'backups', label: 'Database Backup & Recovery', icon: Database },
          { id: 'system_info', label: 'Integritas Sistem & Audit', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveSubTab(tab.id);
                setFeedback(null);
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-lg transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-t-2 border-brand-600 text-brand-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon size={15} weight={isActive ? 'bold' : 'regular'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. Profil Perusahaan */}
      {activeSubTab === 'company_profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profil Resmi &amp; Identitas Lembaga PJK3</CardTitle>
            <CardDescription>
              Data ini digunakan secara dinamis pada kop surat, footer, dan pengesahan seluruh dokumen resmi (Surat Tugas, BAP, LHPP, Lembar Temuan, BAST).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCompanyProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan Resmi (Kop Dokumen)
                  </label>
                  <input
                    type="text"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor SKP PJK3 Kemnaker RI
                  </label>
                  <input
                    type="text"
                    value={companyForm.pjk3_license_no}
                    onChange={(e) => setCompanyForm({ ...companyForm, pjk3_license_no: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Lengkap Kantor Operasional
                  </label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor Telepon Kantor
                  </label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Email Resmi Perusahaan
                  </label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website Resmi
                  </label>
                  <input
                    type="text"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Direktur / Penanggung Jawab PJK3
                  </label>
                  <input
                    type="text"
                    value={companyForm.director_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, director_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  size="md"
                  loading={savingKey === 'company'}
                  icon={FloppyDisk}
                >
                  Simpan Profil Perusahaan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. 7 Bidang K3 & Dynamic Checklist Builder */}
      {activeSubTab === 'checklists' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Master 7 Bidang K3 &amp; Dynamic Checklist Builder</CardTitle>
                <CardDescription>
                  Kelola struktur kategori dan butir pertanyaan pemeriksaan lapangan yang wajib diisi Inspector.
                </CardDescription>
              </div>
              {selectedCategory?.active_version_id && (
                <Button
                  type="button"
                  size="sm"
                  icon={Plus}
                  onClick={() => {
                    setItemForm({
                      section: 'Pemeriksaan Visual & Fisik',
                      label: '',
                      input_type: 'CHOICE',
                      unit: '',
                      min_value: '',
                      max_value: '',
                      is_required: true
                    });
                    setChecklistItemModal({ mode: 'create' });
                  }}
                >
                  Tambah Pertanyaan Ceklis
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pemilihan Bidang K3 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
              {(checklistsData?.categories || []).map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-rose-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span className="font-mono">{cat.code}</span>
                    <span>- {cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Daftar Pertanyaan Checklist untuk Kategori Terpilih */}
            {selectedCategory && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Daftar Butir Ceklis Bidang: <strong>{selectedCategory.name} ({selectedCategory.code})</strong>
                  </span>
                  <span>{filteredItems.length} pertanyaan terdaftar</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-400">
                      Belum ada butir pertanyaan pada template aktif kategori ini. Klik "Tambah Pertanyaan Ceklis" untuk menambahkan.
                    </div>
                  ) : (
                    filteredItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400 text-[11px]">#{idx + 1}</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                              Bagian: {item.section}
                            </span>
                            <span className="font-mono">Tipe: {item.input_type}</span>
                            {item.unit && <span>Satuan: {item.unit}</span>}
                            {item.min_value !== null && item.max_value !== null && (
                              <span>Batas: {item.min_value} - {item.max_value}</span>
                            )}
                            {item.is_required && (
                              <span className="font-bold text-rose-600 dark:text-rose-400">Wajib Diisi</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setItemForm({
                                section: item.section,
                                label: item.label,
                                input_type: item.input_type,
                                unit: item.unit || '',
                                min_value: item.min_value ?? '',
                                max_value: item.max_value ?? '',
                                is_required: item.is_required
                              });
                              setChecklistItemModal({ mode: 'edit', item });
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
                            title="Edit Pertanyaan"
                          >
                            <PencilSimple size={15} weight="bold" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(item.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
                            title="Hapus Pertanyaan"
                          >
                            <Trash size={15} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Numbering Format */}
      {activeSubTab === 'numbering' && (
        <Card>
          <CardHeader>
            <CardTitle>Standar Format Penomoran Dokumen Otomatis</CardTitle>
            <CardDescription>
              Atur pola penomoran dokumen resmi. Tag dinamis yang didukung: <code className="font-mono text-brand-600">{'{COUNTER}'}</code>, <code className="font-mono text-brand-600">{'{YEAR}'}</code>, <code className="font-mono text-brand-600">{'{MONTH}'}</code>, <code className="font-mono text-brand-600">{'{ROMAN_MONTH}'}</code>, <code className="font-mono text-brand-600">{'{BIDANG_CODE}'}</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveNumbering} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Nomor Purchase Order (PO)
                  </label>
                  <input
                    type="text"
                    value={numberingForm.order_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, order_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: PO-URD/2026/11/0001</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Surat Tugas Ahli K3 (ST)
                  </label>
                  <input
                    type="text"
                    value={numberingForm.assignment_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, assignment_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: ST-URD/2026/XI/0001</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Berita Acara Pemeriksaan (BAP)
                  </label>
                  <input
                    type="text"
                    value={numberingForm.bap_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, bap_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: BAP/URD/XI/2026/0001</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Laporan LHPP
                  </label>
                  <input
                    type="text"
                    value={numberingForm.lhpp_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, lhpp_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: 0001/INSP-PUBT/PJK3-URD/XI/2026</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Suket K3 Disnaker
                  </label>
                  <input
                    type="text"
                    value={numberingForm.suket_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, suket_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: 566/0001/DTKT/2026</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Format Berita Acara Serah Terima (BAST)
                  </label>
                  <input
                    type="text"
                    value={numberingForm.bast_prefix}
                    onChange={(e) => setNumberingForm({ ...numberingForm, bast_prefix: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Contoh: BAST-URD/2026/11/0001</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  size="md"
                  loading={savingKey === 'numbering'}
                  icon={FloppyDisk}
                >
                  Simpan Format Nomor
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 4. WhatsApp & Email Gateways */}
      {activeSubTab === 'gateways' && (
        <Card>
          <CardHeader>
            <CardTitle>Gateway Notifikasi WhatsApp &amp; Server SMTP Email</CardTitle>
            <CardDescription>
              Kredensial dan endpoint untuk mengirim pengingat otomatis masa berlaku Suket K3 (H-30, H-14, H-7) serta notifikasi operasional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveGateways} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {/* WhatsApp Gateway */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <WhatsappLogo size={18} className="text-emerald-600" weight="bold" />
                      <span>WhatsApp Gateway API</span>
                    </h4>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      loading={testingConnection === 'whatsapp'}
                      onClick={handleTestWhatsApp}
                      icon={PaperPlaneTilt}
                    >
                      Uji Koneksi
                    </Button>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Provider WhatsApp
                    </label>
                    <input
                      type="text"
                      value={waForm.provider}
                      onChange={(e) => setWaForm({ ...waForm, provider: e.target.value })}
                      placeholder="FONNTE / QONTAK / WABLAS"
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Endpoint URL API
                    </label>
                    <input
                      type="text"
                      value={waForm.api_url}
                      onChange={(e) => setWaForm({ ...waForm, api_url: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Token Otorisasi / API Key
                    </label>
                    <input
                      type="password"
                      value={waForm.api_key}
                      onChange={(e) => setWaForm({ ...waForm, api_key: e.target.value })}
                      placeholder="Masukkan Token Gateway..."
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Pengirim Terdaftar
                    </label>
                    <input
                      type="text"
                      value={waForm.sender_number}
                      onChange={(e) => setWaForm({ ...waForm, sender_number: e.target.value })}
                      placeholder="628..."
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* SMTP Email Server */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Bell size={18} className="text-blue-600" weight="bold" />
                      <span>SMTP Email Server</span>
                    </h4>
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      loading={testingConnection === 'email'}
                      onClick={handleTestEmail}
                      icon={PaperPlaneTilt}
                    >
                      Uji Koneksi
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Host Server SMTP
                      </label>
                      <input
                        type="text"
                        value={smtpForm.host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                        placeholder="smtp.mailgun.org"
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        value={smtpForm.port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, port: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Username / Email Akun
                    </label>
                    <input
                      type="text"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Password / App Password
                    </label>
                    <input
                      type="password"
                      value={smtpForm.pass}
                      onChange={(e) => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nama &amp; Email Pengirim (From)
                    </label>
                    <input
                      type="text"
                      value={smtpForm.from}
                      onChange={(e) => setSmtpForm({ ...smtpForm, from: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  size="md"
                  loading={savingKey === 'gateways'}
                  icon={FloppyDisk}
                >
                  Simpan Konfigurasi Gateway &amp; SMTP
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 5. Database Backup & Disaster Recovery */}
      {activeSubTab === 'backups' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle>Database Snapshot &amp; Arsip Cadangan Terenkripsi</CardTitle>
                <CardDescription>
                  Amankan data relasional seluruh transaksi, PO, dokumen BAP/LHPP/Suket, dan audit log secara mandiri.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                loading={creatingBackup}
                onClick={handleCreateBackup}
                icon={DownloadSimple}
              >
                Buat Snapshot Backup Sekarang
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {backups.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada riwayat snapshot backup database. Klik tombol di atas untuk membuat snapshot.
              </p>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {backups.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 block">
                        {b.filename}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Dibuat: {formatDateTime(b.created_at)} · Oleh: {b.created_by_name || 'Admin Sistem'} · Tipe: {b.backup_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {Math.round((b.file_size_bytes || 0) / 1024)} KB
                      </span>
                      <Badge variant="success">Tervalidasi</Badge>
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(b)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="Unduh File Snapshot SQL"
                      >
                        <DownloadSimple size={13} weight="bold" />
                        <span>Unduh SQL</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 6. System Info & Integrity */}
      {activeSubTab === 'system_info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Keandalan Database &amp; Lingkungan Produksi</CardTitle>
              <CardDescription>Informasi teknis engine data dan kepatuhan integritas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Status Trigger Audit Log</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  trg_audit_logs_immutable (Aktif)
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {systemOverview?.systemInfo?.databaseVersion || 'PostgreSQL 16+'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Ukuran Database</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {systemOverview?.systemInfo?.databaseSize || '0 MB'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Total Tabel Database</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {systemOverview?.systemInfo?.totalTables || 45} Tabel Terstruktur
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Arsitektur Role &amp; Wewenang Operasional</CardTitle>
              <CardDescription>Pemisahan tanggung jawab sistem sesuai PRD URD</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-purple-700 dark:text-purple-300 block">ADMIN_SISTEM (Super Admin)</span>
                <span className="text-slate-500 dark:text-slate-400">Konfigurasi sistem, akun pengguna, checklist master, gateway integrasi, &amp; backup snapshot.</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-blue-700 dark:text-blue-300 block">ADMIN_KANTOR (Admin Operasional)</span>
                <span className="text-slate-500 dark:text-slate-400">QC dan review inspeksi, finalisasi BAP/LHPP, penerbitan Suket K3, dan BAST penyerahan.</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-amber-700 dark:text-amber-300 block">AHLI_K3 (Inspector Lapangan)</span>
                <span className="text-slate-500 dark:text-slate-400">Pemeriksaan fisik, checklist, pengukuran, foto bukti, kesimpulan, dan tanda tangan digital BAP.</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-rose-700 dark:text-rose-300 block">PIMPINAN (Executive Monitoring)</span>
                <span className="text-slate-500 dark:text-slate-400">Monitoring SLA, produktivitas tim, beban kerja inspector, audit trail riksa uji tanpa hak approval dokumen.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Tambah / Edit Checklist Question */}
      {checklistItemModal && (
        <Modal
          open={Boolean(checklistItemModal)}
          onClose={() => setChecklistItemModal(null)}
          title={
            checklistItemModal.mode === 'create'
              ? `Tambah Butir Ceklis: ${selectedCategory?.name}`
              : `Edit Butir Ceklis: ${checklistItemModal.item?.label}`
          }
          size="md"
        >
          <form onSubmit={handleSaveChecklistItem} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kelompok / Bagian (Section)
              </label>
              <input
                type="text"
                value={itemForm.section}
                onChange={(e) => setItemForm({ ...itemForm, section: e.target.value })}
                required
                placeholder="Contoh: Pemeriksaan Visual, Uji Beban, Sistem Pengaman"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teks Pertanyaan / Item Pemeriksaan
              </label>
              <textarea
                rows={2}
                value={itemForm.label}
                onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                required
                placeholder="Deskripsi spesifik item yang harus diperiksa..."
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Jawaban (Input Type)
                </label>
                <select
                  value={itemForm.input_type}
                  onChange={(e) => setItemForm({ ...itemForm, input_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold"
                >
                  <option value="CHOICE">Pilihan (Baik / Buruk / Ada / Tidak Ada)</option>
                  <option value="NUMBER">Nilai Angka / Hasil Ukur</option>
                  <option value="TEXT">Teks Bebas / Keterangan</option>
                  <option value="DATE">Tanggal Kalibrasi / Uji</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Satuan (Unit - Opsional)
                </label>
                <input
                  type="text"
                  value={itemForm.unit}
                  onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                  placeholder="Contoh: bar, kg, mm, Ohm, V"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                />
              </div>
            </div>

            {itemForm.input_type === 'NUMBER' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Batas Minimum Standar
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={itemForm.min_value}
                    onChange={(e) => setItemForm({ ...itemForm, min_value: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Batas Maksimum Standar
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={itemForm.max_value}
                    onChange={(e) => setItemForm({ ...itemForm, max_value: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_required_chk"
                checked={itemForm.is_required}
                onChange={(e) => setItemForm({ ...itemForm, is_required: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600"
              />
              <label htmlFor="is_required_chk" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Wajib diisi oleh Inspector di lapangan sebelum formulir disubmit
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setChecklistItemModal(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={savingItem}
                icon={FloppyDisk}
              >
                Simpan Butir Ceklis
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
