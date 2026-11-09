export function TableWrapper({ children, className = '', containerClassName = '' }) {
  return (
    <div className={`w-full overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.07] bg-white dark:bg-[#151821] shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_12px_rgba(0,0,0,0.02)] transition-colors ${containerClassName}`}>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className={`w-full text-left border-collapse text-xs ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function TableHead({ children, className = '' }) {
  return (
    <thead className={`border-b border-black/[0.06] dark:border-white/[0.07] bg-[#FAFAFC] dark:bg-[#1B1F2A] text-[11px] font-semibold tracking-[0.02em] text-[#6E6E73] dark:text-[#98989D] select-none ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-black/[0.05] dark:divide-white/[0.06] text-[#1D1D1F] dark:text-[#E5E5EA] ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isClickable = false, ...props }) {
  return (
    <tr
      className={`transition-colors ${
        isClickable
          ? 'hover:bg-[#F5F5F7]/80 dark:hover:bg-white/[0.04] cursor-pointer'
          : 'hover:bg-[#F5F5F7]/50 dark:hover:bg-white/[0.025]'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', isHeader = false, align = 'left', ...props }) {
  const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

  if (isHeader) {
    return (
      <th className={`py-3 px-4 font-semibold ${alignClass} ${className}`} {...props}>
        {children}
      </th>
    );
  }
  return (
    <td className={`py-3.5 px-4 align-middle ${alignClass} ${className}`} {...props}>
      {children}
    </td>
  );
}
