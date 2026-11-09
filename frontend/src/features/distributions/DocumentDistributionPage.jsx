import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowClockwise, ShareNetwork } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';
import { DISTRIBUTION_STATUS_LABELS } from '../../lib/utils/format.js';
import { DistributionSummaryCards } from './components/DistributionSummaryCards.jsx';
import { DistributionFilterBar } from './components/DistributionFilterBar.jsx';
import { DistributionTable } from './components/DistributionTable.jsx';
import { UpdateDistributionModal } from './components/UpdateDistributionModal.jsx';
import { PdfPreviewModal } from '../inspections/components/PdfPreviewModal.jsx';

export function DocumentDistributionPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status');

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

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [targetFilter, setTargetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(
    initialStatusParam === 'MENUNGGU_PENGIRIMAN' ? 'SIAP_DIKIRIM' : (initialStatusParam || '')
  );

  // Update Status Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updateStatus, setUpdateStatus] = useState('DIKIRIM');
  const [dispatchMedia, setDispatchMedia] = useState('KURIR_FISIK');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // BAST PDF Preview Modal
  const [bastPreviewOpen, setBastPreviewOpen] = useState(false);
  const [bastPreviewUrl, setBastPreviewUrl] = useState(null);
  const [bastPreviewTitle, setBastPreviewTitle] = useState('');
  const [bastPreviewFilename, setBastPreviewFilename] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [listRes, summaryRes] = await Promise.all([
        api.get('/distributions', {
          params: {
            q: searchQuery || undefined,
            targetDestination: targetFilter || undefined,
            status: statusFilter || undefined
          }
        }),
        api.get('/distributions/summary')
      ]);

      setDistributions(listRes.data?.items || []);
      const distributionSummary = summaryRes.data?.summary || {};
      setSummary({
        total: distributionSummary.total_records || 0,
        siapKirim: distributionSummary.ready_to_dispatch || 0,
        dikirim: distributionSummary.dispatched || 0,
        diterima: distributionSummary.received || 0,
        targetKlien: distributionSummary.bap_client_total || 0,
        targetDisnaker:
          (distributionSummary.lhpp_disnaker_total || 0) +
          (distributionSummary.bap_disnaker_total || 0)
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
    setDispatchMedia(item.dispatch_media || 'KURIR_FISIK');
    setTrackingNumber(item.tracking_reference || item.tracking_number || '');
    setDispatchNotes(item.notes || '');
    setModalOpen(true);
  };

  const handlePreviewBast = async (orderId, refName) => {
    try {
      const res = await api.get(`/distributions/orders/${orderId}/bast/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const filename = `BAST-${(refName || 'PO').replace(/[/\s]/g, '-')}.pdf`;
      setBastPreviewUrl(url);
      setBastPreviewTitle(`Pratinjau BAST: ${refName || 'PO'}`);
      setBastPreviewFilename(filename);
      setBastPreviewOpen(true);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal memuat pratinjau BAST PDF.');
    }
  };

  const closeBastPreview = () => {
    if (bastPreviewUrl) window.URL.revokeObjectURL(bastPreviewUrl);
    setBastPreviewUrl(null);
    setBastPreviewOpen(false);
  };

  const handleDownloadBast = async (orderId, refName) => {
    try {
      const res = await api.get(`/distributions/orders/${orderId}/bast/pdf?download=1`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAST-${(refName || 'PO').replace(/[/\s]/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Gagal mengunduh berkas BAST PDF.');
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    const cleanRef = trackingNumber.trim();
    const cleanNotes = dispatchNotes.trim();
    if (updateStatus === 'DITERIMA' && !cleanRef && !cleanNotes) {
      setError('Cantumkan nomor bukti serah terima / resi atau catatan penerima sebelum menandai dokumen DITERIMA.');
      return;
    }
    if (updateStatus === 'DIKIRIM' && dispatchMedia === 'KURIR_FISIK' && !cleanRef && !cleanNotes) {
      setError('Pengiriman via Kurir Fisik wajib mencantumkan nomor resi/AWB atau keterangan pengiriman.');
      return;
    }

    try {
      setSubmitting(true);
      await api.patch(`/distributions/${selectedItem.id}/status`, {
        status: updateStatus,
        dispatchMedia,
        trackingReference: cleanRef || undefined,
        notes: cleanNotes || undefined
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
        title={isReadOnly ? 'Monitoring Distribusi Dokumen K3' : 'Distribusi Dokumen K3'}
        subtitle="Pelacakan pengiriman BAP ke klien serta berkas LHPP ke Disnaker."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="md"
            icon={ArrowClockwise}
            loading={refreshing}
            disabled={refreshing}
            onClick={() => loadData(true)}
          >
            Perbarui Data
          </Button>
        }
      />

      <DistributionSummaryCards
        summary={summary}
        statusFilter={statusFilter}
        targetFilter={targetFilter}
        onSelectStatus={setStatusFilter}
        onSelectTarget={setTargetFilter}
      />

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
      ) : error ? (
        <ErrorBanner message={error} onRetry={() => loadData(true)} />
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
          onPreviewBast={handlePreviewBast}
          onDownloadBast={handleDownloadBast}
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

      <PdfPreviewModal
        open={bastPreviewOpen}
        onClose={closeBastPreview}
        pdfUrl={bastPreviewUrl}
        title={bastPreviewTitle}
        filename={bastPreviewFilename}
        onPrint={() => {
          const iframe = document.getElementById('inspection-pdf-preview-iframe');
          if (iframe?.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        }}
      />
    </div>
  );
}
