const TONE_CLASSES = {
  neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
  info: 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 ring-sky-200 dark:ring-sky-800',
  success: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
  warning: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
  danger: 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 ring-red-200 dark:ring-red-800'
};

const DOT_CLASSES = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500'
};

export function statusTone(status) {
  switch (status) {
    case 'SELESAI':
    case 'TERBIT':
    case 'DISETUJUI_FINAL':
    case 'AKTIF':
    case 'DITERIMA':
    case 'MEMENUHI_SYARAT':
    case 'MEMENUHI_SYARAT_K3':
    case 'SESUAI':
    case 'SETUJU_PERPANJANG':
    case 'ORDER_PERPANJANGAN_DIBUAT':
    case 'DIPERPANJANG':
      return 'success';
    case 'DIBATALKAN':
    case 'DITOLAK':
    case 'DIKEMBALIKAN':
    case 'DIKEMBALIKAN_REVISI':
    case 'PERLU_PERBAIKAN':
    case 'TIDAK_MEMENUHI_SYARAT':
    case 'TIDAK_MEMENUHI_SYARAT_K3':
    case 'TIDAK_SESUAI':
    case 'KRITIS':
    case 'KEDALUWARSA':
    case 'NONAKTIF':
    case 'MENOLAK':
    case 'TIDAK_DIPERPANJANG':
      return 'danger';
    case 'MEMENUHI_SYARAT_DENGAN_CATATAN':
    case 'MAYOR':
    case 'SEGERA_HABIS':
    case 'MENUNGGU':
    case 'MENUNGGU_LHPP':
    case 'MENUNGGU_SUKET':
    case 'MENUNGGU_PO':
    case 'DALAM_PROSES':
      return 'warning';
    case 'TERJADWAL':
    case 'DIJADWALKAN':
    case 'TERKONFIRMASI':
    case 'DALAM_PELAKSANAAN':
    case 'DITUGASKAN':
    case 'SEDANG_DIPERIKSA':
    case 'SUDAH_DIHUBUNGI':
    case 'DIAJUKAN':
      return 'info';
    default:
      return 'neutral';
  }
}

// R-09 & R-11: Badge fungsional untuk status bisnis nyata dengan indikator titik berwarna.
export function StatusBadge({ status, label, tone, variant, children }) {
  const requested = tone || variant || statusTone(status);
  const resolvedTone = TONE_CLASSES[requested] ? requested : 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full ring-1 ring-inset ${TONE_CLASSES[resolvedTone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[resolvedTone]}`} aria-hidden="true" />
      {children || label || status}
    </span>
  );
}

export const Badge = StatusBadge;
