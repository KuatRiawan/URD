import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotsThreeVertical } from '@phosphor-icons/react';

export function ActionMenu({
  items = [],
  label = 'Aksi lainnya',
  align = 'right',
  size = 'xs',
  variant = 'secondary',
  triggerClassName = '',
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const visibleItems = items.filter((item) => item && !item.hidden);

  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    placement: 'bottom',
    width: 200
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

    // Jika tombol tergulung keluar dari layar, tutup menu
    if (triggerRect.bottom < 0 || triggerRect.top > viewportHeight) {
      setOpen(false);
      return;
    }

    const menuWidth = 200;
    const actualHeight = menuRef.current?.offsetHeight;
    const estimatedHeight = actualHeight || Math.max(visibleItems.length * 38 + 12, 76);

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Buka ke atas jika ruang di bawah tidak cukup dan ruang di atas lebih luas
    const shouldOpenUp = spaceBelow < estimatedHeight + 12 && spaceAbove > spaceBelow;

    let top = 0;
    if (shouldOpenUp) {
      top = triggerRect.top - estimatedHeight - 6;
      if (top < 8) top = 8;
    } else {
      top = triggerRect.bottom + 6;
      if (top + estimatedHeight > viewportHeight - 8) {
        top = Math.max(8, viewportHeight - estimatedHeight - 8);
      }
    }

    let left = 0;
    if (align === 'right') {
      left = triggerRect.right - menuWidth;
    } else {
      left = triggerRect.left;
    }

    // Pastikan tidak keluar dari batas horizontal viewport
    if (left + menuWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }
    if (left < 8) {
      left = 8;
    }

    setPosition({
      top: Math.round(top),
      left: Math.round(left),
      placement: shouldOpenUp ? 'top' : 'bottom',
      width: menuWidth
    });
  }, [align, visibleItems.length]);

  // Hitung posisi saat menu terbuka dan saat ukuran menu diketahui
  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const handleScrollOrResize = (e) => {
      // Abaikan scroll jika terjadi di dalam menu itu sendiri
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      updatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [open, updatePosition]);

  // Perbaiki posisi setelah DOM menu terpasang dan tingginya terukur secara presisi
  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  // Tutup menu saat klik di luar atau saat menekan tombol Escape
  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (visibleItems.length === 0) return null;

  // Resolusi ukuran tombol pemicu agar simetris dengan tombol aksi lainnya
  const sizeClasses = {
    xs: 'h-8 w-8 rounded-[8px]',
    sm: 'h-8.5 w-8.5 min-w-[34px] rounded-[9px]',
    md: 'h-9.5 w-9.5 min-w-[38px] rounded-[10px]',
    touch: 'min-h-[44px] min-w-[44px] rounded-xl'
  }[size] || 'h-8 w-8 rounded-[8px]';

  const iconSize = {
    xs: 18,
    sm: 19,
    md: 20,
    touch: 22
  }[size] || 18;

  const canUseDOM = typeof document !== 'undefined' && Boolean(document.body);

  const menuDropdown = open && canUseDOM && (
    <div
      ref={menuRef}
      role="menu"
      tabIndex={-1}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 9999
      }}
      className={`min-w-[190px] rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/95 dark:bg-[#1C1F2B]/95 backdrop-blur-md p-1 shadow-[0_10px_32px_rgba(0,0,0,0.14),0_2px_6px_rgba(0,0,0,0.06)] animate-in fade-in zoom-in-95 duration-100 ${
        position.placement === 'top' ? 'origin-bottom-right' : 'origin-top-right'
      }`}
    >
      {visibleItems.map((item, idx) => {
        const Icon = item.icon;
        const isDanger = item.variant === 'danger' || item.destructive;
        return (
          <button
            key={item.key || item.label || idx}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              setOpen(false);
              item.onClick?.();
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
              isDanger
                ? 'text-[#C81E1E] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-white/[0.07]'
            }`}
          >
            {Icon && <Icon size={15} weight="bold" className="shrink-0 opacity-80" aria-hidden="true" />}
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="relative inline-block text-left">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
        title={label}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={`inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-40 disabled:cursor-not-allowed border ${sizeClasses} ${
          open
            ? 'bg-slate-100 dark:bg-white/[0.14] text-slate-900 dark:text-white border-black/[0.20] dark:border-white/[0.24] ring-2 ring-slate-400/20 shadow-xs'
            : variant === 'ghost'
            ? 'border-transparent bg-transparent text-slate-600 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white'
            : 'border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-[#1E222D] text-slate-700 dark:text-slate-200 hover:bg-[#F5F5F7] dark:hover:bg-white/[0.08] hover:text-[#1D1D1F] dark:hover:text-white hover:border-black/[0.16] dark:hover:border-white/[0.18] shadow-[0_1px_2px_rgba(0,0,0,0.03)] active:scale-[0.98]'
        } ${triggerClassName}`}
      >
        <DotsThreeVertical
          size={iconSize}
          weight="bold"
          className="shrink-0"
          aria-hidden="true"
        />
      </button>

      {open && canUseDOM && createPortal(menuDropdown, document.body)}
    </div>
  );
}
