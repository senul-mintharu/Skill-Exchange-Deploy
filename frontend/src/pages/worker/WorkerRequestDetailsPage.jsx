import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getRequestById } from '../../services/requestService';
import { getCategoryIcon, formatCategoryLabel, formatBudget } from '../../utils/constants';
import './WorkerRequestDetailsPage.css';

const WorkerRequestDetailsPage = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [is404, setIs404] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const data = await getRequestById(requestId);
                setRequest({
                    ...data,
                    postedDate: data.createdAt
                        ? new Date(data.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        })
                        : 'Recently',
                    timeAgo: data.createdAt ? getTimeAgo(new Date(data.createdAt)) : 'Recently',
                });
            } catch (err) {
                console.error('Error fetching request details:', err);
                if (err.response && err.response.status === 404) {
                    setIs404(true);
                    setError('This request was not found. It may have been removed by the seeker.');
                } else {
                    setError('Failed to load request details. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (requestId) {
            fetchRequest();
        }
    }, [requestId]);

    const getTimeAgo = (date) => {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    const getUrgencyClass = (urgency) => {
        if (!urgency) return 'medium';
        return urgency.toLowerCase();
    };

    // Skeleton loading state
    if (loading) {
        return (
            <div className="page-wrapper">
                <main className="wrd-container">
                    <div className="wrd-breadcrumb">
                        <div className="wrd-skeleton-line w-200" />
                    </div>
                    <div className="wrd-grid">
                        <div className="wrd-main-col">
                            {/* Skeleton: Header card */}
                            <div className="wrd-card wrd-skeleton-card">
                                <div className="wrd-skeleton-card-header">
                                    <div className="wrd-skeleton-line w-120 h-28" />
                                    <div className="wrd-skeleton-line w-80 h-24" />
                                </div>
                                <div className="wrd-skeleton-card-body">
                                    <div className="wrd-skeleton-line w-full h-28" />
                                    <div className="wrd-skeleton-line w-200" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-300" />
                                </div>
                            </div>
                            {/* Skeleton: Description card */}
                            <div className="wrd-card wrd-skeleton-card">
                                <div className="wrd-skeleton-card-body">
                                    <div className="wrd-skeleton-line w-160 h-20" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-300" />
                                </div>
                            </div>
                            {/* Skeleton: Details grid */}
                            <div className="wrd-card wrd-skeleton-card">
                                <div className="wrd-skeleton-card-body">
                                    <div className="wrd-skeleton-grid">
                                        <div className="wrd-skeleton-line w-full h-60" />
                                        <div className="wrd-skeleton-line w-full h-60" />
                                        <div className="wrd-skeleton-line w-full h-60" />
                                        <div className="wrd-skeleton-line w-full h-60" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="wrd-sidebar-col">
                            <div className="wrd-card wrd-skeleton-card">
                                <div className="wrd-skeleton-card-body">
                                    <div className="wrd-skeleton-line w-full h-40" />
                                    <div className="wrd-skeleton-line w-full h-44" />
                                </div>
                            </div>
                            <div className="wrd-card wrd-skeleton-card">
                                <div className="wrd-skeleton-card-body">
                                    <div className="wrd-skeleton-line w-160 h-20" />
                                    <div className="wrd-skeleton-line w-full" />
                                    <div className="wrd-skeleton-line w-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // Error / 404 state
    if (error || !request) {
        return (
            <div className="page-wrapper">
                <div className="wrd-error-state">
                    <div className="wrd-error-card">
                        <span className="material-icons wrd-error-icon">
                            {is404 ? 'search_off' : 'error_outline'}
                        </span>
                        <h2>{is404 ? 'Request Not Found' : 'Something Went Wrong'}</h2>
                        <p>{error || 'This request could not be loaded.'}</p>
                        <div className="wrd-error-actions">
                            <Link to="/worker/browse" className="wrd-btn wrd-btn-primary">
                                <span className="material-icons">arrow_back</span>
                                Browse Requests
                            </Link>
                            {!is404 && (
                                <button
                                    className="wrd-btn wrd-btn-outline"
                                    onClick={() => window.location.reload()}
                                >
                                    <span className="material-icons">refresh</span>
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">

            <main className="wrd-container">
                {/* Breadcrumb */}
                <div className="wrd-breadcrumb">
                    <Link to="/worker/browse" className="wrd-back-link">
                        <span className="material-icons">arrow_back</span>
                        Back to Browse Requests
                    </Link>
                </div>

                <div className="wrd-grid">
                    {/* === Main Column === */}
                    <div className="wrd-main-col">
                        {/* Request Header Card */}
                        <div className="wrd-card wrd-header-card">
                            <div className="wrd-header-top">
                                <div className="wrd-header-badges">
                                    <span className="wrd-category-badge">
                                        {getCategoryIcon(request.category)} {formatCategoryLabel(request.category)}
                                    </span>
                                    <span className={`wrd-urgency-badge ${getUrgencyClass(request.urgency)}`}>
                                        {request.urgency || 'MEDIUM'}
                                    </span>
                                    <span className="wrd-status-badge">{request.status}</span>
                                </div>
                                <span className="wrd-time-ago">{request.timeAgo}</span>
                            </div>

                            <div className="wrd-header-body">
                                <h1 className="wrd-title">{request.title || formatCategoryLabel(request.category)}</h1>
                                <div className="wrd-header-meta">
                                    <div className="wrd-meta-chip">
                                        <span className="material-icons">location_on</span>
                                        {request.locationArea}
                                    </div>
                                    <div className="wrd-meta-chip">
                                        <span className="material-icons">calendar_today</span>
                                        Posted {request.postedDate}
                                    </div>
                                    <div className="wrd-meta-chip">
                                        <span className="material-icons">tag</span>
                                        #{request.id}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description Card */}
                        <div className="wrd-card">
                            <div className="wrd-card-section">
                                <h3 className="wrd-section-title">
                                    <span className="material-icons">description</span>
                                    Job Description
                                </h3>
                                <p className="wrd-description">{request.description}</p>
                            </div>
                        </div>

                        {/* Details Grid Card */}
                        <div className="wrd-card">
                            <div className="wrd-card-section">
                                <h3 className="wrd-section-title">
                                    <span className="material-icons">info</span>
                                    Job Details
                                </h3>
                                <div className="wrd-details-grid">
                                    <div className="wrd-detail-item">
                                        <div className="wrd-detail-icon budget">
                                            <span className="material-icons">payments</span>
                                        </div>
                                        <div>
                                            <p className="wrd-detail-label">Estimated Budget</p>
                                            <p className="wrd-detail-value">{formatBudget(request.budget)}</p>
                                        </div>
                                    </div>
                                    <div className="wrd-detail-item">
                                        <div className={`wrd-detail-icon ${getUrgencyClass(request.urgency)}`}>
                                            <span className="material-icons">schedule</span>
                                        </div>
                                        <div>
                                            <p className="wrd-detail-label">Urgency Level</p>
                                            <p className="wrd-detail-value">{request.urgency || 'Medium'}</p>
                                        </div>
                                    </div>
                                    <div className="wrd-detail-item">
                                        <div className="wrd-detail-icon location">
                                            <span className="material-icons">location_on</span>
                                        </div>
                                        <div>
                                            <p className="wrd-detail-label">Service Location</p>
                                            <p className="wrd-detail-value">{request.locationArea}</p>
                                        </div>
                                    </div>
                                    <div className="wrd-detail-item">
                                        <div className="wrd-detail-icon category">
                                            <span className="material-icons">category</span>
                                        </div>
                                        <div>
                                            <p className="wrd-detail-label">Category</p>
                                            <p className="wrd-detail-value">{formatCategoryLabel(request.category)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* === Sidebar === */}
                    <div className="wrd-sidebar-col">
                        {/* Send Quote CTA */}
                        <div className="wrd-card wrd-cta-card">
                            <div className="wrd-cta-budget">
                                <p className="wrd-cta-budget-label">Estimated Budget</p>
                                <p className="wrd-cta-budget-value">{formatBudget(request.budget)}</p>
                            </div>
                            <button
                                className="wrd-send-quote-btn"
                                onClick={() => navigate(`/worker/submit-quote/${request.id}`)}
                            >
                                <span className="material-icons">send</span>
                                Send Quote
                            </button>
                            <p className="wrd-cta-hint">Submit your price and proposal to the seeker</p>
                        </div>

                        {/* Seeker Info Card */}
                        <div className="wrd-card wrd-seeker-card">
                            <h3 className="wrd-sidebar-title">
                                <span className="material-icons">person</span>
                                Posted By
                            </h3>
                            <div className="wrd-seeker-info">
                                <div className="wrd-seeker-avatar">
                                    {request.seekerName ? request.seekerName.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div>
                                    <p className="wrd-seeker-name">{request.seekerName || 'Seeker'}</p>
                                    {request.seekerPhone && (
                                        <p className="wrd-seeker-phone">
                                            <span className="material-icons">phone</span>
                                            {request.seekerPhone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="wrd-card wrd-tips-card">
                            <h3 className="wrd-sidebar-title">
                                <span className="material-icons">lightbulb</span>
                                Tips for a Winning Quote
                            </h3>
                            <ul className="wrd-tips-list">
                                <li>
                                    <span className="material-icons">check_circle</span>
                                    Offer a competitive price within the budget range
                                </li>
                                <li>
                                    <span className="material-icons">check_circle</span>
                                    Describe your relevant experience clearly
                                </li>
                                <li>
                                    <span className="material-icons">check_circle</span>
                                    Provide a realistic timeline estimate
                                </li>
                                <li>
                                    <span className="material-icons">check_circle</span>
                                    Be professional and responsive to follow-ups
                                </li>
                            </ul>
                        </div>

                        {/* Browse Similar Link */}
                        <Link
                            to={`/worker/browse?category=${request.category}`}
                            className="wrd-similar-link"
                        >
                            <span className="material-icons">search</span>
                            Browse similar {formatCategoryLabel(request.category)} jobs
                            <span className="material-icons wrd-similar-arrow">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WorkerRequestDetailsPage;
