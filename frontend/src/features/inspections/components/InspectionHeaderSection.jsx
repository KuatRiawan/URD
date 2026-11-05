import { useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowSquareOut,
  ArrowUUpLeft,
  CaretDown,
  CaretUp,
  CheckCircle,
  FileText,
  FloppyDisk,
  LockKey,
  QrCode,
  WarningCircle,
  WarningOctagon
} from '@phosphor-icons/react';
import { Notice } from '../../../components/ui/Notice.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatDateTime } from '../../../lib/utils/format.js';

export function InspectionHeaderSection({
  activeDetail,
  lastSavedAt,
  error,
  setError,
  feedback,
  setFeedback,
  isInspector,
  user,
  online,
  queuedPhotoCount,
  onPreviewPdf,
  onDiscardDraft,
  onReopenInspection,
  totalItems = 0,
  evaluatedItems = 0,
  missingItems = 0,
  photosCount = 0,
  inspectorSig,
  clientSig,
  draftResults = {},
  draftObjectAttributes = {},
  draftConclusion = '',
  setFormStep
}) {
  const inspection = activeDetail.inspection;
  const isFinal = inspection.status === 'TERKIRIM';
  const isAdminKantor = ['ADMIN_KANTOR', 'ADMIN_SISTEM', 'PIMPINAN'].includes(user?.role);

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  const [revisionSectionInput, setRevisionSectionInput] = useState('Checklist & Pengukuran');
  const [submittingReopen, setSubmittingReopen] = useState(false);
  const [showFullRevisionHistory, setShowFullRevisionHistory] = useState(false);

  const REVISION_SECTIONS = [
    'Checklist & Pengukuran',
    'Spesifikasi Teknis / Nameplate',
    'Dokumentasi Foto Lapangan',
    'Temuan & Rekomendasi K3',
    'Kesimpulan & Tanda Tangan'
  ];

  const QUICK_REVISION_TEMPLATES = [
    'Foto nameplate atau gauge alat tidak terbaca jelas',
    'Nilai hasil pengukuran teknis belum lengkap',
    'Catatan temuan belum mencantumkan klausul regulasi K3',
    'Koreksi spesifikasi kapasitas atau nomor seri alat'
  ];

  // Hitung indikator QC untuk panel kelengkapan
  const itemsList = activeDetail.items || [];
  let nonCompliantCount = 0;
  let outOfBoundsCount = 0;
  for (const item of itemsList) {
    const r = draftResults[item.id];
    if (!r) continue;
    if (r.choiceValue === 'TIDAK_SESUAI') nonCompliantCount += 1;
    if (item.input_type === 'NUMBER' && r.numberValue !== '' && r.numberValue !== null && r.numberValue !== undefined) {
      const num = Number(r.numberValue);
      if (!Number.isNaN(num)) {
        if (item.min_value !== null && item.min_value !== undefined && num < Number(item.min_value)) {
          outOfBoundsCount += 1;
        } else if (item.max_value !== null && item.max_value !== undefined && num > Number(item.max_value)) {
          outOfBoundsCount += 1;
        }
      }
    }
  }

  const attrSchema = Array.isArray(inspection.attribute_schema) ? inspection.attribute_schema : [];
  const filledAttrsCount = attrSchema.length
    ? attrSchema.filter((f) => {
        const val = draftObjectAttributes?.[f.key];
        return val !== undefined && val !== null && String(val).trim() !== '';
      }).length
    : Object.values(draftObjectAttributes || {}).filter(
        (v) => v !== undefined && v !== null && String(v).trim() !== ''
      ).length;
  const findingsList = activeDetail.findings || [];
  const criticalOrMajorFindings = findingsList.filter((f) =>
    ['KRITIS', 'MAYOR'].includes(f.severity)
  ).length;
  const hasBothSignatures = Boolean(inspectorSig && clientSig);

  const handleConfirmReopen = async (e) => {
    e?.preventDefault();
    if (!revisionReasonInput.trim() || !onReopenInspection) return;
    setSubmittingReopen(true);
    try {
      await onReopenInspection(revisionReasonInput.trim(), revisionSectionInput);
      setRevisionModalOpen(false);
      setRevisionReasonInput('');
    } finally {
      setSubmittingReopen(false);
    }
  };

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
      {activeDetail.revisions?.length > 0 && (
        <div className="rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3.5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold text-xs">
              <WarningCircle size={16} weight="bold" />
              <span>
                Catatan Revisi dari QC / Admin Kantor (Revisi #{activeDetail.revisions[0].revision_no}):
              </span>
            </div>
            {isFinal && (isInspector || isAdminKantor) && (
              <button
                type="button"
                onClick={() => {
                  setRevisionReasonInput(activeDetail.revisions[0].reason || '');
                  setRevisionModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717] active:scale-95 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <ArrowUUpLeft size={14} weight="bold" />
                <span>Buka Kunci untuk Revisi</span>
              </button>
            )}
          </div>
          <p className="text-xs text-rose-900 dark:text-rose-200 pl-5 leading-relaxed font-medium">
            {activeDetail.revisions[0].reason}
          </p>

          {activeDetail.revisions.length > 1 && (
            <div className="pt-2 border-t border-rose-200 dark:border-rose-900/60">
              <button
                type="button"
                onClick={() => setShowFullRevisionHistory(!showFullRevisionHistory)}
                className="text-[11px] font-bold text-rose-700 dark:text-rose-400 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
              >
                {showFullRevisionHistory ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
                <span>
                  {showFullRevisionHistory ? 'Sembunyikan Riwayat Revisi' : `Lihat Riwayat Revisi Sebelumnya (${activeDetail.revisions.length - 1})`}
                </span>
              </button>

              {showFullRevisionHistory && (
                <div className="mt-2 space-y-2 pl-3 border-l-2 border-rose-300 dark:border-rose-800">
                  {activeDetail.revisions.slice(1).map((rev) => (
                    <div key={rev.id || rev.revision_no} className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between font-semibold text-rose-800 dark:text-rose-300">
                        <span>Revisi #{rev.revision_no}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {rev.created_at ? formatDateTime(rev.created_at) : ''}
                        </span>
                      </div>
                      <p className="italic text-slate-600 dark:text-slate-400">
                        &quot;{rev.reason}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Jika belum ada revisi tercatat dan status sudah TERKIRIM, izinkan Admin Kantor atau Ahli K3 untuk membuka revisi */}
      {isFinal && (!activeDetail.revisions || activeDetail.revisions.length === 0) && (isInspector || isAdminKantor) && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <WarningCircle size={16} className="text-amber-500" />
            <span>Hasil pemeriksaan telah diserahkan. Perlu koreksi data teknis atau foto?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setRevisionReasonInput('');
              setRevisionModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:border-[#C81E1E] hover:text-[#C81E1E] active:scale-95 transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1.5 shrink-0"
          >
            <ArrowUUpLeft size={13} weight="bold" />
            <span>{isAdminKantor ? 'Minta Revisi Lapangan (QC)' : 'Buka Kunci untuk Revisi'}</span>
          </button>
        </div>
      )}
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
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewPdf(
                        `/lhpp/${inspection.lhpp_id}/pdf`,
                        `Pratinjau LHPP - ${inspection.lhpp_no || 'LHPP'}`,
                        `${(inspection.lhpp_no || 'LHPP').replace(/[/\s]/g, '-')}.pdf`
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                  >
                    Buka PDF
                  </button>
                  {isAdminKantor && (
                    <Link
                      to={`/app/lhpp?lhppId=${inspection.lhpp_id}`}
                      className="px-2.5 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-2xs inline-flex items-center gap-1"
                      title="Buka Ruang Kerja QC LHPP"
                    >
                      <span>QC</span>
                      <ArrowSquareOut size={13} weight="bold" />
                    </Link>
                  )}
                </div>
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
          {inspection.inspector_name && (
            <span>
              {' '}
              · Ahli K3 / Inspector: <strong className="text-slate-900 dark:text-white">{inspection.inspector_name}</strong>
            </span>
          )}
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

      {/* Panel Ringkasan Kelengkapan & QC Hasil Inspeksi */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-extrabold text-slate-900 dark:text-white">
            Ringkasan Kelengkapan &amp; Validasi QC Data Teknis
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Klik kartu untuk menuju bagian pemeriksaan terkait
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* 1. Checklist */}
          <button
            type="button"
            onClick={() => setFormStep?.(1)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. Checklist</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  missingItems === 0 && nonCompliantCount === 0 && outOfBoundsCount === 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : missingItems > 0
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {missingItems === 0 ? 'Lengkap' : `${missingItems} Kosong`}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {evaluatedItems}/{totalItems} Parameter
            </p>
            {(nonCompliantCount > 0 || outOfBoundsCount > 0) && (
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                {nonCompliantCount > 0 ? `${nonCompliantCount} Tidak Sesuai` : ''}
                {nonCompliantCount > 0 && outOfBoundsCount > 0 ? ' · ' : ''}
                {outOfBoundsCount > 0 ? `${outOfBoundsCount} Di Luar Ambang` : ''}
              </p>
            )}
          </button>

          {/* 2. Spesifikasi & Nameplate */}
          <button
            type="button"
            onClick={() => setFormStep?.(1)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2. Spesifikasi</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  filledAttrsCount > 0
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {filledAttrsCount > 0 ? 'Terisi' : 'Perlu Cek'}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {attrSchema.length > 0 ? `${filledAttrsCount}/${attrSchema.length} Atribut` : `${filledAttrsCount} Atribut`}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              SN: {inspection.serial_number || '-'}
            </p>
          </button>

          {/* 3. Dokumentasi Foto */}
          <button
            type="button"
            onClick={() => setFormStep?.(1)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3. Foto Bukti</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  photosCount >= 2
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {photosCount >= 2 ? 'Memenuhi' : 'Kurang (<2)'}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {photosCount} Foto Terunggah
            </p>
            <p className="text-[10px] text-slate-500">Kuota wajib min. 2 foto</p>
          </button>

          {/* 4. Temuan & Rekomendasi */}
          <button
            type="button"
            onClick={() => setFormStep?.(1)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 transition-colors cursor-pointer space-y-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">4. Temuan K3</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  criticalOrMajorFindings > 0
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {findingsList.length === 0 ? 'Nihil' : `${findingsList.length} Catatan`}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white">
              {findingsList.length} Temuan Lapangan
            </p>
            <p className="text-[10px] text-slate-500">
              {criticalOrMajorFindings > 0 ? `${criticalOrMajorFindings} Mayor/Kritis` : 'Sesuai pemeriksaan'}
            </p>
          </button>

          {/* 5. Kesimpulan & TTD */}
          <button
            type="button"
            onClick={() => setFormStep?.(2)}
            className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 transition-colors cursor-pointer space-y-1 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">5. TTD &amp; Hasil</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                  hasBothSignatures && draftConclusion
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {hasBothSignatures && draftConclusion ? 'Sah' : 'Belum Lengkap'}
              </span>
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {draftConclusion ? draftConclusion.replaceAll('_', ' ') : 'Belum Ditetapkan'}
            </p>
            <p className="text-[10px] text-slate-500">
              TTD: {inspectorSig ? 'Ahli K3 ✓' : 'Ahli K3 ✗'} · {clientSig ? 'Klien ✓' : 'Klien ✗'}
            </p>
          </button>
        </div>
      </div>

      {/* Modal Permintaan Revisi / Buka Kunci Form */}
      <Modal
        open={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        title={isAdminKantor ? 'Permintaan Revisi Hasil Lapangan (QC)' : 'Buka Kunci Form untuk Revisi'}
        size="md"
      >
        <form onSubmit={handleConfirmReopen} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Form pemeriksaan teknis untuk unit <strong>{inspection.object_name}</strong> akan dikembalikan ke status <strong>DRAF</strong> agar Ahli K3 dapat merevisi checklist, mengunggah ulang foto, atau menyesuaikan data teknis di lapangan. Revisi pada unit ini tidak memblokir progres unit lain di PO yang sama.
          </p>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Bagian yang Memerlukan Perbaikan:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REVISION_SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setRevisionSectionInput(sec)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                    revisionSectionInput === sec
                      ? 'border-[#C81E1E] bg-rose-50 text-[#C81E1E] dark:bg-rose-950/50 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Catatan Revisi / Alasan Pengembalian:
            </label>
            <textarea
              rows={3}
              required
              value={revisionReasonInput}
              onChange={(e) => setRevisionReasonInput(e.target.value)}
              placeholder="Contoh: Foto nameplate blur, mohon ambil foto ulang dengan pencahayaan cukup dan nomor seri terbaca jelas."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Template Catatan Cepat:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REVISION_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setRevisionReasonInput(tpl)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-left"
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRevisionModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submittingReopen || !revisionReasonInput.trim()}
              className="px-4 py-2 rounded-xl bg-[#C81E1E] text-white font-bold hover:bg-[#a61717] disabled:opacity-50 cursor-pointer shadow-xs transition-all"
            >
              {submittingReopen ? 'Memproses...' : 'Kirim Catatan & Buka Revisi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

