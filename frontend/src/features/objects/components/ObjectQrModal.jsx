import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { api } from '../../../lib/api/axios.js';
import logoUrd from '../../../assets/logo-urd.png';

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
      <div className="text-center space-y-3.5 text-xs text-slate-800 dark:text-slate-200">
        <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 mx-auto">
          <img src={logoUrd} alt="PT Upaya Riksa Daya" className="h-5 w-auto object-contain dark:brightness-110" />
          <span className="font-bold text-[11px] tracking-wide text-slate-900 dark:text-white uppercase">
            PT Upaya Riksa Daya
          </span>
        </div>
        <div className="inline-block p-3 bg-white rounded-xl border border-slate-200 dark:border-slate-700 mx-auto shadow-xs">
          <img
            src={qrModal.qrDataUrl}
            alt={`QR Code ${qrModal.object.name}`}
            width="200"
            height="200"
            className="mx-auto"
          />
        </div>
        <div>
          <p className="font-bold text-sm text-slate-900 dark:text-white">{qrModal.object.name}</p>
          <p className="font-mono text-slate-500 dark:text-slate-400 mt-0.5">S/N: {qrModal.object.serial_number}</p>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
          Pindai menggunakan perangkat staf atau kamera HP untuk membuka data riwayat alat ini.
        </p>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="primary"
            size="md"
            icon={DownloadSimple}
            onClick={handleDownloadSticker}
            disabled={downloading}
            loading={downloading}
            className="w-full justify-center"
          >
            Cetak Stiker Label QR (PDF)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
