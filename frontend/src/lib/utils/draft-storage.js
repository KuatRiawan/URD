// Draf form riksa uji disimpan lokal di perangkat Inspector sebagai pengaman bila koneksi terputus.
const keyFor = (inspectionId) => `urd:inspection-draft:${inspectionId}`;

export function saveLocalDraft(inspectionId, draft) {
  try {
    localStorage.setItem(keyFor(inspectionId), JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    // Penyimpanan penuh atau diblokir: abaikan, draf server tetap menjadi sumber utama.
  }
}

export function loadLocalDraft(inspectionId) {
  try {
    const raw = localStorage.getItem(keyFor(inspectionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(inspectionId) {
  try {
    localStorage.removeItem(keyFor(inspectionId));
  } catch {
    // diabaikan
  }
}
