import {
  ArrowLeft,
  ArrowRight,
  Camera,
  FloppyDisk,
  Image as ImageIcon,
  Plus,
  Trash,
  Warning,
  X
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
  const QUICK_CAPTION_TAGS = [
    'Nameplate & Spesifikasi Alat',
    'Kondisi Fisik Keseluruhan',
    'Pengujian Fungsi / Beban',
    'Perangkat Pengaman (Safety Device)',
    'Temuan Ketidaksesuaian'
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Bagian 1: Foto Dokumentasi Hasil Riksa Uji */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
              <Camera size={18} weight="bold" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Foto Dokumentasi Lapangan ({photos.length} Foto)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wajib minimal 2 foto dokumentasi (Nameplate &amp; Fisik Unit)
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full self-start sm:self-auto ${
              photos.length >= 2
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {photos.length >= 2 ? '✓ Kuota Foto Terpenuhi' : 'Kurang Foto Dokumentasi'}
          </span>
        </div>

        {/* Grid Foto Responsif */}
        {photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {photos.map((ph) => (
              <div
                key={ph.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 overflow-hidden shadow-2xs flex flex-col justify-between"
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
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-all shadow-xs cursor-pointer active:scale-95"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  )}
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">
                    {ph.caption || ph.originalName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <Camera size={32} className="mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Belum ada foto dokumentasi terlampir.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Gunakan form di bawah untuk mengambil foto langsung dari kamera HP atau memilih dari galeri.
            </p>
          </div>
        )}

        {/* Form Upload Foto Tambahan (Mobile Card View) */}
        {isInspector && status === 'DRAF' && (
          <form
            onSubmit={onUploadPhoto}
            className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                Tambah Foto Dokumentasi
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Kamera HP / Galeri</span>
            </div>

            {/* Tombol Ambil/Pilih Foto */}
            {!photoFile ? (
              <label className="flex items-center justify-center gap-2 w-full min-h-12 py-3 px-4 rounded-xl border border-dashed border-[#C81E1E]/40 dark:border-red-500/40 bg-white dark:bg-slate-900 hover:bg-rose-50/30 text-slate-700 dark:text-slate-200 cursor-pointer transition-all active:scale-[0.99] shadow-2xs">
                <Camera size={20} className="text-[#C81E1E]" weight="bold" />
                <span className="text-xs font-bold">Ambil Foto dari Kamera / Pilih Galeri</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPhotoFile(f);
                  }}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[#C81E1E] shrink-0">
                    <ImageIcon size={22} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {photoFile.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(photoFile.size / 1024).toFixed(0)} KB · Siap diunggah
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoFile(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Ganti foto"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            )}

            {/* Input Keterangan Foto & Quick Tags */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Keterangan / Label Foto *
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Contoh: Nameplate alat, kondisi fisik, uji beban..."
                className="w-full min-h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20"
              />

              {/* Tag Rekomendasi Cepat */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_CAPTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setPhotoCaption(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
                      photoCaption === tag
                        ? 'bg-[#C81E1E] text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Simpan Foto */}
            <button
              type="submit"
              disabled={submitting || !photoFile}
              className="w-full min-h-11 rounded-xl bg-[#C81E1E] hover:bg-[#a61717] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} weight="bold" />
              <span>{submitting ? 'Mengunggah Foto...' : 'Simpan Foto ke Lembar Kerja'}</span>
            </button>
          </form>
        )}
      </div>

      {/* Bagian 2: Temuan Lapangan & Rekomendasi Perbaikan */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Warning size={18} weight="bold" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
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

      {/* Tombol Navigasi Bawah Langkah 1 */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
            >
              <ArrowLeft size={16} weight="bold" />
              <span>Kembali</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isInspector && status === 'DRAF' && (
            <button
              type="button"
              disabled={submitting}
              onClick={onSaveDraft}
              className="min-h-11 flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
            >
              <FloppyDisk size={16} />
              <span>Simpan Draf</span>
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              className="min-h-11 flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-[#C81E1E] hover:bg-[#a61717] px-6 py-2.5 text-xs font-bold text-white shadow-xs cursor-pointer active:scale-[0.98] transition-all"
            >
              <span>Lanjut: Kesimpulan &amp; Tanda Tangan</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

