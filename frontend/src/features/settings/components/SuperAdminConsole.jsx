import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Alarm,
  Bell,
  Buildings,
  Cube,
  Database,
  FileText,
  HardDrives,
  ListChecks,
  ShieldCheck,
  FloppyDisk
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { CompanyProfileSection } from './CompanyProfileSection.jsx';
import { ChecklistBuilderSection } from './ChecklistBuilderSection.jsx';
import { EquipmentMasterSection } from './EquipmentMasterSection.jsx';
import { DocumentNumberingSection } from './DocumentNumberingSection.jsx';
import { GatewaysSection } from './GatewaysSection.jsx';
import { ReminderTemplatesSection } from './ReminderTemplatesSection.jsx';
import { DatabaseBackupsSection } from './DatabaseBackupsSection.jsx';
import { SystemInfoSection } from './SystemInfoSection.jsx';
import { LhppTemplatesSection } from './LhppTemplatesSection.jsx';

const TAB_ALIAS_MAP = {
  company: 'company_profile',
  company_profile: 'company_profile',
  checklists: 'checklists',
  equipment: 'equipment_master',
  equipment_master: 'equipment_master',
  numbering: 'numbering',
  lhpp_templates: 'lhpp_templates',
  lhpp: 'lhpp_templates',
  gateways: 'gateways',
  reminders: 'reminders',
  backups: 'backups',
  system: 'system_info',
  system_info: 'system_info'
};

export function SuperAdminConsole() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTabParam = (searchParams.get('subtab') || searchParams.get('tab') || 'company_profile').toLowerCase();
  const activeSubTab = TAB_ALIAS_MAP[rawTabParam] || 'company_profile';

  const [systemOverview, setSystemOverview] = useState(null);
  const [checklistsData, setChecklistsData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [backups, setBackups] = useState([]);
  const [calibrationTools, setCalibrationTools] = useState([]);
  const [_loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (feedback) {
      toast(feedback.message, feedback.type === 'error' ? 'error' : 'success');
      setFeedback(null);
    }
  }, [feedback, toast]);
  const [savingKey, setSavingKey] = useState(null);
  const [testingConnection, setTestingConnection] = useState(null);
  const [verifyingBackupId, setVerifyingBackupId] = useState(null);

  // Form Standar Template Dokumen Resmi
  const [docTemplatesForm, setDocTemplatesForm] = useState({
    surat_tugas: {
      code: 'ST',
      name: 'Surat Tugas Pemeriksaan & Pengujian (Ahli K3)',
      legal_basis: 'UU No. 1 Tahun 1970 & Permenaker RI No. Per.04/MEN/1995 tentang Perusahaan Jasa K3',
      signatory_title: 'Direktur Operasional PJK3',
      footer_note: 'Dokumen resmi PT Upaya Riksa Daya - Wajib dibawa saat pelaksanaan riksa uji lapangan.'
    },
    bap: {
      code: 'BAP',
      name: 'Berita Acara Pemeriksaan & Pengujian Teknis (BAP)',
      legal_basis: 'UU No. 1 Tahun 1970 & Peraturan Menteri Ketenagakerjaan RI sesuai Bidang Objek K3',
      signatory_title: 'Ahli K3 Spesialis & Perwakilan Klien',
      footer_note: 'Ditandatangani secara sah oleh Ahli K3 pemegang SKP Kemnaker RI dan perwakilan perusahaan pemilik alat.'
    },
    lhpp: {
      code: 'LHPP',
      name: 'Laporan Hasil Pemeriksaan dan Pengujian (LHPP)',
      legal_basis: 'Standar Teknis Pemeriksaan dan Pengujian K3 Kemnaker RI & SNI Terkait',
      signatory_title: 'Penanggung Jawab Teknis PJK3 & Ahli K3',
      footer_note: 'Laporan teknis ini merupakan dasar pengajuan Surat Keterangan (Suket) K3 ke Dinas Tenaga Kerja Provinsi.'
    },
    suket: {
      code: 'SUKET',
      name: 'Pengantar & Registri Surat Keterangan (Suket) K3 Disnaker',
      legal_basis: 'Kewenangan Pengawasan Ketenagakerjaan Dinas Tenaga Kerja & Transmigrasi Provinsi',
      signatory_title: 'Kepala Dinas Tenaga Kerja / Pejabat Berwenang',
      footer_note: 'Masa berlaku dievaluasi otomatis untuk pengingat perpanjangan berkala H-60, H-30, H-14, dan H-7.'
    },
    bast: {
      code: 'BAST',
      name: 'Berita Acara Serah Terima Dokumen (BAST)',
      legal_basis: 'Standar Operasional Prosedur Distribusi Dokumen Resmi PT Upaya Riksa Daya',
      signatory_title: 'Admin Kantor PJK3 & Penerima Dokumen Klien',
      footer_note: 'Bukti sah penyerahan dokumen asli LHPP, BAP, dan Surat Keterangan K3 kepada pelanggan.'
    }
  });

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

  // Form Template Reminder
  const [reminderForm, setReminderForm] = useState({
    h30_subject: 'Pemberitahuan Pengingat Riksa Uji K3 (H-30) - PT Upaya Riksa Daya',
    h30_message: 'Yth. Pimpinan / Bagian K3 {COMPANY_NAME},\n\nKami menginformasikan bahwa masa berlaku Suket K3 untuk unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) akan berakhir pada {VALID_UNTIL} (30 hari lagi).\n\nUntuk menjamin keselamatan kerja dan kepatuhan terhadap regulasi ketenagakerjaan, mohon segera menjadwalkan pemeriksaan dan pengujian berkala bersama tim ahli K3 kami.\n\nTerima kasih,\nPT Upaya Riksa Daya',
    h14_subject: 'PERINGATAN PENTING: Masa Berlaku Suket K3 Berakhir dalam 14 Hari (H-14)',
    h14_message: 'PENTING: Yth. Bagian K3 {COMPANY_NAME},\n\nMasa berlaku Suket K3 unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) tersisa 14 hari lagi s/d {VALID_UNTIL}.\n\nSilakan konfirmasi jadwal riksa uji perpanjangan agar operasional tidak terhenti.\n\nPT Upaya Riksa Daya',
    h7_subject: 'PERINGATAN MENDESAK: Masa Berlaku Suket K3 Berakhir dalam 7 Hari (H-7)',
    h7_message: 'MENDESAK: Yth. Bagian K3 {COMPANY_NAME},\n\nMasa berlaku Suket K3 unit {OBJECT_NAME} (No. Seri: {SERIAL_NUMBER}) akan berakhir dalam 7 HARI ({VALID_UNTIL}).\n\nHubungi tim marketing kami segera untuk penerbitan SPK/PO perpanjangan.\n\nPT Upaya Riksa Daya'
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

  const setSubTab = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('tab');
      next.set('subtab', id);
      return next;
    });
    setFeedback(null);
  };

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
      if (s.document_templates?.value) {
        setDocTemplatesForm((prev) => ({ ...prev, ...s.document_templates.value }));
      }
      if (s.calibration_tools?.value?.items) {
        setCalibrationTools(s.calibration_tools.value.items);
      }
      if (s.whatsapp_gateway?.value) {
        setWaForm((prev) => ({ ...prev, ...s.whatsapp_gateway.value }));
      }
      if (s.smtp_configuration?.value) {
        setSmtpForm((prev) => ({ ...prev, ...s.smtp_configuration.value }));
      }
      if (s.reminder_templates?.value) {
        setReminderForm((prev) => ({ ...prev, ...s.reminder_templates.value }));
      }

      setChecklistsData(ckRes.data);
      if (ckRes.data?.categories?.length > 0) {
        setSelectedCategory((prev) => {
          if (!prev) return ckRes.data.categories[0];
          return ckRes.data.categories.find((c) => c.id === prev.id) || ckRes.data.categories[0];
        });
      }
      setBackups(bkRes.data?.items || []);
    } catch {
      // Abaikan jika ada galat sementara
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
      const key = 'company_profile';
      await api.put(`/system-settings/keys/${key}`, { value: companyForm });
      setFeedback({
        type: 'success',
        message: 'Profil resmi perusahaan berhasil disimpan. Data ini otomatis diterapkan pada seluruh lembar kop dan pengesahan dokumen.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan profil perusahaan.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveNumbering = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('numbering');
      const key = 'auto_numbering';
      await api.put(`/system-settings/keys/${key}`, { value: numberingForm });
      setFeedback({ type: 'success', message: 'Format standar penomoran dokumen berhasil diperbarui.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan format penomoran.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveDocTemplates = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('doc_templates');
      const key = 'document_templates';
      await api.put(`/system-settings/keys/${key}`, { value: docTemplatesForm });
      setFeedback({
        type: 'success',
        message: 'Standar template & klausul dasar hukum dokumen resmi PJK3 berhasil diperbarui.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan standar template dokumen.'
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
      const [waRes, smtpRes] = await Promise.all([
        api.put(`/system-settings/keys/${waKey}`, { value: waForm }),
        api.put(`/system-settings/keys/${smtpKey}`, { value: smtpForm })
      ]);
      if (waRes.data?.setting?.value) {
        setWaForm((prev) => ({ ...prev, ...waRes.data.setting.value }));
      }
      if (smtpRes.data?.setting?.value) {
        setSmtpForm((prev) => ({ ...prev, ...smtpRes.data.setting.value }));
      }
      setFeedback({
        type: 'success',
        message: 'Konfigurasi WhatsApp Gateway & Email SMTP berhasil disimpan.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan konfigurasi gateway.'
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveReminderTemplates = async (e) => {
    e.preventDefault();
    try {
      setSavingKey('reminders');
      const key = 'reminder_templates';
      await api.put(`/system-settings/keys/${key}`, { value: reminderForm });
      setFeedback({
        type: 'success',
        message: 'Template naskah pengingat berkala H-30, H-14, dan H-7 berhasil disimpan.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan template pengingat.'
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
        message: res.data.message || 'Uji koneksi SMTP email berhasil terhubung.'
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
        message: res.data.message || 'Uji koneksi WhatsApp gateway berhasil.'
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

  const refreshChecklists = async () => {
    const ckRes = await api.get('/system-settings/checklists');
    setChecklistsData(ckRes.data);
    if (ckRes.data?.categories?.length > 0) {
      setSelectedCategory((prev) => {
        if (!prev) return ckRes.data.categories[0];
        return ckRes.data.categories.find((c) => c.id === prev.id) || ckRes.data.categories[0];
      });
    }
  };

  const handleSaveChecklistItem = async (e) => {
    e.preventDefault();
    if (!checklistItemModal) return;
    try {
      setSavingItem(true);
      let res;
      if (checklistItemModal.mode === 'create') {
        res = await api.post('/system-settings/checklists/items', {
          version_id: selectedCategory?.active_version_id,
          section: itemForm.section,
          label: itemForm.label,
          input_type: itemForm.input_type,
          unit: itemForm.unit || null,
          min_value: itemForm.min_value !== '' ? Number(itemForm.min_value) : null,
          max_value: itemForm.max_value !== '' ? Number(itemForm.max_value) : null,
          is_required: Boolean(itemForm.is_required)
        });
      } else {
        res = await api.put(`/system-settings/checklists/items/${checklistItemModal.item.id}`, {
          section: itemForm.section,
          label: itemForm.label,
          input_type: itemForm.input_type,
          unit: itemForm.unit || null,
          min_value: itemForm.min_value !== '' ? Number(itemForm.min_value) : null,
          max_value: itemForm.max_value !== '' ? Number(itemForm.max_value) : null,
          is_required: Boolean(itemForm.is_required)
        });
      }
      setFeedback({
        type: 'success',
        message: res.data?.message || 'Butir pertanyaan ceklis berhasil disimpan.'
      });
      setChecklistItemModal(null);
      await refreshChecklists();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan butir checklist.'
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      const res = await api.post('/system-settings/backups');
      setFeedback({
        type: 'success',
        message: res.data?.message || `Snapshot backup ${res.data?.backup?.filename} berhasil dibuat dan diamankan.`
      });
      const bkRes = await api.get('/system-settings/backups');
      setBackups(bkRes.data?.items || []);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal membuat snapshot backup database.'
      });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleVerifyBackup = async (backup) => {
    try {
      setVerifyingBackupId(backup.id);
      const res = await api.post(`/system-settings/backups/${backup.id}/verify`);
      setFeedback({
        type: 'success',
        message: res.data?.message || `Integritas arsip ${backup.filename} terverifikasi valid.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Gagal memverifikasi integritas file backup.'
      });
    } finally {
      setVerifyingBackupId(null);
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
      setFeedback({ type: 'error', message: 'Gagal mengunduh file arsip snapshot database.' });
    }
  };

  const subtabs = [
    { id: 'company_profile', label: 'Profil Lembaga PJK3', icon: Buildings },
    { id: 'checklists', label: 'Dynamic Checklist Pemeriksaan', icon: ListChecks },
    { id: 'equipment_master', label: 'Katalog Klasifikasi Alat (3 Level)', icon: Cube },
    { id: 'lhpp_templates', label: 'Template Dokumen LHPP', icon: FileText },
    { id: 'numbering', label: 'Format Nomor & Template Dokumen', icon: FileText },
    { id: 'gateways', label: 'Gateway WA & SMTP Email', icon: Bell },
    { id: 'reminders', label: 'Template Naskah Pengingat', icon: Alarm },
    { id: 'backups', label: 'Cadangan Database & Recovery', icon: Database },
    { id: 'system_info', label: 'Integritas Sistem & Lingkungan', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6">
      {/* Sub Tabs Navigasi Super Admin — Apple Segmented Control */}
      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08] overflow-x-auto max-w-full scrollbar-none">
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-semibold rounded-[9px] transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-[#1C1E26] text-[#1D1D1F] dark:text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]'
                  : 'text-[#6E6E73] dark:text-slate-400 hover:text-[#1D1D1F] dark:hover:text-slate-100'
              }`}
            >
              <Icon size={15} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-[#C81E1E] dark:text-rose-400' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Profil Lembaga PJK3 */}
      {activeSubTab === 'company_profile' && (
        <CompanyProfileSection
          companyForm={companyForm}
          setCompanyForm={setCompanyForm}
          handleSaveCompanyProfile={handleSaveCompanyProfile}
          savingKey={savingKey}
        />
      )}

      {/* 2. Dynamic Checklist Builder (Per Nama Alat) */}
      {activeSubTab === 'checklists' && (
        <ChecklistBuilderSection />
      )}

      {/* 3. Master Data Alat & Kalibrasi */}
      {activeSubTab === 'equipment_master' && (
        <EquipmentMasterSection
          categories={checklistsData?.categories || []}
          calibrationTools={calibrationTools}
          onRefreshData={fetchOverview}
          onFeedback={(msg) => setFeedback({ type: 'success', message: msg })}
          onError={(msg) => setFeedback({ type: 'error', message: msg })}
        />
      )}

      {/* 4. Engine Template Dokumen LHPP (Multi-Domain) */}
      {activeSubTab === 'lhpp_templates' && (
        <LhppTemplatesSection />
      )}

      {/* 5. Format Nomor Surat Otomatis & Template Dokumen Resmi */}
      {activeSubTab === 'numbering' && (
        <DocumentNumberingSection
          numberingForm={numberingForm}
          setNumberingForm={setNumberingForm}
          handleSaveNumbering={handleSaveNumbering}
          docTemplatesForm={docTemplatesForm}
          setDocTemplatesForm={setDocTemplatesForm}
          handleSaveDocTemplates={handleSaveDocTemplates}
          savingKey={savingKey}
        />
      )}

      {/* 5. WhatsApp & Email Gateway */}
      {activeSubTab === 'gateways' && (
        <GatewaysSection
          waForm={waForm}
          setWaForm={setWaForm}
          smtpForm={smtpForm}
          setSmtpForm={setSmtpForm}
          handleSaveGateways={handleSaveGateways}
          savingKey={savingKey}
          handleTestWhatsApp={handleTestWhatsApp}
          handleTestEmail={handleTestEmail}
          testingConnection={testingConnection}
        />
      )}

      {/* 6. Template Naskah Pengingat */}
      {activeSubTab === 'reminders' && (
        <ReminderTemplatesSection
          reminderForm={reminderForm}
          setReminderForm={setReminderForm}
          handleSaveReminderTemplates={handleSaveReminderTemplates}
          savingKey={savingKey}
        />
      )}

      {/* 7. Pencadangan Database & Recovery */}
      {activeSubTab === 'backups' && (
        <DatabaseBackupsSection
          backups={backups}
          creatingBackup={creatingBackup}
          handleCreateBackup={handleCreateBackup}
          handleDownloadBackup={handleDownloadBackup}
          handleVerifyBackup={handleVerifyBackup}
          verifyingId={verifyingBackupId}
        />
      )}

      {/* 8. Informasi Integritas Sistem & Lingkungan */}
      {activeSubTab === 'system_info' && (
        <SystemInfoSection systemOverview={systemOverview} />
      )}

      {/* Modal Tambah / Edit Checklist Item */}
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
                Kelompok / Bagian (Section) *
              </label>
              <input
                type="text"
                required
                value={itemForm.section}
                onChange={(e) => setItemForm({ ...itemForm, section: e.target.value })}
                placeholder="Contoh: Pemeriksaan Visual, Uji Beban, Sistem Pengaman"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Teks Pertanyaan / Item Pemeriksaan *
              </label>
              <textarea
                rows={2}
                required
                value={itemForm.label}
                onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                placeholder="Deskripsi spesifik item yang harus diperiksa Inspector..."
                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus:border-[#C81E1E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tipe Jawaban (Input Type) *
                </label>
                <select
                  value={itemForm.input_type}
                  onChange={(e) => setItemForm({ ...itemForm, input_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-semibold focus:border-[#C81E1E] focus:outline-none"
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
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
                    className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 font-mono focus:border-[#C81E1E] focus:outline-none"
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
                className="h-4 w-4 rounded text-[#C81E1E]"
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
