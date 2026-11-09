import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ClipboardText,
  CloudCheck,
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
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import {
  TableWrapper,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '../../components/ui/TableWrapper.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { CONCLUSION_LABELS, formatDateTime } from '../../lib/utils/format.js';
import { StartInspectionModal } from './components/StartInspectionModal.jsx';
import { InspectionDetailModal } from './components/InspectionDetailModal.jsx';
import { PdfPreviewModal } from './components/PdfPreviewModal.jsx';
import { OfflineSyncDrawer } from './components/OfflineSyncDrawer.jsx';

export function InspectionsPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isInspector = ['AHLI_K3', 'INSPECTOR', 'ADMIN_SISTEM'].includes(user?.role);
  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);
  const canValidateTemplate = user?.role === 'ADMIN_SISTEM';

  const [inspections, setInspections] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [syncDrawerOpen, setSyncDrawerOpen] = useState(false);

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);

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

  // Modal Lembar Kerja Riksa Uji (ID aktif, sinkron dengan URL)
  const activeInspectionId = searchParams.get('inspectionId') || null;

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

  const openInspectionModal = useCallback((id) => {
    try {
      sessionStorage.setItem('urd_active_inspection_id', id);
    } catch {
      void 0;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('inspectionId', id);
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const handleCloseInspection = useCallback(() => {
    try {
      sessionStorage.removeItem('urd_active_inspection_id');
    } catch {
      void 0;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('inspectionId');
        return next;
      },
      { replace: true }
    );
    loadData();
  }, [setSearchParams, loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      if (statusFilter === 'REVISI') {
        if (item.status !== 'DRAF' || !(Number(item.revision_no) > 0)) return false;
      } else if (statusFilter !== 'ALL' && item.status !== statusFilter) {
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
        openInspectionModal(res.data.inspection.id);
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
      await api.patch(`/inspections/templates/versions/${templateVersionId}/validate`);
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
        openInspectionModal(existing.id);
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
            openInspectionModal(res.data.inspection.id);
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
  }, [searchParams, setSearchParams, loading, inspections, isInspector, loadData, openInspectionModal]);

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

  const inspectionMetrics = useMemo(() => {
    const total = inspections.length;
    const draftCount = inspections.filter((i) => i.status === 'DRAF' && !(Number(i.revision_no) > 0)).length;
    const revisionCount = inspections.filter((i) => i.status === 'DRAF' && Number(i.revision_no) > 0).length;
    const submittedCount = inspections.filter((i) => i.status === 'TERKIRIM').length;
    return { total, draftCount, revisionCount, submittedCount };
  }, [inspections]);

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Header Halaman */}
      <PageHeader
        title={isPimpinan ? 'Monitoring Pengujian Lapangan & Checklist K3' : 'Form Inspeksi Lapangan & Checklist K3'}
        subtitle={
          isPimpinan
            ? 'Pemantauan progres pengisian lembar pemeriksaan teknis unit alat K3, temuan lapangan, dan status pengiriman ke QC.'
            : 'Lembar pemeriksaan teknis unit alat K3, pencatatan temuan ketidakpatuhan, dan berita acara lapangan.'
        }
        actions={
          isInspector ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={CloudCheck}
                onClick={() => setSyncDrawerOpen(true)}
                title="Kelola draf offline dan antrean sinkronisasi"
              >
                Offline &amp; Sinkronisasi
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setStartModalOpen(true)}
              >
                Mulai Inspeksi Baru
              </Button>
            </div>
          ) : null
        }
      />

      {/* Ringkasan Metrik Pengujian Lapangan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { key: 'ALL', label: 'Total Lembar Uji', value: inspectionMetrics.total, sub: 'Semua status form', tone: 'slate' },
          { key: 'DRAF', label: 'Proses Lapangan (Draf)', value: inspectionMetrics.draftCount, sub: 'Sedang diisi Ahli K3', tone: 'blue' },
          { key: 'REVISI', label: 'Perlu Revisi Teknis', value: inspectionMetrics.revisionCount, sub: 'Dikembalikan oleh QC', tone: 'amber' },
          { key: 'TERKIRIM', label: 'Terkirim ke QC', value: inspectionMetrics.submittedCount, sub: 'Siap proses BAP/LHPP', tone: 'emerald' }
        ].map((card) => {
          const isSelected = statusFilter === card.key && activeTab === 'worksheets';
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => {
                setActiveTab('worksheets');
                setStatusFilter(card.key);
              }}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#C81E1E] bg-[#C81E1E]/[0.04] dark:bg-rose-950/20 shadow-[0_2px_10px_rgba(200,30,30,0.08)]'
                  : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] hover:border-black/[0.14] dark:hover:border-white/[0.15]'
              }`}
            >
              <p className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold tracking-tight tabular-nums mt-1 ${
                  card.tone === 'amber' && card.value > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : card.tone === 'emerald' && card.value > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : card.tone === 'blue' && card.value > 0
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                }`}
              >
                {card.value}
              </p>
              <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">{card.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Segmented Control / Tabs: Lembar Kerja vs Master Template */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl w-full max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('worksheets')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[9px] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'worksheets'
              ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
          }`}
        >
          <FileText size={16} weight="bold" />
          <span>Lembar Kerja ({inspections.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 text-xs font-semibold rounded-[9px] transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'templates'
              ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
          }`}
        >
          <SealCheck size={16} weight="bold" />
          <span>Master Template ({templates.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingState label="Memuat daftar form inspeksi dan data lapangan..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : activeTab === 'worksheets' ? (
        <div className="space-y-4">
          {/* Baris Pencarian & Filter */}
          <div className="flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B]"
                weight="bold"
              />
              <input
                type="text"
                placeholder="Cari nomor PO, order, alat, atau klien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-4 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-none focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E]"
            >
              <option value="ALL">Semua Status Form</option>
              <option value="TERKIRIM">TERKIRIM (Siap Tinjau QC)</option>
              <option value="REVISI">DALAM REVISI (Dikembalikan ke Inspector)</option>
              <option value="DRAF">DRAF (Proses Pengujian Lapangan)</option>
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

                      {/* Tombol Aksi Sentuh Penuh */}
                      <Button
                        variant={isDraft && isInspector ? 'primary' : 'secondary'}
                        size="sm"
                        touchFriendly
                        icon={isDraft && isInspector ? ClipboardText : Eye}
                        onClick={() => openInspectionModal(item.id)}
                        className="w-full"
                      >
                        {isDraft && isInspector ? 'Isi Form Uji' : 'Detail'}
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* TAMPILAN DESKTOP: Tabel Lengkap */}
              <div className="hidden sm:block">
                <TableWrapper>
                  <TableHead>
                    <tr>
                      <TableCell isHeader>Order &amp; Klien</TableCell>
                      <TableCell isHeader>Objek Uji K3</TableCell>
                      <TableCell isHeader>Ahli K3 Pemeriksa</TableCell>
                      <TableCell isHeader>Kesimpulan Teknis</TableCell>
                      <TableCell isHeader>Status &amp; LHPP</TableCell>
                      <TableCell isHeader align="right">Aksi</TableCell>
                    </tr>
                  </TableHead>
                  <TableBody>
                    {filteredInspections.map((item) => (
                      <TableRow key={item.id} isClickable onClick={() => openInspectionModal(item.id)}>
                        <TableCell className="text-xs">
                          <div className="font-mono font-bold text-[#C81E1E] dark:text-red-400">
                            {item.po_number || item.order_no}
                          </div>
                          <div className="font-mono text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                            Order: {item.order_no}
                          </div>
                          <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.client_name}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.object_name}</div>
                          <div className="text-[#6E6E73] dark:text-[#98989D]">
                            {item.category_code} · SN: {item.serial_number}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">{item.inspector_name}</div>
                          <div className="text-[#6E6E73] dark:text-[#98989D]">{formatDateTime(item.inspected_at)}</div>
                        </TableCell>
                        <TableCell className="text-xs">
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
                            <span className="text-[#86868B]">Belum disimpulkan</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge tone={item.status === 'TERKIRIM' ? 'success' : 'warning'}>
                              {item.status}
                            </Badge>
                            {Number(item.revision_no) > 0 && (
                              <Badge tone={item.status === 'DRAF' ? 'danger' : 'neutral'}>
                                Revisi #{item.revision_no}
                              </Badge>
                            )}
                          </div>
                          {item.bap_no && (
                            <div className="mt-1 font-mono text-[11px] font-bold text-[#C81E1E] dark:text-red-400">
                              BAP: {item.bap_no} ({item.bap_status})
                            </div>
                          )}
                          {item.lhpp_no && (
                            <div className="mt-0.5 font-mono text-[11px] text-[#6E6E73] dark:text-[#98989D]">
                              {item.lhpp_no}
                            </div>
                          )}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            type="button"
                            variant={item.status === 'DRAF' && isInspector ? 'primary' : 'secondary'}
                            size="xs"
                            icon={item.status === 'DRAF' && isInspector ? ClipboardText : Eye}
                            onClick={() => openInspectionModal(item.id)}
                          >
                            {item.status === 'DRAF' && isInspector ? 'Isi Form' : 'Detail'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableWrapper>
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
        onClose={handleCloseInspection}
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

      {/* Drawer 4: Status Penyimpanan Offline & Antrean Sinkronisasi */}
      <OfflineSyncDrawer
        open={syncDrawerOpen}
        onClose={() => setSyncDrawerOpen(false)}
        onSyncSuccess={loadData}
      />
    </div>
  );
}
