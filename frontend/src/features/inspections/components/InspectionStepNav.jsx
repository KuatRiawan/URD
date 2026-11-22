import {
  Camera,
  CheckCircle,
  IdentificationBadge,
  ListChecks,
  Scales,
  SealCheck
} from '@phosphor-icons/react';

// Alur kerja inspector dipisah jelas: identitas unit, pengumpulan data checklist,
// kesimpulan teknis, syarat K3, lalu dokumentasi foto + tanda tangan.
// Bagian tabel Word yang dulu hanya berupa kartu penjelas statis diganti checklist
// dinamis sesuai template alat sehingga data benar-benar terekam.
export const INSPECTION_SECTIONS = [
  { id: 1, num: 'I', title: 'Data Umum', sub: 'Identitas Unit', icon: IdentificationBadge },
  { id: 2, num: 'II', title: 'Checklist', sub: 'Pemeriksaan', icon: ListChecks },
  { id: 3, num: 'III', title: 'Kesimpulan', sub: 'Kelayakan K3', icon: SealCheck },
  { id: 4, num: 'IV', title: 'Syarat K3', sub: 'Rekomendasi', icon: Scales },
  { id: 5, num: 'V', title: 'Foto & TTD', sub: 'Dokumentasi', icon: Camera }
];

export function InspectionStepNav({
  formStep = 1,
  setFormStep,
  photosCount = 0,
  inspectorSig,
  totalItems = 0,
  filledItems = 0,
  conclusion = ''
}) {
  const checklistDone = totalItems > 0 && filledItems >= totalItems;
  const isStepDone = (id) => {
    if (id === 1) return true; // Identitas unit terisi dari PO & master alat
    if (id === 2) return checklistDone;
    if (id === 3) return Boolean(conclusion);
    if (id === 4) return Boolean(conclusion);
    if (id === 5) return photosCount >= 2 && Boolean(inspectorSig);
    return false;
  };

  const subLabel = (sec) => {
    if (sec.id === 2) return totalItems > 0 ? `${filledItems}/${totalItems} Butir` : 'Belum ada butir';
    if (sec.id === 5) return `${photosCount} Foto`;
    return sec.sub;
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/60 p-1.5 shadow-2xs">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
        {INSPECTION_SECTIONS.map((sec) => {
          const Icon = sec.icon;
          const isActive = formStep === sec.id;
          const done = isStepDone(sec.id);

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setFormStep(sec.id)}
              className={`min-h-[52px] p-2 rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer border ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-[#C81E1E] text-[#C81E1E] dark:text-rose-400 shadow-xs ring-1 ring-[#C81E1E]/20'
                  : 'bg-white/50 dark:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-1 w-full mb-1">
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-rose-100 text-[#C81E1E] dark:bg-rose-950 dark:text-rose-300'
                      : done
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {sec.id}. {sec.num}
                </span>
                <span className="shrink-0">
                  {done && !isActive ? (
                    <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" weight="fill" />
                  ) : (
                    <Icon
                      size={14}
                      weight={isActive ? 'bold' : 'regular'}
                      className={isActive ? 'text-[#C81E1E] dark:text-rose-400' : 'text-slate-400'}
                    />
                  )}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">{sec.title}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                  {subLabel(sec)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
