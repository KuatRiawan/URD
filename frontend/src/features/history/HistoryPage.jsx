import React, { useCallback, useEffect, useState } from 'react';
import {
  ClockCounterClockwise,
  EnvelopeSimple,
  FilePdf,
  MagnifyingGlass,
  SealCheck,
  Truck,
  WhatsappLogo
} from '@phosphor-icons/react';
import { LoadingState, ErrorState, EmptyState } from '../../components/feedback/StateViews.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDate, formatDateTime, SERVICE_TYPE_LABELS } from '../../lib/utils/format.js';

function normalizePhoneForWhatsApp(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function buildReminderMessage(item) {
  const effectiveValidity =
    item.suket_valid_until || item.next_inspection_date || item.recommended_valid_until;
  const picLabel = item.contact_name ? `Bapak/Ibu ${item.contact_name}` : 'Bapak/Ibu PIC K3';
  const inspectedDate = formatDate(item.inspected_at || item.submitted_at);
  const validDate = effectiveValidity ? formatDate(effectiveValidity) : 'Jadwal Berkala Berikutnya';

  return [
    `Yth. ${picLabel} (${item.client_name || 'Perusahaan Klien'}),`,
    '',
    'Kami dari PT Upaya Riksa Daya ingin menyampaikan informasi riwayat pemeriksaan dan pengingat jadwal riksa uji berkala untuk unit peralatan K3 berikut:',
    `- Unit Alat: ${item.object_name || '-'} (${item.category_code || '-'})`,
    `- Nomor Seri / Kapasitas: ${item.serial_number || '-'} / ${item.capacity_value ? `${item.capacity_value} ${item.capacity_unit || ''}` : '-'}`,
    `- Nomor PO: ${item.po_number || item.order_no || '-'}`,
    `- Nomor BAP / LHPP: ${item.bap_no || '-'} / ${item.lhpp_no || '-'}`,
    `- Tanggal Pemeriksaan Terakhir: ${inspectedDate}`,
    `- Masa Berlaku / Jadwal Riksa Uji Berikutnya: ${validDate}`,
    '',
    'Apabila Bapak/Ibu memerlukan penjadwalan pemeriksaan berkala (perpanjangan) atau konsultasi dokumen K3, silakan menghubungi tim operasional PT Upaya Riksa Daya.',
    '',
    'Terima kasih atas kerja samanya.',
    'PT Upaya Riksa Daya'
  ].join('\n');
}

function buildWhatsAppUrl(item) {
  const phone = normalizePhoneForWhatsApp(item.contact_phone || item.client_phone);
  const text = encodeURIComponent(buildReminderMessage(item));
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}

function buildEmailUrl(item) {
  const email = item.contact_email || item.client_email || '';
  const subject = encodeURIComponent(
    `Pengingat Riksa Uji Berkala K3 - ${item.object_name || 'Unit Alat'} (${item.client_name || ''})`
  );
  const body = encodeURIComponent(buildReminderMessage(item));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

export function HistoryPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (search.trim()) params.q = search.trim();
      if (clientFilter) params.clientId = clientFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const [histRes, cliRes, catRes] = await Promise.all([
        api.get('/objects/history/all', { params }),
        api.get('/clients?limit=100'),
        api.get('/objects/categories')
      ]);
      setItems(histRes.data.items || []);
      setClients(cliRes.data.items || []);
      setCategories(catRes.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memuat riwayat pengujian unit K3.');
    } finally {
      setLoading(false);
    }
  }, [search, clientFilter, categoryFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const downloadPdf = async (endpoint, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      // Abaikan jika gagal unduh
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Riwayat Pengujian Unit K3"
        subtitle="Jejak historis pemeriksaan dan pengujian setiap unit alat lintas Purchase Order (PO), lengkap dengan BAP, LHPP, temuan, masa berlaku, dan status penyerahan."
      />

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            <option value="">Semua Perusahaan Klien</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            <option value="">Semua Kategori Alat K3</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.code} - {cat.name}
              </option>
            ))}
          </select>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchHistory();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Unit, No. Seri, PO, Klien..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white rounded-md hover:bg-slate-800 dark:hover:bg-slate-700"
          >
            Cari Riwayat
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingState message="Memuat riwayat pengujian unit K3..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchHistory} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum Ada Riwayat Pengujian"
          description="Riwayat pengujian unit akan tercatat secara otomatis setiap kali pemeriksaan dilaksanakan pada suatu PO."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tanggal & PO</th>
                  <th className="py-3.5 px-4">Unit Alat & Klien</th>
                  <th className="py-3.5 px-4">Jenis & Inspector</th>
                  <th className="py-3.5 px-4">Hasil Pemeriksaan</th>
                  <th className="py-3.5 px-4">Dokumen BAP & LHPP</th>
                  <th className="py-3.5 px-4">Masa Berlaku / Jadwal Berikutnya</th>
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
                    <tr key={item.inspection_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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
                        <div className="text-xs text-slate-500 dark:text-slate-400">Oleh: {item.inspector_name}</div>
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
                              className="text-[#C81E1E] hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              <FilePdf size={13} weight="bold" />
                              PDF
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
                              className="text-blue-700 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              <FilePdf size={13} weight="bold" />
                              PDF
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
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">Belum diserahkan</span>
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
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-md"
                          >
                            <WhatsappLogo size={14} weight="bold" />
                            <span>WA</span>
                          </a>
                          <a
                            href={buildEmailUrl(item)}
                            title={`Kirim Reminder Email ke ${item.contact_email || item.client_email || 'Klien'}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md"
                          >
                            <EnvelopeSimple size={14} weight="bold" />
                            <span>Email</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(item)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700"
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
      )}

      {/* Modal Rincian Riwayat Pengujian 1 Unit */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={
          selectedRecord
            ? `Rincian Riwayat Pengujian: ${selectedRecord.object_name} (${selectedRecord.serial_number})`
            : 'Rincian Riwayat'
        }
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">1. Tanggal Pemeriksaan</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatDateTime(selectedRecord.inspected_at || selectedRecord.submitted_at)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">2. Nomor Purchase Order (PO) & Order</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedRecord.po_number || '-'} ({selectedRecord.order_no})
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">3. Nomor BAP & Waktu Finalisasi</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedRecord.bap_no || '-'} ·{' '}
                  {selectedRecord.bap_finalized_at
                    ? formatDateTime(selectedRecord.bap_finalized_at)
                    : selectedRecord.bap_status || 'Belum final'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">4. Nomor LHPP & Waktu Terbit</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {selectedRecord.lhpp_no || '-'} ·{' '}
                  {selectedRecord.lhpp_published_at
                    ? formatDateTime(selectedRecord.lhpp_published_at)
                    : selectedRecord.lhpp_status || 'Belum terbit'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">5. Jenis Pemeriksaan</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {SERVICE_TYPE_LABELS[selectedRecord.service_type] || selectedRecord.service_type}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">6. Inspector Pemeriksa</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{selectedRecord.inspector_name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">7. Kesimpulan Pemeriksaan</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedRecord.conclusion ? selectedRecord.conclusion.replace(/_/g, ' ') : '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">
                  8. Masa Berlaku / Jadwal Pemeriksaan Berikutnya
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedRecord.suket_valid_until ||
                  selectedRecord.next_inspection_date ||
                  selectedRecord.recommended_valid_until
                    ? formatDate(
                        selectedRecord.suket_valid_until ||
                          selectedRecord.next_inspection_date ||
                          selectedRecord.recommended_valid_until
                      )
                    : 'Data masa berlaku belum lengkap'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">9. Riwayat Revisi</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Revisi Form #{selectedRecord.inspection_revision_no || 0} · Versi LHPP v
                  {selectedRecord.lhpp_version || 1}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">10. Status Penyerahan ke Klien</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRecord.deliveries?.length
                    ? `Diserahkan (${selectedRecord.deliveries[0].channel} - ${selectedRecord.deliveries[0].recipientName})`
                    : 'Belum tercatat penyerahan'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">11. Kontak PIC & Pengingat Klien</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedRecord.contact_name || selectedRecord.client_name || '-'} ·{' '}
                  {selectedRecord.contact_phone || selectedRecord.client_phone || '-'} ·{' '}
                  {selectedRecord.contact_email || selectedRecord.client_email || '-'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <a
                  href={buildWhatsAppUrl(selectedRecord)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
                >
                  <WhatsappLogo size={15} weight="bold" />
                  <span>Kirim Reminder WhatsApp</span>
                </a>
                <a
                  href={buildEmailUrl(selectedRecord)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md"
                >
                  <EnvelopeSimple size={15} weight="bold" />
                  <span>Kirim Reminder Email</span>
                </a>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Temuan Lapangan & Rekomendasi Teknis
              </h4>
              {selectedRecord.findings?.length ? (
                <div className="space-y-2">
                  {selectedRecord.findings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-slate-100">[{f.severity}] {f.description}</div>
                      <div className="text-slate-600 dark:text-slate-400">Rekomendasi: {f.recommendation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded border border-slate-200 dark:border-slate-700">
                  {selectedRecord.lhpp_recommendations ||
                    selectedRecord.conclusion_notes ||
                    'Tidak ada temuan penyimpangan kritis pada pemeriksaan ini.'}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
