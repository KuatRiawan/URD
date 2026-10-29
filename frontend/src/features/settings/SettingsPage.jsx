import { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Palette,
  Gear,
  Key,
  Eye,
  EyeSlash,
  CheckCircle,
  WarningCircle,
  Buildings,
  HardHat,
  FileText,
  Sliders,
  Check,
  DeviceMobile,
  Moon,
  Sun,
  Desktop
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useTheme } from '../../app/providers/ThemeProvider.jsx';
import { api } from '../../lib/api/axios.js';
import { ROLE_LABELS, formatDate } from '../../lib/utils/format.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Notice } from '../../components/ui/Notice.jsx';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  // Tab aktif
  const [activeTab, setActiveTab] = useState('profile');

  // State Profil
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(null);
  const [profileError, setProfileError] = useState(null);

  // State Kata Sandi
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Data detail tambahan (SKP untuk Ahli K3, lisensi untuk Admin Sistem)
  const [meData, setMeData] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMe() {
      try {
        const { data } = await api.get('/auth/me');
        if (mounted && data?.user) {
          setMeData(data.user);
          setProfileForm({
            fullName: data.user.fullName || '',
            phone: data.user.phone || ''
          });
        }
      } catch {
        // Fallback ke data user di context
      }
    }
    fetchMe();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const { data } = await api.put('/auth/profile', {
        fullName: profileForm.fullName,
        phone: profileForm.phone
      });
      updateUser(data.user);
      setProfileSuccess('Profil berhasil diperbarui.');
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Gagal memperbarui profil. Silakan coba kembali.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { data } = await api.put('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess(data.message || 'Kata sandi berhasil diperbarui.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Gagal mengubah kata sandi. Periksa kata sandi saat ini.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleTabTitle = () => {
    switch (user?.role) {
      case 'ADMIN_SISTEM':
        return 'Sistem & PJK3';
      case 'AHLI_K3':
        return 'Kredensial Ahli K3';
      case 'ADMIN_KANTOR':
        return 'Operasional Kantor';
      case 'PIMPINAN':
        return 'Kebijakan & Approval';
      default:
        return 'Konfigurasi Peran';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'ADMIN_SISTEM':
        return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'ADMIN_KANTOR':
        return 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'AHLI_K3':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'PIMPINAN':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Halaman Pengaturan */}
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola profil akun, keamanan otentikasi, tampilan visual antarmuka, serta kredensial operasional di PT Upaya Riksa Daya."
      />

      {/* Navigasi Tab Pengaturan (Clean Border-Led Metis Style) */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <User size={16} weight={activeTab === 'profile' ? 'bold' : 'regular'} />
          <span>Profil Saya</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={16} weight={activeTab === 'security' ? 'bold' : 'regular'} />
          <span>Keamanan & Sandi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Palette size={16} weight={activeTab === 'appearance' ? 'bold' : 'regular'} />
          <span>Tampilan & Tema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('role_specific')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'role_specific'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sliders size={16} weight={activeTab === 'role_specific' ? 'bold' : 'regular'} />
          <span>{getRoleTabTitle()}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PROFIL SAYA                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
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

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Nama lengkap sesuai KTP / Lisensi K3"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Nama ini tercetak pada lembar Berita Acara, LHPP, dan catatan riksa uji resmi.
                  </p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alamat Email (Akun Utama)
                  </label>
                  <input
                    id="email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Alamat email terdaftar dikunci demi keamanan otentikasi. Hubungi Admin Sistem jika perlu perubahan.
                  </p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Contoh: 081234567890"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Nomor aktif untuk koordinasi penugasan lapangan dan komunikasi verifikasi klien.
                  </p>
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KEAMANAN & SANDI                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ganti Kata Sandi</CardTitle>
              <CardDescription>
                Pastikan akun terlindungi dengan kombinasi kata sandi kuat minimal 8 karakter
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccess && (
                <div className="mb-4">
                  <Notice variant="success">{passwordSuccess}</Notice>
                </div>
              )}
              {passwordError && (
                <div className="mb-4">
                  <Notice variant="error">{passwordError}</Notice>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Kata Sandi Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      placeholder="Masukkan kata sandi lama Anda"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showCurrentPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Minimal 8 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showNewPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Ulangi kata sandi baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showConfirmPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <Button type="submit" variant="primary" loading={passwordLoading}>
                    Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Standar Keamanan Sesi */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Keamanan Sesi & Kriptografi</CardTitle>
              <CardDescription>Standar proteksi akun PT Upaya Riksa Daya</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" weight="fill" />
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">Rotasi Token JWT Otomatis</p>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
                    Sesi dilindungi oleh token ganda dengan deteksi penggunaan ulang (*token replay detection*) dan tersimpan pada *cookie HttpOnly*.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <Key size={18} className="text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-200">Enkripsi Kata Sandi Bcrypt</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Setiap kata sandi diamankan dengan algoritma hashing bcrypt 10 rounds dan tidak pernah disimpan dalam bentuk teks biasa.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TAMPILAN & TEMA                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema Antarmuka Pengguna</CardTitle>
              <CardDescription>
                Pilih skema warna yang paling nyaman untuk visibilitas saat bekerja di kantor atau di lapangan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Mode Terang */}
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 ${
                    theme === 'light'
                      ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sun size={18} weight="bold" />
                    </span>
                    {theme === 'light' && (
                      <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check size={12} weight="bold" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mode Terang</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Permukaan bersih putih dan abu netral kontras tinggi
                    </p>
                  </div>
                </button>

                {/* Mode Gelap */}
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 ${
                    theme === 'dark'
                      ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                      <Moon size={18} weight="bold" />
                    </span>
                    {theme === 'dark' && (
                      <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check size={12} weight="bold" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Mode Gelap</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Latar gelap slate nyaman untuk pencahayaan rendah
                    </p>
                  </div>
                </button>

                {/* Ikuti Sistem */}
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between h-36 ${
                    theme === 'system'
                      ? 'border-brand-600 bg-brand-50/20 dark:bg-rose-950/20 ring-2 ring-brand-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center">
                      <Desktop size={18} weight="bold" />
                    </span>
                    {theme === 'system' && (
                      <span className="h-5 w-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                        <Check size={12} weight="bold" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Ikuti Sistem</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Menyesuaikan otomatis dengan preferensi OS perangkat Anda
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Standarisasi Format & Regional</CardTitle>
              <CardDescription>Format angka, tanggal, dan terminologi yang digunakan aplikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Format Tanggal</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">DD MMMM YYYY</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Contoh: 29 Oktober 2026</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mata Uang</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">Rupiah Indonesia (IDR)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Format: Rp 1.500.000</p>
                </div>
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Zona Waktu Operasional</span>
                  <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">Waktu Indonesia Barat (WIB)</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">UTC+07:00 (Jakarta)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SPESIFIK ROLE PENGGUNA (ROLE-TAILORED CONTENT)                      */}
      {/* ========================================================================= */}
      {activeTab === 'role_specific' && (
        <div className="space-y-6">
          {/* A. Role: ADMIN_SISTEM */}
          {user?.role === 'ADMIN_SISTEM' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Legalitas & Lisensi PJK3</CardTitle>
                  <CardDescription>Identitas perusahaan yang terdaftar di Kementerian Ketenagakerjaan RI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Nama Lembaga</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">PT Upaya Riksa Daya</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Jenis Layanan</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">PJK3 Bidang Riksa Uji K3</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Nomor SKP PJK3</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-rose-400">
                      560/URD/PJK3-RIKSALAP/2024
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Wilayah Kerja Operasional</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Seluruh Wilayah Republik Indonesia</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Integritas Sistem & Audit Trail</CardTitle>
                  <CardDescription>Status proteksi tabel dan keandalan data transaksi</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Status Trigger Audit Log</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={14} weight="fill" />
                      trg_audit_logs_immutable (Aktif)
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Database Engine</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">PostgreSQL Pool (Parameterized SQL)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Retensi Log Audit</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">365 Hari (Append-Only)</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* B. Role: AHLI_K3 */}
          {user?.role === 'AHLI_K3' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kredensial Penunjukan Ahli K3</CardTitle>
                  <CardDescription>Surat Keputusan Penunjukan (SKP) dan kompetensi riksa uji yang diampu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Nomor Pegawai / KTA</span>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                        {meData?.inspector?.employeeNo || 'URD-EXP-2024-001'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Otorisasi Form Pengujian</span>
                      <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                        <CheckCircle size={15} weight="fill" />
                        Diizinkan Entry Data & TTD BAP
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                      Bidang Kompetensi Riksa Uji Terdaftar:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {meData?.inspector?.competencies?.length > 0 ? (
                        meData.inspector.competencies.map((comp, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                          >
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {comp.categoryName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-0.5">
                              No. {comp.certificateNo}
                            </span>
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">
                              Berlaku s/d: {formatDate(comp.validUntil)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">Pesawat Angkat & Angkut (PAA)</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">Pesawat Tenaga & Produksi (PTP)</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                          </div>
                          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">Bejana Tekan & Tangki Timbun (PUBT)</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">SKP Ahli K3 Spesialis</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* C. Role: ADMIN_KANTOR */}
          {user?.role === 'ADMIN_KANTOR' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Standarisasi Dokumen & Registrasi</CardTitle>
                  <CardDescription>Format penomoran berkas resmi yang dihasilkan kantor</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Format Order PO</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">PO-URD-YYYY-XXXX</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Format Berita Acara (BAP)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">BAP-URD-YYYYMM-XXXX</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Format Dokumen LHPP</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">LHPP-URD-[KAT]-YYYY-XXXX</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Pengingat Masa Berlaku Suket</span>
                    <span className="font-bold text-brand-600 dark:text-rose-400">H-60 & H-30 Hari</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alur Pengiriman Laporan ke Klien</CardTitle>
                  <CardDescription>Status portal klien dan tracking pengiriman fisik</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Akses Portal Klien Mandiri</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Aktif (Via Token Aman)</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Verifikasi Barcode Suket</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Tersedia Publik</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Ekspedisi Resi Dokumen</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Pencatatan Manual & Otomatis</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* D. Role: PIMPINAN */}
          {user?.role === 'PIMPINAN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Otorisasi & Approval Gate</CardTitle>
                  <CardDescription>Hak persetujuan akhir laporan dan dokumen kepatuhan K3</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Persetujuan Laporan LHPP</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={14} weight="fill" />
                      Hak Otorisasi Final
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Pengembalian LHPP Revisi</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Didukung Catatan Koreksi</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Audit Rekapitulasi Riksa Uji</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Akses Eksekutif Nasional</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tanda Tangan Pengesahan Digital</CardTitle>
                  <CardDescription>Keabsahan hukum dokumen hasil pemeriksaan PT Upaya Riksa Daya</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Setiap dokumen LHPP yang disetujui Pimpinan secara otomatis dibubuhkan nomor unik terverifikasi, tanggal pengesahan, serta kode QR verifikasi publik yang sah di hadapan Pengawas Ketenagakerjaan (Disnaker).
                  </p>
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                    <span className="font-bold text-rose-900 dark:text-rose-300 block">Kepatuhan Regulasi K3</span>
                    <span className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5 block">
                      Mengacu pada Permenaker No. 08/2020 (PAA), Permenaker No. 38/2016 (PTP), dan Permenaker No. 37/2016 (PUBT).
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

