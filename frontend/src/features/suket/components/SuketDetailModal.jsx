import {
  ChatCircleText,
  DownloadSimple,
  UploadSimple,
  WarningOctagon
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import {
  FOLLOWUP_STATUS_LABELS,
  formatDateTime,
  SUKET_STATUS_LABELS
} from '../../../lib/utils/format.js';

export function SuketDetailModal({
  detailData,
  onClose,
  canManage,
  editForm,
  setEditForm,
  handleUpdateSuket,
  handleUploadScan,
  submitting,
  followupForm,
  setFollowupForm,
  handleAddFollowup
}) {
  if (!detailData?.suket) return null;

  return (
    <Modal
      open={Boolean(detailData?.suket)}
      onClose={onClose}
      title={`Detail Suket K3: ${detailData.suket.object_name} (${detailData.suket.client_name})`}
      size="xl"
    >
      <div className="space-y-6 text-sm">
        {canManage && (
          <form
            onSubmit={handleUpdateSuket}
            className="border border-slate-200 dark:border-slate-800 rounded-md p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/40"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <WarningOctagon size={16} />
              <span>Perbarui Status &amp; Masa Berlaku Suket K3</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Suket K3
                </label>
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Pengajuan
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {Object.entries(SUKET_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Berlaku Sampai
                </label>
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
                className="min-h-9 rounded bg-[#C81E1E] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#a11616] cursor-pointer"
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
                className="min-h-9 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-xs text-slate-800 dark:text-slate-100 cursor-pointer"
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
                className="min-h-9 rounded bg-slate-800 dark:bg-slate-700 px-3 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
              >
                Catat Follow-Up
              </button>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
