export function Card({ children, className = '', accent: _accent = null, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-150 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div
      className={`border-b border-black/[0.05] dark:border-white/[0.06] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h3 className={`text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.015em] leading-snug ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription() {
  return null;
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
      className={`border-t border-black/[0.05] dark:border-white/[0.06] bg-[#FAFAFC] dark:bg-[#1B1F2A]/60 px-5 py-3.5 flex items-center justify-between gap-3 text-xs text-[#6E6E73] dark:text-[#98989D] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
