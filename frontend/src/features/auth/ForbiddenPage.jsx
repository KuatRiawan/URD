import { Link } from 'react-router';
import { ShieldWarning } from '@phosphor-icons/react';
import { useAuth } from '../../app/providers/AuthProvider.jsx';
import { ROLE_LABELS } from '../../lib/utils/format.js';

export function ForbiddenPage() {
  const { user } = useAuth();

  return (
    <div className="rounded-xl border border-red-300 dark:border-red-900/50 bg-white dark:bg-slate-900 p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
      <ShieldWarning size={40} weight="bold" className="mx-auto text-[#C81E1E]" aria-hidden="true" />
      <h1 className="mt-3 text-lg font-extrabold text-slate-900 dark:text-slate-100">Akses Ditolak</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Peran akun Anda saat ini (<strong className="text-slate-900 dark:text-slate-200">{ROLE_LABELS[user?.role] || user?.role}</strong>) tidak memiliki izin untuk membuka halaman atau menjalankan operasi tersebut.
      </p>
      <div className="mt-5">
        <Link
          to="/app/dashboard"
          className="min-h-11 inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700"
        >
          Kembali ke Dasbor Operasional
        </Link>
      </div>
    </div>
  );
}

