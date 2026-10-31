export const ROLE_LABELS = {
  ADMIN_SISTEM: 'Admin Sistem',
  MARKETING: 'Marketing',
  ADMIN_KANTOR: 'Marketing',
  INSPECTOR: 'Inspector',
  AHLI_K3: 'Inspector',
  PIMPINAN: 'Pimpinan / Manager',
  MANAGER: 'Pimpinan / Manager'
};

export const ROLE_OPTIONS = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'INSPECTOR', label: 'Inspector' },
  { value: 'PIMPINAN', label: 'Pimpinan / Manager' },
  { value: 'ADMIN_SISTEM', label: 'Admin Sistem' }
];

export const ORDER_STATUS_LABELS = {
  ORDER_BARU: 'Order Baru',
  TERDAFTAR: 'PO Terdaftar',
  TERJADWAL: 'Terjadwal',
  DIJADWALKAN: 'Dijadwalkan',
  DITUGASKAN: 'Ditugaskan',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  BERLANGSUNG: 'Sedang Berlangsung',
  SEBAGIAN_SELESAI: 'Sebagian Selesai',
  MENUNGGU_DOKUMEN: 'Menunggu Dokumen',
  MENUNGGU_LAPORAN: 'Menunggu Laporan',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan'
};

export const UNIT_STATUS_LABELS = {
  TERDAFTAR: 'Terdaftar',
  DIJADWALKAN: 'Dijadwalkan',
  DITUGASKAN: 'Ditugaskan',
  INSPEKSI_LAPANGAN: 'Inspeksi Lapangan',
  INSPEKSI_SELESAI: 'Inspeksi Selesai',
  LHPP_DIPROSES: 'LHPP Diproses',
  LHPP_SIAP_PREVIEW: 'LHPP Siap Preview',
  LHPP_FINAL: 'LHPP Final',
  BAP_DIPROSES: 'BAP Diproses',
  BAP_SIAP_PREVIEW: 'BAP Siap Preview',
  BAP_FINAL: 'BAP Final',
  SIAP_DISTRIBUSI: 'Siap Distribusi',
  SEBAGIAN_DOKUMEN_DIKIRIM: 'Sebagian Dokumen Dikirim',
  SELESAI: 'Selesai'
};

export const DISTRIBUTION_STATUS_LABELS = {
  MENUNGGU_DOKUMEN: 'Menunggu Dokumen Final',
  SIAP_DIKIRIM: 'Siap Dikirim',
  DIKIRIM: 'Telah Dikirim',
  DITERIMA: 'Telah Diterima'
};

export const DISTRIBUTION_TARGET_LABELS = {
  KLIEN: 'Klien',
  DISNAKER: 'Disnaker'
};

export const DISTRIBUTION_DOC_TYPE_LABELS = {
  BAP: 'Berita Acara (BAP)',
  LHPP: 'Laporan Hasil Pemeriksaan & Pengujian (LHPP)',
  LHPP_DAN_BAP: 'LHPP & BAP Paket Disnaker'
};

export const SERVICE_TYPE_LABELS = {
  PEMERIKSAAN_PERTAMA: 'Pemeriksaan Pertama',
  PEMERIKSAAN_BERKALA: 'Pemeriksaan Berkala',
  PERPANJANGAN: 'Perpanjangan Suket K3',
  PEMERIKSAAN_ULANG: 'Pemeriksaan Ulang'
};

export const LHPP_STATUS_LABELS = {
  DRAF: 'Draf',
  SIAP_PREVIEW: 'Siap Preview',
  FINAL: 'Final (Terkunci)',
  TERBIT: 'Terbit (Terkunci)',
  DIKEMBALIKAN: 'Dikembalikan (Perlu Revisi)',
  DIBATALKAN: 'Dibatalkan'
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
