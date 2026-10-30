import { NavLink } from 'react-router';
import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Gear,
  List,
  MagnifyingGlass,
  SignOut
} from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { ROLE_LABELS } from '../../lib/utils/format.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { getInitials } from './SidebarNav.jsx';

export function TopHeader({
  collapsed,
  toggleSidebar,
  setMobileOpen,
  setSearchOpen,
  unreadCount,
  userMenuOpen,
  setUserMenuOpen,
  userMenuRef,
  user,
  handleLogout,
  currentNav
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-15 shadow-2xs transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu navigasi"
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <List size={18} weight="bold" aria-hidden="true" />
        </button>

        {/* Desktop toggle collapse trigger */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? 'Perluas Menu (Expanded)' : 'Kecilkan Menu (Collapsed)'}
          aria-label={collapsed ? 'Perluas Menu' : 'Kecilkan Menu'}
          className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          {collapsed ? (
            <CaretRight size={16} weight="bold" aria-hidden="true" />
          ) : (
            <CaretLeft size={16} weight="bold" aria-hidden="true" />
          )}
        </button>

        {/* Mobile Logo Brand */}
        <div className="flex items-center gap-2 lg:hidden">
          <img
            src={logoUrd}
            alt="Logo PT Upaya Riksa Daya"
            width="32"
            height="22"
            className="h-5.5 w-auto object-contain"
          />
        </div>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium min-w-0">
          <span className="font-bold text-slate-800 dark:text-slate-200">URD</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-500 dark:text-slate-400">{currentNav?.group || 'Menu'}</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-bold text-brand-600 dark:text-brand-400 truncate">{currentNav?.label || 'Dasbor'}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button (Cmd+K) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Pencarian Cepat Data (Tekan Cmd+K)"
          className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white transition-all shadow-2xs cursor-pointer"
        >
          <MagnifyingGlass size={15} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <span className="hidden md:inline text-slate-500 dark:text-slate-400">Cari nomor PO, klien, alat...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Pusat Notifikasi */}
        <NavLink
          to="/app/notifications"
          aria-label="Pusat Notifikasi"
          className="relative h-9 px-2.5 sm:px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
        >
          <Bell size={17} aria-hidden="true" className="text-slate-600 dark:text-slate-300" />
          <span className="hidden md:inline">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="inline-flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-extrabold text-white">
              {unreadCount}
            </span>
          )}
        </NavLink>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            className="h-9 pl-1.5 pr-2.5 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-brand-600 text-[11px] font-extrabold text-white shadow-2xs">
              {getInitials(user?.fullName)}
            </span>
            <span className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-900 dark:text-white leading-none">
                {user?.fullName?.split(' ')[0] || 'User'}
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight mt-0.5">
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </span>
            <CaretDown size={12} weight="bold" className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-pop z-50 animate-pop-in">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email || '-'}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {ROLE_LABELS[user?.role] || user?.role}
                </span>
              </div>

              <div className="py-1">
                <NavLink
                  to="/app/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Gear size={15} className="text-slate-500 dark:text-slate-400" />
                  <span>Pengaturan Akun</span>
                </NavLink>
                <div className="px-3 py-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
                  <span>Sesi K3 Terverifikasi</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <SignOut size={15} aria-hidden="true" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
