import { useState } from 'react';
import {
  ArrowRight,
  Building,
  CalendarCheck,
  CheckCircle,
  Cube,
  FilePdf,
  IdentificationBadge,
  MapPin,
  Phone,
  Play,
  WarningCircle,
  WhatsappLogo,
  X,
  XCircle
} from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { formatDateTime, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';
import { api } from '../../../lib/api/axios.js';

export function AssignmentDetailModal({
  isOpen,
  onClose,
  unit: u,
  onRespondAssignment,
  onOpenRejectModal,
  onOpenInspection,
  onPreviewPdf
}) {
  const [downloadingLetter, setDownloadingLetter] = useState(false);

  if (!isOpen || !u) return null;

  const isCompleted = [
    'LHPP_FINAL',
    'LHPP_TERBIT',
    'BAP_FINAL',
    'SIAP_DISTRIBUSI',
    'SEBAGIAN_DOKUMEN_DIKIRIM',
    'SELESAI'
  ].includes(u.unit_status);
  const isInProgress = ['SEDANG_DIPERIKSA', 'CHECKLIST_BELUM_LENGKAP'].includes(u.unit_status);
  const isReturned = u.lhpp_status === 'DIKEMBALIKAN';

  const contactPhone = u.contact_phone || u.client_phone;
  const waNumber = contactPhone ? contactPhone.replace(/\D/g, '').replace(/^0/, '62') : null;

  const handleDownloadLetter = async () => {
    try {
      setDownloadingLetter(true);
      const res = await api.get(`/orders/${u.order_id}/assignment-letter.pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Surat-Tugas-${(u.po_number || u.order_no || u.order_id).replace(/\//g, '-')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Gagal mengunduh berkas Surat Tugas. Pastikan Anda telah ditugaskan pada order ini.');
    } finally {
      setDownloadingLetter(false);
    }
  };

  const handlePreviewLetter = () => {
    if (onPreviewPdf) {
      onPreviewPdf(
        `/orders/${u.order_id}/assignment-letter.pdf`,
        `Surat Tugas - ${u.po_number || u.order_no}`,
        `Surat-Tugas-${(u.po_number || u.order_no || u.order_id).replace(/\//g, '-')}.pdf`
      );
    } else {
      handleDownloadLetter();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Detail Tugas &amp; Surat Tugas Riksa Uji"
      size="lg"
      fullScreenMobile={true}
    >
      <div className="space-y-5 text-xs text-slate-800 dark:text-slate-200">
        {/* Header Unit Info & Status */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#C81E1E] text-white font-extrabold text-[10px] tracking-wide uppercase">
                {u.category_code} &bull; {u.category_name || 'Riksa Uji K3'}
              </span>
              <span className="font-mono text-slate-500 dark:text-slate-400 font-bold">
                PO: {u.po_number || u.order_no}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {u.object_name}
            </h2>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Status Pelaksanaan</span>
            <StatusBadge status={u.unit_status} />
          </div>
        </div>

        {/* Catatan Revisi jika ada */}
        {isReturned && u.review_notes && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-extrabold text-xs">
              <WarningCircle size={16} weight="fill" className="text-rose-600 shrink-0" />
              <span>Catatan Revisi dari Admin Kantor / QC:</span>
            </div>
            <p className="text-xs leading-relaxed pl-5 font-medium">
              {u.review_notes}
            </p>
          </div>
        )}

        {/* Grid 2 Kolom: Detail Unit Alat & Perusahaan Klien */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Kolom 1: Spesifikasi Unit Objek Uji */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Cube size={16} weight="bold" className="text-[#C81E1E]" />
              <span>Data Objek Uji K3</span>
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Nomor Seri Pabrik (SN)</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {u.serial_number || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Kapasitas / SWL</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {u.capacity || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Pabrik Pembuat</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {u.manufacturer || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Tahun Pembuatan</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {u.manufacture_year || '-'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-slate-400">Model / Tipe</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {u.model_number || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Informasi Klien & Lokasi Pabrik */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Building size={16} weight="bold" className="text-[#C81E1E]" />
              <span>Perusahaan Klien &amp; Lokasi</span>
            </h3>

            <div className="space-y-2">
              <div className="py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Nama Perusahaan</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {u.client_name}
                </span>
              </div>
              <div className="py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Lokasi / Alamat Pemasangan</span>
                <div className="flex items-start gap-1.5 mt-0.5">
                  <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {u.location_name ? `${u.location_name} · ` : ''}
                    {u.location_address || u.install_location || u.client_address || 'Alamat operasional klien'}
                  </span>
                </div>
              </div>
              <div className="py-1">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kontak PIC Lapangan</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {u.contact_name || 'Petugas Lapangan'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {contactPhone && (
                      <a
                        href={`tel:${contactPhone}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors shadow-2xs"
                      >
                        <Phone size={13} weight="bold" />
                        <span>Telepon</span>
                      </a>
                    )}
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 transition-colors shadow-2xs border border-emerald-200 dark:border-emerald-800"
                      >
                        <WhatsappLogo size={14} weight="bold" />
                        <span>WA</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian Surat Tugas Resmi & Jadwal */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CalendarCheck size={18} weight="bold" className="text-[#C81E1E]" />
              <span className="font-bold text-slate-900 dark:text-white">
                Jadwal Pelaksanaan &amp; Surat Tugas
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Layanan: {SERVICE_TYPE_LABELS[u.service_type] || u.service_type || 'Riksa Uji Pertama'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Waktu Mulai</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {u.start_at ? formatDateTime(u.start_at) : 'Sesuai koordinasi lapangan'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Waktu Selesai</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {u.end_at ? formatDateTime(u.end_at) : 'Hari yang sama'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">
              Surat Tugas diterbitkan resmi oleh Kantor PT Upaya Riksa Daya untuk legitimasi di lapangan.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePreviewLetter}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <FilePdf size={15} weight="bold" className="text-[#C81E1E]" />
                <span>Pratinjau Surat Tugas</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadLetter}
                disabled={downloadingLetter}
                className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>{downloadingLetter ? 'Mengunduh...' : 'Unduh PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Modal: Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {u.assignment_status === 'MENUNGGU' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onRespondAssignment(u.order_id, u.assignment_id, 'DITERIMA');
                    onClose();
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>Terima Penugasan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRejectModal({
                      orderId: u.order_id,
                      assignmentId: u.assignment_id,
                      poNo: u.po_number || u.order_no,
                      isCancel: false
                    });
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition-colors cursor-pointer"
                >
                  <XCircle size={16} weight="bold" />
                  <span>Tolak</span>
                </button>
              </>
            ) : isCompleted ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenInspection) onOpenInspection(u);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Dokumen Hasil Riksa Uji</span>
                <ArrowRight size={15} weight="bold" />
              </button>
            ) : isInProgress ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenInspection) onOpenInspection(u);
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play size={15} weight="fill" />
                <span>Lanjutkan Lembar Pemeriksaan</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenInspection) onOpenInspection(u);
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C81E1E] hover:bg-[#a61717] text-white font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Play size={15} weight="fill" />
                <span>Mulai Pemeriksaan Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

