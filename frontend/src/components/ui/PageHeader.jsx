export function PageHeader({ title, actions, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5 pb-1">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[22px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.024em] leading-tight">
          {title}
        </h1>
        {children && <div className="pt-1.5">{children}</div>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
