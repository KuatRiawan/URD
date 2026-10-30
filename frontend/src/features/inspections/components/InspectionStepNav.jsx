export function InspectionStepNav({
  formStep,
  setFormStep,
  missingItems,
  evaluatedItems,
  totalItems,
  photosCount,
  inspectorSig
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80">
      <button
        type="button"
        onClick={() => setFormStep(1)}
        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          formStep === 1
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
            missingItems === 0
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {missingItems === 0 ? '✓' : '1'}
        </span>
        <span className="truncate">
          1. Checklist ({evaluatedItems}/{totalItems})
        </span>
      </button>

      <button
        type="button"
        onClick={() => setFormStep(2)}
        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          formStep === 2
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-extrabold shrink-0">
          2
        </span>
        <span className="truncate">2. Kesimpulan &amp; Lingkup</span>
      </button>

      <button
        type="button"
        onClick={() => setFormStep(3)}
        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          formStep === 3
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
            photosCount >= 2
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {photosCount >= 2 ? '✓' : '3'}
        </span>
        <span className="truncate">3. Foto ({photosCount}) &amp; Temuan</span>
      </button>

      <button
        type="button"
        onClick={() => setFormStep(4)}
        className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
          formStep === 4
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
            inspectorSig
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {inspectorSig ? '✓' : '4'}
        </span>
        <span className="truncate">4. Tanda Tangan &amp; Selesai</span>
      </button>
    </div>
  );
}
