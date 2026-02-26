import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ variant = 'landing' }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const closeMobile = () => setMobileOpen(false);

    const isPortal = variant === 'portal';

    return (
        <>
            <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''} ${isPortal ? 'navbar--portal' : ''}`} id="main-navbar">
                <div className="navbar__inner container">
                    {/* Logo */}
                    <Link to="/" className="navbar__logo" onClick={closeMobile}>
                        <span className="navbar__logo-icon">🔧</span>
                        <span className="navbar__logo-text">
                            Lanka<span className="navbar__logo-accent">FIX</span>
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="navbar__right">
                        {!isPortal ? (
                            <>
                                <a href="#hero" className="navbar__link">Home</a>
                                <a href="#how-it-works" className="navbar__link">How It Works</a>
                                <a href="#services" className="navbar__link">Services</a>
                                <Link to="/login" className="navbar__link">Sign up / Log in</Link>
                                <Link to="/register" className="btn btn-sm btn-secondary navbar__btn-tasker">
                                    Become a Tasker
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/" className={`navbar__link ${isActive('/')}`}>Dashboard</Link>
                                <Link to="/browse-requests" className={`navbar__link ${isActive('/browse-requests')}`}>Find Work</Link>
                                <Link to="/my-requests" className={`navbar__link ${isActive('/my-requests')}`}>My Requests</Link>
                                <Link to="#" className="navbar__link">Messages</Link>
                                <div className="navbar__portal-actions">
                                    <button className="navbar__icon-btn">
                                        <span className="navbar__emoji">🔔</span>
                                    </button>
                                    <div className="navbar__avatar">U</div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Hamburger */}
                    <button
                        className={`navbar__hamburger ${mobileOpen ? 'navbar__hamburger--active' : ''}`}
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle navigation menu"
                        id="navbar-hamburger"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>

            {/* Mobile Overlay */}
            <div
                className={`navbar__overlay ${mobileOpen ? 'navbar__overlay--visible' : ''}`}
                onClick={closeMobile}
            />

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
                            <li><Link to="/" className="navbar__drawer-link" onClick={closeMobile}>Dashboard</Link></li>
                            <li><Link to="/browse-requests" className="navbar__drawer-link" onClick={closeMobile}>Find Work</Link></li>
                            <li><Link to="/my-requests" className="navbar__drawer-link" onClick={closeMobile}>My Requests</Link></li>
                            <li><Link to="#" className="navbar__drawer-link" onClick={closeMobile}>Messages</Link></li>
                        </>
                    )}
                </ul>
                <div className="navbar__drawer-actions">
                    {!isPortal ? (
                        <Link to="/register" className="btn btn-primary" onClick={closeMobile} style={{ width: '100%' }}>
                            Become a Tasker
                        </Link>
                    ) : (
                        <div className="navbar__drawer-profile">
                            <div className="navbar__avatar">U</div>
                            <span className="navbar__username">User</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;
