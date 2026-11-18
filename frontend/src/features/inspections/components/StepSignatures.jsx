import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  FloppyDisk,
  PaperPlaneTilt,
  SealCheck,
  Signature
} from '@phosphor-icons/react';
import { CONCLUSION_LABELS } from '../../../lib/utils/format.js';

function formatSigTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function StepSignatures({
  inspectorSig,
  inspectorSigName,
  setInspectorSigName,
  inspectorSigTitle,
  setInspectorSigTitle,
  inspectorCanvasRef,
  onInspectorPointerDown,
  onInspectorPointerMove,
  onInspectorPointerUp,
  onClearInspectorCanvas,
  onSaveInspectorSignature,
  reSigningInspector,
  setReSigningInspector,
  savingInspector = false,
  sigErrorInspector = '',
  sigFeedbackInspector = '',
  isInspector,
  status,
  submitting,
  canSubmit,
  photosCount = 0,
  draftConclusion,
  onSubmitFinal,
  onBack,
  onSaveDraft,
  onCloseModal,
  hideInlineActions = false
}) {
  const inspectorTime = formatSigTime(inspectorSig?.signed_at);

  return (
    <div className="space-y-5">
      {/* Kolom Tanda Tangan Ahli K3 / Inspector */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Signature size={18} weight="bold" className="text-[#C81E1E]" />
              <span>Pengesahan Ahli K3 Pemeriksa (Wajib)</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tanda tangan digital Ahli K3 yang melaksanakan riksa uji untuk pengajuan draf dokumen ke Admin Kantor.
            </p>
          </div>
          {inspectorSig ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle size={14} weight="fill" /> Sudah Ditandatangani
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
              Wajib Ditandatangani
            </span>
          )}
        </div>

        {inspectorSig && !reSigningInspector ? (
          <div className="space-y-3 pt-2 animate-fade-in max-w-md">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
              <div className="h-28 flex items-center justify-center bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 p-2">
                <img
                  src={`/api/v1/dashboard/files/${inspectorSig.file_id}`}
                  alt="Tanda Tangan Inspector"
                  className="h-full max-h-24 object-contain mx-auto"
                />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {inspectorSig.signer_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {inspectorSig.signer_title || 'Ahli K3 Spesialis'}
              </div>
              {inspectorTime && (
                <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  Ditandatangani: {inspectorTime}
                </div>
              )}
            </div>
            {isInspector && status === 'DRAF' && (
              <button
                type="button"
                onClick={() => setReSigningInspector(true)}
                className="py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Ganti Tanda Tangan
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-1 max-w-lg animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Ahli K3 *
                </label>
                <input
                  type="text"
                  disabled={!isInspector || status !== 'DRAF'}
                  value={inspectorSigName}
                  onChange={(e) => setInspectorSigName(e.target.value)}
                  placeholder="Nama lengkap Ahli K3..."
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Jabatan / SKP
                </label>
                <input
                  type="text"
                  disabled={!isInspector || status !== 'DRAF'}
                  value={inspectorSigTitle}
                  onChange={(e) => setInspectorSigTitle(e.target.value)}
                  placeholder="Ahli K3 Spesialis..."
                  className="w-full min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Goreskan Tanda Tangan di Kotak Berikut:
              </span>
              <div
                style={{ touchAction: 'none' }}
                className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center shadow-inner"
              >
                <canvas
                  ref={inspectorCanvasRef}
                  width={340}
                  height={120}
                  onPointerDown={onInspectorPointerDown}
                  onPointerMove={onInspectorPointerMove}
                  onPointerUp={onInspectorPointerUp}
                  onPointerLeave={onInspectorPointerUp}
                  className="cursor-crosshair touch-none w-full max-w-[340px] h-[120px]"
                />
              </div>
            </div>

            {/* Inline Error & Feedback Ahli K3 */}
            {sigErrorInspector && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold animate-fade-in">
                {sigErrorInspector}
              </div>
            )}
            {sigFeedbackInspector && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                <CheckCircle size={14} weight="bold" />
                <span>{sigFeedbackInspector}</span>
              </div>
            )}

            {isInspector && status === 'DRAF' && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onClearInspectorCanvas}
                    disabled={savingInspector || submitting}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    Bersihkan
                  </button>
                  {reSigningInspector && (
                    <button
                      type="button"
                      onClick={() => setReSigningInspector(false)}
                      disabled={savingInspector || submitting}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                    >
                      Batal
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  disabled={savingInspector || submitting}
                  onClick={onSaveInspectorSignature}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  {savingInspector && <CircleNotch size={14} weight="bold" className="animate-spin" />}
                  <span>{savingInspector ? 'Menyimpan...' : 'Simpan TTD Ahli K3'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ringkasan Kesiapan Pengajuan Draf LHPP ke Admin Kantor */}
      {status !== 'TERKIRIM' && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Kesiapan Pengajuan Draf LHPP ke Admin Kantor
            </span>
            <span
              className={`text-xs font-bold ${
                canSubmit
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {canSubmit ? '✓ Siap Diajukan' : 'Memerlukan TTD Ahli K3'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">1. Data Umum</span>
              <span className="font-bold text-emerald-600 block mt-0.5">Terverifikasi</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">2–7. Tabel Teknis</span>
              <span className="font-bold text-blue-600 block mt-0.5">Siap di Word (.docx)</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">8. Foto Dokumentasi</span>
              <span
                className={`font-bold block mt-0.5 ${
                  photosCount >= 2 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {photosCount} Foto Terlampir
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">TTD Ahli K3</span>
              <span
                className={`font-bold block mt-0.5 ${
                  inspectorSig ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {inspectorSig ? 'Sudah TTD' : 'Belum TTD (Wajib)'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tombol Aksi Akhir (jika tidak disembunyikan oleh modal footer) */}
      {!hideInlineActions && (
        status === 'TERKIRIM' ? (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali ke Dokumentasi Foto</span>
            </button>

            <button
              type="button"
              onClick={onCloseModal}
              className="min-h-11 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              Tutup Formulir
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali ke Dokumentasi Foto</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isInspector && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onSaveDraft}
                  className="min-h-11 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
                >
                  <FloppyDisk size={16} />
                  <span>Simpan Draf</span>
                </button>
              )}
              <button
                type="button"
                disabled={!canSubmit || submitting}
                onClick={onSubmitFinal}
                title={
                  !inspectorSig
                    ? 'Bubuhkan tanda tangan Ahli K3 terlebih dahulu'
                    : 'Selesaikan pemeriksaan dan ajukan draf LHPP ke Admin Kantor'
                }
                className="min-h-11 flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717] transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
              >
                {submitting ? (
                  <CircleNotch size={16} weight="bold" className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={16} weight="bold" />
                )}
                <span>
                  {submitting
                    ? 'Mengajukan Draf LHPP...'
                    : !inspectorSig
                    ? 'Tanda Tangan Ahli K3 Diperlukan'
                    : 'Selesaikan & Ajukan Draf LHPP ke Admin Kantor'}
                </span>
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
