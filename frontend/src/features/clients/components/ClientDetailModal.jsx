import { ShareNetwork, Copy, Check } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';

export function ClientDetailModal({
  detailData,
  onClose,
  canEdit,
  subFeedback,
  portalUrl,
  portalCopied,
  portalLoading,
  onGeneratePortalToken,
  onCopyPortalUrl,
  locForm,
  setLocForm,
  onAddLocation,
  picForm,
  setPicForm,
  onAddContact
}) {
  if (!detailData) return null;

  return (
    <Modal
      open={Boolean(detailData)}
      onClose={onClose}
      title={`Detail Klien: ${detailData.client?.name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
        {subFeedback && <Notice tone="success">{subFeedback}</Notice>}

        {/* Bagian Bagikan Portal Klien */}
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShareNetwork size={16} className="text-[#C81E1E]" weight="bold" />
                <span>Portal Baca Khusus Klien (Read-Only)</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Berikan tautan berproteksi token kepada klien untuk memantau status riksa uji dan mengunduh BAP/LHPP resmi tanpa perlu akun staf.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={onGeneratePortalToken}
                disabled={portalLoading}
                className="shrink-0 min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 disabled:opacity-50 cursor-pointer"
              >
                {portalLoading ? 'Memproses...' : 'Buat Tautan Akses'}
              </button>
            )}
          </div>

          {portalUrl && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <input
                type="text"
                readOnly
                value={portalUrl}
                className="flex-1 min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 font-mono text-xs text-slate-700 dark:text-slate-300"
              />
              <button
                type="button"
                onClick={onCopyPortalUrl}
                className="min-h-9 inline-flex items-center gap-1 px-3 py-1 rounded bg-[#C81E1E] font-bold text-white hover:bg-red-800 cursor-pointer"
              >
                {portalCopied ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                <span>{portalCopied ? 'Tersalin' : 'Salin Tautan'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Lokasi / Cabang */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Daftar Lokasi / Cabang ({detailData.locations?.length || 0})
            </h3>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-md">
              {!detailData.locations?.length ? (
                <li className="p-3 text-slate-500 dark:text-slate-400">Belum ada lokasi terdaftar.</li>
              ) : (
                detailData.locations.map((loc) => (
                  <li key={loc.id} className="p-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {loc.name} {loc.city ? `(${loc.city})` : ''}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{loc.address}</p>
                  </li>
                ))
              )}
            </ul>

            {canEdit && (
              <form
                onSubmit={onAddLocation}
                className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700"
              >
                <p className="font-bold text-slate-900 dark:text-white">Tambah Lokasi / Cabang</p>
                <div>
                  <label htmlFor="loc-name" className="block font-semibold mb-1">
                    Nama Lokasi / Plant *
                  </label>
                  <input
                    id="loc-name"
                    type="text"
                    required
                    value={locForm.name}
                    onChange={(e) => setLocForm({ ...locForm, name: e.target.value })}
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="loc-addr" className="block font-semibold mb-1">
                    Alamat Lokasi *
                  </label>
                  <input
                    id="loc-addr"
                    type="text"
                    required
                    value={locForm.address}
                    onChange={(e) => setLocForm({ ...locForm, address: e.target.value })}
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label htmlFor="loc-city" className="block font-semibold mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    id="loc-city"
                    type="text"
                    value={locForm.city}
                    onChange={(e) => setLocForm({ ...locForm, city: e.target.value })}
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-10 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Simpan Lokasi
                </button>
              </form>
            )}
          </div>

          {/* Kontak PIC */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Daftar Kontak PIC ({detailData.contacts?.length || 0})
            </h3>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-md">
              {!detailData.contacts?.length ? (
                <li className="p-3 text-slate-500 dark:text-slate-400">Belum ada kontak PIC terdaftar.</li>
              ) : (
                detailData.contacts.map((ct) => (
                  <li key={ct.id} className="p-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100">
                      {ct.name} {ct.position ? `· ${ct.position}` : ''}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      {ct.phone || '-'} · {ct.email || '-'}
                    </p>
                  </li>
                ))
              )}
            </ul>

            {canEdit && (
              <form
                onSubmit={onAddContact}
                className="space-y-2 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3 border border-slate-200 dark:border-slate-700"
              >
                <p className="font-bold text-slate-900 dark:text-white">Tambah Kontak PIC</p>
                <div>
                  <label htmlFor="pic-name" className="block font-semibold mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    id="pic-name"
                    type="text"
                    required
                    value={picForm.name}
                    onChange={(e) => setPicForm({ ...picForm, name: e.target.value })}
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="pic-pos" className="block font-semibold mb-1">
                      Jabatan
                    </label>
                    <input
                      id="pic-pos"
                      type="text"
                      value={picForm.position}
                      onChange={(e) => setPicForm({ ...picForm, position: e.target.value })}
                      className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="pic-phone" className="block font-semibold mb-1">
                      No. Telepon / WA
                    </label>
                    <input
                      id="pic-phone"
                      type="text"
                      value={picForm.phone}
                      onChange={(e) => setPicForm({ ...picForm, phone: e.target.value })}
                      className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="pic-email" className="block font-semibold mb-1">
                    Email
                  </label>
                  <input
                    id="pic-email"
                    type="email"
                    value={picForm.email}
                    onChange={(e) => setPicForm({ ...picForm, email: e.target.value })}
                    className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  className="min-h-10 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Simpan Kontak
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
