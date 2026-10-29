import { useCallback, useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle,
  DownloadSimple,
  Eye,
  FloppyDisk,
  Image as ImageIcon,
  PaperPlaneTilt,
  Plus,
  Scroll,
  Trash,
  Truck,
  XCircle
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import {
  CONCLUSION_LABELS,
  formatDateTime,
  LHPP_STATUS_LABELS
} from '../../lib/utils/format.js';

const STATUS_TONE = {
  DRAF: 'neutral',
  REVIEW_TEKNIS: 'warning',
  PERSETUJUAN_PIMPINAN: 'info',
  DIKEMBALIKAN: 'danger',
  TERBIT: 'success'
};

export function LhppPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const isInspector = user?.role === 'AHLI_K3';
  const isPimpinan = user?.role === 'PIMPINAN';
  const canDeliver = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

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
  const [reviewNote, setReviewNote] = useState('');
  const [deliveryForm, setDeliveryForm] = useState({
    deliveredAt: new Date().toISOString().slice(0, 16),
    channel: 'EMAIL',
    recipientName: '',
    recipientEmail: '',
    notes: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/lhpp', {
        params: { status: statusFilter || undefined, limit: 50 }
      });
      setItems(res.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar Laporan Hasil Pemeriksaan (LHPP).');
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
        methodSummary: lhpp?.method_summary || '',
        technicalNotes: lhpp?.technical_notes || '',
        recommendations: lhpp?.recommendations || '',
        technicalData: lhpp?.technical_data && typeof lhpp.technical_data === 'object' ? lhpp.technical_data : {},
        recommendedValidUntil: lhpp?.recommended_valid_until
          ? String(lhpp.recommended_valid_until).slice(0, 10)
          : ''
      });
      setReviewNote('');
      setDetailOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail LHPP.');
    }
  };

  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!detailLhpp) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/lhpp/${detailLhpp.id}/draft`, draftForm);
      setFeedback('Narasi draf LHPP berhasil disimpan.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan draf LHPP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!detailLhpp) return;
    const ok = await confirm({
      title: 'Ajukan LHPP untuk Review',
      message: 'Draf LHPP akan dikirim ke tahap Review Teknis dan tidak dapat diubah selama proses review.',
      confirmLabel: 'Ya, Ajukan',
      tone: 'warning'
    });
    if (!ok) return;
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/lhpp/${detailLhpp.id}/draft`, draftForm);
      await api.post(`/lhpp/${detailLhpp.id}/submit-review`);
      setFeedback('LHPP berhasil diajukan ke tahap Review Teknis.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan LHPP untuk review.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDecision = async (decision) => {
    if (!detailLhpp) return;
    if (decision === 'RETURN' && !reviewNote.trim()) {
      setError('Catatan revisi wajib diisi saat mengembalikan LHPP.');
      return;
    }
    if (decision === 'APPROVE_FINAL') {
      const ok = await confirm({
        title: 'Setujui dan Terbitkan LHPP',
        message: 'LHPP akan diterbitkan dengan nomor resmi dan tidak dapat diubah lagi.',
        confirmLabel: 'Ya, Terbitkan',
        tone: 'warning'
      });
      if (!ok) return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/lhpp/${detailLhpp.id}/review`, {
        decision,
        note: reviewNote
      });
      setFeedback('Keputusan review LHPP berhasil disimpan.');
      await openDetail(detailLhpp.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses keputusan review LHPP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (id, lhppNo) => {
    try {
      const res = await api.get(`/lhpp/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${lhppNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunduh dokumen PDF LHPP.');
    }
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
        title="Laporan Hasil Pemeriksaan dan Pengujian (LHPP)"
        subtitle="Susun narasi teknis LHPP, proses verifikasi berjenjang oleh Pimpinan, unduh PDF resmi ber-QR verifikasi, dan catat distribusi dokumen."
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <th className="py-3 px-4">Nomor LHPP</th>
                  <th className="py-3 px-4">Perusahaan Klien &amp; Order</th>
                  <th className="py-3 px-4">Objek Uji K3</th>
                  <th className="py-3 px-4">Ahli K3 &amp; Kesimpulan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      <div>{item.lhpp_no || 'DRAF LHPP'}</div>
                      {item.bap_no && (
                        <div className="text-[11px] text-[#C81E1E] dark:text-red-400">BAP: {item.bap_no}</div>
                      )}
                      <div className="text-[11px] font-sans font-normal text-slate-500 dark:text-slate-400">
                        Revisi v{item.version || 1}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.client_name}</div>
                      <div className="font-mono text-slate-500 dark:text-slate-400">
                        PO: {item.po_number || item.order_no}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {item.category_code} · SN: {item.serial_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{item.inspector_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {CONCLUSION_LABELS[item.conclusion] || item.conclusion || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                        {LHPP_STATUS_LABELS[item.status] || item.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetail(item.id)}
                          className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Eye size={15} />
                          <span>Kelola</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(item.id, item.lhpp_no)}
                          className="min-h-9 inline-flex items-center gap-1 rounded bg-slate-800 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                        >
                          <DownloadSimple size={15} />
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail & Persetujuan LHPP */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailLhpp ? `Dokumen LHPP ${detailLhpp.lhpp_no}` : 'Detail LHPP'}
        size="xl"
      >
        {detailLhpp && (
          <div className="space-y-6 text-sm text-slate-800 dark:text-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-md border border-slate-200 dark:border-slate-700">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={STATUS_TONE[detailLhpp.status] || 'neutral'}>
                    {LHPP_STATUS_LABELS[detailLhpp.status] || detailLhpp.status}
                  </Badge>
                  <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    PO: {detailLhpp.po_number || detailLhpp.order_no}
                  </span>
                  {detailLhpp.bap_no && (
                    <span className="text-xs font-mono text-[#C81E1E] dark:text-red-400 font-bold">
                      · BAP: {detailLhpp.bap_no} ({detailLhpp.bap_status})
                    </span>
                  )}
                  {detailLhpp.verification_code && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      · Kode QR: {detailLhpp.verification_code}
                    </span>
                  )}
                </div>
                {detailLhpp.review_notes && (
                  <p className="mt-1 text-xs text-red-700 dark:text-red-400 font-semibold">
                    Catatan Review Terakhir: {detailLhpp.review_notes}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleDownloadPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')}
                className="min-h-10 inline-flex items-center gap-1.5 rounded bg-slate-800 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                <DownloadSimple size={16} />
                <span>Unduh LHPP Resmi (PDF)</span>
              </button>
            </div>

            {/* Form Narasi & Evaluasi Teknis Spesifik Kategori LHPP */}
            <form onSubmit={handleSaveDraft} className="space-y-4">
              {Array.isArray(detailLhpp.lhpp_schema) && detailLhpp.lhpp_schema.length > 0 && (
                <div className="p-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Parameter Evaluasi Teknis Spesifik Kategori ({detailLhpp.category_code} -{' '}
                      {detailLhpp.category_name})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detailLhpp.lhpp_schema.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          disabled={
                            !isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)
                          }
                          value={draftForm.technicalData?.[field.key] || ''}
                          onChange={(e) =>
                            setDraftForm((prev) => ({
                              ...prev,
                              technicalData: {
                                ...prev.technicalData,
                                [field.key]: e.target.value
                              }
                            }))
                          }
                          placeholder={`Isi ${field.label.toLowerCase()}...`}
                          className="w-full rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Rekomendasi Masa Berlaku / Tanggal Pemeriksaan Berkala Berikutnya
                  </label>
                  <input
                    type="date"
                    disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
                    value={draftForm.recommendedValidUntil}
                    onChange={(e) =>
                      setDraftForm((prev) => ({ ...prev, recommendedValidUntil: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Ringkasan Metode Pemeriksaan &amp; Pengujian
                </label>
                <textarea
                  rows={2}
                  disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
                  value={draftForm.methodSummary}
                  onChange={(e) =>
                    setDraftForm((prev) => ({ ...prev, methodSummary: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Analisis &amp; Evaluasi Teknis K3
                </label>
                <textarea
                  rows={3}
                  disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
                  value={draftForm.technicalNotes}
                  onChange={(e) =>
                    setDraftForm((prev) => ({ ...prev, technicalNotes: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Syarat &amp; Rekomendasi Pemenuhan Regulasi K3
                </label>
                <textarea
                  rows={2}
                  disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
                  value={draftForm.recommendations}
                  onChange={(e) =>
                    setDraftForm((prev) => ({ ...prev, recommendations: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-10 inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <FloppyDisk size={15} />
                    <span>Simpan Draf LHPP</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmitReview}
                    className="min-h-10 inline-flex items-center gap-1.5 rounded bg-[#C81E1E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-800"
                  >
                    <PaperPlaneTilt size={15} />
                    <span>Ajukan ke Review Teknis</span>
                  </button>
                </div>
              )}
            </form>

            {/* Bab VIII: Lampiran Dokumentasi Foto Riksa Uji */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-white dark:bg-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <ImageIcon size={16} />
                  <span>
                    Bab VIII: Lampiran Dokumentasi Foto Riksa Uji ({(detailLhpp.photos || []).length} Foto)
                  </span>
                </h4>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tercetak otomatis pada halaman lampiran LHPP resmi
                </span>
              </div>

              {/* Grid Foto yang Terlampir */}
              {(detailLhpp.photos || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {detailLhpp.photos.map((ph, idx) => (
                    <div
                      key={ph.id}
                      className="group relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col shadow-xs"
                    >
                      <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        <img
                          src={`/api/v1/dashboard/files/${ph.id}`}
                          alt={ph.caption || 'Foto Dokumentasi'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            Foto {idx + 1}: {ph.caption || ph.originalName}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDateTime(ph.createdAt)}
                          </div>
                        </div>
                        {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(ph.id)}
                            className="mt-2 text-[10px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Trash size={12} />
                            <span>Hapus Foto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-500 dark:text-slate-400 text-center">
                  Belum ada foto dokumentasi terlampir. Foto dapat diunggah melalui formulir di bawah ini atau secara otomatis terintegrasi dari lembar kerja inspeksi lapangan.
                </div>
              )}

              {/* Form Unggah Foto Tambahan */}
              {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
                <form
                  onSubmit={handleUploadPhoto}
                  className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md space-y-2"
                >
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera size={15} />
                    <span>Tambah Foto Dokumentasi Lapangan</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      'Tampak Keseluruhan',
                      'Papan Nama (Nameplate)',
                      'Komponen Konstruksi',
                      'Pengujian NDT',
                      'Uji Beban 100%',
                      'Stiker Riksa Uji K3'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setPhotoCaption(tag)}
                        className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                    <div className="sm:col-span-5">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 dark:file:bg-slate-700 file:text-white hover:file:bg-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="Keterangan foto (mis: Uji Beban 100% SWL)..."
                        className="w-full rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={uploadingPhoto || !photoFile}
                        className="w-full min-h-8 inline-flex items-center justify-center gap-1 rounded bg-slate-900 dark:bg-slate-700 px-2 py-1 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
                      >
                        <Plus size={13} />
                        <span>{uploadingPhoto ? 'Mengunggah...' : 'Unggah'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Panel Review & Pengesahan Pimpinan */}
            {isPimpinan &&
              ['REVIEW_TEKNIS', 'PERSETUJUAN_PIMPINAN'].includes(detailLhpp.status) && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Scroll size={16} />
                    <span>Panel Verifikasi &amp; Pengesahan Pimpinan</span>
                  </h4>
                  <input
                    type="text"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Catatan review / alasan pengembalian revisi..."
                    className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex flex-wrap gap-2">
                    {detailLhpp.status === 'REVIEW_TEKNIS' && (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleReviewDecision('APPROVE_TECHNICAL')}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
                      >
                        <CheckCircle size={15} />
                        <span>Setujui Review Teknis</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReviewDecision('APPROVE_FINAL')}
                      className="min-h-10 inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                    >
                      <CheckCircle size={15} />
                      <span>Sahkan &amp; Terbitkan LHPP Final</span>
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReviewDecision('RETURN')}
                      className="min-h-10 inline-flex items-center gap-1.5 rounded bg-red-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-800"
                    >
                      <XCircle size={15} />
                      <span>Kembalikan untuk Revisi</span>
                    </button>
                  </div>
                </div>
              )}

            {/* Pencatatan Distribusi Dokumen LHPP */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-white dark:bg-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Truck size={16} />
                <span>
                  Log Distribusi &amp; Serah Terima LHPP ({(detailLhpp.deliveries || []).length})
                </span>
              </h4>
              {(detailLhpp.deliveries || []).map((del) => (
                <div
                  key={del.id}
                  className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 py-2 flex justify-between text-slate-800 dark:text-slate-200"
                >
                  <span>
                    <strong>{del.channel}</strong> kepada <strong>{del.recipient_name}</strong>{' '}
                    {del.recipient_email ? `(${del.recipient_email})` : ''}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{formatDateTime(del.delivered_at)}</span>
                </div>
              ))}
              {canDeliver && (
                <form
                  onSubmit={handleRecordDelivery}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
                >
                  <select
                    value={deliveryForm.channel}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({ ...prev, channel: e.target.value }))
                    }
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 text-xs"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SERAH_TERIMA_LANGSUNG">Serah Terima Langsung</option>
                    <option value="KURIR">Ekspedisi / Kurir</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={deliveryForm.recipientName}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({ ...prev, recipientName: e.target.value }))
                    }
                    placeholder="Nama penerima di klien..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 text-xs"
                  />
                  <input
                    type="email"
                    value={deliveryForm.recipientEmail}
                    onChange={(e) =>
                      setDeliveryForm((prev) => ({ ...prev, recipientEmail: e.target.value }))
                    }
                    placeholder="Email penerima..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2.5 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-9 rounded bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 px-3 text-xs font-bold text-white"
                  >
                    Catat Pengiriman
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
