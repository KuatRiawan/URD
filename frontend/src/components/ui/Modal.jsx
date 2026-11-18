import { useEffect, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { useDialogFocus } from './useDialogFocus.js';

const SIZE_CLASSES = {
  sm: 'max-w-md',        // 448px (Konfirmasi, dialog singkat)
  md: 'max-w-lg',        // 512px (Form standar ringkas)
  lg: 'max-w-2xl',       // 672px (Form 2-kolom standar)
  xl: 'max-w-4xl',       // 896px (Form wizard multi-step, import)
  '2xl': 'max-w-5xl',    // 1024px (Pratinjau berkas/review)
  full: 'max-w-6xl'      // 1152px (Lembar kerja inspeksi teknis)
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
  closeOnBackdrop = true,
  closeOnEscape = true,
  fullScreenMobile = false,
  closeAriaLabel = 'Tutup dialog'
}) {
  const visible = Boolean(open ?? isOpen);
  const panelRef = useRef(null);
  useDialogFocus(visible, panelRef, onClose, closeOnEscape);

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
  const isMobileFull = fullScreenMobile;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      {/* Backdrop Neutral 35-45% Transparansi dengan Blur Halus (Halaman Belakang Tetap Dikenali) */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-black/55 backdrop-blur-[1.5px] transition-opacity duration-200 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose?.();
          }
        }}
        aria-hidden="true"
      />

      {/* Panel Modal Modern Bersih & Proporsional - Terpusat Sempurna */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${widthClass} my-auto text-left bg-white dark:bg-[#161922] border border-slate-200/90 dark:border-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.03)] dark:shadow-[0_25px_65px_-15px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)] flex flex-col ${
          isMobileFull
            ? 'h-[92dvh] sm:h-auto sm:max-h-[88vh] rounded-2xl'
            : 'max-h-[90dvh] sm:max-h-[86vh] rounded-2xl'
        } overflow-hidden z-10 animate-pop-in focus:outline-none`}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4.5 shrink-0 bg-white dark:bg-[#161922]">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-[-0.015em] leading-snug truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAriaLabel}
            style={{ outline: 'none' }}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer !outline-none focus:!outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:focus-visible:ring-slate-600"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="px-6 py-5 overflow-y-auto flex-1 overscroll-contain touch-pan-y min-h-0 bg-white dark:bg-[#161922]">
          {children}
        </div>

        {/* Footer Modal (Sticky di bawah, tidak menutupi konten) */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/75 dark:bg-[#12151D]/80 px-6 py-4 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
