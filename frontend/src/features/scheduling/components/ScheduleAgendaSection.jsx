import { CalendarCheck } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import {
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../../lib/utils/format.js';

export function ScheduleAgendaSection({ schedules }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarCheck size={20} className="text-[#C81E1E]" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Agenda Jadwal Pemeriksaan Lapangan ({schedules.length})
          </h2>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Belum ada jadwal pemeriksaan"
            description="Atur jadwal pemeriksaan melalui menu Order Pemeriksaan untuk menampilkannya di kalender ini."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Kartu Responsif Mobile (Layar < 768px) */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {schedules.map((sch) => (
              <div key={sch.id} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-[#C81E1E] dark:text-rose-400">
                    {sch.order_no}
                  </span>
                  <Badge tone="info">
                    {ORDER_STATUS_LABELS[sch.order_status] || sch.order_status}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {sch.client_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {sch.location_name || 'Lokasi Utama'}
                    {sch.location_city ? ` · ${sch.location_city}` : ''}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Layanan:</span>
                    <span className="font-semibold">{SERVICE_TYPE_LABELS[sch.service_type] || sch.service_type}</span>
                  </div>
                  <div className="flex flex-col text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium mb-0.5">Waktu Pelaksanaan:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatDateTime(sch.start_at)}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      s/d {formatDateTime(sch.end_at)}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Tim Ahli K3:
                  </p>
                  {(sch.assignments || []).length === 0 ? (
                    <span className="text-xs text-slate-400">Belum ada penugasan</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {(sch.assignments || []).map((asg) => (
                        <div
                          key={asg.id}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200"
                        >
                          <span className="font-semibold">{asg.fullName}</span>
                          <Badge
                            tone={
                              asg.status === 'DITERIMA'
                                ? 'success'
                                : asg.status === 'DITOLAK'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {asg.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {sch.notes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded border border-amber-200/50 dark:border-amber-800/40">
                    Catatan: {sch.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Tampilan Tabel Desktop (Layar >= 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Waktu Pelaksanaan</th>
                  <th className="py-3 px-4">No. Order & Layanan</th>
                  <th className="py-3 px-4">Klien & Lokasi</th>
                  <th className="py-3 px-4">Tim Ahli K3</th>
                  <th className="py-3 px-4">Status Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {schedules.map((sch) => (
                  <tr key={sch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {formatDateTime(sch.start_at)}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400">s/d {formatDateTime(sch.end_at)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100">{sch.order_no}</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {SERVICE_TYPE_LABELS[sch.service_type] || sch.service_type}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{sch.client_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {sch.location_name || 'Lokasi Utama'}
                        {sch.location_city ? ` · ${sch.location_city}` : ''}
                      </div>
                      {sch.notes && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sch.notes}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {(sch.assignments || []).length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-500">Belum ada penugasan</span>
                      ) : (
                        <div className="space-y-1">
                          {(sch.assignments || []).map((asg) => (
                            <div key={asg.id} className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {asg.fullName}
                              </span>
                              <Badge
                                tone={
                                  asg.status === 'DITERIMA'
                                    ? 'success'
                                    : asg.status === 'DITOLAK'
                                      ? 'danger'
                                      : 'warning'
                                }
                              >
                                {asg.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge tone="info">
                        {ORDER_STATUS_LABELS[sch.order_status] || sch.order_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
