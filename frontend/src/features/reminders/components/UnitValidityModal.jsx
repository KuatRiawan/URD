import { useEffect, useState } from 'react';
import { ClockCounterClockwise, User, ChatCircleText } from '@phosphor-icons/react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { api } from '../../../lib/api/axios.js';
import { formatDateTime } from '../../../lib/utils/format.js';

const FOLLOWUP_LABELS = {
  BELUM_DITINDAKLANJUTI: 'Belum Ditindaklanjuti',
  SUDAH_DIHUBUNGI: 'Sudah Dihubungi',
  MENUNGGU_KONFIRMASI_KLIEN: 'Menunggu Konfirmasi',
  SUDAH_JADI_PO_BARU: 'Sudah Jadi PO',
  TERJADWAL: 'Terjadwal',
  DITUNDA: 'Ditunda'
};

const FOLLOWUP_TONE = {
  BELUM_DITINDAKLANJUTI: 'neutral',
  SUDAH_DIHUBUNGI: 'info',
  MENUNGGU_KONFIRMASI_KLIEN: 'warning',
  SUDAH_JADI_PO_BARU: 'success',
  TERJADWAL: 'info',
  DITUNDA: 'danger'
};

export function UnitValidityModal({
  validityModalUnit,
  onClose,
  handleSaveUnitValidity,
  validityForm,
  setValidityForm,
  submitting
}) {
  const [followups, setFollowups] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!validityModalUnit?.object_id) {
      setFollowups([]);
      return;
    }
    let isMounted = true;
    setLoadingHistory(true);
    api
      .get(`/reminders/units/${validityModalUnit.object_id}/followups`)
      .then((res) => {
        if (isMounted) {
          setFollowups(res.data?.items || []);
        }
      })
      .catch(() => {
        if (isMounted) setFollowups([]);
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });
    return () => {
      isMounted = false;
    };
  }, [validityModalUnit?.object_id]);

  if (!validityModalUnit) return null;

  return (
    <Modal
      open={Boolean(validityModalUnit)}
      onClose={onClose}
      title="Masa Berlaku &amp; Tindak Lanjut Unit"
      subtitle={`${validityModalUnit.object_name} · ${validityModalUnit.client_name}`}
      size="lg"
    >
      <form onSubmit={handleSaveUnitValidity} className="space-y-4 text-xs text-slate-800 dark:text-slate-200">
        <div>
          <label htmlFor="validity-date" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Tanggal Masa Berlaku Resmi / Jadwal Riksa Uji Berikutnya *
          </label>
          <input
            id="validity-date"
            type="date"
            required
            value={validityForm.nextInspectionDate}
            onChange={(e) =>
              setValidityForm((prev) => ({ ...prev, nextInspectionDate: e.target.value }))
            }
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Diambil dari tanggal jatuh tempo Suket Disnaker atau tanggal rekomendasi berkala LHPP.
          </p>
        </div>

        <div>
          <label htmlFor="validity-followup" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Status Tindak Lanjut Perpanjangan
          </label>
          <select
            id="validity-followup"
            value={validityForm.followupStatus}
            onChange={(e) =>
              setValidityForm((prev) => ({ ...prev, followupStatus: e.target.value }))
            }
            className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 px-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          >
            <option value="BELUM_DITINDAKLANJUTI">Belum Ditindaklanjuti</option>
            <option value="SUDAH_DIHUBUNGI">Sudah Dihubungi (Follow-up)</option>
            <option value="MENUNGGU_KONFIRMASI_KLIEN">Menunggu Konfirmasi Klien</option>
            <option value="SUDAH_JADI_PO_BARU">Sudah Jadi PO Baru</option>
            <option value="DITUNDA">Ditunda oleh Klien</option>
          </select>
        </div>

        <div>
          <label htmlFor="validity-note" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            Catatan Tindak Lanjut / Dasar Masa Berlaku
          </label>
          <textarea
            id="validity-note"
            rows={3}
            value={validityForm.note}
            onChange={(e) => setValidityForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Contoh: Telah dihubungi PIC Pak Budi via WA. Klien meminta penawaran ulang untuk 3 unit crane minggu depan..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Riwayat Tindak Lanjut Sebelumnya */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 mb-2 font-bold text-slate-700 dark:text-slate-300">
            <ClockCounterClockwise size={14} className="text-[#C81E1E]" />
            <span>Riwayat Tindak Lanjut Renewal</span>
          </div>

          {loadingHistory ? (
            <p className="text-[11px] text-slate-500 italic py-2">Memuat riwayat tindak lanjut...</p>
          ) : followups.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic py-2">Belum ada riwayat tindak lanjut tercatat untuk unit ini.</p>
          ) : (
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {followups.map((fu) => (
                <div
                  key={fu.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={FOLLOWUP_TONE[fu.status] || 'neutral'}>
                      {FOLLOWUP_LABELS[fu.status] || fu.status}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {formatDateTime(fu.created_at)}
                    </span>
                  </div>
                  {fu.note && (
                    <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed">
                      {fu.note}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {fu.recorder_name && (
                      <span className="flex items-center gap-1">
                        <User size={12} />
                        {fu.recorder_name}
                      </span>
                    )}
                    {fu.contact_pic && (
                      <span className="flex items-center gap-1">
                        <ChatCircleText size={12} />
                        PIC: {fu.contact_pic}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-10 px-4.5 rounded-lg bg-[#C81E1E] font-bold text-white hover:bg-[#a11616] disabled:opacity-50 cursor-pointer text-xs transition-colors shadow-2xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C81E1E]"
          >
            {submitting ? 'Menyimpan...' : 'Simpan Masa Berlaku'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
