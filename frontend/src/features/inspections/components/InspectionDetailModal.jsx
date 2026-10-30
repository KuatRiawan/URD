import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle, Eye, FloppyDisk } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { useConfirm } from '../../../components/ui/FeedbackProvider.jsx';
import { api } from '../../../lib/api/axios.js';
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from '../../../lib/utils/draft-storage.js';
import { formatDateTime } from '../../../lib/utils/format.js';
import { compressImage } from '../../../lib/utils/image.js';
import {
  enqueueOfflineDraft,
  getPendingSyncSummary,
  setupAutoSyncListener
} from '../../../lib/utils/offline-sync.js';
import { enqueuePhoto } from '../../../lib/utils/offline-queue.js';
import { StepChecklist } from './StepChecklist.jsx';
import { StepConclusion } from './StepConclusion.jsx';
import { StepPhotosFindings } from './StepPhotosFindings.jsx';
import { StepSignatures } from './StepSignatures.jsx';

export function InspectionDetailModal({
  inspectionId,
  onClose,
  isInspector,
  user,
  onSaved,
  onPreviewPdf
}) {
  const confirm = useConfirm();
  const [activeDetail, setActiveDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [draftResults, setDraftResults] = useState({});
  const [draftConclusion, setDraftConclusion] = useState('MEMENUHI_SYARAT');
  const [draftConclusionNotes, setDraftConclusionNotes] = useState('');
  const [draftScopes, setDraftScopes] = useState([]);
  const [formStep, setFormStep] = useState(1);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Foto & Temuan
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [queuedPhotoCount, setQueuedPhotoCount] = useState(0);
  const [findingForm, setFindingForm] = useState({
    severity: 'MAYOR',
    description: '',
    recommendation: ''
  });

  // Tanda Tangan Touchscreen
  const [inspectorSigName, setInspectorSigName] = useState('');
  const [inspectorSigTitle, setInspectorSigTitle] = useState('Ahli K3 Spesialis');
  const [clientSigName, setClientSigName] = useState('');
  const [clientSigTitle, setClientSigTitle] = useState('Pemilik Alat / PIC Klien');
  const [reSigningInspector, setReSigningInspector] = useState(false);
  const [reSigningClient, setReSigningClient] = useState(false);

  const inspectorCanvasRef = useRef(null);
  const clientCanvasRef = useRef(null);
  const isDrawingInspectorRef = useRef(false);
  const isDrawingClientRef = useRef(false);
  const [hasDrawnInspectorSig, setHasDrawnInspectorSig] = useState(false);
  const [hasDrawnClientSig, setHasDrawnClientSig] = useState(false);

  const openDetail = useCallback(async (id) => {
    if (!id) {
      setActiveDetail(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/inspections/${id}`);
      setActiveDetail(data);
      setDraftConclusion(data.inspection?.conclusion || 'MEMENUHI_SYARAT');
      setDraftConclusionNotes(data.inspection?.conclusion_notes || '');
      setLastSavedAt(data.inspection?.updated_at ? new Date(data.inspection.updated_at) : null);

      const map = {};
      for (const item of data.items || []) {
        const existing = (data.results || []).find((r) => r.item_id === item.id);
        map[item.id] = {
          itemId: item.id,
          choiceValue: existing?.choice_value || null,
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

      const local = loadLocalDraft(id);
      const serverTime = data.inspection?.updated_at ? new Date(data.inspection.updated_at).getTime() : 0;
      if (local && data.inspection?.status === 'DRAF' && local.savedAt > serverTime) {
        if (local.results) setDraftResults(local.results);
        if (local.conclusion) setDraftConclusion(local.conclusion);
        if (typeof local.conclusionNotes === 'string') setDraftConclusionNotes(local.conclusionNotes);
        setFeedback('Draf lokal berhasil dipulihkan dari perangkat.');
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
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail form inspeksi.');
    } finally {
      setLoading(false);
    }
  }, [user?.fullName]);

  useEffect(() => {
    if (inspectionId) {
      openDetail(inspectionId);
    } else {
      setActiveDetail(null);
    }
  }, [inspectionId, openDetail]);

  const refreshQueuedCount = useCallback(async () => {
    try {
      const summary = await getPendingSyncSummary();
      setQueuedPhotoCount(summary.totalPending);
    } catch {
      setQueuedPhotoCount(0);
    }
  }, []);

  // Sinkronisasi otomatis saat online kembali
  useEffect(() => {
    if (!inspectionId) return undefined;
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
        await openDetail(inspectionId);
      } else if (evt.status === 'online') {
        setOnline(true);
      }
    });
    return () => unsub();
  }, [inspectionId, openDetail, refreshQueuedCount]);

  // Autosave draf berkala ke penyimpanan lokal
  useEffect(() => {
    if (!inspectionId || !isInspector || activeDetail?.inspection?.status !== 'DRAF') return undefined;
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

      saveLocalDraft(inspectionId, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(inspectionId, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults
        });
        refreshQueuedCount();
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [inspectionId, isInspector, activeDetail, draftResults, draftConclusion, draftConclusionNotes, refreshQueuedCount]);

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
        setFeedback('Mode Offline: Draf tersimpan di memori perangkat.');
        return;
      }

      try {
        await api.put(`/inspections/${activeDetail.inspection.id}/draft`, draftPayload);
        clearLocalDraft(activeDetail.inspection.id);
        setFeedback('Draf hasil pemeriksaan teknis berhasil disimpan.');
        await openDetail(activeDetail.inspection.id);
        if (onSaved) onSaved();
      } catch (saveErr) {
        if (!saveErr.response) {
          await enqueueOfflineDraft(activeDetail.inspection.id, draftPayload);
          await refreshQueuedCount();
          setFeedback('Koneksi terputus. Draf tersimpan di perangkat lokal.');
        } else {
          throw saveErr;
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan draf pemeriksaan.');
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
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menambahkan temuan lapangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPhoto = async (e) => {
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
        setFeedback('Koneksi terputus. Foto disimpan di perangkat.');
        return;
      }
      setPhotoFile(null);
      setPhotoCaption('');
      setFeedback('Foto dokumentasi hasil riksa uji berhasil dilampirkan.');
      await openDetail(activeDetail.inspection.id);
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

  const handleDeletePhoto = async (photoId) => {
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
      await openDetail(activeDetail.inspection.id);
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
      await openDetail(activeDetail.inspection.id);
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

  // Canvas Handlers Ahli K3
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
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital Ahli K3.');
    } finally {
      setSubmitting(false);
    }
  };

  // Canvas Handlers PIC Klien
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
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan tanda tangan digital PIC Klien.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Final Riksa Uji
  const handleSubmitFinal = async () => {
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
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      if (err.response?.status === 409 || err.response?.data?.error?.code === 'INSPECTION_LOCKED') {
        clearLocalDraft(activeDetail.inspection.id);
        setFeedback(
          'Formulir riksa uji ini telah terkirim dan terkunci. Dokumen BAP dan LHPP siap diunduh.'
        );
        await openDetail(activeDetail.inspection.id);
        if (onSaved) onSaved();
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

  if (!inspectionId || !activeDetail?.inspection) return null;

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
    <Modal
      open={Boolean(inspectionId)}
      onClose={onClose}
      title={`Form Inspeksi: ${activeDetail.inspection.object_name} (${activeDetail.inspection.order_no})`}
      size="xl"
    >
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
                    onPreviewPdf(
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
                    onPreviewPdf(
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

        {/* Render Tab Berdasarkan Langkah Aktif */}
        {formStep === 1 && (
          <StepChecklist
            items={activeDetail.items || []}
            draftResults={draftResults}
            setDraftResults={setDraftResults}
            onUploadInlinePhoto={handleUploadItemInlinePhoto}
            readOnly={!isInspector || activeDetail.inspection.status !== 'DRAF'}
            missingItems={missingItems}
            evaluatedItems={evaluatedItems}
            totalItems={totalItems}
            onAutoFillStandard={handleAutoFillAllStandard}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            photos={activeDetail.photos || []}
            onNext={() => setFormStep(2)}
          />
        )}

        {formStep === 2 && (
          <StepConclusion
            draftConclusion={draftConclusion}
            setDraftConclusion={setDraftConclusion}
            draftConclusionNotes={draftConclusionNotes}
            setDraftConclusionNotes={setDraftConclusionNotes}
            draftScopes={draftScopes}
            setDraftScopes={setDraftScopes}
            scopeCatalog={activeDetail.scopeCatalog || []}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            onSaveDraft={handleSaveDraft}
            onBack={() => setFormStep(1)}
            onNext={() => setFormStep(3)}
          />
        )}

        {formStep === 3 && (
          <StepPhotosFindings
            photos={activeDetail.photos || []}
            findings={activeDetail.findings || []}
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            photoCaption={photoCaption}
            setPhotoCaption={setPhotoCaption}
            findingForm={findingForm}
            setFindingForm={setFindingForm}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            onUploadPhoto={handleUploadPhoto}
            onDeletePhoto={handleDeletePhoto}
            onAddFinding={handleAddFinding}
            onSaveDraft={handleSaveDraft}
            onBack={() => setFormStep(2)}
            onNext={() => setFormStep(4)}
          />
        )}

        {formStep === 4 && (
          <StepSignatures
            inspectorSig={inspectorSig}
            clientSig={clientSig}
            inspectorSigName={inspectorSigName}
            setInspectorSigName={setInspectorSigName}
            inspectorSigTitle={inspectorSigTitle}
            setInspectorSigTitle={setInspectorSigTitle}
            clientSigName={clientSigName}
            setClientSigName={setClientSigName}
            clientSigTitle={clientSigTitle}
            setClientSigTitle={setClientSigTitle}
            inspectorCanvasRef={inspectorCanvasRef}
            clientCanvasRef={clientCanvasRef}
            onInspectorPointerDown={handleInspectorPointerDown}
            onInspectorPointerMove={handleInspectorPointerMove}
            onInspectorPointerUp={handleInspectorPointerUp}
            onClientPointerDown={handleClientPointerDown}
            onClientPointerMove={handleClientPointerMove}
            onClientPointerUp={handleClientPointerUp}
            onClearInspectorCanvas={clearInspectorCanvas}
            onClearClientCanvas={clearClientCanvas}
            onSaveInspectorSignature={handleSaveInspectorSignature}
            onSaveClientSignature={handleSaveClientSignature}
            reSigningInspector={reSigningInspector}
            setReSigningInspector={setReSigningInspector}
            reSigningClient={reSigningClient}
            setReSigningClient={setReSigningClient}
            isInspector={isInspector}
            status={activeDetail.inspection.status}
            submitting={submitting}
            canSubmit={canSubmit}
            missingItems={missingItems}
            evaluatedItems={evaluatedItems}
            totalItems={totalItems}
            photosCount={photosCount}
            draftConclusion={draftConclusion}
            onAutoFillStandard={handleAutoFillAllStandard}
            onSubmitFinal={handleSubmitFinal}
            onBack={() => setFormStep(3)}
            onSaveDraft={handleSaveDraft}
            onCloseModal={onClose}
            onPreviewPdf={onPreviewPdf}
            bapId={activeDetail.inspection.bap_id}
            bapNo={activeDetail.inspection.bap_no}
            lhppId={activeDetail.inspection.lhpp_id}
            lhppNo={activeDetail.inspection.lhpp_no}
          />
        )}
      </div>
    </Modal>
  );
}
