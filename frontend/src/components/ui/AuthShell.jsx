import React from 'react';
import { cn } from '../../utils/cn';

const AuthShell = ({ title, subtitle, children, footer, className }) => (
  <div className="relative min-h-screen overflow-x-clip overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
    <div className="absolute inset-0">
      <img
        src="/Logn_background_i_1.webp"
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-slate-950/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_52%)]" />
    </div>

    <div className="relative z-10 container flex min-h-[calc(100dvh-4rem)] items-center justify-center py-4 sm:min-h-[calc(100vh-5rem)] sm:py-8">
      <div className={cn('w-full max-w-lg rounded-[28px] bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.45)] sm:rounded-[32px] sm:p-8', className)}>
        <div className="mb-8 text-center">
          <img
            src="/LankaFIX%20Logo.png"
            alt="LankaFIX logo"
            className="mx-auto h-16 w-auto rounded-xl object-contain"
          />
          <h1 className="mt-4 font-display text-2xl font-extrabold tracking-snugger text-ink sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-3 text-sm leading-7 text-ink-muted">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="mt-7 text-center">{footer}</div> : null}
      </div>
    </div>
  </div>
);

export default AuthShell;
