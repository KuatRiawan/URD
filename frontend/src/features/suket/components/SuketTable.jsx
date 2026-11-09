import { Eye } from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import {
  FOLLOWUP_STATUS_LABELS,
  formatDate,
  SUKET_STATUS_LABELS
} from '../../../lib/utils/format.js';

const STATUS_TONE = {
  BERKAS_DISIAPKAN: 'neutral',
  DIAJUKAN: 'info',
  DALAM_PROSES: 'warning',
  TERBIT: 'success',
  PERLU_PERBAIKAN: 'danger'
};

export function SuketTable({ items, onOpenDetail }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Registri Suket K3 */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const days = item.days_remaining;
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
            >
              {/* Header: No Suket & Status */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block truncate">
                    {item.suket_no || 'Belum Terbit Nomor'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {item.issuer || '-'}
                  </span>
                </div>
                <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                  {SUKET_STATUS_LABELS[item.status] || item.status}
                </Badge>
              </div>

              {/* Info Klien & Objek */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Klien:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                    {item.client_name}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Objek Uji:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                    {item.object_name} (SN: {item.serial_number})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Masa Berlaku:</span>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.valid_until ? formatDate(item.valid_until) : '-'}
                    </span>
                    {days !== null && days !== undefined && (
                      <span
                        className={`block text-[10px] font-bold ${
                          days < 0
                            ? 'text-red-700 dark:text-red-400'
                            : days <= 60
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {days < 0 ? `Kedaluwarsa ${Math.abs(days)} hari lalu` : `Sisa ${days} hari`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Tindak Lanjut:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="secondary"
                  size="sm"
                  touchFriendly
                  icon={Eye}
                  onClick={() => onOpenDetail(item.id)}
                  className="w-full"
                >
                  Detail Suket K3
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block">
        <TableWrapper>
          <TableHead>
            <tr>
              <TableCell isHeader>No. Suket &amp; Instansi</TableCell>
              <TableCell isHeader>Perusahaan Klien</TableCell>
              <TableCell isHeader>Objek Uji K3</TableCell>
              <TableCell isHeader>Masa Berlaku</TableCell>
              <TableCell isHeader>Status Penerbitan</TableCell>
              <TableCell isHeader>Tindak Lanjut</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const days = item.days_remaining;
              return (
                <TableRow key={item.id}>
                  <TableCell className="text-xs">
                    <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {item.suket_no || 'Belum Terbit Nomor'}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">{item.issuer || '-'}</div>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {item.client_name}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {item.category_code} · SN: {item.serial_number}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {item.valid_until ? formatDate(item.valid_until) : '-'}
                    </div>
                    {days !== null && days !== undefined && (
                      <div
                        className={`text-[11px] font-bold ${
                          days < 0
                            ? 'text-red-700 dark:text-red-400'
                            : days <= 60
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {days < 0
                          ? `Kedaluwarsa ${Math.abs(days)} hari lalu`
                          : `Sisa ${days} hari`}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                      {SUKET_STATUS_LABELS[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Eye}
                      onClick={() => onOpenDetail(item.id)}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableWrapper>
      </div>
    </div>
  );
}
