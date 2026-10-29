export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-5 sm:px-6 py-4.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-brand-600 dark:bg-brand-500 shrink-0" aria-hidden="true" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 max-w-3xl pl-4.5">
            {subtitle}
          </p>
        )}
        {children && <div className="pl-4.5">{children}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
