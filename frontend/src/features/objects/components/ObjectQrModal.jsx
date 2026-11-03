import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { api } from '../../../lib/api/axios.js';

export function ObjectQrModal({ qrModal, onClose }) {
  const [downloading, setDownloading] = useState(false);

  if (!qrModal) return null;

  const handleDownloadSticker = async () => {
    try {
      setDownloading(true);
      const res = await api.get(`/objects/${qrModal.object.id}/qr-sticker.pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Stiker-QR-${(qrModal.object.serial_number || qrModal.object.id).replace(/[/\s]/g, '-')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR sticker', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      open={Boolean(qrModal)}
      onClose={onClose}
      title="Kode QR Identitas Objek K3"
      maxWidth="max-w-sm"
    >
      <div className="text-center space-y-3 text-xs text-slate-800 dark:text-slate-200">
        <div className="inline-block p-2 bg-white rounded-lg border border-slate-200 dark:border-slate-700 mx-auto shadow-sm">
          <img
            src={qrModal.qrDataUrl}
            alt={`QR Code ${qrModal.object.name}`}
            width="200"
            height="200"
            className="mx-auto"
          />
        </div>
        <p className="font-bold text-sm text-slate-900 dark:text-white">{qrModal.object.name}</p>
        <p className="font-mono text-slate-500 dark:text-slate-400">S/N: {qrModal.object.serial_number}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Pindai menggunakan perangkat staf atau kamera HP untuk membuka data riwayat alat ini.
        </p>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleDownloadSticker}
            disabled={downloading}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C81E1E] px-3.5 text-xs font-bold text-white hover:bg-[#a11616] transition-colors cursor-pointer shadow-2xs disabled:opacity-60"
          >
            <DownloadSimple size={15} weight="bold" />
            <span>{downloading ? 'Menyiapkan...' : 'Cetak Stiker Label QR (PDF)'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

