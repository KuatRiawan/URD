export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-white dark:bg-slate-900 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 rounded-full bg-[#C81E1E] shrink-0" aria-hidden="true" />
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-4">
            {subtitle}
          </p>
        )}
        {children && <div className="pl-4 pt-1">{children}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
