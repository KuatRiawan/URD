import { useCallback, useEffect, useRef, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { LoadingState, ErrorState, EmptyState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { PdfPreviewModal } from '../inspections/components/PdfPreviewModal.jsx';
import { BapTable } from './components/BapTable.jsx';
import { BapDetailModal } from './components/BapDetailModal.jsx';

function createSignatureDataUrl(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 360, 120);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(30, 82);
    ctx.bezierCurveTo(95, 22, 165, 102, 235, 42);
    ctx.bezierCurveTo(265, 25, 295, 88, 330, 56);
    ctx.stroke();
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 600 15px sans-serif';
    ctx.fillText((text || 'Tanda Tangan').slice(0, 26), 34, 104);
  }
  return canvas.toDataURL('image/png');
}

export function BapPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const canManage = ['ADMIN_SISTEM', 'AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const canFinalize = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING'].includes(user?.role);

  const [bapList, setBapList] = useState([]);
  const [scopeCatalog, setScopeCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [selectedBap, setSelectedBap] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [draftForm, setDraftForm] = useState({
    inspectionDate: '',
    scopeItems: [],
    isCompliant: true,
    inspectionNotes: ''
  });

  const [sigForm, setSigForm] = useState({
    signerRole: 'AHLI_K3',
    signerName: '',
    signerTitle: 'Ahli K3 Pemeriksa'
  });

  const [reopenReason, setReopenReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');

  const fetchBapList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit: 100 };
      if (statusFilter) params.status = statusFilter;
      if (search.trim()) params.q = search.trim();
      const [listRes, scopesRes] = await Promise.all([
        api.get('/bap', { params }),
        api.get('/bap/scopes')
      ]);
      setBapList(listRes.data.items || []);
      setScopeCatalog(scopesRes.data.scopes || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Gagal memuat daftar Berita Acara Riksa Uji.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchBapList();
  }, [fetchBapList]);

  const [searchParams] = useSearchParams();
  const searchParam = searchParams.get('search') || searchParams.get('bapId') || searchParams.get('id');
  const openedBapRef = useRef(null);

  useEffect(() => {
    if (!searchParam || !bapList.length) return;
    if (openedBapRef.current === searchParam && selectedBap) return;

    const matched = bapList.find(
      (b) =>
        b.id === searchParam ||
        b.bap_no?.toLowerCase().includes(searchParam.toLowerCase()) ||
        b.order_no?.toLowerCase().includes(searchParam.toLowerCase())
    );

    if (matched) {
      openedBapRef.current = searchParam;
      openBapDetail(matched.id);
    }
  }, [searchParam, bapList, selectedBap]);

  const openBapDetail = async (id) => {
    setDetailLoading(true);
    setFeedback(null);
    try {
      const res = await api.get(`/bap/${id}`);
      const b = res.data.bap;
      setSelectedBap(b);
      setDraftForm({
        inspectionDate: b.inspection_date ? String(b.inspection_date).slice(0, 10) : '',
        scopeItems: Array.isArray(b.scope_items) ? b.scope_items : [],
        isCompliant: b.is_compliant !== false,
        inspectionNotes: b.inspection_notes || ''
      });
      setSigForm({
        signerRole: b.inspector_sig_file_id ? 'PERWAKILAN_KLIEN' : 'AHLI_K3',
        signerName: b.inspector_sig_file_id
          ? b.client_signer_name || b.contact_name || ''
          : b.inspector_signer_name || user?.fullName || '',
        signerTitle: b.inspector_sig_file_id
          ? b.client_signer_title || 'Pemilik Alat / Perwakilan Klien'
          : b.inspector_signer_title || 'Ahli K3 Pemeriksa'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal memuat detail BAP.'
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleScopeItem = (scopeName) => {
    setDraftForm((prev) => {
      const exists = prev.scopeItems.includes(scopeName);
      const next = exists
        ? prev.scopeItems.filter((item) => item !== scopeName)
        : [...prev.scopeItems, scopeName];
      return { ...prev, scopeItems: next };
    });
  };

  const handleSaveDraft = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBap) return;
    if (draftForm.scopeItems.length === 0) {
      setFeedback({ type: 'error', message: 'Pilih minimal 1 ruang lingkup riksa uji pada BAP.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.put(`/bap/${selectedBap.id}/draft`, {
        inspectionDate: draftForm.inspectionDate || null,
        scopeItems: draftForm.scopeItems,
        isCompliant: draftForm.isCompliant,
        inspectionNotes: draftForm.inspectionNotes
      });
      await openBapDetail(selectedBap.id);
      await fetchBapList();
      setFeedback({ type: 'success', message: 'Draf Berita Acara Riksa Uji berhasil disimpan.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menyimpan draf BAP.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSignature = async (e) => {
    e.preventDefault();
    if (!selectedBap) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const dataUrl = createSignatureDataUrl(sigForm.signerName);
      await api.post(`/bap/${selectedBap.id}/signatures`, {
        signerRole: sigForm.signerRole,
        signerName: sigForm.signerName,
        signerTitle: sigForm.signerTitle,
        dataUrl
      });
      await openBapDetail(selectedBap.id);
      setFeedback({
        type: 'success',
        message: `Tanda tangan ${sigForm.signerRole === 'AHLI_K3' ? 'Inspector (Ahli K3)' : 'Pemilik Alat / Klien'} berhasil disimpan ke BAP.`
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal menyimpan tanda tangan BAP.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeBap = async () => {
    if (!selectedBap) return;
    const ok = await confirm({
      title: 'Finalisasi BAP',
      message: 'BAP yang sudah final akan dikunci dan tidak dapat diubah kecuali dibuka kembali dengan alasan tertulis.',
      confirmLabel: 'Ya, Finalisasi',
      tone: 'warning'
    });
    if (!ok) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post(`/bap/${selectedBap.id}/finalize`);
      await openBapDetail(selectedBap.id);
      await fetchBapList();
      setFeedback({
        type: 'success',
        message: 'BAP berhasil difinalisasi, dikunci, dan dokumen PDF resmi serta draf LHPP siap diproses.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal memfinalisasi BAP.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopenBap = async (e) => {
    e.preventDefault();
    if (!selectedBap) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post(`/bap/${selectedBap.id}/reopen`, { reason: reopenReason });
      setReopenReason('');
      await openBapDetail(selectedBap.id);
      await fetchBapList();
      setFeedback({
        type: 'success',
        message: 'Kunci BAP berhasil dibuka untuk revisi tercatat.'
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal membuka kunci revisi BAP.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPdf = async (bapId, bapNo) => {
    try {
      const res = await api.get(`/bap/${bapId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(bapNo || 'BAP').replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal mengunduh PDF BAP.'
      });
    }
  };

  const handleDownloadBatchPoPdf = async (orderId, poNumber) => {
    try {
      const res = await api.get(`/bap/order/${orderId}/batch-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAP-Gabungan-${(poNumber || orderId).replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal mengunduh PDF gabungan BAP PO.'
      });
    }
  };

  const handlePreviewPdf = (bapId, bapNo) => {
    setPreviewPdfUrl(`/bap/${bapId}/pdf`);
    setPreviewPdfTitle(`Pratinjau Berita Acara (BAP): ${bapNo || bapId}`);
    setPdfPreviewModalOpen(true);
  };

  const closePdfPreview = () => {
    setPreviewPdfUrl(null);
    setPdfPreviewModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Berita Acara Riksa Uji (BAP)"
        subtitle="Penyusunan, pemeriksaan ruang lingkup 28 item, tanda tangan Inspector dan Pemilik Alat, serta cetak PDF BAP resmi PT Upaya Riksa Daya."
      />

      {feedback && !selectedBap && (
        <Notice tone={feedback.type === 'error' ? 'error' : 'success'}>{feedback.message}</Notice>
      )}

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '', label: 'Semua BAP' },
            { value: 'DRAF', label: 'Draf BAP' },
            { value: 'FINAL', label: 'BAP Final' }
          ].map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-slate-900 dark:bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchBapList();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. BAP, PO, Klien, Unit..."
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus:outline-none focus:ring-2 focus:ring-[#C81E1E]"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white rounded-md hover:bg-slate-900 dark:hover:bg-slate-600 cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {loading ? (
        <LoadingState message="Memuat dokumen Berita Acara Riksa Uji..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBapList} />
      ) : bapList.length === 0 ? (
        <EmptyState
          title="Belum Ada Berita Acara Riksa Uji"
          description="BAP akan otomatis dibuat begitu Ahli K3 mengirim form hasil pemeriksaan lapangan pada salah satu unit PO."
        />
      ) : (
        <BapTable
          bapList={bapList}
          onPreviewPdf={handlePreviewPdf}
          onDownloadPdf={handleDownloadPdf}
          onOpenDetail={openBapDetail}
        />
      )}

      <BapDetailModal
        selectedBap={selectedBap}
        onClose={() => setSelectedBap(null)}
        detailLoading={detailLoading}
        feedback={feedback}
        canManage={canManage}
        canFinalize={canFinalize}
        draftForm={draftForm}
        setDraftForm={setDraftForm}
        toggleScopeItem={toggleScopeItem}
        scopeCatalog={scopeCatalog}
        handleSaveDraft={handleSaveDraft}
        sigForm={sigForm}
        setSigForm={setSigForm}
        handleSaveSignature={handleSaveSignature}
        handleFinalizeBap={handleFinalizeBap}
        reopenReason={reopenReason}
        setReopenReason={setReopenReason}
        handleReopenBap={handleReopenBap}
        handlePreviewPdf={handlePreviewPdf}
        handleDownloadPdf={handleDownloadPdf}
        handleDownloadBatchPoPdf={handleDownloadBatchPoPdf}
        submitting={submitting}
        navigate={navigate}
      />

      <PdfPreviewModal
        isOpen={pdfPreviewModalOpen}
        onClose={closePdfPreview}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        downloadFilename={`${(previewPdfTitle || 'BAP').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
      />
    </div>
  );
}
