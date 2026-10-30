import { CheckCircle } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ROLE_LABELS, formatDate } from '../../../lib/utils/format.js';

export function ProfileTab({
  user,
  meData,
  profileForm,
  setProfileForm,
  profileLoading,
  profileSuccess,
  profileError,
  onUpdateProfile,
  getRoleBadgeColor
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ringkasan Akun */}
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle>Kartu Identitas Pengguna</CardTitle>
          <CardDescription>Informasi otorisasi dan identitas aktif Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="h-16 w-16 rounded-full bg-brand-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs">
              {user?.fullName
                ?.split(' ')
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'U'}
            </div>
            <h3 className="mt-3 font-bold text-sm text-slate-900 dark:text-slate-100">
              {user?.fullName || 'Pengguna'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <span
              className={`mt-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeColor()}`}
            >
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Status Akun</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle size={14} weight="fill" />
                Aktif Terverifikasi
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Nomor Telepon</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user?.phone || 'Belum diisi'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Terdaftar Sejak</span>
              <span className="font-medium text-slate-600 dark:text-slate-400">
                {meData?.createdAt ? formatDate(meData.createdAt) : '2024'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Perubahan Profil */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Perbarui Informasi Pribadi</CardTitle>
          <CardDescription>
            Sesuaikan nama lengkap dan kontak yang digunakan pada dokumen operasional
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileSuccess && (
            <div className="mb-4">
              <Notice variant="success">{profileSuccess}</Notice>
            </div>
          )}
          {profileError && (
            <div className="mb-4">
              <Notice variant="error">{profileError}</Notice>
            </div>
          )}

          <form onSubmit={onUpdateProfile} className="space-y-4">
            <div>
              <label
                htmlFor="emailDisabled"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Alamat Email (Akun Utama)
              </label>
              <input
                id="emailDisabled"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Alamat email terdaftar terkunci secara sistem dan hanya dapat diubah oleh Administrator Utama.
              </p>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Nama Lengkap Beserta Gelar
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Contoh: Ir. Budi Santoso, S.T., M.K3"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Nomor Telepon / WhatsApp
              </label>
              <input
                id="phone"
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Contoh: 081234567890"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button type="submit" variant="primary" loading={profileLoading}>
                Simpan Perubahan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
