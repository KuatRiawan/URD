import { useEffect, useState } from 'react';
import {
  CalendarPlus,
  Check,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  FileCsv,
  FileText,
  Info,
  Pencil,
  Plus,
  UploadSimple,
  UserCheck,
  Warning,
  X,
  XCircle
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../../lib/utils/format.js';
import { STATUS_TONE, UNIT_STATUS_LABELS } from '../orderConstants.js';
import { InspectionActivitiesSection } from './InspectionActivitiesSection.jsx';

export function OrderDetailModal({
  open,
  onClose,
  activeOrder,
  detailData,
  unitProgress,
  nextStatuses,
  canManage,
  canManageSchedule: propCanManageSchedule,
  canManageStatus: propCanManageStatus,
  user,
  inspectors,
  categories = [],
  clients: _clients = [],
  scheduleConflicts,
  scheduleForm,
  setScheduleForm,
  selectedInspectorIds,
  setSelectedInspectorIds,
  statusNote,
  setStatusNote,
  rejectReason,
  setRejectReason,
  submitting,
  error,
  setError,
  handleOpenCsvImport,
  handleDownloadAssignmentPdf,
  handleDownloadBastPdf,
  handleDownloadUnitPdf,
  handleSaveSchedule,
  handleAssignInspectors,
  handleRespondAssignment,
  handleStatusChange,
  checkConflicts,
  handleUpdateOrder,
  handleAddUnitsToOrder,
  handleUploadPoAttachment,
  handleUpdateOrderUnit,
  openOrderDetail
}) {
  const [activeTab, setActiveTab] = useState('UNITS');
  const canManageSchedule = propCanManageSchedule ?? ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const canManageStatus = propCanManageStatus ?? ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [editingPo, setEditingPo] = useState(false);
  const [poForm, setPoForm] = useState({
    poNumber: '',
    poDate: '',
    validFrom: '',
    validUntil: '',
    serviceType: 'PEMERIKSAAN_BERKALA',
    source: 'DOKUMEN_PO',
    requestedDate: '',
    notes: ''
  });

  const [addingUnits, setAddingUnits] = useState(false);
  const [addUnitMode, setAddUnitMode] = useState('INLINE'); // 'INLINE' | 'EXISTING'
  const [clientEquipments, setClientEquipments] = useState([]);
  const [selectedEquipIds, setSelectedEquipIds] = useState([]);
  const [loadingEquip, setLoadingEquip] = useState(false);
  const [inlineUnit, setInlineUnit] = useState({
    categoryId: 1,
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    capacity: '',
    installLocation: '',
    quantity: 1,
    unitNotes: ''
  });

  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editUnitForm, setEditUnitForm] = useState({
    proposedDate: '',
    unitNotes: ''
  });

  useEffect(() => {
    if (activeOrder) {
      setPoForm({
        poNumber: activeOrder.po_number || '',
        poDate: activeOrder.po_date ? new Date(activeOrder.po_date).toISOString().slice(0, 10) : '',
        validFrom: activeOrder.valid_from ? new Date(activeOrder.valid_from).toISOString().slice(0, 10) : '',
        validUntil: activeOrder.valid_until ? new Date(activeOrder.valid_until).toISOString().slice(0, 10) : '',
        serviceType: activeOrder.service_type || 'PEMERIKSAAN_BERKALA',
        source: activeOrder.source || 'DOKUMEN_PO',
        requestedDate: activeOrder.requested_date ? new Date(activeOrder.requested_date).toISOString().slice(0, 10) : '',
        notes: activeOrder.notes || ''
      });
    }
  }, [activeOrder]);

  useEffect(() => {
    if (addingUnits && addUnitMode === 'EXISTING' && activeOrder?.client_id) {
      setLoadingEquip(true);
      api
        .get(`/clients/${activeOrder.client_id}/equipment-history`)
        .then((res) => {
          const allItems = res.data?.items || [];
          const existingObjIds = new Set((detailData?.objects || []).map((o) => o.id));
          setClientEquipments(allItems.filter((eq) => !existingObjIds.has(eq.id)));
        })
        .catch(() => {
          api
            .get('/objects', { params: { clientId: activeOrder.client_id, limit: 100 } })
            .then((res2) => {
              const allItems = res2.data?.items || [];
              const existingObjIds = new Set((detailData?.objects || []).map((o) => o.id));
              setClientEquipments(allItems.filter((eq) => !existingObjIds.has(eq.id)));
            })
            .catch(() => setClientEquipments([]));
        })
        .finally(() => setLoadingEquip(false));
    }
  }, [addingUnits, addUnitMode, activeOrder?.client_id, detailData?.objects]);

  const handlePoFormSubmit = async (e) => {
    e.preventDefault();
    if (!handleUpdateOrder || !activeOrder?.id) return;
    try {
      await handleUpdateOrder(activeOrder.id, poForm);
      setEditingPo(false);
    } catch {
      // error handled by hook
    }
  };

  const handleAddUnitsSubmit = async (e) => {
    e.preventDefault();
    if (!handleAddUnitsToOrder || !activeOrder?.id) return;
    try {
      if (addUnitMode === 'EXISTING') {
        if (selectedEquipIds.length === 0) {
          setError('Pilih minimal 1 unit alat klien yang ingin ditambahkan.');
          return;
        }
        const unitsPayload = selectedEquipIds.map((objId) => ({ objectId: objId, quantity: 1 }));
        await handleAddUnitsToOrder(activeOrder.id, unitsPayload);
        setSelectedEquipIds([]);
      } else {
        if (!inlineUnit.name?.trim()) {
          setError('Nama jenis alat wajib diisi.');
          return;
        }
        await handleAddUnitsToOrder(activeOrder.id, [inlineUnit]);
        setInlineUnit({
          categoryId: categories[0]?.id || 1,
          name: '',
          brand: '',
          model: '',
          serialNumber: '',
          capacity: '',
          installLocation: '',
          quantity: 1,
          unitNotes: ''
        });
      }
      setAddingUnits(false);
    } catch {
      // error handled by hook
    }
  };

  const handleSaveUnitRow = async (objectId) => {
    if (!handleUpdateOrderUnit || !activeOrder?.id) return;
    try {
      await handleUpdateOrderUnit(activeOrder.id, objectId, {
        proposedDate: editUnitForm.proposedDate || null,
        unitNotes: editUnitForm.unitNotes || null
      });
      setEditingUnitId(null);
    } catch {
      // error handled by hook
    }
  };

  const totalUnits = unitProgress?.totalUnits || (detailData?.objects || []).length || 0;
  const completedUnits = unitProgress?.completed || 0;
  const progressPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;
  const hasAssignments = (detailData?.assignments || activeOrder?.assignments || []).length > 0;
  const isCompleted = activeOrder?.status === 'SELESAI';

  const titleText = activeOrder
    ? activeOrder.po_number?.toUpperCase().startsWith('PO')
      ? `Detail ${activeOrder.po_number}`
      : `Detail PO ${activeOrder.po_number || activeOrder.order_no}`
    : 'Detail PO';

  const subtitleText = activeOrder
    ? `${activeOrder.client_name} · ${SERVICE_TYPE_LABELS[activeOrder.service_type] || activeOrder.service_type}`
    : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleText}
      subtitle={subtitleText}
      size="xl"
    >
      {activeOrder && (
        <div className="space-y-4 text-sm">
          {error && <ErrorBanner message={error} onRetry={() => setError('')} />}

          {/* Segmented Control Navigasi Tab Gaya Native Mobile */}
          {(canManage ||
            ['AHLI_K3', 'INSPECTOR', 'PIMPINAN', 'MANAGER'].includes(user?.role) ||
            (nextStatuses || []).length > 0) && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('UNITS')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'UNITS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Unit &amp; Dokumen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ACTIVITIES')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'ACTIVITIES'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Aktivitas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SCHEDULE')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'SCHEDULE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Jadwal &amp; Tim K3
              </button>
              {(nextStatuses?.length > 0 || user?.role === 'AHLI_K3') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'STATUS'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Status PO
                </button>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: UNIT & DOKUMEN (Default & Ringkas Tanpa Slop)      */}
          {/* ======================================================== */}
          {activeTab === 'UNITS' && (
            <div className="space-y-4">
              {/* Kartu Hero Informasi PO */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 block">
                      Order: {activeOrder.order_no}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Tgl PO: {formatDate(activeOrder.po_date || activeOrder.requested_date)}
                    </span>
                    {(activeOrder.valid_from || activeOrder.valid_until) && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                        Masa berlaku PO: {formatDate(activeOrder.valid_from)} – {formatDate(activeOrder.valid_until)}
                      </span>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[activeOrder.status] || 'neutral'}>
                    {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                  </Badge>
                </div>

                {/* Tombol Aksi Dokumen PO Tingkat Atas */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                  {hasAssignments && (
                    <button
                      type="button"
                      onClick={() => handleDownloadAssignmentPdf(activeOrder.id, activeOrder.order_no)}
                      className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <DownloadSimple size={14} />
                      <span>Surat Tugas</span>
                    </button>
                  )}

                  {isCompleted && handleDownloadBastPdf && (
                    <button
                      type="button"
                      onClick={() => handleDownloadBastPdf(activeOrder.id, activeOrder.po_number, activeOrder.order_no)}
                      className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                    >
                      <DownloadSimple size={14} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Cetak BAST</span>
                    </button>
                  )}

                  {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditingPo(!editingPo)}
                        className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                        <span>{editingPo ? 'Tutup Edit PO' : 'Ubah Data PO'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCsvImport(activeOrder.id)}
                        className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <FileCsv size={14} />
                        <span>Impor Unit CSV</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Form Ubah Rincian PO */}
              {editingPo && (
                <form
                  onSubmit={handlePoFormSubmit}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 p-4 space-y-3.5"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Pencil size={14} className="text-[#C81E1E]" />
                      <span>Ubah Rincian Purchase Order</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingPo(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Nomor PO Klien *
                      </label>
                      <input
                        type="text"
                        required
                        value={poForm.poNumber}
                        onChange={(e) => setPoForm({ ...poForm, poNumber: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Tanggal Dokumen PO
                      </label>
                      <input
                        type="date"
                        value={poForm.poDate}
                        onChange={(e) => setPoForm({ ...poForm, poDate: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        PO Berlaku Mulai
                      </label>
                      <input
                        type="date"
                        value={poForm.validFrom}
                        onChange={(e) => setPoForm({ ...poForm, validFrom: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        PO Berlaku Sampai (maks. 1 tahun)
                      </label>
                      <input
                        type="date"
                        value={poForm.validUntil}
                        onChange={(e) => setPoForm({ ...poForm, validUntil: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Jenis Layanan Pemeriksaan *
                      </label>
                      <select
                        value={poForm.serviceType}
                        onChange={(e) => setPoForm({ ...poForm, serviceType: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="PEMERIKSAAN_PERTAMA">Pemeriksaan Pertama (Alat Baru)</option>
                        <option value="PEMERIKSAAN_BERKALA">Pemeriksaan Berkala (Rutin)</option>
                        <option value="PERPANJANGAN">Perpanjangan Suket K3</option>
                        <option value="PEMERIKSAAN_ULANG">Pemeriksaan Ulang / Re-audit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Sumber Order *
                      </label>
                      <select
                        value={poForm.source}
                        onChange={(e) => setPoForm({ ...poForm, source: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                      >
                        <option value="DOKUMEN_PO">Dokumen PO Resmi</option>
                        <option value="EMAIL">Email Penawaran</option>
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="TELEPON">Telepon</option>
                        <option value="LANGSUNG">Kunjungan Langsung</option>
                        <option value="LAINNYA">Lainnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Target Tanggal Riksa Diminta
                      </label>
                      <input
                        type="date"
                        value={poForm.requestedDate}
                        onChange={(e) => setPoForm({ ...poForm, requestedDate: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                        Catatan Khusus PO
                      </label>
                      <input
                        type="text"
                        value={poForm.notes}
                        onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                        placeholder="Contoh: APD lengkap wajib, gerbang timur..."
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setEditingPo(false)}
                      className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="h-8 px-4 rounded-lg bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Menyimpan...' : 'Simpan Perubahan PO'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lampiran Dokumen PO Resmi */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Lampiran Dokumen PO Resmi
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {detailData?.order?.po_attachment_name || activeOrder.po_attachment_name || 'Belum ada berkas PO yang diunggah'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(detailData?.order?.po_attachment_id || activeOrder.po_attachment_id) && (
                    <a
                      href={`/api/v1/files/${detailData?.order?.po_attachment_id || activeOrder.po_attachment_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <DownloadSimple size={13} />
                      <span>Unduh Berkas</span>
                    </a>
                  )}
                  {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                    <label className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                      <UploadSimple size={13} />
                      <span>{detailData?.order?.po_attachment_id || activeOrder.po_attachment_id ? 'Ganti Berkas' : 'Unggah Berkas PO'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f && handleUploadPoAttachment) {
                            handleUploadPoAttachment(activeOrder.id, f, 'Lampiran Dokumen PO');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Ringkasan Progres Bersih Bergaya Native (Tanpa 6 Kotak Nol) */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Progres Penyelesaian Unit
                  </span>
                  <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                    {completedUnits} / {totalUnits} Selesai ({progressPercent}%)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#C81E1E]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Pill Status Aktif (Hanya yang memiliki nilai > 0) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {unitProgress?.unscheduled > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                      {unitProgress.unscheduled} Belum Jadwal
                    </span>
                  )}
                  {unitProgress?.scheduled > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                      {unitProgress.scheduled} Terjadwal
                    </span>
                  )}
                  {unitProgress?.inspecting > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                      {unitProgress.inspecting} Sedang Uji
                    </span>
                  )}
                  {unitProgress?.waitingDocs > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                      {unitProgress.waitingDocs} Menunggu Dokumen
                    </span>
                  )}
                  {unitProgress?.completed > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                      {unitProgress.completed} Selesai
                    </span>
                  )}
                </div>
              </div>

              {/* Daftar Unit Alat pada PO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ClipboardText size={16} className="text-[#C81E1E]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Daftar Unit Alat ({(detailData?.objects || []).length} Unit)
                    </h4>
                  </div>
                  {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                    <button
                      type="button"
                      onClick={() => setAddingUnits(!addingUnits)}
                      className="h-8 px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] cursor-pointer shadow-2xs transition-colors"
                    >
                      <Plus size={14} weight="bold" />
                      <span>{addingUnits ? 'Tutup Form Unit' : 'Tambah Unit Alat'}</span>
                    </button>
                  )}
                </div>

                {/* Form Tambah Unit Alat ke PO Berjalan */}
                {addingUnits && (
                  <form
                    onSubmit={handleAddUnitsSubmit}
                    className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3.5 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-rose-900/40">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAddUnitMode('INLINE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            addUnitMode === 'INLINE'
                              ? 'bg-[#C81E1E] text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Daftar Unit Baru
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddUnitMode('EXISTING')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            addUnitMode === 'EXISTING'
                              ? 'bg-[#C81E1E] text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Pilih Unit Klien Terdaftar
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAddingUnits(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {addUnitMode === 'INLINE' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Bidang / Kategori Alat *
                          </label>
                          <select
                            value={inlineUnit.categoryId}
                            onChange={(e) =>
                              setInlineUnit({ ...inlineUnit, categoryId: Number(e.target.value) })
                            }
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 cursor-pointer"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.code} - {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Nama / Jenis Alat *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Overhead Crane 10 Ton"
                            value={inlineUnit.name}
                            onChange={(e) => setInlineUnit({ ...inlineUnit, name: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Nomor Seri (Serial Number)
                          </label>
                          <input
                            type="text"
                            placeholder="Kosongkan jika auto-generate"
                            value={inlineUnit.serialNumber}
                            onChange={(e) =>
                              setInlineUnit({ ...inlineUnit, serialNumber: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 font-mono text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Kapasitas / Kapasitas Kerja
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 10 Ton / 500 kVA"
                            value={inlineUnit.capacity}
                            onChange={(e) => setInlineUnit({ ...inlineUnit, capacity: e.target.value })}
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Lokasi Pemasangan / Area Pabrik
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: Bay 2 Workshop Utama"
                            value={inlineUnit.installLocation}
                            onChange={(e) =>
                              setInlineUnit({ ...inlineUnit, installLocation: e.target.value })
                            }
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                            Jumlah Unit
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={inlineUnit.quantity}
                            onChange={(e) =>
                              setInlineUnit({ ...inlineUnit, quantity: Number(e.target.value) || 1 })
                            }
                            className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {loadingEquip ? (
                          <p className="text-[11px] text-slate-500 italic py-2">
                            Memuat daftar unit alat klien...
                          </p>
                        ) : clientEquipments.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-2">
                            Tidak ada unit alat klien lain yang belum masuk ke PO ini.
                          </p>
                        ) : (
                          <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                            {clientEquipments.map((eq) => {
                              const checked = selectedEquipIds.includes(eq.id);
                              return (
                                <label
                                  key={eq.id}
                                  className="flex items-center gap-2.5 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setSelectedEquipIds((prev) =>
                                        checked ? prev.filter((id) => id !== eq.id) : [...prev, eq.id]
                                      );
                                    }}
                                    className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 dark:text-white">
                                        {eq.name}
                                      </span>
                                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-semibold">
                                        {eq.category_code}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono">
                                      SN: {eq.serial_number || '-'} · Kapasitas: {eq.capacity || '-'}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-100 dark:border-rose-900/40">
                      <button
                        type="button"
                        onClick={() => setAddingUnits(false)}
                        className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="h-8 px-4 rounded-lg bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        {submitting ? 'Menyimpan...' : 'Simpan Unit ke PO'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2.5">
                  {(detailData?.objects || []).map((obj) => (
                    <div
                      key={obj.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {obj.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400 font-bold text-[11px] border border-rose-200/60 dark:border-rose-900/40">
                              {obj.category_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            SN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{obj.serial_number}</span> ·
                            Kapasitas: {obj.capacity || '-'}
                          </p>
                          {obj.install_location && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Lokasi: {obj.install_location}
                            </p>
                          )}
                          {obj.proposed_date && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                              Target Usulan Riksa: {formatDate(obj.proposed_date)}
                            </p>
                          )}
                          {obj.unit_notes && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              Catatan: {obj.unit_notes}
                            </p>
                          )}
                        </div>
                        <Badge
                          tone={
                            ['LHPP_TERBIT', 'SELESAI'].includes(obj.unit_status)
                              ? 'success'
                              : obj.unit_status === 'PERLU_REVISI'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {UNIT_STATUS_LABELS[obj.unit_status] || obj.unit_status}
                        </Badge>
                      </div>

                      {/* Form Edit Usulan Jadwal & Catatan Unit */}
                      {editingUnitId === obj.id ? (
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-2.5 text-xs">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            Ubah Target Jadwal &amp; Catatan Unit
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                Target Usulan Riksa
                              </label>
                              <input
                                type="date"
                                value={editUnitForm.proposedDate}
                                onChange={(e) =>
                                  setEditUnitForm({ ...editUnitForm, proposedDate: e.target.value })
                                }
                                className="w-full h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                Catatan Unit
                              </label>
                              <input
                                type="text"
                                value={editUnitForm.unitNotes}
                                onChange={(e) =>
                                  setEditUnitForm({ ...editUnitForm, unitNotes: e.target.value })
                                }
                                placeholder="Catatan teknis alat..."
                                className="w-full h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingUnitId(null)}
                              className="h-7 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => handleSaveUnitRow(obj.id)}
                              className="h-7 px-3 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616]"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {/* Baris Dokumen Unduhan & Aksi Unit */}
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {obj.bap_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadUnitPdf(
                                  `/bap/${obj.bap_id}/pdf`,
                                  `${(obj.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <DownloadSimple size={13} weight="bold" />
                              <span>Unduh BAP</span>
                            </button>
                          )}
                          {obj.lhpp_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadUnitPdf(
                                  `/lhpp/${obj.lhpp_id}/pdf`,
                                  `${(obj.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <DownloadSimple size={13} weight="bold" />
                              <span>Unduh LHPP</span>
                            </button>
                          )}
                        </div>

                        {(canManage || user?.role === 'AHLI_K3') && editingUnitId !== obj.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUnitId(obj.id);
                              setEditUnitForm({
                                proposedDate: obj.proposed_date ? new Date(obj.proposed_date).toISOString().slice(0, 10) : '',
                                unitNotes: obj.unit_notes || ''
                              });
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                          >
                            <Pencil size={12} />
                            <span>Ubah Usulan/Catatan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB: AKTIVITAS PEMERIKSAAN PER UNIT                      */}
          {/* ======================================================== */}
          {activeTab === 'ACTIVITIES' && (
            <InspectionActivitiesSection
              order={activeOrder}
              units={detailData?.objects || []}
              activities={detailData?.activities || []}
              inspectors={inspectors}
              user={user}
              onReload={() => openOrderDetail?.(activeOrder.id)}
            />
          )}

          {/* ======================================================== */}
          {/* TAB 2: JADWAL & TIM K3                                   */}
          {/* ======================================================== */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-4">
              {canManageSchedule && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Formulir Pengaturan Jadwal */}
                  <form
                    onSubmit={handleSaveSchedule}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CalendarPlus size={16} />
                      <span>Atur Jadwal Pemeriksaan</span>
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Waktu Mulai *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.startAt}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, startAt: e.target.value }))
                        }
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Waktu Selesai *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.endAt}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, endAt: e.target.value }))
                        }
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    {detailData?.schedule && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">
                          Alasan Penjadwalan Ulang (Wajib bila mengubah jadwal)
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.reason}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({ ...prev, reason: e.target.value }))
                          }
                          placeholder="Alasan perubahan jadwal..."
                          className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Catatan Lokasi/Akses</label>
                      <input
                        type="text"
                        value={scheduleForm.notes}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Instruksi APD atau gerbang pabrik..."
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-9 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer shadow-2xs"
                    >
                      Simpan Jadwal Inspeksi
                    </button>
                  </form>

                  {/* Formulir Penugasan Ahli K3 */}
                  <form
                    onSubmit={handleAssignInspectors}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck size={16} />
                      <span>Tugaskan Ahli K3 Sesuai Bidang</span>
                    </h4>

                    {scheduleConflicts.length > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                          <Warning size={15} weight="bold" />
                          <span>Peringatan Potensi Konflik Jadwal:</span>
                        </div>
                        {scheduleConflicts.map((c, i) => (
                          <p key={i}>
                            {c.inspector_name} telah terjadwal pada order <strong>{c.order_no}</strong> rentang {formatDateTime(c.start_at)} - {formatDateTime(c.end_at)}.
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {inspectors.map((insp) => {
                        const checked = selectedInspectorIds.includes(insp.id);
                        const validCodes = (insp.competencies || [])
                          .filter((c) => c.isValid)
                          .map((c) => c.categoryCode)
                          .join(', ');
                        return (
                          <label
                            key={insp.id}
                            className="flex items-start gap-2.5 p-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? selectedInspectorIds.filter((id) => id !== insp.id)
                                  : [...selectedInspectorIds, insp.id];
                                setSelectedInspectorIds(next);
                                if (scheduleForm.startAt && scheduleForm.endAt) {
                                  checkConflicts(next, scheduleForm.startAt, scheduleForm.endAt, detailData?.order?.id);
                                }
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#C81E1E]"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{insp.fullName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                SKP Aktif: {validCodes || 'Belum ada kompetensi aktif'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || selectedInspectorIds.length === 0}
                      className="w-full min-h-10 rounded-xl bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
                    >
                      Simpan Penugasan Ahli K3
                    </button>
                  </form>
                </div>
              )}
              {!canManageSchedule && (
                <div className="space-y-4">
                  {user?.role === 'MARKETING' && (
                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5 shadow-2xs">
                      <Info size={18} weight="bold" className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <div className="space-y-1">
                        <span className="font-bold">Mode Pemantauan Jadwal &amp; Ahli K3</span>
                        <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                          Sesuai SOP PT Upaya Riksa Daya, penetapan jadwal resmi inspeksi dan penugasan Ahli K3 berlisensi SKP Kemnaker dikelola oleh <strong>Admin Kantor</strong>. Tim Marketing dapat memantau kesiapan tim dan progres jadwal pada panel di bawah ini.
                        </p>
                      </div>
                    </div>
                  )}
                  {['PIMPINAN', 'MANAGER'].includes(user?.role) && (
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5 shadow-2xs">
                      <Info size={18} weight="bold" className="shrink-0 mt-0.5 text-[#C81E1E]" />
                      <div className="space-y-1">
                        <span className="font-bold">Mode Pengawasan Manajemen (Monitoring)</span>
                        <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                          Penetapan jadwal resmi inspeksi dan penugasan Ahli K3 berlisensi SKP Kemnaker dikelola oleh <strong>Admin Kantor</strong>. Pimpinan memantau beban penugasan, kesiapan teknis tim, dan target tanggal pemeriksaan.
                        </p>
                      </div>
                    </div>
                  )}
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Jadwal Pemeriksaan Lapangan
                    </h4>
                    {detailData?.schedule ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {formatDateTime(detailData.schedule.start_at)} sampai {formatDateTime(detailData.schedule.end_at)}
                        </p>
                        {detailData.schedule.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">Catatan Khusus: {detailData.schedule.notes}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Jadwal rinci belum ditetapkan oleh Admin Kantor. Target permintaan klien: <strong>{formatDate(activeOrder.requested_date)}</strong>.
                      </p>
                    )}
                  </section>
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Penugasan Ahli K3 (Inspector)
                    </h4>
                    {(detailData?.assignments || []).length ? (
                      <div className="space-y-1.5">
                        {detailData.assignments.map((assignment) => (
                          <div key={assignment.id} className="text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                            <span className="font-bold">{assignment.full_name}</span>
                            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 font-semibold">
                              {assignment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-400">Menunggu verifikasi SKP dan penugasan oleh Admin Kantor.</p>
                    )}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                      <div className="text-[11px] font-bold uppercase text-slate-500 mb-1">Status Alokasi per Unit Alat:</div>
                      {(detailData?.objects || []).map((object) => (
                        <p key={object.order_object_id} className="text-xs text-slate-700 dark:text-slate-300">
                          • {object.name} · {object.unit_inspector_name || 'Belum ditugaskan'} · {object.proposed_date ? formatDate(object.proposed_date) : 'Belum dijadwalkan'}
                        </p>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STATUS PO & WORKFLOW                              */}
          {/* ======================================================== */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              {/* Konfirmasi Penugasan oleh Ahli K3 */}
              {user?.role === 'AHLI_K3' && (detailData?.assignments || []).length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Konfirmasi Penugasan Anda
                  </h4>
                  {(detailData?.assignments || [])
                    .filter((asg) => asg.inspector_id === user.id)
                    .map((asg) => (
                      <div key={asg.id} className="space-y-2">
                        <p className="text-xs text-slate-800 dark:text-slate-200">
                          Status Konfirmasi Saat Ini: <strong className="font-bold">{asg.status}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondAssignment(asg.id, 'DITERIMA')}
                            className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            <CheckCircle size={15} />
                            <span>Terima Penugasan</span>
                          </button>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Alasan jika menolak..."
                            className="min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleRespondAssignment(asg.id, 'DITOLAK')}
                            className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            <XCircle size={15} />
                            <span>Tolak Penugasan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Transisi Status Order */}
              {canManageStatus && nextStatuses?.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Perbarui Status Tahapan PO
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Catatan perubahan status (opsional)..."
                      className="flex-1 min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={submitting}
                          onClick={() => handleStatusChange(st)}
                          className={`min-h-10 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer ${
                            st === 'DIBATALKAN'
                              ? 'bg-red-700 hover:bg-red-800'
                              : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'
                          }`}
                        >
                          Ubah ke: {ORDER_STATUS_LABELS[st] || st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!canManageStatus && (
                <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Riwayat Status PO
                  </h4>
                  {(detailData?.history || []).length ? (
                    detailData.history.map((entry) => (
                      <p key={entry.id} className="text-xs text-slate-700 dark:text-slate-300">
                        {formatDateTime(entry.created_at)} · {entry.from_status || 'Order dibuat'} → {ORDER_STATUS_LABELS[entry.to_status] || entry.to_status}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400">Belum ada riwayat perubahan status.</p>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Riwayat revisi PO</h4>
                {(detailData?.revisions || []).length ? (
                  <ol className="mt-3 space-y-3">
                    {detailData.revisions.map((revision) => (
                      <li key={revision.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Versi {revision.version} · {revision.reason}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(revision.created_at)} · {revision.actor_name || 'Sistem'} · {(revision.snapshot?.units || []).length} unit pada snapshot</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Belum ada snapshot revisi untuk PO ini.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
