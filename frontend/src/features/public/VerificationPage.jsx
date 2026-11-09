import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  Buildings,
  Wrench,
  CalendarBlank,
  FileText,
  UserCheck,
  QrCode,
  ArrowLeft
} from '@phosphor-icons/react';
import { api } from '../../lib/api/axios.js';
import { formatDate } from '../../lib/utils/format.js';
import { Badge } from '../../components/ui/Badge.jsx';
import logoUrd from '../../assets/logo-urd.png';

export function VerificationPage() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/verify/${encodeURIComponent(code || '')}`)
      .then((res) => {
        if (!active) return;
        setData(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || 'Dokumen atau kode verifikasi tidak ditemukan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [code]);

  const isLayak =
    data?.resultStatus === 'LAYAK' ||
    data?.resultStatus === 'LAYAK_DENGAN_CATATAN' ||
    data?.status === 'APPROVED' ||
    data?.status === 'DELIVERED' ||
    data?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0D11] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-between p-4 sm:p-8">
      {/* Header Brand */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-xl bg-white p-2 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <img
              src={logoUrd}
              alt="Logo PT Upaya Riksa Daya"
              className="h-7 w-auto object-contain"
            />
          </span>
          <div>
            <h1 className="text-sm font-bold tracking-[-0.015em] text-[#1D1D1F] dark:text-[#F5F5F7]">
              PT Upaya Riksa Daya
            </h1>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-medium">
              Portal Verifikasi Keaslian Dokumen Riksa Uji K3
            </p>
          </div>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Portal Internal</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto my-8">
        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-4px_rgba(0,0,0,0.04)]">
            <div className="h-9 w-9 mx-auto rounded-full border-2 border-black/[0.08] dark:border-white/[0.10] border-t-[#C81E1E] animate-spin" />
            <p className="mt-4 text-sm font-medium text-[#6E6E73] dark:text-[#98989D]">
              Memverifikasi keaslian dokumen di basis data resmi...
            </p>
          </div>
        ) : error || !data?.verified ? (
          <div className="rounded-2xl border border-[#C81E1E]/25 bg-white dark:bg-[#151821] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-4px_rgba(0,0,0,0.04)]">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center">
              <XCircle size={32} weight="fill" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.02em]">
              Dokumen Tidak Terverifikasi
            </h2>
            <p className="mt-1.5 text-xs text-[#6E6E73] dark:text-[#98989D] max-w-md mx-auto leading-relaxed">
              {error || 'Kode verifikasi tidak ditemukan dalam registri resmi PT Upaya Riksa Daya.'}
            </p>
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.06] dark:border-white/[0.08] text-xs font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">
              <QrCode size={15} />
              <span>Kode: {code}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_40px_-8px_rgba(0,0,0,0.06)]">
            {/* Banner Status Valid */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 px-6 py-5 flex items-center justify-between border-b border-emerald-500/20">
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <CheckCircle size={26} weight="fill" />
                </div>
                <div>
                  <span className="inline-block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    Dokumen Resmi Terverifikasi
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.015em]">
                    {data.documentLabel}
                  </h2>
                </div>
              </div>
              <ShieldCheck size={32} weight="duotone" className="text-emerald-600/40 hidden sm:block" />
            </div>

            {/* Body Detail */}
            <div className="p-6 space-y-6">
              {/* Nomor Dokumen & Kode Verifikasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.05] dark:border-white/[0.06]">
                <div>
                  <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] block">
                    Nomor Dokumen Resmi
                  </span>
                  <span className="text-base font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] mt-0.5 block">
                    {data.documentNo}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] block mb-1">
                    Status Kelayakan / Dokumen
                  </span>
                  <Badge tone={isLayak ? 'success' : 'warning'} size="md">
                    {data.resultStatus || data.status}
                  </Badge>
                </div>
              </div>

              {/* Grid Informasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821]">
                  <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#98989D] text-xs font-medium">
                    <Buildings size={15} className="text-[#C81E1E]" />
                    <span>Perusahaan Pemilik / Klien</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {data.client?.name || '-'}
                  </p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                    No. PO: {data.orderNo || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821]">
                  <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#98989D] text-xs font-medium">
                    <Wrench size={15} className="text-[#C81E1E]" />
                    <span>Identitas Objek / Peralatan K3</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {data.equipment?.name || '-'}
                  </p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5 font-mono">
                    {data.equipment?.subBidang || data.equipment?.bidang || '-'} • SN: {data.equipment?.serialNo || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821]">
                  <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#98989D] text-xs font-medium">
                    <UserCheck size={15} className="text-[#C81E1E]" />
                    <span>Ahli K3 Pemeriksa & Penguji</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    {data.inspector?.name || '-'}
                  </p>
                  <p className="text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5 font-mono">
                    No. SKP: {data.inspector?.skpNumber || '-'}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821]">
                  <div className="flex items-center gap-2 text-[#6E6E73] dark:text-[#98989D] text-xs font-medium">
                    <CalendarBlank size={15} className="text-[#C81E1E]" />
                    <span>Tanggal Pemeriksaan & Masa Berlaku</span>
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                    Diuji: {formatDate(data.dates?.examinationDate)}
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                    Berlaku s/d: {formatDate(data.dates?.validUntil || data.dates?.nextInspectionDate)}
                  </p>
                </div>
              </div>

              {/* Tanda Tangan Digital Info */}
              {data.signatures && (
                <div className="p-4 rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.05] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                    <FileText size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Status Pengesahan Tanda Tangan Digital:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        data.signatures.inspectorSigned
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73]'
                      }`}
                    >
                      Ahli K3: {data.signatures.inspectorSigned ? 'Tertanda' : 'Belum'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg font-semibold ${
                        data.signatures.clientSigned
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73]'
                      }`}
                    >
                      PIC Klien ({data.signatures.clientPicName || '-'}):{' '}
                      {data.signatures.clientSigned ? 'Tertanda' : 'Belum'}
                    </span>
                  </div>
                </div>
              )}

              {/* Footer Verifikasi */}
              <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                <span>Diterbitkan oleh: {data.issuer || 'PT Upaya Riksa Daya'}</span>
                <span className="font-mono">Kode Autentikasi: {data.verificationCode}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-2xl w-full mx-auto text-center text-[11px] text-[#6E6E73] dark:text-[#98989D] py-4 border-t border-black/[0.06] dark:border-white/[0.08]">
        &copy; {new Date().getFullYear()} PT Upaya Riksa Daya · PJK3 Riksa Uji K3
      </footer>
    </div>
  );
}
