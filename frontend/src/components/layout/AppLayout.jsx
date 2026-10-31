import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { api } from '../../lib/api/axios.js';
import { ErrorBoundary } from '../feedback/ErrorBoundary.jsx';
import { FeedbackProvider, useConfirm } from '../ui/FeedbackProvider.jsx';
import { GlobalSearchDialog } from '../search/GlobalSearchDialog.jsx';
import { getVisibleNav } from './navConfig.js';
import { BrandBlock, SidebarNav, UserCard } from './SidebarNav.jsx';
import { TopHeader } from './TopHeader.jsx';
import { MobileBottomNav } from './MobileBottomNav.jsx';

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

  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef(null);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('urd_sidebar_collapsed', String(next));
      } catch {
        // Preferensi sidebar hanya disimpan sebagai kenyamanan, bukan syarat fungsi.
      }
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

  const visibleNav = useMemo(() => getVisibleNav(user?.role), [user?.role]);
  const currentNav = visibleNav.find((item) => location.pathname.startsWith(item.to));

  useEffect(() => {
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Ambil jumlah notifikasi secara berkala tanpa mengulang polling saat rute berubah.
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const checkNotifications = () => {
      if (document.visibilityState === 'hidden') return;
      api
        .get('/notifications?limit=30', { signal: controller.signal })
        .then(({ data }) => {
          if (active) setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 30000);

    const handleFocus = () => checkNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkNotifications();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      active = false;
      clearInterval(interval);
      controller.abort();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

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
        <TopHeader
          collapsed={collapsed}
          toggleSidebar={toggleSidebar}
          setSearchOpen={setSearchOpen}
          unreadCount={unreadCount}
          setUnreadCount={setUnreadCount}
          userMenuOpen={userMenuOpen}
          setUserMenuOpen={setUserMenuOpen}
          userMenuRef={userMenuRef}
          user={user}
          handleLogout={handleLogout}
          currentNav={currentNav}
        />

        {/* Konten Halaman Utama */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-7 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-7 max-w-[92rem] w-full mx-auto">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* Footer Aplikasi Bergaya Enterprise */}
        <footer className="hidden lg:flex border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 py-3 text-xs text-slate-500 dark:text-slate-400 items-center justify-between gap-2 transition-colors">
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

        {/* Bar Navigasi Bawah Mobile */}
        <MobileBottomNav
          onOpenSearch={() => setSearchOpen(true)}
          onLogout={handleLogout}
        />
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
