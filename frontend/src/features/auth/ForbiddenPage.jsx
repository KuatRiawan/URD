import { useNavigate } from 'react-router';
import { ArrowLeft, ShieldWarning } from '@phosphor-icons/react';
import { Button } from '../../components/ui/Button.jsx';

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03),0_12px_32px_-4px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400">
          <ShieldWarning size={26} weight="duotone" aria-hidden="true" />
        </div>
        <p className="mt-4 text-xs font-semibold text-[#C81E1E] dark:text-rose-400">
          403 • Pembatasan Otorisasi Peran
        </p>
        <h2 className="mt-1 text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.02em]">
          Akses Ditolak
        </h2>
        <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
          Akun Anda tidak memiliki otorisasi untuk membuka modul ini. Hubungi Administrator Sistem jika Anda memerlukan hak akses tambahan.
        </p>
        <div className="mt-6 flex justify-center">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={ArrowLeft}
            onClick={() => navigate('/app/dashboard', { replace: true })}
          >
            Kembali ke Dasbor
          </Button>
        </div>
      </div>
    </div>
  );
}
