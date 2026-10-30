import { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Palette,
  Sliders
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useTheme } from '../../app/providers/ThemeProvider.jsx';
import { api } from '../../lib/api/axios.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { ProfileTab } from './components/ProfileTab.jsx';
import { SecurityTab } from './components/SecurityTab.jsx';
import { AppearanceTab } from './components/AppearanceTab.jsx';
import { RoleSettingsTab } from './components/RoleSettingsTab.jsx';

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
      <PageHeader
        title="Pengaturan"
        subtitle="Kelola profil akun, keamanan otentikasi, tampilan visual antarmuka, serta kredensial operasional di PT Upaya Riksa Daya."
      />

      {/* Navigasi Tab Pengaturan */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck size={16} weight={activeTab === 'security' ? 'bold' : 'regular'} />
          <span>Keamanan &amp; Sandi</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'appearance'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Palette size={16} weight={activeTab === 'appearance' ? 'bold' : 'regular'} />
          <span>Tampilan &amp; Tema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('role_specific')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'role_specific'
              ? 'border-brand-600 text-brand-600 dark:border-rose-500 dark:text-rose-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <Sliders size={16} weight={activeTab === 'role_specific' ? 'bold' : 'regular'} />
          <span>{getRoleTabTitle()}</span>
        </button>
      </div>

      {activeTab === 'profile' && (
        <ProfileTab
          user={user}
          meData={meData}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          profileLoading={profileLoading}
          profileSuccess={profileSuccess}
          profileError={profileError}
          onUpdateProfile={handleUpdateProfile}
          getRoleBadgeColor={getRoleBadgeColor}
        />
      )}

      {activeTab === 'security' && (
        <SecurityTab
          passwordForm={passwordForm}
          setPasswordForm={setPasswordForm}
          passwordLoading={passwordLoading}
          passwordSuccess={passwordSuccess}
          passwordError={passwordError}
          onChangePassword={handleChangePassword}
        />
      )}

      {activeTab === 'appearance' && (
        <AppearanceTab theme={theme} setTheme={setTheme} />
      )}

      {activeTab === 'role_specific' && (
        <RoleSettingsTab user={user} meData={meData} />
      )}
    </div>
  );
}
