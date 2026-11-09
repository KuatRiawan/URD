import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  ArrowClockwise,
  ArrowUpRight,
  Camera,
  CheckCircle,
  ClipboardText,
  Clock,
  WarningCircle,
  WarningOctagon
} from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { useToast } from '../../components/ui/FeedbackProvider.jsx';
import { ErrorBanner, EmptyState, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api/axios.js';

const TYPE_LABELS = {
  UNIT_MISMATCH: 'Identitas unit berbeda dari PO', UNIT_UNAVAILABLE: 'Unit tidak tersedia',
  UNSAFE_CONDITION: 'Kondisi lokasi tidak aman', CHECKLIST_GAP: 'Checklist belum mencakup kondisi',
  MEASURING_TOOL: 'Kendala alat ukur', PIC_ABSENT: 'PIC tidak hadir',
  SIGNATURE_DECLINED: 'PIC menolak tanda tangan', NETWORK_OR_RECOVERY: 'Kendala koneksi atau pemulihan draf',
  UNIT_ADDITIONAL: 'Unit tambahan di lokasi', RESCHEDULE: 'Perlu perubahan jadwal',
  INSPECTOR_UNAVAILABLE: 'Inspector berhalangan', PO_CHANGE: 'Perubahan PO diminta',
  DOCUMENT_DELAY: 'Dokumen terlambat', OTHER: 'Kendala lain'
};
const STATUS_LABELS = {
  DILAPORKAN: 'Dilaporkan', MENUNGGU_TINDAK_LANJUT: 'Menunggu tindak lanjut',
  SEDANG_DITANGANI: 'Sedang ditangani', MENUNGGU_INFORMASI: 'Menunggu informasi',
  SIAP_DILANJUTKAN: 'Siap dilanjutkan', SELESAI: 'Selesai',
  TIDAK_DAPAT_DILANJUTKAN: 'Tidak dapat dilanjutkan'
};
const NEXT_STATUSES = {
  DILAPORKAN: ['MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  MENUNGGU_TINDAK_LANJUT: ['SEDANG_DITANGANI', 'MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SEDANG_DITANGANI: ['MENUNGGU_INFORMASI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  MENUNGGU_INFORMASI: ['SEDANG_DITANGANI', 'SIAP_DILANJUTKAN', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SIAP_DILANJUTKAN: ['SEDANG_DITANGANI', 'SELESAI', 'TIDAK_DAPAT_DILANJUTKAN'],
  SELESAI: [], TIDAK_DAPAT_DILANJUTKAN: []
};
const isOps = (role) => ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR'].includes(role);

export function IssuesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderObjects, setOrderObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (feedback) {
      toast(feedback, 'success');
      setFeedback('');
    }
  }, [feedback, toast]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickTab, setQuickTab] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    orderId: searchParams.get('orderId') || '',
    objectId: searchParams.get('objectId') || '',
    inspectionId: searchParams.get('inspectionId') || '',
    issueType: 'OTHER', priority: 'NORMAL', title: '', description: '', evidence: null
  });

  const isPimpinan = ['PIMPINAN', 'MANAGER'].includes(user?.role);

  // Metrik ringkasan pengawasan kendala operasional
  const stats = useMemo(() => {
    const total = items.length;
    const highPriority = items.filter((i) => i.priority === 'TINGGI' && i.status !== 'SELESAI').length;
    const inProgress = items.filter((i) =>
      ['DILAPORKAN', 'MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI'].includes(i.status)
    ).length;
    const resolved = items.filter((i) => i.status === 'SELESAI').length;
    return { total, highPriority, inProgress, resolved };
  }, [items]);

  // Filter items berdasarkan tab cepat
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      if (quickTab === 'ACTION_NEEDED') {
        return ['DILAPORKAN', 'MENUNGGU_TINDAK_LANJUT', 'SEDANG_DITANGANI', 'MENUNGGU_INFORMASI'].includes(item.status);
      }
      if (quickTab === 'HIGH_PRIORITY') {
        return item.priority === 'TINGGI';
      }
      if (quickTab === 'RESOLVED') {
        return item.status === 'SELESAI';
      }
      return true;
    });
  }, [items, quickTab]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [issueRes, orderRes] = await Promise.all([
        api.get('/issues', { params: { q: query || undefined, status: statusFilter || undefined, limit: 100 } }),
        api.get('/orders', { params: { limit: 100 } })
      ]);
      setItems(issueRes.data?.items || []);
      setOrders(orderRes.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Gagal memuat laporan kendala.');
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const orderId = form.orderId;
    if (!orderId) {
      setOrderObjects([]);
      return undefined;
    }
    let active = true;
    api.get(`/orders/${orderId}`).then((response) => {
      if (active) setOrderObjects(response.data?.objects || []);
    }).catch(() => { if (active) setOrderObjects([]); });
    return () => { active = false; };
  }, [form.orderId]);

  useEffect(() => {
    const issueId = searchParams.get('issueId');
    if (issueId) {
      const found = items.find((item) => item.id === issueId);
      if (found) setSelected(found);
    }
  }, [items, searchParams]);

  const canCreate = isOps(user?.role) || ['INSPECTOR', 'AHLI_K3'].includes(user?.role);
  const canUpdate = isOps(user?.role);

  const createIssue = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/issues', {
        orderId: form.orderId,
        objectId: form.objectId || null,
        inspectionId: form.inspectionId || null,
        issueType: form.issueType,
        priority: form.priority,
        title: form.title,
        description: form.description
      });
      const issue = response.data.issue;
      if (form.evidence) {
        const data = new FormData();
        data.append('file', form.evidence);
        await api.post(`/issues/${issue.id}/evidence`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setCreateOpen(false);
      setFeedback(`Laporan ${issue.issue_no} tersimpan dan diteruskan ke tim operasional.`);
      setForm((current) => ({ ...current, title: '', description: '', evidence: null }));
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Laporan belum berhasil disimpan. Periksa koneksi lalu coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const updateIssue = async (issue, status, actionNote) => {
    if (!actionNote.trim()) {
      setError('Catatan tindak lanjut wajib diisi agar perubahan dapat ditelusuri.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.patch(`/issues/${issue.id}`, { status, assignedTo: user.id, actionNote });
      setFeedback(`Status ${issue.issue_no} diperbarui menjadi ${STATUS_LABELS[status]}.`);
      setSelected(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Pembaruan kendala gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm((current) => ({
      ...current,
      orderId: searchParams.get('orderId') || current.orderId,
      objectId: searchParams.get('objectId') || current.objectId,
      inspectionId: searchParams.get('inspectionId') || current.inspectionId
    }));
    setCreateOpen(true);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={isPimpinan ? 'Monitoring Kendala Operasional' : 'Kendala Operasional'}
        subtitle={
          isPimpinan
            ? 'Pengawasan hambatan teknis, risiko keselamatan lapangan, dan status tindak lanjut penyelesaian.'
            : 'Pencatatan dan tindak lanjut kendala operasional.'
        }
        actions={
          canCreate ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={openCreate}
              className="w-full sm:w-auto"
            >
              Laporkan Kendala
            </Button>
          ) : null
        }
      />

      {/* Ringkasan Status Kendala Operasional */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7]">
            <ClipboardText size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Total Kendala</div>
            <div className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">{stats.total} Laporan</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-100/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningOctagon size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Prioritas Tinggi Aktif</div>
            <div className="text-lg font-bold tracking-tight text-rose-700 dark:text-rose-400">{stats.highPriority} Kendala</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Clock size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Dalam Penanganan</div>
            <div className="text-lg font-bold tracking-tight text-amber-700 dark:text-amber-400">{stats.inProgress} Proses</div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-4px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">Selesai Ditangani</div>
            <div className="text-lg font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{stats.resolved} Selesai</div>
          </div>
        </div>
      </div>

      {/* Segmented Filter Bar Cepat */}
      <div className="flex items-center gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] rounded-xl w-full max-w-xl overflow-x-auto">
        {[
          { key: 'ALL', label: `Semua Kendala (${items.length})` },
          { key: 'ACTION_NEEDED', label: `Perlu Tindak Lanjut (${stats.inProgress})` },
          { key: 'HIGH_PRIORITY', label: `Prioritas Tinggi (${stats.highPriority})` },
          { key: 'RESOLVED', label: `Selesai (${stats.resolved})` }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setQuickTab(tab.key)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-[9px] whitespace-nowrap transition-all cursor-pointer ${
              quickTab === tab.key
                ? 'bg-white dark:bg-[#1C1F2B] text-[#1D1D1F] dark:text-[#F5F5F7] shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                : 'text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2.5 rounded-2xl border border-black/[0.06] bg-white p-3.5 dark:border-white/[0.08] dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:flex-row items-stretch sm:items-end">
        <label className="flex-1 text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
          Cari laporan
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomor kendala, PO, unit, atau judul..." className="mt-1 h-9 w-full rounded-[10px] border border-black/[0.10] bg-[#F5F5F7]/60 px-3 text-xs dark:border-white/[0.12] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] focus:outline-hidden focus:bg-white dark:focus:bg-[#1C1F2B] focus:border-[#C81E1E]" />
        </label>
        <label className="w-full text-xs font-semibold text-[#6E6E73] dark:text-[#98989D] sm:w-64">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 h-9 w-full rounded-[10px] border border-black/[0.10] bg-[#F5F5F7]/60 px-3 text-xs dark:border-white/[0.12] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-[#F5F5F7] cursor-pointer focus:outline-hidden focus:border-[#C81E1E]">
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="button" onClick={load} aria-label="Muat ulang laporan" className="h-9 self-stretch sm:self-auto px-3 inline-flex items-center justify-center rounded-[10px] border border-black/[0.10] text-[#1D1D1F] hover:bg-black/[0.04] dark:border-white/[0.12] dark:text-[#F5F5F7] dark:hover:bg-white/[0.06] cursor-pointer"><ArrowClockwise size={16} /></button>
      </div>

      {loading ? (
        <LoadingState message="Memuat laporan kendala..." />
      ) : error ? (
        <ErrorBanner message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState icon={ClipboardText} title="Belum ada laporan kendala" description="Laporan yang dibuat Inspector atau tim operasional akan tercatat di sini." />
      ) : displayedItems.length === 0 ? (
        <EmptyState icon={ClipboardText} title="Tidak ada kendala pada filter ini" description="Pilih tab filter status lain di atas untuk melihat laporan kendala." />
      ) : (
        <div className="space-y-3">
          {displayedItems.map((issue) => (
            <article key={issue.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {issue.priority === 'TINGGI' && <WarningCircle size={16} className="text-red-600" aria-label="Prioritas tinggi" />}
                    <span className="text-xs font-mono font-bold text-slate-500">{issue.issue_no}</span>
                    <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold dark:border-slate-700">{STATUS_LABELS[issue.status] || issue.status}</span>
                    {issue.priority === 'TINGGI' && <span className="text-xs font-bold text-red-700 dark:text-red-300">Prioritas tinggi</span>}
                  </div>
                  <h2 className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 dark:text-white">{issue.title}</h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">{TYPE_LABELS[issue.issue_type]} · {issue.client_name} · PO {issue.po_number || issue.order_no}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{issue.serial_number || 'Tanpa unit spesifik'} · Dilaporkan oleh {issue.reporter_name} · {new Date(issue.created_at).toLocaleString('id-ID')}</p>
                  <p className="mt-2.5 whitespace-pre-wrap text-xs sm:text-sm text-slate-700 dark:text-slate-200">{issue.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Penanggung jawab: {issue.assignee_name || 'Belum ditentukan'}</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="xs"
                  icon={ArrowUpRight}
                  iconPosition="right"
                  onClick={() => setSelected(selected?.id === issue.id ? null : issue)}
                >
                  {selected?.id === issue.id ? 'Tutup Rincian' : 'Rincian & Tindak Lanjut'}
                </Button>
              </div>
              {selected?.id === issue.id && <IssueDetails issue={issue} canUpdate={canUpdate} saving={saving} onUpdate={updateIssue} />}
            </article>
          ))}
        </div>
      )}

      {createOpen && (
        <Modal open onClose={() => { if (!saving) setCreateOpen(false); }} title="Laporkan kendala lapangan" size="lg" closeOnBackdrop={!saving}>
          <form onSubmit={createIssue} className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">Laporan diteruskan ke Marketing dan Admin Sistem. Laporan ini tidak mengubah hasil checklist atau identitas unit.</p>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">PO terkait *
              <select required value={form.orderId} onChange={(event) => setForm({ ...form, orderId: event.target.value, objectId: '', inspectionId: '' })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="">Pilih PO</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.po_number || order.order_no} · {order.client_name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Unit terkait
              <select value={form.objectId} onChange={(event) => setForm({ ...form, objectId: event.target.value })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
                <option value="">Kendala umum pada PO</option>{orderObjects.map((object) => <option key={object.id} value={object.id}>{object.name} · {object.serial_number}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Jenis kendala *
              <select required value={form.issueType} onChange={(event) => setForm({ ...form, issueType: event.target.value, priority: event.target.value === 'UNSAFE_CONDITION' ? 'TINGGI' : form.priority })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            </label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Judul *<input required minLength={5} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Keterangan dan tindak lanjut yang dibutuhkan *<textarea required minLength={5} maxLength={3000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-950" /></label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"><Camera size={18} />{form.evidence ? form.evidence.name : 'Tambahkan bukti foto/PDF (opsional)'}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(event) => setForm({ ...form, evidence: event.target.files?.[0] || null })} /></label>
            {form.issueType === 'UNSAFE_CONDITION' && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Catat kondisi yang ditemukan dan hentikan pemeriksaan sesuai prosedur keselamatan kerja URD. Aplikasi tidak menentukan tindakan teknis K3.</p>}
            <div className="flex justify-end gap-2 border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={saving}
                onClick={() => setCreateOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving}
                loading={saving}
              >
                Simpan Laporan
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function IssueDetails({ issue, canUpdate, saving, onUpdate }) {
  const [details, setDetails] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    let alive = true;
    api.get(`/issues/${issue.id}`).then((response) => { if (alive) setDetails(response.data); })
      .catch((err) => { if (alive) setError(err.response?.data?.error?.message || 'Gagal memuat riwayat kendala.'); });
    return () => { alive = false; };
  }, [issue.id]);
  const submit = async (event) => {
    event.preventDefault();
    await onUpdate(issue, status, note);
  };
  return (
    <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-800 lg:grid-cols-2">
      <section><h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat tindak lanjut</h3>{error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}{!details && !error ? <p className="mt-2 text-sm text-slate-500">Memuat riwayat...</p> : <ol className="mt-3 space-y-3">{(details?.events || []).map((event) => <li key={event.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700"><p className="text-sm font-semibold">{event.actor_name || 'Sistem'} · {event.to_status ? STATUS_LABELS[event.to_status] : 'Bukti ditambahkan'}</p><p className="text-sm text-slate-600 dark:text-slate-300">{event.note}</p><time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString('id-ID')}</time></li>)}</ol>}
        {(details?.evidence || []).length > 0 && <div className="mt-4 space-y-1">{details.evidence.map((file) => <a key={file.id} href={`/api/v1/dashboard/files/${file.id}`} target="_blank" rel="noreferrer" className="block text-sm text-red-700 underline dark:text-red-300">Buka bukti: {file.original_name}</a>)}</div>}
      </section>
      {canUpdate && (NEXT_STATUSES[issue.status] || []).length > 0 && <form onSubmit={submit} className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-950"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Catat tindak lanjut</h3><label className="block text-xs font-semibold">Status baru<select required value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="">Pilih status</option>{NEXT_STATUSES[issue.status].map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label><label className="block text-xs font-semibold">Catatan tindakan *<textarea required minLength={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label><button type="submit" disabled={saving || !status} className="min-h-10 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">{saving ? 'Menyimpan...' : 'Simpan tindak lanjut'}</button></form>}
      {!canUpdate && <p className="text-sm text-slate-600 dark:text-slate-300">Anda dapat memantau laporan ini. Perubahan status ditangani tim operasional.</p>}
    </div>
  );
}
