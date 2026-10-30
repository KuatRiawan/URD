import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle,
  CircleNotch,
  ClipboardText,
  DownloadSimple,
  Eye,
  FileText,
  FloppyDisk,
  PaperPlaneTilt,
  Plus,
  Printer,
  SealCheck,
  Signature,
  Trash,
  Warning,
  WarningCircle,
  X,
  XCircle
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from '../../lib/utils/draft-storage.js';
import { CONCLUSION_LABELS, formatDateTime } from '../../lib/utils/format.js';
import { compressImage } from '../../lib/utils/image.js';
import {
  enqueueOfflineDraft,
  enqueueOfflinePhoto,
  getPendingSyncSummary,
  performAutoSync,
  setupAutoSyncListener
} from '../../lib/utils/offline-sync.js';
import { enqueuePhoto, listQueuedPhotos, removeQueuedPhoto } from '../../lib/utils/offline-queue.js';

const DEFAULT_SIGNATURE_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export function InspectionsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const canValidateTemplate = ['ADMIN_SISTEM', 'PIMPINAN'].includes(user?.role);

  const [inspections, setInspections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [startModalOpen, setStartModalOpen] = useState(false);
  const [orderObjects, setOrderObjects] = useState([]);
  const [startForm, setStartForm] = useState({
    orderId: '',
    objectId: '',
    templateVersionId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [activeDetail, setActiveDetail] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [draftConclusion, setDraftConclusion] = useState('MEMENUHI_SYARAT');
  const [draftConclusionNotes, setDraftConclusionNotes] = useState('');
  const [draftResults, setDraftResults] = useState({});
  const [draftScopes, setDraftScopes] = useState([]);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [queuedPhotoCount, setQueuedPhotoCount] = useState(0);
  const [findingForm, setFindingForm] = useState({
    severity: 'MAYOR',
    description: '',
    recommendation: ''
  });
  const [inspectorSigName, setInspectorSigName] = useState('');
  const [inspectorSigTitle, setInspectorSigTitle] = useState('Ahli K3 Spesialis');
  const [clientSigName, setClientSigName] = useState('');
  const [clientSigTitle, setClientSigTitle] = useState('Pemilik Alat / PIC Klien');

  const inspectorCanvasRef = useRef(null);
  const clientCanvasRef = useRef(null);
  const isDrawingInspectorRef = useRef(false);
  const isDrawingClientRef = useRef(false);
  const [hasDrawnInspectorSig, setHasDrawnInspectorSig] = useState(false);
  const [hasDrawnClientSig, setHasDrawnClientSig] = useState(false);
  const [reSigningInspector, setReSigningInspector] = useState(false);
  const [reSigningClient, setReSigningClient] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inspRes, tmplRes, ordersRes] = await Promise.all([
        api.get('/inspections', { params: { limit: 50 } }),
        api.get('/inspections/templates'),
        api.get('/orders', { params: { limit: 50 } }).catch(() => ({ data: { items: [] } }))
      ]);
      setInspections(inspRes.data?.items || []);
      setTemplates(tmplRes.data?.items || []);
      setOrders(ordersRes.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar form inspeksi lapangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectOrder = async (orderId) => {
    setStartForm((prev) => ({ ...prev, orderId, objectId: '' }));
    if (!orderId) {
      setOrderObjects([]);
      return;
    }
    try {
      const res = await api.get(`/orders/${orderId}`);
      const objs = res.data?.objects || [];
      setOrderObjects(objs);
      if (objs[0]) {
        const matchedTmpl = templates.find((t) => t.category_code === objs[0].category_code);
        setStartForm((prev) => ({
          ...prev,
          orderId,
          objectId: objs[0].id,
          templateVersionId: matchedTmpl?.active_version_id || prev.templateVersionId
        }));
      }
    } catch {
      setOrderObjects([]);
    }
  };

  const handleStartInspection = async (e) => {
    e.preventDefault();
    if (!startForm.orderId || !startForm.objectId || !startForm.templateVersionId) {
      setError('Pilih order, objek uji, dan template checklist yang telah tervalidasi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inspections/start', startForm);
      setStartModalOpen(false);
      setFeedback('Lembar kerja inspeksi lapangan berhasil dibuka.');
      await loadData();
      if (res.data?.inspection?.id) {
        await openInspectionDetail(res.data.inspection.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memulai inspeksi lapangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateTemplate = async (versionId) => {
    setError('');
    try {
      await api.patch(`/inspections/templates/versions/${versionId}/validate`, {
        isValidated: true
      });
      setFeedback('Template checklist K3 berhasil divalidasi untuk operasional lapangan.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memvalidasi template checklist.');
    }
  };

  const openInspectionDetail = useCallback(async (inspectionId) => {
    setError('');
    try {
      const res = await api.get(`/inspections/${inspectionId}`);
      const data = res.data;
      setActiveDetail(data);
      setDraftConclusion(data.inspection?.conclusion || 'MEMENUHI_SYARAT');
      setDraftConclusionNotes(data.inspection?.conclusion_notes || '');

      const map = {};
      for (const item of data.items || []) {
        const existing = (data.results || []).find((r) => r.item_id === item.id);
        map[item.id] = {
          itemId: item.id,
          choiceValue: existing?.choice_value || 'SESUAI',
          numberValue:
            existing?.number_value !== null && existing?.number_value !== undefined
              ? String(existing.number_value)
              : item.min_value !== null && item.min_value !== undefined
                ? String(item.min_value)
                : '',
          textValue: existing?.text_value || 'Sesuai standar K3',
          note: existing?.note || ''
        };
      }
      setDraftResults(map);
      const loadedId = data.inspection?.id;
      const local = loadedId ? loadLocalDraft(loadedId) : null;
      const serverTime = data.inspection?.updated_at ? new Date(data.inspection.updated_at).getTime() : 0;
      if (local && data.inspection?.status === 'DRAF' && local.savedAt > serverTime) {
        if (local.results) setDraftResults(local.results);
        if (local.conclusion) setDraftConclusion(local.conclusion);
        if (typeof local.conclusionNotes === 'string') setDraftConclusionNotes(local.conclusionNotes);
        setFeedback('Draf lokal yang belum tersimpan di server berhasil dipulihkan. Tekan Simpan Draf untuk mengirimnya.');
      }
      const initialScopes =
        Array.isArray(data.inspection?.bap_scope_items) && data.inspection.bap_scope_items.length
          ? data.inspection.bap_scope_items
          : Array.isArray(data.inspection?.unit_scope_items) && data.inspection.unit_scope_items.length
          ? data.inspection.unit_scope_items
          : Array.isArray(data.inspection?.default_bap_scopes) &&
            data.inspection.default_bap_scopes.length
          ? data.inspection.default_bap_scopes
          : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];
      setDraftScopes(initialScopes);
      setInspectorSigName(user?.fullName || 'Ir. Budi Santoso');
      setInspectorSigTitle('Ahli K3 Spesialis');
      setClientSigName(data.inspection?.contact_name || '');
      setClientSigTitle('Pemilik Alat / PIC Klien');
      setHasDrawnInspectorSig(false);
      setHasDrawnClientSig(false);
      setReSigningInspector(false);
      setReSigningClient(false);
      setFormStep(data.inspection?.status === 'TERKIRIM' ? 4 : 1);
      setDetailModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail form inspeksi.');
    }
  }, [user?.fullName]);

  // Auto-buka atau mulai lembar kerja riksa uji bila Inspector mengklik "Kerjakan Riksa Uji" dari Dashboard
  useEffect(() => {
    const qOrderId = searchParams.get('orderId');
    const qObjectId = searchParams.get('objectId');
    if (!qOrderId || !qObjectId || loading) return;

    const runAutoOpen = async () => {
      setSearchParams({}, { replace: true });
      const existing = inspections.find(
        (i) => i.order_id === qOrderId && i.object_id === qObjectId
      );
      if (existing) {
        await openInspectionDetail(existing.id);
        return;
      }
      if (isInspector) {
        try {
          setSubmitting(true);
          const res = await api.post('/inspections/start', {
            orderId: qOrderId,
            objectId: qObjectId
          });
          await loadData();
          if (res.data?.inspection?.id) {
            await openInspectionDetail(res.data.inspection.id);
          }
        } catch (err) {
          setError(
            err.response?.data?.error?.message ||
              err.response?.data?.message ||
              'Gagal membuka lembar kerja riksa uji.'
          );
        } finally {
          setSubmitting(false);
        }
      }
    };
    runAutoOpen();
  }, [searchParams, setSearchParams, loading, inspections, isInspector, loadData, openInspectionDetail]);

  const refreshQueuedCount = useCallback(async () => {
    try {
      const summary = await getPendingSyncSummary();
      setQueuedPhotoCount(summary.totalPending);
    } catch {
      setQueuedPhotoCount(0);
    }
  }, []);

  // Mesin Pemantau Jaringan & Sinkronisasi Otomatis (Auto-Sync saat Reconnect)
  useEffect(() => {
    refreshQueuedCount();

    const unsub = setupAutoSyncListener(api, async (evt) => {
      if (evt.status === 'offline') {
        setOnline(false);
      } else if (evt.status === 'syncing') {
        setOnline(true);
        setFeedback(evt.message);
      } else if (evt.status === 'success') {
        setOnline(true);
        setFeedback(evt.message);
        await refreshQueuedCount();
        await loadData();
        if (activeDetail?.inspection?.id) {
          await openInspectionDetail(activeDetail.inspection.id);
        }
      } else if (evt.status === 'online') {
        setOnline(true);
      }
    });

    return () => unsub();
  }, [loadData, activeDetail?.inspection?.id, openInspectionDetail, refreshQueuedCount]);

  // Simpan draf form ke perangkat setiap kali berubah (pengaman bila sinyal hilang)
  useEffect(() => {
    if (!detailModalOpen || !isInspector || activeDetail?.inspection?.status !== 'DRAF') return undefined;
    const timer = window.setTimeout(async () => {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || 'SESUAI' : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== ''
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || 'Baik' : null,
          note: row.note || ''
        };
      });

      saveLocalDraft(activeDetail.inspection.id, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults
        });
        refreshQueuedCount();
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [detailModalOpen, isInspector, activeDetail, draftResults, draftConclusion, draftConclusionNotes, refreshQueuedCount]);

  const handleSaveDraft = async () => {
    if (!activeDetail?.inspection) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || 'SESUAI' : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== ''
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || 'Baik' : null,
          note: row.note || ''
        };
      });

      const draftPayload = {
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        results: payloadResults
      };

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, draftPayload);
        saveLocalDraft(activeDetail.inspection.id, {
          results: draftResults,
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes
        });
        await refreshQueuedCount();
        setFeedback('Mode Offline: Draf tersimpan di memori perangkat. Akan otomatis tersinkronisasi saat jaringan kembali tersedia.');
        return;
      }

      try {
        await api.put(`/inspections/${activeDetail.inspection.id}/draft`, draftPayload);
        clearLocalDraft(activeDetail.inspection.id);
        setFeedback('Draf hasil pemeriksaan teknis berhasil disimpan.');
        await openInspectionDetail(activeDetail.inspection.id);
        await loadData();
      } catch (saveErr) {
        if (!saveErr.response) {
          await enqueueOfflineDraft(activeDetail.inspection.id, draftPayload);
          await refreshQueuedCount();
          setFeedback('Koneksi terputus. Draf tersimpan di perangkat lokal dan akan otomatis disinkronkan saat jaringan kembali tersedia.');
        } else {
          throw saveErr;
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal menyimpan draf pemeriksaan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFinding = async (e) => {
    e.preventDefault();
    if (!activeDetail?.inspection || !findingForm.description.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspections/${activeDetail.inspection.id}/findings`, findingForm);
      setFindingForm({ severity: 'MAYOR', description: '', recommendation: '' });
      setFeedback('Temuan ketidaksesuaian teknis berhasil ditambahkan.');
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan temuan lapangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadInspectionPhoto = async (e) => {
    e.preventDefault();
    if (!activeDetail?.inspection || !photoFile) {
      setError('Pilih berkas foto hasil riksa uji terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(photoFile);
      const caption = photoCaption || 'Foto Hasil Riksa Uji';
      if (!navigator.onLine) {
        await enqueuePhoto({ inspectionId: activeDetail.inspection.id, file: prepared, caption });
        setPhotoFile(null);
        setPhotoCaption('');
        await refreshQueuedCount();
        setFeedback('Tidak ada koneksi. Foto disimpan di perangkat dan dikirim otomatis saat sinyal kembali.');
        return;
      }
      const fd = new FormData();
      fd.append('photo', prepared);
      fd.append('caption', caption);
      try {
        await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } catch (uploadErr) {
        if (uploadErr.response) throw uploadErr;
        await enqueuePhoto({ inspectionId: activeDetail.inspection.id, file: prepared, caption });
        setPhotoFile(null);
        setPhotoCaption('');
        await refreshQueuedCount();
        setFeedback('Koneksi terputus. Foto disimpan di perangkat dan dikirim otomatis saat sinyal kembali.');
        return;
      }
      setPhotoFile(null);
      setPhotoCaption('');
      setFeedback('Foto dokumentasi hasil riksa uji berhasil dilampirkan.');
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengunggah foto hasil riksa uji.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInspectionPhoto = async (photoId) => {
    if (!activeDetail?.inspection) return;
    const ok = await confirm({
      title: 'Hapus Foto Dokumentasi',
      message: 'Foto hasil riksa uji ini akan dihapus dari lampiran formulir. Lanjutkan?',
      confirmLabel: 'Ya, Hapus Foto',
      tone: 'danger'
    });
    if (!ok) return;

    setSubmitting(true);
    setError('');
    try {
      await api.delete(`/inspections/${activeDetail.inspection.id}/photos/${photoId}`);
      setFeedback('Foto dokumentasi berhasil dihapus.');
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal menghapus foto dokumentasi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadItemInlinePhoto = async (item, file) => {
    if (!activeDetail?.inspection || !file) return;
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(file);
      const caption = `[${item.section}] ${item.label}`;
      const fd = new FormData();
      fd.append('photo', prepared);
      fd.append('caption', caption);
      await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback(`Foto untuk butir [${item.section}] ${item.label} berhasil dilampirkan.`);
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal melampirkan foto butir checklist.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearInspectorCanvas = () => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnInspectorSig(false);
  };

  const handleInspectorPointerDown = (e) => {
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingInspectorRef.current = true;
    setHasDrawnInspectorSig(true);
  };

  const handleInspectorPointerMove = (e) => {
    if (!isDrawingInspectorRef.current) return;
    const canvas = inspectorCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleInspectorPointerUp = () => {
    isDrawingInspectorRef.current = false;
  };

  const handleSaveInspectorSignature = async () => {
    if (!activeDetail?.inspection || !inspectorSigName.trim()) {
      setError('Nama Ahli K3 / Inspector wajib diisi.');
      return;
    }
    const canvas = inspectorCanvasRef.current;
    if (!canvas || !hasDrawnInspectorSig) {
      setError('Silakan goreskan tanda tangan Ahli K3 pada kotak kanvas terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await api.post(`/inspections/${activeDetail.inspection.id}/signatures`, {
        signerRole: 'AHLI_K3',
        signerName: inspectorSigName.trim(),
        signerTitle: inspectorSigTitle.trim() || 'Ahli K3 Spesialis',
        dataUrl
      });
      clearInspectorCanvas();
      setReSigningInspector(false);
      setFeedback('Tanda tangan digital Ahli K3 / Inspector berhasil disimpan.');
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital Ahli K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearClientCanvas = () => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnClientSig(false);
  };

  const handleClientPointerDown = (e) => {
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingClientRef.current = true;
    setHasDrawnClientSig(true);
  };

  const handleClientPointerMove = (e) => {
    if (!isDrawingClientRef.current) return;
    const canvas = clientCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleClientPointerUp = () => {
    isDrawingClientRef.current = false;
  };

  const handleSaveClientSignature = async () => {
    if (!activeDetail?.inspection || !clientSigName.trim()) {
      setError('Nama PIC Perusahaan / Klien wajib diisi.');
      return;
    }
    const canvas = clientCanvasRef.current;
    if (!canvas || !hasDrawnClientSig) {
      setError('Silakan goreskan tanda tangan PIC Klien pada kotak kanvas terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvas.toDataURL('image/png');
      await api.post(`/inspections/${activeDetail.inspection.id}/signatures`, {
        signerRole: 'PERWAKILAN_KLIEN',
        signerName: clientSigName.trim(),
        signerTitle: clientSigTitle.trim() || 'Pemilik Alat / PIC Klien',
        dataUrl
      });
      clearClientCanvas();
      setReSigningClient(false);
      setFeedback('Tanda tangan digital PIC Klien / Pemilik Alat berhasil disimpan.');
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital PIC Klien.');
    } finally {
      setSubmitting(false);
    }
  };

  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');

  const handlePreviewPdf = async (endpoint, title, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfTitle(title);
      setPreviewPdfFilename(filename || 'dokumen.pdf');
      setPdfPreviewModalOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Gagal memuat pratinjau dokumen PDF.'
      );
    }
  };

  const closePdfPreview = () => {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPdfPreviewModalOpen(false);
  };

  const handlePrintPdf = () => {
    const iframe = document.getElementById('inspection-pdf-preview-iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  const handleDownloadPdf = async (endpoint, filename) => {
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

  const handleSubmitFinalInspection = async () => {
    if (!activeDetail?.inspection) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || 'SESUAI' : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || 'Baik' : null,
          note: row.note || ''
        };
      });

      const res = await api.post(`/inspections/${activeDetail.inspection.id}/submit`, {
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        results: payloadResults,
        scopeItems: draftScopes,
        autoFinalizeBap: true
      });

      clearLocalDraft(activeDetail.inspection.id);
      setFeedback(
        `Riksa uji selesai! Dokumen BAP (${res.data?.bap?.bap_no || 'Telah Terbit'}) dan LHPP telah diterbitkan secara resmi.`
      );
      await openInspectionDetail(activeDetail.inspection.id);
      await loadData();
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.error?.code === 'INSPECTION_LOCKED') {
        clearLocalDraft(activeDetail.inspection.id);
        setFeedback(
          'Formulir riksa uji ini telah terkirim dan terkunci. Dokumen BAP dan LHPP siap diunduh.'
        );
        await openInspectionDetail(activeDetail.inspection.id);
        await loadData();
        return;
      }
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengirim hasil inspeksi ke BAP & LHPP.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Form Inspeksi Lapangan & Checklist K3"
        subtitle="Isi lembar pemeriksaan teknis per bidang objek K3, catat temuan ketidakpatuhan, serta tanda tangan berita acara."
        actions={
          isInspector && (
            <button
              type="button"
              onClick={() => setStartModalOpen(true)}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              <Plus size={16} weight="bold" />
              <span>Mulai Inspeksi Baru</span>
            </button>
          )
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat daftar form inspeksi dan template K3..." />
      ) : (
        <div className="space-y-6">
          {/* Daftar Form Inspeksi */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#C81E1E]" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Lembar Kerja Pemeriksaan Lapangan ({inspections.length})
                </h2>
              </div>
            </div>

            {inspections.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada lembar kerja inspeksi"
                  description="Ahli K3 yang bertugas dapat memulai lembar kerja pemeriksaan dari order yang sedang berjalan."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-4">Order &amp; Klien</th>
                      <th className="py-3 px-4">Objek Uji K3</th>
                      <th className="py-3 px-4">Ahli K3 Pemeriksa</th>
                      <th className="py-3 px-4">Kesimpulan Teknis</th>
                      <th className="py-3 px-4">Status &amp; LHPP</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {inspections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
                            {item.po_number || item.order_no}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            Order: {item.order_no}
                          </div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{item.client_name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{item.object_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {item.category_code} · SN: {item.serial_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.inspector_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">{formatDateTime(item.inspected_at)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {item.conclusion ? (
                            <Badge
                              tone={
                                item.conclusion === 'MEMENUHI_SYARAT'
                                  ? 'success'
                                  : item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                                    ? 'danger'
                                    : 'warning'
                              }
                            >
                              {CONCLUSION_LABELS[item.conclusion] || item.conclusion}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Belum disimpulkan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge tone={item.status === 'TERKIRIM' ? 'success' : 'warning'}>
                            {item.status}
                          </Badge>
                          {item.bap_no && (
                            <div className="mt-1 font-mono text-[11px] font-bold text-[#C81E1E] dark:text-red-400">
                              BAP: {item.bap_no} ({item.bap_status})
                            </div>
                          )}
                          {item.lhpp_no && (
                            <div className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {item.lhpp_no}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openInspectionDetail(item.id)}
                            className={`min-h-9 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                              item.status === 'DRAF' && isInspector
                                ? 'bg-[#C81E1E] text-white hover:bg-[#a61717]'
                                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {item.status === 'DRAF' && isInspector ? (
                              <>
                                <ClipboardText size={15} weight="bold" />
                                <span>Kerjakan / Isi Form</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} weight="bold" />
                                <span>Review Hasil &amp; Dokumen</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Daftar Template Checklist K3 */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SealCheck size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Master Template Checklist Pemeriksaan per Bidang ({templates.length})
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="rounded-md border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs font-bold">
                        {tmpl.category_code}
                      </span>
                      <Badge tone={tmpl.is_validated ? 'success' : 'warning'}>
                        {tmpl.is_validated ? `Tervalidasi v${tmpl.active_version}` : 'Belum Validasi'}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-bold text-sm text-slate-900 dark:text-white">{tmpl.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {(tmpl.items || []).length} Parameter Uji Standar Regulasi K3
                    </p>
                  </div>
                  {!tmpl.is_validated && canValidateTemplate && tmpl.active_version_id && (
                    <button
                      type="button"
                      onClick={() => handleValidateTemplate(tmpl.active_version_id)}
                      className="min-h-9 w-full rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      Validasi Template Sekarang
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Modal Mulai Inspeksi Baru */}
      <Modal
        open={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        title="Mulai Lembar Kerja Inspeksi Lapangan"
      >
        <form onSubmit={handleStartInspection} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Order Pemeriksaan *
            </label>
            <select
              required
              value={startForm.orderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="w-full min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Pilih Order...</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.order_no} ({o.client_name})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Objek Uji K3 dalam Order *
            </label>
            <select
              required
              value={startForm.objectId}
              onChange={(e) => setStartForm((prev) => ({ ...prev, objectId: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Pilih Objek Uji...</option>
              {orderObjects.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.name} (SN: {obj.serial_number} · {obj.category_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Template Checklist Tervalidasi *
            </label>
            <select
              required
              value={startForm.templateVersionId}
              onChange={(e) =>
                setStartForm((prev) => ({ ...prev, templateVersionId: e.target.value }))
              }
              className="w-full min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Pilih Template Checklist...</option>
              {templates
                .filter((t) => t.is_validated && t.active_version_id)
                .map((t) => (
                  <option key={t.id} value={t.active_version_id}>
                    {t.category_code} · {t.name} (v{t.active_version})
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStartModalOpen(false)}
              className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : 'Buka Form Inspeksi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail & Pengisian Checklist */}
      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={
          activeDetail?.inspection
            ? `Form Inspeksi: ${activeDetail.inspection.object_name} (${activeDetail.inspection.order_no})`
            : 'Detail Inspeksi'
        }
        size="xl"
      >
        {activeDetail?.inspection && (() => {
          const totalItems = (activeDetail.items || []).length;
          const evaluatedItems = (activeDetail.items || []).filter((item) => {
            const res = draftResults[item.id];
            if (!res) return false;
            if (item.input_type === 'CHOICE') return !!res.choiceValue;
            if (item.input_type === 'NUMBER')
              return res.numberValue !== '' && res.numberValue !== null && res.numberValue !== undefined;
            if (item.input_type === 'TEXT') return !!res.textValue;
            return true;
          }).length;
          const missingItems = totalItems - evaluatedItems;
          const missingList = (activeDetail.items || []).filter((item) => {
            const res = draftResults[item.id];
            if (!res) return true;
            if (item.input_type === 'CHOICE') return !res.choiceValue;
            if (item.input_type === 'NUMBER')
              return res.numberValue === '' || res.numberValue === null || res.numberValue === undefined;
            if (item.input_type === 'TEXT') return !res.textValue;
            return false;
          });
          const nonConformingItems = (activeDetail.items || []).filter(
            (item) => draftResults[item.id]?.choiceValue === 'TIDAK_SESUAI'
          );
          const photosCount = (activeDetail.photos || []).length;

          const inspectorSig = (activeDetail.signatures || []).find((s) =>
            ['AHLI_K3', 'INSPECTOR'].includes(s.signer_role)
          );
          const clientSig = (activeDetail.signatures || []).find((s) =>
            ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role)
          );

          const canSubmit = missingItems === 0 && Boolean(inspectorSig) && !submitting;

          const handleAutoFillAllStandard = () => {
            const updated = { ...draftResults };
            for (const it of activeDetail.items || []) {
              const cur = updated[it.id] || {};
              updated[it.id] = {
                itemId: it.id,
                choiceValue: it.input_type === 'CHOICE' ? (cur.choiceValue || 'SESUAI') : null,
                numberValue:
                  it.input_type === 'NUMBER'
                    ? (cur.numberValue !== '' && cur.numberValue !== null && cur.numberValue !== undefined
                        ? cur.numberValue
                        : String(it.min_value ?? 0))
                    : '',
                textValue: it.input_type === 'TEXT' ? (cur.textValue || 'Sesuai Spesifikasi Teknis') : '',
                note: cur.note || ''
              };
            }
            setDraftResults(updated);
            setFeedback('Seluruh parameter checklist berhasil diisi otomatis sesuai standar teknis.');
          };

          return (
            <div className="space-y-5 text-sm">
            {/* Header Status & Indikator Autosave */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Lembar Pemeriksaan Teknis &amp; Pengujian Lapangan
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                {lastSavedAt ? (
                  <>
                    <CheckCircle size={14} weight="bold" className="text-emerald-500 shrink-0" />
                    <span>
                      Tersimpan otomatis pukul{' '}
                      {lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                ) : (
                  <>
                    <FloppyDisk size={14} className="text-slate-400 shrink-0" />
                    <span>Autosave aktif</span>
                  </>
                )}
              </div>
            </div>

            {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
            {feedback && (
              <Notice tone="success" onClose={() => setFeedback('')}>
                {feedback}
              </Notice>
            )}
            {isInspector && !online && (
              <Notice tone="warning" title="Anda sedang offline">
                Isian form disimpan otomatis di perangkat. Foto yang diambil akan masuk antrean dan
                dikirim saat sinyal kembali.
              </Notice>
            )}
            {isInspector && queuedPhotoCount > 0 && (
              <Notice tone="info">
                {queuedPhotoCount} foto menunggu dikirim ke server
                {online ? ' (sedang dikirim).' : '.'}
              </Notice>
            )}

            {activeDetail.inspection.status === 'TERKIRIM' && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-3">
                  <CheckCircle size={24} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Riksa Uji Selesai &amp; Dokumen Diterbitkan</p>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      Formulir inspeksi telah diverifikasi dan terkunci secara resmi. Dokumen BAP ({activeDetail.inspection.bap_no || 'Telah Terbit'}) dan LHPP ({activeDetail.inspection.lhpp_no || 'Telah Terbit'}) siap diunduh.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {activeDetail.inspection.bap_id && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewPdf(
                          `/bap/${activeDetail.inspection.bap_id}/pdf`,
                          `Pratinjau Berita Acara Pemeriksaan (BAP) - ${activeDetail.inspection.bap_no || 'BAP'}`,
                          `${(activeDetail.inspection.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] shadow-xs cursor-pointer"
                    >
                      <Eye size={14} weight="bold" />
                      <span>Review BAP (PDF)</span>
                    </button>
                  )}
                  {activeDetail.inspection.lhpp_id && (
                    <button
                      type="button"
                      onClick={() =>
                        handlePreviewPdf(
                          `/lhpp/${activeDetail.inspection.lhpp_id}/pdf`,
                          `Pratinjau Laporan Hasil Pemeriksaan (LHPP) - ${activeDetail.inspection.lhpp_no || 'LHPP'}`,
                          `${(activeDetail.inspection.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 shadow-xs cursor-pointer"
                    >
                      <Eye size={14} weight="bold" />
                      <span>Review LHPP (PDF)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ringkasan PO, Jadwal & Lokasi Pelaksanaan */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
                    PO: {activeDetail.inspection.po_number || activeDetail.inspection.order_no}
                  </span>
                  <span>·</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeDetail.inspection.client_name}
                  </span>
                  <span>·</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Lokasi:{' '}
                    {activeDetail.inspection.location_name ||
                      activeDetail.inspection.install_location ||
                      activeDetail.inspection.client_address ||
                      '-'}
                  </span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Jadwal Pelaksanaan:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {activeDetail.inspection.schedule_start_at
                      ? formatDateTime(activeDetail.inspection.schedule_start_at)
                      : 'Sesuai Penugasan'}
                  </strong>
                  {activeDetail.inspection.contact_name && (
                    <span>
                      {' '}
                      · Kontak PIC: {activeDetail.inspection.contact_name} (
                      {activeDetail.inspection.contact_phone || '-'})
                    </span>
                  )}
                </div>
                {(activeDetail.inspection.order_notes ||
                  activeDetail.inspection.schedule_notes) && (
                  <div className="text-slate-700 dark:text-slate-300 font-medium">
                    Detail Pekerjaan:{' '}
                    {activeDetail.inspection.schedule_notes ||
                      activeDetail.inspection.order_notes}
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Wizard Navigasi 4 Langkah Alur Riksa Uji Lapangan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setFormStep(1)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formStep === 1
                    ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  missingItems === 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {missingItems === 0 ? '✓' : '1'}
                </span>
                <span className="truncate">1. Checklist ({evaluatedItems}/{totalItems})</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep(2)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formStep === 2
                    ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
                  2
                </span>
                <span className="truncate">2. Kesimpulan &amp; Lingkup</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep(3)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formStep === 3
                    ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  photosCount >= 2
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {photosCount >= 2 ? '✓' : '3'}
                </span>
                <span className="truncate">3. Foto ({photosCount}) &amp; Temuan</span>
              </button>

              <button
                type="button"
                onClick={() => setFormStep(4)}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  formStep === 4
                    ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                  inspectorSig
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {inspectorSig ? '✓' : '4'}
                </span>
                <span className="truncate">4. Tanda Tangan &amp; Selesai</span>
              </button>
            </div>

            {/* LANGKAH 1: Parameter Checklist Berdasarkan Seksi Teknis */}
            {formStep === 1 && (() => {
              const sections = [];
              const sectionMap = new Map();
              for (const item of activeDetail.items || []) {
                const sec = item.section || 'UMUM';
                if (!sectionMap.has(sec)) {
                  sectionMap.set(sec, []);
                  sections.push(sec);
                }
                sectionMap.get(sec).push(item);
              }

              return (
                <div className="space-y-4">
                  {/* Status Bar Kelengkapan Checklist & Tombol Tandai Semua */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                          Kelengkapan Parameter Riksa Uji
                        </span>
                        <span className={`text-xs font-bold ${missingItems === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          ({evaluatedItems} dari {totalItems} butir terisi)
                        </span>
                      </div>
                      <div className="w-56 sm:w-72 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${missingItems === 0 ? 'bg-emerald-500' : 'bg-[#C81E1E]'}`}
                          style={{ width: `${totalItems ? Math.round((evaluatedItems / totalItems) * 100) : 100}%` }}
                        />
                      </div>
                    </div>

                    {isInspector && activeDetail.inspection.status === 'DRAF' && missingItems > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoFillAllStandard}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a61717] font-bold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle size={15} weight="bold" />
                        <span>Tandai Semua Sesuai Standar</span>
                      </button>
                    )}
                  </div>

                  {/* Render Checklist Berkelompok per Seksi Teknis */}
                  <div className="space-y-4">
                    {sections.map((secName, secIdx) => {
                      const secItems = sectionMap.get(secName) || [];
                      const secFilled = secItems.filter((it) => {
                        const r = draftResults[it.id];
                        if (!r) return false;
                        if (it.input_type === 'CHOICE') return !!r.choiceValue;
                        if (it.input_type === 'NUMBER') return r.numberValue !== '' && r.numberValue !== null && r.numberValue !== undefined;
                        if (it.input_type === 'TEXT') return !!r.textValue;
                        return true;
                      }).length;

                      return (
                        <div
                          key={secName}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                        >
                          {/* Header Seksi */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#C81E1E]" />
                              <span className="font-extrabold text-xs uppercase tracking-wide text-slate-900 dark:text-slate-100">
                                {secIdx + 1}. {secName}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {secFilled}/{secItems.length} Terisi
                            </span>
                          </div>

                          {/* Daftar Butir Checklist dalam Seksi */}
                          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {secItems.map((item) => {
                              const row = draftResults[item.id] || {};
                              const readOnly = !isInspector || activeDetail.inspection.status !== 'DRAF';
                              const itemPhotos = (activeDetail.photos || []).filter(
                                (ph) => ph.caption && ph.caption.includes(`[${item.section}] ${item.label}`)
                              );

                              return (
                                <div
                                  key={item.id}
                                  className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                                >
                                  {/* Info Butir & Standar */}
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                                        {item.label}
                                      </span>
                                      {item.is_required && (
                                        <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                                          *Wajib
                                        </span>
                                      )}
                                      {item.unit && (
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                          {item.unit}
                                          {item.min_value !== null ? ` · Min: ${item.min_value}` : ''}
                                          {item.max_value !== null ? ` · Maks: ${item.max_value}` : ''}
                                        </span>
                                      )}
                                    </div>

                                    {/* Indikator Foto Terlampir */}
                                    {itemPhotos.length > 0 && (
                                      <div className="flex items-center gap-1.5 pt-0.5">
                                        {itemPhotos.map((ip) => (
                                          <span
                                            key={ip.id}
                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-[10px] font-semibold text-[#C81E1E] dark:text-rose-300"
                                          >
                                            <Camera size={11} weight="bold" />
                                            <span>Foto Terlampir</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Kontrol Input Lapangan */}
                                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                                    {item.input_type === 'CHOICE' && (
                                      <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                        <button
                                          type="button"
                                          disabled={readOnly}
                                          onClick={() =>
                                            setDraftResults((prev) => ({
                                              ...prev,
                                              [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'SESUAI' }
                                            }))
                                          }
                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                            row.choiceValue === 'SESUAI'
                                              ? 'bg-emerald-600 text-white shadow-xs'
                                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <Check size={13} weight="bold" />
                                          <span>Sesuai</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={readOnly}
                                          onClick={() =>
                                            setDraftResults((prev) => ({
                                              ...prev,
                                              [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'TIDAK_SESUAI' }
                                            }))
                                          }
                                          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                            row.choiceValue === 'TIDAK_SESUAI'
                                              ? 'bg-rose-600 text-white shadow-xs'
                                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                          }`}
                                        >
                                          <X size={13} weight="bold" />
                                          <span>Tidak Sesuai</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={readOnly}
                                          onClick={() =>
                                            setDraftResults((prev) => ({
                                              ...prev,
                                              [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'TIDAK_BERLAKU' }
                                            }))
                                          }
                                          className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                                            row.choiceValue === 'TIDAK_BERLAKU'
                                              ? 'bg-slate-700 text-white shadow-xs'
                                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                          }`}
                                        >
                                          N/A
                                        </button>
                                      </div>
                                    )}

                                    {item.input_type === 'NUMBER' && (
                                      <div className="relative inline-flex items-center">
                                        <input
                                          type="number"
                                          step="any"
                                          disabled={readOnly}
                                          value={row.numberValue ?? ''}
                                          onChange={(e) =>
                                            setDraftResults((prev) => ({
                                              ...prev,
                                              [item.id]: { ...(prev[item.id] || {}), itemId: item.id, numberValue: e.target.value }
                                            }))
                                          }
                                          placeholder="0"
                                          className="w-28 h-9 pl-3 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C81E1E]"
                                        />
                                        {item.unit && (
                                          <span className="absolute right-2 text-[11px] font-semibold text-slate-400 pointer-events-none">
                                            {item.unit}
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {item.input_type === 'TEXT' && (
                                      <input
                                        type="text"
                                        disabled={readOnly}
                                        value={row.textValue ?? ''}
                                        onChange={(e) =>
                                          setDraftResults((prev) => ({
                                            ...prev,
                                            [item.id]: { ...(prev[item.id] || {}), itemId: item.id, textValue: e.target.value }
                                          }))
                                        }
                                        placeholder="Kondisi atau spesifikasi..."
                                        className="w-48 h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#C81E1E]"
                                      />
                                    )}

                                    {/* Tombol Kamera Cepat untuk Butir Ini */}
                                    {!readOnly && (
                                      <label
                                        title="Ambil / Unggah Foto untuk butir ini"
                                        className="h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer shadow-2xs transition-colors"
                                      >
                                        <Camera size={14} weight="bold" className="text-[#C81E1E]" />
                                        <span className="hidden sm:inline">Foto</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          className="sr-only"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) handleUploadItemInlinePhoto(item, f);
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tombol Navigasi Bawah Langkah 1 */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      {isInspector && activeDetail.inspection.status === 'DRAF' && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSaveDraft}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FloppyDisk size={15} />
                          <span>Simpan Draf</span>
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="min-h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white hover:bg-[#a61717] shadow-xs cursor-pointer"
                    >
                      <span>Lanjut: Kesimpulan &amp; Lingkup</span>
                      <ArrowRight size={15} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })()}

              {/* LANGKAH 2: Kesimpulan Kelayakan K3 & Lingkup BAP */}
              {formStep === 2 && (
                <div className="space-y-5">
                  {/* Pilihan Kartu Visual Kesimpulan Kelayakan K3 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <SealCheck size={16} weight="bold" className="text-[#C81E1E]" />
                        <span>Kesimpulan Kelayakan K3 Lapangan *</span>
                      </label>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Pilih status kelaikan hasil pengujian
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          id: 'MEMENUHI_SYARAT',
                          title: 'Memenuhi Syarat K3',
                          desc: 'Seluruh parameter teknis sesuai standar. Alat dinyatakan aman dan laik beroperasi.',
                          icon: CheckCircle,
                          badge: 'Laik Operasi',
                          activeClass: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-sm',
                          iconClass: 'text-emerald-600 dark:text-emerald-400',
                          badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                        },
                        {
                          id: 'MEMENUHI_SYARAT_DENGAN_PERBAIKAN',
                          title: 'Memenuhi dengan Catatan',
                          desc: 'Laik operasi bersyarat. Wajib menindaklanjuti rekomendasi perbaikan minor dari Ahli K3.',
                          icon: WarningCircle,
                          badge: 'Laik Bersyarat',
                          activeClass: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 shadow-sm',
                          iconClass: 'text-amber-600 dark:text-amber-400',
                          badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                        },
                        {
                          id: 'TIDAK_MEMENUHI_SYARAT',
                          title: 'Tidak Memenuhi Syarat',
                          desc: 'Ditemukan potensi bahaya kritis atau kegagalan fungsi. Alat dilarang beroperasi.',
                          icon: XCircle,
                          badge: 'Tidak Laik',
                          activeClass: 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500 shadow-sm',
                          iconClass: 'text-rose-600 dark:text-rose-400',
                          badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                        }
                      ].map((item) => {
                        const isSelected = draftConclusion === item.id;
                        const Icon = item.icon;
                        const disabled = !isInspector || activeDetail.inspection.status !== 'DRAF';

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => setDraftConclusion(item.id)}
                            className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? item.activeClass
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                            } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Icon size={20} weight={isSelected ? 'fill' : 'bold'} className={item.iconClass} />
                                  <span className="font-extrabold text-xs">{item.title}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed opacity-80">
                                {item.desc}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold">
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                isSelected ? 'border-[#C81E1E] bg-[#C81E1E] text-white' : 'border-slate-300 dark:border-slate-600'
                              }`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className={isSelected ? 'font-bold' : 'text-slate-500 font-normal'}>
                                {isSelected ? 'Pilihan Terpilih' : 'Pilih Kesimpulan'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Catatan Kesimpulan Teknis */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      Catatan / Ringkasan Kesimpulan Teknis
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                      value={draftConclusionNotes}
                      onChange={(e) => setDraftConclusionNotes(e.target.value)}
                      placeholder="Tuliskan catatan teknis hasil riksa uji (misalnya: Rekomendasi uji beban berkala, batas kapasitas aman, atau tindak lanjut pemeliharaan)..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
                    />
                  </div>

                  {/* Ruang Lingkup BAP (Untuk Dokumen Berita Acara Riksa Uji) */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileText size={16} weight="bold" className="text-[#C81E1E]" />
                          <span>Ruang Lingkup Pemeriksaan (Dokumen BAP)</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Ceklis lingkup pengujian yang masuk ke Berita Acara Pemeriksaan.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                          {draftScopes.length} lingkup dipilih
                        </span>
                        {isInspector && activeDetail.inspection.status === 'DRAF' && (
                          <button
                            type="button"
                            onClick={() => setDraftScopes([...(activeDetail.scopeCatalog || [])])}
                            className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
                          >
                            Pilih Semua
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {(activeDetail.scopeCatalog || []).map((scopeItem) => {
                        const checked = draftScopes.includes(scopeItem);
                        const disabled = !isInspector || activeDetail.inspection.status !== 'DRAF';

                        return (
                          <button
                            key={scopeItem}
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              setDraftScopes((prev) =>
                                checked ? prev.filter((s) => s !== scopeItem) : [...prev, scopeItem]
                              )
                            }
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                              checked
                                ? 'border-[#C81E1E] bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-300 font-bold shadow-2xs'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                            } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                                checked
                                  ? 'bg-[#C81E1E] border-[#C81E1E] text-white'
                                  : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                              }`}
                            >
                              {checked && <Check size={12} weight="bold" />}
                            </div>
                            <span className="text-xs truncate">{scopeItem}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tombol Navigasi Bawah Langkah 2 */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={15} weight="bold" />
                      <span>Kembali ke Checklist</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {isInspector && activeDetail.inspection.status === 'DRAF' && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSaveDraft}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                        >
                          <FloppyDisk size={15} />
                          <span>Simpan Draf</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormStep(3)}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                      >
                        <span>Lanjut: Foto &amp; Temuan</span>
                        <ArrowRight size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LANGKAH 3: Foto Dokumentasi Lapangan & Temuan */}
              {formStep === 3 && (
                <div className="space-y-5">
                  {/* Bagian 1: Foto Dokumentasi Hasil Riksa Uji */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
                          <Camera size={18} weight="bold" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Lampiran Foto Lapangan ({(activeDetail.photos || []).length} Foto)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Wajib melampirkan minimal 2 foto dokumentasi (Nameplate &amp; Fisik Alat)
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        (activeDetail.photos || []).length >= 2
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {(activeDetail.photos || []).length >= 2 ? '✓ Kuota Foto Terpenuhi' : 'Kurang Foto Dokumentasi'}
                      </span>
                    </div>

                    {/* Grid Foto Responsif */}
                    {(activeDetail.photos || []).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {(activeDetail.photos || []).map((ph) => (
                          <div
                            key={ph.id}
                            className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 overflow-hidden shadow-2xs flex flex-col justify-between"
                          >
                            <div className="relative aspect-4/3 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <img
                                src={`/api/v1/dashboard/files/${ph.id}`}
                                alt={ph.caption || ph.originalName}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                              {isInspector && activeDetail.inspection.status === 'DRAF' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteInspectionPhoto(ph.id)}
                                  disabled={submitting}
                                  title="Hapus foto ini"
                                  className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
                                >
                                  <Trash size={13} weight="bold" />
                                </button>
                              )}
                            </div>
                            <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                                {ph.caption || ph.originalName}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
                        <Camera size={32} className="mx-auto text-slate-400" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Belum ada foto dokumentasi terlampir.
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Gunakan form upload di bawah atau tombol kamera pada parameter checklist untuk mengambil foto nameplate &amp; unit.
                        </p>
                      </div>
                    )}

                    {/* Form Upload Foto */}
                    {isInspector && activeDetail.inspection.status === 'DRAF' && (
                      <form
                        onSubmit={handleUploadInspectionPhoto}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
                      >
                        <div className="sm:col-span-5 flex flex-col gap-1.5">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            className="min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                          />
                          <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 sm:hidden">
                            <Camera size={14} />
                            <span>{photoFile ? photoFile.name : 'Ambil Foto dari Kamera'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="sr-only"
                              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            />
                          </label>
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={photoCaption}
                            onChange={(e) => setPhotoCaption(e.target.value)}
                            placeholder="Keterangan foto (mis: Nameplate & Kondisi Fisik)..."
                            className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            disabled={submitting || !photoFile}
                            className="w-full min-h-10 rounded-lg bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} weight="bold" />
                            <span>Unggah Foto</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Bagian 2: Temuan Lapangan & Rekomendasi Perbaikan */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Warning size={18} weight="bold" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                            Daftar Temuan Lapangan ({(activeDetail.findings || []).length} Temuan)
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Catat ketidaksesuaian teknis dan rekomendasi tindakan perbaikan bagi klien
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* List Temuan */}
                    {(activeDetail.findings || []).length > 0 ? (
                      <div className="space-y-2">
                        {(activeDetail.findings || []).map((f) => (
                          <div
                            key={f.id}
                            className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                                f.severity === 'KRITIS'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : f.severity === 'MAYOR'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {f.severity}
                              </span>
                            </div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{f.description}</p>
                            {f.recommendation && (
                              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                                <strong className="text-slate-700 dark:text-slate-300">Rekomendasi:</strong> {f.recommendation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-800/20">
                        Tidak ada temuan ketidaksesuaian khusus. Unit berada dalam kondisi sesuai spesifikasi teknis K3.
                      </div>
                    )}

                    {/* Form Tambah Temuan */}
                    {isInspector && activeDetail.inspection.status === 'DRAF' && (
                      <form onSubmit={handleAddFinding} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="sm:col-span-3">
                          <select
                            value={findingForm.severity}
                            onChange={(e) =>
                              setFindingForm((prev) => ({ ...prev, severity: e.target.value }))
                            }
                            className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                          >
                            <option value="MINOR">MINOR (Ringan)</option>
                            <option value="MAYOR">MAYOR (Sedang)</option>
                            <option value="KRITIS">KRITIS (Bahaya)</option>
                          </select>
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={findingForm.description}
                            onChange={(e) =>
                              setFindingForm((prev) => ({ ...prev, description: e.target.value }))
                            }
                            placeholder="Uraian temuan teknis..."
                            className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            value={findingForm.recommendation}
                            onChange={(e) =>
                              setFindingForm((prev) => ({ ...prev, recommendation: e.target.value }))
                            }
                            placeholder="Rekomendasi tindakan..."
                            className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            disabled={submitting || !findingForm.description.trim()}
                            className="w-full min-h-10 rounded-lg bg-slate-800 dark:bg-slate-700 px-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <Plus size={14} weight="bold" />
                            <span>Tambah</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Tombol Navigasi Bawah Langkah 3 */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                    >
                      <ArrowLeft size={15} weight="bold" />
                      <span>Kembali ke Kesimpulan</span>
                    </button>
                    <div className="flex items-center gap-2">
                      {isInspector && activeDetail.inspection.status === 'DRAF' && (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSaveDraft}
                          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                        >
                          <FloppyDisk size={15} />
                          <span>Simpan Draf</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setFormStep(4)}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                      >
                        <span>Lanjut: Tanda Tangan &amp; Selesai</span>
                        <ArrowRight size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* LANGKAH 4: Dua Kolom Tanda Tangan Digital & Terbitkan Dokumen */}
              {formStep === 4 && (
                <div className="space-y-5">
                  {/* Bagian 1: Kolom Dua Tanda Tangan Digital (Inspector & PIC Klien) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* TTD 1: Ahli K3 / Inspector */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Signature size={16} weight="bold" className="text-[#C81E1E]" />
                            <span>1. Ahli K3 / Inspector (Wajib)</span>
                          </h4>
                          {inspectorSig ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle size={12} weight="bold" /> Sudah TTD
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Wajib Ditandatangani
                            </span>
                          )}
                        </div>

                        {inspectorSig && !reSigningInspector ? (
                          <div className="space-y-3 pt-2">
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                              <div className="h-24 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-700 p-2">
                                <img
                                  src={`/api/v1/dashboard/files/${inspectorSig.file_id}`}
                                  alt="Tanda Tangan Inspector"
                                  className="h-full max-h-20 object-contain mx-auto"
                                />
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {inspectorSig.signer_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {inspectorSig.signer_title || 'Ahli K3 Spesialis'}
                              </div>
                            </div>
                            {isInspector && activeDetail.inspection.status === 'DRAF' && (
                              <button
                                type="button"
                                onClick={() => setReSigningInspector(true)}
                                className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              >
                                Tanda Tangan Ulang
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Nama Ahli K3 *
                                </label>
                                <input
                                  type="text"
                                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                                  value={inspectorSigName}
                                  onChange={(e) => setInspectorSigName(e.target.value)}
                                  placeholder="Nama lengkap Ahli K3..."
                                  className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Jabatan
                                </label>
                                <input
                                  type="text"
                                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                                  value={inspectorSigTitle}
                                  onChange={(e) => setInspectorSigTitle(e.target.value)}
                                  placeholder="Jabatan..."
                                  className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Goreskan Tanda Tangan di Kotak:
                              </span>
                              <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center">
                                <canvas
                                  ref={inspectorCanvasRef}
                                  width={300}
                                  height={110}
                                  onPointerDown={handleInspectorPointerDown}
                                  onPointerMove={handleInspectorPointerMove}
                                  onPointerUp={handleInspectorPointerUp}
                                  onPointerLeave={handleInspectorPointerUp}
                                  className="cursor-crosshair touch-none w-full max-w-[300px] h-[110px]"
                                />
                              </div>
                            </div>

                            {isInspector && activeDetail.inspection.status === 'DRAF' && (
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={clearInspectorCanvas}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    Bersihkan
                                  </button>
                                  {reSigningInspector && (
                                    <button
                                      type="button"
                                      onClick={() => setReSigningInspector(false)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={handleSaveInspectorSignature}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer shadow-xs"
                                >
                                  Simpan TTD Ahli K3
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TTD 2: Perwakilan Perusahaan / PIC Klien */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <Signature size={16} weight="bold" className="text-blue-600" />
                            <span>2. Perwakilan Perusahaan / PIC Klien</span>
                          </h4>
                          {clientSig ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle size={12} weight="bold" /> Sudah TTD
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Dapat Dilengkapi di Lapangan
                            </span>
                          )}
                        </div>

                        {clientSig && !reSigningClient ? (
                          <div className="space-y-3 pt-2">
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                              <div className="h-24 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-700 p-2">
                                <img
                                  src={`/api/v1/dashboard/files/${clientSig.file_id}`}
                                  alt="Tanda Tangan PIC Klien"
                                  className="h-full max-h-20 object-contain mx-auto"
                                />
                              </div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {clientSig.signer_name}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {clientSig.signer_title || 'Perwakilan Klien / Pemilik Alat'}
                              </div>
                            </div>
                            {isInspector && activeDetail.inspection.status === 'DRAF' && (
                              <button
                                type="button"
                                onClick={() => setReSigningClient(true)}
                                className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                              >
                                Tanda Tangan Ulang
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2.5 pt-1">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Nama PIC Klien
                                </label>
                                <input
                                  type="text"
                                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                                  value={clientSigName}
                                  onChange={(e) => setClientSigName(e.target.value)}
                                  placeholder="Nama penanggung jawab..."
                                  className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                  Jabatan
                                </label>
                                <input
                                  type="text"
                                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                                  value={clientSigTitle}
                                  onChange={(e) => setClientSigTitle(e.target.value)}
                                  placeholder="Jabatan..."
                                  className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                Goreskan Tanda Tangan PIC Klien di Kotak:
                              </span>
                              <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center">
                                <canvas
                                  ref={clientCanvasRef}
                                  width={300}
                                  height={110}
                                  onPointerDown={handleClientPointerDown}
                                  onPointerMove={handleClientPointerMove}
                                  onPointerUp={handleClientPointerUp}
                                  onPointerLeave={handleClientPointerUp}
                                  className="cursor-crosshair touch-none w-full max-w-[300px] h-[110px]"
                                />
                              </div>
                            </div>

                            {isInspector && activeDetail.inspection.status === 'DRAF' && (
                              <div className="flex items-center justify-between gap-2 pt-1">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={clearClientCanvas}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    Bersihkan
                                  </button>
                                  {reSigningClient && (
                                    <button
                                      type="button"
                                      onClick={() => setReSigningClient(false)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={submitting}
                                  onClick={handleSaveClientSignature}
                                  className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer shadow-xs"
                                >
                                  Simpan TTD Klien
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bagian 2: Ringkasan Kesiapan Penerbitan Dokumen Resmi */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Status Kesiapan Penerbitan Dokumen (BAP &amp; LHPP)
                      </span>
                      <span className={`text-xs font-bold ${canSubmit ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {canSubmit ? '✓ Siap Diterbitkan' : 'Memerlukan Kelengkapan'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Checklist Uji</span>
                        <span className={`font-bold ${missingItems === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {evaluatedItems}/{totalItems} Butir Terisi
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Foto Dokumentasi</span>
                        <span className={`font-bold ${photosCount >= 2 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {photosCount} Foto Terlampir
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">TTD Ahli K3</span>
                        <span className={`font-bold ${inspectorSig ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {inspectorSig ? 'Sudah TTD' : 'Belum TTD (Wajib)'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Kesimpulan Akhir</span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {CONCLUSION_LABELS[draftConclusion] || draftConclusion}
                        </span>
                      </div>
                    </div>

                    {missingItems > 0 && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                          Perhatian: Masih ada {missingItems} butir checklist yang belum terisi di Langkah 1.
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoFillAllStandard}
                          className="px-3 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer transition-colors"
                        >
                          Tandai Semua Sesuai Standar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tombol Aksi Akhir */}
                  {activeDetail.inspection.status === 'TERKIRIM' ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle size={18} weight="fill" />
                        <span>Formulir riksa uji selesai dikirim. Dokumen BAP &amp; LHPP telah diterbitkan secara resmi.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeDetail.inspection.bap_id && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePreviewPdf(
                                `/bap/${activeDetail.inspection.bap_id}/pdf`,
                                `Pratinjau Berita Acara Pemeriksaan (BAP) - ${activeDetail.inspection.bap_no || 'BAP'}`,
                                `${(activeDetail.inspection.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] shadow-xs cursor-pointer"
                          >
                            <Eye size={14} weight="bold" />
                            <span>Review BAP (PDF)</span>
                          </button>
                        )}
                        {activeDetail.inspection.lhpp_id && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePreviewPdf(
                                `/lhpp/${activeDetail.inspection.lhpp_id}/pdf`,
                                `Pratinjau Laporan Hasil Pemeriksaan (LHPP) - ${activeDetail.inspection.lhpp_no || 'LHPP'}`,
                                `${(activeDetail.inspection.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 shadow-xs cursor-pointer"
                          >
                            <Eye size={14} weight="bold" />
                            <span>Review LHPP (PDF)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetailModalOpen(false)}
                          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Tutup Formulir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormStep(3)}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 cursor-pointer shadow-2xs"
                      >
                        <ArrowLeft size={15} weight="bold" />
                        <span>Kembali ke Foto &amp; Temuan</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {isInspector && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSaveDraft}
                            className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                          >
                            <FloppyDisk size={15} />
                            <span>Simpan Draf</span>
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!canSubmit || submitting}
                          onClick={handleSubmitFinalInspection}
                          title={
                            missingItems > 0
                              ? `Lengkapi ${missingItems} butir wajib terlebih dahulu`
                              : !inspectorSig
                              ? 'Bubuhkan tanda tangan Ahli K3 terlebih dahulu'
                              : 'Kirim dan terbitkan dokumen resmi BAP & LHPP'
                          }
                          className="min-h-10 px-5 py-2 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {submitting ? (
                            <CircleNotch size={15} weight="bold" className="animate-spin" />
                          ) : (
                            <PaperPlaneTilt size={15} weight="bold" />
                          )}
                          <span>
                            {submitting
                              ? 'Memproses Penerbitan BAP & LHPP...'
                              : missingItems > 0
                              ? `Lengkapi ${missingItems} Butir Terlebih Dahulu`
                              : !inspectorSig
                              ? 'Tanda Tangan Ahli K3 Diperlukan'
                              : 'Konfirmasi & Terbitkan BAP dan LHPP'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

      </div>
    );
  })()}
      </Modal>

      {/* Modal Pratinjau Dokumen BAP & LHPP Sebelum Cetak / Unduh */}
      <Modal
        open={pdfPreviewModalOpen}
        onClose={closePdfPreview}
        title={previewPdfTitle}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Pratinjau Resmi:</span>
              <span>Periksa kesesuaian data dokumen sebelum mencetak atau mengunduh.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Printer size={15} weight="bold" />
                <span>Cetak / Print</span>
              </button>
              <a
                href={previewPdfUrl || '#'}
                download={previewPdfFilename}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
              >
                <DownloadSimple size={15} weight="bold" />
                <span>Unduh Dokumen PDF</span>
              </a>
            </div>
          </div>

          <div className="w-full h-[72vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-inner flex items-center justify-center">
            {previewPdfUrl ? (
              <iframe
                id="inspection-pdf-preview-iframe"
                src={previewPdfUrl}
                title={previewPdfTitle}
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                <CircleNotch size={28} className="animate-spin text-[#C81E1E]" />
                <span className="text-xs">Memuat pratinjau dokumen...</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
