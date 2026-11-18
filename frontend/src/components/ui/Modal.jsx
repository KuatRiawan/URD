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
      {/* Backdrop Halus Bergaya macOS Sheet / iOS Modal */}
      <div
        className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-[3px] transition-opacity animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget && closeOnBackdrop) {
            onClose?.();
          }
        }}
        aria-hidden="true"
      />

      {/* Panel Modal Bergaya Enterprise macOS / iOS - Selalu Terpusat Sempurna */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative w-full ${widthClass} my-auto text-left bg-white dark:bg-[#151821] border border-black/[0.08] dark:border-white/[0.09] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22),0_4px_16px_rgba(0,0,0,0.08)] flex flex-col ${
          isMobileFull
            ? 'h-[92dvh] sm:h-auto sm:max-h-[88vh] rounded-2xl'
            : 'max-h-[90dvh] sm:max-h-[86vh] rounded-2xl'
        } overflow-hidden z-10 animate-pop-in focus:outline-none`}
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.07] px-5 sm:px-6 py-4 shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-[17px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.018em] leading-snug truncate">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#6E6E73] dark:text-[#98989D] truncate">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAriaLabel}
            style={{ outline: 'none' }}
            className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer !outline-none focus:!outline-none focus-visible:!outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto flex-1 overscroll-contain touch-pan-y min-h-0">
          {children}
        </div>

        {/* Footer Modal (Sticky di bawah, tidak menutupi konten) */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-black/[0.06] dark:border-white/[0.07] bg-[#FAFAFC] dark:bg-[#1B1F2A]/70 px-5 sm:px-6 py-3.5 rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
