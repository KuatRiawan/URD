import { useCallback, useEffect, useState } from 'react';
import { ArrowClockwise, ShareNetwork } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { DISTRIBUTION_STATUS_LABELS } from '../../lib/utils/format.js';
import { DistributionSummaryCards } from './components/DistributionSummaryCards.jsx';
import { DistributionFilterBar } from './components/DistributionFilterBar.jsx';
import { DistributionTable } from './components/DistributionTable.jsx';
import { UpdateDistributionModal } from './components/UpdateDistributionModal.jsx';

export function DocumentDistributionPage() {
  const { user } = useAuth();
  const isMarketingOrAdmin = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);
  const isReadOnly = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const [distributions, setDistributions] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    siapKirim: 0,
    dikirim: 0,
    diterima: 0,
    targetKlien: 0,
    targetDisnaker: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Update Status Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('DIKIRIM');
  const [dispatchMedia, setDispatchMedia] = useState('KURIR');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [listRes, summaryRes] = await Promise.all([
        api.get('/distributions', {
          params: {
            q: searchQuery || undefined,
            target: targetFilter || undefined,
            status: statusFilter || undefined
          }
        }),
        api.get('/distributions/summary')
      ]);

      setDistributions(listRes.data?.distributions || []);
      setSummary(summaryRes.data?.summary || {
        total: 0,
        siapKirim: 0,
        dikirim: 0,
        diterima: 0,
        targetKlien: 0,
        targetDisnaker: 0
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memuat data distribusi dokumen.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, targetFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openUpdateModal = (item) => {
    setSelectedItem(item);
    setUpdateStatus(item.status === 'SIAP_DIKIRIM' ? 'DIKIRIM' : 'DITERIMA');
    setDispatchMedia(item.dispatch_media || 'KURIR');
    setTrackingNumber(item.tracking_number || '');
    setDispatchNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setSubmitting(true);
      await api.patch(`/distributions/${selectedItem.id}/status`, {
        status: updateStatus,
        dispatchMedia,
        trackingNumber: trackingNumber.trim() || undefined,
        notes: dispatchNotes.trim() || undefined
      });

      setFeedback(`Status distribusi dokumen berhasil diperbarui menjadi ${DISTRIBUTION_STATUS_LABELS[updateStatus] || updateStatus}.`);
      setModalOpen(false);
      setSelectedItem(null);
      loadData(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memperbarui status pengiriman.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isReadOnly ? 'Monitoring Distribusi Dokumen' : 'Distribusi Dokumen K3'}
        subtitle="Pelacakan pengiriman Berita Acara (BAP) kepada Klien serta berkas LHPP & BAP ke Disnaker"
        actions={
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowClockwise size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>Perbarui Data</span>
          </button>
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={() => loadData(true)} />}

      <DistributionSummaryCards summary={summary} />

      <DistributionFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        targetFilter={targetFilter}
        setTargetFilter={setTargetFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <LoadingState message="Memuat daftar distribusi dokumen..." />
      ) : distributions.length === 0 ? (
        <EmptyState
          icon={ShareNetwork}
          title="Belum Ada Dokumen Siap Kirim"
          message="Dokumen BAP dan LHPP yang telah difinalisasi akan otomatis masuk ke dalam antrean distribusi resmi ini."
        />
      ) : (
        <DistributionTable
          distributions={distributions}
          isMarketingOrAdmin={isMarketingOrAdmin}
          onOpenUpdateModal={openUpdateModal}
        />
      )}

      <UpdateDistributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedItem={selectedItem}
        updateStatus={updateStatus}
        setUpdateStatus={setUpdateStatus}
        dispatchMedia={dispatchMedia}
        setDispatchMedia={setDispatchMedia}
        trackingNumber={trackingNumber}
        setTrackingNumber={setTrackingNumber}
        dispatchNotes={dispatchNotes}
        setDispatchNotes={setDispatchNotes}
        submitting={submitting}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
}
