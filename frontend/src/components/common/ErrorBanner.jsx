import React from 'react';
import { cn } from '../../utils/cn';

const toneMap = {
  error: {
    wrapper: 'ui-alert ui-alert-danger',
    icon: 'error_outline',
  },
  warning: {
    wrapper: 'ui-alert ui-alert-warning',
    icon: 'warning',
  },
  info: {
    wrapper: 'ui-alert ui-alert-info',
    icon: 'info',
  },
  success: {
    wrapper: 'ui-alert ui-alert-success',
    icon: 'check_circle',
  },
};

const ErrorBanner = ({ message, type = 'error', onClose, className }) => {
  if (!message) return null;

  const tone = toneMap[type] || toneMap.error;

  return (
    <div className={cn(tone.wrapper, className)} role="alert">
      <span className="material-icons mt-0.5 text-lg">{tone.icon}</span>
      <p className="min-w-0 flex-1 text-sm leading-6 opacity-90">{message}</p>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-1 opacity-80 transition hover:bg-black/5 hover:opacity-100"
          aria-label="Dismiss message"
        >
          <span className="material-icons text-lg">close</span>
        </button>
      ) : null}
    </div>
  );
};

export default ErrorBanner;
