import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
        <nav aria-label="Breadcrumb" style={{
            fontSize: '0.8rem',
            color: '#999',
            marginBottom: '0.5rem',
        }}>
            {crumbs.map((crumb, i) => (
                <span key={crumb.path}>
                    {i > 0 && <span style={{ margin: '0 4px' }}>&gt;</span>}
                    {i < crumbs.length - 1 ? (
                        <Link to={crumb.path} style={{
                            color: '#999',
                            textDecoration: 'none',
                        }}>
                            {crumb.label}
                        </Link>
                    ) : (
                        <span style={{ color: '#666' }}>{crumb.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
};

export default Breadcrumb;
