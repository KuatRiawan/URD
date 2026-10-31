import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ClipboardText,
  Eye,
  FileText,
  MagnifyingGlass,
  Plus,
  SealCheck,
  Buildings,
  User as UserIcon,
  CalendarBlank
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
  const isInspector = ['AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'].includes(user?.role);
  const canValidateTemplate = ['ADMIN_SISTEM', 'PIMPINAN'].includes(user?.role);

  const [inspections, setInspections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Navigasi Tab Segmented: Lembar Kerja vs Master Template
  const [activeTab, setActiveTab] = useState('worksheets'); // 'worksheets' | 'templates'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchPo = (item.po_number || '').toLowerCase().includes(q);
      const matchOrder = (item.order_no || '').toLowerCase().includes(q);
      const matchClient = (item.client_name || '').toLowerCase().includes(q);
      const matchObj = (item.object_name || '').toLowerCase().includes(q);
      const matchSn = (item.serial_number || '').toLowerCase().includes(q);
      const matchInspector = (item.inspector_name || '').toLowerCase().includes(q);
      return matchPo || matchOrder || matchClient || matchObj || matchSn || matchInspector;
    });
  }, [inspections, searchQuery, statusFilter]);

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
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Header Halaman */}
      <PageHeader
        title="Form Inspeksi Lapangan & Checklist K3"
        subtitle="Lembar pemeriksaan teknis unit alat K3, pencatatan temuan ketidakpatuhan, dan berita acara lapangan."
        actions={
          isInspector && (
            <button
              type="button"
              onClick={() => setStartModalOpen(true)}
              className="min-h-11 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#C81E1E] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#a11616] active:scale-[0.98] transition-all cursor-pointer"
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

      {/* Segmented Control / Tabs: Lembar Kerja vs Master Template */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('worksheets')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'worksheets'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={16} weight="bold" />
          <span>Lembar Kerja ({inspections.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <SealCheck size={16} weight="bold" />
          <span>Master Template ({templates.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState label="Memuat daftar form inspeksi dan data lapangan..." />
      ) : activeTab === 'worksheets' ? (
        <div className="space-y-4">
          {/* Baris Pencarian & Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                weight="bold"
              />
              <input
                type="text"
                placeholder="Cari nomor PO, order, alat, atau klien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20 focus:border-[#C81E1E]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-2.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#C81E1E]/20"
            >
              <option value="ALL">Semua Status Form</option>
              <option value="DRAF">DRAF (Belum Selesai)</option>
              <option value="TERKIRIM">TERKIRIM (Final Lapangan)</option>
            </select>
          </div>

          {filteredInspections.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <EmptyState
                title="Tidak ada lembar kerja yang cocok"
                description={
                  searchQuery || statusFilter !== 'ALL'
                    ? 'Coba sesuaikan kata kunci pencarian atau filter status Anda.'
                    : 'Belum ada lembar kerja pemeriksaan. Mulai inspeksi baru untuk memeriksa alat.'
                }
              />
            </div>
          ) : (
            <>
              {/* TAMPILAN MOBILE: Kartu Objek Uji K3 (React-Native-UI-Templates style) */}
              <div className="sm:hidden space-y-3">
                {filteredInspections.map((item) => {
                  const isDraft = item.status === 'DRAF';
                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-xs space-y-3"
                    >
                      {/* Baris Atas: Nomor PO & Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-xs font-bold text-[#C81E1E] dark:text-red-400">
                            {item.po_number || item.order_no}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            Order: {item.order_no}
                          </div>
                        </div>
                        <Badge tone={isDraft ? 'warning' : 'success'}>
                          {item.status}
                        </Badge>
                      </div>

                      {/* Baris Tengah: Objek Uji K3 */}
                      <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                            {item.object_name}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.category_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          SN: {item.serial_number || 'Tidak ada no seri'}
                        </div>
                      </div>

                      {/* Info Detail: Klien & Pemeriksa */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5 truncate">
                          <Buildings size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{item.client_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <UserIcon size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{item.inspector_name || 'Ahli K3'}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                          <CalendarBlank size={13} className="shrink-0" />
                          <span>Pemeriksaan: {formatDateTime(item.inspected_at)}</span>
                        </div>
                      </div>

                      {/* Dokumen & Kesimpulan Teknis jika ada */}
                      {(item.conclusion || item.bap_no) && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
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
                            <span className="text-[11px] text-slate-400">Belum disimpulkan</span>
                          )}

                          {item.bap_no && (
                            <div className="font-mono text-[10px] font-bold text-[#C81E1E]">
                              BAP: {item.bap_no}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tombol Aksi Sentuh Penuh (Full Width Touch Target) */}
                      <button
                        type="button"
                        onClick={() => setActiveInspectionId(item.id)}
                        className={`min-h-11 w-full flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] cursor-pointer shadow-xs ${
                          isDraft && isInspector
                            ? 'bg-[#C81E1E] text-white hover:bg-[#a61717]'
                            : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {isDraft && isInspector ? (
                          <>
                            <ClipboardText size={18} weight="bold" />
                            <span>Kerjakan Form Uji</span>
                          </>
                        ) : (
                          <>
                            <Eye size={18} weight="bold" />
                            <span>Lihat Hasil &amp; Dokumen</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN DESKTOP: Tabel Lengkap */}
              <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
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
                      {filteredInspections.map((item) => (
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
                              className={`min-h-9 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
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
              </div>
            </>
          )}
        </div>
      ) : (
        /* TAB 2: MASTER TEMPLATE CHECKLIST (Terpisah rapi dari lembar kerja harian) */
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-4 text-xs text-blue-900 dark:text-blue-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <SealCheck size={16} weight="bold" />
              <span>Tentang Dokumen Master Template</span>
            </div>
            <p className="text-[11px] text-blue-800 dark:text-blue-400 leading-relaxed">
              Master Template adalah daftar parameter checklist uji standar Permenaker per bidang (PAA, PUBT, Listrik, Petir, Elevator).
              Ketika Ahli K3 memulai inspeksi alat baru, butir checklist disalin dari template ini. Pengelolaan dan validasi dilakukan oleh Pimpinan / Admin Sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between gap-3 bg-white dark:bg-slate-900 shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-800 dark:bg-slate-700 text-white font-mono text-xs font-bold">
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
                    className="min-h-10 w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer shadow-xs active:scale-[0.98] transition-all"
                  >
                    Validasi Template Sekarang
                  </button>
                )}
              </div>
            ))}
          </div>
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
