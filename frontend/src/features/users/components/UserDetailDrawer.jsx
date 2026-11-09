import { useEffect, useState } from 'react';
import {
  Article,
  CalendarBlank,
  Certificate,
  Envelope,
  IdentificationBadge,
  PencilSimple,
  Phone,
  ShieldCheck,
  Trash,
  UserCheck,
  UserMinus
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserDetailDrawer({
  user,
  open,
  onClose,
  onEdit,
  onToggleActive,
  onDelete,
  isCurrentUser = false
}) {
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) {
      setActivities([]);
      return;
    }
    let cancelled = false;
    setLoadingActivity(true);
    Promise.resolve(api.get(`/users/${user.id}/activity`))
      .then((res) => {
        if (!cancelled) {
          setActivities(res?.data?.items || []);
        }
      })
      .catch(() => {
        if (!cancelled) setActivities([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingActivity(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  if (!open || !user) return null;

  const modalFooter = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
      {/* Tombol Tindakan Berisiko / Status (Kiri) */}
      <div className="flex flex-wrap items-center gap-2">
        {onDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={Trash}
            onClick={() => onDelete(user)}
            disabled={isCurrentUser}
            title={isCurrentUser ? 'Anda tidak dapat menghapus akun Anda sendiri' : 'Hapus pengguna ini secara permanen'}
          >
            Hapus Pengguna
          </Button>
        )}

        {onToggleActive && (
          <Button
            type="button"
            variant={user.isActive ? 'outline' : 'secondary'}
            size="sm"
            icon={user.isActive ? UserMinus : UserCheck}
            onClick={() => onToggleActive(user)}
            disabled={isCurrentUser}
            title={isCurrentUser ? 'Anda tidak dapat menonaktifkan akun sendiri' : undefined}
            className={user.isActive ? 'text-[#C81E1E] hover:text-[#A61717] hover:bg-rose-50 dark:hover:bg-rose-950/20' : ''}
          >
            {user.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
          </Button>
        )}
      </div>

      {/* Tombol Standar / Edit (Kanan) */}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
        >
          Tutup
        </Button>
        {onEdit && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={PencilSimple}
            onClick={() => {
              onClose();
              onEdit(user);
            }}
          >
            Ubah Data
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dossier Akun Pengguna"
      subtitle={user.email}
      size="lg"
      closeAriaLabel="Tutup panel detail"
      footer={modalFooter}
    >
      <div className="p-5 sm:p-6 space-y-6 text-xs">
        {/* User Profile Card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="h-14 w-14 rounded-full bg-[#C81E1E] text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm ring-2 ring-white dark:ring-slate-800">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover rounded-full" />
            ) : (
              user.fullName?.slice(0, 2).toUpperCase() || 'US'
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
              {user.fullName}
            </h4>
            <p className="text-xs font-mono text-[#6E6E73] dark:text-[#98989D] truncate mt-0.5">
              {user.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/[0.06] dark:bg-white/[0.10] text-[#1D1D1F] dark:text-[#F5F5F7]">
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <Badge tone={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? 'Aktif' : 'Nonaktif'}
              </Badge>
              {isCurrentUser && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                  Akun Anda Sedang Aktif
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Data Kontak & Kepegawaian */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D]">
            Informasi Kontak &amp; Kepegawaian
          </h5>
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] divide-y divide-black/[0.04] dark:divide-white/[0.05]">
            <div className="py-2.5 first:pt-0 flex items-center justify-between">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                <IdentificationBadge size={16} />
                <span>ID Pengguna</span>
              </span>
              <span className="font-mono text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                {user.id}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                <Envelope size={16} />
                <span>Email Resmi URD</span>
              </span>
              <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                {user.email}
              </span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                <Phone size={16} />
                <span>Nomor Kontak</span>
              </span>
              <span className="font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">
                {user.phone || '-'}
              </span>
            </div>
            {['AHLI_K3', 'INSPECTOR'].includes(user.role) && (
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                  <Certificate size={16} />
                  <span>NIP / KTA Ahli K3</span>
                </span>
                <span className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {user.employeeNo || '-'}
                </span>
              </div>
            )}
            <div className="py-2.5 last:pb-0 flex items-center justify-between">
              <span className="text-[#6E6E73] dark:text-[#98989D] flex items-center gap-2">
                <CalendarBlank size={16} />
                <span>Login Terakhir</span>
              </span>
              <span className="font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Belum pernah login'}
              </span>
            </div>
          </div>
        </div>

        {/* Wewenang Operasional Peran */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D]">
            Cakupan Kewenangan Peran
          </h5>
          <div className="p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] space-y-2">
            <div className="flex items-start gap-2.5">
              <ShieldCheck size={18} className="text-[#C81E1E] shrink-0 mt-0.5" weight="bold" />
              <div>
                <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] block text-xs">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-1 leading-relaxed">
                  {user.role === 'ADMIN_SISTEM' && 'Akses penuh administrasi platform, manajemen pengguna RBAC, pengaturan template, penomoran dokumen, dan database backup.'}
                  {user.role === 'ADMIN_KANTOR' && 'Pengelolaan operasional harian: penjadwalan Ahli K3, review QC teknis LHPP, registrasi Suket K3, dan pengiriman BAST.'}
                  {['AHLI_K3', 'INSPECTOR'].includes(user.role) && 'Pelaksanaan inspeksi lapangan, pengisian checklist K3, perekaman foto bukti, dan penandatanganan Berita Acara (BAP).'}
                  {user.role === 'PIMPINAN' && 'Pengawasan eksekutif, analisis tren performa SLA tim, produktivitas kerja Ahli K3, dan pemantauan audit trail independen.'}
                  {user.role === 'MARKETING' && 'Pengelolaan data klien & PIC, pencatatan PO multi-unit, dan tindak lanjut perpanjangan sertifikat Suket K3 (repeat order).'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rekam Jejak Aktivitas & Audit Akun */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-[#6E6E73] dark:text-[#98989D] flex items-center gap-1.5">
              <Article size={15} />
              <span>Riwayat Aktivitas &amp; Audit Akun</span>
            </h5>
            <span className="text-[10px] font-mono text-[#6E6E73] dark:text-[#98989D]">
              {activities.length} entri
            </span>
          </div>

          {loadingActivity ? (
            <div className="p-4 text-center text-[11px] text-[#6E6E73] dark:text-[#98989D] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#151821]">
              Memuat jejak aktivitas pengguna...
            </div>
          ) : activities.length === 0 ? (
            <div className="p-4 text-center text-[11px] text-[#6E6E73] dark:text-[#98989D] border border-dashed border-black/[0.10] dark:border-white/[0.10] rounded-2xl">
              Belum ada riwayat aktivitas terekam untuk akun ini.
            </div>
          ) : (
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.04] dark:divide-white/[0.05] max-h-48 overflow-y-auto bg-white dark:bg-[#151821]">
              {activities.map((act) => (
                <div key={act.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {act.action}
                    </span>
                    <span className="font-mono text-[10px] text-[#6E6E73] dark:text-[#98989D]">
                      {formatDateTime(act.created_at)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#1D1D1F] dark:text-[#E5E5EA] truncate">
                    {typeof act.summary === 'object'
                      ? JSON.stringify(act.summary)
                      : act.summary || `Entitas: ${act.entity}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
