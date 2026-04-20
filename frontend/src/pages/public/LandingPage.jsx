import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getCurrentUser, getDefaultRouteForRole, isAuthenticated } from '../../services/authService';
import './LandingPage.css';

/* ─── Icon Components (inline SVGs) ─── */
const Icons = {
    Post: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    Compare: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
        </svg>
    ),
    Done: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    Plumbing: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 12l-1.172-1.172a4 4 0 0 0-2.829-1.17H4.5V6.5l3.329-.004a4 4 0 0 0 2.829-1.168L12 4" /><path d="M14.5 2.5 17 5l-2.5 2.5" /><path d="M19.5 7.5 22 10l-2.5 2.5" />
        </svg>
    ),
    Electrical: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    ),
    Painting: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
    ),
    Cleaning: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 22h18" /><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" /><path d="M14 6h.01" /><path d="M10 6h.01" /><path d="M14 10h.01" /><path d="M10 10h.01" />
        </svg>
    ),
    Moving: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    Carpentry: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    Gardening: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" /><path d="M10 20c5.5-2.5.8-6.4 3-10" /><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2-1.6-2-2.7 0-1.4 1.2-2.1 2.3-2.1 1.4 0 2 .9 2.2 1.4z" /><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.1 1.3-3.6-.8-.5-2.2 0-3.2.5-.6.3-1 .6-1.3 .5z" />
        </svg>
    ),
    Shield: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
        </svg>
    ),
    ArrowRight: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
    ),
};

/* ─── Data ─── */
const howItWorks = [
    { icon: <Icons.Post />, step: '01', title: 'Post Your Request', description: 'Describe the job you need done — from a leaky tap to a full house renovation. It takes just 30 seconds.' },
    { icon: <Icons.Compare />, step: '02', title: 'Compare Quotes', description: 'Receive competitive quotes from verified local workers. Compare ratings, prices, and reviews side by side.' },
    { icon: <Icons.Done />, step: '03', title: 'Get It Done', description: 'Choose your worker, get the job done, and pay securely. Rate your experience to help the community.' },
];

const services = [
    { icon: <Icons.Plumbing />, name: 'Plumbing', count: '120+ taskers' },
    { icon: <Icons.Electrical />, name: 'Electrical', count: '95+ taskers' },
    { icon: <Icons.Painting />, name: 'Painting', count: '80+ taskers' },
    { icon: <Icons.Cleaning />, name: 'Cleaning', count: '200+ taskers' },
    { icon: <Icons.Moving />, name: 'Moving', count: '60+ taskers' },
    { icon: <Icons.Carpentry />, name: 'Carpentry', count: '75+ taskers' },
    { icon: <Icons.Gardening />, name: 'Gardening', count: '50+ taskers' },
    { icon: <Icons.Shield />, name: 'Home Security', count: '40+ taskers' },
];

const stats = [
    { value: '5,000+', label: 'Verified Taskers' },
    { value: '25,000+', label: 'Jobs Completed' },
    { value: '4.8★', label: 'Average Rating' },
    { value: '24/7', label: 'Customer Support' },
];

/* ─── Component ─── */
const LandingPage = () => {
    if (isAuthenticated()) {
        const user = getCurrentUser();
        return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
    }

    return (
        <div className="landing" id="landing-page">
            {/* ══════ HERO ══════ */}
            <section className="hero" id="hero">
                <div className="hero__bg">
                    <div className="hero__gradient" />
                    <div className="hero__pattern" />
                </div>

                <div className="hero__content container">
                    <span className="section-label">🇱🇰 Sri Lanka's #1 Service Marketplace</span>
                    <h1 className="hero__title">
                        Find Trusted Local
                        <br />
                        <span className="hero__title-accent">Workers Near You</span>
                    </h1>
                    <p className="hero__subtitle">
                        From plumbing to painting — connect with verified, skilled professionals
                        across Sri Lanka. Get quotes, compare prices, and hire with confidence.
                    </p>
                    <div className="hero__actions">
                        <Link to="/register" className="btn btn-lg btn-accent">
                            Post a Request <Icons.ArrowRight />
                        </Link>
                        <Link to="/register" className="btn btn-lg btn-white">
                            Find Work
                        </Link>
                    </div>

                    <div className="hero__stats-mini">
                        {stats.slice(0, 3).map((stat, i) => (
                            <div className="hero__stat-mini" key={i}>
                                <strong>{stat.value}</strong>
                                <span>{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero__wave">
                    <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
                        <path d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120Z" fill="var(--white)" />
                    </svg>
                </div>
            </section>

            {/* ══════ HOW IT WORKS ══════ */}
            <section className="how-it-works section" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Simple Process</span>
                        <h2>How Lanka<span style={{ color: 'var(--primary)' }}>FIX</span> Works</h2>
                        <p>Get your job done in three easy steps. It's fast, transparent, and secure.</p>
                    </div>

                    <div className="hiw__grid">
                        {howItWorks.map((item, index) => (
                            <div className="hiw__card" key={index}>
                                <div className="hiw__step-badge">{item.step}</div>
                                <div className="hiw__icon">{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ SERVICES ══════ */}
            <section className="services section" id="services">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Browse Services</span>
                        <h2>Our Services</h2>
                        <p>Whatever you need fixed, built, or cleaned — we've got the right tasker for you.</p>
                    </div>

                    <div className="services__grid">
                        {services.map((svc, index) => (
                            <div className="services__card" key={index}>
                                <div className="services__icon">{svc.icon}</div>
                                <h3>{svc.name}</h3>
                                <span className="services__count">{svc.count}</span>
                                <div className="services__arrow">→</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ TRUST SIGNALS ══════ */}
            <section className="trust section">
                <div className="container">
                    <div className="trust__bar">
                        {stats.map((stat, i) => (
                            <div className="trust__item" key={i}>
                                <div className="trust__value">{stat.value}</div>
                                <div className="trust__label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══════ BECOME A TASKER ══════ */}
            <section className="tasker section" id="become-tasker">
                <div className="container">
                    <div className="tasker__box">
                        <div className="tasker__content">
                            <span className="section-label" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.95)' }}>
                                Join Our Network
                            </span>
                            <h2>Become a Tasker</h2>
                            <p>
                                Earn money on your own schedule. Set your own rates, choose your
                                jobs, and get paid securely. Join thousands of skilled workers
                                across Sri Lanka already growing their business with LankaFIX.
                            </p>
                            <ul className="tasker__perks">
                                <li>✓ Set your own prices & work hours</li>
                                <li>✓ Get matched with jobs near you</li>
                                <li>✓ Secure payments after every job</li>
                                <li>✓ Build your reputation with reviews</li>
                            </ul>
                            <Link to="/register" className="btn btn-lg btn-accent">
                                Sign Up as Tasker <Icons.ArrowRight />
                            </Link>
                        </div>
                        <div className="tasker__visual">
                            <div className="tasker__card-preview">
                                <div className="tasker__card-avatar">🧑‍🔧</div>
                                <div className="tasker__card-info">
                                    <strong>Top-Rated Tasker</strong>
                                    <span>⭐ 4.9 • 120+ jobs done</span>
                                    <span className="tasker__card-badge">Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ BOTTOM CTA ══════ */}
            <section className="cta section">
                <div className="container">
                    <div className="cta__box">
                        <div className="cta__content">
                            <h2>Ready to Get Started?</h2>
                            <p>
                                Join thousands of Sri Lankans who trust LankaFIX to connect them
                                with reliable local taskers. Sign up free today.
                            </p>
                            <div className="cta__actions">
                                <Link to="/register" className="btn btn-lg btn-accent">
                                    Post a Request <Icons.ArrowRight />
                                </Link>
                                <Link to="/register" className="btn btn-lg btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'var(--white)' }}>
                                    Join as Tasker
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════ FOOTER BAR ══════ */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="landing-footer__inner">
                        <span>© 2025 LankaFIX. All rights reserved. 🇱🇰 Made in Sri Lanka</span>
                        <div className="landing-footer__links">
                            <a href="#hero">Privacy</a>
                            <a href="#hero">Terms</a>
                            <a href="#hero">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
