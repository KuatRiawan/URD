import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  LockSimple
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';
import logoUrd from '../../assets/logo-urd.png';
import k3LoginHero from '../../assets/k3-login-hero.jpg';
import { extractErrorMessage } from '../../lib/utils/format.js';

const DEFAULT_WIDE_TRANSFORM = 'translate3d(0%, 0%, 0) scale(1.02)';

const K3_VISUAL_SCOPES = [
  {
    id: 'crane',
    label: 'Crane & Hoist',
    transform: 'translate3d(-22%, 18%, 0) scale(1.85)'
  },
  {
    id: 'forklift',
    label: 'Forklift',
    transform: 'translate3d(12%, -14%, 0) scale(1.75)'
  },
  {
    id: 'pubt',
    label: 'Bejana & Instalasi',
    transform: 'translate3d(-58%, -14%, 0) scale(2.2)'
  }
];

const DESKTOP_IMAGE_FEATHER_STYLE = {
  WebkitMaskImage:
    'linear-gradient(to right, #000 0%, #000 50%, rgba(0,0,0,0.82) 64%, rgba(0,0,0,0.30) 80%, transparent 98%)',
  maskImage:
    'linear-gradient(to right, #000 0%, #000 50%, rgba(0,0,0,0.82) 64%, rgba(0,0,0,0.30) 80%, transparent 98%)'
};

const MOBILE_BANNER_FEATHER_STYLE = {
  WebkitMaskImage: 'linear-gradient(to bottom, #000 58%, transparent 100%)',
  maskImage: 'linear-gradient(to bottom, #000 58%, transparent 100%)'
};

function getUrdGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 4 && hour < 11) {
    return {
      title: 'Selamat pagi, warga URD!',
      message: 'Semoga harimu menyenangkan dan penuh semangat memulai aktivitas hari ini.'
    };
  }
  if (hour >= 11 && hour < 15) {
    return {
      title: 'Selamat siang, warga URD!',
      message: 'Semoga harimu menyenangkan dan tetap semangat menjaga kualitas kerja.'
    };
  }
  if (hour >= 15 && hour < 18) {
    return {
      title: 'Selamat sore, warga URD!',
      message: 'Semoga harimu menyenangkan dan setiap pekerjaan hari ini tuntas dengan baik.'
    };
  }
  return {
    title: 'Selamat malam, warga URD!',
    message: 'Semoga harimu menyenangkan, terima kasih atas dedikasi hebatmu hari ini.'
  };
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [activeScope, setActiveScope] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const greeting = getUrdGreeting();
  const currentScope = K3_VISUAL_SCOPES.find((scope) => scope.id === activeScope) || null;
  const activeTransform = currentScope ? currentScope.transform : DEFAULT_WIDE_TRANSFORM;

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
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col lg:flex-row bg-[#F4F5F8] dark:bg-[#0B0D12] text-[#1D1D1F] dark:text-[#F5F5F7] selection:bg-[#C81E1E] selection:text-white transition-colors">
      {/* Lapisan Foto Industri K3 Melebur Halus ke Area Formulir (Desktop) */}
      <div
        className="hidden lg:block absolute inset-y-0 left-0 lg:w-[76%] xl:w-[78%] pointer-events-none select-none overflow-hidden"
        style={DESKTOP_IMAGE_FEATHER_STYLE}
      >
        <img
          src={k3LoginHero}
          alt="Ilustrasi teknis Riksa Uji K3: Overhead Crane, Forklift Industri, dan Bejana Tekan"
          width="1440"
          height="1075"
          fetchPriority="high"
          style={{ transform: activeTransform, transformOrigin: '50% 50%' }}
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        />

        {/* Scrim Vertikal Halus untuk Kontras Teks Kiri */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,11,16,0.72)_0%,rgba(9,11,16,0.08)_38%,rgba(9,11,16,0.12)_58%,rgba(9,11,16,0.86)_100%)]"
        />

        {/* Gradasi Horizontal Pelebur ke Warna Kanvas Kanan */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-[#F4F5F8]/[0.25] to-[#F4F5F8] dark:via-[#0B0D12]/[0.35] dark:to-[#0B0D12]"
        />
      </div>

      {/* Cahaya Ambient Lembut di Belakang Kartu Login untuk Transisi Visual */}
      <div
        aria-hidden="true"
        className="hidden lg:block pointer-events-none absolute right-[8%] top-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-[#C81E1E]/[0.05] dark:bg-[#C81E1E]/[0.09] blur-[110px]"
      />

      {/* Konten Overlay Kiri Desktop (Tanpa Garis Pembatas Kaku) */}
      <aside className="hidden lg:flex relative z-10 lg:w-[54%] xl:w-[56%] flex-col justify-between p-10 xl:p-14 text-white">
        {/* Identitas Korporat Atas Kiri */}
        <div className="flex items-center gap-3.5">
          <span className="inline-flex h-11 shrink-0 items-center rounded-xl bg-white px-2.5 border border-black/10 shadow-[0_2px_12px_rgba(0,0,0,0.28)]">
            <img
              src={logoUrd}
              alt="Logo Resmi PT Upaya Riksa Daya"
              width="48"
              height="33"
              fetchPriority="high"
              className="h-7 w-auto object-contain"
            />
          </span>
          <div>
            <h1 className="text-[15px] font-bold tracking-[-0.018em] text-white leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
              PT Upaya Riksa Daya
            </h1>
            <p className="text-xs text-white/80 leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)]">
              PJK3 Pemeriksaan &amp; Pengujian Teknik
            </p>
          </div>
        </div>

        {/* Slogan Korporat & Selektor Close-Up di Bagian Bawah Kiri */}
        <div className="mt-auto max-w-[520px] space-y-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#FCA5A5] drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              Better Safety Partner.
            </p>
            <p className="text-3xl xl:text-[34px] font-extrabold tracking-[-0.025em] text-white leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
              Riksa Uji, URD Pasti!
            </p>
          </div>

          {/* Pemilih Fokus Kamera Close-Up Objek Uji */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5" role="group" aria-label="Pilih objek uji K3">
            {K3_VISUAL_SCOPES.map((scope) => {
              const selected = scope.id === activeScope;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setActiveScope((prev) => (prev === scope.id ? null : scope.id))}
                  aria-pressed={selected}
                  className={`min-h-[34px] px-3.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#C81E1E] border-[#C81E1E] text-white shadow-[0_4px_16px_rgba(200,30,30,0.45)]'
                      : 'bg-black/45 border-white/20 text-white/90 hover:bg-black/65 hover:border-white/35'
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          <p className="pt-2 text-xs text-white/70">
            &copy; {new Date().getFullYear()} PT Upaya Riksa Daya
          </p>
        </div>
      </aside>

      {/* Area Formulir Login yang Menyatu dengan Zona Transisi */}
      <main className="relative z-10 flex-1 flex flex-col justify-between min-h-screen">
        {/* Top Bar Mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 sm:px-6 pt-4">
          <span className="text-xs font-semibold tracking-[-0.01em] text-[#6E6E73] dark:text-[#98989D]">
            PJK3 Pemeriksaan &amp; Pengujian Teknik
          </span>
          <ThemeToggle />
        </header>

        {/* Top Bar Desktop Tanpa Garis Pembatas */}
        <div className="hidden lg:flex items-center justify-end px-10 pt-7">
          <ThemeToggle showLabel />
        </div>

        {/* Kartu Autentikasi Frosted-Glass */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-[410px] lg:mr-8 xl:mr-14 rounded-[26px] border border-white/80 dark:border-white/[0.10] bg-white/[0.82] dark:bg-[#141822]/[0.80] backdrop-blur-2xl shadow-[0_24px_70px_-16px_rgba(15,23,42,0.14),0_2px_10px_rgba(15,23,42,0.04),0_1px_0_0_rgba(255,255,255,0.85)_inset] dark:shadow-[0_24px_70px_-16px_rgba(0,0,0,0.65)] overflow-hidden urd-page-enter">
            {/* Banner Foto Industri Mobile yang Melebur Halus ke Kartu */}
            <div className="lg:hidden relative h-48 w-full overflow-hidden">
              <div className="h-full w-full" style={MOBILE_BANNER_FEATHER_STYLE}>
                <img
                  src={k3LoginHero}
                  alt=""
                  aria-hidden="true"
                  width="1440"
                  height="1075"
                  style={{ transform: activeTransform, transformOrigin: '50% 50%' }}
                  className="h-full w-full object-cover object-[42%_46%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                />
              </div>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white dark:to-[#141822]"
              />
            </div>

            <div className="px-6 pb-7 pt-2 sm:px-9 sm:pb-9 lg:pt-8">
              <div className="-mt-8 lg:mt-0 relative z-10 flex flex-col items-center text-center mb-6">
                <span className="inline-flex lg:hidden items-center justify-center px-3 py-2 rounded-2xl bg-white border border-black/[0.08] mb-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.10)]">
                  <img
                    src={logoUrd}
                    alt=""
                    aria-hidden="true"
                    width="112"
                    height="78"
                    fetchPriority="high"
                    className="h-10 sm:h-11 w-auto object-contain"
                  />
                </span>

                <h2 className="text-xl sm:text-[22px] font-bold tracking-[-0.022em] text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {greeting.title}
                </h2>

                <p className="mt-1.5 text-xs sm:text-[13px] text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
                  {greeting.message}
                </p>
                <span className="sr-only">Masuk ke Portal Resmi PT Upaya Riksa Daya</span>
              </div>

              {errorMsg && (
                <Notice
                  id="login-error"
                  tone="error"
                  className="mb-5"
                  role="alert"
                  aria-live="assertive"
                >
                  {String(errorMsg).replace(/[<>]/g, '')}
                </Notice>
              )}

              <form
                onSubmit={handleSubmit}
                noValidate
                aria-describedby={errorMsg ? 'login-error' : undefined}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5EA] mb-1.5"
                  >
                    Alamat Email Karyawan
                  </label>
                  <div className="relative flex items-center">
                    <EnvelopeSimple
                      size={17}
                      className="pointer-events-none absolute left-3.5 text-[#6E6E73] dark:text-[#98989D]"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@upayariksadaya.com"
                      className="w-full min-h-[44px] rounded-[11px] border border-black/[0.12] dark:border-white/[0.14] bg-white/90 dark:bg-[#1C212E]/90 pl-10 pr-3.5 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#71717A] dark:placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#C81E1E] focus:ring-3 focus:ring-[#C81E1E]/16 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#E5E5EA] mb-1.5"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative flex items-center">
                    <LockSimple
                      size={17}
                      className="pointer-events-none absolute left-3.5 text-[#6E6E73] dark:text-[#98989D]"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full min-h-[44px] rounded-[11px] border border-black/[0.12] dark:border-white/[0.14] bg-white/90 dark:bg-[#1C212E]/90 pl-10 pr-12 text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#71717A] dark:placeholder:text-[#8E8E93] focus:outline-hidden focus:border-[#C81E1E] focus:ring-3 focus:ring-[#C81E1E]/16 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-r-[11px] text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] hover:text-[#1D1D1F] dark:hover:text-white transition-colors cursor-pointer"
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
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-[11px] bg-[#C81E1E] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(200,30,30,0.28)] hover:bg-[#A61717] active:bg-[#8A1212] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <LockKey size={17} weight="bold" aria-hidden="true" />
                  <span>{submitting ? 'Memverifikasi...' : 'Masuk ke Sistem Internal'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Mobile */}
        <footer className="lg:hidden px-4 py-3 text-center text-xs text-[#6E6E73] dark:text-[#98989D]">
          &copy; {new Date().getFullYear()} PT Upaya Riksa Daya
        </footer>
      </main>
    </div>
  );
}
