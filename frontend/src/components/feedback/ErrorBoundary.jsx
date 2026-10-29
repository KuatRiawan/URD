import { Component } from 'react';
import { ArrowCounterClockwise, WarningCircle } from '@phosphor-icons/react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <WarningCircle size={24} weight="fill" className="text-[#C81E1E] shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-base font-bold">
                Terjadi kendala saat memuat tampilan halaman ini
              </h2>
              <p className="text-sm text-red-800">
                {this.state.error?.message ||
                  'Terjadi kesalahan tak terduga pada komponen antarmuka.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="min-h-11 inline-flex items-center gap-2 rounded-md bg-[#C81E1E] px-4 py-2 text-xs font-bold text-white hover:bg-[#a11616]"
                >
                  <ArrowCounterClockwise size={16} weight="bold" />
                  <span>Muat Ulang Bagian Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

