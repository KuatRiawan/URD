import { useCallback, useEffect, useState } from 'react';
import { ClockCounterClockwise, MagnifyingGlass, ShieldCheck } from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDateTime, ROLE_LABELS } from '../../lib/utils/format.js';

export function AuditLogPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/audit-logs', {
        params: {
          limit: 50,
          action: actionFilter || undefined,
          entity: entityFilter || undefined
        }
      });
      setItems(res.data?.items || []);
      setTotal(res.data?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat jejak audit sistem.');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log Audit Sistem (Immutable Append-Only)"
        subtitle={`Rekam jejak seluruh perubahan data, autentikasi, persetujuan LHPP, dan penerbitan Suket K3 (${total} entri tercatat).`}
        actions={
          <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <ShieldCheck size={16} weight="bold" />
            <span>Dilindungi Trigger Immutable PostgreSQL</span>
          </div>
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadLogs} />}

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter kode aksi (contoh: LOGIN_SUCCESS, ORDER_CREATED, LHPP_APPROVED)..."
            className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter Entitas Audit"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="">Semua Modul Entitas</option>
          <option value="users">Pengguna (users)</option>
          <option value="clients">Klien (clients)</option>
          <option value="inspection_objects">Objek Uji (inspection_objects)</option>
          <option value="orders">Order (orders)</option>
          <option value="inspections">Inspeksi (inspections)</option>
          <option value="lhpp">LHPP (lhpp)</option>
          <option value="suket">Suket K3 (suket)</option>
        </select>
      </div>

      {loading ? (
        <LoadingState label="Memuat catatan log audit..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada entri log audit"
          description="Aktivitas operasional yang tercatat akan ditampilkan secara kronologis di halaman ini."
        />
      ) : (
        <div className="space-y-4">
          {/* Tampilan Mobile: Kartu Riwayat Jejak Audit */}
          <div className="sm:hidden space-y-3">
            {items.map((log) => (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Badge tone="info">{log.action}</Badge>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {log.summary}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pelaku: <strong className="text-slate-700 dark:text-slate-300">{log.user_name || 'Sistem'}</strong> ({ROLE_LABELS[log.user_role] || log.user_role || '-'})
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Entitas: {log.entity}</span>
                  <span>IP: {log.ip_address || '-'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Waktu Kejadian</th>
                    <th className="py-3 px-4">Pelaku / Pengguna</th>
                    <th className="py-3 px-4">Aksi &amp; Entitas</th>
                    <th className="py-3 px-4">Ringkasan Aktivitas</th>
                    <th className="py-3 px-4">Alamat IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {items.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <ClockCounterClockwise size={14} className="text-slate-500 dark:text-slate-400" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {log.user_name || 'Sistem Otomatis'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {log.user_email || '-'} · {ROLE_LABELS[log.user_role] || log.user_role || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <Badge tone="info">{log.action}</Badge>
                        <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {log.entity}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-900 dark:text-slate-100">{log.summary}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
