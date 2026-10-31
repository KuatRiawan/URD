import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api/axios.js';
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from '../../../lib/utils/draft-storage.js';
import { compressImage } from '../../../lib/utils/image.js';
import {
  enqueueOfflineDraft,
  getPendingSyncSummary,
  setupAutoSyncListener
} from '../../../lib/utils/offline-sync.js';
import { enqueuePhoto } from '../../../lib/utils/offline-queue.js';
import { useInspectionSignatures } from './useInspectionSignatures.js';

export function useInspectionDetailForm({ inspectionId, user, onSaved, confirm }) {
  const [activeDetail, setActiveDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [draftResults, setDraftResults] = useState({});
  const [draftConclusion, setDraftConclusion] = useState('');
  const [draftConclusionNotes, setDraftConclusionNotes] = useState('');
  const [draftScopes, setDraftScopes] = useState([]);
  const [draftObjectAttributes, setDraftObjectAttributes] = useState({});
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

  const signatures = useInspectionSignatures({
    activeDetail,
    user,
    setError,
    setFeedback,
    setSubmitting,
    openDetail: (id) => openDetail(id)
  });

  const initSignaturesRef = useRef(signatures.initSignatures);
  initSignaturesRef.current = signatures.initSignatures;

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
      setDraftConclusion(data.inspection?.conclusion || '');
      setDraftConclusionNotes(data.inspection?.conclusion_notes || '');
      setDraftObjectAttributes(
        typeof data.inspection?.object_attributes === 'object' && data.inspection?.object_attributes !== null
          ? data.inspection.object_attributes
          : {}
      );
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
              : '',
          textValue: existing?.text_value || '',
          note: existing?.note || ''
        };
      }
      setDraftResults((prev) => {
        const merged = { ...map };
        for (const [k, v] of Object.entries(prev || {})) {
          if (v && (v.choiceValue || v.numberValue || v.textValue || v.note)) {
            merged[k] = { ...merged[k], ...v };
          }
        }
        return merged;
      });

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

      initSignaturesRef.current?.(data);
      setFormStep((prev) => (data.inspection?.status === 'TERKIRIM' ? 2 : (prev || 1)));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail form inspeksi.');
    } finally {
      setLoading(false);
    }
  }, []);

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
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    const teardown = setupAutoSyncListener(() => {
      refreshQueuedCount();
      if (activeDetail?.inspection?.id) {
        openDetail(activeDetail.inspection.id);
      }
    });
    refreshQueuedCount();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      teardown();
    };
  }, [activeDetail?.inspection?.id, openDetail, refreshQueuedCount]);

  // Debounced Autosave
  useEffect(() => {
    if (!activeDetail?.inspection || activeDetail.inspection.status !== 'DRAF') return;
    const timeout = setTimeout(async () => {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || null : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || null : null,
          note: row.note || ''
        };
      });

      saveLocalDraft(activeDetail.inspection.id, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        scopeItems: draftScopes,
        savedAt: Date.now()
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes
        });
        setLastSavedAt(new Date());
        return;
      }

      try {
        await api.put(`/inspections/${activeDetail.inspection.id}/draft`, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes
        });
        setLastSavedAt(new Date());
      } catch {
        // Abaikan error background autosave
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [draftResults, draftConclusion, draftConclusionNotes, draftScopes, activeDetail?.inspection, activeDetail?.items]);

  const handleSaveDraft = async () => {
    if (!activeDetail?.inspection) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || null : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || null : null,
          note: row.note || ''
        };
      });

      saveLocalDraft(activeDetail.inspection.id, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        scopeItems: draftScopes,
        savedAt: Date.now()
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes
        });
        setFeedback('Tersimpan di perangkat (offline mode).');
        setLastSavedAt(new Date());
        return;
      }

      await api.put(`/inspections/${activeDetail.inspection.id}/draft`, {
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        results: payloadResults,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes
      });

      setFeedback('Draf riksa uji dan lingkup pemeriksaan berhasil disimpan.');
      setLastSavedAt(new Date());
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan draf inspeksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFinding = async () => {
    if (!activeDetail?.inspection || !findingForm.description.trim()) {
      setError('Deskripsi temuan wajib diisi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspections/${activeDetail.inspection.id}/findings`, findingForm);
      setFindingForm({ severity: 'MAYOR', description: '', recommendation: '' });
      setFeedback('Temuan riksa uji berhasil ditambahkan.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan temuan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!activeDetail?.inspection || !photoFile) return;
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(photoFile);
      if (!online) {
        await enqueuePhoto(activeDetail.inspection.id, prepared, photoCaption.trim());
        setPhotoFile(null);
        setPhotoCaption('');
        setFeedback('Foto disimpan offline. Akan dikirim otomatis saat tersambung internet.');
        await refreshQueuedCount();
        return;
      }

      const fd = new FormData();
      fd.append('photo', prepared);
      if (photoCaption.trim()) fd.append('caption', photoCaption.trim());
      await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoFile(null);
      setPhotoCaption('');
      setFeedback('Foto dokumentasi berhasil diunggah.');
      await openDetail(activeDetail.inspection.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengunggah foto dokumentasi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!activeDetail?.inspection) return;
    const ok = await confirm({
      title: 'Hapus Foto Dokumentasi',
      message: 'Apakah Anda yakin ingin menghapus foto dokumentasi ini?',
      confirmText: 'Ya, Hapus Foto',
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

  const handleSubmitFinal = async () => {
    if (!activeDetail?.inspection || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = (activeDetail.items || []).map((item) => {
        const row = draftResults[item.id] || {};
        return {
          itemId: item.id,
          choiceValue: item.input_type === 'CHOICE' ? row.choiceValue || null : null,
          numberValue:
            item.input_type === 'NUMBER' && row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined
              ? Number(row.numberValue)
              : null,
          textValue: item.input_type === 'TEXT' ? row.textValue || null : null,
          note: row.note || ''
        };
      });

      const res = await api.post(`/inspections/${activeDetail.inspection.id}/submit`, {
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        results: payloadResults,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes
      });

      clearLocalDraft(activeDetail.inspection.id);

      const msg = res.data?.message || 'Pemeriksaan riksa uji berhasil diselesaikan.';
      const bapInfo = res.data?.bap?.bapNo ? ` Dokumen BAP (${res.data.bap.bapNo}) telah diterbitkan.` : '';
      const lhppInfo = res.data?.lhpp?.lhppNo ? ` Dokumen LHPP (${res.data.lhpp.lhppNo}) telah dibuat.` : '';
      setFeedback(`${msg}${bapInfo}${lhppInfo}`);

      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengirimkan laporan riksa uji final.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoFillAllStandard = () => {
    if (!activeDetail?.items) return;
    const updated = { ...draftResults };
    for (const it of activeDetail.items) {
      const cur = updated[it.id] || {};
      updated[it.id] = {
        itemId: it.id,
        choiceValue: it.input_type === 'CHOICE' ? (cur.choiceValue || 'SESUAI') : null,
        numberValue:
          it.input_type === 'NUMBER'
            ? (cur.numberValue !== '' && cur.numberValue !== null && cur.numberValue !== undefined
                ? cur.numberValue
                : '')
            : '',
        textValue: it.input_type === 'TEXT' ? (cur.textValue || '') : '',
        note: cur.note || ''
      };
    }
    setDraftResults(updated);
    setFeedback('Item pilihan ditandai Sesuai. Isi hasil ukur dan catatan teknis berdasarkan pemeriksaan lapangan.');
  };

  // Metrics
  const totalItems = (activeDetail?.items || []).length;
  const evaluatedItems = (activeDetail?.items || []).filter((item) => {
    const res = draftResults[item.id];
    if (!res) return false;
    if (item.input_type === 'CHOICE') return !!res.choiceValue;
    if (item.input_type === 'NUMBER')
      return res.numberValue !== '' && res.numberValue !== null && res.numberValue !== undefined;
    if (item.input_type === 'TEXT') return !!res.textValue;
    return true;
  }).length;
  const missingItems = totalItems - evaluatedItems;
  const photosCount = (activeDetail?.photos || []).length;

  const inspectorSig = (activeDetail?.signatures || []).find((s) =>
    ['AHLI_K3', 'INSPECTOR'].includes(s.signer_role)
  );
  const clientSig = (activeDetail?.signatures || []).find((s) =>
    ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role)
  );

  const canSubmit =
    missingItems === 0 &&
    Boolean(draftConclusion) &&
    Boolean(inspectorSig) &&
    Boolean(clientSig) &&
    !submitting;

  return {
    activeDetail,
    loading,
    error,
    setError,
    feedback,
    setFeedback,
    submitting,
    draftResults,
    setDraftResults,
    draftConclusion,
    setDraftConclusion,
    draftConclusionNotes,
    setDraftConclusionNotes,
    draftScopes,
    setDraftScopes,
    draftObjectAttributes,
    setDraftObjectAttributes,
    formStep,
    setFormStep,
    lastSavedAt,
    photoFile,
    setPhotoFile,
    photoCaption,
    setPhotoCaption,
    online,
    queuedPhotoCount,
    findingForm,
    setFindingForm,
    signatures,
    openDetail,
    handleSaveDraft,
    handleAddFinding,
    handleUploadPhoto,
    handleDeletePhoto,
    handleUploadItemInlinePhoto,
    handleSubmitFinal,
    handleAutoFillAllStandard,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
    clientSig,
    canSubmit
  };
}

