import { Modal } from '../../../components/ui/Modal.jsx';

export function UnitValidityModal({
  validityModalUnit,
  onClose,
  handleSaveUnitValidity,
  validityForm,
  setValidityForm,
  submitting
}) {
  if (!validityModalUnit) return null;

  return (
    <Modal
      open={Boolean(validityModalUnit)}
      onClose={onClose}
      title={`Masa Berlaku & Tindak Lanjut: ${validityModalUnit.object_name}`}
    >
      <form onSubmit={handleSaveUnitValidity} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
            Tanggal Masa Berlaku Resmi / Jadwal Pemeriksaan Berkala Berikutnya
          </label>
          <input
            type="date"
            value={validityForm.nextInspectionDate}
            onChange={(e) =>
              setValidityForm((prev) => ({ ...prev, nextInspectionDate: e.target.value }))
            }
            className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
            Status Tindak Lanjut Perpanjangan
          </label>
          <select
            value={validityForm.followupStatus}
            onChange={(e) =>
              setValidityForm((prev) => ({ ...prev, followupStatus: e.target.value }))
            }
            className="w-full min-h-10 rounded border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <option value="BELUM_DITINDAKLANJUTI">Belum Ditindaklanjuti</option>
            <option value="SUDAH_DIHUBUNGI">Sudah Dihubungi</option>
            <option value="MENUNGGU_KONFIRMASI_KLIEN">Menunggu Konfirmasi Klien</option>
            <option value="SUDAH_JADI_PO_BARU">Sudah Jadi PO Baru</option>
            <option value="DITUNDA">Ditunda</option>
          </select>
        </div>
        <div>
          <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
            Catatan Tindak Lanjut / Dasar Masa Berlaku
          </label>
          <textarea
            rows={2}
            value={validityForm.note}
            onChange={(e) => setValidityForm((prev) => ({ ...prev, note: e.target.value }))}
            placeholder="Contoh: Tanggal berlaku berdasarkan Suket Disnaker / rekomendasi LHPP..."
            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-100"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 rounded bg-[#C81E1E] px-4 py-2 font-bold text-white hover:bg-[#a11616] cursor-pointer"
          >
            Simpan Masa Berlaku
          </button>
        </div>
      </form>
    </Modal>
  );
}

