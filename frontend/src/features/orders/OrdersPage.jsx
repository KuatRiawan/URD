import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { FileCsv, Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { ORDER_STATUS_LABELS } from '../../lib/utils/format.js';
import { ALLOWED_NEXT_STATUS } from './orderConstants.js';
import { OrderFilterBar } from './components/OrderFilterBar.jsx';
import { OrderTable } from './components/OrderTable.jsx';
import { CreatePoWizardModal } from './components/CreatePoWizardModal.jsx';
import { OrderDetailModal } from './components/OrderDetailModal.jsx';
import { CsvImportModal } from './components/CsvImportModal.jsx';

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

  // State Modal Buat PO Wizard
  const [createOpen, setCreateOpen] = useState(false);
  const [poWizardStep, setPoWizardStep] = useState(1);
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

  // State Modal Detail & Pengelolaan PO
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

  // State Modal Impor CSV Unit
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [csvTargetOrderId, setCsvTargetOrderId] = useState(null);

  // State Peringatan Konflik Jadwal
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

  const handleWizardNext = () => {
    setError('');
    if (poWizardStep === 1) {
      if (!createForm.poDate) {
        setError('Tanggal PO wajib diisi.');
        return;
      }
      setPoWizardStep(2);
      return;
    }
    if (poWizardStep === 2) {
      const hasClient =
        (clientMode === 'EXISTING' && Boolean(createForm.clientId)) ||
        (clientMode === 'NEW' && Boolean(createForm.newClientName?.trim()));
      if (!hasClient) {
        setError('Pilih perusahaan klien terdaftar atau ketik nama perusahaan klien baru.');
        return;
      }
      setPoWizardStep(3);
      return;
    }
    if (poWizardStep === 3) {
      if (newUnitRow.name?.trim()) {
        handleAddInlineUnit();
      }
      const totalUnits =
        createForm.objectIds.length +
        createForm.units.length +
        (newUnitRow.name?.trim() ? 1 : 0);
      if (totalUnits === 0) {
        setError(
          'Daftarkan minimal 1 unit alat K3 (pilih dari unit terdaftar, tambahkan unit baru, atau impor CSV).'
        );
        return;
      }
      setPoWizardStep(4);
      return;
    }
    if (poWizardStep === 4) {
      setPoWizardStep(5);
      return;
    }
  };

  const handleCreateOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
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
      setPoWizardStep(1);
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
        const res = await api.post(`/orders/${csvTargetOrderId}/import-units-csv`, { csvText });
        setFeedback(`Berhasil mengimpor ${res.data.count || res.data.importedCount} unit ke PO.`);
        await openOrderDetail(csvTargetOrderId);
      } else {
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
        subtitle="Pengelolaan Purchase Order resmi, pendaftaran alat K3 multi-unit, alokasi Ahli K3, dan pemantauan progres berkas LHPP"
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenCsvImport(null)}
                className="min-h-11 inline-flex items-center gap-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                <FileCsv size={16} weight="bold" />
                <span>Impor Unit CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setCreateOpen(true);
                  setPoWizardStep(1);
                }}
                className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
              >
                <Plus size={16} weight="bold" />
                <span>Buat PO / Order Baru</span>
              </button>
            </div>
          )
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadOrders} />}

      <OrderFilterBar
        q={q}
        setQ={setQ}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <LoadingState label="Memuat daftar PO & order pemeriksaan..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="Belum ada PO pemeriksaan"
          description="Purchase Order (PO) pemeriksaan riksa uji K3 yang terdaftar akan tampil di halaman ini."
        />
      ) : (
        <OrderTable
          orders={orders}
          openOrderDetail={openOrderDetail}
          handleDownloadAssignmentPdf={handleDownloadAssignmentPdf}
        />
      )}

      {/* Modal Buat PO & Order Multi-Unit (Guided 5-Step Wizard) */}
      <CreatePoWizardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        poWizardStep={poWizardStep}
        setPoWizardStep={setPoWizardStep}
        createForm={createForm}
        setCreateForm={setCreateForm}
        clientMode={clientMode}
        setClientMode={setClientMode}
        clients={clients}
        clientObjects={clientObjects}
        categories={categories}
        inspectors={inspectors}
        newUnitRow={newUnitRow}
        setNewUnitRow={setNewUnitRow}
        handleClientChange={handleClientChange}
        toggleObjectSelection={toggleObjectSelection}
        handleAddInlineUnit={handleAddInlineUnit}
        removeInlineUnit={removeInlineUnit}
        handleOpenCsvImport={handleOpenCsvImport}
        handleWizardNext={handleWizardNext}
        handleCreateOrder={handleCreateOrder}
        submitting={submitting}
        error={error}
        setError={setError}
      />

      {/* Modal Detail & Pengelolaan PO */}
      <OrderDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        activeOrder={activeOrder}
        detailData={detailData}
        unitProgress={unitProgress}
        nextStatuses={nextStatuses}
        canManage={canManage}
        user={user}
        inspectors={inspectors}
        scheduleConflicts={scheduleConflicts}
        scheduleForm={scheduleForm}
        setScheduleForm={setScheduleForm}
        selectedInspectorIds={selectedInspectorIds}
        setSelectedInspectorIds={setSelectedInspectorIds}
        statusNote={statusNote}
        setStatusNote={setStatusNote}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submitting={submitting}
        error={error}
        setError={setError}
        handleOpenCsvImport={handleOpenCsvImport}
        handleDownloadBatchBapPdf={handleDownloadBatchBapPdf}
        handleDownloadAssignmentPdf={handleDownloadAssignmentPdf}
        handleDownloadUnitPdf={handleDownloadUnitPdf}
        handleSaveSchedule={handleSaveSchedule}
        handleAssignInspectors={handleAssignInspectors}
        handleRespondAssignment={handleRespondAssignment}
        handleStatusChange={handleStatusChange}
        checkConflicts={checkConflicts}
      />

      {/* Modal Impor CSV Unit */}
      <CsvImportModal
        open={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        csvTargetOrderId={csvTargetOrderId}
        csvText={csvText}
        setCsvText={setCsvText}
        handleImportCsv={handleImportCsv}
        submitting={submitting}
      />
    </div>
  );
}
