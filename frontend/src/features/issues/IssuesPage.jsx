import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowClockwise, ArrowUpRight, Camera, ClipboardText, WarningCircle } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { ErrorBanner, EmptyState, LoadingState } from '../../components/feedback/StateViews.jsx';
import { Notice } from '../../components/ui/Notice.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
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
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderObjects, setOrderObjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    orderId: searchParams.get('orderId') || '',
    objectId: searchParams.get('objectId') || '',
    inspectionId: searchParams.get('inspectionId') || '',
    issueType: 'OTHER', priority: 'NORMAL', title: '', description: '', evidence: null
  });

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
        title="Kendala Operasional"
        subtitle="Catat hambatan lapangan, tentukan penanggung jawab, dan ikuti tindak lanjutnya."
        actions={canCreate ? <button type="button" onClick={openCreate} className="min-h-11 rounded-md bg-[#C81E1E] px-4 text-sm font-bold text-white hover:bg-[#a11616] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-red-600">Laporkan Kendala</button> : null}
      />
      {feedback && <Notice tone="success" onClose={() => setFeedback('')}>{feedback}</Notice>}
      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row">
        <label className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          Cari laporan
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nomor kendala, PO, unit, atau judul" className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="w-full text-xs font-semibold text-slate-700 dark:text-slate-300 sm:w-64">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950">
            <option value="">Semua status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <button type="button" onClick={load} aria-label="Muat ulang laporan" className="min-h-11 self-end rounded-md border border-slate-300 px-3 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowClockwise size={18} /></button>
      </div>

      {loading ? <LoadingState message="Memuat laporan kendala..." /> : items.length === 0 ? (
        <EmptyState icon={ClipboardText} title="Belum ada laporan kendala" description="Laporan yang dibuat Inspector atau tim operasional akan tercatat di sini." />
      ) : (
        <div className="space-y-3">
          {items.map((issue) => (
            <article key={issue.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {issue.priority === 'TINGGI' && <WarningCircle size={18} className="text-red-600" aria-label="Prioritas tinggi" />}
                    <span className="text-xs font-bold text-slate-500">{issue.issue_no}</span>
                    <span className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold dark:border-slate-700">{STATUS_LABELS[issue.status] || issue.status}</span>
                    {issue.priority === 'TINGGI' && <span className="text-xs font-bold text-red-700 dark:text-red-300">Prioritas tinggi</span>}
                  </div>
                  <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">{issue.title}</h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{TYPE_LABELS[issue.issue_type]} · {issue.client_name} · PO {issue.po_number || issue.order_no}</p>
                  <p className="mt-1 text-xs text-slate-500">{issue.serial_number || 'Tanpa unit spesifik'} · Dilaporkan oleh {issue.reporter_name} · {new Date(issue.created_at).toLocaleString('id-ID')}</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{issue.description}</p>
                  <p className="mt-2 text-xs text-slate-500">Penanggung jawab: {issue.assignee_name || 'Belum ditentukan'}</p>
                </div>
                <button type="button" onClick={() => setSelected(selected?.id === issue.id ? null : issue)} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  {selected?.id === issue.id ? 'Tutup rincian' : 'Rincian & tindak lanjut'} <ArrowUpRight size={16} />
                </button>
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
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" disabled={saving} onClick={() => setCreateOpen(false)} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold dark:border-slate-700">Batal</button><button disabled={saving} className="min-h-11 rounded-md bg-[#C81E1E] px-4 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan laporan'}</button></div>
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
      {canUpdate && (NEXT_STATUSES[issue.status] || []).length > 0 && <form onSubmit={submit} className="space-y-3 rounded-md bg-slate-50 p-3 dark:bg-slate-950"><h3 className="text-sm font-bold text-slate-900 dark:text-white">Catat tindak lanjut</h3><label className="block text-xs font-semibold">Status baru<select required value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="">Pilih status</option>{NEXT_STATUSES[issue.status].map((value) => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}</select></label><label className="block text-xs font-semibold">Catatan tindakan *<textarea required minLength={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label><button disabled={saving || !status} className="min-h-10 rounded-md bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900">{saving ? 'Menyimpan...' : 'Simpan tindak lanjut'}</button></form>}
      {!canUpdate && <p className="text-sm text-slate-600 dark:text-slate-300">Anda dapat memantau laporan ini. Perubahan status ditangani tim operasional.</p>}
    </div>
  );
}
