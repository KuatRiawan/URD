import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CaretDown,
  CaretUp,
  Check,
  CheckCircle,
  IdentificationBadge,
  MagnifyingGlass,
  NotePencil,
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
  const [collapsedSections, setCollapsedSections] = useState({});
  const [checklistSearch, setChecklistSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'UNFILLED' | 'NON_COMPLIANT'
  const [expandedNotes, setExpandedNotes] = useState({});

  const toggleSection = (secName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName]
    }));
  };

  const expandAll = () => setCollapsedSections({});
  const collapseAll = () => {
    const next = {};
    for (const item of items) {
      next[item.section || 'UMUM'] = true;
    }
    setCollapsedSections(next);
  };

  const nameplatePhotoAttached = photos.some((p) =>
    (p.caption || '').toLowerCase().includes('nameplate')
  );

  const nonCompliantCount = useMemo(() => {
    return items.filter((it) => draftResults[it.id]?.choiceValue === 'TIDAK_SESUAI').length;
  }, [items, draftResults]);

  const sections = useMemo(() => {
    const secs = [];
    const set = new Set();
    for (const item of items) {
      const sec = item.section || 'UMUM';
      if (!set.has(sec)) {
        set.add(sec);
        secs.push(sec);
      }
    }
    return secs;
  }, [items]);

  const sectionMap = useMemo(() => {
    const map = new Map();
    for (const item of items) {
      const sec = item.section || 'UMUM';
      if (!map.has(sec)) {
        map.set(sec, []);
      }
      map.get(sec).push(item);
    }
    return map;
  }, [items]);

  // Seksi dan butir yang telah disaring berdasarkan pencarian dan status filter
  const { filteredSections, filteredSectionMap } = useMemo(() => {
    const fSecs = [];
    const fMap = new Map();
    let totalF = 0;
    const q = checklistSearch.trim().toLowerCase();

    for (const sec of sections) {
      const secItems = sectionMap.get(sec) || [];
      const matching = secItems.filter((it) => {
        const r = draftResults[it.id];
        const isFilled =
          it.input_type === 'CHOICE'
            ? !!r?.choiceValue
            : it.input_type === 'NUMBER'
            ? r?.numberValue !== '' && r?.numberValue !== null && r?.numberValue !== undefined
            : it.input_type === 'TEXT'
            ? !!r?.textValue
            : true;

        if (statusFilter === 'UNFILLED' && isFilled) return false;
        if (statusFilter === 'NON_COMPLIANT' && r?.choiceValue !== 'TIDAK_SESUAI') return false;

        if (q) {
          const matchLabel = (it.label || '').toLowerCase().includes(q);
          const matchSec = (it.section || '').toLowerCase().includes(q);
          const matchUnit = (it.unit || '').toLowerCase().includes(q);
          const matchNote = (r?.note || '').toLowerCase().includes(q);
          if (!matchLabel && !matchSec && !matchUnit && !matchNote) return false;
        }

        return true;
      });

      if (matching.length > 0) {
        fSecs.push(sec);
        fMap.set(sec, matching);
        totalF += matching.length;
      }
    }

    return { filteredSections: fSecs, filteredSectionMap: fMap, totalFilteredItems: totalF };
  }, [sections, sectionMap, draftResults, statusFilter, checklistSearch]);

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

      {/* Status Bar Kelengkapan Checklist & Kontrol Seksi */}
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

        <div className="flex items-center gap-2">
          {sections.length > 1 && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={expandAll}
                className="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Buka Semua
              </button>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Tutup Semua
              </button>
            </div>
          )}
          {isInspector && status === 'DRAF' && missingItems > 0 && (
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 hidden sm:inline">
              Setiap item harus diisi sesuai pengujian fisik.
            </span>
          )}
        </div>
      </div>

      {/* Bar Pencarian & Filter Cepat Butir Ceklis Lapangan */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="relative flex-1">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={checklistSearch}
            onChange={(e) => setChecklistSearch(e.target.value)}
            placeholder="Cari butir atau seksi (misal: rem, baut, sling, limit switch)..."
            className="w-full min-h-[40px] pl-8 pr-8 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C81E1E]"
          />
          {checklistSearch && (
            <button
              type="button"
              onClick={() => setChecklistSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Semua ({totalItems})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('UNFILLED')}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'UNFILLED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 text-amber-800 dark:text-amber-300'
            }`}
          >
            <span>Belum Diisi</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 dark:bg-amber-800 text-amber-950 dark:text-amber-100 text-[10px]">
              {missingItems}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('NON_COMPLIANT')}
            className={`min-h-[38px] px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'NON_COMPLIANT'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>Tidak Sesuai</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-200/80 dark:bg-rose-800 text-rose-950 dark:text-rose-100 text-[10px]">
              {nonCompliantCount}
            </span>
          </button>
        </div>
      </div>

      {/* Render Checklist Berkelompok per Seksi Teknis */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tidak ditemukan parameter checklist yang sesuai filter atau pencarian &quot;{checklistSearch}&quot;.
            </p>
            <button
              type="button"
              onClick={() => {
                setChecklistSearch('');
                setStatusFilter('ALL');
              }}
              className="text-xs font-bold text-[#C81E1E] hover:underline cursor-pointer"
            >
              Reset filter pencarian
            </button>
          </div>
        ) : (
          filteredSections.map((secName, secIdx) => {
            const secItems = filteredSectionMap.get(secName) || [];
            const originalSecItems = sectionMap.get(secName) || [];
            const secFilled = originalSecItems.filter((it) => {
              const r = draftResults[it.id];
              if (!r) return false;
              if (it.input_type === 'CHOICE') return !!r.choiceValue;
              if (it.input_type === 'NUMBER')
                return r.numberValue !== '' && r.numberValue !== null && r.numberValue !== undefined;
              if (it.input_type === 'TEXT') return !!r.textValue;
              return true;
            }).length;

            const isCollapsed =
              !!collapsedSections[secName] && !checklistSearch && statusFilter === 'ALL';

            return (
              <div
                key={secName}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
              >
                {/* Header Seksi (Clickable Accordion) */}
                <div
                  onClick={() => toggleSection(secName)}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 cursor-pointer select-none hover:bg-slate-100/70 dark:hover:bg-slate-800/90 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-[#C81E1E] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {secIdx + 1}
                    </span>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {secName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        secFilled === originalSecItems.length
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {secFilled} / {originalSecItems.length} Selesai
                    </span>
                    {isCollapsed ? (
                      <CaretDown size={14} weight="bold" className="text-slate-400" />
                    ) : (
                      <CaretUp size={14} weight="bold" className="text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Daftar Butir Pemeriksaan dalam Seksi */}
                {!isCollapsed && (
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

                      const showNoteInput =
                        row.choiceValue === 'TIDAK_SESUAI' || Boolean(row.note) || Boolean(expandedNotes[item.id]);

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 flex flex-col gap-2.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                                        [item.id]: {
                                          ...(prev[item.id] || {}),
                                          itemId: item.id,
                                          choiceValue: 'SESUAI'
                                        }
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
                                        [item.id]: {
                                          ...(prev[item.id] || {}),
                                          itemId: item.id,
                                          choiceValue: 'TIDAK_SESUAI'
                                        }
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
                                        [item.id]: {
                                          ...(prev[item.id] || {}),
                                          itemId: item.id,
                                          choiceValue: 'TIDAK_BERLAKU'
                                        }
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

                              {item.input_type === 'NUMBER' && (() => {
                                const numVal = parseFloat(row.numberValue);
                                const hasVal =
                                  !isNaN(numVal) &&
                                  row.numberValue !== '' &&
                                  row.numberValue !== null &&
                                  row.numberValue !== undefined;
                                const isOutOfRange =
                                  hasVal &&
                                  ((item.min_value !== null && numVal < item.min_value) ||
                                    (item.max_value !== null && numVal > item.max_value));
                                const isInRange =
                                  hasVal &&
                                  !isOutOfRange &&
                                  (item.min_value !== null || item.max_value !== null);

                                return (
                                  <div className="w-full md:w-auto flex flex-col items-start gap-1">
                                    <div className="flex items-center gap-1.5 w-full">
                                      <input
                                        type="number"
                                        disabled={readOnly}
                                        step="any"
                                        value={row.numberValue ?? ''}
                                        onChange={(e) =>
                                          setDraftResults((prev) => ({
                                            ...prev,
                                            [item.id]: {
                                              ...(prev[item.id] || {}),
                                              itemId: item.id,
                                              numberValue: e.target.value
                                            }
                                          }))
                                        }
                                        placeholder="Nilai ukur..."
                                        className={`w-full md:w-32 min-h-[44px] md:min-h-9 rounded-xl md:rounded-lg border px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold transition-all ${
                                          isOutOfRange
                                            ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100'
                                            : isInRange
                                            ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20'
                                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                                        }`}
                                      />
                                      {item.unit && (
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                          {item.unit}
                                        </span>
                                      )}
                                    </div>
                                    {isOutOfRange && (
                                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                        <WarningCircle size={12} weight="fill" />
                                        <span>
                                          Di luar batas (Min {item.min_value ?? '-'} · Maks {item.max_value ?? '-'})
                                        </span>
                                      </span>
                                    )}
                                    {isInRange && (
                                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle size={12} weight="fill" />
                                        <span>Sesuai rentang standar</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}

                              {item.input_type === 'TEXT' && (
                                <input
                                  type="text"
                                  disabled={readOnly}
                                  value={row.textValue ?? ''}
                                  onChange={(e) =>
                                    setDraftResults((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...(prev[item.id] || {}),
                                        itemId: item.id,
                                        textValue: e.target.value
                                      }
                                    }))
                                  }
                                  placeholder="Keterangan pengamatan..."
                                  className="w-full md:w-64 min-h-[44px] md:min-h-9 rounded-xl md:rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                                />
                              )}

                              {/* Tombol Catatan Butir */}
                              {isInspector && status === 'DRAF' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedNotes((prev) => ({
                                      ...prev,
                                      [item.id]: !prev[item.id]
                                    }))
                                  }
                                  title={row.note ? 'Ubah catatan butir' : 'Tambah catatan butir'}
                                  className={`min-h-[44px] md:min-h-9 px-2.5 rounded-xl md:rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                                    row.note
                                      ? 'border-[#C81E1E]/50 bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-300'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                  }`}
                                >
                                  <NotePencil size={16} weight={row.note ? 'fill' : 'bold'} />
                                </button>
                              )}

                              {/* Tombol Kamera Lapangan Cepat */}
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

                          {/* Field Catatan Teknis Butir (Khusus temuan atau keterangan lapangan) */}
                          {showNoteInput && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 shrink-0">
                                <NotePencil size={13} weight="bold" className="text-[#C81E1E]" />
                                <span>Catatan Teknis Butir:</span>
                              </div>
                              <input
                                type="text"
                                disabled={readOnly}
                                value={row.note || ''}
                                onChange={(e) =>
                                  setDraftResults((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...(prev[item.id] || {}),
                                      itemId: item.id,
                                      note: e.target.value
                                    }
                                  }))
                                }
                                placeholder="Catatan temuan khusus, dimensi aus, lokasi kerusakan, atau klausul K3..."
                                className="flex-1 min-h-[38px] px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C81E1E]"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
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
