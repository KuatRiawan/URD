import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ArrowsIn,
  CircleNotch,
  DownloadSimple,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  Printer,
  ShareNetwork,
  WarningCircle
} from '@phosphor-icons/react';

// Daftarkan worker pdfjs sekali di level modul
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
}

/**
 * Komponen individual untuk merender satu halaman PDF ke canvas beresolusi tinggi (Retina-ready)
 */
function PdfPageCanvas({ pdfDoc, pageNumber, scale, numPages }) {
  const canvasRef = useRef(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelRender = false;
    let currentRenderTask = null;

    async function renderPage() {
      if (!pdfDoc) return;
      try {
        setRendering(true);
        setError(false);
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelRender) return;

        // Dapatkan rasio piksel perangkat untuk ketajaman teks & tabel (maksimal 2x untuk hemat memori ponsel)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * dpr });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        currentRenderTask = page.render({
          canvasContext: ctx,
          viewport
        });

        await currentRenderTask.promise;
        if (!cancelRender) {
          setRendering(false);
        }
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Gagal merender halaman PDF #${pageNumber}:`, err);
          if (!cancelRender) {
            setError(true);
            setRendering(false);
          }
        }
      }
    }

    renderPage();

    return () => {
      cancelRender = true;
      if (currentRenderTask) {
        try {
          currentRenderTask.cancel();
        } catch {
          // ignore cancel error
        }
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div className="flex flex-col items-center shrink-0 w-fit max-w-none">
      {/* Kartu Lembar Halaman PDF */}
      <div className="relative bg-white text-slate-900 rounded-lg shadow-md border border-slate-200/90 dark:border-slate-700/80 overflow-hidden transition-shadow">
        {/* Indikator Halaman di sudut atas */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1 bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium text-slate-600 dark:text-slate-300">
          <span>Halaman {pageNumber} dari {numPages}</span>
          {rendering && (
            <span className="flex items-center gap-1 text-[#C81E1E]">
              <CircleNotch size={12} className="animate-spin" />
              <span>Memuat...</span>
            </span>
          )}
        </div>

        {/* Canvas render */}
        <div className="p-0.5 sm:p-2 flex justify-center bg-white min-h-[160px]">
          {error ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-rose-600 text-xs gap-2">
              <WarningCircle size={24} weight="bold" />
              <span>Gagal memuat visual halaman {pageNumber}.</span>
            </div>
          ) : (
            <canvas ref={canvasRef} className="block mx-auto shadow-2xs max-w-none" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Komponen Penampil Dokumen PDF Berbasis Canvas Murni.
 * Langsung dirender di dalam aplikasi tanpa iframe / object / plugin browser eksternal.
 * Anti-blokir Chrome dan 100% responsif di desktop maupun layar seluler (iOS / Android).
 */
export function PdfDocumentViewer({
  pdfUrl,
  title = 'Dokumen',
  filename,
  onDownload,
  onPrint,
  onShare
}) {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);

  // Hitung skala otomatis agar pas dengan lebar layar kontainer (Fit-to-Width)
  const calculateAutoFitScale = useCallback((firstPageWidth = 595.28) => {
    if (!containerRef.current) return 1;
    const clientWidth = containerRef.current.clientWidth || window.innerWidth;
    // Beri margin horizontal (20px di ponsel, 36px di desktop)
    const availableWidth = clientWidth < 640 ? clientWidth - 20 : clientWidth - 36;
    const fittedScale = availableWidth / firstPageWidth;
    return Math.max(0.4, Math.min(1.5, Number(fittedScale.toFixed(2))));
  }, []);

  // Muat dokumen PDF
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setNumPages(0);
      setLoading(false);
      return;
    }

    let active = true;
    let loadingTask = null;

    async function loadPdfDocument() {
      try {
        setLoading(true);
        setError('');

        loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);

        try {
          const firstPage = await doc.getPage(1);
          const baseViewport = firstPage.getViewport({ scale: 1 });
          const initialScale = calculateAutoFitScale(baseViewport.width);
          setScale(initialScale);
        } catch {
          setScale(1);
        }

        setLoading(false);
      } catch (err) {
        if (!active) return;
        console.error('Gagal memuat dokumen PDF via PDF.js:', err);
        setError(err.message || 'Gagal memproses struktur berkas PDF.');
        setLoading(false);
      }
    }

    loadPdfDocument();

    return () => {
      active = false;
      if (loadingTask) {
        try {
          loadingTask.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfUrl, calculateAutoFitScale]);

  // Aksi Zoom In & Zoom Out
  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.2, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.4, Number((prev - 0.15).toFixed(2))));
  };

  const handleFitWidth = async () => {
    if (!pdfDoc) return;
    try {
      const firstPage = await pdfDoc.getPage(1);
      const baseViewport = firstPage.getViewport({ scale: 1 });
      const fittedScale = calculateAutoFitScale(baseViewport.width);
      setScale(fittedScale);
    } catch {
      setScale(1);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
      {/* Toolbar Tunggal Terpadu (Page Count, Zoom Controls, Pas Layar, Cetak, Unduh) */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 sm:px-4 py-2 bg-slate-800 border-b border-slate-700/80 text-white shrink-0 select-none">
        {/* Sisi Kiri: Jumlah Halaman */}
        <div className="flex items-center gap-1.5 shrink-0">
          {numPages > 0 ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-200 text-[11px] font-mono font-bold whitespace-nowrap">
              {numPages} Hlm
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Memuat...</span>
          )}
        </div>

        {/* Bagian Tengah: Kontrol Zoom Presisi & Pas Layar (Ergonomis, tidak meluber di ponsel) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            type="button"
            onClick={handleZoomOut}
            title="Perkecil Tampilan"
            aria-label="Perkecil"
            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <MagnifyingGlassMinus size={15} weight="bold" />
          </button>

          <button
            type="button"
            onClick={() => (scale < 0.95 ? setScale(1.0) : handleFitWidth())}
            title={scale < 0.95 ? 'Klik untuk zoom 100% (Ukuran Nyata)' : 'Klik untuk Pas Layar'}
            className="text-[11px] font-mono font-bold px-1 py-0.5 rounded hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            title="Perbesar Tampilan"
            aria-label="Perbesar"
            className="p-1 sm:p-1.5 rounded-md hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <MagnifyingGlassPlus size={15} weight="bold" />
          </button>

          <button
            type="button"
            onClick={handleFitWidth}
            title="Sesuaikan Lebar Layar (Pas Layar)"
            aria-label="Pas Layar"
            className="ml-0.5 px-1.5 py-1 text-[11px] font-bold rounded-md bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-slate-200 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <ArrowsIn size={13} weight="bold" />
            <span className="hidden sm:inline">Pas Layar</span>
          </button>
        </div>

        {/* Sisi Kanan: Cetak & Unduh */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              title="Bagikan Dokumen BAP"
              aria-label="Bagikan Dokumen"
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ShareNetwork size={14} weight="bold" />
              <span className="hidden sm:inline">Bagikan</span>
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              title="Cetak Dokumen"
              aria-label="Cetak Dokumen"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer size={13} weight="bold" />
              <span>Cetak</span>
            </button>
          )}

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              title="Unduh Berkas PDF Resmi"
              aria-label="Unduh PDF"
              className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 rounded-md bg-[#C81E1E] hover:bg-[#a61717] active:bg-[#8e1414] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Unduh</span>
            </button>
          )}
        </div>
      </div>

      {/* Kontainer Render Lembar Dokumen: Mendukung scroll vertikal & horizontal saat diperbesar */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-auto p-2.5 sm:p-4 overscroll-contain touch-pan-x touch-pan-y"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <CircleNotch size={32} className="animate-spin text-[#C81E1E]" />
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-200">Merender Dokumen Resmi di Aplikasi...</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Memuat seluruh halaman secara beresolusi tinggi</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-rose-400 gap-3 text-center px-4">
            <WarningCircle size={36} weight="bold" />
            <p className="text-xs font-semibold">{error}</p>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="mt-2 px-3 py-1.5 rounded-lg bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a61717] cursor-pointer"
              >
                Unduh Berkas PDF
              </button>
            )}
          </div>
        ) : numPages > 0 ? (
          <div className="flex flex-col items-center gap-4 w-full min-w-fit">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <PdfPageCanvas
                key={pageNumber}
                pdfDoc={pdfDoc}
                pageNumber={pageNumber}
                scale={scale}
                numPages={numPages}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
            Dokumen tidak memiliki halaman untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}
