import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Check, Checks } from '@phosphor-icons/react';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
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
            <Button
              type="button"
              variant="secondary"
              size="md"
              icon={Checks}
              onClick={handleMarkAllRead}
            >
              Tandai Semua Dibaca
            </Button>
          )
        }
      />

      {loading ? (
        <LoadingState label="Memuat notifikasi..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadNotifications} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada notifikasi"
          description="Seluruh pemberitahuan operasional terkait akun Anda akan muncul di sini."
        />
      ) : (
        <div className="bg-white dark:bg-[#151821] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
          {items.map((item) => {
            const isUnread = !item.read_at;
            return (
              <div
                key={item.id}
                className={`p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isUnread ? 'bg-[#C81E1E]/[0.03] dark:bg-rose-950/20' : 'bg-white dark:bg-[#151821]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 p-2 rounded-xl ${
                      isUnread ? 'bg-[#C81E1E] text-white shadow-2xs' : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D]'
                    }`}
                  >
                    <Bell size={18} weight="bold" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7]">{item.title}</span>
                      {isUnread && <Badge tone="danger">Baru</Badge>}
                      <span className="text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93]">{item.type}</span>
                    </div>
                    <p className="text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">{item.body}</p>
                    <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">{formatDateTime(item.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.link && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id, item.link)}
                      className="h-8 rounded-[9px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-white/[0.06] px-3 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.10] cursor-pointer"
                    >
                      Buka Tautan
                    </button>
                  )}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id, null)}
                      className="h-8 inline-flex items-center gap-1 rounded-[9px] bg-[#1D1D1F] dark:bg-white/[0.14] px-3 text-xs font-semibold text-white hover:bg-black/80 cursor-pointer"
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
