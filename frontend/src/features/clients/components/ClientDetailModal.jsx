import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowRight,
  BellRinging,
  Briefcase,
  Buildings,
  Check,
  CheckCircle,
  Clock,
  Copy,
  Cube,
  MapPin,
  Pencil,
  Plus,
  ShareNetwork,
  Star,
  Trash,
  User,
  UsersThree
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge, statusTone } from '../../../components/ui/Badge.jsx';
import { formatDate, formatRelativeTime, ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';

export function ClientDetailModal({
  detailData,
  portalTokens = [],
  onClose,
  canEdit,
  onOpenEdit,
  portalUrl,
  portalCopied,
  portalLoading,
  onGeneratePortalToken,
  onCopyPortalUrl,
  locForm,
  setLocForm,
  onAddLocation,
  picForm,
  setPicForm,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onSetPrimaryContact,
  onSetReminderRecipientContact,
  onCreateRenewalOrder
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('PROFILE'); // 'PROFILE' | 'PICS_LOCATIONS' | 'EQUIPMENT' | 'ORDERS' | 'AUDIT'
  const [internalPicForm, setInternalPicForm] = useState({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    locationId: '',
    isPrimary: false,
    isReminderRecipient: false,
    notes: ''
  });
  const [internalLocForm, setInternalLocForm] = useState({
    name: '',
    address: '',
    city: ''
  });

  const activePicForm = picForm || internalPicForm;
  const handleUpdatePicForm = setPicForm || setInternalPicForm;

  const activeLocForm = locForm || internalLocForm;
  const handleUpdateLocForm = setLocForm || setInternalLocForm;

  const [editingPicId, setEditingPicId] = useState(null);
  const [editPicForm, setEditPicForm] = useState({
    name: '',
    position: '',
    department: '',
    phone: '',
    email: '',
    locationId: '',
    isPrimary: false,
    isReminderRecipient: false,
    isActive: true,
    notes: ''
  });
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState('ALL');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  if (!detailData) return null;

  const client = detailData.client || {};
  const locations = detailData.locations || [];
  const contacts = detailData.contacts || [];
  const objects = detailData.objects || [];
  const orders = detailData.orders || [];
  const auditLogs = detailData.auditLogs || [];

  const handleStartEditPic = (ct) => {
    setEditingPicId(ct.id);
    setEditPicForm({
      name: ct.name || '',
      position: ct.position || '',
      department: ct.department || '',
      phone: ct.phone || '',
      email: ct.email || '',
      locationId: ct.location_id || '',
      isPrimary: Boolean(ct.is_primary),
      isReminderRecipient: Boolean(ct.is_reminder_recipient),
      isActive: Boolean(ct.is_active),
      notes: ct.notes || ''
    });
  };

  const handleCancelEditPic = () => {
    setEditingPicId(null);
  };

  const handleSubmitEditPic = async (e) => {
    e.preventDefault();
    if (!editingPicId || !onUpdateContact) return;
    await onUpdateContact(editingPicId, editPicForm);
    setEditingPicId(null);
  };

  // Filter unit alat klien
  const filteredObjects = objects.filter((obj) => {
    if (equipmentCategoryFilter !== 'ALL' && obj.category_code !== equipmentCategoryFilter) {
      return false;
    }
    if (equipmentSearch.trim()) {
      const q = equipmentSearch.toLowerCase().trim();
      const match =
        (obj.name && obj.name.toLowerCase().includes(q)) ||
        (obj.serial_number && obj.serial_number.toLowerCase().includes(q)) ||
        (obj.brand && obj.brand.toLowerCase().includes(q)) ||
        (obj.suket_no && obj.suket_no.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <Modal
      open={Boolean(detailData)}
      onClose={onClose}
      title={`Workspace Klien: ${client.name}`}
      subtitle={`${client.industry || 'Mitra Perusahaan'} · ${locations.length} Lokasi Site · ${contacts.length} PIC Terdaftar · ${objects.length} Objek Uji K3`}
      size="xl"
    >
      <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {/* Tab Navigasi Workspace Klien */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Buildings size={15} />
            <span>Profil &amp; Portal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PICS_LOCATIONS')}
            className={`min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PICS_LOCATIONS'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UsersThree size={15} />
            <span>PIC ({contacts.length}) &amp; Site ({locations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENT')}
            className={`min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'EQUIPMENT'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cube size={15} />
            <span>Inventaris Alat ({objects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase size={15} />
            <span>Riwayat PO ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`min-h-9 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock size={15} />
            <span>Aktivitas ({auditLogs.length})</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: Profil Perusahaan, Catatan Internal & Portal Klien */}
        {/* ======================================================== */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4">
            {canEdit && onOpenEdit && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Data master dan identitas hukum klien
                </span>
                <Button
                  variant="outline"
                  size="xs"
                  icon={Pencil}
                  onClick={() => onOpenEdit(client)}
                >
                  Ubah Data Klien
                </Button>
              </div>
            )}
            {/* Kartu Informasi Resmi Perusahaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Nama Resmi Perusahaan</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">{client.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">NPWP:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {client.npwp || 'Belum diisi'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Bidang Industri:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{client.industry || '-'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Kontak Resmi Kantor</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                    Telepon: <strong className="font-semibold">{client.phone || '-'}</strong>
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">
                    Email: <strong className="font-semibold">{client.email || '-'}</strong>
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Alamat Kantor Utama</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">{client.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Catatan Internal Marketing */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Briefcase size={15} className="text-[#C81E1E]" weight="bold" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Catatan Internal Tim Marketing
                </h4>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {client.internal_notes || 'Belum ada catatan internal yang ditambahkan untuk klien ini.'}
              </p>
            </div>

            {/* Portal Klien Berproteksi Token */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <ShareNetwork size={16} className="text-[#C81E1E]" weight="bold" />
                    <span>Portal Self-Service Klien</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tautan terproteksi token agar klien dapat memantau status pemeriksaan unit alat dan mengunduh berkas BAP/LHPP/Suket resmi.
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={onGeneratePortalToken}
                    disabled={portalLoading}
                    className="shrink-0 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
                  >
                    {portalLoading ? 'Memproses...' : 'Generate Tautan Akses'}
                  </button>
                )}
              </div>

              {portalUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1 font-mono text-xs text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={onCopyPortalUrl}
                    className="min-h-9 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-[#C81E1E] font-bold text-white hover:bg-[#a11616] cursor-pointer shadow-2xs transition-colors"
                  >
                    {portalCopied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                    <span>{portalCopied ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              )}

              {Array.isArray(portalTokens) && portalTokens.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Token Akses Portal Terdaftar ({portalTokens.length})
                  </p>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {portalTokens.slice(0, 3).map((t) => (
                      <div key={t.id} className="py-1.5 flex items-center justify-between gap-2 text-[11px]">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{t.label || 'Akses Portal Klien'}</span>
                          <span className="text-slate-500 ml-2">· Berlaku s/d {formatDate(t.expires_at)}</span>
                        </div>
                        <Badge tone={t.is_active ? 'success' : 'neutral'} size="sm">
                          {t.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Multi-PIC & Lokasi Pabrik/Site Operasional        */}
        {/* ======================================================== */}
        {activeTab === 'PICS_LOCATIONS' && (
          <div className="space-y-5">
            {/* Bagian Multi-PIC */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <UsersThree size={18} className="text-[#C81E1E]" weight="bold" />
                    <span>Daftar Person In Charge (PIC) Klien ({contacts.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Satu perusahaan dapat memiliki beberapa PIC. Tetapkan PIC utama dan PIC penerima pengingat perpanjangan.
                  </p>
                </div>
              </div>

              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  Belum ada kontak PIC terdaftar untuk perusahaan ini. Tambahkan kontak pertama pada form di bawah.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  {contacts.map((ct) => (
                    <div key={ct.id} className="p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {ct.name}
                            </span>
                            {ct.is_primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 text-[10px] font-bold">
                                <Star size={11} weight="fill" />
                                <span>PIC Utama</span>
                              </span>
                            )}
                            {ct.is_reminder_recipient && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[10px] font-bold">
                                <BellRinging size={11} weight="fill" />
                                <span>Penerima Reminder Suket</span>
                              </span>
                            )}
                            <Badge tone={ct.is_active ? 'success' : 'danger'}>
                              {ct.is_active ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {ct.position || 'Staf Operasional'}
                            {ct.department ? ` · Dept: ${ct.department}` : ''}
                            {ct.location_name ? ` · Site: ${ct.location_name}` : ''}
                          </p>
                        </div>

                        {/* Aksi PIC */}
                        {canEdit && (
                          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                            {!ct.is_primary && ct.is_active && onSetPrimaryContact && (
                              <button
                                type="button"
                                onClick={() => onSetPrimaryContact(ct.id)}
                                className="min-h-8 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                              >
                                Set PIC Utama
                              </button>
                            )}
                            {!ct.is_reminder_recipient && ct.is_active && onSetReminderRecipientContact && (
                              <button
                                type="button"
                                onClick={() => onSetReminderRecipientContact(ct.id)}
                                className="min-h-8 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 cursor-pointer transition-colors"
                              >
                                Set Penerima Reminder
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditPic(ct)}
                              className="min-h-8 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                              title="Ubah data PIC"
                            >
                              <Pencil size={14} />
                            </button>
                            {onDeleteContact && (
                              <button
                                type="button"
                                onClick={() => onDeleteContact(ct.id)}
                                className="min-h-8 p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                                title="Hapus / Nonaktifkan PIC"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Kontak Saluran PIC */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-mono">
                          WhatsApp/Tel: <strong className="text-slate-800 dark:text-slate-200">{ct.phone || '-'}</strong>
                        </span>
                        <span>
                          Email: <strong className="text-slate-800 dark:text-slate-200">{ct.email || '-'}</strong>
                        </span>
                        {ct.notes && (
                          <span className="italic text-slate-500">Ket: {ct.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Tambah PIC Baru */}
              {canEdit && !editingPicId && (
                <form
                  onSubmit={onAddContact}
                  className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={15} weight="bold" />
                    <span>Tambah Kontak PIC Baru</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Nama Lengkap PIC *</label>
                      <input
                        type="text"
                        required
                        value={activePicForm.name}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, name: e.target.value })}
                        placeholder="Mis: Bpk. Bambang Sutrisno"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Jabatan PIC</label>
                      <input
                        type="text"
                        value={activePicForm.position}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, position: e.target.value })}
                        placeholder="Mis: HSE Manager / Spv K3"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Departemen</label>
                      <input
                        type="text"
                        value={activePicForm.department || ''}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, department: e.target.value })}
                        placeholder="Mis: K3 / Maintenance / GA"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">No. WhatsApp / Telepon *</label>
                      <input
                        type="text"
                        required
                        value={activePicForm.phone}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, phone: e.target.value })}
                        placeholder="081234567890"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Alamat Email</label>
                      <input
                        type="email"
                        value={activePicForm.email}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, email: e.target.value })}
                        placeholder="pic@klien.co.id"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Lokasi / Site Tanggung Jawab</label>
                      <select
                        value={activePicForm.locationId || ''}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, locationId: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Semua Lokasi / Kantor Pusat</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.city ? `(${loc.city})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(activePicForm.isPrimary)}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, isPrimary: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                      />
                      <span>Tetapkan sebagai PIC Utama</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(activePicForm.isReminderRecipient)}
                        onChange={(e) => handleUpdatePicForm({ ...activePicForm, isReminderRecipient: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600"
                      />
                      <span>Tetapkan sebagai Penerima Pengingat Suket K3</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a11616] font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    Simpan Kontak PIC
                  </button>
                </form>
              )}

              {/* Form Ubah PIC Inline */}
              {editingPicId && (
                <form
                  onSubmit={handleSubmitEditPic}
                  className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-300 dark:border-slate-700"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Pencil size={15} weight="bold" />
                    <span>Ubah Data PIC Terdaftar</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Nama Lengkap PIC *</label>
                      <input
                        type="text"
                        required
                        value={editPicForm.name}
                        onChange={(e) => setEditPicForm({ ...editPicForm, name: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Jabatan PIC</label>
                      <input
                        type="text"
                        value={editPicForm.position}
                        onChange={(e) => setEditPicForm({ ...editPicForm, position: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Departemen</label>
                      <input
                        type="text"
                        value={editPicForm.department}
                        onChange={(e) => setEditPicForm({ ...editPicForm, department: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">No. WhatsApp / Telepon *</label>
                      <input
                        type="text"
                        required
                        value={editPicForm.phone}
                        onChange={(e) => setEditPicForm({ ...editPicForm, phone: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        value={editPicForm.email}
                        onChange={(e) => setEditPicForm({ ...editPicForm, email: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Lokasi / Site Tanggung Jawab</label>
                      <select
                        value={editPicForm.locationId || ''}
                        onChange={(e) => setEditPicForm({ ...editPicForm, locationId: e.target.value })}
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Semua Lokasi / Kantor Pusat</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {loc.city ? `(${loc.city})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <label className="flex items-center gap-2 font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editPicForm.isPrimary}
                        onChange={(e) => setEditPicForm({ ...editPicForm, isPrimary: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                      />
                      <span>PIC Utama</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editPicForm.isReminderRecipient}
                        onChange={(e) => setEditPicForm({ ...editPicForm, isReminderRecipient: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600"
                      />
                      <span>Penerima Reminder Suket K3</span>
                    </label>
                    <label className="flex items-center gap-2 font-semibold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editPicForm.isActive}
                        onChange={(e) => setEditPicForm({ ...editPicForm, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                      />
                      <span>Status Aktif</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEditPic}
                      className="min-h-9 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-9 px-4 py-1.5 rounded-lg bg-[#C81E1E] text-white font-bold hover:bg-[#a11616] transition-colors cursor-pointer shadow-2xs"
                    >
                      Perbarui Data PIC
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bagian Lokasi Cabang / Site Pabrik */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin size={18} className="text-[#C81E1E]" weight="bold" />
                <span>Daftar Lokasi Pabrik / Site Pelaksanaan Pemeriksaan ({locations.length})</span>
              </h3>

              {locations.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                  Belum ada lokasi site/pabrik terdaftar.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{loc.name}</span>
                        {loc.city && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {loc.city}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{loc.address}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Form Tambah Lokasi */}
              {canEdit && (
                <form
                  onSubmit={onAddLocation}
                  className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-800 mt-2"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={15} weight="bold" />
                    <span>Tambah Lokasi Site Baru</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">Nama Site / Lokasi *</label>
                      <input
                        type="text"
                        required
                        value={activeLocForm.name}
                        onChange={(e) => handleUpdateLocForm({ ...activeLocForm, name: e.target.value })}
                        placeholder="Contoh: Pabrik Cikarang Bay 3"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Alamat Lengkap Site *</label>
                      <input
                        type="text"
                        required
                        value={activeLocForm.address}
                        onChange={(e) => handleUpdateLocForm({ ...activeLocForm, address: e.target.value })}
                        placeholder="Jl. Industri Selatan No. 10"
                        className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Kota / Kabupaten</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeLocForm.city}
                          onChange={(e) => handleUpdateLocForm({ ...activeLocForm, city: e.target.value })}
                          placeholder="Kab. Bekasi"
                          className="flex-1 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="submit"
                          className="h-9 px-4 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a11616] font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Inventaris Alat K3 Klien                          */}
        {/* ======================================================== */}
        {activeTab === 'EQUIPMENT' && (
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Cube size={18} className="text-[#C81E1E]" weight="bold" />
                  <span>Daftar Unit Alat K3 Terdaftar ({objects.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Meliputi 7 bidang Riksa Uji K3 (PAPA, PUBT, PTP, ILPP, IPK, Elevator/Eskalator, Anchor/Lifeline).
                </p>
              </div>
            </div>

            {/* Filter Alat K3 */}
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="Cari nama alat, nomor seri, atau nomor suket..."
                className="flex-1 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
              />
              <select
                value={equipmentCategoryFilter}
                onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
                className="min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Bidang K3</option>
                <option value="PAA">PAPA (Pesawat Angkat &amp; Angkut)</option>
                <option value="PUBT">PUBT (Bejana Tekan)</option>
                <option value="PTP">PTP (Pesawat Tenaga &amp; Produksi)</option>
                <option value="ILPP">ILPP (Instalasi Listrik &amp; Petir)</option>
                <option value="IPK">IPK (Instalasi Proteksi Kebakaran)</option>
                <option value="ELEVATOR">Elevator &amp; Eskalator</option>
                <option value="ANCHOR">Anchor &amp; Lifeline</option>
              </select>
            </div>

            {filteredObjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <Cube size={28} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold">Tidak ada unit alat yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                {filteredObjects.map((obj) => (
                  <div key={obj.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {obj.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {obj.category_code}
                        </span>
                        {obj.serial_number && (
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 font-semibold">
                            SN: {obj.serial_number}
                          </span>
                        )}
                        {obj.capacity && (
                          <span className="text-xs text-slate-500">· Cap: {obj.capacity}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        <span>Lokasi Site: <strong>{obj.location_name || obj.install_location || 'Kantor Pusat'}</strong></span>
                        {obj.suket_no && (
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            · Suket: {obj.suket_no} (s/d {formatDate(obj.suket_valid_until)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {onCreateRenewalOrder && (
                        <Button
                          type="button"
                          variant="primary"
                          size="xs"
                          icon={Plus}
                          onClick={() => onCreateRenewalOrder(obj.id, obj.name)}
                        >
                          PO Ulang
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: Riwayat Purchase Order (PO)                       */}
        {/* ======================================================== */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase size={18} className="text-[#C81E1E]" weight="bold" />
                <span>Riwayat Transaksi Purchase Order (PO) Klien ({orders.length})</span>
              </h3>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                Belum ada riwayat PO yang tercatat untuk klien ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {ord.po_number || ord.order_no}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">({ord.order_no})</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                          {ord.service_type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Tanggal PO: {formatDate(ord.po_date || ord.created_at)} · {ord.unit_count || 1} Unit Alat
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tone={statusTone(ord.status)}>
                        {ORDER_STATUS_LABELS[ord.status] || ord.status}
                      </Badge>
                      <Button
                        type="button"
                        variant="secondary"
                        size="xs"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() => {
                          onClose();
                          navigate('/app/orders');
                        }}
                        title="Buka detail di modul Order"
                      >
                        Lihat PO
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: Riwayat Perubahan Data (Audit Trail)              */}
        {/* ======================================================== */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3.5">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Clock size={18} className="text-slate-500" weight="bold" />
              <span>Jejak Audit Perubahan Data Klien ({auditLogs.length})</span>
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                Belum ada catatan perubahan data.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Oleh: <strong className="text-slate-700 dark:text-slate-300">{log.user_name || 'Sistem'}</strong> ({log.user_role || 'STAFF'}) ·{' '}
                        {typeof log.summary === 'object' ? JSON.stringify(log.summary) : log.summary}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Modal */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex justify-end">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
          >
            Tutup Workspace Klien
          </Button>
        </div>
      </div>
    </Modal>
  );
}
