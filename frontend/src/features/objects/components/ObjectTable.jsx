import { QrCode } from '@phosphor-icons/react';
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
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
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
                    className="min-h-9 px-2.5 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 inline-flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <QrCode size={15} aria-hidden="true" />
                    <span>QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openDetail(obj.id)}
                    className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-semibold hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                  >
                    Riwayat &amp; Berkas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationBar page={page} limit={15} total={total} onPageChange={setPage} />
    </div>
  );
}

