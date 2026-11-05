import { Eye, PencilSimple, UserCheck, UserMinus } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserTable({ users, onEditUser, onToggleActive, onViewUser }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN_SISTEM':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'ADMIN_KANTOR':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'AHLI_K3':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'PIMPINAN':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'MARKETING':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Pengguna Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {users.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            {/* Header: Nama & Status */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {u.fullName}
                </h3>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {u.email}
                </p>
              </div>
              <Badge tone={u.isActive ? 'success' : 'danger'}>
                {u.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>

            {/* Konten Detail */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Peran Sistem:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Telepon:</span>
                <span className="text-slate-700 dark:text-slate-300 font-mono">{u.phone || '-'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Login Terakhir:</span>
                <span className="font-mono">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}</span>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              {onViewUser && (
                <button
                  type="button"
                  onClick={() => onViewUser(u)}
                  className="min-h-[42px] px-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  <Eye size={15} />
                  <span>Detail</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onEditUser(u)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <PencilSimple size={15} />
                <span>Ubah</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleActive(u)}
                className={`min-h-[42px] px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer ${
                  u.isActive
                    ? 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {u.isActive ? <UserMinus size={15} /> : <UserCheck size={15} />}
                <span>{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Nama Lengkap &amp; Email</th>
                <th className="py-3 px-4">Peran Sistem (RBAC)</th>
                <th className="py-3 px-4">Telepon</th>
                <th className="py-3 px-4">Login Terakhir</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold text-[10px]">
                        {u.fullName?.slice(0, 2).toUpperCase() || 'US'}
                      </span>
                      <span>{u.fullName}</span>
                    </div>
                    <div className="font-mono text-slate-500 dark:text-slate-400 pl-8">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${getRoleBadge(u.role)}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-mono">{u.phone || '-'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {onViewUser && (
                        <button
                          type="button"
                          onClick={() => onViewUser(u)}
                          className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Eye size={14} />
                          <span>Detail</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEditUser(u)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <PencilSimple size={14} />
                        <span>Ubah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleActive(u)}
                        className={`min-h-9 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer ${
                          u.isActive
                            ? 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500'
                            : 'bg-emerald-700 hover:bg-emerald-800'
                        }`}
                      >
                        {u.isActive ? <UserMinus size={14} /> : <UserCheck size={14} />}
                        <span>{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
