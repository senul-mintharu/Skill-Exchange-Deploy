import React from 'react';
import { cn } from '../../utils/cn';

const toneClasses = {
  info: 'ui-alert ui-alert-info',
  success: 'ui-alert ui-alert-success',
  warning: 'ui-alert ui-alert-warning',
  danger: 'ui-alert ui-alert-danger',
};

const statCardClasses = {
  brand: {
    card: 'border-brand-200 bg-white shadow-card',
    iconWrap: 'bg-brand-gradient text-white shadow-brand',
    value: 'text-brand-900',
    accent: 'from-brand-500/20 via-brand-100/50 to-transparent',
  },
  info: {
    card: 'border-blue-200 bg-white shadow-card',
    iconWrap: 'bg-blue-600 text-white',
    value: 'text-blue-900',
    accent: 'from-blue-400/20 via-blue-50/70 to-transparent',
  },
  success: {
    card: 'border-green-200 bg-white shadow-card',
    iconWrap: 'bg-green-600 text-white',
    value: 'text-green-900',
    accent: 'from-green-400/20 via-green-50/70 to-transparent',
  },
  warning: {
    card: 'border-amber-200 bg-white shadow-card',
    iconWrap: 'bg-amber-500 text-white',
    value: 'text-amber-900',
    accent: 'from-amber-300/20 via-amber-50/80 to-transparent',
  },
  danger: {
    card: 'border-red-200 bg-white shadow-card',
    iconWrap: 'bg-red-600 text-white',
    value: 'text-red-900',
    accent: 'from-red-300/20 via-red-50/80 to-transparent',
  },
  neutral: {
    card: 'border-line bg-white shadow-card',
    iconWrap: 'bg-slate-800 text-white',
    value: 'text-ink',
    accent: 'from-slate-300/20 via-slate-50/80 to-transparent',
  },
};

const pillClasses = {
  success: 'ui-status-pill ui-status-success',
  warning: 'ui-status-pill ui-status-warning',
  danger: 'ui-status-pill ui-status-danger',
  info: 'ui-status-pill ui-status-info',
  neutral: 'ui-status-pill ui-status-neutral',
};

export const PageIntro = ({ eyebrow, title, subtitle, light = false, actions, className }) => (
  <div className={cn('ui-page-header', className)}>
    {eyebrow ? <span className="ui-eyebrow">{eyebrow}</span> : null}
    <div className="flex min-w-0 max-w-full flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 space-y-3">
        <h1 className={light ? 'ui-title-light' : 'ui-title'}>{title}</h1>
        {subtitle ? (
          <p className={light ? 'ui-subtitle-light' : 'ui-subtitle'}>{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">{actions}</div> : null}
    </div>
  </div>
);

export const StatCard = ({
  label,
  value,
  icon,
  description,
  tone = 'brand',
  compact = false,
  className,
}) => {
  const styles = statCardClasses[tone] || statCardClasses.brand;

  return (
    <section
      className={cn(
        compact
          ? 'relative overflow-hidden rounded-card border px-4 py-4 md:px-5 md:py-5'
          : 'relative overflow-hidden rounded-panel border px-5 py-5 md:px-6 md:py-6',
        styles.card,
        className,
      )}
      aria-label={label}
    >
      <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br', styles.accent)} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="ui-stat-label">{label}</p>
          <p className={cn(compact ? 'mt-2 text-2xl font-extrabold tracking-tight md:text-3xl' : 'mt-3 text-3xl font-extrabold tracking-tight md:text-4xl', styles.value)}>
            {value}
          </p>
          {description ? (
            <p className={cn(compact ? 'mt-1 max-w-[22rem] text-xs font-medium leading-5 text-ink-muted sm:text-sm' : 'mt-2 max-w-[22rem] text-sm font-medium leading-6 text-ink-muted')}>
              {description}
            </p>
          ) : null}
        </div>
        {icon ? (
          <span
            className={cn(
              compact
                ? 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[1.1rem]'
                : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[1.4rem]',
              styles.iconWrap,
            )}
            aria-hidden="true"
          >
            <span className={cn('material-icons', compact ? 'text-[1.1rem]' : 'text-[1.35rem]')}>{icon}</span>
          </span>
        ) : null}
      </div>
    </section>
  );
};

export const AlertPanel = ({ tone = 'info', icon, title, children, action, onClose, className }) => (
  <div className={cn(toneClasses[tone] || toneClasses.info, className)} role="alert">
    <span className="material-icons mt-0.5 text-lg">{icon || 'info'}</span>
    <div className="min-w-0 flex-1">
      {title ? <h3 className="text-base font-bold text-current">{title}</h3> : null}
      {children ? <div className="mt-1 text-sm leading-6 opacity-90">{children}</div> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
    {onClose ? (
      <button
        type="button"
        onClick={onClose}
        className="rounded-xl p-1 opacity-80 transition hover:bg-black/5 hover:opacity-100"
        aria-label="Close message"
      >
        <span className="material-icons text-lg">close</span>
      </button>
    ) : null}
  </div>
);

export const StatusPill = ({ tone = 'neutral', icon, children, className }) => (
  <span className={cn(pillClasses[tone] || pillClasses.neutral, className)}>
    {icon ? <span className="material-icons text-base">{icon}</span> : null}
    {children}
  </span>
);

export const LoadingPanel = ({ message = 'Loading...', className }) => (
  <div className={cn('ui-loading-state', className)}>
    <div className="ui-spinner" aria-hidden="true" />
    <p className="text-sm font-medium text-ink-muted">{message}</p>
  </div>
);

export const EmptyState = ({ icon = 'inbox', title, text, action, className }) => (
  <div className={cn('ui-empty-state', className)}>
    <div className="ui-empty-icon">
      <span className="material-icons text-4xl">{icon}</span>
    </div>
    <h2 className="ui-empty-title">{title}</h2>
    {text ? <p className="ui-empty-text">{text}</p> : null}
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export const SectionCard = ({ className, children }) => (
  <section className={cn('ui-section', className)}>{children}</section>
);

export const FieldHint = ({ children }) => (
  <p className="ui-helper">{children}</p>
);
