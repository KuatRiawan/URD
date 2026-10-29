import { Tray, WarningCircle } from '@phosphor-icons/react';

// R-27: Setiap layar data wajib mendukung kondisi Loading, Empty, dan Error secara jelas.
export function LoadingState({ message, label }) {
  const text = label || message || 'Memuat data operasional...';
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-sm text-slate-500 dark:text-slate-400 shadow-card transition-colors"
    >
      <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-brand-600" />
      <p className="font-medium">{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-5 text-sm text-red-900 dark:text-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
    >
      <div className="flex items-start gap-3">
        <WarningCircle
          size={22}
          weight="fill"
          className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
        <div>
          <p className="font-bold">Terjadi Kendala</p>
          <p className="mt-0.5 text-[13px] text-red-800 dark:text-red-300">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-10 px-4 rounded-lg bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 shrink-0 transition-colors"
        >
          Muat Ulang
        </button>
      )}
    </div>
  );
}

export const ErrorBanner = ErrorState;

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center transition-colors">
      <span className="mx-auto mb-3 h-12 w-12 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
        <Tray size={24} weight="duotone" aria-hidden="true" />
      </span>
      <p className="text-base font-bold text-slate-900 dark:text-white">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function PaginationBar({ page, limit, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || 20)));
  if (total <= limit && page === 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <span>
        Halaman <strong className="text-slate-900 dark:text-white">{page}</strong> dari{' '}
        <strong className="text-slate-900 dark:text-white">{totalPages}</strong> (Total {total} data)
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          Sebelumnya
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
