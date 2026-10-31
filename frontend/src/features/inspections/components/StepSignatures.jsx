import {
  ArrowLeft,
  CheckCircle,
  CircleNotch,
  Eye,
  FloppyDisk,
  PaperPlaneTilt,
  Signature
} from '@phosphor-icons/react';
import { CONCLUSION_LABELS } from '../../../lib/utils/format.js';

export function StepSignatures({
  inspectorSig,
  clientSig,
  inspectorSigName,
  setInspectorSigName,
  inspectorSigTitle,
  setInspectorSigTitle,
  clientSigName,
  setClientSigName,
  clientSigTitle,
  setClientSigTitle,
  inspectorCanvasRef,
  clientCanvasRef,
  onInspectorPointerDown,
  onInspectorPointerMove,
  onInspectorPointerUp,
  onClientPointerDown,
  onClientPointerMove,
  onClientPointerUp,
  onClearInspectorCanvas,
  onClearClientCanvas,
  onSaveInspectorSignature,
  onSaveClientSignature,
  reSigningInspector,
  setReSigningInspector,
  reSigningClient,
  setReSigningClient,
  savingInspector = false,
  savingClient = false,
  sigErrorInspector = '',
  sigErrorClient = '',
  sigFeedbackInspector = '',
  sigFeedbackClient = '',
  isInspector,
  status,
  submitting,
  canSubmit,
  missingItems,
  evaluatedItems,
  totalItems,
  photosCount,
  draftConclusion,
  onAutoFillStandard,
  onSubmitFinal,
  onBack,
  onSaveDraft,
  onCloseModal,
}) {
  return (
    <div className="space-y-5">
      {/* Bagian 1: Kolom Dua Tanda Tangan Digital (Inspector & PIC Klien) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TTD 1: Ahli K3 / Inspector */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Signature size={16} weight="bold" className="text-[#C81E1E]" />
                <span>1. Ahli K3 / Inspector (Wajib)</span>
              </h4>
              {inspectorSig ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle size={12} weight="bold" /> Sudah TTD
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  Wajib Ditandatangani
                </span>
              )}
            </div>

            {inspectorSig && !reSigningInspector ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                  <div className="h-24 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-700 p-2">
                    <img
                      src={`/api/v1/dashboard/files/${inspectorSig.file_id}`}
                      alt="Tanda Tangan Inspector"
                      className="h-full max-h-20 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {inspectorSig.signer_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {inspectorSig.signer_title || 'Ahli K3 Spesialis'}
                  </div>
                </div>
                {isInspector && status === 'DRAF' && (
                  <button
                    type="button"
                    onClick={() => setReSigningInspector(true)}
                    className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Tanda Tangan Ulang
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Ahli K3 *
                    </label>
                    <input
                      type="text"
                      disabled={!isInspector || status !== 'DRAF'}
                      value={inspectorSigName}
                      onChange={(e) => setInspectorSigName(e.target.value)}
                      placeholder="Nama lengkap Ahli K3..."
                      className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      disabled={!isInspector || status !== 'DRAF'}
                      value={inspectorSigTitle}
                      onChange={(e) => setInspectorSigTitle(e.target.value)}
                      placeholder="Jabatan..."
                      className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Goreskan Tanda Tangan di Kotak:
                  </span>
                  <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center">
                    <canvas
                      ref={inspectorCanvasRef}
                      width={300}
                      height={110}
                      onPointerDown={onInspectorPointerDown}
                      onPointerMove={onInspectorPointerMove}
                      onPointerUp={onInspectorPointerUp}
                      onPointerLeave={onInspectorPointerUp}
                      className="cursor-crosshair touch-none w-full max-w-[300px] h-[110px]"
                    />
                  </div>
                </div>

                {/* Inline Error & Feedback Ahli K3 */}
                {sigErrorInspector && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {sigErrorInspector}
                  </div>
                )}
                {sigFeedbackInspector && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
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
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        Bersihkan
                      </button>
                      {reSigningInspector && (
                        <button
                          type="button"
                          onClick={() => setReSigningInspector(false)}
                          disabled={savingInspector || submitting}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={savingInspector || submitting}
                      onClick={onSaveInspectorSignature}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {savingInspector && <CircleNotch size={14} weight="bold" className="animate-spin" />}
                      <span>{savingInspector ? 'Menyimpan...' : 'Simpan TTD Ahli K3'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TTD 2: Perwakilan Perusahaan / PIC Klien */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Signature size={16} weight="bold" className="text-blue-600" />
                <span>2. Perwakilan Perusahaan / PIC Klien</span>
              </h4>
              {clientSig ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle size={12} weight="bold" /> Sudah TTD
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Dapat Dilengkapi di Lapangan
                </span>
              )}
            </div>

            {clientSig && !reSigningClient ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-center space-y-2">
                  <div className="h-24 flex items-center justify-center bg-white dark:bg-slate-900 rounded border border-dashed border-slate-200 dark:border-slate-700 p-2">
                    <img
                      src={`/api/v1/dashboard/files/${clientSig.file_id}`}
                      alt="Tanda Tangan PIC Klien"
                      className="h-full max-h-20 object-contain mx-auto"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {clientSig.signer_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {clientSig.signer_title || 'Perwakilan Klien / Pemilik Alat'}
                  </div>
                </div>
                {isInspector && status === 'DRAF' && (
                  <button
                    type="button"
                    onClick={() => setReSigningClient(true)}
                    className="w-full py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Tanda Tangan Ulang
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama PIC Klien
                    </label>
                    <input
                      type="text"
                      disabled={!isInspector || status !== 'DRAF'}
                      value={clientSigName}
                      onChange={(e) => setClientSigName(e.target.value)}
                      placeholder="Nama penanggung jawab..."
                      className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      disabled={!isInspector || status !== 'DRAF'}
                      value={clientSigTitle}
                      onChange={(e) => setClientSigTitle(e.target.value)}
                      placeholder="Jabatan..."
                      className="w-full min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Goreskan Tanda Tangan PIC Klien di Kotak:
                  </span>
                  <div className="rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white overflow-hidden p-1 flex justify-center">
                    <canvas
                      ref={clientCanvasRef}
                      width={300}
                      height={110}
                      onPointerDown={onClientPointerDown}
                      onPointerMove={onClientPointerMove}
                      onPointerUp={onClientPointerUp}
                      onPointerLeave={onClientPointerUp}
                      className="cursor-crosshair touch-none w-full max-w-[300px] h-[110px]"
                    />
                  </div>
                </div>

                {/* Inline Error & Feedback PIC Klien */}
                {sigErrorClient && (
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {sigErrorClient}
                  </div>
                )}
                {sigFeedbackClient && (
                  <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle size={14} weight="bold" />
                    <span>{sigFeedbackClient}</span>
                  </div>
                )}

                {isInspector && status === 'DRAF' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={onClearClientCanvas}
                        disabled={savingClient || submitting}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                      >
                        Bersihkan
                      </button>
                      {reSigningClient && (
                        <button
                          type="button"
                          onClick={() => setReSigningClient(false)}
                          disabled={savingClient || submitting}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                        >
                          Batal
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={savingClient || submitting}
                      onClick={onSaveClientSignature}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white font-bold text-xs hover:bg-blue-800 cursor-pointer shadow-xs flex items-center gap-1.5 disabled:opacity-60"
                    >
                      {savingClient && <CircleNotch size={14} weight="bold" className="animate-spin" />}
                      <span>{savingClient ? 'Menyimpan...' : 'Simpan TTD Klien'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bagian 2: Ringkasan Kesiapan Penerbitan Dokumen (Hanya saat pengisian form sebelum kirim) */}
      {status !== 'TERKIRIM' && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Kesiapan Penerbitan Dokumen (BAP &amp; LHPP)
            </span>
            <span
              className={`text-xs font-bold ${
                canSubmit
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {canSubmit ? '✓ Siap Diterbitkan' : 'Memerlukan Kelengkapan'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Checklist Uji</span>
              <span
                className={`font-bold ${
                  missingItems === 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {evaluatedItems}/{totalItems} Butir Terisi
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Foto Dokumentasi</span>
              <span
                className={`font-bold ${
                  photosCount >= 2 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {photosCount} Foto Terlampir
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">TTD Ahli K3</span>
              <span
                className={`font-bold ${
                  inspectorSig ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {inspectorSig ? 'Sudah TTD' : 'Belum TTD (Wajib)'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Kesimpulan Akhir</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">
                {CONCLUSION_LABELS[draftConclusion] || draftConclusion}
              </span>
            </div>
          </div>

          {missingItems > 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Perhatian: Masih ada {missingItems} butir checklist yang belum terisi di Langkah 1.
              </span>
              <button
                type="button"
                onClick={onAutoFillStandard}
                className="px-3 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer transition-colors"
              >
                Tandai Semua Sesuai Standar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tombol Aksi Akhir */}
      {status === 'TERKIRIM' ? (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="min-h-11 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Kembali ke Ceklist &amp; Foto</span>
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
            className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 cursor-pointer shadow-2xs"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>Kembali ke Ceklist &amp; Foto</span>
          </button>

          <div className="flex items-center gap-2">
            {isInspector && (
              <button
                type="button"
                disabled={submitting}
                onClick={onSaveDraft}
                className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
              >
                <FloppyDisk size={15} />
                <span>Simpan Draf</span>
              </button>
            )}
            <button
              type="button"
              disabled={!canSubmit || submitting}
              onClick={onSubmitFinal}
              title={
                missingItems > 0
                  ? `Lengkapi ${missingItems} butir wajib terlebih dahulu`
                  : !inspectorSig
                  ? 'Bubuhkan tanda tangan Ahli K3 terlebih dahulu'
                  : !clientSig
                  ? 'Minta perwakilan klien membubuhkan tanda tangan terlebih dahulu'
                  : !draftConclusion
                  ? 'Pilih kesimpulan pemeriksaan terlebih dahulu'
                  : 'Kirim dan terbitkan dokumen resmi BAP & LHPP'
              }
              className="min-h-10 px-5 py-2 rounded-lg bg-[#C81E1E] text-white font-bold text-xs hover:bg-[#a61717] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <CircleNotch size={15} weight="bold" className="animate-spin" />
              ) : (
                <PaperPlaneTilt size={15} weight="bold" />
              )}
              <span>
                {submitting
                  ? 'Memproses Penerbitan BAP & LHPP...'
                  : missingItems > 0
                  ? `Lengkapi ${missingItems} Butir Terlebih Dahulu`
                  : !inspectorSig
                  ? 'Tanda Tangan Ahli K3 Diperlukan'
                  : 'Konfirmasi & Terbitkan BAP dan LHPP'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

