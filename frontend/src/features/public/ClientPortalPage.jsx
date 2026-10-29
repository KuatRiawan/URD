import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  FilePdf,
  ShieldCheck,
  WarningCircle
} from '@phosphor-icons/react';
import logoUrd from '../../assets/logo-urd.png';
import { api } from '../../lib/api/axios.js';
import { formatDate, ORDER_STATUS_LABELS, SERVICE_TYPE_LABELS } from '../../lib/utils/format.js';
import { LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { ThemeToggle } from '../../components/ui/ThemeToggle.jsx';

export function ClientPortalPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchPortal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/portal/access/${token}`);
        if (active) setData(res.data);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              'Tautan portal klien tidak valid atau masa berlakunya telah berakhir.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    if (token) {
      fetchPortal();
    } else {
      setLoading(false);
      setError('Token portal tidak dicantumkan.');
    }

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
                Portal Akses Informasi & Dokumen Riksa Uji K3 Klien
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
              <span>Login Staf</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center my-12">
            <LoadingState label="Memuat data riksa uji dan dokumen klien..." />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-slate-900 p-7 sm:p-9 rounded-2xl border border-red-200 dark:border-red-900/50 shadow-xs text-center space-y-4 max-w-md mx-auto my-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <WarningCircle size={32} weight="fill" />
            </div>
            <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Akses Portal Tidak Tersedia
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {error}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Profil Klien */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full mb-2">
                  <ShieldCheck size={14} weight="fill" />
                  <span>Portal Akses Resmi Terverifikasi</span>
                </span>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{data.client.name}</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.client.address || 'Alamat operasional klien'} · Kontak: {data.client.phone || data.client.email || '-'}
                </p>
              </div>
              <div className="text-left md:text-right text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{data.token.label || 'Tautan Akses Klien'}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {data.token.expiresAt
                    ? `Berlaku hingga: ${formatDate(data.token.expiresAt)}`
                    : 'Akses Aktif'}
                </p>
              </div>
            </div>

            {/* Rekap Dokumen & Order Pemeriksaan K3 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    Daftar Order Riksa Uji & Unit Alat ({data.orders.length} Order)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pantau status riksa uji lapangan dan unduh BAP serta LHPP resmi yang telah disahkan
                  </p>
                </div>
              </div>

              {data.orders.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada riwayat order riksa uji pada portal ini.
                </div>
              ) : (
                <div className="space-y-4">
                  {data.orders.map((ord) => (
                    <div key={ord.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                              {ord.po_number || ord.order_no}
                            </span>
                            <Badge tone="neutral">
                              {ORDER_STATUS_LABELS[ord.status] || ord.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Layanan: {SERVICE_TYPE_LABELS[ord.service_type] || ord.service_type} · Lokasi: {ord.location_name || 'Utama'} {ord.location_city ? `(${ord.location_city})` : ''} · Tanggal PO: {formatDate(ord.po_date || ord.created_at)}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 font-semibold">
                              <th className="py-2.5 px-4">Nama Unit & Bidang K3</th>
                              <th className="py-2.5 px-4">Nomor Seri</th>
                              <th className="py-2.5 px-4">Status Pengujian</th>
                              <th className="py-2.5 px-4">Kesimpulan</th>
                              <th className="py-2.5 px-4 text-right">Dokumen Resmi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(ord.objects || []).map((u, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{u.name}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {u.categoryCode} ({u.categoryName})
                                  </div>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                                  {u.serialNumber}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    {u.unitStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                  {u.conclusion || '-'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                                    {u.bapVerificationCode && (
                                      <Link
                                        to={`/verifikasi/${u.bapVerificationCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C81E1E] text-white font-bold hover:bg-red-800"
                                      >
                                        <FilePdf size={13} weight="bold" />
                                        <span>BAP</span>
                                      </Link>
                                    )}
                                    {u.lhppVerificationCode && (
                                      <Link
                                        to={`/verifikasi/${u.lhppVerificationCode}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 dark:bg-slate-600 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-500"
                                      >
                                        <ShieldCheck size={13} weight="bold" />
                                        <span>LHPP</span>
                                      </Link>
                                    )}
                                    {!u.bapVerificationCode && !u.lhppVerificationCode && (
                                      <span className="text-slate-400 text-[11px] italic">Dalam proses</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} PT Upaya Riksa Daya · Kontak Layanan K3: (021) 489 1409 · urd@upayariksadaya.com
      </footer>
    </div>
  );
}

