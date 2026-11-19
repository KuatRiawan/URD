import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  FolderOpen,
  Image as ImageIcon,
  MagnifyingGlassPlus,
  NotePencil,
  Plus,
  Trash,
  Warning,
  X
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';

export const PHOTO_CATEGORIES = [
  {
    key: 'FOTO_UNIT',
    tag: '[8.1 Foto Unit]',
    label: '8.1 Foto Unit',
    subtitle: 'Tampak depan, tampak samping, tampak belakang, dan keseluruhan unit',
    matcher: (p) => {
      const cat = String(p.doc_category || p.docCategory || '').toUpperCase();
      const cap = String(p.caption || '').toLowerCase();
      return (
        cat === 'FOTO_UNIT' ||
        /8\.1|foto unit|tampak depan|tampak samping|tampak belakang|keseluruhan/i.test(cap)
      );
    }
  },
  {
    key: 'FOTO_VISUAL',
    tag: '[8.2 Foto Pemeriksaan Visual]',
    label: '8.2 Foto Pemeriksaan Visual',
    subtitle: 'Kondisi fisik komponen, mast, garpu, sasis, rantai, ban, dan temuan visual',
    matcher: (p) => {
      const cat = String(p.doc_category || p.docCategory || '').toUpperCase();
      const cap = String(p.caption || '').toLowerCase();
      return (
        cat === 'FOTO_VISUAL' ||
        /8\.2|visual|komponen|chasis|mast|garpu|fork|rangka|ban|mesin/i.test(cap)
      );
    }
  },
  {
    key: 'FOTO_FUNGSI',
    tag: '[8.3 Foto Uji Fungsi]',
    label: '8.3 Foto Uji Fungsi',
    subtitle: 'Pengujian operasional, tuas kemudi, sistem hidrolik, klakson, dan lampu',
    matcher: (p) => {
      const cat = String(p.doc_category || p.docCategory || '').toUpperCase();
      const cap = String(p.caption || '').toLowerCase();
      return (
        cat === 'FOTO_FUNGSI' ||
        /8\.3|uji fungsi|fungsi|operasional|indikator|lampu|klakson/i.test(cap)
      );
    }
  },
  {
    key: 'FOTO_BEBAN',
    tag: '[8.4 Foto Uji Beban]',
    label: '8.4 Foto Uji Beban',
    subtitle: 'Pengujian beban kerja aman (SWL) dan pengukuran defleksi garpu',
    matcher: (p) => {
      const cat = String(p.doc_category || p.docCategory || '').toUpperCase();
      const cap = String(p.caption || '').toLowerCase();
      return (
        cat === 'FOTO_BEBAN' ||
        /8\.4|uji beban|beban|defleksi|load test/i.test(cap)
      );
    }
  },
  {
    key: 'FOTO_STIKER',
    tag: '[8.5 Foto Stiker]',
    label: '8.5 Foto Stiker',
    subtitle: 'Stiker riksa uji K3, stiker nameplate kapasitas, dan identifikasi alat',
    matcher: (p) => {
      const cat = String(p.doc_category || p.docCategory || '').toUpperCase();
      const cap = String(p.caption || '').toLowerCase();
      return (
        cat === 'FOTO_STIKER' ||
        /8\.5|stiker|sticker|nameplate|plat nama/i.test(cap)
      );
    }
  }
];

export function StepPhotosFindings({
  photos = [],
  findings = [],
  findingForm = { severity: 'MAYOR', description: '', recommendation: '' },
  setFindingForm,
  isInspector = true,
  readOnly = false,
  submitting = false,
  onUploadPhotoDirect,
  onUpdatePhotoCaption,
  onDeletePhoto,
  onAddFinding,
  onBack,
  onNext
}) {
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editingCaptionText, setEditingCaptionText] = useState('');
  const [activeUploadCategory, setActiveUploadCategory] = useState(null);

  const cameraInputRefs = useRef({});
  const galleryInputRefs = useRef({});

  const handleTriggerUpload = async (e, category) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    for (const f of files) {
      if (onUploadPhotoDirect) {
        await onUploadPhotoDirect(f, `${category.tag} ${f.name.replace(/\.[^/.]+$/, '')}`, category.key);
      }
    }
    e.target.value = '';
  };

  const handleSaveCaption = async (photoId) => {
    if (!editingCaptionText.trim()) return;
    if (onUpdatePhotoCaption) {
      await onUpdatePhotoCaption(photoId, editingCaptionText.trim());
    }
    setEditingPhotoId(null);
  };

  // Group photos
  const categorizedPhotos = PHOTO_CATEGORIES.map((cat) => {
    const matched = photos.filter((p) => cat.matcher(p));
    return {
      ...cat,
      photos: matched
    };
  });

  const uncategorizedPhotos = photos.filter(
    (p) => !PHOTO_CATEGORIES.some((cat) => cat.matcher(p))
  );

  return (
    <div className="space-y-6">
      {/* HEADER SECTION 8 */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-[#C81E1E] dark:text-red-400 flex items-center justify-center font-bold text-base shrink-0">
              8
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                DOKUMENTASI FOTO LAPANGAN
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Total {photos.length} Foto
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dokumentasikan 5 kategori utama. Foto otomatis dipetakan ke Bab VIII Dokumen Resmi LHPP.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                photos.length >= 2
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              }`}
            >
              {photos.length >= 2 ? '✓ Dokumentasi Lengkap' : 'Disarankan Minimal 2 Foto'}
            </span>
          </div>
        </div>
      </div>

      {/* 5 KATEGORI FOTO DOKUMENTASI RESMI */}
      <div className="space-y-4">
        {categorizedPhotos.map((cat) => (
          <div
            key={cat.key}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-2xs"
          >
            {/* Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {cat.label}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {cat.photos.length} Foto
                    </span>
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cat.subtitle}</p>
              </div>

              {!readOnly && (
                <div className="flex items-center gap-2">
                  {/* Camera Input (Hidden) */}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={(el) => (cameraInputRefs.current[cat.key] = el)}
                    className="hidden"
                    onChange={(e) => handleTriggerUpload(e, cat)}
                  />
                  {/* Gallery Input (Hidden) */}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={(el) => (galleryInputRefs.current[cat.key] = el)}
                    className="hidden"
                    onChange={(e) => handleTriggerUpload(e, cat)}
                  />

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={Camera}
                    disabled={submitting}
                    onClick={() => cameraInputRefs.current[cat.key]?.click()}
                  >
                    Kamera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={FolderOpen}
                    disabled={submitting}
                    onClick={() => galleryInputRefs.current[cat.key]?.click()}
                  >
                    Galeri
                  </Button>
                </div>
              )}
            </div>

            {/* Photo Grid */}
            {cat.photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cat.photos.map((ph) => {
                  const isEditing = editingPhotoId === ph.id;
                  return (
                    <div
                      key={ph.id}
                      className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 overflow-hidden flex flex-col justify-between"
                    >
                      <div
                        onClick={() =>
                          setEnlargedPhoto({
                            url: `/api/v1/dashboard/files/${ph.id}`,
                            caption: ph.caption || ph.originalName
                          })
                        }
                        className="relative aspect-4/3 bg-slate-200 dark:bg-slate-700 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={`/api/v1/dashboard/files/${ph.id}`}
                          alt={ph.caption || ph.originalName}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <MagnifyingGlassPlus size={14} />
                        </span>
                      </div>

                      <div className="p-2.5 space-y-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingCaptionText}
                              onChange={(e) => setEditingCaptionText(e.target.value)}
                              className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                              placeholder="Keterangan foto..."
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="primary"
                              size="xs"
                              icon={Check}
                              onClick={() => handleSaveCaption(ph.id)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              icon={X}
                              onClick={() => setEditingPhotoId(null)}
                            />
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                              {ph.caption || ph.originalName}
                            </p>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPhotoId(ph.id);
                                  setEditingCaptionText(ph.caption || ph.originalName);
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0 p-1"
                                title="Ubah keterangan"
                              >
                                <NotePencil size={14} />
                              </button>
                            )}
                          </div>
                        )}

                        {!readOnly && (
                          <div className="flex items-center justify-end pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <button
                              type="button"
                              onClick={() => onDeletePhoto && onDeletePhoto(ph.id)}
                              className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium"
                            >
                              <Trash size={12} /> Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 text-center py-6">
                <ImageIcon size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-1.5" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Belum ada foto pada {cat.label}.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Gunakan tombol Kamera untuk memotret langsung atau Galeri untuk memilih foto.
                </p>
              </div>
            )}
          </div>
        ))}

        {uncategorizedPhotos.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Foto Tambahan / Lainnya ({uncategorizedPhotos.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {uncategorizedPhotos.map((ph) => (
                <div key={ph.id} className="aspect-4/3 rounded-lg overflow-hidden border">
                  <img src={`/api/v1/dashboard/files/${ph.id}`} alt={ph.caption} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TEMUAN & CATATAN LAPANGAN */}
      <div id="inspection-findings-section" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Warning size={18} weight="bold" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Catatan &amp; Temuan Ketidaksesuaian Lapangan
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Catat temuan kritis jika ada komponen yang tidak memenuhi syarat K3.
            </p>
          </div>
        </div>

        {!readOnly && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tingkat Keparahan
                </label>
                <select
                  value={findingForm.severity || 'MAYOR'}
                  onChange={(e) => setFindingForm && setFindingForm((prev) => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                >
                  <option value="RINGAN">Ringan (Observasi)</option>
                  <option value="SEDANG">Sedang (Perlu Perawatan)</option>
                  <option value="MAYOR">Mayor (Segera Ditindaklanjuti)</option>
                  <option value="KRITIS">Kritis (Hentikan Operasi)</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Deskripsi Temuan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rantai angkat aus > 5% atau selang hidrolik rembes oli..."
                  value={findingForm.description || ''}
                  onChange={(e) => setFindingForm && setFindingForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Rekomendasi Tindakan Perbaikan
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Contoh: Lakukan penggantian rantai angkat dengan sertifikasi pabrikan..."
                  value={findingForm.recommendation || ''}
                  onChange={(e) => setFindingForm && setFindingForm((prev) => ({ ...prev, recommendation: e.target.value }))}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  disabled={!findingForm.description || submitting}
                  onClick={onAddFinding}
                >
                  Tambah
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Daftar Temuan yang sudah dicatat */}
        {findings.length > 0 ? (
          <div className="space-y-2">
            {findings.map((f, idx) => (
              <div
                key={f.id || idx}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">#{idx + 1}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        f.severity === 'KRITIS'
                          ? 'bg-red-100 text-red-800'
                          : f.severity === 'MAYOR'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{f.description}</span>
                  </div>
                  {f.recommendation && (
                    <p className="text-slate-500 dark:text-slate-400 pl-5">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">Rekomendasi:</span> {f.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Belum ada temuan ketidaksesuaian yang dicatat pada unit ini.
          </p>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        {onBack && (
          <Button type="button" variant="secondary" size="md" icon={ArrowLeft} onClick={onBack}>
            Kembali ke Data Umum
          </Button>
        )}
        {onNext && (
          <Button type="button" variant="primary" size="md" icon={ArrowRight} onClick={onNext}>
            Lanjut: Simpulan &amp; Pengesahan Ahli K3
          </Button>
        )}
      </div>

      {/* MODAL PREVIEW FOTO DIPERBESAR */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img src={enlargedPhoto.url} alt={enlargedPhoto.caption} className="max-w-full max-h-[80vh] object-contain mx-auto" />
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span>{enlargedPhoto.caption}</span>
              <button type="button" onClick={() => setEnlargedPhoto(null)} className="p-1 hover:text-red-400">
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
