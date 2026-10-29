import { CheckCircle, Info, Warning, WarningCircle, X } from '@phosphor-icons/react';

export const NOTICE_TONES = {
  success: {
    box: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200',
    icon: 'text-emerald-600 dark:text-emerald-400',
    Icon: CheckCircle
  },
  error: {
    box: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200',
    icon: 'text-red-600 dark:text-red-400',
    Icon: WarningCircle
  },
  warning: {
    box: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
    icon: 'text-amber-600 dark:text-amber-400',
    Icon: Warning
  },
  info: {
    box: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200',
    icon: 'text-sky-600 dark:text-sky-400',
    Icon: Info
  }
};

// Notifikasi inline yang seragam untuk seluruh halaman (berhasil, gagal, peringatan, informasi).
export function Notice({ tone = 'info', title, children, onClose, className = '' }) {
  const t = NOTICE_TONES[tone] || NOTICE_TONES.info;
  const Icon = t.Icon;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in ${t.box} ${className}`}
    >
      <Icon size={20} weight="fill" className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 leading-relaxed">
        {title && <p className="font-bold">{title}</p>}
        <div className={title ? 'text-[13px] opacity-90' : 'text-[13px] font-medium'}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pemberitahuan"
          className="-my-1 -mr-1.5 h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-md opacity-70 hover:opacity-100 hover:bg-black/5"
        >
          <X size={14} weight="bold" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

