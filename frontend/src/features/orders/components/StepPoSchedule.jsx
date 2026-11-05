import { Info, UserCheck } from '@phosphor-icons/react';

export function StepPoSchedule({
  createForm,
  setCreateForm,
  inspectors,
  user
}) {
  const isMarketing = user?.role === 'MARKETING';

  return (
    <div className="space-y-4 text-xs">
      <div>
        <label htmlFor="po-requested-date" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          {isMarketing
            ? 'Target Tanggal Pemeriksaan Lapangan (Permintaan Klien)'
            : 'Target Tanggal Pemeriksaan Lapangan'}
        </label>
        <input
          id="po-requested-date"
          type="date"
          value={createForm.requestedDate}
          onChange={(e) =>
            setCreateForm((prev) => ({ ...prev, requestedDate: e.target.value }))
          }
          className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        />
        {isMarketing && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Masukkan perkiraan tanggal riksa uji yang diajukan oleh klien. Jadwal resmi akan difinalisasi oleh Admin Kantor.
          </p>
        )}
      </div>

      {isMarketing ? (
        /* Informasi Alur Operasional untuk Marketing */
        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-300">
            <Info size={16} weight="bold" />
            <span>Alur Penugasan Ahli K3 &amp; Jadwal Resmi</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
            Sesuai standar operasional PT Upaya Riksa Daya, verifikasi kompetensi SKP Kemnaker (PAA, PUBT, PTP, dsb), pengecekan bentrok jadwal, dan penerbitan <strong>Surat Tugas Ahli K3 resmi</strong> dilakukan oleh <strong>Admin Kantor</strong> setelah PO ini didaftarkan.
          </p>
        </div>
      ) : (
        /* Untuk Admin Kantor / Admin Sistem: Opsi Penugasan Ahli K3 Langsung */
        <div className="space-y-2">
          <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <UserCheck size={15} />
            <span>Tugaskan Inspector / Tim Ahli K3 (Dapat Ditugaskan Nanti)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {inspectors.map((insp) => {
              const checked = createForm.inspectorIds.includes(insp.id);
              const validCodes = (insp.competencies || [])
                .filter((c) => c.isValid)
                .map((c) => c.categoryCode)
                .join(', ');
              return (
                <label
                  key={insp.id}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                    checked
                      ? 'border-[#C81E1E] bg-red-50/40 dark:bg-red-950/40'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        inspectorIds: checked
                          ? prev.inspectorIds.filter((id) => id !== insp.id)
                          : [...prev.inspectorIds, insp.id]
                      }))
                    }
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-[#C81E1E]"
                  />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{insp.fullName}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      SKP: {validCodes || 'Aktif'}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="po-notes" className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          Catatan Khusus PO / Instruksi Pelaksanaan Riksa Uji
        </label>
        <textarea
          id="po-notes"
          rows={3}
          value={createForm.notes}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Instruksi khusus terkait APD wajib, izin safety induction, jam operasional pabrik, akses alat, PIC pendamping, dsb..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-400"
        />
      </div>
    </div>
  );
}
