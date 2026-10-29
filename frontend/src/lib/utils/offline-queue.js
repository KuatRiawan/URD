// Antrean foto riksa uji di IndexedDB agar tidak hilang saat sinyal di lokasi terputus.
const DB_NAME = 'urd-offline';
const STORE = 'photos';

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const result = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(result.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

export function enqueuePhoto({ inspectionId, file, caption }) {
  return run('readwrite', (store) =>
    store.add({ inspectionId, file, caption, queuedAt: Date.now() })
  );
}

export async function listQueuedPhotos(inspectionId) {
  const all = await run('readonly', (store) => store.getAll());
  return inspectionId ? all.filter((item) => item.inspectionId === inspectionId) : all;
}

export function removeQueuedPhoto(id) {
  return run('readwrite', (store) => store.delete(id));
}
