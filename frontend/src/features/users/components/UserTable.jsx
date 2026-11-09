import { Eye, Pencil, Prohibit, CheckCircle } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserTable({ users, onViewUser, onEditUser, onToggleActive }) {
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
            className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3"
          >
            {/* Header: Nama & Status */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">
                  {u.fullName}
                </h3>
                <p className="text-[11px] font-mono text-[#6E6E73] dark:text-[#98989D] mt-0.5">
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
                <span className="text-[#6E6E73] dark:text-[#98989D]">Peran Sistem:</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getRoleBadge(u.role)}`}>
                  {ROLE_LABELS[u.role] || u.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6E6E73] dark:text-[#98989D]">Telepon:</span>
                <span className="text-[#1D1D1F] dark:text-[#F5F5F7] font-mono">{u.phone || '-'}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.06] text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                <span>Login Terakhir:</span>
                <span className="font-mono">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}</span>
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
              {onViewUser && (
                <Button
                  variant="secondary"
                  size="sm"
                  touchFriendly
                  icon={Eye}
                  onClick={() => onViewUser(u)}
                  className="flex-1 justify-center"
                >
                  Detail
                </Button>
              )}
              {(onEditUser || onToggleActive) && (
                <ActionMenu
                  label={`Aksi pengguna ${u.fullName}`}
                  items={[
                    onEditUser && {
                      label: 'Ubah Data Pengguna',
                      icon: Pencil,
                      onClick: () => onEditUser(u)
                    },
                    onToggleActive && {
                      label: u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
                      icon: u.isActive ? Prohibit : CheckCircle,
                      destructive: u.isActive,
                      onClick: () => onToggleActive(u)
                    }
                  ]}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Bersih */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>Nama Lengkap &amp; Email</TableCell>
              <TableCell isHeader>Peran Sistem (RBAC)</TableCell>
              <TableCell isHeader>Telepon</TableCell>
              <TableCell isHeader>Login Terakhir</TableCell>
              <TableCell isHeader>Status Akun</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="text-xs">
                  <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-black/[0.06] dark:bg-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center justify-center font-bold text-[10px]">
                      {u.fullName?.slice(0, 2).toUpperCase() || 'US'}
                    </span>
                    <span>{u.fullName}</span>
                  </div>
                  <div className="font-mono text-[#6E6E73] dark:text-[#98989D] pl-8">{u.email}</div>
                </TableCell>
                <TableCell className="text-xs">
                  <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${getRoleBadge(u.role)}`}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-[#1D1D1F] dark:text-[#E5E5EA] font-mono tabular-nums">
                  {u.phone || '-'}
                </TableCell>
                <TableCell className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono tabular-nums">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah login'}
                </TableCell>
                <TableCell>
                  <Badge tone={u.isActive ? 'success' : 'danger'}>
                    {u.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell align="right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    {onViewUser && (
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={() => onViewUser(u)}
                      >
                        Detail
                      </Button>
                    )}
                    {(onEditUser || onToggleActive) && (
                      <ActionMenu
                        label={`Opsi pengguna ${u.fullName}`}
                        items={[
                          onEditUser && {
                            label: 'Ubah Data Pengguna',
                            icon: Pencil,
                            onClick: () => onEditUser(u)
                          },
                          onToggleActive && {
                            label: u.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun',
                            icon: u.isActive ? Prohibit : CheckCircle,
                            destructive: u.isActive,
                            onClick: () => onToggleActive(u)
                          }
                        ]}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableWrapper>
      </div>
    </div>
  );
}
