import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle, Info, Warning, WarningCircle, X } from '@phosphor-icons/react';
import { NOTICE_TONES } from './Notice.jsx';
import { Button } from './Button.jsx';

const FeedbackContext = createContext(null);

function ConfirmDialog({ state, onResolve }) {
  if (!state) return null;

  const isDanger = state.tone === 'danger' || state.tone === 'error';
  const isWarning = state.tone === 'warning';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/35 dark:bg-black/65 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={() => onResolve(false)}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-black/[0.08] dark:border-white/[0.10] bg-white dark:bg-[#151821] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22),0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-3.5">
            <span
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? 'bg-[#C81E1E]/10 text-[#C81E1E] dark:text-rose-400'
                  : isWarning
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-[#F5F5F7] dark:bg-white/[0.07] text-[#1D1D1F] dark:text-[#F5F5F7]'
              }`}
            >
              {isDanger ? (
                <WarningCircle size={22} weight="fill" aria-hidden="true" />
              ) : isWarning ? (
                <Warning size={22} weight="fill" aria-hidden="true" />
              ) : (
                <Info size={22} weight="fill" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h3
                id="confirm-dialog-title"
                className="text-[15px] font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tracking-[-0.015em]"
              >
                {state.title || 'Konfirmasi Tindakan'}
              </h3>
              <p className="mt-1.5 text-xs text-[#6E6E73] dark:text-[#98989D] leading-relaxed whitespace-pre-line">
                {state.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3.5 bg-[#F5F5F7]/75 dark:bg-[#11141C] border-t border-black/[0.06] dark:border-white/[0.08]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onResolve(false)}
          >
            {state.cancelLabel || 'Batal'}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            size="sm"
            onClick={() => onResolve(true)}
          >
            {state.confirmLabel || 'Ya, Lanjutkan'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ToastViewport({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-5 right-4 left-4 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-2.5 w-auto sm:w-full sm:max-w-md pointer-events-none"
    >
      {toasts.map((item) => {
        const t = NOTICE_TONES[item.tone] || NOTICE_TONES.info;
        const Icon = t.Icon || CheckCircle;
        return (
          <div
            key={item.id}
            role={item.tone === 'error' || item.tone === 'danger' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-2xl animate-pop-in ${t.box}`}
          >
            <Icon size={20} weight="fill" className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {item.title && <p className="font-semibold text-xs tracking-tight">{item.title}</p>}
              <p className="text-xs font-medium leading-snug">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Tutup notifikasi"
              className="-my-1 -mr-1 h-6 w-6 inline-flex items-center justify-center rounded-lg opacity-70 hover:opacity-100 cursor-pointer transition-opacity"
            >
              <X size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function FeedbackProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const confirmResolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const normalized =
      typeof options === 'string'
        ? { title: 'Konfirmasi Tindakan', message: options }
        : options || {};

    return new Promise((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState(normalized);
    });
  }, []);

  const handleConfirmResolve = useCallback((accepted) => {
    const resolver = confirmResolverRef.current;
    confirmResolverRef.current = null;
    setConfirmState(null);
    if (resolver) {
      resolver(Boolean(accepted));
    }
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (options) => {
      const normalized =
        typeof options === 'string'
          ? { tone: 'info', message: options }
          : options || {};
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = normalized.duration ?? 4000;

      setToasts((prev) => [...prev.slice(-3), { id, ...normalized }]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
      return id;
    },
    [dismissToast]
  );

  const toast = useCallback(
    (message, tone = 'success', title) => {
      if (typeof message === 'object' && message !== null) {
        return notify(message);
      }
      return notify({ message, tone, title });
    },
    [notify]
  );

  const value = useMemo(
    () => ({
      confirm,
      notify,
      toast
    }),
    [confirm, notify, toast]
  );

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ConfirmDialog state={confirmState} onResolve={handleConfirmResolve} />
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </FeedbackContext.Provider>
  );
}

const FALLBACK = {
  confirm: async (opts) => {
    const msg = typeof opts === 'string' ? opts : opts?.message || 'Lanjutkan tindakan ini?';
    return typeof window !== 'undefined' && typeof window.confirm === 'function'
      ? window.confirm(msg)
      : true;
  },
  notify: () => {},
  toast: () => {}
};

export function useFeedback() {
  return useContext(FeedbackContext) || FALLBACK;
}

export function useConfirm() {
  return useFeedback().confirm;
}

export function useToast() {
  return useFeedback().toast;
}
