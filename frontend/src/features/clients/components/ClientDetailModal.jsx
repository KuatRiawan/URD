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
  FilePlus,
  MapPin,
  Pencil,
  PhoneCall,
  Plus,
  ShareNetwork,
  Star,
  Trash,
  User,
  UsersThree,
  Warning
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { Badge, statusTone } from '../../../components/ui/Badge.jsx';
import { formatDate, formatRelativeTime, ORDER_STATUS_LABELS } from '../../../lib/utils/format.js';

export function ClientDetailModal({
  detailData,
  onClose,
  canEdit,
  subFeedback,
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
      size="xl"
    >
      <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        {subFeedback && <Notice tone="success">{subFeedback}</Notice>}

        {/* Tab Navigasi Workspace Klien */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`min-h-10 px-3.5 py-2 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PROFILE'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Buildings size={16} />
            <span>Profil &amp; Catatan Internal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PICS_LOCATIONS')}
            className={`min-h-10 px-3.5 py-2 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'PICS_LOCATIONS'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UsersThree size={16} />
            <span>Multi-PIC ({contacts.length}) &amp; Site ({locations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('EQUIPMENT')}
            className={`min-h-10 px-3.5 py-2 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'EQUIPMENT'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cube size={16} />
            <span>Inventaris Alat K3 ({objects.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`min-h-10 px-3.5 py-2 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ORDERS'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase size={16} />
            <span>Riwayat PO ({orders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`min-h-10 px-3.5 py-2 rounded-t-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'AUDIT'
                ? 'bg-white dark:bg-slate-900 border-b-2 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={16} />
            <span>Riwayat Perubahan ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: Profil Perusahaan, Catatan Internal & Akses Portal Klien */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Nama Perusahaan</span>
                <p className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{client.name}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">NPWP:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {client.npwp || 'Belum diisi'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Bidang Usaha:</span>
                  <span className="text-slate-800 dark:text-slate-200">{client.industry || '-'}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Kontak Resmi Perusahaan</span>
                <p className="text-slate-800 dark:text-slate-200 mt-0.5">
                  Telepon: <span className="font-bold">{client.phone || '-'}</span>
                </p>
                <p className="text-slate-800 dark:text-slate-200">
                  Email: <span className="font-bold">{client.email || '-'}</span>
                </p>
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Alamat Kantor Utama:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{client.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Catatan Internal Marketing */}
            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Briefcase size={15} weight="bold" />
                <span>Catatan Khusus Internal Marketing &amp; Operasional</span>
              </span>
              <p className="text-xs text-amber-900/90 dark:text-amber-200 leading-relaxed whitespace-pre-wrap">
                {client.internal_notes || 'Belum ada catatan internal yang ditambahkan untuk klien ini.'}
              </p>
            </div>

            {/* Tautan Portal Klien Berproteksi Token */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ShareNetwork size={16} className="text-[#C81E1E]" weight="bold" />
                    <span>Portal Baca Khusus Klien (Client Self-Service Portal)</span>
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
                    className="shrink-0 h-9 px-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    {portalLoading ? 'Memproses...' : 'Tautan Akses Baru'}
                  </button>
                )}
              </div>

              {portalUrl && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    readOnly
                    value={portalUrl}
                    className="flex-1 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-700 dark:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={onCopyPortalUrl}
                    className="min-h-9 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#C81E1E] font-bold text-white hover:bg-red-800 cursor-pointer"
                  >
                    {portalCopied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                    <span>{portalCopied ? 'Tersalin' : 'Salin Tautan'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Multi-PIC & Lokasi Pabrik/Site */}
        {activeTab === 'PICS_LOCATIONS' && (
          <div className="space-y-5">
            {/* Bagian Multi-PIC */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <UsersThree size={18} className="text-[#C81E1E]" weight="bold" />
                    <span>Daftar Person In Charge (PIC) Klien ({contacts.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Satu perusahaan dapat memiliki beberapa PIC. Tetapkan PIC utama dan PIC penerima pengingat perpanjangan.
                  </p>
                </div>
              </div>

              {contacts.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                  Belum ada kontak PIC terdaftar untuk perusahaan ini. Tambahkan kontak pertama pada form di bawah.
                </p>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {contacts.map((ct) => (
                    <div key={ct.id} className="p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {ct.name}
                            </span>
                            {ct.is_primary && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 text-[10px] font-extrabold">
                                <Star size={11} weight="fill" />
                                <span>PIC Utama</span>
                              </span>
                            )}
                            {ct.is_reminder_recipient && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 text-[10px] font-extrabold">
                                <BellRinging size={11} weight="fill" />
                                <span>Penerima Reminder K3</span>
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
                                title="Jadikan PIC Utama Perusahaan"
                                className="min-h-8 px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                Set PIC Utama
                              </button>
                            )}
                            {!ct.is_reminder_recipient && ct.is_active && onSetReminderRecipientContact && (
                              <button
                                type="button"
                                onClick={() => onSetReminderRecipientContact(ct.id)}
                                title="Jadikan Penerima Notifikasi Reminder WhatsApp/Email"
                                className="min-h-8 px-2.5 py-1 rounded border border-amber-300 dark:border-amber-700 text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                              >
                                Set Penerima Reminder
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditPic(ct)}
                              className="min-h-8 p-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 cursor-pointer"
                              title="Ubah data PIC"
                            >
                              <Pencil size={14} />
                            </button>
                            {onDeleteContact && (
                              <button
                                type="button"
                                onClick={() => onDeleteContact(ct.id)}
                                className="min-h-8 p-1.5 rounded border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                title="Hapus / Nonaktifkan PIC"
                              >
                                <Trash size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Kontak Saluran PIC */}
                      <div className="flex items-center gap-4 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-mono">
                          WhatsApp / HP: <strong className="text-slate-900 dark:text-white">{ct.phone || '-'}</strong>
                        </span>
                        <span>
                          Email: <strong className="text-slate-900 dark:text-white">{ct.email || '-'}</strong>
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
                  className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-4 border border-slate-200 dark:border-slate-700"
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
                        value={picForm.name}
                        onChange={(e) => setPicForm({ ...picForm, name: e.target.value })}
                        placeholder="Mis: Bpk. Bambang Sutrisno"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Jabatan PIC</label>
                      <input
                        type="text"
                        value={picForm.position}
                        onChange={(e) => setPicForm({ ...picForm, position: e.target.value })}
                        placeholder="Mis: HSE Manager / Spv K3"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Departemen</label>
                      <input
                        type="text"
                        value={picForm.department || ''}
                        onChange={(e) => setPicForm({ ...picForm, department: e.target.value })}
                        placeholder="Mis: K3 / Maintenance / GA"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">No. WhatsApp / Telepon *</label>
                      <input
                        type="text"
                        required
                        value={picForm.phone}
                        onChange={(e) => setPicForm({ ...picForm, phone: e.target.value })}
                        placeholder="081234567890"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Alamat Email</label>
                      <input
                        type="email"
                        value={picForm.email}
                        onChange={(e) => setPicForm({ ...picForm, email: e.target.value })}
                        placeholder="pic@klien.co.id"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Lokasi / Site Tanggung Jawab</label>
                      <select
                        value={picForm.locationId || ''}
                        onChange={(e) => setPicForm({ ...picForm, locationId: e.target.value })}
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
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
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(picForm.isPrimary)}
                        onChange={(e) => setPicForm({ ...picForm, isPrimary: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                      />
                      <span>Tetapkan sebagai PIC Utama</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(picForm.isReminderRecipient)}
                        onChange={(e) => setPicForm({ ...picForm, isReminderRecipient: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600"
                      />
                      <span>Tetapkan sebagai Penerima Pengingat Berkala (Reminder K3)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a11616] font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    Simpan Kontak PIC
                  </button>
                </form>
              )}

              {/* Form Ubah PIC Inline */}
              {editingPicId && (
                <form
                  onSubmit={handleSubmitEditPic}
                  className="space-y-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 p-4 border border-amber-300 dark:border-amber-800"
                >
                  <p className="font-bold text-amber-900 dark:text-amber-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
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
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Jabatan PIC</label>
                      <input
                        type="text"
                        value={editPicForm.position}
                        onChange={(e) => setEditPicForm({ ...editPicForm, position: e.target.value })}
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Departemen</label>
                      <input
                        type="text"
                        value={editPicForm.department}
                        onChange={(e) => setEditPicForm({ ...editPicForm, department: e.target.value })}
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
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
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-mono text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Email</label>
                      <input
                        type="email"
                        value={editPicForm.email}
                        onChange={(e) => setEditPicForm({ ...editPicForm, email: e.target.value })}
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Lokasi / Site Tanggung Jawab</label>
                      <select
                        value={editPicForm.locationId || ''}
                        onChange={(e) => setEditPicForm({ ...editPicForm, locationId: e.target.value })}
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
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
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editPicForm.isPrimary}
                        onChange={(e) => setEditPicForm({ ...editPicForm, isPrimary: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                      />
                      <span>PIC Utama</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={editPicForm.isReminderRecipient}
                        onChange={(e) => setEditPicForm({ ...editPicForm, isReminderRecipient: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-amber-600"
                      />
                      <span>Penerima Reminder K3</span>
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer text-slate-800 dark:text-slate-200">
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
                      className="min-h-9 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="min-h-9 px-4 py-1.5 rounded-lg bg-[#C81E1E] text-white font-bold hover:bg-[#a11616]"
                    >
                      Perbarui Data PIC
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Bagian Lokasi Cabang / Site Pabrik */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <MapPin size={18} className="text-[#C81E1E]" weight="bold" />
                <span>Daftar Lokasi Pabrik / Site Pelaksanaan Pemeriksaan ({locations.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locations.length === 0 ? (
                  <p className="text-slate-500 italic p-3">Belum ada lokasi site terdaftar.</p>
                ) : (
                  locations.map((loc) => (
                    <div key={loc.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {loc.name} {loc.city ? `(${loc.city})` : ''}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{loc.address}</p>
                    </div>
                  ))
                )}
              </div>

              {canEdit && (
                <form
                  onSubmit={onAddLocation}
                  className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={15} weight="bold" />
                    <span>Tambah Lokasi Pabrik / Site Baru</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        required
                        value={locForm.name}
                        onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                        placeholder="Nama Site / Plant *"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        required
                        value={locForm.address}
                        onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                        placeholder="Alamat Lokasi Site *"
                        className="w-full min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={locForm.city}
                        onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                        placeholder="Kota / Kab"
                        className="flex-1 min-h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a11616] font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        Simpan
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Inventaris Alat K3 Klien */}
        {activeTab === 'EQUIPMENT' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Cube size={18} className="text-[#C81E1E]" weight="bold" />
                  <span>Daftar Unit Alat K3 Terdaftar ({objects.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Meliputi 7 bidang Riksa Uji K3 (PAPA, PUBT, PTP, ILPP, IPK, Elevator/Eskalator, Anchor/Lifeline).
                </p>
              </div>
            </div>

            {/* Filter Alat K3 */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                placeholder="Cari nama alat, no. seri, atau suket..."
                className="flex-1 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
              />
              <select
                value={equipmentCategoryFilter}
                onChange={(e) => setEquipmentCategoryFilter(e.target.value)}
                className="min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-slate-100"
              >
                <option value="ALL">Semua Bidang K3</option>
                <option value="PAA">PAPA (Pesawat Angkat &amp; Angkut)</option>
                <option value="PUBT">PUBT (Bejana Tekan)</option>
                <option value="PTP">PTP (Tenaga &amp; Produksi)</option>
                <option value="ILPP">ILPP (Listrik &amp; Petir)</option>
                <option value="IPK">IPK (Proteksi Kebakaran)</option>
                <option value="ELEVATOR">Elevator &amp; Eskalator</option>
                <option value="ANCHOR">Anchor &amp; Lifeline</option>
              </select>
            </div>

            {filteredObjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <Cube size={32} className="mx-auto mb-1 opacity-50" />
                <p className="text-xs font-bold">Tidak ada unit alat yang cocok.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
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
                        <span>Lokasi Site: <strong>{obj.location_name || obj.install_location || 'Pusat'}</strong></span>
                        {obj.suket_no && (
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            · Suket: {obj.suket_no} (s/d {formatDate(obj.suket_valid_until)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {onCreateRenewalOrder && (
                        <button
                          type="button"
                          onClick={() => onCreateRenewalOrder(obj.id, obj.name)}
                          className="min-h-9 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a11616] cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Plus size={14} weight="bold" />
                          <span>Buat PO Perpanjangan</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Riwayat Purchase Order (PO) */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Briefcase size={18} className="text-[#C81E1E]" weight="bold" />
                <span>Riwayat Transaksi Purchase Order (PO) Klien ({orders.length})</span>
              </h3>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Belum ada riwayat PO yang tercatat untuk klien ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                {orders.map((ord) => (
                  <div key={ord.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
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
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          navigate('/app/orders');
                        }}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Lihat detail PO di modul Order"
                      >
                        <ArrowRight size={14} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Riwayat Perubahan Data (Audit Trail) */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Clock size={18} className="text-slate-500" weight="bold" />
              <span>Audit Trail Perubahan Data Klien ({auditLogs.length})</span>
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
                Belum ada catatan perubahan data.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {log.action.replace(/_/g, ' ')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Oleh: <strong>{log.user_name || 'Sistem'}</strong> ({log.user_role || 'STAFF'}) ·{' '}
                        {typeof log.summary === 'object' ? JSON.stringify(log.summary) : log.summary}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Modal */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Tutup Workspace Klien
          </button>
        </div>
      </div>
    </Modal>
  );
}
