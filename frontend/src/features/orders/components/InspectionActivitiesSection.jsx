import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarPlus,
  CheckCircle,
  ClipboardText,
  FileText,
  Pencil,
  Plus,
  UserCheck,
  Warning,
  X
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useToast } from '../../../components/ui/FeedbackProvider.jsx';
import { formatDate, formatDateTime } from '../../../lib/utils/format.js';
import { ACTIVITY_STATUS_LABELS, SCHEDULE_STATUS_LABELS } from '../orderConstants.js';

function toLocalInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const SCHEDULE_TONE = {
  BELUM_DIUSULKAN: 'neutral',
  DIUSULKAN: 'warning',
  DISETUJUI: 'success',
  DITOLAK: 'danger'
};

export function InspectionActivitiesSection({
  order,
  units = [],
  activities = [],
  inspectors = [],
  user,
  onReload
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const canManage = ['ADMIN_SISTEM', 'MARKETING', 'ADMIN_KANTOR'].includes(user?.role);
  const canAssign = ['ADMIN_SISTEM', 'ADMIN_KANTOR'].includes(user?.role);
  const isManager = user?.role === 'PIMPINAN';
  const isInspector = ['AHLI_K3', 'INSPECTOR'].includes(user?.role);

  const [types, setTypes] = useState([]);
  const [typesLoaded, setTypesLoaded] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    objectId: '',
    inspectionTypeCode: 'BERKALA',
    plannedStartAt: '',
    plannedEndAt: '',
    notes: ''
  });
  const [scheduleEditor, setScheduleEditor] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ startAt: '', endAt: '', reason: '' });
  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [assigning, setAssigning] = useState(null);
  const [assignInspectorId, setAssignInspectorId] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const loadTypes = async () => {
    if (typesLoaded) return;
    try {
      const res = await api.get('/equipment-types/inspection-types');
      setTypes(res.data?.items || []);
      setTypesLoaded(true);
    } catch {
      setTypes([]);
    }
  };

  const visibleActivities = useMemo(() => {
    if (!isInspector) return activities;
    return activities.filter((a) => !a.inspector_id || a.inspector_id === user?.id);
  }, [activities, isInspector, user?.id]);

  const run = async (key, fn, message) => {
    setBusy(key);
    setError('');
    try {
      await fn();
      toast(message, 'success');
      await onReload?.();
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Tindakan gagal diproses.');
      return false;
    } finally {
      setBusy('');
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!form.objectId) {
      setError('Pilih unit alat terlebih dahulu.');
      return;
    }
    const ok = await run(
      'create',
      () =>
        api.post(`/orders/${order.id}/activities`, {
          objectId: form.objectId,
          inspectionTypeCode: form.inspectionTypeCode,
          plannedStartAt: form.plannedStartAt || null,
          plannedEndAt: form.plannedEndAt || null,
          notes: form.notes || null
        }),
      'Aktivitas pemeriksaan berhasil ditambahkan.'
    );
    if (ok) {
      setAdding(false);
      setForm({ objectId: '', inspectionTypeCode: 'BERKALA', plannedStartAt: '', plannedEndAt: '', notes: '' });
    }
  };

  const openScheduleEditor = (activity) => {
    setScheduleEditor(activity.id);
    setScheduleForm({
      startAt: toLocalInput(activity.planned_start_at),
      endAt: toLocalInput(activity.planned_end_at),
      reason: ''
    });
    setError('');
  };

  const submitSchedule = async (activityId) => {
    const ok = await run(
      `schedule-${activityId}`,
      () =>
        api.patch(`/orders/${order.id}/activities/${activityId}/schedule`, {
          startAt: new Date(scheduleForm.startAt).toISOString(),
          endAt: new Date(scheduleForm.endAt).toISOString(),
          reason: scheduleForm.reason || null
        }),
      'Jadwal aktivitas diajukan untuk persetujuan Manager.'
    );
    if (ok) setScheduleEditor(null);
  };

  const decide = (activityId, decision) =>
    run(
      `approve-${activityId}`,
      () =>
        api.post(`/orders/${order.id}/activities/${activityId}/approval`, {
          decision,
          reason: decision === 'DITOLAK' ? rejectReason.trim() : null
        }),
      decision === 'DISETUJUI' ? 'Jadwal disetujui.' : 'Jadwal ditolak dan dikembalikan.'
    ).then((ok) => {
      if (ok) {
        setRejecting(null);
        setRejectReason('');
      }
    });

  const assignInspector = async (activityId) => {
    if (!assignInspectorId) {
      setError('Pilih Ahli K3 yang akan ditugaskan.');
      return;
    }
    const ok = await run(
      `assign-${activityId}`,
      () => api.post(`/orders/${order.id}/activities/${activityId}/assign`, { inspectorId: assignInspectorId }),
      'Ahli K3 berhasil ditugaskan pada aktivitas ini.'
    );
    if (ok) {
      setAssigning(null);
      setAssignInspectorId('');
    }
  };

  const startInspection = (activityId) =>
    run(
      `start-${activityId}`,
      async () => {
        const res = await api.post('/inspections/start', { activityId });
        navigate(`/app/inspections?inspectionId=${res.data?.inspection?.id || ''}`);
      },
      'Pemeriksaan lapangan dimulai.'
    );

  const prepareBap = (activityId) =>
    run(
      `bap-${activityId}`,
      async () => {
        const res = await api.post('/bap/prepare', { orderId: order.id, activityId });
        navigate(`/app/bap?bapId=${res.data?.bap?.id || ''}`);
      },
      'Draf BAP disiapkan. Lanjutkan tanda tangan PIC pada halaman BAP.'
    );

  const cancelActivity = async (activityId) => {
    if (cancelReason.trim().length < 5) {
      setError('Alasan pembatalan minimal 5 karakter.');
      return;
    }
    const ok = await run(
      `cancel-${activityId}`,
      () => api.post(`/orders/${order.id}/activities/${activityId}/cancel`, { reason: cancelReason.trim() }),
      'Aktivitas pemeriksaan dibatalkan.'
    );
    if (ok) {
      setCancelling(null);
      setCancelReason('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <ClipboardText size={16} className="text-[#C81E1E]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Aktivitas Pemeriksaan ({visibleActivities.length})
          </h4>
        </div>
        {canManage && order.status !== 'SELESAI' && order.status !== 'DIBATALKAN' && (
          <button
            type="button"
            onClick={() => {
              setAdding((v) => !v);
              setError('');
              loadTypes();
            }}
            className="h-9 px-3 inline-flex items-center gap-1.5 rounded-xl bg-[#C81E1E] text-white text-xs font-bold hover:bg-[#a11616] cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>{adding ? 'Tutup' : 'Tambah Aktivitas'}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
          {error}
        </div>
      )}

      {adding && canManage && (
        <form
          onSubmit={handleAddActivity}
          className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 space-y-3 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Unit Alat *</label>
              <select
                required
                value={form.objectId}
                onChange={(e) => setForm({ ...form, objectId: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs cursor-pointer"
              >
                <option value="">Pilih unit alat…</option>
                {units
                  .filter((u) => u.unit_status !== 'DIBATALKAN')
                  .map((u) => (
                    <option key={u.object_id || u.id} value={u.object_id || u.id}>
                      {u.name} · {u.serial_number}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Jenis Pemeriksaan *</label>
              <select
                required
                value={form.inspectionTypeCode}
                onChange={(e) => setForm({ ...form, inspectionTypeCode: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs cursor-pointer"
              >
                {(types.length ? types : [{ code: 'BERKALA', name: 'Pemeriksaan Berkala' }]).map((t) => (
                  <option key={t.code} value={t.code}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Jadwal Mulai</label>
              <input
                type="datetime-local"
                value={form.plannedStartAt}
                onChange={(e) => setForm({ ...form, plannedStartAt: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Jadwal Selesai</label>
              <input
                type="datetime-local"
                value={form.plannedEndAt}
                onChange={(e) => setForm({ ...form, plannedEndAt: e.target.value })}
                className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Jadwal harus berada dalam masa berlaku PO ({formatDate(order.valid_from)} – {formatDate(order.valid_until)}) dan
              menunggu persetujuan Manager.
            </p>
            <button
              type="submit"
              disabled={busy === 'create'}
              className="h-9 px-4 rounded-xl bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
            >
              {busy === 'create' ? 'Menyimpan…' : 'Simpan Aktivitas'}
            </button>
          </div>
        </form>
      )}

      {visibleActivities.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 py-3">
          Belum ada aktivitas pemeriksaan. Tambahkan aktivitas untuk menentukan jenis pemeriksaan dan jadwalnya.
        </p>
      ) : (
        <div className="space-y-2.5">
          {visibleActivities.map((activity) => {
            const activityId = activity.id;
            const scheduleApproved = activity.schedule_status === 'DISETUJUI';
            const closed = ['SELESAI', 'DIBATALKAN'].includes(activity.status);
            return (
              <div
                key={activityId}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{activity.object_name}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400 font-bold text-[11px] border border-rose-200/60 dark:border-rose-900/40">
                        {activity.inspection_type_name}
                      </span>
                      <Badge tone={SCHEDULE_TONE[activity.schedule_status] || 'neutral'}>
                        {SCHEDULE_STATUS_LABELS[activity.schedule_status] || activity.schedule_status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      SN: <span className="font-mono font-semibold">{activity.serial_number || '-'}</span> ·{' '}
                      {activity.category_name}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {activity.planned_start_at
                        ? `${formatDateTime(activity.planned_start_at)} – ${formatDateTime(activity.planned_end_at)}`
                        : 'Belum dijadwalkan'}
                      {' · '}Ahli K3: {activity.inspector_name || 'Belum ditugaskan'}
                    </p>
                    {activity.rejection_reason && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        Alasan penolakan Manager: {activity.rejection_reason}
                      </p>
                    )}
                    {activity.lhpp_status === 'DIKEMBALIKAN' && activity.lhpp_review_notes && (
                      <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">
                        Catatan revisi Admin Kantor: {activity.lhpp_review_notes}
                      </p>
                    )}
                  </div>
                  <Badge
                    tone={
                      activity.status === 'SELESAI'
                        ? 'success'
                        : activity.status === 'DIBATALKAN'
                        ? 'danger'
                        : activity.status === 'SEDANG_DIPERIKSA'
                        ? 'warning'
                        : 'info'
                    }
                  >
                    {ACTIVITY_STATUS_LABELS[activity.status] || activity.status}
                  </Badge>
                </div>

                {(activity.inspection_status || activity.bap_id || activity.lhpp_id) && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pemeriksaan: {activity.inspection_status || 'Belum dimulai'} · BAP: {activity.bap_status || 'Belum disiapkan'} · LHPP:{' '}
                    {activity.lhpp_status || 'Belum disusun'}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                  {canManage && !closed && scheduleApproved === false && (
                    <button
                      type="button"
                      onClick={() => (scheduleEditor === activityId ? setScheduleEditor(null) : openScheduleEditor(activity))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <CalendarPlus size={13} />
                      <span>{activity.planned_start_at ? 'Ubah Jadwal' : 'Atur Jadwal'}</span>
                    </button>
                  )}

                  {isManager && activity.schedule_status === 'DIUSULKAN' && (
                    <>
                      <button
                        type="button"
                        disabled={busy === `approve-${activityId}`}
                        onClick={() => decide(activityId, 'DISETUJUI')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle size={13} />
                        <span>Setujui Jadwal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(rejecting === activityId ? null : activityId);
                          setRejectReason('');
                          setError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                      >
                        <X size={13} />
                        <span>Tolak</span>
                      </button>
                    </>
                  )}

                  {canAssign && scheduleApproved && !closed && (
                    <button
                      type="button"
                      onClick={() => {
                        setAssigning(assigning === activityId ? null : activityId);
                        setAssignInspectorId(activity.inspector_id || '');
                        setError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-300 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 cursor-pointer"
                    >
                      <UserCheck size={13} />
                      <span>{activity.inspector_id ? 'Ganti Ahli K3' : 'Tugaskan Ahli K3'}</span>
                    </button>
                  )}

                  {isInspector && !closed && scheduleApproved && (!activity.inspection_status || activity.inspection_status === 'DRAF') && (
                    <button
                      type="button"
                      disabled={busy === `start-${activityId}`}
                      onClick={() => startInspection(activityId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 cursor-pointer disabled:opacity-50"
                    >
                      <ClipboardText size={13} />
                      <span>Mulai Pemeriksaan</span>
                    </button>
                  )}

                  {isInspector && !closed && (
                    <button
                      type="button"
                      disabled={busy === `bap-${activityId}`}
                      onClick={() => prepareBap(activityId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-amber-300 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 cursor-pointer disabled:opacity-50"
                    >
                      <FileText size={13} />
                      <span>{activity.bap_id ? 'Buka BAP' : 'Proses BAP'}</span>
                    </button>
                  )}

                  {canManage && !closed && activity.status !== 'SEDANG_DIPERIKSA' && (
                    <button
                      type="button"
                      onClick={() => {
                        setCancelling(cancelling === activityId ? null : activityId);
                        setCancelReason('');
                        setError('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>Batalkan Aktivitas</span>
                    </button>
                  )}
                </div>

                {rejecting === activityId && isManager && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
                    <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300">
                      Alasan penolakan jadwal (wajib, terlihat oleh Marketing/Admin Kantor)
                    </label>
                    <textarea
                      rows={2}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                      placeholder="Contoh: jadwal bentrok dengan agenda inspeksi lain / unit belum siap"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejecting(null)}
                        className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={busy === `approve-${activityId}` || rejectReason.trim().length < 5}
                        onClick={() => decide(activityId, 'DITOLAK')}
                        className="h-8 px-3 rounded-lg bg-rose-700 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                      >
                        Kirim Penolakan
                      </button>
                    </div>
                  </div>
                )}

                {scheduleEditor === activityId && canManage && (
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">Mulai *</label>
                        <input
                          type="datetime-local"
                          value={scheduleForm.startAt}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, startAt: e.target.value })}
                          className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1">Selesai *</label>
                        <input
                          type="datetime-local"
                          value={scheduleForm.endAt}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, endAt: e.target.value })}
                          className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">
                        Alasan perubahan jadwal {activity.planned_start_at ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        value={scheduleForm.reason}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, reason: e.target.value })}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                        placeholder="Contoh: permintaan perubahan jadwal dari PIC klien"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setScheduleEditor(null)}
                        className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={busy === `schedule-${activityId}` || !scheduleForm.startAt || !scheduleForm.endAt}
                        onClick={() => submitSchedule(activityId)}
                        className="h-8 px-3 rounded-lg bg-[#C81E1E] text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
                      >
                        Ajukan Jadwal
                      </button>
                    </div>
                    {activity.planned_start_at && (
                      <p className="text-[11px] text-slate-500">
                        <Warning size={12} className="inline mr-1" />
                        Jadwal sebelumnya akan tersimpan pada riwayat aktivitas.
                      </p>
                    )}
                  </div>
                )}

                {assigning === activityId && canAssign && (
                  <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[220px]">
                      <label className="block text-[11px] font-semibold mb-1">Ahli K3 / Inspector</label>
                      <select
                        value={assignInspectorId}
                        onChange={(e) => setAssignInspectorId(e.target.value)}
                        className="w-full h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs cursor-pointer"
                      >
                        <option value="">Pilih Ahli K3…</option>
                        {inspectors.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={busy === `assign-${activityId}`}
                      onClick={() => assignInspector(activityId)}
                      className="h-9 px-3 rounded-xl bg-blue-700 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
                    >
                      Simpan Penugasan
                    </button>
                  </div>
                )}

                {cancelling === activityId && canManage && (
                  <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 space-y-2">
                    <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300">Alasan pembatalan aktivitas</label>
                    <textarea
                      rows={2}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-800 px-3 py-2 text-xs"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCancelling(null)}
                        className="h-8 px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={busy === `cancel-${activityId}`}
                        onClick={() => cancelActivity(activityId)}
                        className="h-8 px-3 rounded-lg bg-rose-700 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-50 cursor-pointer"
                      >
                        Batalkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
