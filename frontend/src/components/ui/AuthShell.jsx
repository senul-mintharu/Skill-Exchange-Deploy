import React from 'react';
import { cn } from '../../utils/cn';

const AuthShell = ({ title, subtitle, children, footer, className }) => (
  <div className="min-h-screen bg-page-gradient px-4 py-24">
    <div className="container flex justify-center">
      <div className={cn('relative w-full max-w-lg overflow-hidden rounded-panel border border-white/40 bg-white/95 shadow-panel backdrop-blur', className)}>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-brand-gradient" />
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative p-6 sm:p-8">
          <div className="mb-8 text-center">
            <span className="ui-eyebrow">Skill Exchange</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold tracking-snugger text-ink">{title}</h1>
            {subtitle ? <p className="mt-3 text-sm leading-7 text-ink-muted">{subtitle}</p> : null}
          </div>
          {children}
          {footer ? <div className="mt-8 border-t border-line pt-6 text-center">{footer}</div> : null}
        </div>
      </div>
    </div>
  </div>
);

export default AuthShell;
