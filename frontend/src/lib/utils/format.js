export const ROLE_LABELS = {
  ADMIN_SISTEM: 'Admin Sistem',
  MARKETING: 'Marketing',
  ADMIN_KANTOR: 'Admin Kantor',
  INSPECTOR: 'Inspector',
  AHLI_K3: 'Inspector',
  PIMPINAN: 'Pimpinan / Manager',
  MANAGER: 'Pimpinan / Manager'
};

export const ROLE_OPTIONS = [
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'ADMIN_KANTOR', label: 'Admin Kantor' },
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
  BELUM_DIJADWALKAN: 'Belum Dijadwalkan',
  TERJADWAL: 'Terjadwal',
  DITUGASKAN: 'Ditugaskan',
  SEDANG_DIPERIKSA: 'Sedang Diperiksa',
  CHECKLIST_BELUM_LENGKAP: 'Checklist Belum Lengkap',
  MENUNGGU_TTD: 'Menunggu Tanda Tangan',
  PEMERIKSAAN_TERKIRIM: 'Pemeriksaan Terkirim',
  FORM_TERKIRIM: 'Form Terkirim',
  LHPP_DRAF: 'Draf LHPP',
  LHPP_DIPROSES: 'LHPP Diproses',
  LHPP_SIAP_PREVIEW: 'LHPP Siap Finalisasi',
  LHPP_TERBIT: 'LHPP Terbit',
  LHPP_FINAL: 'LHPP Final',
  BAP_DRAF: 'Draf BAP',
  BAP_DIPROSES: 'BAP Diproses',
  BAP_SIAP_PREVIEW: 'BAP Siap Preview',
  BAP_FINAL: 'BAP Final',
  SIAP_DISTRIBUSI: 'Siap Distribusi',
  SEBAGIAN_DOKUMEN_DIKIRIM: 'Sebagian Dokumen Dikirim',
  PERLU_REVISI: 'Perlu Revisi',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
  // Kompatibilitas alias data lama
  TERDAFTAR: 'Terdaftar',
  DIJADWALKAN: 'Terjadwal',
  INSPEKSI_LAPANGAN: 'Sedang Diperiksa',
  INSPEKSI_SELESAI: 'Pemeriksaan Terkirim'
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
  BELUM_DITINDAKLANJUTI: 'Belum Ditindaklanjuti',
  BELUM_DIHUBUNGI: 'Belum Dihubungi',
  SUDAH_DIHUBUNGI: 'Sudah Dihubungi',
  SEDANG_PENAWARAN: 'Sedang Penawaran',
  MENUNGGU_KEPUTUSAN: 'Menunggu Keputusan',
  MENUNGGU_KONFIRMASI_KLIEN: 'Menunggu Konfirmasi',
  MENUNGGU_PO: 'Menunggu PO',
  SUDAH_JADI_PO_BARU: 'Sudah Jadi PO Baru',
  SETUJU_PERPANJANG: 'Setuju Perpanjang',
  DITUNDA: 'Ditunda',
  TIDAK_LANJUT: 'Tidak Dilanjutkan',
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
  if (err?.code === 'ERR_NETWORK') {
    return 'Tidak dapat terhubung ke server. Pastikan layanan backend berjalan di port 4000.';
  }
  const backendMsg = err?.response?.data?.error?.message;
  if (backendMsg) return backendMsg;

  if (err?.response?.status === 500 || err?.message?.includes('status code 500')) {
    return 'Server backend tidak merespons (HTTP 500). Pastikan server backend dan PostgreSQL sudah berjalan.';
  }
  return err?.message || fallback;
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
