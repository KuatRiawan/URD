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
import {
  buildItemsBySeqMap,
  buildInspectionResultPayload,
  isChecklistItemFilled,
  isConditionalItemVisible,
  isFieldRelevantItem
} from '../utils/checklistUtils.js';

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
  const [workPhase, setWorkPhase] = useState('FIELD');
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Foto & Temuan
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingItemId, setUploadingItemId] = useState('');
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
  const workPhaseRef = useRef(workPhase);
  workPhaseRef.current = workPhase;
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
          dateValue: existing?.date_value ? String(existing.date_value).slice(0, 10) : '',
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
        setFormStep(1);
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
      const mergedStep =
        Number.isInteger(local?.formStep) && local.formStep >= 1 && local.formStep <= 5
          ? local.formStep
          : 1;
      if (local?.formStep && local.formStep > 1) {
        isRestoredFromLocal = true;
      }
      const defaultPhase =
        local?.workPhase === 'FIELD' || local?.workPhase === 'OFFICE'
          ? local.workPhase
          : data.inspection?.work_phase === 'OFFICE' || data.inspection?.status !== 'DRAF'
            ? 'OFFICE'
            : 'FIELD';

      // Pasang semua state
      setDraftResults(mergedResults);
      setDraftObjectAttributes(mergedAttributes);
      setDraftConclusion(mergedConclusion);
      setDraftConclusionNotes(mergedConclusionNotes);
      setDraftScopes(mergedScopes);
      setFormStep(mergedStep);
      setWorkPhase(defaultPhase);

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
  }, [user?.role]);

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
      workPhase,
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
    formStep,
    workPhase
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
          workPhase: workPhaseRef.current,
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
      const payloadResults = buildInspectionResultPayload(activeDetail.items || [], draftResults);

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
          objectAttributes: draftObjectAttributes,
          workPhase
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
    workPhase,
    activeDetail?.inspection,
    activeDetail?.items
  ]);

  const handleSaveDraft = async () => {
    if (!activeDetail?.inspection) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = buildInspectionResultPayload(activeDetail.items || [], draftResults);

      saveLocalDraft(activeDetail.inspection.id, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes,
        formStep,
        workPhase,
        savedAt: Date.now()
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes,
          objectAttributes: draftObjectAttributes,
          workPhase
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
        objectAttributes: draftObjectAttributes,
        workPhase
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

  const handleSaveFieldProgressAndBap = async () => {
    if (!activeDetail?.inspection) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = buildInspectionResultPayload(activeDetail.items || [], draftResults);

      saveLocalDraft(activeDetail.inspection.id, {
        results: draftResults,
        conclusion: draftConclusion,
        conclusionNotes: draftConclusionNotes,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes,
        formStep,
        workPhase: 'FIELD',
        savedAt: Date.now()
      });

      if (!navigator.onLine) {
        await enqueueOfflineDraft(activeDetail.inspection.id, {
          conclusion: draftConclusion,
          conclusionNotes: draftConclusionNotes,
          results: payloadResults,
          scopeItems: draftScopes,
          objectAttributes: draftObjectAttributes,
          workPhase: 'FIELD'
        });
        setFeedback('Progres lapangan disimpan di perangkat. Penyiapan draf BAP akan disinkronkan saat online.');
        setLastSavedAt(new Date());
        return;
      }

      const res = await api.put(`/inspections/${activeDetail.inspection.id}/draft`, {
        conclusion: draftConclusion || null,
        conclusionNotes: draftConclusionNotes,
        results: payloadResults,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes,
        workPhase: 'FIELD',
        prepareBapDraft: true
      });

      const bapNo = res.data?.bap?.bapNo ? ` Draf BAP (${res.data.bap.bapNo}) siap ditandatangani.` : '';
      setFeedback(
        `Progres lapangan tersimpan dan checklist tetap terbuka untuk dilanjutkan di kantor.${bapNo}`
      );
      setLastSavedAt(new Date());
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan progres lapangan dan menyiapkan draf BAP.');
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

  const handleUploadPhotoDirect = async (file, caption, docCategory) => {
    if (!activeDetail?.inspection || !file) return;
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(file);
      if (!online) {
        await enqueueOfflinePhoto({
          inspectionId: activeDetail.inspection.id,
          file: prepared,
          caption: (caption || '').trim(),
          docCategory: docCategory || null
        });
        setFeedback('Foto disimpan offline. Akan disinkronkan saat tersambung internet.');
        await refreshQueuedCount();
        return;
      }

      const fd = new FormData();
      fd.append('photo', prepared);
      if (caption) fd.append('caption', caption.trim());
      if (docCategory) fd.append('docCategory', docCategory);

      await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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

  const handleUpdatePhotoCaption = async (photoId, caption) => {
    if (!activeDetail?.inspection?.id || !photoId) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/inspections/${activeDetail.inspection.id}/photos/${photoId}`, {
        caption: String(caption || '').trim()
      });
      setFeedback('Keterangan foto dokumentasi berhasil diperbarui.');
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memperbarui keterangan foto.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadItemInlinePhoto = async (itemOrLabel, file, customCaption = '') => {
    if (!activeDetail?.inspection || !file) return;
    const uploadingId = typeof itemOrLabel === 'object' && itemOrLabel !== null ? itemOrLabel.id : '';
    setUploadingItemId(uploadingId ? String(uploadingId) : '');
    setSubmitting(true);
    setError('');
    try {
      const prepared = await compressImage(file);
      const isObj = typeof itemOrLabel === 'object' && itemOrLabel !== null;
      const itemId = isObj ? itemOrLabel.id : '';
      const section = isObj ? itemOrLabel.section || '' : '';
      const label = isObj ? itemOrLabel.label || itemOrLabel.item_label || '' : String(itemOrLabel);
      const sectionPrefix = section ? `[${section}] ` : '';
      const caption = customCaption?.trim()
        ? `${sectionPrefix}${customCaption.trim()}`
        : `${sectionPrefix}${label}`.trim();
      const fd = new FormData();
      fd.append('photo', prepared);
      if (itemId) fd.append('itemId', String(itemId));
      if (section) fd.append('section', String(section));
      fd.append('caption', caption);
      await api.post(`/inspections/${activeDetail.inspection.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (itemId) {
        setDraftResults((prev) => ({
          ...prev,
          [itemId]: {
            ...(prev[itemId] || {}),
            itemId,
            textValue: caption
          }
        }));
      }
      setFeedback(`Foto untuk butir "${label}" berhasil dilampirkan.`);
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal melampirkan foto butir checklist.'
      );
    } finally {
      setUploadingItemId('');
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

  const handleChecklistResultChange = (item, patch) => {
    if (!item?.id) return;
    setDraftResults((prev) => ({
      ...prev,
      [item.id]: {
        ...(prev[item.id] || { itemId: item.id }),
        ...patch
      }
    }));

    const labelLower = String(item.item_label || '').toLowerCase();
    if (labelLower.includes('kesimpulan kelayakan teknis') && patch?.choiceValue) {
      if (patch.choiceValue === 'SESUAI') {
        setDraftConclusion((prevConc) =>
          !prevConc || prevConc === 'TIDAK_MEMENUHI_SYARAT' ? 'MEMENUHI_SYARAT' : prevConc
        );
      } else if (patch.choiceValue === 'TIDAK_SESUAI') {
        setDraftConclusion('TIDAK_MEMENUHI_SYARAT');
      }
    }
  };

  const handleConclusionSelect = (nextConclusion) => {
    setDraftConclusion(nextConclusion);
    const conclItem = (activeDetail?.items || []).find((it) =>
      String(it.item_label || '').toLowerCase().includes('kesimpulan kelayakan teknis')
    );
    if (conclItem && nextConclusion) {
      const mappedChoice =
        nextConclusion === 'TIDAK_MEMENUHI_SYARAT' ? 'TIDAK_SESUAI' : 'SESUAI';
      setDraftResults((prev) => ({
        ...prev,
        [conclItem.id]: {
          ...(prev[conclItem.id] || { itemId: conclItem.id }),
          choiceValue: mappedChoice
        }
      }));
    }
  };

  const handleSubmitFinal = async () => {
    if (!activeDetail?.inspection || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const payloadResults = buildInspectionResultPayload(activeDetail.items || [], draftResults);

      const res = await api.post(`/inspections/${activeDetail.inspection.id}/submit`, {
        conclusion: draftConclusion || 'MEMENUHI_SYARAT',
        conclusionNotes: draftConclusionNotes,
        results: payloadResults,
        scopeItems: draftScopes,
        objectAttributes: draftObjectAttributes,
        // Serah-terima Word hanya untuk penyelesaian lapangan; pada mode kantor
        // backend wajib memvalidasi seluruh butir wajib template.
        handoffToWord: workPhase === 'FIELD',
        workPhase
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

  const handleReopenInspection = async (reason, targetSection) => {
    if (!activeDetail?.inspection?.id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspections/${activeDetail.inspection.id}/reopen`, {
        reason: reason || 'Revisi dan penyesuaian data lapangan oleh Ahli K3',
        targetSection: targetSection || undefined
      });
      setFeedback('Kunci form inspeksi berhasil dibuka untuk revisi. Anda dapat menyesuaikan checklist, foto, atau tanda tangan.');
      await openDetail(activeDetail.inspection.id);
      if (onSaved) onSaved();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal membuka kunci form untuk revisi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const itemsBySeq = buildItemsBySeqMap(activeDetail?.items || []);
  const visibleItems = (activeDetail?.items || []).filter((item) =>
    isConditionalItemVisible(item, itemsBySeq, draftResults)
  );
  // Progres harus mengikuti butir yang benar-benar tampil pada fase aktif.
  // Tanpa filter ini navigasi menampilkan "x/40 butir" sementara daftar lapangan
  // hanya berisi 18 butir, sehingga inspector mengira pekerjaannya belum lengkap.
  const phaseVisibleItems =
    workPhase === 'FIELD' ? visibleItems.filter(isFieldRelevantItem) : visibleItems;
  const totalItems = phaseVisibleItems.length;
  const evaluatedItems = phaseVisibleItems.filter((item) =>
    isChecklistItemFilled(item, draftResults[item.id], activeDetail?.photos || [])
  ).length;
  const missingItems = Math.max(0, totalItems - evaluatedItems);
  const photosCount = (activeDetail?.photos || []).length;

  const inspectorSig = (activeDetail?.signatures || []).find((s) =>
    ['AHLI_K3', 'INSPECTOR'].includes(s.signer_role)
  );
  const clientSig = (activeDetail?.signatures || []).find((s) =>
    ['PERWAKILAN_KLIEN', 'PIC_KLIEN'].includes(s.signer_role)
  );

  // Butir wajib yang belum dijawab pada konteks kerja aktif. Mode lapangan boleh
  // disimpan sebagai progres, mode kantor wajib lengkap sebelum dikirim.
  const requiredVisibleItems = phaseVisibleItems.filter((item) => item.is_required);
  const missingRequiredItems = requiredVisibleItems.filter(
    (item) => !isChecklistItemFilled(item, draftResults[item.id], activeDetail?.photos || [])
  );

  const canSubmit =
    Boolean(inspectorSig) &&
    (workPhase === 'FIELD' || missingRequiredItems.length === 0) &&
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
    workPhase,
    setWorkPhase,
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
    handleSaveFieldProgressAndBap,
    handleDiscardDraft,
    handleAddFinding,
    handleChecklistResultChange,
    handleConclusionSelect,
    handleUploadPhoto,
    handleUploadPhotoDirect,
    handleUpdatePhotoCaption,
    handleDeletePhoto,
    handleUploadItemInlinePhoto,
    handleUploadNameplatePhoto,
    handleSubmitFinal,
    handleReopenInspection,
    itemsBySeq,
    totalItems,
    evaluatedItems,
    missingItems,
    photosCount,
    inspectorSig,
    clientSig,
    uploadingItemId,
    missingRequiredItems,
    canSubmit
  };
}
