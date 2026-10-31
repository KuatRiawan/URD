import { useCallback, useEffect, useState } from 'react';
import { MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { api } from '../../lib/api/axios.js';
import { SUKET_STATUS_LABELS } from '../../lib/utils/format.js';
import { SuketTable } from './components/SuketTable.jsx';
import { CreateSuketModal } from './components/CreateSuketModal.jsx';
import { SuketDetailModal } from './components/SuketDetailModal.jsx';

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
      await api.put(`/suket/${detailData.suket.id}`, {
        suketNo: editForm.suketNo || null,
        status: editForm.status,
        issuedDate: editForm.issuedDate || null,
        validUntil: editForm.validUntil || null,
        issuer: editForm.issuer,
        statusNotes: editForm.statusNotes
      });
      setFeedback('Data Suket K3 berhasil diperbarui.');
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
      const fd = new FormData();
      fd.append('scan', file);
      await api.post(`/suket/${detailData.suket.id}/scan`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFeedback('Berkas scan resmi Suket K3 berhasil diunggah.');
      await openDetail(detailData.suket.id);
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengunggah berkas scan Suket K3.');
    } finally {
      setSubmitting(false);
      e.target.value = '';
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
              className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
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
          className="min-h-11 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer"
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
        <SuketTable items={items} onOpenDetail={openDetail} />
      )}

      <CreateSuketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        handleCreateSuket={handleCreateSuket}
        createForm={createForm}
        setCreateForm={setCreateForm}
        objects={objects}
        lhppList={lhppList}
        submitting={submitting}
      />

      <SuketDetailModal
        detailData={detailData}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        canManage={canManage}
        editForm={editForm}
        setEditForm={setEditForm}
        handleUpdateSuket={handleUpdateSuket}
        handleUploadScan={handleUploadScan}
        submitting={submitting}
        followupForm={followupForm}
        setFollowupForm={setFollowupForm}
        handleAddFollowup={handleAddFollowup}
      />
    </div>
  );
}
