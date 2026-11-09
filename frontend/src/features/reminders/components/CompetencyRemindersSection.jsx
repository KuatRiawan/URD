import { Certificate } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function CompetencyRemindersSection({ competencyItems }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Certificate size={20} className="text-[#C81E1E]" weight="bold" />
        <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
          Pengingat Masa Berlaku SKP / Lisensi Ahli K3 ({competencyItems.length})
        </h2>
      </div>

      {competencyItems.length === 0 ? (
        <div className="p-6 bg-white dark:bg-[#151821] rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
          <EmptyState
            title="Seluruh SKP Ahli K3 masih berlaku"
            description="Tidak ada SKP Ahli K3 yang jatuh tempo dalam jendela hari yang dipilih."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Mobile: Kartu Responsif */}
          <div className="md:hidden space-y-3">
            {competencyItems.map((comp) => (
              <div
                key={comp.id}
                className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-black/[0.05] dark:border-white/[0.06]">
                  <div>
                    <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-[#F5F5F7] leading-snug">
                      {comp.inspector_name}
                    </h3>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                      {comp.category_code} · {comp.category_name}
                    </p>
                  </div>
                  <Badge tone="warning">
                    {(comp.stage || 'H-90').replace('_', '-')} ({comp.days_remaining} hari)
                  </Badge>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Nomor SKP:</span>
                    <span className="font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {comp.certificate_no}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#6E6E73] dark:text-[#98989D]">Berlaku Sampai:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                      {formatDate(comp.valid_until)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden md:block">
            <TableWrapper>
              <TableHead>
                <tr>
                  <TableCell isHeader className="w-[180px]">Tahap</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Nama Ahli K3</TableCell>
                  <TableCell isHeader className="min-w-[200px]">Bidang K3</TableCell>
                  <TableCell isHeader className="w-[180px]">Nomor SKP</TableCell>
                  <TableCell isHeader className="w-[160px]">Berlaku Sampai</TableCell>
                </tr>
              </TableHead>
              <TableBody>
                {competencyItems.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="text-xs">
                      <Badge tone="warning">
                        {(comp.stage || 'H-90').replace('_', '-')} ({comp.days_remaining} hari)
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {comp.inspector_name}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{comp.category_code}</span>{' '}
                      · {comp.category_name}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-[#1D1D1F] dark:text-[#F5F5F7]">{comp.certificate_no}</TableCell>
                    <TableCell className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] font-mono tabular-nums">
                      {formatDate(comp.valid_until)}
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
