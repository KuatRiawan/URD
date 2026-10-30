export function StepPoSchedule({
  createForm,
  setCreateForm,
  inspectors
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Target Tanggal Pemeriksaan Lapangan
        </label>
        <input
          type="date"
          value={createForm.requestedDate}
          onChange={(e) =>
            setCreateForm((prev) => ({ ...prev, requestedDate: e.target.value }))
          }
          className="w-full min-h-11 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Tugaskan Inspector / Tim Ahli K3 (Dapat Ditugaskan Nanti)
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
                className={`flex items-start gap-2 p-2.5 rounded border text-xs cursor-pointer ${
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

      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Catatan Khusus PO / Instruksi Pelaksanaan Riksa Uji
        </label>
        <textarea
          rows={3}
          value={createForm.notes}
          onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Instruksi khusus terkait APD, jam operasional pabrik, akses crane, dsb..."
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100"
        />
      </div>
    </div>
  );
}

