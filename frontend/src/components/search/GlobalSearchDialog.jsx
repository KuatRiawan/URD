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
  ORDER: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  CLIENT: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  OBJECT: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20',
  BAP: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  LHPP: 'bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-300 border-[#C81E1E]/20',
  ISSUE: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20'
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
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-20 overflow-y-auto bg-black/35 dark:bg-black/65 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white/95 dark:bg-[#151821]/95 backdrop-blur-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22),0_4px_16px_rgba(0,0,0,0.08)] border border-black/[0.08] dark:border-white/[0.10] transition-all text-[#1D1D1F] dark:text-[#F5F5F7] animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Spotlight Input Bar */}
        <div className="relative flex items-center border-b border-black/[0.06] dark:border-white/[0.08] px-4 py-3.5 sm:px-5">
          <MagnifyingGlass
            size={20}
            weight="bold"
            className="shrink-0 text-[#6E6E73] dark:text-[#98989D] mr-3"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id="global-search-title"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor PO, nama klien, nomor seri alat, nomor BAP, atau LHPP..."
            className="w-full border-0 bg-transparent py-1.5 text-[15px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7] placeholder:text-[#86868B] dark:placeholder:text-[#636366] focus:outline-hidden focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Hapus kata kunci pencarian"
              className="mr-2 p-1.5 text-[#6E6E73] dark:text-[#98989D] hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
            >
              <X size={15} weight="bold" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center rounded-[7px] border border-black/[0.08] dark:border-white/[0.10] bg-black/[0.03] dark:bg-white/[0.05] px-2 py-0.5 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-3 sm:p-4">
          {loading && (
            <div className="flex items-center justify-center py-10 text-[#6E6E73] dark:text-[#98989D] gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C81E1E] border-t-transparent" />
              <span className="text-xs font-medium">Mencari di seluruh basis data...</span>
            </div>
          )}

          {!loading && !searched && query.trim().length < 2 && (
            <div className="py-9 text-center text-[#6E6E73] dark:text-[#98989D]">
              <p className="text-xs font-medium">
                Ketik minimal 2 karakter untuk mencari data operasional PT Upaya Riksa Daya.
              </p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">Tidak ada hasil ditemukan</p>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#98989D]">
                Tidak ada data PO, klien, alat, BAP, atau LHPP yang cocok dengan "{query}".
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              <p className="px-2.5 pb-1 text-xs font-semibold text-[#6E6E73] dark:text-[#98989D]">
                Ditemukan {results.length} data
              </p>
              {results.map((item) => {
                const IconComponent = TYPE_ICONS[item.type] || ClipboardText;
                const badgeColor = TYPE_COLORS[item.type] || 'bg-black/[0.05] text-[#1D1D1F] border-black/[0.08]';

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus:bg-black/[0.04] dark:focus:bg-white/[0.06] focus:outline-hidden cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 rounded-[10px] p-2 bg-[#F5F5F7] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-[#F5F5F7] border border-black/[0.05] dark:border-white/[0.06]">
                        <IconComponent size={18} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                            {item.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${badgeColor}`}
                          >
                            {item.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-[#6E6E73] dark:text-[#98989D] mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    {item.status && (
                      <span className="shrink-0 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">
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
        <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.07] bg-[#F5F5F7]/70 dark:bg-[#11141C]/80 px-4 py-2.5 text-[11px] font-medium text-[#6E6E73] dark:text-[#98989D]">
          <span>Pencarian Cepat Antar-Modul</span>
          <span>Tekan ESC untuk menutup</span>
        </div>
      </div>
    </div>
  );
}
