import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import {
  Buildings,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  FilePdf,
  ShieldCheck,
  Wrench,
  WarningCircle,
  CalendarBlank,
  ArrowLeft
} from '@phosphor-icons/react';
import { api } from '../../lib/api/axios.js';
import { formatDate } from '../../lib/utils/format.js';
import { TableWrapper } from '../../components/ui/TableWrapper.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import logoUrd from '../../assets/logo-urd.png';

const STATUS_BADGE = {
  COMPLETED: { label: 'Selesai', tone: 'success' },
  APPROVED: { label: 'Disetujui', tone: 'success' },
  DELIVERED: { label: 'Diserahkan', tone: 'success' },
  IN_PROGRESS: { label: 'Sedang Diuji', tone: 'warning', pulse: true },
  SCHEDULED: { label: 'Terjadwal', tone: 'info' },
  PENDING: { label: 'Menunggu Jadwal', tone: 'neutral' }
};

export function ClientPortalPage() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('ALL');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api
      .get(`/public/portal/${encodeURIComponent(token || '')}`)
      .then((res) => {
        if (!active) return;
        setData(res.data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || 'Tautan Portal Klien tidak valid atau telah kedaluwarsa.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

  const filteredUnits =
    selectedOrderId === 'ALL'
      ? data?.units || []
      : (data?.units || []).filter((u) => u.orderId === selectedOrderId);

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#0B0D11] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="urd-glass-toolbar sticky top-0 z-20 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-xl bg-white p-1.5 border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <img
                src={logoUrd}
                alt="Logo PT Upaya Riksa Daya"
                className="h-6 w-auto object-contain"
              />
            </span>
            <div>
              <h1 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.015em]">
                Portal Klien · PT Upaya Riksa Daya
              </h1>
            </div>
          </div>

          {data?.client && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck size={16} weight="fill" />
              <span>Akses Terautentikasi: {data.client.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 flex-1 space-y-6">
        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="h-9 w-9 mx-auto rounded-full border-2 border-black/[0.08] dark:border-white/[0.10] border-t-[#C81E1E] animate-spin" />
            <p className="mt-3 text-sm font-medium text-[#6E6E73] dark:text-[#98989D]">
              Memuat data kontrak dan dokumen pemeriksaan...
            </p>
          </div>
        ) : error ? (
          <div className="max-w-lg mx-auto my-12 rounded-2xl border border-[#C81E1E]/25 bg-white dark:bg-[#151821] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center">
              <WarningCircle size={28} weight="fill" />
            </div>
            <h2 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Akses Portal Klien Tidak Valid
            </h2>
            <p className="mt-1.5 text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">{error}</p>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#1D1D1F] text-white text-xs font-semibold hover:bg-black/85 transition-colors"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>Ke Halaman Login Internal</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Banner Perusahaan Klien */}
            <div className="rounded-2xl bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C81E1E] dark:text-rose-400">
                    <Buildings size={14} weight="bold" />
                    <span>Dasbor Klien Resmi</span>
                  </span>
                  <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.022em]">
                    {data.client?.name}
                  </h2>
                  <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#98989D]">
                    {data.client?.address || 'Alamat terdaftar'} • {data.client?.city || 'Indonesia'}
                  </p>
                </div>

                {/* KPI Ringkas */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.05] dark:border-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] block">Total PO</span>
                    <span className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">{data.summary?.totalOrders || 0}</span>
                  </div>
                  <div className="rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.05] dark:border-white/[0.06] px-3.5 py-2.5">
                    <span className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D] block">Total Alat</span>
                    <span className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">{data.summary?.totalUnits || 0}</span>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5">
                    <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block">BAP Selesai</span>
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">{data.summary?.bapReadyCount || 0}</span>
                  </div>
                  <div className="rounded-xl bg-[#C81E1E]/10 border border-[#C81E1E]/20 px-3.5 py-2.5">
                    <span className="text-[11px] font-medium text-[#C81E1E] dark:text-rose-300 block">LHPP Terbit</span>
                    <span className="text-lg font-bold text-[#C81E1E] dark:text-rose-300 tabular-nums">{data.summary?.lhppApprovedCount || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Kontrak / PO */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Daftar Unit &amp; Dokumen Pemeriksaan
              </h3>

              <div className="flex items-center gap-2">
                <label htmlFor="portal-po-filter" className="text-xs font-medium text-[#6E6E73] dark:text-[#98989D]">
                  Kontrak PO:
                </label>
                <select
                  id="portal-po-filter"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-[#151821] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]"
                >
                  <option value="ALL">Semua PO ({data.orders?.length || 0})</option>
                  {(data.orders || []).map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.poNumber || ord.orderNo} ({ord.progressPct}% Selesai)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabel Unit & Unduh Dokumen */}
            <TableWrapper>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th>Objek / Peralatan K3</th>
                    <th>Kontrak PO</th>
                    <th>Jadwal & Ahli K3</th>
                    <th>Status Uji</th>
                    <th>Masa Berlaku</th>
                    <th className="text-right">Dokumen Resmi (PDF)</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#6E6E73] dark:text-[#98989D]">
                        Belum ada unit peralatan pada kontrak ini.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit) => {
                      const badge = STATUS_BADGE[unit.status] || STATUS_BADGE.PENDING;
                      const bapDownloadUrl = unit.bap?.id
                        ? `${apiBase}/public/portal/${encodeURIComponent(token)}/bap/${unit.bap.id}/pdf`
                        : null;
                      const lhppDownloadUrl =
                        unit.lhpp?.id && ['APPROVED', 'DELIVERED'].includes(unit.lhpp.status)
                          ? `${apiBase}/public/portal/${encodeURIComponent(token)}/lhpp/${unit.lhpp.id}/pdf`
                          : null;

                      return (
                        <tr key={unit.orderUnitId}>
                          <td>
                            <div className="flex items-start gap-2.5">
                              <Wrench size={16} className="text-[#C81E1E] mt-0.5 shrink-0" />
                              <div>
                                <p className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{unit.objectName}</p>
                                <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
                                  {unit.subBidang || unit.bidang} • SN: {unit.serialNo || '-'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                              {unit.poNumber || unit.orderNo}
                            </span>
                            {unit.locationText && (
                              <span className="block text-[11px] text-[#6E6E73] dark:text-[#98989D] truncate max-w-[180px]">
                                {unit.locationText}
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-1 text-[#1D1D1F] dark:text-[#F5F5F7] font-medium">
                              <CalendarBlank size={13} className="text-[#6E6E73]" />
                              <span>{formatDate(unit.scheduledStart)}</span>
                            </div>
                            <span className="block text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                              {unit.inspectorName || 'Menunggu Penugasan'}
                            </span>
                          </td>
                          <td>
                            <Badge tone={badge.tone} size="sm" pulse={badge.pulse}>
                              {badge.label}
                            </Badge>
                            {unit.resultStatus && (
                              <span className="block text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
                                Hasil: {unit.resultStatus}
                              </span>
                            )}
                          </td>
                          <td>
                            {unit.validUntil ? (
                              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                                s/d {formatDate(unit.validUntil)}
                              </span>
                            ) : (
                              <span className="text-[#6E6E73] dark:text-[#98989D]">-</span>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center justify-end gap-2 flex-wrap">
                              {bapDownloadUrl ? (
                                <a
                                  href={bapDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-white dark:bg-[#1C1F2B] hover:bg-black/[0.03] text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold text-[11px] border border-black/[0.08] dark:border-white/[0.10] transition-colors"
                                >
                                  <ClipboardText size={14} weight="bold" />
                                  <span>Unduh BAP</span>
                                  <DownloadSimple size={12} weight="bold" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] px-2">BAP Proses</span>
                              )}

                              {lhppDownloadUrl ? (
                                <a
                                  href={lhppDownloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] bg-[#C81E1E] hover:bg-[#B01818] text-white font-semibold text-[11px] shadow-xs transition-colors"
                                >
                                  <FilePdf size={14} weight="fill" />
                                  <span>Unduh LHPP</span>
                                  <DownloadSimple size={12} weight="bold" />
                                </a>
                              ) : (
                                <span className="text-[11px] text-[#6E6E73] dark:text-[#98989D] px-2">LHPP Proses</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </TableWrapper>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#11141C] px-4 sm:px-8 py-4 text-center text-[11px] text-[#6E6E73] dark:text-[#98989D]">
        &copy; {new Date().getFullYear()} PT Upaya Riksa Daya
      </footer>
    </div>
  );
}
