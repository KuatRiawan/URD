import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus(open, dialogRef, onClose, closeOnEscape = true) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;

    const getFocusable = () => [
      ...(dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR) || [])
    ];

    // Fokus awal yang cerdas: prioritaskan input form, hindari tombol tutup header
    const focusTimer = window.setTimeout(() => {
      const panel = dialogRef.current;
      if (!panel) return;

      // 1. Elemen input/select/textarea pertama yang aktif (untuk form/wizard)
      const firstField = panel.querySelector(
        'select:not([disabled]), input:not([type="hidden"]):not([disabled]), textarea:not([disabled])'
      );
      if (firstField) {
        firstField.focus({ preventScroll: true });
        return;
      }

      // 2. Jika bukan formulir input, ambil elemen fokusabel pertama yang BUKAN tombol tutup dialog
      const items = getFocusable();
      const nonCloseItem = items.find((el) => {
        const aria = (el.getAttribute('aria-label') || '').toLowerCase();
        return !aria.includes('tutup') && !aria.includes('close');
      });

      if (nonCloseItem) {
        nonCloseItem.focus({ preventScroll: true });
        return;
      }

      // 3. Fallback: fokus pada panel modal itu sendiri, jangan tombol tutup
      panel.focus?.({ preventScroll: true });
    }, 40);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (!closeOnEscape) return;
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, [open, dialogRef, closeOnEscape]);
}
