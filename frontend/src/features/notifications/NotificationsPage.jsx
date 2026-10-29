import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check, Checks } from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDateTime } from '../../lib/utils/format.js';

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notifications', { params: { limit: 50 } });
      setItems(res.data?.items || []);
      setUnreadCount(res.data?.unreadCount || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar notifikasi sistem.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (id, link) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      if (link) {
        navigate(link);
      } else {
        await loadNotifications();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menandai notifikasi telah dibaca.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      await loadNotifications();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menandai semua notifikasi.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pusat Notifikasi Operasional"
        subtitle={`Pemberitahuan penugasan Ahli K3, persetujuan LHPP, dan pengingat jatuh tempo Suket K3 (${unreadCount} belum dibaca).`}
        actions={
          unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-slate-800 dark:bg-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600"
            >
              <Checks size={16} weight="bold" />
              <span>Tandai Semua Dibaca</span>
            </button>
          )
        }
      />

      {error && <ErrorBanner message={error} onRetry={loadNotifications} />}

      {loading ? (
        <LoadingState label="Memuat notifikasi..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada notifikasi"
          description="Seluruh pemberitahuan operasional terkait akun Anda akan muncul di sini."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800 shadow-xs overflow-hidden">
          {items.map((item) => {
            const isUnread = !item.read_at;
            return (
              <div
                key={item.id}
                className={`p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isUnread ? 'bg-red-50/35 dark:bg-red-950/20' : 'bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 rounded-md ${
                      isUnread ? 'bg-[#C81E1E] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Bell size={18} weight="bold" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{item.title}</span>
                      {isUnread && <Badge tone="danger">Baru</Badge>}
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{item.type}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{item.body}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatDateTime(item.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id, item.link)}
                      className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      Buka Tautan
                    </button>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id, null)}
                      className="min-h-9 inline-flex items-center gap-1 rounded bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600"
                    >
                      <Check size={14} />
                      <span>Tandai Dibaca</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
