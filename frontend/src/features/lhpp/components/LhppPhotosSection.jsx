import { Camera, Image as ImageIcon, Plus, Trash } from '@phosphor-icons/react';
import { formatDateTime } from '../../../lib/utils/format.js';

export function LhppPhotosSection({
  detailLhpp,
  isInspector,
  photoFile,
  setPhotoFile,
  photoCaption,
  setPhotoCaption,
  uploadingPhoto,
  handleUploadPhoto,
  handleDeletePhoto
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-white dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <ImageIcon size={16} />
          <span>
            Bab VIII: Lampiran Dokumentasi Foto Riksa Uji ({(detailLhpp.photos || []).length} Foto)
          </span>
        </h4>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Tercetak otomatis pada halaman lampiran LHPP resmi
        </span>
      </div>

      {/* Grid Foto yang Terlampir */}
      {(detailLhpp.photos || []).length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {detailLhpp.photos.map((ph, idx) => (
            <div
              key={ph.id}
              className="group relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 flex flex-col shadow-xs"
            >
              <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <img
                  src={`/api/v1/dashboard/files/${ph.id}`}
                  alt={ph.caption || 'Foto Dokumentasi'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                    Foto {idx + 1}: {ph.caption || ph.originalName}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">
                    {formatDateTime(ph.createdAt)}
                  </div>
                </div>
                {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(ph.id)}
                    className="mt-2 text-[10px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash size={12} />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-500 dark:text-slate-400 text-center">
          Belum ada foto dokumentasi terlampir. Foto dapat diunggah melalui formulir di bawah ini atau secara otomatis terintegrasi dari lembar kerja inspeksi lapangan.
        </div>
      )}

      {/* Form Unggah Foto Tambahan */}
      {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
        <form
          onSubmit={handleUploadPhoto}
          className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md space-y-2"
        >
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Camera size={15} />
            <span>Tambah Foto Dokumentasi Lapangan</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              'Tampak Keseluruhan',
              'Papan Nama (Nameplate)',
              'Komponen Konstruksi',
              'Pengujian NDT',
              'Uji Beban 100%',
              'Stiker Riksa Uji K3'
            ].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setPhotoCaption(tag)}
                className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                + {tag}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
            <div className="sm:col-span-5">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-900 dark:file:bg-slate-700 file:text-white hover:file:bg-slate-800"
              />
            </div>
            <div className="sm:col-span-5">
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Keterangan foto (mis: Uji Beban 100% SWL)..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={uploadingPhoto || !photoFile}
                className="w-full min-h-8 inline-flex items-center justify-center gap-1 rounded bg-slate-900 dark:bg-slate-700 px-2 py-1 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
              >
                <Plus size={13} />
                <span>{uploadingPhoto ? 'Mengunggah...' : 'Unggah'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
