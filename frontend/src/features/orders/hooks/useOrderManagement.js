import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../lib/api/axios.js';

export function useOrderManagement() {
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
    quantity: 1,
    attributes: {}
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

  const loadOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
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
      if (!isSilent) {
        setLoading(false);
      }
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
          quantity: Math.max(1, Number(newUnitRow.quantity || 1)),
          attributes: newUnitRow.attributes || {}
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
      quantity: 1,
      attributes: {}
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
        quantity: Math.max(1, Number(newUnitRow.quantity || 1)),
        attributes: newUnitRow.attributes || {}
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
        requestedDate: createForm.requestedDate,
        notes: createForm.notes?.trim() || null,
        objectIds: createForm.objectIds,
        units: pendingUnits,
        inspectorIds: createForm.inspectorIds
      });
      setCreateOpen(false);
      setPoWizardStep(1);
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
        categoryId: 1,
        name: '',
        manufacturer: '',
        serialNumber: '',
        capacity: '',
        installLocation: '',
        quantity: 1
      });
      setFeedback('Order Purchase Order (PO) & daftar alat riksa uji berhasil didaftarkan.');
      loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal membuat PO pemeriksaan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const openOrderDetail = async (orderId) => {
    setError('');
    setFeedback('');
    setScheduleConflicts([]);
    try {
      const res = await api.get(`/orders/${orderId}`);
      setDetailData(res.data);
      const ord = res.data.order;
      setScheduleForm({
        startAt: ord.schedule_start_at
          ? new Date(ord.schedule_start_at).toISOString().slice(0, 16)
          : '',
        endAt: ord.schedule_end_at
          ? new Date(ord.schedule_end_at).toISOString().slice(0, 16)
          : '',
        notes: ord.schedule_notes || '',
        reason: ''
      });
      setSelectedInspectorIds((res.data.assignments || []).map((a) => a.inspector_id));
      setDetailOpen(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat detail PO.'
      );
    }
  };

  const checkConflicts = async (inspectorIds, startAt, endAt, orderId) => {
    if (!inspectorIds?.length || !startAt || !endAt) {
      setScheduleConflicts([]);
      return;
    }
    try {
      const res = await api.get('/orders/conflicts', {
        params: { inspectorIds, startAt, endAt, excludeOrderId: orderId }
      });
      setScheduleConflicts(res.data?.conflicts || []);
    } catch {
      setScheduleConflicts([]);
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    if (!detailData?.order?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/orders/${detailData.order.id}/schedule`, scheduleForm);
      setFeedback('Jadwal pelaksanaan riksa uji berhasil diperbarui.');
      await openOrderDetail(detailData.order.id);
      loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menyimpan jadwal pemeriksaan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignInspectors = async (e) => {
    e.preventDefault();
    if (!detailData?.order?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/orders/${detailData.order.id}/assign`, {
        inspectorIds: selectedInspectorIds
      });
      setFeedback('Penugasan Ahli K3 / Inspector berhasil diperbarui.');
      await openOrderDetail(detailData.order.id);
      loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memperbarui penugasan inspector.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondAssignment = async (status, reason = '') => {
    if (!detailData?.order?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/orders/${detailData.order.id}/assignment-response`, {
        status,
        reason
      });
      setFeedback(
        status === 'DITERIMA'
          ? 'Penugasan berhasil diterima. Silakan lanjutkan ke Formulir Pengujian.'
          : 'Penugasan riksa uji berhasil ditolak.'
      );
      setRejectReason('');
      await openOrderDetail(detailData.order.id);
      loadOrders();
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
    if (!detailData?.order?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/orders/${detailData.order.id}/status`, {
        status: nextStatus,
        note: statusNote || null
      });
      setStatusNote('');
      setFeedback(`Status PO berhasil diubah menjadi ${nextStatus}.`);
      await openOrderDetail(detailData.order.id);
      loadOrders();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengubah status order PO.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCsvImport = (orderId = null) => {
    setCsvTargetOrderId(orderId);
    setCsvText(
      'Kategori,Nama Alat,Pabrik Pembuat,Nomor Seri,Kapasitas,Lokasi Pasang,Jumlah\nPAA,Overhead Crane 10T,Demag,SN-CR-9921,10 Ton,Workshop Bay 1,1\nPTP,Mesin Genset Silent,Cummins,SN-GN-8842,500 kVA,Power House,1'
    );
    setCsvModalOpen(true);
  };

  const handleImportCsv = () => {
    if (!csvText.trim()) return;
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      setError('Format CSV tidak valid. Harus ada header dan minimal 1 baris data.');
      return;
    }
    const catMap = {};
    for (const c of categories) {
      catMap[c.code.toUpperCase()] = c.id;
      catMap[c.name.toUpperCase()] = c.id;
    }
    const defaultCatId = categories[0]?.id || 1;
    const parsedUnits = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map((s) => s.trim());
      if (row.length < 2 || !row[1]) continue;
      const catKey = (row[0] || '').toUpperCase();
      const categoryId = catMap[catKey] || defaultCatId;
      parsedUnits.push({
        categoryId,
        name: row[1],
        manufacturer: row[2] || '',
        serialNumber: row[3] || `SN-IMP-${Date.now().toString().slice(-4)}-${i}`,
        capacity: row[4] || '',
        installLocation: row[5] || '',
        quantity: Math.max(1, parseInt(row[6], 10) || 1)
      });
    }
    if (parsedUnits.length === 0) {
      setError('Tidak ada baris unit alat valid yang ditemukan di teks CSV.');
      return;
    }
    setCreateForm((prev) => ({
      ...prev,
      units: [...prev.units, ...parsedUnits]
    }));
    setCsvModalOpen(false);
    setFeedback(`Berhasil mengimpor ${parsedUnits.length} unit alat K3 dari CSV.`);
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

  return {
    orders,
    clients,
    categories,
    inspectors,
    loading,
    error,
    setError,
    feedback,
    setFeedback,
    q,
    setQ,
    statusFilter,
    setStatusFilter,
    loadOrders,
    createOpen,
    setCreateOpen,
    poWizardStep,
    setPoWizardStep,
    clientMode,
    setClientMode,
    clientObjects,
    createForm,
    setCreateForm,
    newUnitRow,
    setNewUnitRow,
    submitting,
    handleClientChange,
    toggleObjectSelection,
    handleAddInlineUnit,
    removeInlineUnit,
    handleWizardNext,
    handleCreateOrder,
    detailData,
    detailOpen,
    setDetailOpen,
    openOrderDetail,
    scheduleConflicts,
    scheduleForm,
    setScheduleForm,
    selectedInspectorIds,
    setSelectedInspectorIds,
    statusNote,
    setStatusNote,
    rejectReason,
    setRejectReason,
    handleSaveSchedule,
    handleAssignInspectors,
    handleRespondAssignment,
    handleStatusChange,
    checkConflicts,
    csvModalOpen,
    setCsvModalOpen,
    csvText,
    setCsvText,
    csvTargetOrderId,
    handleOpenCsvImport,
    handleImportCsv,
    handleDownloadAssignmentPdf,
    handleDownloadBatchBapPdf,
    handleDownloadUnitPdf
  };
}

