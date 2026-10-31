import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Buildings,
  ClipboardText,
  Cube,
  MagnifyingGlass,
  Scroll,
  WarningOctagon,
  X
} from '@phosphor-icons/react';
import { api } from '../../lib/api/axios.js';

const TYPE_ICONS = {
  ORDER: ClipboardText,
  CLIENT: Buildings,
  OBJECT: Cube,
  BAP: ClipboardText,
  LHPP: Scroll,
  ISSUE: WarningOctagon
};

const TYPE_COLORS = {
  ORDER: 'bg-blue-50 text-blue-700 border-blue-200',
  CLIENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  OBJECT: 'bg-amber-50 text-amber-700 border-amber-200',
  BAP: 'bg-purple-50 text-purple-700 border-purple-200',
  LHPP: 'bg-rose-50 text-rose-700 border-rose-200',
  ISSUE: 'bg-amber-50 text-amber-800 border-amber-200'
};

export function GlobalSearchDialog({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setResults(res.data?.results || []);
        setSearched(true);
      } catch {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (item) => {
    onClose();
    navigate(item.link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 px-4 py-3 sm:px-6">
          <MagnifyingGlass
            size={22}
            className="shrink-0 text-slate-400 dark:text-slate-500 mr-3"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="global-search-title"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nomor PO, nama klien, nomor seri alat, nomor BAP, atau nomor LHPP..."
            className="w-full border-0 bg-transparent py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus kata kunci pencarian"
              className="mr-2 p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-md"
            >
              <X size={16} />
            </button>
          )}
          <span className="hidden sm:inline-block rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            ESC
          </span>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 sm:p-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-500 dark:text-slate-400 gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              <span className="text-xs">Mencari di seluruh basis data...</span>
            </div>
          )}

          {!loading && !searched && query.trim().length < 2 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              <p className="text-xs">
                Ketik minimal 2 karakter untuk mencari data operasional PT Upaya Riksa Daya.
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              <p className="text-sm font-semibold">Tidak ada hasil ditemukan</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Tidak ada data PO, klien, alat, BAP, atau LHPP yang cocok dengan "{query}".
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1.5">
              <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Ditemukan {results.length} Data
              </p>
              {results.map((item) => {
                const IconComponent = TYPE_ICONS[item.type] || ClipboardText;
                const badgeColor = TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-700';

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 focus:bg-slate-50 dark:focus:bg-slate-800/80 focus:outline-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 rounded-lg p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <IconComponent size={20} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badgeColor}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    {item.status && (
                      <span className="shrink-0 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {item.status}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Pencarian Cepat Antar-Modul</span>
          <span>Tekan ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
}

