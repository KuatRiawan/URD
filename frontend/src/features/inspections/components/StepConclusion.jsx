import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle,
  FileText,
  FloppyDisk,
  SealCheck,
  WarningCircle,
  XCircle
} from '@phosphor-icons/react';

export function StepConclusion({
  draftConclusion,
  setDraftConclusion,
  draftConclusionNotes,
  setDraftConclusionNotes,
  draftScopes = [],
  setDraftScopes,
  scopeCatalog = [],
  isInspector,
  status,
  submitting,
  onSaveDraft,
  onBack,
  onNext
}) {
  const disabled = !isInspector || status !== 'DRAF';

  return (
    <div className="space-y-5">
      {/* Pilihan Kartu Visual Kesimpulan Kelayakan K3 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <SealCheck size={16} weight="bold" className="text-[#C81E1E]" />
            <span>Kesimpulan Kelayakan K3 Lapangan *</span>
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Pilih status kelaikan hasil pengujian
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              id: 'MEMENUHI_SYARAT',
              title: 'Memenuhi Syarat K3',
              desc: 'Seluruh parameter teknis sesuai standar. Alat dinyatakan aman dan laik beroperasi.',
              icon: CheckCircle,
              badge: 'Laik Operasi',
              activeClass: 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500 shadow-sm',
              iconClass: 'text-emerald-600 dark:text-emerald-400',
              badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
            },
            {
              id: 'MEMENUHI_SYARAT_DENGAN_PERBAIKAN',
              title: 'Memenuhi dengan Catatan',
              desc: 'Laik operasi bersyarat. Wajib menindaklanjuti rekomendasi perbaikan minor dari Ahli K3.',
              icon: WarningCircle,
              badge: 'Laik Bersyarat',
              activeClass: 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 shadow-sm',
              iconClass: 'text-amber-600 dark:text-amber-400',
              badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
            },
            {
              id: 'TIDAK_MEMENUHI_SYARAT',
              title: 'Tidak Memenuhi Syarat',
              desc: 'Ditemukan potensi bahaya kritis atau kegagalan fungsi. Alat dilarang beroperasi.',
              icon: XCircle,
              badge: 'Tidak Laik',
              activeClass: 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500 shadow-sm',
              iconClass: 'text-rose-600 dark:text-rose-400',
              badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
            }
          ].map((item) => {
            const isSelected = draftConclusion === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => setDraftConclusion(item.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? item.activeClass
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon size={20} weight={isSelected ? 'fill' : 'bold'} className={item.iconClass} />
                      <span className="font-extrabold text-xs">{item.title}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-80">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold">
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#C81E1E] bg-[#C81E1E] text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={isSelected ? 'font-bold' : 'text-slate-500 font-normal'}>
                    {isSelected ? 'Pilihan Terpilih' : 'Pilih Kesimpulan'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Catatan Kesimpulan Teknis */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
          Catatan / Ringkasan Kesimpulan Teknis
        </label>
        <textarea
          rows={2}
          disabled={disabled}
          value={draftConclusionNotes}
          onChange={(e) => setDraftConclusionNotes(e.target.value)}
          placeholder="Tuliskan catatan teknis hasil riksa uji (misalnya: Rekomendasi uji beban berkala, batas kapasitas aman, atau tindak lanjut pemeliharaan)..."
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
        />
      </div>

      {/* Ruang Lingkup BAP (Untuk Dokumen Berita Acara Riksa Uji) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText size={16} weight="bold" className="text-[#C81E1E]" />
              <span>Ruang Lingkup Pemeriksaan (Dokumen BAP)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Ceklis lingkup pengujian yang masuk ke Berita Acara Pemeriksaan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#C81E1E] dark:text-rose-400 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              {draftScopes.length} lingkup dipilih
            </span>
            {isInspector && status === 'DRAF' && (
              <button
                type="button"
                onClick={() => setDraftScopes([...scopeCatalog])}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
              >
                Pilih Semua
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {scopeCatalog.map((scopeItem) => {
            const checked = draftScopes.includes(scopeItem);

            return (
              <button
                key={scopeItem}
                type="button"
                disabled={disabled}
                onClick={() =>
                  setDraftScopes((prev) =>
                    checked ? prev.filter((s) => s !== scopeItem) : [...prev, scopeItem]
                  )
                }
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  checked
                    ? 'border-[#C81E1E] bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-300 font-bold shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 font-medium'
                } ${disabled ? 'cursor-not-allowed opacity-80' : ''}`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
                    checked
                      ? 'bg-[#C81E1E] border-[#C81E1E] text-white'
                      : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {checked && <Check size={12} weight="bold" />}
                </div>
                <span className="text-xs truncate">{scopeItem}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tombol Navigasi Bawah Langkah 2 */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={15} weight="bold" />
          <span>Kembali ke Checklist</span>
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
            <span>Lanjut: Foto &amp; Temuan</span>
            <ArrowRight size={15} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}

