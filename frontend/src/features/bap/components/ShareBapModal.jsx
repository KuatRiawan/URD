import { useState, useId } from 'react';
import {
  CheckCircle,
  Copy,
  DeviceMobile,
  DownloadSimple,
  ShareNetwork,
  WarningCircle,
  WhatsappLogo
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDate } from '../../../lib/utils/format.js';

export function ShareBapModal({
  open,
  isOpen,
  onClose,
  bap,
  onDownloadPdf
}) {
  const visible = Boolean(open ?? isOpen);
  const toast = useToast();
  const phoneInputId = useId();

  // Prefill nomor telepon klien/PIC
  const initialPhone =
    bap?.contact_phone ||
    bap?.client_phone ||
    bap?.document_data?.contact_phone ||
    '';

  const [phone, setPhone] = useState(initialPhone);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!bap) return null;

  const picName =
    bap.contact_name ||
    bap.client_signer_name ||
    bap.document_data?.contact_name ||
    bap.client_name ||
    'Bapak/Ibu Pimpinan';

  const clientName = bap.client_name || bap.document_data?.client_name || 'Klien PT Upaya Riksa Daya';
  const bapNo = bap.bap_no || '-';
  const poNo = bap.po_number || bap.order_no || '-';
  const objectName = bap.object_name || bap.document_data?.object_name || 'Unit Alat';
  const serialNo = bap.serial_number || bap.document_data?.serial_number || '-';
  const inspectionDate = formatDate(bap.inspection_date) || '-';
  const conclusionText =
    bap.is_compliant === true
      ? 'MEMENUHI SYARAT K3'
      : bap.is_compliant === false
      ? 'TIDAK MEMENUHI SYARAT'
      : 'HASIL PEMERIKSAAN LAPANGAN';

  // Template pesan resmi formal
  const shareMessageText = `Yth. ${picName}
${clientName}

Berikut kami sampaikan dokumen Berita Acara Riksa Uji (BAP) dari PT Upaya Riksa Daya:
• No. BAP: ${bapNo}
• No. PO: ${poNo}
• Objek: ${objectName} (SN: ${serialNo})
• Hasil Riksa Uji: ${conclusionText}
• Tanggal Riksa Uji: ${inspectionDate}

Dokumen resmi Berita Acara Riksa Uji dapat diperiksa dan diunduh secara resmi. Terima kasih atas kerja sama Anda dalam pemenuhan standar keselamatan dan kesehatan kerja (K3).

Hormat kami,
PT UPAYA RIKSA DAYA (PJK3)
Bidang Pemeriksaan dan Pengujian K3`;

  // Format nomor WhatsApp (hapus karakter non-digit, ubah 08xxx -> 628xxx)
  const formatPhoneForWa = (raw) => {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1);
    }
    return digits;
  };

  const logShareAction = async (method, recipient, notes = '') => {
    try {
      await api.post(`/bap/${bap.id}/share-log`, {
        bapNo,
        orderId: bap.order_id,
        objectId: bap.object_id,
        objectName,
        clientName,
        shareMethod: method,
        recipient,
        notes
      });
    } catch (err) {
      // Non-blocking log
      console.warn('Gagal mencatat log pembagian BAP:', err);
    }
  };

  // 1. Bagikan via WhatsApp
  const handleShareWhatsApp = async () => {
    const cleanPhone = formatPhoneForWa(phone);
    const encodedText = encodeURIComponent(shareMessageText);
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    await logShareAction('WHATSAPP', cleanPhone || 'Nomor Kontak Dipilih', 'Buka tautan WhatsApp resmi');
    toast(
      cleanPhone
        ? `Membuka WhatsApp untuk mengirim BAP ke nomor ${cleanPhone}...`
        : 'Membuka WhatsApp untuk memilih kontak tujuan...',
      'info'
    );
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // 2. Bagikan Berkas PDF via Native Share API (Perangkat / OS)
  const handleShareNative = async () => {
    setSharing(true);
    try {
      // Ambil berkas PDF dari server
      const res = await api.get(`/bap/${bap.id}/pdf`, { responseType: 'blob' });
      const filename = `${(bapNo || 'BAP').replace(/\//g, '-')}.pdf`;
      const file = new File([res.data], filename, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Berita Acara Riksa Uji: ${bapNo}`,
          text: `Berita Acara Riksa Uji (BAP) ${objectName} - ${bapNo}`
        });
        await logShareAction('NATIVE_APP', 'Aplikasi Perangkat', 'Dibagikan via dialog sistem');
        toast('Dokumen BAP berhasil dibagikan melalui aplikasi perangkat.', 'success');
      } else if (navigator.share) {
        await navigator.share({
          title: `Berita Acara Riksa Uji: ${bapNo}`,
          text: shareMessageText
        });
        await logShareAction('NATIVE_APP', 'Aplikasi Perangkat', 'Dibagikan via ringkasan teks');
        toast('Ringkasan BAP berhasil dibagikan.', 'success');
      } else {
        toast('Fitur berbagi berkas langsung tidak didukung browser ini. Gunakan opsi WhatsApp atau Salin Teks.', 'warning');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Gagal membagikan berkas BAP:', err);
        toast('Gagal membagikan berkas secara langsung: ' + (err.message || 'Kesalahan sistem'), 'error');
      }
    } finally {
      setSharing(false);
    }
  };

  // 3. Salin Teks Ringkasan Dokumen BAP ke Clipboard
  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(shareMessageText);
      setCopied(true);
      await logShareAction('COPY_SUMMARY', 'Clipboard', 'Disalin ke papan klip');
      toast('Teks ringkasan Berita Acara Riksa Uji berhasil disalin ke clipboard.', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  // 4. Unduh Berkas PDF
  const handleTriggerDownload = async () => {
    if (onDownloadPdf) {
      await onDownloadPdf(bap.id, bap.bap_no);
      await logShareAction('DIRECT_DOWNLOAD', 'Unduhan Lokal', 'Pengunduhan langsung dari dialog bagikan');
      toast('Memulai pengunduhan dokumen PDF BAP...', 'info');
    }
  };

  return (
    <Modal
      open={visible}
      isOpen={visible}
      onClose={onClose}
      title="Bagikan Berita Acara Riksa Uji (BAP)"
      size="lg"
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            Setiap aksi pembagian dicatat pada log riwayat operasional.
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Ringkasan Dokumen BAP yang Dibagikan */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-700/80">
            <div>
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-white block">
                {bapNo}
              </span>
              <span className="text-xs font-mono text-[#C81E1E] dark:text-rose-400 block">
                PO: {poNo}
              </span>
            </div>
            <Badge variant={bap.status === 'FINAL' ? 'success' : 'warning'}>
              {bap.status === 'FINAL' ? 'BAP FINAL' : 'DRAF BAP'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Unit Objek:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                {objectName}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                SN: {serialNo}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Klien &amp; PIC:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                {clientName}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                PIC: {picName}
              </span>
            </div>
          </div>
        </div>

        {/* Form Tujuan & Pilihan Metode Berbagi */}
        <div className="space-y-3">
          <div>
            <label htmlFor={phoneInputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp Tujuan (Klien / PIC):
            </label>
            <div className="flex items-center gap-2">
              <input
                id={phoneInputId}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
              />
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <WhatsappLogo size={16} weight="bold" />
                <span>Kirim WhatsApp</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Pesan pengantar dan ringkasan riksa uji akan disiapkan otomatis untuk dikirim ke kontak di atas.
            </p>
          </div>

          {/* Opsi Berbagi Lainnya */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleShareNative}
              disabled={sharing}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <DeviceMobile size={18} className="text-[#C81E1E]" weight="bold" />
              <span>{sharing ? 'Menyiapkan...' : 'Bagikan ke Aplikasi'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopySummary}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? (
                <CheckCircle size={18} className="text-emerald-600" weight="bold" />
              ) : (
                <Copy size={18} className="text-slate-600 dark:text-slate-400" weight="bold" />
              )}
              <span>{copied ? 'Tersalin!' : 'Salin Ringkasan'}</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerDownload}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <DownloadSimple size={18} className="text-slate-600 dark:text-slate-400" weight="bold" />
              <span>Unduh Berkas PDF</span>
            </button>
          </div>

          {/* Pratinjau Teks Pesan Resmi */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
              Pratinjau Pesan Resmi Pengantar Dokumen BAP:
            </span>
            <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
              {shareMessageText}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
