import { useCallback, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { SquaresFour } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { getMobileNavConfig } from './navConfig.js';
import { MobileNavDrawer } from './MobileNavDrawer.jsx';

export function MobileBottomNav({ onOpenSearch, onLogout }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role;

  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);

  const handleCloseDrawer = useCallback(() => {
    setMoreDrawerOpen(false);
  }, []);

  const handleToggleDrawer = useCallback(() => {
    setMoreDrawerOpen((prev) => !prev);
  }, []);

  const { primary, moreGroups } = useMemo(() => getMobileNavConfig(role), [role]);

  // Periksa apakah rute saat ini berada dalam salah satu item menu di dalam drawer "Lainnya"
  const isMoreActive = useMemo(() => {
    return moreGroups.some((group) =>
      group.items.some((item) => location.pathname.startsWith(item.to))
    );
  }, [moreGroups, location.pathname]);

  return (
    <>
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] inset-x-3.5 max-w-md mx-auto z-40 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] px-2 py-1.5 transition-all"
      >
        <div className="grid grid-cols-5 items-center">
          {primary.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app/dashboard'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all min-h-[48px] select-none cursor-pointer ${
                    isActive
                      ? 'text-[#C81E1E] dark:text-rose-400 font-extrabold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'bg-rose-50 dark:bg-rose-950/60 scale-105'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        size={20}
                        weight={isActive ? 'fill' : 'regular'}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
                      {item.label}
                    </span>
                    {isActive && (
                      <span className="w-1 h-1 rounded-full bg-[#C81E1E] dark:bg-rose-400 mt-0.5" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}

          {/* Tombol ke-5: Menu Lainnya (Memicu Sheet Drawer) */}
          <button
            type="button"
            onClick={handleToggleDrawer}
            aria-label="Tampilkan menu lainnya"
            aria-expanded={moreDrawerOpen}
            className={`flex flex-col items-center justify-center w-full py-1 px-1 rounded-2xl transition-all min-h-[48px] select-none cursor-pointer ${
              isMoreActive || moreDrawerOpen
                ? 'text-[#C81E1E] dark:text-rose-400 font-extrabold'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <div
              className={`relative flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ${
                isMoreActive || moreDrawerOpen
                  ? 'bg-rose-50 dark:bg-rose-950/60 scale-105'
                  : 'bg-transparent'
              }`}
            >
              <SquaresFour
                size={20}
                weight={isMoreActive || moreDrawerOpen ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-full">
              Lainnya
            </span>
            {(isMoreActive || moreDrawerOpen) && (
              <span className="w-1 h-1 rounded-full bg-[#C81E1E] dark:bg-rose-400 mt-0.5" />
            )}
          </button>
        </div>
      </nav>

      {/* Drawer Bottom Sheet Menu Tambahan */}
      <MobileNavDrawer
        open={moreDrawerOpen}
        onClose={handleCloseDrawer}
        user={user}
        moreGroups={moreGroups}
        onLogout={onLogout}
        onOpenSearch={onOpenSearch}
      />
    </>
  );
}
