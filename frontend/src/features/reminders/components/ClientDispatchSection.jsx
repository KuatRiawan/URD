import { PaperPlaneTilt } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Notice } from '../../../components/ui/Notice.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function ClientDispatchSection({ channels, clientLog }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PaperPlaneTilt size={20} className="text-[#C81E1E]" weight="bold" />
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Pengiriman Otomatis ke Klien
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dikirim setiap hari pukul 07:00 pada H-90, H-60, H-30, H-14, dan H-0.
            </p>
          </div>
        </div>
        {channels && (
          <div className="flex items-center gap-2">
            <Badge tone={channels.email === 'AKTIF' ? 'success' : 'warning'}>
              Email: {channels.email === 'AKTIF' ? 'Aktif' : 'Simulasi'}
            </Badge>
            <Badge tone={channels.whatsapp === 'AKTIF' ? 'success' : 'warning'}>
              WhatsApp: {channels.whatsapp === 'AKTIF' ? 'Aktif' : 'Simulasi'}
            </Badge>
          </div>
        )}
      </div>
      {channels && (channels.email !== 'AKTIF' || channels.whatsapp !== 'AKTIF') && (
        <div className="px-5 pt-4">
          <Notice tone="warning" title="Kanal belum terhubung">
            Kanal berstatus Simulasi hanya dicatat pada log dan tidak dikirim ke klien.
            Isi pengaturan SMTP dan token WhatsApp pada berkas .env server untuk mengaktifkan
            pengiriman nyata.
          </Notice>
        </div>
      )}
      {clientLog.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Belum ada pengiriman"
            description="Log muncul setelah evaluasi harian atau tombol Jalankan Dispatch Pengingat dijalankan."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Unit dan Klien</th>
                <th className="py-3 px-4">Tahap</th>
                <th className="py-3 px-4">Kanal dan Tujuan</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {clientLog.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(row.updated_at)}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{row.object_name}</div>
                    <div className="text-slate-500 dark:text-slate-400">{row.client_name}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{row.stage.replace('H', 'H-')}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {row.channel === 'EMAIL' ? 'Email' : 'WhatsApp'}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">{row.recipient || '-'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      tone={
                        row.status === 'TERKIRIM'
                          ? 'success'
                          : row.status === 'GAGAL'
                            ? 'danger'
                            : 'warning'
                      }
                    >
                      {row.status === 'TERKIRIM'
                        ? 'Terkirim'
                        : row.status === 'GAGAL'
                          ? 'Gagal'
                          : row.status === 'SIMULASI'
                            ? 'Simulasi'
                            : 'Dilewati'}
                    </Badge>
                    {row.error_message && (
                      <div className="mt-1 text-[11px] text-red-700 dark:text-red-400">{row.error_message}</div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

