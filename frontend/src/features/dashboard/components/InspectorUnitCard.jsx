import { useState } from 'react';
import {
  ArrowRight,
  Building,
  CheckCircle,
  Clock,
  Eye,
  FilePdf,
  Info,
  MapPin,
  Phone,
  Play,
  WarningCircle,
  WhatsappLogo,
  XCircle
} from '@phosphor-icons/react';
import { api } from '../../../lib/api/axios.js';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { formatDate, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function InspectorUnitCard({
  unit: u,
  onRespondAssignment,
  onOpenRejectModal,
  onOpenInspection,
  onOpenDetailModal
}) {
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
  const [downloadingLetter, setDownloadingLetter] = useState(false);

  const handleDownloadLetter = async (e) => {
    e.stopPropagation();
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

  const getCategoryBadgeClass = (code) => {
    switch (code) {
      case 'PAA':
        return 'bg-rose-50 dark:bg-rose-950/50 text-[#C81E1E] dark:text-rose-400 border-rose-200 dark:border-rose-900/60';
      case 'PUBT':
        return 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
      case 'LISTRIK':
      case 'PETIR':
        return 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-900/60';
      case 'ELEVATOR':
        return 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <article
      aria-label={`Tugas pemeriksaan untuk ${u.object_name}`}
      className={`rounded-2xl border bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs hover:shadow-md ${
        isReturned
          ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/10'
          : isInProgress
          ? 'border-blue-300 dark:border-blue-800 bg-blue-50/10 dark:bg-blue-950/10 ring-1 ring-blue-400/20'
          : 'border-slate-200/90 dark:border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Baris Atas: Kategori, PO Number & Status Badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-[11px] font-black uppercase tracking-wider ${getCategoryBadgeClass(
                u.category_code
              )}`}
            >
              {u.category_code}
            </span>
            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
              PO: {u.po_number || u.order_no}
            </span>
          </div>
          <StatusBadge status={u.unit_status} />
        </div>

        {/* Informasi Utama Unit Alat */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug tracking-tight">
            {u.object_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              SN: <strong className="font-mono text-slate-800 dark:text-slate-200">{u.serial_number || '-'}</strong>
            </span>
            {u.capacity && (
              <>
                <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                <span>
                  SWL: <strong className="text-slate-800 dark:text-slate-200">{u.capacity}</strong>
                </span>
              </>
            )}
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="text-slate-600 dark:text-slate-400">
              {SERVICE_TYPE_LABELS[u.service_type] || u.service_type || 'Riksa Uji'}
            </span>
          </div>
        </div>

        {/* Kotak Info Klien, Lokasi, dan Kontak PIC Lapangan */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 min-w-0">
              <Building size={15} className="text-slate-400 shrink-0" />
              <span className="truncate">{u.client_name}</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadLetter}
              disabled={downloadingLetter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:text-[#C81E1E] dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-50"
              title="Unduh Surat Tugas Resmi PT Upaya Riksa Daya"
            >
              <FilePdf size={13} className="text-[#C81E1E] shrink-0" weight="bold" />
              <span>{downloadingLetter ? '...' : 'Surat Tugas'}</span>
            </button>
          </div>

          <div className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5 text-[11px]">
            <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {u.location_name ? `${u.location_name} · ` : ''}
              {u.location_address || u.install_location || u.client_address || 'Lokasi pabrik klien'}
            </span>
          </div>

          {/* Kontak PIC Lapangan */}
          {contactPhone && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                PIC: <strong className="text-slate-800 dark:text-slate-200">{u.contact_name || 'Petugas Lapangan'}</strong>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${contactPhone}`}
                  title="Hubungi PIC via Telepon"
                  className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  <Phone size={13} weight="bold" />
                  <span>Telp</span>
                </a>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Hubungi PIC via WhatsApp"
                    className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    <WhatsappLogo size={14} weight="bold" />
                    <span>WA</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Catatan Revisi jika LHPP dikembalikan */}
        {isReturned && u.review_notes && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 p-3 text-xs text-rose-900 dark:text-rose-200 space-y-1">
            <div className="font-extrabold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
              <WarningCircle size={15} weight="fill" className="text-rose-600" />
              <span>Perlu Perbaikan / Revisi QC:</span>
            </div>
            <p className="text-[11px] pl-5 leading-relaxed font-medium">
              {u.review_notes}
            </p>
          </div>
        )}
      </div>

      {/* Bagian Bawah: Tanggal Jadwal & Tombol Aksi Lapangan */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          <Clock size={14} className="text-slate-400" />
          <span>{u.start_at ? formatDate(u.start_at) : 'Sesuai agenda operasional'}</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Tombol Detail Tugas */}
          {onOpenDetailModal && (
            <button
              type="button"
              onClick={() => onOpenDetailModal(u)}
              className="inline-flex items-center justify-center gap-1 px-3 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              title="Lihat rincian lengkap tugas, alat &amp; klien"
            >
              <Info size={15} weight="bold" />
              <span>Detail</span>
            </button>
          )}

          {/* Aksi Berdasarkan Status Penugasan */}
          {u.assignment_status === 'MENUNGGU' ? (
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => onRespondAssignment(u.order_id, u.assignment_id, 'DITERIMA')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle size={16} weight="bold" />
                <span>Terima</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenRejectModal({
                    orderId: u.order_id,
                    assignmentId: u.assignment_id,
                    poNo: u.po_number || u.order_no,
                    isCancel: false
                  })
                }
                className="inline-flex items-center justify-center gap-1 px-3.5 min-h-[44px] rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                <XCircle size={16} weight="bold" />
                <span>Tolak</span>
              </button>
            </div>
          ) : isCompleted ? (
            <button
              type="button"
              onClick={() => (onOpenInspection ? onOpenInspection(u) : null)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs font-bold shadow-2xs cursor-pointer"
            >
              <Eye size={16} weight="bold" className="text-emerald-600" />
              <span>Lihat Hasil Riksa Uji</span>
            </button>
          ) : isInProgress ? (
            <button
              type="button"
              onClick={() => (onOpenInspection ? onOpenInspection(u) : null)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 min-h-[44px] rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all text-xs font-bold shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Play size={15} weight="fill" />
              <span>Lanjutkan Pemeriksaan</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <button
                type="button"
                onClick={() => (onOpenInspection ? onOpenInspection(u) : null)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 min-h-[44px] rounded-xl bg-[#C81E1E] text-white hover:bg-[#a61717] active:scale-[0.98] transition-all text-xs font-bold shadow-sm shadow-rose-500/20 cursor-pointer"
              >
                <Play size={14} weight="fill" />
                <span>Mulai Pemeriksaan</span>
              </button>
              {!u.inspection_id && (
                <button
                  type="button"
                  title="Batalkan penerimaan penugasan ini"
                  onClick={() =>
                    onOpenRejectModal({
                      orderId: u.order_id,
                      assignmentId: u.assignment_id,
                      poNo: u.po_number || u.order_no,
                      isCancel: true
                    })
                  }
                  className="px-3 min-h-[44px] rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
