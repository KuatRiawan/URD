import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { LHPP_STATUS_LABELS } from '../../lib/utils/format.js';
import { LhppTable } from './components/LhppTable.jsx';
import { LhppDetailModal } from './components/LhppDetailModal.jsx';
import { PdfPreviewModal } from '../inspections/components/PdfPreviewModal.jsx';

export function LhppPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING', 'AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const canDeliver = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [detailLhpp, setDetailLhpp] = useState(null);
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
      await api.patch(`/lhpp/${detailLhpp.id}/draft`, {
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
      title: 'Ajukan Review Teknis',
      message: 'Pastikan seluruh parameter uji dan narasi teknis sudah lengkap sebelum diajukan.',
      confirmLabel: 'Ya, Ajukan Review'
    });
    if (!ok) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post(`/lhpp/${detailLhpp.id}/submit-review`);
      setFeedback('LHPP berhasil diajukan untuk review teknis.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan review teknis LHPP.');
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
      danger: true
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Hasil Pemeriksaan dan Pengujian (LHPP) - Pusat Penerbitan Dokumen"
        subtitle="Penyusunan narasi teknis LHPP, finalisasi pengesahan Ahli K3, penerbitan BAP terpadu, pratinjau dan unduh PDF resmi ber-QR verifikasi, serta pencatatan distribusi dokumen."
        actions={
          <select
            aria-label="Filter Status LHPP"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100"
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

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat dokumen LHPP..." />
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
        handlePreviewPdf={handlePreviewPdf}
        handleDownloadPdf={handleDownloadPdf}
        handlePreviewBapPdf={handlePreviewBapPdf}
        handleDownloadBapPdf={handleDownloadBapPdf}
        handleSaveDraft={handleSaveDraft}
        handleSubmitReview={handleSubmitReview}
        handleUploadPhoto={handleUploadPhoto}
        handleDeletePhoto={handleDeletePhoto}
        handleRecordDelivery={handleRecordDelivery}
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
