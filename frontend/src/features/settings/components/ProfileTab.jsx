import { useRef } from 'react';
import { Camera, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ROLE_LABELS, formatDate } from '../../../lib/utils/format.js';

const ROLE_RESPONSIBILITIES = {
  MARKETING: [
    'Pendaftaran & pengelolaan PO dari klien korporat',
    'Pengelolaan basis data klien, lokasi operasional, dan kontak PIC',
    'Pemantauan siklus pengingat jatuh tempo riksa uji (H-30, H-14, H-7)',
    'Akses ke jejak riwayat pengujian alat K3 dan penerbitan PO perpanjangan'
  ],
  AHLI_K3: [
    'Penerimaan jadwal dan konfirmasi surat tugas lapangan',
    'Pemeriksaan teknis, pengisian checklist K3, dan hasil ukur',
    'Dokumentasi foto temuan dan tanda tangan digital BAP',
    'Penyusunan draf Laporan Hasil Pemeriksaan dan Pengujian (LHPP)'
  ],
  INSPECTOR: [
    'Penerimaan jadwal dan konfirmasi surat tugas lapangan',
    'Pemeriksaan teknis, pengisian checklist K3, dan hasil ukur',
    'Dokumentasi foto temuan dan tanda tangan digital BAP',
    'Penyusunan draf Laporan Hasil Pemeriksaan dan Pengujian (LHPP)'
  ],
  ADMIN_KANTOR: [
    'Verifikasi data PO baru dan kelengkapan unit alat',
    'Penjadwalan inspeksi dan penugasan Ahli K3 sesuai kompetensi SKP',
    'Quality Control (QC) dan finalisasi LHPP serta BAP',
    'Penerbitan Suket K3 Disnaker dan distribusi dokumen operasional'
  ],
  PIMPINAN: [
    'Pemantauan dasbor kinerja operasional terpadu perusahaan',
    'Otorisasi dokumen riksa uji dan pengesahan LHPP final',
    'Supervisi beban kerja inspeksi dan kepatuhan regulasi K3 nasional'
  ],
  MANAGER: [
    'Pemantauan dasbor kinerja operasional terpadu perusahaan',
    'Otorisasi dokumen riksa uji dan pengesahan LHPP final',
    'Supervisi beban kerja inspeksi dan kepatuhan regulasi K3 nasional'
  ],
  ADMIN_SISTEM: [
    'Manajemen pengguna sistem dan hak akses peran (RBAC)',
    'Konfigurasi format penomoran dokumen dan profil badan usaha PJK3',
    'Pengawasan log audit keamanan dan pencadangan database PostgreSQL'
  ]
};

export function ProfileTab({
  user,
  meData,
  profileForm,
  setProfileForm,
  profileLoading,
  profileSuccess,
  profileError,
  onUpdateProfile,
  onAvatarUpload,
  getRoleBadgeColor
}) {
  const fileInputRef = useRef(null);
  const avatarSrc = profileForm.avatarUrl || user?.avatarUrl;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      onAvatarUpload(file);
    }
  };

  const currentRoleDuties = ROLE_RESPONSIBILITIES[user?.role] || [
    'Akses sistem operasional terintegrasi PT Upaya Riksa Daya'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Ringkasan Akun & Foto Profil */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Kartu Identitas Pengguna</CardTitle>
            <CardDescription>Foto profil dan identitas otorisasi Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <div className="h-20 w-20 rounded-full bg-brand-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md overflow-hidden ring-4 ring-white dark:ring-slate-800">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={user?.fullName} className="h-full w-full object-cover" />
                  ) : (
                    user?.fullName
                      ?.split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Ubah Foto Profil"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 text-white hover:bg-[#C81E1E] transition-colors shadow-sm cursor-pointer"
                >
                  <Camera size={14} weight="bold" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2.5 text-xs font-bold text-brand-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Ganti Foto Profil
              </button>

              <h3 className="mt-2 font-bold text-sm text-slate-900 dark:text-slate-100">
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

        {/* Konfigurasi Peran & Tanggung Jawab */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#C81E1E]" weight="bold" />
              <span>Konfigurasi Peran: {ROLE_LABELS[user?.role] || user?.role}</span>
            </CardTitle>
            <CardDescription>Lingkup otorisasi operasional akun Anda di PT Upaya Riksa Daya</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {currentRoleDuties.map((duty, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-600 dark:bg-rose-500 mt-1.5 shrink-0" />
                  <span>{duty}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

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
              <Notice tone="success">{profileSuccess}</Notice>
            </div>
          )}
          {profileError && (
            <div className="mb-4">
              <Notice tone="error">{profileError}</Notice>
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

