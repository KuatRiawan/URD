import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Checks,
  Gear,
  MagnifyingGlass,
  SignOut
} from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { api } from '../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../lib/utils/format.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { getInitials } from './SidebarNav.jsx';

export function TopHeader({
  collapsed,
  toggleSidebar,
  setSearchOpen,
  unreadCount,
  setUnreadCount,
  userMenuOpen,
  setUserMenuOpen,
  userMenuRef,
  user,
  handleLogout,
  currentNav
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [notifItems, setNotifItems] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const notifMenuRef = useRef(null);

  // Tutup popup notifikasi saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tutup popup saat berpindah rute
  useEffect(() => {
    setNotifMenuOpen(false);
  }, [location.pathname]);

  const fetchNotifications = async (isSilent = false) => {
    if (!isSilent) setNotifLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifItems(res.data?.items || []);
      if (typeof setUnreadCount === 'function') {
        setUnreadCount(res.data?.unreadCount || 0);
      }
    } catch {
      // Abaikan galat fetch latar belakang
    } finally {
      if (!isSilent) setNotifLoading(false);
    }
  };

  // Realtime update notifikasi saat popover sedang terbuka
  useEffect(() => {
    if (!notifMenuOpen) return;
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [notifMenuOpen]);

  const toggleNotifMenu = () => {
    const next = !notifMenuOpen;
    if (next) {
      setUserMenuOpen(false);
      fetchNotifications(false);
    }
    setNotifMenuOpen(next);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.post('/notifications/read-all');
      setNotifItems((prev) =>
        prev.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() }))
      );
      if (typeof setUnreadCount === 'function') {
        setUnreadCount(0);
      }
    } catch {
      // Abaikan galat
    } finally {
      setMarkingAll(false);
    }
  };

  // Logika navigasi cerdas langsung ke halaman detail dokumen/order
  const resolveNotificationDestination = (item) => {
    const textToScan = `${item.title || ''} ${item.body || ''} ${item.link || ''}`;

    // Ekstrak nomor PO atau nomor Order dari judul/deskripsi
    const ordMatch = textToScan.match(/ORD\/\d+\/\d+/i);
    const poMatch = textToScan.match(/PO[-/][\w/-]+/i);
    const identifier = ordMatch ? ordMatch[0] : poMatch ? poMatch[0] : null;

    // Jika notifikasi tentang dokumen LHPP
    if (
      item.type?.startsWith('LHPP_') ||
      textToScan.toLowerCase().includes('lhpp') ||
      textToScan.toLowerCase().includes('laporan')
    ) {
      return identifier ? `/app/lhpp?search=${encodeURIComponent(identifier)}` : '/app/lhpp';
    }

    // Jika notifikasi tentang Berita Acara (BAP)
    if (
      item.type?.startsWith('BAP_') ||
      textToScan.toLowerCase().includes('bap') ||
      textToScan.toLowerCase().includes('berita acara')
    ) {
      return identifier ? `/app/bap?search=${encodeURIComponent(identifier)}` : '/app/bap';
    }

    // Jika notifikasi tentang kedaluwarsa Suket K3 / pengingat
    if (
      item.type === 'REMINDER_EXPIRED' ||
      textToScan.toLowerCase().includes('suket') ||
      textToScan.toLowerCase().includes('kedaluwarsa')
    ) {
      return '/app/reminders';
    }

    // Default untuk PO & Order & Penugasan: buka detail PO secara spesifik
    if (identifier) {
      return `/app/orders?orderNo=${encodeURIComponent(identifier)}`;
    }

    return item.link || '/app/orders';
  };

  const handleItemClick = (item) => {
    const dest = resolveNotificationDestination(item);
    const textToScan = `${item.title || ''} ${item.body || ''} ${item.link || ''}`;
    const ordMatch = textToScan.match(/ORD\/\d+\/\d+/i);
    const poMatch = textToScan.match(/PO[-/][\w/-]+/i);
    const identifier = ordMatch ? ordMatch[0] : poMatch ? poMatch[0] : null;

    // Tutup popup notifikasi seketika untuk respons cepat
    setNotifMenuOpen(false);

    // Tandai telah dibaca di latar belakang secara asinkron
    if (!item.read_at) {
      setNotifItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      if (typeof setUnreadCount === 'function') {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      api.patch(`/notifications/${item.id}/read`).catch(() => {});
    }

    // Emit event custom agar jika user sudah berada di halaman orders, modal langsung terbuka
    if (identifier) {
      window.dispatchEvent(
        new CustomEvent('urd:open-order-detail', { detail: { identifier } })
      );
    }

    navigate(dest);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-6 h-14 sm:h-15 shadow-2xs transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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
            className="h-6 w-auto object-contain"
          />
          <div className="sm:hidden leading-none">
            <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight block">
              PT Upaya Riksa Daya
            </span>
            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-0.5">
              Riksa Uji K3
            </span>
          </div>
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
        {/* Quick Search Button (Mobile Compact Icon) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Pencarian Cepat Data"
          className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs cursor-pointer"
        >
          <MagnifyingGlass size={16} aria-hidden="true" />
        </button>

        {/* Quick Search Button (Cmd+K) - Desktop */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Pencarian Cepat Data (Tekan Cmd+K)"
          className="hidden sm:inline-flex h-9 px-3 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:white transition-all shadow-2xs cursor-pointer"
        >
          <MagnifyingGlass size={15} className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <span className="hidden md:inline text-slate-500 dark:text-slate-400">Cari nomor PO, klien, alat...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle - Desktop */}
        <div className="hidden sm:inline-flex">
          <ThemeToggle />
        </div>

        {/* Pusat Notifikasi Popover (Muncul Dropdown Popover Mirip Menu Profil) */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={toggleNotifMenu}
            aria-expanded={notifMenuOpen}
            aria-haspopup="true"
            aria-label="Pusat Notifikasi"
            className="relative h-9 w-9 sm:w-auto px-0 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-full sm:rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Bell size={17} aria-hidden="true" className="text-slate-600 dark:text-slate-300" />
            <span className="hidden md:inline">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:static inline-flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-[#C81E1E] px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 inset-x-2 sm:inset-x-auto mt-2 sm:w-88 md:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-pop z-50 animate-pop-in overflow-hidden">
              {/* Header Popover */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E] dark:text-rose-400">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Checks size={14} weight="bold" />
                    <span>Tandai Semua Dibaca</span>
                  </button>
                )}
              </div>

              {/* List Notifikasi (Semua notifikasi langsung muncul di popover dengan scrolling halus) */}
              <div className="max-h-[28rem] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                {notifLoading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Memuat notifikasi...</div>
                ) : notifItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Tidak ada notifikasi baru</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua info operasional telah dibaca.</p>
                  </div>
                ) : (
                  notifItems.map((item) => {
                    const isUnread = !item.read_at;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                          isUnread ? 'bg-rose-50/25 dark:bg-rose-950/15' : 'bg-transparent'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isUnread
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-[#C81E1E]'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Bell size={16} weight={isUnread ? 'fill' : 'regular'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.title}
                            </span>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-[#C81E1E] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {item.body || item.message}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen((prev) => {
                const next = !prev;
                if (next) setNotifMenuOpen(false);
                return next;
              });
            }}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="Menu profil pengguna"
            className="h-9 p-0.5 sm:pl-1.5 sm:pr-2.5 inline-flex items-center gap-2 rounded-full sm:rounded-lg border border-transparent sm:border-slate-200 dark:sm:border-slate-700 bg-transparent sm:bg-white dark:sm:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors sm:shadow-2xs cursor-pointer"
          >
            <span className="h-8 w-8 sm:h-7 sm:w-7 inline-flex items-center justify-center rounded-full bg-[#C81E1E] text-xs sm:text-[11px] font-extrabold text-white shadow-xs ring-2 ring-slate-100 dark:ring-slate-800">
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
            <CaretDown size={12} weight="bold" className="hidden sm:inline-block text-slate-400 dark:text-slate-500" aria-hidden="true" />
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
