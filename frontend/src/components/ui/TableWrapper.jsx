export function TableWrapper({ children, className = '', containerClassName = '' }) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs transition-colors ${containerClassName}`}>
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
    <thead className={`border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '' }) {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-200 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', isClickable = false, ...props }) {
  return (
    <tr
      className={`transition-colors ${
        isClickable
          ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/80 cursor-pointer'
          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
      } ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '', isHeader = false, ...props }) {
  if (isHeader) {
    return (
      <th className={`px-4 py-3.5 font-bold ${className}`} {...props}>
        {children}
      </th>
    );
  }
  return (
    <td className={`px-4 py-3.5 align-middle ${className}`} {...props}>
      {children}
    </td>
  );
}

