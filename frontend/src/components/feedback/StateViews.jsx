import {
  ArrowsClockwise,
  CaretLeft,
  CaretRight,
  FolderOpen,
  WarningCircle
} from '@phosphor-icons/react';
import { Button } from '../ui/Button.jsx';

export function LoadingState({ message, label }) {
  const text = label || message || 'Memuat data operasional...';
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]"
    >
      <div className="relative flex items-center justify-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-black/[0.08] dark:border-white/[0.10] border-t-[#C81E1E]"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3.5 text-sm font-medium text-[#6E6E73] dark:text-[#98989D]">{text}</p>
    </div>
  );
}

export function ErrorState({
  title = 'Gagal Memuat Data',
  message = 'Terjadi gangguan komunikasi dengan server. Silakan muat ulang atau periksa koneksi Anda.',
  onRetry
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-[#C81E1E]/20 bg-rose-50/70 dark:bg-rose-950/25 p-8 sm:p-10 text-center"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400">
        <WarningCircle size={24} weight="fill" aria-hidden="true" />
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onRetry}
          icon={ArrowsClockwise}
          className="mt-4"
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
}

export const ErrorBanner = ErrorState;

export function EmptyState({
  title = 'Belum Ada Data',
  description = 'Data yang Anda cari belum tersedia atau tidak cocok dengan filter pencarian.',
  action,
  actionLabel,
  onAction,
  icon
}) {
  const CustomIcon = icon || FolderOpen;
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-10 sm:p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F5F7] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] border border-black/[0.05] dark:border-white/[0.06]">
        <CustomIcon size={22} weight="duotone" aria-hidden="true" />
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onAction}
          className="mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function PaginationBar({
  page = 1,
  limit = 20,
  total = 0,
  onPageChange,
  itemLabel = 'data'
}) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] px-4 py-3 text-xs text-[#6E6E73] dark:text-[#98989D] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div>
        Menampilkan{' '}
        <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">{startItem}</span>
        {' – '}
        <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">{endItem}</span> dari{' '}
        <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">{total}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 items-center gap-1 rounded-[9px] border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1C1F2B] px-2.5 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45 transition-colors cursor-pointer"
        >
          <CaretLeft size={13} weight="bold" aria-hidden="true" />
          <span>Sebelumnya</span>
        </button>
        <span className="px-2.5 py-1 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
          Hal. {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 items-center gap-1 rounded-[9px] border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1C1F2B] px-2.5 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45 transition-colors cursor-pointer"
        >
          <span> Berikutnya</span>
          <CaretRight size={13} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
