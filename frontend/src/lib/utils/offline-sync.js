// Modul Penanganan Offline-First & Sinkronisasi Otomatis PT Upaya Riksa Daya
// Memastikan data checklist pengujian, catatan kelaikan, dan foto lapangan Ahli K3
// tetap tersimpan di IndexedDB / LocalStorage saat sinyal terputus, dan otomatis
// tersinkronisasi ke server begitu jaringan kembali aktif.

const DB_NAME = 'urd-offline-sync';
const DB_VERSION = 3;
const STORE_PHOTOS = 'photos';
const STORE_DRAFTS = 'drafts';
const STORE_SYNC_LOGS = 'sync_logs';

function openSyncDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak didukung pada browser ini'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        db.createObjectStore(STORE_PHOTOS, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'inspectionId' });
      }
      if (!db.objectStoreNames.contains(STORE_SYNC_LOGS)) {
        db.createObjectStore(STORE_SYNC_LOGS, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runDb(storeName, mode, fn) {
  return openSyncDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        try {
          const tx = db.transaction(storeName, mode);
          const store = tx.objectStore(storeName);
          const result = fn(store);
          tx.oncomplete = () => {
            db.close();
            resolve(result ? result.result : undefined);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        } catch (err) {
          db.close();
          reject(err);
        }
      })
  );
}

// -----------------------------------------------------------------------------
// PENGELOLAAN DRAF FORM INSPEKSI OFFLINE
// -----------------------------------------------------------------------------

export async function enqueueOfflineDraft(inspectionId, payload) {
  try {
    await runDb(STORE_DRAFTS, 'readwrite', (store) => {
      return store.put({
        inspectionId,
        payload,
        updatedAt: Date.now()
      });
    });
  } catch {
    // Fallback ke localStorage jika IndexedDB bermasalah
    try {
      localStorage.setItem(
        `urd_offline_draft_${inspectionId}`,
        JSON.stringify({ inspectionId, payload, updatedAt: Date.now() })
      );
    } catch {
      // Tidak ada draft lokal yang dapat dibaca dari penyimpanan fallback.
    }
  }
}

export async function listOfflineDrafts() {
  try {
    const list = await runDb(STORE_DRAFTS, 'readonly', (store) => store.getAll());
    return list || [];
  } catch {
    // Fallback baca localStorage
    const items = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('urd_offline_draft_')) {
          const raw = localStorage.getItem(key);
          if (raw) items.push(JSON.parse(raw));
        }
      }
    } catch {
      // Penghapusan IndexedDB sudah dicoba; fallback lokal mungkin tidak tersedia.
    }
    return items;
  }
}

export async function removeOfflineDraft(inspectionId) {
  try {
    await runDb(STORE_DRAFTS, 'readwrite', (store) => store.delete(inspectionId));
  } catch {
    // Penghapusan locale best-effort setelah lajur IndexedDB.
  }
  try {
    localStorage.removeItem(`urd_offline_draft_${inspectionId}`);
  } catch {
    // Foto offline tidak tersedia jika IndexedDB tidak dapat dibuka.
  }
}

// -----------------------------------------------------------------------------
// PENGELOLAAN FOTO LAPANGAN OFFLINE
// -----------------------------------------------------------------------------

export function enqueueOfflinePhoto({ inspectionId, file, caption }) {
  return runDb(STORE_PHOTOS, 'readwrite', (store) =>
    store.add({
      inspectionId,
      file,
      caption: caption || 'Foto Hasil Riksa Uji Lapangan',
      queuedAt: Date.now()
    })
  );
}

export async function listOfflinePhotos(inspectionId = null) {
  try {
    const all = await runDb(STORE_PHOTOS, 'readonly', (store) => store.getAll());
    if (!all) return [];
    return inspectionId ? all.filter((item) => item.inspectionId === inspectionId) : all;
  } catch {
    return [];
  }
}

export function removeOfflinePhoto(id) {
  return runDb(STORE_PHOTOS, 'readwrite', (store) => store.delete(id));
}

// -----------------------------------------------------------------------------
// RINGKASAN DATA PENDING
// -----------------------------------------------------------------------------

export async function getPendingSyncSummary() {
  const [drafts, photos] = await Promise.all([
    listOfflineDrafts().catch(() => []),
    listOfflinePhotos().catch(() => [])
  ]);

  return {
    pendingDraftsCount: drafts.length,
    pendingPhotosCount: photos.length,
    totalPending: drafts.length + photos.length,
    drafts,
    photos
  };
}

// -----------------------------------------------------------------------------
// PENGELOLAAN LOG RIWAYAT SINKRONISASI
// -----------------------------------------------------------------------------

export async function recordSyncLog(entry) {
  const log = {
    id: 'sync_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    status: entry.status || (entry.errors?.length ? 'FAILED' : 'SUCCESS'),
    syncedDrafts: entry.syncedDrafts || 0,
    syncedPhotos: entry.syncedPhotos || 0,
    totalSynced: (entry.syncedDrafts || 0) + (entry.syncedPhotos || 0),
    errors: entry.errors || [],
    trigger: entry.trigger || 'MANUAL'
  };
  try {
    await runDb(STORE_SYNC_LOGS, 'readwrite', (store) => store.add(log));
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem('urd_sync_logs') || '[]');
      existing.unshift(log);
      localStorage.setItem('urd_sync_logs', JSON.stringify(existing.slice(0, 30)));
    } catch {
      // fallback best-effort
    }
  }
  return log;
}

export async function listSyncLogs() {
  try {
    const list = await runDb(STORE_SYNC_LOGS, 'readonly', (store) => store.getAll());
    if (list && list.length) {
      return list.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
    }
  } catch {
    // fallback
  }
  try {
    const raw = localStorage.getItem('urd_sync_logs');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

export async function clearSyncLogs() {
  try {
    await runDb(STORE_SYNC_LOGS, 'readwrite', (store) => store.clear());
  } catch {
    // fallback
  }
  try {
    localStorage.removeItem('urd_sync_logs');
  } catch {
    // fallback
  }
}

export async function exportOfflineDraftJson(inspectionId) {
  const drafts = await listOfflineDrafts();
  const draft = drafts.find((d) => d.inspectionId === inspectionId);
  if (!draft) return null;
  return JSON.stringify(draft, null, 2);
}

// -----------------------------------------------------------------------------
// MESIN SINKRONISASI OTOMATIS (AUTO-SYNC ENGINE)
// -----------------------------------------------------------------------------

let isSyncing = false;

export async function performAutoSync(apiInstance, trigger = 'AUTO') {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { skipped: true, reason: 'offline' };
  }
  if (isSyncing) {
    return { skipped: true, reason: 'in-progress' };
  }

  isSyncing = true;
  let syncedDrafts = 0;
  let syncedPhotos = 0;
  const errors = [];

  try {
    const drafts = await listOfflineDrafts();
    for (const d of drafts) {
      try {
        await apiInstance.put(`/inspections/${d.inspectionId}/draft`, d.payload);
        await removeOfflineDraft(d.inspectionId);
        syncedDrafts += 1;
      } catch (err) {
        errors.push({ type: 'draft', id: d.inspectionId, error: err?.message });
      }
    }

    const photos = await listOfflinePhotos();
    for (const p of photos) {
      try {
        const fd = new FormData();
        fd.append('photo', p.file);
        fd.append('caption', p.caption || 'Foto Riksa Uji Lapangan');
        await apiInstance.post(`/inspections/${p.inspectionId}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        await removeOfflinePhoto(p.id);
        syncedPhotos += 1;
      } catch (err) {
        errors.push({ type: 'photo', id: p.id, error: err?.message });
      }
    }

    // Jika ada data yang berhasil disinkronisasi, pancarkan event global
    if (syncedDrafts > 0 || syncedPhotos > 0) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('urd-offline-synced', {
            detail: { syncedDrafts, syncedPhotos, errors }
          })
        );
      }
    }

    const totalSynced = syncedDrafts + syncedPhotos;
    const finalStatus = errors.length === 0 ? 'SUCCESS' : (totalSynced > 0 ? 'PARTIAL' : 'FAILED');

    // Catat log riwayat sinkronisasi
    await recordSyncLog({
      status: finalStatus,
      syncedDrafts,
      syncedPhotos,
      errors,
      trigger
    }).catch(() => {});

    return {
      success: true,
      status: finalStatus,
      syncedDrafts,
      syncedPhotos,
      totalSynced,
      errors
    };
  } finally {
    isSyncing = false;
  }
}

// -----------------------------------------------------------------------------
// EVENT LISTENER JARINGAN OTOMATIS (GLOBAL ONLINE LISTENER)
// -----------------------------------------------------------------------------

export function setupAutoSyncListener(apiInstance, onStatusChange) {
  if (typeof window === 'undefined') return () => {};

  const handleOnline = async () => {
    if (onStatusChange) onStatusChange({ status: 'syncing', message: 'Jaringan kembali aktif. Menyinkronkan data offline otomatis...' });
  try {
    const result = await performAutoSync(apiInstance);
    if (onStatusChange) {
      if (result.errors.length) {
        onStatusChange({
          status: 'failed',
          message: 'Sebagian data offline belum berhasil disinkronkan. Data tetap tersimpan di perangkat.',
          result
        });
      } else if (result.totalSynced > 0) {
        onStatusChange({
          status: 'success',
          message: `Sinkronisasi otomatis berhasil: ${result.syncedDrafts} draf form dan ${result.syncedPhotos} foto terkirim ke server PT Upaya Riksa Daya.`,
          result
        });
      } else {
        onStatusChange({ status: 'online', message: 'Terhubung ke server PT Upaya Riksa Daya.', result });
      }
    }
  } catch (error) {
    onStatusChange?.({
      status: 'failed',
      message: 'Sinkronisasi offline gagal. Data tetap tersimpan di perangkat.',
      result: { errors: [{ type: 'sync', error: error?.message }] }
    });
  };
  };

  const handleOffline = () => {
    if (onStatusChange) {
      onStatusChange({
        status: 'offline',
        message: 'Koneksi internet terputus. Mode offline aktif (seluruh isian dan foto disimpan aman di perangkat).'
      });
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
