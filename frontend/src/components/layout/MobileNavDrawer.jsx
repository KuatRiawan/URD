import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import {
  MagnifyingGlass,
  SignOut,
  X
} from '@phosphor-icons/react';
import { ROLE_LABELS } from '../../lib/utils/format.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { useDialogFocus } from '../ui/useDialogFocus.js';
import { getInitials } from './SidebarNav.jsx';

export function MobileNavDrawer({
  open,
  onClose,
  user,
  moreGroups = [],
  onLogout,
  onOpenSearch
}) {
  const location = useLocation();
  const drawerRef = useRef(null);
  const lastPathnameRef = useRef(location.pathname);
  useDialogFocus(open, drawerRef, onClose);

  // Kunci scroll latar belakang saat drawer terbuka.
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Tutup drawer secara otomatis hanya jika rute berpindah saat drawer sedang terbuka
  useEffect(() => {
    if (open && lastPathnameRef.current !== location.pathname) {
      onClose();
    }
    lastPathnameRef.current = location.pathname;
  }, [location.pathname, open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Menu Lengkap Layanan PT Upaya Riksa Daya"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/35 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-h-[88dvh] flex flex-col rounded-t-[28px] bg-[#F5F5F7] dark:bg-[#151821] border-t border-black/[0.08] dark:border-white/[0.08] shadow-pop overflow-hidden"
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <span className="w-9 h-1 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        {/* Drawer Header: Profil Pengguna & Aksi Cepat */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-black/[0.06] dark:border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full bg-[#C81E1E] text-xs font-bold text-white shadow-2xs overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                getInitials(user?.fullName)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
                {user?.fullName || 'Pengguna'}
              </p>
              <p className="truncate text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                {ROLE_LABELS[user?.role] || user?.role}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {typeof onOpenSearch === 'function' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                aria-label="Pencarian Cepat Data"
                className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#1E222D] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer"
              >
                <MagnifyingGlass size={16} />
              </button>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="h-11 w-11 inline-flex items-center justify-center rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
            >
              <X size={17} weight="bold" />
            </button>
          </div>
        </div>

        {/* Daftar Menu Tambahan per Kategori (iOS Grouped Inset List) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          {moreGroups.map((group, groupIdx) => (
            <div key={group.title || groupIdx}>
              <h3 className="text-[11px] font-semibold tracking-[-0.005em] text-[#6E6E73] dark:text-[#98989D] mb-2 px-1.5">
                {group.title}
              </h3>

              <div className="rounded-2xl bg-white dark:bg-[#1E222D] border border-black/[0.06] dark:border-white/[0.07] divide-y divide-black/[0.05] dark:divide-white/[0.06] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3.5 py-2.5 transition-all select-none min-h-[46px] cursor-pointer ${
                        isActive
                          ? 'bg-rose-50/70 dark:bg-rose-950/35 text-[#C81E1E] dark:text-rose-400 font-semibold'
                          : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] font-medium'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-[9px] flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#C81E1E] text-white shadow-2xs'
                            : 'bg-[#F5F5F7] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D]'
                        }`}
                      >
                        <Icon size={17} weight={isActive ? 'fill' : 'regular'} aria-hidden="true" />
                      </div>
                      <span className="text-[13px] truncate flex-1">{item.label}</span>
                      {isActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C81E1E] dark:bg-rose-400 mr-1" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Drawer: Tombol Keluar Sesi */}
        <div className="p-3.5 border-t border-black/[0.06] dark:border-white/[0.07] bg-white/80 dark:bg-[#151821]/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#1E222D] text-xs font-semibold text-[#C81E1E] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
          >
            <SignOut size={16} weight="bold" aria-hidden="true" />
            <span>Keluar dari Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
}

