import React from 'react';

/**
 * PageHeader — Reusable page title component
 * Usage: <PageHeader title="Page Title" />
 */
const PageHeader = ({ title }) => {
    if (!title) return null;

    return (
        <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: '0 0 0.75rem 0',
            color: '#1a1a2e',
            lineHeight: 1.3,
        }}>
            {title}
        </h1>
    );
};

export default PageHeader;
