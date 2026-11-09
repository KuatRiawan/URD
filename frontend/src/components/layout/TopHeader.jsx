import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  ArrowsClockwise,
  Bell,
  CaretDown,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Checks,
  Gear,
  MagnifyingGlass,
  SignOut,
  WifiHigh,
  WifiSlash
} from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { api } from '../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../lib/utils/format.js';
import { ThemeToggle } from '../ui/ThemeToggle.jsx';
import { getInitials } from './SidebarNav.jsx';
import { getPendingSyncSummary } from '../../lib/utils/offline-sync.js';
import { OfflineSyncDrawer } from '../../features/inspections/components/OfflineSyncDrawer.jsx';

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

  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const [offlineDrawerOpen, setOfflineDrawerOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isOnline, setIsOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    if (!isInspector) return;
    const checkSync = async () => {
      try {
        const sum = await getPendingSyncSummary();
        setPendingSyncCount(sum.totalPending || 0);
      } catch {
        setPendingSyncCount(0);
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 15000);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [isInspector]);

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

  const fetchNotifications = useCallback(async (isSilent = false) => {
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
  }, [setUnreadCount]);

  // Segarkan daftar notifikasi secara berkala selama popover terbuka.
  useEffect(() => {
    if (!notifMenuOpen) return;
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [notifMenuOpen, fetchNotifications]);

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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 urd-glass-toolbar px-4 sm:px-6 h-14 transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Desktop toggle collapse trigger */}
        <button
          type="button"
          onClick={toggleSidebar}
          title={collapsed ? 'Perluas Menu (Expanded)' : 'Kecilkan Menu (Collapsed)'}
          aria-label={collapsed ? 'Perluas Menu' : 'Kecilkan Menu'}
          className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-[9px] border border-black/[0.08] dark:border-white/[0.09] bg-white/80 dark:bg-white/[0.05] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
        >
          {collapsed ? (
            <CaretRight size={15} weight="bold" aria-hidden="true" />
          ) : (
            <CaretLeft size={15} weight="bold" aria-hidden="true" />
          )}
        </button>

        {/* Mobile Logo Brand */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <span className="inline-flex items-center justify-center rounded-lg bg-white p-1 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] shrink-0">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="32"
              height="22"
              className="h-5 w-auto object-contain"
            />
          </span>
          <div className="sm:hidden leading-none">
            <span className="font-bold text-xs text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.015em] block">
              PT Upaya Riksa Daya
            </span>
            <span className="text-[10px] font-medium text-[#6E6E73] dark:text-[#98989D] block mt-0.5">
              Riksa Uji K3
            </span>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-[#6E6E73] dark:text-[#98989D] font-medium min-w-0">
          <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">URD</span>
          <span className="text-black/20 dark:text-white/20">/</span>
          <span className="text-[#6E6E73] dark:text-[#98989D]">{currentNav?.group || 'Menu'}</span>
          <span className="text-black/20 dark:text-white/20">/</span>
          <span className="font-semibold text-[#C81E1E] dark:text-rose-400 truncate">{currentNav?.label || 'Dasbor'}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick Search Button (Mobile Compact Icon) */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Pencarian Cepat Data"
          className="sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-black/[0.08] dark:border-white/[0.09] bg-black/[0.03] dark:bg-white/[0.05] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.10] transition-all cursor-pointer"
        >
          <MagnifyingGlass size={16} aria-hidden="true" />
        </button>

        {/* Quick Search Button (Cmd+K) - Desktop Spotlight-style */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          aria-label="Pencarian Cepat Data (Tekan Cmd+K)"
          className="hidden sm:inline-flex h-8.5 px-3 items-center gap-2 rounded-[10px] border border-black/[0.07] dark:border-white/[0.08] bg-black/[0.035] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] text-xs font-medium text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-all cursor-pointer"
        >
          <MagnifyingGlass size={14} className="text-[#6E6E73] dark:text-[#98989D]" aria-hidden="true" />
          <span className="hidden md:inline">Cari nomor PO, klien, alat...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-[6px] border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#1E222D] px-1.5 py-0.5 text-[10px] font-semibold text-[#6E6E73] dark:text-[#98989D] shadow-[0_1px_1px_rgba(0,0,0,0.04)]">
            ⌘K
          </kbd>
        </button>

        {/* Status Offline & Sinkronisasi Khusus Inspector */}
        {isInspector && (
          <button
            type="button"
            onClick={() => setOfflineDrawerOpen(true)}
            className={`inline-flex h-8.5 items-center gap-1.5 px-2.5 rounded-[10px] border text-xs font-semibold transition-all cursor-pointer ${
              !isOnline
                ? 'bg-amber-500/15 text-amber-900 border-amber-500/30 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800'
                : pendingSyncCount > 0
                ? 'bg-[#C81E1E]/10 text-[#C81E1E] border-[#C81E1E]/25 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900'
                : 'bg-white/80 dark:bg-white/[0.05] text-[#1D1D1F] dark:text-[#F5F5F7] border-black/[0.08] dark:border-white/[0.09] hover:bg-black/[0.04]'
            }`}
            title="Penyimpanan Offline & Antrean Sinkronisasi"
          >
            {!isOnline ? (
              <>
                <WifiSlash size={15} weight="bold" />
                <span className="hidden md:inline">Offline</span>
              </>
            ) : pendingSyncCount > 0 ? (
              <>
                <ArrowsClockwise size={15} weight="bold" className="animate-spin text-[#C81E1E]" />
                <span>{pendingSyncCount} <span className="hidden md:inline">Antrean</span></span>
              </>
            ) : (
              <>
                <WifiHigh size={15} weight="bold" className="text-emerald-500" />
                <span className="hidden md:inline">Online</span>
              </>
            )}
          </button>
        )}

        {/* Theme Toggle - Desktop */}
        <div className="hidden sm:inline-flex">
          <ThemeToggle />
        </div>

        {/* Pusat Notifikasi Popover */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={toggleNotifMenu}
            aria-expanded={notifMenuOpen}
            aria-haspopup="true"
            aria-label="Pusat Notifikasi"
            className="relative h-8.5 w-8.5 sm:w-auto px-0 sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-full sm:rounded-[10px] border border-black/[0.08] dark:border-white/[0.09] bg-white/80 dark:bg-white/[0.05] text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
          >
            <Bell size={16} aria-hidden="true" className="text-[#6E6E73] dark:text-[#98989D]" />
            <span className="hidden md:inline">Notifikasi</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 sm:static inline-flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-[#C81E1E] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-[#151821]">
                {unreadCount}
              </span>
            )}
          </button>

          {notifMenuOpen && (
            <div className="fixed sm:absolute right-2 sm:right-0 inset-x-2 sm:inset-x-auto mt-2 sm:w-88 md:w-96 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white/95 dark:bg-[#151821]/95 backdrop-blur-xl shadow-[0_20px_48px_-12px_rgba(0,0,0,0.18)] z-50 animate-pop-in overflow-hidden">
              {/* Header Popover */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07] bg-[#F5F5F7]/70 dark:bg-[#11141C]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Notifikasi</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    disabled={markingAll}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C81E1E] dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    <Checks size={14} weight="bold" />
                    <span>Tandai Semua Dibaca</span>
                  </button>
                )}
              </div>

              {/* List Notifikasi */}
              <div className="max-h-[28rem] overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                {notifLoading ? (
                  <div className="p-6 text-center text-xs text-[#6E6E73] dark:text-[#98989D]">Memuat notifikasi...</div>
                ) : notifItems.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="h-10 w-10 mx-auto rounded-full bg-[#F5F5F7] dark:bg-white/[0.06] flex items-center justify-center text-[#6E6E73] mb-2">
                      <Bell size={20} />
                    </div>
                    <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Tidak ada notifikasi baru</p>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5">Semua info operasional telah dibaca.</p>
                  </div>
                ) : (
                  notifItems.map((item) => {
                    const isUnread = !item.read_at;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.05] cursor-pointer ${
                          isUnread ? 'bg-[#C81E1E]/[0.03] dark:bg-[#C81E1E]/[0.08]' : 'bg-transparent'
                        }`}
                      >
                        <div
                          className={`mt-0.5 h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isUnread
                              ? 'bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400'
                              : 'bg-[#F5F5F7] dark:bg-white/[0.06] text-[#6E6E73]'
                          }`}
                        >
                          <Bell size={16} weight={isUnread ? 'fill' : 'regular'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                              {item.title}
                            </span>
                            {isUnread && (
                              <span className="h-2 w-2 rounded-full bg-[#C81E1E] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] line-clamp-2 mt-0.5 leading-snug">
                            {item.body || item.message}
                          </p>
                          <span className="text-[10px] text-[#86868B] dark:text-[#636366] mt-1 block font-medium">
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
            className="h-8.5 p-0.5 sm:pl-1.5 sm:pr-2.5 inline-flex items-center gap-2 rounded-full sm:rounded-[10px] border border-transparent sm:border-black/[0.08] dark:sm:border-white/[0.09] bg-transparent sm:bg-white/80 dark:sm:bg-white/[0.05] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors sm:shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
          >
            <span className="h-7.5 w-7.5 sm:h-6.5 sm:w-6.5 inline-flex items-center justify-center rounded-full bg-[#C81E1E] text-xs sm:text-[11px] font-bold text-white shadow-xs overflow-hidden">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerText = getInitials(user?.fullName || 'User');
                    }
                  }}
                />
              ) : (
                getInitials(user?.fullName)
              )}
            </span>
            <span className="hidden sm:block text-left">
              <span className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] leading-none">
                {user?.fullName?.split(' ')[0] || 'User'}
              </span>
              <span className="block text-[10px] text-[#6E6E73] dark:text-[#98989D] font-medium leading-tight mt-0.5">
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </span>
            <CaretDown size={11} weight="bold" className="hidden sm:inline-block text-[#6E6E73] dark:text-[#98989D]" aria-hidden="true" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white/95 dark:bg-[#151821]/95 backdrop-blur-xl p-2 shadow-[0_20px_48px_-12px_rgba(0,0,0,0.18)] z-50 animate-pop-in">
              <div className="px-3 py-2.5 border-b border-black/[0.06] dark:border-white/[0.07] flex items-center gap-2.5">
                <span className="h-9 w-9 shrink-0 inline-flex items-center justify-center rounded-full bg-[#C81E1E] text-xs font-bold text-white overflow-hidden shadow-xs">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerText = getInitials(user?.fullName || 'User');
                        }
                      }}
                    />
                  ) : (
                    getInitials(user?.fullName)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] truncate">{user?.email || '-'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F5F7] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {ROLE_LABELS[user?.role] || user?.role}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <NavLink
                  to="/app/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  <Gear size={15} className="text-[#6E6E73] dark:text-[#98989D]" />
                  <span>Pengaturan Akun</span>
                </NavLink>
                <div className="px-3 py-1.5 text-[11px] text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
                  <span>Sesi K3 Terverifikasi</span>
                </div>
              </div>

              <div className="pt-1 border-t border-black/[0.06] dark:border-white/[0.07]">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-semibold text-[#C81E1E] dark:text-rose-400 hover:bg-[#C81E1E]/[0.06] dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <SignOut size={15} aria-hidden="true" />
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isInspector && (
        <OfflineSyncDrawer
          isOpen={offlineDrawerOpen}
          onClose={() => setOfflineDrawerOpen(false)}
        />
      )}
    </header>
  );
}
