import { Cube, QrCode } from '@phosphor-icons/react';
import { PaginationBar } from '../../../components/feedback/StateViews.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function ObjectTable({
  items,
  page,
  total,
  setPage,
  openQr,
  openDetail
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Objek Uji Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {items.map((obj) => (
          <div
            key={obj.id}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
          >
            {/* Header: Nama Alat & Kategori */}
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {obj.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                    {obj.category_code}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  SN: <span className="font-semibold text-slate-800 dark:text-slate-200">{obj.serial_number}</span>
                </p>
              </div>
            </div>

            {/* Info Spesifikasi & Klien */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Perusahaan Klien:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 text-right truncate max-w-[200px]">
                  {obj.client_name}
                </span>
              </div>
              {(obj.brand || obj.model || obj.capacity) && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Spesifikasi:</span>
                  <span className="text-right text-slate-700 dark:text-slate-300">
                    {[obj.brand, obj.model, obj.capacity ? `SWL ${obj.capacity}` : null].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              {obj.install_location && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                  <span>Lokasi Pasang:</span>
                  <span className="text-right text-slate-700 dark:text-slate-300">{obj.install_location}</span>
                </div>
              )}
              <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Suket K3:</span>
                {obj.active_suket_no ? (
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-right">
                    {obj.active_suket_no} (s/d {formatDate(obj.active_suket_valid_until)})
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Belum ada Suket aktif</span>
                )}
              </div>
            </div>

            {/* Tombol Aksi Mobile */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => openQr(obj.id)}
                aria-label={`QR Code ${obj.name}`}
                className="min-h-[42px] px-3.5 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <QrCode size={16} />
                <span>QR</span>
              </button>
              <button
                type="button"
                onClick={() => openDetail(obj.id)}
                className="flex-1 min-h-[42px] inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
              >
                Riwayat &amp; Berkas
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <th className="py-3 px-4 font-bold">Kategori</th>
                <th className="py-3 px-4 font-bold">Nama Objek &amp; Merek</th>
                <th className="py-3 px-4 font-bold">Nomor Seri</th>
                <th className="py-3 px-4 font-bold">Klien &amp; Lokasi</th>
                <th className="py-3 px-4 font-bold">Suket K3 Aktif</th>
                <th className="py-3 px-4 font-bold text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {items.map((obj) => (
                <tr key={obj.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100">
                      {obj.category_code}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{obj.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {obj.brand || '-'} {obj.model ? `· ${obj.model}` : ''}{' '}
                      {obj.capacity ? `· Kapasitas: ${obj.capacity}` : ''}
                    </p>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {obj.serial_number}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{obj.client_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {obj.install_location || obj.location_name || '-'}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    {obj.active_suket_no ? (
                      <div>
                        <p className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {obj.active_suket_no}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          s/d {formatDate(obj.active_suket_valid_until)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">Belum ada</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openQr(obj.id)}
                      aria-label={`Tampilkan QR Code ${obj.name}`}
                      className="min-h-9 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                    >
                      <QrCode size={15} aria-hidden="true" />
                      <span>QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openDetail(obj.id)}
                      className="min-h-9 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                    >
                      Riwayat &amp; Berkas
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationBar page={page} limit={15} total={total} onPageChange={setPage} />
    </div>
  );
}
