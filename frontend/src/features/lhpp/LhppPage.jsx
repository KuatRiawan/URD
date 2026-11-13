import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { CheckCircle, Clock, FileText, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { LHPP_STATUS_LABELS } from '../../lib/utils/format.js';
import { LhppTable } from './components/LhppTable.jsx';
import { LhppDetailModal } from './components/LhppDetailModal.jsx';
import { PdfPreviewModal } from '../inspections/components/PdfPreviewModal.jsx';

export function LhppPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const canDeliver = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  const [detailLhpp, setDetailLhpp] = useState(null);

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [draftForm, setDraftForm] = useState({
    methodSummary: '',
    technicalNotes: '',
    recommendations: '',
    technicalData: {},
    recommendedValidUntil: ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    deliveredAt: new Date().toISOString().slice(0, 16),
    channel: 'EMAIL',
    recipientName: '',
    recipientEmail: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);

  // Upload Foto Dokumentasi Tambahan
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Pratinjau PDF
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/lhpp', {
        params: { status: statusFilter || undefined, limit: 50 }
      });
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar dokumen LHPP.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const searchParam = searchParams.get('search') || searchParams.get('id');
  const openedLhppRef = useRef(null);

  useEffect(() => {
    if (!searchParam || !items.length) return;
    if (openedLhppRef.current === searchParam && detailOpen) return;

    const matched = items.find(
      (item) =>
        item.id === searchParam ||
        item.lhpp_no?.toLowerCase().includes(searchParam.toLowerCase()) ||
        item.order_no?.toLowerCase().includes(searchParam.toLowerCase())
    );

    if (matched) {
      openedLhppRef.current = searchParam;
      openDetail(matched.id);
    }
  }, [searchParam, items, detailOpen]);

  const openDetail = async (id) => {
    setError('');
    try {
      const res = await api.get(`/lhpp/${id}`);
      const lhpp = res.data?.lhpp;
      setDetailLhpp(lhpp);
      setDraftForm({
        methodSummary: lhpp.method_summary || '',
        technicalNotes: lhpp.technical_notes || '',
        recommendations: lhpp.recommendations || '',
        technicalData: lhpp.technical_data || {},
        recommendedValidUntil: lhpp.recommended_valid_until
          ? new Date(lhpp.recommended_valid_until).toISOString().slice(0, 10)
          : ''
      });
      setDetailOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat rincian LHPP.');
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!detailLhpp) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/lhpp/${detailLhpp.id}/draft`, {
        methodSummary: draftForm.methodSummary,
        technicalNotes: draftForm.technicalNotes,
        recommendations: draftForm.recommendations,
        technicalData: draftForm.technicalData,
        recommendedValidUntil: draftForm.recommendedValidUntil || null
      });
      setFeedback('Draf narasi teknis LHPP berhasil disimpan.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan draf narasi teknis LHPP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!detailLhpp) return;
    const ok = await confirm({
      title: 'Ajukan LHPP untuk Review QC & Finalisasi',
      message: 'Pastikan hasil pemeriksaan teknis dan draf narasi sudah lengkap sebelum diajukan untuk tinjauan QC Admin Kantor dan finalisasi.',
      confirmLabel: 'Ajukan untuk Review QC'
    });
    if (!ok) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post(`/lhpp/${detailLhpp.id}/submit-finalization`);
      setFeedback('LHPP berhasil diajukan untuk proses review QC dan finalisasi dokumen.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan LHPP untuk review QC.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeLhpp = async () => {
    if (!detailLhpp) return;
    const ok = await confirm({
      title: 'Finalisasi Dokumen LHPP',
      message: 'LHPP akan disahkan secara resmi dan nomor BAP unit akan diterbitkan secara otomatis. Tindakan ini akan mengunci dokumen.',
      confirmLabel: 'Ya, Finalisasi & Terbitkan BAP',
      tone: 'success'
    });
    if (!ok) return;

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/lhpp/${detailLhpp.id}/finalize`);
      setFeedback(`LHPP berhasil difinalisasi! Dokumen BAP nomor ${res.data?.bap?.bap_no || ''} telah terbit.`);
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memfinalisasi dokumen LHPP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnLhpp = async (note) => {
    if (!detailLhpp) return false;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/lhpp/${detailLhpp.id}/return`, { note });
      setFeedback(
        'LHPP dikembalikan ke Ahli K3 untuk diperbaiki. Unit alat kembali ke tahap revisi dan catatan Anda terkirim sebagai notifikasi.'
      );
      await openDetail(detailLhpp.id);
      await loadData();
      return true;
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
        'Gagal mengembalikan dokumen LHPP untuk revisi.'
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewPdf = async (id, lhppNo) => {
    try {
      const res = await api.get(`/lhpp/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfTitle(`Dokumen LHPP: ${lhppNo || 'Draf LHPP'}`);
      setPreviewPdfFilename(`${(lhppNo || 'LHPP').replace(/\//g, '-')}.pdf`);
      setPdfPreviewModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pratinjau PDF LHPP.');
    }
  };

  const handleDownloadPdf = async (id, lhppNo) => {
    try {
      const res = await api.get(`/lhpp/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(lhppNo || 'LHPP').replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh berkas PDF LHPP.');
    }
  };

  const handleDownloadDocx = async (lhppId, lhppNo) => {
    try {
      const res = await api.get(`/lhpp/${lhppId}/docx`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(lhppNo || 'LHPP').replace(/\//g, '-')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh berkas Word (.docx) LHPP.');
    }
  };

  const handleDownloadRecommendationsPdf = async (inspectionId, lhppNo) => {
    if (!inspectionId) return;
    try {
      const res = await api.get(`/inspections/${inspectionId}/recommendation-letter.pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Lembar-Temuan-Rekomendasi-${(lhppNo || inspectionId).replace(/\//g, '-')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Gagal mengunduh Lembar Temuan & Rekomendasi K3 (PDF).'
      );
    }
  };

  const handlePreviewBapPdf = async (bapId, bapNo) => {
    try {
      const res = await api.get(`/bap/${bapId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfTitle(`Dokumen Berita Acara: ${bapNo}`);
      setPreviewPdfFilename(`${(bapNo || 'BAP').replace(/\//g, '-')}.pdf`);
      setPdfPreviewModalOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat pratinjau PDF BAP.');
    }
  };

  const handleDownloadBapPdf = async (bapId, bapNo) => {
    try {
      const res = await api.get(`/bap/${bapId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(bapNo || 'BAP').replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh berkas PDF BAP.');
    }
  };

  const closePdfPreview = () => {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPdfPreviewModalOpen(false);
  };

  const handleRecordDelivery = async (e) => {
    e.preventDefault();
    if (!detailLhpp || !deliveryForm.recipientName.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/lhpp/${detailLhpp.id}/deliveries`, {
        deliveredAt: new Date(deliveryForm.deliveredAt).toISOString(),
        channel: deliveryForm.channel,
        recipientName: deliveryForm.recipientName,
        recipientEmail: deliveryForm.recipientEmail,
        notes: deliveryForm.notes
      });
      setDeliveryForm((prev) => ({
        ...prev,
        recipientName: '',
        recipientEmail: '',
        notes: ''
      }));
      setFeedback('Bukti pengiriman dokumen LHPP ke klien berhasil dicatat.');
      await openDetail(detailLhpp.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat pengiriman LHPP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    if (!detailLhpp || !photoFile) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('photo', photoFile);
      fd.append('caption', photoCaption.trim() || 'Dokumentasi Foto Riksa Uji K3');
      await api.post(`/lhpp/${detailLhpp.id}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoFile(null);
      setPhotoCaption('');
      setFeedback('Foto dokumentasi berhasil diunggah dan ditambahkan ke Bab VIII LHPP.');
      await openDetail(detailLhpp.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah foto dokumentasi.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!detailLhpp) return;
    const confirmed = await confirm({
      title: 'Hapus Foto Dokumentasi',
      message: 'Foto dokumentasi ini akan dihapus dari lampiran Bab VIII LHPP.',
      confirmLabel: 'Hapus Foto',
      tone: 'danger'
    });
    if (!confirmed) return;
    try {
      await api.delete(`/lhpp/${detailLhpp.id}/photos/${photoId}`);
      setFeedback('Foto dokumentasi berhasil dihapus.');
      await openDetail(detailLhpp.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus foto dokumentasi.');
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const waitingReview = items.filter((i) => i.status === 'SIAP_PREVIEW').length;
    const returned = items.filter((i) => i.status === 'DIKEMBALIKAN').length;
    const published = items.filter((i) => ['FINAL', 'TERBIT'].includes(i.status)).length;
    return { total, waitingReview, returned, published };
  }, [items]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Monitoring Dokumen LHPP' : 'Dokumen LHPP & BAP'}
        subtitle={
          isPimpinan
            ? 'Pengawasan narasi teknis, antrean kendali mutu (QC), revisi, dan pengesahan LHPP.'
            : 'Penyusunan narasi teknis, pengesahan dokumen resmi, dan berkas PDF ber-QR verifikasi.'
        }
        actions={
          <select
            aria-label="Filter Status LHPP"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-white dark:bg-[#151821] px-3 text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E] transition-colors"
          >
            <option value="">Semua Status LHPP</option>
            {Object.entries(LHPP_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        }
      />

      {/* Ringkasan Status Dokumen LHPP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7]">
            <FileText size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Total Berkas LHPP</div>
            <div className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">{stats.total} Dokumen</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Antrean Kendali Mutu</div>
            <div className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-400">{stats.waitingReview} Menunggu</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Dalam Revisi Teknis</div>
            <div className="text-lg font-bold tracking-tight text-rose-700 dark:text-rose-400">{stats.returned} Revisi</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">LHPP Telah Terbit</div>
            <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{stats.published} Terbit</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar: Status Alur Kerja LHPP */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl w-full max-w-2xl overflow-x-auto">
        {[
          { key: '', label: 'Semua Dokumen' },
          { key: 'SIAP_PREVIEW', label: 'Menunggu QC (Siap Final)' },
          { key: 'DIKEMBALIKAN', label: 'Dalam Revisi' },
          { key: 'DRAF', label: 'Draf' },
          { key: 'FINAL', label: 'Final / Terbit' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState label="Memuat dokumen LHPP..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada dokumen LHPP"
          description="Dokumen LHPP dibuat otomatis ketika Ahli K3 mengirim form hasil inspeksi lapangan."
        />
      ) : (
        <LhppTable
          items={items}
          openDetail={openDetail}
          handlePreviewPdf={handlePreviewPdf}
          handleDownloadPdf={handleDownloadPdf}
        />
      )}

      {/* Modal Detail & Persetujuan LHPP */}
      <LhppDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        detailLhpp={detailLhpp}
        canManage={canManage}
        isInspector={isInspector}
        isPimpinan={isPimpinan}
        canDeliver={canDeliver}
        submitting={submitting}
        draftForm={draftForm}
        setDraftForm={setDraftForm}
        photoFile={photoFile}
        setPhotoFile={setPhotoFile}
        photoCaption={photoCaption}
        setPhotoCaption={setPhotoCaption}
        uploadingPhoto={uploadingPhoto}
        deliveryForm={deliveryForm}
        setDeliveryForm={setDeliveryForm}
        handleFinalizeLhpp={handleFinalizeLhpp}
        handleReturnLhpp={handleReturnLhpp}
        handlePreviewPdf={handlePreviewPdf}
        handleDownloadPdf={handleDownloadPdf}
        handleDownloadDocx={handleDownloadDocx}
        handleDownloadRecommendationsPdf={handleDownloadRecommendationsPdf}
        handlePreviewBapPdf={handlePreviewBapPdf}
        handleDownloadBapPdf={handleDownloadBapPdf}
        handleSaveDraft={handleSaveDraft}
        handleSubmitReview={handleSubmitReview}
        handleUploadPhoto={handleUploadPhoto}
        handleDeletePhoto={handleDeletePhoto}
        handleRecordDelivery={handleRecordDelivery}
        handleRefreshDetail={() => openDetail(detailLhpp?.id)}
      />

      {/* Modal Pratinjau PDF Aktual */}
      <PdfPreviewModal
        open={pdfPreviewModalOpen}
        onClose={closePdfPreview}
        title={previewPdfTitle}
        pdfUrl={previewPdfUrl}
        filename={previewPdfFilename}
      />
    </div>
  );
}
