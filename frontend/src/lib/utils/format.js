export const ROLE_LABELS = {
  ADMIN_SISTEM: 'Administrator Sistem',
  ADMIN_KANTOR: 'Admin Kantor',
  AHLI_K3: 'Ahli K3',
  PIMPINAN: 'Pimpinan / Reviewer'
};

export const ORDER_STATUS_LABELS = {
  ORDER_BARU: 'Order Baru',
  TERJADWAL: 'Terjadwal',
  DITUGASKAN: 'Ditugaskan',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  MENUNGGU_LAPORAN: 'Menunggu Laporan',
  MENUNGGU_REVIEW: 'Menunggu Review',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

export const SERVICE_TYPE_LABELS = {
  PEMERIKSAAN_PERTAMA: 'Pemeriksaan Pertama',
  PEMERIKSAAN_BERKALA: 'Pemeriksaan Berkala',
  PERPANJANGAN: 'Perpanjangan Suket K3',
  PEMERIKSAAN_ULANG: 'Pemeriksaan Ulang'
};

export const LHPP_STATUS_LABELS = {
  DRAF: 'Draf',
  REVIEW_TEKNIS: 'Review Teknis',
  PERSETUJUAN_PIMPINAN: 'Persetujuan Pimpinan',
  DIKEMBALIKAN: 'Dikembalikan (Perlu Revisi)',
  TERBIT: 'Terbit (Terkunci)'
};

export const SUKET_STATUS_LABELS = {
  BERKAS_DISIAPKAN: 'Berkas Disiapkan',
  DIAJUKAN: 'Diajukan ke Instansi',
  DALAM_PROSES: 'Dalam Proses',
  TERBIT: 'Terbit',
  PERLU_PERBAIKAN: 'Ditolak / Perlu Perbaikan'
};

export const FOLLOWUP_STATUS_LABELS = {
  BELUM_DIHUBUNGI: 'Belum Dihubungi',
  SUDAH_DIHUBUNGI: 'Sudah Dihubungi',
  SETUJU_PERPANJANG: 'Setuju Perpanjang',
  MENOLAK: 'Menolak',
  TERJADWAL: 'Terjadwal'
};

export const CONCLUSION_LABELS = {
  MEMENUHI_SYARAT: 'Memenuhi Syarat K3',
  MEMENUHI_SYARAT_DENGAN_CATATAN: 'Memenuhi Syarat dengan Catatan',
  TIDAK_MEMENUHI_SYARAT: 'Tidak Memenuhi Syarat'
};

export function formatDate(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function extractErrorMessage(err, fallback = 'Terjadi kendala saat memproses permintaan.') {
  return err?.response?.data?.error?.message || err?.message || fallback;
}

export const getErrorMessage = extractErrorMessage;

export function formatRelativeTime(value) {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return formatDate(value);
}
