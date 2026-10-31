import {
  EnvelopeSimple,
  FilePdf,
  Truck,
  WhatsappLogo
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { buildEmailUrl, buildWhatsAppUrl } from '../utils/historyReminder.js';

export function HistoryTable({ items, downloadPdf, onSelectRecord }) {
  return (
    <div className="space-y-4">
      {/* Tampilan Mobile: Kartu Riwayat Pemeriksaan */}
      <div className="sm:hidden space-y-3">
        {items.map((item) => {
          const effectiveValidity =
            item.suket_valid_until ||
            item.next_inspection_date ||
            item.recommended_valid_until;
          const delivered = Array.isArray(item.deliveries) && item.deliveries.length > 0;

          return (
            <div
              key={item.inspection_id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
            >
              {/* Header: Tanggal & PO */}
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sm text-[#C81E1E] dark:text-red-400 block truncate">
                    PO: {item.po_number || item.order_no}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tanggal: {formatDate(item.inspected_at || item.submitted_at)}
                  </span>
                </div>
                <Badge
                  variant={
                    item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                      ? 'danger'
                      : item.conclusion
                      ? 'success'
                      : 'neutral'
                  }
                >
                  {item.conclusion ? item.conclusion.replace(/_/g, ' ') : item.inspection_status}
                </Badge>
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
                  <span className="text-slate-500 dark:text-slate-400">Inspector:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {item.inspector_name}
                  </span>
                </div>

                {/* Referensi Dokumen PDF */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {item.bap_id && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadPdf(
                          `/bap/${item.bap_id}/pdf`,
                          `${(item.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-[11px] font-bold text-[#C81E1E] dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60 cursor-pointer"
                    >
                      <FilePdf size={13} weight="bold" />
                      <span>{item.bap_no}</span>
                    </button>
                  )}
                  {item.lhpp_id && (
                    <button
                      type="button"
                      onClick={() =>
                        downloadPdf(
                          `/lhpp/${item.lhpp_id}/pdf`,
                          `${(item.lhpp_no || 'Draf-LHPP').replace(/\//g, '-')}.pdf`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-[11px] font-bold text-blue-700 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60 cursor-pointer"
                    >
                      <FilePdf size={13} weight="bold" />
                      <span>{item.lhpp_no || 'LHPP'}</span>
                    </button>
                  )}
                </div>

                {effectiveValidity && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Masa Berlaku:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatDate(effectiveValidity)} {item.suket_no ? `(Suket: ${item.suket_no})` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onSelectRecord(item)}
                  className="flex-1 min-h-[42px] inline-flex items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-700 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  Rincian
                </button>
                <a
                  href={buildWhatsAppUrl(item)}
                  target="_blank"
                  rel="noreferrer"
                  title="WhatsApp"
                  className="min-h-[42px] px-3.5 inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold"
                >
                  <WhatsappLogo size={16} weight="bold" />
                  <span>WA</span>
                </a>
                <a
                  href={buildEmailUrl(item)}
                  title="Email"
                  className="min-h-[42px] px-3 inline-flex items-center justify-center gap-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold"
                >
                  <EnvelopeSimple size={16} weight="bold" />
                  <span>Email</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tampilan Desktop & Tablet: Tabel Tabular Lengkap */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tanggal &amp; PO</th>
                <th className="py-3.5 px-4">Unit Alat &amp; Klien</th>
                <th className="py-3.5 px-4">Jenis &amp; Inspector</th>
                <th className="py-3.5 px-4">Hasil Pemeriksaan</th>
                <th className="py-3.5 px-4">Dokumen BAP &amp; LHPP</th>
                <th className="py-3.5 px-4">Masa Berlaku / Jadwal</th>
                <th className="py-3.5 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {items.map((item) => {
                const effectiveValidity =
                  item.suket_valid_until ||
                  item.next_inspection_date ||
                  item.recommended_valid_until;
                const delivered = Array.isArray(item.deliveries) && item.deliveries.length > 0;

                return (
                  <tr
                    key={item.inspection_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatDate(item.inspected_at || item.submitted_at)}
                      </div>
                      <div className="text-xs font-mono font-bold text-[#C81E1E]">
                        PO: {item.po_number || item.order_no}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Order: {item.order_no}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {item.category_code} · SN: <span className="font-mono">{item.serial_number}</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.client_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {SERVICE_TYPE_LABELS[item.service_type] || item.service_type}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Oleh: {item.inspector_name}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                            ? 'danger'
                            : item.conclusion
                            ? 'success'
                            : 'neutral'
                        }
                      >
                        {item.conclusion
                          ? item.conclusion.replace(/_/g, ' ')
                          : item.inspection_status}
                      </Badge>
                      {item.findings?.length > 0 && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                          {item.findings.length} temuan tercatat
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      {item.bap_id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {item.bap_no}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadPdf(
                                `/bap/${item.bap_id}/pdf`,
                                `${(item.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="text-[#C81E1E] hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <FilePdf size={13} weight="bold" />
                            <span>PDF</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">BAP belum dibuat</div>
                      )}

                      {item.lhpp_id ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                            {item.lhpp_no || `LHPP (${item.lhpp_status})`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              downloadPdf(
                                `/lhpp/${item.lhpp_id}/pdf`,
                                `${(item.lhpp_no || 'Draf-LHPP').replace(/\//g, '-')}.pdf`
                              )
                            }
                            className="text-blue-700 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <FilePdf size={13} weight="bold" />
                            <span>PDF</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400">LHPP belum dibuat</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {effectiveValidity ? (
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {formatDate(effectiveValidity)}
                          </div>
                          {item.suket_no && (
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              Suket: {item.suket_no}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Badge variant="warning">Belum Ada Tanggal Masa Berlaku</Badge>
                      )}
                      <div className="mt-1">
                        {delivered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                            <Truck size={12} weight="bold" /> Diserahkan ke klien
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Belum diserahkan
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <a
                          href={buildWhatsAppUrl(item)}
                          target="_blank"
                          rel="noreferrer"
                          title={`Kirim Reminder WhatsApp ke ${item.contact_phone || item.client_phone || 'Klien'}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors"
                        >
                          <WhatsappLogo size={14} weight="bold" />
                          <span>WA</span>
                        </a>
                        <a
                          href={buildEmailUrl(item)}
                          title={`Kirim Reminder Email ke ${item.contact_email || item.client_email || 'Klien'}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors"
                        >
                          <EnvelopeSimple size={14} weight="bold" />
                          <span>Email</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => onSelectRecord(item)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          Rincian
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
