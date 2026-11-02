import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CheckCircle,
  WarningCircle,
  ListChecks
} from '@phosphor-icons/react';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage, formatDateTime } from '../../lib/utils/format.js';
import { Modal } from '../../components/ui/Modal.jsx';

function getItemBadge(type) {
  switch (type) {
    case 'OPERATIONAL_ISSUE':
      return {
        label: 'Kendala Lapangan',
        className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
      };
    case 'BAP_PROCESSING':
      return {
        label: 'Proses BAP',
        className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
      };
    case 'SUKET_RECORDING':
      return {
        label: 'Pencatatan Suket',
        className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
      };
    case 'DOCUMENT_DISTRIBUTION':
      return {
        label: 'Distribusi Dokumen',
        className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
      };
    case 'LHPP_REVIEW':
      return {
        label: 'Review LHPP',
        className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
      };
    case 'LHPP_REVISION':
      return {
        label: 'Revisi LHPP',
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
      };
    case 'ASSIGNMENT_CONFIRMATION':
      return {
        label: 'Penugasan Lapangan',
        className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20'
      };
    default:
      return null;
  }
}

export function WorkQueueWidget({ onRefresh }) {
  const [queue, setQueue] = useState([]);
  const [meta, setMeta] = useState({ total: 0, shown: 0, truncated: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // State untuk Modal Konfirmasi Penugasan Lapangan
  const [confirmModalItem, setConfirmModalItem] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard/work-queue');
      const items = res.data?.items || [];
      setQueue(items);
      setMeta({
        total: res.data?.total ?? items.length,
        shown: res.data?.shown ?? items.length,
        truncated: Boolean(res.data?.truncated)
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleRespondAssignment = async (decision) => {
    if (!confirmModalItem) return;
    setSubmitting(true);
    setActionError('');
    try {
      await api.post(
        `/orders/${confirmModalItem.orderId}/assignments/${confirmModalItem.assignmentId}/respond`,
        {
          decision,
          rejectReason: decision === 'DITOLAK' ? rejectReason.trim() : undefined
        }
      );
      setConfirmModalItem(null);
      setShowRejectInput(false);
      setRejectReason('');
      await fetchQueue();
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      setActionError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C81E1E] border-t-transparent" />
          <span>Memeriksa antrean pekerjaan operasional...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-400">
        <div className="flex items-center gap-2">
          <WarningCircle size={16} />
          <span>Gagal memuat antrean pekerjaan: {error}</span>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-4.5 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <CheckCircle size={22} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold leading-tight">Seluruh Pekerjaan Terkendali</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 mt-0.5">
              Tidak ada antrean darurat yang membutuhkan tindakan segera saat ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const highCount = queue.filter((i) => i.urgency === 'TINGGI').length;
  const lhppBapCount = queue.filter((i) =>
    ['LHPP_REVIEW', 'LHPP_REVISION', 'BAP_PROCESSING'].includes(i.type)
  ).length;
  const suketDistCount = queue.filter((i) =>
    ['SUKET_RECORDING', 'SUKET_EXPIRATION', 'DOCUMENT_DISTRIBUTION'].includes(i.type)
  ).length;
  const issueCount = queue.filter((i) => i.type === 'OPERATIONAL_ISSUE').length;

  const filteredQueue = queue.filter((item) => {
    if (filter === 'HIGH') return item.urgency === 'TINGGI';
    if (filter === 'LHPP_BAP') return ['LHPP_REVIEW', 'LHPP_REVISION', 'BAP_PROCESSING'].includes(item.type);
    if (filter === 'SUKET_DIST') return ['SUKET_RECORDING', 'SUKET_EXPIRATION', 'DOCUMENT_DISTRIBUTION'].includes(item.type);
    if (filter === 'ISSUES') return item.type === 'OPERATIONAL_ISSUE';
    return true;
  });

  return (
    <>
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-lg bg-brand-500/10 dark:bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 inline-flex items-center justify-center shrink-0 border border-brand-500/20">
              <ListChecks size={18} weight="bold" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Antrean Tindakan Prioritas ({meta.total})
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Alur kerja aktif yang membutuhkan respon, verifikasi, QC, atau distribusi
              </p>
            </div>
          </div>

          {/* Tab Filter Operasional */}
          <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Semua ({meta.total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('HIGH')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filter === 'HIGH'
                  ? 'bg-[#C81E1E] text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Tinggi ({highCount})
            </button>
            {lhppBapCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('LHPP_BAP')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'LHPP_BAP'
                    ? 'bg-purple-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                LHPP & BAP ({lhppBapCount})
              </button>
            )}
            {suketDistCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('SUKET_DIST')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'SUKET_DIST'
                    ? 'bg-indigo-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Suket & Distribusi ({suketDistCount})
              </button>
            )}
            {issueCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter('ISSUES')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'ISSUES'
                    ? 'bg-rose-700 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                Kendala ({issueCount})
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto scrollbar-thin">
          {filteredQueue.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              Tidak ada item antrean untuk kategori filter ini.
            </div>
          ) : (
            filteredQueue.map((item) => {
              const isHigh = item.urgency === 'TINGGI';
              const isInteractiveAssignment =
                item.type === 'ASSIGNMENT_CONFIRMATION' && item.orderId && item.assignmentId;
              const badge = getItemBadge(item.type);

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="flex flex-col gap-1 items-start shrink-0 mt-0.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          isHigh
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {item.urgency}
                      </span>
                      {badge && (
                        <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded ${badge.className}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {isInteractiveAssignment ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActionError('');
                        setShowRejectInput(false);
                        setRejectReason('');
                        setConfirmModalItem(item);
                      }}
                      className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#C81E1E] hover:border-[#C81E1E] hover:text-white dark:hover:bg-[#C81E1E] dark:hover:border-[#C81E1E] dark:hover:text-white transition-all shadow-2xs cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} weight="bold" aria-hidden="true" />
                    </button>
                  ) : (
                    <Link
                      to={item.link}
                      className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#C81E1E] hover:border-[#C81E1E] hover:text-white dark:hover:bg-[#C81E1E] dark:hover:border-[#C81E1E] dark:hover:text-white transition-all shadow-2xs"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} weight="bold" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>

        {meta.truncated && (
          <div className="border-t border-slate-200/90 dark:border-slate-800 bg-amber-50/70 dark:bg-amber-950/20 px-5 py-2.5 text-[11px] font-medium text-amber-900 dark:text-amber-300">
            Menampilkan {meta.shown} dari {meta.total} tindakan. Daftar diurutkan berdasarkan urgensi,
            lalu yang paling lama menunggu. Buka menu terkait untuk menindaklanjuti sisanya.
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Penugasan Lapangan Ahli K3 */}
      <Modal
        open={Boolean(confirmModalItem)}
        onClose={() => setConfirmModalItem(null)}
        title="Konfirmasi Penugasan Pemeriksaan Riksa Uji K3"
        size="md"
      >
        {confirmModalItem && (
          <div className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Nomor PO / Order:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {confirmModalItem.poNumber || confirmModalItem.orderNo || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Perusahaan Klien:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {confirmModalItem.clientName || '-'}
                </span>
              </div>
              {confirmModalItem.serviceType && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Jenis Layanan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {confirmModalItem.serviceType}
                  </span>
                </div>
              )}
              {confirmModalItem.unitCount && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Jumlah Unit Alat:</span>
                  <span className="font-bold text-[#C81E1E]">
                    {confirmModalItem.unitCount} Unit Objek Uji
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Waktu Penugasan:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formatDateTime(confirmModalItem.createdAt)}
                </span>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda bersedia menerima penugasan riksa uji K3 ini? Setelah penugasan diterima, seluruh unit alat terkait akan langsung aktif di lembar kerja Anda dan siap untuk diperiksa di lapangan.
            </p>

            {showRejectInput && (
              <div className="space-y-1.5 p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20">
                <label className="block font-bold text-red-900 dark:text-red-300">
                  Alasan Penolakan Penugasan *
                </label>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Jadwal bentrok dengan riksa uji klien lain..."
                  className="w-full rounded border border-red-300 dark:border-red-800 px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}

            {actionError && (
              <div className="p-3 rounded bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs font-semibold">
                {actionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setConfirmModalItem(null);
                  setShowRejectInput(false);
                  setRejectReason('');
                  setActionError('');
                }}
                className="min-h-10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
              >
                Batal
              </button>

              {!showRejectInput ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="min-h-10 px-4 py-2 rounded-lg border border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold cursor-pointer"
                  >
                    Tolak Penugasan
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleRespondAssignment('DITERIMA')}
                    className="min-h-10 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={16} weight="bold" />
                    <span>{submitting ? 'Memproses...' : 'Terima Penugasan'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  disabled={submitting || !rejectReason.trim()}
                  onClick={() => handleRespondAssignment('DITOLAK')}
                  className="min-h-10 px-5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Mengirim Penolakan...' : 'Konfirmasi Tolak Penugasan'}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
