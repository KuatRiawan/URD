import { useMemo } from 'react';
import { Link } from 'react-router';
import {
  MapPin,
  Buildings,
  Wrench,
  Briefcase,
  ArrowRight,
  ChartBar
} from '@phosphor-icons/react';

export function IndonesiaMapWidget({ regions = [] }) {
  const { totalUnits, totalOrders, totalClients, sortedRegions } = useMemo(() => {
    const sorted = [...regions].sort((a, b) => {
      const uA = Number(a.unit_count ?? a.count ?? 0);
      const uB = Number(b.unit_count ?? b.count ?? 0);
      return uB - uA;
    });

    const units = sorted.reduce((acc, r) => acc + Number(r.unit_count ?? r.count ?? 0), 0);
    const orders = sorted.reduce((acc, r) => acc + Number(r.order_count ?? r.orders ?? 0), 0);
    const clients = sorted.reduce((acc, r) => acc + Number(r.client_count ?? r.clients ?? 0), 0);

    return {
      totalUnits: units,
      totalOrders: orders,
      totalClients: clients,
      sortedRegions: sorted
    };
  }, [regions]);

  const topRegions = sortedRegions.slice(0, 3);

  return (
    <div className="bg-white dark:bg-[#151821] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header Widget */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.07] bg-[#F5F5F7]/60 dark:bg-[#11141C] px-4 py-3.5 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 rounded-xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400 flex items-center justify-center shrink-0">
            <MapPin size={20} weight="bold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Sebaran Wilayah Objek Uji K3
            </h2>
            <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5">
              Distribusi geografis lokasi site klien, konsentrasi unit alat, dan volume riksa uji
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1C1F2B] border border-black/[0.06] dark:border-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7]">
            <Buildings size={14} weight="bold" />
            <span>{sortedRegions.length} Wilayah Site</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#C81E1E]/10 border border-[#C81E1E]/20 text-[#C81E1E] dark:text-rose-400">
            <Wrench size={14} weight="bold" />
            <span>{totalUnits} Unit Alat</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Briefcase size={14} weight="bold" />
            <span>{totalOrders} PO</span>
          </span>
        </div>
      </div>

      {sortedRegions.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
            <MapPin size={20} />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Belum ada sebaran wilayah riksa uji tercatat.
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Lokasi operasional akan otomatis terpetakan setelah Purchase Order dan lokasi site klien didaftarkan.
          </p>
          <div className="pt-2">
            <Link
              to="/app/clients"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#C81E1E] hover:underline"
            >
              <span>Buka Direktori Klien</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Top 3 Region Highlights */}
          {topRegions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topRegions.map((reg, idx) => {
                const uCount = Number(reg.unit_count ?? reg.count ?? 0);
                const percent = totalUnits > 0 ? Math.round((uCount / totalUnits) * 100) : 0;
                const regName = reg.region_name || reg.region || `Wilayah ${idx + 1}`;

                return (
                  <div
                    key={`${regName}-${idx}`}
                    className="p-3.5 rounded-xl border border-black/[0.05] dark:border-white/[0.06] bg-[#F5F5F7]/50 dark:bg-[#151821]/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] truncate max-w-[140px] flex items-center gap-1.5">
                        <MapPin size={13} className="text-[#C81E1E] shrink-0" weight="bold" />
                        <span className="truncate">{regName}</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold text-[#C81E1E] dark:text-rose-400">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-black/[0.06] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C81E1E] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(percent, 4)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6E6E73] dark:text-[#98989D] pt-0.5">
                      <span>{uCount} Unit Alat</span>
                      <span>{reg.client_count ?? reg.clients ?? 0} Klien · {reg.order_count ?? reg.orders ?? 0} PO</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Operational Breakdown Table */}
          <div className="overflow-x-auto rounded-xl border border-black/[0.06] dark:border-white/[0.08]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7]/80 dark:bg-[#11141C] border-b border-black/[0.06] dark:border-white/[0.08] text-[#6E6E73] dark:text-[#98989D] uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">Wilayah / Kota Site</th>
                  <th scope="col" className="px-3.5 py-2.5 text-center">Klien Aktif</th>
                  <th scope="col" className="px-3.5 py-2.5 text-center">PO Riksa Uji</th>
                  <th scope="col" className="px-3.5 py-2.5 text-center">Volume Unit Alat</th>
                  <th scope="col" className="px-3.5 py-2.5">Proporsi Portofolio</th>
                  <th scope="col" className="px-3.5 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.06] bg-white dark:bg-[#151821]">
                {sortedRegions.map((reg, idx) => {
                  const regName = reg.region_name || reg.region || `Wilayah ${idx + 1}`;
                  const uCount = Number(reg.unit_count ?? reg.count ?? 0);
                  const oCount = Number(reg.order_count ?? reg.orders ?? 0);
                  const cCount = Number(reg.client_count ?? reg.clients ?? 0);
                  const percent = totalUnits > 0 ? Math.round((uCount / totalUnits) * 100) : 0;

                  return (
                    <tr
                      key={`${regName}-${idx}`}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3.5 py-2.5 font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#C81E1E] shrink-0" />
                          <span>{regName}</span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {cCount}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {oCount}
                      </td>
                      <td className="px-3.5 py-2.5 text-center font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                        {uCount}
                      </td>
                      <td className="px-3.5 py-2.5 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-black/[0.06] dark:bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#C81E1E] h-full rounded-full"
                              style={{ width: `${Math.max(percent, 3)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400 w-8 text-right">
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                        <Link
                          to={`/app/clients?q=${encodeURIComponent(regName)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C81E1E] hover:underline"
                        >
                          <span>Klien</span>
                          <ArrowRight size={11} weight="bold" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
