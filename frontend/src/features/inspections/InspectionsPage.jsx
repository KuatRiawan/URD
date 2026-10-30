import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
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
  SealCheck,
  Signature,
  Trash,
  Warning,
  WarningCircle,
  X
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
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
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
  const [sigForm, setSigForm] = useState({
    signerRole: 'AHLI_K3',
    signerName: '',
    signerTitle: 'Ahli K3 Spesialis'
  });
  const sigCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [hasDrawnSig, setHasDrawnSig] = useState(false);

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
      setSigForm({
        signerRole: 'AHLI_K3',
        signerName: user?.fullName || '',
        signerTitle: 'Ahli K3 Spesialis'
      });
      setHasDrawnSig(false);
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

  const clearSignatureCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSig(false);
  };

  const handleCanvasPointerDown = (e) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
    setHasDrawnSig(true);
  };

  const handleCanvasPointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasPointerUp = () => {
    isDrawingRef.current = false;
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    if (!activeDetail?.inspection || !sigForm.signerName.trim()) {
      setError('Nama penanda tangan wajib diisi.');
      return;
    }
    if (!hasDrawnSig || !sigCanvasRef.current) {
      setError('Silakan bubuhkan tanda tangan pada kotak kanvas terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = sigCanvasRef.current.toDataURL('image/png');
      await api.post(`/inspections/${activeDetail.inspection.id}/signatures`, {
        signerRole: sigForm.signerRole,
        signerName: sigForm.signerName.trim(),
        signerTitle: sigForm.signerTitle ? sigForm.signerTitle.trim() : null,
        dataUrl
      });
      clearSignatureCanvas();
      setFeedback(
        `Tanda tangan digital (${
          sigForm.signerRole === 'AHLI_K3' ? 'Inspector' : 'Perwakilan Klien'
        }) berhasil disimpan.`
      );
      await openInspectionDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital.');
    } finally {
      setSubmitting(false);
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
      setReviewModalOpen(false);
      setFeedback(
        `Riksa uji selesai! Dokumen BAP (${res.data?.bap?.bap_no || 'Baru'}) dan LHPP telah diterbitkan dan siap diunduh.`
      );
      await openInspectionDetail(activeDetail.inspection.id);
      await loadData();
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.error?.code === 'INSPECTION_LOCKED') {
        clearLocalDraft(activeDetail.inspection.id);
        setReviewModalOpen(false);
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
                          <div className="inline-flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openInspectionDetail(item.id)}
                              className="min-h-9 inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <ClipboardText size={15} />
                              <span>
                                {item.status === 'DRAF' && isInspector
                                  ? 'Kerjakan / Isi Form'
                                  : 'Lihat Detail'}
                              </span>
                            </button>
                            {item.bap_id && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadPdf(
                                    `/bap/${item.bap_id}/pdf`,
                                    `${(item.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                                  )
                                }
                                className="min-h-9 inline-flex items-center gap-1 rounded bg-[#C81E1E] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#991B1B]"
                              >
                                <DownloadSimple size={14} weight="bold" />
                                <span>Unduh BAP</span>
                              </button>
                            )}
                            {item.lhpp_id && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDownloadPdf(
                                    `/lhpp/${item.lhpp_id}/pdf`,
                                    `${(item.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                                  )
                                }
                                className="min-h-9 inline-flex items-center gap-1 rounded bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                              >
                                <DownloadSimple size={14} weight="bold" />
                                <span>Unduh LHPP</span>
                              </button>
                            )}
                          </div>
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
        {activeDetail?.inspection && (
          <div className="space-y-6 text-sm">
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
                        handleDownloadPdf(
                          `/bap/${activeDetail.inspection.bap_id}/pdf`,
                          `${(activeDetail.inspection.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] shadow-xs"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span>Unduh BAP</span>
                    </button>
                  )}
                  {activeDetail.inspection.lhpp_id && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadPdf(
                          `/lhpp/${activeDetail.inspection.lhpp_id}/pdf`,
                          `${(activeDetail.inspection.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 shadow-xs"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span>Unduh LHPP</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Ringkasan PO, Jadwal, Pelaksanaan & Tombol Unduh BAP/LHPP */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
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

              <div className="flex flex-wrap items-center gap-2">
                {activeDetail.inspection.bap_id && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(
                        `/bap/${activeDetail.inspection.bap_id}/pdf`,
                        `${(activeDetail.inspection.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                      )
                    }
                    className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-[#C81E1E] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#991B1B]"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Unduh BAP (PDF)</span>
                  </button>
                )}
                {activeDetail.inspection.lhpp_id && (
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadPdf(
                        `/lhpp/${activeDetail.inspection.lhpp_id}/pdf`,
                        `${(activeDetail.inspection.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                      )
                    }
                    className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-slate-800 dark:bg-slate-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                  >
                    <DownloadSimple size={16} weight="bold" />
                    <span>Unduh LHPP (PDF)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Parameter Checklist */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                1. Parameter Pemeriksaan &amp; Pengukuran Teknis
              </h4>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                {(activeDetail.items || []).map((item) => {
                  const row = draftResults[item.id] || {};
                  const readOnly = !isInspector || activeDetail.inspection.status !== 'DRAF';
                  const itemPhotos = (activeDetail.photos || []).filter(
                    (ph) => ph.caption && ph.caption.includes(`[${item.section}] ${item.label}`)
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-rose-700 dark:text-rose-400">[{item.section}]</span>
                          <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                          {item.unit && (
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                              ({item.unit}
                              {item.min_value !== null ? `, Min: ${item.min_value}` : ''}
                              {item.max_value !== null ? `, Maks: ${item.max_value}` : ''})
                            </span>
                          )}
                        </div>

                        {/* Indikator foto yang terlampir untuk butir uji ini */}
                        {itemPhotos.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {itemPhotos.map((ip) => (
                              <div
                                key={ip.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-[10px] font-semibold text-[#C81E1E] dark:text-rose-300"
                              >
                                <Camera size={11} weight="bold" />
                                <span>Foto Terlampir</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {item.input_type === 'CHOICE' && (
                          <select
                            disabled={readOnly}
                            value={row.choiceValue || 'SESUAI'}
                            onChange={(e) =>
                              setDraftResults((prev) => ({
                                ...prev,
                                [item.id]: { ...row, choiceValue: e.target.value }
                              }))
                            }
                            className={`min-h-9 rounded border px-2.5 py-1 text-xs font-semibold ${
                              row.choiceValue === 'TIDAK_SESUAI'
                                ? 'border-rose-400 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                : row.choiceValue === 'TIDAK_BERLAKU'
                                ? 'border-slate-300 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <option value="SESUAI">SESUAI (Memenuhi)</option>
                            <option value="TIDAK_SESUAI">TIDAK SESUAI (Temuan)</option>
                            <option value="TIDAK_BERLAKU">TIDAK BERLAKU (N/A)</option>
                          </select>
                        )}
                        {item.input_type === 'NUMBER' && (
                          <input
                            type="number"
                            step="any"
                            disabled={readOnly}
                            value={row.numberValue ?? ''}
                            onChange={(e) =>
                              setDraftResults((prev) => ({
                                ...prev,
                                [item.id]: { ...row, numberValue: e.target.value }
                              }))
                            }
                            placeholder={`Nilai (${item.unit || ''})`}
                            className="w-28 min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1 text-xs"
                          />
                        )}
                        {item.input_type === 'TEXT' && (
                          <input
                            type="text"
                            disabled={readOnly}
                            value={row.textValue ?? ''}
                            onChange={(e) =>
                              setDraftResults((prev) => ({
                                ...prev,
                                [item.id]: { ...row, textValue: e.target.value }
                              }))
                            }
                            className="w-44 min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 py-1 text-xs"
                          />
                        )}

                        {/* Inline Camera Trigger untuk butir ini */}
                        {!readOnly && (
                          <label
                            title="Ambil / Unggah Foto untuk butir ini"
                            className="min-h-9 inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs font-semibold"
                          >
                            <Camera size={14} weight="bold" />
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

            {/* Kesimpulan Teknis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-md border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Kesimpulan Kelayakan K3 *
                </label>
                <select
                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                  value={draftConclusion}
                  onChange={(e) => setDraftConclusion(e.target.value)}
                  className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {Object.entries(CONCLUSION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Catatan Kesimpulan Teknis
                </label>
                <input
                  type="text"
                  disabled={!isInspector || activeDetail.inspection.status !== 'DRAF'}
                  value={draftConclusionNotes}
                  onChange={(e) => setDraftConclusionNotes(e.target.value)}
                  placeholder="Ringkasan hasil pengujian..."
                  className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Ruang Lingkup BAP (Sesuai Template Berita Acara Riksa Uji) */}
            <div className="border border-slate-200 rounded-md p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#475569]">
                  2. Ruang Lingkup Riksa Uji (Untuk Dokumen BAP)
                </h4>
                <span className="text-xs font-semibold text-[#C81E1E]">
                  {draftScopes.length} lingkup dipilih
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                {(activeDetail.scopeCatalog || []).map((scopeItem) => {
                  const checked = draftScopes.includes(scopeItem);
                  const readOnly = !isInspector || activeDetail.inspection.status !== 'DRAF';
                  return (
                    <label
                      key={scopeItem}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        disabled={readOnly}
                        checked={checked}
                        onChange={() =>
                          setDraftScopes((prev) =>
                            checked ? prev.filter((s) => s !== scopeItem) : [...prev, scopeItem]
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-[#C81E1E]"
                      />
                      <span className={checked ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}>
                        {scopeItem}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Lampiran Foto Hasil Riksa Uji */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Camera size={16} />
                  <span>
                    3. Lampiran Foto Hasil Riksa Uji ({(activeDetail.photos || []).length} Foto)
                  </span>
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Minimal 2 foto dokumentasi (Nameplate &amp; Fisik Alat)
                </span>
              </div>

              {/* Grid Foto Responsif & Tombol Hapus */}
              {(activeDetail.photos || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(activeDetail.photos || []).map((ph) => (
                    <div
                      key={ph.id}
                      className="group relative rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 overflow-hidden shadow-2xs flex flex-col justify-between"
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
                            className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-rose-600/90 text-white hover:bg-rose-700 transition-all shadow-xs"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        )}
                      </div>
                      <div className="p-2">
                        <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                          {ph.caption || ph.originalName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada foto dokumentasi terlampir. Gunakan tombol di bawah atau kamera butir uji di atas untuk melampirkan foto nameplate dan kondisi alat.
                </div>
              )}

              {isInspector && activeDetail.inspection.status === 'DRAF' && (
                <form
                  onSubmit={handleUploadInspectionPhoto}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <div className="flex flex-col gap-1.5">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                    <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 sm:hidden">
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
                  <input
                    type="text"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Keterangan foto (mis: Nameplate & Uji Beban)..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !photoFile}
                    className="min-h-9 rounded bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
                  >
                    + Lampirkan Foto Riksa Uji
                  </button>
                </form>
              )}
            </div>

            {/* Temuan Ketidaksesuaian */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Warning size={16} />
                <span>4. Temuan Lapangan ({(activeDetail.findings || []).length})</span>
              </h4>
              {(activeDetail.findings || []).map((f) => (
                <div key={f.id} className="rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-2.5 text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">[{f.severity}]</span>{' '}
                  <span className="text-slate-800 dark:text-slate-200">{f.description}</span>
                  {f.recommendation && (
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Rekomendasi: {f.recommendation}
                    </div>
                  )}
                </div>
              ))}
              {isInspector && activeDetail.inspection.status === 'DRAF' && (
                <form onSubmit={handleAddFinding} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={findingForm.severity}
                    onChange={(e) =>
                      setFindingForm((prev) => ({ ...prev, severity: e.target.value }))
                    }
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="MINOR">MINOR</option>
                    <option value="MAYOR">MAYOR</option>
                    <option value="KRITIS">KRITIS</option>
                  </select>
                  <input
                    type="text"
                    value={findingForm.description}
                    onChange={(e) =>
                      setFindingForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Uraian temuan..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <input
                    type="text"
                    value={findingForm.recommendation}
                    onChange={(e) =>
                      setFindingForm((prev) => ({ ...prev, recommendation: e.target.value }))
                    }
                    placeholder="Rekomendasi perbaikan..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-9 rounded bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    + Tambah Temuan
                  </button>
                </form>
              )}
            </div>

            {/* Tanda Tangan Berita Acara (Kanvas Interaktif) */}
            <div id="ttd-digital-section" className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Signature size={16} />
                <span>
                  5. Kolom Tanda Tangan Berita Acara (Inspector & Pemilik Alat / Klien) (
                  {(activeDetail.signatures || []).length})
                </span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {(activeDetail.signatures || []).map((sig) => (
                  <div
                    key={sig.id}
                    className="inline-flex items-center gap-1.5 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 text-xs text-emerald-900 dark:text-emerald-200"
                  >
                    <CheckCircle size={15} />
                    <span>
                      <strong>{sig.signer_role}</strong>: {sig.signer_name} ({sig.signer_title})
                    </span>
                  </div>
                ))}
              </div>
              {isInspector && activeDetail.inspection.status === 'DRAF' && (
                <form onSubmit={handleSaveSignature} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={sigForm.signerRole}
                      onChange={(e) => {
                        const roleVal = e.target.value;
                        setSigForm((prev) => ({
                          ...prev,
                          signerRole: roleVal,
                          signerName:
                            roleVal === 'AHLI_K3'
                              ? user?.fullName || ''
                              : activeDetail.inspection?.contact_name || '',
                          signerTitle:
                            roleVal === 'AHLI_K3'
                              ? 'Ahli K3 Pemeriksa'
                              : 'Pemilik Alat / Perwakilan Klien'
                        }));
                      }}
                      className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="AHLI_K3">Inspector (Ahli K3)</option>
                      <option value="PERWAKILAN_KLIEN">Pemilik Alat / Perwakilan Klien</option>
                    </select>
                    <input
                      type="text"
                      value={sigForm.signerName}
                      onChange={(e) =>
                        setSigForm((prev) => ({ ...prev, signerName: e.target.value }))
                      }
                      placeholder="Nama penanda tangan..."
                      className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                    <input
                      type="text"
                      value={sigForm.signerTitle}
                      onChange={(e) =>
                        setSigForm((prev) => ({ ...prev, signerTitle: e.target.value }))
                      }
                      placeholder="Jabatan..."
                      className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Bubuhkan tanda tangan di kotak kanvas (wajib digoreskan):
                      </span>
                      <canvas
                        ref={sigCanvasRef}
                        width={280}
                        height={90}
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={handleCanvasPointerUp}
                        onPointerLeave={handleCanvasPointerUp}
                        className="rounded border border-slate-300 dark:border-slate-700 bg-white cursor-crosshair touch-none"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={clearSignatureCanvas}
                        className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Bersihkan Kanvas
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="min-h-9 rounded bg-slate-800 dark:bg-slate-700 px-4 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
                      >
                        Simpan Tanda Tangan ({sigForm.signerRole === 'AHLI_K3' ? 'Inspector' : 'Klien'})
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Tombol Simpan Draf & Selesaikan Riksa Uji (BAP + LHPP) */}
            {isInspector && activeDetail.inspection.status === 'DRAF' && (
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveDraft}
                  className="min-h-11 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FloppyDisk size={16} />
                  <span>Simpan Draf</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setReviewModalOpen(true)}
                  className="min-h-11 inline-flex items-center gap-1.5 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
                >
                  <PaperPlaneTilt size={16} />
                  <span>Selesaikan &amp; Verifikasi Pra-Kirim</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Ringkasan Pra-Kirim Riksa Uji (Pre-Submit Summary Gate) */}
      <Modal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Ringkasan Verifikasi Pra-Kirim Riksa Uji K3"
        size="lg"
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
            <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
              {error && <ErrorBanner message={error} onRetry={() => setError('')} />}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#C81E1E] dark:text-rose-400 text-sm">
                    {activeDetail.inspection.po_number || activeDetail.inspection.order_no}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-[#C81E1E] dark:bg-rose-950/60 dark:text-rose-300">
                    {activeDetail.inspection.category_code}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {activeDetail.inspection.object_name}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  SN: {activeDetail.inspection.serial_number} · Klien: {activeDetail.inspection.client_name}
                </div>
              </div>

              {/* Status Kelengkapan Checklist */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Kelengkapan Checklist Parameter Uji
                  </span>
                  <span className={`font-bold ${missingItems > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {evaluatedItems} dari {totalItems} butir terisi
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${missingItems > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${totalItems ? Math.round((evaluatedItems / totalItems) * 100) : 100}%` }}
                  />
                </div>
                {missingItems > 0 && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                        Perhatian: Masih ada {missingItems} butir checklist yang belum terisi.
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillAllStandard}
                        className="px-2.5 py-1 rounded bg-[#C81E1E] hover:bg-[#a61717] text-white font-bold text-xs shrink-0 transition-colors"
                      >
                        Tandai Semua Sesuai Standar
                      </button>
                    </div>
                    <div className="text-[11px] text-amber-900 dark:text-amber-200">
                      Butir belum lengkap:
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                        {missingList.map((m) => (
                          <li key={m.id}>
                            <span className="font-semibold">[{m.section}]</span> {m.label} ({m.input_type})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
                {nonConformingItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-rose-700 dark:text-rose-400 font-medium">
                    Terdapat {nonConformingItems.length} butir dengan hasil TIDAK SESUAI:
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 max-h-24 overflow-y-auto">
                      {nonConformingItems.map((ni) => (
                        <li key={ni.id}>[{ni.section}] {ni.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Status Foto & Tanda Tangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                    <span>Foto Dokumentasi</span>
                    <span className={photosCount > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                      {photosCount} Foto
                    </span>
                  </div>
                  {photosCount === 0 ? (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Disarankan melampirkan minimal 2 foto fisik alat &amp; nameplate sebelum submit.
                    </p>
                  ) : (
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {(activeDetail.photos || []).slice(0, 4).map((p) => (
                        <img
                          key={p.id}
                          src={`/api/v1/dashboard/files/${p.id}`}
                          alt="preview"
                          className="h-12 w-12 rounded object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    Tanda Tangan Digital
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span>Ahli K3 / Inspector:</span>
                      {inspectorSig ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={13} weight="bold" /> Sudah TTD
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold">Belum TTD</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Perwakilan Klien:</span>
                      {clientSig ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={13} weight="bold" /> Sudah TTD
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">Belum TTD (Bisa di BAP)</span>
                      )}
                    </div>
                  </div>
                  {!inspectorSig && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
                        TTD Ahli K3 wajib diisi sebelum mengirim.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalOpen(false);
                          setTimeout(() => {
                            document.getElementById('ttd-digital-section')?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 dark:bg-slate-700 text-white font-bold text-[11px] shrink-0 hover:bg-slate-900"
                      >
                        Bubuhkan TTD
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Kesimpulan Akhir */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Kesimpulan Akhir yang Akan Diterbitkan:
                </span>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {CONCLUSION_LABELS[draftConclusion] || draftConclusion}
                </div>
                {draftConclusionNotes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Catatan: {draftConclusionNotes}
                  </p>
                )}
              </div>

              {/* Tombol Aksi */}
              {activeDetail.inspection.status === 'TERKIRIM' ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle size={16} weight="fill" />
                    <span>Formulir riksa uji telah selesai dikirim dan dikunci secara resmi.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717]"
                  >
                    Tutup Ringkasan
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50"
                  >
                    Periksa Kembali
                  </button>
                  <button
                    type="button"
                    disabled={!canSubmit}
                    onClick={handleSubmitFinalInspection}
                    title={
                      missingItems > 0
                        ? `Lengkapi ${missingItems} butir wajib terlebih dahulu`
                        : !inspectorSig
                        ? 'Bubuhkan tanda tangan Ahli K3 terlebih dahulu'
                        : 'Kirim dan terbitkan dokumen'
                    }
                    className="px-5 py-2 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <CircleNotch size={15} weight="bold" className="animate-spin" />
                    ) : (
                      <PaperPlaneTilt size={15} weight="bold" />
                    )}
                    <span>
                      {submitting
                        ? 'Memproses Penerbitan...'
                        : missingItems > 0
                        ? `Lengkapi ${missingItems} Butir Terlebih Dahulu`
                        : !inspectorSig
                        ? 'Tanda Tangan Diperlukan'
                        : 'Konfirmasi & Kirim Riksa Uji'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
