import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Desktop, CaretDown, Check } from '@phosphor-icons/react';
import { useTheme } from '../../app/providers/ThemeProvider.jsx';

export function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = [
    { value: 'light', label: 'Terang (Light)', icon: Sun },
    { value: 'dark', label: 'Gelap (Dark)', icon: Moon },
    { value: 'system', label: 'Sistem (Auto)', icon: Desktop }
  ];

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Ubah tema tampilan. Tema saat ini: ${theme}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="min-h-11 sm:min-h-9 px-2.5 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
      >
        <CurrentIcon size={17} weight="bold" className="text-amber-500 dark:text-amber-400" aria-hidden="true" />
        {showLabel && (
          <span className="hidden sm:inline text-xs font-semibold capitalize">
            {theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}
          </span>
        )}
        <CaretDown size={11} weight="bold" className="text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-pop z-50 animate-pop-in">
          <p className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Pilih Tema Tampilan
          </p>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} weight={isSelected ? 'bold' : 'regular'} />
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} weight="bold" className="text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

