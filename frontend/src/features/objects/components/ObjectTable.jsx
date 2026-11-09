import { ArrowsClockwise, Cube, Eye, QrCode } from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';
import { ActionMenu } from '../../../components/ui/ActionMenu.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../../components/ui/TableWrapper.jsx';
import { PaginationBar } from '../../../components/feedback/StateViews.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function ObjectTable({
  items,
  page,
  total,
  setPage,
  openQr,
  openDetail,
  canCreateRenewal,
  onCreateRenewal
}) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Objek Uji Touch-Friendly */}
      <div className="sm:hidden space-y-3">
        {items.map((obj) => {
          const hasExpiredSuket =
            obj.active_suket_valid_until &&
            new Date(obj.active_suket_valid_until).getTime() < Date.now() + 30 * 86400000;

          return (
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
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  touchFriendly
                  icon={Eye}
                  onClick={() => openDetail(obj.id)}
                  className="flex-1"
                >
                  Detail
                </Button>
                {canCreateRenewal && hasExpiredSuket && onCreateRenewal && (
                  <Button
                    variant="primary"
                    size="sm"
                    touchFriendly
                    icon={ArrowsClockwise}
                    onClick={() => onCreateRenewal(obj.id, obj.name)}
                    className="flex-1"
                  >
                    PO Ulang
                  </Button>
                )}
                <ActionMenu
                  label={`Aksi unit ${obj.name}`}
                  items={[
                    {
                      key: 'qr',
                      label: 'Tampilkan QR Code',
                      icon: QrCode,
                      onClick: () => openQr(obj.id)
                    }
                  ]}
                />
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
              <TableCell isHeader>Kategori</TableCell>
              <TableCell isHeader>Nama Objek &amp; Merek</TableCell>
              <TableCell isHeader>Nomor Seri</TableCell>
              <TableCell isHeader>Klien &amp; Lokasi</TableCell>
              <TableCell isHeader>Suket K3 Aktif</TableCell>
              <TableCell isHeader align="right">Aksi</TableCell>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((obj) => {
              const hasExpiredSuket =
                obj.active_suket_valid_until &&
                new Date(obj.active_suket_valid_until).getTime() < Date.now() + 30 * 86400000;

              return (
                <TableRow key={obj.id}>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                        {obj.domain_code || obj.category_code}
                      </span>
                      {obj.equipment_type_name && (
                        <span className="text-[10px] font-semibold text-[#6E6E73] dark:text-[#98989D] truncate max-w-[120px]">
                          {obj.equipment_type_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{obj.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {obj.brand || '-'} {obj.model ? `· ${obj.model}` : ''}{' '}
                      {obj.capacity ? `· Kapasitas: ${obj.capacity}` : ''}
                    </p>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    {obj.serial_number}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{obj.client_name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {obj.install_location || obj.location_name || '-'}
                    </p>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
                      {canCreateRenewal && hasExpiredSuket && onCreateRenewal && (
                        <Button
                          variant="primary"
                          size="xs"
                          icon={ArrowsClockwise}
                          onClick={() => onCreateRenewal(obj.id, obj.name)}
                          aria-label={`Buat PO Perpanjangan untuk ${obj.name}`}
                        >
                          PO Ulang
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="xs"
                        icon={Eye}
                        onClick={() => openDetail(obj.id)}
                      >
                        Detail
                      </Button>
                      <ActionMenu
                        label={`Opsi unit ${obj.name}`}
                        items={[
                          {
                            key: 'qr',
                            label: 'Tampilkan QR Code',
                            icon: QrCode,
                            onClick: () => openQr(obj.id)
                          }
                        ]}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </TableWrapper>
      </div>

      <PaginationBar page={page} limit={15} total={total} onPageChange={setPage} />
    </div>
  );
}
