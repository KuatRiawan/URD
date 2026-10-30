import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  FilePdf,
  LockKey,
  LockKeyOpen,
  MagnifyingGlass,
  PenNib,
  SealCheck,
  WarningCircle
} from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import logoUrd from '../../assets/logo-urd.png';
import { LoadingState, ErrorState, EmptyState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { useConfirm } from '../../components/ui/FeedbackProvider.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { formatDate, formatDateTime } from '../../lib/utils/format.js';

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
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR', 'MARKETING', 'AHLI_K3', 'INSPECTOR'].includes(user?.role);

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
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
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
            className="px-3 py-1.5 text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white rounded-md hover:bg-slate-900 dark:hover:bg-slate-600"
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nomor BAP &amp; PO</th>
                  <th className="py-3.5 px-4">Klien &amp; Lokasi</th>
                  <th className="py-3.5 px-4">Unit Alat Diperiksa</th>
                  <th className="py-3.5 px-4">Inspector</th>
                  <th className="py-3.5 px-4">Hasil Riksa Uji</th>
                  <th className="py-3.5 px-4">Status BAP</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {bapList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 dark:text-white">{b.bap_no}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        PO: <span className="font-mono font-semibold">{b.po_number || b.order_no}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">
                        Tgl Periksa: {formatDate(b.inspection_date)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{b.client_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{b.install_location || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{b.object_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {b.category_code} · SN: {b.serial_number} {b.capacity ? `· ${b.capacity}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      {b.inspector_name}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={b.is_compliant ? 'success' : 'danger'}>
                        {b.is_compliant ? 'MEMENUHI SYARAT K3' : 'TIDAK MEMENUHI'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={b.status === 'FINAL' ? 'success' : 'warning'}>
                        {b.status === 'FINAL' ? 'FINAL (TERKUNCI)' : 'DRAF BAP'}
                      </Badge>
                      {b.lhpp_no && (
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                          LHPP: {b.lhpp_no}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(b.id, b.bap_no)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#C81E1E] dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
                      >
                        <FilePdf size={15} weight="bold" />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => openBapDetail(b.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700 rounded-md"
                      >
                        Buka BAP
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail & Editor BAP sesuai Template Resmi PT Upaya Riksa Daya */}
      <Modal
        isOpen={Boolean(selectedBap)}
        onClose={() => setSelectedBap(null)}
        title={selectedBap ? `Berita Acara Riksa Uji: ${selectedBap.bap_no}` : 'Detail BAP'}
        size="xl"
      >
        {detailLoading || !selectedBap ? (
          <LoadingState message="Memuat lembar Berita Acara Riksa Uji..." />
        ) : (
          <div className="space-y-6">
            {feedback && (
              <Notice tone={feedback.type === 'error' ? 'error' : 'success'}>{feedback.message}</Notice>
            )}

            {/* Kop Dokumen Resmi BAP */}
            <div className="border-2 border-slate-800 rounded-xl p-4 bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#C81E1E] pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={logoUrd}
                    alt="Logo PT Upaya Riksa Daya"
                    className="h-12 w-auto object-contain"
                  />
                  <div>
                    <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                      PT UPAYA RIKSA DAYA
                    </h3>
                    <p className="text-xs font-semibold text-[#475569]">
                      Perusahaan Jasa K3 (PJK3) Bidang Pemeriksaan dan Pengujian
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="inline-block px-3 py-1 rounded bg-[#0F172A] text-white text-xs font-extrabold tracking-wider uppercase">
                    BERITA ACARA RIKSA UJI
                  </span>
                  <div className="mt-1 text-xs font-mono font-bold text-slate-800">
                    Nomor: {selectedBap.bap_no}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Status: {selectedBap.status} · Revisi #{selectedBap.revision_no}
                  </div>
                </div>
              </div>

              {/* Bagian Identitas Pemeriksaan sesuai Template BAP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 block">1. Objek yang Diperiksa</span>
                  <span className="font-bold text-slate-900">
                    {selectedBap.object_name} ({selectedBap.category_code} - {selectedBap.category_name})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">2. Nama Perusahaan / Klien</span>
                  <span className="font-bold text-slate-900">{selectedBap.client_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">3. Alamat Perusahaan</span>
                  <span className="font-medium text-slate-800">
                    {selectedBap.client_address || selectedBap.location_address || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">4. Pabrik Pembuat / Tahun</span>
                  <span className="font-medium text-slate-800">
                    {selectedBap.manufacturer || selectedBap.brand || '-'} /{' '}
                    {selectedBap.manufacture_year || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">5. Nomor Seri / Kapasitas</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBap.serial_number || '-'} / {selectedBap.capacity || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">6. Lokasi Pemeriksaan & Referensi PO</span>
                  <span className="font-medium text-slate-800">
                    {selectedBap.install_location || selectedBap.location_name || '-'} · PO:{' '}
                    <strong className="font-mono">{selectedBap.po_number || selectedBap.order_no}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Ruang Lingkup Riksa Uji (28 Item 3 Kolom sesuai Template BAP) */}
            <form onSubmit={handleSaveDraft} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Ruang Lingkup Riksa Uji (Centang yang Dilaksanakan)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Terpilih {draftForm.scopeItems.length} dari {scopeCatalog.length} item ruang lingkup pada template BAP.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tanggal Pelaksanaan:</label>
                  <input
                    type="date"
                    disabled={selectedBap.status === 'FINAL' || !canManage}
                    value={draftForm.inspectionDate}
                    onChange={(e) => setDraftForm({ ...draftForm, inspectionDate: e.target.value })}
                    className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
                {scopeCatalog.map((scopeName) => {
                  const checked = draftForm.scopeItems.includes(scopeName);
                  return (
                    <label
                      key={scopeName}
                      className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                        checked
                          ? 'bg-red-50/70 dark:bg-red-950/40 border-[#C81E1E] font-semibold text-slate-900 dark:text-white'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={selectedBap.status === 'FINAL' || !canManage}
                        checked={checked}
                        onChange={() => toggleScopeItem(scopeName)}
                        className="rounded text-[#C81E1E] focus:ring-[#C81E1E]"
                      />
                      <span>{scopeName}</span>
                    </label>
                  );
                })}
              </div>

              {/* Hasil Riksa Uji & Catatan Pemeriksaan */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hasil Riksa Uji (Pernyataan Resmi BAP)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 cursor-pointer">
                      <input
                        type="radio"
                        name="isCompliant"
                        disabled={selectedBap.status === 'FINAL' || !canManage}
                        checked={draftForm.isCompliant === true}
                        onChange={() => setDraftForm({ ...draftForm, isCompliant: true })}
                      />
                      MEMENUHI PERSYARATAN K3
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 cursor-pointer">
                      <input
                        type="radio"
                        name="isCompliant"
                        disabled={selectedBap.status === 'FINAL' || !canManage}
                        checked={draftForm.isCompliant === false}
                        onChange={() => setDraftForm({ ...draftForm, isCompliant: false })}
                      />
                      TIDAK MEMENUHI PERSYARATAN K3
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded bg-slate-100 dark:bg-slate-750 dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-slate-100 border-l-4 border-[#C81E1E]">
                  "Berdasarkan hasil riksa uji, dapat disimpulkan unit tersebut{' '}
                  <span className={draftForm.isCompliant ? 'text-emerald-700 dark:text-emerald-400 underline' : 'text-red-700 dark:text-red-400 underline'}>
                    {draftForm.isCompliant ? 'MEMENUHI' : 'TIDAK MEMENUHI'}
                  </span>{' '}
                  Persyaratan Keselamatan dan Kesehatan Kerja."
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Pemeriksaan Lapangan
                  </label>
                  <textarea
                    rows={3}
                    disabled={selectedBap.status === 'FINAL' || !canManage}
                    value={draftForm.inspectionNotes}
                    onChange={(e) => setDraftForm({ ...draftForm, inspectionNotes: e.target.value })}
                    placeholder="Catatan hasil riksa uji, temuan penting, atau kondisi operasional unit..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-md"
                  />
                </div>

                {selectedBap.status === 'DRAF' && canManage && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-md disabled:opacity-50"
                    >
                      Simpan Perubahan Draf BAP
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Area Tanda Tangan Inspector & Pemilik Alat/Unit (Perwakilan Klien) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Status Tanda Tangan Berita Acara
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Inspector (PT Upaya Riksa Daya)
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {selectedBap.inspector_signer_name || selectedBap.inspector_name} (
                        {selectedBap.inspector_signer_title || 'Ahli K3 Pemeriksa'})
                      </div>
                      {selectedBap.inspector_signed_at && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          Ditandatangani: {formatDateTime(selectedBap.inspector_signed_at)}
                        </div>
                      )}
                    </div>
                    <Badge variant={selectedBap.inspector_sig_file_id ? 'success' : 'warning'}>
                      {selectedBap.inspector_sig_file_id ? 'Sudah TTD' : 'Belum TTD'}
                    </Badge>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        Pemilik Alat / Unit (Perwakilan Klien)
                      </div>
                      <div className="text-slate-600 dark:text-slate-400">
                        {selectedBap.client_signer_name || 'Belum diisi'} (
                        {selectedBap.client_signer_title || 'Perwakilan Klien'})
                      </div>
                      {selectedBap.client_signed_at && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          Ditandatangani: {formatDateTime(selectedBap.client_signed_at)}
                        </div>
                      )}
                    </div>
                    <Badge variant={selectedBap.client_sig_file_id ? 'success' : 'warning'}>
                      {selectedBap.client_sig_file_id ? 'Sudah TTD' : 'Belum TTD'}
                    </Badge>
                  </div>
                </div>

                {selectedBap.status === 'DRAF' && canManage && (
                  <form onSubmit={handleSaveSignature} className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bubuhkan Tanda Tangan Digital pada BAP
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={sigForm.signerRole}
                        onChange={(e) => {
                          const role = e.target.value;
                          setSigForm({
                            signerRole: role,
                            signerName:
                              role === 'AHLI_K3'
                                ? selectedBap.inspector_signer_name || selectedBap.inspector_name || ''
                                : selectedBap.client_signer_name || selectedBap.contact_name || '',
                            signerTitle:
                              role === 'AHLI_K3'
                                ? 'Ahli K3 Pemeriksa'
                                : 'Pemilik Alat / Perwakilan Klien'
                          });
                        }}
                        className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      >
                        <option value="AHLI_K3">Inspector (Ahli K3)</option>
                        <option value="PERWAKILAN_KLIEN">Pemilik Alat / Perwakilan Klien</option>
                      </select>
                      <input
                        type="text"
                        required
                        value={sigForm.signerName}
                        onChange={(e) => setSigForm({ ...sigForm, signerName: e.target.value })}
                        placeholder="Nama lengkap penanda tangan..."
                        className="px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sigForm.signerTitle}
                        onChange={(e) => setSigForm({ ...sigForm, signerTitle: e.target.value })}
                        placeholder="Jabatan penanda tangan..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-md"
                      >
                        <PenNib size={14} weight="bold" />
                        Simpan TTD
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Aksi Finalisasi, Cetak PDF, Lanjut LHPP, dan Revisi */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Tindakan Dokumen BAP &amp; Tautan LHPP
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Setelah ditandatangani oleh Inspector dan Perwakilan Klien, finalisasi BAP untuk mengunci dokumen dan melanjutkan penyusunan LHPP teknis.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(selectedBap.id, selectedBap.bap_no)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#C81E1E] hover:bg-red-800 rounded-md"
                    >
                      <FilePdf size={16} weight="bold" />
                      Unduh / Cetak PDF BAP Unit Ini
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadBatchPoPdf(
                          selectedBap.order_id,
                          selectedBap.po_number || selectedBap.order_no
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                    >
                      <FilePdf size={16} weight="bold" />
                      Cetak Gabungan BAP 1 PO
                    </button>
                    {selectedBap.lhpp_id && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBap(null);
                          navigate('/app/lhpp');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md"
                      >
                        <SealCheck size={16} weight="bold" />
                        Buka Dokumen LHPP ({selectedBap.lhpp_status})
                      </button>
                    )}
                  </div>
                </div>

                {selectedBap.status === 'DRAF' && canManage && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleFinalizeBap}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md disabled:opacity-50"
                    >
                      <LockKey size={16} weight="bold" />
                      Finalisasi &amp; Kunci Berita Acara Riksa Uji (BAP)
                    </button>
                  </div>
                )}

                {selectedBap.status === 'FINAL' && selectedBap.lhpp_status !== 'TERBIT' && (
                  <form onSubmit={handleReopenBap} className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Buka Kunci BAP untuk Revisi Tercatat
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        minLength={5}
                        value={reopenReason}
                        onChange={(e) => setReopenReason(e.target.value)}
                        placeholder="Alasan pembukaan kunci revisi BAP..."
                        className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-md"
                      >
                        <LockKeyOpen size={14} weight="bold" />
                        Buka Kunci
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
