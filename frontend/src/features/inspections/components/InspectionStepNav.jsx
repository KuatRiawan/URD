import { CheckCircle } from '@phosphor-icons/react';

export function InspectionStepNav({
  formStep,
  setFormStep,
  workPhase = 'FIELD',
  missingItems,
  evaluatedItems,
  totalItems,
  photosCount,
  inspectorSig,
  clientSig,
  bapId
}) {
  const isStep1Done = missingItems === 0;
  const isStep2Done = Boolean(inspectorSig && clientSig);

  return (
    <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
      {/* Langkah 1: Ceklist & Temuan Foto */}
      <button
        type="button"
        onClick={() => setFormStep(1)}
        className={`min-h-[48px] py-2 px-3 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
          formStep === 1
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-extrabold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
            isStep1Done
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : formStep === 1
              ? 'bg-rose-100 text-[#C81E1E] dark:bg-rose-950 dark:text-rose-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {isStep1Done ? <CheckCircle size={18} weight="fill" /> : '1'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm leading-tight truncate">
            {workPhase === 'FIELD'
              ? '1. Inspeksi Lapangan & Foto'
              : '1. Ceklist Teknis Lengkap & Foto'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
            {evaluatedItems}/{totalItems} Uji · {photosCount} Foto
          </p>
        </div>
      </button>

      {/* Langkah 2: Kesimpulan & Tanda Tangan */}
      <button
        type="button"
        onClick={() => setFormStep(2)}
        className={`min-h-[48px] py-2 px-3 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
          formStep === 2
            ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 font-extrabold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
        }`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${
            isStep2Done
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : formStep === 2
              ? 'bg-rose-100 text-[#C81E1E] dark:bg-rose-950 dark:text-rose-300'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {isStep2Done ? <CheckCircle size={18} weight="fill" /> : '2'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm leading-tight truncate">
            {workPhase === 'FIELD'
              ? '2. Tanda Tangan & Siapkan BAP'
              : '2. Simpulan, TTD & Draf LHPP'}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
            {isStep2Done
              ? bapId
                ? 'TTD Lengkap · BAP Siap'
                : 'TTD Lengkap'
              : inspectorSig
              ? 'Ahli K3 TTD · Tunggu Klien'
              : 'TTD Situasional'}
          </p>
        </div>
      </button>
    </div>
  );
}
