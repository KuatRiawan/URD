import { useCallback, useEffect, useState } from 'react';
import {
  ChatCircleText,
  DownloadSimple,
  Eye,
  MagnifyingGlass,
  Plus,
  UploadSimple,
  WarningOctagon
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import {
  FOLLOWUP_STATUS_LABELS,
  formatDate,
  formatDateTime,
  SUKET_STATUS_LABELS
} from '../../lib/utils/format.js';

const STATUS_TONE = {
  BERKAS_DISIAPKAN: 'neutral',
  DIAJUKAN: 'info',
  DALAM_PROSES: 'warning',
  TERBIT: 'success',
  PERLU_PERBAIKAN: 'danger'
};

export function SuketPage() {
  const { user } = useAuth();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [items, setItems] = useState([]);
  const [objects, setObjects] = useState([]);
  const [lhppList, setLhppList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    objectId: '',
    lhppId: '',
    suketNo: '',
    status: 'BERKAS_DISIAPKAN',
    submittedDate: new Date().toISOString().slice(0, 10),
    issuedDate: '',
    validUntil: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    issuer: 'Disnakertrans Provinsi DKI Jakarta',
    statusNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const [detailData, setDetailData] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    suketNo: '',
    status: 'TERBIT',
    issuedDate: '',
    validUntil: '',
    issuer: '',
    statusNotes: ''
  });
  const [followupForm, setFollowupForm] = useState({
    status: 'SUDAH_DIHUBUNGI',
    contactPic: '',
    note: ''
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [suketRes, objRes, lhppRes] = await Promise.all([
        api.get('/suket', {
          params: { q: q || undefined, status: statusFilter || undefined, limit: 50 }
        }),
        api.get('/objects', { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
        api.get('/lhpp', { params: { limit: 100 } }).catch(() => ({ data: { items: [] } }))
      ]);
      setItems(suketRes.data?.items || []);
      setObjects(objRes.data?.items || []);
      setLhppList(lhppRes.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat registri Surat Keterangan (Suket) K3.');
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSuket = async (e) => {
    e.preventDefault();
    if (!createForm.objectId) {
      setError('Pilih objek uji K3 terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/suket', {
        objectId: createForm.objectId,
        lhppId: createForm.lhppId || null,
        suketNo: createForm.suketNo || null,
        status: createForm.status,
        submittedDate: createForm.submittedDate || null,
        issuedDate: createForm.issuedDate || null,
        validUntil: createForm.validUntil || null,
        issuer: createForm.issuer,
        statusNotes: createForm.statusNotes
      });
      setCreateOpen(false);
      setFeedback('Data pengajuan Suket K3 berhasil didaftarkan.');
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data Suket K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = async (id) => {
    setError('');
    try {
      const res = await api.get(`/suket/${id}`);
      const data = res.data;
      setDetailData(data);
      setEditForm({
        suketNo: data.suket?.suket_no || '',
        status: data.suket?.status || 'BERKAS_DISIAPKAN',
        issuedDate: data.suket?.issued_date ? data.suket.issued_date.slice(0, 10) : '',
        validUntil: data.suket?.valid_until ? data.suket.valid_until.slice(0, 10) : '',
        issuer: data.suket?.issuer || 'Disnakertrans Provinsi DKI Jakarta',
        statusNotes: data.suket?.status_notes || ''
      });
      setFollowupForm({
        status: data.suket?.followup_status || 'SUDAH_DIHUBUNGI',
        contactPic: '',
        note: ''
      });
      setDetailOpen(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat detail Suket K3.');
    }
  };

  const handleUpdateSuket = async (e) => {
    e.preventDefault();
    if (!detailData?.suket) return;
    setSubmitting(true);
    setError('');
    try {
      await api.patch(`/suket/${detailData.suket.id}`, {
        suketNo: editForm.suketNo || null,
        status: editForm.status,
        issuedDate: editForm.issuedDate || null,
        validUntil: editForm.validUntil || null,
        issuer: editForm.issuer,
        statusNotes: editForm.statusNotes
      });
      setFeedback('Data Surat Keterangan K3 berhasil diperbarui.');
      await openDetail(detailData.suket.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memperbarui Suket K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadScan = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !detailData?.suket) return;
    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/suket/${detailData.suket.id}/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback('Berkas scan Suket K3 resmi berhasil diunggah.');
      await openDetail(detailData.suket.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah berkas scan Suket K3.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!detailData?.suket) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post(`/suket/${detailData.suket.id}/followups`, followupForm);
      setFollowupForm((prev) => ({ ...prev, contactPic: '', note: '' }));
      setFeedback('Log tindak lanjut perpanjangan Suket K3 berhasil dicatat.');
      await openDetail(detailData.suket.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mencatat tindak lanjut Suket K3.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registri Surat Keterangan (Suket) K3"
        subtitle="Pantau proses penerbitan Suket K3 di Disnaker, simpan arsip scan dokumen resmi, dan awasi masa berlaku sertifikasi objek uji."
        actions={
          canManage && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              <Plus size={16} weight="bold" />
              <span>Daftarkan Pengajuan Suket K3</span>
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

      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor Suket K3, objek uji, atau perusahaan klien..."
            className="w-full min-h-11 pl-10 pr-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:border-[#C81E1E] focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter Status Suket"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
        >
          <option value="">Semua Status Pengajuan</option>
          {Object.entries(SUKET_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState label="Memuat registri Suket K3..." />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada data Suket K3"
          description="Catat pengajuan dan penerbitan Suket K3 Disnaker untuk memantau masa berlaku berkala."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">No. Suket & Instansi</th>
                  <th className="py-3 px-4">Perusahaan Klien</th>
                  <th className="py-3 px-4">Objek Uji K3</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4">Status Penerbitan</th>
                  <th className="py-3 px-4">Status Follow-Up</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {items.map((item) => {
                  const days = item.days_remaining;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.suket_no || 'Belum Terbit Nomor'}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">{item.issuer || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-900 dark:text-slate-100">
                        {item.client_name}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{item.object_name}</div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {item.category_code} · SN: {item.serial_number}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.valid_until ? formatDate(item.valid_until) : '-'}
                        </div>
                        {days !== null && days !== undefined && (
                          <div
                            className={`text-[11px] font-bold ${
                              days < 0
                                ? 'text-red-700 dark:text-red-400'
                                : days <= 60
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {days < 0
                              ? `Kedaluwarsa ${Math.abs(days)} hari lalu`
                              : `Sisa ${days} hari`}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge tone={STATUS_TONE[item.status] || 'neutral'}>
                          {SUKET_STATUS_LABELS[item.status] || item.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {FOLLOWUP_STATUS_LABELS[item.followup_status] || item.followup_status}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openDetail(item.id)}
                          className="min-h-9 inline-flex items-center gap-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Eye size={15} />
                          <span>Kelola</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah Suket K3 */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Daftarkan Pengajuan / Penerbitan Suket K3"
        size="lg"
      >
        <form onSubmit={handleCreateSuket} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Objek Uji K3 *
              </label>
              <select
                required
                value={createForm.objectId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, objectId: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="">Pilih Objek Uji...</option>
                {objects.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.client_name} · SN: {o.serial_number})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Referensi Dokumen LHPP
              </label>
              <select
                value={createForm.lhppId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, lhppId: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                <option value="">Tanpa tautan LHPP...</option>
                {lhppList.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.lhpp_no} ({l.object_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nomor Suket K3 Disnaker
              </label>
              <input
                type="text"
                value={createForm.suketNo}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, suketNo: e.target.value }))}
                placeholder="Contoh: 560/1184/DISNAKER-K3/2026"
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Status Pengajuan *
              </label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              >
                {Object.entries(SUKET_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Tanggal Terbit
              </label>
              <input
                type="date"
                value={createForm.issuedDate}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, issuedDate: e.target.value }))
                }
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Masa Berlaku Sampai
              </label>
              <input
                type="date"
                value={createForm.validUntil}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, validUntil: e.target.value }))
                }
                className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Instansi Penerbit
            </label>
            <input
              type="text"
              value={createForm.issuer}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, issuer: e.target.value }))}
              className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-11 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Suket K3'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Suket & Log Follow-Up */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          detailData?.suket
            ? `Detail Suket K3: ${detailData.suket.object_name} (${detailData.suket.client_name})`
            : 'Detail Suket K3'
        }
        size="xl"
      >
        {detailData?.suket && (
          <div className="space-y-6 text-sm">
            {canManage && (
              <form
                onSubmit={handleUpdateSuket}
                className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/40"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <WarningOctagon size={16} />
                  <span>Perbarui Status & Masa Berlaku Suket K3</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor Suket K3</label>
                    <input
                      type="text"
                      value={editForm.suketNo}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, suketNo: e.target.value }))
                      }
                      className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status Pengajuan</label>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, status: e.target.value }))
                      }
                      className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100"
                    >
                      {Object.entries(SUKET_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Berlaku Sampai</label>
                    <input
                      type="date"
                      value={editForm.validUntil}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, validUntil: e.target.value }))
                      }
                      className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="min-h-9 inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                      <UploadSimple size={15} />
                      <span>Unggah Scan Suket (PDF/JPG)</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleUploadScan}
                        className="hidden"
                      />
                    </label>
                    {detailData.suket.scan_file_id && (
                      <a
                        href={`/api/v1/dashboard/files/${detailData.suket.scan_file_id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-9 inline-flex items-center gap-1 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        <DownloadSimple size={15} />
                        <span>Lihat Arsip Scan</span>
                      </a>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-9 rounded bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#a11616]"
                  >
                    Simpan Perubahan Suket
                  </button>
                </div>
              </form>
            )}

            {/* Riwayat Tindak Lanjut Perpanjangan */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <ChatCircleText size={16} />
                <span>
                  Riwayat Komunikasi Follow-Up Perpanjangan ({(detailData.followups || []).length})
                </span>
              </h4>
              {(detailData.followups || []).map((f) => (
                <div
                  key={f.id}
                  className="rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                >
                  <div>
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      [{FOLLOWUP_STATUS_LABELS[f.status] || f.status}]
                    </span>{' '}
                    <span className="text-slate-900 dark:text-slate-100">{f.note || '-'}</span>
                    {f.contact_pic && (
                      <span className="text-slate-500 dark:text-slate-400"> · PIC: {f.contact_pic}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {f.contacted_by_name} · {formatDateTime(f.created_at)}
                  </div>
                </div>
              ))}
              {canManage && (
                <form
                  onSubmit={handleAddFollowup}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
                >
                  <select
                    value={followupForm.status}
                    onChange={(e) =>
                      setFollowupForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-800 dark:text-slate-100"
                  >
                    {Object.entries(FOLLOWUP_STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={followupForm.contactPic}
                    onChange={(e) =>
                      setFollowupForm((prev) => ({ ...prev, contactPic: e.target.value }))
                    }
                    placeholder="Nama PIC klien..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="text"
                    required
                    value={followupForm.note}
                    onChange={(e) =>
                      setFollowupForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    placeholder="Hasil konfirmasi telepon/WA..."
                    className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-9 rounded bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Catat Follow-Up
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
