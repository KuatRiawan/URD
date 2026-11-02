import { useState } from 'react';
import {
  ArrowRight,
  Camera,
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  IdentificationBadge,
  SlidersHorizontal,
  WarningCircle,
  X
} from '@phosphor-icons/react';

export function StepChecklist({
  inspection = {},
  items = [],
  draftResults = {},
  setDraftResults,
  draftObjectAttributes = {},
  setDraftObjectAttributes,
  attributeSchema = [],
  categoryCode = '',
  _categoryName = '',
  onUploadInlinePhoto,
  onUploadNameplatePhoto,
  readOnly,
  missingItems,
  evaluatedItems,
  totalItems,
  isInspector,
  status,
  photos = [],
  onNext
}) {
  const [showTechSpecs, setShowTechSpecs] = useState(true);
  const nameplatePhotoAttached = photos.some((p) =>
    (p.caption || '').toLowerCase().includes('nameplate')
  );

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
      {/* 1. Verifikasi Fisik Nameplate Unit (Object & Nameplate Matching) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#C81E1E] text-white flex items-center justify-center text-xs font-bold shrink-0">
              <IdentificationBadge size={14} weight="bold" />
            </span>
            <div>
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Verifikasi Fisik Nameplate Unit
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Tahap 1: Cocokkan pelat pabrik fisik dengan data PO sebelum uji fungsi
              </p>
            </div>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              nameplatePhotoAttached
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {nameplatePhotoAttached ? 'Foto Terlampir' : 'Perlu Foto Nameplate'}
          </span>
        </div>

        <div className="p-4 bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Nama Objek</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {inspection?.object_name || '-'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No. Seri PO / Sistem</span>
              <p className="font-mono font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {inspection?.serial_number || '-'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kapasitas / SWL</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {inspection?.capacity || '-'}
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lokasi / Bay</span>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                {inspection?.install_location || inspection?.location_name || '-'}
              </p>
            </div>
          </div>

          {/* Bar Aksi Cepat Nameplate */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2">
              {nameplatePhotoAttached ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle size={16} weight="fill" />
                    <span>Foto Nameplate Terlampir</span>
                  </span>
                  {!readOnly && (
                    <div className="relative inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer active:scale-95 transition-all select-none overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Camera size={14} weight="bold" />
                      <span>Ganti / Tambah</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={readOnly}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && onUploadNameplatePhoto) {
                            onUploadNameplatePhoto(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="relative inline-flex items-center gap-2 text-xs font-bold text-white bg-[#C81E1E] hover:bg-[#a61717] px-3.5 py-2 rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all select-none overflow-hidden"
                >
                  <Camera size={16} weight="bold" />
                  <span>Ambil / Unggah Foto Nameplate</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={readOnly}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onUploadNameplatePhoto) {
                        onUploadNameplatePhoto(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <a
                href={`/app/issues?orderId=${encodeURIComponent(inspection?.order_id || '')}&objectId=${encodeURIComponent(inspection?.object_id || '')}&inspectionId=${encodeURIComponent(inspection?.id || '')}&issueType=UNIT_MISMATCH`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline p-1"
              >
                <WarningCircle size={14} weight="bold" />
                <span>Nomor Seri / Objek Tidak Sesuai? Laporkan</span>
              </a>
            </div>
          </div>
        </div>
      </div>

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
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            Setiap item harus diisi berdasarkan pemeriksaan aktual.
          </span>
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
                          <div
                            title="Ambil Foto dari Kamera atau Pilih dari Galeri"
                            className="relative min-h-[44px] md:min-h-9 px-3 rounded-xl md:rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-center transition-colors shadow-2xs shrink-0 select-none overflow-hidden"
                          >
                            <Camera size={16} weight="bold" />
                            <input
                              type="file"
                              accept="image/*"
                              disabled={readOnly}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) {
                                  onUploadInlinePhoto(item, f);
                                }
                                e.target.value = '';
                              }}
                            />
                          </div>
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
