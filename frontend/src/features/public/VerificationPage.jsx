import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  CheckCircle,
  ShieldCheck,
  WarningCircle,
  ArrowLeft
} from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { api } from '../../lib/api/axios.js';
import { formatDate } from '../../lib/utils/format.js';
import { LoadingState } from '../../components/feedback/StateViews.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

export function VerificationPage() {
  const { code } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchVerification = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/verify/${code}`);
        if (active) setData(res.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              'Dokumen tidak ditemukan atau belum resmi diterbitkan oleh PT Upaya Riksa Daya.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (code) {
      fetchVerification();
    } else {
      setLoading(false);
      setError('Kode verifikasi tidak dicantumkan.');
    }

    return () => {
      active = false;
    };
  }, [code]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              width="48"
              height="34"
              className="h-8 w-auto object-contain"
            />
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                PT Upaya Riksa Daya
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verifikasi Keaslian Dokumen Resmi K3
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C81E1E] hover:underline"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Login Sistem</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center">
            <LoadingState label="Memvalidasi sidik jari digital dokumen..." />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 p-7 sm:p-9 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-xs text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <WarningCircle size={32} weight="fill" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Dokumen Tidak Valid / Tidak Ditemukan
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                Kode: {code || '-'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs overflow-hidden">
            <div className="bg-emerald-600 px-6 py-5 text-white flex items-center gap-3">
              <ShieldCheck size={32} weight="fill" className="shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                  Sertifikat Keaslian Dokumen
                </p>
                <h1 className="text-base font-extrabold leading-tight">
                  Dokumen Resmi Terverifikasi
                </h1>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5 text-xs">
              <div className="space-y-1 pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Jenis Dokumen
                </span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  {data.documentTitle}
                </p>
                <p className="font-mono text-xs font-bold text-[#C81E1E]">
                  Nomor: {data.documentNo}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Perusahaan Klien</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{data.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Unit Objek K3</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{data.unit?.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">SN: {data.unit?.serialNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Tanggal Penerbitan / Final</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDate(data.publishedAt || data.finalizedAt || data.inspectionDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold mb-0.5">Penerbit Dokumen</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.issuer}</span>
                </div>
              </div>

              {data.documentHash && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-400 block font-semibold mb-1">
                    Sidik Jari Digital (SHA-256 Document Hash)
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-[11px] break-all text-slate-700 dark:text-slate-300">
                    {data.documentHash}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hash ini menjamin dokumen PDF asli tidak pernah mengalami modifikasi sejak disahkan.
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle size={18} weight="fill" className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Dokumen ini sah dikeluarkan oleh <strong>PT Upaya Riksa Daya</strong> sesuai ketentuan norma Keselamatan dan Kesehatan Kerja (K3).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} PT Upaya Riksa Daya · urd@upayariksadaya.com · (021) 489 1409
      </footer>
    </div>
  );
}
