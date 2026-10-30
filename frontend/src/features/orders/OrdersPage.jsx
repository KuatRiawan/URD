import { useCallback, useEffect, useState } from 'react';
import {
  CalendarPlus,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  Eye,
  FileCsv,
  FilePdf,
  MagnifyingGlass,
  Plus,
  Trash,
  UserCheck,
  Warning,
  XCircle
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../lib/utils/format.js';

const STATUS_TONE = {
  ORDER_BARU: 'info',
  TERJADWAL: 'info',
  DITUGASKAN: 'warning',
  SEDANG_DIPERIKSA: 'warning',
  MENUNGGU_LAPORAN: 'warning',
  MENUNGGU_REVIEW: 'warning',
  SELESAI: 'success',
  DIBATALKAN: 'danger'
};

const UNIT_STATUS_LABELS = {
  BELUM_DIJADWALKAN: 'Belum Dijadwalkan',
  TERJADWAL: 'Sudah Dijadwalkan',
  DITUGASKAN: 'Ditugaskan ke Inspector',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  FORM_TERKIRIM: 'Form Terkirim',
  BAP_DRAF: 'Draf BAP',
  BAP_FINAL: 'BAP Final',
  LHPP_DRAF: 'Draf LHPP',
  MENUNGGU_REVIEW: 'Menunggu Review LHPP',
  PERLU_REVISI: 'Perlu Revisi',
  DISETUJUI: 'Review Disetujui',
  LHPP_TERBIT: 'LHPP Terbit',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

const ALLOWED_NEXT_STATUS = {
  ORDER_BARU: ['TERJADWAL', 'DIBATALKAN'],
  TERJADWAL: ['DITUGASKAN', 'DIBATALKAN'],
  DITUGASKAN: ['SEDANG_DIPERIKSA', 'TERJADWAL', 'DIBATALKAN'],
  SEDANG_DIPERIKSA: ['MENUNGGU_LAPORAN', 'DIBATALKAN'],
  MENUNGGU_LAPORAN: ['MENUNGGU_REVIEW', 'SEDANG_DIPERIKSA'],
  MENUNGGU_REVIEW: ['SELESAI', 'MENUNGGU_LAPORAN'],
  SELESAI: [],
  DIBATALKAN: []
};

export function OrdersPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inspectors, setInspectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [clientMode, setClientMode] = useState('EXISTING');
  const [clientObjects, setClientObjects] = useState([]);
  const [createForm, setCreateForm] = useState({
    poNumber: '',
    poDate: new Date().toISOString().slice(0, 10),
    clientId: '',
    newClientName: '',
    newClientIndustry: '',
    newClientAddress: '',
    locationName: '',
    locationAddress: '',
    locationCity: '',
    contactName: '',
    contactPosition: 'PIC K3 / HSE',
    contactPhone: '',
    contactEmail: '',
    serviceType: 'PEMERIKSAAN_BERKALA',
    source: 'DOKUMEN_PO',
    requestedDate: new Date().toISOString().slice(0, 10),
    notes: '',
    objectIds: [],
    units: [],
    inspectorIds: []
  });
  const [newUnitRow, setNewUnitRow] = useState({
    categoryId: 1,
    name: '',
    manufacturer: '',
    serialNumber: '',
    capacity: '',
    installLocation: '',
    quantity: 1
  });
  const [submitting, setSubmitting] = useState(false);

  const [detailData, setDetailData] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    startAt: '',
    endAt: '',
    notes: '',
    reason: ''
  });
  const [selectedInspectorIds, setSelectedInspectorIds] = useState([]);
  const [statusNote, setStatusNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fitur 5: Impor CSV Unit
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvTargetOrderId, setCsvTargetOrderId] = useState(null);

  // Fitur 6: Peringatan Bentrok Jadwal
  const [scheduleConflicts, setScheduleConflicts] = useState([]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [ordersRes, clientsRes, inspectorsRes, catsRes] = await Promise.all([
        api.get('/orders', {
          params: { q: q || undefined, status: statusFilter || undefined, limit: 50 }
        }),
        api.get('/clients', { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get('/inspectors').catch(() => ({ data: { items: [] } })),
        api.get('/objects/categories').catch(() => ({ data: { categories: [] } }))
      ]);
      setOrders(ordersRes.data?.items || []);
      setClients(clientsRes.data?.items || []);
      setInspectors(inspectorsRes.data?.items || []);
      setCategories(catsRes.data?.categories || []);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat daftar PO & order pemeriksaan.'
      );
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleClientChange = async (clientId) => {
    setCreateForm((prev) => ({ ...prev, clientId, objectIds: [] }));
    if (!clientId) {
      setClientObjects([]);
      return;
    }
    try {
      const res = await api.get('/objects', { params: { clientId, limit: 100 } });
      setClientObjects(res.data?.items || []);
    } catch {
      setClientObjects([]);
    }
  };

  const toggleObjectSelection = (objId) => {
    setCreateForm((prev) => {
      const exists = prev.objectIds.includes(objId);
      return {
        ...prev,
        objectIds: exists
          ? prev.objectIds.filter((id) => id !== objId)
          : [...prev.objectIds, objId]
      };
    });
  };

  const handleAddInlineUnit = () => {
    if (!newUnitRow.name?.trim()) {
      setError('Nama jenis alat wajib diisi saat menambah unit baru di PO.');
      return;
    }
    const resolvedSerial =
      newUnitRow.serialNumber?.trim() || `SN-PO-${Date.now().toString().slice(-6)}`;
    setError('');
    setCreateForm((prev) => ({
      ...prev,
      units: [
        ...prev.units,
        {
          categoryId: Number(newUnitRow.categoryId || categories[0]?.id || 1),
          name: newUnitRow.name.trim(),
          manufacturer: newUnitRow.manufacturer?.trim() || '',
          serialNumber: resolvedSerial,
          capacity: newUnitRow.capacity?.trim() || '',
          installLocation: newUnitRow.installLocation?.trim() || '',
          quantity: Math.max(1, Number(newUnitRow.quantity || 1))
        }
      ]
    }));
    setNewUnitRow({
      categoryId: newUnitRow.categoryId || categories[0]?.id || 1,
      name: '',
      manufacturer: '',
      serialNumber: '',
      capacity: '',
      installLocation: '',
      quantity: 1
    });
  };

  const removeInlineUnit = (idx) => {
    setCreateForm((prev) => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== idx)
    }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    const pendingUnits = [...createForm.units];
    if (newUnitRow.name?.trim()) {
      pendingUnits.push({
        categoryId: Number(newUnitRow.categoryId || categories[0]?.id || 1),
        name: newUnitRow.name.trim(),
        manufacturer: newUnitRow.manufacturer?.trim() || '',
        serialNumber:
          newUnitRow.serialNumber?.trim() || `SN-PO-${Date.now().toString().slice(-6)}`,
        capacity: newUnitRow.capacity?.trim() || '',
        installLocation:
          newUnitRow.installLocation?.trim() ||
          createForm.locationName?.trim() ||
          createForm.locationAddress?.trim() ||
          '',
        quantity: Math.max(1, Number(newUnitRow.quantity || 1))
      });
    }
    const hasClient =
      (clientMode === 'EXISTING' && Boolean(createForm.clientId)) ||
      (clientMode === 'NEW' && Boolean(createForm.newClientName?.trim()));
    if (!hasClient || (createForm.objectIds.length === 0 && pendingUnits.length === 0)) {
      setError(
        'Pilih klien (atau isi Nama Perusahaan Klien baru) dan daftarkan minimal 1 unit alat K3 pada PO.'
      );
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/orders', {
        poNumber: createForm.poNumber?.trim() || null,
        poDate: createForm.poDate || null,
        clientId: clientMode === 'EXISTING' ? createForm.clientId || null : null,
        newClient:
          clientMode === 'NEW'
            ? {
                name: createForm.newClientName.trim(),
                industry: createForm.newClientIndustry?.trim() || '',
                address: createForm.newClientAddress?.trim() || '',
                phone: createForm.contactPhone?.trim() || '',
                email: createForm.contactEmail?.trim() || ''
              }
            : null,
        newLocation:
          createForm.locationName?.trim() || createForm.locationAddress?.trim()
            ? {
                name: createForm.locationName?.trim() || 'Lokasi Utama Pabrik / Site',
                address: createForm.locationAddress?.trim() || createForm.newClientAddress?.trim() || '',
                city: createForm.locationCity?.trim() || ''
              }
            : null,
        newContact:
          createForm.contactName?.trim() ||
          createForm.contactPhone?.trim() ||
          createForm.contactEmail?.trim()
            ? {
                name: createForm.contactName?.trim() || 'PIC K3 / Operasional',
                position: createForm.contactPosition?.trim() || 'PIC K3 / HSE',
                phone: createForm.contactPhone?.trim() || '',
                email: createForm.contactEmail?.trim() || ''
              }
            : null,
        serviceType: createForm.serviceType,
        source: createForm.source,
        requestedDate: createForm.requestedDate || null,
        notes: createForm.notes?.trim() || '',
        objectIds: createForm.objectIds,
        units: pendingUnits,
        inspectorIds: createForm.inspectorIds
      });
      setCreateOpen(false);
      setClientMode('EXISTING');
      setCreateForm({
        poNumber: '',
        poDate: new Date().toISOString().slice(0, 10),
        clientId: '',
        newClientName: '',
        newClientIndustry: '',
        newClientAddress: '',
        locationName: '',
        locationAddress: '',
        locationCity: '',
        contactName: '',
        contactPosition: 'PIC K3 / HSE',
        contactPhone: '',
        contactEmail: '',
        serviceType: 'PEMERIKSAAN_BERKALA',
        source: 'DOKUMEN_PO',
        requestedDate: new Date().toISOString().slice(0, 10),
        notes: '',
        objectIds: [],
        units: [],
        inspectorIds: []
      });
      setNewUnitRow({
        categoryId: categories[0]?.id || 1,
        name: '',
        manufacturer: '',
        serialNumber: '',
        capacity: '',
        installLocation: '',
        quantity: 1
      });
      setFeedback(
        'Purchase Order (PO), data klien/lokasi/PIC, dan daftar unit pemeriksaan berhasil disimpan sekaligus.'
      );
      await loadOrders();
    } catch (err) {
      const apiMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        (err.response?.data?.error?.details?.length
          ? err.response.data.error.details.map((d) => d.message).join(', ')
          : null) ||
        'Gagal menyimpan PO pemeriksaan.';
      setError(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const openOrderDetail = async (orderId) => {
    setError('');
    try {
      const res = await api.get(`/orders/${orderId}`);
      const data = res.data;
      setDetailData(data);
      const startIso = data.schedule?.start_at
        ? new Date(data.schedule.start_at).toISOString().slice(0, 16)
        : new Date(Date.now() + 86400000).toISOString().slice(0, 16);
      const endIso = data.schedule?.end_at
        ? new Date(data.schedule.end_at).toISOString().slice(0, 16)
        : new Date(Date.now() + 86400000 + 4 * 3600000).toISOString().slice(0, 16);
      setScheduleForm({
        startAt: startIso,
        endAt: endIso,
        notes: data.schedule?.notes || '',
        reason: ''
      });
      setSelectedInspectorIds((data.assignments || []).map((a) => a.inspector_id));
      setDetailOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat detail PO pemeriksaan.'
      );
    }
  };

  const checkConflicts = async (inspectorIds, startAt, endAt, excludeOrderId) => {
    if (!inspectorIds.length || !startAt || !endAt) {
      setScheduleConflicts([]);
      return;
    }
    try {
      const allConflicts = [];
      for (const id of inspectorIds) {
        const res = await api.get('/schedules/conflicts', {
          params: { inspectorId: id, startAt, endAt, excludeOrderId }
        });
        if (res.data?.hasConflict && res.data?.conflicts?.length) {
          allConflicts.push(...res.data.conflicts);
        }
      }
      setScheduleConflicts(allConflicts);
    } catch (err) {
      setScheduleConflicts([]);
      toast(
        err.response?.data?.error?.message || 'Pemeriksaan konflik jadwal gagal. Coba kembali.',
        'error'
      );
    }
  };

  const handleOpenCsvImport = (orderId = null) => {
    setCsvTargetOrderId(orderId);
    setCsvText(
      'KODE_KATEGORI,NAMA_UNIT,MEREK,MODEL,NOMOR_SERI,TAHUN,KAPASITAS,LOKASI_PASANG,CATATAN\n' +
      'PAA,Overhead Crane 10T,Demag,DR-10,CRANE-01,2022,10 Ton,Workshop Utama,Pemeriksaan Berkala\n' +
      'PTP,Forklift Diesel 3T,Toyota,8FD30,FL-02,2021,3 Ton,Gudang Logistik,Pemeriksaan Rutin'
    );
    setCsvModalOpen(true);
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      if (csvTargetOrderId) {
        // Impor ke PO yang sudah ada
        const res = await api.post(`/orders/${csvTargetOrderId}/import-units-csv`, { csvText });
        setFeedback(`Berhasil mengimpor ${res.data.count || res.data.importedCount} unit ke PO.`);
        await openOrderDetail(csvTargetOrderId);
      } else {
        // Impor ke Form Buat PO Baru
        const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setError('Data CSV harus memiliki header dan minimal 1 baris unit.');
          setSubmitting(false);
          return;
        }
        const catMap = Object.fromEntries(categories.map((c) => [c.code.toUpperCase(), c.id]));
        const newUnits = [];
        for (let i = 1; i < lines.length; i += 1) {
          const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const [catCode, name, brand, model, serialNo, year, cap, loc, notes] = cols;
          const catId = catMap[(catCode || '').toUpperCase()] || 1;
          if (name && serialNo) {
            newUnits.push({
              categoryId: catId,
              name,
              brand: brand || '',
              model: model || '',
              serialNumber: serialNo,
              manufactureYear: year ? Number(year) : null,
              capacity: cap || '',
              installLocation: loc || '',
              quantity: 1,
              notes: notes || ''
            });
          }
        }
        setCreateForm((prev) => ({ ...prev, units: [...prev.units, ...newUnits] }));
        setFeedback(`Berhasil menambahkan ${newUnits.length} unit alat dari CSV ke formulir PO.`);
      }
      setCsvModalOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengimpor unit dari CSV.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!detailData?.order) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/orders/${detailData.order.id}/schedule`, {
        startAt: new Date(scheduleForm.startAt).toISOString(),
        endAt: new Date(scheduleForm.endAt).toISOString(),
        notes: scheduleForm.notes,
        reason: scheduleForm.reason
      });
      setFeedback('Jadwal inspeksi PO berhasil disimpan.');
      await openOrderDetail(detailData.order.id);
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menyimpan jadwal inspeksi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignInspectors = async (e) => {
    e.preventDefault();
    if (!detailData?.order || selectedInspectorIds.length === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/orders/${detailData.order.id}/assignments`, {
        inspectorIds: selectedInspectorIds
      });
      setFeedback('Penugasan Ahli K3 berhasil diperbarui.');
      await openOrderDetail(detailData.order.id);
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menugaskan Ahli K3.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondAssignment = async (assignmentId, decision) => {
    if (!detailData?.order) return;
    if (decision === 'DITOLAK' && !rejectReason.trim()) {
      setError('Alasan penolakan wajib diisi.');
      return;
    }
    if (decision === 'DITOLAK') {
      const ok = await confirm({
        title: 'Tolak Penugasan',
        message: 'Penugasan akan dikembalikan ke antrean penjadwalan Admin beserta alasan penolakan Anda. Lanjutkan?',
        confirmLabel: 'Ya, Tolak Penugasan',
        tone: 'danger'
      });
      if (!ok) return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/orders/${detailData.order.id}/assignments/${assignmentId}/respond`, {
        decision,
        rejectReason: decision === 'DITOLAK' ? rejectReason : ''
      });
      setRejectReason('');
      setFeedback(`Penugasan berhasil dikonfirmasi (${decision}).`);
      await openOrderDetail(detailData.order.id);
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal merespons penugasan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!detailData?.order) return;
    if (nextStatus === 'DIBATALKAN') {
      const ok = await confirm({
        title: 'Batalkan PO',
        message: 'PO yang dibatalkan tidak dapat dilanjutkan kembali. Pastikan pembatalan ini sudah disetujui.',
        confirmLabel: 'Ya, Batalkan PO',
        tone: 'danger'
      });
      if (!ok) return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/orders/${detailData.order.id}/status`, {
        status: nextStatus,
        note: statusNote || `Perubahan status ke ${ORDER_STATUS_LABELS[nextStatus] || nextStatus}`
      });
      setStatusNote('');
      setFeedback(
        `Status order diperbarui ke ${ORDER_STATUS_LABELS[nextStatus] || nextStatus}.`
      );
      await openOrderDetail(detailData.order.id);
      await loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memperbarui status order.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadAssignmentPdf = async (orderId, orderNo) => {
    try {
      const res = await api.get(`/orders/${orderId}/assignment-letter.pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Surat-Tugas-${orderNo.replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengunduh PDF Surat Tugas.'
      );
    }
  };

  const handleDownloadBatchBapPdf = async (orderId, poNumber) => {
    try {
      const res = await api.get(`/bap/order/${orderId}/batch-pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAP-PO-${(poNumber || orderId).replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          'Belum ada BAP pada PO ini untuk dicetak secara gabungan.'
      );
    }
  };

  const handleDownloadUnitPdf = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengunduh dokumen PDF.'
      );
    }
  };

  const activeOrder = detailData?.order;
  const unitProgress = detailData?.unitProgress || activeOrder?.unitProgress || {
    totalUnits: 0,
    unscheduled: 0,
    scheduled: 0,
    inspecting: 0,
    waitingDocs: 0,
    completed: 0,
    canCompletePo: false
  };
  const nextStatuses = activeOrder ? ALLOWED_NEXT_STATUS[activeOrder.status] || [] : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="PO & Order Pemeriksaan Riksa Uji K3"
        subtitle="Kelola Purchase Order (PO) multi-unit dari klien, penjadwalan lapangan, penugasan Ahli K3, dan pemantauan progres BAP serta LHPP setiap unit."
        actions={
          canManage && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              <Plus size={16} weight="bold" />
              <span>Buat PO / Order Baru</span>
            </button>
          )
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadOrders} />}

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor PO, nomor order, atau nama klien..."
            className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#475569] dark:focus:border-slate-500 focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter Status Order"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="">Semua Status PO</option>
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label="Memuat daftar PO & order pemeriksaan..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada PO pemeriksaan"
          description="Purchase Order (PO) pemeriksaan riksa uji K3 yang terdaftar akan tampil di halaman ini."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4">Nomor PO &amp; Order</th>
                  <th className="py-3 px-4">Perusahaan Klien</th>
                  <th className="py-3 px-4">Jenis Layanan</th>
                  <th className="py-3 px-4">Progres Unit Alat</th>
                  <th className="py-3 px-4">Ahli K3 Ditugaskan</th>
                  <th className="py-3 px-4">Status PO</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {orders.map((order) => {
                  const prog = order.unitProgress || {};
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        <div className="text-[#C81E1E] dark:text-red-400">{order.po_number || order.order_no}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Order: {order.order_no}</div>
                        <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                          Tgl PO: {formatDate(order.po_date || order.requested_date)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {order.client_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <div>{SERVICE_TYPE_LABELS[order.service_type] || order.service_type}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">Sumber: {order.source}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {prog.completed || 0} / {prog.totalUnits || order.object_count || 0} Unit Selesai
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {order.start_at ? formatDateTime(order.start_at) : 'Belum dijadwalkan'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {(order.assignments || []).length === 0 ? (
                          <span className="text-slate-400 dark:text-slate-500">Belum ditugaskan</span>
                        ) : (
                          <div className="space-y-1">
                            {(order.assignments || []).map((asg) => (
                              <div key={asg.id} className="flex items-center gap-1.5">
                                <span className="font-medium text-slate-900 dark:text-slate-100">{asg.fullName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {asg.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={STATUS_TONE[order.status] || 'neutral'}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openOrderDetail(order.id)}
                            className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Eye size={15} />
                            <span>Kelola PO</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadAssignmentPdf(order.id, order.order_no)}
                            title="Unduh Surat Tugas PDF"
                            className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-700 dark:border-slate-600 bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                          >
                            <DownloadSimple size={15} />
                            <span>Surat Tugas</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Buat PO & Order Multi-Unit */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Buat Purchase Order (PO) & Daftarkan Unit Alat K3"
        size="xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-5 text-slate-800 dark:text-slate-200">
          {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nomor PO Pelanggan
              </label>
              <input
                type="text"
                value={createForm.poNumber}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, poNumber: e.target.value }))}
                placeholder="Contoh: PO-URD-2026-001"
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Tanggal PO *
              </label>
              <input
                type="date"
                required
                value={createForm.poDate}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, poDate: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Perusahaan Klien *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setClientMode((prev) => (prev === 'EXISTING' ? 'NEW' : 'EXISTING'));
                    setError('');
                  }}
                  className="text-[11px] font-bold text-[#C81E1E] dark:text-red-400 hover:underline"
                >
                  {clientMode === 'EXISTING'
                    ? '+ Input Klien Baru Sekaligus'
                    : 'Pilih dari Klien Terdaftar'}
                </button>
              </div>
              {clientMode === 'EXISTING' ? (
                <select
                  value={createForm.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                >
                  <option value="">Pilih Klien Terdaftar...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={createForm.newClientName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, newClientName: e.target.value }))
                  }
                  placeholder="Ketik Nama Perusahaan Klien Baru *"
                  className="w-full min-h-11 rounded-md border border-[#C81E1E] bg-red-50/20 dark:bg-red-950/20 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Jenis Layanan Riksa Uji *
              </label>
              <select
                value={createForm.serviceType}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, serviceType: e.target.value }))
                }
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                {Object.entries(SERVICE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Sumber Permohonan *
              </label>
              <select
                value={createForm.source}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, source: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
              >
                <option value="DOKUMEN_PO">Dokumen PO Resmi</option>
                <option value="EMAIL">Email Resmi</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="TELEPON">Telepon Kantor</option>
                <option value="LANGSUNG">Kunjungan Langsung</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Target Tanggal Pemeriksaan
              </label>
              <input
                type="date"
                value={createForm.requestedDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, requestedDate: e.target.value }))
                }
                className="w-full min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Bagian Terpadu: Data Klien Baru, Lokasi Pabrik/Site & Kontak PIC (Seamless All-in-One) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                Data Lokasi Pelaksanaan & Kontak PIC Klien (Untuk Jadwal & Reminder WA/Email)
              </span>
              <span className="text-[11px] text-slate-500">
                Isi langsung di sini tanpa perlu pindah halaman
              </span>
            </div>

            {clientMode === 'NEW' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                    Bidang Industri Klien Baru
                  </label>
                  <input
                    type="text"
                    value={createForm.newClientIndustry}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, newClientIndustry: e.target.value }))
                    }
                    placeholder="Contoh: Manufaktur, Konstruksi, Logistik..."
                    className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                    Alamat Kantor / Perusahaan Klien
                  </label>
                  <input
                    type="text"
                    value={createForm.newClientAddress}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, newClientAddress: e.target.value }))
                    }
                    placeholder="Alamat lengkap perusahaan..."
                    className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  Nama Lokasi / Pabrik / Site
                </label>
                <input
                  type="text"
                  value={createForm.locationName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, locationName: e.target.value }))
                  }
                  placeholder="Mis: Plant Cikarang / Workshop A"
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  Alamat Lokasi Pemeriksaan
                </label>
                <input
                  type="text"
                  value={createForm.locationAddress}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, locationAddress: e.target.value }))
                  }
                  placeholder="Jl. Industri Raya No..."
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  Kota / Kabupaten Lokasi
                </label>
                <input
                  type="text"
                  value={createForm.locationCity}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, locationCity: e.target.value }))
                  }
                  placeholder="Mis: Bekasi / Karawang"
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  Nama Kontak PIC Klien
                </label>
                <input
                  type="text"
                  value={createForm.contactName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, contactName: e.target.value }))
                  }
                  placeholder="Mis: Bpk. Hendra (HSE)"
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  No. WhatsApp / Telepon PIC
                </label>
                <input
                  type="text"
                  value={createForm.contactPhone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, contactPhone: e.target.value }))
                  }
                  placeholder="Mis: 081234567890"
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#0F172A] mb-1">
                  Email PIC / Perusahaan
                </label>
                <input
                  type="email"
                  value={createForm.contactEmail}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, contactEmail: e.target.value }))
                  }
                  placeholder="Mis: hse@perusahaan.co.id"
                  className="w-full min-h-10 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Opsi 1: Pilih dari Unit Klien yang Sudah Terdaftar */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              1. Pilih dari Unit Alat Klien yang Sudah Terdaftar ({createForm.objectIds.length} dipilih)
            </label>
            {!createForm.clientId ? (
              <p className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-md p-3">
                Pilih perusahaan klien terlebih dahulu untuk menampilkan daftar unit yang sudah terdaftar.
              </p>
            ) : clientObjects.length === 0 ? (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3">
                Klien ini belum memiliki unit terdaftar sebelumnya. Anda dapat langsung menambahkan unit baru di bawah.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-300 rounded-md divide-y divide-slate-200">
                {clientObjects.map((obj) => (
                  <label
                    key={obj.id}
                    className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={createForm.objectIds.includes(obj.id)}
                      onChange={() => toggleObjectSelection(obj.id)}
                      className="h-4 w-4 rounded border-slate-300 text-[#C81E1E]"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-[#0F172A]">{obj.name}</span>
                      <span className="ml-2 text-slate-500 font-mono">({obj.serial_number})</span>
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">
                        {obj.category_code}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Opsi 2: Tambah Unit Baru Langsung di dalam PO (Mendukung Multi-Unit & Kuantitas > 1) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-[#0F172A]">
                2. Tambah Unit Alat Baru Langsung ke dalam PO (Kuantitas &gt; 1 otomatis dipecah per unit)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCsvImport(null)}
                  className="min-h-8 inline-flex items-center gap-1 rounded bg-slate-200 hover:bg-slate-300 px-2.5 py-1 text-[11px] font-bold text-[#0F172A]"
                >
                  <FileCsv size={14} weight="bold" />
                  <span>Impor CSV Unit</span>
                </button>
                <span className="text-xs font-semibold text-[#C81E1E]">
                  {createForm.units.length} baris unit baru
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <select
                value={newUnitRow.categoryId}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, categoryId: Number(e.target.value) })}
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.code} - {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newUnitRow.name}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, name: e.target.value })}
                placeholder="Nama Alat (mis. Overhead Crane)"
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newUnitRow.serialNumber}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, serialNumber: e.target.value })}
                placeholder="Nomor Seri (opsional)"
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
              />
              <input
                type="text"
                value={newUnitRow.capacity}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, capacity: e.target.value })}
                placeholder="Kapasitas (mis. 10 Ton)"
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={newUnitRow.installLocation}
                onChange={(e) => setNewUnitRow({ ...newUnitRow, installLocation: e.target.value })}
                placeholder="Lokasi Area Pabrik"
                className="px-2.5 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newUnitRow.quantity}
                  onChange={(e) => setNewUnitRow({ ...newUnitRow, quantity: Number(e.target.value) })}
                  title="Jumlah Unit"
                  className="w-16 px-2 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-center font-bold"
                />
                <button
                  type="button"
                  onClick={handleAddInlineUnit}
                  className="flex-1 px-3 py-2 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded"
                >
                  + Unit
                </button>
              </div>
            </div>

            {createForm.units.length > 0 && (
              <div className="space-y-1.5 pt-2">
                {createForm.units.map((u, idx) => (
                  <div
                    key={`${u.serialNumber}-${idx}`}
                    className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{u.name}</span> · SN:{' '}
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{u.serialNumber}</span> · Kapasitas:{' '}
                      {u.capacity || '-'} · Lokasi: {u.installLocation || '-'} ·{' '}
                      <strong className="text-[#C81E1E]">{u.quantity} Unit</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInlineUnit(idx)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              3. Tugaskan Inspector / Ahli K3 Langsung (Opsional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {inspectors.map((insp) => {
                const checked = createForm.inspectorIds.includes(insp.id);
                const validCodes = (insp.competencies || [])
                  .filter((c) => c.isValid)
                  .map((c) => c.categoryCode)
                  .join(', ');
                return (
                  <label
                    key={insp.id}
                    className={`flex items-start gap-2 p-2.5 rounded border text-xs cursor-pointer ${
                      checked
                        ? 'border-[#C81E1E] bg-red-50/40 dark:bg-red-950/40'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setCreateForm((prev) => ({
                          ...prev,
                          inspectorIds: checked
                            ? prev.inspectorIds.filter((id) => id !== insp.id)
                            : [...prev.inspectorIds, insp.id]
                        }))
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#C81E1E]"
                    />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{insp.fullName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        SKP: {validCodes || 'Aktif'}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Catatan PO / Detail Pekerjaan & Instruksi Pelaksanaan
            </label>
            <textarea
              rows={2}
              value={createForm.notes}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan ruang lingkup pemeriksaan atau instruksi lokasi..."
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
            >
              {submitting ? 'Menyimpan PO...' : 'Simpan PO & Daftar Unit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Pengelolaan PO */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          activeOrder
            ? `Detail PO ${activeOrder.po_number || activeOrder.order_no} (${activeOrder.client_name})`
            : 'Detail PO'
        }
        size="xl"
      >
        {activeOrder && (
          <div className="space-y-6 text-sm">
            {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
            {/* Header Status & Tombol Dokumen PO */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-md border border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nomor Order: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{activeOrder.order_no}</span> ·
                  Tanggal PO: {formatDate(activeOrder.po_date || activeOrder.requested_date)}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={STATUS_TONE[activeOrder.status] || 'neutral'}>
                    {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {SERVICE_TYPE_LABELS[activeOrder.service_type]}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                  <button
                    type="button"
                    onClick={() => handleOpenCsvImport(activeOrder.id)}
                    className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-slate-200 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700"
                  >
                    <FileCsv size={16} weight="bold" />
                    <span>Tambah Unit via CSV</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadBatchBapPdf(
                      activeOrder.id,
                      activeOrder.po_number || activeOrder.order_no
                    )
                  }
                  className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-red-800"
                >
                  <FilePdf size={16} weight="bold" />
                  <span>Cetak Gabungan BAP 1 PO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAssignmentPdf(activeOrder.id, activeOrder.order_no)}
                  className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-slate-800 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                >
                  <DownloadSimple size={16} />
                  <span>Unduh Surat Tugas (PDF)</span>
                </button>
              </div>
            </div>

            {/* Bagian 4.4: Ringkasan Progres Unit dalam PO dari Database Nyata */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                Ringkasan Progres Unit Alat dalam PO Ini
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Unit</div>
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {unitProgress.totalUnits}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Belum Dijadwalkan</div>
                  <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                    {unitProgress.unscheduled}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sudah Dijadwalkan</div>
                  <div className="text-lg font-extrabold text-blue-700 dark:text-blue-400">
                    {unitProgress.scheduled}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sedang Diperiksa</div>
                  <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                    {unitProgress.inspecting}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Menunggu BAP/LHPP</div>
                  <div className="text-lg font-extrabold text-purple-700 dark:text-purple-400">
                    {unitProgress.waitingDocs}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30">
                  <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">Selesai</div>
                  <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                    {unitProgress.completed}
                  </div>
                </div>
              </div>
              {!unitProgress.canCompletePo && activeOrder.status !== 'SELESAI' && (
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded px-3 py-1.5 font-medium">
                  PO ini belum dapat ditandai SELESAI sebelum seluruh unit aktif di bawah menyelesaikan tahapan BAP dan penerbitan LHPP.
                </p>
              )}
            </div>

            {/* Daftar Unit Alat dalam PO beserta Status Masing-Masing Unit */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <ClipboardText size={16} />
                <span>Daftar Unit Alat pada PO ({(detailData.objects || []).length} Unit)</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {(detailData.objects || []).map((obj) => (
                  <div
                    key={obj.id}
                    className="px-3.5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">{obj.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                          {obj.category_code}
                        </span>
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
                      <div className="text-slate-500 dark:text-slate-400">
                        SN: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{obj.serial_number}</span> ·
                        Kapasitas: {obj.capacity || '-'} · Lokasi: {obj.install_location || '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {obj.bap_id && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailOpen(false);
                              navigate('/app/bap');
                            }}
                            className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/40 text-[#C81E1E] dark:text-red-400 font-mono font-bold hover:bg-red-100 dark:hover:bg-red-900/50"
                          >
                            BAP: {obj.bap_no} ({obj.bap_status})
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadUnitPdf(
                                `/bap/${obj.bap_id}/pdf`,
                                `${(obj.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C81E1E] text-white font-bold hover:bg-[#991B1B]"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            <span>Unduh BAP</span>
                          </button>
                        </>
                      )}
                      {obj.lhpp_id && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setDetailOpen(false);
                              navigate('/app/lhpp');
                            }}
                            className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-mono font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50"
                          >
                            LHPP: {obj.lhpp_no || obj.lhpp_status}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadUnitPdf(
                                `/lhpp/${obj.lhpp_id}/pdf`,
                                `${(obj.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 dark:bg-slate-700 text-white font-bold hover:bg-slate-900 dark:hover:bg-slate-600"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            <span>Unduh LHPP</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Penjadwalan & Penugasan untuk Admin */}
            {canManage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <form
                  onSubmit={handleSaveSchedule}
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md p-4 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
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
                      className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                      className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  {detailData.schedule && (
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
                        className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                      className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full min-h-10 rounded bg-slate-900 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600"
                  >
                    Simpan Jadwal Inspeksi
                  </button>
                </form>

                <form
                  onSubmit={handleAssignInspectors}
                  className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md p-4 space-y-3"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <UserCheck size={16} />
                    <span>Tugaskan Ahli K3 Sesuai Bidang</span>
                  </h4>

                  {scheduleConflicts.length > 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-md text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                        <Warning size={15} weight="bold" />
                        <span>Peringatan Potensi Konflik Jadwal:</span>
                      </div>
                      {scheduleConflicts.map((c, i) => (
                        <p key={i}>
                          {c.inspector_name} telah terjadwal pada order <strong>{c.order_no}</strong> ({c.client_name}) rentang {formatDateTime(c.start_at)} - {formatDateTime(c.end_at)}.
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
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
                                checkConflicts(next, scheduleForm.startAt, scheduleForm.endAt, detailData.order.id);
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
                    className="w-full min-h-10 rounded bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
                  >
                    Simpan Penugasan Ahli K3
                  </button>
                </form>
              </div>
            )}

            {/* Konfirmasi Penugasan oleh Ahli K3 */}
            {user?.role === 'AHLI_K3' && (detailData.assignments || []).length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Konfirmasi Penugasan Anda
                </h4>
                {(detailData.assignments || [])
                  .filter((asg) => asg.inspector_id === user.id)
                  .map((asg) => (
                    <div key={asg.id} className="space-y-2">
                      <p className="text-xs text-slate-800 dark:text-slate-200">
                        Status Konfirmasi Saat Ini:{' '}
                        <strong className="font-bold">{asg.status}</strong>
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespondAssignment(asg.id, 'DITERIMA')}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white"
                        >
                          <CheckCircle size={15} />
                          <span>Terima Penugasan</span>
                        </button>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Isi alasan jika menolak..."
                          className="min-h-10 rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleRespondAssignment(asg.id, 'DITOLAK')}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded bg-red-700 px-3 py-1.5 text-xs font-bold text-white"
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
            {nextStatuses.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Perbarui Status Tahapan PO
                </h4>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder="Catatan perubahan status (opsional)..."
                    className="flex-1 min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((st) => (
                      <button
                        key={st}
                        type="button"
                        disabled={submitting}
                        onClick={() => handleStatusChange(st)}
                        className={`min-h-10 rounded px-3 py-1.5 text-xs font-bold text-white ${
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
          </div>
        )}
      </Modal>

      {/* Modal Impor CSV Unit (Fitur 5) */}
      <Modal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        title={csvTargetOrderId ? 'Impor Tambahan Unit via CSV ke PO' : 'Impor CSV Unit ke Form PO'}
        size="lg"
      >
        <form onSubmit={handleImportCsv} className="space-y-4 text-slate-800 dark:text-slate-200">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Format CSV: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-slate-800 dark:text-slate-200">KODE_KATEGORI,NAMA_UNIT,MEREK,MODEL,NOMOR_SERI,TAHUN,KAPASITAS,LOKASI_PASANG,CATATAN</code>
          </p>
          <textarea
            rows={8}
            required
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full font-mono text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 leading-relaxed text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setCsvModalOpen(false)}
              className="min-h-10 rounded border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-10 rounded bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-red-800 disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : 'Impor Data CSV'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
