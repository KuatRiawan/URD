import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import {
  CheckCircle,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-[#C81E1E] selection:text-white">
      {/* Panel Merek & Identitas Perusahaan (Tampil di Desktop) */}
      <aside className="hidden lg:flex lg:w-[48%] xl:w-[45%] relative overflow-hidden flex-col justify-between bg-slate-950 p-12 text-white">
        {/* Dekorasi Latar Belakang Gradien Halus */}
        <div
          className="absolute inset-0 opacity-70 pointer-events-none"
          style={{
            background:
              'radial-gradient(55% 50% at 20% 15%, rgba(200,30,30,0.4) 0%, transparent 75%), radial-gradient(50% 50% at 85% 85%, rgba(30,41,59,0.7) 0%, transparent 80%)'
          }}
          aria-hidden="true"
        />

        {/* Header Panel Kiri */}
        <div className="relative z-10 flex items-center gap-3.5">
          <span className="inline-flex h-12 items-center rounded-xl bg-white px-3 shadow-md">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="52"
              height="36"
              className="h-8 w-auto object-contain"
            />
          </span>
          <div>
            <p className="text-base font-extrabold tracking-tight">PT Upaya Riksa Daya</p>
            <p className="text-xs text-slate-400">PJK3 Bidang Pemeriksaan dan Pengujian Teknik</p>
          </div>
        </div>

        {/* Tagline Utama & Nilai Layanan */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wide uppercase">
            <ShieldCheck size={16} weight="bold" />
            <span>Better safety partner</span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black leading-tight tracking-tight text-white">
            Riksa Uji, <span className="text-[#C81E1E]">URD pasti!</span>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Sistem Informasi Terpadu Pelaksanaan Riksa Uji K3, Verifikasi Parameter Alat, Penerbitan Dokumen Berita Acara (BAP), dan Sertifikasi LHPP Resmi.
          </p>

          <div className="pt-2 space-y-3.5 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-400 inline-flex items-center justify-center shrink-0">
                <CheckCircle size={15} weight="bold" />
              </span>
              <span>Layanan Riksa Uji PAA, PUBT, Listrik, Petir, dan Elevator</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-400 inline-flex items-center justify-center shrink-0">
                <CheckCircle size={15} weight="bold" />
              </span>
              <span>Integrasi Lembar Kerja Digital &amp; Tanda Tangan Lapangan Ahli K3</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 rounded-full bg-rose-500/20 text-rose-400 inline-flex items-center justify-center shrink-0">
                <CheckCircle size={15} weight="bold" />
              </span>
              <span>Penerbitan Dokumen Resmi Cepat, Akurat, dan Terpercaya</span>
            </div>
          </div>
        </div>

        {/* Footer Panel Kiri */}
        <p className="relative z-10 text-xs text-slate-500">
          (C) {new Date().getFullYear()} PT Upaya Riksa Daya · urd@upayariksadaya.com · (021) 489 1409
        </p>
      </aside>

      {/* Panel Formulir Login (Responsif Mobile & Desktop) */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar Mobile & Pengatur Tema */}
        <header className="flex items-center justify-between border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="inline-flex h-9 items-center rounded-lg bg-white p-1.5 shadow-2xs border border-slate-200">
              <img
                src={logoUrd}
                alt="Logo PT Upaya Riksa Daya"
                width="36"
                height="24"
                fetchPriority="high"
                className="h-6 w-auto object-contain"
              />
            </span>
            <div>
              <p className="text-xs font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                PT Upaya Riksa Daya
              </p>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                Better safety partner
              </p>
            </div>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Konten Utama Form Login */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-9 shadow-sm">
            {/* Header Form & Identitas */}
            <div className="flex flex-col items-center text-center mb-6">
              <span className="inline-flex items-center justify-center p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 mb-3.5 shadow-2xs">
                <img
                  src={logoUrd}
                  alt="Logo Resmi PT Upaya Riksa Daya"
                  width="130"
                  height="90"
                  fetchPriority="high"
                  className="h-12 sm:h-14 w-auto object-contain"
                />
              </span>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold tracking-wide uppercase mb-2">
                <ShieldCheck size={14} weight="bold" />
                <span>Better safety partner</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                PT Upaya Riksa Daya
              </h1>

              <p className="mt-1 text-sm font-extrabold text-[#C81E1E] dark:text-rose-400">
                Riksa Uji, URD pasti!
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
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
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
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
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#C81E1E] focus:ring-2 focus:ring-[#C81E1E]/20 transition-all"
                />
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5"
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
                    className="w-full min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-3.5 pr-12 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#C81E1E] focus:ring-2 focus:ring-[#C81E1E]/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
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
                className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#C81E1E] px-4 text-sm font-bold text-white shadow-xs hover:bg-[#a61717] active:bg-[#851212] transition-all disabled:opacity-50 cursor-pointer"
              >
                <LockKey size={18} weight="bold" aria-hidden="true" />
                <span>{submitting ? 'Memverifikasi Sesi...' : 'Masuk ke Sistem Internal'}</span>
              </button>
            </form>

            <p className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-[11px] leading-relaxed text-center text-slate-500 dark:text-slate-400">
              Sistem ini terbatas untuk personel resmi PT Upaya Riksa Daya. Hubungi Administrator Sistem apabila Anda memerlukan bantuan akses akun.
            </p>
          </div>
        </div>

        {/* Footer Mobile */}
        <footer className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
          (C) {new Date().getFullYear()} PT Upaya Riksa Daya · urd@upayariksadaya.com · (021) 489 1409
        </footer>
      </main>
    </div>
  );
}
