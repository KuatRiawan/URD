import { useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle,
  ClipboardText,
  Info,
  MapPin,
  NotePencil,
  WarningCircle
} from '@phosphor-icons/react';
import {
  buildItemsBySeqMap,
  doesPhotoMatchItem,
  filterItemsForPhase,
  isChecklistItemFilled,
  isConditionalItemVisible,
  normalizeInputType,
  parseMultiSelectValue,
  parseSelectOptions,
  serializeMultiSelectValue
} from '../utils/checklistUtils.js';

const CONFORMITY_OPTIONS = [
  { value: 'SESUAI', label: 'Memenuhi Syarat', tone: 'ok' },
  { value: 'TIDAK_SESUAI', label: 'Tidak Memenuhi', tone: 'bad' },
  { value: 'TIDAK_BERLAKU', label: 'Tidak Diperiksa', tone: 'neutral' }
];

function toneClass(tone, active) {
  if (active) {
    if (tone === 'bad') return 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200 ring-2 ring-rose-500/25';
    if (tone === 'neutral') return 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 ring-2 ring-slate-500/20';
    return 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 ring-2 ring-emerald-500/25';
  }
  return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800';
}

function ItemInput({ item, row, readOnly, onChange, onUploadPhoto, uploading, photos }) {
  const inputType = normalizeInputType(item);
  const options = parseSelectOptions(item);

  if (inputType === 'CHOICE' || inputType === 'CONFORMITY') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {CONFORMITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={readOnly}
            aria-pressed={row?.choiceValue === opt.value}
            onClick={() => onChange(item, { choiceValue: row?.choiceValue === opt.value ? null : opt.value })}
            className={`min-h-11 px-3 rounded-xl border text-xs font-bold text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${toneClass(
              opt.tone,
              row?.choiceValue === opt.value
            )}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (inputType === 'YES_NO') {
    return (
      <div className="flex gap-2">
        {['YA', 'TIDAK'].map((value) => (
          <button
            key={value}
            type="button"
            disabled={readOnly}
            aria-pressed={String(row?.textValue || '').toUpperCase() === value}
            onClick={() => onChange(item, { textValue: value })}
            className={`min-h-11 px-4 rounded-xl border text-xs font-bold transition-colors cursor-pointer disabled:cursor-not-allowed ${toneClass(
              value === 'YA' ? 'ok' : 'bad',
              String(row?.textValue || '').toUpperCase() === value
            )}`}
          >
            {value === 'YA' ? 'Ya' : 'Tidak'}
          </button>
        ))}
      </div>
    );
  }

  if (inputType === 'NUMBER' || inputType === 'MEASUREMENT') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          step="any"
          disabled={readOnly}
          value={row?.numberValue ?? ''}
          onChange={(e) => onChange(item, { numberValue: e.target.value })}
          className="w-40 min-h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-slate-100"
          aria-label={`Nilai ${item.label}`}
        />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{item.unit || ''}</span>
        {item.min_value !== null && item.max_value !== null && item.min_value !== undefined && item.max_value !== undefined && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Toleransi {item.min_value}–{item.max_value} {item.unit || ''}
          </span>
        )}
      </div>
    );
  }

  if (inputType === 'DATE') {
    return (
      <input
        type="date"
        disabled={readOnly}
        value={row?.dateValue || ''}
        onChange={(e) => onChange(item, { dateValue: e.target.value })}
        className="min-h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
        aria-label={`Tanggal ${item.label}`}
      />
    );
  }

  if (inputType === 'SINGLE_SELECT' && options.length > 0) {
    return (
      <select
        disabled={readOnly}
        value={row?.textValue || ''}
        onChange={(e) => onChange(item, { textValue: e.target.value })}
        className="min-h-11 w-full max-w-sm px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
        aria-label={item.label}
      >
        <option value="">— Pilih —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (inputType === 'MULTI_SELECT' && options.length > 0) {
    const selected = parseMultiSelectValue(row?.textValue);
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={readOnly}
              aria-pressed={active}
              onClick={() => {
                const next = active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value];
                onChange(item, { textValue: serializeMultiSelectValue(next) });
              }}
              className={`min-h-11 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed ${toneClass(
                'ok',
                active
              )}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (inputType === 'PHOTO' || inputType === 'FILE') {
    const attached = (photos || []).filter((p) => doesPhotoMatchItem(p, item));
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className={`inline-flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}>
            <Camera size={16} weight="bold" />
            {uploading ? 'Mengunggah…' : attached.length > 0 ? 'Tambah Foto Lagi' : 'Ambil / Unggah Foto'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={readOnly || uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) onUploadPhoto(item, file);
              }}
            />
          </label>
          <span className={`text-[11px] font-semibold ${attached.length > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {attached.length > 0 ? `${attached.length} foto terlampir` : 'Belum ada foto'}
          </span>
        </div>
        {attached.length > 0 && (
          <ul className="space-y-1">
            {attached.map((p) => (
              <li key={p.id} className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                • {p.caption || p.original_name || 'Foto dokumentasi'}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (inputType === 'LONG_TEXT') {
    return (
      <textarea
        rows={3}
        disabled={readOnly}
        value={row?.textValue || ''}
        onChange={(e) => onChange(item, { textValue: e.target.value })}
        placeholder="Tuliskan hasil pengamatan / temuan…"
        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
        aria-label={item.label}
      />
    );
  }

  return (
    <input
      type="text"
      disabled={readOnly}
      value={row?.textValue || ''}
      onChange={(e) => onChange(item, { textValue: e.target.value })}
      placeholder="Isi hasil pemeriksaan…"
      className="w-full min-h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100"
      aria-label={item.label}
    />
  );
}

export function StepChecklistItems({
  items = [],
  draftResults = {},
  photos = [],
  readOnly = false,
  workPhase = 'OFFICE',
  onPhaseChange,
  onResultChange,
  onUploadItemPhoto,
  uploadingItemId = ''
}) {
  const [activeSection, setActiveSection] = useState('');
  const [noteOpen, setNoteOpen] = useState({});
  const itemsBySeq = useMemo(() => buildItemsBySeqMap(items), [items]);
  const visibleItems = useMemo(
    () => items.filter((item) => isConditionalItemVisible(item, itemsBySeq, draftResults)),
    [items, itemsBySeq, draftResults]
  );

  const phaseItems = useMemo(
    () => filterItemsForPhase(visibleItems, workPhase),
    [visibleItems, workPhase]
  );

  const sections = useMemo(() => {
    const ordered = [];
    const known = new Map();
    for (const item of phaseItems) {
      const name = String(item.section || 'Pemeriksaan Umum');
      if (!known.has(name)) {
        known.set(name, { name, items: [] });
        ordered.push(known.get(name));
      }
      known.get(name).items.push(item);
    }
    return ordered.map((sec) => {
      const filled = sec.items.filter((item) => isChecklistItemFilled(item, draftResults[item.id], photos)).length;
      return { ...sec, filled, total: sec.items.length };
    });
  }, [phaseItems, draftResults, photos]);

  const currentSection = sections.find((sec) => sec.name === activeSection) || sections[0] || null;
  const totalItems = phaseItems.length;
  const filledItems = phaseItems.filter((item) => isChecklistItemFilled(item, draftResults[item.id], photos)).length;
  const missingRequired = phaseItems.filter(
    (item) => item.is_required && !isChecklistItemFilled(item, draftResults[item.id], photos)
  ).length;
  const percent = totalItems > 0 ? Math.round((filledItems / totalItems) * 100) : 0;

  const handleChange = (item, patch) => {
    if (readOnly) return;
    onResultChange?.(item, patch);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-5 space-y-2">
        <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <WarningCircle size={18} weight="bold" />
          Checklist alat ini belum dikonfigurasi
        </h3>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Inspeksi ini belum memiliki template checklist aktif untuk jenis alatnya, sehingga tidak ada butir pemeriksaan
          yang dapat diisi. Hubungi Super Admin untuk mengaktifkan template checklist per nama alat. Data yang sudah ada
          tidak diubah dan tidak ada jawaban yang diisi otomatis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ringkasan & pemilih konteks kerja */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardText size={18} weight="bold" className="text-[#C81E1E]" />
              Checklist Pemeriksaan Alat
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Butir diambil dari template resmi aktif untuk jenis alat ini. Jawaban kosong tetap kosong dan tidak dianggap
              memenuhi syarat.
            </p>
          </div>
          {onPhaseChange && (
            <div
              role="group"
              aria-label="Konteks pengisian"
              className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1 shrink-0"
            >
              {[
                { key: 'FIELD', label: 'Lapangan' },
                { key: 'OFFICE', label: 'Kantor' }
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={workPhase === opt.key}
                  onClick={() => onPhaseChange(opt.key)}
                  className={`min-h-9 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    workPhase === opt.key
                      ? 'bg-white dark:bg-slate-900 text-[#C81E1E] dark:text-rose-400 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${percent === 100 ? 'bg-emerald-500' : 'bg-[#C81E1E]'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">
            {filledItems}/{totalItems} butir
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <MapPin size={13} weight="bold" />
            {workPhase === 'FIELD'
              ? 'Mode lapangan: hanya butir yang butuh data langsung di lokasi (pengukuran, foto, temuan kritis).'
              : 'Mode kantor: seluruh butir template, termasuk tabel pemeriksaan dan pengujian.'}
          </span>
          {missingRequired > 0 ? (
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
              <WarningCircle size={13} weight="bold" />
              {missingRequired} butir wajib belum diisi
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle size={13} weight="bold" />
              Semua butir wajib pada mode ini terisi
            </span>
          )}
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex items-start gap-3">
          <Info size={18} className="text-slate-400 shrink-0 mt-0.5" weight="bold" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Tidak ada butir yang perlu diambil pada mode lapangan untuk alat ini. Lanjutkan dokumentasi foto, lalu
            lengkapi tabel pemeriksaan dan pengujian pada mode kantor.
          </p>
        </div>
      ) : (
        <>
          {/* Navigasi bagian */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {sections.map((sec) => {
              const active = currentSection?.name === sec.name;
              const complete = sec.total > 0 && sec.filled === sec.total;
              return (
                <button
                  key={sec.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveSection(sec.name)}
                  className={`min-h-11 shrink-0 px-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    active
                      ? 'border-[#C81E1E] bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`block text-xs font-bold truncate max-w-[180px] ${active ? 'text-[#C81E1E] dark:text-rose-300' : 'text-slate-700 dark:text-slate-200'}`}>
                    {sec.name}
                  </span>
                  <span className={`block text-[10px] font-semibold ${complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {sec.filled}/{sec.total} terisi
                  </span>
                </button>
              );
            })}
          </div>

          {/* Butir pada bagian aktif */}
          <div className="space-y-2.5">
            {currentSection?.items.map((item, idx) => {
              const row = draftResults[item.id] || {};
              const filled = isChecklistItemFilled(item, row, photos);
              const inputType = normalizeInputType(item);
              const needsPhoto = item.requires_photo || item.requiresPhoto;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white dark:bg-slate-900 p-3.5 space-y-2.5 ${
                    filled ? 'border-slate-200 dark:border-slate-800' : 'border-amber-300/80 dark:border-amber-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {idx + 1}. {item.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.is_required && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-[#C81E1E] dark:bg-rose-950/50 dark:text-rose-300">
                            Wajib
                          </span>
                        )}
                        {inputType === 'MEASUREMENT' && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Pengukuran{item.unit ? ` (${item.unit})` : ''}
                          </span>
                        )}
                        {needsPhoto && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            Butuh foto
                          </span>
                        )}
                      </div>
                    </div>
                    {filled ? (
                      <CheckCircle size={18} weight="fill" className="text-emerald-500 shrink-0" aria-label="Terisi" />
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">Belum diisi</span>
                    )}
                  </div>

                  <ItemInput
                    item={item}
                    row={row}
                    readOnly={readOnly}
                    onChange={handleChange}
                    onUploadPhoto={onUploadItemPhoto}
                    uploading={uploadingItemId === item.id}
                    photos={photos}
                  />

                  {needsPhoto && inputType !== 'PHOTO' && inputType !== 'FILE' && (
                    <div className="pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                      <ItemInput
                        item={{ ...item, input_type: 'PHOTO' }}
                        row={{}}
                        readOnly={readOnly}
                        onChange={handleChange}
                        onUploadPhoto={onUploadItemPhoto}
                        uploading={uploadingItemId === item.id}
                        photos={photos}
                      />
                    </div>
                  )}

                  <div>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => setNoteOpen((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                      className="min-h-9 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-[#C81E1E] dark:hover:text-rose-400 cursor-pointer"
                      aria-expanded={Boolean(noteOpen[item.id]) || Boolean(row.note)}
                    >
                      <NotePencil size={13} weight="bold" />
                      {row.note ? 'Ubah catatan teknis' : 'Tambah catatan teknis'}
                    </button>
                    {(noteOpen[item.id] || row.note) && (
                      <textarea
                        rows={2}
                        disabled={readOnly}
                        value={row.note || ''}
                        onChange={(e) => handleChange(item, { note: e.target.value })}
                        placeholder="Catatan teknis butir ini (opsional)…"
                        className="mt-1.5 w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100"
                        aria-label={`Catatan ${item.label}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {currentSection?.filled || 0} dari {currentSection?.total || 0} butir pada bagian ini terisi. Perubahan
            tersimpan otomatis di perangkat; gunakan &quot;Simpan Draf&quot; untuk menyimpan ke server.
          </p>
        </>
      )}
    </div>
  );
}

export default StepChecklistItems;
