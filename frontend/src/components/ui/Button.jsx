import { forwardRef } from 'react';

export const VARIANTS = {
  primary:
    'bg-[#C81E1E] text-white hover:bg-[#a11616] active:bg-[#851111] focus-visible:ring-2 focus-visible:ring-[#C81E1E] shadow-2xs cursor-pointer',
  secondary:
    'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-slate-400 shadow-2xs cursor-pointer',
  outline:
    'border border-slate-300 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer',
  danger:
    'border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 focus-visible:ring-2 focus-visible:ring-rose-500 shadow-2xs cursor-pointer',
  soft:
    'bg-rose-50 text-[#C81E1E] hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/40 focus-visible:ring-2 focus-visible:ring-[#C81E1E] cursor-pointer'
};

export const SIZES = {
  xs: 'h-7 px-2.5 text-[11px] font-semibold gap-1 rounded-md',
  sm: 'h-8 px-3 text-xs font-semibold gap-1.5 rounded-lg',
  md: 'h-9 px-3.5 text-xs font-semibold gap-1.5 rounded-lg',
  lg: 'h-10 px-4 text-sm font-semibold gap-2 rounded-lg'
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  const sizeClass = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center tracking-tight transition-all duration-150 focus-visible:outline-hidden select-none disabled:opacity-40 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
            aria-hidden="true"
          />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon size={size === 'xs' ? 13 : size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" className="shrink-0" />
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <Icon size={size === 'xs' ? 13 : size === 'sm' ? 14 : size === 'lg' ? 18 : 16} aria-hidden="true" className="shrink-0" />
          )}
        </>
      )}
    </button>
  );
});

