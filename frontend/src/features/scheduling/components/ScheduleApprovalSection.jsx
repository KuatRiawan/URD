import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle, X } from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { EmptyState, LoadingState } from '../../../components/feedback/StateViews.jsx';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function ScheduleApprovalSection({ canApprove }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/schedules/approvals');
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memuat antrean persetujuan jadwal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (item, decision) => {
    if (decision === 'DITOLAK' && reason.trim().length < 5) {
      setError('Alasan penolakan minimal 5 karakter.');
      return;
    }
    setBusyId(item.id);
    setError('');
    try {
      await api.post(`/orders/${item.order_id}/activities/${item.id}/approval`, {
        decision,
        reason: decision === 'DITOLAK' ? reason.trim() : null
      });
      toast(
        decision === 'DISETUJUI'
          ? 'Jadwal aktivitas disetujui.'
          : 'Jadwal ditolak dan dikembalikan ke Marketing/Admin Kantor.',
        'success'
      );
      setRejectingId(null);
      setReason('');
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memproses keputusan jadwal.');
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <LoadingState label="Memuat antrean persetujuan jadwal..." />;

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#151821] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarCheck size={18} className="text-[#C81E1E]" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Persetujuan Jadwal Pemeriksaan</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {canApprove
                ? 'Tinjau usulan jadwal per unit dan jenis pemeriksaan sebelum disetujui.'
                : 'Menunggu keputusan Manager/Pimpinan.'}
            </p>
          </div>
        </div>
        <Badge tone={items.length ? 'warning' : 'neutral'}>{items.length} Menunggu</Badge>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          title="Tidak ada usulan jadwal"
          description="Usulan jadwal aktivitas pemeriksaan dari Marketing/Admin Kantor akan muncul di sini."
        />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.object_name} · {item.inspection_type_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {item.po_number || item.order_no} · {item.client_name}
                    {item.serial_number ? ` · SN ${item.serial_number}` : ''}
                  </p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTime(item.planned_start_at)} – {formatDateTime(item.planned_end_at)}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Diajukan oleh {item.proposed_by_name || 'Marketing/Admin'} · Ahli K3:{' '}
                    {item.inspector_name || 'Belum ditugaskan'}
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">Catatan: {item.notes}</p>
                  )}
                </div>
                <Badge tone="warning">DIUSULKAN</Badge>
              </div>

              {canApprove && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => decide(item, 'DISETUJUI')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    Setujui
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(rejectingId === item.id ? null : item.id);
                      setReason('');
                      setError('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                  >
                    <X size={14} />
                    Tolak
                  </button>
                </div>
              )}

              {canApprove && rejectingId === item.id && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Alasan penolakan (wajib, akan terlihat oleh pengusul)"
                    className="w-full rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    disabled={busyId === item.id || reason.trim().length < 5}
                    onClick={() => decide(item, 'DITOLAK')}
                    className="h-8 px-3 rounded-lg bg-rose-700 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                  >
                    Kirim Penolakan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
