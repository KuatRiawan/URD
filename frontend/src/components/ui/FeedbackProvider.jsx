import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Question, Trash, Warning } from '@phosphor-icons/react';
import { Modal } from './Modal.jsx';
import { Notice } from './Notice.jsx';

const FeedbackContext = createContext(null);

const CONFIRM_TONES = {
  danger: {
    Icon: Trash,
    ring: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 text-white'
  },
  warning: {
    Icon: Warning,
    ring: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700 text-white'
  },
  default: {
    Icon: Question,
    ring: 'bg-slate-100 text-slate-700',
    button: 'bg-slate-900 hover:bg-slate-800 text-white'
  }
};

function ConfirmDialog({ options, onResolve }) {
  const tone = CONFIRM_TONES[options.tone] || CONFIRM_TONES.default;
  const Icon = tone.Icon;
  return (
    <Modal
      open
      size="sm"
      title={options.title || 'Konfirmasi Tindakan'}
      onClose={() => onResolve(false)}
      footer={
        <>
          <button
            type="button"
            onClick={() => onResolve(false)}
            className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            {options.cancelLabel || 'Batal'}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => onResolve(true)}
            className={`h-10 rounded-lg px-4 text-sm font-bold shadow-sm ${tone.button}`}
          >
            {options.confirmLabel || 'Ya, Lanjutkan'}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span
          className={`h-11 w-11 shrink-0 inline-flex items-center justify-center rounded-full ${tone.ring}`}
        >
          <Icon size={22} weight="duotone" aria-hidden="true" />
        </span>
        <div className="text-sm text-slate-600 leading-relaxed pt-1">{options.message}</div>
      </div>
    </Modal>
  );
}

// Penyedia dialog konfirmasi dan toast global agar seluruh popup konsisten.
export function FeedbackProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolverRef = useRef(null);
  const idRef = useRef(0);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setConfirmState(typeof options === 'string' ? { message: options } : options);
      }),
    []
  );

  const resolveConfirm = useCallback((value) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setConfirmState(null);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, tone = 'success', title) => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev.slice(-3), { id, message, tone, title }]);
      window.setTimeout(() => dismissToast(id), tone === 'error' ? 7000 : 4500);
    },
    [dismissToast]
  );

  useEffect(
    () => () => {
      resolverRef.current?.(false);
    },
    []
  );

  const value = useMemo(() => ({ confirm, toast }), [confirm, toast]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {confirmState && <ConfirmDialog options={confirmState} onResolve={resolveConfirm} />}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-20 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto animate-toast-in shadow-pop rounded-xl">
            <Notice tone={t.tone} title={t.title} onClose={() => dismissToast(t.id)}>
              {t.message}
            </Notice>
          </div>
        ))}
      </div>
    </FeedbackContext.Provider>
  );
}

// Fallback aman bila komponen dirender di luar provider (misalnya pada pengujian).
const FALLBACK = {
  confirm: () => Promise.resolve(false),
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

