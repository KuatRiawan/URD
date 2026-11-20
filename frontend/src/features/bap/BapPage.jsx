import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Clock, FileText, MagnifyingGlass, Funnel, ArrowClockwise } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { LoadingState, ErrorState, EmptyState } from '../../components/feedback/StateViews.jsx';
import { useConfirm, useToast } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';
import { PdfPreviewModal } from '../inspections/components/PdfPreviewModal.jsx';
import { BapTable } from './components/BapTable.jsx';
import { BapDetailModal } from './components/BapDetailModal.jsx';
import { ShareBapModal } from './components/ShareBapModal.jsx';

export function BapPage() {
  const confirm = useConfirm();
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = searchParams.get('status') || '';
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const canFinalize = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [bapList, setBapList] = useState([]);
  const [scopeCatalog, setScopeCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(urlStatus);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setStatusFilter(urlStatus);
  }, [urlStatus]);

  const [selectedBap, setSelectedBap] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [bapEditForm, setBapEditForm] = useState(null);

  const [sigForm, setSigForm] = useState({
    signerRole: 'PERWAKILAN_KLIEN',
    signerName: '',
    signerTitle: 'Perwakilan Klien'
  });

  const [reopenReason, setReopenReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (feedback?.message) {
      toast(feedback.message, feedback.type === 'error' ? 'error' : 'success');
      setFeedback(null);
    }
  }, [feedback, toast]);
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewingBapId, setPreviewingBapId] = useState(null);
  const [shareBapTarget, setShareBapTarget] = useState(null);

  const handleOpenShare = (bap) => {
    if (!bap) return;
    setShareBapTarget(bap);
  };

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

  const searchParam = searchParams.get('search') || searchParams.get('bapId') || searchParams.get('id');
  const openedBapRef = useRef(null);

  const openBapDetail = useCallback(async (id) => {
    setDetailLoading(true);
    setFeedback(null);
    try {
      const res = await api.get(`/bap/${id}`);
      const b = res.data.bap;
      setSelectedBap(b);
      const docData = b.document_data || {};
      const autoPicName = docData.contact_name || b.contact_name || b.client_signer_name || '';
      setBapEditForm({
        object_name: docData.object_name || b.object_name || '',
        client_name: docData.client_name || b.client_name || '',
        client_address: docData.client_address || b.client_address || b.location_address || '',
        manufacturer: docData.manufacturer || b.manufacturer || b.brand || '',
        brand: docData.brand || b.brand || b.manufacturer || '',
        manufacture_year: docData.manufacture_year || b.manufacture_year || '',
        serial_number: docData.serial_number || b.serial_number || '',
        capacity: docData.capacity || b.capacity || '',
        install_location: docData.install_location || b.install_location || b.location_name || '',
        bap_no: docData.bap_no || b.bap_no || '',
        contact_name: autoPicName,
        inspection_date: b.inspection_date ? String(b.inspection_date).slice(0, 10) : '',
        scope_items: Array.isArray(b.scope_items) ? b.scope_items : [],
        is_compliant: b.is_compliant === true ? true : b.is_compliant === false ? false : null,
        inspection_notes: b.inspection_notes || ''
      });
      setSigForm({
        signerRole: 'PERWAKILAN_KLIEN',
        signerName: b.client_signer_name || autoPicName
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal memuat detail BAP.'
      });
    } finally {
      setDetailLoading(false);
    }
  }, []);

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
  }, [searchParam, bapList, selectedBap, openBapDetail]);

  const toggleScopeItem = (scopeName) => {
    setBapEditForm((prev) => {
      if (!prev) return prev;
      const current = Array.isArray(prev.scope_items) ? prev.scope_items : [];
      const exists = current.includes(scopeName);
      const next = exists ? current.filter((item) => item !== scopeName) : [...current, scopeName];
      return { ...prev, scope_items: next };
    });
  };

  const handleSaveDraft = async (e, formOverride) => {
    if (e) e.preventDefault();
    if (!selectedBap) return;
    const formToSave = formOverride || bapEditForm;
    if (!formToSave || (formToSave.scope_items || []).length === 0) {
      setFeedback({ type: 'error', message: 'Pilih minimal 1 ruang lingkup riksa uji pada BAP.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const resolvedConclusion =
        formToSave.is_compliant === true
          ? 'MEMENUHI_SYARAT'
          : formToSave.is_compliant === false
          ? 'TIDAK_MEMENUHI_SYARAT'
          : null;
      const documentData = {
        object_name: formToSave.object_name,
        client_name: formToSave.client_name,
        client_address: formToSave.client_address,
        manufacturer: formToSave.manufacturer,
        brand: formToSave.brand,
        manufacture_year: formToSave.manufacture_year,
        serial_number: formToSave.serial_number,
        capacity: formToSave.capacity,
        install_location: formToSave.install_location,
        bap_no: formToSave.bap_no,
        contact_name: formToSave.contact_name
      };
      await api.put(`/bap/${selectedBap.id}/draft`, {
        bapNo: formToSave.bap_no || undefined,
        inspectionDate: formToSave.inspection_date || null,
        scopeItems: formToSave.scope_items,
        isCompliant: formToSave.is_compliant,
        conclusion: resolvedConclusion,
        inspectionNotes: formToSave.inspection_notes,
        documentData
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

  const handleSaveSignature = async (e, customDataUrl) => {
    e?.preventDefault();
    if (!selectedBap) return;
    if (!customDataUrl) {
      setFeedback({
        type: 'error',
        message: 'Goreskan tanda tangan digital terlebih dahulu pada kotak tanda tangan.'
      });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await api.post(`/bap/${selectedBap.id}/signatures`, {
        signerRole: sigForm.signerRole,
        signerName: sigForm.signerName,
        signerTitle: sigForm.signerTitle,
        dataUrl: customDataUrl
      });
      await openBapDetail(selectedBap.id);
      setFeedback({
        type: 'success',
        message: `Tanda tangan digital ${sigForm.signerRole === 'AHLI_K3' ? 'Inspector (Ahli K3)' : 'Pemilik Alat / Klien'} berhasil disimpan ke BAP.`
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

  const handleDownloadDocx = async (bapId, bapNo) => {
    try {
      const res = await api.get(`/bap/${bapId}/docx`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${(bapNo || 'BAP').replace(/\//g, '-')}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Gagal mengunduh berkas Word (.docx) BAP.'
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

  const handlePreviewPdf = async (bapId, bapNo) => {
    try {
      setPreviewPdfUrl(null);
      setPreviewingBapId(bapId);
      setPreviewPdfTitle(`Pratinjau Berita Acara (BAP): ${bapNo || bapId}`);
      setPdfPreviewModalOpen(true);
      const res = await api.get(`/bap/${bapId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
    } catch (err) {
      setPdfPreviewModalOpen(false);
      setPreviewingBapId(null);
      setFeedback({
        type: 'error',
        message:
          err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Gagal memuat pratinjau PDF BAP.'
      });
    }
  };

  const closePdfPreview = () => {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPreviewingBapId(null);
    setPdfPreviewModalOpen(false);
  };

  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const previewingBap = useMemo(() => {
    if (!previewingBapId) return selectedBap;
    return bapList.find((b) => b.id === previewingBapId) || selectedBap;
  }, [previewingBapId, bapList, selectedBap]);

  const stats = useMemo(() => {
    const total = bapList.length;
    const draft = bapList.filter((b) => b.status === 'DRAF').length;
    const final = bapList.filter((b) => b.status === 'FINAL').length;
    const unsignedPic = bapList.filter((b) => !b.client_sig_file_id).length;
    const signedPic = bapList.filter((b) => Boolean(b.client_sig_file_id)).length;
    return { total, draft, final, unsignedPic, signedPic };
  }, [bapList]);

  const FILTER_TABS = [
    { key: '', label: 'Semua BAP', count: stats.total },
    { key: 'BELUM_TTD_PIC', label: 'Belum TTD PIC', count: stats.unsignedPic, tone: 'amber' },
    { key: 'SUDAH_TTD_PIC', label: 'Sudah TTD PIC', count: stats.signedPic, tone: 'emerald' },
    { key: 'FINAL', label: 'BAP Final', count: stats.final, tone: 'emerald' },
    { key: 'DRAF', label: 'Draf BAP', count: stats.draft, tone: 'blue' }
  ];

  const handleSelectFilterTab = (key) => {
    setStatusFilter(key);
    if (key) {
      setSearchParams({ status: key });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Monitoring Berita Acara (BAP)' : 'Berita Acara Riksa Uji (BAP)'}
        subtitle={
          isPimpinan
            ? 'Pengawasan Berita Acara riksa uji, penandatanganan pihak terkait, dan status pengesahan dokumen per unit alat.'
            : 'Dokumen Berita Acara Riksa Uji otomatis (1 Unit = 1 BAP). Penandatanganan digital perwakilan klien, pratinjau dokumen, dan penerbitan resmi.'
        }
      />

      {/* Ringkasan Status Berita Acara (BAP) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7]">
            <FileText size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Total Unit Alat (1 Unit = 1 BAP)</div>
            <div className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">{stats.total} Dokumen</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Perlu Tanda Tangan PIC</div>
            <div className="text-lg font-bold tracking-tight text-amber-700 dark:text-amber-400">{stats.unsignedPic} Unit</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">BAP Disahkan &amp; Final</div>
            <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{stats.final} Selesai</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white dark:bg-[#151821] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleSelectFilterTab(tab.key)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#C81E1E] text-white shadow-[0_2px_8px_-2px_rgba(200,30,30,0.4)]'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.08] dark:hover:bg-white/[0.10]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-black/[0.06] dark:bg-white/[0.08] text-[#1D1D1F] dark:text-[#F5F5F7]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchBapList();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. BAP, PO, Klien, Objek Alat, No. Seri..."
              className="w-full h-10 pl-10 pr-3.5 text-xs border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] rounded-xl focus:outline-none focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E] transition-colors"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 text-xs font-semibold bg-[#C81E1E] hover:bg-[#AD1919] text-white rounded-xl shadow-[0_1px_2px_rgba(200,30,30,0.2)] transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <MagnifyingGlass size={14} weight="bold" />
            <span>Cari</span>
          </button>
          {Boolean(search || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                handleSelectFilterTab('');
              }}
              className="h-10 px-3 text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <ArrowClockwise size={14} />
              <span>Reset</span>
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <LoadingState message="Memuat dokumen Berita Acara Riksa Uji..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchBapList} />
      ) : bapList.length === 0 ? (
        <EmptyState
          title="Belum Ada Berita Acara Riksa Uji"
          description="BAP dibuat otomatis untuk setiap unit alat pada PO yang aktif (1 Unit = 1 BAP). Pastikan unit alat sudah ditambahkan pada menu PO & Order Masuk."
        />
      ) : (
        <BapTable
          bapList={bapList}
          onPreviewPdf={handlePreviewPdf}
          onDownloadPdf={handleDownloadPdf}
          onDownloadDocx={handleDownloadDocx}
          onOpenDetail={openBapDetail}
          onShareBap={handleOpenShare}
        />
      )}

      <BapDetailModal
        user={user}
        selectedBap={selectedBap}
        onClose={() => setSelectedBap(null)}
        detailLoading={detailLoading}
        feedback={feedback}
        canManage={canManage}
        canFinalize={canFinalize}
        bapEditForm={bapEditForm}
        setBapEditForm={setBapEditForm}
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
        handleDownloadDocx={handleDownloadDocx}
        handleDownloadBatchPoPdf={handleDownloadBatchPoPdf}
        onShareBap={handleOpenShare}
        submitting={submitting}
        navigate={navigate}
      />

      <PdfPreviewModal
        isOpen={pdfPreviewModalOpen}
        onClose={closePdfPreview}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        downloadFilename={`${(previewPdfTitle || 'BAP').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`}
        onShare={previewingBap ? () => handleOpenShare(previewingBap) : undefined}
      />

      <ShareBapModal
        isOpen={Boolean(shareBapTarget)}
        onClose={() => setShareBapTarget(null)}
        bap={shareBapTarget}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}
