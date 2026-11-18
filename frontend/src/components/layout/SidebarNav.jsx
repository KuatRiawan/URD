import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import { CaretDown, SignOut } from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { resolveActiveSubmenu } from './navConfig.js';

export function getInitials(name = '') {
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

export function BrandBlock({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      {/* Kontainer Putih Murni untuk Menjaga Keaslian Logo Resmi PT Upaya Riksa Daya */}
      <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] shrink-0">
        <img
          src={logoUrd}
          alt="Logo PT Upaya Riksa Daya"
          width="42"
          height="30"
          className="h-6 w-auto object-contain"
        />
      </span>
      {!compact && (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
            PT Upaya Riksa Daya
          </p>
          <p className="truncate text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] mt-0.5">
            PJK3 Riksa Uji K3
          </p>
        </div>
      )}
    </div>
  );
}

export function SidebarLogout({ collapsed = false, onLogout }) {
  if (collapsed) {
    return (
      <div className="border-t border-black/[0.06] dark:border-white/[0.07] p-2.5 flex justify-center">
        <button
          type="button"
          onClick={onLogout}
          title="Keluar Sesi"
          aria-label="Keluar Sesi"
          className="h-10 w-10 inline-flex items-center justify-center rounded-[10px] text-[#6E6E73] dark:text-[#98989D] hover:bg-rose-500/10 hover:text-[#C81E1E] dark:hover:text-rose-400 transition-colors cursor-pointer"
        >
          <SignOut size={19} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-black/[0.06] dark:border-white/[0.07] p-3">
      <button
        type="button"
        onClick={onLogout}
        className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] dark:border-white/[0.09] bg-white/80 dark:bg-white/[0.04] text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5EA] hover:bg-rose-50 dark:hover:bg-rose-950/35 hover:border-rose-200 dark:hover:border-rose-800/60 hover:text-[#C81E1E] dark:hover:text-rose-300 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
      >
        <SignOut size={15} weight="bold" aria-hidden="true" />
        <span>Keluar Sesi</span>
      </button>
    </div>
  );
}

export const UserCard = SidebarLogout;

export function SidebarNav({ items, collapsed = false, onNavigate }) {
  const location = useLocation();
  const navigate = useNavigate();

  // State menu expandable (otomatis terbuka untuk rute yang sedang aktif)
  const [expandedKeys, setExpandedKeys] = useState(() => {
    const initial = {};
    for (const item of items) {
      if (item.submenus && location.pathname.startsWith(item.to)) {
        initial[item.to] = true;
        const activeSubTo = resolveActiveSubmenu(item.submenus, location);
        for (const sub of item.submenus) {
          if (sub.submenus?.length && activeSubTo === sub.to) {
            initial[sub.to] = true;
          }
        }
      }
    }
    return initial;
  });
  const navRef = useRef(null);

  // Otomatis buka parent dropdown jika rute saat ini berada di dalam menu tersebut
  useEffect(() => {
    const currentLocation = { pathname: location.pathname, search: location.search };
    setExpandedKeys((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const item of items) {
        if (item.submenus && currentLocation.pathname.startsWith(item.to)) {
          if (!prev[item.to]) {
            next[item.to] = true;
            changed = true;
          }
          const activeSubTo = resolveActiveSubmenu(item.submenus, currentLocation);
          for (const sub of item.submenus) {
            if (sub.submenus?.length && activeSubTo === sub.to && !prev[sub.to]) {
              next[sub.to] = true;
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
  }, [location.pathname, location.search, items]);

  // Daftar submenu bisa lebih panjang dari tinggi sidebar: pastikan submenu yang
  // sedang aktif selalu ikut terlihat saat grup dibuka atau halaman berganti.
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;
    const activeItems = container.querySelectorAll('[data-submenu-active="true"]');
    activeItems[activeItems.length - 1]?.scrollIntoView?.({ block: 'nearest' });
  }, [location.pathname, location.search, expandedKeys]);

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
      ref={navRef}
      aria-label="Menu utama"
      className={`flex-1 overflow-y-auto scrollbar-thin py-3.5 space-y-5 ${
        collapsed ? 'px-2' : 'px-3'
      }`}
    >
      {groups.map((group) => (
        <div key={group.name} className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[11px] font-semibold tracking-[-0.005em] text-[#86868B] dark:text-[#8E8E93] select-none">
              {group.name}
            </p>
          ) : (
            <div className="my-2 border-t border-black/[0.06] dark:border-white/[0.07] mx-2" title={group.name} />
          )}

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const hasSubmenus = Array.isArray(item.submenus) && item.submenus.length > 0;

              // Menu dengan Submenu Expandable (seperti PO & Order Masuk)
              if (hasSubmenus && !collapsed) {
                const isExpanded = Boolean(expandedKeys[item.to]);
                const isParentActive = location.pathname.startsWith(item.to);
                const activeSubmenuTo = resolveActiveSubmenu(item.submenus, location);

                const toggleSubmenu = (e) => {
                  e.preventDefault();
                  if (!isParentActive) {
                    setExpandedKeys((prev) => ({ ...prev, [item.to]: true }));
                    const defaultSub =
                      item.submenus.find((s) => s.isDefault && !s.header) ||
                      item.submenus.find((s) => s.to && !s.header);
                    navigate(defaultSub?.to || item.to);
                    if (onNavigate) onNavigate();
                    return;
                  }
                  setExpandedKeys((prev) => ({ ...prev, [item.to]: !prev[item.to] }));
                };

                return (
                  <div key={item.to} className="space-y-0.5">
                    {/* Tombol Parent Dropdown */}
                    <button
                      type="button"
                      onClick={toggleSubmenu}
                      aria-expanded={isExpanded}
                      className={`w-full group relative flex items-center justify-between rounded-[10px] gap-2.5 px-2.5 py-2 text-[13px] tracking-[-0.01em] transition-all duration-150 cursor-pointer ${
                        isParentActive
                          ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.28)]'
                          : isExpanded
                          ? 'bg-[#C81E1E]/10 dark:bg-rose-500/15 text-[#C81E1E] dark:text-rose-400 font-semibold'
                          : 'text-[#1D1D1F]/80 dark:text-[#E5E5EA]/80 font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          weight={isParentActive ? 'fill' : 'regular'}
                          aria-hidden="true"
                          className={
                            isParentActive
                              ? 'text-white shrink-0'
                              : isExpanded
                              ? 'text-[#C81E1E] dark:text-rose-400 shrink-0'
                              : 'text-[#6E6E73] dark:text-[#98989D] group-hover:text-[#1D1D1F] dark:group-hover:text-white shrink-0 transition-colors'
                          }
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      <CaretDown
                        size={14}
                        weight="bold"
                        className={`shrink-0 transition-transform duration-200 ${
                          isParentActive
                            ? 'text-white/90'
                            : isExpanded
                            ? 'text-[#C81E1E] dark:text-rose-400'
                            : 'text-[#86868B] dark:text-[#8E8E93] group-hover:text-[#1D1D1F] dark:group-hover:text-white'
                        } ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                      />
                    </button>

                    {/* Daftar Submenu Dropdown */}
                    {isExpanded && (
                      <div
                        className="ml-4 pl-3.5 space-y-0.5 border-l border-black/[0.08] dark:border-white/[0.08] py-1 animate-submenu-in"
                        role="menu"
                        aria-label={`Submenu ${item.label}`}
                      >
                        {item.submenus.map((sub, subIdx) => {
                          if (sub.header) {
                            return (
                              <p
                                key={`submenu-header-${subIdx}`}
                                className="mt-1.5 px-2.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#86868B] dark:text-[#8E8E93] border-t border-black/[0.06] dark:border-white/[0.07] select-none"
                              >
                                {sub.header}
                              </p>
                            );
                          }

                          const isSubActive = activeSubmenuTo === sub.to;
                          const hasNestedSubmenus = Array.isArray(sub.submenus) && sub.submenus.length > 0;

                          if (hasNestedSubmenus) {
                            const isNestedExpanded = Boolean(expandedKeys[sub.to]);
                            const activeNestedTo = resolveActiveSubmenu(sub.submenus, location);
                            const hasActiveNestedChild = Boolean(activeNestedTo);

                            return (
                              <div key={sub.to} className="space-y-0.5">
                                <div
                                  className={`flex items-center justify-between rounded-[8px] transition-all duration-150 ${
                                    isSubActive && !hasActiveNestedChild
                                      ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.25)]'
                                      : isSubActive && hasActiveNestedChild
                                      ? 'bg-[#C81E1E]/12 dark:bg-rose-500/20 text-[#C81E1E] dark:text-rose-300 font-semibold'
                                      : 'text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white font-medium'
                                  }`}
                                >
                                  <Link
                                    to={sub.to}
                                    onClick={() => {
                                      setExpandedKeys((prev) => ({
                                        ...prev,
                                        [sub.to]: isSubActive ? !prev[sub.to] : true
                                      }));
                                      if (onNavigate) onNavigate();
                                    }}
                                    role="menuitem"
                                    data-submenu-active={isSubActive ? 'true' : undefined}
                                    aria-current={isSubActive && !activeNestedTo ? 'page' : undefined}
                                    className="flex-1 min-w-0 px-2.5 py-1.5 text-[12px] tracking-[-0.01em] truncate cursor-pointer"
                                  >
                                    {sub.label}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedKeys((prev) => ({ ...prev, [sub.to]: !prev[sub.to] }))
                                    }
                                    aria-expanded={isNestedExpanded}
                                    aria-label={`Tampilkan sub-bab ${sub.label}`}
                                    className={`shrink-0 mr-1 p-1 rounded-[6px] transition-colors cursor-pointer ${
                                      isSubActive && !hasActiveNestedChild
                                        ? 'text-white/90 hover:bg-white/15'
                                        : isSubActive && hasActiveNestedChild
                                        ? 'text-[#C81E1E] dark:text-rose-300 hover:bg-[#C81E1E]/10'
                                        : 'text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08]'
                                    }`}
                                  >
                                    <CaretDown
                                      size={12}
                                      weight="bold"
                                      className={`transition-transform duration-200 ${
                                        isNestedExpanded ? 'rotate-180' : 'rotate-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                {isNestedExpanded && (
                                  <div
                                    className="ml-2.5 pl-2.5 space-y-0.5 border-l border-black/[0.08] dark:border-white/[0.10] py-0.5 animate-submenu-in"
                                    role="menu"
                                    aria-label={`Sub-bab ${sub.label}`}
                                  >
                                    {sub.submenus.map((nested) => {
                                      const isNestedActive = activeNestedTo === nested.to;
                                      return (
                                        <Link
                                          key={nested.to}
                                          to={nested.to}
                                          onClick={onNavigate}
                                          role="menuitem"
                                          data-submenu-active={isNestedActive ? 'true' : undefined}
                                          aria-current={isNestedActive ? 'page' : undefined}
                                          className={`flex items-center justify-between px-2 py-1.5 rounded-[7px] text-[11.5px] tracking-[-0.01em] transition-all duration-150 cursor-pointer ${
                                            isNestedActive
                                              ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.25)]'
                                              : 'text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white font-medium'
                                          }`}
                                        >
                                          <span className="truncate">{nested.label}</span>
                                          {isNestedActive && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                                          )}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              onClick={onNavigate}
                              role="menuitem"
                              data-submenu-active={isSubActive ? 'true' : undefined}
                              aria-current={isSubActive ? 'page' : undefined}
                              className={`flex items-center justify-between px-2.5 py-1.5 rounded-[8px] text-[12px] tracking-[-0.01em] transition-all duration-150 cursor-pointer ${
                                isSubActive
                                  ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.25)]'
                                  : 'text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white font-medium'
                              }`}
                            >
                              <span className="truncate">{sub.label}</span>
                              {isSubActive && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0 ml-1.5" />
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Menu Biasa atau saat Sidebar Collapsed (Icon-Only)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-[10px] transition-all duration-150 ${
                      collapsed
                        ? 'justify-center p-2.5'
                        : 'gap-2.5 px-2.5 py-2 text-[13px] tracking-[-0.01em]'
                    } ${
                      isActive || (collapsed && hasSubmenus && location.pathname.startsWith(item.to))
                        ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.28)]'
                        : 'text-[#1D1D1F]/80 dark:text-[#E5E5EA]/80 font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => {
                    const activeState = isActive || (collapsed && hasSubmenus && location.pathname.startsWith(item.to));
                    return (
                      <>
                        <Icon
                          size={collapsed ? 20 : 18}
                          weight={activeState ? 'fill' : 'regular'}
                          aria-hidden="true"
                          className={
                            activeState
                              ? 'text-white shrink-0'
                              : 'text-[#6E6E73] dark:text-[#98989D] group-hover:text-[#1D1D1F] dark:group-hover:text-white shrink-0 transition-colors'
                          }
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    );
                  }}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
