import {
  CheckCircle,
  DownloadSimple,
  Eye
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { LHPP_STATUS_LABELS } from '../../../lib/utils/format.js';
import { STATUS_TONE } from '../lhppConstants.js';
import { LhppTechnicalForm } from './LhppTechnicalForm.jsx';
import { LhppPhotosSection } from './LhppPhotosSection.jsx';
import { LhppDeliverySection } from './LhppDeliverySection.jsx';

export function LhppDetailModal({
  open,
  onClose,
  detailLhpp,
  canManage,
  isInspector,
  isPimpinan,
  canDeliver,
  submitting,
  draftForm,
  setDraftForm,
  photoFile,
  setPhotoFile,
  photoCaption,
  setPhotoCaption,
  uploadingPhoto,
  deliveryForm,
  setDeliveryForm,
  handleFinalizeLhpp,
  handlePreviewPdf,
  handleDownloadPdf,
  handlePreviewBapPdf,
  handleDownloadBapPdf,
  handleSaveDraft,
  handleSubmitReview,
  handleUploadPhoto,
  handleDeletePhoto,
  handleRecordDelivery
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
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
            <div className="flex flex-wrap items-center gap-2">
              {['SIAP_PREVIEW', 'DIKEMBALIKAN'].includes(detailLhpp.status) && canManage && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleFinalizeLhpp}
                  className="min-h-10 inline-flex items-center gap-1.5 rounded bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Finalisasi LHPP & Terbitkan BAP Unit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handlePreviewPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')}
                className="min-h-10 inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                <Eye size={16} />
                <span>Pratinjau PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')}
                className="min-h-10 inline-flex items-center gap-1.5 rounded bg-slate-800 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 cursor-pointer"
              >
                <DownloadSimple size={16} />
                <span>Unduh LHPP Resmi (PDF)</span>
              </button>
            </div>
          </div>

          {/* Visual Stepper: Pipeline Penerbitan Dokumen (LHPP -> BAP -> Distribusi) */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Alur Penerbitan Dokumen K3 Terpadu
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Tahap 1: LHPP */}
              <div
                className={`p-3 rounded-lg border ${
                  ['FINAL', 'TERBIT'].includes(detailLhpp.status)
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 inline-flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    <span>Laporan LHPP</span>
                  </span>
                  <Badge tone={STATUS_TONE[detailLhpp.status] || 'neutral'}>
                    {LHPP_STATUS_LABELS[detailLhpp.status] || detailLhpp.status}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {['FINAL', 'TERBIT'].includes(detailLhpp.status)
                    ? `Telah difinalisasi resmi: ${detailLhpp.lhpp_no}`
                    : 'Lengkapi narasi teknis dan finalisasi dokumen.'}
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handlePreviewPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')}
                    className="text-[11px] font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>Pratinjau LHPP</span>
                  </button>
                  {['FINAL', 'TERBIT'].includes(detailLhpp.status) && (
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(detailLhpp.id, detailLhpp.lhpp_no)}
                      className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <DownloadSimple size={13} />
                      <span>Unduh PDF</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tahap 2: BAP */}
              <div
                className={`p-3 rounded-lg border ${
                  detailLhpp.bap_no
                    ? detailLhpp.bap_status === 'FINAL'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 inline-flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    <span>Berita Acara (BAP)</span>
                  </span>
                  {detailLhpp.bap_no ? (
                    <Badge tone={detailLhpp.bap_status === 'FINAL' ? 'success' : 'warning'}>
                      {detailLhpp.bap_status === 'FINAL' ? 'BAP Final' : 'Draf BAP'}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">Menunggu LHPP</Badge>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {detailLhpp.bap_no
                    ? `Nomor BAP: ${detailLhpp.bap_no}`
                    : 'Otomatis diterbitkan segera setelah LHPP difinalisasi.'}
                </div>
                {detailLhpp.bap_id && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePreviewBapPdf(detailLhpp.bap_id, detailLhpp.bap_no)}
                      className="text-[11px] font-semibold px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Pratinjau BAP</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadBapPdf(detailLhpp.bap_id, detailLhpp.bap_no)}
                      className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-900 dark:bg-slate-700 text-white hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <DownloadSimple size={13} />
                      <span>Unduh BAP</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tahap 3: Distribusi Dokumen */}
              <div
                className={`p-3 rounded-lg border ${
                  (detailLhpp.deliveries || []).length > 0
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 inline-flex items-center justify-center text-[11px] font-bold">
                      3
                    </span>
                    <span>Distribusi & Serah Terima</span>
                  </span>
                  <Badge tone={(detailLhpp.deliveries || []).length > 0 ? 'success' : 'neutral'}>
                    {(detailLhpp.deliveries || []).length > 0
                      ? `${detailLhpp.deliveries.length} Log Terkirim`
                      : 'Belum Dikirim'}
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {(detailLhpp.deliveries || []).length > 0
                    ? 'Tercatat pengiriman ke Klien & tembusan Disnaker.'
                    : 'Kirimkan berkas final ke Klien & laporkan ke Disnaker.'}
                </div>
              </div>
            </div>
          </div>

          {isPimpinan && (
            <div className="p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span>
                <strong>Mode Pantau Eksekutif (Hanya Baca):</strong> Pimpinan dapat memantau status dokumen dan mengunduh berkas PDF resmi ber-QR verifikasi tanpa memerlukan proses persetujuan administratif.
              </span>
            </div>
          )}

          {/* Form Narasi & Evaluasi Teknis */}
          <LhppTechnicalForm
            detailLhpp={detailLhpp}
            draftForm={draftForm}
            setDraftForm={setDraftForm}
            isInspector={isInspector}
            submitting={submitting}
            handleSaveDraft={handleSaveDraft}
            handleSubmitReview={handleSubmitReview}
          />

          {/* Bab VIII: Lampiran Dokumentasi Foto Riksa Uji */}
          <LhppPhotosSection
            detailLhpp={detailLhpp}
            isInspector={isInspector}
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            photoCaption={photoCaption}
            setPhotoCaption={setPhotoCaption}
            uploadingPhoto={uploadingPhoto}
            handleUploadPhoto={handleUploadPhoto}
            handleDeletePhoto={handleDeletePhoto}
          />

          {/* Pencatatan Distribusi Dokumen LHPP */}
          <LhppDeliverySection
            detailLhpp={detailLhpp}
            canDeliver={canDeliver}
            deliveryForm={deliveryForm}
            setDeliveryForm={setDeliveryForm}
            submitting={submitting}
            handleRecordDelivery={handleRecordDelivery}
          />
        </div>
      )}
    </Modal>
  );
}

