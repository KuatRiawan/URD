export function Card({ children, className = '', accent = null, ...props }) {
  const accentClass =
    accent === 'brand'
      ? 'border-t-2 border-t-brand-600'
      : accent === 'blue'
      ? 'border-t-2 border-t-blue-600'
      : accent === 'emerald'
      ? 'border-t-2 border-t-emerald-600'
      : accent === 'amber'
      ? 'border-t-2 border-t-amber-600'
      : '';

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-all duration-150 ${accentClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`border-b border-slate-100 dark:border-slate-800/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-snug ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 px-5 py-3.5 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

