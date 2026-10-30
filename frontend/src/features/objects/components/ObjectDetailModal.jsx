import { UploadSimple } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import {
  CONCLUSION_LABELS,
  formatDate,
  LHPP_STATUS_LABELS
} from '../../../lib/utils/format.js';

export function ObjectDetailModal({
  detailData,
  onClose,
  canEdit,
  uploadingFile,
  handleUploadAttachment
}) {
  if (!detailData) return null;

  return (
    <Modal
      open={Boolean(detailData)}
      onClose={onClose}
      title={`[${detailData.object.category_code}] ${detailData.object.name} (S/N: ${detailData.object.serial_number})`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md bg-slate-50 dark:bg-slate-800/40 p-3.5 border border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-slate-500 dark:text-slate-400">Perusahaan Klien</p>
            <p className="font-bold text-slate-900 dark:text-white">{detailData.object.client_name}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Merek / Tipe</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {detailData.object.brand || '-'} / {detailData.object.model || '-'}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Kapasitas / Tahun</p>
            <p className="font-bold text-slate-900 dark:text-white">
              {detailData.object.capacity || '-'} ({detailData.object.manufacture_year || '-'})
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400">Suket Sebelumnya</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white">
              {detailData.object.previous_permit_no || '-'}
            </p>
          </div>
        </div>

        {/* Garis Waktu Riwayat Pemeriksaan */}
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
            Garis Waktu Riwayat Pemeriksaan ({detailData.history.length})
          </h3>
          {!detailData.history.length ? (
            <p className="text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 p-4">
              Objek ini belum memiliki riwayat pemeriksaan tercatat.
            </p>
          ) : (
            <ol className="space-y-2.5 border-l-2 border-[#C81E1E] pl-4 ml-2">
              {detailData.history.map((h) => (
                <li
                  key={h.inspection_id}
                  className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      Order {h.order_no} · {formatDate(h.inspected_at)}
                    </span>
                    <StatusBadge
                      status={h.conclusion || h.inspection_status}
                      label={CONCLUSION_LABELS[h.conclusion] || h.inspection_status}
                    />
                  </div>
                  <p className="mt-1 text-slate-500 dark:text-slate-400">
                    Ahli K3 Pemeriksa: <strong className="text-slate-900 dark:text-white">{h.inspector_name}</strong>
                  </p>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                    Nomor LHPP:{' '}
                    <strong className="font-mono text-slate-900 dark:text-white">{h.lhpp_no || 'Draf'}</strong> (
                    {LHPP_STATUS_LABELS[h.lhpp_status] || 'Belum diajukan'}) · Suket K3:{' '}
                    <strong className="font-mono text-slate-900 dark:text-white">{h.suket_no || '-'}</strong>
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Lampiran Dokumen Objek */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Lampiran Dokumen Teknis ({detailData.attachments.length})
            </h3>
            {canEdit && (
              <label
                htmlFor="obj-file-upload"
                className="min-h-9 px-3 py-1.5 rounded bg-slate-900 dark:bg-slate-700 text-white font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-800 dark:hover:bg-slate-600 cursor-pointer"
              >
                <UploadSimple size={14} aria-hidden="true" />
                <span>{uploadingFile ? 'Mengunggah...' : 'Unggah Berkas (PDF/Gambar)'}</span>
                <input
                  id="obj-file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleUploadAttachment}
                  className="sr-only"
                />
              </label>
            )}
          </div>
          {!detailData.attachments.length ? (
            <p className="text-slate-500 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700 p-3">
              Belum ada manual teknis atau dokumen lampiran.
            </p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded">
              {detailData.attachments.map((att) => (
                <li key={att.id} className="p-2.5 flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-white">{att.original_name}</span>
                  <a
                    href={`/api/v1/dashboard/files/${att.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#C81E1E] hover:underline"
                  >
                    Buka / Unduh
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

