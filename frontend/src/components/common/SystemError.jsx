import React, { useCallback, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';

/**
 * SystemError — Non-intrusive card for displaying system-level errors.
 *
 * Use this for API failures, network errors, or unexpected server issues.
 * For inline form validation or short status messages, use `ErrorBanner` instead.
 *
 * @param {string}     title           - Short error headline.
 * @param {string}     message         - Explanatory detail text.
 * @param {string}     icon            - Material icon name (default: 'cloud_off').
 * @param {string}     tone            - 'error' | 'warning' | 'info'. Controls color palette.
 * @param {Function}   onRetry         - Optional callback; renders a "Try Again" button.
 * @param {string}     retryLabel      - Custom label for the retry button.
 * @param {Function}   onDismiss       - If provided, renders a dismiss "×" and calls this on click.
 * @param {number}     autoDismissMs   - If > 0, auto-dismisses after this many milliseconds.
 * @param {ReactNode}  children        - Optional extra content rendered below the message.
 * @param {boolean}    compact         - If true, uses minimal padding (for nested containers).
 * @param {string}     className       - Extra className for the outer wrapper.
 *
 * Usage:
 *   <SystemError
 *     title="Something went wrong"
 *     message="We couldn't load your dashboard. Check your connection and try again."
 *     onRetry={handleReload}
 *   />
 *
 *   <SystemError
 *     tone="warning"
 *     title="Service temporarily unavailable"
 *     message="AI description generation is down. You can still fill in the description manually."
 *     onDismiss={() => setShowWarning(false)}
 *     autoDismissMs={8000}
 *   />
 */

const toneStyles = {
  error: {
    card: 'system-error-tone-error',
    iconWrap: 'bg-red-100 text-red-700',
    retryBtn: 'ui-button-primary',
  },
  warning: {
    card: 'system-error-tone-warning',
    iconWrap: 'bg-amber-100 text-amber-700',
    retryBtn: 'ui-button-accent',
  },
  info: {
    card: 'system-error-tone-info',
    iconWrap: 'bg-blue-100 text-blue-700',
    retryBtn: 'ui-button-secondary',
  },
};

const toneIcons = {
  error: 'cloud_off',
  warning: 'warning_amber',
  info: 'info',
};

const SystemError = ({
  title,
  message,
  icon,
  tone = 'error',
  onRetry,
  retryLabel = 'Try Again',
  onDismiss,
  autoDismissMs = 0,
  children,
  compact = false,
  className,
}) => {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    if (autoDismissMs > 0) {
      const timer = setTimeout(handleDismiss, autoDismissMs);
      return () => clearTimeout(timer);
    }
  }, [autoDismissMs, handleDismiss]);

  if (dismissed) return null;
  if (!title && !message) return null;

  const s = toneStyles[tone] || toneStyles.error;
  const resolvedIcon = icon || toneIcons[tone] || toneIcons.error;

  return (
    <div
      id="system-error"
      className={cn(
        'system-error-root',
        s.card,
        compact ? 'system-error-compact' : 'system-error-card',
        className,
      )}
      role="alert"
      aria-live="polite"
    >
      {/* ── Left icon ──────────────────────────────────────────── */}
      <div className={cn('system-error-icon-wrap', s.iconWrap)}>
        <span className="material-icons text-xl" aria-hidden="true">
          {resolvedIcon}
        </span>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="system-error-body">
        {title ? <h3 className="system-error-title">{title}</h3> : null}
        {message ? <p className="system-error-message">{message}</p> : null}
        {children ? <div className="system-error-extra">{children}</div> : null}

        {onRetry ? (
          <div className="system-error-actions">
            <button
              type="button"
              className={cn(s.retryBtn, 'text-sm')}
              onClick={onRetry}
            >
              <span className="material-icons text-base">refresh</span>
              {retryLabel}
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Dismiss button ─────────────────────────────────────── */}
      {onDismiss ? (
        <button
          type="button"
          onClick={handleDismiss}
          className="system-error-dismiss"
          aria-label="Dismiss error"
        >
          <span className="material-icons text-lg">close</span>
        </button>
      ) : null}
    </div>
  );
};

export default SystemError;
