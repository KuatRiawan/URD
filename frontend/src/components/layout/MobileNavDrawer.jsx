import { X } from '@phosphor-icons/react';
import { BrandBlock, SidebarNav, UserCard } from './SidebarNav.jsx';

export function MobileNavDrawer({
  mobileOpen,
  setMobileOpen,
  visibleNav,
  user,
  handleLogout
}) {
  if (!mobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden flex animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Menu Navigasi Mobile"
    >
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <div className="relative z-10 w-72 max-w-[85vw] bg-slate-950 text-white flex flex-col h-full shadow-pop border-r border-slate-800">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800">
          <BrandBlock compact />
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Tutup menu navigasi"
            className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <SidebarNav items={visibleNav} onNavigate={() => setMobileOpen(false)} />
        <UserCard user={user} onLogout={handleLogout} />
      </div>
    </div>
  );
}

