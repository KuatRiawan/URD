import { Camera, CheckCircle, FileDoc, Signature } from '@phosphor-icons/react';

export function InspectionStepNav({
  formStep,
  setFormStep,
  photosCount = 0,
  inspectorSig,
  clientSig,
  bapNo
}) {
  const isStep1Done = true;
  const isStep2Done = photosCount >= 2;
  const isStep3Done = Boolean(inspectorSig && clientSig);

  const steps = [
    {
      step: 1,
      title: '1. Data Umum & LHPP',
      sub: 'Verifikasi Objek · Blangko Word',
      icon: FileDoc,
      isDone: isStep1Done
    },
    {
      step: 2,
      title: '8. Dokumentasi Foto',
      sub: `${photosCount} Foto Terunggah (5 Kategori)`,
      icon: Camera,
      isDone: isStep2Done
    },
    {
      step: 3,
      title: 'Tanda Tangan & BAP',
      sub: isStep3Done ? (bapNo ? `BAP: ${bapNo}` : 'TTD Lengkap') : inspectorSig ? 'Tunggu TTD Klien' : 'TTD Lapangan',
      icon: Signature,
      isDone: isStep3Done
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
      {steps.map((st) => {
        const Icon = st.icon;
        const isActive = formStep === st.step;
        return (
          <button
            key={st.step}
            type="button"
            onClick={() => setFormStep(st.step)}
            className={`min-h-[46px] py-2 px-3 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-2xs ring-1 ring-slate-200 dark:ring-slate-700 font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                st.isDone && !isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : isActive
                  ? 'bg-rose-100 text-[#C81E1E] dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {st.isDone && !isActive ? <CheckCircle size={16} weight="fill" /> : <Icon size={16} weight="bold" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm leading-tight truncate">{st.title}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">{st.sub}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
