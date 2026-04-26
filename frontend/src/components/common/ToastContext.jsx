import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { cn } from '../../utils/cn';
import { setToastRef } from '../../utils/toastBridge';

/**
 * ──────────────────────────────────────────────────────────────────────────────
 * Toast notification system — context, provider, renderer, and hook.
 *
 * Wrap your app with <ToastProvider> (typically in App.js) and call
 * the hook from any component:
 *
 *   const toast = useToast();
 *   toast.success('Profile saved!');
 *   toast.error('Failed to load data.');
 *   toast.info('Your session will expire in 5 minutes.');
 *   toast.warning('Unsaved changes will be lost.');
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_DURATION_MS = 4500;
const MAX_VISIBLE = 5;

let toastId = 0;

// ─── Tone config ────────────────────────────────────────────────────────────

const toneConfig = {
  success: {
    icon: 'check_circle',
    classes: 'toast-tone-success',
  },
  error: {
    icon: 'error_outline',
    classes: 'toast-tone-error',
  },
  warning: {
    icon: 'warning_amber',
    classes: 'toast-tone-warning',
  },
  info: {
    icon: 'info',
    classes: 'toast-tone-info',
  },
};

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast].slice(-MAX_VISIBLE);
    case 'DISMISS':
      return state.map((t) =>
        t.id === action.id ? { ...t, leaving: true } : t,
      );
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

// ─── Single toast renderer ──────────────────────────────────────────────────

function ToastItem({ toast, onDismiss }) {
  const tone = toneConfig[toast.tone] || toneConfig.info;

  return (
    <div
      className={cn(
        'toast-item',
        tone.classes,
        toast.leaving && 'toast-leaving',
      )}
      role="status"
      aria-live="polite"
    >
      <span className="material-icons toast-icon" aria-hidden="true">
        {tone.icon}
      </span>

      <div className="toast-body">
        {toast.title ? <strong className="toast-title">{toast.title}</strong> : null}
        <p className="toast-message">{toast.message}</p>
      </div>

      <button
        type="button"
        className="toast-dismiss"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
      >
        <span className="material-icons text-base">close</span>
      </button>
    </div>
  );
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const dismiss = useCallback((id) => {
    dispatch({ type: 'DISMISS', id });
    // Remove from DOM after exit animation finishes
    setTimeout(() => dispatch({ type: 'REMOVE', id }), 320);
  }, []);

  const addToast = useCallback(
    (tone, message, options = {}) => {
      const id = ++toastId;
      const duration = options.duration ?? DEFAULT_DURATION_MS;

      dispatch({
        type: 'ADD',
        toast: {
          id,
          tone,
          message,
          title: options.title || null,
          leaving: false,
        },
      });

      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message, options) => addToast('success', message, options),
      error: (message, options) => addToast('error', message, options),
      warning: (message, options) => addToast('warning', message, options),
      info: (message, options) => addToast('info', message, options),
      dismiss,
    }),
    [addToast, dismiss],
  );

  // Register the toast API in the singleton bridge so non-React code
  // (e.g. the Axios interceptor in apiClient.js) can fire toasts.
  useEffect(() => {
    setToastRef(api);
    return () => setToastRef(null);
  }, [api]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* ── Toast container (portalled to bottom-right) ─────────────── */}
      {toasts.length > 0 ? (
        <div className="toast-container" aria-label="Notifications">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
