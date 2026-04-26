import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import { cn } from '../../utils/cn';

const Navbar = ({ variant = 'landing' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getCurrentUser();
  const role = user?.role;
  const displayName = user?.fullName || user?.email || 'User';
  const avatarText = (displayName || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  const dashboardPath =
    role === 'SEEKER' ? '/seeker/dashboard' :
    role === 'WORKER' ? '/worker/dashboard' :
    role === 'ADMIN' ? '/admin/dashboard' : '/';

  const isPortal = variant === 'portal';
  const showLightDesktop = !isPortal && !scrolled;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  const navLinkBase = cn(
    'relative rounded-full px-3 py-1.5 text-sm font-medium transition',
    isPortal
      ? 'text-white/80 hover:bg-white/10 hover:text-white'
      : showLightDesktop
        ? 'text-white/85 hover:bg-white/10 hover:text-white'
        : 'text-ink-muted hover:bg-brand-50 hover:text-brand-800'
  );

  const navLinkClass = ({ isActive }) =>
    cn(
      navLinkBase,
      isPortal && isActive && 'bg-white/18 text-white ring-1 ring-white/30 shadow-soft font-semibold',
      !isPortal && isActive && 'bg-brand-50 text-brand-800 font-semibold',
    );

  const mobilePortalNavLinkClass = ({ isActive }) => cn(
    'block rounded-2xl px-4 py-3 text-base font-medium transition',
    isActive
      ? 'bg-brand-50 text-brand-800 shadow-soft'
      : 'text-ink-soft hover:bg-brand-50 hover:text-brand-800',
  );

  return (
    <>
      <nav
        id="main-navbar"
        className={cn(
          'left-0 right-0 z-50 transition-all duration-300',
          isPortal ? 'sticky top-0 border-b border-white/10 bg-brand-gradient-strong shadow-brand' : 'fixed top-0',
          !isPortal && scrolled && 'border-b border-white/70 bg-white/90 shadow-soft backdrop-blur-xl',
          !isPortal && !scrolled && 'bg-transparent'
        )}
      >
        <div className="container flex min-w-0 items-center justify-between gap-2 py-2 sm:gap-3">
          <Link to={user ? dashboardPath : '/'} className="flex min-w-0 shrink items-center gap-2 sm:gap-3" onClick={closeMobile}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-brand sm:h-10 sm:w-10">
              <img src="/LankaFIX%20Logo.png" alt="LankaFIX logo" className="h-9 w-9 object-contain sm:h-10 sm:w-10" />
            </span>
            <span
              className={cn(
                'font-display text-lg font-extrabold tracking-snugger sm:text-2xl',
                showLightDesktop || isPortal ? 'text-white' : 'text-ink'
              )}
            >
              Lanka
              <span className={cn(
                'bg-clip-text text-transparent',
                showLightDesktop
                  ? 'bg-[linear-gradient(135deg,#fbbf24,#fde68a)]'
                  : 'bg-highlight-gradient'
              )}
              >
                FIX
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 lg:flex">
            {!isPortal ? (
              <>
                <a href="#hero" className={navLinkBase}>Home</a>
                <a href="#how-it-works" className={navLinkBase}>How It Works</a>
                <a href="#services" className={navLinkBase}>Services</a>
                <Link
                  to="/register"
                  className={cn(
                    'rounded-2xl border px-5 py-2 text-sm font-semibold transition',
                    showLightDesktop
                      ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                      : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                  )}
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className={cn(
                    'rounded-2xl border px-5 py-2 text-sm font-semibold transition',
                    showLightDesktop
                      ? 'border-white/45 bg-white/14 text-white hover:bg-white/24'
                      : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                  )}
                >
                  Sign in
                </Link>
                <Link
                  to="/create-profile"
                  className={cn(
                    'ui-button px-5 py-2 text-sm',
                    showLightDesktop
                      ? 'border-white/40 bg-white/10 text-white hover:bg-white hover:text-brand-800'
                      : 'border-brand-200 bg-white text-brand-800 hover:bg-brand-50'
                  )}
                >
                  Become a Tasker
                </Link>
              </>
            ) : (
              <>
                <NavLink to={dashboardPath} end className={navLinkClass}>Dashboard</NavLink>
                {role === 'ADMIN' ? <NavLink to="/admin/verification" className={navLinkClass}>Verifications</NavLink> : null}
                {role === 'ADMIN' ? <NavLink to="/admin/disputes" className={navLinkClass}>Disputes</NavLink> : null}
                {role === 'WORKER' ? <NavLink to="/browse-requests" className={navLinkClass}>Find Work</NavLink> : null}
                {role === 'SEEKER' ? <NavLink to="/browse-workers" className={navLinkClass}>Browse Workers</NavLink> : null}
                {role === 'WORKER' ? <NavLink to="/my-quotations" className={navLinkClass}>My Quotations</NavLink> : null}
                {role === 'SEEKER' ? <NavLink to="/my-requests" className={navLinkClass}>My Requests</NavLink> : null}
                <div className="ml-3 flex items-center gap-3">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <span role="img" aria-label="Notifications">🔔</span>
                  </button>
                  <Link
                    to="/account/profile"
                    title={displayName}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/70 bg-highlight-gradient text-sm font-bold text-brand-900 shadow-soft"
                  >
                    {avatarText}
                  </Link>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            id="navbar-hamburger"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileOpen((value) => !value)}
            className={cn(
                'flex h-11 w-11 flex-col items-center justify-center gap-1.5 rounded-2xl border lg:hidden',
                isPortal || showLightDesktop
                  ? 'border-white/25 bg-white/10 text-white'
                  : 'border-line bg-white text-ink'
            )}
          >
            <span className={cn('block h-0.5 w-5 rounded-full bg-current transition', mobileOpen && 'translate-y-2 rotate-45')} />
            <span className={cn('block h-0.5 w-5 rounded-full bg-current transition', mobileOpen && 'opacity-0')} />
            <span className={cn('block h-0.5 w-5 rounded-full bg-current transition', mobileOpen && '-translate-y-2 -rotate-45')} />
          </button>
        </div>
      </nav>

      <button
        type="button"
        aria-label="Close mobile navigation"
        onClick={closeMobile}
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/45 transition',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed right-0 top-0 z-50 flex h-screen w-[320px] max-w-[85vw] flex-col bg-white px-6 pb-8 pt-24 shadow-panel transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-1 flex-col gap-8">
          <div className="space-y-2">
            {!isPortal ? (
              <>
                <a href="#hero" className="block rounded-2xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-800" onClick={closeMobile}>Home</a>
                <a href="#how-it-works" className="block rounded-2xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-800" onClick={closeMobile}>How It Works</a>
                <a href="#services" className="block rounded-2xl px-4 py-3 text-base font-medium text-ink-soft hover:bg-brand-50 hover:text-brand-800" onClick={closeMobile}>Services</a>
                <Link
                  to="/register"
                  className="block rounded-2xl border border-slate-900 bg-slate-900 px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-slate-800"
                  onClick={closeMobile}
                >
                  Sign up
                </Link>
                <Link
                  to="/login"
                  className="block rounded-2xl border border-slate-300 bg-white px-4 py-3 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-50"
                  onClick={closeMobile}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                <NavLink to={dashboardPath} end className={mobilePortalNavLinkClass} onClick={closeMobile}>Dashboard</NavLink>
                {role === 'ADMIN' ? <NavLink to="/admin/verification" className={mobilePortalNavLinkClass} onClick={closeMobile}>Verifications</NavLink> : null}
                {role === 'ADMIN' ? <NavLink to="/admin/disputes" className={mobilePortalNavLinkClass} onClick={closeMobile}>Disputes</NavLink> : null}
                {role === 'WORKER' ? <NavLink to="/browse-requests" className={mobilePortalNavLinkClass} onClick={closeMobile}>Find Work</NavLink> : null}
                {role === 'SEEKER' ? <NavLink to="/browse-workers" className={mobilePortalNavLinkClass} onClick={closeMobile}>Browse Workers</NavLink> : null}
                {role === 'WORKER' ? <NavLink to="/my-quotations" className={mobilePortalNavLinkClass} onClick={closeMobile}>My Quotations</NavLink> : null}
                {role === 'SEEKER' ? <NavLink to="/my-requests" className={mobilePortalNavLinkClass} onClick={closeMobile}>My Requests</NavLink> : null}
              </>
            )}
          </div>

          <div className="mt-auto space-y-4">
            {!isPortal ? (
              <Link to="/create-profile" className="ui-button-primary flex w-full" onClick={closeMobile}>
                Become a Tasker
              </Link>
            ) : (
              <Link
                to="/account/profile"
                className="block rounded-card border border-line bg-surface-muted p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                onClick={closeMobile}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {avatarText}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-subtle">{role || 'Guest'}</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
