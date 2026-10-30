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
        <div className="overflow-x-auto">
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold"
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
                            className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            <CalendarPlus size={14} />
                            <span>Catat Tindak Lanjut</span>
                          </button>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => onCreateRenewalOrder(item.object_id, item.object_name)}
                            className="min-h-9 inline-flex items-center gap-1.5 rounded bg-slate-800 dark:bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
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
      )}
    </section>
  );
}
