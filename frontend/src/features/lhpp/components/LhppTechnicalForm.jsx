import { FloppyDisk, PaperPlaneTilt } from '@phosphor-icons/react';

export function LhppTechnicalForm({
  detailLhpp,
  draftForm,
  setDraftForm,
  isInspector,
  submitting,
  handleSaveDraft,
  handleSubmitReview
}) {
  return (
    <form onSubmit={handleSaveDraft} className="space-y-4">
      {Array.isArray(detailLhpp.lhpp_schema) && detailLhpp.lhpp_schema.length > 0 && (
        <div className="p-4 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Parameter Evaluasi Teknis Spesifik Kategori ({detailLhpp.category_code} -{' '}
              {detailLhpp.category_name})
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {detailLhpp.lhpp_schema.map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {field.label}
                </label>
                <input
                  type="text"
                  disabled={
                    !isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)
                  }
                  value={draftForm.technicalData?.[field.key] || ''}
                  onChange={(e) =>
                    setDraftForm((prev) => ({
                      ...prev,
                      technicalData: {
                        ...prev.technicalData,
                        [field.key]: e.target.value
                      }
                    }))
                  }
                  placeholder={`Isi ${field.label.toLowerCase()}...`}
                  className="w-full rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
            Rekomendasi Masa Berlaku / Tanggal Pemeriksaan Berkala Berikutnya
          </label>
          <input
            type="date"
            disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
            value={draftForm.recommendedValidUntil}
            onChange={(e) =>
              setDraftForm((prev) => ({ ...prev, recommendedValidUntil: e.target.value }))
            }
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Ringkasan Metode Pemeriksaan &amp; Pengujian
        </label>
        <textarea
          rows={2}
          disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
          value={draftForm.methodSummary}
          onChange={(e) =>
            setDraftForm((prev) => ({ ...prev, methodSummary: e.target.value }))
          }
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Analisis &amp; Evaluasi Teknis K3
        </label>
        <textarea
          rows={3}
          disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
          value={draftForm.technicalNotes}
          onChange={(e) =>
            setDraftForm((prev) => ({ ...prev, technicalNotes: e.target.value }))
          }
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
          Syarat &amp; Rekomendasi Pemenuhan Regulasi K3
        </label>
        <textarea
          rows={2}
          disabled={!isInspector || !['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status)}
          value={draftForm.recommendations}
          onChange={(e) =>
            setDraftForm((prev) => ({ ...prev, recommendations: e.target.value }))
          }
          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
      </div>

      {isInspector && ['DRAF', 'DIKEMBALIKAN'].includes(detailLhpp.status) && (
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="min-h-10 inline-flex items-center gap-1.5 rounded border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <FloppyDisk size={15} />
            <span>Simpan Draf LHPP</span>
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitReview}
            className="min-h-10 inline-flex items-center gap-1.5 rounded bg-[#C81E1E] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-800 cursor-pointer"
          >
            <PaperPlaneTilt size={15} />
            <span>Ajukan ke Review Teknis</span>
          </button>
        </div>
      )}
    </form>
  );
}
