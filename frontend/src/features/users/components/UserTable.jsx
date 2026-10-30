import { PencilSimple, UserCheck, UserMinus } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserTable({ users, onEditUser, onToggleActive }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4">Nama Lengkap & Email</th>
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
                      className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <PencilSimple size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleActive(u)}
                      className={`min-h-9 inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-bold text-white cursor-pointer ${
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
  );
}

