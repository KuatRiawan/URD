import { NavLink } from 'react-router';
import { SignOut } from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';

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
                      isActive
                        ? 'bg-[#C81E1E] text-white font-semibold shadow-[0_1px_3px_rgba(200,30,30,0.28)]'
                        : 'text-[#1D1D1F]/80 dark:text-[#E5E5EA]/80 font-medium hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={collapsed ? 20 : 18}
                        weight={isActive ? 'fill' : 'regular'}
                        aria-hidden="true"
                        className={
                          isActive
                            ? 'text-white shrink-0'
                            : 'text-[#6E6E73] dark:text-[#98989D] group-hover:text-[#1D1D1F] dark:group-hover:text-white shrink-0 transition-colors'
                        }
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
