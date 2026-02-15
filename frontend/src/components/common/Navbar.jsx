import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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

    return (
        <>
            <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
                <div className="navbar__inner container">
                    {/* Logo */}
                    <Link to="/" className="navbar__logo" onClick={closeMobile}>
                        <span className="navbar__logo-icon">🔧</span>
                        <span className="navbar__logo-text">
                            Lanka<span className="navbar__logo-accent">FIX</span>
                        </span>
                    </Link>

                    {/* Desktop Nav — matches the photo layout */}
                    <div className="navbar__right">
                        <a href="#hero" className="navbar__link">Home</a>
                        <a href="#how-it-works" className="navbar__link">How It Works</a>
                        <a href="#services" className="navbar__link">Services</a>
                        <Link to="/login" className="navbar__link">Sign up / Log in</Link>
                        <Link to="/register" className="btn btn-sm btn-secondary navbar__btn-tasker">
                            Become a Tasker
                        </Link>
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
                    <li><a href="#hero" className="navbar__drawer-link" onClick={closeMobile}>Home</a></li>
                    <li><a href="#how-it-works" className="navbar__drawer-link" onClick={closeMobile}>How It Works</a></li>
                    <li><a href="#services" className="navbar__drawer-link" onClick={closeMobile}>Services</a></li>
                    <li><Link to="/login" className="navbar__drawer-link" onClick={closeMobile}>Sign up / Log in</Link></li>
                </ul>
                <div className="navbar__drawer-actions">
                    <Link to="/register" className="btn btn-primary" onClick={closeMobile} style={{ width: '100%' }}>
                        Become a Tasker
                    </Link>
                </div>
            </div>
        </>
    );
};

export default Navbar;
