import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { browseRequests } from '../../services/requestService';
import { CATEGORIES, getCategoryIcon, formatCategoryLabel, formatBudget } from '../../utils/constants';
import './BrowseRequestsPage.css';

const PAGE_SIZE = 9;

/**
 * BrowseRequestsPage.jsx — Browse Open Service Requests (Worker)
 *
 * Features: server-side pagination, keyword search, category/location filters,
 * server-side sort, skeleton loading, auto-apply category filter.
 */
const BrowseRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // Filters
    const [keyword, setKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const hasActiveFilters = !!(keyword || selectedCategory || locationSearch);

    const fetchRequests = useCallback(async (page = 0) => {
        setLoading(true);
        setError('');
        try {
            const params = {
                page,
                size: PAGE_SIZE,
                sortBy,
            };
            if (keyword.trim()) params.keyword = keyword.trim();
            if (selectedCategory) params.category = selectedCategory;
            if (locationSearch.trim()) params.locationArea = locationSearch.trim();

            const data = await browseRequests(params);

            const formattedContent = data.content.map(req => ({
                ...req,
                postedDate: req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString()
                    : 'Recently',
            }));

            setRequests(formattedContent);
            setCurrentPage(data.page);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (err) {
            console.error('Error fetching open requests:', err);
            setError('Failed to load available jobs. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [keyword, selectedCategory, locationSearch, sortBy]);

    // Initial load
    useEffect(() => {
        fetchRequests(0);
    }, [fetchRequests]);

    // Auto-apply when category or sort changes
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        setCurrentPage(0);
    };

    const handleSortChange = (value) => {
        setSortBy(value);
        setCurrentPage(0);
    };

    const handleKeywordSearch = () => {
        setCurrentPage(0);
        fetchRequests(0);
    };

    const handleLocationSearch = () => {
        setCurrentPage(0);
        fetchRequests(0);
    };

    const handleClearFilters = () => {
        setKeyword('');
        setSelectedCategory('');
        setLocationSearch('');
        setSortBy('newest');
        setCurrentPage(0);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchRequests(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Skeleton cards for loading state
    const SkeletonCard = () => (
        <div className="br-skeleton-card">
            <div className="br-skeleton-header">
                <div className="br-skeleton-badge" />
                <div className="br-skeleton-line w-40 h-12" />
            </div>
            <div className="br-skeleton-body">
                <div className="br-skeleton-line w-80 h-20" />
                <div className="br-skeleton-line w-60" />
                <div className="br-skeleton-line w-100" />
                <div className="br-skeleton-line w-100" />
                <div className="br-skeleton-line w-40 h-12" />
            </div>
            <div className="br-skeleton-footer">
                <div className="br-skeleton-line w-40" />
                <div className="br-skeleton-btn" />
            </div>
        </div>
    );

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisible = 5;
        let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible);
        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }

        for (let i = start; i < end; i++) {
            pages.push(i);
        }

        return (
            <div className="br-pagination">
                <button
                    className="br-page-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                >
                    &laquo; Prev
                </button>
                {start > 0 && (
                    <>
                        <button className="br-page-btn" onClick={() => handlePageChange(0)}>1</button>
                        {start > 1 && <span className="br-page-info">...</span>}
                    </>
                )}
                {pages.map(p => (
                    <button
                        key={p}
                        className={`br-page-btn ${p === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(p)}
                    >
                        {p + 1}
                    </button>
                ))}
                {end < totalPages && (
                    <>
                        {end < totalPages - 1 && <span className="br-page-info">...</span>}
                        <button className="br-page-btn" onClick={() => handlePageChange(totalPages - 1)}>
                            {totalPages}
                        </button>
                    </>
                )}
                <button
                    className="br-page-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages - 1}
                >
                    Next &raquo;
                </button>
            </div>
        );
    };

    return (
        <div className="page-wrapper">

            <main className="browse-requests-container">
                <div className="br-header">
                    <h1 className="br-title">Find Work</h1>
                    <p className="br-subtitle">Browse open requests and send quotes to start your next job.</p>
                </div>

                {/* Filter & Sort Bar */}
                <div className="br-filters">
                    <div className="br-filter-bar">
                        <div className="br-filter-group">
                            <span className="material-icons br-filter-icon">search</span>
                            <input
                                type="text"
                                placeholder="Search by keyword..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleKeywordSearch()}
                                className="br-keyword-input"
                            />
                        </div>

                        <div className="br-filter-group">
                            <span className="material-icons br-filter-icon">location_on</span>
                            <input
                                type="text"
                                placeholder="Filter by location..."
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLocationSearch()}
                                className="br-location-input"
                            />
                        </div>

                        <div className="br-filter-group">
                            <select
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="br-category-select"
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="br-filter-group br-sort-group">
                            <select
                                value={sortBy}
                                onChange={(e) => handleSortChange(e.target.value)}
                                className="br-sort-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="budget-high">Budget: High to Low</option>
                                <option value="budget-low">Budget: Low to High</option>
                                <option value="urgency">Urgency: Most Urgent</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button onClick={handleClearFilters} className="br-clear-btn">
                                <span className="material-icons">clear</span>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="br-grid">
                        {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : error ? (
                    <div className="br-error">
                        <span className="material-icons br-error-icon">error_outline</span>
                        <h3>Oops! Something went wrong.</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => fetchRequests(currentPage)}>Try Again</button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="br-empty">
                        <span className="material-icons br-empty-icon">work_off</span>
                        <h3>No jobs available right now</h3>
                        <p>{hasActiveFilters ? 'Try adjusting your filters or clearing them.' : 'Check back later for new opportunities!'}</p>
                        {hasActiveFilters && (
                            <button className="btn btn-primary" onClick={handleClearFilters} style={{ marginTop: '1rem' }}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="br-results-info">
                            <p className="br-results-count">
                                <strong>{totalElements}</strong> {totalElements === 1 ? 'job' : 'jobs'} {hasActiveFilters ? 'found' : 'available'}
                            </p>
                        </div>

                        <div className="br-grid">
                            {requests.map(req => (
                                <div key={req.id} className="br-card">
                                    <div className="br-card-header">
                                        <span className="br-category-badge">
                                            {getCategoryIcon(req.category)} {formatCategoryLabel(req.category)}
                                        </span>
                                        <div className={`br-urgency-badge ${req.urgency ? req.urgency.toLowerCase() : 'medium'}`}>
                                            {req.urgency || 'MEDIUM'}
                                        </div>
                                    </div>

                                    <div className="br-card-body">
                                        <h3 className="br-card-title">{req.title || formatCategoryLabel(req.category)}</h3>
                                        <div className="br-meta-item">
                                            <span className="material-icons br-meta-icon">location_on</span>
                                            {req.locationArea}
                                        </div>
                                        <p className="br-card-desc">{req.description}</p>

                                        <div className="br-time-posted">
                                            Posted {req.postedDate}
                                        </div>
                                    </div>

                                    <div className="br-card-footer">
                                        <div className="br-budget">
                                            <span className="br-budget-label">Est. Budget</span>
                                            <span className="br-budget-value">{formatBudget(req.budget)}</span>
                                        </div>
                                        <Link
                                            to={`/worker/requests/${req.id}`}
                                            state={{ from: 'browse-requests' }}
                                            className="br-quote-btn"
                                        >
                                            <span className="material-icons">description</span>
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {renderPagination()}
                    </>
                )}
            </main>
        </div>
    );
};

export default BrowseRequestsPage;
