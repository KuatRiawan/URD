import { Component } from 'react';
import { ArrowsClockwise, House, WarningOctagon } from '@phosphor-icons/react';
import { Button } from '../ui/Button.jsx';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[URD ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.assign('/app/dashboard');
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-[#F5F5F7] dark:bg-[#0B0D11] px-4 py-12">
          <div className="w-full max-w-lg rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#151821] p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-4px_rgba(0,0,0,0.06)] text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400">
              <WarningOctagon size={26} weight="fill" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.02em]">
              Terjadi Gangguan Tampilan Aplikasi
            </h1>
            <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed">
              Halaman mengalami kendala teknis saat memuat komponen. Data pekerjaan Anda di server tetap aman.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 max-h-28 overflow-auto rounded-xl bg-[#F5F5F7] dark:bg-[#11141C] border border-black/[0.06] dark:border-white/[0.07] p-3 text-left text-[11px] text-[#6E6E73] dark:text-[#98989D] font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <Button
                type="button"
                variant="primary"
                onClick={this.handleReload}
                icon={ArrowsClockwise}
              >
                Muat Ulang Halaman
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={this.handleGoDashboard}
                icon={House}
              >
                Kembali ke Dasbor
              </Button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
