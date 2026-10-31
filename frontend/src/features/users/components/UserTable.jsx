import { PencilSimple, UserCheck, UserMinus } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserTable({ users, onEditUser, onToggleActive }) {
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
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Telepon:</span>
                <span className="text-slate-700 dark:text-slate-300">{u.phone || '-'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Login Terakhir:</span>
                <span>{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}</span>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEditUser(u)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <PencilSimple size={15} />
                <span>Edit Pengguna</span>
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
                <th className="py-3 px-4">Peran Sistem</th>
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
                    <div className="font-bold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                    <div className="font-mono text-slate-500 dark:text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {ROLE_LABELS[u.role] || u.role}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300">{u.phone || '-'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge tone={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEditUser(u)}
                        className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <PencilSimple size={14} />
                        <span>Edit</span>
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
