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
        className="min-h-11 sm:min-h-8.5 px-2.5 inline-flex items-center gap-1.5 rounded-[10px] border border-black/[0.08] dark:border-white/[0.09] bg-white/85 dark:bg-white/[0.05] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.09] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
      >
        <CurrentIcon size={16} weight="bold" className="text-amber-500 dark:text-amber-400" aria-hidden="true" />
        {showLabel && (
          <span className="hidden sm:inline text-xs font-medium capitalize">
            {theme === 'system' ? 'Sistem' : theme === 'dark' ? 'Gelap' : 'Terang'}
          </span>
        )}
        <CaretDown size={11} weight="bold" className="text-[#86868B]" aria-hidden="true" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-2xl border border-black/[0.08] dark:border-white/[0.09] bg-white dark:bg-[#151821] p-1.5 shadow-pop z-50 animate-pop-in">
          <p className="px-2.5 py-1 text-[11px] font-semibold text-[#6E6E73] dark:text-[#98989D]">
            Tema Tampilan
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-400 font-semibold'
                      : 'text-[#1D1D1F] dark:text-[#E5E5EA] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} weight={isSelected ? 'fill' : 'regular'} />
                    <span>{opt.label}</span>
                  </span>
                  {isSelected && <Check size={14} weight="bold" className="text-[#C81E1E] dark:text-rose-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
