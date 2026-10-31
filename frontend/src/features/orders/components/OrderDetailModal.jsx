import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarPlus,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  FileCsv,
  UserCheck,
  Warning,
  XCircle
} from '@phosphor-icons/react';
import { Badge } from '../../../components/ui/Badge.jsx';
import { ErrorBanner } from '../../../components/feedback/StateViews.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import {
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  SERVICE_TYPE_LABELS
} from '../../../lib/utils/format.js';
import { STATUS_TONE, UNIT_STATUS_LABELS } from '../orderConstants.js';

export function OrderDetailModal({
  open,
  onClose,
  activeOrder,
  detailData,
  unitProgress,
  nextStatuses,
  canManage,
  user,
  inspectors,
  scheduleConflicts,
  scheduleForm,
  setScheduleForm,
  selectedInspectorIds,
  setSelectedInspectorIds,
  statusNote,
  setStatusNote,
  rejectReason,
  setRejectReason,
  submitting,
  error,
  setError,
  handleOpenCsvImport,
  handleDownloadBatchBapPdf,
  handleDownloadAssignmentPdf,
  handleDownloadUnitPdf,
  handleSaveSchedule,
  handleAssignInspectors,
  handleRespondAssignment,
  handleStatusChange,
  checkConflicts
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('UNITS');

  const totalUnits = unitProgress?.totalUnits || (detailData?.objects || []).length || 0;
  const completedUnits = unitProgress?.completed || 0;
  const progressPercent = totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0;

  const titleText = activeOrder
    ? activeOrder.po_number?.toUpperCase().startsWith('PO')
      ? `Detail ${activeOrder.po_number}`
      : `Detail PO ${activeOrder.po_number || activeOrder.order_no}`
    : 'Detail PO';

  const subtitleText = activeOrder
    ? `${activeOrder.client_name} · ${SERVICE_TYPE_LABELS[activeOrder.service_type] || activeOrder.service_type}`
    : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleText}
      subtitle={subtitleText}
      size="xl"
    >
      {activeOrder && (
        <div className="space-y-4 text-sm">
          {error && <ErrorBanner message={error} onRetry={() => setError('')} />}

          {/* Segmented Control Navigasi Tab Gaya Native Mobile */}
          {(canManage || user?.role === 'AHLI_K3' || (nextStatuses || []).length > 0) && (
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('UNITS')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'UNITS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Unit &amp; Dokumen
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SCHEDULE')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'SCHEDULE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Jadwal &amp; Tim K3
              </button>
              {(nextStatuses?.length > 0 || user?.role === 'AHLI_K3') && (
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    activeTab === 'STATUS'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Status PO
                </button>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: UNIT & DOKUMEN (Default & Ringkas Tanpa Slop)      */}
          {/* ======================================================== */}
          {activeTab === 'UNITS' && (
            <div className="space-y-4">
              {/* Kartu Hero Informasi PO */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 block">
                      Order: {activeOrder.order_no}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                      Tgl PO: {formatDate(activeOrder.po_date || activeOrder.requested_date)}
                    </span>
                  </div>
                  <Badge tone={STATUS_TONE[activeOrder.status] || 'neutral'}>
                    {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                  </Badge>
                </div>

                {/* Tombol Aksi Dokumen PO Tingkat Atas */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadAssignmentPdf(activeOrder.id, activeOrder.order_no)}
                    className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    <DownloadSimple size={14} />
                    <span>Surat Tugas</span>
                  </button>

                  {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCsvImport(activeOrder.id)}
                      className="min-h-9 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <FileCsv size={14} />
                      <span>Impor Unit CSV</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ringkasan Progres Bersih Bergaya Native (Tanpa 6 Kotak Nol) */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Progres Penyelesaian Unit
                  </span>
                  <span className="text-xs font-mono font-extrabold text-slate-900 dark:text-white">
                    {completedUnits} / {totalUnits} Selesai ({progressPercent}%)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercent === 100 ? 'bg-emerald-500' : 'bg-[#C81E1E]'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Pill Status Aktif (Hanya yang memiliki nilai > 0) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {unitProgress?.unscheduled > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                      {unitProgress.unscheduled} Belum Jadwal
                    </span>
                  )}
                  {unitProgress?.scheduled > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                      {unitProgress.scheduled} Terjadwal
                    </span>
                  )}
                  {unitProgress?.inspecting > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                      {unitProgress.inspecting} Sedang Uji
                    </span>
                  )}
                  {unitProgress?.waitingDocs > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                      {unitProgress.waitingDocs} Menunggu Dokumen
                    </span>
                  )}
                  {unitProgress?.completed > 0 && (
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold">
                      {unitProgress.completed} Selesai
                    </span>
                  )}
                </div>
              </div>

              {/* Daftar Unit Alat pada PO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ClipboardText size={16} className="text-[#C81E1E]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Daftar Unit Alat ({(detailData?.objects || []).length} Unit)
                    </h4>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {(detailData?.objects || []).map((obj) => (
                    <div
                      key={obj.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {obj.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400 font-bold text-[11px] border border-rose-200/60 dark:border-rose-900/40">
                              {obj.category_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            SN: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{obj.serial_number}</span> ·
                            Kapasitas: {obj.capacity || '-'}
                          </p>
                          {obj.install_location && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Lokasi: {obj.install_location}
                            </p>
                          )}
                        </div>
                        <Badge
                          tone={
                            ['LHPP_TERBIT', 'SELESAI'].includes(obj.unit_status)
                              ? 'success'
                              : obj.unit_status === 'PERLU_REVISI'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {UNIT_STATUS_LABELS[obj.unit_status] || obj.unit_status}
                        </Badge>
                      </div>

                      {/* Baris Dokumen Unduhan Bersih */}
                      {(obj.bap_id || obj.lhpp_id) && (
                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                          {obj.bap_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadUnitPdf(
                                  `/bap/${obj.bap_id}/pdf`,
                                  `${(obj.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer"
                            >
                              <DownloadSimple size={13} weight="bold" />
                              <span>Unduh BAP</span>
                            </button>
                          )}
                          {obj.lhpp_id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDownloadUnitPdf(
                                  `/lhpp/${obj.lhpp_id}/pdf`,
                                  `${(obj.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <DownloadSimple size={13} weight="bold" />
                              <span>Unduh LHPP</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: JADWAL & TIM K3                                   */}
          {/* ======================================================== */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-4">
              {canManage && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Formulir Pengaturan Jadwal */}
                  <form
                    onSubmit={handleSaveSchedule}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CalendarPlus size={16} />
                      <span>Atur Jadwal Pemeriksaan</span>
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Waktu Mulai *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.startAt}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, startAt: e.target.value }))
                        }
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Waktu Selesai *</label>
                      <input
                        type="datetime-local"
                        required
                        value={scheduleForm.endAt}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, endAt: e.target.value }))
                        }
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    {detailData?.schedule && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">
                          Alasan Penjadwalan Ulang (Wajib bila mengubah jadwal)
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.reason}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({ ...prev, reason: e.target.value }))
                          }
                          placeholder="Alasan perubahan jadwal..."
                          className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-800 dark:text-slate-200">Catatan Lokasi/Akses</label>
                      <input
                        type="text"
                        value={scheduleForm.notes}
                        onChange={(e) =>
                          setScheduleForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        placeholder="Instruksi APD atau gerbang pabrik..."
                        className="w-full min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full min-h-10 rounded-xl bg-slate-900 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                    >
                      Simpan Jadwal Inspeksi
                    </button>
                  </form>

                  {/* Formulir Penugasan Ahli K3 */}
                  <form
                    onSubmit={handleAssignInspectors}
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <UserCheck size={16} />
                      <span>Tugaskan Ahli K3 Sesuai Bidang</span>
                    </h4>

                    {scheduleConflicts.length > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                          <Warning size={15} weight="bold" />
                          <span>Peringatan Potensi Konflik Jadwal:</span>
                        </div>
                        {scheduleConflicts.map((c, i) => (
                          <p key={i}>
                            {c.inspector_name} telah terjadwal pada order <strong>{c.order_no}</strong> rentang {formatDateTime(c.start_at)} - {formatDateTime(c.end_at)}.
                          </p>
                        ))}
                      </div>
                    )}

                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                      {inspectors.map((insp) => {
                        const checked = selectedInspectorIds.includes(insp.id);
                        const validCodes = (insp.competencies || [])
                          .filter((c) => c.isValid)
                          .map((c) => c.categoryCode)
                          .join(', ');
                        return (
                          <label
                            key={insp.id}
                            className="flex items-start gap-2.5 p-2.5 text-xs cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? selectedInspectorIds.filter((id) => id !== insp.id)
                                  : [...selectedInspectorIds, insp.id];
                                setSelectedInspectorIds(next);
                                if (scheduleForm.startAt && scheduleForm.endAt) {
                                  checkConflicts(next, scheduleForm.startAt, scheduleForm.endAt, detailData?.order?.id);
                                }
                              }}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#C81E1E]"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{insp.fullName}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                SKP Aktif: {validCodes || 'Belum ada kompetensi aktif'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || selectedInspectorIds.length === 0}
                      className="w-full min-h-10 rounded-xl bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
                    >
                      Simpan Penugasan Ahli K3
                    </button>
                  </form>
                </div>
              )}
              {!canManage && (
                <div className="space-y-4">
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Jadwal Pemeriksaan
                    </h4>
                    {detailData?.schedule ? (
                      <>
                        <p className="text-xs text-slate-800 dark:text-slate-200">
                          {formatDateTime(detailData.schedule.start_at)} sampai {formatDateTime(detailData.schedule.end_at)}
                        </p>
                        {detailData.schedule.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-400">Catatan: {detailData.schedule.notes}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Jadwal rinci belum dicatat. Target PO: {formatDate(activeOrder.requested_date)}.
                      </p>
                    )}
                  </section>
                  <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Penugasan Ahli K3
                    </h4>
                    {(detailData?.assignments || []).length ? (
                      detailData.assignments.map((assignment) => (
                        <p key={assignment.id} className="text-xs text-slate-800 dark:text-slate-200">
                          {assignment.full_name} · {assignment.status}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-600 dark:text-slate-400">Belum ada Inspector yang ditugaskan.</p>
                    )}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-1">
                      {(detailData?.objects || []).map((object) => (
                        <p key={object.order_object_id} className="text-xs text-slate-700 dark:text-slate-300">
                          {object.name} · {object.unit_inspector_name || 'Belum ditugaskan'} · {object.proposed_date ? formatDate(object.proposed_date) : 'Belum dijadwalkan'}
                        </p>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STATUS PO & WORKFLOW                              */}
          {/* ======================================================== */}
          {activeTab === 'STATUS' && (
            <div className="space-y-4">
              {/* Konfirmasi Penugasan oleh Ahli K3 */}
              {user?.role === 'AHLI_K3' && (detailData?.assignments || []).length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Konfirmasi Penugasan Anda
                  </h4>
                  {(detailData?.assignments || [])
                    .filter((asg) => asg.inspector_id === user.id)
                    .map((asg) => (
                      <div key={asg.id} className="space-y-2">
                        <p className="text-xs text-slate-800 dark:text-slate-200">
                          Status Konfirmasi Saat Ini: <strong className="font-bold">{asg.status}</strong>
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRespondAssignment(asg.id, 'DITERIMA')}
                            className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            <CheckCircle size={15} />
                            <span>Terima Penugasan</span>
                          </button>
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Alasan jika menolak..."
                            className="min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleRespondAssignment(asg.id, 'DITOLAK')}
                            className="min-h-10 inline-flex items-center gap-1.5 rounded-xl bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                          >
                            <XCircle size={15} />
                            <span>Tolak Penugasan</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Transisi Status Order */}
              {canManage && nextStatuses?.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Perbarui Status Tahapan PO
                  </h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Catatan perubahan status (opsional)..."
                      className="flex-1 min-h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                    <div className="flex flex-wrap gap-2">
                      {nextStatuses.map((st) => (
                        <button
                          key={st}
                          type="button"
                          disabled={submitting}
                          onClick={() => handleStatusChange(st)}
                          className={`min-h-10 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer ${
                            st === 'DIBATALKAN'
                              ? 'bg-red-700 hover:bg-red-800'
                              : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600'
                          }`}
                        >
                          Ubah ke: {ORDER_STATUS_LABELS[st] || st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!canManage && (
                <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Riwayat Status PO
                  </h4>
                  {(detailData?.history || []).length ? (
                    detailData.history.map((entry) => (
                      <p key={entry.id} className="text-xs text-slate-700 dark:text-slate-300">
                        {formatDateTime(entry.created_at)} · {entry.from_status || 'Order dibuat'} → {ORDER_STATUS_LABELS[entry.to_status] || entry.to_status}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400">Belum ada riwayat perubahan status.</p>
                  )}
                </section>
              )}

              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Riwayat revisi PO</h4>
                {(detailData?.revisions || []).length ? (
                  <ol className="mt-3 space-y-3">
                    {detailData.revisions.map((revision) => (
                      <li key={revision.id} className="border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Versi {revision.version} · {revision.reason}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(revision.created_at)} · {revision.actor_name || 'Sistem'} · {(revision.snapshot?.units || []).length} unit pada snapshot</p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">Belum ada snapshot revisi untuk PO ini.</p>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
