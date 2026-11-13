export function PageHeader({ title, subtitle, actions, children }) {
  const description = subtitle || null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pt-0.5 pb-1">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[22px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.024em] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#6E6E73] dark:text-[#98989D]">
            {description}
          </p>
        )}
        {children && <div className="pt-1.5">{children}</div>}
      </div>
      {actions && (
        <div className="urd-page-actions flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center sm:pt-0.5">
          {actions}
        </div>
      )}
    </div>
  );
}
