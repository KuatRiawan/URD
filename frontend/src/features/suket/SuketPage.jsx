import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  WarningCircle
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { EmptyState, ErrorBanner, LoadingState } from '../../components/feedback/StateViews.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';
import { SUKET_STATUS_LABELS } from '../../lib/utils/format.js';
import { SuketTable } from './components/SuketTable.jsx';
import { CreateSuketModal } from './components/CreateSuketModal.jsx';
import { SuketDetailModal } from './components/SuketDetailModal.jsx';

export function SuketPage() {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);

  const [items, setItems] = useState([]);
  const [objects, setObjects] = useState([]);
  const [lhppList, setLhppList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);
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
          params: {
            q: q || undefined,
            status: (statusFilter === 'EXPIRING_SOON' ? undefined : statusFilter) || undefined,
            limit: 50
          }
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
      fd.append('file', file);
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

  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  const stats = useMemo(() => {
    const total = items.length;
    const inDisnaker = items.filter((i) => ['DIAJUKAN', 'DALAM_PROSES'].includes(i.status)).length;
    const activeSuket = items.filter(
      (i) => i.status === 'TERBIT' && (i.days_remaining === null || i.days_remaining >= 0)
    ).length;
    const expiringSuket = items.filter(
      (i) => i.days_remaining !== null && i.days_remaining !== undefined && i.days_remaining <= 30
    ).length;
    return { total, inDisnaker, activeSuket, expiringSuket };
  }, [items]);

  const displayedItems = useMemo(() => {
    if (statusFilter === 'EXPIRING_SOON') {
      return items.filter(
        (i) => i.days_remaining !== null && i.days_remaining !== undefined && i.days_remaining <= 30
      );
    }
    return items;
  }, [items, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isPimpinan ? 'Monitoring Registri Suket K3' : 'Registri Suket K3'}
        subtitle={
          isPimpinan
            ? 'Pengawasan pengesahan Disnaker, penerbitan sertifikasi unit, dan kedaluwarsa Suket.'
            : 'Penerbitan Suket K3 di Disnaker dan pengawasan masa berlaku sertifikasi unit.'
        }
        actions={
          canManage && (
            <Button
              type="button"
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setCreateOpen(true)}
            >
              Daftarkan Pengajuan Suket
            </Button>
          )
        }
      />

      {/* Ringkasan Status Registri Suket K3 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7]">
            <ShieldCheck size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Total Suket K3</div>
            <div className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">{stats.total} Berkas</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Proses di Disnaker</div>
            <div className="text-lg font-bold tracking-tight text-blue-700 dark:text-blue-400">{stats.inDisnaker} Berkas</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Suket Terbit Aktif</div>
            <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{stats.activeSuket} Unit</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Habis &le; 30 Hari / Expired</div>
            <div className="text-lg font-bold tracking-tight text-rose-700 dark:text-rose-400">{stats.expiringSuket} Unit</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar: Status Penerbitan Suket */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl w-full max-w-2xl overflow-x-auto">
        {[
          { key: '', label: `Semua Suket (${stats.total})` },
          { key: 'BERKAS_DISIAPKAN', label: 'Proses Berkas' },
          { key: 'DIAJUKAN', label: `Di Disnaker (${stats.inDisnaker})` },
          { key: 'TERBIT', label: `Suket Terbit (${stats.activeSuket})` },
          { key: 'EXPIRING_SOON', label: `Segera Habis \u2264 30 Hari (${stats.expiringSuket})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 bg-white dark:bg-[#151821] p-3.5 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nomor Suket K3, objek uji, atau klien..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-none focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E] transition-colors"
          />
        </div>
        <select
          aria-label="Filter Status Suket"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-[10px] border border-black/[0.10] dark:border-white/[0.12] bg-[#F5F5F7]/60 dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:border-[#C81E1E] transition-colors cursor-pointer"
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
      ) : error ? (
        <ErrorBanner message={error} onRetry={loadData} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Belum ada data Suket K3"
          description="Catat pengajuan dan penerbitan Suket K3 Disnaker untuk memantau masa berlaku berkala."
        />
      ) : displayedItems.length === 0 ? (
        <EmptyState
          title="Tidak ada data Suket K3 pada filter ini"
          description="Pilih tab status lain di atas untuk melihat berkas Suket K3."
        />
      ) : (
        <SuketTable items={displayedItems} onOpenDetail={openDetail} />
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
