import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  Buildings,
  CalendarCheck,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  ClipboardText,
  ClockCounterClockwise,
  Cube,
  FileText,
  Gauge,
  Gear,
  List,
  MagnifyingGlass,
  Scroll,
  ShieldCheck,
  SignOut,
  User,
  Users,
  WarningOctagon,
  X
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import logoUrd from '../../assets/logo-urd.png';
import { api } from '../../lib/api/axios.js';
import { ROLE_LABELS } from '../../lib/utils/format.js';
import { ErrorBoundary } from '../feedback/ErrorBoundary.jsx';
import { FeedbackProvider, useConfirm } from '../ui/FeedbackProvider.jsx';
import { GlobalSearchDialog } from '../search/GlobalSearchDialog.jsx';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';

const NAV_ITEMS = [
  {
    to: '/app/dashboard',
    group: 'Utama',
    label: 'Dasbor Operasional',
    icon: Gauge,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/clients',
    group: 'Operasional',
    label: 'Data Klien',
    icon: Buildings,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/objects',
    group: 'Operasional',
    label: 'Objek Uji K3',
    icon: Cube,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/orders',
    group: 'Operasional',
    label: 'PO & Order Pemeriksaan',
    icon: ClipboardText,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/schedule',
    group: 'Operasional',
    label: 'Jadwal & Ahli K3',
    icon: CalendarCheck,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/inspections',
    group: 'Operasional',
    label: 'Form Pengujian',
    icon: FileText,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/bap',
    group: 'Dokumen & Sertifikasi',
    label: 'Berita Acara (BAP)',
    icon: ClipboardText,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/lhpp',
    group: 'Dokumen & Sertifikasi',
    label: 'Dokumen LHPP',
    icon: Scroll,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/history',
    group: 'Dokumen & Sertifikasi',
    label: 'Riwayat Pengujian',
    icon: ClockCounterClockwise,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  },
  {
    to: '/app/suket',
    group: 'Dokumen & Sertifikasi',
    label: 'Registri Suket K3',
    icon: WarningOctagon,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN']
  },
  {
    to: '/app/reminders',
    group: 'Pemantauan',
    label: 'Pengingat Perpanjangan',
    icon: ShieldCheck,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'PIMPINAN']
  },
  {
    to: '/app/users',
    group: 'Administrasi',
    label: 'Manajemen Pengguna',
    icon: Users,
    roles: ['ADMIN_SISTEM']
  },
  {
    to: '/app/audit-logs',
    group: 'Administrasi',
    label: 'Log Audit',
    icon: ClockCounterClockwise,
    roles: ['ADMIN_SISTEM', 'PIMPINAN']
  },
  {
    to: '/app/settings',
    group: 'Pengaturan',
    label: 'Pengaturan Akun',
    icon: Gear,
    roles: ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'PIMPINAN']
  }
];

function getInitials(name = '') {
  return (
    name
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'U'
  );
}

function SidebarNav({ items, collapsed = false, onNavigate }) {
  const groups = [];
  for (const item of items) {
    let g = groups.find((x) => x.name === item.group);
    if (!g) {
      g = { name: item.group, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }

  return (
    <nav
      aria-label="Menu utama"
      className={`flex-1 overflow-y-auto scrollbar-thin py-3 space-y-4 ${
        collapsed ? 'px-2' : 'px-3'
      }`}
    >
      {groups.map((group) => (
        <div key={group.name} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">
              {group.name}
            </p>
          ) : (
            <div className="my-2 border-t border-slate-800/80 mx-2" title={group.name} />
          )}

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-lg transition-all duration-150 ${
                      collapsed
                        ? 'justify-center p-2.5'
                        : 'gap-3 px-3 py-2 text-[13px] font-semibold'
                    } ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xs font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator bar */}
                      {!collapsed && (
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-white transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        size={collapsed ? 20 : 18}
                        weight={isActive ? 'bold' : 'regular'}
                        aria-hidden="true"
                        className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserCard({ user, collapsed = false, onLogout }) {
  if (collapsed) {
    return (
      <div className="border-t border-slate-800 p-2 flex flex-col items-center gap-2">
        <span
          title={`${user?.fullName} (${ROLE_LABELS[user?.role] || user?.role})`}
          className="relative h-9 w-9 inline-flex items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-2xs"
        >
          {getInitials(user?.fullName)}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
        </span>
        <button
          type="button"
          onClick={onLogout}
          title="Keluar Sesi"
          aria-label="Keluar Sesi"
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <SignOut size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-slate-800 p-3.5 bg-slate-900/60">
      <div className="flex items-center gap-3">
        <span className="relative h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white shadow-2xs">
          {getInitials(user?.fullName)}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-white">{user?.fullName}</p>
          <p className="truncate text-[11px] text-slate-400 font-medium">
            {ROLE_LABELS[user?.role] || user?.role}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 w-full h-8.5 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/60 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-colors"
      >
        <SignOut size={14} aria-hidden="true" />
        <span>Keluar Sesi</span>
      </button>
    </div>
  );
}

function BrandBlock({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center justify-center rounded-lg bg-white p-1.5 shadow-2xs shrink-0">
        <img
          src={logoUrd}
          alt="Logo PT Upaya Riksa Daya"
          width="40"
          height="28"
          className="h-6 w-auto object-contain"
        />
      </span>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-extrabold tracking-tight text-white leading-tight">
            PT Upaya Riksa Daya
          </p>
          <p className="truncate text-[10px] font-semibold text-slate-400">PJK3 Riksa Uji K3</p>
        </div>
      )}
    </div>
  );
}

function LayoutShell() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();

  // Collapsible sidebar state (tersimpan di localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('urd_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('urd_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const currentNav = visibleNav.find((item) => location.pathname.startsWith(item.to));

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    let active = true;
    api
      .get('/notifications?limit=5')
      .then(({ data }) => {
        if (active) setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    const ok = await confirm({
      title: 'Keluar dari Sistem',
      message: 'Sesi Anda akan diakhiri dan Anda perlu masuk kembali untuk melanjutkan pekerjaan.',
      confirmLabel: 'Ya, Keluar',
      tone: 'warning'
    });
    if (!ok) return;
    await logout();
    navigate('/login', { replace: true });
  };

  const sidebarWidthClass = collapsed ? 'lg:w-20' : 'lg:w-64';
  const mainPaddingClass = collapsed ? 'lg:pl-20' : 'lg:pl-64';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-canvas text-slate-900">
      {/* Sidebar Desktop Bergaya Metis */}
      <aside
        aria-label="Navigasi utama"
        className={`hidden lg:flex ${sidebarWidthClass} lg:flex-col lg:fixed lg:inset-y-0 bg-slate-950 text-white z-40 transition-all duration-200 border-r border-slate-800`}
      >
        <div className={`py-4 border-b border-slate-800 ${collapsed ? 'px-3 flex justify-center' : 'px-5'}`}>
          <BrandBlock compact={collapsed} />
        </div>

        <SidebarNav items={visibleNav} collapsed={collapsed} />

        <UserCard user={user} collapsed={collapsed} onLogout={handleLogout} />
      </aside>

      {/* Konten Utama */}
      <div className={`flex-1 flex flex-col ${mainPaddingClass} min-w-0 transition-all duration-200`}>
        {/* Top Navbar Header Bergaya Metis */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 h-15 shadow-2xs transition-colors">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Buka menu navigasi"
              className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <List size={18} weight="bold" aria-hidden="true" />
            </button>

            {/* Desktop toggle collapse trigger */}
            <button
              type="button"
              onClick={toggleSidebar}
              title={collapsed ? 'Perluas Menu (Expanded)' : 'Kecilkan Menu (Collapsed)'}
              aria-label={collapsed ? 'Perluas Menu' : 'Kecilkan Menu'}
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
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

            {/* Breadcrumb Navigation Elegan Metis */}
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
              className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs"
            >
              <MagnifyingGlass size={15} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
              <span className="hidden md:inline text-slate-500 dark:text-slate-400">Cari nomor PO, klien, alat...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle (Light / Dark / System) */}
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
                className="h-9 pl-1.5 pr-2.5 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors shadow-2xs"
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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

        {/* Drawer Navigasi Mobile */}
        {mobileOpen && (
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
                  className="h-8.5 w-8.5 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X size={18} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <SidebarNav items={visibleNav} onNavigate={() => setMobileOpen(false)} />
              <UserCard user={user} onLogout={handleLogout} />
            </div>
          </div>
        )}

        {/* Konten Halaman Utama */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[92rem] w-full mx-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Footer Aplikasi Bergaya Enterprise */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">PT Upaya Riksa Daya</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>Sistem Informasi Terpadu Pemeriksaan dan Pengujian K3</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span>urd@upayariksadaya.com</span>
            <span>·</span>
            <span>(021) 489 1409</span>
          </div>
        </footer>

        <GlobalSearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <FeedbackProvider>
      <LayoutShell />
    </FeedbackProvider>
  );
}
