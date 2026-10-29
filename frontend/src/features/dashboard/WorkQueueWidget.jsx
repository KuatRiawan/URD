import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  WarningCircle,
  ListChecks
} from '@phosphor-icons/react';
import { api } from '../../lib/api/axios.js';
import { extractErrorMessage } from '../../lib/utils/format.js';

export function WorkQueueWidget() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    async function fetchQueue() {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/dashboard/work-queue');
        if (active) {
          setQueue(res.data?.items || []);
        }
      } catch (err) {
        if (active) setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchQueue();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C81E1E] border-t-transparent" />
          <span>Memeriksa antrean pekerjaan operasional...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-400">
        <div className="flex items-center gap-2">
          <WarningCircle size={16} />
          <span>Gagal memuat antrean pekerjaan: {error}</span>
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200/90 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/30 p-4.5 text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <CheckCircle size={22} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-bold leading-tight">Seluruh Pekerjaan Terkendali</p>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 mt-0.5">
              Tidak ada antrean darurat yang membutuhkan tindakan segera saat ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const highCount = queue.filter((i) => i.urgency === 'TINGGI').length;
  const filteredQueue =
    filter === 'HIGH' ? queue.filter((i) => i.urgency === 'TINGGI') : queue;

  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
      <div className="border-b border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-lg bg-brand-500/10 dark:bg-rose-500/10 text-[#C81E1E] dark:text-rose-400 inline-flex items-center justify-center shrink-0 border border-brand-500/20">
            <ListChecks size={18} weight="bold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Antrean Tindakan Prioritas ({queue.length})
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Tugas yang membutuhkan verifikasi, input, atau peninjauan
            </p>
          </div>
        </div>

        {/* Tab Filter Ala Metis */}
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 text-xs font-semibold self-start sm:self-center shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'ALL'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Semua ({queue.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('HIGH')}
            className={`px-3 py-1 rounded-md transition-colors ${
              filter === 'HIGH'
                ? 'bg-[#C81E1E] text-white font-bold shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Urgensi Tinggi ({highCount})
          </button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto scrollbar-thin">
        {filteredQueue.map((item) => {
          const isHigh = item.urgency === 'TINGGI';

          return (
            <div
              key={item.id}
              className="p-3.5 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="min-w-0 flex items-start gap-3">
                <span
                  className={`mt-0.5 shrink-0 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                    isHigh
                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {item.urgency}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </div>

              <Link
                to={item.link}
                className="shrink-0 self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#C81E1E] hover:border-[#C81E1E] hover:text-white dark:hover:bg-[#C81E1E] dark:hover:border-[#C81E1E] dark:hover:text-white transition-all shadow-2xs"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={13} weight="bold" aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
