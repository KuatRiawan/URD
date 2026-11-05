import { useMemo } from 'react';
import { Certificate, CheckCircle, Plus, Trash, Users, WarningCircle } from '@phosphor-icons/react';
import { EmptyState } from '../../../components/feedback/StateViews.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { formatDate } from '../../../lib/utils/format.js';

export function InspectorCompetencySection({
  inspectors,
  canManage,
  onOpenAddCompetency,
  onDeleteCompetency
}) {
  const now = useMemo(() => new Date(), []);

  // Hitung metrik kesiapan tim Ahli K3
  const stats = useMemo(() => {
    let readyInspectors = 0;
    let totalActiveSkp = 0;
    let expiringOrExpiredSkp = 0;

    for (const insp of inspectors) {
      const comps = insp.competencies || [];
      const hasActive = comps.some((c) => {
        if (!c.validUntil) return false;
        return new Date(c.validUntil) > now && c.isValid !== false;
      });
      if (hasActive) readyInspectors++;

      for (const c of comps) {
        if (!c.validUntil) continue;
        const validDate = new Date(c.validUntil);
        const daysDiff = Math.ceil((validDate - now) / (1000 * 60 * 60 * 24));
        if (daysDiff < 0 || c.isValid === false) {
          expiringOrExpiredSkp++;
        } else if (daysDiff <= 30) {
          expiringOrExpiredSkp++;
          totalActiveSkp++;
        } else {
          totalActiveSkp++;
        }
      }
    }

    return {
      totalInspectors: inspectors.length,
      readyInspectors,
      totalActiveSkp,
      expiringOrExpiredSkp
    };
  }, [inspectors, now]);

  const getSkpStatus = (comp) => {
    if (!comp.validUntil) {
      return { tone: 'neutral', label: 'Tanpa Tanggal', days: null };
    }
    const validDate = new Date(comp.validUntil);
    const days = Math.ceil((validDate - now) / (1000 * 60 * 60 * 24));

    if (days < 0 || comp.isValid === false) {
      return { tone: 'danger', label: 'Kedaluwarsa', days };
    }
    if (days <= 30) {
      return { tone: 'warning', label: `Segera Habis (${days} hari)`, days };
    }
    return { tone: 'success', label: 'Aktif', days };
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-[#C81E1E]" weight="bold" />
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
            Matriks Kesiapan &amp; SKP Penunjukan Ahli K3 ({inspectors.length} Personel)
          </h2>
        </div>
      </div>

      {/* Ringkasan Kesiapan Lisensi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Users size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Personel Ahli K3</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white">{stats.totalInspectors} Orang</div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CheckCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Siap Tugas (SKP Valid)</div>
            <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
              {stats.readyInspectors} / {stats.totalInspectors} Personel
            </div>
          </div>
        </div>

        <div className="p-3.5 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <WarningCircle size={18} weight="bold" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">SKP Perlu Perpanjangan</div>
            <div className="text-base font-extrabold text-rose-700 dark:text-rose-400">
              {stats.expiringOrExpiredSkp} Lisensi
            </div>
          </div>
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
              <div className="space-y-1 min-w-[220px]">
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
                  (insp.competencies || []).map((comp) => {
                    const status = getSkpStatus(comp);
                    return (
                      <div
                        key={comp.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs shadow-2xs"
                      >
                        <Certificate
                          size={16}
                          weight="bold"
                          className={
                            status.tone === 'success'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : status.tone === 'warning'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                          }
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            <span>{comp.categoryCode}</span>
                            <span className="text-slate-400 font-normal">·</span>
                            <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{comp.certificateNo}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>Berlaku s/d {formatDate(comp.validUntil)}</span>
                            <Badge tone={status.tone}>{status.label}</Badge>
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
                    );
                  })
                )}
              </div>

              {canManage && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenAddCompetency(insp)}
                    className="min-h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
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
