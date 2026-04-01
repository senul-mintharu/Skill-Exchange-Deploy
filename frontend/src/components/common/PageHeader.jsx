import React from 'react';

/**
 * PageHeader — Reusable page title component
 * Usage: <PageHeader title="Page Title" />
 */
const PageHeader = ({ title }) => {
    if (!title) return null;

    return (
        <h1 className="mb-3 font-display text-3xl font-extrabold tracking-snugger text-white md:text-4xl">
            {title}
        </h1>
    );
};

export default PageHeader;
