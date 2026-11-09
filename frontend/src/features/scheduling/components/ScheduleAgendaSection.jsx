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
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
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
    <section className="bg-white dark:bg-[#151821] rounded-2xl border border-black/[0.06] dark:border-white/[0.08] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] space-y-0">
      {/* Header & Judul */}
      <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck size={20} className="text-[#C81E1E]" weight="bold" />
          <h2 className="text-[15px] font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Agenda Jadwal Pemeriksaan Lapangan ({schedules.length})
          </h2>
        </div>

        {/* Input Pencarian Cepat */}
        <div className="relative w-full sm:w-64">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari PO, Klien, atau Ahli K3..."
            className="w-full h-9 pl-8 pr-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
          />
        </div>
      </div>

      {/* Ringkasan Metrik Pengawasan Jadwal */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/[0.05] dark:divide-white/[0.06] border-b border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/60 dark:bg-white/[0.02]">
        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] text-[#6E6E73] dark:text-[#98989D]">
            <CalendarCheck size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">Total Terjadwal</div>
            <div className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{stats.total} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">Siap Uji (Konfirmasi)</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">{stats.confirmed} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">Menunggu Respon</div>
            <div className="text-base font-bold text-amber-700 dark:text-amber-400">{stats.pending} Order</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">Perlu Re-alokasi</div>
            <div className="text-base font-bold text-rose-700 dark:text-rose-400">{stats.rejected} Order</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      <div className="px-5 py-2.5 border-b border-black/[0.05] dark:border-white/[0.06] bg-white dark:bg-[#151821] flex items-center gap-1.5 overflow-x-auto">
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
            className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] shadow-2xs'
                : 'text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
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
          <div className="hidden md:block">
            <TableWrapper>
              <TableHead>
                <tr>
                  <TableCell isHeader className="w-[180px]">Waktu Pelaksanaan</TableCell>
                  <TableCell isHeader className="min-w-[170px]">No. Order &amp; Layanan</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Klien &amp; Lokasi</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Tim Ahli K3</TableCell>
                  <TableCell isHeader align="right" className="w-[140px]">Status Order</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {filteredSchedules.map((sch) => (
                  <TableRow key={sch.id}>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                        {formatDateTime(sch.start_at)}
                      </div>
                      <div className="text-[11px] text-[#6E6E73] dark:text-[#98989D]">s/d {formatDateTime(sch.end_at)}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono font-bold text-[#C81E1E] dark:text-red-400">{sch.order_no}</div>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        {SERVICE_TYPE_LABELS[sch.service_type] || sch.service_type}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{sch.client_name}</div>
                      <div className="text-[#6E6E73] dark:text-[#98989D]">
                        {sch.location_name || 'Lokasi Utama'}
                        {sch.location_city ? ` · ${sch.location_city}` : ''}
                      </div>
                      {sch.notes && (
                        <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">{sch.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {(sch.assignments || []).length === 0 ? (
                        <span className="text-[#86868B] dark:text-[#8E8E93]">Belum ada penugasan</span>
                      ) : (
                        <div className="space-y-1">
                          {(sch.assignments || []).map((asg) => (
                            <div key={asg.id} className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
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
                    </TableCell>
                    <TableCell align="right">
                      <Badge tone="info">
                        {ORDER_STATUS_LABELS[sch.order_status] || sch.order_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </TableWrapper>
          </div>
        </>
      )}
    </section>
  );
}
