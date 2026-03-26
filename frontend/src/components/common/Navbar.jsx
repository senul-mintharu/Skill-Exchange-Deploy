import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { getCurrentUser } from '../../services/authService';
import './Navbar.css';

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

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMobileOpen(false);
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

  const isPortal = variant === 'portal';

                    {/* Desktop Nav */}
                    <div className="navbar__right">
                        {!isPortal ? (
                            <>
                                <a href="#hero" className="navbar__link">Home</a>
                                <a href="#how-it-works" className="navbar__link">How It Works</a>
                                <a href="#services" className="navbar__link">Services</a>
                                <Link to="/login" className="navbar__link">Sign up / Log in</Link>
                                <Link to="/worker/create-profile" className="btn btn-sm btn-secondary navbar__btn-tasker">
                                    Become a Tasker
                                </Link>
                            </>
                        ) : (
                            <>
                                <NavLink to="/" end className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                                <NavLink to="/browse-requests" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>Find Work</NavLink>
                                <NavLink to="/my-quotations" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>My Quotations</NavLink>
                                <NavLink to="/my-jobs" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>My Jobs</NavLink>
                                <NavLink to="/my-requests" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>My Requests</NavLink>
                                <Link to="#" className="navbar__link">Messages</Link>
                                <div className="navbar__portal-actions">
                                    <button className="navbar__icon-btn">
                                <NavLink to={dashboardPath} end className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                                {role === 'WORKER' && <NavLink to="/worker/browse" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>Find Work</NavLink>}
                                {role === 'SEEKER' && <NavLink to="/seeker/browse-workers" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>Browse Workers</NavLink>}
                                {role === 'WORKER' && <NavLink to="/worker/my-quotations" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>My Quotations</NavLink>}
                                {role === 'SEEKER' && <NavLink to="/seeker/my-requests" className={({isActive}) => `navbar__link ${isActive ? 'active' : ''}`}>My Requests</NavLink>}
                                <div className="navbar__portal-actions" style={{ position: 'relative' }}>
                                    <button type="button" className="navbar__icon-btn">
                                        <span className="navbar__emoji">🔔</span>
                                    </button>
                                    <Link
                                        to="/account/profile"
                                        className="navbar__avatar"
                                        title={displayName}
                                    >
                                        {avatarText}
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

          <div className="navbar__right">
            {!isPortal ? (
              <>
                <a href="#hero" className="navbar__link">
                  Home
                </a>
                <a href="#how-it-works" className="navbar__link">
                  How It Works
                </a>
                <a href="#services" className="navbar__link">
                  Services
                </a>
                <Link to="/login" className="navbar__link">
                  Sign up / Log in
                </Link>
                <Link
                  to="/register"
                  className="btn btn-sm btn-secondary navbar__btn-tasker"
                >
                  Become a Tasker
                </Link>
              </>
            ) : (
              <>
                <NavLink
                  to={dashboardPath}
                  end
                  className={({ isActive }) =>
                    `navbar__link ${isActive ? 'active' : ''}`
                  }
                >
                  Dashboard
                </NavLink>
                {role === 'WORKER' && (
                  <NavLink
                    to="/browse-requests"
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? 'active' : ''}`
                    }
                  >
                    Find Work
                  </NavLink>
                )}
                {role === 'SEEKER' && (
                  <NavLink
                    to="/browse-workers"
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? 'active' : ''}`
                    }
                  >
                    Browse Workers
                  </NavLink>
                )}
                {role === 'WORKER' && (
                  <NavLink
                    to="/my-quotations"
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? 'active' : ''}`
                    }
                  >
                    My Quotations
                  </NavLink>
                )}
                {role === 'SEEKER' && (
                  <NavLink
                    to="/my-requests"
                    className={({ isActive }) =>
                      `navbar__link ${isActive ? 'active' : ''}`
                    }
                  >
                    My Requests
                  </NavLink>
                )}
                <div className="navbar__portal-actions" style={{ position: 'relative' }}>
                  <Link
                    to="/account/profile"
                    className="navbar__avatar"
                    title={displayName}
                    onClick={closeMobile}
                  >
                    {avatarText}
                  </Link>
                  <button
                    type="button"
                    className="navbar__link"
                    onClick={() => {
                      logout();
                      closeMobile();
                      navigate('/login', { replace: true });
                    }}
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--active' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            id="navbar-hamburger"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

            {/* Mobile Drawer */}
            <div className={`navbar__drawer ${mobileOpen ? 'navbar__drawer--open' : ''}`} id="mobile-drawer">
                <ul className="navbar__drawer-links">
                    {!isPortal ? (
                        <>
                            <li><a href="#hero" className="navbar__drawer-link" onClick={closeMobile}>Home</a></li>
                            <li><a href="#how-it-works" className="navbar__drawer-link" onClick={closeMobile}>How It Works</a></li>
                            <li><a href="#services" className="navbar__drawer-link" onClick={closeMobile}>Services</a></li>
                            <li><Link to="/login" className="navbar__drawer-link" onClick={closeMobile}>Sign up / Log in</Link></li>
                        </>
                    ) : (
                        <>
                            <li><NavLink to="/" end className={({isActive}) => `navbar__drawer-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>Dashboard</NavLink></li>
                            <li><NavLink to="/browse-requests" className={({isActive}) => `navbar__drawer-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>Find Work</NavLink></li>
                            <li><NavLink to="/my-quotations" className={({isActive}) => `navbar__drawer-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>My Quotations</NavLink></li>
                            <li><NavLink to="/my-jobs" className={({isActive}) => `navbar__drawer-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>My Jobs</NavLink></li>
                            <li><NavLink to="/my-requests" className={({isActive}) => `navbar__drawer-link ${isActive ? 'active' : ''}`} onClick={closeMobile}>My Requests</NavLink></li>
                            <li><Link to="#" className="navbar__drawer-link" onClick={closeMobile}>Messages</Link></li>
                        </>
                    )}
                </ul>
                <div className="navbar__drawer-actions">
                    {!isPortal ? (
                        <Link to="/worker/create-profile" className="btn btn-primary" onClick={closeMobile} style={{ width: '100%' }}>
                            Become a Tasker
                        </Link>
                    ) : (
                        <div className="navbar__drawer-profile">
                            <div className="navbar__avatar">{avatarText}</div>
                            <span className="navbar__username">{displayName}</span>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
