import { useNavigate } from 'react-router';
import {
  CalendarPlus,
  CheckCircle,
  ClipboardText,
  DownloadSimple,
  FileCsv,
  FilePdf,
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        activeOrder
          ? `Detail PO ${activeOrder.po_number || activeOrder.order_no} (${activeOrder.client_name})`
          : 'Detail PO'
      }
      size="xl"
    >
      {activeOrder && (
        <div className="space-y-6 text-sm">
          {error && <ErrorBanner message={error} onRetry={() => setError('')} />}
          {/* Header Status & Tombol Dokumen PO */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-md border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nomor Order: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{activeOrder.order_no}</span> ·
                Tanggal PO: {formatDate(activeOrder.po_date || activeOrder.requested_date)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone={STATUS_TONE[activeOrder.status] || 'neutral'}>
                  {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                </Badge>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {SERVICE_TYPE_LABELS[activeOrder.service_type]}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage && activeOrder.status !== 'SELESAI' && activeOrder.status !== 'DIBATALKAN' && (
                <button
                  type="button"
                  onClick={() => handleOpenCsvImport(activeOrder.id)}
                  className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-slate-200 dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700"
                >
                  <FileCsv size={16} weight="bold" />
                  <span>Tambah Unit via CSV</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  handleDownloadBatchBapPdf(
                    activeOrder.id,
                    activeOrder.po_number || activeOrder.order_no
                  )
                }
                className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-red-800"
              >
                <FilePdf size={16} weight="bold" />
                <span>Cetak Gabungan BAP 1 PO</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadAssignmentPdf(activeOrder.id, activeOrder.order_no)}
                className="min-h-10 inline-flex items-center gap-1.5 rounded-md bg-slate-800 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                <DownloadSimple size={16} />
                <span>Unduh Surat Tugas (PDF)</span>
              </button>
            </div>
          </div>

          {/* Bagian 4.4: Ringkasan Progres Unit dalam PO dari Database Nyata */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Ringkasan Progres Unit Alat dalam PO Ini
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Unit</div>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {unitProgress.totalUnits}
                </div>
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Belum Dijadwalkan</div>
                <div className="text-lg font-extrabold text-slate-700 dark:text-slate-300">
                  {unitProgress.unscheduled}
                </div>
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sudah Dijadwalkan</div>
                <div className="text-lg font-extrabold text-blue-700 dark:text-blue-400">
                  {unitProgress.scheduled}
                </div>
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Sedang Diperiksa</div>
                <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                  {unitProgress.inspecting}
                </div>
              </div>
              <div className="p-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Menunggu BAP/LHPP</div>
                <div className="text-lg font-extrabold text-purple-700 dark:text-purple-400">
                  {unitProgress.waitingDocs}
                </div>
              </div>
              <div className="p-3 rounded-md border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30">
                <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">Selesai</div>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                  {unitProgress.completed}
                </div>
              </div>
            </div>
            {!unitProgress.canCompletePo && activeOrder.status !== 'SELESAI' && (
              <p className="mt-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded px-3 py-1.5 font-medium">
                PO ini belum dapat ditandai SELESAI sebelum seluruh unit aktif di bawah menyelesaikan tahapan BAP dan penerbitan LHPP.
              </p>
            )}
          </div>

          {/* Daftar Unit Alat dalam PO beserta Status Masing-Masing Unit */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <ClipboardText size={16} />
              <span>Daftar Unit Alat pada PO ({(detailData?.objects || []).length} Unit)</span>
            </h4>
            <div className="border border-slate-200 dark:border-slate-700 rounded-md divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {(detailData?.objects || []).map((obj) => (
                <div
                  key={obj.id}
                  className="px-3.5 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{obj.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-300">
                        {obj.category_code}
                      </span>
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
                    <div className="text-slate-500 dark:text-slate-400">
                      SN: <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{obj.serial_number}</span> ·
                      Kapasitas: {obj.capacity || '-'} · Lokasi: {obj.install_location || '-'}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {obj.bap_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate('/app/bap');
                          }}
                          className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/40 text-[#C81E1E] dark:text-red-400 font-mono font-bold hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer"
                        >
                          BAP: {obj.bap_no} ({obj.bap_status})
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadUnitPdf(
                              `/bap/${obj.bap_id}/pdf`,
                              `${(obj.bap_no || 'BAP').replace(/\//g, '-')}.pdf`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#C81E1E] text-white font-bold hover:bg-[#991B1B] cursor-pointer"
                        >
                          <DownloadSimple size={13} weight="bold" />
                          <span>Unduh BAP</span>
                        </button>
                      </>
                    )}
                    {obj.lhpp_id && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate('/app/lhpp');
                          }}
                          className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-mono font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                        >
                          LHPP: {obj.lhpp_no || obj.lhpp_status}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadUnitPdf(
                              `/lhpp/${obj.lhpp_id}/pdf`,
                              `${(obj.lhpp_no || 'LHPP').replace(/\//g, '-')}.pdf`
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 dark:bg-slate-700 text-white font-bold hover:bg-slate-900 dark:hover:bg-slate-600 cursor-pointer"
                        >
                          <DownloadSimple size={13} weight="bold" />
                          <span>Unduh LHPP</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Penjadwalan & Penugasan untuk Admin */}
          {canManage && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <form
                onSubmit={handleSaveSchedule}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md p-4 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
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
                    className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                    className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                      className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                    className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-10 rounded bg-slate-900 dark:bg-slate-700 px-3 py-2 text-xs font-bold text-white hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
                >
                  Simpan Jadwal Inspeksi
                </button>
              </form>

              <form
                onSubmit={handleAssignInspectors}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md p-4 space-y-3"
              >
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <UserCheck size={16} />
                  <span>Tugaskan Ahli K3 Sesuai Bidang</span>
                </h4>

                {scheduleConflicts.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 rounded-md text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300">
                      <Warning size={15} weight="bold" />
                      <span>Peringatan Potensi Konflik Jadwal:</span>
                    </div>
                    {scheduleConflicts.map((c, i) => (
                      <p key={i}>
                        {c.inspector_name} telah terjadwal pada order <strong>{c.order_no}</strong> ({c.client_name}) rentang {formatDateTime(c.start_at)} - {formatDateTime(c.end_at)}.
                      </p>
                    ))}
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
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
                  className="w-full min-h-10 rounded bg-[#C81E1E] px-3 py-2 text-xs font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer"
                >
                  Simpan Penugasan Ahli K3
                </button>
              </form>
            </div>
          )}

          {/* Konfirmasi Penugasan oleh Ahli K3 */}
          {user?.role === 'AHLI_K3' && (detailData?.assignments || []).length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Konfirmasi Penugasan Anda
              </h4>
              {(detailData?.assignments || [])
                .filter((asg) => asg.inspector_id === user.id)
                .map((asg) => (
                  <div key={asg.id} className="space-y-2">
                    <p className="text-xs text-slate-800 dark:text-slate-200">
                      Status Konfirmasi Saat Ini:{' '}
                      <strong className="font-bold">{asg.status}</strong>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRespondAssignment(asg.id, 'DITERIMA')}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                      >
                        <CheckCircle size={15} />
                        <span>Terima Penugasan</span>
                      </button>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Isi alasan jika menolak..."
                        className="min-h-10 rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleRespondAssignment(asg.id, 'DITOLAK')}
                        className="min-h-10 inline-flex items-center gap-1.5 rounded bg-red-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
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
          {nextStatuses.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 space-y-3 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Perbarui Status Tahapan PO
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Catatan perubahan status (opsional)..."
                  className="flex-1 min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                />
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleStatusChange(st)}
                      className={`min-h-10 rounded px-3 py-1.5 text-xs font-bold text-white cursor-pointer ${
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
        </div>
      )}
    </Modal>
  );
}
