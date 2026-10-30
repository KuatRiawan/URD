import { Link } from 'react-router';
import {
  Building,
  CheckCircle,
  ClipboardText,
  Eye,
  MapPin,
  Phone,
  Play,
  WarningCircle,
  WhatsappLogo,
  XCircle
} from '@phosphor-icons/react';
import { StatusBadge } from '../../../components/ui/Badge.jsx';
import { formatDate, SERVICE_TYPE_LABELS } from '../../../lib/utils/format.js';

export function InspectorUnitCard({
  unit: u,
  onRespondAssignment,
  onOpenRejectModal
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

  return (
    <div
      key={`${u.order_id}-${u.object_id}`}
      className={`rounded-xl border bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xs ${
        isReturned
          ? 'border-rose-400 bg-rose-50/20 dark:border-rose-800 dark:bg-rose-950/10'
          : isInProgress
          ? 'border-blue-300 dark:border-blue-800'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="space-y-3.5">
        {/* Top Bar: Kategori & Status Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-[#C81E1E] dark:text-rose-400 font-extrabold text-[11px] tracking-wide">
            <span>{u.category_code}</span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {u.category_name || 'Riksa Uji K3'}
            </span>
          </div>
          <StatusBadge status={u.unit_status} />
        </div>

        {/* Informasi Utama Unit Alat */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
            {u.object_name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>
              SN: <strong className="font-mono text-slate-800 dark:text-slate-200">{u.serial_number}</strong>
            </span>
            {u.capacity && (
              <>
                <span>·</span>
                <span>Kapasitas: <strong className="text-slate-800 dark:text-slate-200">{u.capacity}</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Info PO & Perusahaan Klien */}
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#C81E1E] dark:text-rose-400">
              PO: {u.po_number || u.order_no}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {SERVICE_TYPE_LABELS[u.service_type] || u.service_type}
            </span>
          </div>
          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Building size={14} className="text-slate-400 shrink-0" />
            <span className="truncate">{u.client_name}</span>
          </div>
          <div className="text-slate-600 dark:text-slate-400 flex items-start gap-1.5 text-[11px]">
            <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">
              {u.location_name ? `${u.location_name} · ` : ''}
              {u.location_address || u.install_location || u.client_address || 'Lokasi belum diinput'}
            </span>
          </div>

          {/* Kontak PIC Lapangan */}
          {contactPhone && (
            <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                PIC: <strong className="text-slate-800 dark:text-slate-200">{u.contact_name || 'Petugas Lapangan'}</strong>
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${contactPhone}`}
                  title="Hubungi telepon"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50"
                >
                  <Phone size={12} weight="bold" />
                  <span>Telepon</span>
                </a>
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Hubungi WhatsApp"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                  >
                    <WhatsappLogo size={12} weight="bold" />
                    <span>WA</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Catatan Revisi jika LHPP dikembalikan */}
        {isReturned && u.review_notes && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 text-xs text-rose-800 dark:text-rose-300">
            <span className="font-bold flex items-center gap-1 mb-0.5">
              <WarningCircle size={14} weight="bold" /> Catatan Revisi Riksa Uji:
            </span>
            <p>{u.review_notes}</p>
          </div>
        )}
      </div>

      {/* Action Strip: Aksi Utama Sesuai Status Penugasan & Pelaksanaan */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {u.start_at ? `Jadwal: ${formatDate(u.start_at)}` : 'Jadwal operasional'}
        </div>

        <div className="flex items-center gap-2">
          {u.assignment_status === 'MENUNGGU' ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRespondAssignment(u.order_id, u.assignment_id, 'DITERIMA')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                <CheckCircle size={15} weight="bold" />
                <span>Terima</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenRejectModal({ orderId: u.order_id, assignmentId: u.assignment_id, poNo: u.po_number || u.order_no, isCancel: false })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all cursor-pointer"
              >
                <XCircle size={15} weight="bold" />
                <span>Tolak</span>
              </button>
            </div>
          ) : isCompleted ? (
            <Link
              to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs font-bold shadow-2xs"
            >
              <Eye size={15} weight="bold" className="text-emerald-600" />
              <span>Review Hasil</span>
            </Link>
          ) : isInProgress ? (
            <Link
              to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-bold shadow-2xs"
            >
              <ClipboardText size={15} weight="bold" />
              <span>Lanjutkan Form</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to={`/app/inspections?orderId=${u.order_id}&objectId=${u.object_id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C81E1E] text-white hover:bg-[#a61717] transition-all text-xs font-bold shadow-2xs"
              >
                <Play size={14} weight="fill" />
                <span>Mulai Kerjakan</span>
              </Link>
              {!u.inspection_id && (
                <button
                  type="button"
                  title="Batalkan penerimaan penugasan ini"
                  onClick={() => onOpenRejectModal({ orderId: u.order_id, assignmentId: u.assignment_id, poNo: u.po_number || u.order_no, isCancel: true })}
                  className="px-2 py-1.5 rounded text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

