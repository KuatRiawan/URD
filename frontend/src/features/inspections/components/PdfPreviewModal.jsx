import { CircleNotch, DownloadSimple, Printer } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

export function PdfPreviewModal({
  open,
  isOpen,
  onClose,
  title,
  pdfUrl,
  filename,
  downloadFilename,
  onPrint
}) {
  const visible = Boolean(open ?? isOpen);
  const actualFilename = filename || downloadFilename || 'dokumen.pdf';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    const iframe = document.getElementById('inspection-pdf-preview-iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
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
            <span>Periksa kesesuaian data dokumen sebelum mencetak atau mengunduh.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Printer}
              onClick={handlePrint}
            >
              Cetak / Print
            </Button>
            <a
              href={pdfUrl || '#'}
              download={actualFilename}
              className="inline-flex items-center gap-1.5 h-8.5 px-3 rounded-[9px] bg-[#C81E1E] hover:bg-[#A61717] active:bg-[#8A1212] text-white text-xs font-semibold shadow-[0_1px_2px_rgba(200,30,30,0.22)] transition-colors cursor-pointer"
            >
              <DownloadSimple size={15} weight="bold" />
              <span>Unduh Dokumen PDF</span>
            </a>
          </div>
        </div>

        <div className="w-full h-[72vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-inner flex items-center justify-center">
          {pdfUrl ? (
            <iframe
              id="inspection-pdf-preview-iframe"
              src={pdfUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
              <CircleNotch size={28} className="animate-spin text-[#C81E1E]" />
              <span className="text-xs">Memuat pratinjau dokumen...</span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

