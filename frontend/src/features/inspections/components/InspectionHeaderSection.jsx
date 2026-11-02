import { CheckCircle, FileText, FloppyDisk, LockKey, QrCode, WarningOctagon } from '@phosphor-icons/react';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function InspectionHeaderSection({
  activeDetail,
  lastSavedAt,
  error,
  setError,
  feedback,
  setFeedback,
  isInspector,
  online,
  queuedPhotoCount,
  onPreviewPdf,
  onDiscardDraft
}) {
  const inspection = activeDetail.inspection;
  const isFinal = inspection.status === 'TERKIRIM';

  return (
    <div className="space-y-3.5">
      {/* Header Status & Indikator */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Lembar Pemeriksaan Teknis Lapangan
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
          {isFinal ? (
            <>
              <LockKey size={13} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Terkunci (Final)</span>
            </>
          ) : lastSavedAt ? (
            <>
              <CheckCircle size={13} weight="bold" className="text-emerald-500 shrink-0" />
              <span>
                Tersimpan {lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : (
            <>
              <FloppyDisk size={13} className="text-slate-400 shrink-0" />
              <span>Autosave aktif</span>
            </>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{feedback}</span>
            {onDiscardDraft && isInspector && !isFinal && feedback.includes('dipulihkan') && (
              <button
                type="button"
                onClick={onDiscardDraft}
                className="text-xs font-bold underline hover:text-emerald-950 dark:hover:text-emerald-100 cursor-pointer self-start sm:self-auto shrink-0"
              >
                Mulai ulang dari awal
              </button>
            )}
          </div>
        </Notice>
      )}
      {isInspector && !online && (
        <Notice tone="warning" title="Anda sedang offline">
          Isian form disimpan otomatis di perangkat. Foto yang diambil akan masuk antrean dan
          dikirim saat sinyal kembali.
        </Notice>
      )}
      {isInspector && queuedPhotoCount > 0 && (
        <Notice tone="info">
          {queuedPhotoCount} foto menunggu dikirim ke server
          {online ? ' (sedang dikirim).' : '.'}
        </Notice>
      )}

      {/* Dokumen Resmi Riksa Uji (React-Native-UI-Templates Clean Document Bar) */}
      {isFinal && (
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Dokumen Resmi Riksa Uji
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Terverifikasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Kartu Dokumen BAP */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] flex items-center justify-center shrink-0">
                  <FileText size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Berita Acara (BAP)
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {inspection.bap_no || 'Telah Terbit'}
                  </p>
                </div>
              </div>
              {inspection.bap_id ? (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewPdf(
                      `/bap/${inspection.bap_id}/pdf`,
                      `Pratinjau BAP - ${inspection.bap_no || 'BAP'}`,
                      `${(inspection.bap_no || 'BAP').replace(/[/\s]/g, '-')}.pdf`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  Buka PDF
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Siap Cetak</span>
              )}
            </div>

            {/* Kartu Dokumen LHPP */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <FileText size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Laporan Hasil (LHPP)
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 truncate">
                    {inspection.lhpp_no || 'Telah Terbit'}
                  </p>
                </div>
              </div>
              {inspection.lhpp_id ? (
                <button
                  type="button"
                  onClick={() =>
                    onPreviewPdf(
                      `/lhpp/${inspection.lhpp_id}/pdf`,
                      `Pratinjau LHPP - ${inspection.lhpp_no || 'LHPP'}`,
                      `${(inspection.lhpp_no || 'LHPP').replace(/[/\s]/g, '-')}.pdf`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-2xs"
                >
                  Buka PDF
                </button>
              ) : (
                <span className="text-[11px] text-slate-400">Siap Cetak</span>
              )}
            </div>

            {/* Kartu Lembar Rekomendasi K3 */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <WarningOctagon size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Rekomendasi K3
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Temuan &amp; Tindakan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onPreviewPdf(
                    `/inspections/${inspection.id}/recommendation-letter.pdf`,
                    `Lembar Rekomendasi K3 - ${inspection.object_name}`,
                    `Rekomendasi-K3-${(inspection.serial_number || inspection.id).replace(/[/\s]/g, '-')}.pdf`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                Buka PDF
              </button>
            </div>

            {/* Kartu Stiker Label QR */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
              <div className="min-w-0 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <QrCode size={18} weight="bold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    Stiker QR Alat
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Label Siap Cetak
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  onPreviewPdf(
                    `/objects/${inspection.object_id}/qr-sticker.pdf`,
                    `Stiker QR Alat - ${inspection.object_name}`,
                    `Stiker-QR-${(inspection.serial_number || inspection.object_id).replace(/[/\s]/g, '-')}.pdf`
                  )
                }
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                Buka PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan PO, Jadwal & Lokasi Pelaksanaan */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 text-xs space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
            PO: {inspection.po_number || inspection.order_no}
          </span>
          <span>·</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {inspection.client_name}
          </span>
          <span>·</span>
          <span className="text-slate-500 dark:text-slate-400">
            Lokasi:{' '}
            {inspection.location_name ||
              inspection.install_location ||
              inspection.client_address ||
              '-'}
          </span>
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          Jadwal Pelaksanaan:{' '}
          <strong className="text-slate-900 dark:text-white">
            {inspection.schedule_start_at
              ? formatDateTime(inspection.schedule_start_at)
              : 'Sesuai Penugasan'}
          </strong>
          {inspection.contact_name && (
            <span>
              {' '}
              · Kontak PIC: {inspection.contact_name} (
              {inspection.contact_phone || '-'})
            </span>
          )}
        </div>
        {(inspection.order_notes || inspection.schedule_notes) && (
          <div className="text-slate-700 dark:text-slate-300 font-medium">
            Detail Pekerjaan:{' '}
            {inspection.schedule_notes || inspection.order_notes}
          </div>
        )}
      </div>
    </div>
  );
}

