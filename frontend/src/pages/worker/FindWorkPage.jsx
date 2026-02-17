import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { getOpenRequests, searchRequests } from '../../services/requestService';
import { CATEGORIES, URGENCY_LEVELS, getCategoryIcon, formatCategoryLabel, formatBudget } from '../../utils/constants';
import './FindWorkPage.css';

/**
 * FindWorkPage.jsx — Worker Portal
 *
 * Allows workers to browse all open service requests.
 * Supports filtering by category/location and sorting.
 */
const FindWorkPage = () => {
    const [allRequests, setAllRequests] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Filter state
    const [selectedCategory, setSelectedCategory] = useState('');
    const [locationSearch, setLocationSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState(false);

    // Sort state
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        fetchRequests();
    }, []);

    // Apply sorting whenever sortBy or allRequests changes
    useEffect(() => {
        if (allRequests.length === 0) {
            setRequests([]);
            return;
        }

        const sorted = [...allRequests];

        switch (sortBy) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'budget-high':
                sorted.sort((a, b) => (b.budget || 0) - (a.budget || 0));
                break;
            case 'budget-low':
                sorted.sort((a, b) => (a.budget || 0) - (b.budget || 0));
                break;
            case 'urgency':
                sorted.sort((a, b) => getUrgencyWeight(b.urgency) - getUrgencyWeight(a.urgency));
                break;
            default:
                break;
        }

        setRequests(sorted);
    }, [sortBy, allRequests]);

    const getUrgencyWeight = (urgency) => {
        const found = URGENCY_LEVELS.find(u => u.value === urgency);
        return found ? found.weight : 0;
    };

    const fetchRequests = async (filters = {}) => {
        setLoading(true);
        setError('');
        try {
            let data;
            const hasFilters = filters.locationArea || filters.category;

            if (hasFilters) {
                data = await searchRequests(filters);
            } else {
                data = await getOpenRequests();
            }

            const formattedData = data.map(req => ({
                ...req,
                postedDate: req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Recently',
            }));
            setAllRequests(formattedData);
        } catch (err) {
            console.error('Error fetching open requests:', err);
            setError('Failed to load available jobs. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        const filters = {};
        if (selectedCategory) filters.category = selectedCategory;
        if (locationSearch.trim()) filters.locationArea = locationSearch.trim();
        setActiveFilters(!!(selectedCategory || locationSearch.trim()));
        fetchRequests(filters);
    };

    const handleClearFilters = () => {
        setSelectedCategory('');
        setLocationSearch('');
        setActiveFilters(false);
        fetchRequests();
    };

    return (
        <div className="page-wrapper">
            <Navbar variant="portal" />

            <main className="find-work-container">
                <div className="fw-header">
                    <h1 className="fw-title">Find Work</h1>
                    <p className="fw-subtitle">Browse open requests and send quotes to start your next job.</p>
                </div>

                {/* Filter & Sort Bar */}
                <div className="fw-filters">
                    <div className="fw-filter-bar">
                        <div className="fw-filter-group">
                            <span className="material-icons fw-filter-icon">search</span>
                            <input
                                type="text"
                                placeholder="Search by location..."
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                className="fw-location-input"
                            />
                        </div>

                        <div className="fw-filter-group">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="fw-category-select"
                            >
                                <option value="">All Categories</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="fw-filter-group fw-sort-group">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="fw-sort-select"
                            >
                                <option value="newest">Newest First</option>
                                <option value="budget-high">Budget: High to Low</option>
                                <option value="budget-low">Budget: Low to High</option>
                                <option value="urgency">Urgency: Most Urgent</option>
                            </select>
                        </div>

                        <button onClick={handleApplyFilters} className="fw-search-btn">
                            <span className="material-icons">search</span>
                            Search
                        </button>

                        {activeFilters && (
                            <button onClick={handleClearFilters} className="fw-clear-btn">
                                <span className="material-icons">clear</span>
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="fw-loading">
                        <div className="fw-spinner"></div>
                        <p>Finding new opportunities...</p>
                    </div>
                ) : error ? (
                    <div className="fw-error">
                        <span className="material-icons fw-error-icon">error_outline</span>
                        <h3>Oops! Something went wrong.</h3>
                        <p>{error}</p>
                        <button className="btn btn-primary" onClick={() => fetchRequests()}>Try Again</button>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="fw-empty">
                        <span className="material-icons fw-empty-icon">work_off</span>
                        <h3>No jobs available right now</h3>
                        <p>{activeFilters ? 'Try adjusting your filters or clearing them.' : 'Check back later for new opportunities!'}</p>
                        {activeFilters && (
                            <button className="btn btn-primary" onClick={handleClearFilters} style={{ marginTop: '1rem' }}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="fw-results-info">
                            <p className="fw-results-count">
                                <strong>{requests.length}</strong> {requests.length === 1 ? 'job' : 'jobs'} {activeFilters ? 'found' : 'available'}
                            </p>
                        </div>

                        <div className="fw-grid">
                            {requests.map(req => (
                                <div key={req.id} className="fw-card">
                                    <div className="fw-card-header">
                                        <span className="fw-category-badge">
                                            {getCategoryIcon(req.category)} {formatCategoryLabel(req.category)}
                                        </span>
                                        <div className={`fw-urgency-badge ${req.urgency ? req.urgency.toLowerCase() : 'medium'}`}>
                                            {req.urgency || 'MEDIUM'}
                                        </div>
                                    </div>

                                    <div className="fw-card-body">
                                        <h3 className="fw-card-title">{req.title || formatCategoryLabel(req.category)}</h3>
                                        <div className="fw-meta-item">
                                            <span className="material-icons fw-meta-icon">location_on</span>
                                            {req.locationArea}
                                        </div>
                                        <p className="fw-card-desc">{req.description}</p>

                                        <div className="fw-time-posted">
                                            Posted {req.postedDate}
                                        </div>
                                    </div>

                                    <div className="fw-card-footer">
                                        <div className="fw-budget">
                                            <span className="fw-budget-label">Est. Budget</span>
                                            <span className="fw-budget-value">{formatBudget(req.budget)}</span>
                                        </div>
                                        <Link
                                            to={`/requests/${req.id}`}
                                            state={{ from: 'find-work' }}
                                            className="fw-quote-btn"
                                        >
                                            <span className="material-icons">description</span>
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default FindWorkPage;
