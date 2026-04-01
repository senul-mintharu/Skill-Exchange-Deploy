import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

/**
 * Breadcrumb — Derives breadcrumb trail from current URL via useLocation()
 *
 * Examples:
 *   /seeker/requests/5    → Home > My Requests > Details
 *   /worker/profile       → Home > Worker > Profile
 *   /my-requests/3        → Home > My Requests > Details
 *   /browse-requests      → Home > Browse Requests
 */

const segmentLabels = {
    'seeker': 'Seeker',
    'worker': 'Worker',
    'my-requests': 'My Requests',
    'my-quotations': 'My Quotations',
    'my-jobs': 'My Jobs',
    'quotations': 'Quotations',
    'browse-requests': 'Browse Requests',
    'create-request': 'Create Request',
    'profile': 'Profile',
    'requests': 'Requests',
    'edit-profile': 'Edit Profile',
    'create-profile': 'Create Profile',
    'dashboard': 'Dashboard',
};

const Breadcrumb = () => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    if (segments.length === 0) return null;

    const crumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    segments.forEach((segment) => {
        currentPath += `/${segment}`;
        // Numeric segments (IDs) become "Details"
        const label = /^\d+$/.test(segment)
            ? 'Details'
            : segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        crumbs.push({ label, path: currentPath });
    });

    return (
        <nav
            aria-label="Breadcrumb"
            className="mb-3 flex flex-wrap items-center gap-1 text-xs font-medium text-white/70"
        >
            {crumbs.map((crumb, i) => (
                <span key={crumb.path} className="inline-flex items-center gap-1">
                    {i > 0 && <span className="text-white/45">&gt;</span>}
                    {i < crumbs.length - 1 ? (
                        <Link
                            to={crumb.path}
                            className="rounded-md px-1 py-0.5 transition hover:bg-white/10 hover:text-white"
                        >
                            {crumb.label}
                        </Link>
                    ) : (
                        <span className={cn('px-1 py-0.5 font-semibold text-white')}>{crumb.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumb;
