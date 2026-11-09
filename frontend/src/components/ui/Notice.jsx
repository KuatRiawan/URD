import { CheckCircle, Info, Warning, WarningCircle, X } from '@phosphor-icons/react';

export const NOTICE_TONES = {
  success: {
    box: 'border-emerald-500/20 bg-emerald-50/95 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100',
    icon: 'text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle
  },
  error: {
    box: 'border-[#C81E1E]/20 bg-rose-50/95 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100',
    icon: 'text-[#C81E1E] dark:text-rose-400',
    Icon: WarningCircle
  },
  warning: {
    box: 'border-amber-500/25 bg-amber-50/95 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100',
    icon: 'text-amber-600 dark:text-amber-400',
    Icon: Warning
  },
  info: {
    box: 'border-black/[0.08] dark:border-white/[0.10] bg-white/95 dark:bg-[#151821]/95 text-[#1D1D1F] dark:text-[#F5F5F7]',
    icon: 'text-[#6E6E73] dark:text-[#98989D]',
    Icon: Info
  }
};
NOTICE_TONES.danger = NOTICE_TONES.error;

// Notifikasi inline yang seragam untuk seluruh halaman (berhasil, gagal, peringatan, informasi).
export function Notice({ tone = 'info', title, children, onClose, className = '' }) {
  const t = NOTICE_TONES[tone] || NOTICE_TONES.info;
  const Icon = t.Icon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.03)] animate-fade-in ${t.box} ${className}`}
    >
      <Icon size={19} weight="fill" className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-semibold text-[13px]">{title}</p>}
        <div className={title ? 'text-xs opacity-90 mt-0.5' : 'text-[13px] font-medium'}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="-my-1 -mr-1.5 h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
