import { useState } from 'react';
import {
  ArrowUUpLeft,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileDoc,
  MapPin,
  WarningCircle,
  Wrench
} from '@phosphor-icons/react';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

export function InspectionHeaderSection({
  activeDetail,
  lastSavedAt,
  user,
  onDownloadDocx,
  onReopenInspection
}) {
  const inspection = activeDetail?.inspection || {};
  const isFinal = inspection.status === 'TERKIRIM';
  const isAdminKantor = ['ADMIN_KANTOR', 'ADMIN_SISTEM', 'PIMPINAN'].includes(user?.role);

  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionReasonInput, setRevisionReasonInput] = useState('');
  const [revisionSectionInput, setRevisionSectionInput] = useState('Checklist & Pengukuran');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const REVISION_SECTIONS = [
    'Data Umum & Identitas Alat',
    'Dokumentasi Foto Lapangan',
    'Temuan & Rekomendasi K3',
    'Data Teknis & Pengujian'
  ];

  const executeReopen = async (e) => {
    e.preventDefault();
    if (!revisionReasonInput.trim()) return;
    try {
      setSubmittingReopen(true);
      if (onReopenInspection) {
        await onReopenInspection(revisionReasonInput.trim(), revisionSectionInput);
      }
      setRevisionModalOpen(false);
      setRevisionReasonInput('');
    } finally {
      setSubmittingReopen(false);
    }
  };

  const revisions = activeDetail?.revisions || [];
  const latestRevision = revisions[0] || null;

  return (
    <div className="space-y-3.5">
      {/* CARD IDENTITAS UNIT & AKSI CEPAT BAP */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Sisi Kiri: Identitas Utama Alat */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench size={20} className="text-[#C81E1E]" weight="bold" />
                {inspection.equipment_type_name || inspection.object_name || 'Peralatan Riksa Uji'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                No. Seri: {inspection.serial_number || '-'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isFinal
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : inspection.lhpp_status === 'REVISION'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {isFinal
                  ? 'Selesai Lapangan & Terkirim'
                  : inspection.lhpp_status === 'REVISION'
                  ? 'Perlu Revisi Lapangan'
                  : 'Draf Pemeriksaan Lapangan'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>
                <strong className="text-slate-700 dark:text-slate-300">Klien:</strong> {inspection.client_name || '-'}
              </span>
              <span>•</span>
              <span>
                <strong className="text-slate-700 dark:text-slate-300">No. PO:</strong> {inspection.po_number || inspection.order_no || '-'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {inspection.install_location || inspection.location_name || '-'}
              </span>
            </div>
          </div>

          {/* Sisi Kanan: Aksi LHPP Word & Status Simpan */}
          <div className="flex flex-wrap items-center gap-2">
            {lastSavedAt && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 font-mono">
                <CheckCircle size={13} className="text-emerald-500" weight="fill" />
                Tersimpan:{' '}
                {lastSavedAt instanceof Date
                  ? lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : typeof lastSavedAt === 'string' && lastSavedAt.includes('T')
                  ? new Date(lastSavedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : String(lastSavedAt)}
              </span>
            )}
            {onDownloadDocx && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={FileDoc}
                onClick={onDownloadDocx}
                title="Unduh Blangko Berkas LHPP Resmi Microsoft Word (.docx) dengan tabel teknis lengkap"
              >
                Unduh Blangko Word (.docx)
              </Button>
            )}

            {isFinal && isAdminKantor && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={ArrowUUpLeft}
                onClick={() => setRevisionModalOpen(true)}
                className="text-amber-700 border-amber-300 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
              >
                Minta Revisi
              </Button>
            )}
          </div>
        </div>

        {/* Notifikasi Revisi jika ada permintaan revisi aktif */}
        {latestRevision && inspection.lhpp_status === 'REVISION' && (
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 flex items-start gap-3">
            <WarningCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" weight="bold" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-rose-900 dark:text-rose-200 block">
                Catatan Revisi dari {latestRevision.actor_name || 'Admin Kantor'} (#{latestRevision.revision_no || 1}):
              </span>
              <p className="text-rose-800 dark:text-rose-300">{latestRevision.reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL MINTA REVISI DARI ADMIN KANTOR */}
      <Modal
        open={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        title={`Minta Revisi: ${inspection.object_name} (${inspection.order_no})`}
        size="md"
      >
        <form onSubmit={executeReopen} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Bagian yang Perlu Direvisi
            </label>
            <select
              value={revisionSectionInput}
              onChange={(e) => setRevisionSectionInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            >
              {REVISION_SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Catatan Instruksi Revisi untuk Inspector *
            </label>
            <textarea
              required
              rows={3}
              value={revisionReasonInput}
              onChange={(e) => setRevisionReasonInput(e.target.value)}
              placeholder="Jelaskan secara spesifik apa yang harus diperbaiki atau dilengkapi..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRevisionModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submittingReopen} disabled={submittingReopen}>
              Kirim Instruksi Revisi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
