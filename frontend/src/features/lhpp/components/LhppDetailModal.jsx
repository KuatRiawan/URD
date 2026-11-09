import { useState } from 'react';
import {
  ArrowCounterClockwise,
  CheckCircle,
  DownloadSimple,
  Eye,
  FileDoc,
  FilePdf,
  GitBranch,
  LockKey,
  ShieldCheck,
  WarningCircle,
  WarningOctagon
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
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
  handleReturnLhpp,
  handlePreviewPdf,
  handleDownloadPdf,
  handleDownloadDocx,
  handleDownloadRecommendationsPdf,
  handlePreviewBapPdf,
  handleDownloadBapPdf,
  handleSaveDraft,
  handleSubmitReview,
  handleUploadPhoto,
  handleDeletePhoto,
  handleRecordDelivery
}) {
  const toast = useToast();
  const [returnMode, setReturnMode] = useState(false);
  const [returnNote, setReturnNote] = useState('');
  const [returnError, setReturnError] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const handleValidate = async () => {
    if (!detailLhpp?.id) return;
    setValidating(true);
    try {
      const res = await api.post(`/lhpp/${detailLhpp.id}/validate`);
      const val = res.data?.data || res.data;
      setValidationResult(val);
      if (val.valid) {
        toast('Semua persyaratan teknis dan dokumen LHPP lengkap. Siap difinalisasi.', 'success');
      } else {
        toast(`Ditemukan ${val.missingCount || (val.missingFields || []).length} butir data belum lengkap.`, 'warning');
      }
    } catch (err) {
      toast(err.response?.data?.error?.message || 'Gagal memvalidasi kelengkapan LHPP.', 'error');
    } finally {
      setValidating(false);
    }
  };

  const submitReturn = async () => {
    if (returnNote.trim().length < 10) {
      setReturnError('Catatan revisi minimal 10 karakter agar Ahli K3 tahu bagian yang harus diperbaiki.');
      return;
    }
    setReturnError('');
    const ok = await handleReturnLhpp(returnNote.trim());
    if (ok) {
      setReturnMode(false);
      setReturnNote('');
    }
  };

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
              {canManage && detailLhpp.status === 'SIAP_PREVIEW' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={ShieldCheck}
                  disabled={validating || submitting}
                  loading={validating}
                  onClick={handleValidate}
                >
                  Validasi Kelengkapan
                </Button>
              )}
              {detailLhpp.status === 'SIAP_PREVIEW' && canManage && (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={CheckCircle}
                    disabled={submitting || validating}
                    loading={submitting}
                    onClick={handleFinalizeLhpp}
                  >
                    Finalisasi LHPP
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    icon={ArrowCounterClockwise}
                    disabled={submitting}
                    onClick={() => {
                      setReturnError('');
                      setReturnMode((v) => !v);
                    }}
                  >
                    Kembalikan
                  </Button>
                </>
              )}
              {detailLhpp.status === 'DIKEMBALIKAN' && (
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                  Menunggu perbaikan Ahli K3. Dokumen tidak dapat difinalisasi sebelum diajukan ulang.
                </span>
              )}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Eye}
                onClick={() => handlePreviewPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')}
              >
                Pratinjau PDF
              </Button>
              <ActionMenu
                label="Unduh Dokumen LHPP"
                items={[
                  {
                    label: 'Unduh PDF LHPP Resmi',
                    icon: FilePdf,
                    onClick: () => handleDownloadPdf(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')
                  },
                  handleDownloadDocx && {
                    label: 'Unduh Word (.docx)',
                    icon: FileDoc,
                    onClick: () => handleDownloadDocx(detailLhpp.id, detailLhpp.lhpp_no || 'Draf-LHPP')
                  },
                  detailLhpp.inspection_id && handleDownloadRecommendationsPdf && {
                    label: 'Unduh Lembar Temuan (PDF)',
                    icon: WarningOctagon,
                    onClick: () => handleDownloadRecommendationsPdf(detailLhpp.inspection_id, detailLhpp.lhpp_no || 'LHPP')
                  }
                ]}
              />
            </div>
          </div>

          {/* Engine Template LHPP & Integritas Dokumen (Apple-style pill metadata card) */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-3.5 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Template Engine:</span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                {detailLhpp.template_code || detailLhpp.template?.code || 'PAPA-CRANE-01'}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <GitBranch size={12} />
                <span>{detailLhpp.template_version_code || detailLhpp.template?.version_code || 'v1.0.0'}</span>
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {detailLhpp.domain_name || detailLhpp.category_name || detailLhpp.inspection_domain || 'Pesawat Angkat & Angkut'}
              </span>
            </div>

            {['FINAL', 'TERBIT'].includes(detailLhpp.status) ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                <LockKey size={13} weight="bold" />
                <span className="font-semibold">Dokumen Terkunci (SHA-256 Valid)</span>
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 font-mono">
                Copy-on-Write Versioning Aktif
              </div>
            )}
          </div>

          {/* Hasil Validasi Kelengkapan Dokumen */}
          {validationResult && (
            <div
              className={`rounded-2xl p-4 text-xs space-y-2 border ${
                validationResult.valid
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  {validationResult.valid ? (
                    <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
                  ) : (
                    <WarningCircle size={16} className="text-amber-600 dark:text-amber-400" weight="fill" />
                  )}
                  <span>
                    {validationResult.valid
                      ? 'Validasi Berhasil: Dokumen LHPP Lengkap & Memenuhi Standar Kemnaker'
                      : `Validasi Kelengkapan: Ditemukan ${validationResult.missingFields?.length || 0} Data Belum Lengkap`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setValidationResult(null)}
                  className="text-[11px] opacity-70 hover:opacity-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {!validationResult.valid && (validationResult.missingFields || []).length > 0 && (
                <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90 pl-1">
                  {validationResult.missingFields.map((field, idx) => (
                    <li key={idx}>{field}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {returnMode && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-300">
                  Catatan Perbaikan untuk Ahli K3 *
                </label>
                <p className="text-[11px] text-rose-800/90 dark:text-rose-400/90 mt-0.5">
                  Jelaskan data atau kesimpulan yang harus diperbaiki. Unit alat akan kembali ke tahap
                  revisi dan dokumen tidak dapat difinalisasi sampai Ahli K3 mengajukannya kembali.
                </p>
              </div>
              <textarea
                rows={3}
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                placeholder="Contoh: Kesimpulan unit Overhead Crane seharusnya TIDAK MEMENUHI SYARAT karena temuan limit switch tidak berfungsi."
                className="w-full rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
              {returnError && (
                <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">{returnError}</p>
              )}
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setReturnMode(false);
                    setReturnError('');
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={submitting || returnNote.trim().length < 10}
                  loading={submitting}
                  onClick={submitReturn}
                >
                  Kembalikan ke Ahli K3
                </Button>
              </div>
            </div>
          )}

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
              <span className="w-2 h-2 rounded-full bg-blue-500" />
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

