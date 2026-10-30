import { ArrowRight, Camera, Check, CheckCircle, X } from '@phosphor-icons/react';

export function StepChecklist({
  items = [],
  draftResults = {},
  setDraftResults,
  onUploadInlinePhoto,
  readOnly,
  missingItems,
  evaluatedItems,
  totalItems,
  onAutoFillStandard,
  isInspector,
  status,
  photos = [],
  onNext
}) {
  const sections = [];
  const sectionMap = new Map();
  for (const item of items) {
    const sec = item.section || 'UMUM';
    if (!sectionMap.has(sec)) {
      sectionMap.set(sec, []);
      sections.push(sec);
    }
    sectionMap.get(sec).push(item);
  }

  return (
    <div className="space-y-4">
      {/* Status Bar Kelengkapan Checklist & Tombol Tandai Semua */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
              Kelengkapan Parameter Riksa Uji
            </span>
            <span className={`text-xs font-bold ${missingItems === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              ({evaluatedItems} dari {totalItems} butir terisi)
            </span>
          </div>
          <div className="w-56 sm:w-72 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${missingItems === 0 ? 'bg-emerald-500' : 'bg-[#C81E1E]'}`}
              style={{ width: `${totalItems ? Math.round((evaluatedItems / totalItems) * 100) : 100}%` }}
            />
          </div>
        </div>

        {isInspector && status === 'DRAF' && missingItems > 0 && (
          <button
            type="button"
            onClick={onAutoFillStandard}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a61717] font-bold text-xs shrink-0 shadow-xs transition-colors cursor-pointer"
          >
            <CheckCircle size={15} weight="bold" />
            <span>Tandai Semua Sesuai Standar</span>
          </button>
        )}
      </div>

      {/* Render Checklist Berkelompok per Seksi Teknis */}
      <div className="space-y-4">
        {sections.map((secName, secIdx) => {
          const secItems = sectionMap.get(secName) || [];
          const secFilled = secItems.filter((it) => {
            const r = draftResults[it.id];
            if (!r) return false;
            if (it.input_type === 'CHOICE') return !!r.choiceValue;
            if (it.input_type === 'NUMBER') return r.numberValue !== '' && r.numberValue !== null && r.numberValue !== undefined;
            if (it.input_type === 'TEXT') return !!r.textValue;
            return true;
          }).length;

          return (
            <div
              key={secName}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
            >
              {/* Header Seksi */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[#C81E1E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {secIdx + 1}
                  </span>
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    {secName}
                  </h3>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  secFilled === secItems.length
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}>
                  {secFilled} / {secItems.length} Selesai
                </span>
              </div>

              {/* Daftar Butir Pemeriksaan dalam Seksi */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {secItems.map((item) => {
                  const row = draftResults[item.id] || {
                    choiceValue: null,
                    numberValue: '',
                    textValue: '',
                    note: ''
                  };

                  const itemPhotos = photos.filter(
                    (p) => p.caption && p.caption.includes(item.label)
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Info Butir & Standar */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {item.label}
                          </span>
                          {item.is_required && (
                            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                              *Wajib
                            </span>
                          )}
                          {item.unit && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {item.unit}
                              {item.min_value !== null ? ` · Min: ${item.min_value}` : ''}
                              {item.max_value !== null ? ` · Maks: ${item.max_value}` : ''}
                            </span>
                          )}
                        </div>

                        {/* Indikator Foto Terlampir */}
                        {itemPhotos.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {itemPhotos.map((ip) => (
                              <span
                                key={ip.id}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-[10px] font-semibold text-[#C81E1E] dark:text-rose-300"
                              >
                                <Camera size={11} weight="bold" />
                                <span>Foto Terlampir</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Kontrol Input Lapangan */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        {item.input_type === 'CHOICE' && (
                          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                setDraftResults((prev) => ({
                                  ...prev,
                                  [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'SESUAI' }
                                }))
                              }
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                row.choiceValue === 'SESUAI'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <Check size={13} weight="bold" />
                              <span>Sesuai</span>
                            </button>
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                setDraftResults((prev) => ({
                                  ...prev,
                                  [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'TIDAK_SESUAI' }
                                }))
                              }
                              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                row.choiceValue === 'TIDAK_SESUAI'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <X size={13} weight="bold" />
                              <span>Tidak Sesuai</span>
                            </button>
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                setDraftResults((prev) => ({
                                  ...prev,
                                  [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'TIDAK_BERLAKU' }
                                }))
                              }
                              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                row.choiceValue === 'TIDAK_BERLAKU'
                                  ? 'bg-slate-600 text-white shadow-xs'
                                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                              }`}
                            >
                              <span>N/A</span>
                            </button>
                          </div>
                        )}

                        {item.input_type === 'NUMBER' && (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              disabled={readOnly}
                              step="any"
                              value={row.numberValue ?? ''}
                              onChange={(e) =>
                                setDraftResults((prev) => ({
                                  ...prev,
                                  [item.id]: { ...(prev[item.id] || {}), itemId: item.id, numberValue: e.target.value }
                                }))
                              }
                              placeholder="Nilai ukur..."
                              className="w-28 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                            />
                            {item.unit && (
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        )}

                        {item.input_type === 'TEXT' && (
                          <input
                            type="text"
                            disabled={readOnly}
                            value={row.textValue ?? ''}
                            onChange={(e) =>
                              setDraftResults((prev) => ({
                                ...prev,
                                [item.id]: { ...(prev[item.id] || {}), itemId: item.id, textValue: e.target.value }
                              }))
                            }
                            placeholder="Keterangan pengamatan..."
                            className="w-48 sm:w-64 min-h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-slate-900 dark:text-slate-100"
                          />
                        )}

                        {/* Tombol Kamera Lapangan Cepat */}
                        {isInspector && status === 'DRAF' && (
                          <label
                            title="Ambil / Lampirkan Foto untuk butir ini"
                            className="min-h-9 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-center transition-colors shadow-2xs"
                          >
                            <Camera size={15} weight="bold" />
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onUploadInlinePhoto(item, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol Lanjut ke Langkah 2 */}
      <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onNext}
          className="min-h-10 inline-flex items-center gap-1.5 rounded-lg bg-[#C81E1E] px-5 py-2 text-xs font-bold text-white hover:bg-[#a61717] shadow-xs cursor-pointer"
        >
          <span>Lanjut: Kesimpulan &amp; Lingkup</span>
          <ArrowRight size={15} weight="bold" />
        </button>
      </div>
    </div>
  );
}
