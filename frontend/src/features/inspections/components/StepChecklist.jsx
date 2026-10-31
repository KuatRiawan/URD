import { useState } from 'react';
import { ArrowRight, Camera, CaretDown, CaretUp, Check, CheckCircle, SlidersHorizontal, X } from '@phosphor-icons/react';

export function StepChecklist({
  items = [],
  draftResults = {},
  setDraftResults,
  draftObjectAttributes = {},
  setDraftObjectAttributes,
  attributeSchema = [],
  categoryCode = '',
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
  const [showTechSpecs, setShowTechSpecs] = useState(true);
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
      {/* Parameter Spesifikasi Teknis & Pengukuran Fisik Unit (Bab II LHPP) */}
      {attributeSchema.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                <SlidersHorizontal size={13} weight="bold" />
              </span>
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Data Teknis & Pengukuran Fisik Alat ({categoryCode})
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Diverifikasi dan diukur langsung oleh Ahli K3 untuk Bab II LHPP
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTechSpecs((prev) => !prev)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2 py-1 rounded"
            >
              <span>{showTechSpecs ? 'Tutup' : 'Buka Parameter'}</span>
              {showTechSpecs ? <CaretUp size={12} weight="bold" /> : <CaretDown size={12} weight="bold" />}
            </button>
          </div>

          {showTechSpecs && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {attributeSchema.map((attr) => (
                <div key={attr.key} className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate" title={attr.label}>
                    {attr.label} {attr.unit ? `(${attr.unit})` : ''}
                  </label>
                  <input
                    type="text"
                    disabled={readOnly}
                    placeholder={attr.placeholder || ''}
                    value={draftObjectAttributes[attr.key] || ''}
                    onChange={(e) =>
                      setDraftObjectAttributes &&
                      setDraftObjectAttributes((prev) => ({
                        ...prev,
                        [attr.key]: e.target.value
                      }))
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium placeholder:text-slate-400"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
            <span>Tandai Item Pilihan Sesuai</span>
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
                      <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        {item.input_type === 'CHOICE' && (
                          <div className="w-full md:w-auto grid grid-cols-3 md:inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                            <button
                              type="button"
                              disabled={readOnly}
                              onClick={() =>
                                setDraftResults((prev) => ({
                                  ...prev,
                                  [item.id]: { ...(prev[item.id] || {}), itemId: item.id, choiceValue: 'SESUAI' }
                                }))
                              }
                              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                row.choiceValue === 'SESUAI'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <Check size={14} weight="bold" />
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
                              className={`min-h-[44px] md:min-h-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                row.choiceValue === 'TIDAK_SESUAI'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <X size={14} weight="bold" />
                              <span className="truncate">Tidak</span>
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
                              className={`min-h-[44px] md:min-h-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
                                row.choiceValue === 'TIDAK_BERLAKU'
                                  ? 'bg-slate-700 text-white shadow-xs'
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

                        {/* Tombol Kamera Lapangan Cepat (Bisa Kamera Langsung atau Galeri HP) */}
                        {isInspector && status === 'DRAF' && (
                          <label
                            title="Ambil Foto dari Kamera atau Pilih dari Galeri"
                            className="min-h-[44px] md:min-h-9 px-3 rounded-xl md:rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-center transition-colors shadow-2xs shrink-0"
                          >
                            <Camera size={16} weight="bold" />
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  onUploadInlinePhoto(item, f);
                                  e.target.value = '';
                                }
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

      {/* Tombol Lanjut ke Langkah Berikutnya (jika dipassing) */}
      {onNext && (
        <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onNext}
            className="min-h-11 w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#C81E1E] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#a61717] active:scale-[0.98] transition-all shadow-xs cursor-pointer"
          >
            <span>Lanjut: Kesimpulan &amp; Tanda Tangan</span>
            <ArrowRight size={16} weight="bold" />
          </button>
        </div>
      )}
    </div>
  );
}

