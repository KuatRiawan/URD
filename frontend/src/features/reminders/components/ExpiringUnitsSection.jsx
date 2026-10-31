import {
  ArrowsClockwise,
  CalendarPlus,
  EnvelopeSimple,
  WarningOctagon,
  WhatsappLogo
} from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { FOLLOWUP_STATUS_LABELS, formatDate } from '../../../lib/utils/format.js';

export function ExpiringUnitsSection({
  datedUnits,
  expiryStateLabels,
  canManage,
  submitting,
  onOpenValidityModal,
  onCreateRenewalOrder
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WarningOctagon size={20} className="text-[#C81E1E]" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Unit Alat Mendekati Jatuh Tempo / Kedaluwarsa ({datedUnits.length})
          </h2>
        </div>
      </div>

      {datedUnits.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Tidak ada unit jatuh tempo dalam jendela ini"
            description="Unit yang memiliki tanggal masa berlaku atau jadwal pemeriksaan berikutnya dalam jendela hari ini akan tampil di sini."
          />
        </div>
      ) : (
        <>
          {/* Tampilan Mobile: Kartu Responsif Touch-Friendly */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 sm:p-4 space-y-3">
            {datedUnits.map((item) => (
              <div
                key={item.object_id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
              >
                {/* Header: Status & Hari Tersisa */}
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <Badge
                    tone={
                      item.expiryState === 'SUDAH_KEDALUWARSA' ||
                      item.expiryState === 'JATUH_TEMPO_PEMERIKSAAN'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {expiryStateLabels[item.expiryState] || item.expiryState}
                  </Badge>
                  <span
                    className={`text-xs font-extrabold ${
                      item.days_remaining < 0
                        ? 'text-red-600 dark:text-red-400'
                        : item.days_remaining === 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.days_remaining < 0
                      ? `Lewat ${Math.abs(item.days_remaining)} hari`
                      : item.days_remaining === 0
                      ? 'Jatuh tempo hari ini'
                      : `${item.days_remaining} hari lagi`}
                  </span>
                </div>

                {/* Info Unit Alat & Klien */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Unit Alat:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right truncate max-w-[200px]">
                      {item.object_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Kategori &amp; SN:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {item.category_code} · SN: {item.serial_number}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Klien:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[200px]">
                      {item.client_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">Tgl Jatuh Tempo:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatDate(item.effective_valid_until)}
                    </span>
                  </div>
                  {item.suket_no && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Suket:</span>
                      <span>{item.suket_no}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Tindak Lanjut:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                    </span>
                  </div>
                </div>

                {/* Tombol Aksi Mobile */}
                {canManage && (
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => onCreateRenewalOrder(item.object_id, item.object_name)}
                      className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] transition-colors cursor-pointer"
                    >
                      <ArrowsClockwise size={15} />
                      <span>Buat PO Perpanjangan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenValidityModal(item)}
                      className="w-full min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <CalendarPlus size={15} />
                      <span>Catat Tindak Lanjut</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tampilan Desktop & Tablet: Tabel Lengkap */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Status Masa Berlaku</th>
                  <th className="py-3 px-4">Tanggal Jatuh Tempo</th>
                  <th className="py-3 px-4">Perusahaan Klien</th>
                  <th className="py-3 px-4">Unit Alat &amp; Nomor Seri</th>
                  <th className="py-3 px-4">Tindak Lanjut</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {datedUnits.map((item) => (
                  <tr key={item.object_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-xs">
                      <Badge
                        tone={
                          item.expiryState === 'SUDAH_KEDALUWARSA' ||
                          item.expiryState === 'JATUH_TEMPO_PEMERIKSAAN'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {expiryStateLabels[item.expiryState] || item.expiryState}
                      </Badge>
                      <div className="mt-1 font-bold text-slate-900 dark:text-slate-100">
                        {item.days_remaining < 0
                          ? `Lewat ${Math.abs(item.days_remaining)} hari`
                          : item.days_remaining === 0
                          ? 'Jatuh tempo hari ini'
                          : `${item.days_remaining} hari lagi`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {formatDate(item.effective_valid_until)}
                      </div>
                      {item.suket_no && (
                        <div className="font-mono text-slate-500 dark:text-slate-400">Suket: {item.suket_no}</div>
                      )}
                      {item.last_lhpp_no && (
                        <div className="font-mono text-slate-500 dark:text-slate-400">LHPP: {item.last_lhpp_no}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.client_name}</div>
                      <div className="text-slate-600 dark:text-slate-400">
                        PIC: {item.contact_name || '-'} · {item.contact_phone || item.client_phone || '-'}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {item.contact_email || item.client_email || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {item.category_code} · SN: {item.serial_number}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-300">
                        {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                      </div>
                      {item.last_followup_note && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {item.last_followup_note}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <span
                          title="Pengingat perpanjangan dikirimkan secara terjadwal otomatis melalui WhatsApp Business API dan Email resmi PT Upaya Riksa Daya"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
                        >
                          <WhatsappLogo size={13} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                          <EnvelopeSimple size={13} weight="bold" className="text-blue-600 dark:text-blue-400" />
                          <span>Otomatis (WABA + Email)</span>
                        </span>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => onOpenValidityModal(item)}
                              className="min-h-9 inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <CalendarPlus size={14} />
                              <span>Catat Tindak Lanjut</span>
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => onCreateRenewalOrder(item.object_id, item.object_name)}
                              className="min-h-9 inline-flex items-center gap-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                            >
                              <ArrowsClockwise size={15} />
                              <span>Buat PO Perpanjangan</span>
                            </button>
                          </>
                        )}
                      </div>
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
