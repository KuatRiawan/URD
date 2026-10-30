import {
  EnvelopeSimple,
  WhatsappLogo
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { formatDate, formatDateTime, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { buildEmailUrl, buildWhatsAppUrl } from '../utils/historyReminder.js';

export function HistoryDetailModal({ selectedRecord, onClose }) {
  if (!selectedRecord) return null;

  return (
    <Modal
      open={Boolean(selectedRecord)}
      onClose={onClose}
      title={`Rincian Riwayat Pengujian: ${selectedRecord.object_name} (${selectedRecord.serial_number})`}
      size="lg"
    >
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md cursor-pointer"
            >
              <WhatsappLogo size={15} weight="bold" />
              <span>Kirim Reminder WhatsApp</span>
            </a>
            <a
              href={buildEmailUrl(selectedRecord)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-md cursor-pointer"
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
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    [{f.severity}] {f.description}
                  </div>
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
    </Modal>
  );
}

