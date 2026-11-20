import { Modal } from '../../../components/ui/Modal.jsx';
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
      fullScreenMobile={true}
    >
      <div className="w-full flex-1 min-h-[70vh] sm:h-[75vh] rounded-xl overflow-hidden">
        <PdfDocumentViewer
          pdfUrl={pdfUrl}
          title={title}
          filename={actualFilename}
          onDownload={handleDownload}
          onPrint={handlePrint}
          onShare={onShare}
        />
      </div>
    </Modal>
  );
}
