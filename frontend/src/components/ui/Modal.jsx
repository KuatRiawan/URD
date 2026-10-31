import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { useDialogFocus } from './useDialogFocus.js';

const SIZE_CLASSES = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl'
};

// R-26 & R-32: Modal dapat ditutup dengan Escape atau klik latar, fokus jelas, scroll latar dikunci.
// Mendukung prop `open` maupun `isOpen` agar seluruh halaman konsisten.
export function Modal({
  open,
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  size = 'md',
  closeOnBackdrop = true
}) {
  const visible = Boolean(open ?? isOpen);
  const panelRef = useRef(null);
  useDialogFocus(visible, panelRef, onClose);

  useEffect(() => {
    if (!visible) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!visible) return null;

  const widthClass = maxWidth || SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
        aria-label={title || 'Dialog'}
    >
      {/* Backdrop Gelap */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] transition-opacity animate-fade-in"
        onClick={() => {
            if (closeOnBackdrop) onClose?.();
        }}
        aria-hidden="true"
      />

      {/* Panel Bottom Sheet Mobile & Centered Dialog Desktop */}
      <div
        ref={panelRef}
        className={`relative w-full ${widthClass} rounded-t-[28px] sm:rounded-2xl bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] h-[90dvh] sm:h-auto overscroll-contain pb-safe z-10`}
      >
        {/* Indikator Handle Bar Lembar Bawah Mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 px-5 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="h-11 w-11 sm:h-9 sm:w-9 shrink-0 inline-flex items-center justify-center rounded-full sm:rounded-lg bg-slate-100 dark:bg-slate-800 sm:bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 overscroll-contain touch-pan-y">
          {children}
        </div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 px-6 py-3.5 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
