import { CheckCircle, Eye, FloppyDisk } from '@phosphor-icons/react';
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
  onPreviewPdf
}) {
  const inspection = activeDetail.inspection;

  return (
    <div className="space-y-4">
      {/* Header Status & Indikator Autosave */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
        <span className="font-bold text-slate-700 dark:text-slate-300">
          Lembar Pemeriksaan Teknis &amp; Pengujian Lapangan
        </span>
        <div className="flex items-center gap-1.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
          {lastSavedAt ? (
            <>
              <CheckCircle size={14} weight="bold" className="text-emerald-500 shrink-0" />
              <span>
                Tersimpan otomatis pukul{' '}
                {lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          ) : (
            <>
              <FloppyDisk size={14} className="text-slate-400 shrink-0" />
              <span>Autosave aktif</span>
            </>
          )}
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
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

      {/* Banner Selesai & Dokumen Resmi */}
      {inspection.status === 'TERKIRIM' && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">Riksa Uji Selesai &amp; Dokumen Diterbitkan</p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                Formulir inspeksi telah diverifikasi dan terkunci secara resmi. Dokumen BAP ({inspection.bap_no || 'Telah Terbit'}) dan LHPP ({inspection.lhpp_no || 'Telah Terbit'}) siap diunduh.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {inspection.bap_id && (
              <button
                type="button"
                onClick={() =>
                  onPreviewPdf(
                    `/bap/${inspection.bap_id}/pdf`,
                    `Pratinjau Berita Acara Pemeriksaan (BAP) - ${inspection.bap_no || 'BAP'}`,
                    `${(inspection.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] shadow-xs cursor-pointer"
              >
                <Eye size={14} weight="bold" />
                <span>Review BAP (PDF)</span>
              </button>
            )}
            {inspection.lhpp_id && (
              <button
                type="button"
                onClick={() =>
                  onPreviewPdf(
                    `/lhpp/${inspection.lhpp_id}/pdf`,
                    `Pratinjau Laporan Hasil Pemeriksaan (LHPP) - ${inspection.lhpp_no || 'LHPP'}`,
                    `${(inspection.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold hover:bg-slate-900 shadow-xs cursor-pointer"
              >
                <Eye size={14} weight="bold" />
                <span>Review LHPP (PDF)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ringkasan PO, Jadwal & Lokasi Pelaksanaan */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs">
        <div className="space-y-1">
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
    </div>
  );
}
