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
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Panel */}
      <div
        ref={drawerRef}
        className="relative z-10 w-full max-h-[88dvh] flex flex-col rounded-t-[28px] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-pop overflow-hidden"
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <span className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Drawer Header: Profil Pengguna & Aksi Cepat */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full bg-[#C81E1E] text-xs font-bold text-white shadow-2xs">
              {getInitials(user?.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.fullName || 'Pengguna'}
              </p>
              <p className="truncate text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
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
                className="h-11 w-11 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <MagnifyingGlass size={16} />
              </button>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="h-11 w-11 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              <X size={17} weight="bold" />
            </button>
          </div>
        </div>

        {/* Daftar Menu Tambahan per Kategori */}
        <div className="p-4 sm:p-5 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 space-y-4">
          {moreGroups.map((group, groupIdx) => (
            <div key={group.title || groupIdx} className={groupIdx > 0 ? 'pt-4' : ''}>
              <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
                {group.title}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all select-none min-h-[44px] cursor-pointer ${
                        isActive
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400 font-bold border border-rose-200/60 dark:border-rose-900/60'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive
                            ? 'bg-[#C81E1E] text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <Icon size={18} weight={isActive ? 'bold' : 'regular'} aria-hidden="true" />
                      </div>
                      <span className="text-xs truncate flex-1">{item.label}</span>
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
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onLogout) onLogout();
            }}
            className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs cursor-pointer"
          >
            <SignOut size={16} weight="bold" aria-hidden="true" />
            <span>Keluar dari Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
}

