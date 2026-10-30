import { NavLink } from 'react-router';
import { SignOut } from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { ROLE_LABELS } from '../../lib/utils/format.js';

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

export function UserCard({ user, collapsed = false, onLogout }) {
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
          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
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
        className="mt-3 w-full h-8.5 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/60 text-xs font-semibold text-slate-200 hover:bg-rose-600 hover:border-rose-600 hover:text-white transition-colors cursor-pointer"
      >
        <SignOut size={14} aria-hidden="true" />
        <span>Keluar Sesi</span>
      </button>
    </div>
  );
}

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

