import {
  ArrowLeft,
  ArrowRight,
  Camera,
  FloppyDisk,
  Plus,
  Trash,
  Warning
} from '@phosphor-icons/react';

export function StepPhotosFindings({
  photos = [],
  findings = [],
  photoFile,
  setPhotoFile,
  photoCaption,
  setPhotoCaption,
  findingForm,
  setFindingForm,
  isInspector,
  status,
  submitting,
  onUploadPhoto,
  onDeletePhoto,
  onAddFinding,
  onSaveDraft,
  onBack,
  onNext
}) {
  return (
    <div className="space-y-5">
      {/* Bagian 1: Foto Dokumentasi Hasil Riksa Uji */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
              <Camera size={18} weight="bold" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Lampiran Foto Lapangan ({photos.length} Foto)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wajib melampirkan minimal 2 foto dokumentasi (Nameplate &amp; Fisik Alat)
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            photos.length >= 2
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          }`}>
            {photos.length >= 2 ? '✓ Kuota Foto Terpenuhi' : 'Kurang Foto Dokumentasi'}
          </span>
        </div>

        {/* Grid Foto Responsif */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((ph) => (
              <div
                key={ph.id}
                className="group relative rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 overflow-hidden shadow-2xs flex flex-col justify-between"
              >
                <div className="relative aspect-4/3 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <img
                    src={`/api/v1/dashboard/files/${ph.id}`}
                    alt={ph.caption || ph.originalName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {isInspector && status === 'DRAF' && (
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(ph.id)}
                      disabled={submitting}
                      title="Hapus foto ini"
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-all shadow-xs cursor-pointer"
                    >
                      <Trash size={13} weight="bold" />
                    </button>
                  )}
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                    {ph.caption || ph.originalName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <Camera size={32} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Belum ada foto dokumentasi terlampir.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Gunakan form upload di bawah atau tombol kamera pada parameter checklist untuk mengambil foto nameplate &amp; unit.
            </p>
          </div>
        )}

        {/* Form Upload Foto */}
        {isInspector && status === 'DRAF' && (
          <form
            onSubmit={onUploadPhoto}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="sm:col-span-5 flex flex-col gap-1.5">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
              />
              <label className="inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 sm:hidden">
                <Camera size={14} />
                <span>{photoFile ? photoFile.name : 'Ambil Foto dari Kamera'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Keterangan foto (mis: Nameplate & Kondisi Fisik)..."
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={submitting || !photoFile}
                className="w-full min-h-10 rounded-lg bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus size={14} weight="bold" />
                <span>Unggah Foto</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bagian 2: Temuan Lapangan & Rekomendasi Perbaikan */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Warning size={18} weight="bold" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Daftar Temuan Lapangan ({findings.length} Temuan)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Catat ketidaksesuaian teknis dan rekomendasi tindakan perbaikan bagi klien
              </p>
            </div>
          </div>
        </div>

        {/* List Temuan */}
        {findings.length > 0 ? (
          <div className="space-y-2">
            {findings.map((f) => (
              <div
                key={f.id}
                className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase ${
                    f.severity === 'KRITIS'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : f.severity === 'MAYOR'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {f.severity}
                  </span>
                </div>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{f.description}</p>
                {f.recommendation && (
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                    <strong className="text-slate-700 dark:text-slate-300">Rekomendasi:</strong> {f.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/40 dark:bg-slate-800/20">
            Tidak ada temuan ketidaksesuaian khusus. Unit berada dalam kondisi sesuai spesifikasi teknis K3.
          </div>
        )}

        {/* Form Tambah Temuan */}
        {isInspector && status === 'DRAF' && (
          <form onSubmit={onAddFinding} className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="sm:col-span-3">
              <select
                value={findingForm.severity}
                onChange={(e) =>
                  setFindingForm((prev) => ({ ...prev, severity: e.target.value }))
                }
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="MINOR">MINOR (Ringan)</option>
                <option value="MAYOR">MAYOR (Sedang)</option>
                <option value="KRITIS">KRITIS (Bahaya)</option>
              </select>
            </div>
            <div className="sm:col-span-4">
              <input
                type="text"
                value={findingForm.description}
                onChange={(e) =>
                  setFindingForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Uraian temuan teknis..."
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="text"
                value={findingForm.recommendation}
                onChange={(e) =>
                  setFindingForm((prev) => ({ ...prev, recommendation: e.target.value }))
                }
                placeholder="Rekomendasi tindakan..."
                className="w-full min-h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting || !findingForm.description.trim()}
                className="w-full min-h-10 rounded-lg bg-slate-800 dark:bg-slate-700 px-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-1"
              >
                <Plus size={14} weight="bold" />
                <span>Tambah</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tombol Navigasi Bawah Langkah 3 */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={15} weight="bold" />
          <span>Kembali ke Kesimpulan</span>
        </button>
        <div className="flex items-center gap-2">
          {isInspector && status === 'DRAF' && (
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
            onClick={onNext}
            className="min-h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] px-4 py-2 text-xs font-bold text-white shadow-xs cursor-pointer"
          >
            <span>Lanjut: Tanda Tangan &amp; Selesai</span>
            <ArrowRight size={15} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

