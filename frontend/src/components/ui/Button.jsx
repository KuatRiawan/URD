import { forwardRef } from 'react';

export const VARIANTS = {
  primary:
    'bg-[#C81E1E] text-white hover:bg-[#A61717] active:bg-[#8A1212] focus-visible:ring-2 focus-visible:ring-[#C81E1E] focus-visible:ring-offset-1 shadow-[0_1px_2px_rgba(200,30,30,0.22)] cursor-pointer',
  secondary:
    'border border-black/[0.09] dark:border-white/[0.10] bg-white dark:bg-[#1E222D] text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-[#F5F5F7] dark:hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer',
  tertiary:
    'bg-transparent text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer',
  outline:
    'border border-black/[0.12] dark:border-white/[0.14] bg-transparent text-[#1D1D1F] dark:text-[#E5E5EA] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer',
  ghost:
    'bg-transparent text-[#6E6E73] dark:text-[#98989D] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-[#1D1D1F] dark:hover:text-white focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer',
  danger:
    'border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 focus-visible:ring-2 focus-visible:ring-rose-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer',
  destructive:
    'border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-[#C81E1E] dark:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-900/60 focus-visible:ring-2 focus-visible:ring-rose-500 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer',
  soft:
    'bg-rose-50/80 text-[#C81E1E] hover:bg-rose-100/90 active:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/40 focus-visible:ring-2 focus-visible:ring-[#C81E1E] cursor-pointer'
};

export const SIZES = {
  xs: 'h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-[8px]',
  sm: 'h-8.5 px-3 text-xs font-semibold gap-1.5 rounded-[9px]',
  md: 'h-9.5 px-3.5 text-xs font-semibold gap-1.5 rounded-[10px]',
  lg: 'h-10 px-4 text-sm font-semibold gap-2 rounded-[10px]',
  touch: 'min-h-[44px] px-4 text-sm font-semibold gap-2 rounded-xl',
  'icon-xs': 'h-8 w-8 p-0 rounded-[8px]',
  'icon-sm': 'h-8.5 w-8.5 p-0 rounded-[9px]',
  'icon-md': 'h-9.5 w-9.5 p-0 rounded-[10px]',
  'icon-lg': 'h-10 w-10 p-0 rounded-[10px]',
  'icon-touch': 'min-h-[44px] min-w-[44px] p-0 rounded-xl'
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
    touchFriendly = false,
    'aria-label': ariaLabel,
    ...props
  },
  ref
) {
  const variantClass = VARIANTS[variant] || VARIANTS.primary;
  let resolvedSize = size;
  if (touchFriendly && size === 'md') resolvedSize = 'touch';
  const sizeClass = SIZES[resolvedSize] || SIZES.md;
  const isDisabled = disabled || loading;

  const resolvedAriaLabel = ariaLabel || (!children && typeof props.title === 'string' ? props.title : undefined);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-label={resolvedAriaLabel}
      className={`inline-flex items-center justify-center tracking-[-0.01em] transition-all duration-150 focus-visible:outline-hidden select-none active:scale-[0.985] disabled:opacity-45 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
            aria-hidden="true"
          />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon
              size={
                resolvedSize === 'xs' || resolvedSize === 'icon-xs'
                  ? 13
                  : resolvedSize === 'sm' || resolvedSize === 'icon-sm'
                  ? 14
                  : resolvedSize === 'lg' || resolvedSize === 'icon-lg' || resolvedSize === 'touch' || resolvedSize === 'icon-touch'
                  ? 18
                  : 16
              }
              aria-hidden="true"
              className="shrink-0"
            />
          )}
          {children && <span>{children}</span>}
          {Icon && iconPosition === 'right' && (
            <Icon
              size={
                resolvedSize === 'xs' || resolvedSize === 'icon-xs'
                  ? 13
                  : resolvedSize === 'sm' || resolvedSize === 'icon-sm'
                  ? 14
                  : resolvedSize === 'lg' || resolvedSize === 'icon-lg' || resolvedSize === 'touch' || resolvedSize === 'icon-touch'
                  ? 18
                  : 16
              }
              aria-hidden="true"
              className="shrink-0"
            />
          )}
        </>
      )}
    </button>
  );
});
