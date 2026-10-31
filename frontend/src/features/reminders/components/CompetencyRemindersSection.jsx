import { Certificate } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function CompetencyRemindersSection({ competencyItems }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Certificate size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Pengingat Masa Berlaku SKP / Lisensi Ahli K3 ({competencyItems.length})
          </h2>
        </div>
      </div>

      {competencyItems.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Seluruh SKP Ahli K3 masih berlaku"
            description="Tidak ada SKP Ahli K3 yang jatuh tempo dalam jendela hari yang dipilih."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Mobile: Kartu Responsif */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 sm:p-4 space-y-3">
            {competencyItems.map((comp) => (
              <div
                key={comp.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {comp.inspector_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {comp.category_code} · {comp.category_name}
                    </p>
                  </div>
                  <Badge tone="warning">
                    {(comp.stage || 'H-90').replace('_', '-')} ({comp.days_remaining} hari)
                  </Badge>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Nomor SKP:</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {comp.certificate_no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Berlaku Sampai:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatDate(comp.valid_until)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Tahap</th>
                  <th className="py-3 px-4">Nama Ahli K3</th>
                  <th className="py-3 px-4">Bidang K3</th>
                  <th className="py-3 px-4">Nomor SKP</th>
                  <th className="py-3 px-4">Berlaku Sampai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {competencyItems.map((comp) => (
                  <tr key={comp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 text-xs">
                      <Badge tone="warning">
                        {(comp.stage || 'H-90').replace('_', '-')} ({comp.days_remaining} hari)
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-slate-100">
                      {comp.inspector_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{comp.category_code}</span>{' '}
                      · {comp.category_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">{comp.certificate_no}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {formatDate(comp.valid_until)}
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
