import { DownloadSimple, Printer, ShareNetwork } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { PdfDocumentViewer } from './PdfDocumentViewer.jsx';

export function PdfPreviewModal({
  open,
  isOpen,
  onClose,
  title = 'Pratinjau Dokumen Resmi',
  pdfUrl,
  filename,
  downloadFilename,
  onPrint,
  onShare,
  onDownload
}) {
  const visible = Boolean(open ?? isOpen);
  const actualFilename = filename || downloadFilename || 'dokumen.pdf';

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = actualFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      printWindow?.focus();
      printWindow?.print();
    }
  };

  return (
    <Modal
      open={visible}
      isOpen={visible}
      onClose={onClose}
      title={title}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">Pratinjau Resmi:</span>
            <span>Periksa kesesuaian data dokumen sebelum mencetak, membagikan, atau mengunduh.</span>
          </div>
          <div className="flex items-center gap-2">
            {onShare && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ShareNetwork}
                onClick={onShare}
              >
                Bagikan
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Cetak / Print
            </Button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-[9px] bg-[#C81E1E] hover:bg-[#A61717] active:bg-[#8A1212] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(200,30,30,0.22)] transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Unduh Dokumen PDF</span>
            </button>
          </div>
        </div>

        <div className="w-full h-[72vh] rounded-xl overflow-hidden">
          <PdfDocumentViewer
            pdfUrl={pdfUrl}
            title={title}
            filename={actualFilename}
            onDownload={handleDownload}
            onPrint={handlePrint}
            onShare={onShare}
          />
        </div>
      </div>
    </Modal>
  );
}
