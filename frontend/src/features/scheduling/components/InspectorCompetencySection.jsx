import { Certificate, Plus, Trash, Users } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function InspectorCompetencySection({
  inspectors,
  canManage,
  onOpenAddCompetency,
  onDeleteCompetency
}) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-slate-600 dark:text-slate-400" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Matriks Kompetensi & SKP Penunjukan Ahli K3 ({inspectors.length})
          </h2>
        </div>
      </div>

      {inspectors.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Belum ada personel Ahli K3"
            description="Tambahkan pengguna dengan peran Ahli K3 pada menu Manajemen Pengguna."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {inspectors.map((insp) => (
            <div
              key={insp.id}
              className="p-4 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{insp.fullName}</span>
                  {insp.employeeNo && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      NIP: {insp.employeeNo}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {insp.email} · {insp.phone || 'Tanpa nomor telepon'}
                </p>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-2">
                {(insp.competencies || []).length === 0 ? (
                  <span className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-2.5 py-1 rounded">
                    Belum memiliki SKP terdaftar
                  </span>
                ) : (
                  (insp.competencies || []).map((comp) => (
                    <div
                      key={comp.id}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs"
                    >
                      <Certificate
                        size={15}
                        className={comp.isValid ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {comp.categoryCode} · {comp.certificateNo}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Berlaku s/d {formatDate(comp.validUntil)}{' '}
                          {comp.isValid ? '(Aktif)' : '(Kedaluwarsa)'}
                        </div>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onDeleteCompetency(insp.id, comp.id)}
                          aria-label={`Hapus SKP ${comp.certificateNo}`}
                          className="ml-1 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {canManage && (
                <div>
                  <button
                    type="button"
                    onClick={() => onOpenAddCompetency(insp)}
                    className="min-h-10 inline-flex items-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Plus size={14} weight="bold" />
                    <span>Tambah SKP</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

