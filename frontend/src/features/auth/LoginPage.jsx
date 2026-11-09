import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import {
  Eye,
  EyeSlash,
  LockKey
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import logoUrd from '../../assets/logo-urd.png';
import { extractErrorMessage } from '../../lib/utils/format.js';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg('Masukkan alamat email kerja yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      await login(cleanEmail, password);
      const target = location.state?.from?.pathname || '/app/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setErrorMsg(
        extractErrorMessage(err, 'Email atau kata sandi tidak sesuai. Silakan periksa kembali.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F5F7] dark:bg-[#0B0D11] text-[#1D1D1F] dark:text-[#F5F5F7] selection:bg-[#C81E1E] selection:text-white transition-colors">
      {/* Panel Merek & Identitas Perusahaan (Desktop - Apple-Inspired Light Enterprise Surface) */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[44%] relative overflow-hidden flex-col justify-between bg-white dark:bg-[#151821] border-r border-black/[0.06] dark:border-white/[0.07] p-12">
        {/* Aksen Halus Identitas URD */}
        <div
          className="absolute inset-0 pointer-events-none opacity-80 dark:opacity-35"
          style={{
            background:
              'radial-gradient(60% 50% at 12% 10%, rgba(200,30,30,0.07) 0%, transparent 75%), radial-gradient(50% 50% at 88% 90%, rgba(0,0,0,0.03) 0%, transparent 80%)'
          }}
          aria-hidden="true"
        />

        {/* Header Panel Kiri: Logo Resmi PT Upaya Riksa Daya */}
        <div className="relative z-10 flex items-center gap-3.5">
          <span className="inline-flex h-12 items-center rounded-2xl bg-white px-3 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="52"
              height="36"
              className="h-8 w-auto object-contain"
            />
          </span>
          <div>
            <p className="text-[15px] font-bold tracking-[-0.018em] text-[#1D1D1F] dark:text-[#F5F5F7]">
              PT Upaya Riksa Daya
            </p>
            <p className="text-xs text-[#6E6E73] dark:text-[#98989D]">
              PJK3 Bidang Pemeriksaan dan Pengujian Teknik
            </p>
          </div>
        </div>

        {/* Identitas Portal */}
        <div className="relative z-10 max-w-md my-auto py-8 space-y-3">
          <p className="text-xs font-semibold text-[#C81E1E] dark:text-rose-400">
            Sistem Operasional Riksa Uji K3
          </p>
          <h2 className="text-3xl xl:text-[32px] font-bold leading-[1.18] tracking-[-0.025em] text-[#1D1D1F] dark:text-[#F5F5F7]">
            Pemeriksaan, Pengujian, dan Dokumentasi K3.
          </h2>
        </div>

        {/* Footer Panel Kiri */}
        <p className="relative z-10 text-xs text-[#86868B] dark:text-[#8E8E93]">
          &copy; {new Date().getFullYear()} PT Upaya Riksa Daya
        </p>
      </aside>

      {/* Panel Formulir Login (Responsif Mobile & Desktop) */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar Mobile & Pengatur Tema */}
        <header className="flex items-center justify-between urd-glass-toolbar px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex h-9 items-center rounded-xl bg-white p-1.5 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <img
                src={logoUrd}
                alt="Logo PT Upaya Riksa Daya"
                width="36"
                height="24"
                fetchPriority="high"
                className="h-5 w-auto object-contain"
              />
            </span>
            <p className="text-xs font-bold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
              PT Upaya Riksa Daya
            </p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Konten Utama Form Login */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[420px] rounded-[24px] border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-6 sm:p-9 shadow-[0_4px_24px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.03)]">
            {/* Header Form & Identitas Resmi */}
            <div className="flex flex-col items-center text-center mb-6">
              <span className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-2xl bg-white border border-black/[0.08] mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <img
                  src={logoUrd}
                  alt="Logo Resmi PT Upaya Riksa Daya"
                  width="124"
                  height="86"
                  fetchPriority="high"
                  className="h-11 sm:h-12 w-auto object-contain"
                />
              </span>

              <h1 className="text-xl sm:text-[22px] font-bold tracking-[-0.022em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                PT Upaya Riksa Daya
              </h1>

              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#98989D]">
                Masuk ke Portal Resmi PT Upaya Riksa Daya
              </p>
            </div>

            {errorMsg && (
              <Notice tone="error" className="mb-5">
                {errorMsg}
              </Notice>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5EA] mb-1.5"
                >
                  Alamat Email Karyawan
                </label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@upayariksadaya.com"
                  className="w-full min-h-[44px] rounded-[11px] border border-black/[0.14] dark:border-white/[0.14] bg-white dark:bg-[#1E222D] px-3.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#C81E1E] focus:ring-3 focus:ring-[#C81E1E]/16 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5EA] mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full min-h-[44px] rounded-[11px] border border-black/[0.14] dark:border-white/[0.14] bg-white dark:bg-[#1E222D] pl-3.5 pr-12 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:border-[#C81E1E] focus:ring-3 focus:ring-[#C81E1E]/16 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeSlash size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-[11px] bg-[#C81E1E] px-4 text-sm font-semibold text-white shadow-[0_2px_6px_rgba(200,30,30,0.25)] hover:bg-[#A61717] active:bg-[#8A1212] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
              >
                <LockKey size={18} weight="bold" aria-hidden="true" />
                <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Sistem Internal'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Mobile */}
        <footer className="lg:hidden border-t border-black/[0.06] dark:border-white/[0.07] bg-white/80 dark:bg-[#151821]/80 px-4 py-3 text-center text-xs text-[#6E6E73] dark:text-[#98989D]">
          &copy; {new Date().getFullYear()} PT Upaya Riksa Daya
        </footer>
      </main>
    </div>
  );
}
