import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Eye, EyeSlash, LockKey } from '@phosphor-icons/react';
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
    <div className="min-h-screen flex bg-canvas text-slate-900 dark:text-slate-100">
      {/* Panel merek (desktop) */}
      <aside className="hidden lg:flex lg:w-[46%] relative overflow-hidden flex-col justify-between bg-slate-950 p-12 text-white">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 15% 10%, rgba(200,30,30,0.35) 0%, transparent 70%), radial-gradient(50% 40% at 90% 95%, rgba(71,85,105,0.45) 0%, transparent 70%)'
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <span className="inline-flex h-12 items-center rounded-xl bg-white px-3 shadow-card">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="52"
              height="36"
              className="h-8 w-auto object-contain"
            />
          </span>
          <div>
            <p className="text-sm font-extrabold tracking-tight">PT Upaya Riksa Daya</p>
            <p className="text-xs text-slate-400">Perusahaan Jasa K3 Bidang Pemeriksaan dan Pengujian</p>
          </div>
        </div>

        <div className="relative max-w-md space-y-6">
          <p className="text-3xl font-extrabold leading-tight tracking-tight">
            Satu alur kerja dari Purchase Order hingga LHPP terbit.
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            {[
              'Input PO, klien, dan unit alat dalam satu form',
              'Penugasan Ahli K3 dan lembar kerja riksa uji digital',
              'BAP dan LHPP siap unduh, riwayat dan pengingat otomatis'
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} PT Upaya Riksa Daya · urd@upayariksadaya.com · (021) 489 1409
        </p>
      </aside>

      {/* Panel formulir */}
      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex items-center gap-3 lg:invisible">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="52"
              height="36"
              fetchPriority="high"
              className="h-8 w-auto object-contain"
            />
            <p className="text-sm font-extrabold tracking-tight">PT Upaya Riksa Daya</p>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-9 shadow-card">
            <div className="flex flex-col items-center text-center mb-7">
              <img
                src={logoUrd}
                alt="Logo Resmi PT Upaya Riksa Daya"
                width="140"
                height="98"
                fetchPriority="high"
                className="h-16 w-auto object-contain mb-4"
              />
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                PT Upaya Riksa Daya
              </h1>
              <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
                Masuk ke Sistem Operasional Pemeriksaan &amp; Pengujian K3
              </p>
            </div>

            {errorMsg && (
              <Notice tone="error" className="mb-5">
                {errorMsg}
              </Notice>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
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
                  className="w-full h-11 rounded-lg border px-3.5 text-sm"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
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
                    className="w-full h-11 rounded-lg border pl-3.5 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-1.5 h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
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
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-brand-700"
              >
                <LockKey size={18} weight="bold" aria-hidden="true" />
                <span>{submitting ? 'Memverifikasi Sesi...' : 'Masuk ke Sistem Internal'}</span>
              </button>
            </form>

            <p className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800 text-[11px] leading-relaxed text-center text-slate-500 dark:text-slate-400">
              Sistem ini terbatas untuk personel resmi PT Upaya Riksa Daya. Hubungi Administrator
              Sistem apabila Anda memerlukan bantuan akses akun.
            </p>
          </div>
        </div>

        <footer className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} PT Upaya Riksa Daya · urd@upayariksadaya.com · (021) 489 1409
        </footer>
      </main>
    </div>
  );
}
