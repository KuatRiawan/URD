import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ClipboardText,
  Eye,
  FileText,
  Plus,
  SealCheck
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { CONCLUSION_LABELS, formatDateTime } from '../../lib/utils/format.js';
import { StartInspectionModal } from './components/StartInspectionModal.jsx';
import { InspectionDetailModal } from './components/InspectionDetailModal.jsx';
import { PdfPreviewModal } from './components/PdfPreviewModal.jsx';

export function InspectionsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);
  const canValidateTemplate = ['ADMIN_SISTEM', 'PIMPINAN'].includes(user?.role);

  const [inspections, setInspections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal Mulai Inspeksi Baru
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [orderObjects, setOrderObjects] = useState([]);
  const [startForm, setStartForm] = useState({
    orderId: '',
    objectId: '',
    templateVersionId: ''
  });

  // Modal Lembar Kerja Riksa Uji (ID aktif)
  const [activeInspectionId, setActiveInspectionId] = useState(null);

  // Modal Pratinjau Dokumen PDF
  const [pdfPreviewModalOpen, setPdfPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inspRes, tmplRes, ordersRes] = await Promise.all([
        api.get('/inspections', { params: { limit: 50 } }),
        api.get('/inspections/templates'),
        api.get('/orders', { params: { limit: 50 } }).catch(() => ({ data: { items: [] } }))
      ]);
      setInspections(inspRes.data?.items || []);
      setTemplates(tmplRes.data?.items || []);
      setOrders(ordersRes.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat daftar form inspeksi lapangan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectOrder = async (orderId) => {
    setStartForm((prev) => ({ ...prev, orderId, objectId: '' }));
    if (!orderId) {
      setOrderObjects([]);
      return;
    }
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrderObjects(res.data?.order?.objects || []);
    } catch {
      setOrderObjects([]);
    }
  };

  const handleStartInspection = async (e) => {
    e.preventDefault();
    if (!startForm.orderId || !startForm.objectId || !startForm.templateVersionId) {
      setError('Lengkapi semua data sebelum memulai inspeksi.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inspections/start', startForm);
      setStartModalOpen(false);
      setStartForm({ orderId: '', objectId: '', templateVersionId: '' });
      setFeedback('Lembar kerja inspeksi berhasil dimulai.');
      await loadData();
      if (res.data?.inspection?.id) {
        setActiveInspectionId(res.data.inspection.id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memulai lembar kerja inspeksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateTemplate = async (templateVersionId) => {
    const ok = await confirm({
      title: 'Validasi Template Checklist',
      message: 'Apakah Anda yakin ingin memvalidasi template ini agar dapat digunakan?',
      confirmLabel: 'Validasi Template',
      tone: 'success'
    });
    if (!ok) return;

    setSubmitting(true);
    setError('');
    try {
      await api.post(`/inspections/templates/${templateVersionId}/validate`);
      setFeedback('Template checklist berhasil divalidasi dan siap digunakan.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memvalidasi template checklist.');
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-buka lembar kerja bila inspector mengklik dari dashboard
  useEffect(() => {
    const qOrderId = searchParams.get('orderId');
    const qObjectId = searchParams.get('objectId');
    if (!qOrderId || !qObjectId || loading) return;

    const runAutoOpen = async () => {
      setSearchParams({}, { replace: true });
      const existing = inspections.find(
        (i) => i.order_id === qOrderId && i.object_id === qObjectId
      );
      if (existing) {
        setActiveInspectionId(existing.id);
        return;
      }
      if (isInspector) {
        try {
          setSubmitting(true);
          const res = await api.post('/inspections/start', {
            orderId: qOrderId,
            objectId: qObjectId
          });
          await loadData();
          if (res.data?.inspection?.id) {
            setActiveInspectionId(res.data.inspection.id);
          }
        } catch (err) {
          setError(
            err.response?.data?.error?.message ||
              err.response?.data?.message ||
              'Gagal membuka lembar kerja riksa uji.'
          );
        } finally {
          setSubmitting(false);
        }
      }
    };
    runAutoOpen();
  }, [searchParams, setSearchParams, loading, inspections, isInspector, loadData]);

  // Pratinjau Dokumen PDF
  const handlePreviewPdf = async (endpoint, title, filename) => {
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      setPreviewPdfUrl(url);
      setPreviewPdfTitle(title);
      setPreviewPdfFilename(filename || 'dokumen.pdf');
      setPdfPreviewModalOpen(true);
    } catch (err) {
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Gagal memuat pratinjau dokumen PDF.'
      );
    }
  };

  const closePdfPreview = () => {
    if (previewPdfUrl) {
      window.URL.revokeObjectURL(previewPdfUrl);
    }
    setPreviewPdfUrl(null);
    setPdfPreviewModalOpen(false);
  };

  const handlePrintPdf = () => {
    const iframe = document.getElementById('inspection-pdf-preview-iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Form Inspeksi Lapangan & Checklist K3"
        subtitle="Isi lembar pemeriksaan teknis per bidang objek K3, catat temuan ketidakpatuhan, serta tanda tangan berita acara."
        actions={
          isInspector && (
            <button
              type="button"
              onClick={() => setStartModalOpen(true)}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer shadow-xs"
            >
              <Plus size={16} weight="bold" />
              <span>Mulai Inspeksi Baru</span>
            </button>
          )
        }
      />

      {feedback && (
        <Notice tone="success" onClose={() => setFeedback('')}>
          {feedback}
        </Notice>
      )}

      {error && <ErrorBanner message={error} onRetry={loadData} />}

      {loading ? (
        <LoadingState label="Memuat daftar form inspeksi dan template K3..." />
      ) : (
        <div className="space-y-6">
          {/* Daftar Form Inspeksi */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-[#C81E1E]" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Lembar Kerja Pemeriksaan Lapangan ({inspections.length})
                </h2>
              </div>
            </div>

            {inspections.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="Belum ada lembar kerja inspeksi"
                  description="Ahli K3 yang bertugas dapat memulai lembar kerja pemeriksaan dari order yang sedang berjalan."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      <th className="py-3 px-4">Order &amp; Klien</th>
                      <th className="py-3 px-4">Objek Uji K3</th>
                      <th className="py-3 px-4">Ahli K3 Pemeriksa</th>
                      <th className="py-3 px-4">Kesimpulan Teknis</th>
                      <th className="py-3 px-4">Status &amp; LHPP</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                    {inspections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
                            {item.po_number || item.order_no}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            Order: {item.order_no}
                          </div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300">{item.client_name}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{item.object_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">
                            {item.category_code} · SN: {item.serial_number}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-semibold text-slate-900 dark:text-white">{item.inspector_name}</div>
                          <div className="text-slate-500 dark:text-slate-400">{formatDateTime(item.inspected_at)}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {item.conclusion ? (
                            <Badge
                              tone={
                                item.conclusion === 'MEMENUHI_SYARAT'
                                  ? 'success'
                                  : item.conclusion === 'TIDAK_MEMENUHI_SYARAT'
                                    ? 'danger'
                                    : 'warning'
                              }
                            >
                              {CONCLUSION_LABELS[item.conclusion] || item.conclusion}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">Belum disimpulkan</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <Badge tone={item.status === 'TERKIRIM' ? 'success' : 'warning'}>
                            {item.status}
                          </Badge>
                          {item.bap_no && (
                            <div className="mt-1 font-mono text-[11px] font-bold text-[#C81E1E] dark:text-red-400">
                              BAP: {item.bap_no} ({item.bap_status})
                            </div>
                          )}
                          {item.lhpp_no && (
                            <div className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {item.lhpp_no}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setActiveInspectionId(item.id)}
                            className={`min-h-9 inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                              item.status === 'DRAF' && isInspector
                                ? 'bg-[#C81E1E] text-white hover:bg-[#a61717]'
                                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            {item.status === 'DRAF' && isInspector ? (
                              <>
                                <ClipboardText size={15} weight="bold" />
                                <span>Kerjakan / Isi Form</span>
                              </>
                            ) : (
                              <>
                                <Eye size={15} weight="bold" />
                                <span>Review Hasil &amp; Dokumen</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Daftar Template Checklist K3 */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SealCheck size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Master Template Checklist Pemeriksaan per Bidang ({templates.length})
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="rounded-md border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs font-bold">
                        {tmpl.category_code}
                      </span>
                      <Badge tone={tmpl.is_validated ? 'success' : 'warning'}>
                        {tmpl.is_validated ? `Tervalidasi v${tmpl.active_version}` : 'Belum Validasi'}
                      </Badge>
                    </div>
                    <h3 className="mt-2 font-bold text-sm text-slate-900 dark:text-white">{tmpl.name}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {(tmpl.items || []).length} Parameter Uji Standar Regulasi K3
                    </p>
                  </div>
                  {!tmpl.is_validated && canValidateTemplate && tmpl.active_version_id && (
                    <button
                      type="button"
                      onClick={() => handleValidateTemplate(tmpl.active_version_id)}
                      className="min-h-9 w-full rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer shadow-2xs"
                    >
                      Validasi Template Sekarang
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Modal 1: Mulai Inspeksi Baru */}
      <StartInspectionModal
        open={startModalOpen}
        onClose={() => setStartModalOpen(false)}
        onSubmit={handleStartInspection}
        orders={orders}
        orderObjects={orderObjects}
        templates={templates}
        startForm={startForm}
        setStartForm={setStartForm}
        onSelectOrder={handleSelectOrder}
        submitting={submitting}
      />

      {/* Modal 2: Lembar Kerja Riksa Uji Lapangan (4-Langkah) */}
      <InspectionDetailModal
        inspectionId={activeInspectionId}
        onClose={() => setActiveInspectionId(null)}
        isInspector={isInspector}
        user={user}
        onSaved={loadData}
        onPreviewPdf={handlePreviewPdf}
      />

      {/* Modal 3: Pratinjau Dokumen BAP & LHPP */}
      <PdfPreviewModal
        open={pdfPreviewModalOpen}
        onClose={closePdfPreview}
        title={previewPdfTitle}
        pdfUrl={previewPdfUrl}
        filename={previewPdfFilename}
        onPrint={handlePrintPdf}
      />
    </div>
  );
}
