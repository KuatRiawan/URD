import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../../lib/api/axios.js';
import { clearLocalDraft, loadLocalDraft, saveLocalDraft } from '../../../lib/utils/draft-storage.js';
import { compressImage } from '../../../lib/utils/image.js';
import {
  enqueueOfflineDraft,
  enqueueOfflinePhoto,
  getPendingSyncSummary,
  setupAutoSyncListener
} from '../../../lib/utils/offline-sync.js';
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

  // Sinkronisasi status & ref untuk persistensi draf instan
  const isInitializedRef = useRef(false);
  const draftResultsRef = useRef(draftResults);
  draftResultsRef.current = draftResults;
  const draftConclusionRef = useRef(draftConclusion);
  draftConclusionRef.current = draftConclusion;
  const draftConclusionNotesRef = useRef(draftConclusionNotes);
  draftConclusionNotesRef.current = draftConclusionNotes;
  const draftScopesRef = useRef(draftScopes);
  draftScopesRef.current = draftScopes;
  const draftObjectAttributesRef = useRef(draftObjectAttributes);
  draftObjectAttributesRef.current = draftObjectAttributes;
  const formStepRef = useRef(formStep);
  formStepRef.current = formStep;
  const activeDetailRef = useRef(activeDetail);
  activeDetailRef.current = activeDetail;

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
    isInitializedRef.current = false;
    try {
      const { data } = await api.get(`/inspections/${id}`);
      setActiveDetail(data);

      const isDraftStatus = data.inspection?.status === 'DRAF';

      // 1. Nilai standar dari server
      const serverConclusion = data.inspection?.conclusion || '';
      const serverConclusionNotes = data.inspection?.conclusion_notes || '';
      const serverAttributes =
        typeof data.inspection?.object_attributes === 'object' && data.inspection?.object_attributes !== null
          ? data.inspection.object_attributes
          : {};
      const initialScopes =
        Array.isArray(data.inspection?.bap_scope_items) && data.inspection.bap_scope_items.length
          ? data.inspection.bap_scope_items
          : Array.isArray(data.inspection?.unit_scope_items) && data.inspection.unit_scope_items.length
          ? data.inspection.unit_scope_items
          : Array.isArray(data.inspection?.default_bap_scopes) &&
            data.inspection.default_bap_scopes.length
          ? data.inspection.default_bap_scopes
          : ['Pemeriksaan Data & Gambar', 'Pemeriksaan Visual', 'Uji Fungsi'];

      const serverMap = {};
      for (const item of data.items || []) {
        const existing = (data.results || []).find((r) => r.item_id === item.id);
        serverMap[item.id] = {
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

      // 2. Jika status BUKAN draf (misal TERKIRIM), bersihkan draf lokal dan gunakan murni data server
      if (!isDraftStatus) {
        clearLocalDraft(id);
        setDraftResults(serverMap);
        setDraftConclusion(serverConclusion);
        setDraftConclusionNotes(serverConclusionNotes);
        setDraftObjectAttributes(serverAttributes);
        setDraftScopes(initialScopes);
        setFormStep(2);
        setLastSavedAt(data.inspection?.updated_at ? new Date(data.inspection.updated_at) : null);
        initSignaturesRef.current?.(data);
        isInitializedRef.current = true;
        return;
      }

      // 3. Untuk status DRAF: pulihkan data lokal dari perangkat jika ada
      const local = loadLocalDraft(id);
      let isRestoredFromLocal = false;

      // Gabungkan hasil checklist: baseline server ditimpa dengan inputan lokal terkini
      const mergedResults = { ...serverMap };
      if (local?.results && typeof local.results === 'object') {
        for (const [itemId, row] of Object.entries(local.results)) {
          if (
            row &&
            (row.choiceValue ||
              (row.numberValue !== '' && row.numberValue !== null && row.numberValue !== undefined) ||
              row.textValue ||
              row.note)
          ) {
            mergedResults[itemId] = { ...(mergedResults[itemId] || {}), ...row };
            isRestoredFromLocal = true;
          }
        }
      }

      // Gabungkan atribut nameplate / spesifikasi teknis
      const mergedAttributes = {
        ...serverAttributes,
        ...(local?.objectAttributes && typeof local.objectAttributes === 'object' ? local.objectAttributes : {})
      };
      if (local?.objectAttributes && Object.keys(local.objectAttributes).length > 0) {
        const hasLocalVal = Object.values(local.objectAttributes).some(
          (v) => v !== '' && v !== null && v !== undefined
        );
        if (hasLocalVal) isRestoredFromLocal = true;
      }

      // Kesimpulan & catatan kesimpulan
      const mergedConclusion = local?.conclusion || serverConclusion;
      if (local?.conclusion && local.conclusion !== serverConclusion) {
        isRestoredFromLocal = true;
      }

      const mergedConclusionNotes =
        typeof local?.conclusionNotes === 'string' && local.conclusionNotes.length > 0
          ? local.conclusionNotes
          : serverConclusionNotes;
      if (local?.conclusionNotes && local.conclusionNotes !== serverConclusionNotes) {
        isRestoredFromLocal = true;
      }

      // Lingkup pemeriksaan
      const mergedScopes =
        Array.isArray(local?.scopeItems) && local.scopeItems.length
          ? local.scopeItems
          : initialScopes;

      // Langkah tab form
      const mergedStep = [1, 2].includes(local?.formStep) ? local.formStep : 1;
      if (local?.formStep && local.formStep > 1) {
        isRestoredFromLocal = true;
      }

      // Pasang semua state
      setDraftResults(mergedResults);
      setDraftObjectAttributes(mergedAttributes);
      setDraftConclusion(mergedConclusion);
      setDraftConclusionNotes(mergedConclusionNotes);
      setDraftScopes(mergedScopes);
      setFormStep(mergedStep);

      const savedTime = local?.savedAt
        ? new Date(local.savedAt)
        : data.inspection?.updated_at
        ? new Date(data.inspection.updated_at)
        : null;
      setLastSavedAt(savedTime);

      if (isRestoredFromLocal) {
        setFeedback(
          'Draf riksa uji Anda berhasil dipulihkan otomatis. Anda dapat melanjutkan tanpa mengulang dari awal.'
        );
      }

      initSignaturesRef.current?.(data);
      isInitializedRef.current = true;
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
    const teardown = setupAutoSyncListener(api, ({ status, result }) => {
      refreshQueuedCount();
      if (activeDetail?.inspection?.id) {
        openDetail(activeDetail.inspection.id);
      }
      if (status === 'failed' && result?.errors?.length) {
        setError(`Sinkronisasi offline gagal untuk ${result.errors.length} item. Data tetap tersimpan di perangkat.`);
      }
    });
    refreshQueuedCount();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      teardown();
    };
  }, [activeDetail?.inspection?.id, openDetail, refreshQueuedCount]);

  // 1. Simpan seketika (instant) ke local storage perangkat setiap kali ada perubahan pada form
  useEffect(() => {
    if (!isInitializedRef.current) return;
    if (!activeDetail?.inspection?.id || activeDetail.inspection.status !== 'DRAF') return;

    saveLocalDraft(activeDetail.inspection.id, {
      results: draftResults,
      conclusion: draftConclusion,
      conclusionNotes: draftConclusionNotes,
      scopeItems: draftScopes,
      objectAttributes: draftObjectAttributes,
      formStep,
      savedAt: Date.now()
    });
  }, [
    activeDetail?.inspection?.id,
    activeDetail?.inspection?.status,
    draftResults,
    draftConclusion,
    draftConclusionNotes,
    draftScopes,
    draftObjectAttributes,
    formStep
  ]);

  // 2. Simpan seketika saat form ditutup, navigasi berpindah, atau browser di-refresh
  useEffect(() => {
    const flushDraft = () => {
      if (
        isInitializedRef.current &&
        activeDetailRef.current?.inspection?.id &&
        activeDetailRef.current.inspection.status === 'DRAF'
      ) {
        saveLocalDraft(activeDetailRef.current.inspection.id, {
          results: draftResultsRef.current,
          conclusion: draftConclusionRef.current,
          conclusionNotes: draftConclusionNotesRef.current,
          scopeItems: draftScopesRef.current,
          objectAttributes: draftObjectAttributesRef.current,
          formStep: formStepRef.current,
          savedAt: Date.now()
        });
      }
    };

    window.addEventListener('beforeunload', flushDraft);
    return () => {
      window.removeEventListener('beforeunload', flushDraft);
      flushDraft();
    };
  }, []);

  // 3. Debounced Autosave ke backend / antrean sinkronisasi offline (setiap 2 detik hening)
  useEffect(() => {
    if (!isInitializedRef.current) return;
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

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes,
          objectAttributes: draftObjectAttributes
        });
        setLastSavedAt(new Date());
        return;
      }

      try {
        await api.put(`/inspections/${activeDetail.inspection.id}/draft`, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes,
          objectAttributes: draftObjectAttributes
        });
        setLastSavedAt(new Date());
      } catch {
        // Abaikan error background autosave
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [
    draftResults,
    draftConclusion,
    draftConclusionNotes,
    draftScopes,
    draftObjectAttributes,
    activeDetail?.inspection,
    activeDetail?.items
  ]);

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
        objectAttributes: draftObjectAttributes,
        formStep,
        savedAt: Date.now()
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes,
          objectAttributes: draftObjectAttributes
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

  const handleDiscardDraft = async () => {
    if (!activeDetail?.inspection?.id) return;
    const ok = await confirm({
      title: 'Kosongkan Draf Isian?',
      message:
        'Apakah Anda yakin ingin mengosongkan draf di perangkat ini dan memuat ulang data asli dari server?',
      confirmText: 'Ya, Kosongkan Draf',
      tone: 'danger'
    });
    if (!ok) return;
    clearLocalDraft(activeDetail.inspection.id);
    await openDetail(activeDetail.inspection.id);
    setFeedback('Draf lokal berhasil dikosongkan.');
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
        await enqueueOfflinePhoto({
          inspectionId: activeDetail.inspection.id,
          file: prepared,
          caption: photoCaption.trim()
        });
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
      if (onSaved) onSaved();
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
      if (onSaved) onSaved();
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
      if (onSaved) onSaved();
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

  const handleUploadNameplatePhoto = async (file) => {
    if (!activeDetail?.inspection || !file) return;
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(file);
      const caption = 'Foto Nameplate Pabrik Unit';
      if (!online) {
        await enqueueOfflinePhoto({
          inspectionId: activeDetail.inspection.id,
          file: prepared,
          caption
        });
        setFeedback('Foto nameplate disimpan offline. Akan dikirim otomatis saat tersambung internet.');
        await refreshQueuedCount();
        return;
      }
      const fd = new FormData();
      fd.append('photo', prepared);
      fd.append('caption', caption);
      await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback('Foto nameplate unit berhasil diunggah.');
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal mengunggah foto nameplate.'
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
    handleDiscardDraft,
    handleAddFinding,
    handleUploadPhoto,
    handleDeletePhoto,
    handleUploadItemInlinePhoto,
    handleUploadNameplatePhoto,
    handleSubmitFinal,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
    clientSig,
    canSubmit
  };
}
