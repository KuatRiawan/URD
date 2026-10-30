import { CircleNotch, DownloadSimple, Printer } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';

export function PdfPreviewModal({
  open,
  onClose,
  title,
  pdfUrl,
  filename,
  onPrint
}) {
  return (
    <Modal
      open={open}
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
            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Printer size={15} weight="bold" />
              <span>Cetak / Print</span>
            </button>
            <a
              href={pdfUrl || '#'}
              download={filename}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#C81E1E] hover:bg-[#a61717] text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
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

