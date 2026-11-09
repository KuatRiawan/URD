import { ArrowsClockwise, FilePdf, UploadSimple } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
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
  handleUploadAttachment,
  onCreateRenewal
}) {
  if (!detailData) return null;

  const obj = detailData.object;
  const history = detailData.history || [];
  const attachments = detailData.attachments || [];

  return (
    <Modal
      open={Boolean(detailData)}
      onClose={onClose}
      title={`[${obj.category_code}] ${obj.name}`}
      subtitle={`Nomor Seri: ${obj.serial_number} · ${obj.client_name}`}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {/* Banner Aksi Cepat Perpanjangan */}
        {canEdit && onCreateRenewal && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Perpanjangan Riksa Uji Unit
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Buat draft Purchase Order baru untuk jadwal pemeriksaan berkala unit alat ini.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={ArrowsClockwise}
              onClick={() => {
                onClose();
                onCreateRenewal(obj.id, obj.name);
              }}
            >
              Buat PO Perpanjangan
            </Button>
          </div>
        )}

        {/* Klasifikasi Alat K3 (3 Level: Bidang -> Jenis Alat -> Nama Alat) */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Klasifikasi K3:</span>
          <Badge tone="danger">{obj.domain_name || obj.domain_code || obj.category_name}</Badge>
          {(obj.equipment_type_name || obj.equipment_group_name) && (
            <>
              <span className="text-slate-400">›</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {obj.equipment_type_name || obj.equipment_group_name}
              </span>
            </>
          )}
          {obj.equipment_name && (
            <>
              <span className="text-slate-400">›</span>
              <span className="font-bold text-[#C81E1E] dark:text-red-400">{obj.equipment_name}</span>
            </>
          )}
        </div>

        {/* Spesifikasi Objek Alat */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 p-3.5 border border-slate-200 dark:border-slate-800">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Perusahaan Klien</p>
            <p className="font-bold text-slate-900 dark:text-white truncate">{obj.client_name}</p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Merek / Model</p>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {obj.brand || '-'} {obj.model ? `/ ${obj.model}` : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Kapasitas / Tahun</p>
            <p className="font-bold text-slate-900 dark:text-white truncate">
              {obj.capacity || '-'} {obj.manufacture_year ? `(${obj.manufacture_year})` : ''}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">Suket Sebelumnya</p>
            <p className="font-mono font-bold text-slate-900 dark:text-white truncate">
              {obj.previous_permit_no || '-'}
            </p>
          </div>
        </div>

        {/* Garis Waktu Riwayat Pemeriksaan */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Garis Waktu Riwayat Pemeriksaan ({history.length})
            </h3>
          </div>
          {!history.length ? (
            <p className="text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
              Objek ini belum memiliki riwayat pemeriksaan tercatat.
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((h) => {
                const isPassed = h.conclusion === 'MEMENUHI_SYARAT';
                const isFailed = h.conclusion === 'TIDAK_MEMENUHI_SYARAT';

                return (
                  <div
                    key={h.inspection_id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2 shadow-2xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Order: {h.order_no}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {formatDate(h.inspected_at)}
                        </span>
                      </div>
                      <Badge
                        tone={isPassed ? 'success' : isFailed ? 'danger' : 'warning'}
                      >
                        {CONCLUSION_LABELS[h.conclusion] || h.conclusion || h.inspection_status}
                      </Badge>
                    </div>

                    <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                      <p>
                        Ahli K3 Pemeriksa:{' '}
                        <strong className="text-slate-900 dark:text-white">
                          {h.inspector_name || 'Belum ditugaskan'}
                        </strong>
                      </p>
                      <p>
                        Nomor LHPP:{' '}
                        <strong className="font-mono text-slate-900 dark:text-white">
                          {h.lhpp_no || 'Draf'}
                        </strong>{' '}
                        ({LHPP_STATUS_LABELS[h.lhpp_status] || 'Belum diajukan'})
                        {h.suket_no && (
                          <>
                            {' '}· Suket K3:{' '}
                            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                              {h.suket_no}
                            </strong>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lampiran Dokumen Objek */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Lampiran Dokumen Teknis ({attachments.length})
            </h3>
            {canEdit && (
              <label
                htmlFor="obj-file-upload"
                className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs"
              >
                <UploadSimple size={14} aria-hidden="true" />
                <span>{uploadingFile ? 'Mengunggah...' : 'Unggah Berkas'}</span>
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
          {!attachments.length ? (
            <p className="text-slate-500 dark:text-slate-400 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 text-center">
              Belum ada manual teknis atau dokumen lampiran.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              {attachments.map((att) => (
                <li key={att.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FilePdf size={16} className="text-[#C81E1E] shrink-0" />
                    <span className="font-medium text-slate-900 dark:text-white truncate">
                      {att.original_name}
                    </span>
                  </div>
                  <a
                    href={`/api/v1/dashboard/files/${att.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#C81E1E] hover:underline shrink-0 ml-3"
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
