import {
  ArrowSquareOut,
  BellRinging,
  ChatCircleDots,
  EnvelopeSimple
} from '@phosphor-icons/react';
import { Link } from 'react-router';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatDate, formatDateTime, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { buildEmailUrl, buildWhatsAppUrl } from '../utils/historyReminder.js';

export function HistoryDetailModal({ selectedRecord, onClose }) {
  if (!selectedRecord) return null;

  const hasPhone = Boolean(selectedRecord.contact_phone || selectedRecord.client_phone);
  const hasEmail = Boolean(selectedRecord.contact_email || selectedRecord.client_email);
  const effectiveValidity =
    selectedRecord.suket_valid_until ||
    selectedRecord.next_inspection_date ||
    selectedRecord.recommended_valid_until;

  return (
    <Modal
      open={Boolean(selectedRecord)}
      onClose={onClose}
      title={`Jejak Audit & Riwayat Riksa Uji: ${selectedRecord.object_name} (${selectedRecord.serial_number})`}
      size="lg"
    >
      <div className="space-y-5 text-sm">
        {/* Banner Pemisahan Tanggung Jawab: Audit vs Reminder */}
        {effectiveValidity && (
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <BellRinging size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" weight="bold" />
              <div>
                <span className="font-bold block">Status Masa Berlaku: {formatDate(effectiveValidity)}</span>
                <span className="text-slate-600 dark:text-slate-300">
                  Pengingat berkala resmi (H-30, H-14, H-7), log notifikasi, dan konversi PO perpanjangan dikelola terpusat.
                </span>
              </div>
            </div>
            <Link
              to="/app/reminders"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shrink-0 text-xs"
            >
              <span>Buka Pengingat</span>
              <ArrowSquareOut size={13} weight="bold" />
            </Link>
          </div>
        )}

        {/* Grid Metadata Jejak Audit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">1. Tanggal Pemeriksaan</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatDateTime(selectedRecord.inspected_at || selectedRecord.submitted_at)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">2. Purchase Order (PO) &amp; Order</span>
            <span className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
              PO: {selectedRecord.po_number || '-'} <span className="text-slate-500">({selectedRecord.order_no})</span>
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">3. Nomor BAP &amp; Waktu Final</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {selectedRecord.bap_no || '-'} ·{' '}
              {selectedRecord.bap_finalized_at
                ? formatDateTime(selectedRecord.bap_finalized_at)
                : selectedRecord.bap_status || 'Belum final'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">4. Nomor LHPP &amp; Status Terbit</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {selectedRecord.lhpp_no || '-'} ·{' '}
              {selectedRecord.lhpp_published_at
                ? formatDateTime(selectedRecord.lhpp_published_at)
                : selectedRecord.lhpp_status || 'Belum terbit'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">5. Bidang &amp; Jenis Pemeriksaan</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedRecord.category_code} · {SERVICE_TYPE_LABELS[selectedRecord.service_type] || selectedRecord.service_type}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">6. Ahli K3 / Inspector</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{selectedRecord.inspector_name}</span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">7. Kesimpulan Pemeriksaan</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {selectedRecord.conclusion ? selectedRecord.conclusion.replace(/_/g, ' ') : '-'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">
              8. Masa Berlaku / Jatuh Tempo Berkala
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {effectiveValidity ? formatDate(effectiveValidity) : 'Belum ditentukan'}
              {selectedRecord.suket_no ? ` (Suket: ${selectedRecord.suket_no})` : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">9. Siklus Revisi QC</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Revisi #{selectedRecord.inspection_revision_no || 0} · Versi LHPP v{selectedRecord.lhpp_version || 1}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 block font-medium">10. Penyerahan Berkas ke Klien</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {selectedRecord.deliveries?.length
                ? `Diserahkan (${selectedRecord.deliveries[0].channel} - ${selectedRecord.deliveries[0].recipientName})`
                : 'Belum tercatat penyerahan'}
            </span>
          </div>

          {/* Kontak PIC Klien untuk Koordinasi */}
          <div className="sm:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
            <span className="text-slate-500 dark:text-slate-400 block font-medium mb-1">
              11. Kontak PIC Perusahaan Klien
            </span>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {selectedRecord.contact_name || selectedRecord.client_name || '-'} ·{' '}
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {selectedRecord.contact_phone || selectedRecord.client_phone || '-'}
                </span>{' '}
                · {selectedRecord.contact_email || selectedRecord.client_email || '-'}
              </span>
              <div className="flex items-center gap-2">
                {hasPhone && (
                  <a
                    href={buildWhatsAppUrl(selectedRecord)}
                    target="_blank"
                    rel="noreferrer"
                    title="Koordinasi teknis dengan PIC via WhatsApp"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <ChatCircleDots size={14} weight="bold" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {hasEmail && (
                  <a
                    href={buildEmailUrl(selectedRecord)}
                    title="Koordinasi teknis dengan PIC via Email"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <EnvelopeSimple size={14} weight="bold" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Temuan Lapangan & Rekomendasi */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Temuan Lapangan &amp; Rekomendasi Teknis K3
          </h4>
          {selectedRecord.findings?.length ? (
            <div className="space-y-2">
              {selectedRecord.findings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs space-y-1"
                >
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    [{f.severity}] {f.description}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">Rekomendasi: {f.recommendation}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              {selectedRecord.lhpp_recommendations ||
                selectedRecord.conclusion_notes ||
                'Tidak ada temuan penyimpangan kritis pada riwayat pemeriksaan ini.'}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
