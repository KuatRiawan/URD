import { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  WarningCircle
} from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import {
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../../lib/utils/format.js';

export function ScheduleAgendaSection({ schedules }) {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Hitung metrik pengawasan jadwal
  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let rejected = 0;

    for (const sch of schedules) {
      const asgs = sch.assignments || [];
      if (asgs.some((a) => a.status === 'DITOLAK')) {
        rejected++;
      } else if (asgs.length > 0 && asgs.every((a) => a.status === 'DITERIMA')) {
        confirmed++;
      } else if (asgs.some((a) => a.status === 'TERKIRIM' || a.status === 'MENUNGGU')) {
        pending++;
      }
    }

    return {
      total: schedules.length,
      confirmed,
      pending,
      rejected
    };
  }, [schedules]);

  // Filter jadwal sesuai tab dan pencarian
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      const asgs = sch.assignments || [];
      const hasRejected = asgs.some((a) => a.status === 'DITOLAK');
      const isConfirmed = asgs.length > 0 && asgs.every((a) => a.status === 'DITERIMA');
      const hasPending = asgs.some((a) => a.status === 'TERKIRIM' || a.status === 'MENUNGGU');

      if (filterStatus === 'CONFIRMED' && !isConfirmed) return false;
      if (filterStatus === 'PENDING' && !hasPending) return false;
      if (filterStatus === 'REJECTED' && !hasRejected) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesOrder = sch.order_no?.toLowerCase().includes(q);
        const matchesClient = sch.client_name?.toLowerCase().includes(q);
        const matchesCity = sch.location_city?.toLowerCase().includes(q);
        const matchesLocation = sch.location_name?.toLowerCase().includes(q);
        const matchesInspector = asgs.some((a) => a.fullName?.toLowerCase().includes(q));

        if (!matchesOrder && !matchesClient && !matchesCity && !matchesLocation && !matchesInspector) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, filterStatus, searchQuery]);

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs space-y-0">
      {/* Header & Judul */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={20} className="text-[#C81E1E]" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Agenda Jadwal Pemeriksaan Lapangan ({schedules.length})
          </h2>
        </div>

        {/* Input Pencarian Cepat */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari PO, Klien, atau Ahli K3..."
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:border-[#C81E1E]"
          />
        </div>
      </div>

      {/* Ringkasan Metrik Pengawasan Jadwal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <CalendarCheck size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Terjadwal</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">{stats.total} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Siap Uji (Konfirmasi)</div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">{stats.confirmed} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Menunggu Respon</div>
            <div className="text-base font-extrabold text-amber-700 dark:text-amber-400">{stats.pending} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Perlu Re-alokasi</div>
            <div className="text-base font-extrabold text-rose-700 dark:text-rose-400">{stats.rejected} Order</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto">
        {[
          { key: 'ALL', label: `Semua Agenda (${schedules.length})` },
          { key: 'CONFIRMED', label: `Terkonfirmasi (${stats.confirmed})` },
          { key: 'PENDING', label: `Menunggu Respon (${stats.pending})` },
          { key: 'REJECTED', label: `Ditolak / Butuh Re-alokasi (${stats.rejected})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Konten Daftar / Tabel */}
      {schedules.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Belum ada jadwal pemeriksaan"
            description="Atur jadwal pemeriksaan melalui menu Order Pemeriksaan untuk menampilkannya di kalender ini."
          />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Tidak ada jadwal yang sesuai filter"
            description="Coba ubah kata kunci pencarian atau pilih tab status lain di atas."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Kartu Responsif Mobile (Layar < 768px) */}
          <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
            {filteredSchedules.map((sch) => (
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
                {filteredSchedules.map((sch) => (
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
