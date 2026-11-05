import { useEffect, useState } from 'react';
import {
  Article,
  CalendarBlank,
  Certificate,
  CheckCircle,
  Envelope,
  IdentificationBadge,
  Phone,
  ShieldCheck,
  User,
  WarningCircle,
  X
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../../lib/utils/format.js';

export function UserDetailDrawer({ user, open, onClose, onEdit }) {
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-left">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850/60">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-[#C81E1E]" weight="bold" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Dossier Akun Pengguna
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel detail"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* User Profile Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <span className="h-14 w-14 rounded-full bg-[#C81E1E] text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-xs ring-2 ring-white dark:ring-slate-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover rounded-full" />
              ) : (
                user.fullName?.slice(0, 2).toUpperCase() || 'US'
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                {user.fullName}
              </h4>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {ROLE_LABELS[user.role] || user.role}
                </span>
                <Badge tone={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Data Kontak & Kepegawaian */}
          <div className="space-y-3">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Informasi Kontak & Kepegawaian
            </h5>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
              <div className="py-2 first:pt-0 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <IdentificationBadge size={14} />
                  <span>ID Pengguna</span>
                </span>
                <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  {user.id?.slice(0, 8)}...
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Envelope size={14} />
                  <span>Email Kantor</span>
                </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {user.email}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone size={14} />
                  <span>Telepon / WhatsApp</span>
                </span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {user.phone || '-'}
                </span>
              </div>
              {['AHLI_K3', 'INSPECTOR'].includes(user.role) && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Certificate size={14} />
                    <span>NIP / KTA Ahli K3</span>
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {user.employeeNo || '-'}
                  </span>
                </div>
              )}
              <div className="py-2 last:pb-0 flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CalendarBlank size={14} />
                  <span>Login Terakhir</span>
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Belum pernah login'}
                </span>
              </div>
            </div>
          </div>

          {/* Wewenang Operasional Peran */}
          <div className="space-y-3">
            <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Cakupan Kewenangan Peran
            </h5>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="text-[#C81E1E] shrink-0 mt-0.5" weight="bold" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">
                    {ROLE_LABELS[user.role] || user.role}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Article size={14} />
                <span>Riwayat Aktivitas & Audit Akun</span>
              </h5>
              <span className="text-[10px] font-mono text-slate-400">
                {activities.length} entri
              </span>
            </div>

            {loadingActivity ? (
              <div className="p-4 text-center text-[11px] text-slate-400 border border-slate-200 dark:border-slate-800 rounded-xl">
                Memuat jejak aktivitas pengguna...
              </div>
            ) : activities.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Belum ada riwayat aktivitas terekam untuk akun ini.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {activities.map((act) => (
                  <div key={act.id} className="p-2.5 space-y-1 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {act.action}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatDateTime(act.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
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

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/60 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onEdit) onEdit(user);
            }}
            className="px-4 py-2 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] cursor-pointer"
          >
            Edit Akun Pengguna
          </button>
        </div>
      </div>
    </div>
  );
}
