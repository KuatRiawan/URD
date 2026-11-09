import {
  ORDER_STATUS_LABELS,
  UNIT_STATUS_LABELS,
  DISTRIBUTION_STATUS_LABELS,
  LHPP_STATUS_LABELS,
  SUKET_STATUS_LABELS,
  FOLLOWUP_STATUS_LABELS,
  CONCLUSION_LABELS
} from '../../lib/utils/format.js';

// Kamus terpusat pelabelan status bisnis nyata URD
const KNOWN_STATUS_LABELS = {
  ...ORDER_STATUS_LABELS,
  ...UNIT_STATUS_LABELS,
  ...DISTRIBUTION_STATUS_LABELS,
  ...LHPP_STATUS_LABELS,
  ...SUKET_STATUS_LABELS,
  ...FOLLOWUP_STATUS_LABELS,
  ...CONCLUSION_LABELS,
  AKTIF: 'Aktif',
  NONAKTIF: 'Nonaktif',
  ACTIVE: 'Aktif',
  INACTIVE: 'Nonaktif',
  SESUAI: 'Sesuai',
  TIDAK_SESUAI: 'Tidak Sesuai',
  FINAL: 'Final',
  DRAF: 'Draf',
  DRAFT: 'Draf',
  BERKAS_DISIAPKAN: 'Berkas Disiapkan',
  TERBIT: 'Terbit',
  SELESAI: 'Selesai',
  DIBATALKAN: 'Dibatalkan',
  DITOLAK: 'Ditolak',
  MEMENUHI_SYARAT: 'Memenuhi Syarat K3',
  MEMENUHI_SYARAT_K3: 'Memenuhi Syarat K3',
  TIDAK_MEMENUHI_SYARAT: 'Tidak Memenuhi Syarat K3',
  TIDAK_MEMENUHI_SYARAT_K3: 'Tidak Memenuhi Syarat K3',
  APPROVED: 'Disetujui',
  DELIVERED: 'Diserahkan',
  COMPLETED: 'Selesai',
  IN_PROGRESS: 'Sedang Diuji',
  SCHEDULED: 'Terjadwal',
  PENDING: 'Menunggu Jadwal'
};

export const TONE_CLASSES = {
  neutral:
    'bg-slate-500/[0.08] dark:bg-slate-400/[0.14] text-slate-700 dark:text-slate-300 border-slate-500/20 dark:border-slate-400/25',
  info:
    'bg-sky-500/[0.10] dark:bg-sky-500/[0.18] text-sky-800 dark:text-sky-200 border-sky-500/25 dark:border-sky-400/30',
  success:
    'bg-emerald-500/[0.10] dark:bg-emerald-500/[0.18] text-emerald-800 dark:text-emerald-300 border-emerald-500/25 dark:border-emerald-400/30',
  warning:
    'bg-amber-500/[0.10] dark:bg-amber-500/[0.18] text-amber-900 dark:text-amber-200 border-amber-500/25 dark:border-amber-400/30',
  danger:
    'bg-rose-500/[0.10] dark:bg-rose-500/[0.18] text-rose-800 dark:text-rose-200 border-rose-500/25 dark:border-rose-400/30',
  brand:
    'bg-[#C81E1E]/[0.08] dark:bg-red-500/[0.18] text-[#991B1B] dark:text-red-300 border-[#C81E1E]/25 dark:border-red-400/30',
  purple:
    'bg-purple-500/[0.10] dark:bg-purple-500/[0.18] text-purple-800 dark:text-purple-200 border-purple-500/25 dark:border-purple-400/30'
};

export const SOLID_TONE_CLASSES = {
  neutral: 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900 border-transparent',
  info: 'bg-sky-600 text-white border-transparent',
  success: 'bg-emerald-600 text-white border-transparent',
  warning: 'bg-amber-500 text-slate-950 font-bold border-transparent',
  danger: 'bg-rose-600 text-white border-transparent',
  brand: 'bg-[#C81E1E] text-white border-transparent',
  purple: 'bg-purple-600 text-white border-transparent'
};

export const OUTLINE_TONE_CLASSES = {
  neutral: 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-400/40',
  info: 'bg-transparent text-sky-700 dark:text-sky-300 border-sky-500/40',
  success: 'bg-transparent text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
  warning: 'bg-transparent text-amber-700 dark:text-amber-300 border-amber-500/40',
  danger: 'bg-transparent text-rose-700 dark:text-rose-300 border-rose-500/40',
  brand: 'bg-transparent text-[#C81E1E] dark:text-red-400 border-[#C81E1E]/40',
  purple: 'bg-transparent text-purple-700 dark:text-purple-300 border-purple-500/40'
};

export const DOT_CLASSES = {
  neutral: 'bg-slate-400 dark:bg-slate-400',
  info: 'bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.55)]',
  success: 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.55)]',
  warning: 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.55)]',
  danger: 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.55)]',
  brand: 'bg-[#C81E1E] shadow-[0_0_5px_rgba(200,30,30,0.55)]',
  purple: 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.55)]'
};

export const DOT_PULSE_CLASSES = {
  neutral: 'bg-slate-400',
  info: 'bg-sky-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  brand: 'bg-red-400',
  purple: 'bg-purple-400'
};

const SIZE_CLASSES = {
  xs: 'text-[10px] leading-tight px-2 py-0.5 gap-1',
  sm: 'text-[11px] leading-tight px-2.5 py-0.5 gap-1.5',
  md: 'text-xs leading-none px-2.5 py-1 gap-1.5',
  lg: 'text-sm leading-none px-3 py-1.5 gap-2'
};

const ACTIVE_STATUSES = new Set([
  'SEDANG_DIPERIKSA',
  'DALAM_PELAKSANAAN',
  'DALAM_PROSES',
  'BERLANGSUNG',
  'INSPEKSI_LAPANGAN',
  'IN_PROGRESS',
  'SEDANG_PENAWARAN'
]);

function formatStatusFallback(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'boolean') return val ? 'Aktif' : 'Nonaktif';
  const str = String(val).trim();
  if (!str) return '';
  if (KNOWN_STATUS_LABELS[str]) return KNOWN_STATUS_LABELS[str];
  return str
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function statusTone(status) {
  if (typeof status === 'boolean') return status ? 'success' : 'danger';
  const s = String(status || '').trim().toUpperCase();
  switch (s) {
    case 'SELESAI':
    case 'TERBIT':
    case 'DISETUJUI_FINAL':
    case 'AKTIF':
    case 'ACTIVE':
    case 'DITERIMA':
    case 'MEMENUHI_SYARAT':
    case 'MEMENUHI_SYARAT_K3':
    case 'SESUAI':
    case 'SETUJU_PERPANJANG':
    case 'ORDER_PERPANJANGAN_DIBUAT':
    case 'SUDAH_JADI_PO_BARU':
    case 'DIPERPANJANG':
    case 'LHPP_TERBIT':
    case 'LHPP_FINAL':
    case 'BAP_FINAL':
    case 'SIAP_DISTRIBUSI':
    case 'SEBAGIAN_DOKUMEN_DIKIRIM':
    case 'COMPLETED':
    case 'APPROVED':
    case 'DELIVERED':
    case 'PASSED':
      return 'success';

    case 'DIBATALKAN':
    case 'DITOLAK':
    case 'DIKEMBALIKAN':
    case 'DIKEMBALIKAN_REVISI':
    case 'PERLU_PERBAIKAN':
    case 'PERLU_REVISI':
    case 'TIDAK_MEMENUHI_SYARAT':
    case 'TIDAK_MEMENUHI_SYARAT_K3':
    case 'TIDAK_SESUAI':
    case 'KRITIS':
    case 'KEDALUWARSA':
    case 'NONAKTIF':
    case 'INACTIVE':
    case 'MENOLAK':
    case 'TIDAK_DIPERPANJANG':
    case 'TIDAK_LANJUT':
    case 'REJECTED':
    case 'EXPIRED':
    case 'FAILED':
      return 'danger';

    case 'MEMENUHI_SYARAT_DENGAN_CATATAN':
    case 'MAYOR':
    case 'SEGERA_HABIS':
    case 'MENUNGGU':
    case 'MENUNGGU_LHPP':
    case 'MENUNGGU_SUKET':
    case 'MENUNGGU_PO':
    case 'MENUNGGU_KEPUTUSAN':
    case 'MENUNGGU_KONFIRMASI_KLIEN':
    case 'MENUNGGU_TTD':
    case 'MENUNGGU_LAPORAN':
    case 'MENUNGGU_DOKUMEN':
    case 'CHECKLIST_BELUM_LENGKAP':
    case 'LHPP_SIAP_PREVIEW':
    case 'BAP_SIAP_PREVIEW':
    case 'PEMERIKSAAN_TERKIRIM':
    case 'FORM_TERKIRIM':
    case 'DALAM_PROSES':
    case 'IN_PROGRESS':
    case 'WARNING':
      return 'warning';

    case 'TERJADWAL':
    case 'DIJADWALKAN':
    case 'TERKONFIRMASI':
    case 'DALAM_PELAKSANAAN':
    case 'DITUGASKAN':
    case 'SEDANG_DIPERIKSA':
    case 'SEDANG_PENAWARAN':
    case 'SUDAH_DIHUBUNGI':
    case 'DIAJUKAN':
    case 'LHPP_DRAF':
    case 'LHPP_DIPROSES':
    case 'BAP_DRAF':
    case 'BAP_DIPROSES':
    case 'DIKIRIM':
    case 'SIAP_DIKIRIM':
    case 'BERLANGSUNG':
    case 'SCHEDULED':
    case 'INFO':
      return 'info';

    case 'URD':
    case 'PJK3':
    case 'BRAND':
      return 'brand';

    case 'TERDAFTAR':
    case 'ORDER_BARU':
    case 'BELUM_DIJADWALKAN':
    case 'DRAF':
    case 'DRAFT':
    case 'PENDING':
    default:
      return 'neutral';
  }
}

/**
 * StatusBadge (Badge) - Komponen indikator status resmi URD
 * Mengusung gaya Apple macOS/iOS: translucent glass capsule, crisp contrast,
 * fine 1px tone border, dan precision status dot dengan efek live pulse otomatis.
 */
export function StatusBadge({
  status,
  label,
  tone,
  variant = 'subtle',
  size = 'md',
  dot = true,
  pulse = false,
  icon: Icon = null,
  children,
  className = ''
}) {
  const requestedTone =
    tone ||
    (['success', 'warning', 'danger', 'info', 'neutral', 'brand', 'purple'].includes(variant)
      ? variant
      : variant === 'secondary'
      ? 'neutral'
      : null) ||
    statusTone(status);

  const resolvedTone = TONE_CLASSES[requestedTone] ? requestedTone : 'neutral';
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  let toneClass = TONE_CLASSES[resolvedTone];
  if (variant === 'solid') {
    toneClass = SOLID_TONE_CLASSES[resolvedTone] || SOLID_TONE_CLASSES.neutral;
  } else if (variant === 'outline') {
    toneClass = OUTLINE_TONE_CLASSES[resolvedTone] || OUTLINE_TONE_CLASSES.neutral;
  }

  const isPulsing =
    pulse || (dot && typeof status === 'string' && ACTIVE_STATUSES.has(status.toUpperCase()));

  const content = children || label || (status !== undefined ? formatStatusFallback(status) : '');

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none whitespace-nowrap select-none tracking-tight transition-colors ${sizeClass} ${toneClass} ${className}`}
    >
      {Icon ? (
        <Icon size={size === 'xs' ? 11 : size === 'sm' ? 12 : 13} className="shrink-0" aria-hidden="true" />
      ) : dot ? (
        isPulsing ? (
          <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${DOT_PULSE_CLASSES[resolvedTone]}`}
            />
            <span
              className={`relative inline-flex rounded-full h-1.5 w-1.5 ${DOT_CLASSES[resolvedTone]}`}
            />
          </span>
        ) : (
          <span
            className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASSES[resolvedTone]}`}
            aria-hidden="true"
          />
        )
      ) : null}
      <span className="truncate max-w-[240px]">{content}</span>
    </span>
  );
}

export const Badge = StatusBadge;
